// handle showing players all game options (TBD Not priority), choosing a game and creating an instance of that game,
// Getting chat messages and displaying chat messages, etc. Get all players associated with a session
const mongoose = require("mongoose");
const Session = require("../models/Session");
const QuickKeysGame = require ("../models/quick_keys/quick_keys_game");
const Player = require("../models/Player");
const result = require("../models/quick_keys/result");

// Temporarily let front-end hard code in all games, if this were a public website would want the games names and images 
// stored and retrieved through the server to dynamically add and remove games
// exports.getAllGames = async (req, res) => {
//     try {
//         const allTexts = await Text.find();
//         res.status(200).json({allTexts});
//     } catch(error) {
//         console.log("Error in getAllGames", error);
//     }
// }


// TO BE HIT REPEATEDLY
// Gives all players in session and if session is started this is the MODEL for the waiting screen until host begins the game
exports.sessionStatus = async (req, res) => {
    try{
        // make sure request has sessionId
        if (req.body.sessionId) {
            const currSession = Session.findById(req.body.sessionId);
            const allPlayers = await Player.find({ session: currSession });
            res.status(200).json({session: currSession, players: allPlayers});
        } else {
            res.send("Must provide sessionId property to status a session");
        }
    } catch(error) {
        console.log("Error in session status", error);
    }
}

exports.selectGame = async (req, res) => {
    try{
        // make sure request has selected_game
        if (req.body.selected_game && req.body.sessionId) {

            await Session.findByIdAndUpdate(req.body.sessionId, {selected_game: req.body.selected_game})
            // determine game type TODO could be moved to a map or it's own function to spawn games
            let savedNewGame;
            if (req.body.selected_game === "Quick Keys") {
                // TODO determine if I should make all results here or make them with first request from each player?
                // Will try setting results with initial values here
                const currSession = Session.findById(req.body.sessionId);
                const allPlayers = await Player.find({ session: currSession });
                const initialResults = allPlayers.map(player => {
                    await (new result({
                        player: player,
                        index: 0,
                        time: undefined // once this has a value it shows the player has finished. 
                    })).save()
                });

                const newQuickKeys = await new QuickKeysGame({
                    session: currSession,
                    results: initialResults,
                    chosen_prompt: undefined // prompt hasn't been selected yet, if a rematch is called will want special function that plugs
                    // the same prompt back in
                })
                savedNewGame = await newQuickKeys.save();
            } 
            // else if ... 
            
            res.status(200).json(savedNewGame);
        } else {
            res.send("Must provide selected_game and sessionId properties to select a game");
        }
    } catch(error) {
        console.log("Error in selectGame in session controller", error);
    }
}

// get all chat messages

// get last 10 chat messages

// new chat message