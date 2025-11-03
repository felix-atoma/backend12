const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Admin = require('./models/Admin');

const setupAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@stpierreclaver.edu.gh',
      password: 'admin123',
      role: 'admin'
    });

    await adminUser.save();

    // Create admin profile
    const adminProfile = new Admin({
      user: adminUser._id,
      permissions: {
        canManageMessages: true,
        canManageApplications: true,
        canManageUsers: true,
        canManageContent: true,
        canViewAnalytics: true
      },
      department: 'administration'
    });

    await adminProfile.save();

    console.log('Admin user created successfully!');
    console.log('Email: admin@stpierreclaver.edu.gh');
    console.log('Password: admin123');
    console.log('\nPlease change the password after first login!');

  } catch (error) {
    console.error('Setup error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

setupAdmin();