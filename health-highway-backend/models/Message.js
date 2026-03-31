const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender_name: { type: String, required: true },
  sender_role: { type: String, default: 'patient' },
  room: { type: String, required: true },
  content: { type: String, required: true },
  message_type: {
    type: String,
    enum: ['text', 'alert', 'location', 'system'],
    default: 'text'
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
