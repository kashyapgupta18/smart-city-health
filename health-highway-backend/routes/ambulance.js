const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose');
const AmbulanceRequest = require('../models/AmbulanceRequest');

// AI Triage score helper (unique feature)
function calculateTriageScore(emergency_type, symptoms) {
  const weights = { cardiac: 10, stroke: 9, accident: 8, fracture: 5, other: 3 };
  let score = weights[emergency_type] || 3;
  if (symptoms && symptoms.includes('unconscious')) score += 5;
  if (symptoms && symptoms.includes('bleeding')) score += 4;
  if (symptoms && symptoms.includes('chest_pain')) score += 4;
  return Math.min(score, 15);
}

// Create ambulance request
router.post('/request', async (req, res) => {
  try {
    const patient_id = String(req.body.patient_id || '').trim();
    const pickup_address = String(req.body.pickup_address || 'Current Location').trim();
    const emergency_type = String(req.body.emergency_type || 'other').trim();
    const pickup_lat = parseFloat(req.body.pickup_lat) || 28.565;
    const pickup_lng = parseFloat(req.body.pickup_lng) || 77.209;
    const symptoms = Array.isArray(req.body.symptoms) ? req.body.symptoms.map(s => String(s)) : [];
    const destination_hospital = req.body.destination_hospital && isValidObjectId(String(req.body.destination_hospital))
      ? String(req.body.destination_hospital)
      : null;

    if (!patient_id || !isValidObjectId(patient_id)) return res.json({ success: false, message: 'Valid patient ID required' });

    const triage = calculateTriageScore(emergency_type, symptoms);
    const eta = Math.floor(5 + Math.random() * 15);

    const request = new AmbulanceRequest({
      patient_id,
      pickup_address,
      pickup_location: { coordinates: [pickup_lng, pickup_lat] },
      destination_hospital,
      emergency_type: ['cardiac', 'accident', 'stroke', 'fracture', 'other'].includes(emergency_type) ? emergency_type : 'other',
      eta_minutes: eta,
      current_location: { coordinates: [pickup_lng, pickup_lat] },
      triage_score: triage
    });
    await request.save();

    const populated = await AmbulanceRequest.findById(request._id)
      .populate('patient_id', 'full_name phone')
      .populate('destination_hospital', 'name address');

    res.json({ success: true, message: `Ambulance dispatched! ETA: ${eta} mins`, request: populated, triage_score: triage });
  } catch (err) {
    console.error('Ambulance request error:', err);
    res.status(500).json({ success: false, message: 'Failed to dispatch ambulance' });
  }
});

// Get all active requests
router.get('/requests', async (req, res) => {
  try {
    const requests = await AmbulanceRequest.find({})
      .populate('patient_id', 'full_name phone abha_id')
      .populate('destination_hospital', 'name address')
      .populate('driver_id', 'full_name phone')
      .sort({ created_at: -1 })
      .limit(50);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get requests for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.patientId)) return res.status(400).json({ message: 'Invalid patient ID' });
    const requests = await AmbulanceRequest.find({ patient_id: req.params.patientId })
      .populate('destination_hospital', 'name address')
      .sort({ created_at: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status / assign driver
router.put('/requests/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid request ID' });
    const validStatuses = ['pending', 'assigned', 'en_route', 'arrived', 'completed', 'cancelled'];
    const update = {};
    if (req.body.status && validStatuses.includes(String(req.body.status))) {
      update.status = String(req.body.status);
    }
    if (req.body.driver_id && isValidObjectId(String(req.body.driver_id))) {
      update.driver_id = String(req.body.driver_id);
    }
    if (req.body.eta_minutes !== undefined) {
      update.eta_minutes = parseInt(req.body.eta_minutes, 10);
    }
    const request = await AmbulanceRequest.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('patient_id', 'full_name phone')
      .populate('destination_hospital', 'name address');
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
