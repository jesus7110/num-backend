const router = require('express').Router();
const { addGame, getScheduledGames,getNearestUpcomingGame, placeBet,runGame , getSortedUpcomingGames, startGameServer,getGamesForNextDay, test,teststartGameRoom,testplaceBet,getplacebetData,getLeaderboard} =require ('../controller/gamesController');
const {authenticateUser }= require('../middleware/authMiddleware');

router.route('/addgame')
    .post(addGame);

router.route('/getupcominggame')
    .get(getNearestUpcomingGame);

router.route('/placebet')
    .post(authenticateUser,placeBet);




router.route('/upcominggames').get(async (req, res) => {
    try {
          const upcomingGames = await getSortedUpcomingGames();
          res.status(200).json(upcomingGames);
    } catch (error) {
          res.status(500).send('Error fetching and sorting upcoming games');
        }
    });
router.route('/getscheduledgames').get(getScheduledGames)


//test purpose only
router.route('/test').post(test);  
router.route('/rungame').post(runGame);  
router.route('/gamesfornextday').get(getGamesForNextDay);
router.route('/startgameserver').get(startGameServer);
router.route('/teststartgameroom').get(teststartGameRoom);
router.route('/testplacebet').post(authenticateUser,testplaceBet);
router.route('/getplacebetdata').get(getplacebetData);




router.route('/getleaderboard').get(getLeaderboard);
module.exports = router ;


//for each unique bet (parameter: numbers)




