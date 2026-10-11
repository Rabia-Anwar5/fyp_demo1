# CATCH ML Pipeline

## Scripts

| Script | Purpose |
|---|---|
| `scripts/download_placeholder_data.py` | Download Fashion-MNIST placeholder for dev |
| `scripts/train_yolo.py`                | Train YOLOv8 on CATCH dataset |
| `scripts/train_fabric.py`              | Train fabric texture classifier |

## Dataset

See `dataset/dataset.yaml` for YOLO config.
See `docs/dataset_card.md` for full dataset documentation.

Folder structure:
```
dataset/
  images/{train,val,test}/   - JPEG images
  labels/{train,val,test}/   - YOLO .txt labels (class cx cy w h)
  fabric_labels.csv          - image_path, fabric_type, quality_tier
  dataset.yaml               - YOLO config
```

## Training

```bash
# 1. Download placeholder data
python ml/scripts/download_placeholder_data.py

# 2. Train YOLOv8
python ml/scripts/train_yolo.py --epochs 50 --device cpu

# 3. Train fabric classifier  
python ml/scripts/train_fabric.py
```

Weights are automatically copied to `ai-service/ml/weights/`.

## Evaluation

See `docs/eval_report_template.md`.
Fill in real measured numbers after training. Never fabricate results.