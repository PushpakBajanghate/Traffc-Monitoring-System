# AI Traffic Monitoring System (Production-Ready)

Real-time smart-city traffic control platform using local YOLOv8 inference, ROI-based lane analytics, adaptive signal timing, and live geospatial visualization.

## Project Overview

This system performs continuous real-time traffic monitoring and control:

- Ingests live video (webcam / RTSP / file source)
- Runs local YOLOv8 vehicle detection (no cloud APIs)
- Computes lane load using ROI boxes
- Adapts signal timings from lane congestion in real time
- Streams live updates over WebSocket to the React dashboard
- Visualizes traffic status and intersection state on Google Maps

## Core Features

- Real-time vehicle detection and tracking
- ROI-based lane vehicle counting
- Adaptive traffic signal timing
- Priority-lane selection based on live load
- Emergency detection flow support
- WebSocket frame + telemetry streaming
- Google Maps live marker and traffic context
- Multi-intersection, solar, environmental, and alert modules

## Tech Stack

Backend:

- FastAPI
- Uvicorn
- OpenCV
- Ultralytics YOLOv8 (local model)
- NumPy
- WebSockets
- Torch

Frontend:

- React + Vite
- @react-google-maps/api
- Tailwind CSS

## Backend Data Contract (WebSocket)

WebSocket endpoint: `ws://127.0.0.1:8000/ws/traffic`

Payload includes:

```json
{
  "frame": "<base64_jpeg>",
  "lane_counts": {"lane_1": 0, "lane_2": 0, "lane_3": 0},
  "signal_times": {"lane_1": 20, "lane_2": 20, "lane_3": 20},
  "priority_lane": "lane_1",
  "lat": 21.1458,
  "lng": 79.0882
}
```

Frontend rendering:

```jsx
<img src={`data:image/jpeg;base64,${data.frame}`} alt="Live Traffic Feed" />
```

## Setup and Run

### 1. Clone and open workspace

```powershell
git clone <your-repo-url>
cd "Traffc Monitoring System"
```

### 2. Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pip install fastapi uvicorn opencv-python numpy websockets ultralytics torch
cd ..
```

### 3. Run backend (required command)

Run from workspace root:

```powershell
backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

Backend URL:

- http://127.0.0.1:8000
- Health: http://127.0.0.1:8000/health
- WebSocket: ws://127.0.0.1:8000/ws/traffic

### 4. Frontend setup

```powershell
cd frontend
npm install
```

Optional Google Maps key (`frontend/.env.development`):

```bash
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_JS_API_KEY
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/ws
```

Run frontend:

```powershell
npm run dev
```

Open dashboard URL shown by Vite (typically http://localhost:5173).

## Local YOLO Model Requirement

The backend uses local YOLO only:

```python
model = YOLO("yolov8n.pt")
```

Notes:

- If `yolov8n.pt` exists in `backend/`, it is loaded directly.
- If missing, Ultralytics automatically downloads it once and then runs locally.
- No external inference API or cloud model endpoint is used.

## Runtime Behavior

- Camera fallback: tries webcam index `0`, then `1`.
- Detection loop: YOLO -> tracking -> ROI counts -> signal timing -> priority lane.
- Stream loop: annotated JPEG frame + telemetry over WebSocket.
- Frontend updates counters, camera feed, and map markers continuously.

## Troubleshooting

### Camera issues

- If camera index `0` fails, system auto-attempts index `1`.
- Set `VIDEO_SOURCE` in `backend/config/settings.py` for alternate camera/RTSP/file source.
- Verify no other app is exclusively locking your camera.

### YOLO model download/load issues

- Ensure internet for first-time `yolov8n.pt` download if file is missing.
- Verify `ultralytics` and `torch` are installed in the backend venv.
- Confirm model path and file permissions in `backend/`.

### Port conflicts

If `8000` is occupied:

```powershell
backend\venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8001
```

Then update frontend env:

- `VITE_API_URL=http://127.0.0.1:8001`
- `VITE_WS_URL=ws://127.0.0.1:8001/ws`

### Backend not found from frontend

- Check backend health endpoint first.
- Check browser console for WebSocket errors.
- Confirm CORS and env values point to the same host/port.

## Demo Flow

1. Start backend and confirm `/health` is healthy.
2. Open frontend dashboard.
3. Observe live camera frame and vehicle detections.
4. Verify ROI lane counts and signal times change over time.
5. Watch priority lane switch with load changes.
6. Verify map marker status updates with congestion/emergency state.

## API Summary

- `GET /` -> service status
- `GET /health` -> runtime health
- `GET /traffic-status` -> latest snapshot
- `GET /stats` -> pipeline statistics
- `WebSocket /ws/traffic` -> continuous real-time stream

## Notes

- This codebase is configured for real-time operation and local model inference.
- For production deployment, add auth, TLS termination, and process supervision.
# AI Smart Traffic Monitoring and Emergency Priority System

Real-time traffic intelligence platform built with FastAPI, YOLOv8, WebSockets, and React. The system detects and tracks vehicles, classifies congestion, triggers emergency priority flow, and visualizes intersection status on a live dashboard.

## Overview

This project provides:

- Real-time vehicle detection and counting
- Emergency vehicle priority mode
- Adaptive signal control from ROI lane counts
- Multi-intersection network view with green corridor support
- Solar power and environmental telemetry simulation
- Live alert aggregation and monitoring panels

## High-Level Architecture

```text
Video Source
  -> Frame Capture
  -> YOLO Detection
  -> Multi-Object Tracking
  -> Counting + Congestion + Emergency Logic
  -> Signal Control + Intersection Manager
  -> FastAPI REST + WebSocket APIs
  -> React Dashboard (Map, Alerts, Analytics)
```

## Tech Stack

Backend:

- Python 3.9+
- FastAPI + Uvicorn
- OpenCV
- Ultralytics YOLOv8
- WebSockets

Frontend:

- React 18
- Vite
- Tailwind CSS
- Leaflet

## Project Structure

```text
backend/
  api/
  config/
  core/
  logs/
  models/
  main.py

frontend/
  src/
    components/
    hooks/
  package.json

start-backend.bat
start-frontend.bat
README.md
```

## Quick Start (Windows)

### 1) Start backend

```powershell
start-backend.bat
```

Backend target:

- http://127.0.0.1:8000
- ws://127.0.0.1:8000/ws/traffic

### 2) Start frontend

```powershell
start-frontend.bat
```

Frontend target:

- http://localhost:3000

### 3) Health check

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health -UseBasicParsing
```

## Backend API

Core endpoints:

- GET / 
- GET /health
- GET /traffic-status
- GET /stats
- GET /config
- GET /intersections
- GET /solar-status
- GET /environmental
- GET /alerts

WebSocket:

- /ws/traffic

## Frontend Modules

- Dashboard: counters, congestion, camera feed, map, alerts
- Map: intersection-level view and route context
- Solar: unit-level battery and generation metrics
- Environment: AQI and noise by zone
- Surveillance: multi-view camera simulation
- Alerts: live severity and source-based feed

## Configuration

Primary runtime configuration is in backend/config/settings.py.

Useful settings:

- VIDEO_SOURCE
- LOCATION_NAME, LOCATION_LAT, LOCATION_LNG
- CONGESTION_LOW_THRESHOLD, CONGESTION_MEDIUM_THRESHOLD
- WEBSOCKET_UPDATE_INTERVAL
- INTERSECTIONS
- AQI_ALERT_THRESHOLD, NOISE_ALERT_THRESHOLD

## Notes for Local Development

- Default local backend binding is 127.0.0.1:8000.
- Frontend data hook is configured to use 127.0.0.1 for API and WebSocket fallback defaults.
- If you see OFFLINE in UI, verify backend health endpoint first.

## Roadmap Ideas

- Real camera/RTSP deployment profiles
- Persistent storage for alert and analytics history
- Role-based operator controls
- Signal override policy engine
- CI test suite for pipeline and UI integration

## License

Educational and prototype use.
