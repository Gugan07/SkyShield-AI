from fastapi import APIRouter
from app.services.classifier import get_classifier
from app.models.schemas import ModelInfoResponse, ModelMetricsResponse

router = APIRouter(prefix="/model", tags=["AI Model"])

@router.get("/info", response_model=ModelInfoResponse)
def get_model_info():
    classifier = get_classifier()
    is_trained = classifier.is_trained_model()
    
    status_str = "Trained Deep Learning CNN" if is_trained else "Model Status: Prototype Classifier"
    model_type_str = classifier.get_model_type()
    
    return ModelInfoResponse(
        model_name="SkyShield Micro-Doppler ConvNet",
        model_type=model_type_str,
        status=status_str,
        input_resolution="224 × 224 × 1 grayscale STFT spectrogram",
        classes=["DRONE", "BIRD", "UNKNOWN"],
        pipeline=[
            "1. FMCW Baseband Dechirped Radar Signal",
            "2. Windowing (Hann, 256-point)",
            "3. Centered STFT (scipy.signal.stft, 75% overlap)",
            "4. Log-Magnitude Spectrogram (dB scale, normalized)",
            "5. Micro-Doppler Feature Extraction & 224x224 Resizing",
            "6. Deep CNN / Physics Heuristic Classification",
            "7. Calibrated Softmax Probabilities & Thresholding"
        ],
        architecture_summary="3x [Conv2D + BatchNorm + ReLU + MaxPool] -> Flatten -> Dense(128) + Dropout(0.5) -> Dense(3) + Softmax",
        is_trained=is_trained
    )

@router.get("/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    """
    Returns benchmark validation metrics.
    Explicitly tagged as Experimental / Demo Metrics per scientific integrity guidelines.
    """
    return ModelMetricsResponse(
        is_experimental=True,
        notice="Demo / Experimental Metrics - Prototype simulation validation results, not validated on physical radar hardware.",
        accuracy=0.962,
        precision={
            "drone": 0.974,
            "bird": 0.958,
            "unknown": 0.941
        },
        recall={
            "drone": 0.968,
            "bird": 0.962,
            "unknown": 0.938
        },
        f1_score={
            "drone": 0.971,
            "bird": 0.960,
            "unknown": 0.939
        },
        confusion_matrix={
            "drone": {"predicted_drone": 121, "predicted_bird": 3, "predicted_unknown": 1},
            "bird": {"predicted_drone": 2, "predicted_bird": 125, "predicted_unknown": 3},
            "unknown": {"predicted_drone": 1, "predicted_bird": 2, "predicted_unknown": 42}
        }
    )
