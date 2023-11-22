const mongoose = require("mongoose");
const Session = require("../session");
const TextplosionPlayer = require("./textplosion_player");
const Schema = mongoose.Schema;

const TextplosionGameSchema = new Schema({
    // the session it belongs to so that player http requests are easily applied to the right game
    session: { type: mongoose.ObjectId, ref: Session },
    // need to set random number for balloon top at
    // should be based on random numbers times the number of players
    charsToPop: {type: Number, required: true},
    // when it reaches or surpasses charsToPop the current player gets blown up
    charsTyped: {type: Number, required: true, default: 0},
    // array of players still in game and blown up. 
    // when array gets down to 1 player with status alive game is over and there is a winner. 
    playersInGame: [{type: Schema.Types.ObjectId, ref: TextplosionPlayer}],
  });
  
  // Export model
  module.exports = mongoose.model("TextplosionGame", TextplosionGameSchema);