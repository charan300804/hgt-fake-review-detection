import os
import sqlite3
import pandas as pd
from datetime import datetime

base_dir = r"c:\Users\SHIVA CHARAN\OneDrive\Desktop\Karunakar\project"
db_path = os.path.join(base_dir, "prisma", "dev.db")
csv_path = os.path.join(base_dir, "mini-services", "ml-service", "data", "reviews.csv")

print(f"Loading {csv_path}...")
df = pd.read_csv(csv_path)

conn = sqlite3.connect(db_path)

print("Clearing existing tables...")
conn.execute("DELETE FROM Review")
conn.execute("DELETE FROM User")
conn.execute("DELETE FROM Product")
conn.commit()

now = datetime.now().isoformat()

# Build Users DataFrame
print("Preparing Users...")
users_df = pd.DataFrame({
    'id': df['user_id'].unique()
})
users_df['email'] = users_df['id'] + "@example.com"
users_df['name'] = "User " + users_df['id']
users_df['createdAt'] = now
users_df['updatedAt'] = now

users_df.to_sql('User', conn, if_exists='append', index=False)
print(f"Inserted {len(users_df)} users.")

# Build Products DataFrame
print("Preparing Products...")
products_df = pd.DataFrame({
    'id': df['product_id'].unique()
})
# Re-map categories if needed, simplest is taking the first category seen for each product
prod_cat_map = df.drop_duplicates(subset=['product_id']).set_index('product_id')['category']
products_df['category'] = products_df['id'].map(prod_cat_map)
products_df['createdAt'] = now
products_df['updatedAt'] = now

products_df.to_sql('Product', conn, if_exists='append', index=False)
print(f"Inserted {len(products_df)} products.")

# Build Reviews DataFrame
print("Preparing Reviews...")
reviews_df = pd.DataFrame({
    'id': df['review_id'],
    'reviewId': df['review_id'],
    'reviewText': df['review_text'].fillna(''),
    'rating': df['rating'].fillna(3).astype(int),
    'helpfulVotes': df['helpful_votes'].fillna(0).astype(int),
    'totalVotes': df['total_votes'].fillna(0).astype(int),
    'label': df['label'],
    'isFake': df['is_fake'].fillna(0).astype(int),
    'verified': df['verified_purchase'].fillna(0).astype(int),
    'userId': df['user_id'],
    'productId': df['product_id'],
    'createdAt': df['timestamp'].fillna(now),
    'updatedAt': now
})

reviews_df.to_sql('Review', conn, if_exists='append', index=False)
print(f"Inserted {len(reviews_df)} reviews.")

conn.close()
print("Done seeding efficiently!")
