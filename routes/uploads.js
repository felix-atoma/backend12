 
const express = require('express');
const { uploadImage, handleUploadError } = require('../middleware/upload');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Upload image route
router.post(
  '/image',
  adminAuth,
  uploadImage.single('image'),
  handleUploadError,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filePath: req.file.path,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  }
);

// Upload multiple images
router.post(
  '/images',
  adminAuth,
  uploadImage.array('images', 10), // Max 10 images
  handleUploadError,
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const files = req.files.map(file => ({
      filePath: file.path,
      fileName: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: { files }
    });
  }
);

module.exports = router;