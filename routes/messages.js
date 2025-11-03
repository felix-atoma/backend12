 
const express = require('express');
const {
  createMessage,
  getMessages,
  getMessage,
  updateMessageStatus,
  replyToMessage,
  deleteMessage,
  getMessageStats
} = require('../controllers/messageController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/', createMessage);

// Admin routes
router.get('/', adminAuth, getMessages);
router.get('/stats/overview', adminAuth, getMessageStats);
router.get('/:id', adminAuth, getMessage);
router.patch('/:id/status', adminAuth, updateMessageStatus);
router.post('/:id/reply', adminAuth, replyToMessage);
router.delete('/:id', adminAuth, deleteMessage);

module.exports = router;