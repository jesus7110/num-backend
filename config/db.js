const mongoose = require("mongoose");
const colors = require("colors");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Mongodb connected ${mongoose.connection.host}`.bgGreen.white);
  } catch (error) {
    console.log(`Mongodb Server Issue ${error}`.bgRed.white);
  }
};

module.exports = connectDB;

// const mongoose =require("mongoose");

// mongoose.connect('mongodb://localhost:27017/TechGeniousLab-jesus')
// .then(()=> {console.log("sucessfull connected");})
// .catch((err)=> console.log(err));