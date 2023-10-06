// handle users choosing their attributes (customization as well as host / join) (FOR NOW DON'T SAVE HOST OR NOT), 
// TODO maybe handle users leaving through here, or users changing their customization?

// BIG TODO since I have persistent data I could have profiles stored, and if the user wants they can enter their name
// and a password and choose to save their profile or not, (future stuff but cool with persistent database)
const mongoose = require("mongoose");
const Player = require("../models/Player");
const Session = require("../models/session");
const referralCodeGenerator = require('referral-code-generator');

exports.setJoinedPlayer = async (req, res) => {
    try{
        // TODO potentially don't allow players to join a session that has begun? I don't see why though

        // make sure request has all required params
        if (req.body.alias && req.body.icon && req.body.font && req.body.color && req.body.join_code ) {
            // CREATES Player and SETS them in a session at the same time, not by modifying the db but by
            // returning the player the session's _id associated with the join code
            const session = await Session.findOne({join_code: req.body.join_code})
            if (session == null) {
                res.status(500).send("COULD NOT FIND SESSION WITH JOIN CODE: ", req.body.join_code);
            } else {

                // TODO dissalow duplicate player names (not actually a problem so leaving for now)

                // Create new player and save them and return session._id
                // Create new host player and save them and return the entire session object
                const newJoinedPlayer = await new Player({
                    alias: req.body.alias,
                    icon: req.body.icon,
                    font: req.body.font,
                    color: req.body.color,
                    session: session
                })

                const newSavedPlayer = await newJoinedPlayer.save();
                
                // return session and player
                res.status(200).json({
                    session: session,
                    player: newSavedPlayer
                })

            }
        } else {
            res.status(400).send("Must provide alias, icon, font, join_code, and color properties to establish a Player Profile");
        }
    } catch(error) {
        console.log("Error in selectGame in session controller", error);
        res.status(500).send(error);
    }
}

exports.setHostPlayer = async (req, res) => {
    try{
        // make sure request has all required params
        if (req.body.alias && req.body.icon && req.body.font && req.body.color ) {
            // CREATES Player AND New Session

            // generate referral join code
            const join_code = referralCodeGenerator.alpha('lowercase', 8);
            const newSession = await new Session({
                join_code: join_code,
                started: false
            })

            const newSavedSession = await newSession.save();

            // Create new host player and save them and return the entire session object
            const newHostPlayer = await new Player({
                alias: req.body.alias,
                icon: req.body.icon,
                font: req.body.font,
                color: req.body.color,
                session: newSavedSession
            })

            const newSavedPlayer = await newHostPlayer.save();
            
            // return session and player
            res.status(200).json({
                session: newSavedSession,
                player: newSavedPlayer
            })

        } else {
            res.status(400).send("Must provide alias, icon, font, join_code, and color properties to establish a Player Profile");
        }
    } catch(error) {
        console.log("Error in selectGame in session controller", error);
        res.status(500).send(error);
    }
}

// edit Player

// log out