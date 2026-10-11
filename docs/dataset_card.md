# CATCH Dataset Card v1.0

## Overview
Custom dataset for multi-category retail product recognition and fabric texture classification.

## Target Size
500-700 high-resolution images (smartphone-captured, mall environment).

## Categories and Label Taxonomy

### Product Categories (YOLO detection classes)
| class_id | label | examples |
|---|---|---|
| 0 | jacket | denim jacket, blazer, coat |
| 1 | shirt | t-shirt, formal shirt, polo |
| 2 | pants | jeans, trousers, shorts |
| 3 | dress | maxi, mini, midi |
| 4 | sneaker | athletic, casual |
| 5 | formal_shoe | oxford, loafer |
| 6 | bag | handbag, backpack, tote |
| 7 | watch | digital, analog |
| 8 | sunglasses | fashion, sport |
| 9 | electronics | headphone, tablet |

### Fabric Types (classification classes - apparel only)
| label | description |
|---|---|
| cotton | Natural woven/knit cotton |
| polyester | Synthetic, smooth or matte |
| denim | Warp-faced cotton twill, blue/black |
| wool | Natural fibre, coarse/fine |
| blend | Fabric showing mixed texture signals |

### Quality Tiers
| tier | definition |
|---|---|
| standard | Loose weave, visible pilling, irregular pattern |
| premium | Tight weave, uniform pattern, smooth surface, natural fibre signal |

Quality tier is derived from GLCM energy, LBP contrast, and Gabor orientation variance.
A threshold-based classifier assigns tier; thresholds documented in ml/configs/fabric_thresholds.yaml.

## Dataset Structure

```
ml/dataset/
  images/
    train/   (70% - ~490 images)
    val/     (20% - ~140 images)
    test/    (10% -  ~70 images)
  labels/
    train/   (YOLO format .txt per image)
    val/
    test/
  fabric_labels.csv   (image_path, fabric_type, quality_tier)
  dataset.yaml        (YOLO config)
  README.md
```

## Label Format (YOLO)
Each .txt file: one line per object: `class_id cx cy w h` (normalised 0-1)

Example: `0 0.512 0.634 0.341 0.589`  (jacket, centred-x, centred-y, width, height)

## Augmentation Strategy
Applied during training (Albumentations):
- Random horizontal flip
- Random brightness/contrast (+/-30%)
- Random hue/saturation shift (simulate lighting: ambient, dim, glare)
- Random rotation (-15 to +15 deg)
- Gaussian blur (kernel 3-7, simulate motion/defocus)
- Cutout (2 patches, 20% size) - occlusion robustness
- Mosaic (YOLOv8 built-in) for small-object training

## Lighting Conditions Represented
- Ambient mall light (fluorescent overhead)
- Dim/evening (ISO pushed, grain added via augmentation)
- Glare (highlight saturation augmentation)

## Placeholder Dataset
Until team images are available: use FASHION-MNIST + DeepFashion2 (subset, publicly licensed).
Instructions in ml/scripts/download_placeholder_data.py.
Replace with team images by dropping them in ml/dataset/images/ and re-running ml/scripts/prepare_dataset.py.

## Fabric Texture Note (Proposal Issue #4 fix)
"Fabric grade" is precisely defined above. The label set is small, documented, and justified by
texture discriminability via LBP/GLCM. Do not claim per-thread-count analysis - that is out of scope.