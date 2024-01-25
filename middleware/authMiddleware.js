const jwt = require('jsonwebtoken');

const authenticateUser =  (req, res, next) => {
    const token = req.header('Authorization');
    console.log(token);
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token not provided' });
      }
    
      try {
        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decode; //Set the user information in the request object;
       // console.log(decode);
        next();
      }
      //jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        //if (err) {
      catch (error) {    
        console.error('Error during token verification')
        return res.status(403).json({ success: false, message: 'Forbidden: Invalid token' });
        }
    
};


module.exports = {authenticateUser}
