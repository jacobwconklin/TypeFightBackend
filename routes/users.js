var express = require('express');
const { setHostPlayer } = require('../controllers/users');
var router = express.Router();

/* Create a new Session to be the host of and set host player */
router.get('/host',  setHostPlayer);

/* Join an existing session and set a joined player */


module.exports = router;
