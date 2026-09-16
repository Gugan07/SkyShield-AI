import { Detection, SimulationStatus } from '../types/detection';

type DetectionCallback = (detection: Detection) => void;
type SimulationStatusCallback = (status: SimulationStatus) => void;
type ConnectionStateCallback = (connected: boolean) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 2000;
  private maxReconnectInterval: number = 10000;
  private currentReconnectInterval: number = 2000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect: boolean = true;
  private detectionListeners: Set<DetectionCallback> = new Set();
  private statusListeners: Set<SimulationStatusCallback> = new Set();
  private connectionListeners: Set<ConnectionStateCallback> = new Set();

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live';
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.currentReconnectInterval = this.reconnectInterval;
        this.notifyConnectionListeners(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'detection' && payload.data) {
            this.notifyDetectionListeners(payload.data);
          } else if (payload.type === 'simulation_status' && payload.data) {
            this.notifyStatusListeners(payload.data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.notifyConnectionListeners(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error observed:', err);
        this.notifyConnectionListeners(false);
      };
    } catch (err) {
      console.error('Error initializing WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectTimer = setTimeout(() => {
      this.currentReconnectInterval = Math.min(
        this.currentReconnectInterval * 1.5,
        this.maxReconnectInterval
      );
      this.connect();
    }, this.currentReconnectInterval);
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyConnectionListeners(false);
  }

  public subscribeDetection(cb: DetectionCallback): () => void {
    this.detectionListeners.add(cb);
    return () => this.detectionListeners.delete(cb);
  }

  public subscribeStatus(cb: SimulationStatusCallback): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  public subscribeConnection(cb: ConnectionStateCallback): () => void {
    this.connectionListeners.add(cb);
    // Immediately emit current state
    cb(this.isConnected());
    return () => this.connectionListeners.delete(cb);
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private notifyDetectionListeners(det: Detection) {
    this.detectionListeners.forEach((cb) => cb(det));
  }

  private notifyStatusListeners(status: SimulationStatus) {
    this.statusListeners.forEach((cb) => cb(status));
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach((cb) => cb(connected));
  }
}

export const wsClient = new WebSocketClient();
