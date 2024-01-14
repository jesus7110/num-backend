const otpGenerator = require('otp-generator')

const generateOTP = () =>{

const OTP = otpGenerator.generate(4 , {
    digits: true, alphabets: false, upperCase: false, specialChars: false
});

return OTP;
};

module.exports =generateOTP();
