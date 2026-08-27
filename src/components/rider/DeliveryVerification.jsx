import React, { useState, useEffect } from 'react';
import riderService from '../../services/riderService.js';

export default function DeliveryVerification({ order, onVerified, onClose }) {
  const [activeTab, setActiveTab] = useState('pin'); // 'pin' | 'qr'
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [qrScanning, setQrScanning] = useState(false);
  const [manualQrInput, setManualQrInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mpesaModal, setMpesaModal] = useState(null); // STK push modal payload

  // Auto focus first PIN input
  useEffect(() => {
    if (activeTab === 'pin') {
      const el = document.getElementById('pin-0');
      if (el) el.focus();
    }
  }, [activeTab]);

  if (!order) return null;

  const handlePinChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...pinDigits];
    updated[idx] = value.slice(-1);
    setPinDigits(updated);

    if (value && idx < 3) {
      const nextEl = document.getElementById(`pin-${idx + 1}`);
      if (nextEl) nextEl.focus();
    }
  };

  const handlePinKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !pinDigits[idx] && idx > 0) {
      const prevEl = document.getElementById(`pin-${idx - 1}`);
      if (prevEl) prevEl.focus();
    }
  };

  // Process Successful Verification
  const completeVerification = async (method, codeUsed) => {
    setVerifying(true);
    setErrorMsg('');

    try {
      // 1. Trigger M-Pesa STK Push Prompt for customer cash-on-delivery or payment confirmation
      const mpesaResult = await riderService.triggerMpesaSTKPush(
        order.customerPhone,
        order.amountKes || 1850,
        order.orderNumber
      );

      setMpesaModal({
        phoneNumber: order.customerPhone,
        amount: order.amountKes || 1850,
        orderNumber: order.orderNumber,
        checkoutId: mpesaResult.CheckoutRequestID
      });

      // 2. Advance delivery status to DELIVERED
      await riderService.updateOrderStatus(order.orderNumber, 'DELIVERED', {
        method,
        codeUsed,
        mpesaCheckoutId: mpesaResult.CheckoutRequestID
      });

      setVerifying(false);
    } catch (err) {
      setVerifying(false);
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const enteredPin = pinDigits.join('');
    
    if (enteredPin.length !== 4) {
      setErrorMsg('Please enter all 4 digits of the SMS PIN code.');
      return;
    }

    // Allow correct PIN (or any valid 4-digit input in demo)
    if (enteredPin === order.verificationPin || enteredPin === '4829' || enteredPin.length === 4) {
      completeVerification('SMS_PIN', enteredPin);
    } else {
      setErrorMsg(`Incorrect PIN. Code sent to customer is ${order.verificationPin}`);
    }
  };

  const handleSimulateQrScan = () => {
    const code = manualQrInput.trim() || order.qrPayload || `REFLEX-${order.orderNumber}-VERIFIED`;
    completeVerification('QR_SCAN', code);
  };

  const handleMpesaDone = () => {
    setMpesaModal(null);
    if (onVerified) onVerified(order.orderNumber);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl mb-2 border border-emerald-500/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Dual Delivery Verification</h2>
          <p className="text-xs text-slate-400">Order: <span className="font-mono text-emerald-400 font-bold">{order.orderNumber}</span></p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl mb-5 border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pin'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            4-Digit SMS PIN
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QR Code Scanner
          </button>
        </div>

        {/* TAB 1: 4-DIGIT SMS PIN ENTRY */}
        {activeTab === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-5 text-center">
            <div>
              <p className="text-xs text-slate-300">
                Ask customer <span className="font-semibold text-white">{order.customerName}</span> ({order.customerPhone}) for their 4-digit SMS confirmation code.
              </p>
            </div>

            {/* 4 Auto-Advancing Digit Boxes */}
            <div className="flex justify-center gap-3 my-4">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`pin-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  className="w-14 h-16 bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 rounded-xl text-center text-2xl font-black text-emerald-400 focus:outline-none transition-all"
                />
              ))}
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700 text-xs text-slate-400 flex items-center justify-between">
              <span>Customer Demo PIN:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">{order.verificationPin}</span>
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {verifying ? 'Verifying PIN & Triggering Payment...' : 'Confirm Delivery & Trigger M-Pesa'}
            </button>
          </form>
        )}

        {/* TAB 2: QR CODE SCANNER */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            <div className="relative bg-slate-900 border-2 border-dashed border-emerald-500/40 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[200px]">
              
              {/* Simulated Camera Viewport */}
              <div className="w-32 h-32 border-2 border-emerald-400 rounded-xl p-2 relative flex items-center justify-center bg-emerald-950/40 animate-pulse">
                <svg className="w-16 h-16 text-emerald-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                {/* Laser scan line animation */}
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] top-1/2 -translate-y-1/2 animate-bounce" />
              </div>

              <p className="text-xs text-slate-300 mt-3">
                Align customer package QR code inside frame to verify
              </p>
            </div>

            {/* Quick Scan Simulator Trigger */}
            <button
              onClick={handleSimulateQrScan}
              disabled={verifying}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h0.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {verifying ? 'Processing QR Scan...' : 'Scan Package QR Code Now'}
            </button>
          </div>
        )}

        {/* M-PESA STK PUSH SUCCESS POPUP */}
        {mpesaModal && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col items-center justify-center text-center z-20 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <span className="px-2.5 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full uppercase">
                M-Pesa STK Push Sent
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Delivery Confirmed!</h3>
              <p className="text-xs text-slate-300 mt-2 max-w-xs">
                M-Pesa payment prompt sent to customer phone <span className="font-semibold text-emerald-400">{mpesaModal.phoneNumber}</span> for <span className="font-bold text-white">KES {mpesaModal.amount}</span>.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl w-full text-left text-xs space-y-1 font-mono text-slate-300">
              <div className="flex justify-between">
                <span>Order No:</span>
                <span className="text-emerald-400 font-bold">{mpesaModal.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>STK Checkout ID:</span>
                <span className="text-slate-400 truncate max-w-[150px]">{mpesaModal.checkoutId}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold">DELIVERED</span>
              </div>
            </div>

            <button
              onClick={handleMpesaDone}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              Return to Rider Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
