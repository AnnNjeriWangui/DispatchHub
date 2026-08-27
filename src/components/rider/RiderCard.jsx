import React from 'react';

export default function RiderCard({ rider, onStatusToggle, compact = false }) {
  if (!rider) return null;

  const { vehicle } = rider;
  const batteryPct = vehicle?.batteryLevel || 85;

  // Battery status color helper
  const getBatteryColor = (level) => {
    if (level >= 75) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    if (level >= 40) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getBatteryBarColor = (level) => {
    if (level >= 75) return 'bg-emerald-500';
    if (level >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (compact) {
    return (
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 text-slate-100 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={rider.avatar}
              alt={rider.name}
              className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-10 h-10 rounded-full bg-emerald-700 text-white font-bold items-center justify-center text-sm border border-emerald-500/40">
              {rider.avatarFallback}
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
              rider.dutyStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
          </div>
          <div>
            <div className="font-bold text-xs text-white flex items-center gap-1.5">
              {rider.name}
              <span className="text-[10px] text-slate-400 font-normal">({rider.gender})</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>{vehicle.model}</span>
              <span>•</span>
              {/* EV Plate Badge */}
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] px-1.5 py-0.2 rounded font-bold">
                {vehicle.plateNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Battery Gauge */}
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-xs font-bold text-emerald-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {batteryPct}%
          </div>
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
            <div className={`h-full ${getBatteryBarColor(batteryPct)} rounded-full`} style={{ width: `${batteryPct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 text-slate-100 shadow-xl space-y-4">
      
      {/* Top Rider Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={rider.avatar}
              alt={rider.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-14 h-14 rounded-2xl bg-emerald-700 text-white font-bold items-center justify-center text-lg border-2 border-emerald-500/50">
              {rider.avatarFallback}
            </div>
            <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border-2 border-slate-900 ${
              rider.dutyStatus === 'ONLINE' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
            }`}>
              {rider.dutyStatus}
            </span>
          </div>

          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {rider.name}
              <span className="text-xs font-normal text-slate-400">({rider.gender})</span>
            </h2>
            <p className="text-xs text-slate-400">{rider.phone}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
              <span className="flex items-center text-amber-400 font-semibold">
                ★ {rider.rating}
              </span>
              <span>•</span>
              <span>{rider.completedDeliveries} Deliveries</span>
            </div>
          </div>
        </div>

        {/* Duty Toggle Button */}
        {onStatusToggle && (
          <button
            onClick={() => onStatusToggle(rider.dutyStatus === 'ONLINE' ? 'CHARGING' : 'ONLINE')}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
              rider.dutyStatus === 'ONLINE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            {rider.dutyStatus === 'ONLINE' ? '⚡ On Duty' : '🔋 Charging'}
          </button>
        )}
      </div>

      {/* EV GREEN BADGE BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          
          {/* EV Plate Tag */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider rounded uppercase flex items-center gap-1 shadow-sm">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              EV FLEET
            </span>
            {/* Kenyan Green EV Plate */}
            <div className="bg-emerald-950 text-emerald-300 border-2 border-emerald-500 font-mono text-sm px-2.5 py-0.5 rounded-lg font-black tracking-widest shadow-inner">
              {vehicle.plateNumber}
            </div>
          </div>

          {/* Model Name */}
          <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
            {vehicle.model}
          </span>
        </div>

        {/* Battery Telemetry Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Battery Charge
            </span>
            <span className={`font-bold border px-2 py-0.5 rounded-full text-xs ${getBatteryColor(batteryPct)}`}>
              {batteryPct}% • ~{vehicle.estimatedRangeKm} km remaining
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
            <div
              className={`h-full ${getBatteryBarColor(batteryPct)} rounded-full transition-all duration-500`}
              style={{ width: `${batteryPct}%` }}
            />
          </div>
        </div>

        {/* Nearby Swap Station */}
        {vehicle.swapStationNearby && (
          <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between border-t border-emerald-500/10">
            <span>Nearest Swap Station:</span>
            <span className="text-emerald-400 font-medium">{vehicle.swapStationNearby}</span>
          </div>
        )}
      </div>

      {/* Hub Location Details */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{rider.hub}</span>
        </div>
        <span className="bg-slate-700/60 px-2 py-0.5 rounded text-[11px] text-slate-300 font-medium">
          {rider.zone}
        </span>
      </div>

    </div>
  );
}
