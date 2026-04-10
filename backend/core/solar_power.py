"""
Solar-Powered Traffic System Simulation Module.
Simulates solar panel energy generation, battery storage,
power consumption tracking, and smart power management for each intersection.
"""

import time
import math
import random
from typing import Dict, Optional, List
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from loguru import logger


class PowerStatus(Enum):
    """System power status states."""
    ACTIVE = "ACTIVE"
    LOW_POWER = "LOW_POWER"
    BACKUP_MODE = "BACKUP_MODE"
    OFFLINE = "OFFLINE"


@dataclass
class EnergyMetrics:
    """Daily energy analytics snapshot."""
    daily_generated_kwh: float = 0.0
    daily_consumed_kwh: float = 0.0
    efficiency_ratio: float = 0.0
    peak_generation_hour: int = 12
    avg_generation_rate: float = 0.0
    avg_consumption_rate: float = 0.0

    def to_dict(self) -> Dict:
        return {
            "daily_generated_kwh": round(self.daily_generated_kwh, 3),
            "daily_consumed_kwh": round(self.daily_consumed_kwh, 3),
            "efficiency_ratio": round(self.efficiency_ratio, 2),
            "peak_generation_hour": self.peak_generation_hour,
            "avg_generation_rate": round(self.avg_generation_rate, 3),
            "avg_consumption_rate": round(self.avg_consumption_rate, 3),
        }


@dataclass
class SolarPowerState:
    """Current state of a solar power unit."""
    intersection_id: str
    battery_level: float           # 0-100 percentage
    solar_generation_w: float      # Current solar generation in watts
    power_consumption_w: float     # Current power consumption in watts
    status: PowerStatus
    is_grid_backup: bool = False
    temperature_c: float = 35.0
    panel_efficiency: float = 0.85
    energy_metrics: EnergyMetrics = field(default_factory=EnergyMetrics)

    def to_dict(self) -> Dict:
        return {
            "intersection_id": self.intersection_id,
            "battery_level": round(self.battery_level, 1),
            "solar_generation_w": round(self.solar_generation_w, 1),
            "power_consumption_w": round(self.power_consumption_w, 1),
            "status": self.status.value,
            "is_grid_backup": self.is_grid_backup,
            "temperature_c": round(self.temperature_c, 1),
            "panel_efficiency": round(self.panel_efficiency, 2),
            "energy_metrics": self.energy_metrics.to_dict(),
        }


class SolarPowerUnit:
    """
    Simulates a solar-powered traffic intersection unit.
    Manages solar generation, battery, consumption, and failsafe logic.
    """

    def __init__(
        self,
        intersection_id: str,
        panel_capacity_w: float = 500.0,
        battery_capacity_wh: float = 2000.0,
        low_battery_threshold: float = 20.0,
        critical_battery_threshold: float = 5.0,
    ):
        self.intersection_id = intersection_id
        self.panel_capacity_w = panel_capacity_w
        self.battery_capacity_wh = battery_capacity_wh
        self.low_battery_threshold = low_battery_threshold
        self.critical_battery_threshold = critical_battery_threshold

        # State
        self.battery_wh = battery_capacity_wh * 0.75  # Start at 75%
        self.status = PowerStatus.ACTIVE
        self.is_grid_backup = False
        self.is_reduced_mode = False

        # Consumption baselines (watts)
        self.base_consumption_w = 80.0    # Signal LEDs + controller
        self.camera_consumption_w = 30.0   # Per camera
        self.analytics_consumption_w = 20.0  # AI processing share
        self.num_cameras = 4

        # Energy tracking
        self.total_generated_wh = 0.0
        self.total_consumed_wh = 0.0
        self.daily_generated_wh = 0.0
        self.daily_consumed_wh = 0.0
        self.last_day = datetime.now().day
        self.last_update = time.time()

        # History
        self.generation_history: List[float] = []
        self.consumption_history: List[float] = []

    def _get_solar_generation(self) -> float:
        """
        Calculate current solar generation based on time of day.
        Uses a sinusoidal curve peaking at solar noon with weather variation.
        """
        now = datetime.now()
        hour = now.hour + now.minute / 60.0

        # Solar curve: peaks at 12:00, zero before 6AM and after 6PM
        if hour < 6.0 or hour > 18.0:
            base_generation = 0.0
        else:
            # Sinusoidal model: peak at noon
            solar_angle = math.pi * (hour - 6.0) / 12.0
            base_generation = self.panel_capacity_w * math.sin(solar_angle)

        # Weather/cloud variation (random noise)
        cloud_factor = 1.0 - random.uniform(0, 0.15)

        # Temperature derating (panels lose ~0.4% per °C above 25°C)
        temp = 25.0 + random.uniform(5, 15)
        temp_factor = max(0.7, 1.0 - 0.004 * max(0, temp - 25.0))

        generation = max(0.0, base_generation * cloud_factor * temp_factor)

        return generation

    def _get_consumption(self) -> float:
        """Calculate current power consumption based on active systems."""
        consumption = self.base_consumption_w

        if self.is_reduced_mode:
            # Low power: only 1 camera, no analytics
            consumption += self.camera_consumption_w
        else:
            # Full power: all cameras + analytics
            consumption += self.camera_consumption_w * self.num_cameras
            consumption += self.analytics_consumption_w

        # Small random variation
        consumption *= (1.0 + random.uniform(-0.05, 0.05))

        return consumption

    def _check_day_reset(self):
        """Reset daily counters at midnight."""
        current_day = datetime.now().day
        if current_day != self.last_day:
            self.daily_generated_wh = 0.0
            self.daily_consumed_wh = 0.0
            self.last_day = current_day

    def update(self) -> SolarPowerState:
        """
        Update solar power unit state. Should be called each processing cycle.

        Returns:
            Current SolarPowerState
        """
        current_time = time.time()
        dt_hours = (current_time - self.last_update) / 3600.0
        dt_hours = min(dt_hours, 1.0 / 60.0)  # Cap at 1 minute
        self.last_update = current_time

        self._check_day_reset()

        # Calculate generation and consumption
        generation_w = self._get_solar_generation()
        consumption_w = self._get_consumption()

        # Energy delta (watt-hours)
        energy_in = generation_w * dt_hours
        energy_out = consumption_w * dt_hours

        # Update battery
        self.battery_wh = self.battery_wh + energy_in - energy_out
        self.battery_wh = max(0.0, min(self.battery_capacity_wh, self.battery_wh))

        # Track totals
        self.total_generated_wh += energy_in
        self.total_consumed_wh += energy_out
        self.daily_generated_wh += energy_in
        self.daily_consumed_wh += energy_out

        # Battery percentage
        battery_pct = (self.battery_wh / self.battery_capacity_wh) * 100.0

        # Smart power management
        if battery_pct <= self.critical_battery_threshold:
            # Critical: switch to grid backup
            if not self.is_grid_backup:
                logger.warning(
                    f"[SOLAR] {self.intersection_id}: CRITICAL battery ({battery_pct:.1f}%) — switching to grid backup"
                )
            self.is_grid_backup = True
            self.is_reduced_mode = True
            self.status = PowerStatus.BACKUP_MODE
            # Simulate grid power topping up battery slowly
            self.battery_wh += 50.0 * dt_hours

        elif battery_pct <= self.low_battery_threshold:
            # Low power: reduce non-essential systems
            if not self.is_reduced_mode:
                logger.info(
                    f"[SOLAR] {self.intersection_id}: LOW battery ({battery_pct:.1f}%) — entering reduced mode"
                )
            self.is_reduced_mode = True
            self.is_grid_backup = False
            self.status = PowerStatus.LOW_POWER

        else:
            # Normal operation
            if self.is_reduced_mode:
                logger.info(
                    f"[SOLAR] {self.intersection_id}: Battery recovered ({battery_pct:.1f}%) — resuming full power"
                )
            self.is_reduced_mode = False
            self.is_grid_backup = False
            self.status = PowerStatus.ACTIVE

        # Check for total solar failure (nighttime + empty battery)
        if generation_w == 0 and battery_pct <= 0:
            self.status = PowerStatus.OFFLINE
            self.is_grid_backup = True

        # Update history
        self.generation_history.append(generation_w)
        self.consumption_history.append(consumption_w)
        if len(self.generation_history) > 200:
            self.generation_history = self.generation_history[-200:]
            self.consumption_history = self.consumption_history[-200:]

        # Build energy metrics
        efficiency = (
            (self.daily_generated_wh / self.daily_consumed_wh * 100.0)
            if self.daily_consumed_wh > 0 else 100.0
        )

        now = datetime.now()
        uptime_hours = max(1, now.hour - 6) if now.hour >= 6 else 1

        energy_metrics = EnergyMetrics(
            daily_generated_kwh=self.daily_generated_wh / 1000.0,
            daily_consumed_kwh=self.daily_consumed_wh / 1000.0,
            efficiency_ratio=min(efficiency, 200.0),
            peak_generation_hour=12,
            avg_generation_rate=self.daily_generated_wh / uptime_hours if uptime_hours > 0 else 0,
            avg_consumption_rate=self.daily_consumed_wh / max(1, now.hour) if now.hour > 0 else consumption_w,
        )

        return SolarPowerState(
            intersection_id=self.intersection_id,
            battery_level=round(battery_pct, 1),
            solar_generation_w=round(generation_w, 1),
            power_consumption_w=round(consumption_w, 1),
            status=self.status,
            is_grid_backup=self.is_grid_backup,
            temperature_c=round(25.0 + random.uniform(5, 15), 1),
            panel_efficiency=round(0.85 - random.uniform(0, 0.1), 2),
            energy_metrics=energy_metrics,
        )

    def get_alerts(self) -> List[Dict]:
        """Return any active power-related alerts."""
        alerts = []
        battery_pct = (self.battery_wh / self.battery_capacity_wh) * 100.0

        if self.status == PowerStatus.BACKUP_MODE:
            alerts.append({
                "type": "SOLAR_FAILURE",
                "severity": "CRITICAL",
                "intersection_id": self.intersection_id,
                "message": f"Solar power failed at {self.intersection_id} — grid backup active",
                "battery_level": round(battery_pct, 1),
            })
        elif self.status == PowerStatus.LOW_POWER:
            alerts.append({
                "type": "SOLAR_LOW",
                "severity": "WARNING",
                "intersection_id": self.intersection_id,
                "message": f"Low battery ({battery_pct:.0f}%) at {self.intersection_id} — reduced mode",
                "battery_level": round(battery_pct, 1),
            })

        return alerts


class SolarPowerManager:
    """Manages solar power units across all intersections."""

    def __init__(self, intersection_configs: List[Dict]):
        """
        Initialize solar power units for all intersections.

        Args:
            intersection_configs: List of dicts with 'id' and optional power params
        """
        self.units: Dict[str, SolarPowerUnit] = {}

        for config in intersection_configs:
            iid = config.get("id", config.get("name", "unknown"))
            self.units[iid] = SolarPowerUnit(
                intersection_id=iid,
                panel_capacity_w=config.get("panel_capacity_w", 500.0),
                battery_capacity_wh=config.get("battery_capacity_wh", 2000.0),
                low_battery_threshold=config.get("low_battery_threshold", 20.0),
            )

        logger.info(f"[SOLAR] Initialized {len(self.units)} solar power units")

    def update_all(self) -> Dict[str, Dict]:
        """Update all solar units and return their states."""
        states = {}
        for iid, unit in self.units.items():
            state = unit.update()
            states[iid] = state.to_dict()
        return states

    def get_all_alerts(self) -> List[Dict]:
        """Collect alerts from all units."""
        alerts = []
        for unit in self.units.values():
            alerts.extend(unit.get_alerts())
        return alerts

    def get_unit(self, intersection_id: str) -> Optional[SolarPowerUnit]:
        """Get a specific solar power unit."""
        return self.units.get(intersection_id)
