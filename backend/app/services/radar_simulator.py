"""
Physics-Based Radar Signal Simulator for Micro-Doppler Aerial Targets
Generates synthetic baseband radar returns for:
- DRONE: High-frequency periodic propeller blade modulation & harmonics
- BIRD: Low-frequency wing-flapping sinusoidal modulation
- UNKNOWN: Environmental noise, clutter, multipath without periodic micro-Doppler
"""
import numpy as np
import time
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
import random

from app.services.radar_source import RadarDataSource
from app.core.config import settings

class RadarSimulator(RadarDataSource):
    """
    Simulates baseband dechirped FMCW radar slow-time signals for aerial targets.
    Operates at configurable carrier frequency (default 24 GHz K-Band) and PRF.
    """
    def __init__(
        self,
        fc_ghz: float = settings.RADAR_CARRIER_FREQ_GHZ,
        fs_hz: int = settings.RADAR_SAMPLING_RATE_HZ,
        duration_sec: float = 0.512  # 1024 samples at 2000 Hz
    ):
        self.fc = fc_ghz * 1e9
        self.c = 3.0e8
        self.wavelength = self.c / self.fc  # ~0.0125 m for 24 GHz
        self.fs = fs_hz
        self.num_samples = int(self.fs * duration_sec)
        self.t = np.linspace(0, duration_sec, self.num_samples, endpoint=False)
        self.target_counter = 1
        self._connected = True

    def is_connected(self) -> bool:
        return self._connected

    def get_source_type(self) -> str:
        return "simulation"

    def generate_drone_signal(
        self,
        range_m: float,
        velocity_ms: float,
        snr_db: float = 22.0
    ) -> np.ndarray:
        """
        Drone radar return model:
        Torso/Hub bulk Doppler + Multiple rotor blades (e.g. quadcopter 4 rotors, 2 blades each)
        Produces characteristic high-frequency micro-Doppler blade harmonics.
        """
        # Bulk Doppler shift (scaled to baseband slow-time bandwidth)
        # Scale Doppler to fit baseband window [-fs/3, fs/3]
        f_bulk = (2.0 * velocity_ms / self.wavelength) % 350.0 + 50.0
        
        # Torso reflection
        body_signal = 1.0 * np.cos(2.0 * np.pi * f_bulk * self.t)
        
        # 4 Rotor hubs with blade chopping rates (80-140 Hz rotor RPM)
        blade_signal = np.zeros_like(self.t)
        num_rotors = 4
        num_blades_per_rotor = 2
        
        base_rotor_freq = random.uniform(85.0, 130.0)  # Hz
        blade_span_m = 0.12  # 12 cm blade radius
        v_blade_tip = 2.0 * np.pi * base_rotor_freq * blade_span_m
        doppler_spread_blade = min((2.0 * v_blade_tip / self.wavelength) * 0.15, 300.0)  # scaled baseband

        for r in range(num_rotors):
            rotor_freq = base_rotor_freq * random.uniform(0.96, 1.04)
            rotor_phase = random.uniform(0, 2.0 * np.pi)
            
            for b in range(num_blades_per_rotor):
                blade_phase = rotor_phase + b * (2.0 * np.pi / num_blades_per_rotor)
                # Blade flash micro-Doppler phase modulation
                mod = doppler_spread_blade * np.sin(2.0 * np.pi * rotor_freq * self.t + blade_phase)
                # Add blade harmonics
                blade_signal += 0.35 * np.cos(2.0 * np.pi * (f_bulk + mod) * self.t + blade_phase)
                # Secondary harmonic
                blade_signal += 0.15 * np.cos(2.0 * np.pi * (f_bulk + 2.0 * mod) * self.t + blade_phase)

        signal = body_signal + blade_signal
        
        # Add AWGN based on SNR
        noise_power = 10.0 ** (-snr_db / 10.0) * (np.var(signal) or 1.0)
        noise = np.random.normal(0, np.sqrt(noise_power), len(self.t))
        return signal + noise

    def generate_bird_signal(
        self,
        range_m: float,
        velocity_ms: float,
        snr_db: float = 18.0
    ) -> np.ndarray:
        """
        Bird radar return model:
        Torso bulk Doppler + Slower sinusoidal wing-flapping modulation (2-6 Hz)
        with cycle-to-cycle bio-mechanical irregularity.
        """
        f_bulk = (2.0 * velocity_ms / self.wavelength) % 220.0 + 40.0
        
        # Torso reflection
        body_signal = 1.2 * np.cos(2.0 * np.pi * f_bulk * self.t)
        
        # Wing motion: Flapping frequency (2.5 - 5.5 Hz)
        flap_freq = random.uniform(2.8, 5.2)  # Hz
        flap_phase = random.uniform(0, 2.0 * np.pi)
        
        # Wingtip velocity produces modulation envelope
        wingtip_mod_hz = random.uniform(45.0, 95.0)
        
        # Asymmetric wing-beat (downstroke faster than upstroke)
        wing_motion = wingtip_mod_hz * np.sin(2.0 * np.pi * flap_freq * self.t + flap_phase)
        # Small bio-variation
        wing_harmonics = 0.25 * wingtip_mod_hz * np.sin(4.0 * np.pi * flap_freq * self.t)
        
        wing_signal = 0.55 * np.cos(2.0 * np.pi * (f_bulk + wing_motion + wing_harmonics) * self.t)
        
        signal = body_signal + wing_signal
        
        # Add AWGN
        noise_power = 10.0 ** (-snr_db / 10.0) * (np.var(signal) or 1.0)
        noise = np.random.normal(0, np.sqrt(noise_power), len(self.t))
        return signal + noise

    def generate_unknown_signal(
        self,
        range_m: float,
        velocity_ms: float,
        snr_db: float = 6.0
    ) -> np.ndarray:
        """
        Clutter, wind-blown vegetation, multipath noise or weak ambiguous target.
        Lacks coherent micro-Doppler periodicity.
        """
        f_bulk = (2.0 * velocity_ms / self.wavelength) % 180.0 + 30.0
        weak_carrier = 0.3 * np.cos(2.0 * np.pi * f_bulk * self.t + np.random.uniform(0, np.pi))
        
        # Coloured noise / random phase drift
        random_walk = np.cumsum(np.random.normal(0, 0.05, len(self.t)))
        clutter = 0.5 * np.sin(2.0 * np.pi * 15.0 * self.t + random_walk)
        
        noise_power = 10.0 ** (-snr_db / 10.0) * (np.var(clutter) or 1.0)
        noise = np.random.normal(0, np.sqrt(noise_power), len(self.t))
        return weak_carrier + clutter + noise

    def acquire_frame(
        self,
        target_type_hint: Optional[str] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Generates a synthetic frame and associated target metadata.
        """
        # Determine target type
        if target_type_hint in ["drone", "bird", "unknown"]:
            target_type = target_type_hint
        else:
            # Random selection with realistic tactical weighting
            r = random.random()
            if r < 0.48:
                target_type = "drone"
            elif r < 0.90:
                target_type = "bird"
            else:
                target_type = "unknown"

        import uuid
        self.target_counter += 1
        tgt_id = f"TGT-{self.target_counter:04d}-{uuid.uuid4().hex[:4].upper()}"

        # Generate realistic target kinematics
        if target_type == "drone":
            range_m = round(random.uniform(45.0, 195.0), 1)
            velocity_ms = round(random.uniform(6.0, 18.5), 1)
            snr_db = round(random.uniform(18.0, 28.0), 1)
            signal = self.generate_drone_signal(range_m, velocity_ms, snr_db)
        elif target_type == "bird":
            range_m = round(random.uniform(30.0, 160.0), 1)
            velocity_ms = round(random.uniform(4.0, 14.0), 1)
            snr_db = round(random.uniform(14.0, 22.0), 1)
            signal = self.generate_bird_signal(range_m, velocity_ms, snr_db)
        else:
            range_m = round(random.uniform(60.0, 220.0), 1)
            velocity_ms = round(random.uniform(1.0, 8.0), 1)
            snr_db = round(random.uniform(3.0, 9.0), 1)
            signal = self.generate_unknown_signal(range_m, velocity_ms, snr_db)

        azimuth_deg = round(random.uniform(10.0, 350.0), 1)
        
        # Calculate received power in dBm
        # Path loss approximation P_rx = P_tx + G_tx + G_rx - 20log10(4*pi*R/lambda) - RCS_loss
        rcs_db = 0.0 if target_type == "drone" else (-8.0 if target_type == "bird" else -15.0)
        signal_strength_dbm = round(-35.0 - 20.0 * np.log10(max(range_m, 10.0) / 50.0) + rcs_db + random.uniform(-2, 2), 1)

        metadata = {
            "id": tgt_id,
            "simulated_type": target_type,
            "range_m": range_m,
            "velocity_ms": velocity_ms,
            "azimuth_deg": azimuth_deg,
            "signal_strength_db": signal_strength_dbm,
            "snr_db": snr_db,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mode": "simulation",
            "sampling_rate_hz": self.fs
        }

        return signal, metadata

radar_simulator = RadarSimulator()
