// handle showing players all game options (TBD Not priority), choosing a game and creating an instance of that game,
// Getting chat messages and displaying chat messages, etc. Get all players associated with a session
const mongoose = require("mongoose");
const Session = require("../models/session");
const Message = require("../models/message");
const QuickKeysGame = require ("../models/quick_keys/quick_keys_game");
const SpacebarInvadersGame = require ("../models/spacebar_invaders/spacebar_invaders_game");
const Player = require("../models/Player");
const result = require("../models/quick_keys/result");
const { beginSpacebarInvaders } = require("./spacebar_invaders");
const { beginTextplosion } = require("./textplosion");
const { beginTypeFlight } = require("./type_flight");

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

// Make sure game names match the routes for those games.
exports.selectGame = async (req, res) => {
    try{
        // make sure request has selected_game
        if (req.body.selected_game && req.body.sessionId) {
    
            // determine game type TODO could be moved to a map or it's own function to spawn games
            let savedNewGame;
            if (req.body.selected_game === "quick-keys") {
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
            else if (req.body.selected_game === "spacebar-invaders") {
                // HERE begin function was moved to spacebar_invaders controller to monitor
                // interval, probably cleaner than how quick keys is started above ^
                savedNewGame = await beginSpacebarInvaders(req.body.sessionId);
            } 
            else if (req.body.selected_game === "textplosion") {
                // call game spawner in textplosion controller
                savedNewGame = await beginTextplosion(req.body.sessionId);
            } 
            else if (req.body.selected_game === "typeflight") {
                savedNewGame = await beginTypeFlight(req.body.sessionId);
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

// leaves the currently selected game
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
        console.log("Error in leave game in session controller", error);
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
            // delete messages from session
            await Message.deleteMany({ session: currSession });
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

// handle one player leaving session
exports.exit = async (req, res) => {
    try{
        // make sure request has sessionId
        if (req.body.sessionId, req.body.playerId) {
            const currSession = await Session.findById(req.body.sessionId);
            const playersInSession = await Player.find({ session: currSession });
            // if the last player then wipe the session else remove only this player
            if (playersInSession.length === 1 && playersInSession[0]._id === req.body.playerId) {
                // wipe session
                const playerDeleted = await Player.findByIdAndDelete(req.body.playerId);
                const sessionDeleted = await Session.findByIdAndDelete(req.body.sessionId);
                res.status(200).json({playerDeleted, sessionDeleted});
                // TODO could delete all games associated with a given session here rather than complicating things by having functions
                // for one player leaving each and every game, but on the downside one long-running session could be responsible for a lot
                // of data objects being created. For now I will try purging all games with the given sessionId
                await QuickKeysGame.deleteMany({ session: sessionDeleted._id });
                await SpacebarInvadersGame.deleteMany({ session: sessionDeleted._id });
            } else {
                // "remove player from session" by deleting the player object from memory
                const playerDeleted = await Player.findByIdAndDelete(req.body.playerId);
                res.status(200).json({playerDeleted, sessionDeleted: false});
            }
        } else {
            res.status(400).send("Must provide sessionId and playerId properties to exit a session");
        }
    } catch(error) {
        console.log("Error in exit session", error);
        res.status(500).send(error);
    }
}

// get all chat messages
exports.getAllChatMessages = async (req, res) => {
    try{
        // make sure request has sessionId
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const allMessages = await Message.find({ session: currSession });
            res.status(200).json(allMessages);
        } else {
            res.status(400).send("Must provide sessionId property to get all chat messages");
        }
    } catch(error) {
        console.log("Error in get all chat messages", error);
        res.status(500).send(error);
    }
}

// get last 10 chat messages

// new chat message
exports.addChatMessage = async (req, res) => {
    try{
        // make sure request has sessionId
        if (req.body.sessionId && req.body.message && req.body.playerId) {
            const currSession = await Session.findById(req.body.sessionId);
            const player = await Player.findById(req.body.playerId);
            const newMessage = await new Message({
                session: currSession._id,
                message: req.body.message,
                playerAlias: player.alias
            }).save();
            res.status(200).json(newMessage);
        } else {
            res.status(400).send("Must provide sessionId, playerId, and message properties to add a chat message");
        }
    } catch(error) {
        console.log("Error in add chat message", error);
        res.status(500).send(error);
    }
}