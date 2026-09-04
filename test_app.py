import unittest
import json
import copy
from app import app, get_orders, save_orders

class TestDispatchHub(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        # Save snapshot of original orders to prevent test contamination
        self.original_orders = copy.deepcopy(get_orders())

    def tearDown(self):
        # Restore snapshot of original orders
        save_orders(self.original_orders)

    def test_health(self):
        rv = self.client.get('/api/health')
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertEqual(data['status'], 'healthy')

    def test_pages_render(self):
        # Retailer page
        rv1 = self.client.get('/')
        self.assertEqual(rv1.status_code, 200)
        
        # Dispatcher Command Center page
        rv2 = self.client.get('/dispatcher')
        self.assertEqual(rv2.status_code, 200)
        self.assertIn(b'Reflex Dispatcher', rv2.data)
        
        # Rider Portal page
        rv3 = self.client.get('/rider')
        self.assertEqual(rv3.status_code, 200)
        
        # Public Track page
        rv4 = self.client.get('/track')
        self.assertEqual(rv4.status_code, 200)
        self.assertIn(b'Track Your', rv4.data)

    def test_retailers_count_and_data(self):
        rv = self.client.get('/api/retailers')
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertEqual(len(data), 5)
        ids = [r['id'] for r in data]
        for expected_id in ['RET-001', 'RET-002', 'RET-003', 'RET-004', 'RET-005']:
            self.assertIn(expected_id, ids)

    def test_customers_count_and_kenyan_names(self):
        rv = self.client.get('/api/customers')
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertGreaterEqual(len(data), 12)
        names = [c['name'] for c in data]
        self.assertIn('Wanjiku Kimani', names)
        self.assertIn('Faith Chebet', names)
        self.assertIn('Dennis Mutiso', names)
        self.assertIn('Zara Abdi', names)
        self.assertIn('Victor Omondi', names)
        self.assertIn('Collins Cheruiyot', names)
        
        # Check no duplicates in customer names
        self.assertEqual(len(names), len(set(names)), "Customer names must be unique without duplicates")

    def test_retailer_dedicated_customers(self):
        retailers = ['RET-001', 'RET-002', 'RET-003', 'RET-004', 'RET-005']
        for ret_id in retailers:
            rv = self.client.get(f'/api/customers?retailer_id={ret_id}')
            self.assertEqual(rv.status_code, 200)
            customers = rv.get_json()
            self.assertGreaterEqual(len(customers), 4, f"{ret_id} should have at least 4 dedicated customers")
            for c in customers:
                self.assertEqual(c.get('retailer_id'), ret_id)
                self.assertTrue(c.get('phone', '').startswith('+254'))

    def test_retailer_orders_have_pending_transit_delivered(self):
        retailers = ['RET-001', 'RET-002', 'RET-003', 'RET-004', 'RET-005']
        for ret_id in retailers:
            rv = self.client.get(f'/api/orders?retailer_id={ret_id}')
            self.assertEqual(rv.status_code, 200)
            orders = rv.get_json()
            statuses = {o.get('status') for o in orders}
            self.assertIn('Pending', statuses, f"{ret_id} must have Pending orders")
            self.assertIn('In Transit', statuses, f"{ret_id} must have In Transit orders")
            self.assertIn('Delivered', statuses, f"{ret_id} must have Delivered orders")

    def test_no_duplicate_orders(self):
        rv = self.client.get('/api/orders')
        self.assertEqual(rv.status_code, 200)
        orders = rv.get_json()
        order_numbers = [o['order_number'] for o in orders]
        self.assertEqual(len(order_numbers), len(set(order_numbers)), "Order numbers must be unique without duplicates")

    def test_metrics(self):
        rv = self.client.get('/api/metrics?retailer_id=RET-001')
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertIn('total_orders_today', data)
        self.assertIn('pending_dispatch_queue', data)
        self.assertIn('active_deliveries', data)
        self.assertIn('delivered_orders', data)

    def test_search_order(self):
        rv = self.client.get('/api/orders/search?order_number=ORD-2026-0828-001')
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertTrue(data['found'])
        self.assertEqual(data['order']['order_number'], 'ORD-2026-0828-001')

    def test_riders_and_telematics(self):
        rv = self.client.get('/api/riders')
        self.assertEqual(rv.status_code, 200)
        riders = rv.get_json()
        self.assertGreaterEqual(len(riders), 4)
        for r in riders:
            self.assertIn('battery_level', r)
            self.assertIn('duty_status', r)
            self.assertIn('assigned_zone', r)

    def test_create_assign_and_advance_order(self):
        # 1. Create order
        new_order_payload = {
            "retailer_id": "RET-001",
            "customer_name": "Halima Mohammed",
            "customer_phone": "+254 735 667 890",
            "delivery_address": "Apt 12, South C Winners Court, Muhoho Avenue, South C, Nairobi",
            "item_description": "Luxury white rose bouquet with glass vase",
            "special_instructions": "Fragile vase",
            "auto_assign": False
        }
        rv = self.client.post('/api/orders', json=new_order_payload)
        self.assertEqual(rv.status_code, 201)
        res = rv.get_json()
        order_num = res['order']['order_number']
        self.assertEqual(res['order']['status'], 'Pending')
        
        # 2. Dispatcher Manual Assign
        rv_assign = self.client.post(f'/api/orders/{order_num}/assign', json={"rider_id": "RIDER-001"})
        self.assertEqual(rv_assign.status_code, 200)
        res_assign = rv_assign.get_json()
        self.assertEqual(res_assign['order']['dispatcher_id'], 'RIDER-001')
        self.assertEqual(res_assign['order']['status'], 'In Transit')

        # 3. Advance to Delivered
        rv_del = self.client.post(f'/api/orders/{order_num}/advance')
        self.assertEqual(rv_del.status_code, 200)
        res_del = rv_del.get_json()
        self.assertEqual(res_del['order']['status'], 'Delivered')

        # 4. Update order check (already delivered -> 400)
        rv_upd = self.client.put(f'/api/orders/{order_num}', json={"special_instructions": "Updated note"})
        self.assertEqual(rv_upd.status_code, 400)

    def test_auto_dispatch_and_notifications(self):
        # Create pending order
        payload = {
            "retailer_id": "RET-002",
            "customer_name": "Collins Cheruiyot",
            "customer_phone": "+254 768 990 123",
            "delivery_address": "Villa 5, Elgon View Estate, Nandi Road, Eldoret",
            "item_description": "Handcrafted vase",
            "auto_assign": False
        }
        rv_create = self.client.post('/api/orders', json=payload)
        order_num = rv_create.get_json()['order']['order_number']
        
        # Auto-assign
        rv_auto = self.client.post('/api/dispatch/auto-assign-all')
        self.assertEqual(rv_auto.status_code, 200)
        
        # Notification trigger
        rv_notify = self.client.post('/api/notifications/send-tracking', json={"order_number": order_num, "channel": "SMS"})
        self.assertEqual(rv_notify.status_code, 200)
        self.assertTrue(rv_notify.get_json()['success'])

    def test_dispatch_analytics(self):
        rv = self.client.get('/api/dispatch/analytics')
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertIn('rider_payouts_kes', data)
        self.assertIn('retailer_commission_kes', data)
        self.assertIn('platform_revenue_kes', data)

    def test_order_sync(self):
        sample_order = {
            "order_number": "ORD-TEST-PERM-001",
            "retailer_id": "RET-001",
            "customer_name": "Test Permanent Customer",
            "customer_phone": "+254 712 999 888",
            "delivery_address": "Test Avenue, Nairobi",
            "item_description": "Perishable item test",
            "status": "Pending",
            "created_at": "2026-09-02T22:00:00.000Z"
        }
        rv = self.client.post('/api/orders/sync', json={"orders": [sample_order]})
        self.assertEqual(rv.status_code, 200)
        orders = rv.get_json()['orders']
        found = any(o.get('order_number') == 'ORD-TEST-PERM-001' for o in orders)
        self.assertTrue(found)

if __name__ == '__main__':
    unittest.main()
