const Game = require('../models/gamesModel');
const moment = require('moment-timezone');


module.exports.addGame = async (req, res) => {
    try {
        const { startTime, gameSessionTime } = req.body;
    
        // Validate input
        if (!startTime || !gameSessionTime) {
          return res.status(400).send('Start time and game session time are required');
        }
    
        // Generate a unique gameId
        const gameId = Math.floor(Math.random() * 1000000) + 1; // Adjust for more robust uniqueness if needed
    
        // Calculate checkInTime
        const checkInTime = new Date(startTime);
        checkInTime.setMinutes(checkInTime.getMinutes() - 5);
    
        // Calculate endTime
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getSeconds() + gameSessionTime);
    
        const newGame = new Game({
          gameId,
          checkInTime,
          startTime,
          endTime,
          isActive: false,
        });
    
        await newGame.save();
    
        res.status(201).send(newGame);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error creating game');
      }
};

module.exports.getNearestUpcomingGame = async (req, res) => {
  try {
    // Find the upcoming game with the earliest startTime (not yet started)
    const upcomingGame = await Game.findOne({
      isActive: false,
      startTime: { $gte: moment().tz('Asia/Kolkata').toDate() }
    }).sort({ startTime: 1 }).limit(1);

    if (!upcomingGame) {
      return res.status(404).send('No upcoming games found');
    }

    // Convert startTime and checkInTime to IST strings for response
    const responseData = {
      gameId: upcomingGame.gameId,
      startTime: moment(upcomingGame.startTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
      checkInTime: moment(upcomingGame.checkInTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
    };

    return res.status(200).send(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error retrieving upcoming game');
  }
};
