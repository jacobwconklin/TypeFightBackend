// handle showing players all game options (TBD Not priority), choosing a game and creating an instance of that game,
// Getting chat messages and displaying chat messages, etc. Get all players associated with a session
const mongoose = require("mongoose");
const Session = require("../models/session");
const QuickKeysGame = require ("../models/quick_keys/quick_keys_game");
const Player = require("../models/Player");
const result = require("../models/quick_keys/result");
const { beginSpacebarInvaders } = require("./spacebar_invaders");

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
            const currSession = await Session.findById(req.body.sessionId);
            const allPlayers = await Player.find({ session: currSession });
            // TODO remove playerId's from allPlayers so other users can't access them
            res.status(200).json({started: currSession.started, selected_game: currSession.selected_game, players: allPlayers});
        } else {
            res.status(400).send("Must provide sessionId property to status a session");
        }
    } catch(error) {
        console.log("Error in session status", error);
        res.status(500).send(error);
    }
}

exports.begin = async (req, res) => {
    try{
        // make sure request has sessionId
        if (req.body.sessionId) {
            const updatedSession = await Session.findByIdAndUpdate(req.body.sessionId, {started: true});
            res.status(200).json(updatedSession);
        } else {
            res.status(400).send("Must provide sessionId property to begin a session");
        }
    } catch(error) {
        console.log("Error in begin session", error);
        res.status(500).send(error);
    }
}

exports.selectGame = async (req, res) => {
    try{
        // make sure request has selected_game
        if (req.body.selected_game && req.body.sessionId) {
    
            // determine game type TODO could be moved to a map or it's own function to spawn games
            let savedNewGame;
            if (req.body.selected_game === "Quick Keys") {
                // TODO determine if I should make all results here or make them with first request from each player?
                // Will try setting results with initial values here
                const currSession = await Session.findById(req.body.sessionId);
                const allPlayers = await Player.find({ session: currSession });
                const initialResults = await Promise.all(allPlayers.map( async (player) => (
                    await (new result({
                        player: player._id,
                        index: 0,
                        time: undefined // once this has a value it shows the player has finished. 
                    })).save()
                )));
                console.log(initialResults);

                const newQuickKeys = await new QuickKeysGame({
                    session: currSession._id,
                    results: initialResults,
                    prompt: undefined // prompt hasn't been selected yet, if a rematch is called will want special function that plugs
                    // the same prompt back in
                });
                // initialResults.forEach( async (res) => {
                //     newQuickKeys.results.push(res._id);
                // });
                savedNewGame = await newQuickKeys.save();
            } 
            else if (req.body.selected_game === "Spacebar Invaders") {
                // HERE begin function was moved to spacebar_invaders controller to monitor
                // interval, probably cleaner than how quick keys is started above ^
                savedNewGame = await beginSpacebarInvaders(req.body.sessionId);
            } 
            else { 
                // Invalid name for selected_game
                res.status(400).send("INVALID name for selected_game: ", req.body.selected_game);
            }
            
            // TODO verify selected_game is valid before updating the session
            const updatedSession = await Session.findByIdAndUpdate(req.body.sessionId, {selected_game: req.body.selected_game})
            res.status(200).json(savedNewGame);
        } else {
            res.status(400).send("Must provide selected_game and sessionId properties to select a game");
        }
    } catch(error) {
        console.log("Error in selectGame in session controller", error);
        res.status(500).send(error);
    }
}

exports.leaveGame = async (req, res) => {
    try{
        // make sure request has sessionId
        if ( req.body.sessionId) {
            // determine game type TODO could be moved to a map or it's own function to spawn games
            console.log("in leave game");
            const updatedSession = await Session.findByIdAndUpdate(req.body.sessionId, {selected_game: null})
            console.log("Updated ?");
            res.status(200).json(updatedSession);
        } else {
            res.status(400).send("Must provide  sessionId property to leave a game");
        }
    } catch(error) {
        console.log("Error in selectGame in session controller", error);
        res.status(500).send(error);
    }
}

// remove session and all players
exports.wipe = async (req, res) => {
    try{
        // make sure request has sessionId
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const allPlayers = await Player.find({ session: currSession });

            // delete players first 
            let numPlayersDeleted = 0;
            await Promise.all(allPlayers.map( async (player) => {
                // TODO add logic to leave players with user name + pass
                await Player.findByIdAndDelete(player._id);
                numPlayersDeleted++;
            }))
            // delete session
            const sessionDeleted = await Session.findByIdAndDelete(req.body.sessionId);
            res.status(200).json({playersDeleted: numPlayersDeleted, sessionDeleted: sessionDeleted});
        } else {
            res.status(400).send("Must provide sessionId property to wipe a session");
        }
    } catch(error) {
        console.log("Error in session wipe", error);
        res.status(500).send(error);
    }
}

// TODO handle one player leaving session (for now if they click TypeFight, in future if they exit websocket)

// get all chat messages

// get last 10 chat messages

// new chat message