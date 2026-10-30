const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/job_portal';
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });

    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] MongoDB runtime error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB connection disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB initial connection failed: ${error.message}`);
    // Do not crash immediately in dev mode to allow graceful diagnosis
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
