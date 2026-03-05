// Socket.io event handler for chat + WebRTC signaling
const logger = require("../config/logger");

const initSocket = (io) => {
  // Store online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // User comes online
    socket.on("user_online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    // ==================== CHAT EVENTS ====================

    // Join a chat room (based on booking/meeting room)
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      logger.debug(`User ${socket.id} joined room ${roomId}`);
    });

    // Leave a chat room
    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      logger.debug(`User ${socket.id} left room ${roomId}`);
    });

    // Send message
    socket.on("send_message", (data) => {
      // data: { roomId, senderId, senderName, message, timestamp }
      io.to(data.roomId).emit("receive_message", {
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    });

    // Typing indicator
    socket.on("typing", (data) => {
      socket.to(data.roomId).emit("user_typing", {
        userId: data.userId,
        userName: data.userName,
      });
    });

    socket.on("stop_typing", (data) => {
      socket.to(data.roomId).emit("user_stop_typing", {
        userId: data.userId,
      });
    });

    // ==================== WEBRTC SIGNALING ====================

    // Join video call room
    socket.on("join_call", (data) => {
      // data: { roomId, userId, userName }
      socket.join(data.roomId);
      socket.to(data.roomId).emit("user_joined_call", {
        userId: data.userId,
        userName: data.userName,
        socketId: socket.id,
      });
    });

    // WebRTC offer
    socket.on("webrtc_offer", (data) => {
      // data: { roomId, offer, senderId }
      socket.to(data.roomId).emit("webrtc_offer", {
        offer: data.offer,
        senderId: data.senderId,
        senderSocketId: socket.id,
      });
    });

    // WebRTC answer
    socket.on("webrtc_answer", (data) => {
      // data: { roomId, answer, senderId }
      socket.to(data.roomId).emit("webrtc_answer", {
        answer: data.answer,
        senderId: data.senderId,
      });
    });

    // ICE candidate
    socket.on("webrtc_ice_candidate", (data) => {
      // data: { roomId, candidate, senderId }
      socket.to(data.roomId).emit("webrtc_ice_candidate", {
        candidate: data.candidate,
        senderId: data.senderId,
      });
    });

    // End call
    socket.on("end_call", (data) => {
      socket.to(data.roomId).emit("call_ended", {
        userId: data.userId,
      });
    });

    // Toggle audio/video
    socket.on("toggle_media", (data) => {
      // data: { roomId, userId, type: 'audio'|'video', enabled: boolean }
      socket.to(data.roomId).emit("media_toggled", {
        userId: data.userId,
        type: data.type,
        enabled: data.enabled,
      });
    });

    // ==================== NOTIFICATIONS ====================

    socket.on("send_notification", (data) => {
      // data: { targetUserId, type, message }
      const targetSocketId = onlineUsers.get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("notification", {
          type: data.type,
          message: data.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ==================== DISCONNECT ====================

    socket.on("disconnect", () => {
      // Remove from online users
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("online_users", Array.from(onlineUsers.keys()));
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
