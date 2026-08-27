import React, { useState, useEffect } from 'react';
import RiderApp from './components/rider/RiderApp.jsx';

export default function App() {
  const [activeModule, setActiveModule] = useState('rider'); // 'rider' | 'retailer'

  useEffect(() => {
    // Control visibility of original Retailer Portal HTML elements in index.html
    const retailerHeader = document.querySelector('header.top-nav');
    const retailerBanner = document.getElementById('retailerProfileBanner');
    const retailerMain = document.querySelector('main.dashboard-container');
    const searchSection = document.querySelector('section.search-status-section');

    const elementsToToggle = [retailerHeader, retailerBanner, retailerMain, searchSection];

    if (activeModule === 'rider') {
      elementsToToggle.forEach(el => {
        if (el) el.style.display = 'none';
      });
    } else {
      elementsToToggle.forEach(el => {
        if (el) el.style.display = '';
      });
    }
  }, [activeModule]);

  return (
    <div className="font-sans">
      {/* Floating Module Switcher Bar */}
      <div className="fixed top-3 right-3 z-50 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5">
        <button
          onClick={() => setActiveModule('rider')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeModule === 'rider'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          ⚡ Rider Portal
        </button>

        <button
          onClick={() => setActiveModule('retailer')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeModule === 'retailer'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          🏬 Retailer Dashboard
        </button>
      </div>

      {/* Render Rider Module Component */}
      {activeModule === 'rider' && (
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <RiderApp />
        </div>
      )}
    </div>
  );
}
