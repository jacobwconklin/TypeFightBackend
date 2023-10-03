var express = require('express');
var router = express.Router();
const session_controller = require("../controllers/session");

/* Get the status for a session*/
router.post('/status', session_controller.sessionStatus );

/* Select a game for a given session */
router.post('/select-game', session_controller.selectGame );

module.exports = router;