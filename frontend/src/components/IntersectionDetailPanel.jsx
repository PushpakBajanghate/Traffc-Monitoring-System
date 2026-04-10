import React, { useMemo } from 'react';
import { MapPin, Activity, Zap, AlertTriangle, Sun, Battery } from 'lucide-react';

/**
 * Intersection Detail Side Panel.
 * Shows complete per-intersection stats: vehicle counts, signal timing, solar, environmental.
 */
export default function IntersectionDetailPanel({ intersection, solarData = {}, environmentalData = {} }) {
  if (!intersection) {
    return (
      <div className="card">
        <div className="card-header">
          <MapPin size={18} className="text-blue-400" />
          <span>Intersection Detail</span>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p className="text-sm">Select an intersection to view details</p>
        </div>
      </div>
    );
  }

  const congestionColors = {
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-red-400',
  };

  const solar = solarData[intersection.id] || null;
  const env = environmentalData[intersection.id] || null;

  return (
    <div className="card max-h-[600px] overflow-y-auto custom-scrollbar">
      <div className="card-header">
        <MapPin size={18} className="text-blue-400" />
        <span className="truncate">{intersection.name}</span>
      </div>

      {/* Congestion & Status */}
      <div className="mt-3 flex items-center gap-3">
        <span className={`text-lg font-bold ${congestionColors[intersection.congestion_level] || 'text-gray-400'}`}>
          {intersection.congestion_level}
        </span>
        <span className="text-xs text-gray-500">|</span>
        <span className="text-xs text-gray-400">{intersection.vehicle_count} vehicles</span>
        {intersection.emergency_active && (
          <span className="ml-auto text-xs text-red-400 flex items-center gap-1 animate-pulse">
            <AlertTriangle size={12} /> Emergency
          </span>
        )}
      </div>

      {/* Signal Mode */}
      <div className="mt-3 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
        <div className="text-xs text-gray-500 mb-1">Signal Mode</div>
        <span className={`text-sm font-semibold ${
          intersection.signal_mode === 'EMERGENCY_CORRIDOR' ? 'text-red-400' :
          intersection.signal_mode === 'CRITICAL' ? 'text-orange-400' :
          intersection.signal_mode === 'ADAPTIVE' ? 'text-yellow-400' :
          intersection.signal_mode === 'COORDINATED' ? 'text-purple-400' :
          'text-green-400'
        }`}>
          {intersection.signal_mode?.replace(/_/g, ' ')}
        </span>
        {intersection.is_green_corridor && (
          <span className="ml-2 text-xs text-blue-400">🟦 Green Corridor Active</span>
        )}
      </div>

      {/* Lane Counts */}
      {intersection.lane_counts && Object.keys(intersection.lane_counts).length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-2">Lane Vehicle Counts</div>
          <div className="space-y-1.5">
            {Object.entries(intersection.lane_counts).map(([lane, count]) => (
              <div key={lane} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-16 capitalize">{lane.replace(/_/g, ' ')}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (count / 20) * 100)}%`,
                      backgroundColor: count >= 15 ? '#ef4444' : count >= 10 ? '#eab308' : '#22c55e',
                    }}
                  />
                </div>
                <span className="text-xs text-white font-medium w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signal Timing */}
      {intersection.signal_times && Object.keys(intersection.signal_times).length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-2">Signal Timing (seconds)</div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(intersection.signal_times).map(([lane, time]) => (
              <div key={lane} className="bg-gray-800/50 rounded-lg p-2 text-center">
                <div className="text-[10px] text-gray-500 capitalize">{lane.replace(/_/g, ' ')}</div>
                <div className="text-sm font-bold text-green-400">{time}s</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solar Mini */}
      {solar && (
        <div className="mt-3 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
            <Sun size={12} className="text-yellow-400" /> Solar Power
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Battery size={12} className="text-gray-400" />
              <span className="text-white font-medium">{Math.round(solar.battery_level)}%</span>
            </div>
            <span className="text-yellow-400">☀ {solar.solar_generation_w}W</span>
            <span className="text-blue-400">⚡ {solar.power_consumption_w}W</span>
          </div>
          <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${solar.battery_level}%`,
                backgroundColor: solar.battery_level >= 50 ? '#22c55e' : solar.battery_level >= 20 ? '#eab308' : '#ef4444',
              }}
            />
          </div>
        </div>
      )}

      {/* Environmental Mini */}
      {env && (
        <div className="mt-3 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
            <Activity size={12} className="text-green-400" /> Environment
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: env.aqi_color }} />
              <span className="text-white font-medium">AQI {env.aqi}</span>
            </div>
            <span className="text-gray-400">{env.noise_db} dB</span>
            <span className="text-gray-400">{env.temperature_c}°C</span>
          </div>
        </div>
      )}

      {/* Neighbors */}
      {intersection.neighbors && intersection.neighbors.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1.5">Connected Intersections</div>
          <div className="flex flex-wrap gap-1">
            {intersection.neighbors.map(nid => (
              <span key={nid} className="text-[10px] px-2 py-0.5 bg-gray-800 rounded-full text-gray-400 capitalize">
                {nid.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
