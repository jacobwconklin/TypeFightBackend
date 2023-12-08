const mongoose = require("mongoose");
const TypeFlightGame = require("./typeflight_game");
const Schema = mongoose.Schema;

// create new events that belong to a particular TypeFight Game, that way all events can be collected and returned in 
// an array without constantly manipulating that array held by the Game object hopefully helping to avoid race conditions.
// creating an event should happen in a running interval function for the game with a setTimeout between creating the event and 
// "handling" it killing everyone in a certain radius, then deleting the event after a timeout
const TypeFlightEventSchema = new Schema({
    // The game this event belongs to
    typeFlightGame: { type: mongoose.ObjectId, ref: TypeFlightGame },
    // Position of this event (actual effect radius will be determined by a function in controller but center of event stored here)
    position: { type: Number, required: true, min: 0, max: 99 },
    // turns true after an amount of time so that players can avoid the blast radius of the event
    activated: {type: Boolean, required: true, default: false},
    // have a pre-set number of types of events from bombs, to lasers, to lightning, etc. 
    // Each one has a corresponding color, icon, damage area, and time to go off all handled by the 
    // front end and controller based on matching a string here.
    type: { type: String, enum: [
        "bomb",
        "laser",
        "lightning",
        "fire",
        "ice",
    ]},
  });
  
  // Export model
  module.exports = mongoose.model("TypeFlightEvent", TypeFlightEventSchema);