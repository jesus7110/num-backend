const User = require('../models/userModel');
const OTP_Model = require('../models/otpModel');
const generateOTP = require('../middleware/otp-generatorMiddleware'); // Import the OTP generation function
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const _ = require("lodash");
require('dotenv').config();





 const generateAuthToken = (user) => {
  
    const token = jwt.sign(
      {
        _id: user._id,
        mobileNumber: user.mobileNumber, // Use emailID instead of username
        // Add any other user information you want to include in the token
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' } // Token will expire in 7 days
    );
  
    return token;
  };


  async function validateUserToken(req) {
    const authToken = req.headers.authorization;
    if (!authToken) {
      return { user: null, status: 401, message: "Unauthorized access" };
    }
    try {
      const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
      const user = await User.findOne({ mobileNumber: decodedToken.mobileNumber });
      if (!user) {
        return { user: null, status: 404, message: "User not found" };
      }
      return { user };
    } catch (error) {
      console.error(error);
      return { user: null, status: 500, message: "Internal server error" };
    }
  }
  

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

 // verify otp for registration and validate 
 module.exports.verifyOtp = async (req, res) => {
  const otpHolder = await OTP_Model.find({
    mobileNumber: req.body.mobileNumber,
  });
  if (otpHolder.length === 0) {
    return res.status(400).send("You use an Expired OTP!");
  }
  const rightOtpFind = otpHolder[otpHolder.length - 1];
  const validUser = await bcrypt.compare(req.body.otp, rightOtpFind.otp);

  if (rightOtpFind.mobileNumber === req.body.mobileNumber && validUser) {
    // Check for existing user with verified mobile number
    let user = await User.findOne({ mobileNumber: req.body.mobileNumber });

    if (!user) {
      // Create a new user if one doesn't already exist
      user = new User(_.pick(req.body, ["mobileNumber"]));
      // Set additional user fields here (optional)
      await user.save();

      
    }

    // Generate and send the JWT token in the response
    const authToken = generateAuthToken(user);
    console.log(authToken);
    const sevenDaysInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    res.cookie('jwtd', authToken, {
      maxAge: sevenDaysInMilliseconds,
      httpOnly: true,
      // secure: true,
    });
    res.status(200).send("cookie send completed");

    // Delete the used OTP document after successful verification
    const OTPDelete = await OTP_Model.deleteMany({
      mobileNumber: rightOtpFind.mobileNumber,
    });
  } else {
    return res.status(400).send("Your OTP was wrong!");
  }
};


module.exports.verifyUserByToken = async(req, res) => {

  try {
    const userToken = req.body.token;
    //console.log(userToken);

    // Verify the JWT token
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
    console.log("decoded token",decoded);


    // Find the user by mobile number from the decoded token
    const user = await User.findOne({ mobileNumber: decoded.mobileNumber});
    console.log("user",user);
    if (!user) {
      // If user not found
      return res.status(404).json({ message: 'User not found' });
    }

    

     // Check if the user is created or not
     const isAccountCreated = user.is_account_created;

     if (isAccountCreated) {

           
        res.status(401).json({
          isAccountCreated: true , 
          mobileNumber:user.mobileNumber,
          name:user.name,
          email:user.email,
          walletbalance:user.walletBalance,
          message: 'User Account completed' });
        

    } else {
      res.status(402).json({isAccountCreated: false, message: 'User Account is not completed' });
    }
    
    
  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      console.error('Token Expired');
      res.status(404).json({isTokenExpired: true ,message: 'Token Expired' });
    }
    else {
      console.error('Error in verifying user by token:', error);
      res.status(500).json({ message: 'Internal server error' });}
  }
}

module.exports.getWallet = async(req, res) => {
  try{
    const  usermobileNumber = req.user.mobileNumber; 
    const user = await User.findOne({ mobileNumber: usermobileNumber});
    console.log("user",user);
    if (!user) {
      // If user not found
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({walletBalance:user.walletBalance,message:"Wallet Balance sent successfully"});

  }catch(error){
    comsole.log(error);
  }

}


module.exports.isUserAccountComplete = async(req, res) => {

  try {
    const  usermobileNumber = req.user.mobileNumber; 
    const user = await User.findOne({ mobileNumber: usermobileNumber});
    console.log("user",user);
    if (!user) {
      // If user not found
      return res.status(404).json({ message: 'User not found' });
    }

    

     // Check if the user is created or not
     const isAccountCreated = user.is_account_created;

     if (isAccountCreated) {

      
        return res.status(200).json({ 
          isAccountCreated: true , 
          mobileNumber:user.mobileNumber,
          email:user.email,
          name:user.name,
          walletbalance:user.walletBalance,
          message: 'User Account completed' });
      

    } else {
      return res.status(402).json({isAccountCreated: false, message: 'User Account is not completed' });
    }
    
    
  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      console.error('Token Expired');
      res.status(404).json({isTokenExpired: true ,message: 'Token Expired' });
    }
    else {
      console.error('Error in verifying user by token:', error);
      res.status(500).json({ message: 'Internal server error' });}
  }
}


module.exports.updateUserAccountInfo = async(req, res) => {
  try {
    console.log('yoyo');
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({user: null ,message: 'Missing user details in request body' });
    }

    const tokenValidationResult = await validateUserToken(req);
    if (!tokenValidationResult.user) {
      return tokenValidationResult;
    }

    const user = tokenValidationResult.user;
    if (user.is_account_created) {
      return res.status(200).send('User details are already complete');
    }

    await User.updateOne(
      { _id: user._id },
      {
        name,
        email,
        is_account_created: true,
      }
    );
    
    return res.status(201).json({
      email:req.body.email,
      name:req.body.name, 
      walletBalance: user.walletBalance, 
      message: 'User details updated successfully' });
  } catch (error) {
    console.error(error);
   return res.status(500).json({message: 'Internal server error' });
  }
}


module.exports.updateBankInfo = async(req,res) => {

  try {
    const { bankDetails } = req.body;
    console.log(bankDetails);
    const { accountName, accountNumber, ifscCode, accountType } = bankDetails;
    if (!accountName || !accountNumber || !ifscCode || !accountType) {
      return res.status(400).json({message: "Missing bank details in request bod"});
    }

    const tokenValidationResult = await validateUserToken(req);
    if (!tokenValidationResult.user) {
      return tokenValidationResult;
    }

    const user = tokenValidationResult.user;
    if (user.isKyc) {
      return res.status(200).json({message: "Bank details are already complete"});
    }

    await User.updateOne(
      { _id: user._id },
      {
        bankDetails: {
          accountName,
          accountNumber,
          ifscCode,
          accountType,
        },
        isKyc: true,
      }
    );

    return res.status(200).json({message: "Bank details updated successfully"});
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: "Internal Server Error"});
  
  }
}

