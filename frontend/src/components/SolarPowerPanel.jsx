import React, { useMemo } from 'react';
import { Battery, Sun, Zap, AlertTriangle, Activity, TrendingUp, Power } from 'lucide-react';

/**
 * Solar Power Dashboard Panel.
 * Shows per-intersection solar energy data: battery, generation, consumption, status.
 */
export default function SolarPowerPanel({ solarData = {}, compact = false }) {
  const intersections = useMemo(() => Object.entries(solarData), [solarData]);

  if (intersections.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <Sun size={18} className="text-yellow-400" />
          <span>Solar Power System</span>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          <p className="text-sm">Waiting for solar data...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400';
      case 'LOW_POWER': return 'text-yellow-400';
      case 'BACKUP_MODE': return 'text-red-400';
      case 'OFFLINE': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/10 border-green-500/30';
      case 'LOW_POWER': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'BACKUP_MODE': return 'bg-red-500/10 border-red-500/30';
      case 'OFFLINE': return 'bg-gray-500/10 border-gray-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getBatteryColor = (level) => {
    if (level >= 60) return '#22c55e';
    if (level >= 30) return '#eab308';
    if (level >= 10) return '#f97316';
    return '#ef4444';
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'ACTIVE': return <Power size={14} className="text-green-400" />;
      case 'LOW_POWER': return <AlertTriangle size={14} className="text-yellow-400" />;
      case 'BACKUP_MODE': return <Zap size={14} className="text-red-400 animate-pulse" />;
      default: return <Power size={14} className="text-gray-500" />;
    }
  };

  // Compact mode for dashboard overview
  if (compact) {
    return (
      <div className="card">
        <div className="card-header">
          <Sun size={18} className="text-yellow-400" />
          <span>Solar Power</span>
          <span className="ml-auto text-xs text-gray-500">{intersections.length} units</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {intersections.map(([id, data]) => (
            <div key={id} className={`p-2 rounded-lg border ${getStatusBg(data.status)}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <StatusIcon status={data.status} />
                <span className="text-xs text-gray-300 truncate">{id.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8">
                  <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#374151" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke={getBatteryColor(data.battery_level)}
                      strokeWidth="3"
                      strokeDasharray={`${data.battery_level * 0.94} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                    {Math.round(data.battery_level)}
                  </span>
                </div>
                <div className="text-xs">
                  <div className="text-yellow-400">☀ {data.solar_generation_w}W</div>
                  <div className="text-blue-400">⚡ {data.power_consumption_w}W</div>
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
        <Sun size={18} className="text-yellow-400" />
        <span>Solar Power Management System</span>
        <span className="ml-auto text-xs text-gray-500">{intersections.length} intersections</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {intersections.map(([id, data]) => (
          <div key={id} className={`p-4 rounded-xl border ${getStatusBg(data.status)} transition-all`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white capitalize">{id.replace(/_/g, ' ')}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(data.status)} ${getStatusBg(data.status)}`}>
                {data.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Battery Gauge */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#1f2937" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={getBatteryColor(data.battery_level)}
                    strokeWidth="2.5"
                    strokeDasharray={`${data.battery_level * 0.94} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Battery size={12} className="text-gray-400" />
                  <span className="text-sm font-bold text-white">{Math.round(data.battery_level)}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Sun size={12} className="text-yellow-400" /> Generation
                  </span>
                  <span className="text-yellow-400 font-medium">{data.solar_generation_w} W</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Zap size={12} className="text-blue-400" /> Consumption
                  </span>
                  <span className="text-blue-400 font-medium">{data.power_consumption_w} W</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Activity size={12} className="text-purple-400" /> Efficiency
                  </span>
                  <span className="text-purple-400 font-medium">
                    {data.panel_efficiency ? `${(data.panel_efficiency * 100).toFixed(0)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Energy Metrics */}
            {data.energy_metrics && (
              <div className="border-t border-gray-700/50 pt-3 space-y-2">
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <TrendingUp size={12} /> Daily Energy Analytics
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-500">Generated</div>
                    <div className="text-yellow-400 font-semibold">
                      {data.energy_metrics.daily_generated_kwh} kWh
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <div className="text-gray-500">Consumed</div>
                    <div className="text-blue-400 font-semibold">
                      {data.energy_metrics.daily_consumed_kwh} kWh
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Efficiency Ratio</span>
                    <span className={`font-semibold ${data.energy_metrics.efficiency_ratio >= 100 ? 'text-green-400' : 'text-orange-400'}`}>
                      {data.energy_metrics.efficiency_ratio}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Grid backup warning */}
            {data.is_grid_backup && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 animate-pulse" />
                <span className="text-xs text-red-300">Grid backup active — solar power insufficient</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
