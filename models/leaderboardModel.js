const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    gameId: { type: Number, required: true },
    winningNumbers: {
        firstNumber: {
            type: Number, required: true
        },
        secondNumber: {
            type: Number, required: true
        },
        thirdNumber: {
            type: Number, required: true
        },

    },
    leaderboard:[{
        mobileNumber: { type: String, required: true },
        amountWon: { type: Number },
    }]
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
