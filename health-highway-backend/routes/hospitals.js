const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose');
const Hospital = require('../models/Hospital');

// Get all hospitals (with optional near-location filter)
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    let hospitals;
    if (lat && lng) {
      hospitals = await Hospital.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: 100000
          }
        }
      });
    } else {
      hospitals = await Hospital.find({});
    }
    res.json(hospitals);
  } catch (err) {
    console.error('Hospitals error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single hospital
router.get('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid hospital ID' });
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update bed counts
router.put('/:id/beds', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid hospital ID' });
    const available_beds = parseInt(req.body.available_beds, 10);
    const available_icu = parseInt(req.body.available_icu, 10);
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { available_beds, available_icu, updated_at: new Date() },
      { new: true }
    );
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
