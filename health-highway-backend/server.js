const express = require('express');
const cors = require('cors');
const pool = require('./db');
const http = require('http');
const { Server } = require("socket.io");
const nodemailer = require('nodemailer'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- 1. MOCK EMAIL CONFIGURATION (Using Ethereal for testing) ---
// This acts like a real email server but prints the URL to console so you can see the "sent" email.
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'ethereal.user@ethereal.email', // Dummy creds (will generate errors if invalid, but fine for simulation)
        pass: 'dummy-password' 
    }
});

// --- 2. AUTHENTICATION API (Simulate ABHA Login) ---
app.post('/api/login', async (req, res) => {
    const { abha_id, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE abha_id = $1', [abha_id]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            // Simple password check
            if (user.password_hash === password) {
                res.json({ success: true, user: user });
            } else {
                res.json({ success: false, message: "Invalid Password" });
            }
        } else {
            res.json({ success: false, message: "ABHA ID not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Login Server Error");
    }
});

// --- 3. GET HOSPITALS (Dynamic Location) ---
app.get('/api/hospitals', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        let query;
        if (lat && lng) {
             // Find Nearest
             query = `SELECT id, name, type, available_beds, total_beds, icu_beds,
              ST_AsGeoJSON(location)::json as location, 
              ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters
              FROM hospitals ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)`;
             const result = await pool.query(query, [lng, lat]);
             res.json(result.rows);
        } else {
             // Get All
             query = `SELECT id, name, type, available_beds, total_beds, ST_AsGeoJSON(location)::json as location FROM hospitals`;
             const result = await pool.query(query);
             res.json(result.rows);
        }
    } catch (err) { res.status(500).send("Server Error"); }
});

// --- 4. BOOK BED WITH SIMULATED EMAIL ---
app.post('/api/book', async (req, res) => {
    const client = await pool.connect();
    try {
        const { hospital_id, user_id, email } = req.body;
        await client.query('BEGIN');

        // Check Availability
        const check = await client.query('SELECT available_beds, name FROM hospitals WHERE id = $1', [hospital_id]);
        if (check.rows[0].available_beds <= 0) {
            await client.query('ROLLBACK');
            return res.json({ success: false, message: "No beds available" });
        }

        // Decrement Bed
        await client.query('UPDATE hospitals SET available_beds = available_beds - 1 WHERE id = $1', [hospital_id]);
        
        // Create Booking Record
        const token = "BK-" + Math.floor(1000 + Math.random() * 9000); 
        await client.query('INSERT INTO bookings (hospital_id, user_id, booking_token) VALUES ($1, $2, $3)', [hospital_id, user_id, token]);
        
        await client.query('COMMIT');

        console.log(`✅ SIMULATION: Email sent to Patient. Token: ${token}`);
        res.json({ success: true, message: `Bed Booked! Token: ${token}`, token: token });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send("Booking Failed");
    } finally {
        client.release();
    }
});

// --- 5. REAL-TIME AMBULANCE ---
let ambulancePos = { lat: 28.565, lng: 77.209 }; 
io.on('connection', (socket) => {
  const interval = setInterval(() => {
    ambulancePos.lat += 0.0001; 
    ambulancePos.lng += 0.0001;
    socket.emit('ambulance_location', ambulancePos);
  }, 2000);
  socket.on('disconnect', () => clearInterval(interval));
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Major Project Server running on port ${PORT}`);
});