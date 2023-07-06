const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const User = require('../models/userModel');
const createSendToken = require('../utils/createToken');
const inquirer = require('inquirer');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.BASE_URL_GOOGLE,
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      // 1) find if user exist with this email or not
      const user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        // 2) prompt user to create a password
        const password = await promptForPassword();
        const confirmPassword = await promptForConfirmPassword(password);

        // 3) create new user with the password and confirmPassword fields set to the user's input
        const newuser = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          googleId: profile.id,
          photo: profile.photos[0].value,
          password,
          confirmPassword,
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

// prompt for password function
const promptForPassword = async () => {
  const { password } = await inquirer.prompt({
    type: 'password',
    message: 'Enter your Google password:',
  });
  return password;
};

// prompt for confirm password function
const promptForConfirmPassword = async (password) => {
  const { confirmPassword } = await inquirer.prompt({
    type: 'password',
    message: 'Confirm your Google password:',
    validate: (input) => input === password || 'Passwords do not match',
  });
  return confirmPassword;
};
