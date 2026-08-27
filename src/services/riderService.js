/**
 * Reflex Rider Service - API Client, Offline Queue & Local-First State Machine
 * Supports pure static deployments (e.g. Vercel) using localStorage & mock data fallback
 */

import { MOCK_RIDERS } from '../data/mockRiders.js';

const STORAGE_KEYS = {
  TOKEN: 'rider_token',
  USER: 'rider_user',
  RIDERS_CACHE: 'reflex_riders_cache',
  OFFLINE_QUEUE: 'reflex_offline_queue',
  ORDERS_CACHE: 'reflex_orders_cache'
};

// Check if a remote backend API is configured
const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {}
  return null; // Default to static client-side mode
};

// Delivery Lifecycle State Transitions
export const DELIVERY_STATES = {
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

// Standardized State Machine Transitions
export const NEXT_STATE_MAP = {
  [DELIVERY_STATES.ASSIGNED]: DELIVERY_STATES.PICKED_UP,
  [DELIVERY_STATES.PICKED_UP]: DELIVERY_STATES.IN_TRANSIT,
  [DELIVERY_STATES.IN_TRANSIT]: DELIVERY_STATES.DELIVERED,
  [DELIVERY_STATES.DELIVERED]: null
};

class RiderService {
  constructor() {
    this.online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.setupOnlineListeners();
    this.initLocalStorage();
  }

  initLocalStorage() {
    if (typeof localStorage === 'undefined') return;
    // Seed initial mock riders if cache empty
    if (!localStorage.getItem(STORAGE_KEYS.RIDERS_CACHE)) {
      localStorage.setItem(STORAGE_KEYS.RIDERS_CACHE, JSON.stringify(MOCK_RIDERS));
    }
    // Seed initial orders cache if empty
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS_CACHE)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS_CACHE, JSON.stringify(this.getMockOrders()));
    }
  }

  setupOnlineListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.online = true;
        this.notifyListeners('network', { online: true });
        if (getApiUrl()) this.flushOfflineQueue();
      });

      window.addEventListener('offline', () => {
        this.online = false;
        this.notifyListeners('network', { online: false });
      });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(type, payload) {
    this.listeners.forEach(cb => cb(type, payload));
  }

  // --- Auth Services ---
  async loginWithPhone(phoneNumber, otpCode) {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    const isKenyan = /^(\+254|0)[17]\d{8}$/.test(cleanPhone);
    
    if (!isKenyan) {
      throw new Error('Invalid Kenyan phone number format. Use 07XXXXXXXX, 01XXXXXXXX, or +254XXXXXXXX.');
    }

    if (!otpCode || otpCode.length !== 6) {
      throw new Error('Please enter the valid 6-digit OTP code sent to your phone.');
    }

    const riders = this.getAllRiders();
    const matchedRider = riders.find(r => 
      cleanPhone.includes(r.formattedPhone.slice(-8))
    ) || riders[0];

    const token = `jwt_rider_${matchedRider.id}_${Date.now()}`;
    
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(matchedRider));
    this.notifyListeners('auth', { loggedIn: true, rider: matchedRider });

    return { token, rider: matchedRider };
  }

  async loginWithGoogle() {
    const riders = this.getAllRiders();
    const defaultRider = riders[1] || riders[0]; // Faith Wambui default
    const token = `jwt_google_${defaultRider.id}_${Date.now()}`;

    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultRider));
    this.notifyListeners('auth', { loggedIn: true, rider: defaultRider });

    return { token, rider: defaultRider };
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.notifyListeners('auth', { loggedIn: false });
  }

  getCurrentRider() {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return MOCK_RIDERS[0];
    try {
      return JSON.parse(userJson);
    } catch {
      return MOCK_RIDERS[0];
    }
  }

  getAllRiders() {
    const cached = localStorage.getItem(STORAGE_KEYS.RIDERS_CACHE);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return MOCK_RIDERS;
  }

  updateRiderDutyStatus(riderId, newDutyStatus) {
    const riders = this.getAllRiders();
    const updatedRiders = riders.map(r => {
      if (r.id === riderId) {
        return { ...r, dutyStatus: newDutyStatus };
      }
      return r;
    });

    localStorage.setItem(STORAGE_KEYS.RIDERS_CACHE, JSON.stringify(updatedRiders));

    const current = this.getCurrentRider();
    if (current.id === riderId) {
      const updatedCurrent = { ...current, dutyStatus: newDutyStatus };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedCurrent));
      this.notifyListeners('rider_updated', updatedCurrent);
      return updatedCurrent;
    }
    this.notifyListeners('riders_list_updated', updatedRiders);
    return current;
  }

  isLoggedIn() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  // --- Orders & State Machine ---
  async getAssignedOrders(riderId = null) {
    const currentRider = this.getCurrentRider();
    const targetRiderId = riderId || currentRider.id;
    const apiUrl = getApiUrl();

    // If backend API URL is explicitly configured and online, attempt API fetch
    if (apiUrl && navigator.onLine) {
      try {
        const response = await fetch(`${apiUrl}/api/orders`);
        if (response.ok) {
          const apiOrders = await response.json();
          const mapped = apiOrders.map(o => this.normalizeOrder(o, targetRiderId));
          localStorage.setItem(STORAGE_KEYS.ORDERS_CACHE, JSON.stringify(mapped));
          return mapped;
        }
      } catch (e) {
        console.warn('Backend API unavailable. Falling back to local storage state:', e);
      }
    }

    // Static Client Mode: Read directly from localStorage
    const cached = localStorage.getItem(STORAGE_KEYS.ORDERS_CACHE);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('Failed parsing cached orders:', e);
      }
    }

    const initialMocks = this.getMockOrders(targetRiderId);
    localStorage.setItem(STORAGE_KEYS.ORDERS_CACHE, JSON.stringify(initialMocks));
    return initialMocks;
  }

  normalizeOrder(order, riderId) {
    let normalizedStatus = DELIVERY_STATES.ASSIGNED;
    if (order.status === 'In Transit') normalizedStatus = DELIVERY_STATES.IN_TRANSIT;
    else if (order.status === 'Delivered') normalizedStatus = DELIVERY_STATES.DELIVERED;
    else if (order.status === 'Cancelled') normalizedStatus = DELIVERY_STATES.CANCELLED;

    return {
      orderNumber: order.order_number || order.orderNumber,
      retailerId: order.retailer_id || 'RET-001',
      retailerName: order.retailer_name || 'Naivas Supermarket (Westlands)',
      pickupAddress: order.pickup_address || 'Sarit Centre, Ground Floor, Nairobi',
      customerName: order.customer_name || order.customerName,
      customerPhone: order.customer_phone || order.customerPhone,
      deliveryAddress: order.delivery_address || order.deliveryAddress,
      itemDescription: order.item_description || order.itemDescription,
      status: order.rider_status || normalizedStatus,
      amountKes: order.amount_kes || 1850,
      verificationPin: order.verification_pin || '4829',
      qrPayload: `REFLEX-${order.order_number || 'ORD-001'}-VERIFIED`,
      createdAt: order.created_at || new Date().toISOString(),
      etaMinutes: order.eta_minutes || 20,
      notes: order.special_instructions || 'Fragile electronics package. Call customer on arrival.'
    };
  }

  getMockOrders(riderId) {
    return [
      {
        orderNumber: "ORD-2026-0828-001",
        retailerId: "RET-001",
        retailerName: "Naivas Supermarket (Westlands)",
        pickupAddress: "Sarit Centre, Lower Ground Floor, Westlands",
        customerName: "David Ochieng",
        customerPhone: "0722123456",
        deliveryAddress: "Apartment B4, Rhapta Road, Westlands",
        itemDescription: "Groceries & Fresh Supplies (2x Bags)",
        status: DELIVERY_STATES.ASSIGNED,
        amountKes: 2450,
        verificationPin: "4829",
        qrPayload: "REFLEX-ORD-2026-0828-001-VERIFIED",
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        etaMinutes: 25,
        notes: "Ring bell at gate. Leave with security if no answer."
      },
      {
        orderNumber: "ORD-2026-0828-002",
        retailerId: "RET-002",
        retailerName: "Chandarana Foodplus (Kilimani)",
        pickupAddress: "Adlife Plaza, Chania Avenue, Kilimani",
        customerName: "Joy Mutua",
        customerPhone: "0733987654",
        deliveryAddress: "Greenwood Court, Marcus Garvey Rd, Kilimani",
        itemDescription: "Imported Wine & Gourmet Treats",
        status: DELIVERY_STATES.PICKED_UP,
        amountKes: 4100,
        verificationPin: "8192",
        qrPayload: "REFLEX-ORD-2026-0828-002-VERIFIED",
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        etaMinutes: 15,
        notes: "Customer requires SMS verification PIN."
      },
      {
        orderNumber: "ORD-2026-0828-003",
        retailerId: "RET-003",
        retailerName: "Quickmart (Lavington)",
        pickupAddress: "Lavington Mall, James Gichuru Rd",
        customerName: "Peter Kamau",
        customerPhone: "0711554433",
        deliveryAddress: "House 12, Mvuli Road, Lavington",
        itemDescription: "Baby Essentials & Pantry Refill",
        status: DELIVERY_STATES.IN_TRANSIT,
        amountKes: 3200,
        verificationPin: "1047",
        qrPayload: "REFLEX-ORD-2026-0828-003-VERIFIED",
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        etaMinutes: 10,
        notes: "Handle with extra care. M-Pesa cash on delivery."
      },
      {
        orderNumber: "ORD-2026-0828-004",
        retailerId: "RET-001",
        retailerName: "Naivas Supermarket (CBD)",
        pickupAddress: "Development House, Moi Avenue",
        customerName: "Grace Wanjiku",
        customerPhone: "0700112233",
        deliveryAddress: "Office 402, Times Tower, Haile Selassie Ave",
        itemDescription: "Office Stationery & Refreshments",
        status: DELIVERY_STATES.DELIVERED,
        amountKes: 1950,
        verificationPin: "9931",
        qrPayload: "REFLEX-ORD-2026-0828-004-VERIFIED",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        etaMinutes: 0,
        notes: "Delivered & confirmed via M-Pesa STK Push."
      }
    ];
  }

  // --- State Machine Transition (Pure Frontend / LocalStorage + optional API) ---
  async updateOrderStatus(orderNumber, newStatus, verificationData = null) {
    const updatePayload = {
      orderNumber,
      status: newStatus,
      verificationData,
      timestamp: new Date().toISOString()
    };

    // 1. Update local state immediately for instant, reliable UI response
    const updatedOrders = this.updateCachedOrder(orderNumber, newStatus, verificationData);

    const apiUrl = getApiUrl();
    if (!apiUrl) {
      // Static mode: Pure local state mutation
      return {
        success: true,
        offline: false,
        message: `Order ${orderNumber} state changed to ${newStatus}`,
        orders: updatedOrders
      };
    }

    if (!navigator.onLine) {
      this.queueOfflineUpdate(updatePayload);
      return {
        success: true,
        offline: true,
        message: `Offline: Order ${orderNumber} state changed to ${newStatus}. Queued for sync when online.`
      };
    }

    // Backend configured: Fire-and-forget sync or attempt endpoint call
    try {
      await fetch(`${apiUrl}/api/orders/${orderNumber}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
    } catch (e) {
      console.warn('API sync failed during status update. Queueing offline update:', e);
      this.queueOfflineUpdate(updatePayload);
    }

    return { success: true, offline: false, message: `Status updated to ${newStatus}` };
  }

  updateCachedOrder(orderNumber, newStatus, verificationData) {
    const cached = localStorage.getItem(STORAGE_KEYS.ORDERS_CACHE);
    let orders = cached ? JSON.parse(cached) : this.getMockOrders();
    
    orders = orders.map(o => {
      if (o.orderNumber === orderNumber) {
        return {
          ...o,
          status: newStatus,
          verificationData: verificationData || o.verificationData,
          updatedAt: new Date().toISOString()
        };
      }
      return o;
    });

    localStorage.setItem(STORAGE_KEYS.ORDERS_CACHE, JSON.stringify(orders));
    this.notifyListeners('order_updated', { orderNumber, newStatus, orders });
    return orders;
  }

  // --- Offline Queue Manager ---
  getOfflineQueue() {
    const queue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return queue ? JSON.parse(queue) : [];
  }

  queueOfflineUpdate(action) {
    const queue = this.getOfflineQueue();
    queue.push(action);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    this.notifyListeners('queue_changed', { queueLength: queue.length });
  }

  clearOfflineQueue() {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    this.notifyListeners('queue_changed', { queueLength: 0 });
  }

  async flushOfflineQueue() {
    const apiUrl = getApiUrl();
    if (!apiUrl) return;

    const queue = this.getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`[Reflex Offline Sync] Syncing ${queue.length} offline updates to ${apiUrl}...`);
    const failedQueue = [];

    for (const update of queue) {
      try {
        await fetch(`${apiUrl}/api/orders/${update.orderNumber}/advance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
      } catch (e) {
        console.error(`Failed syncing update for ${update.orderNumber}`, e);
        failedQueue.push(update);
      }
    }

    if (failedQueue.length > 0) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(failedQueue));
    } else {
      this.clearOfflineQueue();
    }

    this.notifyListeners('sync_complete', { syncedCount: queue.length - failedQueue.length });
  }

  // --- Payment Trigger: M-Pesa STK Push ---
  async triggerMpesaSTKPush(phoneNumber, amount, orderNumber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          CheckoutRequestID: `ws_CO_${Date.now()}_${Math.floor(Math.random()*100000)}`,
          ResponseCode: "0",
          ResponseDescription: "Success. Request accepted for processing",
          CustomerMessage: `STK Push prompt sent to ${phoneNumber}. Awaiting PIN entry on customer phone for KES ${amount}.`
        });
      }, 1000);
    });
  }
}

export const riderService = new RiderService();
export default riderService;
