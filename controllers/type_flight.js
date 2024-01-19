const mongoose = require("mongoose");
const Session = require("../models/session");
const TypeFlightGame = require("../models/type-flight/typeflight_game");
const TypeFlightEvent = require("../models/type-flight/typeflight_event");
const TypeFlightPlayer = require("../models/type-flight/typeflight_player");
const Player = require("../models/Player");


// A slower interval as it only handles creating events
const updateGameInterval = 1000;
// will effectively store the "intervals" here on the server in a map, so that they can be destroyed when players finish the game
// connect each interval to their session by session id
const sessionToIntervalMap = {}

const bombDelay = 5000;
const bombDuration = 2000;

// given an event position, player position, and event type, check if the event does
// hit the player (only called when event is active so no verification needed there)
// returns TRUE if player is hit
const checkEventHitsPlayer = (eventPosition, playerPosition, eventType) => {
    if (eventType === "bomb") {
        let hitSpots = {
            topLeft: eventPosition - 11,
            topMiddle: eventPosition - 10,
            topRight: eventPosition - 9,
            middleLeft: eventPosition - 1,
            middleMiddle: eventPosition,
            middleRight: eventPosition + 1,
            bottomLeft: eventPosition + 9,
            bottomMiddle: eventPosition + 10,
            bottomRight: eventPosition + 11
        }
        // if event position ends with 9 subtract 9 for the right 3 (instead of adding 1 so actually subtract 10)
        if (eventPosition % 10 === 9) {
            hitSpots.topRight -= 10;
            hitSpots.middleRight -= 10;
            hitSpots.bottomRight -= 10;
        }
        // if event position ends with 0 add 9 (so actually 10) for the left 3
        if (eventPosition % 10 === 0) {
            hitSpots.topLeft += 10;
            hitSpots.middleLeft += 10;
            hitSpots.bottomLeft += 10;
        }
        // if event position starts with 9 subtract 90 (so actually 100) for bottom 3
        if (eventPosition >= 90) {
            hitSpots.bottomLeft -= 100;
            hitSpots.bottomMiddle -= 100;
            hitSpots.bottomRight -= 100;
        }
        // if event position less than 10 add 90 (so actually 100) for top 3
        if (eventPosition < 10) {
            hitSpots.topLeft += 100;
            hitSpots.topMiddle += 100;
            hitSpots.topRight += 100;
        }
        // check all hit spots for player position
        for (const property in hitSpots) {
            if (playerPosition === hitSpots[property]) {
                return true;
            }
        }
        return false;
    } else {
        throw ("Event type not recognized");
    }
}

// create new events, handle events (checking if they hit any players), 
// and destroy the events afterwards
const createRandomEvent = async (typeFlightId) => {
    // decide the type of event randomly
    const eventType = Math.random();
    if (eventType < 1) { // TODO change this down to 0.2 once more event types are created. 
        // bomb
        const newEvent = new TypeFlightEvent({
            typeFlightGame: typeFlightId,
            position: ~~(Math.random() * 100),
            activated: false,
            type: "bomb"
        });
        const savedNewEvent = await newEvent.save();
        // console.log("Created bomb: ", savedNewEvent._id);
        // activate after delay 
        setTimeout(async () => {
            // activate bomb then check for any living players that are hit
            await TypeFlightEvent.findByIdAndUpdate(savedNewEvent._id, {activated: true});
            const game = await TypeFlightGame.findById(typeFlightId);
            let numberOfDeadPlayers = 0;
            await Promise.all(game.playersInGame.map(async (playerId) => {
                const playerObject = await TypeFlightPlayer.findById(playerId);
                if (playerObject.isAlive && checkEventHitsPlayer(savedNewEvent.position, playerObject.position, "bomb")) {
                    // player is killed
                    playerObject.isAlive = false;
                    await playerObject.save();
                    numberOfDeadPlayers++;
                } else if (!playerObject.isAlive) {
                    numberOfDeadPlayers++;
                }
            }));
            // All players dead set endTimeAbsolute to effectively end the game (even if someone was revived mid-loop)
            if (numberOfDeadPlayers === game.playersInGame.length) {
                game.endTimeAbsolute = Date.now();
                await game.save();
            }
            // console.log("Activated bomb: ", savedNewEvent._id);
            setTimeout(async () => {
                await TypeFlightEvent.findByIdAndDelete(savedNewEvent._id);
                // console.log("Destroyed bomb: ", savedNewEvent._id);
            }, bombDuration);
        }, bombDelay);

    } else if (eventType < 0.4) {
        // laser
    } else if (eventType < 0.6) {
        // lightning
    } else if (eventType < 0.8) {
        // fire
    } else {
        // ice
    }
}

// handle game "tick" performing all logic to spawn events, 
const updateGame = async (typeFlightId) => {
    try {
        const game = await TypeFlightGame.findById(typeFlightId);
        
        if (game && !game.endTimeAbsolute) {
            // simply spawn more events, activate them after a waiting period, and then destroy them
            // spawn them at a rate based on the current time
            const currTime = new Date();
            const secondsElapsed = ((Date.now() - game.startTimeAbsolute) / 1000);
            const increaseEventsSpawnedAfterThisManySeconds = 20; // TODO tweak here,
            const defaultMaxEvents = 3;

            // // One idea I have but I'm not married to it, for every 'x' number of seconds passed plus a default
            // // amount try to generate a random number and decide if an event is spawned, this way it is still random
            // // but overall increasing as time passes, but don't want the numbers to shoot up so players are able to last for a few 
            // // minutes.
            // for (let i = 0; i < (3 + ~~(secondsElapsed / increaseEventsSpawnedAfterThisManySeconds)); i++) {  
            //     // randomly decide for each possible event if one will be created
            //     // TODO for now a 50 / 50 chance, may want to adjust this over time or just change it
            //     if (Math.random() > 0.5) {
            //         createRandomEvent(typeFlightId);
            //     }
            // }

            // scratch that idea, instead just have a "max" number of events that slowly increases based on a default + time elapsed
            // and if less than that max number currently exist go ahead and spawn one more (so only 1 spawns per iteration (second))
            // with this formula the maximum amount of events will basically always be present, so the delay between events appearing and
            // activating should be ramped up
            const maxEvents = (defaultMaxEvents + ~~(secondsElapsed / increaseEventsSpawnedAfterThisManySeconds));
            // Find the current number of events and check if max is reached
            const allEventsForGame = await TypeFlightEvent.find({ typeFlightGame: typeFlightId });
            if (allEventsForGame.length < maxEvents) {
                // spawn 1 more event
                createRandomEvent(typeFlightId);
            }

        }
    } catch (error) {
        console.log("Error in update game: ", error);
    }
}

// Status a game of Type Flight
exports.typeFlightStatus = async (req, res) => {
    try{
        // Get current game and return it along with an array of all included enemies and their positions
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const game = await TypeFlightGame.findOne({ session: currSession });
            const events = await TypeFlightEvent.find({typeFlightGame: game._id});
            const players = await Promise.all(game.playersInGame.map( async (playerId) => {
                const typeFlightPlayerObject = await TypeFlightPlayer.findById(playerId);
                const standardPlayerObject = await Player.findById(typeFlightPlayerObject.playerId);
                return {position: typeFlightPlayerObject.position, playerId: typeFlightPlayerObject.playerId, alias: standardPlayerObject.alias, icon: standardPlayerObject.icon, 
                    font: standardPlayerObject.font, color: standardPlayerObject.color, isAlive: typeFlightPlayerObject.isAlive
                };
            }));
            // need game for start time and end time
            res.status(200).json({game, events, players});
        } else {
            res.status(400).send("Must provide sessionId to status a type flight game");
        }
    } catch(error) {
        console.log("Error in type flight game status", error);
        res.status(500).send(error);
    }
}

// Boot up a game of Type Flight
// (will create an "infinite" running interval until game is finished) (players leave or die)
exports.beginTypeFlight = async (sessionId) => {
    try {
        if (sessionId) {
            // find all players in this session
            const allPlayersInSession = await Player.find({session: sessionId});
            // for each player in session create a TypeFlightPlayer object
            const playersInGame = await Promise.all(allPlayersInSession.map( async(player) => {
                const newTypeFlightPlayerObject = new TypeFlightPlayer({
                    playerId: player._id,
                    isAlive: true,
                    position: ~~(Math.random() * 100)
                });
                const savedPlayer = await newTypeFlightPlayerObject.save();
                return savedPlayer;
            }))
            const newGame = new TypeFlightGame({
                session: sessionId,
                playersInGame: playersInGame.map(player => player._id),
                startTimeAbsolute: Date.now(),
                endTimeAbsolute: null,
            })
            const savedNewGame = await newGame.save();
            const gameInterval = setInterval(updateGame, updateGameInterval, savedNewGame._id);
            // save interval so it can be cleared later (can be accessed the same way) i.e.: sessionToIntervalMap["" + game._id]
            sessionToIntervalMap["" + savedNewGame._id] = gameInterval;
            // give a few seconds before first round of enemies
            return savedNewGame;
        } else {
            console.log("Must provide sessionId to begin Type Flight");
        }
    } catch(error) {
        console.log("Error in begin Type Flight", error);
    }
}

// player has moved
// TODO Handle checking if the player moved into the blast area of an event that is active and kill the player
exports.updatePlayerPosition  = async (req, res) => {
    try {
        console.log("here?? Really?", req.body);
        if (req.body.playerId && req.body.sessionId && req.body.position ) {

            console.log("1");
            // update player to be at new position
            const updatedPlayer = await TypeFlightPlayer.findOneAndUpdate({ playerId: req.body.playerId}, {position: req.body.position});
            
            console.log("2");
            // check if new position is inside of an active event
            const typeFlightGame = await TypeFlightGame.findOne({session: req.body.sessionId});
            const allEvents = await TypeFlightEvent.find({typeFlightGame: typeFlightGame});
            console.log("3");
            // look through all of the events
            await Promise.all(allEvents.filter(event => event.activated).map( async (event) => {
                // check each active event
            console.log("4");
                if (checkEventHitsPlayer(event.position, req.body.playerId, event.type)) {
                    // kill player 
                    await TypeFlightPlayer.findOneAndUpdate({playerId: req.body.playerId}, {isAlive: false});
                    console.log("5");
                    // now check if all players are dead and if so set endTimeAbsolute to end game
                    let numberOfDeadPlayers = 0;
                    await Promise.all(typeFlightGame.playersInGame.map(async (playerId) => {
                        console.log("6");
                        const playerObject = await TypeFlightPlayer.findById(playerId);
                        if (!playerObject.isAlive) {
                            numberOfDeadPlayers++;
                        }
                    }));
                    console.log("7");
                    if (numberOfDeadPlayers === typeFlightGame.playersInGame.length) {
                        typeFlightGame.endTimeAbsolute = Date.now();
                        await typeFlightGame.save();
                    }
                }
            }));
            console.log("8");
            res.status(200).json(updatedPlayer);
        } else {
            res.status(400).send("Must provide playerId, sessionId, and position (Int) properties to update player position");
        }
    } catch(error) {
        console.log("Error in update Player Position in Type Flight", error);
        res.status(500).send(error);
    }
}

// handle a revive of a player
exports.revive = async (req, res) => {
    try {
        if (req.body.playerId) {

            // revive player
            const revivedPlayer = await TypeFlightPlayer.findOneAndUpdate({ playerId: req.body.playerId}, {isAlive: true});
            res.status(200).json(revivedPlayer);
        } else {
            res.status(400).send("Must provide playerId of player being revived to revive a player");
        }
    } catch(error) {
        console.log("Error in revive player in Type Flight", error);
        res.status(500).send(error);
    }
}

// wipe a game (if players all leave or choose to play a new game)
// will cancel running interval as well as remove memory from Mongo DB
exports.wipe = async(req, res) => {
    try{
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            // shut down interval first
            clearInterval(sessionToIntervalMap["" + req.body.sessionId]);
            delete sessionToIntervalMap["" + req.body.sessionId];
            const game = await TypeFlightGame.findOne({ session: currSession });

            // delete all associated TypeFlightPlayers
            await Promise.all(game.playersInGame.map( async(playerId) => {
                await TypeFlightPlayer.findByIdAndDelete(playerId);
            }))

            // delete the game itself
            const deletedGame = await TypeFlightGame.findOneAndDelete({ session: currSession });

            // delete all associated events (if any)
            const deletedEvents = await TypeFlightEvent.deleteMany({typeFlightGame: game._id});
            res.status(200).json(deletedGame);
        } else {
            res.status(400).send("Must provide sessionId to wipe a typeflight game");
        }
    } catch(error) {
        console.log("Error in typeflight wipe", error);
        res.status(500).send(error);
    }
}