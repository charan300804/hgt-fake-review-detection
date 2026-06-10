import os
import pandas as pd
import torch
import numpy as np
from typing import Dict, Tuple, Any, List
from pymongo import MongoClient
import certifi

# ============================================================
# STRICT HETEROGENEOUS GRAPH SCHEMA DEFINITION
# This is the ONLY permitted graph topology in this application.
# ============================================================
PERMITTED_NODE_TYPES = {'user', 'review', 'product'}
PERMITTED_EDGE_TYPES = {
    ('user', 'writes', 'review'),
    ('review', 'belongs_to', 'product'),
}


class GraphSchemaViolationError(Exception):
    """Raised when incoming data violates the strict User->Review->Product schema."""
    pass


class GraphSchemaValidator:
    """Validates that all incoming records comply with the mandatory graph structure."""

    @staticmethod
    def validate_review(review: dict) -> None:
        """
        Enforces that a review has both a user_id and a product_id.
        Raises GraphSchemaViolationError on violation.
        """
        uid = str(review.get('user_id', '')).strip()
        pid = str(review.get('product_id', '')).strip()
        if not uid or uid in ('None', 'nan', ''):
            raise GraphSchemaViolationError(
                f"Schema violation: Review '{review.get('review_id','?')}' has no valid user_id. "
                "Every Review MUST be linked to exactly one User (User -> wrote -> Review)."
            )
        if not pid or pid in ('None', 'nan', ''):
            raise GraphSchemaViolationError(
                f"Schema violation: Review '{review.get('review_id','?')}' has no valid product_id. "
                "Every Review MUST belong to exactly one Product (Review -> belongs_to -> Product)."
            )

    @staticmethod
    def validate_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        """
        Filters the dataframe to only include rows that satisfy the graph schema.
        Logs and discards any violating rows rather than allowing silent corruption.
        """
        before = len(df)
        # Drop rows where user_id or product_id are missing
        df = df.dropna(subset=['user_id', 'product_id'])
        df = df[df['user_id'].astype(str).str.strip().isin(['', 'None', 'nan']) == False]
        df = df[df['product_id'].astype(str).str.strip().isin(['', 'None', 'nan']) == False]
        after = len(df)
        if after < before:
            print(f"[GraphSchemaValidator] WARNING: Discarded {before - after} reviews "
                  f"violating the User->Review->Product schema (missing user_id or product_id).")
        return df.reset_index(drop=True)

    @staticmethod
    def validate_edge_type(edge_type: tuple) -> None:
        """Raises if someone attempts to add a non-permitted edge type to the graph."""
        if edge_type not in PERMITTED_EDGE_TYPES:
            raise GraphSchemaViolationError(
                f"Schema violation: Edge type {edge_type} is NOT permitted. "
                f"Only {PERMITTED_EDGE_TYPES} are allowed."
            )

class GraphBuilder:
    def __init__(self, db_path: str = None, preprocessor=None):
        # db_path is ignored now in favor of MONGODB_URI
        self.mongo_uri = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/fraud_detection')
        self.preprocessor = preprocessor

        self.user_to_idx = {}
        self.review_to_idx = {}
        self.product_to_idx = {}

        self.idx_to_user = {}
        self.idx_to_review = {}
        self.idx_to_product = {}

        self.global_mean_rating = 3.0
        
    def _get_connection(self):
        return MongoClient(self.mongo_uri)

    def load_graph_data(self) -> Tuple[Dict[str, torch.Tensor], Dict[Tuple[str, str, str], torch.Tensor]]:
        """
        Builds the heterogeneous graph from the MongoDB database.
        Returns:
            x_dict: Dictionary of node features
            edge_index_dict: Dictionary of edge indices
        """
        client = self._get_connection()
        db = client.get_default_database()
        if db.name == 'test': # fallback if no db specified in URI
             db = client['test']
        
        # Load collections
        reviews_cursor = db.reviews.find({})
        users_cursor = db.users.find({})
        products_cursor = db.products.find({})
        
        # Build dataframes for easier Pandas manipulation like before
        reviews_df = pd.DataFrame(list(reviews_cursor))
        users_df = pd.DataFrame(list(users_cursor))
        products_df = pd.DataFrame(list(products_cursor))
        
        client.close()
        
        # Standardize columns to match old logic
        if not reviews_df.empty:
            reviews_df['review_id'] = reviews_df['_id'].astype(str)
            reviews_df['user_id'] = reviews_df['user_id'].astype(str)
            reviews_df['product_id'] = reviews_df['product_id'].astype(str)
            reviews_df['helpful_votes'] = reviews_df.get('helpfulVotes', 0)
            reviews_df['total_votes'] = reviews_df.get('totalVotes', 0)
            # === STRICT SCHEMA ENFORCEMENT ===
            # Drop any reviews that violate the mandatory relational structure.
            # This is the schema guardian: no orphaned reviews enter the graph.
            reviews_df = GraphSchemaValidator.validate_dataframe(reviews_df)
            
        if not users_df.empty:
            users_df['user_id'] = users_df['_id'].astype(str)
            
        if not products_df.empty:
            products_df['product_id'] = products_df['_id'].astype(str)

        # Build ID mappings
        for idx, row in users_df.iterrows():
            uid = row['user_id']
            self.user_to_idx[uid] = idx
            self.idx_to_user[idx] = uid

        for idx, row in products_df.iterrows():
            pid = row['product_id']
            self.product_to_idx[pid] = idx
            self.idx_to_product[idx] = pid

        # Defensive fill for users/products referenced in reviews (schema-compliant only)
        # Since validate_dataframe already ran, all remaining reviews HAVE valid user/product IDs
        for _, row in reviews_df.iterrows():
            if row['user_id'] not in self.user_to_idx:
                idx = len(self.user_to_idx)
                self.user_to_idx[row['user_id']] = idx
                self.idx_to_user[idx] = row['user_id']
            if row['product_id'] not in self.product_to_idx:
                idx = len(self.product_to_idx)
                self.product_to_idx[row['product_id']] = idx
                self.idx_to_product[idx] = row['product_id']

        # Review nodes
        for idx, row in reviews_df.iterrows():
            rid = row['review_id']
            self.review_to_idx[rid] = idx
            self.idx_to_review[idx] = rid

        self.global_mean_rating = reviews_df['rating'].mean() if not reviews_df.empty else 3.0

        # Create user features [rating_mean, review_count, 0, 0, 0, 0]
        user_features = np.zeros((len(self.user_to_idx), 6))
        # Simple heuristic initialization for user features based on their reviews
        user_grouped = reviews_df.groupby('user_id').agg({'rating': 'mean', 'review_id': 'count'})
        for uid, row in user_grouped.iterrows():
            idx = self.user_to_idx[uid]
            user_features[idx, 0] = row['rating']
            user_features[idx, 1] = row['review_id']

        # Create product features [rating_mean, review_count, 0, 0]
        product_features = np.zeros((len(self.product_to_idx), 4))
        product_grouped = reviews_df.groupby('product_id').agg({'rating': 'mean', 'review_id': 'count'})
        for pid, row in product_grouped.iterrows():
            idx = self.product_to_idx[pid]
            product_features[idx, 0] = row['rating']
            product_features[idx, 1] = row['review_id']

        # Create review features
        # text features (from preprocessor) + metadata [rating, helpful, total, rating_diff_from_avg, 0, 0]
        if self.preprocessor is not None and self.preprocessor.is_fitted:
            text_features = self.preprocessor.transform(reviews_df['review_text'].fillna('').tolist())
        else:
            text_features = np.zeros((len(reviews_df), 5000))
            
        review_metadata = np.zeros((len(reviews_df), 6))
        review_metadata[:, 0] = reviews_df['rating'].values
        review_metadata[:, 1] = reviews_df['helpful_votes'].values
        review_metadata[:, 2] = reviews_df['total_votes'].values
        review_metadata[:, 3] = reviews_df['rating'].values - self.global_mean_rating
        
        review_features = np.hstack([text_features, review_metadata])

        x_dict = {
            'user': torch.FloatTensor(user_features),
            'review': torch.FloatTensor(review_features),
            'product': torch.FloatTensor(product_features)
        }

        # Build edges
        user_writes_review = [[], []]
        review_belongs_to_product = [[], []]

        for _, row in reviews_df.iterrows():
            uidx = self.user_to_idx[row['user_id']]
            ridx = self.review_to_idx[row['review_id']]
            pidx = self.product_to_idx[row['product_id']]

            user_writes_review[0].append(uidx)
            user_writes_review[1].append(ridx)

            review_belongs_to_product[0].append(ridx)
            review_belongs_to_product[1].append(pidx)

        # === STRICTLY PERMITTED EDGE TYPES ONLY ===
        # Build edges: User -writes-> Review and Review -belongs_to-> Product
        # No other edge types are constructed (e.g. no direct User->Product shortcuts).
        edge_index_dict = {
            ('user', 'writes', 'review'): torch.LongTensor(user_writes_review),
            ('review', 'belongs_to', 'product'): torch.LongTensor(review_belongs_to_product),
        }

        return x_dict, edge_index_dict

    def add_review_and_update(self, review_data: Dict[str, Any], x_dict: Dict[str, torch.Tensor], edge_index_dict: Dict[Tuple[str, str, str], torch.Tensor]) -> int:
        """
        Dynamically updates the PyG graph with a new review node.
        Adds User and Product nodes if they are new.
        Returns the new review node index.
        """
        uid = review_data['user_id']
        pid = review_data['product_id']
        rid = review_data['review_id']

        # New user logic
        if uid not in self.user_to_idx:
            uidx = len(self.user_to_idx)
            self.user_to_idx[uid] = uidx
            self.idx_to_user[uidx] = uid
            new_user_feat = torch.zeros(1, 6)
            new_user_feat[0, 0] = review_data['rating']
            new_user_feat[0, 1] = 1
            x_dict['user'] = torch.cat([x_dict['user'], new_user_feat], dim=0)
        else:
            uidx = self.user_to_idx[uid]
            
        # New product logic
        if pid not in self.product_to_idx:
            pidx = len(self.product_to_idx)
            self.product_to_idx[pid] = pidx
            self.idx_to_product[pidx] = pid
            new_prod_feat = torch.zeros(1, 4)
            new_prod_feat[0, 0] = review_data['rating']
            new_prod_feat[0, 1] = 1
            x_dict['product'] = torch.cat([x_dict['product'], new_prod_feat], dim=0)
        else:
            pidx = self.product_to_idx[pid]

        if rid not in self.review_to_idx:
            ridx = len(self.review_to_idx)
            self.review_to_idx[rid] = ridx
            self.idx_to_review[ridx] = rid

            # Text features
            if self.preprocessor is not None and self.preprocessor.is_fitted:
                text_feat = self.preprocessor.transform([review_data['review_text']])
            else:
                text_feat = np.zeros((1, 5000))
                
            meta_feat = np.zeros((1, 6))
            meta_feat[0, 0] = review_data['rating']
            meta_feat[0, 1] = review_data.get('helpful_votes', 0)
            meta_feat[0, 2] = review_data.get('total_votes', 0)
            meta_feat[0, 3] = review_data['rating'] - self.global_mean_rating
            
            combined_feat = torch.FloatTensor(np.hstack([text_feat, meta_feat]))
            x_dict['review'] = torch.cat([x_dict['review'], combined_feat], dim=0)

            # Update edges
            uw_edge = edge_index_dict[('user', 'writes', 'review')]
            new_uw = torch.LongTensor([[uidx], [ridx]])
            edge_index_dict[('user', 'writes', 'review')] = torch.cat([uw_edge, new_uw], dim=1)

            rb_edge = edge_index_dict[('review', 'belongs_to', 'product')]
            new_rb = torch.LongTensor([[ridx], [pidx]])
            edge_index_dict[('review', 'belongs_to', 'product')] = torch.cat([rb_edge, new_rb], dim=1)
        else:
            ridx = self.review_to_idx[rid]
            
        return ridx
