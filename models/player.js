// Holds info needed for one Player. Includes All of their customization options

const mongoose = require("mongoose");
const Session = require("./session");
const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
    alias: {type: String, required: true},
    // assemble all of the icons I make selectable here
    icon: {type: String, enum: ["lizard", "wizard", "ninja", "samurai"] }, 
    font: { type: String, enum: ["Times New Roman", "Calibri"] },
    color: { type: String, }, // store hex value ie #FFFFFF just use a color picker on front-end that will give me this 
    session: { type: mongoose.ObjectId, ref: Session} // optional in case players play solo, but may still create one if easier for consistency
  });
  
  // Export model
  module.exports = mongoose.model("Player", PlayerSchema);