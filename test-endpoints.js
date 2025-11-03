const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testAdmin = {
  email: 'admin@stpierreclaver.edu.gh',
  password: 'admin123'
};

const testMessage = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+233 12 345 6789',
  subject: 'Test Inquiry',
  message: 'This is a test message from the testing script.',
  studentGrade: 'primary',
  inquiryType: 'information'
};

const testApplication = {
  studentInfo: {
    firstName: 'Test',
    lastName: 'Student',
    birthDate: '2015-03-15',
    gender: 'male',
    nationality: 'Ghanaian'
  },
  contactInfo: {
    parentName: 'Test Parent',
    parentEmail: 'parent@example.com',
    parentPhone: '+233 23 456 7890',
    address: '123 Test Street, Accra',
    city: 'Accra'
  },
  academicInfo: {
    gradeLevel: 'primary3',
    previousSchool: 'Test Primary School',
    languageProficiency: 'intermediate',
    specialNeeds: 'None'
  }
};

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

const logTest = (name, passed, message = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  testResults.tests.push({ name, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  console.log(`${status} - ${name}${message ? `: ${message}` : ''}`);
};

// Test functions
const testHealthCheck = async () => {
  try {
    const response = await api.get('/health');
    if (response.data.success && response.data.status === 'OK') {
      logTest('Health Check', true);
      return true;
    } else {
      logTest('Health Check', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Health Check', false, error.message);
    return false;
  }
};

const testAdminLogin = async () => {
  try {
    const response = await api.post('/auth/admin/login', testAdmin);
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      logTest('Admin Login', true, `Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('Admin Login', false, 'No token received');
      return false;
    }
  } catch (error) {
    logTest('Admin Login', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testInvalidAdminLogin = async () => {
  try {
    await api.post('/auth/admin/login', {
      email: 'wrong@email.com',
      password: 'wrongpassword'
    });
    logTest('Invalid Admin Login', false, 'Should have failed');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Invalid Admin Login', true);
      return true;
    } else {
      logTest('Invalid Admin Login', false, error.response?.data?.message || error.message);
      return false;
    }
  }
};

const testGetCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    if (response.data.success && response.data.data.user) {
      logTest('Get Current User', true, `User: ${response.data.data.user.email}`);
      return true;
    } else {
      logTest('Get Current User', false, 'No user data received');
      return false;
    }
  } catch (error) {
    logTest('Get Current User', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testCreateMessage = async () => {
  try {
    const response = await api.post('/messages', testMessage);
    if (response.data.success && response.data.data.message) {
      logTest('Create Message', true, `Message ID: ${response.data.data.message._id}`);
      return response.data.data.message._id;
    } else {
      logTest('Create Message', false, 'No message created');
      return null;
    }
  } catch (error) {
    logTest('Create Message', false, error.response?.data?.message || error.message);
    return null;
  }
};

const testGetMessages = async () => {
  try {
    const response = await api.get('/messages');
    if (response.data.success && Array.isArray(response.data.data.messages)) {
      logTest('Get Messages', true, `Found ${response.data.data.messages.length} messages`);
      return response.data.data.messages;
    } else {
      logTest('Get Messages', false, 'Invalid response format');
      return [];
    }
  } catch (error) {
    logTest('Get Messages', false, error.response?.data?.message || error.message);
    return [];
  }
};

const testGetMessageStats = async () => {
  try {
    const response = await api.get('/messages/stats/overview');
    if (response.data.success && response.data.data) {
      logTest('Get Message Stats', true, `Total: ${response.data.data.total}`);
      return true;
    } else {
      logTest('Get Message Stats', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Message Stats', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testUpdateMessageStatus = async (messageId) => {
  try {
    const response = await api.patch(`/messages/${messageId}/status`, {
      status: 'read',
      adminNotes: 'Test update'
    });
    if (response.data.success) {
      logTest('Update Message Status', true);
      return true;
    } else {
      logTest('Update Message Status', false, 'Update failed');
      return false;
    }
  } catch (error) {
    logTest('Update Message Status', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testReplyToMessage = async (messageId) => {
  try {
    const response = await api.post(`/messages/${messageId}/reply`, {
      replyMessage: 'This is a test reply from the testing script.'
    });
    if (response.data.success) {
      logTest('Reply to Message', true);
      return true;
    } else {
      logTest('Reply to Message', false, 'Reply failed');
      return false;
    }
  } catch (error) {
    logTest('Reply to Message', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testDeleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/messages/${messageId}`);
    if (response.data.success) {
      logTest('Delete Message', true);
      return true;
    } else {
      logTest('Delete Message', false, 'Delete failed');
      return false;
    }
  } catch (error) {
    logTest('Delete Message', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testSubmitApplication = async () => {
  try {
    const response = await api.post('/applications', testApplication);
    if (response.data.success && response.data.data.application) {
      logTest('Submit Application', true, `App ID: ${response.data.data.application.applicationNumber}`);
      return response.data.data.application._id;
    } else {
      logTest('Submit Application', false, 'No application created');
      return null;
    }
  } catch (error) {
    logTest('Submit Application', false, error.response?.data?.message || error.message);
    return null;
  }
};

const testGetApplications = async () => {
  try {
    const response = await api.get('/applications');
    if (response.data.success && Array.isArray(response.data.data.applications)) {
      logTest('Get Applications', true, `Found ${response.data.data.applications.length} applications`);
      return response.data.data.applications;
    } else {
      logTest('Get Applications', false, 'Invalid response format');
      return [];
    }
  } catch (error) {
    logTest('Get Applications', false, error.response?.data?.message || error.message);
    return [];
  }
};

const testGetApplicationStats = async () => {
  try {
    const response = await api.get('/applications/stats/overview');
    if (response.data.success && response.data.data) {
      logTest('Get Application Stats', true, `Total: ${response.data.data.total}`);
      return true;
    } else {
      logTest('Get Application Stats', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Application Stats', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testUpdateApplicationStatus = async (applicationId) => {
  try {
    const response = await api.patch(`/applications/${applicationId}/status`, {
      status: 'under_review',
      notes: 'Test status update'
    });
    if (response.data.success) {
      logTest('Update Application Status', true);
      return true;
    } else {
      logTest('Update Application Status', false, 'Update failed');
      return false;
    }
  } catch (error) {
    logTest('Update Application Status', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetDashboard = async () => {
  try {
    const response = await api.get('/admin/dashboard');
    if (response.data.success && response.data.data) {
      logTest('Get Dashboard', true, 'Dashboard data received');
      return true;
    } else {
      logTest('Get Dashboard', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Dashboard', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetSystemStatistics = async () => {
  try {
    const response = await api.get('/admin/statistics');
    if (response.data.success && response.data.data) {
      logTest('Get System Statistics', true, 'Statistics data received');
      return true;
    } else {
      logTest('Get System Statistics', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get System Statistics', false, error.response?.data?.message || error.message);
    return false;
  }
};

const testGetActivityLogs = async () => {
  try {
    const response = await api.get('/admin/activity');
    if (response.data.success && response.data.data) {
      logTest('Get Activity Logs', true, 'Activity logs received');
      return true;
    } else {
      logTest('Get Activity Logs', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Activity Logs', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Backend API Tests...\n');
  
  // Public endpoints
  await testHealthCheck();
  await testInvalidAdminLogin();
  
  // Authentication
  const loginSuccess = await testAdminLogin();
  if (!loginSuccess) {
    console.log('\n❌ Authentication failed. Stopping tests.');
    return;
  }
  
  await testGetCurrentUser();
  
  // Messages endpoints
  const messageId = await testCreateMessage();
  await testGetMessages();
  await testGetMessageStats();
  
  if (messageId) {
    await testUpdateMessageStatus(messageId);
    await testReplyToMessage(messageId);
    await testDeleteMessage(messageId);
  }
  
  // Applications endpoints
  const applicationId = await testSubmitApplication();
  await testGetApplications();
  await testGetApplicationStats();
  
  if (applicationId) {
    await testUpdateApplicationStatus(applicationId);
  }
  
  // Admin endpoints
  await testGetDashboard();
  await testGetSystemStatistics();
  await testGetActivityLogs();
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📋 Total: ${testResults.tests.length}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests.filter(test => !test.passed).forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
  }
  
  console.log(`\n${testResults.failed === 0 ? '🎉 All tests passed!' : '⚠️ Some tests failed.'}`);
};

// Run tests
runAllTests().catch(console.error);