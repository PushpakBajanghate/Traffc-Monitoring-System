import React, { useMemo } from 'react';
import { Wind, Volume2, Thermometer, Droplets, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

/**
 * Environmental Monitoring Panel.
 * Displays AQI, noise levels, PM2.5/PM10, CO2, temperature, humidity per zone.
 */
export default function EnvironmentalPanel({ environmentalData = {}, compact = false }) {
  const zones = useMemo(() => Object.entries(environmentalData), [environmentalData]);

  if (zones.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <Wind size={18} className="text-green-400" />
          <span>Environmental Sensors</span>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p className="text-sm">Waiting for sensor data...</p>
        </div>
      </div>
    );
  }

  const TrendIcon = ({ trend }) => {
    if (trend === 'worsening') return <TrendingUp size={12} className="text-red-400" />;
    if (trend === 'improving') return <TrendingDown size={12} className="text-green-400" />;
    return <Minus size={12} className="text-gray-500" />;
  };

  const getAqiBarWidth = (aqi) => Math.min(100, (aqi / 300) * 100);
  const getNoiseBarWidth = (db) => Math.min(100, ((db - 30) / 60) * 100);

  // Compact mode for dashboard overview
  if (compact) {
    return (
      <div className="card">
        <div className="card-header">
          <Wind size={18} className="text-green-400" />
          <span>Environment</span>
          <span className="ml-auto text-xs text-gray-500">{zones.length} zones</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {zones.map(([id, data]) => (
            <div key={id} className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="text-xs text-gray-400 truncate mb-1 capitalize">{id.replace(/_/g, ' ')}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: data.aqi_color }}
                    />
                    <span className="text-xs font-medium text-white">AQI {data.aqi}</span>
                    <TrendIcon trend={data.trend} />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Volume2 size={10} className="text-gray-500" />
                    <span className="text-xs text-gray-400">{data.noise_db} dB</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full panel view
  return (
    <div className="card">
      <div className="card-header">
        <Wind size={18} className="text-green-400" />
        <span>Environmental Monitoring</span>
        <span className="ml-auto text-xs text-gray-500">{zones.length} zones</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {zones.map(([id, data]) => (
          <div key={id} className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50 hover:border-gray-600/50 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white capitalize">{id.replace(/_/g, ' ')}</h3>
              <div className="flex items-center gap-1">
                <TrendIcon trend={data.trend} />
                <span className={`text-xs ${
                  data.trend === 'improving' ? 'text-green-400' :
                  data.trend === 'worsening' ? 'text-red-400' : 'text-gray-500'
                }`}>{data.trend}</span>
              </div>
            </div>

            {/* AQI */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Air Quality Index</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ color: data.aqi_color, backgroundColor: data.aqi_color + '15', border: `1px solid ${data.aqi_color}40` }}
                >
                  {data.aqi_category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">{data.aqi}</span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getAqiBarWidth(data.aqi)}%`,
                      backgroundColor: data.aqi_color,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Noise Level */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Volume2 size={12} /> Noise Level
                </span>
                <span className="text-xs text-gray-300">{data.noise_category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white">{data.noise_db}<span className="text-xs text-gray-500 ml-0.5">dB</span></span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${getNoiseBarWidth(data.noise_db)}%`,
                      backgroundColor: data.noise_db > 75 ? '#ef4444' : data.noise_db > 60 ? '#eab308' : '#22c55e',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Detailed Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800/50 rounded-lg p-2">
                <div className="text-gray-500">PM2.5</div>
                <div className="text-white font-semibold">{data.pm25} <span className="text-gray-500 font-normal">µg/m³</span></div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2">
                <div className="text-gray-500">PM10</div>
                <div className="text-white font-semibold">{data.pm10} <span className="text-gray-500 font-normal">µg/m³</span></div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 flex items-center gap-2">
                <Thermometer size={14} className="text-orange-400" />
                <div>
                  <div className="text-gray-500">Temp</div>
                  <div className="text-white font-semibold">{data.temperature_c}°C</div>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 flex items-center gap-2">
                <Droplets size={14} className="text-blue-400" />
                <div>
                  <div className="text-gray-500">Humidity</div>
                  <div className="text-white font-semibold">{data.humidity_pct}%</div>
                </div>
              </div>
            </div>

            {/* CO2 */}
            <div className="mt-2 bg-gray-800/50 rounded-lg p-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">CO₂</span>
                <span className="text-white font-semibold">{data.co2_ppm} ppm</span>
              </div>
            </div>

            {/* Alert indicator */}
            {data.aqi > 150 && (
              <div className="mt-2 bg-orange-500/10 border border-orange-500/30 rounded-lg p-1.5 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />
                <span className="text-xs text-orange-300">Air quality unhealthy</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
