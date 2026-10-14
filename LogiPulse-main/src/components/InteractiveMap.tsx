import React, { useMemo } from 'react';
import { Coordinates, Order, User } from '../types/courier';
import { Navigation, MapPin, Flag, Compass, Bike, Truck } from 'lucide-react';

interface InteractiveMapProps {
  order?: Order;
  rider?: User;
  allRiders?: User[];
  allOrders?: Order[];
  showAllFleet?: boolean;
  className?: string;
  height?: string;
}

// Bounding box for Karachi Metropolitan courier zone:
// Lat: ~24.770 to 24.960 (height: 0.190)
// Lng: ~66.980 to 67.120 (width: 0.140)
const MIN_LAT = 24.770;
const MAX_LAT = 24.960;
const MIN_LNG = 66.980;
const MAX_LNG = 67.120;

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  order,
  rider,
  allRiders = [],
  allOrders = [],
  showAllFleet = false,
  className = '',
  height = 'h-72',
}) => {
  // Convert lat/lng to SVG 0-100% coordinates
  const projectCoords = (coords: Coordinates): { x: number; y: number } => {
    const clampedLat = Math.min(MAX_LAT, Math.max(MIN_LAT, coords.lat));
    const clampedLng = Math.min(MAX_LNG, Math.max(MIN_LNG, coords.lng));

    const x = ((clampedLng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 100;
    // Invert Y because latitude increases northward (up)
    const y = (1 - (clampedLat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 100;

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const pickupPoint = useMemo(() => {
    return order ? projectCoords(order.pickup_coords) : null;
  }, [order]);

  const dropoffPoint = useMemo(() => {
    return order ? projectCoords(order.dropoff_coords) : null;
  }, [order]);

  const riderPoint = useMemo(() => {
    if (rider && rider.current_coordinates) {
      return projectCoords(rider.current_coordinates);
    }
    return null;
  }, [rider]);

  // Generate SVG path connecting pickup to dropoff via realistic street waypoints
  const routePath = useMemo(() => {
    if (!pickupPoint || !dropoffPoint) return '';
    // Manhattan grid turn
    const midX = dropoffPoint.x;
    const midY = pickupPoint.y;
    return `M ${pickupPoint.x} ${pickupPoint.y} L ${midX} ${midY} L ${dropoffPoint.x} ${dropoffPoint.y}`;
  }, [pickupPoint, dropoffPoint]);

  return (
    <div className={`relative w-full ${height} bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner select-none ${className}`}>
      {/* Map Background Grid / Street Network SVG */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <pattern id="street-grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.3" />
          </pattern>
          <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* City Blocks Base */}
        <rect width="100" height="100" fill="#0f172a" />
        <rect width="100" height="100" fill="url(#street-grid)" />

        {/* Primary Arterials / Avenues */}
        <line x1="0" y1="28" x2="100" y2="28" stroke="#334155" strokeWidth="1" />
        <line x1="0" y1="52" x2="100" y2="52" stroke="#334155" strokeWidth="1.2" />
        <line x1="0" y1="76" x2="100" y2="76" stroke="#334155" strokeWidth="1" />

        <line x1="25" y1="0" x2="25" y2="100" stroke="#334155" strokeWidth="1" />
        <line x1="58" y1="0" x2="58" y2="100" stroke="#334155" strokeWidth="1.2" />
        <line x1="82" y1="0" x2="82" y2="100" stroke="#334155" strokeWidth="1" />

        {/* Diagonal Expressway (Market St diagonal angle) */}
        <line x1="10" y1="90" x2="90" y2="20" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="10" y1="90" x2="90" y2="20" stroke="#475569" strokeWidth="1.2" strokeDasharray="2,2" />

        {/* Active Order Delivery Route */}
        {routePath && (
          <>
            <path
              d={routePath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.2"
              strokeDasharray="2.5,1.5"
              strokeLinecap="round"
              className="animate-pulse"
            />
            {riderPoint && (
              <line
                x1={riderPoint.x}
                y1={riderPoint.y}
                x2={dropoffPoint ? dropoffPoint.x : pickupPoint?.x}
                y2={dropoffPoint ? dropoffPoint.y : pickupPoint?.y}
                stroke="#10b981"
                strokeWidth="0.8"
                strokeDasharray="1,1"
                opacity="0.6"
              />
            )}
          </>
        )}

        {/* Fleet Routes in Admin View */}
        {showAllFleet &&
          allOrders
            .filter((o) => o.status !== 'Delivered')
            .map((ord) => {
              const p = projectCoords(ord.pickup_coords);
              const d = projectCoords(ord.dropoff_coords);
              return (
                <path
                  key={`fleet-route-${ord.order_id}`}
                  d={`M ${p.x} ${p.y} L ${d.x} ${p.y} L ${d.x} ${d.y}`}
                  fill="none"
                  stroke={ord.status === 'In Transit' ? '#06b6d4' : '#64748b'}
                  strokeWidth="0.7"
                  strokeDasharray="1.5,1.5"
                  opacity="0.4"
                />
              );
            })}
      </svg>

      {/* Markers Layer (HTML for crisp typography & badges) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Pickup Pin */}
        {pickupPoint && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300"
            style={{ left: `${pickupPoint.x}%`, top: `${pickupPoint.y}%` }}
          >
            <div className="relative">
              <span className="absolute -inset-1.5 rounded-full bg-amber-500/30 animate-ping" />
              <div className="relative w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg border border-amber-300">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="mt-1 px-1.5 py-0.5 text-[9px] font-mono tracking-tight bg-slate-900/90 text-amber-300 rounded border border-amber-500/30 shadow backdrop-blur-xs whitespace-nowrap">
              PICKUP
            </span>
          </div>
        )}

        {/* Dropoff Pin */}
        {dropoffPoint && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300"
            style={{ left: `${dropoffPoint.x}%`, top: `${dropoffPoint.y}%` }}
          >
            <div className="relative">
              <span className="absolute -inset-1.5 rounded-full bg-emerald-500/30 animate-pulse" />
              <div className="relative w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg border border-emerald-300">
                <Flag className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="mt-1 px-1.5 py-0.5 text-[9px] font-mono tracking-tight bg-slate-900/90 text-emerald-300 rounded border border-emerald-500/30 shadow backdrop-blur-xs whitespace-nowrap">
              DROPOFF
            </span>
          </div>
        )}

        {/* Single Assigned Rider Marker */}
        {!showAllFleet && riderPoint && rider && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700 ease-out z-20"
            style={{ left: `${riderPoint.x}%`, top: `${riderPoint.y}%` }}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute w-9 h-9 rounded-full bg-sky-500/25 animate-ping" />
              <div className="relative w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-sky-300">
                <Bike className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-slate-900/95 text-sky-300 rounded-md border border-sky-500/40 shadow-md backdrop-blur-xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{rider.name.split(' ')[0]} (Live)</span>
            </div>
          </div>
        )}

        {/* All Fleet Riders for Admin Command View */}
        {showAllFleet &&
          allRiders.map((r) => {
            if (!r.current_coordinates) return null;
            const pt = projectCoords(r.current_coordinates);
            return (
              <div
                key={`fleet-rider-${r.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700 ease-out z-10"
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border ${
                    r.isOnline ? 'bg-sky-600 border-sky-300' : 'bg-slate-700 border-slate-500'
                  }`}
                  title={`${r.name} (${r.vehicleType})`}
                >
                  <Bike className="w-3 h-3" />
                </div>
                <span className="mt-0.5 px-1 text-[8px] bg-slate-950/80 text-slate-300 rounded border border-slate-700 whitespace-nowrap">
                  {r.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
      </div>

      {/* Map Overlay Controls / Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-md border border-slate-700 text-slate-300 font-mono text-[11px]">
          <Compass className="w-3.5 h-3.5 text-sky-400 animate-spin" style={{ animationDuration: '20s' }} />
          <span>Karachi Metro Grid</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400">Sindh Live Telemetry</span>
        </div>
      </div>

      {/* GPS Telemetry Pill */}
      {rider && rider.current_coordinates && (
        <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-400 bg-slate-950/85 px-2 py-1 rounded border border-slate-800">
          LAT: {rider.current_coordinates.lat.toFixed(4)} · LNG: {rider.current_coordinates.lng.toFixed(4)}
        </div>
      )}
    </div>
  );
};
