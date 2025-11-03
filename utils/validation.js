 
const mongoose = require('mongoose');

// Custom validation rules
const customValidators = {
  // Validate MongoDB ObjectId
  isObjectId: (value) => {
    return mongoose.Types.ObjectId.isValid(value);
  },

  // Validate array of ObjectIds
  isObjectIdArray: (value) => {
    if (!Array.isArray(value)) return false;
    return value.every(id => mongoose.Types.ObjectId.isValid(id));
  },

  // Validate date is in the past
  isPastDate: (value) => {
    return new Date(value) < new Date();
  },

  // Validate date is in the future
  isFutureDate: (value) => {
    return new Date(value) > new Date();
  },

  // Validate age is between min and max
  isValidAge: (value, min = 3, max = 18) => {
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= min && age <= max;
  },

  // Validate file size (in bytes)
  isValidFileSize: (file, maxSizeInMB = 10) => {
    const maxSize = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSize;
  },

  // Validate file type
  isValidFileType: (file, allowedTypes = []) => {
    return allowedTypes.includes(file.mimetype);
  },

  // Validate strong password
  isStrongPassword: (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  },

  // Validate Ghana postal code
  isGhanaPostalCode: (code) => {
    const postalRegex = /^[A-Z]{2}-\d{4}-\d{4}$/;
    return postalRegex.test(code);
  },

  // Validate application number format
  isApplicationNumber: (number) => {
    const appRegex = /^APP\d{6}$/;
    return appRegex.test(number);
  }
};

// Sanitization functions
const sanitizers = {
  // Sanitize email
  sanitizeEmail: (email) => {
    return email.toLowerCase().trim();
  },

  // Sanitize name
  sanitizeName: (name) => {
    return name.trim().replace(/\s+/g, ' ');
  },

  // Sanitize phone number
  sanitizePhone: (phone) => {
    return phone.replace(/\s/g, '').replace(/^0/, '+233');
  },

  // Sanitize text (remove extra spaces and trim)
  sanitizeText: (text) => {
    return text.trim().replace(/\s+/g, ' ');
  },

  // Sanitize HTML (basic)
  sanitizeHTML: (html) => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '');
  }
};

// Validation error messages
const errorMessages = {
  required: (field) => `${field} is required`,
  invalid: (field) => `Invalid ${field}`,
  tooShort: (field, min) => `${field} must be at least ${min} characters`,
  tooLong: (field, max) => `${field} must not exceed ${max} characters`,
  notFound: (field) => `${field} not found`,
  alreadyExists: (field) => `${field} already exists`,
  invalidFormat: (field) => `Invalid ${field} format`,
  invalidType: (field, type) => `${field} must be a ${type}`,
  outOfRange: (field, min, max) => `${field} must be between ${min} and ${max}`
};

// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+233|0)[235]\d{8}$/,
  name: /^[a-zA-ZÀ-ÿ\s'-]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  applicationNumber: /^APP\d{6}$/,
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
};

module.exports = {
  ...customValidators,
  sanitizers,
  errorMessages,
  patterns
};