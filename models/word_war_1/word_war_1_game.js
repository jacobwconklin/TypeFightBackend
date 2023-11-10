// This game is to be a more structured level based design with enemies to defeat 
// rather than spacebar invaders which is an endless wave approach. This game
// takes inspiration from the legend of qwerty game with the addition of 
// multiplayer.

// differently than qwerty, players could just type words associated with their weapons (maybe more than one)
// rather than associated with the enemies if desired, however I think players may like to select enemies 
// in which case we would want some way for players to chose what they are shooting, but maybe special attacks like
// aoe's could just be typed on the weapon rather than the enemy. Could have clicking involved too for powerups /
// for selecting enemy not sure...  


const mongoose = require("mongoose");
const Session = require("../session");
const Enemy = require("./enemy");

const Schema = mongoose.Schema;

// from thsi model player's screen needs to be able to paint entire UI View

const WordWar1GameSchema = new Schema({
    // the session it belongs to so that player http requests are easily applied to the right game
    session: { type: mongoose.ObjectId, ref: Session },
    enemies: [{type: Schema.Types.ObjectId, ref: Enemy}],
    // hard-code level information into the session controller
    // TODO should have levels be harder based on the quantity of players in the session. 
    level: {type: Number, default: 0}, 
    // TODO maybe have health per player rather than overall health, and 
    // have players all get one health (and come back to life) if they complete a level
    health: {type: Number, default: 3}, 
  });
  
  // Export model
  module.exports = mongoose.model("WordWar1Game", WordWar1GameSchema);