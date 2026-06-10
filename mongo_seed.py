import os
import pandas as pd
from pymongo import MongoClient
import certifi
from datetime import datetime
from dotenv import load_dotenv

# Load explicitly from .env.local
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
load_dotenv(dotenv_path=env_path)

MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/fraud_detection')
base_dir = r"c:\Users\SHIVA CHARAN\OneDrive\Desktop\Karunakar\project"
csv_path = os.path.join(base_dir, "mini-services", "ml-service", "data", "reviews.csv")

print(f"Connecting to MongoDB at {MONGO_URI}...")
client = MongoClient(MONGO_URI)
db = client.get_default_database()
if db.name == 'test':
    db = client['fraud_detection']

print(f"Loading {csv_path}...")
df = pd.read_csv(csv_path)

print("Clearing existing collections (users, products, reviews)...")
db.users.delete_many({})
db.products.delete_many({})
db.reviews.delete_many({})

now = datetime.now()

# 1. Users
print("Preparing Users...")
unique_users = df['user_id'].unique()
user_docs = [{
    "_id": str(uid),
    "user_id": str(uid),
    "name": f"User {uid}",
    "email": f"{uid}@example.com",
    "account_creation_date": now,
    "createdAt": now,
    "updatedAt": now
} for uid in unique_users]

if user_docs:
    db.users.insert_many(user_docs)
print(f"Inserted {len(user_docs)} users.")

# 2. Products
print("Preparing Products...")
# Re-map categories
prod_cat_map = df.drop_duplicates(subset=['product_id']).set_index('product_id')['category']
unique_products = df['product_id'].unique()
product_docs = [{
    "_id": str(pid),
    "product_id": str(pid),
    "product_name": f"Product {pid}",
    "category": str(prod_cat_map.get(pid, 'Uncategorized')),
    "created_at": now,
    "createdAt": now,
    "updatedAt": now
} for pid in unique_products]

if product_docs:
    db.products.insert_many(product_docs)
print(f"Inserted {len(product_docs)} products.")

# 3. Reviews
print("Preparing Reviews...")
# Parse out to dictionaries cleanly
records = df.to_dict('records')
review_docs = []
for r in records:
    # Need to map user_id and product_id to the exact string matching the _id fields
    review_docs.append({
        "_id": str(r['review_id']),
        "review_id": str(r['review_id']),
        "review_text": str(r.get('review_text', '')),
        "rating": int(r.get('rating', 3)),
        "helpfulVotes": int(r.get('helpful_votes', 0)),
        "totalVotes": int(r.get('total_votes', 0)),
        "predicted_label": str(r.get('label', 'Pending')).capitalize(),
        "isFake": int(r.get('is_fake', 0)),
        "verified": int(r.get('verified_purchase', 0)),
        "user_id": str(r['user_id']),    # Mongoose ref
        "product_id": str(r['product_id']), # Mongoose ref
        "timestamp": r.get('timestamp', now),
        "createdAt": now,
        "updatedAt": now
    })

# Batch insert reviews to be safe for 40k+ limit sizes
batch_size = 5000
for i in range(0, len(review_docs), batch_size):
    batch = review_docs[i:i + batch_size]
    db.reviews.insert_many(batch)
    print(f"Inserted reviews batch {i} to {i+len(batch)}...")

print(f"Total inserted {len(review_docs)} reviews.")
client.close()
print("Done seeding MongoDB efficiently!")
