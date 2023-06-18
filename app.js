const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const passport = require('passport');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

require('./auth/auth-with-google');
require('./auth/passportFacebook');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./Controllers/errorController');
const userRouter = require('./routes/userRoutes');
const postRouter = require('./routes/postRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const serviceRouter = require('./routes/serviceRoutes');
const commentRouter = require('./routes/commentRoutes');
const chatRouter = require('./routes/chatRoutes');
const messageRouter = require('./routes/messageRoutes');
const orderRouter = require('./routes/orderRoutes');
const { webhookCheckout } = require('./Controllers/orderController');

// Start app
const app = express();

app.enable('trust proxy');

// Enable other domains to access your application
app.use(cors());
app.options('*', cors());

/*app.use(
  session({ resave: false, saveUninitialized: true, secret: 'Task-Tech App' })
  );*/

//session
app.use(
  session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: true,
    secret: 'Task-Tech App',
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Set security HTTP headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  //dev env
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Stripe webhook, BEFORE body-parser, because stripe needs the body as stream
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
),
  // Body parser, reading data from body into req.body
  app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'ratingsQuantity',
      'ratingsAverage',
      'salary',
      'skills',
      'minimum',
      'maximum',
      'catogery',
      'delieveryDate',
      'softwareTool',
    ],
  })
);

app.use(compression());

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//auth with google
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

app.get('/', (req, res) => {
  res.send(
    '<a href="/auth/google">Authenticate with Google </a> <br/> <a href="auth/facebook">Authenticate with Facebook </a>'
  );
});
app.get('/auth/failure', (req, res) => {
  res.status(500).json({
    status: 'fail',
    message: 'somthing went wrong',
  });
});

app.get('/protected', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'hello from home',
  });
});
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get(
  '/google',
  passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/failure',
  })
);

//auth with facebook
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get(
  '/auth/facebook/cb',
  passport.authenticate('facebook', {
    successRedirect: '/protected',
    failureRedirect: '/auth/failure',
  })
);

// Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/chats', chatRouter);
app.use('/api/v1/messages', messageRouter);
app.use('/api/v1/orders', orderRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware for express
app.use(globalErrorHandler);

module.exports = app;
