const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const connectDB = require('./db');
const Message = require('./models/Message');
const Hospital = require('./models/Hospital');
const AmbulanceRequest = require('./models/AmbulanceRequest');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB and seed data
connectDB().then(() => seedDatabase());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
});

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/ambulance', require('./routes/ambulance'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/health', require('./routes/health'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/', (req, res) => res.json({ status: '🚀 Smart City Health Highway API running' }));

// --- Real-time Socket.IO ---
const onlineUsers = new Map(); // socketId -> { userId, name, role }

io.on('connection', (socket) => {
  // User goes online
  socket.on('user_join', async ({ userId, name, role }) => {
    onlineUsers.set(socket.id, { userId, name, role });
    try { await User.findByIdAndUpdate(userId, { is_online: true }); } catch (_) {}
    io.emit('online_users', Array.from(onlineUsers.values()));
  });

  // Join a chat room
  socket.on('join_room', (room) => {
    socket.join(room);
  });

  // Chat message (persisted to MongoDB)
  socket.on('chat_message', async ({ sender_id, sender_name, sender_role, room, content, message_type }) => {
    try {
      const msg = new Message({
        sender_id,
        sender_name,
        sender_role: sender_role || 'patient',
        room,
        content,
        message_type: message_type || 'text'
      });
      await msg.save();
      io.to(room).emit('chat_message', {
        _id: msg._id,
        sender_id,
        sender_name,
        sender_role: msg.sender_role,
        room,
        content,
        message_type: msg.message_type,
        timestamp: msg.timestamp
      });
    } catch (err) {
      console.error('Chat save error:', err.message);
    }
  });

  // Panic / Emergency alert (broadcast to all)
  socket.on('panic_alert', (data) => {
    io.emit('panic_alert', { ...data, timestamp: new Date() });
  });

  // Emergency alert broadcast
  socket.on('emergency_alert', (data) => {
    io.emit('emergency_alert', { ...data, timestamp: new Date() });
  });

  // Ambulance GPS location update
  socket.on('ambulance_update', async ({ requestId, lat, lng }) => {
    try {
      if (requestId) {
        await AmbulanceRequest.findByIdAndUpdate(requestId, {
          current_location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }
        });
      }
      io.emit('ambulance_location', { requestId, lat, lng, timestamp: new Date() });
    } catch (err) {
      console.error('Ambulance update error:', err.message);
    }
  });

  // Real-time bed update broadcast
  socket.on('bed_update', async ({ hospitalId }) => {
    try {
      const hospital = await Hospital.findById(hospitalId);
      if (hospital) {
        io.emit('bed_update', {
          hospitalId,
          available_beds: hospital.available_beds,
          available_icu: hospital.available_icu,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('Bed update error:', err.message);
    }
  });

  // Patient vitals monitoring broadcast
  socket.on('vitals_update', (data) => {
    io.emit('vitals_update', { ...data, timestamp: new Date() });
  });

  // Traffic signal override (unique feature)
  socket.on('traffic_override', (data) => {
    io.emit('traffic_override', { ...data, timestamp: new Date() });
  });

  socket.on('disconnect', async () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      try { await User.findByIdAndUpdate(user.userId, { is_online: false, last_seen: new Date() }); } catch (_) {}
      onlineUsers.delete(socket.id);
      io.emit('online_users', Array.from(onlineUsers.values()));
    }
  });
});

// Simulate ambulance movement for demo purposes (disable in production via DEMO_MODE=false)
if (process.env.DEMO_MODE !== 'false') {
  const demoInterval = setInterval(() => {
    const demoPos = {
      lat: 28.565 + (Math.random() - 0.5) * 0.05,
      lng: 77.209 + (Math.random() - 0.5) * 0.05
    };
    io.emit('ambulance_location', { requestId: 'demo', ...demoPos, timestamp: new Date() });
  }, 4000);

  process.on('SIGTERM', () => clearInterval(demoInterval));
  process.on('SIGINT', () => clearInterval(demoInterval));
}

// --- Seed initial data ---
async function seedDatabase() {
  try {
    const hospitalCount = await Hospital.countDocuments();
    if (hospitalCount === 0) {
      await Hospital.insertMany([
        { name: 'AIIMS Delhi', type: 'Government', location: { coordinates: [77.2090, 28.5672] }, available_beds: 45, total_beds: 200, icu_beds: 30, available_icu: 8, specialties: ['Cardiology', 'Neurology', 'Oncology'], address: 'Ansari Nagar, New Delhi', contact: '011-26588500' },
        { name: 'Safdarjung Hospital', type: 'Government', location: { coordinates: [77.2000, 28.5683] }, available_beds: 30, total_beds: 150, icu_beds: 20, available_icu: 5, specialties: ['Emergency', 'Surgery', 'Pediatrics'], address: 'Safdarjung, New Delhi', contact: '011-26730000' },
        { name: 'Apollo Hospital Delhi', type: 'Private', location: { coordinates: [77.2855, 28.5538] }, available_beds: 15, total_beds: 100, icu_beds: 15, available_icu: 3, specialties: ['Cardiology', 'Orthopedics'], address: 'Sarita Vihar, New Delhi', contact: '011-71791090' },
        { name: 'Max Super Specialty', type: 'Private', location: { coordinates: [77.2273, 28.5274] }, available_beds: 22, total_beds: 120, icu_beds: 18, available_icu: 6, specialties: ['Neurosciences', 'Oncology'], address: 'Saket, New Delhi', contact: '011-26515050' },
        { name: 'GTB Hospital', type: 'Government', location: { coordinates: [77.3058, 28.6869] }, available_beds: 50, total_beds: 180, icu_beds: 25, available_icu: 10, specialties: ['General Medicine', 'Surgery'], address: 'Dilshad Garden, New Delhi', contact: '011-22581716' }
      ]);
      console.log('✅ Hospitals seeded');
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const hash = (p) => bcrypt.hash(p, 10);
      await User.insertMany([
        { full_name: 'Dr. Admin', abha_id: '91-0000-0000-0000', email: 'admin@health.gov', password: await hash('admin123'), role: 'admin', phone: '9999999999' },
        { full_name: 'Test Patient', abha_id: '91-8888-7777-1234', email: 'patient@test.com', password: await hash('password123'), role: 'patient', phone: '8888777712' },
        { full_name: 'Dr. Sharma', abha_id: '91-1111-2222-3333', email: 'doctor@aiims.com', password: await hash('doctor123'), role: 'doctor', phone: '7777333311' },
        { full_name: 'Ambulance Driver Raj', abha_id: '91-4444-5555-6666', email: 'driver@ambulance.com', password: await hash('driver123'), role: 'ambulance_driver', phone: '9876543210' },
        { full_name: 'Traffic Control Unit 1', abha_id: '91-7777-8888-9999', email: 'traffic@delhi.gov', password: await hash('traffic123'), role: 'traffic_controller', phone: '9111222233' }
      ]);
      console.log('✅ Demo users seeded');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Smart City Health Highway Server running on port ${PORT}`);
});