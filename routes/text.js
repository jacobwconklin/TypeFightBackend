var express = require('express');
var router = express.Router();
const text_controller = require("../controllers/text");

/* Get listing of all texts */
router.get('/all', text_controller.getAllTexts );

/* Create a text */
router.post('/create', text_controller.createNewText );

/* assign a text to a player */
router.post('/assign', text_controller.assignText );

/* Get listing of all texts */
router.post('/update', text_controller.updateText );

/* Get listing of all texts */
router.post('/reset', text_controller.resetText );

// More verbose setup:
// router.get('/', async (req, res) => {
//     text_controller.getAllTexts(req, res);
//     // res.send("Gotem");
// } );

module.exports = router;
