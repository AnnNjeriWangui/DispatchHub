import React, { useState } from 'react';
import riderService from '../../services/riderService.js';
import { MOCK_RIDERS } from '../../data/mockRiders.js';

export default function RiderAuth({ onLoginSuccess }) {
  const [loginMode, setLoginMode] = useState('phone'); // 'phone' | 'otp' | 'google'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [selectedDemoRider, setSelectedDemoRider] = useState(MOCK_RIDERS[0].id);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Validate Kenyan Phone Regex
  const validatePhone = (num) => {
    const cleaned = num.trim().replace(/\s+/g, '');
    return /^(\+254|0)[17]\d{8}$/.test(cleaned);
  };

  const handleRequestOTP = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validatePhone(phoneNumber)) {
      setErrorMessage('Please enter a valid Kenyan phone number (e.g. 0712345678, 0112345678, +254712345678).');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLoginMode('otp');
      setResendCountdown(30);
      
      // Auto-fill demo OTP code 123456 for convenience
      setOtpDigits(['1', '2', '3', '4', '5', '6']);

      // Start countdown
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 800);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const updated = [...otpDigits];
    updated[index] = value.slice(-1);
    setOtpDigits(updated);

    // Auto advance focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your SMS OTP code.');
      return;
    }

    setLoading(true);
    try {
      const result = await riderService.loginWithPhone(phoneNumber, fullOtp);
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess(result.rider);
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'OTP verification failed. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await riderService.loginWithGoogle();
      setLoading(false);
      if (onLoginSuccess) onLoginSuccess(result.rider);
    } catch (err) {
      setLoading(false);
      setErrorMessage('Google Authentication failed. Please try again.');
    }
  };

  const handleQuickSelectRider = (rider) => {
    setPhoneNumber(rider.formattedPhone);
    setSelectedDemoRider(rider.id);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-slate-800/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100">
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl mb-3 text-emerald-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reflex Rider Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Kenyan EV Logistics & Delivery Operations</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Phone Input */}
        {loginMode === 'phone' && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kenyan Mobile Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-semibold">
                  🇰🇪
                </span>
                <input
                  type="tel"
                  placeholder="0712345678 or +254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder-slate-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Format: 07XXXXXXXX, 01XXXXXXXX, or +254XXXXXXXX
              </p>
            </div>

            {/* Quick Demo Rider Selector */}
            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Quick Select Demo EV Rider:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {MOCK_RIDERS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleQuickSelectRider(r)}
                    className={`text-left p-2 rounded-lg text-xs transition-all border ${
                      selectedDemoRider === r.id
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-medium'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="truncate font-semibold">{r.name}</div>
                    <div className="text-[10px] opacity-75 truncate">{r.vehicle.model} ({r.vehicle.plateNumber})</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending SMS OTP...
                </>
              ) : (
                'Send SMS OTP Verification'
              )}
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-800 px-3 text-slate-400 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-950 active:bg-black border border-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {loginMode === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="text-center">
              <p className="text-xs text-slate-300">
                Enter 6-digit code sent via SMS to <span className="font-semibold text-emerald-400">{phoneNumber}</span>
              </p>
            </div>

            {/* 6 OTP Digit Inputs */}
            <div className="flex justify-between gap-1.5 sm:gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 rounded-xl text-center text-xl font-bold text-emerald-400 focus:outline-none transition-all"
                />
              ))}
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
              <span className="text-[11px] text-emerald-300">
                💡 Demo Mode: Pre-filled with test code <span className="font-mono font-bold">123456</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying OTP Code...' : 'Verify OTP & Access Rider Dashboard'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setLoginMode('phone')}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                ← Back to Phone Number
              </button>
              <button
                type="button"
                disabled={resendCountdown > 0}
                onClick={handleRequestOTP}
                className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors font-medium"
              >
                {resendCountdown > 0 ? `Resend OTP (${resendCountdown}s)` : 'Resend SMS OTP'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
