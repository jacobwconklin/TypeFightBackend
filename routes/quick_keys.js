// handle all routes related to the game Quick Keys

var express = require('express');
const quick_keys_controller = require('../controllers/quick_keys');
var router = express.Router();

// status, get prompt, select prompt, set user index, set user time
// TODO could make some endpoints GET with query params, but I just find putting information in request bodies easier.

/* Get status of quick keys game */
router.post('/status',  quick_keys_controller.quickKeysGameStatus);

/* get all prompts matching filter */
router.post('/prompts', quick_keys_controller.getPrompts);

/* select a prompt */
router.post('/prompt', quick_keys_controller.selectPrompt);

/* select a prompt */
router.post('/new', quick_keys_controller.newPrompt);

/* select a prompt */
router.post('/rematch', quick_keys_controller.rematch);

/* add a prompt */
router.post('/add', quick_keys_controller.addPrompt);

/* update index */
router.post('/index', quick_keys_controller.updatePlayerIndex);

/* update time */
router.post('/time', quick_keys_controller.updatePlayerTime);

/* wipe the game */
router.post('/wipe', quick_keys_controller.wipe);

module.exports = router;