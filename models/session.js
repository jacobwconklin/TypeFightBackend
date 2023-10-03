// Tracks all users involved in one online session together, namely one host and 
// other joined players. May track scores across multiple games? Not sure
// created when a host goes to create a new session.

// TODO for now a player will just use their join code to get the session id from the backend, then
// add that session id to all of their requests, the session id will tell if the session has started,
// and if so what game is selected, then the controllers can find that game with the player's session
// and update the player's results in that game structure

// TODO need to figure out how / when to delete old sessions to not clog db...
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// A relational model would simply store the primary key of the Session in the player Object,
// but Mongo allows storing arrays of subdocuments within a document so I will probably do that
const SessionSchema = new Schema({
    selected_game: {type: String, enum: ["Quick Keys", "Type Fight", "Word War 1"]},
    join_code: { type: String, required: true, maxLength: 12 },
    started: {type: Boolean, default: false}
    // TODO in the future can hold chats here where it will be an array of chat models each holding a player
    // and a message. Shouldn't be too brutal. 
});

// Export model
module.exports = mongoose.model("Session", SessionSchema);