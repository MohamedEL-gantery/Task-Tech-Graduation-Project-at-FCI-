const Message = require('../models/messageModel');
const catchAsync = require('../utils/catchAsync');

exports.addMessage = catchAsync(async (req, res, next) => {
  const newMessage = await Message.create({
    chatId: req.body.chatId,
    senderId: req.body.senderId,
    text: req.body.text,
  });

  res.status(201).json({
    status: 'success',
    data: {
      message: newMessage,
    },
  });
});

exports.getMessages = catchAsync(async (req, res, next) => {
  const messages = await Message.find({ chatId: req.params.chatId });

  res.status(200).json({
    status: 'success',
    data: {
      messages,
    },
  });
});
