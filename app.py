"""
DispatchHub - Retailer Delivery & Logistics Management Backend
Flask REST API & Web Server
"""

import json
import os
from datetime import datetime, timezone
import random
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Helper functions for data storage
def load_json_file(filename):
    file_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []

def save_json_file(filename, data):
    file_path = os.path.join(DATA_DIR, filename)
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

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

def generate_order_number():
    orders = get_orders()
    now = datetime.now()
    date_prefix = f"ORD-{now.year}-{now.strftime('%m%d')}"
    
    # Find existing counts for today
    today_orders = [o for o in orders if o.get('order_number', '').startswith(date_prefix)]
    next_idx = len(today_orders) + 1
    new_id = f"{date_prefix}-{next_idx:03d}"
    
    # Ensure uniqueness
    while any(o.get('order_number') == new_id for o in orders):
        next_idx += 1
        new_id = f"{date_prefix}-{next_idx:03d}"
    return new_id

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "DispatchHub API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

@app.route('/api/retailers', methods=['GET'])
def list_retailers():
    return jsonify(get_retailers())

@app.route('/api/customers', methods=['GET'])
def list_customers():
    return jsonify(get_customers())

@app.route('/api/dispatchers', methods=['GET'])
def list_dispatchers():
    return jsonify(get_dispatchers())

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    retailer_id = request.args.get('retailer_id')
    orders = get_orders()
    
    if retailer_id and retailer_id != 'ALL':
        orders = [o for o in orders if o.get('retailer_id') == retailer_id]
        
    total_orders_today = len(orders)
    pending_dispatch = sum(1 for o in orders if o.get('status') == 'Pending')
    active_deliveries = sum(1 for o in orders if o.get('status') in ['Assigned', 'In Transit'])
    delivered_orders = sum(1 for o in orders if o.get('status') == 'Delivered')
    cancelled_orders = sum(1 for o in orders if o.get('status') == 'Cancelled')

    return jsonify({
        "retailer_id": retailer_id or 'ALL',
        "total_orders_today": total_orders_today,
        "pending_dispatch_queue": pending_dispatch,
        "active_deliveries": active_deliveries,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders
    })

@app.route('/api/orders', methods=['GET'])
def list_orders():
    retailer_id = request.args.get('retailer_id')
    status = request.args.get('status')
    query = request.args.get('q', '').strip().lower()
    
    orders = get_orders()
    
    if retailer_id and retailer_id != 'ALL':
        orders = [o for o in orders if o.get('retailer_id') == retailer_id]
        
    if status and status != 'ALL':
        orders = [o for o in orders if o.get('status') == status]
        
    if query:
        orders = [
            o for o in orders
            if query in o.get('order_number', '').lower()
            or query in o.get('customer_name', '').lower()
            or query in o.get('item_description', '').lower()
            or query in o.get('delivery_address', '').lower()
            or query in o.get('dispatcher_name', '').lower()
        ]
        
    # Return sorted by created_at descending
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
        # Partial match fallback
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
        assigned_dispatcher = random.choice(dispatchers)
        
    now_iso = datetime.now().isoformat()
    
    new_order = {
        "order_number": order_number,
        "retailer_id": retailer_id,
        "customer_name": data.get('customer_name').strip(),
        "customer_phone": data.get('customer_phone').strip(),
        "delivery_address": data.get('delivery_address').strip(),
        "item_description": data.get('item_description').strip(),
        "special_instructions": data.get('special_instructions', '').strip(),
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
        "eta_minutes": random.randint(15, 35) if assigned_dispatcher else None
    }
    
    orders = get_orders()
    orders.insert(0, new_order)
    save_orders(orders)
    
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
        
    editable_fields = ['customer_name', 'customer_phone', 'delivery_address', 'item_description', 'special_instructions']
    for field in editable_fields:
        if field in data:
            order[field] = data[field].strip() if isinstance(data[field], str) else data[field]
            
    order['updated_at'] = datetime.now().isoformat()
    save_orders(orders)
    
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
        
    # Mark as Cancelled or Delete based on query param
    hard_delete = request.args.get('hard', 'false').lower() == 'true'
    
    if hard_delete:
        orders = [o for o in orders if o.get('order_number', '').lower() != order_number.lower()]
        save_orders(orders)
        return jsonify({"message": f"Order {order_number} permanently deleted"})
    else:
        order['status'] = 'Cancelled'
        order['updated_at'] = datetime.now().isoformat()
        save_orders(orders)
        return jsonify({"message": f"Order {order_number} marked as cancelled", "order": order})

@app.route('/api/orders/<order_number>/advance', methods=['POST'])
def advance_order_status(order_number):
    """Simulates moving an order forward in the dispatch lifecycle."""
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
        order['vehicle_reg'] = dispatcher['vehicle_reg']
        order['dispatched_at'] = now_iso
        order['eta_minutes'] = random.randint(10, 25)
    elif current_status == 'In Transit' or current_status == 'Assigned':
        order['status'] = 'Delivered'
        order['delivered_at'] = now_iso
        order['eta_minutes'] = 0
    elif current_status == 'Delivered':
        return jsonify({"message": "Order is already completed/delivered", "order": order}), 200
    elif current_status == 'Cancelled':
        # Re-activate to pending
        order['status'] = 'Pending'
        order['dispatcher_id'] = None
        order['dispatcher_name'] = 'Auto-Assigning...'
        order['driver_phone'] = 'Pending Assignment'
        order['vehicle_type'] = 'Awaiting Fleet Match'
        order['vehicle_reg'] = 'N/A'
        
    order['updated_at'] = now_iso
    save_orders(orders)
    
    return jsonify({
        "message": f"Order status progressed to {order['status']}",
        "order": order
    })

if __name__ == '__main__':
    print("🚀 DispatchHub Retailer Portal Server running on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
