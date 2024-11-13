const {Router} = require("express");
const userController = require("../controllers/userController");
const {upload} = require('./multerConfig.js');
const passport = require("passport");
const {isAdmin} = require('../middleware/userMiddleware.js');


const userRouter = Router();

userRouter.post('/register', userController.registerUser);
userRouter.post('/login', userController.loginUser);

userRouter.get('/auth', passport.authenticate("jwt", {session: false}), userController.validUser);


userRouter.post('/personal-info', passport.authenticate("jwt", {session: false}),
                upload.single('file'), isAdmin, userController.createPersonalInfo);
userRouter.put('/personal-info', passport.authenticate("jwt", {session: false}), 
                upload.single('file') ,isAdmin, userController.editPersonalInfo);
userRouter.get('/personal-info', userController.getPersonalInfo);

module.exports = userRouter;