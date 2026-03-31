# 🏥 Smart City Health Highway

A full-stack real-time healthcare platform for smart cities.

**Stack:** React (Frontend) · Node.js + Express (Backend) · MongoDB (Database) · Socket.IO (Real-time)

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🔐 ABHA Login & Register | Role-based auth (Patient, Doctor, Ambulance Driver, Traffic Controller, Admin) |
| 🗺️ Live Hospital Map | Leaflet map with real-time bed availability, ICU beds, book from map |
| 🚑 Ambulance Booking | Dispatch ambulance with emergency type, AI triage score, panic button |
| 💬 Real-time Chat | Multi-room (General, Emergency, Staff, Traffic) + Direct Messages via Socket.IO |
| 📊 Live Dashboard | Real-time stats, bed availability charts, occupancy analytics |
| ❤️ Health Monitor | Patient vitals recording, trend charts, live vitals broadcast |
| 📋 Booking History | View/cancel bookings, admin can see all bookings |
| 🚨 Panic Button | One-tap emergency broadcast to all connected users |
| 🧠 AI Triage Simulator | Auto-calculates emergency severity score based on type + symptoms |
| 🚦 Traffic Override | Signal override alerts broadcast via Socket.IO |

---

## 📂 Project Structure

```
smart-city-health/
├── health-highway-backend/     # Node.js + Express + MongoDB
│   ├── models/                 # Mongoose models
│   │   ├── User.js
│   │   ├── Hospital.js
│   │   ├── Booking.js
│   │   ├── AmbulanceRequest.js
│   │   ├── Message.js
│   │   └── HealthRecord.js
│   ├── routes/                 # Express routes
│   │   ├── auth.js
│   │   ├── hospitals.js
│   │   ├── bookings.js
│   │   ├── ambulance.js
│   │   ├── chat.js
│   │   ├── health.js
│   │   └── dashboard.js
│   ├── server.js               # Main server + Socket.IO
│   ├── db.js                   # MongoDB connection
│   └── .env                    # Environment variables
│
└── health-highway-frontend/    # React app
    └── src/
        ├── components/
        │   ├── Navbar.js
        │   ├── AlertBanner.js
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── Dashboard.js
        │   ├── MapPage.js
        │   ├── ChatPage.js
        │   ├── AmbulancePage.js
        │   ├── BookingHistory.js
        │   └── HealthMonitor.js
        ├── App.js
        └── config.js
```

---

## ⚙️ Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd health-highway-backend
# Install dependencies
npm install
# Configure .env
# MONGODB_URI=mongodb://localhost:27017/health_highway
# PORT=5000
# JWT_SECRET=your_secret_key
npm start
```

> The server auto-seeds 5 Delhi hospitals and 5 demo users on first run.

### Frontend

```bash
cd health-highway-frontend
npm install
npm start
```

Frontend runs on http://localhost:3000 and proxies API calls to http://localhost:5000.

---

## 👤 Demo Accounts

| Role | ABHA ID | Password |
|---|---|---|
| Patient | 91-8888-7777-1234 | password123 |
| Doctor | 91-1111-2222-3333 | doctor123 |
| Ambulance Driver | 91-4444-5555-6666 | driver123 |
| Traffic Controller | 91-7777-8888-9999 | traffic123 |
| Admin | 91-0000-0000-0000 | admin123 |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with ABHA ID |
| GET | `/api/hospitals` | Get all hospitals |
| POST | `/api/bookings` | Book hospital bed |
| GET | `/api/bookings/user/:id` | Get user's bookings |
| PUT | `/api/bookings/:id/cancel` | Cancel booking |
| POST | `/api/ambulance/request` | Request ambulance |
| GET | `/api/ambulance/requests` | Get all requests |
| GET | `/api/chat/messages/:room` | Get chat history |
| POST | `/api/health/vitals` | Save vitals |
| GET | `/api/dashboard/stats` | Dashboard statistics |

## 🔌 Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `user_join` | Client → Server | User goes online |
| `join_room` | Client → Server | Join chat room |
| `chat_message` | Bidirectional | Send/receive chat |
| `panic_alert` | Bidirectional | Emergency panic broadcast |
| `emergency_alert` | Bidirectional | Emergency broadcast |
| `ambulance_location` | Server → Client | Live GPS tracking |
| `ambulance_update` | Client → Server | Driver updates GPS |
| `bed_update` | Bidirectional | Real-time bed availability |
| `vitals_update` | Bidirectional | Patient vitals broadcast |
| `traffic_override` | Bidirectional | Traffic signal control |
| `online_users` | Server → Client | Online users list |
