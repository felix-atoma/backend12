 
const User = require('../models/User');
const Admin = require('../models/Admin');
const Message = require('../models/Message');
const Application = require('../models/Application');

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardOverview = async (req, res) => {
  try {
    // Get recent statistics
    const [
      totalMessages,
      newMessages,
      totalApplications,
      pendingApplications,
      messageStats,
      applicationStats,
      adminStats
    ] = await Promise.all([
      Message.countDocuments(),
      Message.countDocuments({ status: 'new' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'submitted' }),
      Message.aggregate([
        {
          $facet: {
            messagesByType: [
              {
                $group: {
                  _id: '$inquiryType',
                  count: { $sum: 1 }
                }
              }
            ],
            messagesByStatus: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            recentMessages: [
              {
                $sort: { createdAt: -1 }
              },
              {
                $limit: 5
              },
              {
                $project: {
                  name: 1,
                  email: 1,
                  subject: 1,
                  status: 1,
                  createdAt: 1
                }
              }
            ]
          }
        }
      ]),
      Application.aggregate([
        {
          $facet: {
            applicationsByStatus: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            applicationsByGrade: [
              {
                $group: {
                  _id: '$academicInfo.gradeLevel',
                  count: { $sum: 1 }
                }
              }
            ],
            recentApplications: [
              {
                $sort: { createdAt: -1 }
              },
              {
                $limit: 5
              },
              {
                $project: {
                  'studentInfo.firstName': 1,
                  'studentInfo.lastName': 1,
                  'academicInfo.gradeLevel': 1,
                  status: 1,
                  applicationNumber: 1,
                  createdAt: 1
                }
              }
            ]
          }
        }
      ]),
      Admin.getAdminStats()
    ]);

    // Weekly activity data
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyMessages = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const weeklyApplications = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalMessages,
          newMessages,
          totalApplications,
          pendingApplications
        },
        messages: {
          byType: messageStats[0]?.messagesByType || [],
          byStatus: messageStats[0]?.messagesByStatus || [],
          recent: messageStats[0]?.recentMessages || []
        },
        applications: {
          byStatus: applicationStats[0]?.applicationsByStatus || [],
          byGrade: applicationStats[0]?.applicationsByGrade || [],
          recent: applicationStats[0]?.recentApplications || []
        },
        activity: {
          weeklyMessages,
          weeklyApplications
        },
        adminStats
      }
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getAdminProfile = async (req, res) => {
  try {
    const adminProfile = await Admin.findOne({ user: req.user._id })
      .populate('user', 'name email role lastLogin');

    if (!adminProfile) {
      return res.status(404).json({
        success: false,
        message: 'Admin profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        profile: adminProfile
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin profile'
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateAdminProfile = async (req, res) => {
  try {
    const { name, department, permissions } = req.body;

    // Update user info if provided
    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    // Update admin profile
    const updateData = {};
    if (department) updateData.department = department;
    if (permissions) updateData.permissions = permissions;

    const adminProfile = await Admin.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'name email role lastLogin');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: adminProfile
      }
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admin profile'
    });
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin)
const getSystemStatistics = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalMessagesThisMonth,
      totalApplicationsThisMonth,
      messageTrends,
      applicationTrends,
      popularInquiries
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Message.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      Application.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }),
      // Message trends for last 6 months
      Message.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]),
      // Application trends for last 6 months
      Application.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]),
      // Most popular inquiry types
      Message.aggregate([
        {
          $group: {
            _id: '$inquiryType',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 5
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers
        },
        monthly: {
          messages: totalMessagesThisMonth,
          applications: totalApplicationsThisMonth
        },
        trends: {
          messages: messageTrends,
          applications: applicationTrends
        },
        popularInquiries
      }
    });

  } catch (error) {
    console.error('Get system statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system statistics'
    });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activity
// @access  Private (Admin)
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    // Build base query
    let query = {};
    if (type === 'messages') {
      query = { model: 'Message' };
    } else if (type === 'applications') {
      query = { model: 'Application' };
    }

    // In a real application, you would have an ActivityLog model
    // For now, we'll return recent messages and applications as activity
    const [recentMessages, recentApplications] = await Promise.all([
      Message.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email subject status createdAt'),
      Application.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('studentInfo academicInfo.gradeLevel status applicationNumber createdAt')
    ]);

    const activityLogs = [
      ...recentMessages.map(msg => ({
        type: 'message',
        action: 'created',
        description: `New message from ${msg.name}`,
        timestamp: msg.createdAt,
        data: msg
      })),
      ...recentApplications.map(app => ({
        type: 'application',
        action: 'submitted',
        description: `New application from ${app.studentInfo.firstName} ${app.studentInfo.lastName}`,
        timestamp: app.createdAt,
        data: app
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, limit);

    res.json({
      success: true,
      data: {
        activityLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(activityLogs.length / limit),
          totalItems: activityLogs.length
        }
      }
    });

  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs'
    });
  }
};

module.exports = {
  getDashboardOverview,
  getAdminProfile,
  updateAdminProfile,
  getSystemStatistics,
  getActivityLogs
};