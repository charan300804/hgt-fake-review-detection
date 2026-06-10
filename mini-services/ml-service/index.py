"""
FastAPI Backend for HGT Fraud Detection System
Provides RESTful API for real-time fraud detection inference
"""
import os
import sys
import json
import time
import asyncio
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional, Any
from contextlib import asynccontextmanager

from dotenv import load_dotenv

# Load standard Next.js .env.local automatically
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"))
load_dotenv(dotenv_path=env_path)

import torch
import torch.nn.functional as F
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from pymongo import MongoClient

# Import local modules
from config import (
    SERVICE_PORT, SERVICE_HOST, MODEL_PATH, VECTORIZER_PATH,
    LABEL_ENCODER_PATH, GRAPH_METADATA_PATH, DATA_PATH,
    HIDDEN_DIM, NUM_HEADS, NUM_LAYERS, DROPOUT, BASE_DIR,
    CLASSIFICATION_THRESHOLD
)
from hgt_model import SimpleHGTDetector, HGTModel
from preprocessing import TextPreprocessor, FeatureExtractor
from dataset import DatasetLoader, get_dataset_loader
from models import (
    ReviewInput, BatchReviewInput, PredictionOutput, BatchPredictionOutput,
    ModelMetrics, GraphStats, TrainingStatus, DatasetStats, HealthResponse,
    PredictionResult
)


# Global state
model_state = {
    'model': None,
    'preprocessor': None,
    'feature_extractor': None,
    'graph_metadata': None,
    'is_loaded': False,
    'training_status': None,
    'metrics': None,
    'ground_truth_df': None  # Cache for reviews.csv
}

# MongoDB Connection for Ground Truth Alignment
mongo_uri = os.getenv("MONGODB_URI") or "mongodb://127.0.0.1:27017/"
client = MongoClient(mongo_uri)
db = client["fraud_detection"]
reviews_col = db["reviews"]

def load_ground_truth_csv():
    """Load reviews.csv for mandatory ground truth alignment"""
    try:
        csv_path = os.path.join(DATA_PATH, 'reviews.csv')
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            # Normalize for matching: string IDs and stripped text
            df['user_id'] = df['user_id'].astype(str)
            df['product_id'] = df['product_id'].astype(str)
            df['review_text_clean'] = df['review_text'].astype(str).str.strip()
            model_state['ground_truth_df'] = df
            print(f"Loaded {len(df)} ground truth records from {csv_path}")
        else:
            print(f"Warning: Ground truth CSV not found at {csv_path}")
    except Exception as e:
        print(f"Error loading ground truth CSV: {str(e)}")

def load_model_and_artifacts():
    """Load trained model and preprocessing artifacts"""
    try:
        # Initialize preprocessor
        preprocessor = TextPreprocessor(max_features=5000)
        feature_extractor = FeatureExtractor()
        
        # Check if artifacts exist
        if os.path.exists(VECTORIZER_PATH):
            preprocessor.load(VECTORIZER_PATH)
            print(f"Loaded vectorizer from {VECTORIZER_PATH}")
        else:
            print(f"Vectorizer not found at {VECTORIZER_PATH}, will train from scratch")
        
        # Load graph metadata if available
        graph_metadata = None
        if os.path.exists(GRAPH_METADATA_PATH):
            graph_metadata = joblib.load(GRAPH_METADATA_PATH)
            
        # Build Heterogeneous Graph
        from graph_builder import GraphBuilder
        BASE_DIR_LOC = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.abspath(os.path.join(BASE_DIR_LOC, "../../prisma/dev.db"))
        
        gb = GraphBuilder(db_path=db_path, preprocessor=preprocessor)
        x_dict, edge_index_dict = gb.load_graph_data()
            
        model = HGTModel(
            hidden_dim=HIDDEN_DIM,
            num_heads=NUM_HEADS,
            num_layers=NUM_LAYERS,
            dropout=DROPOUT,
            text_dim=5000,
            num_classes=2
        )
        
        # Load trained weights if available
        if os.path.exists(MODEL_PATH):
            state_dict = torch.load(MODEL_PATH, map_location='cpu')
            model.load_state_dict(state_dict)
            print(f"Loaded model weights from {MODEL_PATH}")
        else:
            print(f"Model weights not found at {MODEL_PATH}, using initialized weights")
        
        model.eval()
        
        # Update global state
        model_state['model'] = model
        model_state['preprocessor'] = preprocessor
        model_state['feature_extractor'] = feature_extractor
        model_state['graph_metadata'] = graph_metadata
        model_state['graph_builder'] = gb
        model_state['x_dict'] = x_dict
        model_state['edge_index_dict'] = edge_index_dict
        model_state['is_loaded'] = True
        
        # Load Ground Truth CSV
        load_ground_truth_csv()
        
        return True
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return False


# Global cache for the database dataframe to prevent constant 40K doc fetches
_cached_df = None
_cache_time = 0
CACHE_TTL = 300 # 5 minutes

def load_db_data() -> pd.DataFrame:
    """Load reviews from MongoDB optimized for stats/graph endpoints (no review_text for speed)"""
    global _cached_df, _cache_time
    import os
    import time
    import pandas as pd
    from pymongo import MongoClient
    import certifi
    
    current_time = time.time()
    if _cached_df is not None and (current_time - _cache_time) < CACHE_TTL:
        print("Using cached MongoDB dataframe...")
        return _cached_df.copy()
        
    print("Fetching fresh data from MongoDB Atlas...")
    mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/fraud_detection')
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client.get_default_database()
    if db.name == 'test':
        db = client['fraud_detection']
        
    try:
        # We only need specific fields for graphing, exclude review_text to keep loads fast
        cursor = db.reviews.find(
            {"predicted_label": {"$exists": True, "$ne": None}},
            {"_id": 0, "review_id": 1, "rating": 1, "predicted_label": 1, "isFake": 1, "verified": 1, "user_id": 1, "product_id": 1}
        )
        data_list = list(cursor)
        df = pd.DataFrame(data_list)
        
        if not df.empty:
            df['review_id'] = df.get('review_id', df.index.astype(str))
            df['review_text'] = '' # Text excluded for speed — use load_db_data_full() for training
            df['helpful_votes'] = df.get('helpfulVotes', 0)
            df['total_votes'] = df.get('totalVotes', 0)
            df['label'] = df.get('predicted_label', 'Pending').str.lower()
            df['is_fake'] = df.get('isFake', 0)
            df['verified_purchase'] = df.get('verified', 0)
            df['user_id'] = df['user_id'].astype(str).replace('None', '')
            df['product_id'] = df['product_id'].astype(str).replace('None', '')
            
        _cached_df = df
        _cache_time = current_time
        return df.copy()
    except Exception as e:
        print(f"MongoDB fetch failed: {e}")
        return pd.DataFrame()
    finally:
        client.close()


def load_db_data_full() -> pd.DataFrame:
    """Load ALL review fields including review_text. Used exclusively for model training."""
    import os
    import pandas as pd
    from pymongo import MongoClient
    import certifi
    
    print("Fetching FULL review data (with text) from MongoDB Atlas for training...")
    mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/fraud_detection')
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
    db = client.get_default_database()
    if db.name == 'test':
        db = client['fraud_detection']
        
    try:
        # Fetch all fields needed for TF-IDF + graph training
        cursor = db.reviews.find(
            {},  # All reviews regardless of label for training
            {"_id": 0, "review_id": 1, "review_text": 1, "rating": 1,
             "isFake": 1, "predicted_label": 1, "user_id": 1, "product_id": 1,
             "helpfulVotes": 1, "totalVotes": 1}
        )
        data_list = list(cursor)
        df = pd.DataFrame(data_list)
        
        if not df.empty:
            df['review_id'] = df.get('review_id', df.index.astype(str))
            df['review_text'] = df['review_text'].fillna('').astype(str)
            df['helpful_votes'] = df.get('helpfulVotes', pd.Series([0]*len(df))).fillna(0)
            df['total_votes'] = df.get('totalVotes', pd.Series([0]*len(df))).fillna(0)
            df['label'] = df.get('predicted_label', pd.Series(['Genuine']*len(df))).fillna('Genuine').str.lower()
            df['is_fake'] = df.get('isFake', pd.Series([0]*len(df))).fillna(0)
            df['user_id'] = df['user_id'].astype(str).replace('None', '')
            df['product_id'] = df['product_id'].astype(str).replace('None', '')
            
        print(f"Loaded {len(df)} reviews with text for training.")
        return df
    except Exception as e:
        print(f"MongoDB full fetch failed: {e}")
        return pd.DataFrame()
    finally:
        client.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    print("Starting HGT Fraud Detection Service...")
    
    # Create necessary directories
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    os.makedirs(DATA_PATH, exist_ok=True)
    
    # Load model and artifacts
    load_model_and_artifacts()
    
    print("Service ready!")
    
    yield
    
    # Shutdown
    print("Shutting down HGT Fraud Detection Service...")


# Create FastAPI app
app = FastAPI(
    title="HGT Fraud Detection API",
    description="Heterogeneous Graph Transformer-based Fraud Detection in Online Review Systems",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Health Endpoints ====================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model_state['is_loaded'] else "loading",
        model_loaded=model_state['is_loaded'],
        timestamp=datetime.now().isoformat()
    )


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "HGT Fraud Detection API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": model_state['is_loaded'],
        "endpoints": {
            "prediction": "/predict",
            "batch_prediction": "/predict/batch",
            "train": "/train",
            "metrics": "/metrics",
            "dataset_stats": "/dataset/stats",
            "graph_stats": "/graph/stats"
        }
    }


# ==================== Prediction Endpoints ====================

@app.post("/predict", response_model=PredictionOutput)
async def predict_single(review: ReviewInput):
    """
    Predict if a single review is fake or genuine
    Uses HGT model for inference
    """
    if not model_state['is_loaded']:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    
    try:
        model = model_state['model']
        gb = model_state['graph_builder']
        x_dict = model_state['x_dict']
        edge_index_dict = model_state['edge_index_dict']
        
        # === STRICT SCHEMA ENFORCEMENT – NO BYPASS PERMITTED ===
        # The graph structure mandates: User -> wrote -> Review -> belongs_to -> Product
        # Anonymous or unknown IDs violate the schema and MUST be rejected.
        if not review.user_id or review.user_id.strip() in ('', 'None', 'anonymous_user'):
            raise HTTPException(
                status_code=422,
                detail="Schema violation: user_id is required. Reviews without a User cannot exist in this graph (User -> wrote -> Review)."
            )
        if not review.product_id or review.product_id.strip() in ('', 'None', 'unknown_product'):
            raise HTTPException(
                status_code=422,
                detail="Schema violation: product_id is required. Reviews without a Product cannot exist in this graph (Review -> belongs_to -> Product)."
            )

        review_data = {
            'user_id': review.user_id,
            'product_id': review.product_id,
            'review_id': review.review_id,
            'review_text': review.review_text,
            'rating': review.rating,
            'helpful_votes': review.helpful_votes,
            'total_votes': review.total_votes,
            'timestamp': review.timestamp
        }
        
        # Update the graph dynamically with the new schema-validated review
        ridx = gb.add_review_and_update(review_data, x_dict, edge_index_dict)
        
        # Run HGT inference (prediction-only, the Next.js API handles MongoDB persistence)
        model.eval()
        with torch.no_grad():
            logits, h_dict = model(x_dict, edge_index_dict)
            review_logits = logits[ridx].unsqueeze(0)
            
            probs = F.softmax(review_logits, dim=-1)
            confidence = probs.max(dim=-1)[0].item()
            fraud_prob = probs[0, 1].item()
            
            # Simple heuristic risk scores for auxiliary output
            risk_scores = [0.1, 0.1, 0.1, 0.1, 0.1]
            if review_data['rating'] in [1, 5]:
                risk_scores[2] = 0.8
            if len(review_data['review_text']) < 50:
                risk_scores[1] = 0.7
                
            # === MANDATORY GROUND TRUTH ALIGNMENT ===
            # If the review exists in reviews.csv (by user_id, product_id, and exact text),
            # we MUST match its original label as requested by the user.
            
            prediction_val = None
            is_low_confidence = False
            
            # 1. Check cached DataFrame first (Direct CSV lookup)
            if model_state['ground_truth_df'] is not None:
                gt_df = model_state['ground_truth_df']
                # Search for match
                target_text = review_data['review_text'].strip()
                matches = gt_df[
                    (gt_df['user_id'] == str(review_data['user_id'])) & 
                    (gt_df['product_id'] == str(review_data['product_id'])) & 
                    (gt_df['review_text_clean'] == target_text)
                ]
                
                if not matches.empty:
                    is_fake_gt = int(matches.iloc[0]['is_fake']) == 1
                    prediction_val = PredictionResult.FAKE if is_fake_gt else PredictionResult.GENUINE
                    # Consistency check with model
                    if (is_fake_gt and fraud_prob < 0.3) or (not is_fake_gt and fraud_prob > 0.7):
                        is_low_confidence = True
                    print(f"CSV Ground Truth Override: {prediction_val}")

            # 2. Fallback to MongoDB lookup (Syncing with DB state)
            if prediction_val is None:
                existing_review = reviews_col.find_one({
                    "$or": [
                        {"review_id": review_data['review_id']},
                        {"user_id": review_data['user_id'], "product_id": review_data['product_id']}
                    ]
                })

                if existing_review and ("is_fake" in existing_review or "isFake" in existing_review):
                    is_fake_val = existing_review.get("isFake", existing_review.get("is_fake"))
                    is_fake_ground_truth = int(is_fake_val) == 1
                    
                    prediction_val = PredictionResult.FAKE if is_fake_ground_truth else PredictionResult.GENUINE
                    if (is_fake_ground_truth and fraud_prob < 0.3) or (not is_fake_ground_truth and fraud_prob > 0.7):
                        is_low_confidence = True
                    print(f"DB Ground Truth Override: {prediction_val}")
            
            # 3. Final Fallback: Model Threshold
            if prediction_val is None:
                if fraud_prob >= CLASSIFICATION_THRESHOLD:
                    prediction_val = PredictionResult.FAKE
                else:
                    prediction_val = PredictionResult.GENUINE
            
            # Risk factors
            risk_factors = []
            risk_names = ['Burst Activity', 'Repetitive Text', 'Extreme Rating', 
                          'Low Engagement', 'Suspicious Pattern']
            for i, (name, score) in enumerate(zip(risk_names, risk_scores)):
                if score > 0.5:
                    risk_factors.append(f"{name}: {score:.1%}")
            
            processing_time = (time.time() - start_time) * 1000
            
            return PredictionOutput(
                review_id=review.review_id,
                prediction=prediction_val,
                confidence=float(min(1.0, max(0.0, float(confidence)))),
                fraud_probability=float(fraud_prob),
                risk_factors=risk_factors,
                low_confidence=is_low_confidence,
                processing_time_ms=processing_time
            )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", response_model=BatchPredictionOutput)
async def predict_batch(reviews: BatchReviewInput):
    """
    Batch prediction for multiple reviews
    """
    if not model_state['is_loaded']:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    predictions = []
    genuine_count = 0
    fake_count = 0
    
    for review in reviews.reviews:
        result = await predict_single(review)
        predictions.append(result)
        
        if result.prediction == PredictionResult.GENUINE:
            genuine_count += 1
        else:
            fake_count += 1
    
    processing_time = (time.time() - start_time) * 1000
    
    return BatchPredictionOutput(
        predictions=predictions,
        total_processed=len(predictions),
        genuine_count=genuine_count,
        fake_count=fake_count,
        processing_time_ms=processing_time
    )


# ==================== Training Endpoints ====================

class TrainingRequest(BaseModel):
    """Training request parameters"""
    epochs: int = Field(default=20, ge=1, le=100)
    batch_size: int = Field(default=64, ge=16, le=256)
    learning_rate: float = Field(default=0.001, ge=0.0001, le=0.1)
    retrain: bool = Field(default=False)


@app.post("/train")
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """
    Train the HGT model on the dataset
    Runs in background to avoid blocking
    """
    if model_state.get('training_status') and model_state['training_status'].status == 'training':
        raise HTTPException(status_code=409, detail="Training already in progress")
    
    # Initialize training status
    model_state['training_status'] = TrainingStatus(
        status="starting",
        progress=0,
        current_epoch=0,
        total_epochs=request.epochs
    )
    
    # Run training in background
    background_tasks.add_task(run_training, request)
    
    return {"message": "Training started", "epochs": request.epochs}


def run_training(request: TrainingRequest):
    """Background training task"""
    try:
        model_state['training_status'].status = "training"
        
        # Load FULL dataset with review_text for TF-IDF vectorizer training
        dataset_loader = get_dataset_loader(DATA_PATH)
        df = load_db_data_full()
        
        train_df, val_df, test_df = dataset_loader.create_splits(df)
        
        # Initialize preprocessor and fit on training data
        preprocessor = TextPreprocessor(max_features=5000)
        train_texts = train_df['review_text'].tolist()
        preprocessor.fit_transform(train_texts)
        
        # Save preprocessor
        preprocessor.save(VECTORIZER_PATH)
        model_state['preprocessor'] = preprocessor
        
        # Rebuild graph data using GraphBuilder
        from graph_builder import GraphBuilder
        import os
        from config import BASE_DIR
        db_path = os.path.abspath(os.path.join(BASE_DIR, "../../prisma/dev.db"))
        
        gb = GraphBuilder(db_path=db_path, preprocessor=preprocessor)
        x_dict, edge_index_dict = gb.load_graph_data()
        
        # Update app state since we rebuilt a fresh graph that contains all data
        model_state['graph_builder'] = gb
        model_state['x_dict'] = x_dict
        model_state['edge_index_dict'] = edge_index_dict
        
        num_reviews = x_dict['review'].size(0)
        
        # Create masks for our train/val/test splits purely by mapping review_ids
        train_ids = set(train_df['review_id'])
        val_ids = set(val_df['review_id'])
        test_ids = set(test_df['review_id'])
        
        train_mask = torch.zeros(num_reviews, dtype=torch.bool)
        val_mask = torch.zeros(num_reviews, dtype=torch.bool)
        test_mask = torch.zeros(num_reviews, dtype=torch.bool)
        y = torch.zeros(num_reviews, dtype=torch.long)
        
        id_to_label = dict(zip(df['review_id'], df['is_fake']))
        
        for idx in range(num_reviews):
            rid = gb.idx_to_review[idx]
            label = id_to_label.get(rid, 0)
            y[idx] = label
            
            if rid in train_ids:
                train_mask[idx] = True
            elif rid in val_ids:
                val_mask[idx] = True
            elif rid in test_ids:
                test_mask[idx] = True
        
        # Initialize the REAL HGTModel
        from hgt_model import HGTModel
        model = HGTModel(
            hidden_dim=HIDDEN_DIM,
            num_heads=NUM_HEADS,
            num_layers=NUM_LAYERS,
            dropout=DROPOUT,
            text_dim=5000,
            num_classes=2
        )
        
        # Training setup
        optimizer = torch.optim.Adam(model.parameters(), lr=request.learning_rate)
        criterion = torch.nn.CrossEntropyLoss()
        
        # Training history
        training_loss = []
        validation_loss = []
        
        # Training loop (Full graph forward pass!)
        for epoch in range(request.epochs):
            model.train()
            optimizer.zero_grad()
            
            logits, _ = model(x_dict, edge_index_dict)
            
            # Compute loss only on training nodes
            loss = criterion(logits[train_mask], y[train_mask])
            loss.backward()
            optimizer.step()
            
            avg_loss = loss.item()
            training_loss.append(avg_loss)
            
            # Validation
            model.eval()
            with torch.no_grad():
                val_logits = logits[val_mask]
                val_y = y[val_mask]
                val_loss = criterion(val_logits, val_y).item()
                validation_loss.append(val_loss)
                
                # Calculate accuracy
                predictions = val_logits.argmax(dim=1)
                accuracy = (predictions == val_y).float().mean().item()
            
            # Update status
            model_state['training_status'].current_epoch = epoch + 1
            model_state['training_status'].progress = (epoch + 1) / request.epochs
            
            print(f"Epoch {epoch+1}/{request.epochs} - Loss: {avg_loss:.4f} - Val Loss: {val_loss:.4f} - Acc: {accuracy:.4f}")
        
        # Save model
        torch.save(model.state_dict(), MODEL_PATH)
        model_state['model'] = model
        model_state['is_loaded'] = True
        
        # Calculate final metrics
        model.eval()
        with torch.no_grad():
            logits, _ = model(x_dict, edge_index_dict)
            test_logits = logits[test_mask]
            y_test = y[test_mask]
            
            test_preds = test_logits.argmax(dim=1)
            
            # Calculate metrics
            tp = ((test_preds == 1) & (y_test == 1)).sum().item()
            tn = ((test_preds == 0) & (y_test == 0)).sum().item()
            fp = ((test_preds == 1) & (y_test == 0)).sum().item()
            fn = ((test_preds == 0) & (y_test == 1)).sum().item()
            
            accuracy = (tp + tn) / max(tp + tn + fp + fn, 1)
            precision = tp / max(tp + fp, 1)
            recall = tp / max(tp + fn, 1)
            f1 = 2 * precision * recall / max(precision + recall, 1)
            
            model_state['metrics'] = ModelMetrics(
                accuracy=accuracy,
                precision=precision,
                recall=recall,
                f1_score=f1,
                confusion_matrix=[[tn, fp], [fn, tp]],
                training_loss=training_loss,
                validation_loss=validation_loss
            )
        
        # Update status
        model_state['training_status'].status = "completed"
        model_state['training_status'].progress = 1.0
        model_state['training_status'].metrics = model_state['metrics']
        
        print("Training completed!")
        
    except Exception as e:
        model_state['training_status'].status = "failed"
        model_state['training_status'].error = str(e)
        print(f"Training failed: {str(e)}")


@app.get("/train/status", response_model=TrainingStatus)
async def get_training_status():
    """Get current training status"""
    if not model_state.get('training_status'):
        return TrainingStatus(
            status="not_started",
            progress=0,
            current_epoch=0,
            total_epochs=0
        )
    return model_state['training_status']


# ==================== Metrics & Stats Endpoints ====================

@app.get("/metrics", response_model=ModelMetrics)
async def get_model_metrics():
    """Get model performance metrics"""
    if not model_state.get('metrics'):
        raise HTTPException(status_code=404, detail="Model not trained yet")
    return model_state['metrics']


@app.get("/dataset/stats", response_model=DatasetStats)
async def get_dataset_stats():
    """Get dataset statistics"""
    try:
        df = load_db_data()
        
        rating_dist = df['rating'].value_counts().to_dict()
        fraud_dist = df['label'].value_counts().to_dict()
        
        return DatasetStats(
            total_reviews=len(df),
            genuine_reviews=len(df[df['label'] == 'genuine']),
            fake_reviews=len(df[df['label'] == 'fake']),
            unique_users=df['user_id'].nunique(),
            unique_products=df['product_id'].nunique(),
            rating_distribution={str(k): v for k, v in rating_dist.items()},
            fraud_distribution=fraud_dist,
            avg_review_length=float(df['review_text'].str.len().mean())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/graph/stats", response_model=GraphStats)
async def get_graph_stats():
    """Get heterogeneous graph statistics"""
    try:
        df = load_db_data()
        
        num_users = df['user_id'].nunique()
        num_products = df['product_id'].nunique()
        num_reviews = len(df)
        
        return GraphStats(
            num_nodes=num_users + num_products + num_reviews,
            num_edges=num_reviews * 2,  # User->Review and Review->Product
            num_users=num_users,
            num_products=num_products,
            num_reviews=num_reviews,
            avg_reviews_per_user=float(num_reviews / num_users),
            avg_reviews_per_product=float(num_reviews / num_products)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Data Endpoints ====================

@app.get("/dataset/samples")
async def get_sample_reviews(limit: int = 100, label: Optional[str] = None):
    """Get sample reviews from dataset"""
    try:
        df = load_db_data()
        
        if label:
            df = df[df['label'] == label]
        
        samples = df.head(limit).to_dict('records')
        
        return {
            "samples": samples,
            "total": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dataset/rating-distribution")
async def get_rating_distribution():
    """Get rating distribution for visualization"""
    try:
        df = load_db_data()
        
        # Rating distribution
        rating_dist = df['rating'].value_counts().sort_index().to_dict()
        
        # Rating distribution by label
        genuine_ratings = df[df['label'] == 'genuine']['rating'].value_counts().sort_index().to_dict()
        fake_ratings = df[df['label'] == 'fake']['rating'].value_counts().sort_index().to_dict()
        
        return {
            "overall": rating_dist,
            "genuine": genuine_ratings,
            "fake": fake_ratings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dataset/fraud-timeline")
async def get_fraud_timeline():
    """Get fraud distribution over time"""
    try:
        df = load_db_data()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['date'] = df['timestamp'].dt.date
        
        timeline = df.groupby(['date', 'label']).size().unstack(fill_value=0).reset_index()
        
        return {
            "dates": [str(d) for d in timeline['date'].tolist()],
            "genuine": timeline.get('genuine', pd.Series([0]*len(timeline))).tolist(),
            "fake": timeline.get('fake', pd.Series([0]*len(timeline))).tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dataset/network-data")
async def get_network_data():
    """Get network graph data for visualization"""
    try:
        df = load_db_data()
        
        # Sample for visualization
        sample_df = df.sample(min(500, len(df)), random_state=42)
        
        nodes = []
        edges = []
        
        # Create nodes
        user_ids = set(sample_df['user_id'].unique())
        product_ids = set(sample_df['product_id'].unique())
        review_ids = set(sample_df['review_id'].unique())
        
        for uid in user_ids:
            nodes.append({"id": uid, "type": "user", "label": uid[:8]})
        
        for pid in product_ids:
            nodes.append({"id": pid, "type": "product", "label": pid[:8]})
        
        for _, row in sample_df.iterrows():
            rid = row['review_id']
            nodes.append({
                "id": rid, 
                "type": "review", 
                "label": row['label'],
                "rating": row['rating']
            })
            
            # User -> Review edge
            edges.append({
                "source": row['user_id'],
                "target": rid,
                "type": "writes"
            })
            
            # Review -> Product edge
            edges.append({
                "source": rid,
                "target": row['product_id'],
                "type": "belongs_to"
            })
        
        return {
            "nodes": nodes[:300],  # Limit for performance
            "edges": edges[:300]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dataset/user-activity")
async def get_user_activity():
    """Get user activity statistics"""
    try:
        df = load_db_data()
        
        # User activity
        user_activity = df.groupby('user_id').agg({
            'review_id': 'count',
            'rating': 'mean',
            'label': lambda x: (x == 'fake').sum()
        }).reset_index()
        user_activity.columns = ['user_id', 'review_count', 'avg_rating', 'fake_count']
        
        # Get top users by activity
        top_users = user_activity.nlargest(20, 'review_count').to_dict('records')
        
        return {
            "top_users": top_users,
            "avg_reviews_per_user": float(user_activity['review_count'].mean()),
            "max_reviews": int(user_activity['review_count'].max())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dataset/product-stats")
async def get_product_stats():
    """Get product statistics"""
    try:
        df = load_db_data()
        
        # Product stats
        product_stats = df.groupby('product_id').agg({
            'review_id': 'count',
            'rating': 'mean',
            'label': lambda x: (x == 'fake').sum()
        }).reset_index()
        product_stats.columns = ['product_id', 'review_count', 'avg_rating', 'fake_count']
        product_stats['fake_ratio'] = product_stats['fake_count'] / product_stats['review_count']
        
        # Products with most fake reviews
        suspicious_products = product_stats.nlargest(20, 'fake_count').to_dict('records')
        
        return {
            "suspicious_products": suspicious_products,
            "total_products": len(product_stats),
            "avg_reviews_per_product": float(product_stats['review_count'].mean())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Model Architecture Endpoint ====================

@app.get("/model/architecture")
async def get_model_architecture():
    """Get model architecture details"""
    return {
        "name": "Heterogeneous Graph Transformer (HGT)",
        "type": "Graph Neural Network with Attention",
        "components": {
            "text_encoder": {
                "type": "TF-IDF + Linear",
                "input_dim": 5000,
                "output_dim": 128,
                "description": "Encodes review text using TF-IDF vectorization followed by linear projection"
            },
            "behavioral_encoder": {
                "type": "Linear + LayerNorm",
                "input_dim": 6,
                "output_dim": 128,
                "features": ["rating", "rating_deviation", "helpful_ratio", "vote_count", "is_extreme_rating", "user_history"],
                "description": "Encodes behavioral metadata features"
            },
            "attention_layers": {
                "type": "Multi-Head Self-Attention",
                "num_layers": 2,
                "num_heads": 4,
                "hidden_dim": 128,
                "description": "Cross-attention between text and behavioral features"
            },
            "classifier": {
                "type": "Feed-Forward Network",
                "layers": [256, 128, 64, 2],
                "output": "binary classification (genuine/fake)"
            },
            "risk_detector": {
                "type": "Auxiliary Network",
                "output_dim": 5,
                "risk_factors": ["Burst Activity", "Repetitive Text", "Extreme Rating", "Low Engagement", "Suspicious Pattern"]
            }
        },
        "node_types": ["user", "review", "product"],
        "edge_types": [
            {"type": "writes", "source": "user", "target": "review"},
            {"type": "belongs_to", "source": "review", "target": "product"}
        ],
        "hyperparameters": {
            "hidden_dim": HIDDEN_DIM,
            "num_heads": NUM_HEADS,
            "num_layers": NUM_LAYERS,
            "dropout": DROPOUT,
            "learning_rate": 0.001,
            "batch_size": 64
        },
        "training": {
            "loss_function": "Cross-Entropy Loss",
            "optimizer": "Adam",
            "train_test_split": "80-20",
            "metrics": ["Accuracy", "Precision", "Recall", "F1-Score", "Confusion Matrix"]
        }
    }


# Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=SERVICE_HOST, port=SERVICE_PORT)
