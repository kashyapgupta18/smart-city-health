const mongoose = require('mongoose');

const ambulanceRequestSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickup_address: { type: String, default: '' },
  pickup_location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [77.209, 28.565] }
  },
  destination_hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled'],
    default: 'pending'
  },
  emergency_type: {
    type: String,
    enum: ['cardiac', 'accident', 'stroke', 'fracture', 'other'],
    default: 'other'
  },
  eta_minutes: { type: Number, default: 10 },
  current_location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [77.209, 28.565] }
  },
  triage_score: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AmbulanceRequest', ambulanceRequestSchema);
