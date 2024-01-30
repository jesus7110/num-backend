const mongoose = require('mongoose');

const gameRoomSchema = new mongoose.Schema({
  gameId: { type: Number, required: true },
  bets: [
    {
      mobileNumber: { type: String, required: true },
      numbers: [{ type: Number, min: 1, max: 21 }],
      amount: { type: Number },
      coinsBetted: [{ number: { type: Number, min: 1, max: 21 }, coin: { type: Number } }],
    }
  ],
});

module.exports = mongoose.model('GameRoom', gameRoomSchema);
