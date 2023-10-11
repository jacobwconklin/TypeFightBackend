// Stores one instance of a QuickKeys game which needs
// a number of lives for earth, the wave reached, and an 
// array of all enemies spawned (just their x coordinate, y coordinate, and word)

// TODO will also need a server thread continually running the game to move the pieces closer,
// spawn enemies for the wave, and calculate if enemies reached earth to dock damage...
// may be able to use web-worker  ?? not sure 

// would be destroyed when game is exited would it be helpful to track last time accessed to 
// delete all old games that get abandoned? Idk
const mongoose = require("mongoose");
const Session = require("../session");
const Enemy = require("./enemy");

const Schema = mongoose.Schema;

// from thsi model player's screen needs to be able to paint entire UI View

const SpacebarInvadersGameSchema = new Schema({
    // the session it belongs to so that player http requests are easily applied to the right game
    session: { type: mongoose.ObjectId, ref: Session },
    enemies: [{type: Schema.Types.ObjectId, ref: Enemy}],
    wave: {type: Number, default: 0}, // wave number will determine # and difficulty of enemies spawned
    health: {type: Number, default: 3}, // each collision with earth loses one health, at all health lost 
    // show gameover screen and kill session until re-play button pressed. 
    // TODO may want player results (like quick keys) to show game statistics like enemies killed, total number
    // of characters sent. 
    // TODO may implement this state if there is a customization screen before starting,
    // If so logic to launch spacebar invader game and actually begin the game interval will have to be separated in the controller.
    // state: { type: String, enum: ["Preparing", "Started", "Finished"], default: "Preparing"},
  });
  
  // Export model
  module.exports = mongoose.model("SpacebarInvadersGame", SpacebarInvadersGameSchema);