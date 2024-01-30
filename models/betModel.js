const mongoose = require('mongoose');

module.exports.betModel = new mongoose.Schema({
  mobileNumber: { type: String, required: true },
      numbers: [{ type: Number, min: 1, max: 21 }],
      coinsBetted: [{ number: { type: Number, min: 1, max: 21 }, coin: { type: Number } }]
});


//module.exports = mongoose.model('BetModel', betModel);

 