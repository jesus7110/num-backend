const mongoose = require('mongoose');
const sequencegameSchema = new mongoose.Schema({
    gameId: { type: Number, unique: true, required: true },
    checkInTime: { type: Date, required: true },
    startTime: { type: Date, required: true },
  
});

module.exports = mongoose.model('Sequencegame', sequencegameSchema);
