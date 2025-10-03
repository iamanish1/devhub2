#!/usr/bin/env node

/**
 * Simple Contribution Sync Test Script
 * 
 * This script tests the automatic real-time contribution sync system
 * without requiring additional dependencies. It uses your existing MongoDB connection.
 * 
 * Run with: node -r dotenv/config test-contribution-sync-simple.js
 */

import mongoose from 'mongoose';
import Bidding from './src/Model/BiddingModel.js';
import ProjectListing from './src/Model/ProjectListingModel.js';
import ProjectTask from './src/Model/ProjectTaskModel.js';
import UserProfile from './src/Model/UserProfileModel.js';
import { firestoreDb } from './src/config/firebaseAdmin.js';

// Test configuration
const TEST_USER_ID = new mongoose.Types.ObjectId();
const TEST_PROJECT_ID = new mongoose.Types.ObjectId();

class SimpleContributionSyncTester {
  constructor() {
    this.testResults = [];
    this.createdData = {
      userProfile: null,
      project: null,
      bidding: null,
      tasks: []
    };
  }

  async setup() {
    console.log('🚀 Setting up simple contribution sync test...');
    
    // Connect to your existing MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devhubs');
      console.log('✅ Connected to MongoDB');
    } else {
      console.log('✅ Already connected to MongoDB');
    }
    
    // Create test data
    await this.createTestData();
    console.log('✅ Test data created');
  }

  async createTestData() {
    try {
      // Create user profile
      this.createdData.userProfile = new UserProfile({
        username: TEST_USER_ID,
        user_project_contribution: 0,
        user_completed_projects: 0
      });
      await this.createdData.userProfile.save();

      // Create project
      this.createdData.project = new ProjectListing({
        _id: TEST_PROJECT_ID,
        title: 'Test Project for Contribution Sync',
        description: 'Test project for contribution sync testing',
        createdBy: TEST_USER_ID
      });
      await this.createdData.project.save();

      // Create bidding
      this.createdData.bidding = new Bidding({
        user_id: TEST_USER_ID,
        project_id: TEST_PROJECT_ID,
        bid_status: 'Accepted',
        bid_amount: 1000
      });
      await this.createdData.bidding.save();

      console.log('📊 Test data summary:');
      console.log(`   - User: ${TEST_USER_ID}`);
      console.log(`   - Project: ${this.createdData.project.title}`);
      console.log(`   - Bidding: ${this.createdData.bidding.bid_status}`);
    } catch (error) {
      console.error('❌ Error creating test data:', error.message);
      throw error;
    }
  }

  async testSingleTaskCompletion() {
    console.log('\n🧪 Test 1: Single task completion sync');
    
    try {
      // Create a completed task
      const task = new ProjectTask({
        title: 'Test Task - Single Completion',
        status: 'completed',
        projectId: TEST_PROJECT_ID,
        assignedTo: TEST_USER_ID,
        completedAt: new Date(),
        createdAt: new Date()
      });
      await task.save();
      this.createdData.tasks.push(task);

      // Update user profile
      this.createdData.userProfile.user_project_contribution = 1;
      await this.createdData.userProfile.save();

      // Import and call the sync function
      const { syncSingleTaskCompletionToFirebase } = await import('./src/controller/UserProjectsController.js');
      await syncSingleTaskCompletionToFirebase(TEST_USER_ID, this.createdData.userProfile, task);

      // Check Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
      const firebaseDoc = await userContributionsRef.get();

      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const hasToday = firebaseData[todayKey] === 1;
        const hasCorrectTotal = firebaseData.totalContributions === 1;
        
        console.log(`📄 Firebase data:`, firebaseData);
        console.log(`✅ Single task completion test: ${hasToday && hasCorrectTotal ? 'PASSED' : 'FAILED'}`);
        
        this.testResults.push({
          test: 'Single Task Completion',
          passed: hasToday && hasCorrectTotal,
          details: { firebaseData, todayKey }
        });
      } else {
        console.log('❌ Single task completion test: FAILED - No Firebase document');
        this.testResults.push({
          test: 'Single Task Completion',
          passed: false,
          details: { error: 'No Firebase document found' }
        });
      }
    } catch (error) {
      console.error('❌ Single task completion test error:', error);
      this.testResults.push({
        test: 'Single Task Completion',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async testMultipleTasksSameDay() {
    console.log('\n🧪 Test 2: Multiple tasks completed on same day');
    
    try {
      // Create multiple tasks for today
      const today = new Date();
      for (let i = 0; i < 3; i++) {
        const task = new ProjectTask({
          title: `Test Task ${i + 1} - Same Day`,
          status: 'completed',
          projectId: TEST_PROJECT_ID,
          assignedTo: TEST_USER_ID,
          completedAt: new Date(today.getTime() + i * 60000), // 1 minute apart
          createdAt: new Date(today.getTime() + i * 60000)
        });
        await task.save();
        this.createdData.tasks.push(task);

        // Update user profile
        this.createdData.userProfile.user_project_contribution += 1;
        await this.createdData.userProfile.save();

        // Sync each task
        const { syncSingleTaskCompletionToFirebase } = await import('./src/controller/UserProjectsController.js');
        await syncSingleTaskCompletionToFirebase(TEST_USER_ID, this.createdData.userProfile, task);
      }

      // Check Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
      const firebaseDoc = await userContributionsRef.get();

      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const todayCount = firebaseData[todayKey] || 0;
        const hasCorrectAccumulation = todayCount === 4; // 1 from previous test + 3 new
        const hasCorrectTotal = firebaseData.totalContributions === 4;
        
        console.log(`📄 Firebase data:`, firebaseData);
        console.log(`✅ Multiple tasks same day test: ${hasCorrectAccumulation && hasCorrectTotal ? 'PASSED' : 'FAILED'}`);
        console.log(`   Today's count: ${todayCount} (expected: 4)`);
        console.log(`   Total contributions: ${firebaseData.totalContributions} (expected: 4)`);
        
        this.testResults.push({
          test: 'Multiple Tasks Same Day',
          passed: hasCorrectAccumulation && hasCorrectTotal,
          details: { firebaseData, todayKey, todayCount }
        });
      } else {
        console.log('❌ Multiple tasks same day test: FAILED - No Firebase document');
        this.testResults.push({
          test: 'Multiple Tasks Same Day',
          passed: false,
          details: { error: 'No Firebase document found' }
        });
      }
    } catch (error) {
      console.error('❌ Multiple tasks same day test error:', error);
      this.testResults.push({
        test: 'Multiple Tasks Same Day',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async testDataConsistency() {
    console.log('\n🧪 Test 3: Data consistency between MongoDB and Firebase');
    
    try {
      // Get MongoDB data
      const userProfile = await UserProfile.findOne({ username: TEST_USER_ID });
      const completedTasks = await ProjectTask.find({
        projectId: TEST_PROJECT_ID,
        status: { $in: ['completed', 'Completed', 'done'] }
      });

      // Get Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
      const firebaseDoc = await userContributionsRef.get();

      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        
        const mongoTotal = userProfile.user_project_contribution;
        const firebaseTotal = firebaseData.totalContributions;
        const firebaseProfileTotal = firebaseData.profileContributions;
        
        const totalsMatch = mongoTotal === firebaseTotal && firebaseTotal === firebaseProfileTotal;
        
        console.log(`📊 Data consistency check:`);
        console.log(`   MongoDB total: ${mongoTotal}`);
        console.log(`   Firebase total: ${firebaseTotal}`);
        console.log(`   Firebase profile total: ${firebaseProfileTotal}`);
        console.log(`   Completed tasks in MongoDB: ${completedTasks.length}`);
        console.log(`✅ Data consistency test: ${totalsMatch ? 'PASSED' : 'FAILED'}`);
        
        this.testResults.push({
          test: 'Data Consistency',
          passed: totalsMatch,
          details: { mongoTotal, firebaseTotal, firebaseProfileTotal, completedTasksCount: completedTasks.length }
        });
      } else {
        console.log('❌ Data consistency test: FAILED - No Firebase document');
        this.testResults.push({
          test: 'Data Consistency',
          passed: false,
          details: { error: 'No Firebase document found' }
        });
      }
    } catch (error) {
      console.error('❌ Data consistency test error:', error);
      this.testResults.push({
        test: 'Data Consistency',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Simple Contribution Sync Test Suite...\n');
    
    try {
      await this.setup();
      
      await this.testSingleTaskCompletion();
      await this.testMultipleTasksSameDay();
      await this.testDataConsistency();
      
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
      console.log('✅ Automatic real-time sync is functioning as expected.');
      console.log('✅ Date-wise accumulation is working properly.');
      console.log('✅ Data consistency between MongoDB and Firebase is maintained.');
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.');
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Clean up MongoDB data
      if (this.createdData.userProfile) {
        await UserProfile.deleteOne({ username: TEST_USER_ID });
        console.log('✅ Cleaned up user profile');
      }
      
      if (this.createdData.project) {
        await ProjectListing.deleteOne({ _id: TEST_PROJECT_ID });
        console.log('✅ Cleaned up project');
      }
      
      if (this.createdData.bidding) {
        await Bidding.deleteOne({ user_id: TEST_USER_ID });
        console.log('✅ Cleaned up bidding');
      }
      
      if (this.createdData.tasks.length > 0) {
        await ProjectTask.deleteMany({ projectId: TEST_PROJECT_ID });
        console.log('✅ Cleaned up tasks');
      }
      
      // Clean up Firebase test data
      try {
        const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
        await userContributionsRef.delete();
        console.log('✅ Cleaned up Firebase test data');
      } catch (error) {
        console.log('⚠️  Could not clean up Firebase test data:', error.message);
      }
      
    } catch (error) {
      console.log('⚠️  Error during cleanup:', error.message);
    }
  }
}

// Run tests
const tester = new SimpleContributionSyncTester();
tester.runAllTests().catch(console.error);
