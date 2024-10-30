const {Router} = require("express");
const userController = require("../controllers/userController");
const passport = require("passport");


const userRouter = Router();

userRouter.post('/register', userController.registerUser);
userRouter.post('/login', userController.loginUser);

userRouter.get('/protected', passport.authenticate("jwt", {session: false}), userController.protected);

module.exports = userRouter;