const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String},
    email: { type: String },
    mobileNumber: { type: String,  unique: true },
    bankDetails: {
        // Structure for bank details
        accountName: { type: String },
        accountNumber: { type: String},
        ifscCode: { type: String },
        accountTYpe: { type: String, enum: ['savings','current'] },
    },
    is_account_created: {
        type: Boolean,
        default: false,
        required: true
      },
    walletBalance: { type: Number, default: 110 },
    isKyc: { type: Boolean, default:false},
    token :{
           type:String,
           //required:true
        },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
