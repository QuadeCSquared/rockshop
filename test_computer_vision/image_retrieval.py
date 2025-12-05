import os
import json
import sqlite3
import argparse
from PIL import Image
import torch
from torchvision import models, transforms
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from tabulate import tabulate

# === Load pretrained model (MobileNetV2) ===
model = models.mobilenet_v2(weights='IMAGENET1K_V1')
model.classifier = torch.nn.Identity()
model.eval()

# === Preprocessing for images ===
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def extract_features(image_path: str) -> list:
    image = Image.open(image_path).convert('RGB')
    tensor = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        embedding = model(tensor).squeeze().tolist()
    return embedding

def create_database(db_path: str = "product_embeddings.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        amount INTEGER NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        embedding TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    """)

    conn.commit()
    conn.close()

def insert_product(name: str, price: float, amount: int, image_paths: list, db_path: str = "product_embeddings.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO products (name, price, amount) VALUES (?, ?, ?)
    """, (name, price, amount))
    product_id = cursor.lastrowid

    for img_path in image_paths:
        embedding = extract_features(img_path)
        cursor.execute("""
        INSERT INTO images (product_id, image_path, embedding)
        VALUES (?, ?, ?)
        """, (product_id, img_path, json.dumps(embedding)))

    conn.commit()
    conn.close()

def find_best_match(query_image: str, db_path: str = "product_embeddings.db"):
    query_vec = extract_features(query_image)
    query_vec = [query_vec]

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT products.id, products.name, products.price, products.amount, images.image_path, images.embedding
    FROM products
    JOIN images ON products.id = images.product_id
    """)
    entries = cursor.fetchall()
    conn.close()

    cosine_results = []
    euclidean_results = []

    for pid, name, price, amount, path, embedding_str in entries:
        embedding = json.loads(embedding_str)
        cosine_score = cosine_similarity([embedding], query_vec)[0][0]
        euclidean_score = euclidean_distances([embedding], query_vec)[0][0]

        cosine_results.append((pid, name, price, amount, path, cosine_score))
        euclidean_results.append((pid, name, price, amount, path, euclidean_score))

    cosine_results.sort(key=lambda x: -x[5])
    euclidean_results.sort(key=lambda x: x[5])

    print("\n🔍 Best Match by Cosine Similarity:")
    best_cos = cosine_results[0]
    print(f"ID: {best_cos[0]} | Name: {best_cos[1]} | Price: ${best_cos[2]} | In Stock: {best_cos[3]} | Similarity: {best_cos[5]:.4f}")
    print(f"Image: {best_cos[4]}")

    print("\n🔍 Best Match by Euclidean Distance:")
    best_euc = euclidean_results[0]
    print(f"ID: {best_euc[0]} | Name: {best_euc[1]} | Price: ${best_euc[2]} | In Stock: {best_euc[3]} | Distance: {best_euc[5]:.4f}")
    print(f"Image: {best_euc[4]}")

    print("\n📋 Top 3 by Cosine Similarity:")
    print(tabulate([(x[1], x[5]) for x in cosine_results[:3]], headers=["Name", "Cosine"]))

    print("\n📋 Top 3 by Euclidean Distance:")
    print(tabulate([(x[1], x[5]) for x in euclidean_results[:3]], headers=["Name", "Euclidean"]))

def add_images_to_product(product_id: int, image_paths: list, db_path: str = "product_embeddings.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    for img_path in image_paths:
        embedding = extract_features(img_path)
        cursor.execute("""
        INSERT INTO images (product_id, image_path, embedding)
        VALUES (?, ?, ?)
        """, (product_id, img_path, json.dumps(embedding)))

    conn.commit()
    conn.close()

def main():
    parser = argparse.ArgumentParser(description="Image Retrieval Tool")
    parser.add_argument("action", choices=["init", "add", "add_images", "query"])
    parser.add_argument("--name", help="Product name (for add)")
    parser.add_argument("--price", type=float, help="Product price (for add)")
    parser.add_argument("--amount", type=int, help="How many in stock (for add)")
    parser.add_argument("--image", help="Path to image file (for add or query)")
    parser.add_argument("--product_id", type=int, help="Product ID (for add_images)")
    parser.add_argument("--db", default="product_embeddings.db", help="Path to SQLite database")

    args = parser.parse_args()

    if args.action == "init":
        create_database(args.db)
        print(f"✅ Database created at {args.db}")
    
    elif args.action == "add":
        if not (args.name and args.price and args.amount and args.image):
            print("❌ Please provide --name, --price, --amount, and --image for adding a product.")
        else:
            insert_product(args.name, args.price, args.amount, [args.image], args.db)
            print(f"✅ Product '{args.name}' added with {args.amount} in stock.")
    
    elif args.action == "add_images":
        if not (args.product_id and args.image):
            print("❌ Please provide --product_id and --image for adding images to a product.")
        else:
            add_images_to_product(args.product_id, [args.image], args.db)
            print(f"✅ Image '{args.image}' added to product ID {args.product_id}.")
    
    elif args.action == "query":
        if not args.image:
            print("❌ Please provide --image for query.")
        else:
            find_best_match(args.image, args.db)

if __name__ == "__main__":
    main()
    """
    How to use this script:

    1. Initialize the database:
       python image_retrieval.py init

    2. Add a new product with an image:
       python image_retrieval.py add --name "Sneaker X" --price 99.99 --amount 12 --image rock1.png

    3. Add an image to an existing product:
       python image_retrieval.py add_images --product_id 1 --image rock2.png

    4. Query for similar products:
       python image_retrieval.py query --image images/test_query.jpg
    """
