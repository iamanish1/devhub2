import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Bidding from '../Model/BiddingModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import ProjectTask from '../Model/ProjectTaskModel.js';
import UserProfile from '../Model/UserProfileModel.js';
import { firestoreDb } from '../config/firebaseAdmin.js';

// Test configuration
const TEST_CONFIG = {
  userId: 'test-user-123',
  projectId: 'test-project-456',
  taskIds: ['task-1', 'task-2', 'task-3', 'task-4', 'task-5']
};

// Mock data
const mockUser = {
  _id: TEST_CONFIG.userId,
  username: 'testuser',
  email: 'test@example.com'
};

const mockProject = {
  _id: TEST_CONFIG.projectId,
  title: 'Test Project',
  description: 'Test project for contribution sync testing',
  createdBy: TEST_CONFIG.userId
};

const mockBidding = {
  _id: 'bidding-123',
  user_id: TEST_CONFIG.userId,
  project_id: TEST_CONFIG.projectId,
  bid_status: 'Accepted',
  bid_amount: 1000
};

// Test tasks with different completion dates
const mockTasks = [
  {
    _id: 'task-1',
    title: 'Task 1 - Completed on Sep 7',
    status: 'completed',
    projectId: TEST_CONFIG.projectId,
    assignedTo: TEST_CONFIG.userId,
    completedAt: new Date('2025-09-07T10:00:00Z'),
    createdAt: new Date('2025-09-07T09:00:00Z')
  },
  {
    _id: 'task-2',
    title: 'Task 2 - Completed on Sep 12',
    status: 'completed',
    projectId: TEST_CONFIG.projectId,
    assignedTo: TEST_CONFIG.userId,
    completedAt: new Date('2025-09-12T14:00:00Z'),
    createdAt: new Date('2025-09-12T13:00:00Z')
  },
  {
    _id: 'task-3',
    title: 'Task 3 - Completed on Sep 12',
    status: 'completed',
    projectId: TEST_CONFIG.projectId,
    assignedTo: TEST_CONFIG.userId,
    completedAt: new Date('2025-09-12T16:00:00Z'),
    createdAt: new Date('2025-09-12T15:00:00Z')
  },
  {
    _id: 'task-4',
    title: 'Task 4 - Pending',
    status: 'pending',
    projectId: TEST_CONFIG.projectId,
    assignedTo: TEST_CONFIG.userId,
    createdAt: new Date('2025-09-13T10:00:00Z')
  },
  {
    _id: 'task-5',
    title: 'Task 5 - In Progress',
    status: 'in_progress',
    projectId: TEST_CONFIG.projectId,
    assignedTo: TEST_CONFIG.userId,
    createdAt: new Date('2025-09-13T11:00:00Z')
  }
];

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
      username: TEST_CONFIG.userId,
      user_project_contribution: 0,
      user_completed_projects: 0
    });
    await userProfile.save();

    // Create project
    const project = new ProjectListing(mockProject);
    await project.save();

    // Create bidding
    const bidding = new Bidding(mockBidding);
    await bidding.save();

    // Create tasks
    for (const taskData of mockTasks) {
      const task = new ProjectTask(taskData);
      await task.save();
    }

    console.log('📊 Test data summary:');
    console.log(`   - User Profile: ${userProfile.user_project_contribution} contributions`);
    console.log(`   - Project: ${project.title}`);
    console.log(`   - Bidding: ${bidding.bid_status}`);
    console.log(`   - Tasks: ${mockTasks.length} total, ${mockTasks.filter(t => t.status === 'completed').length} completed`);
  }

  async testInitialSync() {
    console.log('\n🧪 Test 1: Initial contribution sync');
    
    try {
      // Import the sync function (we'll need to make it exportable)
      const { syncAllContributionsToFirebase } = await import('../controller/UserProjectsController.js');
      
      // Get user profile
      const userProfile = await UserProfile.findOne({ username: TEST_CONFIG.userId });
      
      // Perform initial sync
      await syncAllContributionsToFirebase(TEST_CONFIG.userId, userProfile, []);
      
      // Check Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_CONFIG.userId);
      const firebaseDoc = await userContributionsRef.get();
      
      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        console.log('📄 Firebase data after initial sync:', firebaseData);
        
        // Verify expected data
        const expectedDates = ['2025-09-07', '2025-09-12'];
        const hasCorrectDates = expectedDates.every(date => firebaseData[date] !== undefined);
        const hasCorrectCounts = firebaseData['2025-09-07'] === 1 && firebaseData['2025-09-12'] === 2;
        
        this.testResults.push({
          test: 'Initial Sync',
          passed: hasCorrectDates && hasCorrectCounts,
          details: {
            expectedDates,
            actualData: firebaseData,
            hasCorrectDates,
            hasCorrectCounts
          }
        });
        
        console.log(`✅ Initial sync test: ${hasCorrectDates && hasCorrectCounts ? 'PASSED' : 'FAILED'}`);
      } else {
        this.testResults.push({
          test: 'Initial Sync',
          passed: false,
          details: { error: 'No Firebase document found' }
        });
        console.log('❌ Initial sync test: FAILED - No Firebase document');
      }
    } catch (error) {
      console.error('❌ Initial sync test error:', error);
      this.testResults.push({
        test: 'Initial Sync',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async testIncrementalSync() {
    console.log('\n🧪 Test 2: Incremental contribution sync');
    
    try {
      // Import the sync function
      const { syncSingleTaskCompletionToFirebase } = await import('../controller/UserProjectsController.js');
      
      // Get user profile
      const userProfile = await UserProfile.findOne({ username: TEST_CONFIG.userId });
      
      // Create a new completed task for today
      const newTask = new ProjectTask({
        _id: 'task-new',
        title: 'New Task - Completed Today',
        status: 'completed',
        projectId: TEST_CONFIG.projectId,
        assignedTo: TEST_CONFIG.userId,
        completedAt: new Date(),
        createdAt: new Date()
      });
      await newTask.save();
      
      // Update user profile
      userProfile.user_project_contribution += 1;
      await userProfile.save();
      
      // Perform incremental sync
      await syncSingleTaskCompletionToFirebase(TEST_CONFIG.userId, userProfile, newTask);
      
      // Check Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_CONFIG.userId);
      const firebaseDoc = await userContributionsRef.get();
      
      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        console.log('📄 Firebase data after incremental sync:', firebaseData);
        
        // Get today's date key
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Verify that today's date was added and previous dates preserved
        const hasToday = firebaseData[todayKey] === 1;
        const hasPreviousDates = firebaseData['2025-09-07'] === 1 && firebaseData['2025-09-12'] === 2;
        const hasCorrectTotal = firebaseData.totalContributions === 4;
        
        this.testResults.push({
          test: 'Incremental Sync',
          passed: hasToday && hasPreviousDates && hasCorrectTotal,
          details: {
            todayKey,
            todayCount: firebaseData[todayKey],
            previousDatesPreserved: hasPreviousDates,
            totalContributions: firebaseData.totalContributions,
            hasToday,
            hasPreviousDates,
            hasCorrectTotal
          }
        });
        
        console.log(`✅ Incremental sync test: ${hasToday && hasPreviousDates && hasCorrectTotal ? 'PASSED' : 'FAILED'}`);
      } else {
        this.testResults.push({
          test: 'Incremental Sync',
          passed: false,
          details: { error: 'No Firebase document found' }
        });
        console.log('❌ Incremental sync test: FAILED - No Firebase document');
      }
    } catch (error) {
      console.error('❌ Incremental sync test error:', error);
      this.testResults.push({
        test: 'Incremental Sync',
        passed: false,
        details: { error: error.message }
      });
    }
  }

  async testMultipleTasksSameDay() {
    console.log('\n🧪 Test 3: Multiple tasks completed on same day');
    
    try {
      // Import the sync function
      const { syncSingleTaskCompletionToFirebase } = await import('../controller/UserProjectsController.js');
      
      // Get user profile
      const userProfile = await UserProfile.findOne({ username: TEST_CONFIG.userId });
      
      // Create multiple tasks for the same day
      const today = new Date();
      const tasksForToday = [];
      
      for (let i = 0; i < 3; i++) {
        const task = new ProjectTask({
          _id: `task-today-${i}`,
          title: `Task Today ${i + 1}`,
          status: 'completed',
          projectId: TEST_CONFIG.projectId,
          assignedTo: TEST_CONFIG.userId,
          completedAt: new Date(today.getTime() + i * 60000), // 1 minute apart
          createdAt: new Date(today.getTime() + i * 60000)
        });
        await task.save();
        tasksForToday.push(task);
        
        // Update user profile
        userProfile.user_project_contribution += 1;
        await userProfile.save();
        
        // Sync each task individually
        await syncSingleTaskCompletionToFirebase(TEST_CONFIG.userId, userProfile, task);
      }
      
      // Check Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_CONFIG.userId);
      const firebaseDoc = await userContributionsRef.get();
      
      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        console.log('📄 Firebase data after multiple same-day tasks:', firebaseData);
        
        // Get today's date key
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Verify accumulation
        const todayCount = firebaseData[todayKey] || 0;
        const hasCorrectAccumulation = todayCount === 4; // 1 from previous test + 3 new
        const hasCorrectTotal = firebaseData.totalContributions === 7; // 3 initial + 1 previous + 3 new
        
        this.testResults.push({
          test: 'Multiple Tasks Same Day',
          passed: hasCorrectAccumulation && hasCorrectTotal,
          details: {
            todayKey,
            todayCount,
            expectedCount: 4,
            totalContributions: firebaseData.totalContributions,
            expectedTotal: 7,
            hasCorrectAccumulation,
            hasCorrectTotal
          }
        });
        
        console.log(`✅ Multiple tasks same day test: ${hasCorrectAccumulation && hasCorrectTotal ? 'PASSED' : 'FAILED'}`);
      } else {
        this.testResults.push({
          test: 'Multiple Tasks Same Day',
          passed: false,
          details: { error: 'No Firebase document found' }
        });
        console.log('❌ Multiple tasks same day test: FAILED - No Firebase document');
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
    console.log('\n🧪 Test 4: Data consistency between MongoDB and Firebase');
    
    try {
      // Get MongoDB data
      const userProfile = await UserProfile.findOne({ username: TEST_CONFIG.userId });
      const completedTasks = await ProjectTask.find({
        projectId: TEST_CONFIG.projectId,
        status: { $in: ['completed', 'Completed', 'done'] }
      });
      
      // Get Firebase data
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_CONFIG.userId);
      const firebaseDoc = await userContributionsRef.get();
      
      if (firebaseDoc.exists) {
        const firebaseData = firebaseDoc.data();
        
        // Calculate expected totals
        const mongoTotal = userProfile.user_project_contribution;
        const firebaseTotal = firebaseData.totalContributions;
        const firebaseProfileTotal = firebaseData.profileContributions;
        
        // Count contributions by date from MongoDB
        const mongoDateCounts = {};
        completedTasks.forEach(task => {
          const completionDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
          const dateKey = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}-${String(completionDate.getDate()).padStart(2, '0')}`;
          mongoDateCounts[dateKey] = (mongoDateCounts[dateKey] || 0) + 1;
        });
        
        // Compare totals
        const totalsMatch = mongoTotal === firebaseTotal && firebaseTotal === firebaseProfileTotal;
        
        // Compare date-wise counts
        const dateCountsMatch = Object.keys(mongoDateCounts).every(dateKey => {
          return mongoDateCounts[dateKey] === firebaseData[dateKey];
        });
        
        this.testResults.push({
          test: 'Data Consistency',
          passed: totalsMatch && dateCountsMatch,
          details: {
            mongoTotal,
            firebaseTotal,
            firebaseProfileTotal,
            mongoDateCounts,
            firebaseDateCounts: Object.keys(firebaseData).filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/)).reduce((acc, key) => {
              acc[key] = firebaseData[key];
              return acc;
            }, {}),
            totalsMatch,
            dateCountsMatch
          }
        });
        
        console.log(`✅ Data consistency test: ${totalsMatch && dateCountsMatch ? 'PASSED' : 'FAILED'}`);
        console.log(`   MongoDB total: ${mongoTotal}`);
        console.log(`   Firebase total: ${firebaseTotal}`);
        console.log(`   Firebase profile total: ${firebaseProfileTotal}`);
        console.log(`   Date counts match: ${dateCountsMatch}`);
      } else {
        this.testResults.push({
          test: 'Data Consistency',
          passed: false,
          details: { error: 'No Firebase document found' }
        });
        console.log('❌ Data consistency test: FAILED - No Firebase document');
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
    
    await this.testInitialSync();
    await this.testIncrementalSync();
    await this.testMultipleTasksSameDay();
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
      } else if (!result.passed) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      
      if (result.passed) passedTests++;
    });
    
    console.log('=' .repeat(50));
    console.log(`Total: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! Contribution sync system is working correctly.');
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
      const userContributionsRef = firestoreDb.collection('userContributions').doc(TEST_CONFIG.userId);
      await userContributionsRef.delete();
      console.log('✅ Cleaned up Firebase test data');
    } catch (error) {
      console.log('⚠️  Could not clean up Firebase test data:', error.message);
    }
  }
}

// Export for use in other files
export default ContributionSyncTester;

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new ContributionSyncTester();
  tester.runAllTests().catch(console.error);
}
