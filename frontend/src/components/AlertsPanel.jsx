import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, AlertTriangle, Info, CheckCircle, XCircle, 
  ChevronDown, ChevronUp, Clock, MapPin, Volume2,
  X, Trash2, Sun, Wind, Zap, Activity
} from 'lucide-react';

/**
 * Maps backend alert types to display categories
 */
const getAlertCategory = (type) => {
  switch (type) {
    case 'EMERGENCY_DETECTED':
    case 'GREEN_CORRIDOR_ACTIVE':
    case 'SOLAR_FAILURE':
      return 'emergency';
    case 'CONGESTION_THRESHOLD':
    case 'SIGNAL_OVERLOAD':
    case 'SOLAR_LOW':
    case 'AIR_QUALITY_POOR':
    case 'NOISE_HIGH':
      return 'warning';
    case 'EMERGENCY_CLEARED':
    case 'SYSTEM_STATUS':
      return 'info';
    default:
      return 'info';
  }
};

const getAlertIcon = (type) => {
  switch (type) {
    case 'SOLAR_LOW':
    case 'SOLAR_FAILURE':
      return Sun;
    case 'AIR_QUALITY_POOR':
    case 'NOISE_HIGH':
      return Wind;
    case 'SIGNAL_OVERLOAD':
    case 'GREEN_CORRIDOR_ACTIVE':
      return Zap;
    case 'CONGESTION_THRESHOLD':
      return Activity;
    default:
      return AlertTriangle;
  }
};

/**
 * Single alert item component
 */
function AlertItem({ alert, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const category = getAlertCategory(alert.type);
  const AlertIcon = getAlertIcon(alert.type);

  const styles = {
    emergency: {
      bg: 'bg-red-500/10', border: 'border-red-500/30',
      iconColor: 'text-red-400', badge: 'bg-red-500',
    },
    warning: {
      bg: 'bg-yellow-500/10', border: 'border-yellow-500/30',
      iconColor: 'text-yellow-400', badge: 'bg-yellow-500',
    },
    info: {
      bg: 'bg-blue-500/10', border: 'border-blue-500/30',
      iconColor: 'text-blue-400', badge: 'bg-blue-500',
    },
  }[category] || {
    bg: 'bg-gray-500/10', border: 'border-gray-500/30',
    iconColor: 'text-gray-400', badge: 'bg-gray-500',
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-lg p-2 sm:p-3 transition-all duration-200 cursor-pointer hover:bg-opacity-20`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`p-1 sm:p-1.5 rounded-lg ${styles.bg} flex-shrink-0`}>
          <AlertIcon size={14} className={`${styles.iconColor} sm:w-4 sm:h-4`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
            <span className={`px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase rounded ${styles.badge} text-white`}>
              {alert.severity || category}
            </span>
            <span className="text-[9px] text-gray-600 uppercase">{alert.type?.replace(/_/g, ' ')}</span>
          </div>
          
          <p className="text-xs sm:text-sm text-white font-medium">
            {alert.message}
          </p>
          
          <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500">
            {alert.zone_id && (
              <span className="flex items-center gap-0.5 sm:gap-1 truncate">
                <MapPin size={10} className="flex-shrink-0" />
                <span className="truncate capitalize">{alert.zone_id.replace(/_/g, ' ')}</span>
              </span>
            )}
            {alert.source && (
              <span className="text-gray-600 capitalize">{alert.source}</span>
            )}
            <span className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-auto">
              <Clock size={10} />
              {alert.timestamp_iso ? formatTime(alert.timestamp) : (alert.age_seconds ? `${Math.round(alert.age_seconds)}s ago` : '')}
            </span>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
          className="p-0.5 sm:p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
        >
          <X size={12} className="text-gray-500 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {expanded && alert.metadata && Object.keys(alert.metadata).length > 0 && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
            {Object.entries(alert.metadata).map(([key, value]) => (
              <div key={key} className="bg-gray-800/50 rounded p-1.5">
                <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="ml-1 text-gray-300">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Alerts Panel - Shows real-time alerts from the centralized alert system
 */
export default function AlertsPanel({ emergencyMode, alerts: liveAlerts = [], alertSummary = {} }) {
  const [localAlerts, setLocalAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showPanel, setShowPanel] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Merge live backend alerts with any local state
  useEffect(() => {
    if (liveAlerts && liveAlerts.length > 0) {
      setLocalAlerts(liveAlerts);
    }
  }, [liveAlerts]);

  // Add emergency alert when mode changes
  useEffect(() => {
    if (emergencyMode) {
      const emergencyAlert = {
        id: `local-${Date.now()}`,
        type: 'EMERGENCY_DETECTED',
        severity: 'CRITICAL',
        message: 'Emergency vehicle detected — Priority mode activated',
        zone_id: 'System Wide',
        source: 'local',
        timestamp: Date.now() / 1000,
        age_seconds: 0,
        metadata: {},
      };
      setLocalAlerts(prev => [emergencyAlert, ...prev]);
    }
  }, [emergencyMode]);

  const handleDismiss = (id) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleClearAll = () => {
    setDismissedIds(new Set(localAlerts.map(a => a.id)));
  };

  const visibleAlerts = useMemo(() => {
    let filtered = localAlerts.filter(a => !dismissedIds.has(a.id));
    if (filter !== 'all') {
      filtered = filtered.filter(a => getAlertCategory(a.type) === filter);
    }
    return filtered;
  }, [localAlerts, filter, dismissedIds]);

  const severityCounts = alertSummary?.severity_breakdown || {};

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Bell size={18} className="text-blue-400 flex-shrink-0 sm:w-5 sm:h-5" />
          <h3 className="font-semibold text-white text-sm sm:text-base truncate">Alerts</h3>
          {localAlerts.length > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-blue-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex-shrink-0">
              {localAlerts.length - dismissedIds.size}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Severity summary badges */}
          {severityCounts.CRITICAL > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">
              {severityCounts.CRITICAL} critical
            </span>
          )}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1 sm:p-1.5 rounded-lg transition-colors ${soundEnabled ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}
            title={soundEnabled ? 'Mute notifications' : 'Enable sound'}
          >
            <Volume2 size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={() => setShowPanel(!showPanel)}
            className="p-1 sm:p-1.5 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
          >
            {showPanel ? <ChevronUp size={14} className="sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>

      {showPanel && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 overflow-x-auto pb-2 scrollbar-thin">
            {['all', 'emergency', 'warning', 'info'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === type 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
            
            {visibleAlerts.length > 0 && (
              <button
                onClick={handleClearAll}
                className="ml-auto px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <Trash2 size={10} className="sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>

          {/* Alerts list */}
          <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 pr-1">
            {visibleAlerts.length > 0 ? (
              visibleAlerts.map(alert => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onDismiss={handleDismiss}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-gray-500">
                <CheckCircle size={32} className="mb-2 text-green-400 sm:w-10 sm:h-10" />
                <p className="text-xs sm:text-sm">No alerts to display</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
