// handle all routes related to the game Quick Keys

var express = require('express');
const spacebar_invaders_controller = require('../controllers/spacebar_invaders');
var router = express.Router();

/* Get status of spacebar invaders game */
router.post('/status', spacebar_invaders_controller.spacebarInvadersStatus);

/* Destory an enemy word in spacebar invaders */
router.post('/destroy', spacebar_invaders_controller.destroy);

/* Wipe a game of spacebar_invaders */
router.post('/wipe', spacebar_invaders_controller.wipe);

module.exports = router;