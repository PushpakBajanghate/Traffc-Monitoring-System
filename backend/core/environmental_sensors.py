"""
Environmental Sensor Simulation Module.
Simulates air quality (AQI) and noise levels per traffic zone,
correlated with vehicle density and type.
"""

import random
import math
import time
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
from loguru import logger


@dataclass
class EnvironmentalReading:
    """Environmental data for a single zone."""
    zone_id: str
    aqi: int                    # Air Quality Index 0-500
    aqi_category: str           # Good/Moderate/Unhealthy/Very Unhealthy/Hazardous
    aqi_color: str              # Color code for display
    noise_db: float             # Noise level in decibels
    noise_category: str         # Quiet/Moderate/Loud/Very Loud
    pm25: float                 # PM2.5 (µg/m³)
    pm10: float                 # PM10 (µg/m³)
    co2_ppm: float              # CO2 parts per million
    temperature_c: float
    humidity_pct: float
    trend: str                  # improving / stable / worsening

    def to_dict(self) -> Dict:
        return {
            "zone_id": self.zone_id,
            "aqi": self.aqi,
            "aqi_category": self.aqi_category,
            "aqi_color": self.aqi_color,
            "noise_db": round(self.noise_db, 1),
            "noise_category": self.noise_category,
            "pm25": round(self.pm25, 1),
            "pm10": round(self.pm10, 1),
            "co2_ppm": round(self.co2_ppm, 0),
            "temperature_c": round(self.temperature_c, 1),
            "humidity_pct": round(self.humidity_pct, 1),
            "trend": self.trend,
        }


class EnvironmentalSensorSimulator:
    """
    Simulates environmental sensors per zone.
    AQI and noise correlate with vehicle density — more vehicles = worse air & more noise.
    """

    AQI_CATEGORIES = [
        (50, "Good", "#22c55e"),
        (100, "Moderate", "#eab308"),
        (150, "Unhealthy (Sensitive)", "#f97316"),
        (200, "Unhealthy", "#ef4444"),
        (300, "Very Unhealthy", "#a855f7"),
        (500, "Hazardous", "#7f1d1d"),
    ]

    NOISE_CATEGORIES = [
        (50, "Quiet"),
        (65, "Moderate"),
        (75, "Loud"),
        (90, "Very Loud"),
    ]

    def __init__(self, zone_ids: List[str]):
        """
        Initialize sensors for all zones.

        Args:
            zone_ids: List of zone/intersection identifiers
        """
        self.zone_ids = zone_ids
        self.history: Dict[str, List[int]] = {zid: [] for zid in zone_ids}
        self.last_readings: Dict[str, EnvironmentalReading] = {}
        logger.info(f"[ENV] Initialized environmental sensors for {len(zone_ids)} zones")

    def _classify_aqi(self, aqi: int):
        """Get AQI category and color."""
        for threshold, category, color in self.AQI_CATEGORIES:
            if aqi <= threshold:
                return category, color
        return "Hazardous", "#7f1d1d"

    def _classify_noise(self, noise_db: float) -> str:
        """Get noise level category."""
        for threshold, category in self.NOISE_CATEGORIES:
            if noise_db <= threshold:
                return category
        return "Very Loud"

    def _get_trend(self, zone_id: str, current_aqi: int) -> str:
        """Determine trend from history."""
        history = self.history.get(zone_id, [])
        if len(history) < 5:
            return "stable"
        recent_avg = sum(history[-5:]) / 5
        older_avg = sum(history[-10:-5]) / 5 if len(history) >= 10 else recent_avg
        diff = current_aqi - older_avg
        if diff > 10:
            return "worsening"
        elif diff < -10:
            return "improving"
        return "stable"

    def compute(self, zone_vehicle_counts: Dict[str, int]) -> Dict[str, Dict]:
        """
        Compute environmental readings for all zones.

        Args:
            zone_vehicle_counts: Dict mapping zone_id -> vehicle count

        Returns:
            Dict mapping zone_id -> reading dict
        """
        readings = {}
        now = datetime.now()
        hour = now.hour

        for zone_id in self.zone_ids:
            vehicle_count = zone_vehicle_counts.get(zone_id, random.randint(5, 20))

            # --- AQI Simulation ---
            # Base AQI from time of day (higher during rush hours)
            if 8 <= hour <= 10 or 17 <= hour <= 20:
                base_aqi = random.randint(60, 90)
            elif 11 <= hour <= 16:
                base_aqi = random.randint(40, 70)
            else:
                base_aqi = random.randint(20, 50)

            # Add vehicle density contribution
            vehicle_aqi = vehicle_count * random.uniform(2.0, 4.0)
            aqi = int(min(500, base_aqi + vehicle_aqi + random.randint(-10, 10)))
            aqi = max(0, aqi)

            aqi_category, aqi_color = self._classify_aqi(aqi)

            # --- Noise Simulation ---
            # Base noise from urban area
            base_noise = 45.0
            # Each vehicle adds noise (trucks add more)
            vehicle_noise = vehicle_count * random.uniform(1.0, 2.5)
            noise_db = min(95.0, base_noise + vehicle_noise + random.uniform(-3, 3))
            noise_category = self._classify_noise(noise_db)

            # --- PM2.5 / PM10 ---
            pm25 = aqi * random.uniform(0.3, 0.5)
            pm10 = pm25 * random.uniform(1.5, 2.5)

            # --- CO2 ---
            co2_base = 400.0  # ambient
            co2_ppm = co2_base + vehicle_count * random.uniform(5, 15)

            # --- Temperature & Humidity ---
            temp = 28.0 + random.uniform(-3, 8) + math.sin(hour * math.pi / 12) * 5
            humidity = 55.0 + random.uniform(-15, 15) - math.sin(hour * math.pi / 12) * 10

            # Track history
            self.history[zone_id].append(aqi)
            if len(self.history[zone_id]) > 100:
                self.history[zone_id] = self.history[zone_id][-100:]

            trend = self._get_trend(zone_id, aqi)

            reading = EnvironmentalReading(
                zone_id=zone_id,
                aqi=aqi,
                aqi_category=aqi_category,
                aqi_color=aqi_color,
                noise_db=noise_db,
                noise_category=noise_category,
                pm25=pm25,
                pm10=pm10,
                co2_ppm=co2_ppm,
                temperature_c=temp,
                humidity_pct=max(20, min(95, humidity)),
                trend=trend,
            )

            self.last_readings[zone_id] = reading
            readings[zone_id] = reading.to_dict()

        return readings

    def get_alerts(self, aqi_threshold: int = 150, noise_threshold: float = 80.0) -> List[Dict]:
        """Return alerts for zones exceeding thresholds."""
        alerts = []
        for zone_id, reading in self.last_readings.items():
            if reading.aqi > aqi_threshold:
                alerts.append({
                    "type": "AIR_QUALITY_POOR",
                    "severity": "WARNING" if reading.aqi <= 200 else "CRITICAL",
                    "zone_id": zone_id,
                    "message": f"Poor air quality at {zone_id}: AQI {reading.aqi} ({reading.aqi_category})",
                    "value": reading.aqi,
                })
            if reading.noise_db > noise_threshold:
                alerts.append({
                    "type": "NOISE_HIGH",
                    "severity": "WARNING",
                    "zone_id": zone_id,
                    "message": f"High noise level at {zone_id}: {reading.noise_db:.0f} dB",
                    "value": round(reading.noise_db, 1),
                })
        return alerts
