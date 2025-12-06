"""
Inference Service Module for Bank Lead Scoring

Modul ini bertanggung jawab penuh untuk:
1. Load model artifacts dari disk
2. Menjalankan pipeline inference (feature engineering → encoding → scaling → prediction → SHAP)

Modul ini TIDAK mengandung logic HTTP/API. Semua error handling dilakukan via exceptions.
"""

import pickle
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


# =============================================================================
# LOGGING SETUP
# =============================================================================
logger = logging.getLogger(__name__)


# =============================================================================
# CUSTOM EXCEPTIONS
# =============================================================================
class InferenceError(Exception):
    """Exception untuk error yang terjadi selama pipeline inference."""
    pass


# =============================================================================
# ARTIFACTS DATACLASS
# =============================================================================
@dataclass
class Artifacts:
    """Container untuk semua model artifacts."""
    model: Any
    preprocessor: Any
    label_encoders: dict
    feature_names: list
    shap_explainer: Any


# =============================================================================
# CONSTANTS
# =============================================================================
REQUIRED_INPUT_FIELDS = [
    "age", "job", "marital", "education", "default", "balance",
    "housing", "loan", "contact", "day", "month",
    "campaign", "pdays", "previous", "poutcome"
]

MONTH_TO_SEASON = {
    'jan': 'winter', 'feb': 'winter', 'mar': 'spring',
    'apr': 'spring', 'may': 'spring', 'jun': 'summer',
    'jul': 'summer', 'aug': 'summer', 'sep': 'fall',
    'oct': 'fall', 'nov': 'fall', 'dec': 'winter'
}

AGE_BINS = [0, 25, 35, 50, 65, 100]
AGE_LABELS = ['young', 'adult', 'middle', 'senior', 'elderly']

CAMPAIGN_BINS = [0, 1, 3, 5, 100]
CAMPAIGN_LABELS = ['low', 'medium', 'high', 'very_high']


# =============================================================================
# LOAD ARTIFACTS
# =============================================================================
def load_artifacts(artifacts_dir: str = "./artifacts") -> Artifacts:
    """
    Load semua model artifacts dari disk.
    
    Fungsi ini dipanggil SEKALI saat startup service.
    
    Parameters
    ----------
    artifacts_dir : str
        Path ke folder yang berisi file-file pickle artifacts.
        Default: "./artifacts"
    
    Returns
    -------
    Artifacts
        Dataclass berisi semua artifacts yang sudah di-load.
    
    Raises
    ------
    FileNotFoundError
        Jika salah satu file artifact tidak ditemukan.
    """
    artifacts_path = Path(artifacts_dir)
    
    artifact_files = {
        "model": "CatBoost_calibrated_model.pkl",
        "preprocessor": "preprocessor.pkl",
        "label_encoders": "label_encoders.pkl",
        "feature_names": "feature_names.pkl",
        "shap_explainer": "shap_explainer.pkl",
    }
    
    loaded = {}
    
    for name, filename in artifact_files.items():
        filepath = artifacts_path / filename
        if not filepath.exists():
            raise FileNotFoundError(f"Artifact file not found: {filepath}")
        
        logger.info(f"Loading {name} from {filepath}")
        with open(filepath, "rb") as f:
            loaded[name] = pickle.load(f)
    
    logger.info("All artifacts loaded successfully")
    
    return Artifacts(
        model=loaded["model"],
        preprocessor=loaded["preprocessor"],
        label_encoders=loaded["label_encoders"],
        feature_names=loaded["feature_names"],
        shap_explainer=loaded["shap_explainer"],
    )


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def _validate_input(input_dict: dict) -> None:
    """
    Validasi bahwa semua required fields ada di input.
    
    Raises
    ------
    ValueError
        Jika ada field yang missing.
    """
    missing_fields = [f for f in REQUIRED_INPUT_FIELDS if f not in input_dict]
    
    if missing_fields:
        raise ValueError(f"Missing required fields: {missing_fields}")


def _apply_feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply feature engineering transformations.
    
    Transformasi yang dilakukan (konsisten dengan training):
    1. Drop 'duration' jika ada
    2. Buat 'age_group' dari binning 'age'
    3. Buat 'prev_success' dari 'poutcome'
    4. Buat 'campaign_intensity' dari binning 'campaign'
    5. Buat 'season' dari mapping 'month'
    
    Note: 'economic_stability' TIDAK dibuat karena tidak ada di feature_names.
    """
    df = df.copy()
    
    # Drop duration (tidak tersedia saat inference)
    if 'duration' in df.columns:
        df = df.drop('duration', axis=1)
    
    # Age groups
    df['age_group'] = pd.cut(
        df['age'],
        bins=AGE_BINS,
        labels=AGE_LABELS
    )
    
    # Previous contact success (binary)
    df['prev_success'] = (df['poutcome'] == 'success').astype(int)
    
    # Campaign intensity
    df['campaign_intensity'] = pd.cut(
        df['campaign'],
        bins=CAMPAIGN_BINS,
        labels=CAMPAIGN_LABELS
    )
    
    # Season from month
    df['season'] = df['month'].map(MONTH_TO_SEASON)
    
    return df


def _encode_categoricals(df: pd.DataFrame, label_encoders: dict) -> pd.DataFrame:
    """
    Apply label encoding ke semua kolom categorical.
    
    Unknown values yang tidak ada di encoder classes akan di-encode sebagai -1.
    """
    df = df.copy()
    
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    for col in categorical_cols:
        if col in label_encoders:
            le = label_encoders[col]
            # Handle unknown values dengan -1
            df[col] = df[col].astype(str).apply(
                lambda x: le.transform([x])[0] if x in le.classes_ else -1
            )
    
    return df


def _calculate_risk_level(probability: float) -> str:
    """
    Tentukan risk level berdasarkan probability.
    
    Thresholds:
    - Low: probability < 0.3
    - Medium: 0.3 <= probability < 0.6
    - High: probability >= 0.6
    """
    if probability < 0.3:
        return "Low"
    elif probability < 0.6:
        return "Medium"
    else:
        return "High"


def _calculate_reason_codes(
    shap_values: np.ndarray,
    feature_names: list,
    top_n: int = 5
) -> list:
    """
    Extract top N reason codes dari SHAP values.
    
    Returns
    -------
    list of dict
        List berisi top N features dengan format:
        {"feature": str, "direction": "positive"|"negative", "shap_value": float}
    """
    # Get indices sorted by absolute SHAP value (descending)
    top_indices = np.argsort(np.abs(shap_values))[-top_n:][::-1]
    
    reason_codes = []
    for idx in top_indices:
        shap_val = float(shap_values[idx])
        reason_codes.append({
            "feature": feature_names[idx],
            "direction": "positive" if shap_val > 0 else "negative",
            "shap_value": shap_val
        })
    
    return reason_codes


# =============================================================================
# MAIN INFERENCE FUNCTION
# =============================================================================
def run_inference(input_dict: dict, artifacts: Artifacts) -> dict:
    """
    Jalankan inference pipeline untuk single customer input.
    
    Fungsi ini dipanggil SETIAP REQUEST.
    
    Parameters
    ----------
    input_dict : dict
        Dictionary berisi customer data (raw format).
        Required fields: age, job, marital, education, default, balance,
                        housing, loan, contact, day, month, campaign,
                        pdays, previous, poutcome
    artifacts : Artifacts
        Artifacts yang sudah di-load via load_artifacts()
    
    Returns
    -------
    dict
        JSON-serializable dictionary dengan format:
        {
            "probability": float,
            "prediction": int,
            "prediction_label": str,
            "risk_level": str,
            "reason_codes": list[dict]
        }
    
    Raises
    ------
    ValueError
        Jika input tidak valid (missing fields, wrong types).
    InferenceError
        Jika terjadi error dalam pipeline inference.
    """
    # STEP 1: Validate input
    _validate_input(input_dict)
    
    try:
        # STEP 2: Convert dict to DataFrame
        df = pd.DataFrame([input_dict])
        
        # STEP 3: Feature engineering
        df = _apply_feature_engineering(df)
        
        # STEP 4: Label encoding
        df = _encode_categoricals(df, artifacts.label_encoders)
        
        # STEP 5: Reorder columns sesuai feature_names
        df = df[artifacts.feature_names]
        
        # STEP 6: Scaling
        X_scaled = artifacts.preprocessor.transform(df)
        X_scaled_df = pd.DataFrame(X_scaled, columns=artifacts.feature_names)
        
        # STEP 7: Prediction
        probability = float(artifacts.model.predict_proba(X_scaled_df)[0, 1])
        prediction = int(artifacts.model.predict(X_scaled_df)[0])
        
        # STEP 8: Risk level
        risk_level = _calculate_risk_level(probability)
        
        # STEP 9: SHAP reason codes
        shap_values = artifacts.shap_explainer.shap_values(X_scaled_df)
        
        # Handle different SHAP output formats
        if isinstance(shap_values, list):
            # Binary classification: [class_0_values, class_1_values]
            shap_values_single = shap_values[1][0]
        else:
            shap_values_single = shap_values[0]
        
        reason_codes = _calculate_reason_codes(
            shap_values_single,
            artifacts.feature_names,
            top_n=5
        )
        
        # STEP 10: Build result
        result = {
            "probability": probability,
            "prediction": prediction,
            "prediction_label": "yes" if prediction == 1 else "no",
            "risk_level": risk_level,
            "reason_codes": reason_codes
        }
        
        return result
        
    except KeyError as e:
        raise InferenceError(f"Missing feature during inference: {e}")
    except Exception as e:
        logger.exception("Unexpected error during inference")
        raise InferenceError(f"Inference failed: {str(e)}")


# =============================================================================
# EXAMPLE USAGE
# =============================================================================
if __name__ == "__main__":
    """
    Contoh penggunaan modul inference_service.
    
    # 1. Load artifacts (sekali saat startup)
    artifacts = load_artifacts("./artifacts")
    
    # 2. Prepare input data
    example_input = {
        "age": 35,
        "job": "technician",
        "marital": "married",
        "education": "tertiary",
        "default": "no",
        "balance": 1500,
        "housing": "yes",
        "loan": "no",
        "contact": "cellular",
        "day": 15,
        "month": "may",
        "campaign": 2,
        "pdays": -1,
        "previous": 0,
        "poutcome": "unknown"
    }
    
    # 3. Run inference
    result = run_inference(example_input, artifacts)
    
    # 4. Output
    # {
    #     "probability": 0.4523,
    #     "prediction": 0,
    #     "prediction_label": "no",
    #     "risk_level": "Medium",
    #     "reason_codes": [
    #         {"feature": "poutcome", "direction": "negative", "shap_value": -0.234},
    #         {"feature": "month", "direction": "negative", "shap_value": -0.189},
    #         {"feature": "contact", "direction": "positive", "shap_value": 0.156},
    #         {"feature": "balance", "direction": "positive", "shap_value": 0.098},
    #         {"feature": "age_group", "direction": "negative", "shap_value": -0.067}
    #     ]
    # }
    """
    
    # Quick test
    import json
    
    print("Loading artifacts...")
    artifacts = load_artifacts("./artifacts")
    print(f"✓ Model loaded")
    print(f"✓ Feature names: {artifacts.feature_names}")
    
    example_input = {
        "age": 35,
        "job": "technician",
        "marital": "married",
        "education": "tertiary",
        "default": "no",
        "balance": 1500,
        "housing": "yes",
        "loan": "no",
        "contact": "cellular",
        "day": 15,
        "month": "may",
        "campaign": 2,
        "pdays": -1,
        "previous": 0,
        "poutcome": "unknown"
    }
    
    print("\nRunning inference...")
    result = run_inference(example_input, artifacts)
    
    print("\nResult:")
    print(json.dumps(result, indent=2))
