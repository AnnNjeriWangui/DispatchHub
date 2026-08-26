# 🚀 DispatchHub: Retailer Logistics & Delivery Dispatch Dashboard

**DispatchHub** is an intelligent multi-retailer delivery dispatch and order tracking portal engineered specifically for logistics operations in Kenya (Nairobi and surrounding metros). It features a Python (Flask) backend REST API and a modern web dashboard with live metrics, quick order tracking, customer autofill presets, and auto-dispatch lifecycle management.

---

## 🌟 Key Features & Blueprint Architecture

### 1. Top Metrics Overview Banner
- **Total Orders Today**: Real-time count of delivery orders logged for the selected store.
- **Pending Dispatch Queue**: Orders waiting in the backlog for auto-assignment or fleet dispatch.
- **Active Deliveries**: Orders currently assigned to a driver or in-transit.
- **Delivered Orders**: Successfully completed deliveries with timestamp logging.

### 2. Quick Search & Real-Time Status Bar
- Type any Order Number (e.g., `ORD-2026-0826-001`) to immediately pull up the live tracking drawer.
- Displays **Assigned Dispatcher Name**, **Driver Phone Number** (+254 click-to-call), **Vehicle Type & Reg Plate** (e.g. Boda Boda, Cargo TukTuk, Refrigerated Van), and a **4-step Visual Timeline** (*Placed → Assigned → In Transit → Delivered*).

### 3. Create New Delivery Request Form
- Input fields for: Customer Name, Customer Phone (+254 format), Delivery Address, Item Description, and Special Instructions.
- **1-Click Kenyan Customer Auto-Fill**: Pre-loaded with 6 authentic Kenyan customer profiles (Nairobi neighborhoods: Kilimani, Parklands, Kileleshwa, Upper Hill, South B, Garden City).
- **1-Click Retailer Catalog Presets**: Quickly populate item descriptions and special handling instructions tailored to each retailer.
- Automatically stamps `retailer_id`, auto-assigns an order number (`ORD-YYYY-MMDD-XXX`), and pushes the request directly into the backend queue with optional instant fleet matching.

### 4. Active Deliveries & Queue Table
- Live, filterable table (*All, Pending, In Transit, Delivered*).
- Real-time action buttons:
  - **Dispatch / Advance**: Advance order status along the delivery lifecycle (*Pending → In Transit → Delivered*).
  - **Edit**: Modify order details prior to delivery.
  - **Cancel/Delete**: Remove or mark pending requests as cancelled.
  - **Track / View**: Launch the quick status tracking card.

---

## 🏬 5 Distinct Pre-Configured Retailer Profiles

| Retailer ID | Store Name | Owner & Phone | Location | Category & Sample Item | Special Delivery Instructions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RET-001** | **Savanna Blooms & Florist** | Evelyn Mutua<br>`+254 712 345 678` | Westlands, Nairobi | Fresh Florals & Gifts<br>*(Luxury white rose bouquet)* | *"Keep upright and away from direct sunlight; fragile glass vases."* |
| **RET-002** | **Rift Valley Artisan Crafts** | Kiprono Koech<br>`+254 722 987 654` | Karen, Nairobi | Handicrafts & Leatherwear<br>*(Maasai beaded sandals)* | *"Handcrafted items; handle with care."* |
| **RET-003** | **Nairobi Tech & Gadgets Hub** | Brian Omondi<br>`+254 733 456 789` | Moi Avenue, CBD | Consumer Electronics<br>*(Fast-charging power banks & earbuds)* | *"High-value electronics; require recipient signature upon delivery."* |
| **RET-004** | **Organic Fresh Basket** | Amina Wanjiru<br>`+254 745 112 233` | Lavington, Nairobi | Farm-Fresh Produce & Oils<br>*(Organic avocados & macadamia oil)* | *"Perishable goods; deliver immediately or store in temperature-controlled box."* |
| **RET-005** | **Urban Books & Stationery** | David Njoroge<br>`+254 754 889 001` | Ruaka, Kiambu | Books & Office Stationery<br>*(Executive notebook & fiction sets)* | *"Keep dry; pack securely to prevent bent book covers."* |

---

## 👥 6 Kenyan Customer Profiles Dataset (`data/customers.json`)

1. **Wanjiku Kimani** — `+254 711 234 567` (Silver Oak Heights, Argwings Kodhek Rd, Kilimani, Nairobi)
2. **Juma Mwangi** — `+254 723 456 789` (Diamond Plaza Annex, 4th Parklands Avenue, Parklands, Nairobi)
3. **Faith Chebet** — `+254 734 567 890` (Acacia Court, Mandera Road, Kileleshwa, Nairobi)
4. **Kevin Otieno** — `+254 745 678 901` (Britam Tower, Hospital Road, Upper Hill, Nairobi)
5. **Mercy Achieng** — `+254 756 789 012` (Golden Gate Estate, South B, Nairobi)
6. **Dennis Mutiso** — `+254 767 890 123` (Garden City Residences, Exit 7 Thika Road, Nairobi)

---

## 🛠️ Project Structure

```
DispatchHub/
├── app.py                      # Flask REST API backend & static server
├── requirements.txt            # Python dependencies
├── test_app.py                 # Automated unit tests
├── data/
│   ├── retailers.json          # 5 Retailer accounts & catalogs
│   ├── customers.json          # 6 Kenyan customer profiles
│   ├── dispatchers.json        # Fleet couriers & vehicle registry
│   └── orders.json             # Delivery ledger & status store
├── static/
│   ├── css/
│   │   └── style.css           # Modern dark glassmorphism styling
│   └── js/
│       └── app.js              # State management & interactive dashboard logic
├── templates/
│   └── index.html              # HTML5 single-page application
└── README.md                   # System documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.9+ installed
- Pip package manager

### 2. Installation
```bash
git clone https://github.com/AnnNjeriWangui/DispatchHub.git
cd DispatchHub
pip install -r requirements.txt
```

### 3. Run the Server
```bash
python app.py
```
Open your browser and navigate to: **`http://127.0.0.1:5000`**

### 4. Run Automated Tests
```bash
python test_app.py
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and server timestamp |
| `GET` | `/api/retailers` | Get list of all 5 pre-configured retailers |
| `GET` | `/api/customers` | Get list of 6 Kenyan customer profiles |
| `GET` | `/api/metrics?retailer_id=RET-001` | Live metrics counters for specified store |
| `GET` | `/api/orders?retailer_id=...&status=...&q=...` | Filtered orders queue list |
| `GET` | `/api/orders/search?order_number=...` | Quick search lookup for order & driver details |
| `POST` | `/api/orders` | Create new delivery request (auto stamps & assigns) |
| `PUT` | `/api/orders/<order_number>` | Update customer and item details prior to delivery |
| `DELETE` | `/api/orders/<order_number>` | Cancel or remove delivery request |
| `POST` | `/api/orders/<order_number>/advance` | Advance status (*Pending → In Transit → Delivered*) |
