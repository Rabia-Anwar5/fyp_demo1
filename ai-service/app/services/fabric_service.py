"""
Fabric texture analysis service.

Uses OpenCV-based feature extraction:
  - LBP (Local Binary Patterns) - texture microstructure
  - GLCM (Gray-Level Co-occurrence Matrix) - statistical texture (energy, contrast, homogeneity)
  - Gabor filter bank - orientation and frequency analysis
  - FFT magnitude spectrum - weave pattern periodicity

A lightweight sklearn classifier (or threshold rules for MVP) maps features -> fabric type + quality tier.

References:
  Ojala et al. (2002) - Multiresolution gray-scale and rotation invariant LBP
  Haralick et al. (1973) - GLCM texture features
"""
import time
import logging
import pickle
from pathlib import Path
from typing import Optional, Tuple, Dict

import numpy as np

try:
    import cv2
except ImportError:
    cv2 = None

try:
    from skimage.feature import local_binary_pattern, graycomatrix, graycoprops
except ImportError:
    local_binary_pattern = None
    graycomatrix = None
    graycoprops = None

from ..core.config import settings
from ..core.logging import logger

_fabric_model = None
_fabric_model_loaded = False

FABRIC_LABELS = ["cotton", "polyester", "denim", "wool", "blend"]
QUALITY_LABELS = ["standard", "premium"]


def load_fabric_model():
    global _fabric_model, _fabric_model_loaded
    try:
        p = Path(settings.FABRIC_MODEL_WEIGHTS)
        if p.exists():
            with open(p, "rb") as f:
                _fabric_model = pickle.load(f)
            _fabric_model_loaded = True
            logger.info("Fabric classifier loaded", path=str(p))
        else:
            logger.warning("Fabric model weights not found, using threshold rules", path=str(p))
            _fabric_model_loaded = False
    except Exception as e:
        logger.error("Failed to load fabric model", error=str(e))
        _fabric_model_loaded = False


def _numpy_lbp(gray: np.ndarray) -> np.ndarray:
    h, w = gray.shape
    center = gray[1:h-1, 1:w-1]
    lbp = np.zeros((h-2, w-2), dtype=np.uint8)
    shifts = [(-1,-1), (-1,0), (-1,1), (0,1), (1,1), (1,0), (1,-1), (0,-1)]
    for bit, (dy, dx) in enumerate(shifts):
        neighbor = gray[1+dy:h-1+dy, 1+dx:w-1+dx]
        lbp |= ((neighbor >= center).astype(np.uint8) << bit)
    return lbp


def extract_texture_features(roi: np.ndarray) -> Dict[str, float]:
    """
    Extract LBP, GLCM, Gabor and FFT features from a BGR or RGB image ROI.
    Returns a flat feature dict for logging and classification.
    """
    # Convert to grayscale
    if len(roi.shape) == 3:
        if cv2 is not None:
            gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
        else:
            gray = (0.299 * roi[:, :, 0] + 0.587 * roi[:, :, 1] + 0.114 * roi[:, :, 2]).astype(np.uint8)
    else:
        gray = roi.copy()

    # Resize to standardized 128x128
    if gray.shape != (128, 128):
        if cv2 is not None:
            gray = cv2.resize(gray, (128, 128))
        else:
            # Simple slicing / nearest-neighbor resize
            r_idx = np.linspace(0, gray.shape[0] - 1, 128).astype(int)
            c_idx = np.linspace(0, gray.shape[1] - 1, 128).astype(int)
            gray = gray[np.ix_(r_idx, c_idx)]

    features: Dict[str, float] = {}

    # --- LBP ---
    try:
        if local_binary_pattern is not None:
            lbp = local_binary_pattern(gray, P=8, R=1, method="uniform")
            n_bins = 10
            hist, _ = np.histogram(lbp.ravel(), bins=n_bins, range=(0, n_bins), density=True)
            for i, v in enumerate(hist):
                features[f"lbp_bin_{i}"] = float(v)
            features["lbp_mean"] = float(lbp.mean())
            features["lbp_std"] = float(lbp.std())
        else:
            lbp = _numpy_lbp(gray)
            features["lbp_mean"] = float(lbp.mean())
            features["lbp_std"] = float(lbp.std())
            hist, _ = np.histogram(lbp.ravel(), bins=10, range=(0, 256), density=True)
            for i, v in enumerate(hist):
                features[f"lbp_bin_{i}"] = float(v)
    except Exception as e:
        logger.warning("LBP extraction failed", error=str(e))

    # --- GLCM ---
    try:
        if graycomatrix is not None and graycoprops is not None:
            glcm = graycomatrix(gray, distances=[1, 3], angles=[0, np.pi/4, np.pi/2],
                                levels=256, symmetric=True, normed=True)
            for prop in ("contrast", "dissimilarity", "homogeneity", "energy", "correlation"):
                val = graycoprops(glcm, prop).mean()
                features[f"glcm_{prop}"] = float(val)
        else:
            # Vectorized GLCM approximation
            q = (gray >> 4).astype(np.float32)
            d_x = np.abs(q[:, 1:] - q[:, :-1])
            d_y = np.abs(q[1:, :] - q[:-1, :])
            features["glcm_contrast"] = float(np.mean(d_x**2) + np.mean(d_y**2))
            features["glcm_dissimilarity"] = float(np.mean(d_x) + np.mean(d_y))
            features["glcm_homogeneity"] = float(np.mean(1.0 / (1.0 + d_x)) + np.mean(1.0 / (1.0 + d_y))) / 2.0
            features["glcm_energy"] = float(1.0 / (1.0 + np.var(q)))
            features["glcm_correlation"] = 0.5
    except Exception as e:
        logger.warning("GLCM extraction failed", error=str(e))

    # --- Gabor bank ---
    try:
        if cv2 is not None:
            gabor_responses = []
            for theta in [0, np.pi/4, np.pi/2, 3*np.pi/4]:
                for freq in [0.1, 0.3]:
                    kern = cv2.getGaborKernel((21, 21), 5, theta, 1/freq, 0.5, 0)
                    filtered = cv2.filter2D(gray, cv2.CV_32F, kern)
                    gabor_responses.append(filtered.mean())
                    gabor_responses.append(filtered.var())
            for i, v in enumerate(gabor_responses):
                features[f"gabor_{i}"] = float(v)
        else:
            features["gabor_0"] = float(np.mean(gray))
            features["gabor_1"] = float(np.var(gray))
    except Exception as e:
        logger.warning("Gabor extraction failed", error=str(e))

    # --- FFT periodicity ---
    try:
        fft = np.fft.fft2(gray.astype(np.float32))
        fft_shift = np.fft.fftshift(fft)
        magnitude = np.log1p(np.abs(fft_shift))
        features["fft_mean"] = float(magnitude.mean())
        features["fft_std"] = float(magnitude.std())
        features["fft_max"] = float(magnitude.max())
    except Exception as e:
        logger.warning("FFT extraction failed", error=str(e))

    return features


def _threshold_classify(features: Dict[str, float]) -> Tuple[str, str, float]:
    """
    Fallback rule-based classifier when trained model is not available.
    Uses GLCM energy (smoothness) and LBP std (roughness) as heuristics.
    Document clearly: these thresholds are provisional, not trained.
    """
    energy = features.get("glcm_energy", 0.5)
    lbp_std = features.get("lbp_std", 5.0)
    contrast = features.get("glcm_contrast", 50.0)

    # Quality tier: high energy + low contrast -> tight weave -> premium
    quality = "premium" if (energy > 0.4 and contrast < 30) else "standard"

    # Fabric type heuristics (very rough; replace with trained classifier ASAP)
    if contrast > 80 and lbp_std > 7:
        fabric = "denim"
    elif energy > 0.5 and lbp_std < 4:
        fabric = "polyester"
    elif lbp_std > 6 and contrast < 50:
        fabric = "wool"
    elif energy > 0.3:
        fabric = "cotton"
    else:
        fabric = "blend"

    confidence = 0.60  # provisional; trained model will produce calibrated probabilities
    return fabric, quality, confidence


async def analyse_fabric(image_rgb: np.ndarray, bounding_box: Optional[dict] = None) -> dict:
    """
    Analyse fabric texture within the detected bounding box region.
    Returns fabric type, quality tier, confidence, and raw features for logging.
    """
    t0 = time.perf_counter()

    # Crop to bounding box if provided
    if bounding_box:
        h, w = image_rgb.shape[:2]
        x1 = int(bounding_box["x1"] * w)
        y1 = int(bounding_box["y1"] * h)
        x2 = int(bounding_box["x2"] * w)
        y2 = int(bounding_box["y2"] * h)
        roi = image_rgb[max(0,y1):min(h,y2), max(0,x1):min(w,x2)]
    else:
        roi = image_rgb

    if roi.size == 0:
        roi = image_rgb

    features = extract_texture_features(roi)

    if _fabric_model_loaded and _fabric_model is not None:
        try:
            feat_vec = np.array(list(features.values())).reshape(1, -1)
            fabric_pred = _fabric_model.predict(feat_vec)[0]
            prob = _fabric_model.predict_proba(feat_vec).max()
            # Quality tier: separate model or threshold (MVP uses threshold)
            _, quality, _ = _threshold_classify(features)
            fabric_type = fabric_pred
            confidence = float(prob)
        except Exception as e:
            logger.warning("Trained fabric model failed, falling back to rules", error=str(e))
            fabric_type, quality, confidence = _threshold_classify(features)
    else:
        fabric_type, quality, confidence = _threshold_classify(features)

    elapsed = (time.perf_counter() - t0) * 1000

    return {
        "type": fabric_type,
        "quality_tier": quality,
        "confidence": round(confidence, 4),
        "features": {k: round(v, 4) for k, v in list(features.items())[:10]},  # log top-10 only
        "analysis_ms": round(elapsed, 2),
    }