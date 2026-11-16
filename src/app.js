const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, can restrict in production
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files for uploaded resumes and avatars
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// General rate limiter on API endpoints
app.use('/api', apiLimiter);

// Welcome root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Job Portal Backend API',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// Mount API v1 routes
app.use('/api/v1', routes);

// 404 Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
