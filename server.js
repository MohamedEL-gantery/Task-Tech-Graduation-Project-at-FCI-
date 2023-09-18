const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  //if print variable without declare it
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//online and offline users
let activeUsers = [];
io.on('connection', (socket) => {
  //add new user
  socket.on('new-user-add', (newUserId) => {
    //if user not add previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
    }
    console.log('Connected Users', activeUsers);
    io.emit('get-users', activeUsers);
  });
  //send message
  socket.on('send-message', (data) => {
    const { recieverId } = data;
    const user = activeUsers.find((user) => user.userId === recieverId);
    console.log('sending from socket to: ', recieverId);
    console.log('Data', data);
    if (user) {
      io.to(user.socketId).emit('recieve-message', data);
    }
  });

  socket.on('typing', () => {
    socket.broadcast.emit('show-typing-status');
  });

  socket.on('stop-typing', () => {
    socket.broadcast.emit('clear-typing-status');
  });

  socket.on('disconnect', () => {
    activeUsers = activeUsers.filter((user) => user.socketId != socket.id);
    console.log('User Disconnected', activeUsers);
    io.emit('get-users', activeUsers);
  });
});

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful !'));

const port = process.env.PORT || 8000;
const server = http.listen(port, () => {
  console.log(`App running on port ${port}..`);
});

process.on('unhandledRejection', (err) => {
  //if we cannot login with db
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
