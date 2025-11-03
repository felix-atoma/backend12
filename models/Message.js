 
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  studentGrade: {
    type: String,
    enum: ['preschool', 'primary', 'jhs', 'shs', 'other'],
    required: true
  },
  inquiryType: {
    type: String,
    enum: ['admission', 'information', 'visit', 'partnership', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  repliedAt: {
    type: Date
  },
  replyMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
messageSchema.index({ status: 1, createdAt: -1 });
messageSchema.index({ email: 1 });

module.exports = mongoose.model('Message', messageSchema);