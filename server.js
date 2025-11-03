/**
 * 🌍 Server.js — Render-Ready Express + Mongoose Backend (Vercel + Localhost)
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const app = express();

// ======================
// 🛡️ Security Middleware
// ======================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ✅ Allow both Vercel and Localhost frontends
const allowedOrigins = [
  'http://localhost:3000',
  'https://ecole-saint-pierre-claver.vercel.app',
  process.env.FRONTEND_URL, // fallback if set in env
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ======================
// 🚦 Rate Limiting
// ======================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// ======================
// 📦 Body Parser
// ======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// 🖼️ Static Files
// ======================
app.use('/uploads', express.static('uploads'));

// ======================
// 🔗 Connect Database
// ======================
connectDB();

// ======================
// 🚀 Routes
// ======================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/upload', require('./routes/uploads'));

// ✅ Root Test Route
app.get('/', (req, res) => {
  res.status(200).send('✅ API is running successfully on Render!');
});

// 🩺 Health Check
app.get('/api/health', (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Server is running',
    data: {
      database: dbStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    },
  });
});

// ======================
// ❗ Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error('🔥 Error stack:', err.stack);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
    });
  }

  // Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  // Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Multer Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res
      .status(400)
      .json({ success: false, message: 'Unexpected file field' });
  }

  // Default Error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

// ======================
// 🚫 404 Handler
// ======================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ======================
// 🎧 Start Server
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
---------------------------------------------------
✅ Server running on port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Allowed Origins:
   - http://localhost:3000
   - https://ecole-saint-pierre-claver.vercel.app
   - ${process.env.FRONTEND_URL || '(none)'}
📦 Database URI: ${
    process.env.MONGODB_URI
      ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//<hidden>@')
      : 'mongodb://127.0.0.1:27017/stpierreclaver'
  }
---------------------------------------------------
  `);
});
