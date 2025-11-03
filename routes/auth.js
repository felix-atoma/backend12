 
const express = require('express');
const { adminLogin, getMe, createInitialAdmin } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/admin/login', adminLogin);
router.get('/me', auth, getMe);
router.post('/setup-admin', createInitialAdmin); // Disable this route after first use

module.exports = router;