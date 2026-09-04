/**
 * Reflex Dispatcher Command Center - Frontend Logic
 * Live Telematics, Multi-Tenant Retailer Demand, Fleet Orchestration & Real-Time Action Log
 */

// Application State
const state = {
  orders: [],
  riders: [],
  retailers: [],
  metrics: {},
  events: [],
  activeTab: 'queue',
  statusFilter: 'ALL',
  retailerFilter: 'ALL',
  riderFilter: 'ALL',
  searchQuery: '',
  selectedOrderForAssign: null,
  isAutoDispatching: false
};

// DOM Elements Cache
const el = {
  // Stats
  statPendingCount: document.getElementById('statPendingCount'),
  statUrgentCount: document.getElementById('statUrgentCount'),
  statTransitCount: document.getElementById('statTransitCount'),
  statOnlineRiders: document.getElementById('statOnlineRiders'),
  statDeliveredCount: document.getElementById('statDeliveredCount'),
  statTotalLogged: document.getElementById('statTotalLogged'),
  statCodVolume: document.getElementById('statCodVolume'),
  tabCountQueue: document.getElementById('tabCountQueue'),
  tabCountRetailers: document.getElementById('tabCountRetailers'),
  liveActionsCount: document.getElementById('liveActionsCount'),
  liveActionTickerText: document.getElementById('liveActionTickerText'),
  btnViewEventsTab: document.getElementById('btnViewEventsTab'),
  
  // Tabs & Views
  tabBtnQueue: document.getElementById('tabBtnQueue'),
  tabBtnRetailers: document.getElementById('tabBtnRetailers'),
  tabBtnFleet: document.getElementById('tabBtnFleet'),
  tabBtnRadar: document.getElementById('tabBtnRadar'),
  tabBtnVerify: document.getElementById('tabBtnVerify'),
  tabBtnFinancials: document.getElementById('tabBtnFinancials'),
  viewQueue: document.getElementById('viewQueue'),
  viewRetailers: document.getElementById('viewRetailers'),
  viewFleet: document.getElementById('viewFleet'),
  viewRadar: document.getElementById('viewRadar'),
  viewVerify: document.getElementById('viewVerify'),
  viewFinancials: document.getElementById('viewFinancials'),
  
  // Table & Lists
  ordersTableBody: document.getElementById('ordersTableBody'),
  queueEmptyState: document.getElementById('queueEmptyState'),
  retailersCardsGrid: document.getElementById('retailersCardsGrid'),
  fleetCardsGrid: document.getElementById('fleetCardsGrid'),
  liveEventsList: document.getElementById('liveEventsList'),
  globalFilterInput: document.getElementById('globalFilterInput'),
  retailerFilterSelect: document.getElementById('retailerFilterSelect'),
  riderFilterSelect: document.getElementById('riderFilterSelect'),
  
  // Filter counts
  filterCountAll: document.getElementById('filterCountAll'),
  filterCountPending: document.getElementById('filterCountPending'),
  filterCountTransit: document.getElementById('filterCountTransit'),
  filterCountDelivered: document.getElementById('filterCountDelivered'),
  
  // Buttons & Modals
  btnAutoDispatchAll: document.getElementById('btnAutoDispatchAll'),
  btnManualRefresh: document.getElementById('btnManualRefresh'),
  refreshIcon: document.getElementById('refreshIcon'),
  modalAssignRider: document.getElementById('modalAssignRider'),
  modalAssignOrderNum: document.getElementById('modalAssignOrderNum'),
  modalAssignOrderDest: document.getElementById('modalAssignOrderDest'),
  assignRiderList: document.getElementById('assignRiderList'),
  btnCloseAssignModal: document.getElementById('btnCloseAssignModal'),
  
  // Waybill Modal
  modalWaybill: document.getElementById('modalWaybill'),
  btnCloseWaybillModal: document.getElementById('btnCloseWaybillModal'),
  qrcodeContainer: document.getElementById('qrcodeContainer'),
  waybillOrderNum: document.getElementById('waybillOrderNum'),
  waybillPinCode: document.getElementById('waybillPinCode'),
  waybillCustomer: document.getElementById('waybillCustomer'),
  waybillAddress: document.getElementById('waybillAddress'),
  waybillItem: document.getElementById('waybillItem'),
  waybillRider: document.getElementById('waybillRider'),
  waybillCod: document.getElementById('waybillCod'),
  
  // Verification Form
  verifyForm: document.getElementById('verifyForm'),
  verifyOrderInput: document.getElementById('verifyOrderInput'),
  verifyPinInput: document.getElementById('verifyPinInput'),
  verifyResultBanner: document.getElementById('verifyResultBanner'),
  btnSimulateQrScan: document.getElementById('btnSimulateQrScan'),
  
  // Notification Form
  smsNotifyForm: document.getElementById('smsNotifyForm'),
  notifyOrderSelect: document.getElementById('notifyOrderSelect'),
  smsPreviewText: document.getElementById('smsPreviewText'),
  
  // Financials
  finRetailerCom: document.getElementById('finRetailerCom'),
  finRiderPayout: document.getElementById('finRiderPayout'),
  finPlatformRev: document.getElementById('finPlatformRev'),
  
  // Toast
  toast: document.getElementById('toastNotification'),
  toastTitle: document.getElementById('toastTitle'),
  toastBody: document.getElementById('toastBody'),
  liveSyncClock: document.getElementById('liveSyncClock')
};

// ----------------- TOAST NOTIFICATIONS -----------------
function showToast(title, message, isError = false) {
  if (!el.toast) return;
  el.toastTitle.textContent = title;
  el.toastBody.textContent = message;
  
  el.toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  el.toast.classList.add('translate-y-0', 'opacity-100');
  
  setTimeout(() => {
    el.toast.classList.remove('translate-y-0', 'opacity-100');
    el.toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 3500);
}

// ----------------- PERSISTENT STORAGE & MULTI-TAB SYNC -----------------
const STORAGE_KEY = 'dispatchhub_master_orders';
const EVENTS_STORAGE_KEY = 'dispatchhub_live_events';

function getLocalOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('dispatchhub_order_update', { detail: orders }));
  } catch (e) {
    console.warn('Failed to save orders to localStorage:', e);
  }
}

function getLocalEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalEvents(events) {
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events.slice(0, 60)));
    window.dispatchEvent(new CustomEvent('dispatchhub_event_update', { detail: events }));
  } catch (e) {
    console.warn('Failed to save events to localStorage:', e);
  }
}

function recordAction(badge, message, type = 'GENERAL') {
  const evt = {
    id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: type,
    message: message,
    timestamp: new Date().toISOString(),
    badge: badge
  };
  const current = getLocalEvents();
  current.unshift(evt);
  saveLocalEvents(current);
  
  // Post to backend API so all connected clients receive it
  fetch('/api/events/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evt)
  }).catch(() => {});
  
  return evt;
}

function reconcileOrders(localOrders, serverOrders) {
  const map = new Map();
  if (Array.isArray(serverOrders)) {
    for (const o of serverOrders) {
      if (o && o.order_number) map.set(o.order_number, { ...o });
    }
  }
  if (Array.isArray(localOrders)) {
    for (const local of localOrders) {
      if (!local || !local.order_number) continue;
      const existing = map.get(local.order_number);
      if (!existing) {
        map.set(local.order_number, { ...local });
      } else {
        const rank = { 'Pending': 1, 'Assigned': 2, 'Picked Up': 3, 'In Transit': 4, 'Delivered': 5, 'Cancelled': 6 };
        if ((rank[local.status] || 0) > (rank[existing.status] || 0)) {
          existing.status = local.status;
        }
        if (local.dispatcher_id && !existing.dispatcher_id) {
          existing.dispatcher_id = local.dispatcher_id;
          existing.dispatcher_name = local.dispatcher_name;
          existing.driver_phone = local.driver_phone;
          existing.vehicle_type = local.vehicle_type;
          existing.vehicle_reg = local.vehicle_reg;
        }
        if (local.delivered_at && !existing.delivered_at) {
          existing.delivered_at = local.delivered_at;
        }
        if (local.special_instructions && !existing.special_instructions) {
          existing.special_instructions = local.special_instructions;
        }
      }
    }
  }
  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return merged;
}

function getRiderAvatarUrl(riderId, riderName) {
  const map = {
    'RIDER-001': '/static/assets/riders/hesbon_otieno.jpg',
    'RIDER-002': '/static/assets/riders/faith_wambui.jpg',
    'RIDER-003': '/static/assets/riders/aminah_hassan.jpg',
    'RIDER-004': '/static/assets/riders/brian_kipkorir.jpg',
    'DISP-001': '/static/assets/riders/jackson_kiprotich.jpg',
    'DISP-002': '/static/assets/riders/samuel_odhiambo.jpg',
    'DISP-003': '/static/assets/riders/peter_kamau.jpg',
    'DISP-004': '/static/assets/riders/grace_nduta.jpg',
    'DISP-005': '/static/assets/riders/boniface_maina.jpg'
  };
  if (riderId && map[riderId]) return map[riderId];
  if (riderName) {
    const clean = riderName.toLowerCase();
    if (clean.includes('hesbon')) return '/static/assets/riders/hesbon_otieno.jpg';
    if (clean.includes('faith')) return '/static/assets/riders/faith_wambui.jpg';
    if (clean.includes('aminah') || clean.includes('amina')) return '/static/assets/riders/aminah_hassan.jpg';
    if (clean.includes('brian')) return '/static/assets/riders/brian_kipkorir.jpg';
    if (clean.includes('jackson')) return '/static/assets/riders/jackson_kiprotich.jpg';
    if (clean.includes('samuel')) return '/static/assets/riders/samuel_odhiambo.jpg';
    if (clean.includes('peter')) return '/static/assets/riders/peter_kamau.jpg';
    if (clean.includes('grace')) return '/static/assets/riders/grace_nduta.jpg';
    if (clean.includes('boniface')) return '/static/assets/riders/boniface_maina.jpg';
  }
  return '/static/assets/riders/hesbon_otieno.jpg';
}

// ----------------- DATA FETCHING -----------------
async function fetchAllData() {
  try {
    const local = getLocalOrders();
    const localEvts = getLocalEvents();

    const [ordersRes, ridersRes, retailersRes, metricsRes, eventsRes] = await Promise.all([
      fetch('/api/orders').catch(() => null),
      fetch('/api/riders').catch(() => null),
      fetch('/api/retailers').catch(() => null),
      fetch('/api/metrics').catch(() => null),
      fetch('/api/events/live').catch(() => null)
    ]);
    
    let serverOrders = [];
    if (ordersRes && ordersRes.ok) serverOrders = await ordersRes.json();
    if (ridersRes && ridersRes.ok) state.riders = await ridersRes.json();
    if (retailersRes && retailersRes.ok) state.retailers = await retailersRes.json();
    if (metricsRes && metricsRes.ok) state.metrics = await metricsRes.json();

    let serverEvents = [];
    if (eventsRes && eventsRes.ok) serverEvents = await eventsRes.json();

    // Default Fallback Retailers if API empty
    if (!state.retailers || state.retailers.length === 0) {
      state.retailers = [
        { id: "RET-001", name: "Savanna Blooms & Florist", owner: "Evelyn Mutua", phone: "+254 712 345 678", location: "Westlands, Nairobi", category: "Fresh Florals & Gifts", avatar: "🌸", color: "#e11d48" },
        { id: "RET-002", name: "Rift Valley Artisan Crafts", owner: "Kiprono Koech", phone: "+254 722 987 654", location: "Karen, Nairobi", category: "Handicrafts & Leatherwear", avatar: "🏺", color: "#d97706" },
        { id: "RET-003", name: "Nairobi Tech & Gadgets Hub", owner: "Brian Omondi", phone: "+254 733 456 789", location: "Moi Avenue, Nairobi CBD", category: "Consumer Electronics", avatar: "⚡", color: "#2563eb" },
        { id: "RET-004", name: "Organic Fresh Basket", owner: "Amina Wanjiru", phone: "+254 745 112 233", location: "Lavington, Nairobi", category: "Farm-Fresh Produce & Oils", avatar: "🥑", color: "#16a34a" },
        { id: "RET-005", name: "Urban Books & Stationery", owner: "David Njoroge", phone: "+254 754 889 001", location: "Ruaka, Kiambu", category: "Books & Office Stationery", avatar: "📚", color: "#7c3aed" }
      ];
    }

    // Reconcile server orders with persistent local storage
    const mergedOrders = reconcileOrders(local, serverOrders);
    saveLocalOrders(mergedOrders);
    state.orders = mergedOrders;

    // Reconcile live events
    const eventMap = new Map();
    [...(Array.isArray(serverEvents) ? serverEvents : []), ...localEvts].forEach(ev => {
      if (ev && ev.id) eventMap.set(ev.id, ev);
      else if (ev && ev.message) eventMap.set(ev.message + (ev.timestamp || ''), ev);
    });
    const mergedEvents = Array.from(eventMap.values());
    mergedEvents.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    state.events = mergedEvents;
    saveLocalEvents(mergedEvents);
    
    renderUI();

    // Background sync to server
    if (local.length > 0) {
      fetch('/api/orders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: mergedOrders })
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to sync dispatcher data:', err);
  }
}

// ----------------- UI RENDERING -----------------
function renderUI() {
  renderMetrics();
  renderFilterOptions();
  renderOrdersTable();
  renderRetailerCards();
  renderFleetCards();
  renderEvents();
  renderLiveTicker();
  renderNotificationSelect();
  renderFinancials();
  
  // Update live clock
  const now = new Date();
  if (el.liveSyncClock) {
    el.liveSyncClock.textContent = `Sync: ${now.toLocaleTimeString('en-GB')}`;
  }
  
  // Re-run Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

function renderMetrics() {
  const pending = state.orders.filter(o => o.status === 'Pending');
  const transit = state.orders.filter(o => ['In Transit', 'Assigned', 'Picked Up'].includes(o.status));
  const delivered = state.orders.filter(o => o.status === 'Delivered');
  const onlineRiders = state.riders.filter(r => (r.duty_status || 'ONLINE') === 'ONLINE');
  const urgentCount = state.orders.filter(o => o.status === 'Pending' && o.priority === 'Urgent').length;
  
  const codTotal = delivered.reduce((sum, o) => sum + (o.cod_amount || 2800), 0);
  
  if (el.statPendingCount) el.statPendingCount.textContent = pending.length;
  if (el.statUrgentCount) el.statUrgentCount.textContent = urgentCount;
  if (el.statTransitCount) el.statTransitCount.textContent = transit.length;
  if (el.statDeliveredCount) el.statDeliveredCount.textContent = delivered.length;
  if (el.statTotalLogged) el.statTotalLogged.textContent = state.orders.length;
  if (el.statOnlineRiders) el.statOnlineRiders.textContent = `${onlineRiders.length}/${state.riders.length}`;
  if (el.statCodVolume) el.statCodVolume.textContent = `KES ${codTotal.toLocaleString()}`;
  if (el.tabCountQueue) el.tabCountQueue.textContent = pending.length;
  if (el.tabCountRetailers) el.tabCountRetailers.textContent = state.retailers.length;
  
  if (el.filterCountAll) el.filterCountAll.textContent = state.orders.length;
  if (el.filterCountPending) el.filterCountPending.textContent = pending.length;
  if (el.filterCountTransit) el.filterCountTransit.textContent = transit.length;
  if (el.filterCountDelivered) el.filterCountDelivered.textContent = delivered.length;
}

function renderFilterOptions() {
  // Populate Retailers Filter Dropdown
  if (el.retailerFilterSelect) {
    const currentVal = el.retailerFilterSelect.value;
    el.retailerFilterSelect.innerHTML = '<option value="ALL">🏪 All Retailers</option>';
    state.retailers.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.avatar || '🏪'} ${r.name}`;
      if (r.id === currentVal || r.id === state.retailerFilter) opt.selected = true;
      el.retailerFilterSelect.appendChild(opt);
    });
  }

  // Populate Riders Filter Dropdown
  if (el.riderFilterSelect) {
    const currentRiderVal = el.riderFilterSelect.value;
    el.riderFilterSelect.innerHTML = '<option value="ALL">🛵 All Fleet Riders</option>';
    state.riders.forEach(rd => {
      const opt = document.createElement('option');
      opt.value = rd.id;
      opt.textContent = `🛵 ${rd.name} (${rd.vehicle_type ? rd.vehicle_type.split(' ')[0] : 'Bike'})`;
      if (rd.id === currentRiderVal || rd.id === state.riderFilter) opt.selected = true;
      el.riderFilterSelect.appendChild(opt);
    });
  }
}

function getFilteredOrders() {
  let filtered = [...state.orders];
  
  // Status tab filter
  if (state.statusFilter !== 'ALL') {
    filtered = filtered.filter(o => o.status === state.statusFilter);
  }

  // Retailer filter
  if (state.retailerFilter !== 'ALL') {
    filtered = filtered.filter(o => o.retailer_id === state.retailerFilter);
  }

  // Rider filter
  if (state.riderFilter !== 'ALL') {
    filtered = filtered.filter(o => o.dispatcher_id === state.riderFilter);
  }
  
  // Query search
  if (state.searchQuery && state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(o => 
      (o.order_number && o.order_number.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.delivery_address && o.delivery_address.toLowerCase().includes(q)) ||
      (o.dispatcher_name && o.dispatcher_name.toLowerCase().includes(q)) ||
      (o.retailer_id && o.retailer_id.toLowerCase().includes(q)) ||
      (o.item_description && o.item_description.toLowerCase().includes(q)) ||
      (o.verification_code && o.verification_code.includes(q))
    );
  }
  
  return filtered;
}

function renderOrdersTable() {
  const filtered = getFilteredOrders();
  if (!el.ordersTableBody) return;
  el.ordersTableBody.innerHTML = '';
  
  if (filtered.length === 0) {
    if (el.queueEmptyState) el.queueEmptyState.classList.remove('hidden');
    return;
  }
  
  if (el.queueEmptyState) el.queueEmptyState.classList.add('hidden');
  
  filtered.forEach(order => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition border-b border-slate-100';
    
    // Status Badge Styling: Soft-Toned palette (Amber for Pending, Cobalt for In Transit, Emerald for Delivered)
    let statusBadge = '';
    if (order.status === 'Pending') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>Pending Dispatch</span>`;
    } else if (order.status === 'In Transit' || order.status === 'Assigned' || order.status === 'Picked Up') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300"><span class="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5 animate-ping"></span>${order.status}</span>`;
    } else if (order.status === 'Delivered') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><i data-lucide="check-circle" class="w-3 h-3 mr-1 text-emerald-600"></i>Delivered</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">${order.status}</span>`;
    }
    
    // Priority badge
    const isUrgent = order.priority === 'Urgent';
    const priorityTag = isUrgent 
      ? `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500 text-white uppercase">URGENT</span>` 
      : '';

    // Match Retailer Details
    const matchedRetailer = state.retailers.find(r => r.id === order.retailer_id) || {
      name: 'Registered Retailer',
      avatar: '🏪',
      location: 'Nairobi',
      phone: '+254 7XX XXX XXX'
    };

    // Rider display
    const hasRider = order.dispatcher_id && order.dispatcher_name && order.dispatcher_name !== 'Auto-Assigning...';
    const riderAvatar = getRiderAvatarUrl(order.dispatcher_id, order.dispatcher_name);
    const riderDisplay = hasRider ? `
      <div class="flex items-center space-x-2.5">
        <img src="${riderAvatar}" alt="${order.dispatcher_name}" class="w-8 h-8 rounded-lg object-cover border border-emerald-500/40 shadow-sm flex-shrink-0" onerror="this.src='/static/assets/riders/hesbon_otieno.jpg'">
        <div>
          <div class="font-bold text-slate-900 text-xs">${order.dispatcher_name}</div>
          <div class="text-[10px] text-slate-500 font-mono">${order.driver_phone || '+254 7XX XXX'} • ${order.vehicle_reg || 'EV Bike'}</div>
        </div>
      </div>
    ` : `
      <span class="inline-flex items-center text-xs text-amber-700 font-semibold italic bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
        <i data-lucide="alert-circle" class="w-3.5 h-3.5 mr-1 text-amber-600"></i> Unassigned
      </span>
    `;

    tr.innerHTML = `
      <td class="py-3.5 px-4">
        <div class="flex items-center space-x-2">
          <span class="font-mono font-extrabold text-slate-900 text-xs tracking-tight">${order.order_number}</span>
          ${priorityTag}
        </div>
        <div class="text-[11px] text-slate-700 mt-1 flex items-center space-x-1.5 font-bold">
          <span class="text-sm">${matchedRetailer.avatar || '🏪'}</span>
          <span class="text-slate-900 hover:text-indigo-600 cursor-pointer" onclick="filterByRetailer('${order.retailer_id}')">${matchedRetailer.name}</span>
        </div>
        <div class="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center space-x-1.5">
          <span class="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold border border-slate-200">${order.retailer_id || 'RET-001'}</span>
          <span>• ${matchedRetailer.location ? matchedRetailer.location.split(',')[0] : 'Nairobi'}</span>
          <span>• ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </td>
      
      <td class="py-3.5 px-4 max-w-xs">
        <div class="font-bold text-slate-900">${order.customer_name}</div>
        <div class="text-[11px] text-slate-600 mt-0.5" title="${order.delivery_address}">
          <i data-lucide="map-pin" class="w-3 h-3 inline text-slate-400"></i> ${order.delivery_address}
        </div>
        <div class="text-[10px] text-slate-400 font-mono mt-0.5">${order.customer_phone || ''}</div>
      </td>

      <td class="py-3.5 px-4 max-w-xs">
        <div class="text-slate-800 font-medium truncate">${order.item_description}</div>
        <div class="text-[10px] text-amber-700 italic truncate">${order.special_instructions || 'Standard delivery care'}</div>
        <div class="text-[10px] text-emerald-700 font-mono font-bold mt-0.5">KES ${(order.cod_amount || 0).toLocaleString()} (COD)</div>
      </td>

      <td class="py-3.5 px-4 whitespace-nowrap">
        ${statusBadge}
        ${order.eta_minutes ? `<div class="text-[10px] text-slate-500 mt-1 font-mono">ETA: ~${order.eta_minutes} mins</div>` : ''}
      </td>

      <td class="py-3.5 px-4 whitespace-nowrap">
        ${riderDisplay}
      </td>

      <td class="py-3.5 px-4 text-right whitespace-nowrap">
        <div class="flex items-center justify-end space-x-1.5">
          ${order.status === 'Pending' ? `
            <button onclick="openAssignModal('${order.order_number}')" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition shadow-sm flex items-center space-x-1">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span>Assign</span>
            </button>
          ` : `
            <button onclick="openAssignModal('${order.order_number}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition" title="Reassign Rider">
              <i data-lucide="repeat" class="w-3.5 h-3.5"></i>
            </button>
          `}

          <button onclick="advanceOrderStatus('${order.order_number}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-lg text-xs transition font-semibold" title="Progress Status (Picked Up / Delivered)">
            <i data-lucide="fast-forward" class="w-3.5 h-3.5"></i>
          </button>

          <button onclick="openWaybillModal('${order.order_number}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-purple-700 rounded-lg text-xs transition" title="View Waybill & QR Code">
            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
          </button>

          <button onclick="cancelOrder('${order.order_number}')" class="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg text-xs transition" title="Cancel Delivery">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    `;
    
    el.ordersTableBody.appendChild(tr);
  });
}

function renderRetailerCards() {
  if (!el.retailersCardsGrid) return;
  el.retailersCardsGrid.innerHTML = '';
  
  state.retailers.forEach(r => {
    const retailerOrders = state.orders.filter(o => o.retailer_id === r.id);
    const pendingOrders = retailerOrders.filter(o => o.status === 'Pending').length;
    const transitOrders = retailerOrders.filter(o => ['In Transit', 'Assigned', 'Picked Up'].includes(o.status)).length;
    const deliveredOrders = retailerOrders.filter(o => o.status === 'Delivered').length;
    const gmv = retailerOrders.filter(o => o.status === 'Delivered').reduce((s, o) => s + (o.item_value || 0), 0);
    
    const card = document.createElement('div');
    card.className = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition space-y-4';
    
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style="background-color: ${r.color || '#4f46e5'}15; border: 1px solid ${r.color || '#4f46e5'}40">
            ${r.avatar || '🏪'}
          </div>
          <div>
            <h3 class="text-sm font-extrabold text-slate-900">${r.name}</h3>
            <div class="flex items-center space-x-2 mt-0.5">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">${r.id}</span>
              <span class="text-xs text-slate-500 font-medium">${r.category || 'Retail Partner'}</span>
            </div>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
      </div>

      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
        <div class="flex justify-between"><span class="text-slate-400">Store Manager:</span><strong class="text-slate-800">${r.owner}</strong></div>
        <div class="flex justify-between"><span class="text-slate-400">Hub Location:</span><strong class="text-slate-800">${r.location}</strong></div>
        <div class="flex justify-between"><span class="text-slate-400">Direct Phone:</span><strong class="text-indigo-600 font-mono">${r.phone}</strong></div>
      </div>

      <div class="grid grid-cols-4 gap-2 text-center pt-1">
        <div class="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <div class="text-[10px] text-slate-400 uppercase font-semibold">Total</div>
          <div class="text-base font-extrabold text-slate-900 font-mono">${retailerOrders.length}</div>
        </div>
        <div class="bg-amber-50 p-2 rounded-xl border border-amber-200">
          <div class="text-[10px] text-amber-700 uppercase font-semibold">Queue</div>
          <div class="text-base font-extrabold text-amber-800 font-mono">${pendingOrders}</div>
        </div>
        <div class="bg-blue-50 p-2 rounded-xl border border-blue-200">
          <div class="text-[10px] text-blue-700 uppercase font-semibold">Transit</div>
          <div class="text-base font-extrabold text-blue-800 font-mono">${transitOrders}</div>
        </div>
        <div class="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
          <div class="text-[10px] text-emerald-700 uppercase font-semibold">Done</div>
          <div class="text-base font-extrabold text-emerald-800 font-mono">${deliveredOrders}</div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
        <span class="text-xs text-slate-500 font-medium">GMV: <b class="text-slate-900 font-mono">KES ${gmv.toLocaleString()}</b></span>
        <div class="flex items-center space-x-2">
          <a href="tel:${r.phone}" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center space-x-1">
            <i data-lucide="phone" class="w-3 h-3"></i>
            <span>Call</span>
          </a>
          <button onclick="filterByRetailer('${r.id}')" class="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition flex items-center space-x-1 shadow-sm">
            <i data-lucide="filter" class="w-3 h-3"></i>
            <span>Filter Orders</span>
          </button>
        </div>
      </div>
    `;
    
    el.retailersCardsGrid.appendChild(card);
  });
}

window.filterByRetailer = function(retailerId) {
  state.retailerFilter = retailerId;
  if (el.retailerFilterSelect) el.retailerFilterSelect.value = retailerId;
  switchTab('queue');
  renderOrdersTable();
  showToast('Filtered by Retailer', `Displaying orders for ${retailerId}`);
};

function renderFleetCards() {
  if (!el.fleetCardsGrid) return;
  el.fleetCardsGrid.innerHTML = '';
  
  state.riders.forEach(rider => {
    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-sm transition space-y-3';
    
    const isOnline = (rider.duty_status || 'ONLINE') === 'ONLINE';
    const isCharging = rider.duty_status === 'CHARGING';
    
    let dutyTag = '';
    if (isOnline) {
      dutyTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ONLINE</span>`;
    } else if (isCharging) {
      dutyTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">CHARGING</span>`;
    } else {
      dutyTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">OFFLINE</span>`;
    }
    
    // Battery Color
    const bat = rider.battery_level || 85;
    const batColor = bat > 70 ? 'bg-emerald-500' : (bat > 30 ? 'bg-amber-500' : 'bg-rose-500');
    const riderImg = rider.avatar || getRiderAvatarUrl(rider.id, rider.name);

    // Active deliveries assigned to this rider
    const riderActiveOrders = state.orders.filter(o => o.dispatcher_id === rider.id && ['In Transit', 'Assigned', 'Picked Up'].includes(o.status));

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <img src="${riderImg}" alt="${rider.name}" class="w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shadow-sm" onerror="this.src='/static/assets/riders/hesbon_otieno.jpg'">
          <div>
            <h4 class="font-bold text-slate-900 text-xs">${rider.name}</h4>
            <div class="text-[10px] font-mono text-slate-500">${rider.id} • ⭐ ${rider.rating || 4.9}</div>
          </div>
        </div>
        ${dutyTag}
      </div>

      <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
        <div class="flex justify-between">
          <span class="text-slate-400">Vehicle:</span>
          <strong class="text-slate-800">${rider.vehicle_type} (${rider.vehicle_reg || 'KME 102G'})</strong>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Assigned Zone:</span>
          <strong class="text-emerald-700">${rider.assigned_zone || 'Westlands'}</strong>
        </div>
        <div class="flex justify-between items-center pt-1 border-t border-slate-200">
          <span class="text-slate-400">Battery Level:</span>
          <div class="flex items-center space-x-2">
            <div class="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div class="${batColor} h-full rounded-full" style="width: ${bat}%"></div>
            </div>
            <span class="font-mono text-[10px] text-slate-800 font-bold">${bat}%</span>
          </div>
        </div>
      </div>

      <!-- Active drop notes -->
      ${riderActiveOrders.length > 0 ? `
        <div class="bg-indigo-50/60 p-2 rounded-xl border border-indigo-100 text-[10px] text-indigo-900 space-y-0.5">
          <span class="font-bold uppercase tracking-wider text-indigo-700">Active Drops (${riderActiveOrders.length}):</span>
          ${riderActiveOrders.map(o => `
            <div class="truncate">• <b>${o.order_number}</b> (${o.retailer_id}) → ${o.customer_name}</div>
          `).join('')}
        </div>
      ` : `
        <div class="text-[10px] text-slate-400 italic px-1">No deliveries currently in transit</div>
      `}

      <div class="flex items-center justify-between pt-1 border-t border-slate-100">
        <div class="text-[11px] text-slate-500">
          Completed: <b class="text-slate-800 font-mono">${rider.completed_deliveries || 0} drops</b>
        </div>
        <div class="flex items-center space-x-1.5">
          <button onclick="toggleRiderDuty('${rider.id}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg transition" title="Toggle Duty Status">
            <i data-lucide="power" class="w-3 h-3 inline mr-0.5 text-indigo-600"></i> Duty
          </button>
          <a href="tel:${rider.phone}" class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-lg border border-emerald-200 transition">
            <i data-lucide="phone" class="w-3 h-3 inline mr-0.5"></i> Call
          </a>
        </div>
      </div>
    `;
    
    el.fleetCardsGrid.appendChild(card);
  });
}

function renderEvents() {
  if (!el.liveEventsList) return;
  el.liveEventsList.innerHTML = '';
  
  state.events.slice(0, 20).forEach(evt => {
    const item = document.createElement('div');
    item.className = 'p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-2.5 text-xs';
    
    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
    if (evt.badge === 'NEW') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (evt.badge === 'ASSIGNED') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
    if (evt.badge === 'PROGRESS' || evt.badge === 'STATUS') badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (evt.badge === 'AUTO') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    if (evt.badge === 'DELIVERED') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (evt.badge === 'CANCEL') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    if (evt.badge === 'ALERT') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
    
    const timeFormatted = new Date(evt.timestamp).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    
    item.innerHTML = `
      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono border ${badgeColor}">
        ${evt.badge || 'INFO'}
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-slate-800 text-[11px] font-medium leading-tight">${evt.message}</p>
        <span class="text-[10px] text-slate-400 font-mono mt-0.5 block">${timeFormatted}</span>
      </div>
    `;
    
    el.liveEventsList.appendChild(item);
  });
}

function renderLiveTicker() {
  if (el.liveActionsCount) {
    el.liveActionsCount.textContent = `${state.events.length} Events Logged`;
  }
  if (el.liveActionTickerText) {
    const latest = state.events[0];
    if (latest) {
      const timeStr = new Date(latest.timestamp || Date.now()).toLocaleTimeString('en-GB');
      el.liveActionTickerText.innerHTML = `<span class="text-indigo-600 font-extrabold">[${latest.badge || 'LIVE'}]</span> <span class="font-medium text-slate-900">${latest.message}</span> <span class="text-slate-400 text-[10px] font-mono">(${timeStr})</span>`;
    } else {
      el.liveActionTickerText.textContent = 'Listening for operations across retailers, dispatchers, and fleet riders...';
    }
  }
}

function renderNotificationSelect() {
  if (!el.notifyOrderSelect) return;
  el.notifyOrderSelect.innerHTML = '';
  
  state.orders.slice(0, 15).forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.order_number;
    opt.textContent = `${o.order_number} - ${o.customer_name} (${o.retailer_id || 'RET'}) - ${o.status}`;
    el.notifyOrderSelect.appendChild(opt);
  });
  
  updateNotificationPreview();
}

function updateNotificationPreview() {
  if (!el.notifyOrderSelect || !el.smsPreviewText) return;
  const ordNum = el.notifyOrderSelect.value;
  const order = state.orders.find(o => o.order_number === ordNum);
  if (!order) {
    el.smsPreviewText.textContent = "Select an active order to preview customer tracking message.";
    return;
  }
  
  el.smsPreviewText.textContent = 
    `"Reflex Delivery Update: Your order ${order.order_number} is ${order.status}! ` +
    `Rider: ${order.dispatcher_name || 'Pending assignment'} (${order.driver_phone || 'N/A'}). ` +
    `Track: https://reflex.co.ke/track?ord=${order.order_number}. PIN: ${order.verification_code || '1234'}"`;
}

function renderFinancials() {
  const delivered = state.orders.filter(o => o.status === 'Delivered');
  const totalVal = delivered.reduce((sum, o) => sum + (o.item_value || 2500), 0);
  const totalFees = delivered.reduce((sum, o) => sum + (o.delivery_fee || 300), 0);
  
  const retCom = Math.round(totalVal * 0.05);
  const riderPay = Math.round(totalFees * 0.80);
  const platRev = Math.round((totalVal * 0.05) + (totalFees * 0.20));
  
  if (el.finRetailerCom) el.finRetailerCom.textContent = `KES ${retCom.toLocaleString()}`;
  if (el.finRiderPayout) el.finRiderPayout.textContent = `KES ${riderPay.toLocaleString()}`;
  if (el.finPlatformRev) el.finPlatformRev.textContent = `KES ${platRev.toLocaleString()}`;
}

// ----------------- ACTIONS & HANDLERS -----------------

// Auto-Dispatch All Pending
async function handleAutoDispatchAll() {
  if (state.isAutoDispatching) return;
  state.isAutoDispatching = true;
  
  el.btnAutoDispatchAll.disabled = true;
  el.btnAutoDispatchAll.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Matching...</span>`;
  if (window.lucide) lucide.createIcons();
  
  try {
    const res = await fetch('/api/dispatch/auto-assign-all', { method: 'POST' });
    const data = await res.json();
    
    recordAction('AUTO', `Auto-dispatch engine matched ${data.assigned_orders ? data.assigned_orders.length : 'all'} pending orders to active fleet.`, 'AUTO_DISPATCH');
    showToast('Auto-Dispatch Complete', data.message || 'All pending orders successfully assigned!');
    await fetchAllData();
  } catch (err) {
    showToast('Auto-Dispatch Error', 'Failed to auto-match orders', true);
  } finally {
    state.isAutoDispatching = false;
    el.btnAutoDispatchAll.disabled = false;
    el.btnAutoDispatchAll.innerHTML = `<i data-lucide="zap" class="w-4 h-4"></i><span>Auto-Assign All</span>`;
    if (window.lucide) lucide.createIcons();
  }
}

// Manual Assignment Modal
window.openAssignModal = function(orderNumber) {
  state.selectedOrderForAssign = orderNumber;
  const order = state.orders.find(o => o.order_number === orderNumber);
  if (!order) return;
  
  el.modalAssignOrderNum.textContent = order.order_number;
  el.modalAssignOrderDest.textContent = `Destination: ${order.delivery_address}`;
  el.assignRiderList.innerHTML = '';
  
  state.riders.forEach(rider => {
    const div = document.createElement('div');
    div.className = 'p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-500 transition flex items-center justify-between cursor-pointer group';
    
    div.onclick = () => assignRiderToOrder(order.order_number, rider.id);
    
    const modalRiderImg = rider.avatar || getRiderAvatarUrl(rider.id, rider.name);
    div.innerHTML = `
      <div class="flex items-center space-x-3">
        <img src="${modalRiderImg}" alt="${rider.name}" class="w-10 h-10 rounded-xl object-cover border border-emerald-500/40" onerror="this.src='/static/assets/riders/hesbon_otieno.jpg'">
        <div>
          <h5 class="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">${rider.name}</h5>
          <div class="text-[10px] text-slate-500">${rider.vehicle_type} • 🔋 ${rider.battery_level || 85}%</div>
        </div>
      </div>
      <div class="text-right">
        <span class="px-2.5 py-1 bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white font-bold rounded-lg text-xs transition border border-indigo-200">
          Assign
        </span>
        <div class="text-[10px] text-slate-500 mt-1">${rider.active_orders_count || 0} active drops</div>
      </div>
    `;
    
    el.assignRiderList.appendChild(div);
  });
  
  el.modalAssignRider.classList.remove('hidden');
};

async function assignRiderToOrder(orderNumber, riderId) {
  const rider = state.riders.find(r => r.id === riderId);
  const riderName = rider ? rider.name : 'Hesbon Otieno';
  const riderPhone = rider ? rider.phone : '+254 712 345 678';
  const vehicleType = rider ? rider.vehicle_type : 'Electric Motorbike (Roam Air)';
  const vehicleReg = rider && rider.vehicle ? rider.vehicle.plateNumber : (rider ? rider.vehicle_reg : 'KME 102G');

  // 1. Immediately update local store
  const local = getLocalOrders();
  const target = local.find(o => o.order_number === orderNumber);
  if (target) {
    target.dispatcher_id = riderId;
    target.dispatcher_name = riderName;
    target.driver_phone = riderPhone;
    target.vehicle_type = vehicleType;
    target.vehicle_reg = vehicleReg;
    target.status = 'In Transit';
    target.dispatched_at = new Date().toISOString();
    target.eta_minutes = target.eta_minutes || 20;
    saveLocalOrders(local);
  }

  // Also update in-memory state
  const memOrder = state.orders.find(o => o.order_number === orderNumber);
  if (memOrder) {
    memOrder.dispatcher_id = riderId;
    memOrder.dispatcher_name = riderName;
    memOrder.driver_phone = riderPhone;
    memOrder.vehicle_type = vehicleType;
    memOrder.vehicle_reg = vehicleReg;
    memOrder.status = 'In Transit';
    memOrder.dispatched_at = new Date().toISOString();
  }

  recordAction('ASSIGNED', `Order ${orderNumber} assigned to rider ${riderName} (${vehicleReg}).`, 'DISPATCH_ASSIGN');
  showToast('Rider Assigned', `Order ${orderNumber} assigned to ${riderName}`);
  el.modalAssignRider.classList.add('hidden');
  renderUI();

  // 2. Sync to server
  try {
    await fetch(`/api/orders/${orderNumber}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rider_id: riderId })
    });
    await fetchAllData();
  } catch (err) {
    console.warn('Server assign sync queued, preserved locally:', err);
  }
}

// Progress Order Lifecycle
window.advanceOrderStatus = async function(orderNumber) {
  const local = getLocalOrders();
  const target = local.find(o => o.order_number === orderNumber);
  let nextStatus = 'In Transit';
  if (target) {
    if (target.status === 'Pending') nextStatus = 'In Transit';
    else if (target.status === 'In Transit' || target.status === 'Assigned') nextStatus = 'Delivered';
    target.status = nextStatus;
    if (nextStatus === 'Delivered') target.delivered_at = new Date().toISOString();
    saveLocalOrders(local);
  }
  
  const memOrder = state.orders.find(o => o.order_number === orderNumber);
  if (memOrder) {
    memOrder.status = nextStatus;
    if (nextStatus === 'Delivered') memOrder.delivered_at = new Date().toISOString();
  }

  recordAction('PROGRESS', `Order ${orderNumber} advanced to ${nextStatus}.`, 'STATUS_ADVANCE');
  renderUI();

  try {
    const res = await fetch(`/api/orders/${orderNumber}/advance`, { method: 'POST' });
    const data = await res.json();
    showToast('Status Updated', data.message || `Order ${orderNumber} progressed.`);
    await fetchAllData();
  } catch (e) {
    showToast('Status Updated', `Order ${orderNumber} progressed locally.`);
  }
};

// Cancel Order
window.cancelOrder = async function(orderNumber) {
  if (!confirm(`Are you sure you want to cancel order ${orderNumber}?`)) return;
  
  const local = getLocalOrders();
  const target = local.find(o => o.order_number === orderNumber);
  if (target) {
    target.status = 'Cancelled';
    saveLocalOrders(local);
  }
  
  recordAction('CANCEL', `Order ${orderNumber} cancelled by dispatcher.`, 'ORDER_CANCELLED');
  
  try {
    const res = await fetch(`/api/orders/${orderNumber}`, { method: 'DELETE' });
    const data = await res.json();
    showToast('Order Cancelled', data.message || `Order ${orderNumber} marked as cancelled.`);
    await fetchAllData();
  } catch (e) {
    showToast('Order Cancelled', `Order ${orderNumber} cancelled locally.`);
    await fetchAllData();
  }
};

// Waybill & QR Code Modal
window.openWaybillModal = function(orderNumber) {
  const order = state.orders.find(o => o.order_number === orderNumber);
  if (!order) return;
  
  el.waybillOrderNum.textContent = order.order_number;
  el.waybillPinCode.textContent = order.verification_code || '4892';
  el.waybillCustomer.textContent = order.customer_name;
  el.waybillAddress.textContent = order.delivery_address;
  el.waybillItem.textContent = order.item_description;
  el.waybillRider.textContent = order.dispatcher_name || 'Pending assignment';
  el.waybillCod.textContent = `KES ${(order.cod_amount || 2800).toLocaleString()} (COD)`;
  
  // Render QR Code
  el.qrcodeContainer.innerHTML = '';
  if (window.QRCode) {
    new QRCode(el.qrcodeContainer, {
      text: `REFLEX_ORDER:${order.order_number}|PIN:${order.verification_code || '4892'}`,
      width: 140,
      height: 140,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }
  
  el.modalWaybill.classList.remove('hidden');
};

// Toggle Rider Duty
window.toggleRiderDuty = async function(riderId) {
  const rider = state.riders.find(r => r.id === riderId);
  if (!rider) return;
  
  const current = rider.duty_status || 'ONLINE';
  const nextStatus = current === 'ONLINE' ? 'CHARGING' : (current === 'CHARGING' ? 'OFFLINE' : 'ONLINE');
  
  recordAction('DUTY', `Rider ${rider.name} status toggled to ${nextStatus}.`, 'RIDER_DUTY');
  
  try {
    const res = await fetch(`/api/riders/${riderId}/duty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duty_status: nextStatus })
    });
    const data = await res.json();
    showToast('Duty Status Updated', `${rider.name} is now ${nextStatus}`);
    await fetchAllData();
  } catch (e) {
    showToast('Error', 'Failed to update rider duty', true);
  }
};

// Tab Switching
function switchTab(tabId) {
  state.activeTab = tabId;
  const tabs = ['queue', 'retailers', 'fleet', 'radar', 'verify', 'financials'];
  
  tabs.forEach(t => {
    const btn = el[`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`];
    const view = el[`view${t.charAt(0).toUpperCase() + t.slice(1)}`];
    
    if (btn && view) {
      if (t === tabId) {
        btn.className = 'tab-btn active px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 transition flex items-center space-x-2 shadow-sm';
        view.classList.remove('hidden');
      } else {
        btn.className = 'tab-btn px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center space-x-2';
        view.classList.add('hidden');
      }
    }
  });
  
  if (window.lucide) lucide.createIcons();
}

// ----------------- EVENT LISTENERS SETUP -----------------
function initEventListeners() {
  // Tab buttons
  if (el.tabBtnQueue) el.tabBtnQueue.onclick = () => switchTab('queue');
  if (el.tabBtnRetailers) el.tabBtnRetailers.onclick = () => switchTab('retailers');
  if (el.tabBtnFleet) el.tabBtnFleet.onclick = () => switchTab('fleet');
  if (el.tabBtnRadar) el.tabBtnRadar.onclick = () => switchTab('radar');
  if (el.tabBtnVerify) el.tabBtnVerify.onclick = () => switchTab('verify');
  if (el.tabBtnFinancials) el.tabBtnFinancials.onclick = () => switchTab('financials');
  if (el.btnViewEventsTab) el.btnViewEventsTab.onclick = () => switchTab('radar');
  
  // Status filter chips
  document.querySelectorAll('.status-chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll('.status-chip').forEach(c => {
        c.className = 'status-chip px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition';
      });
      chip.className = 'status-chip active px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm';
      
      state.statusFilter = chip.dataset.status;
      renderOrdersTable();
      if (window.lucide) lucide.createIcons();
    };
  });

  // Retailer filter select
  if (el.retailerFilterSelect) {
    el.retailerFilterSelect.onchange = (e) => {
      state.retailerFilter = e.target.value;
      renderOrdersTable();
      if (window.lucide) lucide.createIcons();
    };
  }

  // Rider filter select
  if (el.riderFilterSelect) {
    el.riderFilterSelect.onchange = (e) => {
      state.riderFilter = e.target.value;
      renderOrdersTable();
      if (window.lucide) lucide.createIcons();
    };
  }
  
  // Search input
  if (el.globalFilterInput) {
    el.globalFilterInput.oninput = (e) => {
      state.searchQuery = e.target.value;
      renderOrdersTable();
    };
  }
  
  // Auto-dispatch
  if (el.btnAutoDispatchAll) el.btnAutoDispatchAll.onclick = handleAutoDispatchAll;
  
  // Manual refresh
  if (el.btnManualRefresh) {
    el.btnManualRefresh.onclick = async () => {
      if (el.refreshIcon) el.refreshIcon.classList.add('animate-spin');
      await fetchAllData();
      setTimeout(() => { if (el.refreshIcon) el.refreshIcon.classList.remove('animate-spin'); }, 600);
      showToast('Refreshed', 'Live dispatch state synced.');
    };
  }
  
  // Modal closes
  if (el.btnCloseAssignModal) el.btnCloseAssignModal.onclick = () => el.modalAssignRider.classList.add('hidden');
  if (el.btnCloseWaybillModal) el.btnCloseWaybillModal.onclick = () => el.modalWaybill.classList.add('hidden');
  
  // Clear events button
  const btnClearEvents = document.getElementById('btnClearEvents');
  if (btnClearEvents) {
    btnClearEvents.onclick = async () => {
      saveLocalEvents([]);
      fetch('/api/events/clear', { method: 'POST' }).catch(() => {});
      state.events = [];
      renderEvents();
      renderLiveTicker();
      showToast('Events Cleared', 'Audit feed history reset.');
    };
  }

  // Notification form
  if (el.notifyOrderSelect) el.notifyOrderSelect.onchange = updateNotificationPreview;
  if (el.smsNotifyForm) {
    el.smsNotifyForm.onsubmit = async (e) => {
      e.preventDefault();
      const ordNum = el.notifyOrderSelect.value;
      const channel = document.querySelector('input[name="notifyChannel"]:checked').value;
      const order = state.orders.find(o => o.order_number === ordNum);
      
      try {
        const res = await fetch('/api/notifications/send-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_number: ordNum, channel })
        });
        const data = await res.json();
        recordAction('ALERT', `Tracking alert sent via ${channel} to ${order ? order.customer_name : 'Customer'} for ${ordNum}.`, 'NOTIFICATION');
        showToast('Notification Sent', `Tracking link pushed to customer via ${channel}!`);
        await fetchAllData();
      } catch (err) {
        showToast('Error', 'Failed to dispatch notification', true);
      }
    };
  }
  
  // Verification Form
  if (el.verifyForm) {
    el.verifyForm.onsubmit = async (e) => {
      e.preventDefault();
      const orderNumber = el.verifyOrderInput.value.trim();
      const pin = el.verifyPinInput.value.trim();
      
      try {
        const res = await fetch(`/api/orders/${orderNumber}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Delivered', verification_code: pin })
        });
        const data = await res.json();
        
        if (res.ok) {
          el.verifyResultBanner.className = 'p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs block space-y-1';
          el.verifyResultBanner.innerHTML = `
            <strong class="font-bold text-slate-900 flex items-center"><i data-lucide="check-circle" class="w-4 h-4 mr-1.5 text-emerald-600"></i> Delivery Verified & Handover Complete!</strong>
            <p>Order <b>${orderNumber}</b> marked Delivered. Cash on Delivery payment confirmed.</p>
          `;
          recordAction('DELIVERED', `Order ${orderNumber} verified via customer PIN ${pin} and marked Delivered.`, 'DELIVERY_VERIFIED');
          showToast('Verified', `Order ${orderNumber} marked Delivered!`);
          await fetchAllData();
        } else {
          el.verifyResultBanner.className = 'p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-xs block';
          el.verifyResultBanner.textContent = data.error || 'Failed to verify order.';
        }
      } catch (err) {
        showToast('Error', 'Failed to submit verification', true);
      }
      if (window.lucide) lucide.createIcons();
    };
  }
  
  // Simulate QR Scan
  if (el.btnSimulateQrScan) {
    el.btnSimulateQrScan.onclick = () => {
      const pendingTransit = state.orders.find(o => o.status === 'In Transit') || state.orders[0];
      if (pendingTransit) {
        el.verifyOrderInput.value = pendingTransit.order_number;
        el.verifyPinInput.value = pendingTransit.verification_code || '8492';
        showToast('QR Code Scanned', `Scanned ${pendingTransit.order_number}`);
      }
    };
  }
}

// ----------------- INITIALIZATION & POLLING -----------------
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  fetchAllData();
  
  // Real-time synchronization across browser tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === EVENTS_STORAGE_KEY) {
      fetchAllData();
    }
  });

  window.addEventListener('dispatchhub_order_update', () => {
    fetchAllData();
  });

  window.addEventListener('dispatchhub_event_update', () => {
    fetchAllData();
  });

  // Real-time polling loop every 3 seconds for zero-delay synchronization
  setInterval(fetchAllData, 3000);
});
