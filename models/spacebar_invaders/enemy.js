// Holds enemy information (word, x, and y coordinate)
// length of word alone will determine the image used for the enemy

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const EnemySchema = new Schema({
    word: { type: String},
    x: { type: Number}, 
    y: { type: Number,}
  });
  
  // Export model
  module.exports = mongoose.model("Enemy", EnemySchema);