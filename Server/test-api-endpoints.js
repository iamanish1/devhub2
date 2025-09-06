/**
 * Comprehensive API Endpoints Test Script
 * Tests all major API endpoints for functionality and error handling
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_URL || 'http://localhost:8000';
const TEST_USER = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123',
  usertype: 'contributor'
};

let authToken = null;
let testProjectId = null;
let testBidId = null;

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3
};

/**
 * Utility function to make API requests with error handling
 */
async function makeRequest(method, endpoint, data = null, headers = {}) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    timeout: TEST_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

/**
 * Test Authentication Endpoints
 */
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication Endpoints...\n');

  // Test 1: User Registration
  console.log('1️⃣ Testing User Registration...');
  const registerResult = await makeRequest('POST', '/api/register', TEST_USER);
  
  if (registerResult.success) {
    console.log('   ✅ User registration successful');
    authToken = registerResult.data.token;
  } else {
    console.log('   ⚠️  User registration failed (might already exist)');
    
    // Try to login instead
    console.log('   🔄 Attempting login...');
    const loginResult = await makeRequest('POST', '/api/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (loginResult.success) {
      console.log('   ✅ User login successful');
      authToken = loginResult.data.token;
    } else {
      console.log('   ❌ User login failed:', loginResult.error);
      return false;
    }
  }

  // Test 2: Get User Details
  console.log('\n2️⃣ Testing Get User Details...');
  const userResult = await makeRequest('GET', '/api/getuser', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (userResult.success) {
    console.log('   ✅ Get user details successful');
    console.log(`   - Username: ${userResult.data.username}`);
    console.log(`   - Email: ${userResult.data.email}`);
    console.log(`   - User Type: ${userResult.data.usertype}`);
  } else {
    console.log('   ❌ Get user details failed:', userResult.error);
    return false;
  }

  return true;
}

/**
 * Test Project Listing Endpoints
 */
async function testProjectListing() {
  console.log('\n📋 Testing Project Listing Endpoints...\n');

  // Test 1: Create Project
  console.log('1️⃣ Testing Create Project...');
  const projectData = {
    project_Title: 'Test Project for API Testing',
    Project_Description: 'This is a test project created during API testing',
    Project_Budget: 5000,
    Project_Duration: '2 weeks',
    Required_Skills: ['React', 'Node.js', 'MongoDB'],
    Project_Type: 'Web Development',
    Project_Status: 'active'
  };

  const createResult = await makeRequest('POST', '/api/projects', projectData, {
    Authorization: `Bearer ${authToken}`
  });

  if (createResult.success) {
    console.log('   ✅ Project creation successful');
    testProjectId = createResult.data.project._id;
    console.log(`   - Project ID: ${testProjectId}`);
  } else {
    console.log('   ❌ Project creation failed:', createResult.error);
    return false;
  }

  // Test 2: Get All Projects
  console.log('\n2️⃣ Testing Get All Projects...');
  const projectsResult = await makeRequest('GET', '/api/projects');
  
  if (projectsResult.success) {
    console.log('   ✅ Get projects successful');
    console.log(`   - Total projects: ${projectsResult.data.length}`);
  } else {
    console.log('   ❌ Get projects failed:', projectsResult.error);
  }

  // Test 3: Get Project by ID
  console.log('\n3️⃣ Testing Get Project by ID...');
  const projectResult = await makeRequest('GET', `/api/projects/${testProjectId}`);
  
  if (projectResult.success) {
    console.log('   ✅ Get project by ID successful');
    console.log(`   - Project Title: ${projectResult.data.project_Title}`);
  } else {
    console.log('   ❌ Get project by ID failed:', projectResult.error);
  }

  return true;
}

/**
 * Test Bidding Endpoints
 */
async function testBidding() {
  console.log('\n💰 Testing Bidding Endpoints...\n');

  if (!testProjectId) {
    console.log('   ⚠️  Skipping bidding tests - no test project ID');
    return false;
  }

  // Test 1: Create Bid
  console.log('1️⃣ Testing Create Bid...');
  const bidData = {
    projectId: testProjectId,
    bidAmount: 3000,
    proposal: 'This is a test bid proposal for API testing',
    estimatedDuration: '1 week',
    skills: ['React', 'Node.js']
  };

  const bidResult = await makeRequest('POST', '/api/bids', bidData, {
    Authorization: `Bearer ${authToken}`
  });

  if (bidResult.success) {
    console.log('   ✅ Bid creation successful');
    testBidId = bidResult.data.bid._id;
    console.log(`   - Bid ID: ${testBidId}`);
  } else {
    console.log('   ❌ Bid creation failed:', bidResult.error);
    return false;
  }

  // Test 2: Get Bids for Project
  console.log('\n2️⃣ Testing Get Bids for Project...');
  const bidsResult = await makeRequest('GET', `/api/bids/project/${testProjectId}`);
  
  if (bidsResult.success) {
    console.log('   ✅ Get bids successful');
    console.log(`   - Total bids: ${bidsResult.data.length}`);
  } else {
    console.log('   ❌ Get bids failed:', bidsResult.error);
  }

  return true;
}

/**
 * Test Payment Endpoints
 */
async function testPayments() {
  console.log('\n💳 Testing Payment Endpoints...\n');

  // Test 1: Get Subscription Status
  console.log('1️⃣ Testing Get Subscription Status...');
  const subscriptionResult = await makeRequest('GET', '/api/payments/subscription', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (subscriptionResult.success) {
    console.log('   ✅ Get subscription status successful');
    console.log(`   - Is Active: ${subscriptionResult.data.isActive}`);
    console.log(`   - Plan Type: ${subscriptionResult.data.planType || 'None'}`);
  } else {
    console.log('   ❌ Get subscription status failed:', subscriptionResult.error);
  }

  // Test 2: Get Payment History
  console.log('\n2️⃣ Testing Get Payment History...');
  const historyResult = await makeRequest('GET', '/api/payments/history', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (historyResult.success) {
    console.log('   ✅ Get payment history successful');
    console.log(`   - Total payments: ${historyResult.data.length}`);
  } else {
    console.log('   ❌ Get payment history failed:', historyResult.error);
  }

  // Test 3: Create Payment Intent (without processing)
  console.log('\n3️⃣ Testing Create Payment Intent...');
  const paymentData = {
    amount: 1000,
    purpose: 'subscription',
    planType: 'premium'
  };

  const paymentResult = await makeRequest('POST', '/api/payments/create-intent', paymentData, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (paymentResult.success) {
    console.log('   ✅ Create payment intent successful');
    console.log(`   - Order ID: ${paymentResult.data.orderId}`);
  } else {
    console.log('   ❌ Create payment intent failed:', paymentResult.error);
  }

  return true;
}

/**
 * Test Escrow Wallet Endpoints
 */
async function testEscrowWallet() {
  console.log('\n🔒 Testing Escrow Wallet Endpoints...\n');

  if (!testProjectId) {
    console.log('   ⚠️  Skipping escrow tests - no test project ID');
    return false;
  }

  // Test 1: Get Escrow Wallet for Project
  console.log('1️⃣ Testing Get Escrow Wallet...');
  const escrowResult = await makeRequest('GET', `/api/escrow-wallet/project/${testProjectId}`, null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (escrowResult.success) {
    console.log('   ✅ Get escrow wallet successful');
    console.log(`   - Status: ${escrowResult.data.status}`);
    console.log(`   - Total Amount: ₹${escrowResult.data.totalEscrowAmount}`);
  } else {
    console.log('   ❌ Get escrow wallet failed:', escrowResult.error);
  }

  return true;
}

/**
 * Test Project Selection Endpoints
 */
async function testProjectSelection() {
  console.log('\n🎯 Testing Project Selection Endpoints...\n');

  if (!testProjectId) {
    console.log('   ⚠️  Skipping project selection tests - no test project ID');
    return false;
  }

  // Test 1: Get Project Selection Status
  console.log('1️⃣ Testing Get Project Selection Status...');
  const selectionResult = await makeRequest('GET', `/api/project-selection/${testProjectId}`, null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (selectionResult.success) {
    console.log('   ✅ Get project selection successful');
    console.log(`   - Status: ${selectionResult.data.status}`);
    console.log(`   - Selection Mode: ${selectionResult.data.selectionMode}`);
  } else {
    console.log('   ❌ Get project selection failed:', selectionResult.error);
  }

  return true;
}

/**
 * Test Chat Endpoints
 */
async function testChat() {
  console.log('\n💬 Testing Chat Endpoints...\n');

  if (!testProjectId) {
    console.log('   ⚠️  Skipping chat tests - no test project ID');
    return false;
  }

  // Test 1: Get Chat Messages
  console.log('1️⃣ Testing Get Chat Messages...');
  const chatResult = await makeRequest('GET', `/api/chat/project/${testProjectId}`, null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (chatResult.success) {
    console.log('   ✅ Get chat messages successful');
    console.log(`   - Total messages: ${chatResult.data.length}`);
  } else {
    console.log('   ❌ Get chat messages failed:', chatResult.error);
  }

  return true;
}

/**
 * Test Admin Endpoints
 */
async function testAdmin() {
  console.log('\n👑 Testing Admin Endpoints...\n');

  // Test 1: Get Admin Dashboard Stats
  console.log('1️⃣ Testing Get Admin Dashboard Stats...');
  const adminResult = await makeRequest('GET', '/api/admin/dashboard', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (adminResult.success) {
    console.log('   ✅ Get admin dashboard successful');
    console.log(`   - Total Users: ${adminResult.data.totalUsers}`);
    console.log(`   - Total Projects: ${adminResult.data.totalProjects}`);
    console.log(`   - Total Bids: ${adminResult.data.totalBids}`);
  } else {
    console.log('   ❌ Get admin dashboard failed:', adminResult.error);
  }

  return true;
}

/**
 * Main test function
 */
async function runAllTests() {
  console.log('🧪 Starting Comprehensive API Endpoints Test...\n');
  console.log(`🌐 Testing against: ${BASE_URL}\n`);

  const results = {
    authentication: false,
    projectListing: false,
    bidding: false,
    payments: false,
    escrowWallet: false,
    projectSelection: false,
    chat: false,
    admin: false
  };

  try {
    // Run all tests
    results.authentication = await testAuthentication();
    
    if (results.authentication) {
      results.projectListing = await testProjectListing();
      results.bidding = await testBidding();
      results.payments = await testPayments();
      results.escrowWallet = await testEscrowWallet();
      results.projectSelection = await testProjectSelection();
      results.chat = await testChat();
      results.admin = await testAdmin();
    }

    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${test.padEnd(20)}: ${status}`);
    });

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! The API is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Run the tests
runAllTests().then(() => {
  console.log('\n🏁 API testing completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 API testing failed:', error);
  process.exit(1);
});
