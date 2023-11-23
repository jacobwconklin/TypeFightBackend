/**
 * Minigame inspired by the Wario Ware gameplay version where users pump air into a balloon and one player is at the balloon having to 
 * win a minigame to "escape", while the other players perform an action to pump the balloon. If the balloon explodes before the player 
 * completes the minigame they are blown up and lose. Continue until one player is left.
 */

const mongoose = require("mongoose");
const Session = require("../models/session");
const Player = require("../models/Player");
const TextplosionGame = require("../models/textplosion/textplosion_game");
const TextplosionPlayer = require("../models/textplosion/textplosion_player");

// TO BE HIT REPEATEDLY
// this is the model that can build entire view of the textplosion game for players, they will hit session status until session has
// a "selected_game" property, then if they selected_game property is textplosion they will hit this endpoint
exports.textplosionGameStatus = async (req, res) => {
    try{
        // Get current game and return it
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const textplosionGame = await TextplosionGame.findOne({ session: currSession });

            // IF I needed to pull information from the Player object I would have to do this kind of Promise all
            // however, I plan to have all of the necessary information sitting in textplosionPlayer
            //
            // const playersInGameResults = await Promise.all(textplosionGame.playersInGame.map( async (resultId) => {
            //     const resultObject = await TextplosionPlayer.findById(resultId);
            //     // resultObject contains playerInformation including position in the line up, the first player has position 0
            //     const playerObject = await Player.findById(resultObject.player);
            //     return { player: playerObject, time: resultObject.time, index: resultObject.index }
            // }));

            // get TextsplosionPlayer object for each id in array and create array
            const playersInGameResults = await Promise.all(textplosionGame.playersInGame.map( async (playerId) => {
                const playerInGame = await TextplosionPlayer.findById(playerId);
                // resultObject contains playerInformation including position in the line up, the first player has position 0
                return playerInGame;
            }));

            res.status(200).json({game: textplosionGame, players: playersInGameResults});
        } else {
            res.status(400).send("Must provide sessionId to status textplosion game");
        }
    } catch(error) {
        console.log("Error in textplosion game status", error);
        res.status(500).send(error);
    }
}

// begin a new game of Textplosion
exports.beginTextplosion = async (sessionId) => {
    try {
        if (sessionId) {
            // get # of players and create array of ids of TextplosionPlayer objects for new game object
            const currSession = await Session.findById(sessionId);
            const playersInSession = await Player.find({ session: currSession });
            const playersInGame = [];
            await Promise.all(playersInSession.map( async (player, index) => {
                // create and save new TextplosionPlayer object to add into the array
                const newTextplosionPlayer = new TextplosionPlayer({
                    playerId: player,
                    blownUp: false,
                    position: index,
                    alias: player.alias,
                    icon: player.icon,
                    font: player.font,
                    color: player.color
                });
                const savedTextplosionPlayer = await newTextplosionPlayer.save();
                playersInGame.push(savedTextplosionPlayer._id);
            }))

            const newGame = await new TextplosionGame({
                session: sessionId,
                // TODO can update this to be more random? but I don't think players will actually know so I doubt it 
                // 100% matters. I also think these should be larger numbers in general but want to keep it smaller to test 
                // at first
                charsToPop: getCharsToPop(sessionId),
                charsTyped: 0,
                playersInGame
            })
            const savedNewGame = await newGame.save();
            return savedNewGame;
        } else {
            console.log("Must provide sessionId to begin Spacebar Invaders");
        }
    } catch(error) {
        console.log("Error in begin spacebar invaders", error);
    }
}

// when user finishes entering a word to pump
exports.pump = async (req, res) => {
    try {
        if (req.body.sessionId && req.body.word) {
            // update characters typed and compare it to characters to pop
            // if it reaches or surpasses take the player CURRENTLY at position 0 and 
            // BLOW THEM UP by setting their status
            const currSession = await Session.findById(req.body.sessionId);
            const textplosionGame = await TextplosionGame.findOne({ session: currSession });
            const newTotalTyped = textplosionGame.charsTyped + req.body.word.length
            textplosionGame.charsTyped = newTotalTyped;
            await textplosionGame.save();
            if ( newTotalTyped >= textplosionGame.charsToPop ) {
                // reset charsTyped and charsToPop
                textplosionGame.charsTyped = 0;
                textplosionGame.charsToPop = getCharsToPop(req.body.sessionId);
                await textplosionGame.save();

                // Player gets wrecked find whoever is up front and set their blownUp status to true
                // then reset all other player positions so that a new player is at index 0
                let playersInGame = [];
                await Promise.all(textplosionGame.playersInGame.map( async (playerId) => {
                    const playerInGame = await TextplosionPlayer.findById(playerId);
                    if (!playerInGame.blownUp) {
                        // IF they are in the hot seat BLOW THEM UP here
                        if (playerInGame.position === 0) {
                            playerInGame.blownUp = true;
                            await playerInGame.save();
                        } else {
                            // if not blown up add them to the array
                            playersInGame.push(playerInGame);
                        }
                    }
                }));

                // now cycle through players not blown up (Throws error if game is only played by one person, need to)
                // make sure game can't be selected by one player or add in a bot if it is, but for now will wrap in an if
                // to prevent errors
                if (playersInGame.length > 0) {
                    await Promise.all(playersInGame.sort( (a, b) => a.position - b.position ).map( async (player, index) => {
                        player.position = index;
                        await player.save();
                    }));
                }
            }
            // otherwise go on business as usual
            res.status(200).send("word pumped");
        } else {
            res.status(400).send("Must provide sessionId and word to pump in textplosion game");
        }
    } catch(error) {
        console.log("Error in textplosion game pump", error);
        res.status(500).send(error);
    }
}

// when user escapes the hotseat, causes update to the order 
exports.escape = async (req, res) => {
    try {
        if (req.body.sessionId) {
            // update players moving player currently at 0th position to end of queue of players Still in game
            // must count # of players still in game and order them by position, then cycle through that 
            // setting whoever is at 0 to the count-nth place and everyone else in order such that they are at
            // their index - 1
            const currSession = await Session.findById(req.body.sessionId);
            const textplosionGame = await TextplosionGame.findOne({ session: currSession });
            // get all players in game and count number not blown up
            let countNotBlownUp = 0;
            let playersInGame = [];
            await Promise.all(textplosionGame.playersInGame.map( async (playerId) => {
                const playerInGame = await TextplosionPlayer.findById(playerId);
                if (!playerInGame.blownUp) {
                    // if not blown up increment count and add them to the array
                    countNotBlownUp += 1;
                    playersInGame.push(playerInGame);
                }
            }));
            // now cycle through players not blown up, I think this is solid logic but may need to log through it to 
            // ensure a player gets the all important 0 position to get on the hot seat. 
            let currSetPosition = 0;
            await Promise.all(playersInGame.sort( (a, b) => a.position - b.position ).map( async (player) => {
                if (player.position === 0) {
                    player.position = countNotBlownUp - 1;
                    await player.save();
                } else {
                    player.position = currSetPosition;
                    currSetPosition += 1;
                    await player.save();
                }
            }));

            res.status(200).send("Escaped");
        } else {
            res.status(400).send("Must provide sessionId to escape in textplosion game");
        }
    } catch(error) {
        console.log("Error in textplosion game escape", error);
        res.status(500).send(error);
    }
}

// private function to decide the number of chars needed to pop
const getCharsToPop = (sessionId) => {
    const currSession = Session.findById(sessionId);
    const playersInSession = Player.find({ session: currSession });
    // TODO can update this to be more random? but I don't think players will actually know so I doubt it 
    // 100% matters. I also think these should be larger numbers in general but want to keep it smaller to test 
    // at first
    const charsToPop = (20 + (playersInSession.length * ((~~(Math.random() * 20)) + 20)));
    // return charsToPop;
    // TODO temporary easy number
    return 20;
}