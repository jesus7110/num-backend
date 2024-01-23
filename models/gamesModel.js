const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameId: { type: Number,unique: true, required: true },
    checkInTime: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);


