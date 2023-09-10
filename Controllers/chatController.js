const Chat = require('../models/chatModel');
const catchAsync = require('../utils/catchAsync');

exports.createChat = catchAsync(async (req, res, next) => {
  const newChat = await Chat.create({
    members: [req.body.senderId, req.body.recieverId],
  });

  res.status(201).json({
    status: 'success',
    data: {
      chat: newChat,
    },
  });
});

exports.userChats = catchAsync(async (req, res, next) => {
  const chat = await Chat.find({
    members: { $in: [req.params.userId] },
  });

  res.status(200).json({
    status: 'success',
    data: {
      chat: chat,
    },
  });
});

exports.findChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findOne({
    members: { $all: [req.params.firstId, req.params.secondId] },
  });

  res.status(200).json({
    status: 'success',
    data: {
      chat: chat,
    },
  });
});
