const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    unique: true,
  },
  gameId: {
    type: Number,
    required: true
  },
  numbers: [{ type: Number, min: 1, max: 21 }],
  coinsBetted: [{ number: { type: Number, min: 1, max: 21 }, coin: { type: Number } }],
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Bet', betSchema);

 