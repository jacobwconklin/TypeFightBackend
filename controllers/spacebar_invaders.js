// TODO TODO figure out more 'optimal' way of continually updating the game server side, for now will use 
// a setInterval per game as done here: https://github.com/vzhou842/example-.io-game/blob/master/src/server/game.js
// also good ideas in this tutorial by the author: https://victorzhou.com/blog/build-an-io-game-part-1/#5-client-rendering
const mongoose = require("mongoose");
const Session = require("../models/session");
const SpacebarInvaders = require("../models/spacebar_invaders/spacebar_invaders_game");
const Enemy = require("../models/spacebar_invaders/enemy");
const Player = require("../models/Player");

const innerBound = 200;
const outerBound = 500; // TODO may increase this on higher waves ... 
const millisecondsBetweenWaves = 5000;
// TODO speed up with each wave?
const creepSpeed = 15;  // 15;
const updateGameInterval = 1000;

// will effectively store the "intervals" here on the server in a map, so that they can be destroyed when players finish the game
// connect each interval to their session by session id
const sessionToIntervalMap = {}

// handle game "tick" performing all logic to move enemies and see if they collide with earth 
const updateGame = async (spacebarInvadersId, sessionId) => {
    try {
        const game = await SpacebarInvaders.findById(spacebarInvadersId);
        
        if (game && game.enemies && game.enemies.length > 0) {
            // try grabbing each enemy, if they happened to be deleted but still in the list for a split second
            // do nothing
            await Promise.all(game.enemies.map(async (enemyId) => {
                try {
                    // move enemy towards 0-0 TODO change speed of movement based on word length maybe? 
                    const enemyObject = await Enemy.findById(enemyId);
                    const creepSpeedPlusWaveFactor = game.wave > 5 ? creepSpeed + 5 + Math.floor(game.wave / 2) : creepSpeed + game.wave;
                    if (enemyObject.x > 8) {
                        enemyObject.x = enemyObject.x - creepSpeedPlusWaveFactor;
                    } else if (enemyObject.x < -8) {
                        enemyObject.x = enemyObject.x + creepSpeedPlusWaveFactor;
                    }
                    if (enemyObject.y > 8) {
                        enemyObject.y = enemyObject.y - creepSpeedPlusWaveFactor;
                    } else if (enemyObject.y < -8) {
                        enemyObject.y = enemyObject.y + creepSpeedPlusWaveFactor;
                    }
                    // check for earth collision
                    // TODO measurement may vary based on image
                    if ( enemyObject.x < 10 && enemyObject.x > -10 && enemyObject.y < 10 && enemyObject.y > -10  ) {
                        // destroy enemy and damage earth
                        game.health -= 1;
                        game.enemies = game.enemies.filter(enemy => !enemy.equals(enemyId));
                        // if 0 health reached game is over end the interval
                        const savedGame = await game.save();
                        if (savedGame.health < 1) {
                            // game is over
                            // clearInterval(sessionToIntervalMap["" + req.body.sessionId]);
                            // delete sessionToIntervalMap["" + req.body.sessionId];
                            // const deletedGame = await SpacebarInvaders.findOneAndDelete({ session: currSession });
                        } else if (game.enemies.length === 0 ) {
                            // wave completed
                            savedGame.wave++;
                            await savedGame.save();
                            // wait then spawn new wave
                            setTimeout(async () => {
                                // commence new wave
                                const currGame = await SpacebarInvaders.findById(spacebarInvadersId);
                                currGame.enemies = await spawnEnemies(currGame.wave, sessionId);
                                await currGame.save();
                            }, millisecondsBetweenWaves);
                        }
                        await Enemy.findByIdAndDelete(enemyId);
                    } else {
                        await enemyObject.save();
                    }
                } catch (error) {
                    console.log("Error updating game for an enemy");
                }
            }))
        } 
        // if game object is gone clear interval (this is just a backup and should not be how interval is cleared)
        else if (game === null || (!game.enemies && !game.wave && !game.health)) { 
            // TODO rather than deleting everything may want way to re-boot interval if something happens to server picking up where
            // game still is? 
            try {
                // clearInterval(sessionToIntervalMap["" + sessionId]);
                // delete sessionToIntervalMap["" + req.body.sessionId];
            } catch(error) {
                console.log("Error clearing interval within interval in spacebar invaders");
            }
        }
    } catch (error) {
        console.log("Error in update game: ", error);
    }
}

// Status a game of spacebar invaders
exports.spacebarInvadersStatus = async (req, res) => {
    try{
        // Get current game and return it along with an array of all included enemies and their positions
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const game = await SpacebarInvaders.findOne({ session: currSession });
            const enemies = await Promise.all(game.enemies.map( async (enemyId) => {
                const enemyObject = await Enemy.findById(enemyId);
                return enemyObject;
            }));
            res.status(200).json({enemies, wave: game.wave, health: game.health});
        } else {
            res.status(400).send("Must provide sessionId to status a spacebar invaders game");
        }
    } catch(error) {
        console.log("Error in spacebar invaders game status", error);
        res.status(500).send(error);
    }
}

// Boot up a game of spacebar invaders (will create an "infinite" running interval until game is finished) (players leave or die)
exports.beginSpacebarInvaders = async (sessionId) => {
    try {
        if (sessionId) {
            const newGame = await new SpacebarInvaders({
                enemies: [],
                session: sessionId
            })
            const savedNewGame = await newGame.save();
            const gameInterval = setInterval(updateGame, updateGameInterval, savedNewGame._id, sessionId); // TODO tweak interval
            // save interval so it can be cleared later (can be accessed the same way) i.e.: sessionToIntervalMap["" + game._id]
            sessionToIntervalMap["" + savedNewGame._id] = gameInterval;
            // give a few seconds before first round of enemies
            setTimeout(async () => {
                const game = await SpacebarInvaders.findById(savedNewGame._id);
                const spawnedEnemies = await spawnEnemies(0, sessionId);
                game.enemies = spawnedEnemies;
                const savedGame = await game.save();
            }, 3000);
            
            return savedNewGame;
        } else {
            console.log("Must provide sessionId to begin Spacebar Invaders");
        }
    } catch(error) {
        console.log("Error in begin spacebar invaders", error);
    }
}

// Update player defeating an enemy. If the last enemy then setTimeout then spawn more and then increment wave count (this is to ensure)
// it only happens when the last enemy dies once that a new wave begins
// TODO add effects like killing a big word spawning lots of one letters or two letter words? 
exports.destroy = async(req, res) => {
    try {
        // Needs session to find correct game and word to find enemy
        if (req.body.sessionId && req.body.word) {
            const currSession = await Session.findById(req.body.sessionId);
            const currGame = await SpacebarInvaders.findOne({session: currSession});
            // again oldResult probably won't be of any value to front-end may just disregard
            // get length of remaining enemies from currSession
            if (currGame.enemies.length === 1) {
                // may be killing the last enemny (just make sure someone else doesn't get to it first)
                // THIS IS WHERE RACE CONDITIONS MAY HAPPEN BETWEEN CHECKING LENGTH and checking if 
                // ALTHOUGH ASYNC AWAIT may already handle that forcing this whole function to conclude? We'll see
                //  possible mutex package: https://www.npmjs.com/package/async-mutex
                // the enemy is eliminated, if eliminatedEnemy has a value
                // will crash if word doesn't match, but try catch will simply return 500 and server will go on
                const eliminatedEnemy = await Enemy.findOneAndDelete({word: req.body.word, session: req.body.sessionId});
                // remove that id from the session
                if (eliminatedEnemy._id) {
                    currGame.enemies = currGame.enemies.filter(enemy => enemy !== null && !enemy.equals(eliminatedEnemy._id));
                    currGame.wave += 1;
                    await currGame.save();
                    // wave ended
                    setTimeout(async () => {
                        // commence new wave
                        currGame.enemies = await spawnEnemies(currGame.wave, req.body.sessionId);
                        await currGame.save();
                    }, millisecondsBetweenWaves);
                }
            } else {
                // just destroy enemy
                // delete and remove from curr game's array
                const eliminatedEnemy = await Enemy.findOneAndDelete({word: req.body.word});
                // Found that comparing two new Object('id') doesn't give equality unless using .equals() 
                currGame.enemies = currGame.enemies.filter(enemy => enemy !== null && !enemy.equals(eliminatedEnemy._id));
                await currGame.save();
            }
            res.status(200).json({message: "Enemy Destroyed"});
        } else {
            res.status(400).send("Must provide sessionId and word properties to update destroying an enemy");
        }
    } catch(error) {
        console.log("Error in destroy enemy in spacebar invaders", error);
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
            const deletedGame = await SpacebarInvaders.findOneAndDelete({ session: currSession });
            res.status(200).json(deletedGame);
        } else {
            res.status(400).send("Must provide sessionId to wipe a spacebar invaders game");
        }
    } catch(error) {
        console.log("Error in spacebar invaders wipe", error);
        res.status(500).send(error);
    }
}


// returns array of new enemy ids based on wave provided
const spawnEnemies = async (wave, sessionId) => {
    let newEnemyIds = [];
    const playersInSession = await Player.find({session: sessionId});
    const enemyIncreasePerWave = playersInSession.length + 1;
    const baseNumberOfEnemies = 3;
    let enemyCount = (wave * enemyIncreasePerWave) + baseNumberOfEnemies;
    for (let i = 0; i < enemyCount; i++) { 
        // TODO potentially change to curve rather than straight linear increase in enemies
        // x = r × cos( θ )
        // y = r × sin( θ )
        // generate random angle and r in range of inner and outer bounds for polar coordinates
        // then convert them to cartesian
        // TODO tweak change on larger waves
        const r = ( (Math.random() * (outerBound + (wave * 50) - innerBound)) + innerBound);
        const angleInRadians = (Math.random() * 2 * Math.PI );
        const { generate } = await import("random-words");
        // loops for each type of enemy Like get more big words as game progresses
        if ((i + 1) % 10 === 0) {
            // ufo's are 10 + characters
            randomWord = generate({minLength: 10});
        } else if ((i + 1) % 4 === 0) {
            // idk maybe missiles between 6 and 9 charactesr
            randomWord = generate({maxLength: 9, minLength: 6});
        } else {
            // asteroids are between 1 and 5 characters
            randomWord = generate({maxLength: 5});
        }
        
        const newEnemy = new Enemy({
            session: sessionId,
            word: randomWord, 
            x: (r * Math.cos(angleInRadians)), 
            y: (r * Math.sin(angleInRadians)),
        });
        const savedEnemy = await newEnemy.save();
        newEnemyIds.push(newEnemy._id);
        // on last loop return array of ids
        if (i + 1 === enemyCount) {
            return newEnemyIds;
        }
    }
}