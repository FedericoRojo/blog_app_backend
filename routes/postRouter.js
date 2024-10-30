const {Router} = require('express');
const postController = require('../controllers/postController.js');
const passport = require('passport');
const {isAdmin} = require('../middleware/userMiddleware.js');

const postRouter = Router();

postRouter.get('/', postController.getSomePosts);
postRouter.get('/search/:tagId', postController.getPostsByTagId);

postRouter.post('/', passport.authenticate("jwt", {session: false}), isAdmin, postController.createPost);
postRouter.get('/:id', postController.getPost);
postRouter.put('/:id', passport.authenticate("jwt", {session: false}), isAdmin, postController.updatePost);
postRouter.delete('/:id', passport.authenticate("jwt", {session: false}), isAdmin, postController.deletePost);

postRouter.get('/:postId/comments/:commentId', postController.getComment);
postRouter.post('/:postId/comments', passport.authenticate("jwt", {session: false}), postController.createComment);
postRouter.put('/:postId/comments/:commentId', passport.authenticate("jwt", {session: false}), postController.updateComment);
postRouter.delete('/:postId/comments/:commentId', passport.authenticate("jwt", {session: false}), postController.deleteComment);



postRouter.post('/:postId/likes', passport.authenticate("jwt", {session: false}), postController.createLike);
postRouter.delete('/:postId/likes/:likeId', passport.authenticate("jwt", {session: false}), postController.deleteLike);

postRouter.get('/tags', passport.authenticate("jwt", {session: false}), isAdmin, postController.getTags);
postRouter.post('/tags', passport.authenticate("jwt", {session: false}), isAdmin,postController.createTag);
postRouter.put('/tags/:id', passport.authenticate("jwt", {session: false}), isAdmin, postController.updateTag);
postRouter.delete('/tags/:id', passport.authenticate("jwt", {session: false}), isAdmin, postController.deleteTag);


module.exports = postRouter;