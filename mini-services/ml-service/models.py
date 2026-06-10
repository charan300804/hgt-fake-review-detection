"""
Data Models for Fraud Detection API
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class PredictionResult(str, Enum):
    GENUINE = "genuine"
    FAKE = "fake"


class ReviewInput(BaseModel):
    """Input model for a single review"""
    review_id: str = Field(..., description="Unique identifier for the review")
    review_text: str = Field(..., description="Text content of the review")
    
    # Optional metadata (ignored by text-only model)
    user_id: Optional[str] = Field("anonymous", description="User ID who wrote the review")
    product_id: Optional[str] = Field("unknown", description="Product ID being reviewed")
    rating: Optional[float] = Field(3.0, ge=1, le=5, description="Rating from 1 to 5")
    timestamp: Optional[str] = Field(None, description="Review timestamp")
    helpful_votes: Optional[int] = Field(0, description="Number of helpful votes")
    total_votes: Optional[int] = Field(0, description="Total votes")
    verified_purchase: Optional[bool] = Field(False, description="Whether the purchase was verified")


class BatchReviewInput(BaseModel):
    """Input model for batch review processing"""
    reviews: List[ReviewInput]


class PredictionOutput(BaseModel):
    """Output model for prediction results"""
    review_id: str
    prediction: PredictionResult
    confidence: float = Field(..., ge=0, le=1)
    fraud_probability: float = Field(..., ge=0, le=1)
    risk_factors: List[str] = Field(default_factory=list)
    low_confidence: bool = False
    processing_time_ms: float


class BatchPredictionOutput(BaseModel):
    """Output model for batch predictions"""
    predictions: List[PredictionOutput]
    total_processed: int
    genuine_count: int
    fake_count: int
    processing_time_ms: float


class ModelMetrics(BaseModel):
    """Model performance metrics"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    training_loss: List[float]
    validation_loss: List[float]


class GraphStats(BaseModel):
    """Graph statistics"""
    num_nodes: int
    num_edges: int
    num_users: int
    num_products: int
    num_reviews: int
    avg_reviews_per_user: float
    avg_reviews_per_product: float


class TrainingStatus(BaseModel):
    """Training status model"""
    status: str
    progress: float
    current_epoch: int
    total_epochs: int
    metrics: Optional[ModelMetrics] = None
    error: Optional[str] = None


class DatasetStats(BaseModel):
    """Dataset statistics"""
    total_reviews: int
    genuine_reviews: int
    fake_reviews: int
    unique_users: int
    unique_products: int
    rating_distribution: Dict[str, int]
    fraud_distribution: Dict[str, int]
    avg_review_length: float
    date_range: Optional[Dict[str, str]] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    timestamp: str
    version: str = "1.0.0"
