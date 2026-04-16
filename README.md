# 🚦 AI-Based Intelligent Traffic Monitoring & Adaptive Signal Control System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-FF6F00?style=for-the-badge&logo=pytorch&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.9+-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-4CAF50?style=for-the-badge)

**A production-ready, real-time AI-powered traffic monitoring and adaptive signal control platform that detects vehicles, prioritizes emergency vehicle routing, computes dynamic congestion, manages smart intersections, monitors environmental sensors, and visualizes everything on a live interactive Google Maps dashboard.**

</div>

---

## 🎯 Project Overview

This system is a comprehensive **Smart City Traffic Intelligence Platform** that combines:

- 🤖 **YOLOv8 AI detection** for real-time vehicle classification
- 🚨 **Emergency vehicle priority** routing for ambulances & fire brigades
- 🟢 **Adaptive traffic signal control** based on live lane ROI occupancy
- 🗺️ **Google Maps live dashboard** with dynamic markers and congestion overlays
- 🌿 **Environmental sensor integration** (AQI, noise, weather)
- ☀️ **Solar power monitoring** for sustainable data center operations
- 📷 **Live camera feed streaming** via WebSocket (base64 JPEG frames)
- 📊 **Advanced analytics** with traffic prediction and intersection management

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Video Source (RTSP / File / Demo)           │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Frame Capture      │  (video_capture.py)
                    │  Pipeline           │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  YOLOv8 Detection   │  (detection.py)
                    │  + Classification   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
   ┌──────────▼──────┐ ┌──────▼──────┐ ┌──────▼──────────┐
   │  Multi-Object   │ │  Lane ROI   │ │  Emergency Veh. │
   │  Tracking       │ │  Counting   │ │  Priority System│
   │  (ByteTrack)    │ │  Engine     │ │                 │
   └──────────┬──────┘ └──────┬──────┘ └──────┬──────────┘
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Congestion Engine  │  (congestion.py)
                    │  + Signal Control   │  (signal_control.py)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Intersection       │  (intersection_manager.py)
                    │  Manager            │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  FastAPI Backend    │  (app.py)
                    │  + WebSocket API   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
   ┌──────▼──────┐    ┌────────▼──────┐   ┌────────▼──────┐
   │ Google Maps │    │  Camera Feed  │   │  Stats &      │
   │ Live View   │    │  Stream       │   │  Analytics    │
   └─────────────┘    └───────────────┘   └───────────────┘
```

---

## 📁 Project Structure

```
Traffc-Monitoring-System/
│
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   └── app.py                    # FastAPI app with REST + WebSocket endpoints
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py               # Centralized configuration via Pydantic
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── video_capture.py          # Multi-source video capture pipeline
│   │   ├── detection.py              # YOLOv8 vehicle detection & classification
│   │   ├── tracking.py               # Multi-object tracking (ByteTrack)
│   │   ├── counting.py               # Lane-based vehicle counting engine
│   │   ├── roi.py                    # Region-of-Interest (lane zone) definitions
│   │   ├── congestion.py             # Congestion level computation
│   │   ├── signal_control.py         # Adaptive traffic signal timing
│   │   ├── emergency.py              # Emergency vehicle detection & alert system
│   │   ├── alert_system.py           # Push alert dispatcher (WebSocket / SMS)
│   │   ├── intersection_manager.py   # Smart intersection state machine
│   │   ├── environmental_sensors.py  # Air quality, noise & weather integration
│   │   ├── solar_power.py            # Solar energy monitoring module
│   │   └── pipeline.py               # Master processing pipeline orchestrator
│   │
│   ├── models/                        # YOLOv8 model weights (.pt files)
│   ├── logs/                          # Structured application logs
│   ├── main.py                        # Backend entry point
│   ├── requirements.txt               # Python dependencies
│   ├── runtime.txt                    # Python runtime version (for deployment)
│   ├── Procfile                       # Heroku / Railway process config
│   ├── nixpacks.toml                  # Nixpacks build config
│   ├── railway.json                   # Railway deployment config
│   └── render.yaml                    # Render deployment config
│
├── frontend/
│   ├── public/                        # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx             # App header with live status indicator
│   │   │   ├── GoogleTrafficMap.jsx   # Google Maps live traffic visualization
│   │   │   ├── TrafficMap.jsx         # Leaflet fallback map view
│   │   │   ├── VehicleCounters.jsx    # Real-time vehicle count cards
│   │   │   ├── CongestionBadge.jsx    # Congestion level badge
│   │   │   ├── EmergencyPanel.jsx     # Emergency alert display
│   │   │   ├── LiveCameraFeed.jsx     # Live YOLO-processed video stream
│   │   │   ├── CameraModal.jsx        # Expanded camera feed modal
│   │   │   ├── SignalControlPanel.jsx # Signal timing & phase visualization
│   │   │   ├── AlertsPanel.jsx        # Alert history & active alerts
│   │   │   ├── AdvancedStats.jsx      # FPS, uptime, frame stats
│   │   │   ├── StatsPanel.jsx         # Summary statistics panel
│   │   │   ├── TrafficPrediction.jsx  # ML traffic prediction charts
│   │   │   ├── IntersectionDetailPanel.jsx  # Per-intersection deep-dive
│   │   │   ├── EnvironmentalPanel.jsx # AQI, noise & weather display
│   │   │   ├── SolarPowerPanel.jsx    # Solar energy metrics
│   │   │   ├── SurveillanceModule.jsx # Multi-camera surveillance view
│   │   │   └── index.js               # Component exports barrel
│   │   │
│   │   ├── hooks/
│   │   │   └── useTrafficData.js      # WebSocket data hook with auto-reconnect
│   │   │
│   │   ├── App.jsx                    # Root application & layout
│   │   ├── main.jsx                   # Vite entry point
│   │   └── index.css                  # Global styles (Tailwind + custom)
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── netlify.toml                   # Netlify deployment config
│   └── vercel.json                    # Vercel deployment config
│
├── start-backend.bat                  # One-click backend launcher (Windows)
├── start-frontend.bat                 # One-click frontend launcher (Windows)
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.9+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | any |

---

### ⚡ Windows One-Click Launch

```bash
# Start backend
start-backend.bat

# Start frontend (separate terminal)
start-frontend.bat
```

---

### 🐍 Backend Manual Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create & activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/macOS

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment (copy and edit)
cp .env.example .env

# 5. Start the server
python main.py
```

Backend runs at → `http://localhost:8000`

---

### ⚛️ Frontend Manual Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

## 🔌 API Reference

### WebSocket Endpoints

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws/traffic` | Real-time traffic data stream |
| `ws://localhost:8000/ws/video` | Live YOLO-processed camera feed (base64 JPEG) |

**Traffic Data Payload Example:**
```json
{
  "cars": 14,
  "bikes": 5,
  "buses": 2,
  "trucks": 3,
  "ambulances": 1,
  "firebrigade": 0,
  "total": 24,
  "congestion": "HIGH",
  "emergency_mode": true,
  "emergency_type": "ambulance",
  "signal_phase": "GREEN",
  "green_time": 45,
  "area": "Main Road Signal, Agur",
  "lat": 12.7805,
  "lng": 77.6051,
  "fps": 28.4,
  "frame_count": 14832,
  "aqi": 72,
  "noise_db": 68.5,
  "solar_output_kw": 3.2,
  "timestamp": "2026-04-16T18:00:00"
}
```

---

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | System info & version |
| `/health` | GET | Health check |
| `/traffic-status` | GET | Current live traffic status |
| `/stats` | GET | Detailed performance statistics |
| `/config` | GET | Active system configuration |
| `/intersections` | GET | All intersection states |
| `/intersections/{id}` | GET | Single intersection details |
| `/alerts` | GET | Active and historical alerts |
| `/environmental` | GET | Environmental sensor readings |
| `/solar` | GET | Solar power active metrics |

---

## 🚦 Congestion Levels

| Level | Vehicle Count | Map Color | Signal Behavior |
|-------|---------------|-----------|-----------------|
| 🟢 LOW | < 10 vehicles | Green | Standard timing |
| 🟡 MEDIUM | 10–19 vehicles | Yellow | Slightly extended green |
| 🔴 HIGH | ≥ 20 vehicles | Red | Maximum green time |

---

## 🚨 Emergency Vehicle Priority System

When an **ambulance** or **fire brigade** is detected anywhere in a lane ROI:

1. **Priority Mode** activates instantly
2. Signal phase switches to **GREEN** for the emergency vehicle's lane
3. Dashboard alert panel shows: `🚨 Emergency Vehicle Detected – Priority Clearance Required`
4. Google Maps marker changes to **flashing blue-red** state
5. All other intersection signals enter hold/red state
6. Alert is auto-cleared after vehicle exits the zone (5-second timeout)

---

## 🟢 Adaptive Signal Control

The `signal_control.py` module dynamically computes green times per lane based on:

- **Vehicle density** within each lane ROI (Region of Interest)
- **Queue length** estimate from vehicle counts
- **Emergency vehicle presence** (overrides all timings)
- **Historical flow patterns** for predictive adjustment

Signal timing is computed every cycle and broadcast via WebSocket.

---

## 🗺️ Google Maps Live Dashboard

The `GoogleTrafficMap.jsx` component provides:

- 📍 Dynamic markers for each monitored intersection
- 🔴🟡🟢 Color-coded congestion overlays
- 🛣️ Live traffic layer toggle
- 🔢 Vehicle count tooltips on hover
- 🚨 Emergency pulse animations on active alerts
- ⏱️ Signal phase countdown badges

---

## 📷 Live Camera Feed

The `LiveCameraFeed.jsx` component streams:

- Real-time YOLO-processed frames at up to **30 FPS**
- Colored bounding boxes per vehicle class
- Lane ROI polygon overlays
- Vehicle count annotations per frame
- Expandable via `CameraModal.jsx` for full-screen view

---

## 🌿 Environmental Monitoring

| Sensor | Data Points |
|--------|-------------|
| Air Quality | PM2.5, PM10, CO₂, AQI Index |
| Noise | dB level, average, peak |
| Weather | Temperature, humidity, visibility |

---

## ☀️ Solar Power Integration

The `solar_power.py` module tracks:

- Real-time solar panel output (kW)
- Daily energy generation (kWh)
- Grid vs. solar ratio
- Panel health status

---

## ⚙️ Configuration

Edit `backend/config/settings.py` or set environment variables via `.env`:

```env
# Video source: "demo" | "0" | "/path/to/video.mp4" | "rtsp://..."
VIDEO_SOURCE=demo

# Location
LOCATION_NAME=Main Road Signal, Agur
LOCATION_LAT=12.7805
LOCATION_LNG=77.6051

# Congestion thresholds
CONGESTION_LOW_THRESHOLD=10
CONGESTION_MEDIUM_THRESHOLD=20

# WebSocket update rate (seconds)
WEBSOCKET_UPDATE_INTERVAL=2.0

# Signal timing bounds (seconds)
MIN_GREEN_TIME=10
MAX_GREEN_TIME=90

# Emergency alert timeout (seconds)
EMERGENCY_ALERT_TIMEOUT=5.0
```

---

## 🎥 Supported Video Sources

| Mode | Value | Description |
|------|-------|-------------|
| Demo | `"demo"` | Simulated realistic traffic data (no camera needed) |
| Webcam | `"0"` or `"1"` | Local USB/built-in camera by index |
| Video File | `"/path/to/traffic.mp4"` | Pre-recorded video file |
| RTSP Stream | `"rtsp://user:pass@ip/stream"` | Live IP camera feed |

---

## 📊 Technology Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.9+ | Core language |
| FastAPI | Async web framework |
| Uvicorn | ASGI server |
| YOLOv8 (Ultralytics) | Vehicle detection & classification |
| OpenCV | Video capture & frame processing |
| Supervision | ByteTrack multi-object tracking |
| WebSockets | Real-time bidirectional streaming |
| Pydantic v2 | Settings & data validation |
| Loguru | Structured logging |
| SciPy | Numerical computing for signal control |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| Google Maps API | Interactive live map |
| Leaflet.js | Fallback map |
| Lucide React | Icon library |
| Recharts | Analytics chart library |

---

## 🌐 Deployment

The project includes deployment configs for multiple platforms:

| Platform | Config File |
|----------|-------------|
| Railway | `backend/railway.json`, `backend/nixpacks.toml` |
| Render | `backend/render.yaml` |
| Heroku | `backend/Procfile` |
| Netlify | `frontend/netlify.toml` |
| Vercel | `frontend/vercel.json` |

---

## 🏙️ Defense Statement

> *"This system continuously processes live road video through YOLOv8, detects and tracks every passing vehicle, instantly identifies ambulances and fire brigade units, dynamically computes lane-level congestion, adaptively controls signal timings, and streams all data — including processed video frames — to a live React dashboard with Google Maps integration. The entire pipeline is designed to scale directly to real-world CCTV deployments for smart city traffic management."*

---

## 📄 License

This project is developed for educational and smart city demonstration purposes. All rights reserved.

---

## 👥 Authors

**Pushpak Bajanghate** — [GitHub @PushpakBajanghate](https://github.com/PushpakBajanghate)

*AI-Based Intelligent Traffic Monitoring System — Real-time smart city traffic control prototype.*

---

<div align="center">
⭐ If you found this project useful, please consider starring the repository!
</div>
