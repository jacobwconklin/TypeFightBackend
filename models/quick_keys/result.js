// Ties a player to their time in seconds (as a string)
// to be saved to the game model

const mongoose = require("mongoose");
const Player = require("../Player");

const Schema = mongoose.Schema;

const ResultSchema = new Schema({
    
    player: { type: Player },
    time: { type: String},
    index: { type: Number} // updated rapidly as players progress maybe just update on each spacebar rather than every character if problematic,
    // not sure... 
  });
  
  // Export model
  module.exports = mongoose.model("Result", ResultSchema);