const Chat = require('../models/chatModel');
const catchAsync = require('../utils/catchAsync');

exports.createChat = catchAsync(async (req, res, next) => {
  if (!req.body.senderId) req.body.senderId = req.user.id;

  const existChat = await Chat.findOne({
    members: { $all: [req.body.senderId, req.body.recieverId] },
  });

  if (existChat) {
    return res.status(200).json({
      status: 'success',
      data: existChat,
    });
  }

  const newChat = await Chat.create({
    members: [senderId, receivedId],
  });

  res.status(201).json({
    status: 'success',
    data: {
      chat: newChat,
    },
  });
});

exports.userChats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const chat = await Chat.find({
    members: { $in: [userId] },
  }).sort({ updatedAt: -1 });

  res.status(200).json({
    status: 'success',
    data: {
      chat: chat,
    },
  });
});

exports.findChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findOne({
    members: [req.params.firstId, req.params.secondId],
  });

  res.status(200).json({
    status: 'success',
    data: {
      chat: chat,
    },
  });
});
