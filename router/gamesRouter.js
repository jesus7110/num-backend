const router = require('express').Router();
const { addGame, getNearestUpcomingGame, placeBet,runGame , getSortedUpcomingGames, getGamesForNextDay, test} =require ('../controller/gamesController');
const {authenticateUser }= require('../middleware/authMiddleware');

router.route('/addgame')
    .post(addGame);

router.route('/getupcominggame')
    .get(getNearestUpcomingGame);

router.route('/placebet')
    .post(authenticateUser,placeBet);


router.route('/rungame')
    .post(runGame);

router.route('/upcominggames').get(async (req, res) => {
    try {
          const upcomingGames = await getSortedUpcomingGames();
          res.status(200).json(upcomingGames);
    } catch (error) {
          res.status(500).send('Error fetching and sorting upcoming games');
        }
    });

router.route('/gamesfornextday').get(getGamesForNextDay);

router.route('/test').get(test);

module.exports = router ;
