const router = require('express').Router();
const { addGame, getNearestUpcomingGame, placeBet,startGameServerr, stopGameServer,runGame } =require ('../controller/gamesController');
const {authenticateUser }= require('../middleware/authMiddleware');

router.route('/addgame')
    .post(addGame);

router.route('/getupcominggame')
    .get(getNearestUpcomingGame);

router.route('/placebet')
    .post(authenticateUser,placeBet);

router.route('/start-game-server')
    .post(startGameServerr);

router.route('/stop-game-server')
    .post(stopGameServer);
router.route('/rungame')
    .post(runGame);

module.exports = router ;