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
  currentTime: document.getElementById('currentTime'),
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// Initialization & Data Loading
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  startTimeClock();
  setupEventListeners();
  await loadInitialData();
});

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
      fetch('/api/retailers'),
      fetch('/api/customers'),
      fetch('/api/dispatchers')
    ]);

    state.retailers = await retailersRes.json();
    state.customers = await customersRes.json();
    state.dispatchers = await dispatchersRes.json();

    populateRetailerSelector();
    renderCustomerPresetChips();
    switchRetailer(state.currentRetailerId);
    await fetchOrdersAndMetrics();
  } catch (error) {
    console.error('Error loading initial data:', error);
    showToast('Failed to load system data', 'error');
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
// Orders & Metrics Fetching
// ==========================================
async function fetchOrdersAndMetrics() {
  try {
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

    const [ordersRes, metricsRes] = await Promise.all([
      fetch(`/api/orders?${params.toString()}`),
      fetch(`/api/metrics?retailer_id=${state.currentRetailerId}`)
    ]);

    state.orders = await ordersRes.json();
    const metrics = await metricsRes.json();

    updateMetricsDisplay(metrics);
    renderOrdersTable(state.orders);
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
          <span class="disp-name">${order.dispatcher_name || 'Unassigned'}</span>
          <span class="disp-details">
            <i data-lucide="truck"></i> ${order.vehicle_type || 'Awaiting'}
          </span>
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
    
    const payload = {
      retailer_id: targetRetailer,
      customer_name: elements.inputCustomerName.value.trim(),
      customer_phone: elements.inputCustomerPhone.value.trim(),
      delivery_address: elements.inputDeliveryAddress.value.trim(),
      item_description: elements.inputItemDescription.value.trim(),
      special_instructions: elements.inputSpecialInstructions.value.trim(),
      auto_assign: elements.checkAutoAssign.checked
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Order ${data.order.order_number} created & queued!`, 'success');
        elements.modalCreateOrder.classList.add('hidden');
        elements.createOrderForm.reset();
        await fetchOrdersAndMetrics();
        // Trigger quick lookup preview for convenience
        triggerQuickLookup(data.order.order_number);
      } else {
        showToast(data.error || 'Failed to create delivery order', 'error');
      }
    } catch (err) {
      console.error('Error submitting order:', err);
      showToast('Server error while creating order', 'error');
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
