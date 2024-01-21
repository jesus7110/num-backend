const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true, unique: true },
    bankDetails: {
        // Structure for bank details
        accountName: { type: String, required: true, unique: true },
        accountNumber: { type: String, required: true, unique: true },
        ifscCode: { type: String, required: true, unique: true },
        accountTYpe: { type: String, enum: ['savings','current'], required: true, unique: true },
    },
    walletBalance: { type: Number, default: 0 },
    isKyc: { type: Boolean, default:false, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
