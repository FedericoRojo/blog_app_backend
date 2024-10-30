const pool = require("../config/pool");
const {genPassword, validPassword} = require("../lib/passwordUtils");
const {issueJWT} = require('../lib/utils');
require('dotenv').config();

async function registerUser(req, res) {
    const saltHash = genPassword(req.body.password);
    
    const salt = saltHash.salt;
    const hash = saltHash.hash;
    
    try {
        await pool.query('INSERT INTO users(username, fullname, email, hash, salt) VALUES ($1, $2, $3, $4, $5);', 
            [req.body.username, req.body.fullname, req.body.email, hash, salt]);
        
        res.json({ success: true});

    } catch (err) {
        res.json({ success: false, msg: err });
    }
} 

async function loginUser(req, res, next){
    try{
        console.log(req.body);
        const {rows} = await pool.query('SELECT * FROM users WHERE username = $1;', [req.body.username]);
        const user = rows[0];
        if(!user){
            return res.status(401).json({success: false, msg: 'could not find user'});
        }

        const isValid = validPassword(req.body.password, user.hash, user.salt);

        if(isValid){
            const tokenObject = issueJWT(user);
            res.status(200).json({
                success: true,
                token: tokenObject.token,
                expiresIn: tokenObject.expires,
            });
        } else {
            res
            .status(401)
            .json({ success: false, msg: "you entered the wrong password" });
        }

    }catch(error){
        next(error);
    }
}

function protected(req, res, next){
    res.status(200).json({
        success: true,
        msg: "You are successfully authenticated to this route!",
      });
}

module.exports = {
    registerUser,
    loginUser,
    protected
}

