const express = require("express");
const passport = require("passport");
const userRouter = require("./routes/userRouter.js");
const postRouter = require('./routes/postRouter.js');
const cors = require("cors");

require("dotenv").config();

var app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

require('./config/passport')(passport);
app.use(passport.initialize());

app.use(cors());

app.use('/posts', postRouter);
app.use('/users', userRouter);

const PORT = process.env.PORT || 3000;
app.listen( PORT, () => console.log(`App running on PORT ${PORT}`));
