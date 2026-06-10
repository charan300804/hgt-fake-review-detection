"""
Text Preprocessing Module for Fraud Detection
Implements comprehensive NLP preprocessing pipeline
"""
import re
import string
import numpy as np
from typing import List, Dict, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os

# NLTK imports with fallback
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    from nltk.stem import WordNetLemmatizer
    
    # Download required NLTK data
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    NLTK_AVAILABLE = True
except Exception:
    NLTK_AVAILABLE = False


class TextPreprocessor:
    """
    Comprehensive text preprocessing for review analysis
    Includes: cleaning, tokenization, stopword removal, lemmatization
    """
    
    def __init__(self, max_features: int = 5000):
        self.max_features = max_features
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.is_fitted = False
        
        # Initialize lemmatizer if NLTK is available
        if NLTK_AVAILABLE:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
        else:
            self.lemmatizer = None
            self.stop_words = set()
        
        # Custom stopwords for review analysis
        self.custom_stopwords = {
            'product', 'item', 'buy', 'bought', 'purchase', 'purchased',
            'review', 'reviewer', 'star', 'stars', 'rating'
        }
        self.stop_words.update(self.custom_stopwords)
    
    def clean_text(self, text: str) -> str:
        """
        Clean text using regex patterns
        - Remove HTML tags
        - Remove special characters
        - Normalize whitespace
        - Handle contractions
        """
        if not text or not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Expand contractions
        contractions = {
            "n't": " not",
            "'re": " are",
            "'s": " is",
            "'d": " would",
            "'ll": " will",
            "'ve": " have",
            "'m": " am"
        }
        for pattern, replacement in contractions.items():
            text = text.replace(pattern, replacement)
        
        # Remove special characters but keep alphanumeric and spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        
        # Remove digits
        text = re.sub(r'\d+', '', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def tokenize(self, text: str) -> List[str]:
        """Tokenize text into words"""
        if NLTK_AVAILABLE:
            try:
                return word_tokenize(text)
            except Exception:
                return text.split()
        return text.split()
    
    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """Remove stopwords from token list"""
        return [token for token in tokens if token.lower() not in self.stop_words and len(token) > 2]
    
    def lemmatize(self, tokens: List[str]) -> List[str]:
        """Lemmatize tokens to their base form"""
        if self.lemmatizer:
            return [self.lemmatizer.lemmatize(token) for token in tokens]
        return tokens
    
    def preprocess_single(self, text: str) -> str:
        """Full preprocessing pipeline for a single text"""
        # Clean text
        text = self.clean_text(text)
        
        # Tokenize
        tokens = self.tokenize(text)
        
        # Remove stopwords
        tokens = self.remove_stopwords(tokens)
        
        # Lemmatize
        tokens = self.lemmatize(tokens)
        
        return ' '.join(tokens)
    
    def preprocess_batch(self, texts: List[str]) -> List[str]:
        """Preprocess a batch of texts"""
        return [self.preprocess_single(text) for text in texts]
    
    def fit(self, texts: List[str]) -> 'TextPreprocessor':
        """Fit TF-IDF vectorizer on preprocessed texts"""
        preprocessed = self.preprocess_batch(texts)
        
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=self.max_features,
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.95,
            sublinear_tf=True
        )
        
        self.tfidf_vectorizer.fit(preprocessed)
        self.is_fitted = True
        return self
    
    def transform(self, texts: List[str]) -> np.ndarray:
        """Transform texts to TF-IDF vectors"""
        if not self.is_fitted or self.tfidf_vectorizer is None:
            raise ValueError("Preprocessor not fitted. Call fit() first.")
        
        preprocessed = self.preprocess_batch(texts)
        return self.tfidf_vectorizer.transform(preprocessed).toarray()
    
    def fit_transform(self, texts: List[str]) -> np.ndarray:
        """Fit and transform in one step"""
        self.fit(texts)
        return self.transform(texts)
    
    def save(self, path: str) -> None:
        """Save preprocessor to disk"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            'vectorizer': self.tfidf_vectorizer,
            'max_features': self.max_features,
            'is_fitted': self.is_fitted
        }, path)
    
    def load(self, path: str) -> 'TextPreprocessor':
        """Load preprocessor from disk"""
        data = joblib.load(path)
        self.tfidf_vectorizer = data['vectorizer']
        self.max_features = data['max_features']
        self.is_fitted = data['is_fitted']
        return self


class FeatureExtractor:
    """
    Extract behavioral and metadata features for fraud detection
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.is_fitted = False
    
    def extract_text_features(self, text: str) -> Dict[str, float]:
        """Extract statistical features from text"""
        if not text:
            return {
                'length': 0,
                'word_count': 0,
                'avg_word_length': 0,
                'exclamation_count': 0,
                'question_count': 0,
                'caps_ratio': 0,
                'digit_ratio': 0,
                'punctuation_ratio': 0,
                'unique_word_ratio': 0
            }
        
        words = text.split()
        word_count = len(words)
        
        return {
            'length': len(text),
            'word_count': word_count,
            'avg_word_length': np.mean([len(w) for w in words]) if words else 0,
            'exclamation_count': text.count('!'),
            'question_count': text.count('?'),
            'caps_ratio': sum(1 for c in text if c.isupper()) / len(text) if text else 0,
            'digit_ratio': sum(1 for c in text if c.isdigit()) / len(text) if text else 0,
            'punctuation_ratio': sum(1 for c in text if c in string.punctuation) / len(text) if text else 0,
            'unique_word_ratio': len(set(words)) / word_count if word_count > 0 else 0
        }
    
    def extract_behavioral_features(self, review_data: Dict) -> Dict[str, float]:
        """Extract behavioral features from review metadata"""
        rating = review_data.get('rating', 3)
        helpful_votes = review_data.get('helpful_votes', 0)
        total_votes = review_data.get('total_votes', 1)
        verified_purchase = review_data.get('verified_purchase', 0)
        
        return {
            'rating': rating,
            'rating_deviation': abs(rating - 3),  # Deviation from neutral
            'helpful_ratio': helpful_votes / total_votes if total_votes > 0 else 0,
            'vote_count': total_votes,
            'is_extreme_rating': 1 if rating in [1, 5] else 0,
            'is_verified_purchase': int(verified_purchase)
        }
    
    def extract_user_features(self, user_data: Dict) -> Dict[str, float]:
        """Extract user-level features"""
        total_reviews = user_data.get('total_reviews', 1)
        avg_rating = user_data.get('avg_rating', 3)
        review_frequency = user_data.get('review_frequency', 0)
        
        return {
            'user_total_reviews': total_reviews,
            'user_avg_rating': avg_rating,
            'user_rating_std': user_data.get('rating_std', 0),
            'user_review_frequency': review_frequency,
            'user_fraud_history': user_data.get('fraud_history', 0)
        }
    
    def combine_features(self, *feature_dicts) -> np.ndarray:
        """Combine multiple feature dictionaries into a single vector"""
        combined = {}
        for fd in feature_dicts:
            combined.update(fd)
        return np.array(list(combined.values()))
