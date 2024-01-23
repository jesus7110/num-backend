const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
  },
  gameId: {
    type: Number,
    unique: true, 
    required: true
  },
  numbers: [{ type: Number, min: 1, max: 21 }],
  coinsBetted: [{ number: { type: Number, min: 1, max: 21 }, coin: { type: Number } }],
  createdAt: { type: Date, default: Date.now },
});

// Ensure each user can only bet once per game
betSchema.index({ mobileNumber: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Bet', betSchema);

 