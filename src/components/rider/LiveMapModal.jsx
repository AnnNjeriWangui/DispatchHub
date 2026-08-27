import React, { useState } from 'react';

export default function LiveMapModal({
  order,
  riderCoordinates = { latitude: -1.2618, longitude: 36.8049, locationName: "Sarit Centre, Westlands" },
  onClose
}) {
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [zoomLevel, setZoomLevel] = useState(15);

  const { latitude, longitude, speed = 32, heading = 145, locationName } = riderCoordinates;

  // Pickup & Customer target locations for map routing
  const pickupLocation = {
    lat: -1.2618,
    lng: 36.8049,
    label: order?.retailerName || "Naivas Supermarket (Sarit Centre)"
  };

  const deliveryLocation = {
    lat: -1.2691,
    lng: 36.7932,
    label: order?.deliveryAddress || "Apartment B4, Rhapta Road, Westlands"
  };

  // Google Maps Embed URL for interactive map iframe
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoomLevel}&t=${mapType === 'satellite' ? 'k' : 'm'}&output=embed`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-800/90 border-b border-slate-700/80 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              🗺️
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Live Google Maps Telemetry
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] uppercase font-bold">
                  Live GPS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tracking Order: <span className="font-mono text-emerald-400 font-bold">{order?.orderNumber || 'ORD-2026-0828-001'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map Viewport Area */}
        <div className="relative flex-1 min-h-[320px] bg-slate-950">
          
          {/* Google Maps Interactive View */}
          <iframe
            title="Google Maps Live Tracking"
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '340px' }}
            loading="lazy"
            allowFullScreen
            src={mapsEmbedUrl}
            className="w-full h-full opacity-90 filter contrast-125"
          />

          {/* Floating Telemetry Pill Overlay */}
          <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-lg space-y-1 max-w-xs text-xs text-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{locationName || 'Westlands Corridor, Nairobi'}</span>
            </div>
            <div className="font-mono text-[11px] text-slate-300">
              <div>LAT: <span className="text-white font-bold">{latitude.toFixed(5)}</span></div>
              <div>LNG: <span className="text-white font-bold">{longitude.toFixed(5)}</span></div>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
              <span>Speed: {speed} km/h</span>
              <span>Heading: {heading}°</span>
            </div>
          </div>

          {/* Floating Map Controls */}
          <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg">
            <button
              onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              {mapType === 'roadmap' ? 'Satellite View' : 'Roadmap View'}
            </button>
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800 text-xs">
              <button
                onClick={() => setZoomLevel(prev => Math.min(prev + 1, 20))}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(prev - 1, 10))}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center border border-slate-700"
              >
                -
              </button>
            </div>
          </div>

        </div>

        {/* Route Details Footer */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pickup Location</span>
            <div className="font-semibold text-white truncate">{pickupLocation.label}</div>
            <div className="text-[11px] text-emerald-400 font-mono">Lat: {pickupLocation.lat}, Lng: {pickupLocation.lng}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer Delivery Destination</span>
            <div className="font-semibold text-white truncate">{deliveryLocation.label}</div>
            <div className="text-[11px] text-emerald-400 font-mono">Lat: {deliveryLocation.lat}, Lng: {deliveryLocation.lng}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
