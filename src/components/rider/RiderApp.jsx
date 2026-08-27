import React, { useState, useEffect } from 'react';
import riderService from '../../services/riderService.js';
import { MOCK_RIDERS } from '../../data/mockRiders.js';
import RiderAuth from './RiderAuth.jsx';
import RiderDashboard from './RiderDashboard.jsx';
import RiderTracker from './RiderTracker.jsx';
import RiderCard from './RiderCard.jsx';

export default function RiderApp() {
  const [currentRider, setCurrentRider] = useState(riderService.getCurrentRider());
  const [isLoggedIn, setIsLoggedIn] = useState(riderService.isLoggedIn());
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'tracker' | 'profile'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState(riderService.getOfflineQueue().length);

  useEffect(() => {
    const unsubscribe = riderService.subscribe((type, payload) => {
      if (type === 'network') {
        setIsOnline(payload.online);
      } else if (type === 'queue_changed') {
        setOfflineQueueCount(payload.queueLength);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (rider) => {
    setCurrentRider(rider);
    setIsLoggedIn(true);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    riderService.logout();
    setIsLoggedIn(false);
  };

  const handleRiderSwitch = (riderId) => {
    const found = MOCK_RIDERS.find(r => r.id === riderId);
    if (found) {
      setCurrentRider(found);
      localStorage.setItem('rider_user', JSON.stringify(found));
    }
  };

  if (!isLoggedIn) {
    return <RiderAuth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 sm:pb-8">
      
      {/* TOP RIDER HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          
          {/* Brand & EV Tag */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                <span>Reflex Rider</span>
                <span className="bg-emerald-500 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-black tracking-wider uppercase">
                  EV Fleet
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {currentRider.vehicle.plateNumber} • {currentRider.vehicle.model}
              </div>
            </div>
          </div>

          {/* Network Pill & Active Rider Switcher */}
          <div className="flex items-center gap-2">
            
            {/* Online/Offline Network Status Pill */}
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isOnline ? 'ONLINE' : `OFFLINE (${offlineQueueCount})`}
            </span>

            {/* Quick Demo Switch Rider Dropdown */}
            <select
              value={currentRider.id}
              onChange={(e) => handleRiderSwitch(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              {MOCK_RIDERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.vehicle.plateNumber})
                </option>
              ))}
            </select>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

          </div>

        </div>
      </header>

      {/* MAIN CONTENT ROUTE CONTAINER */}
      <main className="max-w-xl mx-auto p-4 sm:p-6">
        {activeView === 'dashboard' && (
          <RiderDashboard
            rider={currentRider}
            onOpenTracker={() => setActiveView('tracker')}
          />
        )}

        {activeView === 'tracker' && (
          <div className="space-y-4">
            <RiderTracker />
          </div>
        )}

        {activeView === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Kenyan EV Rider Profile</h2>
            <RiderCard rider={currentRider} />
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-4 py-2">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1 text-center">
          
          <button
            onClick={() => setActiveView('dashboard')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeView === 'dashboard'
                ? 'text-emerald-400 bg-emerald-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Orders Feed</span>
          </button>

          <button
            onClick={() => setActiveView('tracker')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeView === 'tracker'
                ? 'text-emerald-400 bg-emerald-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>Live GPS Radar</span>
          </button>

          <button
            onClick={() => setActiveView('profile')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              activeView === 'profile'
                ? 'text-emerald-400 bg-emerald-500/15'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>EV Profile</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
