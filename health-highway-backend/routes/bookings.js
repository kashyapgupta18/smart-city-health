const express = require('express');
const router = express.Router();
const { isValidObjectId } = require('mongoose');
const Booking = require('../models/Booking');
const Hospital = require('../models/Hospital');

// Create booking
router.post('/', async (req, res) => {
  try {
    const hospital_id = String(req.body.hospital_id || '').trim();
    const user_id = String(req.body.user_id || '').trim();
    const bed_type = String(req.body.bed_type || 'general').trim();

    if (!hospital_id || !user_id) return res.json({ success: false, message: 'Missing required fields' });
    if (!isValidObjectId(hospital_id) || !isValidObjectId(user_id)) {
      return res.json({ success: false, message: 'Invalid ID format' });
    }

    const hospital = await Hospital.findById(hospital_id);
    if (!hospital) return res.json({ success: false, message: 'Hospital not found' });

    const requestedType = bed_type || 'general';
    if (requestedType === 'icu') {
      if (hospital.available_icu <= 0) return res.json({ success: false, message: 'No ICU beds available' });
      hospital.available_icu -= 1;
    } else {
      if (hospital.available_beds <= 0) return res.json({ success: false, message: 'No general beds available' });
      hospital.available_beds -= 1;
    }
    hospital.updated_at = new Date();
    await hospital.save();

    const token = 'BK-' + Math.floor(1000 + Math.random() * 9000);
    const booking = new Booking({ patient_id: user_id, hospital_id, booking_token: token, bed_type: requestedType });
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id).populate('hospital_id', 'name type address contact');
    res.json({ success: true, message: `Bed Booked! Token: ${token}`, token, booking: populatedBooking });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ success: false, message: 'Booking failed' });
  }
});

// Get all bookings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.userId)) return res.status(400).json({ message: 'Invalid user ID' });
    const bookings = await Booking.find({ patient_id: req.params.userId })
      .populate('hospital_id', 'name type address contact')
      .sort({ created_at: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all bookings (admin)
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('patient_id', 'full_name abha_id phone')
      .populate('hospital_id', 'name type')
      .sort({ created_at: -1 })
      .limit(100);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel booking
router.put('/:id/cancel', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking ID' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') return res.json({ success: false, message: 'Already cancelled' });

    booking.status = 'cancelled';
    await booking.save();

    // Return the bed
    const update = booking.bed_type === 'icu'
      ? { $inc: { available_icu: 1 }, updated_at: new Date() }
      : { $inc: { available_beds: 1 }, updated_at: new Date() };
    await Hospital.findByIdAndUpdate(booking.hospital_id, update);

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
