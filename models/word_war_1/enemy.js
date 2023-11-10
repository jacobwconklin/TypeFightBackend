// Holds enemy information for word war 1 enemies
// need: 
/*
 phrase (rather than just a word to kill enemies)
 location (hard coded to fit on background? since levels aren't dynamic) may have x and y. 
 type (have mulitple enemy types to relate to sprite and maybe animations)
*/

const mongoose = require("mongoose");
const Session = require("../session");

const Schema = mongoose.Schema;

const EnemySchema = new Schema({
    session: { type: mongoose.ObjectId, ref: Session },
    // One idea would be to JUST let the front-end generate the phrases and make them extra long, so they never conflict with other players
    // typing them at the same time, and typing the word that is up does damage to the enemy and the enemy just has
    // total health (Which gets updated to the front-end as a health bar). Once the health goes below 0 in a call to damage the
    // enemy, the enemy is simply destroyed and setting enemies to destroyed rather than removing them from the array of enemies
    // could make it easier to show death animations and the level would be complete when ALL enemies are set to destroyed. 
    // phrase: { type: String},

    // and this way just set enemy difficulty by upgrading their health, easy as. 
    health: { type: Number, default: 100 }, 
    x: { type: Number}, 
    y: { type: Number,},
    type: {type: String, enum: ["gunner", "rifle", "tank", "helicopter", "mortar", "machine-gun"]}
  });
  
  // Export model
  module.exports = mongoose.model("Enemy", EnemySchema);