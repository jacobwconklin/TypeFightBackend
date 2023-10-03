// handle users choosing their attributes (customization as well as host / join) (FOR NOW DON'T SAVE HOST OR NOT), 
// TODO maybe handle users leaving through here, or users changing their customization?

// BIG TODO since I have persistent data I could have profiles stored, and if the user wants they can enter their name
// and a password and choose to save their profile or not, (future stuff but cool with persistent database)
const mongoose = require("mongoose");
const Player = require("../models/Player");
const Session = require("../models/Session");

exports.setPlayer = async (req, res) => {
    try{
        // make sure request has all required params
        if (req.body.alias && req.body.icon && req.body.font && req.body.color && req.body.join_code ) {
            // CREATES Player and SETS them in a session at the same time, not by modifying the db but by
            // returning the player the session's _id associated with the join code
            const session = await Session.findOne({join_code: req.body.join_code})
            if (session == null) {
                res.status(500).send("COULD NOT FIND SESSION WITH JOIN CODE: ", req.body.join_code);
            } else {

            // Create new player and save them and return session._id

            
                
            // // determine game type TODO could be moved to a map or it's own function to spawn games
            // let savedNewGame;
            // if (req.body.selected_game === "Quick Keys") {
            //     const newQuickKeys = new QuickKeysGame({
            //         session: Session.findById(req.body.sessionId)
            //         // TODO determine if I should make all results here or make them with first request from each player?
            //         // can't do it here now because session can't tell me all players...
            //     })
            //     savedNewGame = await newQuickKeys.save();
            // } 
            // // else if ... 
            
            // res.status(200).json(savedNewGame);

            }
        } else {
            res.send("Must provide alias, icon, font, join_code, and color properties to establish a Player Profile");
        }
    } catch(error) {
        console.log("Error in selectGame in session controller", error);
    }
}

// edit Player

// log out