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

// Schedule the task to run at 11:50 PM IST every day
cron.schedule('0 50 23 * * *', async () => {
  // This will run the task every day at 2:20 PM IST
  console.log("Game schedular called");
  try {
    await getGamesForNextDay();
    console.log('Scheduled task executed successfully.');
  } catch (error) {
    console.error('Error executing scheduled task:', error);
  }
},{ scheduled: true, timezone: 'Asia/Kolkata' });



// Start Game server at 11:55 PM IST every day
cron.schedule('0 55 23 * * *', async () => {
  // This will run the task every day at 2:20 PM IST
  console.log("Game Server starting");
  try {
    await startGameServer();;
    console.log('Game Server Start successfully.');
  } catch (error) {
    console.error('Error Game Server Start:', error);
  }
},{ scheduled: true, timezone: 'Asia/Kolkata' });


app.listen(process.env.SERVERPORT || 8000)
.addListener




console.log(`server running at port ${process.env.SERVERPORT }`.bgRed.white)