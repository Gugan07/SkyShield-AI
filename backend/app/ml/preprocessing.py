"""
Preprocessing Pipeline for Micro-Doppler Spectrograms
Prepares 2D STFT spectrogram matrices for CNN inference or training (224x224x1).
"""
import numpy as np
from scipy.ndimage import zoom

def preprocess_spectrogram_for_cnn(
    spec_norm: np.ndarray,
    target_shape: tuple = (224, 224)
) -> np.ndarray:
    """
    Interpolates spectrogram to (224, 224), normalizes to [0.0, 1.0],
    and expands dimensions to (1, 1, 224, 224) for PyTorch/CNN batch input.
    """
    h, w = spec_norm.shape
    zoom_factors = (target_shape[0] / h, target_shape[1] / w)
    resized = zoom(spec_norm, zoom_factors, order=1)
    
    # Clip and normalize
    resized = np.clip(resized, 0.0, 1.0).astype(np.float32)
    
    # Add batch and channel dimensions: (1, 1, 224, 224)
    tensor_input = np.expand_dims(np.expand_dims(resized, axis=0), axis=0)
    return tensor_input
