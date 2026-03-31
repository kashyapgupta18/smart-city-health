const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const Booking = require('../models/Booking');
const AmbulanceRequest = require('../models/AmbulanceRequest');
const User = require('../models/User');

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [hospitals, activeBookings, activeAmbulances, totalUsers] = await Promise.all([
      Hospital.find({}, 'name type available_beds total_beds icu_beds available_icu'),
      Booking.countDocuments({ status: 'confirmed' }),
      AmbulanceRequest.countDocuments({ status: { $in: ['pending', 'assigned', 'en_route'] } }),
      User.countDocuments()
    ]);

    const totalBeds = hospitals.reduce((s, h) => s + (h.total_beds || 0), 0);
    const availableBeds = hospitals.reduce((s, h) => s + (h.available_beds || 0), 0);
    const totalIcu = hospitals.reduce((s, h) => s + (h.icu_beds || 0), 0);
    const availableIcu = hospitals.reduce((s, h) => s + (h.available_icu || 0), 0);

    res.json({
      hospitals,
      stats: {
        total_hospitals: hospitals.length,
        total_beds: totalBeds,
        available_beds: availableBeds,
        total_icu: totalIcu,
        available_icu: availableIcu,
        occupancy_rate: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
        active_bookings: activeBookings,
        active_ambulances: activeAmbulances,
        total_users: totalUsers
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
