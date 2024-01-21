const router = require('express').Router();
const { login } =require ('../controller/users');

router.route('/login')
    .post(login);

module.exports = router ;