 
const express = require('express');
const {
  submitApplication,
  getApplications,
  getApplication,
  updateApplicationStatus,
  getApplicationStats,
  downloadDocument
} = require('../controllers/applicationController');
const { adminAuth } = require('../middleware/auth');
const { uploadDocument, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.post(
  '/',
  uploadDocument.fields([
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'previousReports', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'vaccinationCertificate', maxCount: 1 },
    { name: 'transferCertificate', maxCount: 1 }
  ]),
  handleUploadError,
  submitApplication
);

// Admin routes
router.get('/', adminAuth, getApplications);
router.get('/stats/overview', adminAuth, getApplicationStats);
router.get('/:id', adminAuth, getApplication);
router.get('/:id/documents/:documentType', adminAuth, downloadDocument);
router.patch('/:id/status', adminAuth, updateApplicationStatus);

module.exports = router;