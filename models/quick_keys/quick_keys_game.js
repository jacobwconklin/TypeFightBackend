// Stores one instance of a QuickKeys game which needs
// an index for each player, and a final time (which cans serve)
// to determine if the player has finished and when (final time calculated soley)
// on front-end to avoid discrepencies.

// would be destroyed when game is exited would it be helpful to track last time accessed to 
// delete all old games that get abandoned? Idk
const mongoose = require("mongoose");
const Prompt = require("./prompt");
const Result = require("./result");
const Session = require("../Session");

const Schema = mongoose.Schema;

// from thsi model player's screen needs to be able to paint entire UI View

const QuickKeysGameSchema = new Schema({
    
    chosen_prompt: { type: Prompt },
    results: { type: [Result] },
    // the session it belongs to so that player http requests are easily applied to the right game
    session: { type: Session, required: true }
  });
  
  // Export model
  module.exports = mongoose.model("QuickKeysGame", QuickKeysGameSchema);