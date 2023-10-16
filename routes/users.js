var express = require('express');
const users_controller = require('../controllers/users');
var router = express.Router();

/* Create a new Session to be the host of and set host player */
router.post('/host',  users_controller.setHostPlayer);

/* Join an existing session and set a joined player */
router.post('/join', users_controller.setJoinedPlayer);

/* Set a solo player and start a new session for them */
router.post('/solo', users_controller.setSoloPlayer);

module.exports = router;
