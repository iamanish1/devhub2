import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'https://devhubs-final-product-production.up.railway.app';

async function testRoutes() {
  console.log('🧪 Testing API routes...');
  console.log('🔗 Base URL:', API_BASE_URL);

  try {
    // Test basic health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ Health endpoint:', healthResponse.data);

    // Test project tasks test endpoint
    console.log('\n2. Testing project tasks test endpoint...');
    const testResponse = await axios.get(`${API_BASE_URL}/api/project-tasks-test`);
    console.log('✅ Project tasks test endpoint:', testResponse.data);

    // Test project tasks route
    console.log('\n3. Testing project tasks route...');
    const routeResponse = await axios.get(`${API_BASE_URL}/api/project-tasks/test`);
    console.log('✅ Project tasks route:', routeResponse.data);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ URL:', error.config?.url);
  }
}

testRoutes();
