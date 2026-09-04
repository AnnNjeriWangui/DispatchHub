# 🚀 DispatchHub & Reflex Logistics OS

**DispatchHub** is an intelligent multi-retailer last-mile delivery and dispatch management engine engineered for Kenya (Nairobi metropolitan area). It interconnects the primary delivery stakeholders:

1. **🏪 Retailer Staff** (`/`): Logs new delivery requests with customer details, item descriptions, and special handling instructions.
2. **🎯 Central Dispatcher** (`/dispatcher`): Automated command center that monitors open requests in real-time, auto-matches orders to riders using smart zone proximity and battery level algorithms, monitors live fleet telematics, and coordinates QR confirmations.
3. **⚡ EV Delivery Rider** (`/rider`): Sees assigned deliveries on mobile-first interface and progresses status (*Assigned → Picked Up → In Transit → Delivered*).
4. **🔍 Public Customer Tracker** (`/track`): Real-time public tracking with live progress timeline, assigned rider contacts, receipt breakdown, Cash on Delivery (COD), and handover verification PIN.

---

## 👥 Core Contributors & Collaborators

This project is built and maintained collaboratively by:

- **👑 Lead / Retailer Portal Architect**: [Ann Njeri Wangui](https://github.com/AnnNjeriWangui) — [DispatchHub Repository](https://github.com/AnnNjeriWangui/DispatchHub)
- **⚡ EV Fleet & Dispatcher Architect**: [Davis Nguthu](https://github.com/davisnguthu-tech) — [davisnguthu-tech Profile](https://github.com/davisnguthu-tech)
- **🚀 Logistics Engine & Cloud Systems**: [Justolise](https://github.com/justolise) — [justolise Profile](https://github.com/justolise)

---

## 🌟 4-Portal Interconnected Architecture

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

## 🏬 Pre-Configured Retailer Profiles (`data/retailers.json`)

| Retailer ID | Store Name | Owner & Phone | Location | Category |
| :--- | :--- | :--- | :--- | :--- |
| **RET-001** | **Savanna Blooms & Florist** | Evelyn Mutua (`+254 712 345 678`) | Westlands, Nairobi | Fresh Florals & Gifts |
| **RET-002** | **Rift Valley Artisan Crafts** | Kiprono Koech (`+254 722 987 654`) | Karen, Nairobi | Handicrafts & Leatherwear |
| **RET-003** | **Nairobi Tech & Gadgets Hub** | Brian Omondi (`+254 733 456 789`) | Moi Avenue, CBD | Consumer Electronics |
| **RET-004** | **Organic Fresh Basket** | Amina Wanjiru (`+254 745 112 233`) | Lavington, Nairobi | Farm-Fresh Produce & Oils |
| **RET-005** | **Urban Books & Stationery** | David Njoroge (`+254 754 889 001`) | Ruaka, Kiambu | Books & Stationery |

---

## 👥 Kenyan Customer Profiles Dataset (`data/customers.json`)

Organized with 5 dedicated Kenyan customers per retailer:

### 🌸 Savanna Blooms & Florist (`RET-001` - Westlands)
1. **Wanjiku Kimani** — `+254 711 234 567` (Silver Oak Heights, Argwings Kodhek Rd, Kilimani, Nairobi)
2. **Juma Mwangi** — `+254 723 456 789` (Diamond Plaza Annex, 4th Parklands Avenue, Parklands, Nairobi)
3. **Faith Chebet** — `+254 734 567 890` (Villa 12, Acacia Court, Mandera Road, Kileleshwa, Nairobi)
4. **Amara Njoroge** — `+254 778 001 234` (Flat 7A, Lavington Green Apartments, James Gichuru Road, Lavington, Nairobi)
5. **Linet Wanjiru** — `+254 701 334 567` (Plot 18, Runda Mimosa, Runda Estate, Nairobi)

### 🏺 Rift Valley Artisan Crafts (`RET-002` - Karen)
6. **Silas Kiprop** — `+254 789 112 345` (House 9B, Karen Plains, Marist Road, Karen, Nairobi)
7. **Brian Kiprono** — `+254 724 556 789` (Cottage 4, Hardy Manor, Bogani East Road, Karen, Nairobi)
8. **Collins Cheruiyot** — `+254 768 990 123` (Villa 5, Langata Ridge Estate, Mokoyeti West Rd, Langata, Nairobi)
9. **Sharon Chepchumba** — `+254 715 882 101` (House 27, Windy Ridge, Dagoretti Road, Karen, Nairobi)
10. **Wesley Kiprotich** — `+254 729 443 652` (Apt 14, Galleria View Suites, Langata South Road, Karen, Nairobi)

### ⚡ Nairobi Tech & Gadgets Hub (`RET-003` - Moi Avenue CBD)
11. **Kevin Otieno** — `+254 745 678 901` (7th Floor, Britam Tower, Hospital Road, Upper Hill, Nairobi)
12. **Omar Sheikh** — `+254 712 445 678` (Floor 4, Jubilee Insurance House, Wabera Street, Nairobi CBD)
13. **Victor Omondi** — `+254 746 778 901` (Office 12B, Mirage Towers, Chiromo Road, Westlands, Nairobi)
14. **Kennedy Odhiambo** — `+254 731 229 883` (Floor 10, ICEA Lion Centre, Riverside Park, Chiromo, Nairobi)
15. **Maureen Anyango** — `+254 748 651 902` (Block B-402, Kilimani Palms, Wood Avenue, Kilimani, Nairobi)

### 🥑 Organic Fresh Basket (`RET-004` - Lavington)
16. **Mercy Achieng** — `+254 756 789 012` (House No. 45, Golden Gate Estate, South B, Nairobi)
17. **Zara Abdi** — `+254 790 223 456` (Penthouse 8, Riverside Pearl, Riverside Drive, Nairobi)
18. **Halima Mohammed** — `+254 735 667 890` (Apt 12, South C Winners Court, Muhoho Avenue, South C, Nairobi)
19. **Joy Mutua** — `+254 733 987 654` (Greenwood Court, Marcus Garvey Rd, Kilimani, Nairobi)
20. **Beatrice Ndunge** — `+254 718 349 012` (Villa 8, Lavington Hill, James Gichuru Road, Lavington, Nairobi)

### 📚 Urban Books & Stationery (`RET-005` - Ruaka Kiambu)
21. **Dennis Mutiso** — `+254 767 890 123` (Block C-204, Garden City Residences, Exit 7 Thika Road, Nairobi)
22. **Esther Nekesa** — `+254 757 889 012` (House 33, Rosslyn Green Valley, Limuru Road, Nairobi)
23. **David Macharia** — `+254 721 903 445` (Apt 5B, Two Rivers Riverbank, Limuru Road, Ruaka, Kiambu)
24. **Grace Nyambura** — `+254 705 612 874` (Villa 19, Joyland Estate, Ruaka-Banana Road, Ruaka, Kiambu)
25. **Peter Kariuki** — `+254 711 554 433` (House 12, Mvuli Road, Lavington, Nairobi)

---

## ☁️ Deploying to Vercel

DispatchHub is pre-configured with serverless WSGI routing via `vercel.json` and `api/index.py`.

### Option A: 1-Click GitHub Integration (Recommended)
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import **`https://github.com/AnnNjeriWangui/DispatchHub`**.
3. Leave root directory as `./` and framework as **Other**.
4. Click **Deploy**. Vercel will automatically detect `api/index.py` and `requirements.txt`.

### Option B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🛠️ REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Retailer Logistics Portal |
| `GET` | `/dispatcher` | Dispatcher Command Center |
| `GET` | `/rider` | Rider Portal |
| `GET` | `/track` | Public Customer Order Tracking |
| `GET` | `/api/health` | Service health & timestamp |
| `GET` | `/api/retailers` | List all 5 retailer profiles |
| `GET` | `/api/customers` | List 6 Kenyan customer profiles |
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

## 🚀 Running Locally & Testing

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run automated test suite (All 10 tests)
python test_app.py

# 3. Start DispatchHub
python app.py
```

Server runs on: **`http://127.0.0.1:5000`**
