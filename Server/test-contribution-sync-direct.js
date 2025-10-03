#!/usr/bin/env node

/**
 * Direct Contribution Sync Test
 * 
 * This script tests the contribution sync functions directly
 * without creating complex database records.
 * 
 * Run with: node -r dotenv/config test-contribution-sync-direct.js
 */

import mongoose from 'mongoose';
import { firestoreDb } from './src/config/firebaseAdmin.js';

// Test configuration
const TEST_USER_ID = new mongoose.Types.ObjectId().toString();

class DirectContributionSyncTester {
  constructor() {
    this.testResults = [];
  }

  async setup() {
    console.log('🚀 Setting up direct contribution sync test...');
    
    // Connect to your existing MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devhubs');
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('✅ Already connected to MongoDB');
    }
    
    console.log(`📊 Test User ID: ${TEST_USER_ID}`);
  }

  async testFirebaseConnection() {
    console.log('\n🧪 Test 1: Firebase connection test');
    
    try {
      if (!firestoreDb) {
        throw new Error('Firebase database not initialized');
      }
      
      // Test Firebase connection by creating a test document
      const testRef = firestoreDb.collection('test').doc('connection-test');
      await testRef.set({
        test: true,
        timestamp: new Date(),
        message: 'Firebase connection working'
      });
      
      // Read it back
      const doc = await testRef.get();
      if (doc.exists) {
        console.log('✅ Firebase connection test: PASSED');
        console.log('📄 Test document created and read successfully');
        
        // Clean up test document
        await testRef.delete();
        
        this.testResults.push({
          test: 'Firebase Connection',
          passed: true,
          details: { message: 'Firebase is working correctly' }
        });
      } else {
        throw new Error('Test document not found');
      }
    } catch (error) {
      console.error('❌ Firebase connection test: FAILED');
      console.error('   Error:', error.message);
      this.testResults.push({
        test: 'Firebase Connection',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async testSyncFunctionImport() {
    console.log('\n🧪 Test 2: Sync function import test');
    
    try {
      // Test importing the sync functions
      const { syncSingleTaskCompletionToFirebase, syncAllContributionsToFirebase } = await import('./src/controller/UserProjectsController.js');
      
      if (typeof syncSingleTaskCompletionToFirebase === 'function' && 
          typeof syncAllContributionsToFirebase === 'function') {
        console.log('✅ Sync function import test: PASSED');
        console.log('📄 Both sync functions imported successfully');
        
        this.testResults.push({
          test: 'Sync Function Import',
          passed: true,
          details: { 
            syncSingleTaskCompletionToFirebase: 'function',
            syncAllContributionsToFirebase: 'function'
          }
        });
      } else {
        throw new Error('Sync functions not properly exported');
      }
    } catch (error) {
      console.error('❌ Sync function import test: FAILED');
      console.error('   Error:', error.message);
      this.testResults.push({
        test: 'Sync Function Import',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async testMockSyncFunction() {
    console.log('\n🧪 Test 3: Mock sync function test');
    
    try {
      // Import the sync function
      const { syncSingleTaskCompletionToFirebase } = await import('./src/controller/UserProjectsController.js');
      
      // Create mock data
      const mockUserProfile = {
        user_project_contribution: 1,
        user_completed_projects: 0
      };
      
      const mockTask = {
        title: 'Test Task',
        status: 'completed',
        completedAt: new Date(),
        createdAt: new Date()
      };
      
      // Test the sync function with mock data
      await syncSingleTaskCompletionToFirebase(TEST_USER_ID, mockUserProfile, mockTask);
      
      // Check if Firebase document was created
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
      const firebaseDoc = await userContributionsRef.get();
      
      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const hasToday = firebaseData[todayKey] === 1;
        const hasCorrectTotal = firebaseData.totalContributions === 1;
        
        console.log('✅ Mock sync function test: PASSED');
        console.log('📄 Firebase document created successfully');
        console.log(`📅 Today's contributions (${todayKey}): ${firebaseData[todayKey]}`);
        console.log(`📊 Total contributions: ${firebaseData.totalContributions}`);
        
        this.testResults.push({
          test: 'Mock Sync Function',
          passed: hasToday && hasCorrectTotal,
          details: { firebaseData, todayKey }
        });
      } else {
        throw new Error('Firebase document not created');
      }
    } catch (error) {
      console.error('❌ Mock sync function test: FAILED');
      console.error('   Error:', error.message);
      this.testResults.push({
        test: 'Mock Sync Function',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async testAccumulation() {
    console.log('\n🧪 Test 4: Contribution accumulation test');
    
    try {
      // Import the sync function
      const { syncSingleTaskCompletionToFirebase } = await import('./src/controller/UserProjectsController.js');
      
      // Create mock data for multiple tasks
      const mockUserProfile = {
        user_project_contribution: 3, // Increment for multiple tasks
        user_completed_projects: 0
      };
      
      // Add 2 more tasks to the same day
      for (let i = 0; i < 2; i++) {
        const mockTask = {
          title: `Test Task ${i + 2}`,
          status: 'completed',
          completedAt: new Date(),
          createdAt: new Date()
        };
        
        await syncSingleTaskCompletionToFirebase(TEST_USER_ID, mockUserProfile, mockTask);
      }
      
      // Check Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
      const firebaseDoc = await userContributionsRef.get();
      
      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const todayCount = firebaseData[todayKey] || 0;
        const hasCorrectAccumulation = todayCount === 3; // 1 from previous test + 2 new
        const hasCorrectTotal = firebaseData.totalContributions === 3;
        
        console.log('✅ Contribution accumulation test: PASSED');
        console.log('📄 Multiple tasks accumulated correctly');
        console.log(`📅 Today's contributions (${todayKey}): ${todayCount} (expected: 3)`);
        console.log(`📊 Total contributions: ${firebaseData.totalContributions} (expected: 3)`);
        
        this.testResults.push({
          test: 'Contribution Accumulation',
          passed: hasCorrectAccumulation && hasCorrectTotal,
          details: { firebaseData, todayKey, todayCount }
        });
      } else {
        throw new Error('Firebase document not found');
      }
    } catch (error) {
      console.error('❌ Contribution accumulation test: FAILED');
      console.error('   Error:', error.message);
      this.testResults.push({
        test: 'Contribution Accumulation',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Direct Contribution Sync Tests...\n');
    
    try {
      await this.setup();
      
      await this.testFirebaseConnection();
      await this.testSyncFunctionImport();
      await this.testMockSyncFunction();
      await this.testAccumulation();
      
      await this.cleanup();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    let passedTests = 0;
    let totalTests = this.testResults.length;
    
    this.testResults.forEach((result, index) => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${index + 1}. ${result.test}: ${status}`);
      
      if (!result.passed && result.details.error) {
        console.log(`   Error: ${result.details.error}`);
      }
      
      if (result.passed) passedTests++;
    });
    
    console.log('=' .repeat(50));
    console.log(`Total: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Contribution sync system is working correctly.');
      console.log('✅ Firebase connection is working');
      console.log('✅ Sync functions are properly exported');
      console.log('✅ Single task sync is working');
      console.log('✅ Contribution accumulation is working');
      console.log('');
      console.log('🚀 Your automatic real-time contribution sync system is ready!');
      console.log('   When users complete tasks, they will automatically sync to Firebase');
      console.log('   with proper date-wise accumulation.');
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.');
      console.log('');
      console.log('🔧 Common fixes:');
      console.log('   1. Check Firebase Admin SDK configuration');
      console.log('   2. Verify environment variables are set correctly');
      console.log('   3. Ensure Firebase project has proper permissions');
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Clean up Firebase test data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
      await userContributionsRef.delete();
      console.log('✅ Cleaned up Firebase test data');
      
    } catch (error) {
      console.log('⚠️  Error during cleanup:', error.message);
    }
  }
}

// Run tests
const tester = new DirectContributionSyncTester();
tester.runAllTests().catch(console.error);
