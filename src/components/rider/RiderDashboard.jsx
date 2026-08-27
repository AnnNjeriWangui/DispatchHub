import React, { useState, useEffect } from 'react';
import riderService, { DELIVERY_STATES, NEXT_STATE_MAP } from '../../services/riderService.js';
import RiderCard from './RiderCard.jsx';
import DeliveryVerification from './DeliveryVerification.jsx';

export default function RiderDashboard({ rider, onOpenTracker }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED'
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedOrderForVerification, setSelectedOrderForVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Load orders and subscribe to network & queue updates
  useEffect(() => {
    loadOrders();
    setOfflineQueue(riderService.getOfflineQueue());

    const unsubscribe = riderService.subscribe((type, payload) => {
      if (type === 'network') {
        setIsOnline(payload.online);
        showToast(payload.online ? '🟢 Network restored! Syncing offline updates...' : '🔴 Network disconnected. Operating in offline mode.');
      } else if (type === 'queue_changed') {
        setOfflineQueue(riderService.getOfflineQueue());
      } else if (type === 'order_updated') {
        loadOrders();
      } else if (type === 'sync_complete') {
        showToast(`✅ Synced ${payload.syncedCount} queued updates to Reflex server!`);
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

  // State Machine transition handler
  const handleAdvanceStatus = async (order) => {
    const nextStatus = NEXT_STATE_MAP[order.status];
    if (!nextStatus) return;

    // If transitioning to DELIVERED, trigger Dual Verification Modal
    if (nextStatus === DELIVERY_STATES.DELIVERED) {
      setSelectedOrderForVerification(order);
      return;
    }

    const res = await riderService.updateOrderStatus(order.orderNumber, nextStatus);
    showToast(res.message || `Order ${order.orderNumber} advanced to ${nextStatus}`);
    loadOrders();
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case DELIVERY_STATES.ASSIGNED:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case DELIVERY_STATES.PICKED_UP:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case DELIVERY_STATES.IN_TRANSIT:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse';
      case DELIVERY_STATES.DELIVERED:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getNextActionButtonText = (status) => {
    switch (status) {
      case DELIVERY_STATES.ASSIGNED:
        return 'Confirm Package Pickup';
      case DELIVERY_STATES.PICKED_UP:
        return 'Start Transit to Customer';
      case DELIVERY_STATES.IN_TRANSIT:
        return 'Verify & Complete Delivery';
      case DELIVERY_STATES.DELIVERED:
        return 'Completed';
      default:
        return 'Advance Status';
    }
  };

  return (
    <div className="space-y-5 font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{notification}</span>
        </div>
      )}

      {/* OFFLINE QUEUE INDICATOR BANNER */}
      {(!isOnline || offlineQueue.length > 0) && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-lg ${
          !isOnline
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
            : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                !isOnline ? 'bg-amber-400' : 'bg-blue-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                !isOnline ? 'bg-amber-500' : 'bg-blue-500'
              }`}></span>
            </span>
            <div>
              <div className="font-bold">
                {!isOnline ? 'Offline Mode Active' : 'Offline Changes Pending Sync'}
              </div>
              <div className="text-[11px] opacity-80">
                {offlineQueue.length > 0
                  ? `${offlineQueue.length} update(s) stored in localStorage. Will auto-sync when online.`
                  : 'Status updates will queue locally until network reconnects.'}
              </div>
            </div>
          </div>

          {isOnline && offlineQueue.length > 0 && (
            <button
              onClick={() => riderService.flushOfflineQueue()}
              className="px-3 py-1 bg-blue-500 text-slate-950 font-bold rounded-lg hover:bg-blue-400 transition-all text-xs"
            >
              Sync Now ({offlineQueue.length})
            </button>
          )}
        </div>
      )}

      {/* RIDER PROFILE CARD VIEW */}
      <RiderCard rider={rider} />

      {/* FILTER TABS & SEARCH */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Orders', count: orders.length },
            { id: DELIVERY_STATES.ASSIGNED, label: 'Assigned', count: orders.filter(o => o.status === DELIVERY_STATES.ASSIGNED).length },
            { id: DELIVERY_STATES.PICKED_UP, label: 'Picked Up', count: orders.filter(o => o.status === DELIVERY_STATES.PICKED_UP).length },
            { id: DELIVERY_STATES.IN_TRANSIT, label: 'In Transit', count: orders.filter(o => o.status === DELIVERY_STATES.IN_TRANSIT).length },
            { id: DELIVERY_STATES.DELIVERED, label: 'Delivered', count: orders.filter(o => o.status === DELIVERY_STATES.DELIVERED).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ORDER FEED */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Deliveries Feed</span>
            <span className="text-xs text-slate-400 font-normal">({filteredOrders.length})</span>
          </h3>
          {onOpenTracker && (
            <button
              onClick={onOpenTracker}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Open GPS Radar
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-400 text-xs">
            Loading assigned retailer orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-slate-300">No orders found in {activeTab} status.</p>
            <p className="text-[11px]">Select another status tab to view orders.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.orderNumber}
              className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 text-slate-100 shadow-lg space-y-3 hover:border-slate-600 transition-all"
            >
              {/* Top Row: Order # & Status Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block">Retailer Order</span>
                  <span className="font-mono font-black text-white text-sm tracking-wide">
                    {order.orderNumber}
                  </span>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                    KES {order.amountKes}
                  </div>
                </div>
              </div>

              {/* Retailer Pickup Address */}
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                  🏬
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Pickup Location</span>
                  <div className="font-semibold text-white">{order.retailerName}</div>
                  <div className="text-slate-400 text-[11px]">{order.pickupAddress}</div>
                </div>
              </div>

              {/* Customer Delivery Address */}
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                  📍
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Delivery Address & Customer</span>
                  <div className="font-semibold text-white">{order.customerName} ({order.customerPhone})</div>
                  <div className="text-slate-300 text-[11px]">{order.deliveryAddress}</div>
                </div>
              </div>

              {/* Package Specs & Notes */}
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold text-emerald-300">📦 {order.itemDescription}</span>
                  <span className="text-[11px] text-slate-400">ETA: ~{order.etaMinutes} mins</span>
                </div>
                {order.notes && (
                  <p className="text-[11px] text-slate-400 italic">"{order.notes}"</p>
                )}
              </div>

              {/* Actions Row */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="py-2 px-3 bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Customer
                </a>

                {order.status !== DELIVERY_STATES.DELIVERED && (
                  <button
                    onClick={() => handleAdvanceStatus(order)}
                    className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                  >
                    <span>{getNextActionButtonText(order.status)}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* DUAL VERIFICATION MODAL TRIGGER */}
      {selectedOrderForVerification && (
        <DeliveryVerification
          order={selectedOrderForVerification}
          onVerified={() => {
            setSelectedOrderForVerification(null);
            showToast(`Order ${selectedOrderForVerification.orderNumber} successfully verified & payment triggered!`);
            loadOrders();
          }}
          onClose={() => setSelectedOrderForVerification(null)}
        />
      )}

    </div>
  );
}
