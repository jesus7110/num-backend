const Game = require('../models/gamesModel');
const Bet = require('../models/betSchema');
const moment = require('moment-timezone');
const User = require('../models/userModel');
const authenticateUser = require('../middleware/authMiddleware');
const GameRoom = require('../models/gameRoomModel');

// Global variables
let gameServerStatus = false;
let activeGameRoom = null;
let isGameRoomActive = false;

//NEED A function thay fetch this data every time server restarts
let nextDaygame=[{
  gameId: 159048,
  startTime: '2024-01-29 12:16:00',
  checkInTime: '2024-01-29 12:15:00'
},
{
  gameId: 637112,
  startTime: '2024-01-29 12:18:00',
  checkInTime: '2024-01-29 12:17:00'
},
];

module.exports.test = async () => {
  console.log(nextDaygame);
}



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
      checkInTime: moment(game.checkInTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
    }));

    nextDaygame = responseData;

    console.log(responseData);
    console.log("==================================");
    console.log(nextDaygame);
    startGameServer();
    return res.status(200).send(responseData);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error retrieving games for the next day');
  }
};

module.exports.placeBet = async (req, res) => {
  try {
    // Authenticate user
    //const user = await authenticateUser(req); // Replace with your authentication logic

    const { numbers, amount,coinsBetted,gameId } = req.body;
    const  usermobileNumber = req.user.mobileNumber;
     //console.log(usermobileNumber);
    let user = await User.findOne({ mobileNumber: usermobileNumber });
    // Validate input
    if (!numbers || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).send('Invalid bet details');
    }

    // Check wallet balance
    if (user.walletBalance < amount) {
      return res.status(400).send('Insufficient wallet balance');
    }

    // Find the game
    const game = await Game.findOne({gameId:req.body.gameId});
    if (!game) {
      return res.status(404).send('Game not found');
    }

    // Check if game is active and accepting bets
    // if (!game.isActive || game.startTime <= Date.now()) {
    //   return res.status(400).send('Game is not active or betting has closed');
    // }

    // Check for existing bet
    const existingBet = await Bet.findOne({ mobileNumber: user.mobileNumber, gameId: req.body.gameId });
    if (existingBet) {
      return res.status(401).send('You have already placed a bet for this game');
    }

    // Deduct amount from wallet
    user.walletBalance -= amount;
    await user.save();

    // Create bet document
    const bet = new Bet({
      mobileNumber: user.mobileNumber,
      gameId: req.body.gameId,
      numbers: req.body.numbers,
      amounts: req.body.amounts,
      coinsBetted: req.body.coinsBetted,
    });

    await bet.save();

    res.status(201).send(bet);
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

// Function to start the game server
module.exports.startGameServer= async() => {

  if (!gameServerStatus) {
    gameServerStatus = true;
    console.log('Game server started.');

    // Schedule the first game from nextDaygame
    scheduleNextGame();
  } else {
    console.log('Game server is already running.');
  }
}

// Function to schedule the next game
function scheduleNextGame() {
  //console.log(nextDaygame);
  if (nextDaygame.length > 0) {
    const nextGame = nextDaygame.shift(); // Get the first game from the queue

    const { gameId, checkInTime, startTime } = nextGame;

    // Calculate the time until checkInTime
    const timeUntilCheckIn = moment(checkInTime).diff(moment(), 'milliseconds');

    // Schedule the game to start at checkInTime
    setTimeout(async () => {
      await startGameRoom(gameId);
    }, timeUntilCheckIn);

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

// Function to start a game room
async function startGameRoom(gameId) {
  if (!isGameRoomActive) {
    activeGameRoom = gameId;
    isGameRoomActive = true;

    // Perform actions to start the game room, e.g., initialize players, set up game state
    console.log(`Game room ${gameId} started.`);
  } else {
    console.log('Game room is already active.');
  }
}

// Function to stop the game server
function stopGameServer() {
  gameServerStatus = false;
  console.log('Game server stopped.');
}
