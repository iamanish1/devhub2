#!/usr/bin/env node

/**
 * Manual Contribution Sync Test
 * 
 * This script provides a simple way to test the contribution sync system
 * by calling the actual API endpoints. No additional dependencies required.
 * 
 * Run with: node -r dotenv/config test-contribution-manual.js
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_USER_TOKEN = process.env.TEST_USER_TOKEN || 'your-test-token-here';

class ManualContributionTester {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    });
  }

  async testDebugContributions() {
    console.log('🧪 Testing debug contributions endpoint...');
    
    try {
      const response = await this.apiClient.get('/api/user-projects/debug-contributions');
      
      if (response.data.success) {
        console.log('✅ Debug contributions endpoint working');
        console.log('📊 User Profile Stats:');
        console.log(`   Total Contributions: ${response.data.userProfile.totalContributions}`);
        console.log(`   Completed Projects: ${response.data.userProfile.completedProjects}`);
        console.log('📅 Contribution Data by Date:');
        Object.entries(response.data.contributionData).forEach(([date, count]) => {
          console.log(`   ${date}: ${count} contributions`);
        });
        console.log('🔥 Firebase Data:');
        console.log(`   Total Contributions: ${response.data.firebaseData?.totalContributions || 'N/A'}`);
        console.log(`   Profile Contributions: ${response.data.firebaseData?.profileContributions || 'N/A'}`);
        console.log(`   Last Updated: ${response.data.firebaseData?.lastUpdated || 'N/A'}`);
        
        return true;
      } else {
        console.log('❌ Debug contributions endpoint failed:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing debug contributions:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async testManualSync() {
    console.log('\n🧪 Testing manual sync endpoint...');
    
    try {
      const response = await this.apiClient.post('/api/user-projects/manual-sync');
      
      if (response.data.success) {
        console.log('✅ Manual sync endpoint working');
        console.log(`📊 Sync result: ${response.data.message}`);
        console.log(`   User ID: ${response.data.userId}`);
        console.log(`   Total Contributions: ${response.data.totalContributions}`);
        
        return true;
      } else {
        console.log('❌ Manual sync endpoint failed:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing manual sync:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async testRecalculateStats() {
    console.log('\n🧪 Testing recalculate stats endpoint...');
    
    try {
      const response = await this.apiClient.post('/api/user-projects/recalculate-stats');
      
      if (response.data.success) {
        console.log('✅ Recalculate stats endpoint working');
        console.log(`📊 Recalculation result: ${response.data.message}`);
        console.log(`   Old Contributions: ${response.data.oldContribution}`);
        console.log(`   New Contributions: ${response.data.completedTasks}`);
        console.log(`   Old Completed Projects: ${response.data.oldCompleted}`);
        console.log(`   New Completed Projects: ${response.data.completedProjects}`);
        
        return true;
      } else {
        console.log('❌ Recalculate stats endpoint failed:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing recalculate stats:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Manual Contribution Sync Tests...\n');
    console.log(`🔗 API Base URL: ${API_BASE_URL}`);
    console.log(`🔑 Using token: ${TEST_USER_TOKEN.substring(0, 10)}...`);
    console.log('');

    const results = [];
    
    results.push(await this.testDebugContributions());
    results.push(await this.testManualSync());
    results.push(await this.testRecalculateStats());
    
    const passedTests = results.filter(r => r).length;
    const totalTests = results.length;
    
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    console.log(`Total: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All manual tests passed!');
      console.log('✅ Contribution sync endpoints are working correctly.');
      console.log('✅ You can now test the system by completing tasks in your projects.');
    } else {
      console.log('⚠️  Some tests failed. Please check your setup:');
      console.log('   1. Make sure your backend server is running');
      console.log('   2. Check that you have a valid authentication token');
      console.log('   3. Verify Firebase is properly configured');
    }
  }
}

// Instructions for setup
console.log('📋 Manual Contribution Sync Test Setup:');
console.log('');
console.log('1. Make sure your backend server is running:');
console.log('   cd Server && npm run dev');
console.log('');
console.log('2. Get your authentication token from your browser:');
console.log('   - Open browser dev tools (F12)');
console.log('   - Go to Application/Storage tab');
console.log('   - Find your JWT token in localStorage or cookies');
console.log('');
console.log('3. Set the token as environment variable:');
console.log('   export TEST_USER_TOKEN="your-actual-token-here"');
console.log('   # OR on Windows:');
console.log('   set TEST_USER_TOKEN=your-actual-token-here');
console.log('');
console.log('4. Run the test:');
console.log('   npm run test:contributions');
console.log('');
console.log('Alternatively, you can edit this file and replace "your-test-token-here" with your actual token.');
console.log('');

// Check if token is set
if (TEST_USER_TOKEN === 'your-test-token-here') {
  console.log('⚠️  WARNING: Using default test token. Please set your actual token!');
  console.log('   Set TEST_USER_TOKEN environment variable or edit this file.');
  console.log('');
}

// Run tests
const tester = new ManualContributionTester();
tester.runAllTests().catch(console.error);
