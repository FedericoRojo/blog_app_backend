const pool = require("../config/pool");
const {genPassword, validPassword} = require("../lib/passwordUtils");
const {issueJWT} = require('../lib/utils');
const cloudinary = require('cloudinary');
const streamifier = require('streamifier');
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
        const {rows} = await pool.query('SELECT * FROM users WHERE username = $1;', [req.body.username]);
        const user = rows[0];
        if(!user){
            return res.status(401).json({success: false, msg: 'could not find user'});
        }

        const isValid = validPassword(req.body.password, user.hash, user.salt);

        if(isValid){
            const tokenObject = issueJWT(user);
            res.status(200).json({
                result: user.status,
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

async function createPersonalInfo(req,res) {
    const {fullname, description} = req.body;
    const file = req.file;
    
    try{
        const uploadResult = await new Promise((resolve, reject) => {
           const stream = cloudinary.v2.uploader.upload_stream(
            { resource_type: "auto"},
            (error, result) => {
                if(error){
                    reject(new Error('Error while uploading to Cloudinary'));
                }else{
                    resolve(result);
                }
            }
           );
           streamifier.createReadStream(file.buffer).pipe(stream);
        });

        const {rows} = await pool.query(`INSERT INTO personal_info(id, fullname, description, img, public_id, resource_type) 
                                         VALUES (1, $1, $2, $3, $4, $5) RETURNING *;`,
            [fullname, description, uploadResult.secure_url, uploadResult.public_id, uploadResult.resource_type]
        );
        res.json({
            success: true,
            result: rows
        });
    }catch(error){
        res.status(500).json({ success: false, error: "Error while inserting user description" });
    }
}

async function editPersonalInfo(req,res) {
    const {fullname, description} = req.body;
    const file = req.file;
    let newImage = null;
    try{
        if(file != null){
            const {rows} = await pool.query('SELECT * FROM personal_info WHERE id = 1;');
            try{
                await cloudinary.v2.uploader.destroy(rows[0].public_id, {resource_type: rows[0].resource_type});
            }catch(cloudinaryError){
                console.warn("Image not found in Cloudinary or deletion failer: ", cloudinaryError.message);
            }

            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.v2.uploader.upload_stream(
                 { resource_type: "auto"},
                 (error, result) => {
                     if(error){
                         reject(new Error('Error while uploading to Cloudinary'));
                     }else{
                         resolve(result);
                     }
                 }
                );
                streamifier.createReadStream(file.buffer).pipe(stream);
             });
            
            await pool.query('UPDATE personal_info SET fullname = $1, description = $2, img = $3, public_id = $4, resource_type = $5 WHERE id = 1;',
                [fullname, description, uploadResult.secure_url, uploadResult.public_id, uploadResult.resource_type ]
            );
            newImage = uploadResult.secure_url;
        }else{
            await pool.query('UPDATE personal_info SET fullname = $1, description = $2 WHERE id = 1;',
                [fullname, description]
            );
        }
       
        res.json({
            success: true,
            result: newImage
        });
    }catch(error){
        res.status(500).json({ success: false, error: "Error while editing user description" });
    }
}

async function getPersonalInfo(req,res) {
    try{
        const {rows} = await pool.query('SELECT * FROM personal_info WHERE id=1;');
        
        res.json({
            success: true,
            result: rows[0]
        });
    }catch(error){
        res.status(500).json({ success: false, error: "Error while editing user description" });
    }
}

async function validUser(req, res) {
    if(req.user != null){
        return res.json({
            success: true,
            result: req.user.status
        });
    }else{
        return res.json({
            success: false,
            result: null
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    protected,
    createPersonalInfo,
    editPersonalInfo,
    getPersonalInfo,
    validUser
}

