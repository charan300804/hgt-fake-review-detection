"""
Configuration for ML Service
"""
import os

# Service Configuration
SERVICE_PORT = 5001
SERVICE_HOST = "0.0.0.0"

# Get current directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Model Configuration
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "hgt_model.pt")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
LABEL_ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoders.pkl")
GRAPH_METADATA_PATH = os.path.join(MODEL_DIR, "graph_metadata.pkl")

# Data Configuration
DATA_PATH = os.path.join(BASE_DIR, "data")
DATASET_URL = "https://raw.githubusercontent.com/Skullpg/fake-reviews-detection/main/processed_reviews.csv"

# Model Hyperparameters
HIDDEN_DIM = 128
NUM_HEADS = 4
NUM_LAYERS = 2
DROPOUT = 0.3
LEARNING_RATE = 0.001
BATCH_SIZE = 64
EPOCHS = 50

# Graph Configuration
MAX_USERS = 10000
MAX_PRODUCTS = 5000
MAX_REVIEWS = 50000

# Classification Threshold for Fraud Detection
# 0.5 is the standard threshold for binary classification
CLASSIFICATION_THRESHOLD = 0.5

# MongoDB Configuration (for future integration)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = "fraud_detection"
