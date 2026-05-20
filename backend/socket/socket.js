// Socket.io event handler for chat + WebRTC signaling
const logger = require("../config/logger");

// Simple per-socket token-bucket rate limiter
function makeRateLimiter(maxTokens, refillPerSecond) {
  const buckets = new Map(); // socketId -> { tokens, lastRefill }
  return function allow(socketId) {
    const now = Date.now();
    if (!buckets.has(socketId)) {
      buckets.set(socketId, { tokens: maxTokens, lastRefill: now });
    }
    const b = buckets.get(socketId);
    const elapsed = (now - b.lastRefill) / 1000;
    b.tokens = Math.min(maxTokens, b.tokens + elapsed * refillPerSecond);
    b.lastRefill = now;
    if (b.tokens < 1) return false;
    b.tokens -= 1;
    return true;
  };
}

const initSocket = (io) => {
  const onlineUsers = new Map();
  // 1:1 call rooms: roomId -> [{ socketId, userId, userName }]  (max 2 entries)
  const callRooms = new Map();

  // Expose onlineUsers so REST controllers can look up socket IDs for direct delivery
  io.onlineUsers = onlineUsers;

  // Rate limiters: chat — 2 msg/s burst 10; signals — 10/s burst 20
  const chatLimiter = makeRateLimiter(10, 2);
  const signalLimiter = makeRateLimiter(20, 10);

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("user_online", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    // ==================== CHAT EVENTS ====================

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      logger.debug(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      logger.debug(`User ${socket.id} left room ${roomId}`);
    });

    socket.on("send_message", (data) => {
      if (!chatLimiter(socket.id)) return; // silently drop
      // data: { roomId, senderId, senderName, message, timestamp }
      io.to(data.roomId).emit("receive_message", {
        senderId: data.senderId,
        senderName: data.senderName,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
      });
    });

    socket.on("typing", (data) => {
      socket.to(data.roomId).emit("user_typing", {
        userId: data.userId,
        userName: data.userName,
      });
    });

    socket.on("stop_typing", (data) => {
      socket.to(data.roomId).emit("user_stop_typing", { userId: data.userId });
    });

    // ==================== WEBRTC SIGNALING (1:1) ====================

    socket.on("join_call", (data) => {
      // data: { roomId, userId, userName }
      const { roomId, userId, userName } = data;

      if (!callRooms.has(roomId)) callRooms.set(roomId, []);
      const participants = callRooms.get(roomId);

      // Reject a third joiner
      if (participants.length >= 2) {
        socket.emit("room_full", { roomId });
        return;
      }

      participants.push({ socketId: socket.id, userId, userName });
      socket.join(roomId);

      if (participants.length === 2) {
        const peer = participants[0];
        // Tell the first joiner about the second (triggers offer creation)
        io.to(peer.socketId).emit("user_joined_call", {
          userId,
          userName,
          socketId: socket.id,
        });
        // Tell the second joiner about the first (so it can store the peer socketId)
        socket.emit("peer_info", {
          userId: peer.userId,
          userName: peer.userName,
          socketId: peer.socketId,
        });
      }

      logger.debug(`join_call: ${userId} in room ${roomId} (${participants.length}/2)`);
    });

    // Route offer directly to the target peer socket
    socket.on("webrtc_offer", (data) => {
      if (!signalLimiter(socket.id)) return;
      // data: { roomId, offer, senderId, targetSocketId }
      const dest = data.targetSocketId || null;
      if (dest) {
        io.to(dest).emit("webrtc_offer", {
          offer: data.offer,
          senderId: data.senderId,
          senderSocketId: socket.id,
        });
      }
    });

    // Route answer directly to the target peer socket
    socket.on("webrtc_answer", (data) => {
      if (!signalLimiter(socket.id)) return;
      // data: { roomId, answer, senderId, targetSocketId }
      const dest = data.targetSocketId || null;
      if (dest) {
        io.to(dest).emit("webrtc_answer", {
          answer: data.answer,
          senderId: data.senderId,
        });
      }
    });

    // Route ICE candidate directly to the target peer socket
    socket.on("webrtc_ice_candidate", (data) => {
      if (!signalLimiter(socket.id)) return;
      // data: { roomId, candidate, senderId, targetSocketId }
      const dest = data.targetSocketId || null;
      if (dest) {
        io.to(dest).emit("webrtc_ice_candidate", {
          candidate: data.candidate,
          senderId: data.senderId,
        });
      }
    });

    socket.on("end_call", (data) => {
      const { roomId, userId } = data;
      socket.to(roomId).emit("call_ended", { userId });
      callRooms.delete(roomId);
    });

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
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("online_users", Array.from(onlineUsers.keys()));

      // Clean up any call room this socket was part of
      for (const [roomId, participants] of callRooms.entries()) {
        const idx = participants.findIndex((p) => p.socketId === socket.id);
        if (idx !== -1) {
          const [removed] = participants.splice(idx, 1);
          const peer = participants[0];
          if (peer) {
            io.to(peer.socketId).emit("call_ended", { userId: removed.userId });
          }
          if (participants.length === 0) callRooms.delete(roomId);
          break;
        }
      }

      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
