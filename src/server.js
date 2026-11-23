require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initRedis } = require('./config/redis');
const { initSocket } = require('./sockets/socketManager');

// Validate critical environment variables during startup
const validateEnv = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length === 0) {
    console.error('FATAL: JWT_SECRET environment variable is required but missing.');
    process.exit(1);
  }
};
validateEnv();

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io on the server
initSocket(server);

// Start server after connecting to database
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize Redis (with graceful fallback)
    initRedis();

    // 3. Start HTTP + WebSocket Server
    server.listen(PORT, () => {
      console.log('==================================================');
      console.log(`🚀 Job Portal Backend Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`⚡ WebSocket: ws://localhost:${PORT}`);
      console.log('==================================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
  server.close(() => {
    console.log('[Server] HTTP and WebSocket connections closed.');
    process.exit(0);
  });

  // Force close after 10s if dangling connections
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();


