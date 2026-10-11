# CATCH Evaluation Report (Template)

Fill in real numbers after training. Never fabricate results.

## Product Detection (YOLOv8)

| Metric | Value | Notes |
|---|---|---|
| Precision | TBD | averaged over all classes |
| Recall | TBD | |
| mAP@0.5 | TBD | |
| mAP@0.5:0.95 | TBD | |
| Inference time (GPU) | TBD ms | |
| Inference time (CPU) | TBD ms | |

### Per-class mAP@0.5
| Class | AP |
|---|---|
| jacket | TBD |
| shirt | TBD |
| ... | TBD |

### Confusion Matrix
[Insert confusion matrix image here]

## Fabric Classification (MobileNetV3 + OpenCV features)

| Metric | Value |
|---|---|
| Accuracy | TBD |
| F1 (macro) | TBD |
| F1 (weighted) | TBD |

### Per-condition accuracy
| Lighting | Accuracy |
|---|---|
| Ambient mall | TBD |
| Dim | TBD |
| Glare | TBD |

## End-to-End Latency (RQ1)

Test device: [specify phone model, OS version, network]
| Percentile | Latency |
|---|---|
| p50 | TBD ms |
| p95 | TBD ms |

Breakdown: compression [ms] + upload [ms] + yolo [ms] + mobilenet [ms] + fabric [ms] + logic [ms]

## Deal Discovery (RQ3)

| Metric | Value |
|---|---|
| Avg time-to-deal (CATCH) | TBD s |
| Avg time-to-deal (manual) | TBD s |
| Match rate (correct category -> deal) | TBD % |
| False positive rate | TBD % |

## Scraper Reliability (RQ4)

| Metric | Value |
|---|---|
| Avg scrape freshness | TBD min |
| Error rate per source | TBD % |
| Merchant submission coverage | TBD stores |