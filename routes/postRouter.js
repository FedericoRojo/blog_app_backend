const {Router} = require('express');
const postController = require('../controllers/postController.js');
const passport = require('passport');
const {isAdmin} = require('../middleware/userMiddleware.js');
const {upload} = require('./multerConfig.js');

const postRouter = Router();

postRouter.get('/', postController.getSomePosts);
postRouter.get('/search/:tagId', postController.getPostsByTagId);
postRouter.get('/getCount', postController.getCountPosts);
postRouter.get('/:tagId/getCount', postController.getCountFilteredPosts);

postRouter.get('/tags', postController.getTags);

/* Routes for admin */
postRouter.get('/admin/posts', passport.authenticate("jwt", {session: false}), isAdmin, postController.getSomePostsAdmin);

postRouter.post('/', passport.authenticate("jwt", {session: false}), 
                    isAdmin, upload.single('file'), postController.createPost);
postRouter.get('/:id', postController.getPost);
postRouter.put('/:id', passport.authenticate("jwt", {session: false}), isAdmin,
                    upload.single('file'), postController.updatePost);
postRouter.delete('/:id', passport.authenticate("jwt", {session: false}), isAdmin, postController.deletePost);

postRouter.get('/:postId/comments', passport.authenticate("jwt", {session: false}), postController.getComments);
postRouter.get('/:postId/comments/:commentId', postController.getComment);
postRouter.post('/:postId/comments', passport.authenticate("jwt", {session: false}), postController.createComment);
postRouter.put('/:postId/comments/:commentId', passport.authenticate("jwt", {session: false}), postController.updateComment);
postRouter.delete('/:postId/comments/:commentId', passport.authenticate("jwt", {session: false}), postController.deleteComment);

postRouter.get('/comments/user', passport.authenticate("jwt", {session: false}), postController.getUserComments);
postRouter.get('/likes/user', passport.authenticate("jwt", {session: false}), postController.getUserLikes);

postRouter.get('/:postId/likes', passport.authenticate("jwt", {session: false}), postController.getLikes);
postRouter.get('/:postId/liked', passport.authenticate("jwt", {session: false}), postController.getAlreadyLiked);
postRouter.post('/:postId/likes', passport.authenticate("jwt", {session: false}), postController.createLike);
postRouter.delete('/:postId/likes', passport.authenticate("jwt", {session: false}), postController.deleteLike);


postRouter.post('/tags', passport.authenticate("jwt", {session: false}), isAdmin, postController.createTag);
postRouter.put('/tags/:id', passport.authenticate("jwt", {session: false}), isAdmin, postController.updateTag);
postRouter.delete('/tags/:id', passport.authenticate("jwt", {session: false}), isAdmin, postController.deleteTag);


module.exports = postRouter;