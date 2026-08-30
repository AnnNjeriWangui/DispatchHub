/**
 * Reflex Dispatcher Command Center - Frontend Logic
 * Live Telematics, Automated Queue Orchestration & Verification
 */

// Application State
const state = {
  orders: [],
  riders: [],
  metrics: {},
  events: [],
  activeTab: 'queue',
  statusFilter: 'ALL',
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
  
  // Tabs & Views
  tabBtnQueue: document.getElementById('tabBtnQueue'),
  tabBtnFleet: document.getElementById('tabBtnFleet'),
  tabBtnRadar: document.getElementById('tabBtnRadar'),
  tabBtnVerify: document.getElementById('tabBtnVerify'),
  tabBtnFinancials: document.getElementById('tabBtnFinancials'),
  viewQueue: document.getElementById('viewQueue'),
  viewFleet: document.getElementById('viewFleet'),
  viewRadar: document.getElementById('viewRadar'),
  viewVerify: document.getElementById('viewVerify'),
  viewFinancials: document.getElementById('viewFinancials'),
  
  // Table & Lists
  ordersTableBody: document.getElementById('ordersTableBody'),
  queueEmptyState: document.getElementById('queueEmptyState'),
  fleetCardsGrid: document.getElementById('fleetCardsGrid'),
  liveEventsList: document.getElementById('liveEventsList'),
  globalFilterInput: document.getElementById('globalFilterInput'),
  
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
  el.toastTitle.textContent = title;
  el.toastBody.textContent = message;
  
  el.toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  el.toast.classList.add('translate-y-0', 'opacity-100');
  
  setTimeout(() => {
    el.toast.classList.remove('translate-y-0', 'opacity-100');
    el.toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 3500);
}

// ----------------- DATA FETCHING -----------------
async function fetchAllData() {
  try {
    const [ordersRes, ridersRes, metricsRes, eventsRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/riders'),
      fetch('/api/metrics'),
      fetch('/api/events/live')
    ]);
    
    if (ordersRes.ok) state.orders = await ordersRes.json();
    if (ridersRes.ok) state.riders = await ridersRes.json();
    if (metricsRes.ok) state.metrics = await metricsRes.json();
    if (eventsRes.ok) state.events = await eventsRes.json();
    
    renderUI();
  } catch (err) {
    console.error('Failed to sync dispatcher data:', err);
  }
}

// ----------------- UI RENDERING -----------------
function renderUI() {
  renderMetrics();
  renderOrdersTable();
  renderFleetCards();
  renderEvents();
  renderNotificationSelect();
  renderFinancials();
  
  // Update live clock
  const now = new Date();
  el.liveSyncClock.textContent = `Sync: ${now.toLocaleTimeString('en-GB')}`;
  
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
  
  el.statPendingCount.textContent = pending.length;
  el.statUrgentCount.textContent = urgentCount;
  el.statTransitCount.textContent = transit.length;
  el.statDeliveredCount.textContent = delivered.length;
  el.statTotalLogged.textContent = state.orders.length;
  el.statOnlineRiders.textContent = `${onlineRiders.length}/${state.riders.length}`;
  el.statCodVolume.textContent = `KES ${codTotal.toLocaleString()}`;
  el.tabCountQueue.textContent = pending.length;
  
  el.filterCountAll.textContent = state.orders.length;
  el.filterCountPending.textContent = pending.length;
  el.filterCountTransit.textContent = transit.length;
  el.filterCountDelivered.textContent = delivered.length;
}

function getFilteredOrders() {
  let filtered = [...state.orders];
  
  // Status tab filter
  if (state.statusFilter !== 'ALL') {
    filtered = filtered.filter(o => o.status === state.statusFilter);
  }
  
  // Query search
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(o => 
      (o.order_number && o.order_number.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.delivery_address && o.delivery_address.toLowerCase().includes(q)) ||
      (o.dispatcher_name && o.dispatcher_name.toLowerCase().includes(q)) ||
      (o.item_description && o.item_description.toLowerCase().includes(q)) ||
      (o.verification_code && o.verification_code.includes(q))
    );
  }
  
  return filtered;
}

function renderOrdersTable() {
  const filtered = getFilteredOrders();
  el.ordersTableBody.innerHTML = '';
  
  if (filtered.length === 0) {
    el.queueEmptyState.classList.remove('hidden');
    return;
  }
  
  el.queueEmptyState.classList.add('hidden');
  
  filtered.forEach(order => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-900/60 transition group border-b border-slate-800/60';
    
    // Status Badge Styling
    let statusBadge = '';
    if (order.status === 'Pending') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>Pending Dispatch</span>`;
    } else if (order.status === 'In Transit' || order.status === 'Assigned' || order.status === 'Picked Up') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-ping"></span>${order.status}</span>`;
    } else if (order.status === 'Delivered') {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><i data-lucide="check-circle" class="w-3 h-3 mr-1"></i>Delivered</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">${order.status}</span>`;
    }
    
    // Priority badge
    const isUrgent = order.priority === 'Urgent';
    const priorityTag = isUrgent 
      ? `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-500 text-slate-950 uppercase">URGENT</span>` 
      : '';
      
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

    // Dispatcher / Rider display
    const hasRider = order.dispatcher_id && order.dispatcher_name && order.dispatcher_name !== 'Auto-Assigning...';
    const riderAvatar = getRiderAvatarUrl(order.dispatcher_id, order.dispatcher_name);
    const riderDisplay = hasRider ? `
      <div class="flex items-center space-x-2.5">
        <img src="${riderAvatar}" alt="${order.dispatcher_name}" class="w-8 h-8 rounded-lg object-cover border border-emerald-500/40 shadow-sm flex-shrink-0" onerror="this.src='/static/assets/riders/hesbon_otieno.jpg'">
        <div>
          <div class="font-bold text-white text-xs">${order.dispatcher_name}</div>
          <div class="text-[10px] text-slate-400 font-mono">${order.driver_phone || '+254 7XX XXX'}</div>
        </div>
      </div>
    ` : `
      <span class="inline-flex items-center text-xs text-amber-400/80 font-mono italic">
        <i data-lucide="alert-circle" class="w-3.5 h-3.5 mr-1"></i> Unassigned
      </span>
    `;

    tr.innerHTML = `
      <td class="py-3.5 px-4">
        <div class="flex items-center space-x-2">
          <span class="font-mono font-bold text-white text-xs tracking-tight">${order.order_number}</span>
          ${priorityTag}
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
          <span class="px-1.5 py-0.2 bg-slate-800 rounded text-[10px] font-mono text-emerald-400">${order.retailer_id || 'RET-001'}</span>
          <span>• ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </td>
      
      <td class="py-3.5 px-4 max-w-xs">
        <div class="font-bold text-slate-200">${order.customer_name}</div>
        <div class="text-[11px] text-slate-400 truncate" title="${order.delivery_address}"><i data-lucide="map-pin" class="w-3 h-3 inline text-slate-500"></i> ${order.delivery_address}</div>
      </td>

      <td class="py-3.5 px-4 max-w-xs">
        <div class="text-slate-300 font-medium truncate">${order.item_description}</div>
        <div class="text-[10px] text-amber-300/80 italic truncate">${order.special_instructions || 'Standard delivery care'}</div>
      </td>

      <td class="py-3.5 px-4 whitespace-nowrap">
        ${statusBadge}
        ${order.eta_minutes ? `<div class="text-[10px] text-slate-400 mt-1 font-mono">ETA: ~${order.eta_minutes} mins</div>` : ''}
      </td>

      <td class="py-3.5 px-4 whitespace-nowrap">
        ${riderDisplay}
      </td>

      <td class="py-3.5 px-4 text-right whitespace-nowrap">
        <div class="flex items-center justify-end space-x-1.5">
          ${order.status === 'Pending' ? `
            <button onclick="openAssignModal('${order.order_number}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition shadow-sm flex items-center space-x-1">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span>Assign</span>
            </button>
          ` : `
            <button onclick="openAssignModal('${order.order_number}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition" title="Reassign Rider">
              <i data-lucide="repeat" class="w-3.5 h-3.5"></i>
            </button>
          `}

          <button onclick="advanceOrderStatus('${order.order_number}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs transition" title="Progress Status (Picked Up / Delivered)">
            <i data-lucide="fast-forward" class="w-3.5 h-3.5"></i>
          </button>

          <button onclick="openWaybillModal('${order.order_number}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-lg text-xs transition" title="View Waybill & QR Code">
            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
          </button>

          <button onclick="cancelOrder('${order.order_number}')" class="px-2 py-1 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg text-xs transition" title="Cancel Delivery">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    `;
    
    el.ordersTableBody.appendChild(tr);
  });
}

function renderFleetCards() {
  el.fleetCardsGrid.innerHTML = '';
  
  state.riders.forEach(rider => {
    const card = document.createElement('div');
    card.className = 'glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-3';
    
    const isOnline = (rider.duty_status || 'ONLINE') === 'ONLINE';
    const isCharging = rider.duty_status === 'CHARGING';
    
    let dutyTag = '';
    if (isOnline) {
      dutyTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ONLINE</span>`;
    } else if (isCharging) {
      dutyTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">CHARGING</span>`;
    } else {
      dutyTag = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">OFFLINE</span>`;
    }
    
    // Battery Color
    const bat = rider.battery_level || 85;
    const batColor = bat > 70 ? 'bg-emerald-500' : (bat > 30 ? 'bg-amber-500' : 'bg-rose-500');

    const riderImg = rider.avatar || getRiderAvatarUrl(rider.id, rider.name);
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <img src="${riderImg}" alt="${rider.name}" class="w-11 h-11 rounded-xl object-cover border border-emerald-500/40 shadow-sm" onerror="this.src='/static/assets/riders/hesbon_otieno.jpg'">
          <div>
            <h4 class="font-bold text-white text-xs">${rider.name}</h4>
            <div class="text-[10px] font-mono text-slate-400">${rider.id} • ⭐ ${rider.rating || 4.9}</div>
          </div>
        </div>
        ${dutyTag}
      </div>

      <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5 text-[11px]">
        <div class="flex justify-between">
          <span class="text-slate-400">Vehicle:</span>
          <strong class="text-slate-200">${rider.vehicle_type} (${rider.vehicle_reg || 'KME 102G'})</strong>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Assigned Zone:</span>
          <strong class="text-emerald-400">${rider.assigned_zone || 'Westlands'}</strong>
        </div>
        <div class="flex justify-between items-center pt-1 border-t border-slate-800">
          <span class="text-slate-400">Battery Level:</span>
          <div class="flex items-center space-x-2">
            <div class="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="${batColor} h-full rounded-full" style="width: ${bat}%"></div>
            </div>
            <span class="font-mono text-[10px] text-white font-bold">${bat}%</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-1">
        <div class="text-[11px] text-slate-400">
          Active Load: <b class="text-white font-mono">${rider.active_orders_count || 0} drops</b>
        </div>
        <div class="flex items-center space-x-1.5">
          <button onclick="toggleRiderDuty('${rider.id}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded-lg transition" title="Toggle Duty Status">
            <i data-lucide="power" class="w-3 h-3 inline mr-0.5 text-cyan-400"></i> Duty
          </button>
          <a href="tel:${rider.phone}" class="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-semibold rounded-lg transition">
            <i data-lucide="phone" class="w-3 h-3 inline mr-0.5"></i> Call
          </a>
        </div>
      </div>
    `;
    
    el.fleetCardsGrid.appendChild(card);
  });
}

function renderEvents() {
  el.liveEventsList.innerHTML = '';
  
  state.events.slice(0, 12).forEach(evt => {
    const item = document.createElement('div');
    item.className = 'p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/90 flex items-start space-x-2.5 text-xs';
    
    let badgeColor = 'bg-slate-800 text-slate-300';
    if (evt.badge === 'NEW') badgeColor = 'bg-emerald-500/20 text-emerald-400';
    if (evt.badge === 'ASSIGNED') badgeColor = 'bg-cyan-500/20 text-cyan-400';
    if (evt.badge === 'AUTO') badgeColor = 'bg-amber-500/20 text-amber-400';
    if (evt.badge === 'CANCEL') badgeColor = 'bg-rose-500/20 text-rose-400';
    
    const timeFormatted = new Date(evt.timestamp).toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    
    item.innerHTML = `
      <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${badgeColor}">
        ${evt.badge || 'INFO'}
      </span>
      <div class="flex-1 min-w-0">
        <p class="text-slate-200 text-[11px] leading-tight">${evt.message}</p>
        <span class="text-[10px] text-slate-500 font-mono mt-0.5 block">${timeFormatted}</span>
      </div>
    `;
    
    el.liveEventsList.appendChild(item);
  });
}

function renderNotificationSelect() {
  el.notifyOrderSelect.innerHTML = '';
  
  state.orders.slice(0, 15).forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.order_number;
    opt.textContent = `${o.order_number} - ${o.customer_name} (${o.status})`;
    el.notifyOrderSelect.appendChild(opt);
  });
  
  updateNotificationPreview();
}

function updateNotificationPreview() {
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
  
  el.finRetailerCom.textContent = `KES ${retCom.toLocaleString()}`;
  el.finRiderPayout.textContent = `KES ${riderPay.toLocaleString()}`;
  el.finPlatformRev.textContent = `KES ${platRev.toLocaleString()}`;
}

// ----------------- ACTIONS & HANDLERS -----------------

// Auto-Dispatch All Pending
async function handleAutoDispatchAll() {
  if (state.isAutoDispatching) return;
  state.isAutoDispatching = true;
  
  el.btnAutoDispatchAll.disabled = true;
  el.btnAutoDispatchAll.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Matching...</span>`;
  lucide.createIcons();
  
  try {
    const res = await fetch('/api/dispatch/auto-assign-all', { method: 'POST' });
    const data = await res.json();
    
    showToast('Auto-Dispatch Complete', data.message || 'All pending orders successfully assigned!');
    await fetchAllData();
  } catch (err) {
    showToast('Auto-Dispatch Error', 'Failed to auto-match orders', true);
  } finally {
    state.isAutoDispatching = false;
    el.btnAutoDispatchAll.disabled = false;
    el.btnAutoDispatchAll.innerHTML = `<i data-lucide="zap" class="w-4 h-4"></i><span>Auto-Assign All</span>`;
    lucide.createIcons();
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
    div.className = 'p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-500 transition flex items-center justify-between cursor-pointer group';
    
    div.onclick = () => assignRiderToOrder(order.order_number, rider.id);
    
    const modalRiderImg = rider.avatar || getRiderAvatarUrl(rider.id, rider.name);
    div.innerHTML = `
      <div class="flex items-center space-x-3">
        <img src="${modalRiderImg}" alt="${rider.name}" class="w-10 h-10 rounded-xl object-cover border border-emerald-500/40" onerror="this.src='/static/assets/riders/hesbon_otieno.jpg'">
        <div>
          <h5 class="text-xs font-bold text-white group-hover:text-emerald-400 transition">${rider.name}</h5>
          <div class="text-[10px] text-slate-400">${rider.vehicle_type} • 🔋 ${rider.battery_level || 85}%</div>
        </div>
      </div>
      <div class="text-right">
        <span class="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-slate-950 font-bold rounded-lg text-xs transition">
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
  try {
    const res = await fetch(`/api/orders/${orderNumber}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rider_id: riderId })
    });
    
    const data = await res.json();
    if (res.ok) {
      showToast('Rider Assigned', `Order ${orderNumber} assigned to ${data.rider.name}`);
      el.modalAssignRider.classList.add('hidden');
      await fetchAllData();
    } else {
      showToast('Assignment Error', data.error || 'Failed to assign rider', true);
    }
  } catch (err) {
    showToast('Error', 'Network error assigning rider', true);
  }
}

// Progress Order Lifecycle
window.advanceOrderStatus = async function(orderNumber) {
  try {
    const res = await fetch(`/api/orders/${orderNumber}/advance`, { method: 'POST' });
    const data = await res.json();
    showToast('Status Updated', data.message || `Order ${orderNumber} progressed.`);
    await fetchAllData();
  } catch (e) {
    showToast('Error', 'Failed to advance status', true);
  }
};

// Cancel Order
window.cancelOrder = async function(orderNumber) {
  if (!confirm(`Are you sure you want to cancel order ${orderNumber}?`)) return;
  try {
    const res = await fetch(`/api/orders/${orderNumber}`, { method: 'DELETE' });
    const data = await res.json();
    showToast('Order Cancelled', data.message || `Order ${orderNumber} marked as cancelled.`);
    await fetchAllData();
  } catch (e) {
    showToast('Error', 'Failed to cancel order', true);
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
      colorDark: "#090d16",
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
  const tabs = ['queue', 'fleet', 'radar', 'verify', 'financials'];
  
  tabs.forEach(t => {
    const btn = el[`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`];
    const view = el[`view${t.charAt(0).toUpperCase() + t.slice(1)}`];
    
    if (t === tabId) {
      btn.classList.add('active', 'bg-slate-800', 'text-white');
      btn.classList.remove('text-slate-400');
      view.classList.remove('hidden');
    } else {
      btn.classList.remove('active', 'bg-slate-800', 'text-white');
      btn.classList.add('text-slate-400');
      view.classList.add('hidden');
    }
  });
  
  if (window.lucide) lucide.createIcons();
}

// ----------------- EVENT LISTENERS SETUP -----------------
function initEventListeners() {
  // Tab buttons
  el.tabBtnQueue.onclick = () => switchTab('queue');
  el.tabBtnFleet.onclick = () => switchTab('fleet');
  el.tabBtnRadar.onclick = () => switchTab('radar');
  el.tabBtnVerify.onclick = () => switchTab('verify');
  el.tabBtnFinancials.onclick = () => switchTab('financials');
  
  // Status filter chips
  document.querySelectorAll('.status-chip').forEach(chip => {
    chip.onclick = (e) => {
      document.querySelectorAll('.status-chip').forEach(c => {
        c.classList.remove('active', 'bg-slate-800', 'text-white');
        c.classList.add('bg-slate-950');
      });
      chip.classList.add('active', 'bg-slate-800', 'text-white');
      chip.classList.remove('bg-slate-950');
      
      state.statusFilter = chip.dataset.status;
      renderOrdersTable();
      if (window.lucide) lucide.createIcons();
    };
  });
  
  // Search input
  el.globalFilterInput.oninput = (e) => {
    state.searchQuery = e.target.value;
    renderOrdersTable();
  };
  
  // Auto-dispatch
  el.btnAutoDispatchAll.onclick = handleAutoDispatchAll;
  
  // Manual refresh
  el.btnManualRefresh.onclick = async () => {
    el.refreshIcon.classList.add('animate-spin');
    await fetchAllData();
    setTimeout(() => el.refreshIcon.classList.remove('animate-spin'), 600);
    showToast('Refreshed', 'Live dispatch state synced.');
  };
  
  // Modal closes
  el.btnCloseAssignModal.onclick = () => el.modalAssignRider.classList.add('hidden');
  el.btnCloseWaybillModal.onclick = () => el.modalWaybill.classList.add('hidden');
  
  // Notification form
  el.notifyOrderSelect.onchange = updateNotificationPreview;
  el.smsNotifyForm.onsubmit = async (e) => {
    e.preventDefault();
    const ordNum = el.notifyOrderSelect.value;
    const channel = document.querySelector('input[name="notifyChannel"]:checked').value;
    
    try {
      const res = await fetch('/api/notifications/send-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: ordNum, channel })
      });
      const data = await res.json();
      showToast('Notification Sent', `Tracking link pushed to customer via ${channel}!`);
      await fetchAllData();
    } catch (err) {
      showToast('Error', 'Failed to dispatch notification', true);
    }
  };
  
  // Verification Form
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
        el.verifyResultBanner.className = 'p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs block space-y-1';
        el.verifyResultBanner.innerHTML = `
          <strong class="font-bold text-white flex items-center"><i data-lucide="check-circle" class="w-4 h-4 mr-1.5 text-emerald-400"></i> Delivery Verified & Handover Complete!</strong>
          <p>Order <b>${orderNumber}</b> marked Delivered. Cash on Delivery payment confirmed.</p>
        `;
        showToast('Verified', `Order ${orderNumber} marked Delivered!`);
        await fetchAllData();
      } else {
        el.verifyResultBanner.className = 'p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 text-xs block';
        el.verifyResultBanner.textContent = data.error || 'Failed to verify order.';
      }
    } catch (err) {
      showToast('Error', 'Failed to submit verification', true);
    }
    if (window.lucide) lucide.createIcons();
  };
  
  // Simulate QR Scan
  el.btnSimulateQrScan.onclick = () => {
    const pendingTransit = state.orders.find(o => o.status === 'In Transit') || state.orders[0];
    if (pendingTransit) {
      el.verifyOrderInput.value = pendingTransit.order_number;
      el.verifyPinInput.value = pendingTransit.verification_code || '8492';
      showToast('QR Code Scanned', `Scanned ${pendingTransit.order_number}`);
    }
  };
}

// ----------------- INITIALIZATION & POLLING -----------------
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  fetchAllData();
  
  // Real-time polling loop every 3.5 seconds
  setInterval(fetchAllData, 3500);
});
