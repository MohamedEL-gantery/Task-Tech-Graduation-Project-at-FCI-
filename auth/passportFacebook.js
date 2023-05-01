const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/userModel');

const FACEBOOK_CLIENT_ID = '898579204784104';
const FACEBOOK_CLIENT_SECRET = '5fd903bc0d1fa6dee7730fb1748ef590';

passport.use(
  new FacebookStrategy(
    {
      clientID: FACEBOOK_CLIENT_ID,
      clientSecret: FACEBOOK_CLIENT_SECRET,
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
          email: 'face@facebook.com',
          password: '55555555555',
          confirmPassword: '55555555555',
        });
        return done(null, profile);
      } else {
        console.log('user already exist in db');
        return done(null, profile);
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
