const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    const full_name = String(req.body.full_name || '').trim();
    const abha_id = String(req.body.abha_id || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = String(req.body.role || 'patient');
    const phone = String(req.body.phone || '').trim();

    if (!full_name || !abha_id || !email || !password) {
      return res.json({ success: false, message: 'All fields are required' });
    }
    const existing = await User.findOne({ $or: [{ abha_id }, { email }] });
    if (existing) return res.json({ success: false, message: 'ABHA ID or Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const allowedRoles = ['patient', 'doctor', 'ambulance_driver', 'traffic_controller'];
    const user = new User({ full_name, abha_id, email, password: hashed, role: allowedRoles.includes(role) ? role : 'patient', phone });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'health_highway_secret', { expiresIn: '24h' });
    res.json({ success: true, user: { id: user._id, full_name, abha_id, email, role: user.role, phone: user.phone }, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const abha_id = String(req.body.abha_id || '').trim();
    const password = String(req.body.password || '');
    if (!abha_id || !password) return res.json({ success: false, message: 'ABHA ID and password required' });

    const user = await User.findOne({ abha_id });
    if (!user) return res.json({ success: false, message: 'ABHA ID not found' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.json({ success: false, message: 'Invalid password' });

    await User.findByIdAndUpdate(user._id, { is_online: true });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'health_highway_secret', { expiresIn: '24h' });

    res.json({
      success: true,
      user: { id: user._id, full_name: user.full_name, abha_id: user.abha_id, email: user.email, role: user.role, phone: user.phone },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Get all users (for chat user list)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'full_name abha_id role is_online last_seen phone');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const user_id = String(req.body.user_id || '').trim();
    if (user_id && isValidObjectId(user_id)) {
      await User.findByIdAndUpdate(user_id, { is_online: false, last_seen: new Date() });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
