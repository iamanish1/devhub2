// Test file for payment system functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_TOKEN = 'YOUR_TEST_JWT_TOKEN'; // Replace with actual token

// Test configuration
const testConfig = {
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

// Test data
const testData = {
  projectId: 'test_project_id',
  bidId: 'test_bid_id',
  contributorsCount: 3
};

async function testPaymentSystem() {
  console.log('🧪 Testing DevHubs Payment System...\n');

  try {
    // Test 1: Bid Fee Payment
    console.log('1️⃣ Testing Bid Fee Payment (₹9)...');
    const bidFeeResponse = await axios.post(
      `${BASE_URL}/api/payments/bid-fee`,
      {
        projectId: testData.projectId,
        bidId: testData.bidId
      },
      testConfig
    );
    console.log('✅ Bid fee payment initiated:', bidFeeResponse.data);
    console.log('📋 Order ID:', bidFeeResponse.data.data.order.order_id);
    console.log('💳 Provider:', bidFeeResponse.data.data.provider);
    console.log('💰 Amount:', bidFeeResponse.data.data.order.order_amount);
    console.log('');

    // Test 2: Listing Fee Payment
    console.log('2️⃣ Testing Listing Fee Payment (₹199)...');
    const listingResponse = await axios.post(
      `${BASE_URL}/api/payments/listing`,
      {
        projectId: testData.projectId
      },
      testConfig
    );
    console.log('✅ Listing fee payment initiated:', listingResponse.data);
    console.log('📋 Order ID:', listingResponse.data.data.order.order_id);
    console.log('💳 Provider:', listingResponse.data.data.provider);
    console.log('💰 Amount:', listingResponse.data.data.order.order_amount);
    console.log('');

    // Test 3: Bonus Pool Funding
    console.log('3️⃣ Testing Bonus Pool Funding (₹600 for 3 contributors)...');
    const bonusResponse = await axios.post(
      `${BASE_URL}/api/payments/bonus`,
      {
        projectId: testData.projectId,
        contributorsCount: testData.contributorsCount
      },
      testConfig
    );
    console.log('✅ Bonus funding initiated:', bonusResponse.data);
    console.log('📋 Order ID:', bonusResponse.data.data.order.id);
    console.log('💳 Provider:', bonusResponse.data.data.provider);
    console.log('💰 Amount:', bonusResponse.data.data.amount);
    console.log('');

    // Test 4: Payment Status Check
    console.log('4️⃣ Testing Payment Status Check...');
    const intentId = bonusResponse.data.data.intentId;
    const statusResponse = await axios.get(
      `${BASE_URL}/api/payments/status/${intentId}`,
      testConfig
    );
    console.log('✅ Payment status retrieved:', statusResponse.data);
    console.log('📊 Status:', statusResponse.data.data.status);
    console.log('💳 Provider:', statusResponse.data.data.provider);
    console.log('🎯 Purpose:', statusResponse.data.data.purpose);
    console.log('');

    // Test 5: Payment History
    console.log('5️⃣ Testing Payment History...');
    const historyResponse = await axios.get(
      `${BASE_URL}/api/payments/history?page=1&limit=5`,
      testConfig
    );
    console.log('✅ Payment history retrieved');
    console.log('📊 Total payments:', historyResponse.data.data.pagination.totalItems);
    console.log('📄 Current page:', historyResponse.data.data.pagination.currentPage);
    console.log('📋 Recent payments:', historyResponse.data.data.payments.length);
    console.log('');

    // Test 6: Project Bonus Status
    console.log('6️⃣ Testing Project Bonus Status...');
    const bonusStatusResponse = await axios.get(
      `${BASE_URL}/api/projects/${testData.projectId}/bonus-status`,
      testConfig
    );
    console.log('✅ Project bonus status retrieved:', bonusStatusResponse.data);
    console.log('🎯 Bonus funded:', bonusStatusResponse.data.data.bonusFunded);
    console.log('💰 Bonus required:', bonusStatusResponse.data.data.bonusRequired);
    console.log('👥 User role:', bonusStatusResponse.data.data.userRole);
    console.log('');

    // Test 7: Webhook Events (Debug)
    console.log('7️⃣ Testing Webhook Events (Debug)...');
    const webhookResponse = await axios.get(
      `${BASE_URL}/webhooks/events?limit=10`
    );
    console.log('✅ Webhook events retrieved');
    console.log('📊 Total events:', webhookResponse.data.data.length);
    console.log('🔍 Recent events:', webhookResponse.data.data.slice(0, 3).map(e => ({
      provider: e.provider,
      eventType: e.eventType,
      processed: e.processed
    })));
    console.log('');

    console.log('🎉 All payment system tests completed successfully!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Configure webhook URLs in payment provider dashboards');
    console.log('2. Test webhook processing with actual payment confirmations');
    console.log('3. Verify database records are created correctly');
    console.log('4. Test project completion and bonus distribution');
    console.log('5. Monitor logs for any errors or issues');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Ensure server is running on port 5000');
    console.log('2. Verify JWT token is valid');
    console.log('3. Check environment variables are set');
    console.log('4. Ensure MongoDB is connected');
    console.log('5. Verify payment provider credentials');
  }
}

// Run tests
if (require.main === module) {
  testPaymentSystem();
}

module.exports = { testPaymentSystem };
