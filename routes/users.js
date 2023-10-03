var express = require('express');
const users_controller = require('../controllers/users');
var router = express.Router();

/* Create a new Session to be the host of and set host player */
router.post('/host',  users_controller.setHostPlayer);

/* Join an existing session and set a joined player */
router.post('/join', users_controller.setJoinedPlayer);

module.exports = router;
