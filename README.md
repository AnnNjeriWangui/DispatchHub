# 🚀 DispatchHub & Reflex Logistics OS

**DispatchHub** is an intelligent multi-retailer last-mile delivery and dispatch management engine engineered for Kenya (Nairobi metropolitan area). It interconnects the three primary delivery stakeholders:
1. **🏪 Retailer Staff** (`/`): Logs new delivery requests with customer details, item descriptions, and special handling instructions.
2. **🎯 Central Dispatcher** (`/dispatcher`): Automated command center that monitors open requests in real-time, auto-matches orders to riders using smart zone proximity and battery level algorithms, monitors live fleet telematics, and coordinates QR confirmations.
3. **⚡ EV Delivery Rider** (`/rider`): Sees assigned deliveries on mobile-first interface and progresses status (*Assigned → Picked Up → In Transit → Delivered*).
4. **🔍 Public Customer Tracker** (`/track`): Real-time public tracking with live progress timeline, assigned rider contacts, receipt breakdown, Cash on Delivery (COD), and handover verification PIN.

---

## 🌟 3-Role Interconnected Architecture

```
       ┌────────────────────────┐
       │   🏪 Retailer Portal   │  Logs order requests, item info,
       │          (`/`)         │  and special packaging notes.
       └───────────┬────────────┘
                   │
                   ▼ (Pushes to Live Dispatch Queue)
       ┌────────────────────────┐
       │ 🎯 Dispatcher Command  │  Auto-assigns or manually dispatches
       │     (`/dispatcher`)    │  to best available rider based on zone & battery.
       └───────────┬────────────┘
                   │
                   ▼ (Notifies Assigned Rider)
       ┌────────────────────────┐
       │   ⚡ Rider Portal      │  Accepts, navigates, updates status,
       │       (`/rider`)       │  and scans customer QR on delivery.
       └───────────┬────────────┘
                   │
                   ▼ (Live Sync)
       ┌────────────────────────┐
       │  🔍 Customer Tracking  │  Tracks package in real time, calls rider,
       │        (`/track`)      │  and verifies delivery with 4-digit PIN.
       └────────────────────────┘
```

---

## 🎯 Central Dispatcher Command Features (`/dispatcher`)

- **Automated Queue Orchestration**:
  - 1-Click **⚡ Auto-Assign All** using proximity matching (Westlands, Kilimani, CBD, Karen, Industrial Area, Thika Road).
  - Manual Rider assignment modal displaying rider avatar, vehicle model, battery %, rating, and current active drop count.
  - Priority handling (*Urgent vs Standard* tags).
- **Fleet Telematics & Roster**:
  - Real-time battery status gauges for electric motorbikes (*Roam Air, Spiro Commuter, Ampersand e-Boda*).
  - Live Duty status toggle (*Online / Charging at Hub / Offline*).
  - Click-to-call / SMS direct rider dispatch triggers.
- **Nairobi Logistics Radar**:
  - Real-time animated radar visualizer with zone pulse markers and live route status.
- **Verification & Handover Center**:
  - Live QR code generator and customer 4-digit verification PIN validator.
  - One-click simulated customer SMS / WhatsApp tracking update generator.
- **SLA & Three-Way Trust Financials**:
  - Retailer commission (5%), Rider per-drop payout (80%), Platform dispatch revenue (15%), and Cash on Delivery (COD) tracking.

---

## 🛠️ REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Retailer Logistics Portal |
| `GET` | `/dispatcher` | Dispatcher Command Center |
| `GET` | `/rider` | Rider Portal |
| `GET` | `/track` | Public Customer Order Tracking |
| `GET` | `/api/orders` | List & filter delivery orders |
| `POST` | `/api/orders` | Create new delivery request |
| `PUT` | `/api/orders/<order_number>` | Edit order details |
| `DELETE` | `/api/orders/<order_number>` | Cancel or remove delivery request |
| `POST` | `/api/orders/<order_number>/assign` | Manually assign a specific rider to an order |
| `POST` | `/api/dispatch/auto-assign-all` | Smart auto-dispatch all pending orders |
| `POST` | `/api/orders/<order_number>/status` | Update status with verification code / QR check |
| `POST` | `/api/orders/<order_number>/advance` | Advance status step-by-step |
| `GET` | `/api/riders` | Get live fleet status, battery %, and active load |
| `POST` | `/api/riders/<rider_id>/duty` | Toggle rider duty status (*ONLINE, CHARGING, OFFLINE*) |
| `POST` | `/api/notifications/send-tracking` | Generate simulated SMS / WhatsApp tracking message |
| `GET` | `/api/dispatch/analytics` | Dispatch SLA and commission financial breakdown |
| `GET` | `/api/events/live` | Real-time system activity log stream |

---

## 🚀 Running Locally & Running Tests

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run test suite (All 10 tests)
pytest -v test_app.py

# 3. Start DispatchHub Master Engine
python3 app.py
```

Server runs on `http://127.0.0.1:5000`.
