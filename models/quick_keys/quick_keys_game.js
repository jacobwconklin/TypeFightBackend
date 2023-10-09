// Stores one instance of a QuickKeys game which needs
// an index for each player, and a final time (which cans serve)
// to determine if the player has finished and when (final time calculated soley)
// on front-end to avoid discrepencies.

// would be destroyed when game is exited would it be helpful to track last time accessed to 
// delete all old games that get abandoned? Idk
const mongoose = require("mongoose");
const Prompt = require("./prompt");
const Result = require("./result").schema;
const Session = require("../session");

const Schema = mongoose.Schema;

// from thsi model player's screen needs to be able to paint entire UI View

const QuickKeysGameSchema = new Schema({
    prompt: { type: String},
    results: [{type: Schema.Types.ObjectId, ref: Result}],
    // the session it belongs to so that player http requests are easily applied to the right game
    session: { type: mongoose.ObjectId, ref: Session }
  });
  
  // Export model
  module.exports = mongoose.model("QuickKeysGame", QuickKeysGameSchema);