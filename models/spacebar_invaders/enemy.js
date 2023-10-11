// Holds enemy information (word, x, and y coordinate)
// length of word alone will determine the image used for the enemy

const mongoose = require("mongoose");
const Session = require("../session");

const Schema = mongoose.Schema;

const EnemySchema = new Schema({
    session: { type: mongoose.ObjectId, ref: Session },
    word: { type: String},
    x: { type: Number}, 
    y: { type: Number,}
  });
  
  // Export model
  module.exports = mongoose.model("Enemy", EnemySchema);