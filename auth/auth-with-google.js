const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('./../models/userModel');
const createSendToken = require('../utils/createToken');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.BASE_URL,
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      //find if user exist with this email or not
      const user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        // create new user
        const newuser = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          googleId: profile.id,
          photo: profile.photos[0].value,
          password: process.env.PASSWORD_GOOGLE,
          confirmPassword: process.env.PASSWORD_GOOGLE,
          accessToken,
          refreshToken,
        });
        //createSendToken(newuser, 200, res);
        console.log('user saved successfully to DB');
        return done(null, profile);
      } else {
        console.log('user already exist');
        return done(null, profile);
      }
    }
  )
);
