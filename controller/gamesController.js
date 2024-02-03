const Game = require('../models/gamesModel');
const Sequencegame = require('../models/sequencegamesModel'); 
const Bet = require('../models/betSchema');
const moment = require('moment-timezone');
const User = require('../models/userModel');
const authenticateUser = require('../middleware/authMiddleware');
const GameRoom = require('../models/gameRoomModel');
const BetModel = require('../models/betModel');
const Leaderboard = require('../models/leaderboardModel');
const mongoose = require('mongoose');

const { validationResult } = require('express-validator');

// Global variables
let gameServerStatus = false;
let activeGameRoom;
let isGameRoomActive = false;

//NEED A function thay fetch this data every time server restarts
let nextDaygame=[];

module.exports.test = async () => {
  console.log(nextDaygame[0]);
}

module.exports.getScheduledGames = async (req, res) => {
  try {
    console.log('getScheduledGames', nextDaygame);

    if (nextDaygame.length === 0) {
      return res.status(201).send({ message: 'No upcoming games found' });
    }

    const currentDateTimeIST = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    console.log(currentDateTimeIST);

    let nextGame = nextDaygame[0];
    nextGame.currentDateTimeIST = currentDateTimeIST;

    return res.status(200).send(nextGame);
  } catch (error) {
    console.log(`Error in fetching upcoming game: ${error}`);
    return res.status(500).send('Internal Server Error');
  }
};



module.exports.addGame = async (req, res) => {  
  try {
    const { startTimeIST, gameSessionTimeInSeconds } = req.body; // Assuming input is in seconds

    // Validate input
    if (!startTimeIST || !gameSessionTimeInSeconds) {
      return res.status(400).send('Start time in IST and game session time in seconds are required');
    }

    const currentDateTimeIST = moment().tz('Asia/Kolkata');
    const startTimeUTC = moment.tz(startTimeIST, 'Asia/Kolkata').utc().toDate();
    
    // Check if the start time is on the same day as the current date
    if (moment(startTimeUTC).isSame(currentDateTimeIST, 'day')) {
      return res.status(400).send('Start time must be on the next day.');
    }

    // Generate a unique gameId
    const gameId = Math.floor(Math.random() * 1000000) + 1; // Adjust for more robust uniqueness if needed

    //console.log(startTimeIST);
   // console.log(startTimeUTC);

   
    // Calculate endTime in seconds
    const endTimeInSeconds = startTimeUTC.getTime() + (gameSessionTimeInSeconds * 1000); // Convert minutes to seconds

    const newGame = new Game({
      gameId,
      checkInTime: moment(startTimeUTC).subtract(5, 'minutes').toDate(),
      startTime: startTimeUTC,
      endTime: new Date(endTimeInSeconds), // Convert seconds back to Date object
      isActive: true,
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
      isActive: true,
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


module.exports.placeBet = async (req, res) => {
  try {
    const { numbers, amount, coinsBetted, gameId } = req.body;
    const userMobileNumber = req.user.mobileNumber;

    // Validate input
    if (!numbers || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).send('Invalid bet details');
    }

    // Check wallet balance
    const user = await User.findOne({ mobileNumber: userMobileNumber });
    if (!user || user.walletBalance < amount) {
      return res.status(400).send('Insufficient wallet balance');
    }

    // Check if the game is active by finding the corresponding game room
    const gameRoom = await GameRoom.findOne({ gameId });

    if (!gameRoom) {
      return res.status(400).send('Game is not active');
    }

    // Check if the user has already placed a bet with the same numbers
    const existingBet = gameRoom.bets.find(bet =>
      bet.mobileNumber === userMobileNumber && bet.numbers.some(num => numbers.includes(num))
    );

    if (existingBet) {
      return res.status(401).send('You have already placed a bet with the same numbers');
    }

   
    
    const newBet = {
      mobileNumber: userMobileNumber,
      numbers,
      amount,
      coinsBetted,
    };

    if (gameRoom.bets) {
      gameRoom.bets.push(newBet);
    } else {
      gameRoom.bets = [newBet];
    }

     // Deduct amount from wallet
    await gameRoom.save();

    user.walletBalance -= amount;
    await user.save();


    res.status(201).send('Bet placed successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error placing bet');
  }
};


module.exports.runGame = async(req,res) => {
  const betData = [
    { betNumber: 14, userCount: 4, totalCoins: 900 },
    { betNumber: 21, userCount: 4, totalCoins: 67 },
    { betNumber: 3, userCount: 2, totalCoins: 70 },
    { betNumber: 8, userCount: 2, totalCoins: 1324 },
    { betNumber: 18, userCount: 2, totalCoins: 1393 },
    { betNumber: 5, userCount: 4, totalCoins: 1698 },
    { betNumber: 9, userCount: 5, totalCoins: 1740 },
    { betNumber: 4, userCount: 4, totalCoins: 1889 },
    { betNumber: 20, userCount: 3, totalCoins: 1962 },
    { betNumber: 15, userCount: 5, totalCoins: 2326 },
    { betNumber: 2, userCount: 14, totalCoins: 2365 },
    { betNumber: 13, userCount: 5, totalCoins: 2568 },
    { betNumber: 1, userCount: 5, totalCoins: 2722 },
    { betNumber: 19, userCount: 16, totalCoins: 2853 },
    { betNumber: 17, userCount: 8, totalCoins: 3209 },
    { betNumber: 11, userCount: 7, totalCoins: 3277 },
    { betNumber: 10, userCount: 6, totalCoins: 3541 },
    { betNumber: 12, userCount: 8, totalCoins: 3728 },
    { betNumber: 16, userCount: 6, totalCoins: 4014 },
    { betNumber: 7, userCount: 10, totalCoins: 4147 }
  ];
  
  function calculateTotalBetAmount() {
    return betData.reduce((total, bet) => total + bet.totalCoins, 0);
  }
  
  function totalWinner(winner){
      //console.log(winner);
      let winners = 0;
      for(const bet of betData){
          if (bet.betNumber === winner[0] || bet.betNumber === winner[1] || bet.betNumber === winner[2]  ) winners += bet.userCount;
          
      }
      
      return winners;
  }
  // Function to calculate efficiency score
  function calculateEfficiencyScore(betNumber) {
    const bet = betData.find(bet => bet.betNumber === betNumber);
    if (!bet) return 0; // Handle missing bet numbers
    return bet.userCount / (bet.totalCoins * getGiveawayMultiplier(betNumber));
  }
  
  // Function to get giveaway multiplier based on position
  function getGiveawayMultiplier(position) {
    if (position === 1) return 10;
    if (position === 2) return 5;
    if (position === 3) return 2;
    return 1; // Handle other cases (e.g., no giveaway)
  }
  
  // Function to select winning numbers with min and max budget
  function selectWinningNumbers(minBudget, maxBudget) {
  
  // Sort bets by user count (descending) to prioritize more users
    const sortedBets = betData.sort((a, b) => b.userCount - a.userCount);
  
    const winningNumbers = [];
    let totalGiveaway = 0;
  
  for (const bet of sortedBets) {
      const potentialGiveaway = getGiveawayMultiplier(winningNumbers.length + 1) * bet.totalCoins;
      if (totalGiveaway + potentialGiveaway <= maxBudget &&
          totalGiveaway + potentialGiveaway >= minBudget) {
        winningNumbers.push(bet.betNumber);
        totalGiveaway += potentialGiveaway;  
        if (winningNumbers.length === 3) break;
      }
     // console.log(totalGiveaway)
    }
    
   
    // Fill remaining slots if needed
    while (winningNumbers.length < 3) {
      for (const bet of sortedBets) {
        if (!winningNumbers.includes(bet.betNumber)) {
          winningNumbers.push(bet.betNumber);
          break;
        }
      }
    }
      console.log("Total Giveaway :",totalGiveaway);
    return winningNumbers;
  }
  
  const totalBetAmount = calculateTotalBetAmount();
  const minBudget = 1;
  const maxBudget = (totalBetAmount*95)/100;
  console.log("Total Bet amount :",totalBetAmount);
  console.log("Budget Limit is :", minBudget,"to", maxBudget);
  const winningNumbers = selectWinningNumbers(minBudget, maxBudget);
  console.log("Winning numbers:", winningNumbers);
  const totalWinnerUser = totalWinner(winningNumbers);
  console.log("Total Winner user :", totalWinnerUser);

  res.send(winningNumbers);
  
  

}



module.exports.getSortedUpcomingGames = async() => {
  try {
    const currentDateTime = new Date();

    // Fetch upcoming games whose check-in time is in the past and game is not active
    const upcomingGames = await Game.find({
      checkInTime: { $gt: currentDateTime }, // Updated condition to consider games whose checkInTime is greater than the current time
      isActive: true, // Consider only active games
    }).sort({ startTime: 1 }); // Sort by startTime in ascending order

    return upcomingGames;
  } catch (error) {
    console.error('Error fetching and sorting upcoming games:', error);
    throw error;
  }
}

// Function to import the list of games from the sequencegame collection
async function importGamesFromSequenceGame() {
  try {
    const sequenceGameList = await Sequencegame.find({}).sort({ startTime: 1 });

    
    nextDaygame = sequenceGameList.map((game) => ({
      gameId: game.gameId,
      startTime: moment(game.startTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
      checkInTime: moment(game.checkInTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
    }));

    console.log('Imported game list from sequencegame:', nextDaygame);
  } catch (error) {
    console.error('Error importing games from sequencegame:', error);
  }
}

// Function to start the game server
module.exports.startGameServer= async() => {

  if (!gameServerStatus) {
    gameServerStatus = true;
    console.log('Game server started.');

    //import list of the games from the sequenceGame 
     await importGamesFromSequenceGame();

    // Schedule the first game from nextDaygame
    scheduleNextGame();
  } else {
    console.log('Game server is already running.');
  }
}

// Function to schedule the next game
function scheduleNextGame() {
  console.log(nextDaygame);
  if (nextDaygame.length > 0) {
    const nextGame = nextDaygame.shift(); // Get the first game from the queue

    const { gameId, checkInTime, startTime } = nextGame;

    // Calculate the time until checkInTime
    const timeUntilCheckIn = moment(checkInTime).diff(moment(), 'milliseconds');

    //Create Game Room 
    setTimeout(async () => {
      await startGameRoom(gameId);
    }, timeUntilCheckIn);

    // Schedule the runGame function to execute at startTime
    const timeUntilGameStart = moment(startTime).diff(moment(), 'milliseconds');

    setTimeout(async () => {
      // Execute the runGame function when the game officially starts
      await testrunGame(gameId);
    }, timeUntilGameStart);

    // Schedule the next game after the current game ends
    const endTime = moment(startTime).add(30, 'seconds').toDate();
    const timeUntilNextGame = moment(endTime).diff(moment(), 'milliseconds');

    setTimeout(() => {
      scheduleNextGame();
    }, timeUntilNextGame);

    console.log(`Game ${gameId} scheduled to start at ${checkInTime}`);
  } else {
    console.log('No more games in the queue.');
    stopGameServer();
  }
}

// Function to execute the game algorithm
async function testrunGame(gameId) {
  try {
  
    console.log(`Running game logic for game ${gameId}`);

    const betData = await getplacebetData(gameId);

    //----- FUNCTION FOR GAME ALGORITHM
    function calculateTotalBetAmount() {
      return betData.reduce((total, bet) => total + bet.totalCoins, 0);
    }

    function totalWinner(winner){
      //console.log(winner);
      let winners = 0;
      for(const bet of betData){
          if (bet.betNumber === winner[0] || bet.betNumber === winner[1] || bet.betNumber === winner[2]  ) winners += bet.userCount;
          
      }
      
      return winners;
    }

    // Function to calculate efficiency score
  function calculateEfficiencyScore(betNumber) {
    const bet = betData.find(bet => bet.betNumber === betNumber);
    if (!bet) return 0; // Handle missing bet numbers
    return bet.userCount / (bet.totalCoins * getGiveawayMultiplier(betNumber));
  }

  // Function to get giveaway multiplier based on position
  function getGiveawayMultiplier(position) {
    if (position === 1) return 10;
    if (position === 2) return 5;
    if (position === 3) return 2;
    return 1; // Handle other cases (e.g., no giveaway)
  }

  // Function to select winning numbers with min and max budget
  function selectWinningNumbers(minBudget, maxBudget) {
  
    // Sort bets by user count (descending) to prioritize more users
      const sortedBets = betData.sort((a, b) => b.userCount - a.userCount);
    
      const winningNumbers = [];
      let totalGiveaway = 0;
    
    for (const bet of sortedBets) {
        const potentialGiveaway = getGiveawayMultiplier(winningNumbers.length + 1) * bet.totalCoins;
        if (totalGiveaway + potentialGiveaway <= maxBudget &&
            totalGiveaway + potentialGiveaway >= minBudget) {
          winningNumbers.push(bet.betNumber);
          totalGiveaway += potentialGiveaway;  
          if (winningNumbers.length === 3) break;
        }
       // console.log(totalGiveaway)
      }
      
     
      // Fill remaining slots if needed
      while (winningNumbers.length < 3) {
        for (const bet of sortedBets) {
          if (!winningNumbers.includes(bet.betNumber)) {
            winningNumbers.push(bet.betNumber);
            break;
          }
        }
      }
        console.log("Total Giveaway :",totalGiveaway);
      return winningNumbers;
    }


  const totalBetAmount = calculateTotalBetAmount();
  const minBudget = 1;
  const maxBudget = (totalBetAmount*95)/100;
  console.log("Total Bet amount :",totalBetAmount);
  console.log("Budget Limit is :", minBudget,"to", maxBudget);
  const winningNumbers = selectWinningNumbers(minBudget, maxBudget);
  console.log("Winning numbers:", winningNumbers);
  const totalWinnerUser = totalWinner(winningNumbers);
  console.log("Total Winner user :", totalWinnerUser);

  console.log(winningNumbers);

  //create leaderboard
  await calculateLeaderboard(gameId, winningNumbers)
    
    
    await destroyGameRoom(gameId);

    console.log(`Game ${gameId} completed.`);
  } catch (error) {
    console.error('Error running game:', error);
  }
}

// Function to start a game room
async function startGameRoom(testgameId) {
  if (!isGameRoomActive) {
    activeGameRoom = testgameId;
    isGameRoomActive = true;

    let gameRoom = await GameRoom.findOne({ gameId:testgameId });

    if (!gameRoom) {
      console.log("no existing game room, create a new one");
      gameRoom = new GameRoom({ gameId:testgameId });
      await gameRoom.save();
      return console.log(`Game room ${testgameId} started.`);
    }
    else{
      return console.log(`Game room ${testgameId} is already active.`);
    } 

  } else {
    console.log('Game room is already active.');
  }
}


async function destroyGameRoom(testgameId) {
  try {
    
    const gameRoom = await GameRoom.findOne({ gameId: testgameId });

    if (!gameRoom) {
      console.log(`No existing game room with gameId ${testgameId}`);
      return;
    }
    isGameRoomActive = false;

    await gameRoom.deleteOne();

    console.log(`Game room with gameId ${testgameId} destroyed.`);
  } catch (error) {
    console.error('Error destroying game room:', error);
  }
}

// Function to stop the game server
function stopGameServer() {
  gameServerStatus = false;
  console.log('Game server stopped.');
}


//games from games collection for next day
module.exports.getGamesForNextDay = async (req, res) => {
  try {
    const currentDateTimeIST = moment().tz('Asia/Kolkata'); // Get current date and time in IST
    const startOfNextDay = currentDateTimeIST.add(1, 'days').startOf('day'); // Start of the next day
    

    // Find games scheduled for the next day
    const nextDayGames = await Game.find({
      isActive: true,
      startTime: { $gte: startOfNextDay.toDate(), $lt: startOfNextDay.add(1, 'days').toDate() }
    }).sort({ startTime: 1 });

    if (!nextDayGames || nextDayGames.length === 0) {
      return res.status(404).send('No games scheduled for the next day');
    }

    // Convert startTime and checkInTime to IST strings for response
    const responseData = nextDayGames.map((game) => ({
      gameId: game.gameId,
      startTime: moment(game.startTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
      checkInTime: moment(game.checkInTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
      
    }));


    await Sequencegame.deleteMany({}); 
    await Sequencegame.insertMany(responseData);

    console.log('Sorted game list for the next day:', responseData);

    // Start the game server (if not already running)
   // startGameServer();

    return res.status(200).send(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error retrieving games for the next day');
  }
};


// Function to transform bet data
function transformBetData(betData) {
  const transformedData = {};

  betData.forEach((bets) => {
    const { numbers, coinsBetted } = bets;

    numbers.forEach((number, index) => {
      const betNumber = number;
      const coin = coinsBetted[index].coin;

      if (!transformedData[betNumber]) {
        // Initialize the entry for the betNumber
        transformedData[betNumber] = {
          betNumber,
          userCount: 0,
          totalCoins: 0,
        };
      }

      // Update the userCount and totalCoins for the betNumber
      transformedData[betNumber].userCount += 1;
      transformedData[betNumber].totalCoins += coin;
    });
  });

  // Convert the object values to an array
  const result = Object.values(transformedData);

  // Sort the array by betNumber if needed
  result.sort((a, b) => a.betNumber - b.betNumber);

  console.log(result);
  return result;
}

async function getplacebetData(testgameId){
  try{
    const gameRoom = await GameRoom.findOne({ gameId:testgameId });

    if (!gameRoom) {
      console.error('Game room not found');
      return null;
    }

    console.log(gameRoom.bets);
    const transformedBetData = transformBetData(gameRoom.bets);
console.log(transformedBetData);
    return transformedBetData;

  }catch(error){
    console.log("Error occured",error);
  }
}

//test codes

const testgameId = 743954;
module.exports.teststartGameRoom = async() => {
  isGameRoomActive= false; //remove
  if (!isGameRoomActive) {
    activeGameRoom = testgameId;
    isGameRoomActive = true;

    // Create a new game room or find an existing one
    let gameRoom = await GameRoom.findOne({ gameId:testgameId });

    if (!gameRoom) {
      console.log("no existing game room, create a new one");
      gameRoom = new GameRoom({ gameId:testgameId });
      await gameRoom.save();
      return console.log(`Game room ${testgameId} started.`);
    }
    else{
      return console.log(`Game room ${testgameId} is already active.`);
    }

    

  } else {
    console.log('Game room is already active.');
  }
}

module.exports.testplaceBet = async (req, res) => {
  try {
    const { numbers, amount, coinsBetted, gameId } = req.body;
    const userMobileNumber = req.user.mobileNumber;

    // Validate input
    if (!numbers || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).send('Invalid bet details');
    }

    // Check wallet balance
    const user = await User.findOne({ mobileNumber: userMobileNumber });
    if (!user || user.walletBalance < amount) {
      return res.status(400).send('Insufficient wallet balance');
    }

    // Check if the game is active by finding the corresponding game room
    const gameRoom = await GameRoom.findOne({ gameId });

    if (!gameRoom) {
      return res.status(400).send('Game is not active');
    }

    // Check if the user has already placed a bet with the same numbers
    const existingBet = gameRoom.bets.find(bet =>
      bet.mobileNumber === userMobileNumber && bet.numbers.some(num => numbers.includes(num))
    );

    if (existingBet) {
      return res.status(401).send('You have already placed a bet with the same numbers');
    }

    // Deduct amount from wallet
    user.walletBalance -= amount;
    await user.save();

    // Create or update the bet in the game room
    const newBet = {
      mobileNumber: userMobileNumber,
      numbers,
      amount,
      coinsBetted,
    };

    if (gameRoom.bets) {
      gameRoom.bets.push(newBet);
    } else {
      gameRoom.bets = [newBet];
    }

    await gameRoom.save();

    res.status(201).send('Bet placed successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error placing bet');
  }
};



module.exports.getplacebetData = async(req, res) => {
  try{
    const gameRoom = await GameRoom.findOne({ gameId:testgameId });

    if (!gameRoom) {
      console.error('Game room not found');
      return null;
    }

    console.log(gameRoom.bets);
    const transformedBetData = transformBetData(gameRoom.bets);
console.log(transformedBetData);
    return transformedBetData;

  }catch(error){
    console.log("Error occured",error);
  }
}

let gameId= 9001;
let winningNumbers = [15,8,16];
// Function to calculate total amount won for each user and create leaderboard
//module.exports.calculateLeaderboard= async() => 

async function calculateLeaderboard(gameId, winningNumbers){
  try {
    // Save gameID and winningNumbers to the Leaderboard collection
    const leaderboardData = {
      gameId,
      winningNumbers: {
        firstNumber: winningNumbers[0],
        secondNumber: winningNumbers[1],
        thirdNumber: winningNumbers[2],
      },
      leaderboard: [],
    };

    // Retrieve the game room data
    const gameRoom = await GameRoom.findOne({ gameId });

    if (!gameRoom) {
      console.error(`Game room not found for game ${gameId}`);
      return;
    }

    // Initialize leaderboard
    const leaderboard = [];

    // Create a map to store the total amount won for each user
    const userAmountMap = new Map();

    // Iterate through the bets in the game room
    for (const bet of gameRoom.bets) {
      const { mobileNumber, numbers, coinsBetted } = bet;

      // Check if the bet numbers match the winning numbers
      const matchingNumbers = numbers.filter(number => winningNumbers.includes(number));

      if (matchingNumbers.length > 0) {
        // Calculate the total amount won for each user based on all their bets
        let totalAmountWonForUser = 0;

        for (const coinBet of coinsBetted) {
          const { number, coin } = coinBet;

          // Check if the coin bet number matches the winning numbers
          if (winningNumbers.includes(number)) {
            // Determine the position (1st, 2nd, 3rd)
            const position = winningNumbers.indexOf(number) + 1;

            // Calculate the total amount won based on the position
            if (position === 1) {
              totalAmountWonForUser += coin * 10;
            } else if (position === 2) {
              totalAmountWonForUser += coin * 5;
            } else if (position === 3) {
              totalAmountWonForUser += coin * 2;
            }
          }
        }

        // Update the total amount won for the user in the map
        if (userAmountMap.has(mobileNumber)) {
          userAmountMap.set(mobileNumber, userAmountMap.get(mobileNumber) + totalAmountWonForUser);
        } else {
          userAmountMap.set(mobileNumber, totalAmountWonForUser);
        }
      }
    }

    // Convert the userAmountMap to the leaderboard array
    for (const [mobileNumber, amountWon] of userAmountMap.entries()) {
      leaderboard.push({ mobileNumber, amountWon });
    }

    // Sort the leaderboard by amount won in descending order
    leaderboard.sort((a, b) => b.amountWon - a.amountWon);

    // Update user balances with the amount won
    for (const entry of leaderboard) {
      const user = await User.findOne({ mobileNumber: entry.mobileNumber });

      if (user) {
        user.walletBalance += entry.amountWon;
        await user.save();
      }
    }

    // Update the leaderboardData with the calculated leaderboard
    leaderboardData.leaderboard = leaderboard;

    // Save the leaderboardData to the Leaderboard collection
    await Leaderboard.create(leaderboardData);

    console.log('Leaderboard:', leaderboard);

    // You can save the leaderboard data to a database or perform additional actions as needed
  } catch (error) {
    console.error('Error calculating leaderboard:', error);
  }
}


module.exports.getLeaderboard = async (req, res) => {
  try {
    // Validate gameId parameter
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { gameId } = req.params;

    // Find the leaderboard data for the specified game
    const leaderboard = await Leaderboard.findOne({ gameId });

    if (!leaderboard) {
      return res.status(404).json({ message: 'Leaderboard not found for the specified game' });
    }

    // Send the leaderboard data as the response
    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error retrieving leaderboard');
  }
};