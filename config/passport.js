const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const fs = require("fs");
const path = require("path");
const pool = require('./pool');
const { error } = require("console");

const pathToKey = path.join(__dirname, "..", "id_rsa_pub.pem");

// The verifying public key
const PUB_KEY = fs.readFileSync(pathToKey, "utf8");

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUB_KEY,
  algorithms: ["RS256"],
};

module.exports = async (passport) => {
  passport.use(
    new JwtStrategy(options, async function (jwt_payload, done) {  
      try{
        await pool.query('SELECT * FROM users WHERE id = $1', jwt_payload.sub);
        if (err) {
          return done(err, false);
        }
        if (user) {
          
          return done(null, user);
        } else {
          return done(null, false);
        }
      }catch(error){
        return done(error, false);
      }
    }))
};