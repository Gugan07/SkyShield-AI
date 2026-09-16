"""
CNN Inference Engine for Micro-Doppler Classification
Loads PyTorch weights if available; returns class probabilities.
"""
import os
import numpy as np
from typing import Dict, Any, Optional
from app.ml.cnn_model import TORCH_AVAILABLE, MicroDopplerCNN
from app.ml.preprocessing import preprocess_spectrogram_for_cnn
from app.core.config import settings

class CNNInferenceEngine:
    def __init__(self, weights_path: Optional[str] = None):
        self.weights_path = weights_path or settings.MODEL_WEIGHTS_PATH
        self.model = None
        self.is_ready = False
        self._load_model()

    def _load_model(self):
        if not TORCH_AVAILABLE:
            self.is_ready = False
            return
        
        if os.path.exists(self.weights_path):
            try:
                import torch
                self.model = MicroDopplerCNN(num_classes=3)
                self.model.load_state_dict(torch.load(self.weights_path, map_location=torch.device('cpu')))
                self.model.eval()
                self.is_ready = True
            except Exception as e:
                self.is_ready = False
        else:
            self.is_ready = False

    def predict(self, spec_norm: np.ndarray) -> Optional[Dict[str, float]]:
        """
        Runs CNN forward pass on normalized spectrogram.
        Returns dictionary of probabilities: {"drone": ..., "bird": ..., "unknown": ...}
        """
        if not self.is_ready or not TORCH_AVAILABLE or self.model is None:
            return None
            
        import torch
        tensor_np = preprocess_spectrogram_for_cnn(spec_norm)
        tensor = torch.from_numpy(tensor_np)
        
        with torch.no_grad():
            output = self.model(tensor)
            probs = output.squeeze().cpu().numpy()
            
        return {
            "drone": round(float(probs[0]), 4),
            "bird": round(float(probs[1]), 4),
            "unknown": round(float(probs[2]), 4)
        }

cnn_engine = CNNInferenceEngine()
