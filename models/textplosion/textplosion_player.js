// Holds a player's information for texplosion game, mostly their position and if they have been exploded
const mongoose = require("mongoose");
const Player = require("../Player");
const Schema = mongoose.Schema;

const TextplosionPlayerSchema = new Schema({
    // player: { type: mongoose.ObjectId, ref: Player}, Plan to just store info about player rather than refrence to player
    playerId: {type: Schema.Types.ObjectId, ref: Player},
    blownUp: { type: Boolean, required: true, default: false },
    position: { type: Number, required: true },
    alias: { type: String },
    icon: {type: String, enum: ["bee", "knight", "brain", "cookie", "crab", "croissant", "dragon", "hamster", "hedgehog", "koala",
        "lion", "lizard", "zombman", "ninja", "octopus", "pirate", "samurai", "whale", "thimble", "turkey", "unicorn", "windmill", 
        "wizard", "zombwoman"] }, 
    font: { type: String, enum: [
        'Black Ops One',
        'Calibri',
        'Coda',
        'Comic Neue',
        'Federant',
        'Gabriela',
        'Grenze Gotisch',
        'Kalam',
        'Merriweather',
        'Nova Square',
        'Reggae One',
        'Roboto',
        'Times New Roman',
        'Tomorrow'
    ]},
    color: { type: String, }, 
  });
  
  // Export model
  module.exports = mongoose.model("TextplosionPlayerSchema", TextplosionPlayerSchema);