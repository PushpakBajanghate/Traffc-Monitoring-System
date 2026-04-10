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
