// Holds a player's information for texplosion game, mostly their position and if they have been exploded
const mongoose = require("mongoose");
const Player = require("../Player");
const Schema = mongoose.Schema;

const TypeFlightPlayerSchema = new Schema({
    // player: { type: mongoose.ObjectId, ref: Player}, Plan to just store info about player rather than refrence to player
    playerId: {type: Schema.Types.ObjectId, ref: Player},
    isAlive: { type: Boolean, required: true, default: true },
    position: { type: Number, required: true, min: 0, max: 99 },
  });
  
  // Export model
  module.exports = mongoose.model("TypeFlightPlayer", TypeFlightPlayerSchema);