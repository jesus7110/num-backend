const express = require('express')
require('dotenv').config();
const connectDB = require("./config/db");
const userRouter = require('./router/usersRouter');
const gameRouter = require('./router/gamesRouter');
const { getGamesForNextDay,startGameServer} =require ('./controller/gamesController');

const cron = require('node-cron');


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

// Schedule the task to run at 2:20 PM IST every day
cron.schedule('0 35 11 * * *', async () => {
  // This will run the task every day at 2:20 PM IST
  console.log("cron");
  try {
    await getGamesForNextDay();
    console.log('Scheduled task executed successfully.');
  } catch (error) {
    console.error('Error executing scheduled task:', error);
  }
},{ scheduled: true, timezone: 'Asia/Kolkata' });


//start the game server
startGameServer();


app.listen(process.env.SERVERPORT || 8000)
.addListener




console.log(`server running at port ${process.env.SERVERPORT }`.bgRed.white)