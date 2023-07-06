const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/userModel');

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: '/auth/facebook/cb',
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      const user = await User.findOne({
        facebookId: profile.id,
      });

      if (!user) {
        console.log('adding user to db....');
        const user = await User.create({
          facebookId: profile.id,
          name: profile.displayName,
          email: process.env.FACEBOOK_EMAIL,
          password: process.env.PASSWORD_FACEBOOK,
          confirmPassword: process.env.PASSWORD_FACEBOOK,
          accessToken,
          refreshToken,
        });

        // 4) If everything is ok, generate token
        createSendToken(newuser, 201, request, request.res);
        console.log('user saved successfully to DB');
      } else {
        console.log('user already exists');
        // 4) If everything is ok, generate token
        createSendToken(user, 200, request, request.res);
      }
    }
  )
);

// passport.serializeUser((user, done) => {
//   console.log('serializeUser');
//   done(null, user.id);
// });

// passport.deserializeUser((id, done) => {
//   console.log('deserializeUser');
//   User.findById(id).then((user) => {
//     done(null, user);
//   });
// });
