// handle all routes related to the game Textplosion

var express = require('express');
const typeflight_controller = require('../controllers/type_flight');
var router = express.Router();

/* Get status of type flight game */
router.post('/status',  typeflight_controller.typeFlightStatus);

/* Move a player */
router.post('/move',  typeflight_controller.updatePlayerPosition);

/* Revive a player */
router.post('/revive',  typeflight_controller.revive);

/* Wipe a type flight game */
router.post('/wipe',  typeflight_controller.wipe);

module.exports = router;