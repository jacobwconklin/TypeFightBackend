var express = require('express');
var router = express.Router();
const session_controller = require("../controllers/session");

/* Get the status for a session*/
router.post('/status', session_controller.sessionStatus );


/* Begin a given session (moves to game select screen)*/
router.post('/begin', session_controller.begin );

/* Select a game for a given session */
router.post('/select-game', session_controller.selectGame );

/* Leave a game (navigates back to game-select) */
router.post('/leave-game', session_controller.leaveGame );

/* Wipe the session TODO for now delete all players later them persist if they make user and pass */
router.post('/wipe', session_controller.wipe );

/* Remove one player from a given session */
router.post('/exit', session_controller.exit);

module.exports = router;