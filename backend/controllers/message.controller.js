const Message = require("../models/Message");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");

// @desc  Get all conversations for the current user (latest message per partner)
// @route GET /api/messages/conversations
exports.getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $lt: ["$senderId", "$receiverId"] },
            { a: "$senderId", b: "$receiverId" },
            { a: "$receiverId", b: "$senderId" },
          ],
        },
        lastMessage: { $first: "$$ROOT" },
        unread: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$read", false] }, { $eq: ["$receiverId", userId] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  // Populate the partner info for each conversation
  const populated = await Promise.all(
    conversations.map(async (conv) => {
      const partnerId =
        conv.lastMessage.senderId.toString() === userId.toString()
          ? conv.lastMessage.receiverId
          : conv.lastMessage.senderId;

      const partner = await User.findById(partnerId)
        .select("name profileImage role")
        .lean();

      return {
        partnerId,
        partner,
        lastMessage: conv.lastMessage.message,
        lastMessageAt: conv.lastMessage.createdAt,
        unread: conv.unread,
        isMine: conv.lastMessage.senderId.toString() === userId.toString(),
      };
    })
  );

  res.json({ success: true, conversations: populated });
});

// @desc  Get messages between current user and another user
// @route GET /api/messages/:userId
exports.getMessages = asyncHandler(async (req, res) => {
  const myId = req.user._id;
  const otherId = new mongoose.Types.ObjectId(req.params.userId);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { senderId: myId, receiverId: otherId },
      { senderId: otherId, receiverId: myId },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Mark unread messages from the other user as read
  await Message.updateMany(
    { senderId: otherId, receiverId: myId, read: false },
    { read: true }
  );

  res.json({ success: true, messages: messages.reverse() });
});

// @desc  Send a message
// @route POST /api/messages
exports.sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, message } = req.body;

  if (!receiverId || !message?.trim()) {
    throw new AppError("receiverId and message are required", 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) throw new AppError("Recipient not found", 404);

  const msg = await Message.create({
    senderId: req.user._id,
    receiverId,
    message: message.trim(),
  });

  // Deliver via socket if receiver is online
  const io = req.app.get("io");
  if (io?.onlineUsers) {
    const targetSocketId = io.onlineUsers.get(receiverId.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit("private_message", {
        _id: msg._id,
        senderId: req.user._id,
        senderName: req.user.name,
        message: msg.message,
        createdAt: msg.createdAt,
        read: false,
      });
    }
  }

  res.status(201).json({ success: true, message: msg });
});

// @desc  Get unread message count for the current user
// @route GET /api/messages/unread-count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({
    receiverId: req.user._id,
    read: false,
  });
  res.json({ success: true, count });
});
