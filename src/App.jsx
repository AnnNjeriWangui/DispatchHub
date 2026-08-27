import React, { useState } from 'react';
import RiderApp from './components/rider/RiderApp.jsx';

export default function App() {
  const [activeModule, setActiveModule] = useState('rider'); // 'rider' | 'retailer'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* Top Module Switcher Bar */}
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">⚡</span>
          <span>DispatchHub Platform</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveModule('rider')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeModule === 'rider'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Rider Module
          </button>

          <button
            onClick={() => setActiveModule('retailer')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeModule === 'retailer'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🏬 Retailer Portal
          </button>
        </div>
      </nav>

      {/* Main Viewport Content */}
      {activeModule === 'rider' ? (
        <RiderApp />
      ) : (
        <div className="w-full h-[calc(100vh-45px)]">
          <iframe
            title="Retailer Dashboard Portal"
            src="/"
            className="w-full h-full border-0"
          />
        </div>
      )}

    </div>
  );
}
