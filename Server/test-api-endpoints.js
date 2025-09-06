import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://devhubs-final-product-production.up.railway.app';
const API_BASE = `${BASE_URL}/api`;

class APITester {
  constructor() {
    this.results = [];
  }

  // Helper method to make API requests
  async makeRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { 
        success: true, 
        data: response.data, 
        status: response.status,
        endpoint,
        method 
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500,
        endpoint,
        method
      };
    }
  }

  // Test health endpoint
  async testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoint...');
    const result = await this.makeRequest('GET', '/health');
    
    if (result.success) {
      console.log('✅ Health endpoint working');
      console.log('   Status:', result.data.status);
      console.log('   Database:', result.data.database);
      console.log('   Environment:', result.data.environment);
    } else {
      console.log('❌ Health endpoint failed:', result.error);
    }
    
    this.results.push(result);
    return result;
  }

  // Test root endpoint
  async testRootEndpoint() {
    console.log('\n🏠 Testing Root Endpoint...');
    const result = await this.makeRequest('GET', '/');
    
    if (result.success) {
      console.log('✅ Root endpoint working');
      console.log('   Message:', result.data.message);
      console.log('   Version:', result.data.version);
    } else {
      console.log('❌ Root endpoint failed:', result.error);
    }
    
    this.results.push(result);
    return result;
  }

  // Test project listing endpoint (without auth - should work for public data)
  async testProjectListingEndpoint() {
    console.log('\n📋 Testing Project Listing Endpoint...');
    const result = await this.makeRequest('GET', '/project/getlistproject');
    
    if (result.success) {
      console.log('✅ Project listing endpoint working');
      console.log('   Total projects:', result.data.projects?.length || 0);
      
      // Check for different project categories
      if (result.data.projects) {
        const categories = {};
        result.data.projects.forEach(project => {
          categories[project.project_category] = (categories[project.project_category] || 0) + 1;
        });
        console.log('   Project categories:', categories);
      }
    } else {
      console.log('❌ Project listing endpoint failed:', result.error);
    }
    
    this.results.push(result);
    return result;
  }

  // Test project filtering by category
  async testProjectCategoryFiltering() {
    console.log('\n🔍 Testing Project Category Filtering...');
    
    const categories = ['free', 'funded', 'basic', 'capsule'];
    
    for (const category of categories) {
      const result = await this.makeRequest('GET', `/project/getlistproject?category=${category}`);
      
      if (result.success) {
        console.log(`✅ ${category} category filter working: ${result.data.projects?.length || 0} projects`);
      } else {
        console.log(`❌ ${category} category filter failed:`, result.error);
      }
      
      this.results.push(result);
    }
  }

  // Test budget filtering
  async testBudgetFiltering() {
    console.log('\n💵 Testing Budget Filtering...');
    
    const budgets = ['Free', 'Micro_Budget', 'Low_Budget', 'Medium_Budget', 'High_Budget'];
    
    for (const budget of budgets) {
      const result = await this.makeRequest('GET', `/project/getlistproject?budget=${budget}`);
      
      if (result.success) {
        console.log(`✅ ${budget} budget filter working: ${result.data.projects?.length || 0} projects`);
      } else {
        console.log(`❌ ${budget} budget filter failed:`, result.error);
      }
      
      this.results.push(result);
    }
  }

  // Test tech stack filtering
  async testTechStackFiltering() {
    console.log('\n⚙️ Testing Tech Stack Filtering...');
    
    const techStacks = ['MERN Stack', 'Next.js', 'React', 'Node.js'];
    
    for (const techStack of techStacks) {
      const result = await this.makeRequest('GET', `/project/getlistproject?techStack=${techStack}`);
      
      if (result.success) {
        console.log(`✅ ${techStack} tech stack filter working: ${result.data.projects?.length || 0} projects`);
      } else {
        console.log(`❌ ${techStack} tech stack filter failed:`, result.error);
      }
      
      this.results.push(result);
    }
  }

  // Test search functionality
  async testSearchFunctionality() {
    console.log('\n🔍 Testing Search Functionality...');
    
    const searchTerms = ['test', 'project', 'free', 'react'];
    
    for (const term of searchTerms) {
      const result = await this.makeRequest('GET', `/project/getlistproject?search=${term}`);
      
      if (result.success) {
        console.log(`✅ Search for "${term}" working: ${result.data.projects?.length || 0} projects`);
      } else {
        console.log(`❌ Search for "${term}" failed:`, result.error);
      }
      
      this.results.push(result);
    }
  }

  // Test FormData endpoint (without auth)
  async testFormDataEndpoint() {
    console.log('\n📤 Testing FormData Endpoint...');
    
    try {
      const formData = new FormData();
      formData.append('test_field', 'test_value');
      formData.append('project_category', 'free');
      
      const response = await axios.post(`${API_BASE}/project/test-formdata`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      console.log('✅ FormData endpoint working');
      console.log('   Response:', response.data);
      
      this.results.push({
        success: true,
        data: response.data,
        status: response.status,
        endpoint: '/project/test-formdata',
        method: 'POST'
      });
    } catch (error) {
      console.log('❌ FormData endpoint failed:', error.response?.data || error.message);
      
      this.results.push({
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500,
        endpoint: '/project/test-formdata',
        method: 'POST'
      });
    }
  }

  // Test project creation endpoint (without auth - should fail)
  async testProjectCreationWithoutAuth() {
    console.log('\n🚫 Testing Project Creation Without Auth (should fail)...');
    
    const testProject = {
      project_Title: 'Test Project',
      Project_Description: 'Test Description',
      Project_tech_stack: 'MERN Stack',
      Project_gitHub_link: 'https://github.com/test/test',
      project_category: 'free'
    };

    const formData = new FormData();
    Object.entries(testProject).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await axios.post(`${API_BASE}/project/listproject`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      console.log('❌ Project creation should have failed without auth');
      console.log('   Response:', response.data);
      
      this.results.push({
        success: false,
        error: 'Should have failed without auth',
        status: response.status,
        endpoint: '/project/listproject',
        method: 'POST'
      });
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ Project creation correctly blocked without auth');
        console.log('   Status:', error.response.status);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
      
      this.results.push({
        success: error.response?.status === 401 || error.response?.status === 403,
        error: error.response?.data || error.message,
        status: error.response?.status || 500,
        endpoint: '/project/listproject',
        method: 'POST'
      });
    }
  }

  // Generate test report
  generateReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST REPORT');
    console.log('=' .repeat(60));
    
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Successful: ${successfulTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   ${result.method} ${result.endpoint} - Status: ${result.status}`);
        console.log(`   Error: ${JSON.stringify(result.error)}`);
      });
    }
    
    console.log('\n' + '=' .repeat(60));
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting API Endpoint Tests...');
    console.log('=' .repeat(60));
    
    try {
      await this.testHealthEndpoint();
      await this.testRootEndpoint();
      await this.testProjectListingEndpoint();
      await this.testProjectCategoryFiltering();
      await this.testBudgetFiltering();
      await this.testTechStackFiltering();
      await this.testSearchFunctionality();
      await this.testFormDataEndpoint();
      await this.testProjectCreationWithoutAuth();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    }
  }
}

// Run the tests
const tester = new APITester();
tester.runAllTests().catch(console.error);