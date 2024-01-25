const mongoose = require('mongoose');

const gameRoomSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  bids: [
    {
      mobileNumber: { type: String, required: true },
      numbers: [{ type: Number, min: 1, max: 21 }],
      coinsBetted: [{ number: { type: Number, min: 1, max: 21 }, coin: { type: Number } }],
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GameRoom', gameRoomSchema);
