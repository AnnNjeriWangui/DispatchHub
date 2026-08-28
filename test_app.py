import unittest
import json
from app import app, generate_order_number

class TestDispatchHub(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

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
        self.assertEqual(len(data), 6)
        names = [c['name'] for c in data]
        self.assertIn('Wanjiku Kimani', names)
        self.assertIn('Faith Chebet', names)
        self.assertIn('Dennis Mutiso', names)

    def test_metrics(self):
        rv = self.client.get('/api/metrics?retailer_id=RET-001')
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertIn('total_orders_today', data)
        self.assertIn('pending_dispatch_queue', data)
        self.assertIn('active_deliveries', data)
        self.assertIn('delivered_orders', data)

    def test_search_order(self):
        rv = self.client.get('/api/orders/search?order_number=ORD-2026-0826-001')
        self.assertEqual(rv.status_code, 200)
        data = rv.get_json()
        self.assertTrue(data['found'])
        self.assertEqual(data['order']['order_number'], 'ORD-2026-0826-001')

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
            "customer_name": "Wanjiku Kimani",
            "customer_phone": "+254 711 234 567",
            "delivery_address": "Apartment 4B, Silver Oak Heights, Argwings Kodhek Rd, Kilimani, Nairobi",
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
            "customer_name": "Faith Chebet",
            "customer_phone": "+254 734 567 890",
            "delivery_address": "Villa 12, Acacia Court, Mandera Road, Kileleshwa, Nairobi",
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

if __name__ == '__main__':
    unittest.main()
