"""
Spectrogram Serialization and Compression Service
Formats STFT matrix into lightweight JSON payloads optimized for high-speed WebSocket transmission.
"""
import numpy as np
from typing import Dict, Any, List
from scipy.ndimage import zoom

class SpectrogramService:
    def format_for_transmission(
        self,
        f: np.ndarray,
        t: np.ndarray,
        spec_norm: np.ndarray,
        target_shape: tuple = (64, 32)
    ) -> Dict[str, Any]:
        """
        Downsamples the normalized STFT spectrogram to target_shape (freq_bins, time_bins)
        and rounds values to 2 decimals for ultra-low latency WebSocket serialization.
        """
        # Original shapes
        curr_freq_len, curr_time_len = spec_norm.shape
        
        # Calculate zoom factors if downsampling is needed
        if (curr_freq_len, curr_time_len) != target_shape:
            scale_f = target_shape[0] / curr_freq_len
            scale_t = target_shape[1] / curr_time_len
            downsampled = zoom(spec_norm, (scale_f, scale_t), order=1)
            # Clip between 0 and 1
            downsampled = np.clip(downsampled, 0.0, 1.0)
            
            # Interpolate frequency and time bins
            f_resampled = np.linspace(f[0], f[-1], target_shape[0])
            t_resampled = np.linspace(t[0], t[-1], target_shape[1])
        else:
            downsampled = spec_norm
            f_resampled = f
            t_resampled = t

        # Convert to rounded list of lists
        matrix = [[round(float(val), 2) for val in row] for row in downsampled]
        time_bins = [round(float(val), 3) for val in t_resampled]
        freq_bins = [round(float(val), 1) for val in f_resampled]

        return {
            "time_bins": time_bins,
            "freq_bins": freq_bins,
            "matrix": matrix,
            "sample_rate_hz": 2000,
            "nfft": 256,
            "window": "hann"
        }

spectrogram_service = SpectrogramService()
