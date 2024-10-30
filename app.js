const express = require("express");
const passport = require("passport");
const userRouter = require("./routes/userRouter.js");
const postRouter = require('./routes/postRouter.js');

/*
TODO:
1- Verificar que ciertas rutas solo pueden ser accedidas por admin, otras solo por usuarios logeados,
2- Pensar un poco mas en que quiero que haga para agregar las rutas necesarias.
3- 

*/

require("dotenv").config();

var app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

require('./config/passport')(passport);
app.use(passport.initialize());

app.use('/users', userRouter);
app.use('/posts', postRouter);

const PORT = process.env.PORT || 3000;
app.listen( PORT, () => console.log(`App running on PORT ${PORT}`));
