"""
Download placeholder dataset for development.

Uses a small public-domain fashion image dataset so the training pipeline
can be tested end-to-end before the team's own images are ready.

Instructions:
1. Run this script: python ml/scripts/download_placeholder_data.py
2. It will populate ml/dataset/images/ with labelled examples
3. Replace with team images by adding to ml/dataset/images/{train,val,test}/
   and running prepare_dataset.py again.

NOTE: This uses fashion-mnist as a grayscale fallback.
For colour images, the team should source DeepFashion2 or similar.
Real images from the team should always replace placeholders before final evaluation.
"""
import os
import sys
import urllib.request
import zipfile
import struct
import array
import pathlib

ROOT = pathlib.Path(__file__).parent.parent
IMAGES_DIR = ROOT / "dataset" / "images"
LABELS_DIR = ROOT / "dataset" / "labels"

def ensure_dirs():
    for split in ("train", "val", "test"):
        (IMAGES_DIR / split).mkdir(parents=True, exist_ok=True)
        (LABELS_DIR / split).mkdir(parents=True, exist_ok=True)

def download_fashion_mnist():
    """Download Fashion-MNIST and convert to JPEG + YOLO labels (placeholder)."""
    try:
        from torchvision.datasets import FashionMNIST
        import torchvision.transforms as T
        from PIL import Image
        import torch
    except ImportError:
        print("Install: pip install torchvision Pillow torch")
        sys.exit(1)

    # Fashion-MNIST class -> CATCH class mapping (coarse)
    FM_TO_CATCH = {
        0: (0, "jacket"),   # T-shirt -> shirt (best match)
        1: (2, "pants"),
        2: (0, "jacket"),
        3: (3, "dress"),
        4: (0, "jacket"),   # coat
        5: (4, "sneaker"),
        6: (0, "jacket"),   # shirt -> jacket
        7: (4, "sneaker"),
        8: (6, "bag"),
        9: (4, "sneaker"),  # ankle boot
    }

    SPLIT_SIZES = {"train": 200, "val": 50, "test": 30}

    for split, max_n in SPLIT_SIZES.items():
        train_flag = split == "train"
        dataset = FashionMNIST(
            root=str(ROOT / "dataset" / ".fmnist_cache"),
            train=train_flag,
            download=True,
            transform=T.Compose([T.Resize((224, 224)), T.ToTensor()])
        )
        written = 0
        for i, (img_tensor, label) in enumerate(dataset):
            if written >= max_n:
                break
            catch_class_id, catch_label = FM_TO_CATCH.get(label, (0, "jacket"))
            # Save image
            img = T.ToPILImage()(img_tensor).convert("RGB")
            stem = f"fmnist_{split}_{i:05d}"
            img.save(IMAGES_DIR / split / f"{stem}.jpg")
            # Write YOLO label (full-image box)
            with open(LABELS_DIR / split / f"{stem}.txt", "w") as f:
                f.write(f"{catch_class_id} 0.5 0.5 1.0 1.0\n")
            written += 1
        print(f"Written {written} {split} images")

    print("\nPlaceholder dataset ready.")
    print("IMPORTANT: Replace with real team images for final evaluation.")
    print("Run ml/scripts/prepare_dataset.py after adding real images.")

if __name__ == "__main__":
    ensure_dirs()
    download_fashion_mnist()