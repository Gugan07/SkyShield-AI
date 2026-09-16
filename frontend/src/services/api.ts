import axios from 'axios';
import {
  Detection,
  PaginatedDetections,
  Statistics,
  SystemStatus,
  SimulationStatus,
  ModelInfo,
  ModelMetrics
} from '../types/detection';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // System Endpoints
  async getHealth() {
    const res = await apiClient.get('/health');
    return res.data;
  },

  async getSystemStatus(): Promise<SystemStatus> {
    const res = await apiClient.get<SystemStatus>('/system/status');
    return res.data;
  },

  // Simulation Controls
  async startSimulation(): Promise<SimulationStatus> {
    const res = await apiClient.post<SimulationStatus>('/simulation/start');
    return res.data;
  },

  async pauseSimulation(): Promise<SimulationStatus> {
    const res = await apiClient.post<SimulationStatus>('/simulation/pause');
    return res.data;
  },

  async stopSimulation(): Promise<SimulationStatus> {
    const res = await apiClient.post<SimulationStatus>('/simulation/stop');
    return res.data;
  },

  async resetSimulation(): Promise<SimulationStatus> {
    const res = await apiClient.post<SimulationStatus>('/simulation/reset');
    return res.data;
  },

  async setSimulationSpeed(speed: 'slow' | 'normal' | 'fast'): Promise<SimulationStatus> {
    const res = await apiClient.post<SimulationStatus>('/simulation/speed', { speed });
    return res.data;
  },

  async getSimulationStatus(): Promise<SimulationStatus> {
    const res = await apiClient.get<SimulationStatus>('/simulation/status');
    return res.data;
  },

  // Detection & Analysis
  async analyzeFrame(targetTypeHint?: string): Promise<Detection> {
    const res = await apiClient.post<Detection>('/analyze', {
      target_type_hint: targetTypeHint || null,
    });
    return res.data;
  },

  async uploadRadarFile(file: File): Promise<Detection> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<Detection>('/analyze/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getDetections(params: {
    page?: number;
    page_size?: number;
    target_type?: string;
    min_confidence?: number;
    search?: string;
  }): Promise<PaginatedDetections> {
    const res = await apiClient.get<PaginatedDetections>('/detections', { params });
    return res.data;
  },

  async getDetectionById(id: string): Promise<Detection> {
    const res = await apiClient.get<Detection>(`/detections/${id}`);
    return res.data;
  },

  async getStatistics(): Promise<Statistics> {
    const res = await apiClient.get<Statistics>('/statistics');
    return res.data;
  },

  // Model Endpoints
  async getModelInfo(): Promise<ModelInfo> {
    const res = await apiClient.get<ModelInfo>('/model/info');
    return res.data;
  },

  async getModelMetrics(): Promise<ModelMetrics> {
    const res = await apiClient.get<ModelMetrics>('/model/metrics');
    return res.data;
  },
};
