const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// Replacement for original primitive Text schema that served as a POC for the MVP.
// This Schema holds the data actually necessary for filtering and supplying prompts (which will)
// just be copied and supplied to players who then report back their indicies and completion times
// to the QuickKeys schema which holds the progress of their game.
const PromptSchema = new Schema({
  prompt: { type: String, required: true, maxLength: 10000 },
  length: { type: String, enum: ["Tweet", "Paragraph", "Short Story", "Novel"]},
  category: { type: String, enum: ["History", "Funny", "Sci-Fi"]}, // could adjust / add more
  // # of characters is an easily determined number to just be promt.length, so unnecessary to include
});

// Export model
module.exports = mongoose.model("Prompt", PromptSchema);