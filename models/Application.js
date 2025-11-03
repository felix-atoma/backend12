 
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Student Information
  studentInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    nationality: { type: String, required: true, trim: true }
  },
  
  // Contact Information
  contactInfo: {
    parentName: { type: String, required: true, trim: true },
    parentEmail: { type: String, required: true, lowercase: true, trim: true },
    parentPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true, trim: true }
  },
  
  // Academic Information
  academicInfo: {
    gradeLevel: { type: String, required: true },
    previousSchool: { type: String, required: true, trim: true },
    languageProficiency: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced', 'fluent'],
      required: true 
    },
    specialNeeds: { type: String, default: '' }
  },
  
  // Documents
  documents: {
    birthCertificate: { type: String }, // File path or URL
    previousReports: { type: String },
    photo: { type: String },
    vaccinationCertificate: { type: String },
    transferCertificate: { type: String }
  },
  
  // Application Status
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'accepted', 'rejected', 'waiting_list'],
    default: 'submitted'
  },
  
  // Processing
  applicationNumber: { type: String, unique: true },
  submittedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  notes: { type: String },
  
  // Tracking
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: true
});

// Generate application number before saving
applicationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Application').countDocuments();
    this.applicationNumber = `APP${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
applicationSchema.index({ applicationNumber: 1 });
applicationSchema.index({ 'contactInfo.parentEmail': 1 });
applicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);