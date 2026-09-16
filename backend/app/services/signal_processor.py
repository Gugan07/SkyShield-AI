"""
Signal Processing Engine for Micro-Doppler FMCW Radar
Performs Short-Time Fourier Transform (STFT), windowing, log magnitude conversion,
spectrogram normalization, and micro-Doppler feature extraction.
"""
import numpy as np
from scipy import signal
from typing import Dict, Any, Tuple
from app.core.config import settings

class SignalProcessor:
    def __init__(
        self,
        fs: int = settings.RADAR_SAMPLING_RATE_HZ,
        nperseg: int = settings.STFT_WINDOW_SIZE,
        noverlap: int = settings.STFT_OVERLAP_SIZE,
        nfft: int = settings.STFT_NFFT,
        window: str = "hann"
    ):
        self.fs = fs
        self.nperseg = nperseg
        self.noverlap = noverlap
        self.nfft = nfft
        self.window = window

    def compute_stft(
        self,
        raw_signal: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Calculates the centered two-sided STFT of the baseband radar signal.
        Returns:
            f: Frequency bins (Hz), centered [-fs/2, fs/2]
            t: Time bins (seconds)
            spec_db: Log-magnitude spectrogram in dB (centered)
            spec_norm: Normalized [0, 1] spectrogram matrix
        """
        # Preprocessing: Remove DC bias and detrend
        x = raw_signal - np.mean(raw_signal)
        
        # Guard against short signals where len(x) < nperseg
        actual_nperseg = min(self.nperseg, len(x))
        actual_noverlap = min(self.noverlap, int(actual_nperseg * 0.75))
        actual_nfft = max(self.nfft, actual_nperseg)
        
        # Calculate two-sided STFT
        f, t, Zxx = signal.stft(
            x,
            fs=self.fs,
            window=self.window,
            nperseg=actual_nperseg,
            noverlap=actual_noverlap,
            nfft=actual_nfft,
            return_onesided=False,
            boundary='zeros',
            padded=True
        )
        
        # Center Doppler frequencies around 0 Hz (zero-Doppler)
        f_centered = np.fft.fftshift(f)
        Zxx_centered = np.fft.fftshift(Zxx, axes=0)
        
        # Magnitude
        mag = np.abs(Zxx_centered)
        
        # Convert to dB with floor protection
        spec_db = 20.0 * np.log10(mag + 1e-6)
        
        # Dynamic range normalization (focus on top 45 dB)
        max_db = np.max(spec_db)
        min_db = max_db - 45.0
        clipped = np.clip(spec_db, min_db, max_db)
        
        # Normalize to [0.0, 1.0]
        spec_norm = (clipped - min_db) / (max_db - min_db + 1e-6)
        
        return f_centered, t, spec_db, spec_norm

    def extract_features(
        self,
        f: np.ndarray,
        t: np.ndarray,
        spec_norm: np.ndarray,
        raw_signal: np.ndarray
    ) -> Dict[str, float]:
        """
        Extracts distinctive micro-Doppler discriminative features:
        - Spectral centroid
        - Spectral bandwidth / spread
        - Harmonic energy ratio (drone propeller harmonics vs bird body)
        - Modulation periodicity via temporal autocorrelation
        - Micro-Doppler peak frequency excursion
        """
        # Temporal energy slice
        temporal_energy = np.mean(spec_norm, axis=0)
        
        # Frequency power spectrum across all time slices
        power_spectrum = np.mean(spec_norm, axis=1)
        total_p = np.sum(power_spectrum) + 1e-9
        
        # Peak frequency (bulk Doppler carrier of the target's body)
        peak_idx = int(np.argmax(power_spectrum))
        f_carrier = f[peak_idx]
        delta_f = np.abs(f - f_carrier)
        
        # 1. Spectral Centroid (Hz relative to carrier)
        spectral_centroid = float(np.sum(delta_f * power_spectrum) / total_p)
        
        # 2. Spectral Bandwidth (Hz)
        variance = np.sum(((delta_f - spectral_centroid) ** 2) * power_spectrum) / total_p
        spectral_bandwidth = float(np.sqrt(max(variance, 0.0)))
        
        # 3. Peak Doppler Spread (Hz): span of active micro-Doppler sidebands above 60% of peak
        threshold = 0.60 * np.max(power_spectrum)
        active_bins = delta_f[power_spectrum > threshold]
        peak_spread = float(np.max(active_bins)) if len(active_bins) > 0 else 0.0
        
        # 4. Harmonic Energy Ratio (normalized average PSD far from carrier > 60 Hz vs near carrier < 35 Hz)
        high_freq_mask = delta_f > 60.0
        low_freq_mask = delta_f < 35.0
        psd_high = float(np.mean(power_spectrum[high_freq_mask])) if np.any(high_freq_mask) else 0.0
        psd_low = float(np.mean(power_spectrum[low_freq_mask])) if np.any(low_freq_mask) else 1e-6
        harmonic_ratio = float(psd_high / psd_low)
        
        # 5. Modulation Frequency via Autocorrelation of temporal energy
        mod_freq = 0.0
        if len(temporal_energy) > 4:
            acorr = np.correlate(temporal_energy - np.mean(temporal_energy),
                                 temporal_energy - np.mean(temporal_energy),
                                 mode='full')
            acorr = acorr[len(acorr)//2:]
            # Find peak lag (skip lag 0)
            if len(acorr) > 2:
                peak_lag = np.argmax(acorr[1:]) + 1
                dt = t[1] - t[0] if len(t) > 1 else 0.02
                if peak_lag > 0 and dt > 0:
                    mod_freq = float(1.0 / (peak_lag * dt))
        
        # 6. Temporal variance of envelope
        temporal_var = float(np.var(temporal_energy))

        return {
            "spectral_centroid_hz": round(spectral_centroid, 1),
            "spectral_bandwidth_hz": round(spectral_bandwidth, 1),
            "harmonic_energy_ratio": round(harmonic_ratio, 3),
            "modulation_frequency_hz": round(min(mod_freq, 400.0), 1),
            "peak_doppler_spread_hz": round(peak_spread, 1),
            "temporal_variance": round(temporal_var, 4)
        }

signal_processor = SignalProcessor()
