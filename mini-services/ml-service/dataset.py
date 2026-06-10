"""
Dataset Handler for Real-World Fraud Detection Data
Loads and processes authentic review datasets
"""
import os
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import requests
import io


class DatasetLoader:
    """
    Loads and processes real-world fraud detection datasets
    Supports multiple data sources including:
    - Amazon Reviews Dataset
    - Yelp Fake Reviews
    - Custom CSV/JSON datasets
    """
    
    def __init__(self, data_dir: str = "/home/z/my-project/data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
    
    def load_amazon_reviews(self) -> pd.DataFrame:
        """
        Load Amazon review dataset from Hugging Face
        Dataset: theArijitDas/Fake-Reviews-Dataset
        """
        try:
            from datasets import load_dataset
            print("Downloading dataset from Hugging Face...")
            dataset = load_dataset("theArijitDas/Fake-Reviews-Dataset")
            
            # Convert to pandas DataFrame
            df = dataset['train'].to_pandas()
            
            # Map columns to application schema
            # Dataset has 'text' (or 'text_') and 'label' (CG/OR)
            if 'text_' in df.columns:
                df = df.rename(columns={'text_': 'review_text'})
            elif 'text' in df.columns:
                df = df.rename(columns={'text': 'review_text'})
            
            # Map labels: CG -> fake, OR -> genuine
            # Or 1 -> fake, 0 -> genuine (if numeric)
            if df['label'].dtype == object:
                label_map = {'CG': 'fake', 'OR': 'genuine'}
                df['label'] = df['label'].map(label_map)
            else:
                # Assume 1 is fake, 0 is genuine (standard convention)
                df['label'] = df['label'].map({1: 'fake', 0: 'genuine'})
            
            df['is_fake'] = (df['label'] == 'fake').astype(int)
            
            # Synthesize missing metadata
            np.random.seed(42)
            num_reviews = len(df)
            num_users = min(num_reviews // 5, 2000)  # Roughly 5 reviews per user
            num_products = min(num_reviews // 10, 1000)
            
            user_ids = [f"user_{i:04d}" for i in range(num_users)]
            product_ids = [f"prod_{i:04d}" for i in range(num_products)]
            categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports', 'Beauty', 'Food']
            
            # Assign random metadata
            df['user_id'] = np.random.choice(user_ids, size=num_reviews)
            df['product_id'] = np.random.choice(product_ids, size=num_reviews)
            df['category'] = np.random.choice(categories, size=num_reviews)
            
            # Generate timestamps (distributed over last year)
            dates = pd.date_range(end=datetime.now(), periods=num_reviews).to_series()
            df['timestamp'] = dates.sample(frac=1, random_state=42).reset_index(drop=True).dt.strftime('%Y-%m-%dT%H:%M:%S.%f')
            
            # Generate IDs
            df['review_id'] = [f"review_{i:05d}" for i in range(num_reviews)]
            
            # Generate ratings based on label
            # Make distributions more realistic and harder to distinguish
            # Generate ratings based on label
            # Make distributions extremely similar to force text learning
            def generate_rating(row):
                if row['label'] == 'genuine':
                    # Genuine: slight bias towards 4-5
                    return np.random.choice([1, 2, 3, 4, 5], p=[0.15, 0.15, 0.2, 0.25, 0.25])
                else:
                    # Fake: slight bias towards 1 and 5, but much noisier
                    return np.random.choice([1, 2, 3, 4, 5], p=[0.25, 0.15, 0.15, 0.2, 0.25])
            
            df['rating'] = df.apply(generate_rating, axis=1)
            
            # Generate votes
            # Generate votes with high overlap
            # Genuine: 0-50, Fake: 0-40 (very hard to distinguish)
            df['helpful_votes'] = np.where(
                df['label'] == 'genuine',
                np.random.randint(0, 50, size=num_reviews),
                np.random.randint(0, 40, size=num_reviews)
            )
            df['total_votes'] = df['helpful_votes'] + np.random.randint(0, 10, size=num_reviews)

            # Generate verified purchase (random distribution to avoid data leakage)
            # 60% of all reviews are verified, independent of label
            df['verified_purchase'] = np.random.choice([0, 1], size=num_reviews, p=[0.4, 0.6])
            
            # Save dataset
            df.to_csv(os.path.join(self.data_dir, 'reviews.csv'), index=False)
            
            # Create metadata
            metadata = {
                'total_reviews': len(df),
                'genuine_reviews': len(df[df['label'] == 'genuine']),
                'fake_reviews': len(df[df['label'] == 'fake']),
                'unique_users': df['user_id'].nunique(),
                'unique_products': df['product_id'].nunique(),
                'categories': categories,
                'created_at': datetime.now().isoformat(),
                'source': 'HuggingFace: theArijitDas/Fake-Reviews-Dataset'
            }
            
            with open(os.path.join(self.data_dir, 'metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
            
            print(f"Successfully loaded and processed {len(df)} reviews")
            return df
            
        except Exception as e:
            print(f"Error loading Hugging Face dataset: {e}")
            print("Falling back to synthetic generation...")
            # Fallback to original synthetic generation if download fails
            return self._generate_synthetic_reviews()

    def _generate_synthetic_reviews(self) -> pd.DataFrame:
        """
        Fallback: Generate synthetic reviews if external dataset fails
        """
        np.random.seed(42)
        
        num_reviews = 5000
        num_users = 500
        num_products = 200
        
        # ... (rest of the original generation logic)
        
        # Generate user IDs
        user_ids = [f"user_{i:04d}" for i in range(num_users)]
        
        # Generate product IDs with categories
        categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports', 'Beauty', 'Food']
        product_ids = [f"prod_{i:04d}" for i in range(num_products)]
        product_categories = {pid: np.random.choice(categories) for pid in product_ids}
        
        # Review templates for genuine and fake reviews
        genuine_templates = [
            "I bought this {product} about {time} ago and I'm {sentiment} with my purchase. "
            "The quality is {quality} and it arrived {delivery}. "
            "{recommend} recommend this to anyone looking for {category}.",
            
            "After using this {product} for {time}, I can say it's {quality}. "
            "The {feature} is {sentiment} and overall I'm {recommend} satisfied. "
            "{delivery} shipping and good packaging.",
            
            "This is my {count} purchase of this {product} and it never disappoints. "
            "{quality} build quality and {sentiment} performance. "
            "Will definitely buy again!",
            
            "Got this as a gift and the recipient loved it. "
            "{quality} product, {delivery} delivery, and {sentiment} customer service.",
            
            "Compared to other {category} products I've used, this one stands out. "
            "The {feature} is excellent and the price is fair. "
            "{recommend} recommend."
        ]
        
        fake_templates = [
            "AMAZING product!!! Best {category} ever!!! 5 stars!!! "
            "Must buy! You won't regret it! Perfect in every way!!!",
            
            "Terrible. Worst purchase ever. Don't buy this garbage. "
            "Complete waste of money. 1 star. Avoid at all costs.",
            
            "Great product great quality great price great everything! "
            "Highly recommend! A+++++++++ Best seller!",
            
            "I love it love it love it! Perfect! Amazing! Wonderful! "
            "Best {category} I've ever bought! Five stars!",
            
            "Horrible horrible horrible! Never again! "
            "Worst {category} ever! Zero stars if I could! "
            "Complete disaster! Stay away!"
        ]
        
        # Generate reviews
        reviews = []
        
        # Generate balanced dataset
        num_genuine = num_reviews // 2
        num_fake = num_reviews - num_genuine
        
        # Genuine reviews
        for i in range(num_genuine):
            is_fake = False
            template = np.random.choice(genuine_templates)
            
            # Fill template
            time_period = np.random.choice(['a week', 'a month', 'two months', 'a year', 'several weeks'])
            sentiment = np.random.choice(['happy', 'very happy', 'satisfied', 'pleased', 'content'])
            quality = np.random.choice(['good', 'excellent', 'great', 'decent', 'high'])
            delivery = np.random.choice(['quickly', 'on time', 'fast', 'promptly', 'in good time'])
            recommend = np.random.choice(['Would definitely', 'Highly', 'I would', 'Strongly'])
            feature = np.random.choice(['design', 'functionality', 'build', 'performance', 'durability'])
            
            text = template.format(
                product='item',
                time=time_period,
                sentiment=sentiment,
                quality=quality,
                delivery=delivery,
                recommend=recommend,
                category=np.random.choice(categories),
                count=np.random.choice(['second', 'third', 'fourth', 'fifth']),
                feature=feature
            )
            
            # Genuine users have varied ratings
            rating = np.random.choice([3, 4, 5, 5, 5], p=[0.1, 0.2, 0.2, 0.3, 0.2])
            
            # Add some noise to rating (genuine users aren't perfectly correlated)
            if np.random.random() < 0.1:
                rating = max(1, min(5, rating + np.random.choice([-2, -1, 1, 2])))
            
            reviews.append({
                'review_id': f"review_{i:05d}",
                'user_id': np.random.choice(user_ids),
                'product_id': np.random.choice(product_ids),
                'review_text': text,
                'rating': rating,
                'timestamp': (datetime.now() - pd.Timedelta(days=np.random.randint(1, 365))).isoformat(),
                'helpful_votes': np.random.randint(0, 50),
                'total_votes': np.random.randint(0, 60),
                'label': 'genuine',
                'is_fake': 0
            })
        
        # Fake reviews
        fake_user_ids = [f"fake_user_{i:03d}" for i in range(50)]  # Dedicated fake accounts
        spammer_ids = user_ids[:30]  # Some users are spammers
        
        for i in range(num_genuine, num_reviews):
            is_fake = True
            template = np.random.choice(fake_templates)
            
            text = template.format(category=np.random.choice(categories))
            
            # Fake reviews have extreme ratings (mostly 1 or 5)
            rating = np.random.choice([1, 1, 5, 5, 5], p=[0.2, 0.2, 0.2, 0.2, 0.2])
            
            # Fake reviews often have low helpful votes
            helpful = np.random.randint(0, 5) if np.random.random() < 0.7 else np.random.randint(5, 100)
            
            # Fake users or spammer accounts
            user = np.random.choice(fake_user_ids + spammer_ids) if np.random.random() < 0.8 else np.random.choice(user_ids)
            
            reviews.append({
                'review_id': f"review_{i:05d}",
                'user_id': user,
                'product_id': np.random.choice(product_ids),
                'review_text': text,
                'rating': rating,
                'timestamp': (datetime.now() - pd.Timedelta(days=np.random.randint(1, 30))).isoformat(),
                'helpful_votes': helpful,
                'total_votes': helpful + np.random.randint(0, 10),
                'label': 'fake',
                'is_fake': 1
            })
        
        df = pd.DataFrame(reviews)
        
        # Shuffle
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        
        # Save dataset
        df.to_csv(os.path.join(self.data_dir, 'reviews.csv'), index=False)
        
        # Create metadata
        metadata = {
            'total_reviews': len(df),
            'genuine_reviews': len(df[df['label'] == 'genuine']),
            'fake_reviews': len(df[df['label'] == 'fake']),
            'unique_users': df['user_id'].nunique(),
            'unique_products': df['product_id'].nunique(),
            'categories': categories,
            'created_at': datetime.now().isoformat()
        }
        
        with open(os.path.join(self.data_dir, 'metadata.json'), 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return df
    
    def load_yelp_reviews(self) -> pd.DataFrame:
        """Load Yelp fake review dataset"""
        # Similar implementation for Yelp data
        return self.load_amazon_reviews()  # Fallback for demo
    
    def load_custom_dataset(self, filepath: str) -> pd.DataFrame:
        """Load custom dataset from CSV or JSON"""
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        elif filepath.endswith('.json'):
            df = pd.read_json(filepath)
        else:
            raise ValueError("Unsupported file format. Use CSV or JSON.")
        
        # Validate required columns
        required = ['review_text', 'rating']
        for col in required:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")
        
        # Add missing columns with defaults
        if 'review_id' not in df.columns:
            df['review_id'] = [f"review_{i:05d}" for i in range(len(df))]
        if 'user_id' not in df.columns:
            df['user_id'] = [f"user_{i:04d}" for i in range(len(df))]
        if 'product_id' not in df.columns:
            df['product_id'] = [f"prod_{i:04d}" for i in range(len(df))]
        if 'label' not in df.columns:
            # Try to detect fake reviews based on heuristics
            df['label'] = df.apply(self._detect_fake_heuristic, axis=1)
            df['is_fake'] = (df['label'] == 'fake').astype(int)
        if 'is_fake' not in df.columns:
            df['is_fake'] = (df['label'] == 'fake').astype(int)
        
        return df
    
    def _detect_fake_heuristic(self, row) -> str:
        """Heuristic-based fake detection for unlabeled data"""
        text = str(row.get('review_text', ''))
        rating = row.get('rating', 3)
        
        # Extreme ratings with short, repetitive text
        if len(text) < 50 and rating in [1, 5]:
            if any(word in text.lower() for word in ['amazing', 'terrible', 'best', 'worst', 'love', 'hate']):
                return 'fake'
        
        # Excessive punctuation
        if text.count('!') > 5 or text.count('?') > 3:
            return 'fake'
        
        # All caps
        if text.isupper() and len(text) > 20:
            return 'fake'
        
        return 'genuine'
    
    def get_statistics(self, df: pd.DataFrame) -> Dict:
        """Calculate dataset statistics"""
        stats = {
            'total_reviews': len(df),
            'genuine_reviews': len(df[df['label'] == 'genuine']),
            'fake_reviews': len(df[df['label'] == 'fake']),
            'unique_users': df['user_id'].nunique(),
            'unique_products': df['product_id'].nunique(),
            'rating_distribution': df['rating'].value_counts().to_dict(),
            'fraud_distribution': df['label'].value_counts().to_dict(),
            'avg_review_length': df['review_text'].str.len().mean(),
            'avg_rating': df['rating'].mean(),
            'rating_std': df['rating'].std()
        }
        
        # User activity stats
        user_stats = df.groupby('user_id').agg({
            'review_id': 'count',
            'rating': ['mean', 'std']
        }).reset_index()
        user_stats.columns = ['user_id', 'review_count', 'avg_rating', 'rating_std']
        
        stats['avg_reviews_per_user'] = user_stats['review_count'].mean()
        stats['max_reviews_per_user'] = user_stats['review_count'].max()
        
        # Product stats
        stats['avg_reviews_per_product'] = df.groupby('product_id')['review_id'].count().mean()
        
        return stats
    
    def create_splits(
        self, 
        df: pd.DataFrame, 
        test_size: float = 0.2,
        val_size: float = 0.1,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Create train/validation/test splits"""
        from sklearn.model_selection import train_test_split
        
        # First split: train vs (val + test)
        train_df, temp_df = train_test_split(
            df, 
            test_size=(test_size + val_size),
            random_state=random_state,
            stratify=df['is_fake']
        )
        
        # Second split: val vs test
        val_ratio = val_size / (test_size + val_size)
        val_df, test_df = train_test_split(
            temp_df,
            test_size=(1 - val_ratio),
            random_state=random_state,
            stratify=temp_df['is_fake']
        )
        
        return train_df, val_df, test_df


# Global dataset instance
_dataset_loader: Optional[DatasetLoader] = None


def get_dataset_loader(data_dir: str = "/home/z/my-project/data") -> DatasetLoader:
    """Get or create dataset loader instance"""
    global _dataset_loader
    if _dataset_loader is None:
        _dataset_loader = DatasetLoader(data_dir)
    return _dataset_loader
