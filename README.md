# SkyShield AI – Intelligent Micro-Doppler Based Drone and Bird Classification System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Important Scientific & Operational Notice:**  
> **SkyShield AI** is an academic, research, and engineering prototype for **aerial object detection and classification only**.  
> It does **NOT** contain, support, or implement any weapon, interception, jamming, kinetic targeting, or electronic countermeasure functionality. All synthetic observations are explicitly tagged as `mode: "simulation"` and clearly labeled **"SIMULATION MODE – DATA IS SYNTHETIC"** across all dashboards.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Micro-Doppler Physics & Core Concept](#2-micro-doppler-physics--core-concept)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Folder Structure](#5-folder-structure)
6. [Installation & Setup](#6-installation--setup)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
7. [How to Run the Application](#7-how-to-run-the-application)
   - [Start Simulation](#start-simulation)
   - [Upload Radar Data (.CSV / .JSON)](#upload-radar-data-csv--json)
8. [API Documentation (REST & WebSockets)](#8-api-documentation)
9. [How to Train the CNN Later](#9-how-to-train-the-cnn-later)
10. [How to Connect Real FMCW Radar Hardware Later](#10-how-to-connect-real-fmcw-radar-hardware-later)
11. [Troubleshooting & FAQ](#11-troubleshooting--faq)

---

## 1. Problem Statement

The rapid proliferation of commercial, recreational, and industrial uncrewed aerial vehicles (UAVs / drones) poses escalating safety and airspace management challenges near airports, critical infrastructure, and security perimeters.

Traditional primary radar systems detect moving aerial targets and estimate bulk kinematics (range and radial velocity). However, **distinguishing small drones from birds is notoriously difficult** with conventional radar cross-section (RCS) or Doppler alone:
- Both possess comparable radar cross-sections ($\approx 0.01 - 0.05 \text{ m}^2$).
- Both operate in overlapping velocity bands ($5 - 20 \text{ m/s}$).
- Both exhibit agile, low-altitude trajectories.

### The Micro-Doppler Difference:
Aerial targets induce secondary micro-motion modulations known as the **Micro-Doppler Effect**:
- **Drones:** High-speed rotor propellers ($4,000 - 9,000 \text{ RPM}$) generate rapid, periodic specular blade-flash harmonics ($\approx 100 - 300 \text{ Hz}$) symmetrically offset from the body carrier.
- **Birds:** Bio-mechanical wing flapping ($2 - 6 \text{ Hz}$) creates a slow, continuous, undulating frequency envelope with natural cycle-to-cycle bio-kinematic irregularity.

**SkyShield AI** processes FMCW radar baseband signals using the Short-Time Fourier Transform (STFT) to produce time-frequency spectrogram heatmaps, extracting micro-Doppler discriminative features for AI classification into:
1. **DRONE**
2. **BIRD**
3. **UNKNOWN / LOW CONFIDENCE**

---

## 2. Micro-Doppler Physics & Core Concept

When an FMCW radar transmits at carrier frequency $f_c$ (wavelength $\lambda = c / f_c$), the reflected signal contains:
1. **Bulk Doppler Shift:** $f_{d0} = \frac{2 v_0}{\lambda}$ (governed by the torso radial velocity $v_0$).
2. **Micro-Doppler Modulation:** $f_{\mu D}(t)$ induced by rotating rotor blades or flapping wings:
   $$\Delta f_{\text{blade}} = \frac{2 \Omega L_{\text{blade}}}{\lambda}$$

```
Radar Signal
     ↓
DC Removal & Windowing (Hann, 256-pt)
     ↓
Short-Time Fourier Transform (scipy.signal.stft, 75% overlap)
     ↓
Centered Log-Magnitude Matrix (20·log10(|Z_xx| + ε))
     ↓
Micro-Doppler Feature Extraction & Normalization
     ↓
AI Classifier (BaseClassifier: DemoClassifier / CNNConvNet)
     ↓
Real-Time Dashboard & Alert History (WebSocket /ws/live)
```

---

## 3. System Architecture

```
                                 SKYSHIELD AI
                                      |
                     +----------------+----------------+
                     |                                 |
              Radar Simulator                  Future FMCW Radar
         (Physics-based Generator)          (RadarDataSource Driver)
                     |                                 |
                     +----------------+----------------+
                                      |
                               FastAPI Backend
                                      |
                     +----------------+----------------+
                     |                                 |
             Signal Processing                  Target Tracker
         (STFT & Feature Extraction)       (Range / Velocity / Azimuth)
                     |                                 |
          Micro-Doppler Spectrogram                    |
                     |                                 |
               AI Classifier                           |
           (Demo / PyTorch CNN)                        |
                     |                                 |
             +-------+-------+                         |
             |       |       |                         |
           Drone    Bird  Unknown                      |
             |       |       |                         |
             +-------+-------+                         |
                     |                                 |
              SQLite Database                          |
                     |                                 |
               WebSocket API (/ws/live) + REST APIs    |
                     |                                 |
            React + Tailwind Dashboard                 |
                     |                                 |
       +-------------+-------------+                   |
       |             |             |                   |
  Live Target   PPI Scope     Spectrogram       Analytics & History
```

---

## 4. Technology Stack

### Frontend:
- **React 18** with **TypeScript** (Strict mode)
- **Vite 8** for fast HMR and optimized production bundling
- **Tailwind CSS 3.4** with tactical defense dark radar theme
- **React Router 7** for 7-page navigation
- **Recharts 3** for telemetry analytics and accuracy matrices
- **Lucide React** for defense icons
- **Axios** for REST communication
- **Native WebSocket Client** with auto-reconnection and exponential backoff

### Backend:
- **Python 3.10+ / 3.12**
- **FastAPI** with asynchronous ASGI architecture
- **Uvicorn** high-performance server
- **NumPy & SciPy** (`scipy.signal.stft`) for signal processing
- **SQLAlchemy 2.0** with **SQLite** (PostgreSQL-ready)
- **Pydantic v2** for schema validation

### Machine Learning:
- **PyTorch Conv2D CNN** (224×224×1 grayscale input specification)
- **DemoClassifier** (physics-informed spectral heuristic baseline with calibrated softmax probabilities)
- **Scikit-learn** metrics and validation utilities

---

## 5. Folder Structure

```
SkyShield AI/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application setup, CORS, and WebSocket router
│   │   ├── api/
│   │   │   ├── routes_system.py        # /api/health, /api/system/status
│   │   │   ├── routes_simulation.py    # /api/simulation/start, stop, pause, reset, speed
│   │   │   ├── routes_detection.py     # /api/analyze, /api/analyze/upload, /api/detections, /api/statistics
│   │   │   └── routes_model.py         # /api/model/info, /api/model/metrics
│   │   ├── core/
│   │   │   └── config.py               # Pydantic settings and radar defaults
│   │   ├── db/
│   │   │   ├── database.py             # SQLAlchemy engine & session maker
│   │   │   └── models.py               # Detection ORM model
│   │   ├── models/
│   │   │   └── schemas.py              # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── radar_source.py         # RadarDataSource interface (Simulated vs FMCW hardware)
│   │   │   ├── radar_simulator.py      # Physics-based synthetic signal generator
│   │   │   ├── signal_processor.py     # STFT computation, windowing, and feature extraction
│   │   │   ├── spectrogram_service.py  # Matrix serialization and downsampling
│   │   │   ├── classifier.py           # BaseClassifier, DemoClassifier, CNNClassifier
│   │   │   └── detection_service.py    # Detection orchestration and persistence
│   │   ├── ml/
│   │   │   ├── cnn_model.py            # 224x224x1 ConvNet architecture definition
│   │   │   ├── preprocessing.py        # Spectrogram resizing to 224x224
│   │   │   ├── inference.py            # PyTorch inference wrapper
│   │   │   └── train_cnn.py            # Standalone CNN training script
│   │   ├── websocket/
│   │   │   └── live_stream.py          # WebSocket connection manager & broadcast loop
│   │   └── utils/
│   │       └── logger.py               # Formatted system logger
│   ├── data/
│   │   ├── sample_drone_radar.csv      # Sample CSV observation with blade harmonics
│   │   ├── sample_bird_radar.csv       # Sample CSV observation with wing flapping
│   │   └── sample_unknown_radar.json   # Sample JSON observation with clutter
│   ├── tests/
│   │   └── test_radar_pipeline.py      # Automated unit & integration tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx              # Brand header with status badges & simulation watermark
│   │   │   ├── Sidebar.tsx             # Tactical navigation menu
│   │   │   ├── StatCard.tsx            # Glowing metric cards
│   │   │   ├── RadarView.tsx           # High-precision Canvas PPI radar scope
│   │   │   ├── Spectrogram.tsx         # Interactive Micro-Doppler Canvas heatmap
│   │   │   ├── TargetCard.tsx          # Real-time target kinematics & confidence bar
│   │   │   ├── DetectionTable.tsx      # Paginated historical detection table
│   │   │   ├── StatusIndicator.tsx     # Online / Warning / Standby indicator pills
│   │   │   └── SimulationControls.tsx  # Start / Pause / Stop / Speed toolbar
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           # Primary operational mission control view
│   │   │   ├── LiveDetection.tsx       # Dedicated large scope & audio Doppler pitch
│   │   │   ├── SpectrogramPage.tsx     # In-depth STFT signature analysis laboratory
│   │   │   ├── History.tsx             # Full historical logs with multi-filter search
│   │   │   ├── Analytics.tsx           # 6 Recharts visualization charts
│   │   │   ├── ModelInfo.tsx           # CNN architecture breakdown & training guide
│   │   │   └── Settings.tsx            # Subsystem diagnostics & file upload studio
│   │   ├── services/
│   │   │   ├── api.ts                  # Axios REST API client
│   │   │   └── websocket.ts            # WebSocket manager with reconnection backoff
│   │   ├── hooks/
│   │   │   └── useLiveDetection.ts     # Coordination hook for telemetry & streaming
│   │   ├── types/
│   │   │   └── detection.ts            # TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── formatters.ts           # Telemetry formatting helpers
│   │   │   └── colormaps.ts            # Canvas colormaps (Defense Cyan & Plasma)
│   │   ├── App.tsx                     # Router layout
│   │   ├── index.css                   # Tailwind styles & radar animations
│   │   └── main.tsx                    # React root entry
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 6. Installation & Setup

### Prerequisites:
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ (tested on Node v22)
- Git

### Backend Setup:

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional but recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables (optional, defaults work out of the box):
   ```bash
   cp .env.example .env
   ```
5. Run the automated test suite:
   ```bash
   python -m unittest backend/tests/test_radar_pipeline.py
   ```
6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *The backend will be available at: http://127.0.0.1:8000*  
   *Interactive Swagger API documentation: http://127.0.0.1:8000/docs*

### Frontend Setup:

1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will be available at: http://localhost:5173*

---

## 7. How to Run the Application

### Start Simulation:
1. Open http://localhost:5173 in your browser.
2. The dashboard will display:
   - **Radar Online**
   - **AI Model Ready**
   - **WebSocket Connected**
   - **SIMULATION MODE – DATA IS SYNTHETIC**
3. Click the green **"Start Simulation"** button in the control toolbar.
4. The radar simulator begins producing synthetic FMCW frames:
   - Targets appear as blips on the 360° PPI Radar Scope.
   - The **Micro-Doppler Spectrogram** updates in real-time, showing high-frequency blade chopping harmonics for drones or slow wing flapping for birds.
   - The **Live Target Card** shows classification, confidence %, range, radial velocity, and signal strength.
   - Telemetry automatically appends to the SQLite database and updates analytics.
5. You can toggle **Cadence** (Slow: 3.0s, Normal: 1.5s, Fast: 0.7s) or manually inject specific targets using **"+ Drone"**, **"+ Bird"**, or **"+ Unknown"**.

### Upload Radar Data (.CSV / .JSON):
1. Navigate to **System Settings** (`/settings`).
2. Scroll to the **Raw Radar Data File Upload Studio**.
3. Select any `.csv` or `.json` radar record (sample files are provided in `backend/data/`):
   - `backend/data/sample_drone_radar.csv`
   - `backend/data/sample_bird_radar.csv`
   - `backend/data/sample_unknown_radar.json`
4. Click **"Upload & Classify"**.
5. The backend validates the samples, executes Hann windowing, centered STFT, extracts micro-Doppler metrics, executes classification, and instantly displays the classification card and spectrogram snapshot.

---

## 8. API Documentation

### REST Endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend health check |
| `GET` | `/api/system/status` | Real-time status of Radar, AI Model, Backend, WS, DB |
| `POST` | `/api/simulation/start` | Starts background radar simulation loop |
| `POST` | `/api/simulation/pause` | Pauses / resumes simulation |
| `POST` | `/api/simulation/stop` | Stops simulation |
| `POST` | `/api/simulation/reset` | Resets target counter and live buffer |
| `POST` | `/api/simulation/speed` | Adjusts loop interval (`slow`, `normal`, `fast`) |
| `GET` | `/api/simulation/status` | Returns current simulation state |
| `POST` | `/api/analyze` | Processes a raw frame or parameter hint |
| `POST` | `/api/analyze/upload` | Ingests and classifies uploaded CSV or JSON radar data |
| `GET` | `/api/detections` | Paginated detection history (search, filter, pagination) |
| `GET` | `/api/detections/{id}` | Retrieves detailed record by Target ID |
| `GET` | `/api/statistics` | Aggregated counts, avg confidence, false alarm rate |
| `GET` | `/api/model/info` | CNN architecture specs, input size, target classes |
| `GET` | `/api/model/metrics` | Confusion matrix and experimental metrics |

### WebSocket Endpoint:
- **URL:** `ws://127.0.0.1:8000/ws/live`
- **Protocol:** JSON message broadcasts:
  ```json
  {
    "type": "detection",
    "data": {
      "target_id": "TGT-0001-A4B2",
      "classification": "DRONE",
      "confidence": 0.9842,
      "range_m": 124.6,
      "velocity_ms": 12.8,
      "signal_strength_db": -42.5,
      "timestamp": "2026-09-16T12:00:00Z",
      "mode": "simulation",
      "probabilities": {
        "drone": 0.9842,
        "bird": 0.0121,
        "unknown": 0.0037
      },
      "features": {
        "spectral_centroid_hz": 412.5,
        "spectral_bandwidth_hz": 284.1,
        "harmonic_energy_ratio": 0.78,
        "modulation_frequency_hz": 112.5,
        "peak_doppler_spread_hz": 640.0
      },
      "spectrogram": {
        "time_bins": [...],
        "freq_bins": [...],
        "matrix": [[...]]
      }
    }
  }
  ```

---

## 9. How to Train the CNN Later

The prototype provides a complete, separate PyTorch CNN model specification (`backend/app/ml/cnn_model.py`):
```python
Input: 224 x 224 x 1 (Grayscale STFT Spectrogram)
Block 1: Conv2D(32, 3x3) -> BatchNorm -> ReLU -> MaxPool(2x2)
Block 2: Conv2D(64, 3x3) -> BatchNorm -> ReLU -> MaxPool(2x2)
Block 3: Conv2D(128, 3x3) -> ReLU -> MaxPool(2x2)
Flatten: 128 * 28 * 28 = 100,352 features
Dense: 128 units + Dropout(0.5)
Output: Dense(3 units) + Softmax (Drone, Bird, Unknown)
```

To train this CNN on synthetic or real benchmark datasets (such as **RadProc**, **DIAT-µSat**, or **TU Delft Micro-Doppler**):

1. Install PyTorch:
   ```bash
   pip install torch torchvision
   ```
2. Run the standalone training script:
   ```bash
   cd backend
   python -m app.ml.train_cnn --epochs 15 --samples 600 --output weights/micro_doppler_cnn.pt
   ```
3. Once training completes, configure `backend/.env`:
   ```env
   MODEL_MODE=cnn
   MODEL_WEIGHTS_PATH=weights/micro_doppler_cnn.pt
   ```
4. Restart the backend server. The system will detect the weights and switch from `DemoClassifier` to `CNNClassifier` automatically.

---

## 10. How to Connect Real FMCW Radar Hardware Later

The system is designed with a polymorphic `RadarDataSource` abstraction (`backend/app/services/radar_source.py`):

```python
class RadarDataSource(ABC):
    @abstractmethod
    def is_connected(self) -> bool: ...
    @abstractmethod
    def acquire_frame(self) -> Tuple[np.ndarray, Dict[str, Any]]: ...
```

To connect physical radar hardware (e.g. Texas Instruments IWR6843/AWR1843, Ancortek, or SDR):

1. Implement the driver inside `FMCWRadarSource` to read ADC/IQ chirp data over USB, Ethernet, or DCA1000 EVM:
   ```python
   class FMCWRadarSource(RadarDataSource):
       def acquire_frame(self):
           # Read raw chirps from serial / UDP socket
           # Perform range FFT & dechirping
           return slow_time_beat_signal, {"mode": "real", "range_m": range_val, ...}
   ```
2. Update the backend source selector in `backend/app/core/config.py` or through the **Settings** page.
3. **No frontend changes are required**—the UI, WebSocket protocol, and STFT pipeline operate identically regardless of whether signals originate from physical ADC chirps or the simulator.

---

## 11. Troubleshooting & FAQ

**Q: Why does the system indicate "SIMULATION MODE – DATA IS SYNTHETIC"?**  
A: To preserve strict scientific integrity, all non-physical sensor simulations must be clearly stated. Synthetic data should never be misrepresented as physical radar measurements.

**Q: The WebSocket reports "WS Reconnecting..."?**  
A: Ensure the FastAPI backend is running on `http://127.0.0.1:8000`. The frontend client automatically retries connecting with exponential backoff.

**Q: Can I run both backend and frontend simultaneously?**  
A: Yes. Use two terminal windows—one running `uvicorn app.main:app --port 8000` in `backend/`, and the second running `npm run dev` in `frontend/`.

---

## License

This project is released under the **MIT License** for academic and research purposes.