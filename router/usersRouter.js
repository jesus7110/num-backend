const router = require('express').Router();
const { login, verifyOtp, updateUserAccountInfo, updateBankInfo } =require ('../controller/usersController');


router.route('/login')
    .post(login);

router.route('/login/verifyotp')
.post(verifyOtp); 

router.route('/completeuserdetails')
.post(updateUserAccountInfo); 

router.route('/updatebankinfo')
.post(updateBankInfo); 

module.exports = router ;