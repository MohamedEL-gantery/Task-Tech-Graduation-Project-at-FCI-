const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('./../models/userModel');
const createSendToken = require('../utils/createToken');

const GOOGLE_CLIENT_ID =
  '887621353924-4je9q83um61ti4q1cmfrug63sfqk8vn9.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:8000/google',
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      //console.log(profile);
      // console.log(accessToken);
      //find if user exist with this email or not
      const user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        // create new user
        const newuser = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          googleId: profile.id,
          photo: profile.photos[0].value,
          password: '55555555',
          confirmPassword: '55555555',
          accessToken,
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

// async (request, accessToken, refreshToken, profile, done,res)
