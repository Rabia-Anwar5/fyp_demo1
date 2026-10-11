"""
Train fabric texture classifier.

Pipeline:
1. Load fabric-labelled images from ml/dataset/fabric_labels.csv
2. Extract LBP+GLCM+Gabor+FFT features (same as fabric_service.py)
3. Train sklearn RandomForestClassifier (or SVM)
4. Evaluate: accuracy, F1, confusion matrix
5. Save to ai-service/ml/weights/fabric_classifier.pkl

Usage:
  python ml/scripts/train_fabric.py
"""
import sys
import pickle
import csv
import pathlib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder

ROOT = pathlib.Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))

# Import feature extractor from service (reuse exact same code)
from ai_service.app.services.fabric_service import extract_texture_features
from PIL import Image

FABRIC_CSV = ROOT / "ml" / "dataset" / "fabric_labels.csv"
WEIGHTS_OUT = ROOT / "ai-service" / "ml" / "weights" / "fabric_classifier.pkl"


def load_data():
    X, y = [], []
    with open(FABRIC_CSV, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            img_path = pathlib.Path(row["image_path"])
            if not img_path.exists():
                continue
            try:
                img = np.array(Image.open(img_path).convert("RGB"))
                features = extract_texture_features(img)
                X.append(list(features.values()))
                y.append(row["fabric_type"])
            except Exception as e:
                print(f"Skipping {img_path}: {e}")
    return np.array(X), np.array(y)


def train():
    print("Loading fabric dataset...")
    X, y = load_data()
    if len(X) == 0:
        print("No data found. Ensure fabric_labels.csv exists and images are in place.")
        sys.exit(1)

    print(f"Loaded {len(X)} samples. Classes: {np.unique(y)}")

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    # Cross-validation
    clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(clf, X, y_enc, cv=cv, scoring="f1_weighted")
    print(f"CV F1 (weighted): {scores.mean():.4f} +/- {scores.std():.4f}")

    # Final fit on all data
    clf.fit(X, y_enc)

    # Save
    WEIGHTS_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(WEIGHTS_OUT, "wb") as f:
        pickle.dump(clf, f)
    print(f"Saved fabric classifier to {WEIGHTS_OUT}")

    # Evaluation report
    y_pred = clf.predict(X)
    print("\nClassification Report (train set):")
    print(classification_report(y_enc, y_pred, target_names=le.classes_))
    print("NOTE: Report real test-set numbers in docs/eval_report.md")


if __name__ == "__main__":
    train()