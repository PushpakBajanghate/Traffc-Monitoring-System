import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored circle markers
const createCircleIcon = (color, size = 14, pulse = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 8px ${color}80;
        ${pulse ? 'animation: pulse 1.5s infinite;' : ''}
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

const getMarkerColor = (intersection) => {
  if (intersection.emergency_active) return '#a855f7'; // purple
  if (intersection.is_green_corridor) return '#3b82f6'; // blue
  switch (intersection.congestion_level) {
    case 'HIGH': return '#ef4444';    // red
    case 'MEDIUM': return '#eab308';  // yellow
    default: return '#22c55e';        // green
  }
};

const getZoneColor = (congestion) => {
  switch (congestion) {
    case 'HIGH': return '#ef4444';
    case 'MEDIUM': return '#eab308';
    default: return '#22c55e';
  }
};

// Component to auto-fit map bounds when intersections change
function MapAutoFit({ intersections }) {
  const map = useMap();
  
  useMemo(() => {
    if (intersections.length > 1) {
      const bounds = L.latLngBounds(intersections.map(i => [i.lat, i.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [intersections.length]);

  return null;
}

/**
 * Interactive Traffic Map using Leaflet + OpenStreetMap (FREE, no API key needed).
 * Shows all intersections as color-coded markers with zone overlays,
 * green corridor route during emergencies, and detailed popups.
 */
export default function InteractiveTrafficMap({ 
  trafficData,
  onLocationSelect,
  selectedLocation 
}) {
  const [activePopup, setActivePopup] = useState(null);

  // Center on primary location
  const center = [
    trafficData?.lat || 21.1458,
    trafficData?.lng || 79.0882
  ];

  // Build intersection markers from network data
  const intersections = useMemo(() => {
    if (trafficData?.intersections && trafficData.intersections.length > 0) {
      return trafficData.intersections;
    }
    return [{
      id: 'primary',
      name: trafficData?.area || 'Intersection',
      lat: trafficData?.lat || 21.1458,
      lng: trafficData?.lng || 79.0882,
      congestion_level: trafficData?.congestion || 'LOW',
      vehicle_count: trafficData?.total || 0,
      signal_mode: trafficData?.signal_mode || 'NORMAL',
      emergency_active: trafficData?.emergency_mode || false,
      is_green_corridor: false,
    }];
  }, [trafficData]);

  // Green corridor route
  const corridorPath = useMemo(() => {
    if (trafficData?.green_corridor && trafficData.green_corridor.length > 0) {
      const corridor = trafficData.green_corridor[0];
      return corridor.route_coords?.map(c => [c.lat, c.lng]) || [];
    }
    return [];
  }, [trafficData?.green_corridor]);

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden border-2 flex-1 ${
      trafficData?.emergency_mode ? 'border-red-500 emergency-border' : 'border-gray-700'
    }`}>
      {/* Inject pulse animation CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        .leaflet-container { background: #1a1a2e; }
        .leaflet-popup-content-wrapper { background: #1f2937; color: white; border-radius: 12px; border: 1px solid #374151; }
        .leaflet-popup-tip { background: #1f2937; }
        .leaflet-popup-content { margin: 8px 12px; }
        .leaflet-control-zoom a { background: #1f2937 !important; color: #9ca3af !important; border-color: #374151 !important; }
        .leaflet-control-zoom a:hover { background: #374151 !important; color: white !important; }
        .leaflet-control-attribution { background: rgba(0,0,0,0.5) !important; color: #6b7280 !important; }
        .leaflet-control-attribution a { color: #9ca3af !important; }
      `}</style>

      <MapContainer
        center={center}
        zoom={14}
        style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        zoomControl={true}
      >
        {/* Dark themed OpenStreetMap tiles — FREE, no key needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Auto-fit map to show all intersections */}
        <MapAutoFit intersections={intersections} />

        {/* Zone overlays (geo-fenced circles) */}
        {intersections.map((intersection) => (
          <Circle
            key={`zone-${intersection.id}`}
            center={[intersection.lat, intersection.lng]}
            radius={300}
            pathOptions={{
              fillColor: getZoneColor(intersection.congestion_level),
              fillOpacity: 0.1,
              color: getZoneColor(intersection.congestion_level),
              opacity: 0.4,
              weight: 1.5,
            }}
          />
        ))}

        {/* Green corridor polyline */}
        {corridorPath.length > 1 && (
          <Polyline
            positions={corridorPath}
            pathOptions={{
              color: '#3b82f6',
              opacity: 0.8,
              weight: 5,
              dashArray: '10 6',
            }}
          />
        )}

        {/* Intersection markers */}
        {intersections.map((intersection) => {
          const color = getMarkerColor(intersection);
          const pulse = intersection.emergency_active || intersection.is_green_corridor;
          
          return (
            <Marker
              key={intersection.id}
              position={[intersection.lat, intersection.lng]}
              icon={createCircleIcon(color, intersection.emergency_active ? 18 : 14, pulse)}
              eventHandlers={{
                click: () => {
                  setActivePopup(intersection.id);
                  if (onLocationSelect) {
                    onLocationSelect({
                      id: intersection.id,
                      name: intersection.name,
                      lat: intersection.lat,
                      lng: intersection.lng,
                    });
                  }
                },
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h3 className="font-bold text-sm mb-1.5 text-white">{intersection.name}</h3>
                  <div className="space-y-1 text-xs">
                    <p className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span style={{ color: getZoneColor(intersection.congestion_level) }} className="font-semibold">
                        {intersection.congestion_level}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Vehicles</span>
                      <span className="text-white font-medium">{intersection.vehicle_count || 0}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-400">Signal</span>
                      <span className="text-white font-medium">{intersection.signal_mode || 'NORMAL'}</span>
                    </p>
                    {intersection.emergency_active && (
                      <p className="text-red-400 font-bold mt-1">
                        🚨 Emergency ({intersection.emergency_type})
                      </p>
                    )}
                    {intersection.is_green_corridor && (
                      <p className="text-blue-400 font-bold mt-1">
                        🟦 Green Corridor Active
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-300 space-y-1 border border-gray-700/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Smooth Flow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Congested</span>
        </div>
        {corridorPath.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Green Corridor</span>
          </div>
        )}
      </div>

      {/* Intersection count badge */}
      <div className="absolute top-3 right-3 z-[1000] bg-gray-900/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs text-gray-300 border border-gray-700/50">
        {intersections.length} intersections
      </div>
    </div>
  );
}
