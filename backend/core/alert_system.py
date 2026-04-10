"""
Centralized Alert & Automation System.
Aggregates alerts from all subsystems (traffic, solar, environmental, emergency)
and triggers automated responses.
"""

import time
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from loguru import logger


class AlertSeverity(Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertType(Enum):
    CONGESTION_THRESHOLD = "CONGESTION_THRESHOLD"
    SIGNAL_OVERLOAD = "SIGNAL_OVERLOAD"
    EMERGENCY_DETECTED = "EMERGENCY_DETECTED"
    EMERGENCY_CLEARED = "EMERGENCY_CLEARED"
    SOLAR_LOW = "SOLAR_LOW"
    SOLAR_FAILURE = "SOLAR_FAILURE"
    AIR_QUALITY_POOR = "AIR_QUALITY_POOR"
    NOISE_HIGH = "NOISE_HIGH"
    GREEN_CORRIDOR_ACTIVE = "GREEN_CORRIDOR_ACTIVE"
    SYSTEM_STATUS = "SYSTEM_STATUS"


@dataclass
class Alert:
    """Represents a system alert."""
    id: str
    type: str
    severity: str
    message: str
    timestamp: float
    source: str = ""
    zone_id: str = ""
    auto_resolved: bool = False
    resolved_at: Optional[float] = None
    metadata: Dict = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.type,
            "severity": self.severity,
            "message": self.message,
            "timestamp": self.timestamp,
            "timestamp_iso": datetime.fromtimestamp(self.timestamp).isoformat(),
            "source": self.source,
            "zone_id": self.zone_id,
            "auto_resolved": self.auto_resolved,
            "resolved_at": self.resolved_at,
            "age_seconds": round(time.time() - self.timestamp, 1),
            "metadata": self.metadata,
        }


class AlertSystem:
    """
    Centralized alert management system.
    Collects, deduplicates, and manages alerts from all subsystems.
    Supports automated response triggers.
    """

    MAX_ACTIVE_ALERTS = 50
    MAX_HISTORY = 200
    DEDUP_WINDOW_SECONDS = 30  # Same alert type + zone won't repeat within this window

    def __init__(self):
        self.active_alerts: List[Alert] = []
        self.alert_history: List[Alert] = []
        self.alert_counter = 0
        self.auto_actions_log: List[Dict] = []
        self._recent_keys: Dict[str, float] = {}  # dedup key -> timestamp

        logger.info("[ALERTS] Alert system initialized")

    def _generate_id(self) -> str:
        self.alert_counter += 1
        return f"ALT-{self.alert_counter:05d}"

    def _dedup_key(self, alert_type: str, zone_id: str) -> str:
        return f"{alert_type}:{zone_id}"

    def _is_duplicate(self, alert_type: str, zone_id: str) -> bool:
        key = self._dedup_key(alert_type, zone_id)
        last_time = self._recent_keys.get(key)
        if last_time and (time.time() - last_time) < self.DEDUP_WINDOW_SECONDS:
            return True
        return False

    def add_alert(
        self,
        alert_type: str,
        severity: str,
        message: str,
        source: str = "",
        zone_id: str = "",
        metadata: Dict = None,
    ) -> Optional[Alert]:
        """
        Add a new alert if not a duplicate.

        Returns:
            Created Alert or None if deduplicated
        """
        if self._is_duplicate(alert_type, zone_id):
            return None

        alert = Alert(
            id=self._generate_id(),
            type=alert_type,
            severity=severity,
            message=message,
            timestamp=time.time(),
            source=source,
            zone_id=zone_id,
            metadata=metadata or {},
        )

        self.active_alerts.insert(0, alert)
        self._recent_keys[self._dedup_key(alert_type, zone_id)] = time.time()

        # Trim active alerts
        if len(self.active_alerts) > self.MAX_ACTIVE_ALERTS:
            expired = self.active_alerts[self.MAX_ACTIVE_ALERTS:]
            self.active_alerts = self.active_alerts[:self.MAX_ACTIVE_ALERTS]
            self.alert_history.extend(expired)

        # Trim history
        if len(self.alert_history) > self.MAX_HISTORY:
            self.alert_history = self.alert_history[-self.MAX_HISTORY:]

        # Clean old dedup keys
        now = time.time()
        self._recent_keys = {
            k: v for k, v in self._recent_keys.items()
            if now - v < self.DEDUP_WINDOW_SECONDS * 2
        }

        return alert

    def ingest_alerts(self, alerts: List[Dict], source: str = ""):
        """
        Ingest a batch of alerts from a subsystem.

        Args:
            alerts: List of alert dicts with 'type', 'severity', 'message', etc.
            source: Source subsystem name
        """
        for alert_data in alerts:
            self.add_alert(
                alert_type=alert_data.get("type", "UNKNOWN"),
                severity=alert_data.get("severity", "INFO"),
                message=alert_data.get("message", ""),
                source=source,
                zone_id=alert_data.get("zone_id", alert_data.get("intersection_id", "")),
                metadata={k: v for k, v in alert_data.items()
                          if k not in ("type", "severity", "message", "zone_id", "intersection_id")},
            )

    def check_traffic_thresholds(
        self,
        total_vehicles: int,
        congestion_level: str,
        lane_counts: Dict[str, int],
        threshold: int = 15,
        congestion_alert_threshold: int = 25,
    ):
        """
        Check traffic metrics and generate alerts automatically.

        Args:
            total_vehicles: Total vehicles across all lanes
            congestion_level: Current congestion level (LOW/MEDIUM/HIGH)
            lane_counts: Dict of lane_id -> vehicle count
            threshold: Per-lane overload threshold
            congestion_alert_threshold: Total vehicle count alert threshold
        """
        # Congestion threshold alert
        if total_vehicles >= congestion_alert_threshold:
            self.add_alert(
                alert_type=AlertType.CONGESTION_THRESHOLD.value,
                severity=AlertSeverity.WARNING.value,
                message=f"Vehicle count ({total_vehicles}) exceeded threshold ({congestion_alert_threshold})",
                source="traffic",
                metadata={"total_vehicles": total_vehicles, "congestion": congestion_level},
            )

        # Signal overload per lane
        overloaded = [lid for lid, c in lane_counts.items() if c >= threshold]
        if len(overloaded) >= len(lane_counts) and lane_counts:
            self.add_alert(
                alert_type=AlertType.SIGNAL_OVERLOAD.value,
                severity=AlertSeverity.CRITICAL.value,
                message=f"All {len(overloaded)} lanes overloaded — signal system under stress",
                source="traffic",
                metadata={"overloaded_lanes": overloaded, "lane_counts": lane_counts},
            )

    def get_active_alerts(self, limit: int = 20) -> List[Dict]:
        """Get most recent active alerts."""
        return [a.to_dict() for a in self.active_alerts[:limit]]

    def get_alert_summary(self) -> Dict:
        """Get alert system summary statistics."""
        severity_counts = {"INFO": 0, "WARNING": 0, "CRITICAL": 0}
        for alert in self.active_alerts:
            if alert.severity in severity_counts:
                severity_counts[alert.severity] += 1

        return {
            "total_active": len(self.active_alerts),
            "total_history": len(self.alert_history),
            "total_generated": self.alert_counter,
            "severity_breakdown": severity_counts,
            "auto_actions": len(self.auto_actions_log),
        }

    def clear_old_alerts(self, max_age_seconds: float = 300):
        """Move alerts older than max_age to history."""
        now = time.time()
        still_active = []
        for alert in self.active_alerts:
            if now - alert.timestamp > max_age_seconds:
                alert.auto_resolved = True
                alert.resolved_at = now
                self.alert_history.append(alert)
            else:
                still_active.append(alert)
        self.active_alerts = still_active
