const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const secret = process.env.JWT_SECRET || 'job_portal_super_secret_jwt_key_2026_secure';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id);

      if (!user || user.isBlocked) {
        return next(new Error('User unauthorized or blocked'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const userRole = socket.user.role;

    // Join personal user room
    socket.join(`user_${userId}`);
    console.log(`[WebSocket] User connected: ${socket.user.name} (${userRole}) [ID: ${userId}]`);

    // Recruiter-specific room
    if (userRole === 'recruiter') {
      socket.join(`recruiter_${userId}`);
    }

    // Admin-specific room
    if (userRole === 'admin') {
      socket.join('admin_channel');
    }

    socket.on('disconnect', () => {
      console.log(`[WebSocket] User disconnected: ${socket.user.name} [ID: ${userId}]`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
