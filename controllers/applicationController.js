 
const Application = require('../models/Application');
const path = require('path');
const fs = require('fs');

// @desc    Submit new application
// @route   POST /api/applications
// @access  Public
const submitApplication = async (req, res) => {
  try {
    const {
      studentInfo,
      contactInfo,
      academicInfo
    } = req.body;

    // Basic validation
    if (!studentInfo || !contactInfo || !academicInfo) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required information'
      });
    }

    // Handle file uploads
    const documents = {};
    if (req.files) {
      if (req.files.birthCertificate) {
        documents.birthCertificate = req.files.birthCertificate[0].path;
      }
      if (req.files.previousReports) {
        documents.previousReports = req.files.previousReports[0].path;
      }
      if (req.files.photo) {
        documents.photo = req.files.photo[0].path;
      }
      if (req.files.vaccinationCertificate) {
        documents.vaccinationCertificate = req.files.vaccinationCertificate[0].path;
      }
      if (req.files.transferCertificate) {
        documents.transferCertificate = req.files.transferCertificate[0].path;
      }
    }

    // Create application
    const application = new Application({
      studentInfo,
      contactInfo,
      academicInfo,
      documents,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await application.save();

    // TODO: Send confirmation email
    // await sendApplicationConfirmation(contactInfo.parentEmail, application.applicationNumber);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application: {
          id: application._id,
          applicationNumber: application.applicationNumber,
          status: application.status,
          submittedAt: application.submittedAt
        }
      }
    });

  } catch (error) {
    console.error('Submit application error:', error);
    
    // Clean up uploaded files if application creation fails
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting application'
    });
  }
};

// @desc    Get all applications (with filters and pagination)
// @route   GET /api/applications
// @access  Private (Admin)
const getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      gradeLevel,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (gradeLevel && gradeLevel !== 'all') filter['academicInfo.gradeLevel'] = gradeLevel;

    // Search functionality
    if (search) {
      filter.$or = [
        { 'studentInfo.firstName': { $regex: search, $options: 'i' } },
        { 'studentInfo.lastName': { $regex: search, $options: 'i' } },
        { 'contactInfo.parentName': { $regex: search, $options: 'i' } },
        { 'contactInfo.parentEmail': { $regex: search, $options: 'i' } },
        { applicationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const applications = await Application.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-documents'); // Exclude documents for list view

    // Get total count for pagination
    const total = await Application.countDocuments(filter);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalApplications: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private (Admin)
const getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: {
        application
      }
    });

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application'
    });
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id/status
// @access  Private (Admin)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update status and notes
    if (status) application.status = status;
    if (notes !== undefined) application.notes = notes;

    // Set review information if status is being updated from submitted
    if (status && application.status === 'submitted') {
      application.reviewedBy = req.user._id;
      application.reviewedAt = new Date();
    }

    await application.save();

    // TODO: Send status update email to parent
    // if (status !== application.status) {
    //   await sendStatusUpdateEmail(application.contactInfo.parentEmail, status, application.applicationNumber);
    // }

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: {
        application
      }
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application'
    });
  }
};

// @desc    Get application statistics
// @route   GET /api/applications/stats/overview
// @access  Private (Admin)
const getApplicationStats = async (req, res) => {
  try {
    const total = await Application.countDocuments();
    const submitted = await Application.countDocuments({ status: 'submitted' });
    const underReview = await Application.countDocuments({ status: 'under_review' });
    const accepted = await Application.countDocuments({ status: 'accepted' });
    const rejected = await Application.countDocuments({ status: 'rejected' });
    const waitingList = await Application.countDocuments({ status: 'waiting_list' });

    // Count by grade level
    const gradeStats = await Application.aggregate([
      {
        $group: {
          _id: '$academicInfo.gradeLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly applications for the current year
    const currentYear = new Date().getFullYear();
    const monthlyStats = await Application.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        total,
        submitted,
        underReview,
        accepted,
        rejected,
        waitingList,
        byGrade: gradeStats,
        monthly: monthlyStats
      }
    });

  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application statistics'
    });
  }
};

// @desc    Download application document
// @route   GET /api/applications/:id/documents/:documentType
// @access  Private (Admin)
const downloadDocument = async (req, res) => {
  try {
    const { id, documentType } = req.params;

    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const filePath = application.documents[documentType];
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const fileName = path.basename(filePath);
    res.download(filePath, fileName);

  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document'
    });
  }
};

module.exports = {
  submitApplication,
  getApplications,
  getApplication,
  updateApplicationStatus,
  getApplicationStats,
  downloadDocument
};