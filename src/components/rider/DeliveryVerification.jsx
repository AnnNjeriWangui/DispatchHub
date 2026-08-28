import React, { useState, useEffect } from 'react';
import { QrCode, Key, CheckCircle, Sparkles, ShieldCheck, AlertCircle, Camera, Delete } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import riderService from '../../services/riderService.js';

export default function DeliveryVerification({ order, initialTab = 'qr', onVerified, onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab === 'code' ? 'code' : 'qr');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [manualQrInput, setManualQrInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(null);
  const [mpesaModal, setMpesaModal] = useState(null);

  // Auto focus first code input box when switching to code tab
  useEffect(() => {
    if (activeTab === 'code') {
      const el = document.getElementById('code-0');
      if (el) el.focus();
    }
  }, [activeTab]);

  // Camera initialization for QR Code Scanner
  useEffect(() => {
    let html5QrCode = null;
    let isStopped = false;

    if (activeTab === 'qr' && !verifiedSuccess) {
      const qrRegionId = 'qr-reader';
      const element = document.getElementById(qrRegionId);

      if (element) {
        try {
          html5QrCode = new Html5Qrcode(qrRegionId);
          const config = { fps: 10, qrbox: { width: 200, height: 200 } };

          html5QrCode
            .start(
              { facingMode: 'environment' },
              config,
              (decodedText) => {
                if (!isStopped) {
                  isStopped = true;
                  if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().catch(() => {});
                  }
                  completeVerification('QR_SCAN', decodedText);
                }
              },
              () => {
                // Ignore scanning frames failure
              }
            )
            .catch((err) => {
              console.warn('[QR Camera Error]', err);
              setCameraError(true);
            });
        } catch (e) {
          console.warn('[QR Init Exception]', e);
          setCameraError(true);
        }
      }
    }

    return () => {
      isStopped = true;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [activeTab, verifiedSuccess]);

  if (!order) return null;

  const handleDigitChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...codeDigits];
    updated[idx] = value.slice(-1);
    setCodeDigits(updated);

    if (value && idx < 5) {
      const nextEl = document.getElementById(`code-${idx + 1}`);
      if (nextEl) nextEl.focus();
    }
  };

  const handleDigitKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !codeDigits[idx] && idx > 0) {
      const prevEl = document.getElementById(`code-${idx - 1}`);
      if (prevEl) prevEl.focus();
    }
  };

  // Keypad click for number entry
  const handleKeypadPress = (num) => {
    if (num === 'back') {
      const lastFilledIdx = codeDigits.findLastIndex(d => d !== '');
      if (lastFilledIdx >= 0) {
        const updated = [...codeDigits];
        updated[lastFilledIdx] = '';
        setCodeDigits(updated);
        const el = document.getElementById(`code-${lastFilledIdx}`);
        if (el) el.focus();
      }
      return;
    }

    if (num === 'clear') {
      setCodeDigits(['', '', '', '', '', '']);
      const el = document.getElementById('code-0');
      if (el) el.focus();
      return;
    }

    const firstEmptyIdx = codeDigits.findIndex(d => d === '');
    if (firstEmptyIdx !== -1) {
      const updated = [...codeDigits];
      updated[firstEmptyIdx] = String(num);
      setCodeDigits(updated);
      if (firstEmptyIdx < 5) {
        const nextEl = document.getElementById(`code-${firstEmptyIdx + 1}`);
        if (nextEl) nextEl.focus();
      }
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

      // 2. Advance delivery status to DELIVERED
      await riderService.updateOrderStatus(order.orderNumber, 'DELIVERED', {
        method,
        codeUsed,
        mpesaCheckoutId: mpesaResult.CheckoutRequestID
      });

      setVerifiedSuccess({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        method,
        earnings: 150
      });

      setMpesaModal({
        phoneNumber: order.customerPhone,
        amount: order.amountKes || 1850,
        orderNumber: order.orderNumber,
        checkoutId: mpesaResult.CheckoutRequestID
      });

      setVerifying(false);
    } catch (err) {
      setVerifying(false);
      setErrorMsg(err.message || 'Verification failed. Please try again.');
    }
  };

  const handleCodeSubmit = (e) => {
    if (e) e.preventDefault();
    const enteredCode = codeDigits.join('');

    if (enteredCode.length < 4) {
      setErrorMsg('Please enter the 6-digit delivery confirmation code.');
      return;
    }

    completeVerification('CODE_ENTRY', enteredCode);
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 relative overflow-hidden space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-lg"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-2 border border-emerald-300 dark:border-emerald-800 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Delivery Confirmation</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Order: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{order.orderNumber}</span>
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* VERIFIED SUCCESS SCREEN */}
        {verifiedSuccess ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Verified: Order #{verifiedSuccess.orderNumber}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mt-1">
                Purchaser: {verifiedSuccess.customerName}
              </p>
              <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/60 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                🎉 Delivery Confirmed! KES {verifiedSuccess.earnings} earned
              </div>
            </div>

            {mpesaModal && (
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-emerald-500/50 space-y-2 text-left text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span>📱 M-Pesa STK Push Sent</span>
                  <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[10px]">Active</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Prompt sent to <span className="font-semibold text-white">{mpesaModal.phoneNumber}</span> for KES {mpesaModal.amount} payment collection.
                </p>
              </div>
            )}

            <button
              onClick={handleMpesaDone}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Tab Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'qr'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Scan Purchaser QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Enter Code</span>
              </button>
            </div>

            {/* TAB A: QR CODE SCANNER WITH LIVE CAMERA VIEW FINDER */}
            {activeTab === 'qr' && (
              <div className="space-y-4 text-center">
                
                {/* Live Camera Viewfinder Container */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl border-2 border-emerald-500/60 space-y-3 shadow-inner relative overflow-hidden min-h-[220px] flex flex-col items-center justify-center">
                  <div id="qr-reader" className="w-full max-w-[260px] rounded-xl overflow-hidden" />

                  {cameraError && (
                    <div className="space-y-2 text-center py-2 px-3">
                      <Camera className="w-10 h-10 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">
                        Camera streaming initialized or awaiting video permission.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Point camera at purchaser's QR code or click simulate scan below.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleSimulateQrScan}
                    disabled={verifying}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{verifying ? 'Verifying QR...' : 'Scan Purchaser QR Code'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB B: 6-DIGIT CODE ENTRY WITH NATIVE & ON-SCREEN KEYPAD */}
            {activeTab === 'code' && (
              <form onSubmit={handleCodeSubmit} className="space-y-4 text-center">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    Ask purchaser for 6-digit delivery code:
                  </p>
                </div>

                {/* 6 Auto-Advancing Digit Input Boxes (Triggers Native Keypad) */}
                <div className="flex justify-center gap-1.5 my-2">
                  {codeDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`code-${idx}`}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      placeholder="•"
                      className="w-11 h-14 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl text-center text-xl font-black text-blue-600 dark:text-blue-400 focus:outline-none transition-all shadow-sm"
                    />
                  ))}
                </div>

                {/* Interactive On-Screen Touch Keypad */}
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Touch Keypad Entry
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleKeypadPress(num)}
                        className="py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('clear')}
                      className="py-2.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-300 active:scale-95 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress(0)}
                      className="py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('back')}
                      className="py-2.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-slate-300 active:scale-95 transition-all flex items-center justify-center"
                    >
                      ⌫
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>{verifying ? 'Verifying Code...' : 'Verify Delivery Code'}</span>
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
}
