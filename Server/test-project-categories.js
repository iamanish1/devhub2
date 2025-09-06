import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://devhubs-final-product-production.up.railway.app';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace these with actual test credentials
  adminEmail: 'admin@devhubs.in', // Replace with actual admin email
  adminPassword: 'admin123', // Replace with actual admin password
  testUserEmail: 'test@devhubs.in', // Replace with actual test user email
  testUserPassword: 'test123', // Replace with actual test user password
};

// Test data for different project categories
const TEST_PROJECTS = {
  free: {
    project_Title: `Test Free Project ${Date.now()}`,
    Project_Description: 'This is a test free project for resume building',
    Project_tech_stack: 'MERN Stack',
    Project_gitHub_link: 'https://github.com/test/free-project',
    project_category: 'free',
    // These should be auto-set by the backend
    project_starting_bid: '0',
    Project_Contributor: '1',
    Project_Number_Of_Bids: '1',
    Project_Features: 'Free project for resume building',
    Project_looking: 'Open to all developers'
  },
  funded: {
    project_Title: `Test Funded Project ${Date.now()}`,
    Project_Description: 'This is a test funded project with bonus pool',
    Project_tech_stack: 'Next.js',
    Project_gitHub_link: 'https://github.com/test/funded-project',
    project_duration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    project_starting_bid: '1000',
    Project_Contributor: '3',
    Project_Number_Of_Bids: '5',
    Project_Features: 'Advanced features for funded project',
    Project_looking: 'Experienced developers',
    project_category: 'funded',
    bonus_pool_amount: '500',
    bonus_pool_contributors: '2'
  },
  basic: {
    project_Title: `Test Basic Project ${Date.now()}`,
    Project_Description: 'This is a test basic project',
    Project_tech_stack: 'React',
    Project_gitHub_link: 'https://github.com/test/basic-project',
    project_duration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    project_starting_bid: '500',
    Project_Contributor: '2',
    Project_Number_Of_Bids: '3',
    Project_Features: 'Basic features for learning',
    Project_looking: 'Beginner to intermediate developers',
    project_category: 'basic',
    bonus_pool_amount: '200',
    bonus_pool_contributors: '1'
  }
};

class ProjectCategoryTester {
  constructor() {
    this.adminToken = null;
    this.userToken = null;
    this.createdProjects = [];
  }

  // Helper method to make API requests
  async makeRequest(method, endpoint, data = null, token = null) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (data) {
        config.data = data;
      }

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

  // Helper method to make FormData requests
  async makeFormDataRequest(endpoint, formData, token = null) {
    try {
      const config = {
        method: 'POST',
        url: `${API_BASE}${endpoint}`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

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

  // Test authentication
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    // Test admin login
    const adminLogin = await this.makeRequest('POST', '/user/login', {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });

    if (adminLogin.success) {
      this.adminToken = adminLogin.data.token;
      console.log('✅ Admin authentication successful');
    } else {
      console.log('❌ Admin authentication failed:', adminLogin.error);
      return false;
    }

    // Test user login
    const userLogin = await this.makeRequest('POST', '/user/login', {
      email: TEST_CONFIG.testUserEmail,
      password: TEST_CONFIG.testUserPassword
    });

    if (userLogin.success) {
      this.userToken = userLogin.data.token;
      console.log('✅ User authentication successful');
    } else {
      console.log('❌ User authentication failed:', userLogin.error);
      return false;
    }

    return true;
  }

  // Test free project creation (admin only)
  async testFreeProjectCreation() {
    console.log('\n🆓 Testing Free Project Creation...');
    
    const formData = new FormData();
    Object.entries(TEST_PROJECTS.free).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await this.makeFormDataRequest('/project/listproject', formData, this.adminToken);
    
    if (result.success) {
      console.log('✅ Free project created successfully');
      console.log('   Project ID:', result.data.project._id);
      console.log('   Category:', result.data.project.project_category);
      console.log('   Starting Bid:', result.data.project.project_starting_bid);
      console.log('   Bonus Pool Amount:', result.data.project.bonus_pool_amount);
      console.log('   Bonus Pool Contributors:', result.data.project.bonus_pool_contributors);
      this.createdProjects.push(result.data.project._id);
      return result.data.project;
    } else {
      console.log('❌ Free project creation failed:', result.error);
      return null;
    }
  }

  // Test free project creation by regular user (should fail)
  async testFreeProjectCreationByUser() {
    console.log('\n🚫 Testing Free Project Creation by Regular User (should fail)...');
    
    const formData = new FormData();
    Object.entries(TEST_PROJECTS.free).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await this.makeFormDataRequest('/project/listproject', formData, this.userToken);
    
    if (!result.success && result.status === 403) {
      console.log('✅ Free project creation correctly blocked for regular user');
      return true;
    } else {
      console.log('❌ Free project creation should have been blocked for regular user');
      console.log('   Result:', result);
      return false;
    }
  }

  // Test funded project creation
  async testFundedProjectCreation() {
    console.log('\n💰 Testing Funded Project Creation...');
    
    const formData = new FormData();
    Object.entries(TEST_PROJECTS.funded).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await this.makeFormDataRequest('/project/listproject', formData, this.adminToken);
    
    if (result.success) {
      console.log('✅ Funded project created successfully');
      console.log('   Project ID:', result.data.project._id);
      console.log('   Category:', result.data.project.project_category);
      console.log('   Starting Bid:', result.data.project.project_starting_bid);
      console.log('   Bonus Pool Amount:', result.data.project.bonus_pool_amount);
      console.log('   Bonus Pool Contributors:', result.data.project.bonus_pool_contributors);
      console.log('   Bonus Pool ID:', result.data.bonusPool?.id);
      this.createdProjects.push(result.data.project._id);
      return result.data.project;
    } else {
      console.log('❌ Funded project creation failed:', result.error);
      return null;
    }
  }

  // Test basic project creation
  async testBasicProjectCreation() {
    console.log('\n📚 Testing Basic Project Creation...');
    
    const formData = new FormData();
    Object.entries(TEST_PROJECTS.basic).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await this.makeFormDataRequest('/project/listproject', formData, this.adminToken);
    
    if (result.success) {
      console.log('✅ Basic project created successfully');
      console.log('   Project ID:', result.data.project._id);
      console.log('   Category:', result.data.project.project_category);
      console.log('   Starting Bid:', result.data.project.project_starting_bid);
      console.log('   Bonus Pool Amount:', result.data.project.bonus_pool_amount);
      console.log('   Bonus Pool Contributors:', result.data.project.bonus_pool_contributors);
      this.createdProjects.push(result.data.project._id);
      return result.data.project;
    } else {
      console.log('❌ Basic project creation failed:', result.error);
      return null;
    }
  }

  // Test project retrieval and filtering
  async testProjectRetrieval() {
    console.log('\n📋 Testing Project Retrieval and Filtering...');
    
    // Test getting all projects
    const allProjects = await this.makeRequest('GET', '/project/getlistproject');
    if (allProjects.success) {
      console.log('✅ Retrieved all projects:', allProjects.data.projects.length);
      
      // Check for our created projects
      const createdProjects = allProjects.data.projects.filter(p => 
        this.createdProjects.includes(p._id)
      );
      console.log('   Found created projects:', createdProjects.length);
      
      // Test category filtering
      const freeProjects = allProjects.data.projects.filter(p => p.project_category === 'free');
      const fundedProjects = allProjects.data.projects.filter(p => p.project_category === 'funded');
      const basicProjects = allProjects.data.projects.filter(p => p.project_category === 'basic');
      
      console.log('   Free projects:', freeProjects.length);
      console.log('   Funded projects:', fundedProjects.length);
      console.log('   Basic projects:', basicProjects.length);
      
      return true;
    } else {
      console.log('❌ Failed to retrieve projects:', allProjects.error);
      return false;
    }
  }

  // Test budget filtering
  async testBudgetFiltering() {
    console.log('\n💵 Testing Budget Filtering...');
    
    // Test free budget filter
    const freeBudget = await this.makeRequest('GET', '/project/getlistproject?budget=Free');
    if (freeBudget.success) {
      console.log('✅ Free budget filter working:', freeBudget.data.projects.length, 'projects');
    } else {
      console.log('❌ Free budget filter failed:', freeBudget.error);
    }

    // Test other budget filters
    const microBudget = await this.makeRequest('GET', '/project/getlistproject?budget=Micro_Budget');
    if (microBudget.success) {
      console.log('✅ Micro budget filter working:', microBudget.data.projects.length, 'projects');
    }

    return true;
  }

  // Test project validation
  async testProjectValidation() {
    console.log('\n✅ Testing Project Validation...');
    
    // Test missing required fields
    const invalidProject = {
      project_Title: 'Invalid Project',
      // Missing required fields
    };

    const formData = new FormData();
    formData.append('project_Title', 'Invalid Project');
    formData.append('project_category', 'free');

    const result = await this.makeFormDataRequest('/project/listproject', formData, this.adminToken);
    
    if (!result.success && result.status === 400) {
      console.log('✅ Validation correctly rejected incomplete project');
      return true;
    } else {
      console.log('❌ Validation should have rejected incomplete project');
      return false;
    }
  }

  // Clean up created projects
  async cleanup() {
    console.log('\n🧹 Cleaning up created projects...');
    
    for (const projectId of this.createdProjects) {
      const result = await this.makeRequest('DELETE', `/admin/deleteproject/${projectId}`, null, this.adminToken);
      if (result.success) {
        console.log(`✅ Deleted project: ${projectId}`);
      } else {
        console.log(`❌ Failed to delete project: ${projectId}`);
      }
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Project Category Tests...');
    console.log('=' .repeat(50));
    
    try {
      // Test authentication
      const authSuccess = await this.testAuthentication();
      if (!authSuccess) {
        console.log('❌ Authentication failed, skipping other tests');
        return;
      }

      // Test project creation
      await this.testFreeProjectCreation();
      await this.testFreeProjectCreationByUser();
      await this.testFundedProjectCreation();
      await this.testBasicProjectCreation();

      // Test project retrieval
      await this.testProjectRetrieval();
      await this.testBudgetFiltering();

      // Test validation
      await this.testProjectValidation();

      console.log('\n' + '=' .repeat(50));
      console.log('✅ All tests completed!');
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      // Clean up
      await this.cleanup();
    }
  }
}

// Run the tests
const tester = new ProjectCategoryTester();
tester.runAllTests().catch(console.error);
