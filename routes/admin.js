 
const express = require('express');
const {
  getDashboardOverview,
  getAdminProfile,
  updateAdminProfile,
  getSystemStatistics,
  getActivityLogs
} = require('../controllers/adminController');
const { adminValidation } = require('../middleware/validation');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Dashboard routes
router.get('/dashboard', getDashboardOverview);
router.get('/statistics', getSystemStatistics);
router.get('/activity', getActivityLogs);

// Profile routes
router.get('/profile', getAdminProfile);
router.put('/profile', adminValidation.updateProfile, updateAdminProfile);

module.exports = router;