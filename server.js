const express = require('express')
require('dotenv').config();
const connectDB = require("./config/db");
const userRouter = require('./router/usersRouter');
const gameRouter = require('./router/gamesRouter');

const colors = require("colors");
const app = express()


const { send } = require('process');

app.use(express.urlencoded({extended: false }));

//server start test
app.get('/', function (req, res) {
  res.send('Server running');
})


//mongoDB connectiongit
connectDB();

//middlewares
app.use(express.json());

//router
app.use('/api/user',userRouter)
app.use('/api/game',gameRouter)



app.listen(process.env.SERVERPORT || 8000)
console.log(`server running at port ${process.env.SERVERPORT }`.bgRed.white)