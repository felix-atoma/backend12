 
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: {
    canManageMessages: { type: Boolean, default: true },
    canManageApplications: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: false },
    canManageContent: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: true }
  },
  department: {
    type: String,
    enum: ['admissions', 'academic', 'finance', 'administration', 'support'],
    default: 'administration'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Update lastActive on save
adminSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

// Static method to get admin stats
adminSchema.statics.getAdminStats = async function() {
  const totalAdmins = await this.countDocuments();
  const activeAdmins = await this.countDocuments({
    lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  const departmentStats = await this.aggregate([
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    totalAdmins,
    activeAdmins,
    departmentStats
  };
};

module.exports = mongoose.model('Admin', adminSchema);