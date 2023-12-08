const mongoose = require("mongoose");
const Session = require("../session");
const Player = require("../Player");
const Schema = mongoose.Schema;

const TypeFlightGameSchema = new Schema({
    // the session it belongs to so that player http requests are easily applied to the right game
    session: { type: mongoose.ObjectId, ref: Session },
    // array of players still in game both alive and dead
    // when array gets down to 0 players with status alive game is over and timer ends
    playersInGame: [{type: Schema.Types.ObjectId, ref: Player}],
    // easier to track a total absolute start time and end time to make it the same for all players without
    // lag in updating a total elapsed time on the server
    startTimeAbsolute: {type: Number},
    endTimeAbsolute: {type: Number},
  });
  
  // Export model
  module.exports = mongoose.model("TypeFlightGame", TypeFlightGameSchema);