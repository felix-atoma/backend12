 
const Message = require('../models/Message');

// @desc    Create new message
// @route   POST /api/messages
// @access  Public
const createMessage = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      studentGrade,
      inquiryType
    } = req.body;

    // Validation
    if (!name || !email || !subject || !message || !studentGrade || !inquiryType) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields'
      });
    }

    // Create message
    const newMessage = new Message({
      name,
      email: email.toLowerCase(),
      phone,
      subject,
      message,
      studentGrade,
      inquiryType
    });

    await newMessage.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: newMessage
      }
    });

  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// @desc    Get all messages (with filters and pagination)
// @route   GET /api/messages
// @access  Private (Admin)
const getMessages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (type && type !== 'all') filter.inquiryType = type;
    if (priority && priority !== 'all') filter.priority = priority;

    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const messages = await Message.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const total = await Message.countDocuments(filter);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalMessages: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private (Admin)
const getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Mark as read when fetched (if it's new)
    if (message.status === 'new') {
      message.status = 'read';
      await message.save();
    }

    res.json({
      success: true,
      data: {
        message
      }
    });

  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message'
    });
  }
};

// @desc    Update message status
// @route   PATCH /api/messages/:id/status
// @access  Private (Admin)
const updateMessageStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update status and notes
    if (status) message.status = status;
    if (adminNotes !== undefined) message.adminNotes = adminNotes;

    // Set repliedAt if status is changed to replied
    if (status === 'replied' && message.status !== 'replied') {
      message.repliedAt = new Date();
    }

    await message.save();

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: {
        message
      }
    });

  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating message'
    });
  }
};

// @desc    Reply to message
// @route   POST /api/messages/:id/reply
// @access  Private (Admin)
const replyToMessage = async (req, res) => {
  try {
    const { replyMessage } = req.body;

    if (!replyMessage) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Update message with reply
    message.replyMessage = replyMessage;
    message.status = 'replied';
    message.repliedAt = new Date();

    await message.save();

    // TODO: Send email notification to the original sender
    // await sendReplyEmail(message.email, replyMessage, message.subject);

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: {
        message
      }
    });

  } catch (error) {
    console.error('Reply to message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reply'
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private (Admin)
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// @desc    Get message statistics
// @route   GET /api/messages/stats/overview
// @access  Private (Admin)
const getMessageStats = async (req, res) => {
  try {
    const total = await Message.countDocuments();
    const newMessages = await Message.countDocuments({ status: 'new' });
    const readMessages = await Message.countDocuments({ status: 'read' });
    const repliedMessages = await Message.countDocuments({ status: 'replied' });
    const archivedMessages = await Message.countDocuments({ status: 'archived' });

    // Count by type
    const typeStats = await Message.aggregate([
      {
        $group: {
          _id: '$inquiryType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Count by priority
    const priorityStats = await Message.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total,
        new: newMessages,
        read: readMessages,
        replied: repliedMessages,
        archived: archivedMessages,
        byType: typeStats,
        byPriority: priorityStats
      }
    });

  } catch (error) {
    console.error('Get message stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message statistics'
    });
  }
};

module.exports = {
  createMessage,
  getMessages,
  getMessage,
  updateMessageStatus,
  replyToMessage,
  deleteMessage,
  getMessageStats
};