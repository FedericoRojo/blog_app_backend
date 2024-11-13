const pool = require("../config/pool");

require('dotenv').config();
const cloudinary = require('cloudinary');
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: 'drpxawyty',    
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function getCountPosts(req, res){
    try{
        const totalCountResult = await pool.query('SELECT COUNT(*) FROM posts WHERE published = true;');
        const totalCount = parseInt(totalCountResult.rows[0].count);

        res.json({
            success: true,
            totalCount: totalCount
        });

    }catch(e){
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function getCountFilteredPosts(req, res){
    
    const tagId = req.params.tagId;
    
    try{
        const totalCountResult = await pool.query('SELECT COUNT(*) FROM posts WHERE tag = $1;', [tagId]);
        const totalCount = parseInt(totalCountResult.rows[0].count);

        res.json({
            success: true,
            totalCount: totalCount
        });

    }catch(e){
        res.status(500).json({ error: "Internal Server Error" });
    }
}


async function getSomePosts(req, res){
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    try{
        const totalCountResult = await pool.query('SELECT COUNT(*) FROM posts WHERE published = true;');
        const totalCount = parseInt(totalCountResult.rows[0].count);

        if(offset > totalCount ){
            return res.status(400).json({success: false, error: 'Offset exceeds total number of posts'});
        }

        const {rows} = await pool.query(`SELECT p.id, p.title_heading, p.title_description, p.description, p.timestamp_creation,
                                         p.img, p.tag, p.published, COUNT(c.id) as amountcomments
                                         FROM (SELECT * FROM posts WHERE published = true ORDER BY timestamp_creation DESC LIMIT $1 OFFSET $2) p
                                         LEFT JOIN comments c ON p.id = c.post_id
                                         GROUP BY p.id, p.tag, p.img, p.published, p.title_heading, p.title_description, p.description, p.timestamp_creation;`,

            [limit, offset]
        );
        
        res.json({
            totalCount: totalCount,
            success: true,
            result: rows,
            limit: limit,
            offset: offset}
        );
    }catch(error){
        res.status(500).json({ error: "Internal Server Error" });
    }
}


async function getPostsByTagId(req, res) {
    
    const tagId = req.params.tagId;
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    try{
        const {rows} = await pool.query('SELECT * FROM posts WHERE tag = $1 ORDER BY timestamp_creation DESC LIMIT $2 OFFSET $3;', [tagId, limit, offset]);
        res.json({
            sucess: true,
            result: rows
        });
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting posts by tagId" });
    }
}


async function createPost(req, res) {
    const { title_heading, title_description, description, published, tagId } = req.body;
    const file = req.file;

    try {
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.v2.uploader.upload_stream(
                { resource_type: "auto" },
                (error, result) => {
                    if (error) {
                        reject(new Error('Error while uploading to Cloudinary'));
                    } else {
                        resolve(result);
                    }
                }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
        });
        
        const { rows } = await pool.query(
            'INSERT INTO posts(title_heading, title_description, description, img, published, tag, public_id, resource_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;',
            [title_heading, title_description, description, uploadResult.secure_url, published, tagId, uploadResult.public_id, uploadResult.resource_type]
        );

        res.json({
            success: true,
            result: rows,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function getPost(req, res){
    const id = req.params.id;
    try{
        const {rows} = await pool.query('SELECT * FROM posts WHERE id = $1;', [id]);
        res.json({
            success: true,
            result: rows[0]
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting post" });
    }
}

async function updatePost(req, res) {
   

    const id = req.params.id;
    const {title_heading, title_description, description, published, tagId} = req.body;
    const file = req.file;
    let newImage = null;

    
    try{
        if(file != null){
            
            const {rows} = await pool.query('SELECT * FROM posts WHERE id = $1;', [id]);

            try {
                await cloudinary.uploader.destroy(rows[0].public_id, { resource_type: rows[0].resource_type });
            } catch (cloudinaryError) {
                console.warn("Image not found in Cloudinary or deletion failed:", cloudinaryError.message);
            }
           
            

            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.v2.uploader.upload_stream(
                    { resource_type: "auto" },
                    (error, result) => {
                        if (error) {
                            reject(new Error('Error while uploading to Cloudinary'));
                        } else {
                            resolve(result);
                        }
                    }
                );
                streamifier.createReadStream(file.buffer).pipe(stream);
            });

            await pool.query(`UPDATE posts SET title_heading = $1, title_description = $2, description = $3, img = $4,
                             published = $5, tag = $6, public_id = $7, resource_type = $8 WHERE id = $9;`,
            [title_heading, title_description, description, uploadResult.secure_url, published, tagId, 
             uploadResult.public_id, uploadResult.resource_type, id]);

            newImage = uploadResult.secure_url; 
        }else{
            console.log(title_heading, title_description, description, published, tagId, id);
            await pool.query(`UPDATE posts SET title_heading = $1, title_description = $2, description = $3,
                published = $4, tag = $5 WHERE id = $6;`,
            [title_heading, title_description, description, published, tagId, id]);
            
        }

        
        res.json({
            success: true,
            result: newImage
        });

    }catch(error){
        res.status(500).json({ success: false, error: "Error while updating post" });
    }
}

async function deletePost(req, res) {
    
    const id = req.params.id;
    try{
        const {rows} = await pool.query('SELECT * FROM posts WHERE id = $1;', [id]);

        try {
            await cloudinary.v2.uploader.destroy(rows[0].public_id, { resource_type: rows[0].resource_type });
        } catch (cloudinaryError) {
            console.warn("Image not found in Cloudinary or deletion failed:", cloudinaryError.message);
        }

        await pool.query('DELETE FROM posts WHERE id = $1;', [id]);
        res.json({
            success: true
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while deleting post" });
    }
}

async function getComments(req, res) {
    const id = req.params.postId;
    try{
        const {rows} = await pool.query('SELECT c.id, c.content, u.username, u.id as user_id FROM comments c JOIN users u ON c.user_id=u.id WHERE post_id = $1;', [id]);
        
        res.json({
            success: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting the comment" });
    }
}

async function getComment(req, res) {
    const id = req.params.commentId;
    try{
        const {rows} = await pool.query('SELECT * FROM comments WHERE id = $1;', [id]);
        res.json({
            success: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting the comment" });
    }
}

async function createComment(req, res) {
    const {postId} = req.params;
    const {content} = req.body;
    try{
        const {rows} = await pool.query('INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING *;',
            [req.user.id, postId, content]
        );
        res.json({
            sucess: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while creting comment" });
    }
}

async function updateComment(req, res) {
    const {commentId} = req.params;
    const {content} = req.body;
    try{
        const {rows} = await pool.query('SELECT * FROM comments WHERE id = $1;', [commentId]);

        if(rows.length == 0){
            return res.status(404).json({success: false, message: 'Comment not found'});
        }

        const owner = rows[0].user_id == req.user.id;

        if(!owner){
            return res.status(403).json({success: false, message: 'This is not your comment'});
        }

        await pool.query('UPDATE comments SET content = $1 WHERE id = $2;', [content, commentId])
        res.json({
            success: true
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while updating comment" });
    }
}

async function deleteComment(req, res) {
    const {commentId} = req.params;
    try{
        if(req.user.status == 0){
            const {rows} = await pool.query('SELECT * FROM comments WHERE id = $1;', [commentId]);

            if(rows.length == 0){
                return res.status(404).json({success: false, message: 'Comment not found'});
            }

            const owner = rows[0].user_id == req.user.id;

            if(!owner){
                return res.status(403).json({success: false, message: 'This is not your comment'});
            }
        } 

        await pool.query('DELETE FROM comments WHERE id = $1;', [commentId]);
        res.json({
            success: true
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while deleting comment" });
    }
}

async function getAlreadyLiked(req, res) {
    const postId = req.params.postId;
    const userId = req.user.id;
    try{
        const {rows} = await pool.query('SELECT * FROM likes WHERE user_id = $1 AND post_id = $2;', [userId, postId]);
        res.json({
            success: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while creating like" });
    }
}

async function createLike(req, res) {
    const postId = req.params.postId;
    try{
        await pool.query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2);', [req.user.id, postId]);
        res.json({
            success: true
        });
    }catch(error){
        res.status(500).json({ success: false, error: "Error while creating like" });
    }
}

async function deleteLike(req, res) {
    const postId = req.params.postId;
    const userId = req.user.id;
    try{
        if(req.user.status == 0){
            const {rows} = await pool.query('SELECT * FROM likes WHERE post_id = $1 AND user_id = $2;', [postId, userId]);
            
            if(rows.length == 0){
                return res.status(404).json({success: false, message: 'Like not found or not the owner of the like'});
            }
        } 
        
        await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2;', [postId, userId]);
        res.json({
            success: true
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while deleting like" });
    }
}

async function getTags(req, res) {
    try{
        
        const {rows} = await pool.query('SELECT * FROM tags;');
        
        res.json({
            sucess: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting tags" });
    }
}

async function createTag(req, res) {
    const {title} = req.body;
    try{
        const {rows} = await pool.query('INSERT INTO tags (title) VALUES ($1) RETURNING *;', [title]);
        res.json({
            sucess: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while creating tag" });
    }
}

async function updateTag(req, res) {
    const id = req.params.id;
    const {title} = req.body;
    try{
        await pool.query('UPDATE tags SET title = $1 WHERE id = $2;', [title, id])
        res.json({
            sucess: true,
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while updating tag" });
    }
}

async function deleteTag(req, res) {
    const id = req.params.id;
    try{
        await pool.query('DELETE FROM tags WHERE id = $1;', [id]);
        res.json({
            sucess: true,
        })
    }catch(error){
        res.status(500).json({ success: false, error: `Error while deleting tag, ${error.message}` });
    }
}



async function getLikes(req, res) {
    const postId = req.params.postId;
    try{
        const {rows} = await pool.query('SELECT * FROM likes l JOIN users u ON l.user_id=u.id WHERE l.post_id = $1;', [postId]);
        res.json({
            sucess: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting posts by tagId" });
    }
}

async function getAmountComments(req, res) {
    const postId = req.params.postId;
    try{
        const {rows} = await pool.query('SELECT COUNT(*) FROM comments WHERE post_id = $1;', [postId]);
        res.json({
            sucess: true,
            result: rows[0]
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting posts by tagId" });
    }
}


async function getUserComments(req, res) {  
    
    try{
        const {rows} = await pool.query(`SELECT c.id as commentid, c.timestamp, c.post_id, p.img, p.title_heading, c.content 
                    FROM comments c JOIN posts p ON c.post_id = p.id WHERE user_id = $1;`, [req.user.id]);
        
        res.json({
            sucess: true,
            result: rows
        });
        
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting posts by tagId" });
    }
}

async function getUserLikes(req, res){
    try{
        const {rows} = await pool.query(`SELECT * FROM likes l JOIN posts P ON l.post_id = p.id WHERE user_id = $1;`, [req.user.id]);
        res.json({
            sucess: true,
            result: rows
        });
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting posts by tagId" });
    }
}

async function getSomePostsAdmin(req, res) {
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);
    try{
        const totalCountResult = await pool.query('SELECT COUNT(*) FROM posts;');
        const totalCount = parseInt(totalCountResult.rows[0].count);

        if(offset > totalCount ){
            return res.status(400).json({success: false, error: 'Offset exceeds total number of posts'});
        }

        const {rows} = await pool.query(`SELECT p.id, p.title_heading, p.title_description, p.description, p.timestamp_creation,
                                         p.img, p.tag, p.published, COUNT(c.id) as amountcomments
                                         FROM (SELECT * FROM posts ORDER BY timestamp_creation DESC LIMIT $1 OFFSET $2) p
                                         LEFT JOIN comments c ON p.id = c.post_id
                                         GROUP BY p.id, p.tag, p.img, p.published, p.title_heading, p.title_description, p.description, p.timestamp_creation;`,

/*
SELECT p.id, p.title_heading, p.title_description, p.description, p.timestamp_creation,
                                         p.img, p.tag, p.published, COUNT(p.id) as amountcomments
                                         FROM (SELECT * FROM posts ORDER BY timestamp_creation DESC LIMIT 2 OFFSET 0) p
                                         LEFT JOIN comments c ON p.id = c.post_id
                                         GROUP BY p.id, p.tag, p.img, p.published, p.title_heading, p.title_description, p.description, p.timestamp_creation;
*/

            [limit, offset]
        );
        
        res.json({
            totalCount: totalCount,
            success: true,
            result: rows,
            limit: limit,
            offset: offset}
        );
    }catch(error){
        res.status(500).json({ error: "Internal Server Error" });
    }
}



module.exports = {
    getSomePosts,
    createPost,
    getPost,
    updatePost,
    deletePost,
    getComment,
    createComment,
    updateComment,
    deleteComment,
    createLike,
    deleteLike,
    getTags,
    createTag,
    updateTag,
    deleteTag,
    getPostsByTagId,
    getCountPosts,
    getComments,
    getLikes,
    getAlreadyLiked,
    getCountFilteredPosts,
    getUserComments,
    getUserLikes,
    getSomePostsAdmin,
   
}

