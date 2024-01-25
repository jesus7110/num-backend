const router = require('express').Router();
const { login, verifyOtp, updateUserAccountInfo, updateBankInfo,isUserAccountComplete } =require ('../controller/usersController');
const {authenticateUser }= require('../middleware/authMiddleware');

router.route('/login')
    .post(login);

router.route('/login/verifyotp')
    .post(verifyOtp); 

router.route('/verifyuser')
    .post(authenticateUser,isUserAccountComplete); 

router.route('/completeuserdetails')
    .post(updateUserAccountInfo); 

router.route('/updatebankinfo')
    .post(updateBankInfo); 

module.exports = router ;