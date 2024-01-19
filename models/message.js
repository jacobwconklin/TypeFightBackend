// Holds one chat message

const mongoose = require("mongoose");
const Session = require("./session");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    message: {type: String, required: true},
    playerAlias: {type: String, required: true }, 
    session: { type: mongoose.ObjectId, ref: Session} // optional in case players play solo, but may still create one if easier for consistency
  });
  
  // Export model
  module.exports = mongoose.model("Message", MessageSchema);