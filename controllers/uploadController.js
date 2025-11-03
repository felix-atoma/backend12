 
const fs = require('fs');
const path = require('path');

// @desc    Upload file and return file info
// @route   POST /api/upload
// @access  Private (Admin)
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${path.basename(req.file.path)}`
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: fileInfo
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private (Admin)
const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const filesInfo = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/${path.basename(file.path)}`
    }));

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        files: filesInfo
      }
    });

  } catch (error) {
    console.error('Multiple files upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files'
    });
  }
};

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:filename
// @access  Private (Admin)
const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security check to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};

// @desc    Get list of uploaded files
// @route   GET /api/upload
// @access  Private (Admin)
const getUploadedFiles = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads');
    const files = [];

    const readFiles = (dir, basePath = '') => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          readFiles(fullPath, path.join(basePath, item));
        } else {
          files.push({
            name: item,
            path: path.join(basePath, item),
            size: stat.size,
            modified: stat.mtime,
            url: `/uploads/${path.join(basePath, item)}`
          });
        }
      });
    };

    if (fs.existsSync(uploadDir)) {
      readFiles(uploadDir);
    }

    res.json({
      success: true,
      data: {
        files
      }
    });

  } catch (error) {
    console.error('Get uploaded files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching uploaded files'
    });
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  getUploadedFiles
};