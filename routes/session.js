var express = require('express');
var router = express.Router();
const session_controller = require("../controllers/session");

/* Select a game for a given session */
router.get('/select-game', session_controller.selectGame );

module.exports = router;