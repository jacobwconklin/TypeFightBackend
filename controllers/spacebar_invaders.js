// TODO TODO figure out more 'optimal' way of continually updating the game server side, for now will use 
// a setInterval per game as done here: https://github.com/vzhou842/example-.io-game/blob/master/src/server/game.js
// also good ideas in this tutorial by the author: https://victorzhou.com/blog/build-an-io-game-part-1/#5-client-rendering
const mongoose = require("mongoose");
const Session = require("../models/session");
const SpacebarInvaders = require("../models/spacebar_invaders/spacebar_invaders_game");
const Enemy = require("../models/spacebar_invaders/enemy");

const innerBound = 2000;
const outerBound = 3000;

// will effectively store the "intervals" here on the server in a map, so that they can be destroyed when players finish the game
// connect each interval to their session by session id
const sessionToIntervalMap = {}

// handle game "tick" performing all logic to move enemies and see if they collide with earth 
const updateGame = async (spacebarInvadersId) => {
    // 
    const game = await SpacebarInvaders.findById(spacebarInvadersId);
    if (game.enemies.length > 0) {
        // try grabbing each enemy, if they happened to be deleted but still in the list for a split second
        // do nothing
        await Promise.all(game.enemies.map(async (enemyId) => {
            try {
                // move enemy towards 0-0 TODO change speed of movement based on word length maybe? 
                const enemyObject = await Enemy.findById(enemyId);
                enemyObject.x = enemyObject.x > 0 ? enemyObject.x - 5 : enemyObject.x + 5;
                enemyObject.y = enemyObject.y > 0 ? enemyObject.y - 5 : enemyObject.y + 5;
                // check for earth collision
                // TODO measurement may vary based on image
                if ( enemyObject.x < 10 && enemyObject.x > -10 && enemyObject.y < 10 && enemyObject.y > -10  ) {
                    // destroy enemy and damage earth
                    game.health -= 1;
                    game.enemies = game.enemies.filter(enemy => enemy._id != enemyId);
                    await game.save();
                    await Enemy.findByIdAndDelete(enemyId);
                } else {
                    await enemyObject.save();
                }
            } catch (error) {
                console.log("Error updating game for an enemy");
            }
        }))
    }
}

// Status a game of spacebar invaders
exports.spacebarInvadersStatus = async (req, res) => {
    try{
        // Get current game and return it along with an array of all included enemies and their positions
        if (req.body.sessionId) {
            const currSession = await Session.findById(req.body.sessionId);
            const game = await SpacebarInvaders.findOne({ session: currSession });

            const enemies = await Promise.all(game.results.map( async (enemyId) => {
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
            const gameInterval = setInterval(updateGame(savedNewGame._id), 500); // TODO tweak interval
            // save interval so it can be cleared later (can be accessed the same way) i.e.: sessionToIntervalMap["" + game._id]
            sessionToIntervalMap["" + savedNewGame._id] = gameInterval;
            // give a few seconds before first round of enemies
            setTimeout(async () => {
                const game = SpacebarInvaders.findById(savedNewGame._id);
                game.enemies = await spawnEnemies(0);
                await game.save();
            }, 2000);
            
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
            if (currSession.enemies.length === 1) {
                // may be killing the last enemny (just make sure someone else doesn't get to it first)
                // THIS IS WHERE RACE CONDITIONS MAY HAPPEN BETWEEN CHECKING LENGTH and checking if 
                // ALTHOUGH ASYNC AWAIT may already handle that forcing this whole function to conclude? We'll see
                //  possible mutex package: https://www.npmjs.com/package/async-mutex
                // the enemy is eliminated, if eliminatedEnemy has a value
                const eliminatedEnemy = await Enemy.findOneAndDelete({word: req.body.word});
                // remove that id from the session
                if (eliminatedEnemy._id) {
                    currGame.enemies = currGame.enemies.filter(enemy => enemy._id != eliminatedEnemy._id);
                    currGame.wave += 1;
                    await currGame.save();
                    // wave ended
                    setTimeout(async () => {
                        // commence new wave
                        currGame.enemies = await spawnEnemies(currGame.wave);
                        await currGame.save();
                    }, 3000);
                }
            } else {
                // just destroy enemy
                // delete and remove from curr game's array
                const eliminatedEnemy = await Enemy.findOneAndDelete({word: req.body.word});
                currGame.enemies = currGame.enemies.filter(enemy => enemy._id != eliminatedEnemy._id);
                await currGame.save();
            }
            res.status(200).send("Enemy Destroyed");
        } else {
            res.status(400).send("Must provide sessionId and word properties to update destroying an enemy");
        }
    } catch(error) {
        console.log("Error in destroy enemy in spacebar invaders", error);
        res.status(500).send(error);
    }
}

// wipe a game (if players all leave or choose to play a new game)


// returns array of new enemy ids based on wave provided
const spawnEnemies = async (wave) => {
    let newEnemyIds = [];
    for (let i = 0; i < (wave * 3) + 5; i++) { // TODO better curve then straight linear
        // TODO add loops for each type of enemy Like get more big words as game progresses
        const newEnemy = new Enemy({
            word: "love", 
            x: Math.floor(Math.random() * (outerBound - innerBound) + innerBound) * (Math.random > 0.5 ? 1 : -1),
            y: Math.floor(Math.random() * (outerBound - innerBound) + innerBound) * (Math.random > 0.5 ? 1 : -1),
        });
        await newEnemy.save();
        newEnemyIds.push(newEnemy._id);
        // on last loop return array ofs ids
        if (i + 1 === (wave * 3) + 5) {
            return newEnemyIds;
        }
    }
}