// Ties a player to their "soldier" character in the db
// for their Word War 1 gamse

const mongoose = require("mongoose");
const Player = require("../Player");

const Schema = mongoose.Schema;

const ResultSchema = new Schema({
    player: { type: mongoose.ObjectId, ref: Player},
    // have stylization based on type of fighter selected and purely cosmetic skin property
    skin: { type: String, enum: ["Camo", "Khaki", "Space"]},
    // have type affect weapon held and bonus attacks / range maybe
    type: { type: String, enum: ["Engineer", "Rifle", "Sniper", "Gunner"]}, 
    // individual health restored on level completed (up to 3).
    health: { type: Number, default: 3},
    // powerups!
    // I think just have a number of general "ability" power stored up to 100 to use and distribute
    // among potential special attacks based on player type. Ability can be spent by special attacks
    // and restored by getting kills / completing levels. New skills to use can also be unlocked based
    // on number of kills / levels completed but all can be extrapolated from the ability bar 
    // (maybe call something cooler like courage / digital courage, etc.)
    ability: { type: Number, default: 100 },
    // stats!
    kills: {type: Number, default: 0},
    charactersTyped: {type: Number, default: 0},
    // etc. other stats
  });
  
  // Export model
  module.exports = mongoose.model("Result", ResultSchema);