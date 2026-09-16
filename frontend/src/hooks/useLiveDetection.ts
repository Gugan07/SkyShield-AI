import { useState, useEffect, useCallback } from 'react';
import { Detection, SimulationStatus, Statistics, SystemStatus } from '../types/detection';
import { wsClient } from '../services/websocket';
import { api } from '../services/api';

export function useLiveDetection() {
  const [latestDetection, setLatestDetection] = useState<Detection | null>(null);
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh statistics & system status
  const refreshStats = useCallback(async () => {
    try {
      const [stats, sys] = await Promise.all([
        api.getStatistics(),
        api.getSystemStatus(),
      ]);
      setStatistics(stats);
      setSystemStatus(sys);
    } catch (err) {
      console.warn('Could not fetch system stats:', err);
    }
  }, []);

  useEffect(() => {
    wsClient.connect();

    const unsubConn = wsClient.subscribeConnection((connected) => {
      setWsConnected(connected);
      if (connected) {
        setError(null);
      }
    });

    const unsubDet = wsClient.subscribeDetection((newDetection) => {
      setLatestDetection(newDetection);
      setRecentDetections((prev) => {
        const next = [newDetection, ...prev.slice(0, 24)];
        return next;
      });
      // Periodically refresh stats
      refreshStats();
    });

    const unsubStatus = wsClient.subscribeStatus((status) => {
      setSimulationStatus(status);
    });

    // Initial load
    refreshStats();
    api.getSimulationStatus().then(setSimulationStatus).catch(() => {});

    return () => {
      unsubConn();
      unsubDet();
      unsubStatus();
    };
  }, [refreshStats]);

  const startSimulation = async () => {
    try {
      setIsLoading(true);
      const status = await api.startSimulation();
      setSimulationStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start radar simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSimulation = async () => {
    try {
      setIsLoading(true);
      const status = await api.pauseSimulation();
      setSimulationStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to pause radar simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const stopSimulation = async () => {
    try {
      setIsLoading(true);
      const status = await api.stopSimulation();
      setSimulationStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to stop radar simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSimulation = async () => {
    try {
      setIsLoading(true);
      const status = await api.resetSimulation();
      setSimulationStatus(status);
      setRecentDetections([]);
      setLatestDetection(null);
      await refreshStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset radar simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const changeSpeed = async (speed: 'slow' | 'normal' | 'fast') => {
    try {
      const status = await api.setSimulationSpeed(speed);
      setSimulationStatus(status);
    } catch (err: any) {
      setError('Failed to update simulation speed');
    }
  };

  const triggerSingleFrame = async (hint?: string) => {
    try {
      setIsLoading(true);
      const detection = await api.analyzeFrame(hint);
      setLatestDetection(detection);
      setRecentDetections((prev) => [detection, ...prev.slice(0, 24)]);
      await refreshStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process radar frame');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    latestDetection,
    recentDetections,
    simulationStatus,
    systemStatus,
    statistics,
    wsConnected,
    isLoading,
    error,
    startSimulation,
    pauseSimulation,
    stopSimulation,
    resetSimulation,
    changeSpeed,
    triggerSingleFrame,
    refreshStats,
  };
}
