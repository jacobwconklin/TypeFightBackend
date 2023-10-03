
const mongoose = require("mongoose");
const Text = require("../models/text");

// REMEMBER All controller methods must be wrapped in try catch so server doesn't crash

// Need to figure out how to handle text for each user, have them assigned for now
// TODO will need copies of original texts so that multple games can be supported simultaneously using the same texts,
// but will likely have a whole session db structure and a whole game db structure that will take in copies from text db
// and text db won't actually know the players at all - that is a future task. 

// In the future will want more sophisticated ones like get all texts in game / session probably
// handled by different endpoints. May want to group texts by length / difficulty so that we can get 
// all texts with a certain length or even theme. 
exports.getAllTexts = async (req, res) => {
    try{
        console.log("Get All Texts Called");
        const allTexts = await Text.find();
        res.status(200).json(allTexts);
    } catch(error) {
        console.log("Error in getAllTexts", error);
        res.status(500).send(error);
    }
}

exports.createNewText = async (req, res) => {
    try{
        // make sure request has entire_text
        if (req.body.entire_text) {
            const newText = await new Text({
                entire_text: req.body.entire_text
            })
            const savedNewText = await newText.save();
            res.status(200).json(savedNewText);
        } else {
            res.send("Must provide entire_text property to create a new text");
        }
    } catch(error) {
        console.log("Error in createNewText", error);
        res.status(500).send(error);
    }
}

// assigns a text to a player so that the player can update their progress on the text
exports.assignText = async (req, res) => {
    // set the player assigned to the text
    // provided the text id (assuming the player chose or was randomly assigned the text)
    // from the list of total (or fitting) texts, and the player's unique (within their session / game) name
    if (req.body && req.body.typer && req.body.textId) {
        // look for text
        try {
            const assignedText = await Text.findById(req.body.textId);
            assignedText.typer = req.body.typer;
            const savedText = await assignedText.save();
            res.status(200).json(savedText);
        } catch (error) {
            res.status(500).json({message:"Error assigning text", error})
        }
    } else {
        res.send("Must provide typer and textId properties to assign a text");
    }
}

exports.updateText = async (req, res) => {
    try{
        // change index so that all players can watch progress. Do it by matching player
        // (which should be unique to session / game) again this will be handled in session
        // db rather than actual text db later
        if (req.body.typed_index, req.body.typer) {
            // TODO consider using Text.updateOne() instead (however this returns the values in the document BEFORE the update, so I would)
            // still need to query to ensure the update occurs, but it would be more efficient if I don't need to return the updated document
            const updatedText = await Text.findOne({typer: req.body.typer})
            updatedText.typed_index = req.body.typed_index;
            const savedText = await updatedText.save();
            res.status(200).json(savedText);
        } else {
            res.send("Must provide typed_index and typer properties to update a text");
        }
    } catch(error) {
        console.log("Error in updateText", error);
        res.status(500).send(error);
    }
}

// called when finished with a text. Reset index and unassign player
exports.resetText = async (req, res) => {
    // set typer and typed_index back to default
    if (req.body && req.body.textId) {
        // look for text
        try {
            const resetText = await Text.findById(req.body.textId);
            resetText.typer = undefined;
            resetText.typed_index = 0;
            const savedText = await resetText.save();
            res.status(200).json(savedText);
        } catch (error) {
            res.status(500).json({message:"Error reseting text", error})
        }
    } else {
        res.send("Must provide textId property to reset a text");
    }
}