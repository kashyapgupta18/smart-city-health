const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vitals: {
    blood_pressure_sys: { type: Number },
    blood_pressure_dia: { type: Number },
    pulse: { type: Number },
    temperature: { type: Number },
    spo2: { type: Number },
    blood_sugar: { type: Number },
    weight: { type: Number }
  },
  symptoms: [String],
  diagnosis: { type: String, default: '' },
  prescription: { type: String, default: '' },
  recorded_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
