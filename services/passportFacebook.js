const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/userModel');
const createSendToken = require('../utils/createToken');

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.BASE_URL_FACEBOOK,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      // 1) find if user exist with this email or not
      const user = await User.findOne({
        facebookId: profile.id,
      });

      if (!user) {
        // 2) create new user
        const newUser = await User.create({
          facebookId: profile.id,
          name: profile.displayName,
          email: process.env.FACEBOOK_EMAIL,
          password: process.env.PASSWORD_FACEBOOK,
          confirmPassword: process.env.PASSWORD_FACEBOOK,
          accessToken,
          refreshToken,
        });
        // 3) If everything is ok, generate token
        createSendToken(newUser, 201, request, request.res);
        console.log('user saved successfully to DB');
      } else {
        console.log('user already exists');
        // 3) If everything is ok, generate token
        createSendToken(user, 200, request, request.res);
      }
    }
  )
);
