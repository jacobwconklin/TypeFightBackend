// handle methods for Quick Keys game. Mainly updating player indicies, 
// putting in player times, presenting all prompts, filtering prompts,
// and selecting a prompt
const mongoose = require("mongoose");
const QuickKeys = require("../models/quick_keys/quick_keys_game");
const Prompt = require("../models/quick_keys/prompt");
const Session = require("../models/session");
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
            // need prompt to decide if on select prompt screen or starting game
            // get name of player, index, and time (if it exists) for reach result to create view 

            const playerResults = await Promise.all(quickKeysGame.results.map( async (resultId) => {
                const resultObject = await Result.findById(resultId);
                // resultObject contains half of our information plus the player's ID
                const playerObject = await Player.findById(resultObject.player);
                return { player: playerObject, time: resultObject.time, index: resultObject.index }
            }));
            res.status(200).json({prompt: quickKeysGame.prompt, results: playerResults});
        } else {
            res.status(400).send("Must provide sessionId to status a quick keys game");
        }
    } catch(error) {
        console.log("Error in quick keys game status", error);
        res.status(500).send(error);
    }
}

// add a new prompt 
exports.addPrompt = async (req, res) => {
    try {
        if (req.body.category && req.body.length && req.body.title && req.body.prompt) {
            const newPrompt = await new Prompt({
                prompt: req.body.prompt,
                category: req.body.category,
                length: req.body.length,
                title: req.body.title,
                author: req.body.author? req.body.author : undefined
            });
            const savedNewPrompt = await newPrompt.save();
            res.status(200).send(savedNewPrompt);
        } else {
            res.status(400).send("Must provide category, length, title, and prompt properties to add a Prompt");
        }
    } catch(error) {
        console.log("Error in addPrompt", error);
        res.status(500).send(error);
    }
}

// combining get all prompts and get filtered prompts into one function that applies filter(s) IF given
exports.getPrompts = async (req, res) => {
    try {
        let matchingPrompts = [];
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
        res.status(400).status(200).json(matchingPrompts);
    } catch(error) {
        console.log("Error in getAllPrompts", error);
        res.status(500).send(error);
    }
}

// select a presented prompt for the game
exports.selectPrompt = async (req, res) => {
    try{
        // make sure request has promptId
        if (req.body.promptId && req.body.sessionId) {
            // set prompt as the prompt for the Quick Keys Game instance
            const currSession = await Session.findById(req.body.sessionId);
            const chosen_prompt = await Prompt.findById(req.body.promptId);
            const updatedQuickKeysGame = await QuickKeys.findOneAndUpdate({ session: currSession }, { prompt: chosen_prompt.prompt })
            res.status(200).json(updatedQuickKeysGame);
        } else {
            res.status(400).send("Must provide promptId and sessionId properties to select a Prompt");
        }
    } catch(error) {
        console.log("Error in select Prompt", error);
        res.status(500).send(error);
    }
}

// un-select prompt to select a new one after game ends
// reset player indicies and times, and show prompt select screen again
exports.newPrompt = async (req, res) => {
    try{
        // make sure request has sessionId
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const quickKeysGame = await QuickKeys.findOne({ session: currSession });
            // set prompt
            quickKeysGame.prompt = null;
            // find each result object and set its index to 0 and time to null
            await Promise.all(quickKeysGame.results.map( async (res) => {
                await Result.findByIdAndUpdate(res, {index: 0, time: null});
            }))
            const savedQuickKeysGame = quickKeysGame.save();
            res.status(200).json(savedQuickKeysGame);
        } else {
            res.status(400).send("Must provide sessionId properties to return to select a new Prompt");
        }
    } catch(error) {
        console.log("Error in new Prompt", error);
        res.status(500).send(error);
    }
}

// keep selected prompt for a rematch
// reset player indicies and times, but keep prompt selected
exports.rematch  = async (req, res) => {
    try{
        // make sure request has sessionId
        console.log("In rematch");
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const quickKeysGame = await QuickKeys.findOne({ session: currSession });
            // find each result object and set its index to 0 and time to null
            await Promise.all(quickKeysGame.results.map( async (res) => {
                await Result.findByIdAndUpdate(res, {index: 0, time: null});
            }))
            res.status(200).json(quickKeysGame);
        } else {
            res.status(400).send("Must provide sessionId property to rematch");
        }
    } catch(error) {
        console.log("Error in rematch in Quick Keys", error);
        res.status(500).send(error);
    }
}

// player has progressed their index
exports.updatePlayerIndex  = async (req, res) => {
    try {
        if (req.body.playerId && req.body.index) {
            const player = await Player.findById(req.body.playerId);
            // Time to find out if Mongo array holds copy or refrence to see if I can just update the Result object directly.
            // I believe it has got to be a refrence surely.
            const oldResult = await Result.findOneAndUpdate({player: player}, {index: req.body.index});
            // may be more meaningful to return whole game but if status endpoint does that I don't need to make this
            // endpoint any slower.
            // returning oldResult will just show the old value so TODO determine if better to show new value or nothing or something else
            res.status(200).json(oldResult);
        } else {
            res.status(400).send("Must provide playerId and index properties to update player index");
        }
    } catch(error) {
        console.log("Error in update Player Index", error);
        res.status(500).send(error);
    }
}

// player has finished typing the prompt
exports.updatePlayerTime = async(req, res) => {
    try {
        if (req.body.playerId && req.body.time) {
            const player = await Player.findById(req.body.playerId);
            const oldResult = await Result.findOneAndUpdate({player}, {time: req.body.time});
            // again oldResult probably won't be of any value to front-end may just disregard
            res.status(200).json(oldResult);
        } else {
            res.status(400).send("Must provide playerId and time properties to update player index");
        }
    } catch(error) {
        console.log("Error in update Player Index", error);
        res.status(500).send(error);
    }
}

// TODO game exited -> handle new game, with new prompt, same prompt, or destroy game (if back to game select).

exports.wipe = async(req, res) => {
    try {
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const quickKeysGame = await QuickKeys.findOne({ session: currSession });

            // delete results first TODO don't think deleting QuickKeys would handle this
            let numResultsDeleted = 0;
            await Promise.all(quickKeysGame.results.map( async (res) => {
                await Result.findByIdAndDelete(res);
                numResultsDeleted++;
            }))
            // delete quick keys
            const quickKeysDeleted = await QuickKeys.findOneAndDelete({session: currSession});
            res.status(200).json({resultsDeleted: numResultsDeleted, quickKeysDeleted: quickKeysDeleted});
        } else {
            res.status(400).send("Must provide sessionId property to wipe a Quick Keys game");
        }
    } catch(error) {
        console.log("Error in wiping Quick Keys", error);
        res.status(500).send(error);
    }
}