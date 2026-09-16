"""
Radar Data Source Abstraction Layer
Enables seamless swapping between simulated radar data and future physical FMCW radar streams
without frontend redesign.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple
import numpy as np

class RadarDataSource(ABC):
    """Abstract interface for radar sensor or simulation stream."""
    
    @abstractmethod
    def is_connected(self) -> bool:
        """Check whether sensor/stream is active and receiving."""
        pass

    @abstractmethod
    def get_source_type(self) -> str:
        """Return 'simulation' or 'fmcw_hardware'."""
        pass

    @abstractmethod
    def acquire_frame(self) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Acquires one frame of raw time-domain baseband / dechirped radar beat signal.
        Returns:
            signal: 1D numpy array of beat signal samples
            metadata: dictionary containing range, bulk velocity, azimuth, timestamp, etc.
        """
        pass


class FMCWRadarSource(RadarDataSource):
    """
    Interface skeleton for physical FMCW radar (e.g., TI AWR1843/IWR6843, Ancortek, or SDR).
    Reads raw ADC/IQ samples over USB/Ethernet/UART/DCA1000 EVM.
    """
    def __init__(self, port: str = "/dev/ttyUSB0", baudrate: int = 921600):
        self.port = port
        self.baudrate = baudrate
        self.connected = False

    def is_connected(self) -> bool:
        return self.connected

    def get_source_type(self) -> str:
        return "fmcw_hardware"

    def acquire_frame(self) -> Tuple[np.ndarray, Dict[str, Any]]:
        if not self.connected:
            raise ConnectionError("Physical FMCW radar hardware is not connected. Use SimulatedRadarSource.")
        # Future hardware acquisition logic:
        # e.g. read from DCA1000 SPI/UDP buffer or Serial port
        raise NotImplementedError("Physical radar driver to be configured with target hardware.")
