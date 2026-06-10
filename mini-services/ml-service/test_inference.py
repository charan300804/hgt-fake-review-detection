import os
import torch
import joblib
from hgt_model import HGTModel
from preprocessing import TextPreprocessor
from config import MODEL_PATH, VECTORIZER_PATH, HIDDEN_DIM, NUM_HEADS, NUM_LAYERS, DROPOUT

def test():
    print(f"Loading model from {MODEL_PATH}")
    model = HGTModel(
        hidden_dim=HIDDEN_DIM,
        num_heads=NUM_HEADS,
        num_layers=NUM_LAYERS,
        dropout=DROPOUT,
        text_dim=5000,
        num_classes=2
    )
    model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
    model.eval()

    print(f"Loading vectorizer from {VECTORIZER_PATH}")
    preprocessor = TextPreprocessor(max_features=5000)
    preprocessor.load(VECTORIZER_PATH)

    text = "Missing information on how to use it, but it is a great product for the price!  I"
    processed = preprocessor.preprocess_single(text)
    print(f"Processed text: {processed}")
    
    vector = preprocessor.transform([text])
    print(f"Vector sum: {vector.sum()}")

    # For the HGT model, we need the graph. 
    # But wait, if the user sees 'Genuine' in the UI, it's already using the graph.
    # I want to see what the raw prediction is without the full graph context if possible,
    # or just simulate the full graph inference.
    
    # Actually, I'll just check if the vectorizer itself produces a non-zero vector.
    if vector.sum() == 0:
        print("WARNING: Vector is all zeros. Vocabulary mismatch?")

if __name__ == "__main__":
    test()
