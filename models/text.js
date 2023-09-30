const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// One potential methodology would be to store two separate strings, but I think this would be more cumbersome on the db
// const TextSchema = new Schema({
//   untyped_text: { type: String, required: true, maxLength: 10000 },
//   typed_text: { type: String, required: true, maxLength: 10000 },
//   typer: { type: String },
/**
 * Example of how to refrence another Schema:
 * author: { type: Schema.Types.ObjectId, ref: "Author", required: true },
 * Where Author is another defined Schema, does not require any extra imports
 */
// });

// I will store the total string permanently, and the index as to how far the user has typed to the total string never gets modified
const TextSchema = new Schema({
  entire_text: { type: String, required: true, maxLength: 10000 },
  typed_index: { type: Number, required: true, default: 0 },
  typer: { type: String },
});

// Export model
module.exports = mongoose.model("Text", TextSchema);