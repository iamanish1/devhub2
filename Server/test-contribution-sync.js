#!/usr/bin/env node

/**
 * Contribution Sync Test Script
 * 
 * This script tests the automatic real-time contribution sync system
 * Run with: node test-contribution-sync.js
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Bidding from './src/Model/BiddingModel.js';
import ProjectListing from './src/Model/ProjectListingModel.js';
import ProjectTask from './src/Model/ProjectTaskModel.js';
import UserProfile from './src/Model/UserProfileModel.js';
import { firestoreDb } from './src/config/firebaseAdmin.js';

// Test configuration
const TEST_USER_ID = 'test-user-contribution-sync';
const TEST_PROJECT_ID = 'test-project-contribution-sync';

class ContributionSyncTester {
  constructor() {
    this.mongoServer = null;
    this.connection = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🚀 Setting up contribution sync test environment...');
    
    // Start in-memory MongoDB
    this.mongoServer = await MongoMemoryServer.create();
    const mongoUri = this.mongoServer.getUri();
    
    // Connect to MongoDB
    this.connection = await mongoose.connect(mongoUri);
    console.log('✅ Connected to in-memory MongoDB');
    
    // Create test data
    await this.createTestData();
    console.log('✅ Test data created');
  }

  async createTestData() {
    // Create user profile
    const userProfile = new UserProfile({
      username: TEST_USER_ID,
      user_project_contribution: 0,
      user_completed_projects: 0
    });
    await userProfile.save();

    // Create project
    const project = new ProjectListing({
      _id: TEST_PROJECT_ID,
      title: 'Test Project for Contribution Sync',
      description: 'Test project for contribution sync testing',
      createdBy: TEST_USER_ID
    });
    await project.save();

    // Create bidding
    const bidding = new Bidding({
      user_id: TEST_USER_ID,
      project_id: TEST_PROJECT_ID,
      bid_status: 'Accepted',
      bid_amount: 1000
    });
    await bidding.save();

    console.log('📊 Test data summary:');
    console.log(`   - User: ${TEST_USER_ID}`);
    console.log(`   - Project: ${project.title}`);
    console.log(`   - Bidding: ${bidding.bid_status}`);
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

      // Update user profile
      const userProfile = await UserProfile.findOne({ username: TEST_USER_ID });
      userProfile.user_project_contribution = 1;
      await userProfile.save();

      // Import and call the sync function
      const { syncSingleTaskCompletionToFirebase } = await import('./src/controller/UserProjectsController.js');
      await syncSingleTaskCompletionToFirebase(TEST_USER_ID, userProfile, task);

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
      const userProfile = await UserProfile.findOne({ username: TEST_USER_ID });
      
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

        // Update user profile
        userProfile.user_project_contribution += 1;
        await userProfile.save();

        // Sync each task
        const { syncSingleTaskCompletionToFirebase } = await import('./src/controller/UserProjectsController.js');
        await syncSingleTaskCompletionToFirebase(TEST_USER_ID, userProfile, task);
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

  async testDifferentDays() {
    console.log('\n🧪 Test 3: Tasks completed on different days');
    
    try {
      const userProfile = await UserProfile.findOne({ username: TEST_USER_ID });
      
      // Create tasks for different days
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const taskYesterday = new ProjectTask({
        title: 'Test Task - Yesterday',
        status: 'completed',
        projectId: TEST_PROJECT_ID,
        assignedTo: TEST_USER_ID,
        completedAt: yesterday,
        createdAt: yesterday
      });
      await taskYesterday.save();

      userProfile.user_project_contribution += 1;
      await userProfile.save();

      // Sync yesterday's task
      const { syncSingleTaskCompletionToFirebase } = await import('./src/controller/UserProjectsController.js');
      await syncSingleTaskCompletionToFirebase(TEST_USER_ID, userProfile, taskYesterday);

      // Check Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
      const firebaseDoc = await userContributionsRef.get();

      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const hasYesterday = firebaseData[yesterdayKey] === 1;
        const hasToday = firebaseData[todayKey] === 4; // From previous tests
        const hasCorrectTotal = firebaseData.totalContributions === 5;
        
        console.log(`📄 Firebase data:`, firebaseData);
        console.log(`✅ Different days test: ${hasYesterday && hasToday && hasCorrectTotal ? 'PASSED' : 'FAILED'}`);
        console.log(`   Yesterday (${yesterdayKey}): ${firebaseData[yesterdayKey]} (expected: 1)`);
        console.log(`   Today (${todayKey}): ${firebaseData[todayKey]} (expected: 4)`);
        console.log(`   Total contributions: ${firebaseData.totalContributions} (expected: 5)`);
        
        this.testResults.push({
          test: 'Different Days',
          passed: hasYesterday && hasToday && hasCorrectTotal,
          details: { firebaseData, yesterdayKey, todayKey }
        });
      } else {
        console.log('❌ Different days test: FAILED - No Firebase document');
        this.testResults.push({
          test: 'Different Days',
          passed: false,
          details: { error: 'No Firebase document found' }
        });
      }
    } catch (error) {
      console.error('❌ Different days test error:', error);
      this.testResults.push({
        test: 'Different Days',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async testDataConsistency() {
    console.log('\n🧪 Test 4: Data consistency between MongoDB and Firebase');
    
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
    console.log('🧪 Starting Contribution Sync Test Suite...\n');
    
    await this.setup();
    
    await this.testSingleTaskCompletion();
    await this.testMultipleTasksSameDay();
    await this.testDifferentDays();
    await this.testDataConsistency();
    
    await this.cleanup();
    
    this.printResults();
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
    console.log('\n🧹 Cleaning up test environment...');
    
    if (this.connection) {
      await this.connection.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }
    
    if (this.mongoServer) {
      await this.mongoServer.stop();
      console.log('✅ Stopped in-memory MongoDB server');
    }
    
    // Clean up Firebase test data
    try {
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_USER_ID);
      await userContributionsRef.delete();
      console.log('✅ Cleaned up Firebase test data');
    } catch (error) {
      console.log('⚠️  Could not clean up Firebase test data:', error.message);
    }
  }
}

// Run tests
const tester = new ContributionSyncTester();
tester.runAllTests().catch(console.error);
