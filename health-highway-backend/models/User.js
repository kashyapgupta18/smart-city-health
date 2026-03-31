const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  abha_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'ambulance_driver', 'traffic_controller', 'admin'],
    default: 'patient'
  },
  phone: { type: String, default: '' },
  is_online: { type: Boolean, default: false },
  last_seen: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
