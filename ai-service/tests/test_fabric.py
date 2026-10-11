"""Unit tests for fabric texture analysis."""
import numpy as np
import pytest
from app.services.fabric_service import extract_texture_features, _threshold_classify


def make_uniform_image(h=128, w=128, val=128):
    return np.full((h, w, 3), val, dtype=np.uint8)


def make_noisy_image(h=128, w=128):
    rng = np.random.default_rng(42)
    return rng.integers(0, 255, (h, w, 3), dtype=np.uint8)


def test_extract_texture_features_returns_dict():
    img = make_uniform_image()
    features = extract_texture_features(img)
    assert isinstance(features, dict)
    assert len(features) > 0


def test_extract_texture_features_has_expected_keys():
    img = make_noisy_image()
    features = extract_texture_features(img)
    expected_keys = ["glcm_energy", "glcm_contrast", "lbp_std"]
    for k in expected_keys:
        assert k in features, f"Missing key: {k}"


def test_threshold_classify_returns_valid_labels():
    features = {"glcm_energy": 0.5, "lbp_std": 3.0, "glcm_contrast": 20.0}
    fabric, quality, conf = _threshold_classify(features)
    assert fabric in ("cotton", "polyester", "denim", "wool", "blend")
    assert quality in ("standard", "premium")
    assert 0.0 <= conf <= 1.0


def test_threshold_classify_high_energy_low_contrast_is_premium():
    features = {"glcm_energy": 0.6, "lbp_std": 3.0, "glcm_contrast": 15.0}
    _, quality, _ = _threshold_classify(features)
    assert quality == "premium"


def test_threshold_classify_low_energy_high_contrast_is_standard():
    features = {"glcm_energy": 0.2, "lbp_std": 8.0, "glcm_contrast": 90.0}
    _, quality, _ = _threshold_classify(features)
    assert quality == "standard"