/**
 * DispatchHub - Retailer Portal & Delivery Dashboard Logic
 */

// Application State
const state = {
  currentRetailerId: 'RET-001',
  retailers: [],
  customers: [],
  dispatchers: [],
  orders: [],
  activeFilterTab: 'ALL',
  searchQuery: ''
};

// DOM Elements
const elements = {
  retailerSelect: document.getElementById('retailerSelect'),
  retailerAvatar: document.getElementById('retailerAvatar'),
  retailerName: document.getElementById('retailerName'),
  retailerIdBadge: document.getElementById('retailerIdBadge'),
  retailerCategory: document.getElementById('retailerCategory'),
  retailerOwner: document.getElementById('retailerOwner'),
  retailerPhone: document.getElementById('retailerPhone'),
  retailerLocation: document.getElementById('retailerLocation'),
  retailerDefaultNote: document.getElementById('retailerDefaultNote'),
  
  // Metrics
  metricTotalOrders: document.getElementById('metricTotalOrders'),
  metricPendingOrders: document.getElementById('metricPendingOrders'),
  metricActiveOrders: document.getElementById('metricActiveOrders'),
  metricDeliveredOrders: document.getElementById('metricDeliveredOrders'),
  
  // Tab counts
  countAll: document.getElementById('countAll'),
  countPending: document.getElementById('countPending'),
  countTransit: document.getElementById('countTransit'),
  countDelivered: document.getElementById('countDelivered'),
  
  // Table
  ordersTableBody: document.getElementById('ordersTableBody'),
  emptyState: document.getElementById('emptyState'),
  
  // Search
  orderSearchInput: document.getElementById('orderSearchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  btnExecuteSearch: document.getElementById('btnExecuteSearch'),
  quickSearchResult: document.getElementById('quickSearchResult'),
  btnCloseQuickResult: document.getElementById('btnCloseQuickResult'),
  resOrderNumber: document.getElementById('resOrderNumber'),
  resStatusBadge: document.getElementById('resStatusBadge'),
  resDispatcherName: document.getElementById('resDispatcherName'),
  resDriverPhone: document.getElementById('resDriverPhone'),
  resVehicleType: document.getElementById('resVehicleType'),
  resDeliveryAddress: document.getElementById('resDeliveryAddress'),
  stepPlaced: document.getElementById('stepPlaced'),
  stepAssigned: document.getElementById('stepAssigned'),
  stepTransit: document.getElementById('stepTransit'),
  stepDelivered: document.getElementById('stepDelivered'),
  
  // Create Order Modal
  modalCreateOrder: document.getElementById('modalCreateOrder'),
  btnOpenCreateModal: document.getElementById('btnOpenCreateModal'),
  btnNewOrderHeader: document.getElementById('btnNewOrderHeader'),
  btnEmptyCreate: document.getElementById('btnEmptyCreate'),
  btnCloseCreateModal: document.getElementById('btnCloseCreateModal'),
  btnCancelCreate: document.getElementById('btnCancelCreate'),
  createOrderForm: document.getElementById('createOrderForm'),
  modalRetailerStamp: document.getElementById('modalRetailerStamp'),
  customerChipsGrid: document.getElementById('customerChipsGrid'),
  catalogChipsGrid: document.getElementById('catalogChipsGrid'),
  previewOrderNum: document.getElementById('previewOrderNum'),
  
  // Form Inputs
  inputCustomerName: document.getElementById('inputCustomerName'),
  inputCustomerPhone: document.getElementById('inputCustomerPhone'),
  inputDeliveryAddress: document.getElementById('inputDeliveryAddress'),
  inputItemDescription: document.getElementById('inputItemDescription'),
  inputSpecialInstructions: document.getElementById('inputSpecialInstructions'),
  checkAutoAssign: document.getElementById('checkAutoAssign'),
  
  // Edit Order Modal
  modalEditOrder: document.getElementById('modalEditOrder'),
  btnCloseEditModal: document.getElementById('btnCloseEditModal'),
  btnCancelEdit: document.getElementById('btnCancelEdit'),
  editOrderForm: document.getElementById('editOrderForm'),
  editModalOrderNum: document.getElementById('editModalOrderNum'),
  editOrderNumber: document.getElementById('editOrderNumber'),
  editCustomerName: document.getElementById('editCustomerName'),
  editCustomerPhone: document.getElementById('editCustomerPhone'),
  editDeliveryAddress: document.getElementById('editDeliveryAddress'),
  editItemDescription: document.getElementById('editItemDescription'),
  editSpecialInstructions: document.getElementById('editSpecialInstructions'),
  
  // Catalog Modal
  modalCatalogQuickView: document.getElementById('modalCatalogQuickView'),
  btnBrowseCatalog: document.getElementById('btnBrowseCatalog'),
  btnCloseCatalogModal: document.getElementById('btnCloseCatalogModal'),
  catalogCardsContainer: document.getElementById('catalogCardsContainer'),
  
  // Buttons
  btnRefreshOrders: document.getElementById('btnRefreshOrders'),
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  themeText: document.getElementById('themeText'),
  currentTime: document.getElementById('currentTime'),
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// Initialization & Data Loading
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  startTimeClock();
  setupEventListeners();
  await loadInitialData();
  
  // Real-time synchronization: listen to storage events across all open tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'dispatchhub_master_orders') {
      fetchOrdersAndMetrics();
    }
  });

  window.addEventListener('dispatchhub_order_update', () => {
    fetchOrdersAndMetrics();
  });

  // Regular sync interval every 3.5 seconds
  setInterval(fetchOrdersAndMetrics, 3500);
});

function initTheme() {
  const savedTheme = localStorage.getItem('dispatchhub_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    if (elements.themeIcon) elements.themeIcon.setAttribute('data-lucide', 'sun');
    if (elements.themeText) elements.themeText.textContent = 'Light';
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    if (elements.themeIcon) elements.themeIcon.setAttribute('data-lucide', 'moon');
    if (elements.themeText) elements.themeText.textContent = 'Dark';
  }
  localStorage.setItem('dispatchhub_theme', theme);
  if (window.lucide) lucide.createIcons();
}

function startTimeClock() {
  const updateTime = () => {
    const now = new Date();
    const options = { 
      timeZone: 'Africa/Nairobi',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    };
    elements.currentTime.textContent = `Nairobi ${now.toLocaleTimeString('en-GB', options)} EAT`;
  };
  updateTime();
  setInterval(updateTime, 1000);
}

async function loadInitialData() {
  try {
    const [retailersRes, customersRes, dispatchersRes] = await Promise.all([
      fetch('/api/retailers').catch(e => e),
      fetch('/api/customers').catch(e => e),
      fetch('/api/dispatchers').catch(e => e)
    ]);

    if (retailersRes.ok) state.retailers = await retailersRes.json();
    if (customersRes.ok) state.customers = await customersRes.json();
    if (dispatchersRes.ok) state.dispatchers = await dispatchersRes.json();

    // Fallback data if API returns empty
    if (!state.retailers || state.retailers.length === 0) {
      state.retailers = [
        { id: "RET-001", name: "Savanna Blooms & Florist", owner: "Evelyn Mutua", phone: "+254 712 345 678", location: "Westlands, Nairobi", category: "Fresh Florals & Gifts", default_instructions: "Keep upright; fragile glass vases.", avatar: "🌸", color: "#e11d48" }
      ];
    }

    populateRetailerSelector();
    renderCustomerPresetChips();
    switchRetailer(state.currentRetailerId);
    await fetchOrdersAndMetrics();
  } catch (error) {
    console.error('[DispatchHub] Error loading initial data:', error);
    showToast(`API Fetch Warning: ${error.message || 'Check Flask backend on http://127.0.0.1:5000'}`, 'error');
  }
}


// ==========================================
// Retailer Profile Handling
// ==========================================
function populateRetailerSelector() {
  elements.retailerSelect.innerHTML = '';
  state.retailers.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.avatar} ${r.name} (${r.id})`;
    elements.retailerSelect.appendChild(opt);
  });
  
  // Option for Viewing All
  const optAll = document.createElement('option');
  optAll.value = 'ALL';
  optAll.textContent = '🌐 View All Retailers (Multi-Tenant Overview)';
  elements.retailerSelect.appendChild(optAll);

  elements.retailerSelect.value = state.currentRetailerId;
}

function switchRetailer(retailerId) {
  state.currentRetailerId = retailerId;
  elements.retailerSelect.value = retailerId;

  if (retailerId === 'ALL') {
    elements.retailerAvatar.textContent = '🌐';
    elements.retailerName.textContent = 'All Retailer Accounts (Consolidated View)';
    elements.retailerIdBadge.textContent = 'ALL-STORES';
    elements.retailerCategory.textContent = 'Multi-Category Fleet';
    elements.retailerOwner.textContent = 'Platform Admin';
    elements.retailerPhone.textContent = '+254 700 000 000';
    elements.retailerLocation.textContent = 'Nairobi Metro Area, Kenya';
    elements.retailerDefaultNote.textContent = 'Multi-tenant dispatch system';
    elements.modalRetailerStamp.textContent = 'RET-001 (Default)';
  } else {
    const r = state.retailers.find(item => item.id === retailerId);
    if (r) {
      elements.retailerAvatar.textContent = r.avatar || '🏪';
      elements.retailerName.textContent = r.name;
      elements.retailerIdBadge.textContent = r.id;
      elements.retailerCategory.textContent = r.category;
      elements.retailerOwner.textContent = r.owner;
      elements.retailerPhone.textContent = r.phone;
      elements.retailerLocation.textContent = r.location;
      elements.retailerDefaultNote.textContent = `"${r.default_instructions}"`;
      elements.modalRetailerStamp.textContent = r.id;
    }
  }

  renderCatalogPresetChips();
  fetchOrdersAndMetrics();
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// Customers & Catalog Presets
// ==========================================
function renderCustomerPresetChips() {
  elements.customerChipsGrid.innerHTML = '';
  state.customers.forEach(c => {
    const chip = document.createElement('div');
    chip.className = 'customer-chip';
    chip.innerHTML = `
      <strong>${c.name}</strong>
      <span>${c.neighborhood} • ${c.phone}</span>
    `;
    chip.addEventListener('click', () => {
      elements.inputCustomerName.value = c.name;
      elements.inputCustomerPhone.value = c.phone;
      elements.inputDeliveryAddress.value = c.delivery_address;
      showToast(`Selected Kenyan customer: ${c.name}`, 'info');
    });
    elements.customerChipsGrid.appendChild(chip);
  });
}

function renderCatalogPresetChips() {
  elements.catalogChipsGrid.innerHTML = '';
  let activeRetailer = state.retailers.find(r => r.id === state.currentRetailerId);
  if (!activeRetailer) activeRetailer = state.retailers[0];

  if (activeRetailer && activeRetailer.catalog) {
    activeRetailer.catalog.forEach(itemText => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'catalog-chip';
      chip.textContent = `+ ${itemText}`;
      chip.addEventListener('click', () => {
        elements.inputItemDescription.value = itemText;
        if (activeRetailer.default_instructions) {
          elements.inputSpecialInstructions.value = activeRetailer.default_instructions;
        }
      });
      elements.catalogChipsGrid.appendChild(chip);
    });
  }
}

// ==========================================
// Persistent Order Store & Multi-Tab Synchronization
// ==========================================
const STORAGE_KEY = 'dispatchhub_master_orders';

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

function reconcileOrders(localOrders, serverOrders) {
  const map = new Map();
  // 1. Seed with server orders
  if (Array.isArray(serverOrders)) {
    for (const o of serverOrders) {
      if (o && o.order_number) map.set(o.order_number, { ...o });
    }
  }
  // 2. Merge local orders (ensures user-created orders NEVER vanish)
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

// ==========================================
// Orders & Metrics Fetching
// ==========================================
async function fetchOrdersAndMetrics() {
  try {
    const local = getLocalOrders();
    const params = new URLSearchParams();
    if (state.currentRetailerId !== 'ALL') {
      params.append('retailer_id', state.currentRetailerId);
    }
    if (state.activeFilterTab !== 'ALL') {
      params.append('status', state.activeFilterTab);
    }
    if (state.searchQuery) {
      params.append('q', state.searchQuery);
    }

    let serverOrders = [];
    try {
      const ordersRes = await fetch(`/api/orders?${params.toString()}`);
      if (ordersRes.ok) serverOrders = await ordersRes.json();
    } catch (e) {}

    // Reconcile server response with local store to preserve every order permanently
    const mergedAll = reconcileOrders(local, serverOrders);
    saveLocalOrders(mergedAll);

    // Filter for current retailer dashboard view
    let filtered = mergedAll;
    if (state.currentRetailerId !== 'ALL') {
      filtered = filtered.filter(o => o.retailer_id === state.currentRetailerId);
    }
    if (state.activeFilterTab !== 'ALL') {
      filtered = filtered.filter(o => o.status === state.activeFilterTab);
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.delivery_address && o.delivery_address.toLowerCase().includes(q)) ||
        (o.item_description && o.item_description.toLowerCase().includes(q))
      );
    }

    state.orders = filtered;

    // Metrics computed from reconciled orders for immediate accuracy
    const activeRetailerOrders = state.currentRetailerId === 'ALL'
      ? mergedAll
      : mergedAll.filter(o => o.retailer_id === state.currentRetailerId);

    const metrics = {
      total_orders_today: activeRetailerOrders.length,
      pending_dispatch_queue: activeRetailerOrders.filter(o => o.status === 'Pending').length,
      active_deliveries: activeRetailerOrders.filter(o => ['Assigned', 'In Transit', 'Picked Up'].includes(o.status)).length,
      delivered_orders: activeRetailerOrders.filter(o => o.status === 'Delivered').length,
    };

    updateMetricsDisplay(metrics);
    renderOrdersTable(state.orders);

    // Sync any newly created local orders back to backend in background
    if (local.length > 0) {
      fetch('/api/orders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: mergedAll })
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to fetch orders/metrics:', err);
  }
}

function updateMetricsDisplay(metrics) {
  elements.metricTotalOrders.textContent = metrics.total_orders_today || 0;
  elements.metricPendingOrders.textContent = metrics.pending_dispatch_queue || 0;
  elements.metricActiveOrders.textContent = metrics.active_deliveries || 0;
  elements.metricDeliveredOrders.textContent = metrics.delivered_orders || 0;

  elements.countAll.textContent = metrics.total_orders_today || 0;
  elements.countPending.textContent = metrics.pending_dispatch_queue || 0;
  elements.countTransit.textContent = metrics.active_deliveries || 0;
  elements.countDelivered.textContent = metrics.delivered_orders || 0;
}

// ==========================================
// Driver Avatar Lookup Helper
// ==========================================
function getDriverAvatar(dispatcherId, dispatcherName) {
  const driverMap = {
    'RIDER-001': '/static/assets/riders/hesbon_otieno.jpg',
    'RIDER-002': '/static/assets/riders/faith_wambui.jpg',
    'RIDER-003': '/static/assets/riders/aminah_hassan.jpg',
    'RIDER-004': '/static/assets/riders/brian_kipkorir.jpg',
    'DISP-001': '/static/assets/riders/jackson_kiprotich.jpg',
    'DISP-002': '/static/assets/riders/samuel_odhiambo.jpg',
    'DISP-003': '/static/assets/riders/peter_kamau.jpg',
    'DISP-004': '/static/assets/riders/grace_nduta.jpg',
    'DISP-005': '/static/assets/riders/boniface_maina.jpg',
  };
  if (dispatcherId && driverMap[dispatcherId]) return driverMap[dispatcherId];
  if (dispatcherName) {
    const clean = dispatcherName.toLowerCase();
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

// ==========================================
// Render Orders Table
// ==========================================
function renderOrdersTable(orders) {
  elements.ordersTableBody.innerHTML = '';

  if (!orders || orders.length === 0) {
    elements.ordersTableBody.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    return;
  }

  elements.emptyState.classList.add('hidden');

  orders.forEach(order => {
    const tr = document.createElement('tr');
    tr.id = `row-${order.order_number}`;

    const statusBadgeClass = getStatusBadgeClass(order.status);
    const createdTimeFormatted = order.created_at ? new Date(order.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--';

    // Action buttons based on status
    const isDelivered = order.status === 'Delivered';
    const isPending = order.status === 'Pending';
    const isCancelled = order.status === 'Cancelled';

    let advanceBtnText = '<i data-lucide="play"></i> Dispatch';
    if (order.status === 'In Transit') advanceBtnText = '<i data-lucide="check-check"></i> Complete';
    if (order.status === 'Delivered') advanceBtnText = '<i data-lucide="check"></i> Done';

    tr.innerHTML = `
      <td>
        <div class="order-num-cell">
          <span>${order.order_number}</span>
          <span class="order-time">${createdTimeFormatted} • ${order.retailer_id}</span>
        </div>
      </td>
      <td>
        <div class="customer-cell">
          <span class="customer-name">${escapeHtml(order.customer_name)}</span>
          <span class="customer-phone">${escapeHtml(order.customer_phone)}</span>
        </div>
      </td>
      <td>
        <div class="destination-cell">${escapeHtml(order.delivery_address)}</div>
      </td>
      <td>
        <div class="item-cell">${escapeHtml(order.item_description)}</div>
      </td>
      <td>
        ${order.special_instructions ? `<div class="instructions-cell">${escapeHtml(order.special_instructions)}</div>` : '<span style="color:var(--text-muted);font-size:0.75rem;">None</span>'}
      </td>
      <td>
        <span class="badge ${statusBadgeClass}">${order.status}</span>
      </td>
      <td>
        <div class="dispatcher-cell">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <img src="${getDriverAvatar(order.dispatcher_id, order.dispatcher_name)}" alt="${escapeHtml(order.dispatcher_name || 'Driver')}" style="width: 34px; height: 34px; border-radius: 8px; object-fit: cover; border: 1.5px solid rgba(82, 183, 136, 0.45); flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.3);" onerror="this.src='/static/assets/riders/hesbon_otieno.jpg'">
            <div>
              <span class="disp-name">${order.dispatcher_name || 'Unassigned'}</span>
              <span class="disp-details">
                <i data-lucide="phone" style="width:12px;height:12px"></i> ${order.driver_phone || 'Awaiting'}
              </span>
            </div>
          </div>
        </div>
      </td>
      <td class="text-right">
        <div class="action-btn-group">
          ${!isDelivered ? `
            <button class="btn btn-action-advance btn-xs btn-advance" data-order="${order.order_number}" title="Advance Dispatch Lifecycle">
              ${advanceBtnText}
            </button>
            <button class="btn btn-action-edit btn-xs btn-edit" data-order="${order.order_number}" title="Edit Order Details">
              <i data-lucide="edit-2"></i>
            </button>
          ` : ''}
          ${!isDelivered ? `
            <button class="btn btn-action-delete btn-xs btn-delete" data-order="${order.order_number}" title="Cancel Delivery Request">
              <i data-lucide="trash-2"></i>
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-xs btn-view" data-order="${order.order_number}" title="Quick Tracking Card">
            <i data-lucide="external-link"></i>
          </button>
        </div>
      </td>
    `;

    elements.ordersTableBody.appendChild(tr);
  });

  if (window.lucide) lucide.createIcons();
  attachTableActionListeners();
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Pending': return 'badge-pending';
    case 'In Transit': return 'badge-in-transit';
    case 'Assigned': return 'badge-assigned';
    case 'Delivered': return 'badge-delivered';
    case 'Cancelled': return 'badge-cancelled';
    default: return 'badge-pending';
  }
}

// ==========================================
// Table Action Listeners
// ==========================================
function attachTableActionListeners() {
  // Advance Status
  document.querySelectorAll('.btn-advance').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const orderNum = btn.getAttribute('data-order');
      await advanceOrderStatus(orderNum);
    });
  });

  // Edit Order
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderNum = btn.getAttribute('data-order');
      openEditModal(orderNum);
    });
  });

  // Delete/Cancel Order
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const orderNum = btn.getAttribute('data-order');
      if (confirm(`Are you sure you want to cancel order ${orderNum}?`)) {
        await cancelOrder(orderNum);
      }
    });
  });

  // View / Track
  document.querySelectorAll('.btn-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const orderNum = btn.getAttribute('data-order');
      triggerQuickLookup(orderNum);
    });
  });
}

// ==========================================
// Quick Search & Tracking Panel
// ==========================================
async function triggerQuickLookup(orderNumber) {
  if (!orderNumber) return;
  elements.orderSearchInput.value = orderNumber;
  elements.btnClearSearch.classList.remove('hidden');

  try {
    const res = await fetch(`/api/orders/search?order_number=${encodeURIComponent(orderNumber)}`);
    const data = await res.json();

    if (res.ok && data.found) {
      displayQuickSearchResult(data.order);
    } else {
      showToast(data.message || `Order ${orderNumber} not found`, 'error');
      elements.quickSearchResult.classList.add('hidden');
    }
  } catch (err) {
    console.error('Search error:', err);
    showToast('Failed to perform order search', 'error');
  }
}

function displayQuickSearchResult(order) {
  elements.resOrderNumber.textContent = order.order_number;
  elements.resStatusBadge.textContent = order.status;
  elements.resStatusBadge.className = `badge ${getStatusBadgeClass(order.status)}`;
  
  elements.resDispatcherName.textContent = order.dispatcher_name || 'Pending Assignment';
  const driverAvatarEl = document.getElementById('resDriverAvatar');
  if (driverAvatarEl) {
    driverAvatarEl.src = getDriverAvatar(order.dispatcher_id, order.dispatcher_name);
  }
  elements.resDriverPhone.textContent = order.driver_phone || 'N/A';
  if (order.driver_phone && order.driver_phone.startsWith('+')) {
    elements.resDriverPhone.href = `tel:${order.driver_phone}`;
  } else {
    elements.resDriverPhone.removeAttribute('href');
  }
  
  elements.resVehicleType.textContent = order.vehicle_type ? `${order.vehicle_type} (${order.vehicle_reg || 'N/A'})` : 'Fleet Pending';
  elements.resDeliveryAddress.textContent = `${order.customer_name} • ${order.delivery_address}`;

  // Update timeline
  const status = order.status;
  elements.stepPlaced.classList.add('active');
  
  if (status === 'Assigned' || status === 'In Transit' || status === 'Delivered') {
    elements.stepAssigned.classList.add('active');
  } else {
    elements.stepAssigned.classList.remove('active');
  }

  if (status === 'In Transit' || status === 'Delivered') {
    elements.stepTransit.classList.add('active');
  } else {
    elements.stepTransit.classList.remove('active');
  }

  if (status === 'Delivered') {
    elements.stepDelivered.classList.add('active');
  } else {
    elements.stepDelivered.classList.remove('active');
  }

  elements.quickSearchResult.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// Order Lifecycle Operations (Advance, Edit, Cancel)
// ==========================================
async function advanceOrderStatus(orderNumber) {
  try {
    const res = await fetch(`/api/orders/${orderNumber}/advance`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showToast(`Order ${orderNumber} is now: ${data.order.status}`, 'success');
      await fetchOrdersAndMetrics();
      if (!elements.quickSearchResult.classList.contains('hidden') && elements.resOrderNumber.textContent === orderNumber) {
        displayQuickSearchResult(data.order);
      }
    } else {
      showToast(data.error || 'Failed to advance order status', 'error');
    }
  } catch (err) {
    console.error('Error advancing order:', err);
    showToast('Failed to advance order status', 'error');
  }
}

async function cancelOrder(orderNumber) {
  try {
    const res = await fetch(`/api/orders/${orderNumber}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      showToast(`Order ${orderNumber} cancelled successfully`, 'info');
      await fetchOrdersAndMetrics();
    } else {
      showToast(data.error || 'Failed to cancel order', 'error');
    }
  } catch (err) {
    console.error('Error cancelling order:', err);
    showToast('Failed to cancel order', 'error');
  }
}

function openEditModal(orderNumber) {
  const order = state.orders.find(o => o.order_number === orderNumber);
  if (!order) return;

  elements.editModalOrderNum.textContent = order.order_number;
  elements.editOrderNumber.value = order.order_number;
  elements.editCustomerName.value = order.customer_name;
  elements.editCustomerPhone.value = order.customer_phone;
  elements.editDeliveryAddress.value = order.delivery_address;
  elements.editItemDescription.value = order.item_description;
  elements.editSpecialInstructions.value = order.special_instructions || '';

  elements.modalEditOrder.classList.remove('hidden');
}

// ==========================================
// Catalog Quick View Modal
// ==========================================
function renderCatalogModal() {
  elements.catalogCardsContainer.innerHTML = '';
  state.retailers.forEach(r => {
    const card = document.createElement('div');
    card.className = 'catalog-retailer-card';
    card.innerHTML = `
      <h4>${r.avatar} ${r.name} <span class="badge badge-retailer-id">${r.id}</span></h4>
      <p style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:0.5rem;">
        <strong>Category:</strong> ${r.category} | <strong>Owner:</strong> ${r.owner} (${r.phone}) | <strong>Location:</strong> ${r.location}
      </p>
      <div style="font-size:0.75rem;color:#FCD34D;background:rgba(245,158,11,0.08);padding:0.3rem 0.5rem;border-radius:4px;margin-bottom:0.6rem;">
        <strong>Handling Note:</strong> "${r.default_instructions}"
      </div>
      <strong style="font-size:0.75rem;color:var(--text-secondary);">Sample Catalog:</strong>
      <ul class="catalog-item-list">
        ${r.catalog.map(item => `<li>${item}</li>`).join('')}
      </ul>
      <button class="btn btn-primary btn-xs btn-switch-here" data-ret="${r.id}">
        Switch to this Store
      </button>
    `;
    elements.catalogCardsContainer.appendChild(card);
  });

  document.querySelectorAll('.btn-switch-here').forEach(btn => {
    btn.addEventListener('click', () => {
      const retId = btn.getAttribute('data-ret');
      switchRetailer(retId);
      elements.modalCatalogQuickView.classList.add('hidden');
      showToast(`Switched active store to ${retId}`, 'success');
    });
  });
}

// ==========================================
// Event Listeners Setup
// ==========================================
function setupEventListeners() {
  // Retailer select change
  elements.retailerSelect.addEventListener('change', (e) => {
    switchRetailer(e.target.value);
  });

  // Filter Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeFilterTab = btn.getAttribute('data-tab');
      fetchOrdersAndMetrics();
    });
  });

  // Metric cards clickable to filter
  document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      state.activeFilterTab = filter;
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === filter);
      });
      fetchOrdersAndMetrics();
    });
  });

  // Live Search input
  elements.orderSearchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    state.searchQuery = val;
    elements.btnClearSearch.classList.toggle('hidden', !val);
    fetchOrdersAndMetrics();
  });

  elements.btnClearSearch.addEventListener('click', () => {
    elements.orderSearchInput.value = '';
    state.searchQuery = '';
    elements.btnClearSearch.classList.add('hidden');
    elements.quickSearchResult.classList.add('hidden');
    fetchOrdersAndMetrics();
  });

  elements.btnExecuteSearch.addEventListener('click', () => {
    const val = elements.orderSearchInput.value.trim();
    if (val) triggerQuickLookup(val);
  });

  elements.orderSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const val = elements.orderSearchInput.value.trim();
      if (val) triggerQuickLookup(val);
    }
  });

  elements.btnCloseQuickResult.addEventListener('click', () => {
    elements.quickSearchResult.classList.add('hidden');
  });

  // Sample lookup chips
  document.querySelectorAll('.chip-sample').forEach(chip => {
    chip.addEventListener('click', () => {
      const ord = chip.getAttribute('data-order');
      triggerQuickLookup(ord);
    });
  });

  // Create Order Modal Triggers
  const openCreateModal = () => {
    const targetRetailer = state.currentRetailerId === 'ALL' ? 'RET-001' : state.currentRetailerId;
    elements.modalRetailerStamp.textContent = targetRetailer;
    
    // Auto populate default special instruction if empty
    const r = state.retailers.find(item => item.id === targetRetailer);
    if (r && !elements.inputSpecialInstructions.value) {
      elements.inputSpecialInstructions.value = r.default_instructions || '';
    }

    elements.modalCreateOrder.classList.remove('hidden');
  };

  elements.btnOpenCreateModal.addEventListener('click', openCreateModal);
  elements.btnNewOrderHeader.addEventListener('click', openCreateModal);
  elements.btnEmptyCreate.addEventListener('click', openCreateModal);

  elements.btnCloseCreateModal.addEventListener('click', () => {
    elements.modalCreateOrder.classList.add('hidden');
  });
  elements.btnCancelCreate.addEventListener('click', () => {
    elements.modalCreateOrder.classList.add('hidden');
  });

  // Create Order Form Submission
  elements.createOrderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetRetailer = state.currentRetailerId === 'ALL' ? 'RET-001' : state.currentRetailerId;
    const now = new Date();
    const datePrefix = `ORD-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
    const localOrders = getLocalOrders();
    const todayCount = localOrders.filter(o => o.order_number && o.order_number.startsWith(datePrefix)).length;
    const generatedOrderNum = `${datePrefix}-${String(todayCount + 1).padStart(3, '0')}`;
    const verificationCode = String(Math.floor(1000 + Math.random() * 9000));
    
    const deliveryFee = 300;
    const itemVal = 2500;
    const isAutoAssign = elements.checkAutoAssign.checked;
    
    const newOrderObj = {
      order_number: generatedOrderNum,
      retailer_id: targetRetailer,
      customer_name: elements.inputCustomerName.value.trim(),
      customer_phone: elements.inputCustomerPhone.value.trim(),
      delivery_address: elements.inputDeliveryAddress.value.trim(),
      item_description: elements.inputItemDescription.value.trim(),
      special_instructions: elements.inputSpecialInstructions.value.trim(),
      priority: 'Normal',
      verification_code: verificationCode,
      delivery_fee: deliveryFee,
      item_value: itemVal,
      cod_amount: itemVal + deliveryFee,
      payment_method: 'Cash on Delivery (M-Pesa / Cash)',
      payment_status: 'Pending on Delivery',
      status: isAutoAssign ? 'In Transit' : 'Pending',
      dispatcher_id: isAutoAssign ? 'RIDER-001' : null,
      dispatcher_name: isAutoAssign ? 'Hesbon Otieno' : 'Auto-Assigning...',
      driver_phone: isAutoAssign ? '+254 712 345 678' : 'Pending Assignment',
      vehicle_type: isAutoAssign ? 'Electric Motorbike (Roam Air)' : 'Awaiting Fleet Match',
      vehicle_reg: isAutoAssign ? 'KME 102G' : 'N/A',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      dispatched_at: isAutoAssign ? now.toISOString() : null,
      delivered_at: null,
      eta_minutes: isAutoAssign ? 22 : null
    };

    // 1. Immediately save locally: This GUARANTEES the order NEVER vanishes
    const currentList = getLocalOrders();
    currentList.unshift(newOrderObj);
    saveLocalOrders(currentList);

    // 2. Instant UI feedback
    showToast(`Order ${newOrderObj.order_number} created & queued!`, 'success');
    elements.modalCreateOrder.classList.add('hidden');
    elements.createOrderForm.reset();
    await fetchOrdersAndMetrics();
    triggerQuickLookup(newOrderObj.order_number);

    // 3. Persist to server in parallel
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOrderObj,
          auto_assign: isAutoAssign
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.order && data.order.order_number) {
          const updated = getLocalOrders().map(o => 
            o.order_number === generatedOrderNum ? { ...o, ...data.order } : o
          );
          saveLocalOrders(updated);
          await fetchOrdersAndMetrics();
        }
      }
    } catch (err) {
      console.warn('Background server sync queued, order is preserved locally:', err);
    }
  });

  // Edit Order Form
  elements.btnCloseEditModal.addEventListener('click', () => {
    elements.modalEditOrder.classList.add('hidden');
  });
  elements.btnCancelEdit.addEventListener('click', () => {
    elements.modalEditOrder.classList.add('hidden');
  });

  elements.editOrderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const orderNum = elements.editOrderNumber.value;
    const payload = {
      customer_name: elements.editCustomerName.value.trim(),
      customer_phone: elements.editCustomerPhone.value.trim(),
      delivery_address: elements.editDeliveryAddress.value.trim(),
      item_description: elements.editItemDescription.value.trim(),
      special_instructions: elements.editSpecialInstructions.value.trim()
    };

    try {
      const res = await fetch(`/api/orders/${orderNum}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Order ${orderNum} updated successfully!`, 'success');
        elements.modalEditOrder.classList.add('hidden');
        await fetchOrdersAndMetrics();
      } else {
        showToast(data.error || 'Failed to update order', 'error');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      showToast('Error updating order', 'error');
    }
  });

  // Catalog Modal
  elements.btnBrowseCatalog.addEventListener('click', () => {
    renderCatalogModal();
    elements.modalCatalogQuickView.classList.remove('hidden');
  });
  elements.btnCloseCatalogModal.addEventListener('click', () => {
    elements.modalCatalogQuickView.classList.add('hidden');
  });

  // Refresh button
  elements.btnRefreshOrders.addEventListener('click', () => {
    fetchOrdersAndMetrics();
    showToast('Order queue refreshed', 'info');
  });

  // Theme Switcher Toggle
  if (elements.btnThemeToggle) {
    elements.btnThemeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.contains('theme-dark');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      showToast(`Switched to ${newTheme === 'light' ? 'Bright White' : 'Dark'} theme`, 'info');
    });
  }
}

// ==========================================
// Toast System
// ==========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-octagon';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}
