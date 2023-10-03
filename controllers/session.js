// handle showing players all game options (TBD Not priority), choosing a game and creating an instance of that game,
// Getting chat messages and displaying chat messages, etc.
const mongoose = require("mongoose");
const Session = require("../models/Session");
const QuickKeysGame = require ("../models/quick_keys/quick_keys_game");

// Temporarily let front-end hard code in all games, if this were a public website would want the games names and images 
// stored and retrieved through the server
// exports.getAllGames = async (req, res) => {
//     try {
//         const allTexts = await Text.find();
//         res.status(200).json({allTexts});
//     } catch(error) {
//         console.log("Error in getAllGames", error);
//     }
// }

exports.selectGame = async (req, res) => {
    try{
        // make sure request has selected_game
        if (req.body.selected_game && req.body.sessionId) {

            await Session.findByIdAndUpdate(req.body.sessionId, {selected_game: req.body.selected_game})
            // determine game type TODO could be moved to a map or it's own function to spawn games
            let savedNewGame;
            if (req.body.selected_game === "Quick Keys") {
                const newQuickKeys = new QuickKeysGame({
                    session: Session.findById(req.body.sessionId)
                    // TODO determine if I should make all results here or make them with first request from each player?
                    // can't do it here now because session can't tell me all players...
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