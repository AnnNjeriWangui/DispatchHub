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
        self.assertIn('Jackson Kiprotich', data['order']['dispatcher_name'])

    def test_create_and_advance_order(self):
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
        
        # 2. Advance to In Transit
        rv_adv = self.client.post(f'/api/orders/{order_num}/advance')
        self.assertEqual(rv_adv.status_code, 200)
        res_adv = rv_adv.get_json()
        self.assertEqual(res_adv['order']['status'], 'In Transit')
        self.assertIsNotNone(res_adv['order']['dispatcher_id'])

        # 3. Advance to Delivered
        rv_del = self.client.post(f'/api/orders/{order_num}/advance')
        self.assertEqual(rv_del.status_code, 200)
        res_del = rv_del.get_json()
        self.assertEqual(res_del['order']['status'], 'Delivered')

        # 4. Update order check
        rv_upd = self.client.put(f'/api/orders/{order_num}', json={"special_instructions": "Updated note"})
        # Already delivered, so should return 400
        self.assertEqual(rv_upd.status_code, 400)

if __name__ == '__main__':
    unittest.main()
