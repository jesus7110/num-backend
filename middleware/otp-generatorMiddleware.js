const otpGenerator = require('otp-generator');

const generateOTP = () => {
    const digits = "0123456789";
    let otp = "";
  
    for (let i = 0; i < 5; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
  
    return otp;
};

module.exports = generateOTP; // Export the function, not the generated OTP
