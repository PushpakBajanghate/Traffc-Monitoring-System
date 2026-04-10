"""
Multi-Intersection Coordination Engine.
Manages a network of traffic intersections, coordinates signals between neighbors,
and implements green corridor logic for emergency vehicles.
"""

import time
import random
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from loguru import logger

from core.signal_control import calculate_signal_times, get_priority_lane, THRESHOLD


@dataclass
class Intersection:
    """Represents a single traffic intersection."""
    id: str
    name: str
    lat: float
    lng: float
    lane_counts: Dict[str, int] = field(default_factory=dict)
    signal_times: Dict[str, int] = field(default_factory=dict)
    priority_lane: Optional[str] = None
    congestion_level: str = "LOW"
    vehicle_count: int = 0
    emergency_active: bool = False
    emergency_type: Optional[str] = None
    is_green_corridor: bool = False
    signal_mode: str = "NORMAL"

    # Neighbor intersection IDs for coordination
    neighbors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "lat": self.lat,
            "lng": self.lng,
            "lane_counts": self.lane_counts,
            "signal_times": self.signal_times,
            "priority_lane": self.priority_lane,
            "congestion_level": self.congestion_level,
            "vehicle_count": self.vehicle_count,
            "emergency_active": self.emergency_active,
            "emergency_type": self.emergency_type,
            "is_green_corridor": self.is_green_corridor,
            "signal_mode": self.signal_mode,
            "neighbors": self.neighbors,
        }


@dataclass
class GreenCorridor:
    """Represents an active emergency green corridor."""
    corridor_id: str
    emergency_type: str
    intersection_ids: List[str]
    route_coords: List[Dict]  # [{lat, lng}, ...]
    created_at: float
    is_active: bool = True

    def to_dict(self) -> Dict:
        return {
            "corridor_id": self.corridor_id,
            "emergency_type": self.emergency_type,
            "intersection_ids": self.intersection_ids,
            "route_coords": self.route_coords,
            "created_at": self.created_at,
            "is_active": self.is_active,
            "duration_seconds": round(time.time() - self.created_at, 1),
        }


class IntersectionNetwork:
    """
    Manages a network of intersections.
    Handles signal coordination, green corridors, and neighbor balancing.
    """

    def __init__(self, intersection_configs: List[Dict]):
        """
        Initialize the intersection network.

        Args:
            intersection_configs: List of intersection config dicts with:
                id, name, lat, lng, neighbors (list of neighbor IDs)
        """
        self.intersections: Dict[str, Intersection] = {}
        self.active_corridors: List[GreenCorridor] = []
        self.corridor_counter = 0

        for config in intersection_configs:
            iid = config["id"]
            self.intersections[iid] = Intersection(
                id=iid,
                name=config["name"],
                lat=config["lat"],
                lng=config["lng"],
                neighbors=config.get("neighbors", []),
            )

        logger.info(f"[NETWORK] Initialized {len(self.intersections)} intersections")

    def update(
        self,
        primary_lane_counts: Dict[str, int],
        primary_congestion: str,
        primary_vehicle_count: int,
        primary_emergency: bool,
        primary_emergency_type: Optional[str],
    ) -> Dict:
        """
        Update all intersections. The primary intersection uses real pipeline data;
        others are simulated for demo purposes.

        Args:
            primary_lane_counts: Lane counts from the primary pipeline
            primary_congestion: Congestion level from primary pipeline
            primary_vehicle_count: Total vehicle count
            primary_emergency: Whether emergency is active
            primary_emergency_type: Type of emergency

        Returns:
            Dict with all intersection states and corridor info
        """
        intersection_list = list(self.intersections.values())

        # Update primary intersection (first one)
        if intersection_list:
            primary = intersection_list[0]
            primary.lane_counts = primary_lane_counts
            primary.signal_times = calculate_signal_times(primary_lane_counts)
            primary.priority_lane = get_priority_lane(primary_lane_counts)
            primary.congestion_level = primary_congestion
            primary.vehicle_count = primary_vehicle_count
            primary.emergency_active = primary_emergency
            primary.emergency_type = primary_emergency_type

            # Determine signal mode
            overloaded = sum(1 for c in primary_lane_counts.values() if c >= THRESHOLD)
            if overloaded >= len(primary_lane_counts) and primary_lane_counts:
                primary.signal_mode = "CRITICAL"
            elif overloaded > 0:
                primary.signal_mode = "ADAPTIVE"
            else:
                primary.signal_mode = "NORMAL"

        # Update simulated intersections
        for intersection in intersection_list[1:]:
            self._simulate_intersection(intersection)

        # Handle neighbor coordination
        self._coordinate_neighbors()

        # Handle emergency corridors
        if primary_emergency and not self.active_corridors:
            self._create_green_corridor(
                intersection_list[0].id if intersection_list else "",
                primary_emergency_type or "emergency",
            )

        # Clear expired corridors
        if not primary_emergency:
            self._clear_corridors()

        return self._get_network_state()

    def _simulate_intersection(self, intersection: Intersection):
        """Generate simulated data for non-primary intersections."""
        # Generate plausible lane counts
        num_lanes = random.randint(3, 4)
        lane_counts = {}
        for i in range(num_lanes):
            lane_id = f"lane_{i + 1}"
            lane_counts[lane_id] = random.randint(2, 20)

        intersection.lane_counts = lane_counts
        intersection.signal_times = calculate_signal_times(lane_counts)
        intersection.priority_lane = get_priority_lane(lane_counts)

        total = sum(lane_counts.values())
        intersection.vehicle_count = total

        if total < 10:
            intersection.congestion_level = "LOW"
        elif total < 20:
            intersection.congestion_level = "MEDIUM"
        else:
            intersection.congestion_level = "HIGH"

        # Small chance of emergency
        intersection.emergency_active = random.random() < 0.03
        intersection.emergency_type = random.choice(["ambulance", "firebrigade"]) if intersection.emergency_active else None

        overloaded = sum(1 for c in lane_counts.values() if c >= THRESHOLD)
        if overloaded >= len(lane_counts):
            intersection.signal_mode = "CRITICAL"
        elif overloaded > 0:
            intersection.signal_mode = "ADAPTIVE"
        else:
            intersection.signal_mode = "NORMAL"

    def _coordinate_neighbors(self):
        """
        If an intersection is congested, reduce inflow from its neighbors
        by extending their red/reducing their green toward the congested direction.
        """
        for iid, intersection in self.intersections.items():
            if intersection.congestion_level == "HIGH":
                for neighbor_id in intersection.neighbors:
                    neighbor = self.intersections.get(neighbor_id)
                    if neighbor and neighbor.signal_times:
                        # Reduce green times for neighbor lanes directing toward this intersection
                        adjusted_times = {}
                        for lane, gt in neighbor.signal_times.items():
                            adjusted_times[lane] = max(15, gt - 5)
                        neighbor.signal_times = adjusted_times
                        if neighbor.signal_mode == "NORMAL":
                            neighbor.signal_mode = "COORDINATED"

    def _create_green_corridor(self, start_id: str, emergency_type: str):
        """
        Create a green corridor from the emergency detection point
        through connected intersections.
        """
        self.corridor_counter += 1

        # Build corridor path through neighbors
        corridor_ids = [start_id]
        current = start_id
        visited = {start_id}

        # Walk through up to 3 connected intersections
        for _ in range(3):
            intersection = self.intersections.get(current)
            if not intersection or not intersection.neighbors:
                break
            for nid in intersection.neighbors:
                if nid not in visited:
                    corridor_ids.append(nid)
                    visited.add(nid)
                    current = nid
                    break

        # Build route coordinates
        route_coords = []
        for cid in corridor_ids:
            intr = self.intersections.get(cid)
            if intr:
                route_coords.append({"lat": intr.lat, "lng": intr.lng})
                intr.is_green_corridor = True
                # Override signal: all lanes get max green
                if intr.signal_times:
                    intr.signal_times = {lane: 60 for lane in intr.signal_times}
                intr.signal_mode = "EMERGENCY_CORRIDOR"

        corridor = GreenCorridor(
            corridor_id=f"GC-{self.corridor_counter:03d}",
            emergency_type=emergency_type,
            intersection_ids=corridor_ids,
            route_coords=route_coords,
            created_at=time.time(),
        )
        self.active_corridors.append(corridor)
        logger.warning(f"[CORRIDOR] Green corridor activated: {corridor.corridor_id} through {corridor_ids}")

    def _clear_corridors(self):
        """Clear all active green corridors."""
        if self.active_corridors:
            for corridor in self.active_corridors:
                corridor.is_active = False
                for cid in corridor.intersection_ids:
                    intr = self.intersections.get(cid)
                    if intr:
                        intr.is_green_corridor = False

            logger.info(f"[CORRIDOR] Cleared {len(self.active_corridors)} green corridors")
            self.active_corridors.clear()

    def _get_network_state(self) -> Dict:
        """Get complete network state."""
        return {
            "intersections": [i.to_dict() for i in self.intersections.values()],
            "active_corridors": [c.to_dict() for c in self.active_corridors if c.is_active],
            "total_intersections": len(self.intersections),
            "congested_count": sum(
                1 for i in self.intersections.values() if i.congestion_level == "HIGH"
            ),
            "emergency_count": sum(
                1 for i in self.intersections.values() if i.emergency_active
            ),
        }

    def get_intersection(self, intersection_id: str) -> Optional[Dict]:
        """Get a single intersection's state."""
        intr = self.intersections.get(intersection_id)
        return intr.to_dict() if intr else None

    def trigger_green_corridor(self, start_id: str, emergency_type: str = "emergency") -> Optional[Dict]:
        """Manually trigger a green corridor (for testing)."""
        self._create_green_corridor(start_id, emergency_type)
        if self.active_corridors:
            return self.active_corridors[-1].to_dict()
        return None
