const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get messages for a room (last 60)
router.get('/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ timestamp: -1 })
      .limit(60);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get DM messages between two users
router.get('/dm/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const room = [userId1, userId2].sort().join('-');
    const messages = await Message.find({ room })
      .sort({ timestamp: -1 })
      .limit(60);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
