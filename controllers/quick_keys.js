// handle methods for Quick Keys game. Mainly updating player indicies, 
// putting in player times, presenting all prompts, filtering prompts,
// and selecting a prompt
const mongoose = require("mongoose");
const QuickKeys = require("../models/quick_keys/quick_keys_game");
const Prompt = require("../models/quick_keys/prompt");
const Session = require("../models/Session");
const Player = require("../models/Player");
const Result = require("../models/quick_keys/result");

// TO BE HIT REPEATEDLY
// this is the model that can build entire view of quick keys game for players, they will hit session status until session has
// a "selected_game" property, then if they selected_game property is quick keys they will hit this endpoint
// this differentiation could be done on front-end or back-end (could be one global status endpoint that determines where)
// to status, or front-end could figure out which endpoint to hit... 
// status a current Quick Keys Game to see IF prompt is selected, then see if Game is finished, and see other player's progresses on
// the game
exports.quickKeysGameStatus = async (req, res) => {
    try{
        // Get current game and return it, within it will be the results of each player (could treat results as relational)
        // and not contain list but I am trying it this way since Mongo allows it.
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const quickKeysGame = await QuickKeys.findOne({ session: currSession });
            res.status(200).json(quickKeysGame);
        } else {
            res.send("Must provide sessionId to status a quick keys game");
        }
    } catch(error) {
        console.log("Error in quick keys game status", error);
    }
}

// combining get all prompts and get filtered prompts into one function that applies filter(s) IF given
exports.getPrompts = async (req, res) => {
    try{
        const matchingPrompts = [];
        if (req.body.category && req.body.length) {
            matchingPrompts = await Prompt.find({category: req.body.category, length: req.body.length})
        } else if (req.body.category) {
            matchingPrompts = await Prompt.find({category: req.body.category})
        } else if (req.body.length) {
            matchingPrompts = await Prompt.find({length: req.body.length})
        } else {
            // get all prompts
            matchingPrompts = await Prompt.find();
        }
        res.status(200).json(matchingPrompts);
    } catch(error) {
        console.log("Error in getAllPrompts", error);
    }
}

// select a presented prompt for the game
exports.selectPrompt = async (req, res) => {
    try{
        // make sure request has promptId
        if (req.body.promptId, req.body.sessionId) {
            // set prompt as the prompt for the Quick Keys Game instance
            const currSession = await Session.findById(req.body.sessionId);
            const chosen_prompt = await Prompt.findById(req.body.promptId);
            const updatedQuickKeysGame = await QuickKeys.findOneAndUpdate({ session: currSession }, { chosen_prompt: chosen_prompt })
            res.status(200).json(updatedQuickKeysGame);
        } else {
            res.send("Must provide promptId and sessionId properties to select a Prompt");
        }
    } catch(error) {
        console.log("Error in select Prompt", error);
    }
}

// player has progressed their index
exports.updatePlayerIndex  = async (req, res) => {
    try {
        if (req.body.playerId, req.body.index) {
            const player = await Player.findById(req.body.playerId);
            // Time to find out if Mongo array holds copy or refrence to see if I can just update the Result object directly.
            // I believe it has got to be a refrence surely.
            const updatedResult = await Result.findOneAndUpdate({player}, {index: req.body.index});
            // may be more meaningful to return whole game but if status endpoint does that I don't need to make this
            // endpoint any slower.
            res.status(200).json(updatedResult);
        } else {
            res.send("Must provide playerId and index properties to update player index");
        }
    } catch(error) {
        console.log("Error in update Player Index", error);
    }
}

// player has finished typing the prompt
exports.updatePlayerTime = async(req, res) => {
    try {
        if (req.body.playerId, req.body.time) {
            const player = await Player.findById(req.body.playerId);
            const updatedResult = await Result.findOneAndUpdate({player}, {time: req.body.time});
            res.status(200).json(updatedResult);
        } else {
            res.send("Must provide playerId and time properties to update player index");
        }
    } catch(error) {
        console.log("Error in update Player Index", error);
    }
}

// TODO game exited -> handle new game, with new prompt, same prompt, or destroy game (if back to game select).