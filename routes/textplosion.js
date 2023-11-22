// handle all routes related to the game Textplosion

var express = require('express');
const textplosion_controller = require('../controllers/textplosion');
var router = express.Router();

/* Get status of textplosion game */
router.post('/status',  textplosion_controller.textplosionGameStatus);

/* pumps balloon based on word typed */
router.post('/pump', textplosion_controller.pump);

/* allows player on the hot-seat to "escape" when they complete their challenge */
router.post('/escape', textplosion_controller.escape);