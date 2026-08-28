import React, { useState, useEffect } from 'react';
import {
  Zap,
  DollarSign,
  CheckCircle,
  Star,
  QrCode,
  Key,
  Bike,
  Battery,
  MapPin,
  Phone,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Radio,
  Navigation,
  Package,
  Check
} from 'lucide-react';
import riderService, { DELIVERY_STATES, NEXT_STATE_MAP } from '../../services/riderService.js';
import DeliveryVerification from './DeliveryVerification.jsx';

export default function RiderDashboard({ rider, onOpenTracker, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState(null);
  const [verificationInitialTab, setVerificationInitialTab] = useState('qr'); // 'qr' | 'code'
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [dutyStatus, setDutyStatus] = useState(rider?.dutyStatus || 'ONLINE');

  // Load orders and subscribe to updates
  useEffect(() => {
    loadOrders();
    setOfflineQueue(riderService.getOfflineQueue());

    const unsubscribe = riderService.subscribe((type, payload) => {
      if (type === 'network') {
        setIsOnline(payload.online);
        showToast(
          payload.online
            ? '🟢 Network restored! Syncing offline updates...'
            : '🔴 Network disconnected. Operating in offline mode.'
        );
      } else if (type === 'queue_changed') {
        setOfflineQueue(riderService.getOfflineQueue());
      } else if (type === 'order_updated') {
        loadOrders();
      } else if (type === 'sync_complete') {
        showToast(`✅ Synced ${payload.syncedCount} queued updates!`);
        loadOrders();
      }
    });

    return () => unsubscribe();
  }, [rider]);

  const loadOrders = async () => {
    setLoading(true);
    const data = await riderService.getAssignedOrders(rider?.id);
    setOrders(data);
    setLoading(false);
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const currentRider = rider || riderService.getCurrentRider();
  
  // Find current active delivery (In Transit or Picked Up or Assigned), with fallback for interactive testing
  const activeDelivery = orders.find(
    o => o.status === DELIVERY_STATES.IN_TRANSIT || o.status === DELIVERY_STATES.PICKED_UP || o.status === DELIVERY_STATES.ASSIGNED
  ) || orders[0] || {
    orderNumber: 'ORD-2026-0826-001',
    retailerName: 'Savanna Blooms & Florist',
    pickupAddress: 'Westlands, Nairobi',
    customerName: 'Evelyn Mutua',
    customerPhone: '+254 712 345 678',
    deliveryAddress: 'Apartment 4B, Silver Oak Heights, Kilimani, Nairobi',
    itemDescription: 'Luxury White Rose Bouquet & Glass Vase',
    amountKes: 1850,
    etaMinutes: 18,
    status: DELIVERY_STATES.IN_TRANSIT
  };

  
  const completedToday = orders.filter(o => o.status === DELIVERY_STATES.DELIVERED);

  // Calculate mock earnings today
  const earningsToday = 2450 + (completedToday.length * 150);

  // Mask customer phone (e.g. 0712345678 -> 07** *** 678)
  const maskPhone = (phoneStr) => {
    if (!phoneStr) return '07** *** 678';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last3 = digits.slice(-3);
      return `07** *** ${last3}`;
    }
    return phoneStr;
  };

  const handleOpenQRModal = (order) => {
    setVerificationInitialTab('qr');
    setSelectedOrderForVerification(order);
  };

  const handleOpenCodeModal = (order) => {
    setVerificationInitialTab('code');
    setSelectedOrderForVerification(order);
  };

  const handleVerifiedSuccess = (orderNumber) => {
    setSelectedOrderForVerification(null);
    showToast(`🎉 Delivery Confirmed! KES 150 earned on Order ${orderNumber}`);
    loadOrders();
  };

  const toggleDutyStatus = () => {
    const nextStatus = dutyStatus === 'ONLINE' ? 'OFF_DUTY' : 'ONLINE';
    setDutyStatus(nextStatus);
    riderService.updateRiderDutyStatus(currentRider?.id, nextStatus);
    showToast(nextStatus === 'ONLINE' ? '🟢 You are now ONLINE & ready for dispatches!' : '🌙 You are now OFF DUTY');
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto pb-12">

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-slide-down">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* OFFLINE QUEUE INDICATOR BANNER */}
      {(!isOnline || offlineQueue.length > 0) && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-sm ${
          !isOnline
            ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/80 dark:border-amber-500/40 dark:text-amber-200'
            : 'bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/80 dark:border-blue-500/40 dark:text-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                !isOnline ? 'bg-amber-400' : 'bg-blue-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                !isOnline ? 'bg-amber-500' : 'bg-blue-500'
              }`}></span>
            </span>
            <div>
              <div className="font-bold text-sm">
                {!isOnline ? 'Offline Mode Active' : 'Offline Changes Pending Sync'}
              </div>
              <div className="text-xs opacity-90">
                {offlineQueue.length > 0
                  ? `${offlineQueue.length} update(s) stored locally. Will auto-sync when online.`
                  : 'Status updates will queue locally until network reconnects.'}
              </div>
            </div>
          </div>

          {isOnline && offlineQueue.length > 0 && (
            <button
              onClick={() => riderService.flushOfflineQueue()}
              className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-xs shadow"
            >
              Sync Now ({offlineQueue.length})
            </button>
          )}
        </div>
      )}

      {/* 1. TOP SECTION - RIDER PROFILE HEADER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          
          {/* Rider Avatar & Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentRider?.avatar || '/assets/riders/hesbon_otieno.jpg'}
                alt={currentRider?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="hidden w-16 h-16 rounded-2xl text-white font-black items-center justify-center text-xl border-2 border-emerald-500 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #006600 0%, #000000 50%, #CC0000 100%)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                {currentRider?.avatarFallback || 'HO'}
              </div>

              {/* Duty Status Dot */}
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                dutyStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentRider?.name || 'Hesbon Otieno'}
                </h1>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  Kenyan EV Rider
                </span>
              </div>

              {/* EV Bike Model & Plate */}
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 font-medium">
                  <Bike className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {currentRider?.vehicle?.model || 'Roam Air'}
                </span>
                <span>•</span>
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold px-2 py-0.5 rounded-lg border border-amber-300 dark:border-amber-700">
                  {currentRider?.vehicle?.plateNumber || 'KME 102G'}
                </span>
              </div>
            </div>
          </div>

          {/* Battery Level Indicator & Duty Switch */}
          <div className="flex items-center gap-3">
            {/* Battery Gauge */}
            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5">
              <Battery className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider">
                  EV Battery
                </div>
                <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                  {currentRider?.vehicle?.batteryLevel || 88}%
                </div>
              </div>
            </div>

            {/* Duty Status Toggle */}
            <button
              onClick={toggleDutyStatus}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                dutyStatus === 'ONLINE'
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                  : 'bg-amber-500 text-slate-950 border-amber-500 hover:bg-amber-600 shadow-sm'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>{dutyStatus === 'ONLINE' ? 'Online' : 'Off Duty'}</span>
            </button>
          </div>
        </div>

        {/* 3 STATS CARDS IN ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* Card 1: Today's Earnings */}
          <div className="bg-emerald-50/70 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Today's Earnings
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                KES {earningsToday.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                +12% vs yesterday
              </div>
            </div>
          </div>

          {/* Card 2: Deliveries Completed */}
          <div className="bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Deliveries Completed
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {completedToday.length || 14} Orders
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                100% On-Time Dispatch
              </div>
            </div>
          </div>

          {/* Card 3: Rider Rating */}
          <div className="bg-amber-50/70 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 shadow-md">
              <Star className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Rider Rating
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1">
                <span>{currentRider?.rating || 4.9}</span>
                <span className="text-amber-500 text-sm">★</span>
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                {currentRider?.completedDeliveries || 412} Total Reviews
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. MAIN SECTION - ACTIVE DELIVERY CARD */}
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/80 dark:border-emerald-500/60 rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Current Delivery</span>
              {activeDelivery && (
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                  {activeDelivery.orderNumber}
                </span>
              )}
            </h2>
          </div>

          {onOpenTracker && (
            <button
              onClick={onOpenTracker}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Navigation className="w-4 h-4" />
              Live Telemetry Map
            </button>
          )}
        </div>

        {activeDelivery ? (
          <div className="space-y-4">
            
            {/* Delivery Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column: Retailer & Customer Info */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                {/* Retailer Pickup */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700 font-bold">
                    🏬
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                      Retailer Store
                    </span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeDelivery.retailerName || 'Savanna Blooms & Florist'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {activeDelivery.pickupAddress || 'Westlands, Nairobi'}
                    </div>
                  </div>
                </div>

                {/* Customer Info & Address */}
                <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-700 font-bold">
                    📍
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                      Customer & Destination
                    </span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{activeDelivery.customerName}</span>
                      <span className="text-xs font-mono text-slate-500 font-normal">
                        ({maskPhone(activeDelivery.customerPhone)})
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                      {activeDelivery.deliveryAddress}
                    </div>
                  </div>
                </div>

                {/* Package Weight & Specs */}
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {activeDelivery.itemDescription}
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-slate-800 dark:text-slate-200">
                    2.4 kg • Eco Pack
                  </span>
                </div>
              </div>

              {/* Right Column: Route Map Placeholder & Customer Call */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                
                {/* Visual Route Line Nairobi */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-emerald-400" />
                      Live Route Line
                    </span>
                    <span className="text-emerald-400 font-bold">~{activeDelivery.etaMinutes || 18} mins away</span>
                  </div>

                  <div className="relative pt-2 pb-1">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 w-3/4 rounded-full animate-pulse" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>Sarit Centre Hub</span>
                      <span className="text-emerald-400 font-bold">Waiyaki Way</span>
                      <span>Kilimani Argwings</span>
                    </div>
                  </div>
                </div>

                {/* Call Customer Button */}
                <a
                  href={`tel:${activeDelivery.customerPhone}`}
                  className="w-full py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Call Customer ({activeDelivery.customerPhone})</span>
                </a>
              </div>

            </div>

            {/* 2 DELIVERY CONFIRMATION OPTIONS SIDE-BY-SIDE */}
            <div className="pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Choose Delivery Confirmation Method
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* OPTION A: QR CODE SCAN */}
                <button
                  onClick={() => handleOpenQRModal(activeDelivery)}
                  className="py-3.5 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2.5 group"
                  style={{ backgroundColor: '#0F9D58' }}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm leading-tight">Scan Purchaser QR</div>
                    <div className="text-[10px] text-emerald-100 font-normal">Use Camera QR Viewfinder</div>
                  </div>
                </button>

                {/* OPTION B: ENTER CODE */}
                <button
                  onClick={() => handleOpenCodeModal(activeDelivery)}
                  className="py-3.5 px-4 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2.5 group"
                  style={{ backgroundColor: '#1A73E8' }}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-sm leading-tight">Enter Delivery Code</div>
                    <div className="text-[10px] text-blue-100 font-normal">Ask Purchaser for 6-digit PIN</div>
                  </div>
                </button>

              </div>
            </div>

          </div>
        ) : (
          /* EMPTY STATE ILLUSTRATION */
          <div className="p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-800">
              <Bike className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                No active delivery — waiting for dispatch
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                You are online in Westlands EV Charging Hub zone. New retailer orders will pop up here instantly!
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 3. BOTTOM SECTION - FILTER TABS & DELIVERY HISTORY LIST */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Delivery History & Queue</span>
            <span className="text-xs text-slate-500 font-normal">({filteredOrders.length})</span>
          </h3>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: DELIVERY_STATES.ASSIGNED, label: 'Assigned' },
              { id: DELIVERY_STATES.IN_TRANSIT, label: 'In Transit' },
              { id: DELIVERY_STATES.DELIVERED, label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No orders found in {activeTab} status.
            </div>
          ) : (
            filteredOrders.map(order => {
              const isDelivered = order.status === DELIVERY_STATES.DELIVERED;
              return (
                <div
                  key={order.orderNumber}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Timeline Check Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                      isDelivered
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                    }`}>
                      {isDelivered ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                        {order.retailerName} → {order.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.deliveryAddress}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      +KES {order.amountKes || 150}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isDelivered ? 'Paid via M-Pesa' : 'Pending Confirmation'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BOTTOM GO OFFLINE & LOGOUT BAR */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={toggleDutyStatus}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-red-300 text-red-700 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Go Offline</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
            >
              Sign Out Rider Session
            </button>
          )}
        </div>
      </div>

      {/* DELIVERY VERIFICATION MODAL */}
      {selectedOrderForVerification && (
        <DeliveryVerification
          order={selectedOrderForVerification}
          initialTab={verificationInitialTab}
          onVerified={() => handleVerifiedSuccess(selectedOrderForVerification.orderNumber)}
          onClose={() => setSelectedOrderForVerification(null)}
        />
      )}

    </div>
  );
}
