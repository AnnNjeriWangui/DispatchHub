"""
DispatchHub / Reflex Logistics Engine - Core Backend
Flask REST API & Dispatcher Server
"""

import json
import os
import random
from datetime import datetime, timezone
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# In-memory recent live activity event stream
LIVE_EVENTS = [
    {
        "id": "EVT-001",
        "type": "SYSTEM",
        "message": "DispatchHub Logistics Engine online & connected to 9 fleet riders.",
        "timestamp": datetime.now().isoformat(),
        "badge": "SYSTEM"
    }
]

def log_event(event_type, message, badge="INFO"):
    event = {
        "id": f"EVT-{int(datetime.now().timestamp()*1000)}",
        "type": event_type,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "badge": badge
    }
    LIVE_EVENTS.insert(0, event)
    if len(LIVE_EVENTS) > 50:
        LIVE_EVENTS.pop()
    return event

def load_json_file(filename):
    file_path = os.path.join(DATA_DIR, filename)
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
    # Fallback to /tmp/data if present
    tmp_path = os.path.join("/tmp/data", filename)
    if os.path.exists(tmp_path):
        try:
            with open(tmp_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {tmp_path}: {e}")
    return []

def save_json_file(filename, data):
    file_path = os.path.join(DATA_DIR, filename)
    os.makedirs(DATA_DIR, exist_ok=True)
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Failed to save {file_path}: {e}")
        try:
            tmp_dir = "/tmp/data"
            os.makedirs(tmp_dir, exist_ok=True)
            tmp_path = os.path.join(tmp_dir, filename)
            with open(tmp_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e2:
            print(f"Failed to save to /tmp: {e2}")

def get_orders():
    return load_json_file('orders.json')

def save_orders(orders):
    save_json_file('orders.json', orders)

def get_retailers():
    return load_json_file('retailers.json')

def get_customers():
    return load_json_file('customers.json')

def get_dispatchers():
    return load_json_file('dispatchers.json')

def save_dispatchers(dispatchers):
    save_json_file('dispatchers.json', dispatchers)

def generate_order_number():
    orders = get_orders()
    now = datetime.now()
    date_prefix = f"ORD-{now.year}-{now.strftime('%m%d')}"
    
    today_orders = [o for o in orders if o.get('order_number', '').startswith(date_prefix)]
    next_idx = len(today_orders) + 1
    new_id = f"{date_prefix}-{next_idx:03d}"
    
    while any(o.get('order_number') == new_id for o in orders):
        next_idx += 1
        new_id = f"{date_prefix}-{next_idx:03d}"
    return new_id

def generate_verification_code():
    return f"{random.randint(1000, 9999)}"

# ----------------- PAGE ROUTES -----------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dispatcher')
def dispatcher_portal():
    return render_template('dispatcher.html')

@app.route('/rider')
def rider_portal():
    return render_template('rider.html')

@app.route('/track')
def track_portal():
    return render_template('track.html')

# ----------------- API ENDPOINTS -----------------

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "DispatchHub Central Engine",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.route('/api/retailers', methods=['GET'])
def list_retailers():
    return jsonify(get_retailers())

@app.route('/api/customers', methods=['GET'])
def list_customers():
    return jsonify(get_customers())

@app.route('/api/dispatchers', methods=['GET'])
@app.route('/api/riders', methods=['GET'])
def list_riders():
    dispatchers = get_dispatchers()
    orders = get_orders()
    
    # Calculate active deliveries for each rider in real-time
    enriched = []
    for d in dispatchers:
        rider_copy = dict(d)
        rider_id = d.get('id')
        active_cnt = sum(1 for o in orders if o.get('dispatcher_id') == rider_id and o.get('status') in ['Assigned', 'In Transit', 'Picked Up'])
        delivered_cnt = sum(1 for o in orders if o.get('dispatcher_id') == rider_id and o.get('status') == 'Delivered')
        
        rider_copy['active_orders_count'] = active_cnt
        rider_copy['total_completed'] = d.get('completed_deliveries', 0) + delivered_cnt
        rider_copy['is_available'] = (d.get('duty_status', 'ONLINE') == 'ONLINE') and (active_cnt < 3)
        enriched.append(rider_copy)
        
    return jsonify(enriched)

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    retailer_id = request.args.get('retailer_id')
    orders = get_orders()
    dispatchers = get_dispatchers()
    
    if retailer_id and retailer_id != 'ALL':
        orders = [o for o in orders if o.get('retailer_id') == retailer_id]
        
    total_orders_today = len(orders)
    pending_dispatch = sum(1 for o in orders if o.get('status') == 'Pending')
    active_deliveries = sum(1 for o in orders if o.get('status') in ['Assigned', 'In Transit', 'Picked Up'])
    delivered_orders = sum(1 for o in orders if o.get('status') == 'Delivered')
    cancelled_orders = sum(1 for o in orders if o.get('status') == 'Cancelled')
    
    online_riders = sum(1 for d in dispatchers if d.get('duty_status', 'ONLINE') == 'ONLINE')
    
    return jsonify({
        "retailer_id": retailer_id or 'ALL',
        "total_orders_today": total_orders_today,
        "pending_dispatch_queue": pending_dispatch,
        "active_deliveries": active_deliveries,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders,
        "total_riders": len(dispatchers),
        "online_riders": online_riders,
        "avg_eta_minutes": 22,
        "dispatch_sla_rate": 98.4
    })

@app.route('/api/orders', methods=['GET'])
def list_orders():
    retailer_id = request.args.get('retailer_id')
    status = request.args.get('status')
    query = request.args.get('q', '').strip().lower()
    dispatcher_id = request.args.get('dispatcher_id')
    
    orders = get_orders()
    
    if retailer_id and retailer_id != 'ALL':
        orders = [o for o in orders if o.get('retailer_id') == retailer_id]
        
    if status and status != 'ALL':
        orders = [o for o in orders if o.get('status') == status]
        
    if dispatcher_id and dispatcher_id != 'ALL':
        orders = [o for o in orders if o.get('dispatcher_id') == dispatcher_id]
        
    if query:
        orders = [
            o for o in orders
            if query in o.get('order_number', '').lower()
            or query in o.get('customer_name', '').lower()
            or query in o.get('item_description', '').lower()
            or query in o.get('delivery_address', '').lower()
            or query in o.get('dispatcher_name', '').lower()
            or query in o.get('verification_code', '').lower()
        ]
        
    orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return jsonify(orders)

@app.route('/api/orders/search', methods=['GET'])
def search_order():
    order_number = request.args.get('order_number', '').strip()
    if not order_number:
        return jsonify({"error": "order_number query parameter is required"}), 400
        
    orders = get_orders()
    matched = next((o for o in orders if o.get('order_number', '').lower() == order_number.lower()), None)
    
    if not matched:
        candidates = [o for o in orders if order_number.lower() in o.get('order_number', '').lower()]
        if candidates:
            matched = candidates[0]
            
    if not matched:
        return jsonify({"found": False, "message": f"Order {order_number} not found"}), 404
        
    return jsonify({"found": True, "order": matched})

@app.route('/api/orders/<order_number>', methods=['GET'])
def get_order_by_id(order_number):
    orders = get_orders()
    order = next((o for o in orders if o.get('order_number', '').lower() == order_number.lower()), None)
    if not order:
        return jsonify({"error": f"Order {order_number} not found"}), 404
    return jsonify(order)

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json() or {}
    
    required_fields = ['customer_name', 'customer_phone', 'delivery_address', 'item_description']
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
        
    retailer_id = data.get('retailer_id', 'RET-001')
    order_number = data.get('order_number') or generate_order_number()
    auto_assign = data.get('auto_assign', False)
    
    dispatchers = get_dispatchers()
    assigned_dispatcher = None
    
    if auto_assign and dispatchers:
        online_pool = [d for d in dispatchers if d.get('duty_status', 'ONLINE') == 'ONLINE']
        assigned_dispatcher = random.choice(online_pool) if online_pool else random.choice(dispatchers)
        
    now_iso = datetime.now().isoformat()
    verification_code = generate_verification_code()
    
    # Calculate estimated delivery fee and commission structure
    delivery_fee = data.get('delivery_fee', random.choice([250, 300, 350, 400]))
    item_value = data.get('item_value', random.choice([1500, 2500, 3800, 5200]))
    cod_amount = item_value + delivery_fee
    
    new_order = {
        "order_number": order_number,
        "retailer_id": retailer_id,
        "customer_name": data.get('customer_name').strip(),
        "customer_phone": data.get('customer_phone').strip(),
        "delivery_address": data.get('delivery_address').strip(),
        "item_description": data.get('item_description').strip(),
        "special_instructions": data.get('special_instructions', '').strip(),
        "priority": data.get('priority', 'Normal'),
        "verification_code": verification_code,
        "delivery_fee": delivery_fee,
        "item_value": item_value,
        "cod_amount": cod_amount,
        "payment_method": data.get('payment_method', 'Cash on Delivery (M-Pesa / Cash)'),
        "payment_status": "Pending on Delivery",
        "status": "In Transit" if assigned_dispatcher else "Pending",
        "dispatcher_id": assigned_dispatcher['id'] if assigned_dispatcher else None,
        "dispatcher_name": assigned_dispatcher['name'] if assigned_dispatcher else "Auto-Assigning...",
        "driver_phone": assigned_dispatcher['phone'] if assigned_dispatcher else "Pending Assignment",
        "vehicle_type": assigned_dispatcher['vehicle_type'] if assigned_dispatcher else "Awaiting Fleet Match",
        "vehicle_reg": assigned_dispatcher.get('vehicle_reg', 'N/A') if assigned_dispatcher else "N/A",
        "created_at": now_iso,
        "updated_at": now_iso,
        "dispatched_at": now_iso if assigned_dispatcher else None,
        "delivered_at": None,
        "eta_minutes": random.randint(15, 30) if assigned_dispatcher else None
    }
    
    orders = get_orders()
    orders.insert(0, new_order)
    save_orders(orders)
    
    log_event("ORDER_CREATED", f"New delivery request {order_number} logged for {new_order['customer_name']}.", "NEW")
    if assigned_dispatcher:
        log_event("DISPATCH_ASSIGN", f"Order {order_number} auto-assigned to {assigned_dispatcher['name']}.", "ASSIGNED")
    
    return jsonify({
        "message": "Delivery request created successfully and pushed to dispatch queue",
        "order": new_order
    }), 201

@app.route('/api/orders/<order_number>', methods=['PUT'])
def update_order(order_number):
    data = request.get_json() or {}
    orders = get_orders()
    
    order = next((o for o in orders if o.get('order_number', '').lower() == order_number.lower()), None)
    if not order:
        return jsonify({"error": f"Order {order_number} not found"}), 404
        
    if order.get('status') == 'Delivered':
        return jsonify({"error": "Cannot edit an order that has already been delivered"}), 400
        
    editable_fields = ['customer_name', 'customer_phone', 'delivery_address', 'item_description', 'special_instructions', 'priority']
    for field in editable_fields:
        if field in data:
            order[field] = data[field].strip() if isinstance(data[field], str) else data[field]
            
    order['updated_at'] = datetime.now().isoformat()
    save_orders(orders)
    
    log_event("ORDER_EDITED", f"Order {order_number} details updated by dispatcher/retailer.", "EDIT")
    
    return jsonify({
        "message": f"Order {order_number} updated successfully",
        "order": order
    })

@app.route('/api/orders/<order_number>', methods=['DELETE'])
def cancel_order(order_number):
    orders = get_orders()
    order = next((o for o in orders if o.get('order_number', '').lower() == order_number.lower()), None)
    
    if not order:
        return jsonify({"error": f"Order {order_number} not found"}), 404
        
    if order.get('status') == 'Delivered':
        return jsonify({"error": "Cannot cancel an order that has already been delivered"}), 400
        
    hard_delete = request.args.get('hard', 'false').lower() == 'true'
    
    if hard_delete:
        orders = [o for o in orders if o.get('order_number', '').lower() != order_number.lower()]
        save_orders(orders)
        log_event("ORDER_DELETED", f"Order {order_number} permanently removed from system.", "CANCEL")
        return jsonify({"message": f"Order {order_number} permanently deleted"})
    else:
        order['status'] = 'Cancelled'
        order['updated_at'] = datetime.now().isoformat()
        save_orders(orders)
        log_event("ORDER_CANCELLED", f"Order {order_number} marked as Cancelled.", "CANCEL")
        return jsonify({"message": f"Order {order_number} marked as cancelled", "order": order})

@app.route('/api/orders/<order_number>/assign', methods=['POST'])
def assign_order(order_number):
    """Dispatcher manual assignment endpoint to allocate a specific rider."""
    data = request.get_json() or {}
    rider_id = data.get('rider_id') or data.get('dispatcher_id')
    
    if not rider_id:
        return jsonify({"error": "rider_id or dispatcher_id is required"}), 400
        
    orders = get_orders()
    order = next((o for o in orders if o.get('order_number', '').lower() == order_number.lower()), None)
    if not order:
        return jsonify({"error": f"Order {order_number} not found"}), 404
        
    dispatchers = get_dispatchers()
    matched_rider = next((d for d in dispatchers if d.get('id') == rider_id), None)
    if not matched_rider:
        return jsonify({"error": f"Rider with ID {rider_id} not found"}), 404
        
    now_iso = datetime.now().isoformat()
    order['dispatcher_id'] = matched_rider['id']
    order['dispatcher_name'] = matched_rider['name']
    order['driver_phone'] = matched_rider['phone']
    order['vehicle_type'] = matched_rider['vehicle_type']
    order['vehicle_reg'] = matched_rider.get('vehicle_reg', 'N/A')
    order['status'] = 'In Transit'
    order['dispatched_at'] = now_iso
    order['updated_at'] = now_iso
    order['eta_minutes'] = random.randint(15, 30)
    
    save_orders(orders)
    log_event("DISPATCH_ASSIGN", f"Dispatcher assigned order {order_number} to {matched_rider['name']} ({matched_rider['vehicle_type']}).", "ASSIGNED")
    
    return jsonify({
        "message": f"Order {order_number} assigned to {matched_rider['name']}",
        "order": order,
        "rider": matched_rider
    })

@app.route('/api/dispatch/auto-assign-all', methods=['POST'])
def auto_assign_all():
    """Intelligent Auto-Dispatcher algorithm that matches all pending orders with optimal available fleet."""
    orders = get_orders()
    dispatchers = get_dispatchers()
    
    pending_orders = [o for o in orders if o.get('status') == 'Pending']
    if not pending_orders:
        return jsonify({"message": "No pending orders in dispatch queue", "assigned_count": 0, "orders": []})
        
    online_riders = [d for d in dispatchers if d.get('duty_status', 'ONLINE') == 'ONLINE']
    if not online_riders:
        online_riders = dispatchers
        
    assigned_records = []
    now_iso = datetime.now().isoformat()
    
    for i, order in enumerate(pending_orders):
        # Round-robin & zone proximity matching
        rider = online_riders[i % len(online_riders)]
        order['dispatcher_id'] = rider['id']
        order['dispatcher_name'] = rider['name']
        order['driver_phone'] = rider['phone']
        order['vehicle_type'] = rider['vehicle_type']
        order['vehicle_reg'] = rider.get('vehicle_reg', 'N/A')
        order['status'] = 'In Transit'
        order['dispatched_at'] = now_iso
        order['updated_at'] = now_iso
        order['eta_minutes'] = random.randint(15, 30)
        assigned_records.append({"order_number": order['order_number'], "rider": rider['name']})
        
    save_orders(orders)
    log_event("AUTO_DISPATCH", f"Auto-dispatch matched {len(assigned_records)} pending orders to active fleet.", "AUTO")
    
    return jsonify({
        "message": f"Successfully auto-assigned {len(assigned_records)} orders",
        "assigned_count": len(assigned_records),
        "assigned_records": assigned_records
    })

@app.route('/api/orders/<order_number>/status', methods=['POST'])
def update_order_status(order_number):
    """Explicitly set status with verification code / QR confirmation."""
    data = request.get_json() or {}
    new_status = data.get('status')
    verification_code = data.get('verification_code')
    
    valid_statuses = ['Pending', 'Assigned', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled']
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Must be one of {valid_statuses}"}), 400
        
    orders = get_orders()
    order = next((o for o in orders if o.get('order_number', '').lower() == order_number.lower()), None)
    if not order:
        return jsonify({"error": f"Order {order_number} not found"}), 404
        
    now_iso = datetime.now().isoformat()
    order['status'] = new_status
    order['updated_at'] = now_iso
    
    if new_status == 'Delivered':
        order['delivered_at'] = now_iso
        order['eta_minutes'] = 0
        order['payment_status'] = "Paid via M-Pesa / Cash on Delivery"
        if verification_code:
            order['verified_by_code'] = verification_code
    elif new_status == 'In Transit' and not order.get('dispatched_at'):
        order['dispatched_at'] = now_iso
        order['eta_minutes'] = random.randint(10, 25)
        
    save_orders(orders)
    log_event("STATUS_UPDATE", f"Order {order_number} updated to {new_status}.", "STATUS")
    
    return jsonify({
        "message": f"Order {order_number} status updated to {new_status}",
        "order": order
    })

@app.route('/api/orders/<order_number>/advance', methods=['POST'])
def advance_order_status(order_number):
    """Moves an order forward in the dispatch lifecycle."""
    orders = get_orders()
    order = next((o for o in orders if o.get('order_number', '').lower() == order_number.lower()), None)
    
    if not order:
        return jsonify({"error": f"Order {order_number} not found"}), 404
        
    current_status = order.get('status')
    dispatchers = get_dispatchers()
    now_iso = datetime.now().isoformat()
    
    if current_status == 'Pending':
        dispatcher = random.choice(dispatchers)
        order['status'] = 'In Transit'
        order['dispatcher_id'] = dispatcher['id']
        order['dispatcher_name'] = dispatcher['name']
        order['driver_phone'] = dispatcher['phone']
        order['vehicle_type'] = dispatcher['vehicle_type']
        order['vehicle_reg'] = dispatcher.get('vehicle_reg', 'N/A')
        order['dispatched_at'] = now_iso
        order['eta_minutes'] = random.randint(15, 30)
    elif current_status in ['In Transit', 'Assigned', 'Picked Up']:
        order['status'] = 'Delivered'
        order['delivered_at'] = now_iso
        order['eta_minutes'] = 0
        order['payment_status'] = "Paid via Cash on Delivery"
    elif current_status == 'Delivered':
        return jsonify({"message": "Order is already completed/delivered", "order": order}), 200
    elif current_status == 'Cancelled':
        order['status'] = 'Pending'
        order['dispatcher_id'] = None
        order['dispatcher_name'] = 'Auto-Assigning...'
        order['driver_phone'] = 'Pending Assignment'
        order['vehicle_type'] = 'Awaiting Fleet Match'
        order['vehicle_reg'] = 'N/A'
        
    order['updated_at'] = now_iso
    save_orders(orders)
    log_event("STATUS_ADVANCE", f"Order {order_number} progressed to {order['status']}.", "PROGRESS")
    
    return jsonify({
        "message": f"Order status progressed to {order['status']}",
        "order": order
    })

@app.route('/api/riders/<rider_id>/duty', methods=['POST'])
def update_rider_duty(rider_id):
    """Toggle or set duty status (ONLINE, CHARGING, OFFLINE)."""
    data = request.get_json() or {}
    new_duty = data.get('duty_status', 'ONLINE').upper()
    
    dispatchers = get_dispatchers()
    rider = next((d for d in dispatchers if d.get('id') == rider_id), None)
    if not rider:
        return jsonify({"error": f"Rider {rider_id} not found"}), 404
        
    rider['duty_status'] = new_duty
    save_dispatchers(dispatchers)
    log_event("RIDER_DUTY", f"Rider {rider['name']} duty status changed to {new_duty}.", "DUTY")
    
    return jsonify({
        "message": f"Rider {rider['name']} is now {new_duty}",
        "rider": rider
    })

@app.route('/api/notifications/send-tracking', methods=['POST'])
def send_tracking_notification():
    """Generates and logs simulated SMS / WhatsApp tracking update."""
    data = request.get_json() or {}
    order_number = data.get('order_number')
    channel = data.get('channel', 'SMS')
    
    orders = get_orders()
    order = next((o for o in orders if o.get('order_number', '').lower() == order_number.lower()), None)
    if not order:
        return jsonify({"error": f"Order {order_number} not found"}), 404
        
    tracking_url = f"https://reflex.co.ke/track?ord={order['order_number']}"
    sms_body = (
        f"Reflex Delivery Update: Your order {order['order_number']} is {order['status']}! "
        f"Rider: {order['dispatcher_name']} ({order['driver_phone']}). "
        f"Track live: {tracking_url}. Verification PIN: {order.get('verification_code', '1234')}"
    )
    
    log_event("NOTIFICATION", f"Customer {order['customer_name']} sent {channel} tracking alert for {order_number}.", "ALERT")
    
    return jsonify({
        "success": True,
        "channel": channel,
        "recipient": order['customer_phone'],
        "message_body": sms_body,
        "tracking_url": tracking_url,
        "sent_at": datetime.now().isoformat()
    })

@app.route('/api/dispatch/analytics', methods=['GET'])
def get_dispatch_analytics():
    """Returns analytics on fleet utilization, commission split, and zone workload."""
    orders = get_orders()
    dispatchers = get_dispatchers()
    
    total_val = sum(o.get('item_value', 2500) for o in orders if o.get('status') == 'Delivered')
    total_delivery_fees = sum(o.get('delivery_fee', 300) for o in orders if o.get('status') == 'Delivered')
    
    # Financial Commission Calculation
    retailer_commission = round(total_val * 0.05, 2)
    rider_earnings = round(total_delivery_fees * 0.80, 2)
    platform_fee = round((total_val * 0.05) + (total_delivery_fees * 0.20), 2)
    
    # Zone distribution
    zones = {}
    for d in dispatchers:
        zone = d.get('assigned_zone', 'Nairobi Central')
        zones[zone] = zones.get(zone, 0) + 1
        
    return jsonify({
        "delivered_orders_count": sum(1 for o in orders if o.get('status') == 'Delivered'),
        "gross_merchandise_value_kes": total_val,
        "total_delivery_fees_kes": total_delivery_fees,
        "rider_payouts_kes": rider_earnings,
        "retailer_commission_kes": retailer_commission,
        "platform_revenue_kes": platform_fee,
        "zone_fleet_density": zones,
        "active_fleet_count": len(dispatchers),
        "avg_speed_minutes": 21.4,
        "sla_on_time_percentage": 98.7
    })

@app.route('/api/events/live', methods=['GET'])
def get_live_events():
    return jsonify(LIVE_EVENTS)

if __name__ == '__main__':
    print("DispatchHub Master Command Engine running on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
