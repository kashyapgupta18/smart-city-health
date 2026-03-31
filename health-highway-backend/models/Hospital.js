const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'Government' },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  available_beds: { type: Number, default: 0 },
  total_beds: { type: Number, default: 0 },
  icu_beds: { type: Number, default: 0 },
  available_icu: { type: Number, default: 0 },
  specialties: [String],
  contact: { type: String, default: '' },
  address: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now }
});

hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
