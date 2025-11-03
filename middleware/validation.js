 
const { body, validationResult, param, query } = require('express-validator');
const mongoose = require('mongoose');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Common validation rules
const commonRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  objectId: (field) => param(field)
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid ID format'),
  
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
};

// Auth validation rules
const authValidation = {
  adminLogin: [
    commonRules.email,
    commonRules.password,
    handleValidationErrors
  ],
  
  setupAdmin: [
    commonRules.name,
    commonRules.email,
    commonRules.password,
    handleValidationErrors
  ]
};

// Message validation rules
const messageValidation = {
  createMessage: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    commonRules.email,
    
    body('subject')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Subject must be between 5 and 200 characters'),
    
    body('message')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Message must be between 10 and 2000 characters'),
    
    body('studentGrade')
      .isIn(['preschool', 'primary', 'jhs', 'shs', 'other'])
      .withMessage('Invalid student grade'),
    
    body('inquiryType')
      .isIn(['admission', 'information', 'visit', 'partnership', 'other'])
      .withMessage('Invalid inquiry type'),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    handleValidationErrors
  ],
  
  updateMessageStatus: [
    commonRules.objectId('id'),
    
    body('status')
      .optional()
      .isIn(['new', 'read', 'replied', 'archived'])
      .withMessage('Invalid status'),
    
    body('adminNotes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Admin notes must not exceed 1000 characters'),
    
    handleValidationErrors
  ],
  
  replyToMessage: [
    commonRules.objectId('id'),
    
    body('replyMessage')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Reply message must be between 10 and 2000 characters'),
    
    handleValidationErrors
  ]
};

// Application validation rules
const applicationValidation = {
  submitApplication: [
    // Student info validation
    body('studentInfo.firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('studentInfo.lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    
    body('studentInfo.birthDate')
      .isISO8601()
      .withMessage('Please provide a valid birth date'),
    
    body('studentInfo.gender')
      .isIn(['male', 'female'])
      .withMessage('Invalid gender'),
    
    body('studentInfo.nationality')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Nationality must be between 2 and 50 characters'),
    
    // Contact info validation
    body('contactInfo.parentName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Parent name must be between 2 and 100 characters'),
    
    commonRules.email.withMessage('Please provide a valid parent email'),
    
    body('contactInfo.parentPhone')
      .isMobilePhone()
      .withMessage('Please provide a valid parent phone number'),
    
    body('contactInfo.address')
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage('Address must be between 10 and 200 characters'),
    
    body('contactInfo.city')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('City must be between 2 and 50 characters'),
    
    // Academic info validation
    body('academicInfo.gradeLevel')
      .isIn([
        'nursery', 'primary1', 'primary2', 'primary3', 'primary4', 'primary5',
        'middle1', 'middle2', 'middle3', 'middle4', 'high1', 'high2', 'high3'
      ])
      .withMessage('Invalid grade level'),
    
    body('academicInfo.previousSchool')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Previous school must be between 2 and 100 characters'),
    
    body('academicInfo.languageProficiency')
      .isIn(['beginner', 'intermediate', 'advanced', 'fluent'])
      .withMessage('Invalid language proficiency level'),
    
    body('academicInfo.specialNeeds')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Special needs description must not exceed 500 characters'),
    
    handleValidationErrors
  ],
  
  updateApplicationStatus: [
    commonRules.objectId('id'),
    
    body('status')
      .isIn(['submitted', 'under_review', 'accepted', 'rejected', 'waiting_list'])
      .withMessage('Invalid application status'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
    
    handleValidationErrors
  ]
};

// Admin validation rules
const adminValidation = {
  updateProfile: [
    commonRules.name.optional(),
    
    body('department')
      .optional()
      .isIn(['admissions', 'academic', 'finance', 'administration', 'support'])
      .withMessage('Invalid department'),
    
    body('permissions')
      .optional()
      .isObject()
      .withMessage('Permissions must be an object'),
    
    handleValidationErrors
  ]
};

module.exports = {
  authValidation,
  messageValidation,
  applicationValidation,
  adminValidation,
  commonRules,
  handleValidationErrors
};