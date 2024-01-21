const User = require('../models/userModel');
const OTP_Model = require('../models/otpModel');
const generateOTP = require('../middleware/otp-generatorMiddleware'); // Import the OTP generation function
const bcrypt = require("bcrypt");

// Login for the user
module.exports.login = async (req, res) => {
  const mobileNumber = req.body.mobileNumber;

  // Generate a new 4-digit OTP
  const OTP = await generateOTP(); // Call the function to get the OTP

  const otpInstance = new OTP_Model({ mobileNumber: mobileNumber, otp: OTP });

  // Hash the OTP for security
  const salt = await bcrypt.genSalt(10);
  otpInstance.otp = await bcrypt.hash(OTP, salt); // Hash the actual OTP, not the function

  const result = await otpInstance.save();
console.log(OTP);
  return res.status(200).send(`OTP sent successfully!`); // Avoid revealing OTP in response
};
