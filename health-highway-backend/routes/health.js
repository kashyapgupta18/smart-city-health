const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose');
const HealthRecord = require('../models/HealthRecord');

// Record vitals
router.post('/vitals', async (req, res) => {
  try {
    const patient_id = String(req.body.patient_id || '').trim();
    if (!patient_id || !isValidObjectId(patient_id)) return res.json({ success: false, message: 'Valid patient ID required' });

    const vitals = req.body.vitals && typeof req.body.vitals === 'object' ? req.body.vitals : {};
    const symptoms = Array.isArray(req.body.symptoms) ? req.body.symptoms.map(s => String(s)) : [];
    const diagnosis = String(req.body.diagnosis || '');
    const prescription = String(req.body.prescription || '');
    const doctor_id = req.body.doctor_id && isValidObjectId(String(req.body.doctor_id)) ? String(req.body.doctor_id) : undefined;

    const record = new HealthRecord({ patient_id, doctor_id, vitals, symptoms, diagnosis, prescription });
    await record.save();
    res.json({ success: true, record });
  } catch (err) {
    console.error('Health record error:', err);
    res.status(500).json({ success: false, message: 'Failed to save health record' });
  }
});

// Get patient health records
router.get('/patient/:patientId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.patientId)) return res.status(400).json({ message: 'Invalid patient ID' });
    const records = await HealthRecord.find({ patient_id: req.params.patientId })
      .sort({ recorded_at: -1 })
      .limit(20);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
