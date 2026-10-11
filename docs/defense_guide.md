# CATCH – Capstone Defense Guide & Examiner Q&A Cheat Sheet

**Audience**: The 3 student team members presenting and defending CATCH.  
**Objective**: Clear, authoritative answers to anticipated examiner questions and a flawless 5-minute live demonstration script.

---

## 1. Quick Project Elevator Pitch (30 seconds)
> *"CATCH is an agentic retail assistant that connects physical mall shoppers with hyper-local promotions. Instead of forcing users to manually search coupon aggregators filled with expired codes, CATCH lets a shopper point their smartphone camera at an item. Our three-tier hybrid edge-cloud pipeline recognises the product category, performs micro-texture fabric analysis on apparel, aggregates live nearby store prices and promotions, calculates the maximum net savings, and proactively pushes the best deal in under 500 milliseconds."*

---

## 2. Key Architecture Decisions to Defend

### Why Hybrid Edge-Cloud instead of 100% on-device or 100% cloud?
- **Edge responsibility**: Frame capture, blur detection (Laplacian variance), resizing, and JPEG Q85 compression. This reduces network payload from ~12MB raw down to ~240KB, conserving mobile battery and bandwidth.
- **Cloud responsibility**: Heavy neural network inference (YOLOv8 detection, MobileNetV3 embeddings) and mathematical texture feature extraction (GLCM, LBP, FFT). Mid-range phones cannot sustain continuous local YOLO execution without thermal throttling.
- **Result**: Consistent sub-second response (~412 ms p50) across both Android and iOS devices.

### Why OpenCV Texture Analysis alongside Deep Learning?
- Deep neural networks trained on casual imagery often rely on macro-level shapes and silhouettes rather than fine weave structure.
- By extracting mathematical descriptors (Gray-Level Co-occurrence Matrix energy/contrast, Local Binary Patterns, and 2D Fourier periodicity), CATCH explicitly measures thread count regularity and roughness, distinguishing genuine denim, wool, polyester, and cotton.

---

## 3. Defense of Known Proposal Issues (Crucial for Examiners!)

### Issue 1: Citation Correction for YOLOv9 vs YOLOv8
- **Examiner Question**: *"Your initial proposal cited Redmon & Farhadi for YOLOv9 in CVPR 2024. Can you clarify?"*
- **Team Answer**: *"We identified an error in the original proposal citation [13]. Joseph Redmon and Ali Farhadi were the foundational authors of YOLOv1 through YOLOv3. YOLOv9 (2024) is authored by Chien-Yao Wang, I-Hau Yeh, and Hong-Yuan Mark Liao. In CATCH, we deliberately selected **YOLOv8 by Ultralytics (Jocher et al.)** due to its mature export pipeline, ONNX runtime efficiency, and lightweight anchor-free architecture optimized for edge-cloud retail detection."*

### Issue 2: Scrape POS Systems vs Legal & Technical Reality
- **Examiner Question**: *"How do you scrape retail Point-of-Sale (POS) systems legally and technically?"*
- **Team Answer**: *"Real-world POS systems operate on closed proprietary networks (e.g. NCR, Oracle MICROS) with zero public HTTP access and strict PCI-DSS constraints. Direct POS scraping is both technically impossible without hardware taps and legally precarious. CATCH solves this through a dual-channel hybrid model:
  1. Automated scraping of public retailer storefront pages and online inventory portals.
  2. A clean, authenticated Merchant REST API (`POST /api/v1/merchant/submit`) with an extensible `StoreConnector` interface. Stores push inventory deltas in real-time without modifying closed POS terminals."*

### Issue 3: Fabric "Grade" Definition
- **Examiner Question**: *"How do you define fabric 'grade' without specialized spectroscopy?"*
- **Team Answer**: *"We established a formal, objective definition:
  - **Category**: 5 mutually exclusive textile classes (*cotton, polyester, denim, wool, blend*).
  - **Quality Tier**: Binary classification (*Standard vs. Premium*).
  - **Metric Basis**: GLCM Homogeneity and Energy measure weave regularity and thread count density. High GLCM energy (>0.4) combined with low contrast (<30) indicates a tightly woven, uniform weave characteristic of premium combed cotton or fine wool, whereas loose, irregular weaves map to standard tier."*

### Issue 4: Virtual Try-On Scope
- **Examiner Question**: *"Is your virtual try-on full 3D photorealistic neural rendering?"*
- **Team Answer**: *"No. As scoped in Milestone M3/M5, CATCH implements an **AR-ready lightweight 2D viewport overlay** with calibrated landmark tracking anchors in the Chrome extension and mobile app. Full 3D generative diffusion try-on requires high-end server GPUs and 5–15 seconds per frame, which directly conflicts with our low-latency, real-time in-store assistance mandate."*

---

## 4. 5-Minute Live Demo Script

| Time | Presenter Action | System Feedback | Speaking Points |
|---|---|---|---|
| **0:00 - 0:45** | Introduce problem & show mobile scanner UI | Camera screen active with green viewfinder | *"Shoppers in malls suffer from coupon fatigue and isolated store inventories. Here is CATCH running on mobile."* |
| **0:45 - 1:45** | Capture sample apparel image (Wool Jacket) | Recognition card pops up: `Apparel / Jacket`, Confidence: 89%, Fabric: `Wool / Premium` | *"In under 400ms, the cloud pipeline detected the jacket, extracted weave texture, and confirmed 89% confidence."* |
| **1:45 - 2:45** | Proactive deal push notification appears | Notification: *"Best deal: Zara Mall Store - Save $35 (25% off)"* | *"Notice the shopper didn't search! The proactive discount engine filtered expired coupons and ranked the best net saving."* |
| **2:45 - 3:45** | Switch to Chrome Extension on a retail site | Floating CATCH pill detects product & price | *"Our companion extension does the same on desktop. Injects instant savings and an AR Try-On preview without leaving the page."* |
| **3:45 - 5:00** | Open Merchant Portal / API & show benchmark dashboard | Terminal / Swagger docs showing live metrics | *"Our hybrid merchant connector accepts direct stock feeds, and our automated benchmarks verify sub-second p95 latency."* |

---

## 5. Team Member Presentation Roles

- **Student 1 (Edge & Mobile Lead)**: Demonstrates Expo camera scanning, blur heuristic, FCM notification handling, and Chrome MV3 extension.
- **Student 2 (AI & Computer Vision Lead)**: Explains YOLOv8 object detection, confidence thresholding (>= 0.7), and OpenCV GLCM/LBP texture analysis.
- **Student 3 (Backend & Logic Lead)**: Explains MongoDB inventory schema, discount engine net-savings math, ranking algorithm, and merchant submission API.
