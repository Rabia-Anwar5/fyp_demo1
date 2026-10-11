"""
Train YOLOv8 on the CATCH dataset.

Usage:
  python ml/scripts/train_yolo.py [--epochs 50] [--batch 16] [--device cpu]

After training, weights are saved to runs/detect/catch_yolov8/weights/best.pt
Copy best.pt to ai-service/ml/weights/yolov8_catch.pt
"""
import argparse
import shutil
from pathlib import Path
from ultralytics import YOLO

ROOT = Path(__file__).parent.parent.parent

def train(epochs=50, batch=16, device="cpu", imgsz=640):
    model = YOLO("yolov8n.pt")   # start from nano for speed; use yolov8m.pt for accuracy
    data_yaml = str(ROOT / "ml" / "dataset" / "dataset.yaml")

    results = model.train(
        data=data_yaml,
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        device=device,
        project=str(ROOT / "ml" / "runs"),
        name="catch_yolov8",
        exist_ok=True,
        # Augmentation (overrides defaults for mall lighting)
        degrees=15,
        fliplr=0.5,
        brightness=0.3,
        saturation=0.4,
        mosaic=1.0,
        mixup=0.1,
        copy_paste=0.1,
    )

    # Copy best weights to ai-service
    best = ROOT / "ml" / "runs" / "catch_yolov8" / "weights" / "best.pt"
    dest = ROOT / "ai-service" / "ml" / "weights" / "yolov8_catch.pt"
    dest.parent.mkdir(parents=True, exist_ok=True)
    if best.exists():
        shutil.copy(best, dest)
        print(f"Weights copied to {dest}")
    else:
        print(f"Warning: best.pt not found at {best}")

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--device", type=str, default="cpu")
    parser.add_argument("--imgsz", type=int, default=640)
    args = parser.parse_args()
    train(args.epochs, args.batch, args.device, args.imgsz)