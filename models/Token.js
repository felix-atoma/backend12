 
const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['refresh', 'reset', 'verification'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Create TTL index for automatic expiration
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if token is valid
tokenSchema.methods.isValid = function() {
  return !this.used && this.expiresAt > new Date();
};

// Static method to clean expired tokens
tokenSchema.statics.cleanExpiredTokens = async function() {
  await this.deleteMany({ expiresAt: { $lt: new Date() } });
};

module.exports = mongoose.model('Token', tokenSchema);