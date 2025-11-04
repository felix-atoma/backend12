/**
 * 🌍 Server.js — Configured for ecolestpierre.org domain
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const path = require('path');

const app = express();

// ======================
// 🛡️ Security Middleware
// ======================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ✅ Updated CORS for ecolestpierre.org domain
const allowedOrigins = [
  'http://localhost:3000',
  'https://ecolestpierre.org',
  'https://www.ecolestpierre.org',
  'https://ecole-saint-pierre-claver.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

// ======================
// 🔧 UPDATED CORS Configuration for Domain
// ======================
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, postman, server-side requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.some(allowedOrigin => {
        // Exact match
        if (origin === allowedOrigin) return true;
        // Development localhost variations
        if (origin.startsWith('http://localhost:')) return true;
        // Subdomain variations
        if (allowedOrigin.includes('ecolestpierre.org') && origin.includes('ecolestpierre.org')) return true;
        return false;
      })) {
        return callback(null, true);
      }
      
      // For development, be more permissive
      if (process.env.NODE_ENV === 'development') {
        console.log('CORS warning: Allowing origin in development:', origin);
        return callback(null, true);
      }
      
      console.log('CORS blocked for origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
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
// 🖼️ Static Files - UPDATED for subdirectory deployment
// ======================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================
// 🔗 Connect Database
// ======================
connectDB();

// ======================
// 🚀 Routes - UPDATED for subdirectory deployment
// ======================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/upload', require('./routes/uploads'));

// ✅ Root Test Route - UPDATED for domain
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ API is running successfully on ecolestpierre.org!',
    data: {
      domain: 'ecolestpierre.org',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// ✅ API Root Route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to École Saint Pierre Claver API',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      messages: '/api/messages',
      applications: '/api/applications',
      upload: '/api/upload',
      health: '/api/health'
    },
    documentation: 'https://ecolestpierre.org/api/docs'
  });
});

// 🩺 Health Check - UPDATED for domain
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    success: true,
    status: 'OK',
    message: 'Server is running on ecolestpierre.org',
    data: {
      domain: 'ecolestpierre.org',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      allowedOrigins: allowedOrigins
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
      ...(process.env.NODE_ENV === 'development' && { 
        details: `Origin: ${req.get('Origin')}`,
        allowedOrigins: allowedOrigins
      })
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
    return res.status(400).json({ success: false, message: 'Unexpected file field' });
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
    requestedUrl: req.originalUrl,
    availableEndpoints: {
      base: '/api',
      health: '/api/health',
      auth: '/api/auth',
      messages: '/api/messages',
      applications: '/api/applications'
    }
  });
});

// ======================
// 🎧 Start Server
// ======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
---------------------------------------------------
✅ Server running on port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🏠 Domain: ecolestpierre.org
🔗 Allowed Origins:
   - https://ecolestpierre.org
   - https://www.ecolestpierre.org
   - http://localhost:3000
   - https://ecole-saint-pierre-claver.vercel.app
   - ${process.env.FRONTEND_URL || '(none)'}
📦 Database: ${process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB'}
---------------------------------------------------
  `);
});

module.exports = app;