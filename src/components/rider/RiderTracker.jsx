import React, { useState, useEffect } from 'react';
import trackingService from '../../services/trackingService.js';
import LiveMapModal from './LiveMapModal.jsx';

export default function RiderTracker({ activeOrder }) {
  const [telemetry, setTelemetry] = useState(trackingService.currentPosition);
  const [isSimulating, setIsSimulating] = useState(trackingService.isSimulation);
  const [isTracking, setIsTracking] = useState(trackingService.isTracking);
  const [showLiveMap, setShowLiveMap] = useState(false);

  useEffect(() => {
    // Auto start tracking when mounted
    trackingService.startLiveTracking();
    setIsTracking(true);

    const unsubscribe = trackingService.subscribe((position) => {
      setTelemetry(position);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleSimulation = () => {
    const simState = trackingService.toggleSimulationMode();
    setIsSimulating(simState);
    setIsTracking(trackingService.isTracking);
  };

  const handleToggleTracking = () => {
    if (isTracking) {
      trackingService.stopTracking();
      setIsTracking(false);
    } else {
      trackingService.startLiveTracking();
      setIsTracking(true);
    }
  };

  // Destination coordinates for mock target (Rhapta Rd, Westlands or Delivery Address)
  const targetLat = -1.2691;
  const targetLng = 36.7932;
  const distanceKm = trackingService.calculateDistanceKm(
    telemetry.latitude,
    telemetry.longitude,
    targetLat,
    targetLng
  );

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 text-slate-100 shadow-xl space-y-4 font-sans">
      
      {/* Header & Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isTracking ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              isTracking ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live GPS Telemetry Emitter</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
            isSimulating
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {isSimulating ? 'Nairobi Simulation Stream' : 'Live Browser GPS'}
          </span>
        </div>
      </div>

      {/* Interactive Map Radar Display */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl h-44 overflow-hidden flex flex-col justify-between p-3">
        {/* Grid lines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-40" />

        {/* Pulse Radar Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-24 h-24 border border-emerald-500/20 rounded-full animate-ping opacity-20" />
          <div className="w-16 h-16 border border-emerald-500/40 rounded-full absolute inset-4" />
        </div>

        {/* Top Info Banner */}
        <div className="relative z-10 flex items-center justify-between text-xs bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {telemetry.locationName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {distanceKm} km to dropoff
          </span>
        </div>

        {/* Dynamic Navigation Compass */}
        <div className="relative z-10 flex items-end justify-between">
          <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-[11px] font-mono space-y-0.5">
            <div className="text-slate-400">LAT: <span className="text-white font-bold">{telemetry.latitude?.toFixed(5)}</span></div>
            <div className="text-slate-400">LNG: <span className="text-white font-bold">{telemetry.longitude?.toFixed(5)}</span></div>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Heading</div>
            <div className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1 justify-center">
              <svg
                className="w-4 h-4 transition-transform duration-500"
                style={{ transform: `rotate(${telemetry.heading}deg)` }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
              {telemetry.heading}°
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Speed</div>
          <div className="text-base font-bold text-white font-mono">{telemetry.speed} <span className="text-[10px] text-slate-400">km/h</span></div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">GPS Accuracy</div>
          <div className="text-base font-bold text-emerald-400 font-mono">±{telemetry.accuracy} <span className="text-[10px] text-slate-400">m</span></div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Est. Arrival</div>
          <div className="text-base font-bold text-white font-mono">{Math.max(3, Math.round(distanceKm * 2.5))} <span className="text-[10px] text-slate-400">mins</span></div>
        </div>
      </div>

      {/* Action Buttons */}
      <button
        onClick={() => setShowLiveMap(true)}
        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Open Full Interactive Google Maps
      </button>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleToggleTracking}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
            isTracking
              ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
          }`}
        >
          {isTracking ? 'Pause GPS Emission' : 'Resume GPS Emission'}
        </button>

        <button
          onClick={handleToggleSimulation}
          className="py-2 px-3 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-600 flex items-center justify-center gap-1.5"
        >
          {isSimulating ? 'Use Real Device GPS' : 'Simulate Nairobi Route'}
        </button>
      </div>

      {/* Live Google Maps Modal */}
      {showLiveMap && (
        <LiveMapModal
          order={activeOrder}
          riderCoordinates={telemetry}
          onClose={() => setShowLiveMap(false)}
        />
      )}

    </div>
  );
}
