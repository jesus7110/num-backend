const router = require('express').Router();
const { addGame, getNearestUpcomingGame } =require ('../controller/gamesController');


router.route('/addgame')
    .post(addGame);

router.route('/getupcominggame')
    .get(getNearestUpcomingGame);
module.exports = router ;