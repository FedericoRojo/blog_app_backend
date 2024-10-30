const pool = require("../config/pool");
require('dotenv').config();

//Acomodar posts que le agregue tags

async function getSomePosts(req, res){
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offs);

    try{
        const totalCountResult = await pool.query('SELECT COUNT(*) FROM posts;');
        const totalCount = parseInt(totalCountResult.rows[0].count);

        if(offset > totalCount ){
            return res.status(400).json({success: false, error: 'Offset exceeds total number of posts'});
        }

        const {rows} = await pool.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2;',
            [limit, offset]
        );
        res.json({
            success: true,
            result: rows,
            limit: limit,
            offset: offset}
        );
    }catch(error){
        res.status(500).json({ error: "Internal Server Error" });
    }
}

async function createPost(req, res) {
    const {title_heading, title_description, description, img, published, tagId} = req.body;

    try{
        const {rows} = await pool.query('INSERT INTO posts(title_heading, title_description, description, img, published, tag) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;',
            [title_heading, title_description, description, img, published, tagId]
        );
        res.json({
            success: true,
            result: rows
        });
    }catch(error){
        res.status(500).json({ success: false, error: "Error while inserting post" });
    }
}

async function getPost(req, res){
    const id = req.params.id;
    try{
        const {rows} = await pool.query('SELECT * FROM posts WHERE id = $1;', [id]);
        res.json({
            success: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting post" });
    }
}

async function updatePost(req, res) {
    const id = req.params.id;
    const {title_heading, title_description, description, img, published, tagId} = req.body;
    try{
        await pool.query(`UPDATE posts SET 
            title_heading = $1, title_description = $2, description = $3, img = $4, published = $5, tag = $6 WHERE id = $7;`,
        [title_heading, title_description, description, img, published, tagId, id]);
        res.json({
            success: true
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while updating post" });
    }
}

async function deletePost(req, res) {
    const id = req.params.id;
    try{
        await pool.query('DELETE FROM posts WHERE id = $1;', [id]);
        res.json({
            success: true
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while deleting post" });
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

async function createLike(req, res) {
    const postId = req.params.id;
    try{
        await pool.query('INSERT INTO likes (user_id, post_id) VALUES ($1, $2);', [req.user.id, postId]);
        res.json({
            success: true
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while creating like" });
    }
}

async function deleteLike(req, res) {
    const likeId = req.params.likeId;
    try{
        if(req.user.status == 0){
            const {rows} = await pool.query('SELECT * FROM likes WHERE id = $1;', [likeId]);

            if(rows.length == 0){
                return res.status(404).json({success: false, message: 'Like not found'});
            }

            const owner = rows[0].user_id == req.user.id;

            if(!owner){
                return res.status(403).json({success: false, message: 'This is not your like'});
            }
        } 

        await pool.query('DELETE FROM likes WHERE id = $1;', [likeId]);
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
        await pool.query('UPDATE tag SET title = $1 WHERE id = $2;', [title, id])
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
        await pool.query('DELETE FROM tag WHERE id = $1;', [id]);
        res.json({
            sucess: true,
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while deleting tag" });
    }
}

async function getPostsByTagId(req, res) {
    const tagId = req.params.tagId;
    try{
        const {rows} = await pool.query('SELECT * FROM posts WHERE tag = $1;', [tagId]);
        res.json({
            sucess: true,
            result: rows
        })
    }catch(error){
        res.status(500).json({ success: false, error: "Error while getting posts by tagId" });
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
    getPostsByTagId
}

