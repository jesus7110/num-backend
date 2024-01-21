const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    selectedNumbers: { type: [Number], required: true },
    betAmount: { type: Number, required: true },
    winningNumbers: { type: [Number], required: true },
    result: { type: String, required: true, enum: ['win', 'loss'] },
    winningAmount: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
