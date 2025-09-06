const mongoose = require('mongoose');
const ProjectListing = require('./src/Model/ProjectListingModel.js');
const ProjectSelection = require('./src/Model/ProjectSelectionModel.js');
const Bidding = require('./src/Model/BiddingModel.js');

// Import the checkProjectAccess function
const { checkProjectAccess } = require('./src/controller/ProjectTaskController.js');

async function testFreeProjectAccess() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devhubs');
    console.log('✅ Connected to MongoDB');

    // Create a test free project
    const testProject = new ProjectListing({
      project_Title: 'Test Free Project',
      Project_Description: 'A test free project for access testing',
      project_category: 'free',
      is_free_project: true,
      user: new mongoose.Types.ObjectId(), // Random user ID
      project_budget: 0,
      project_duration: '1 week',
      project_skills_required: ['JavaScript', 'React'],
      project_status: 'active'
    });

    await testProject.save();
    console.log('✅ Created test free project:', testProject._id);

    // Test user ID (different from project owner)
    const testUserId = new mongoose.Types.ObjectId();
    console.log('✅ Using test user ID:', testUserId);

    // Test 1: Check access for free project (should return true)
    console.log('\n🔍 Test 1: Checking access for free project...');
    const accessResult1 = await checkProjectAccess(testProject, testUserId.toString(), null);
    console.log('Access Result:', accessResult1);
    
    if (accessResult1.hasAccess && accessResult1.accessLevel === 'free_contributor') {
      console.log('✅ PASS: Free project access granted correctly');
    } else {
      console.log('❌ FAIL: Free project access should be granted');
    }

    // Test 2: Check access for premium project (should return false)
    console.log('\n🔍 Test 2: Checking access for premium project...');
    const premiumProject = new ProjectListing({
      project_Title: 'Test Premium Project',
      Project_Description: 'A test premium project',
      project_category: 'premium',
      is_free_project: false,
      user: new mongoose.Types.ObjectId(), // Different random user ID
      project_budget: 1000,
      project_duration: '2 weeks',
      project_skills_required: ['JavaScript', 'React'],
      project_status: 'active'
    });

    await premiumProject.save();
    console.log('✅ Created test premium project:', premiumProject._id);

    const accessResult2 = await checkProjectAccess(premiumProject, testUserId.toString(), null);
    console.log('Access Result:', accessResult2);
    
    if (!accessResult2.hasAccess) {
      console.log('✅ PASS: Premium project access denied correctly');
    } else {
      console.log('❌ FAIL: Premium project access should be denied');
    }

    // Test 3: Check access for project owner (should return true)
    console.log('\n🔍 Test 3: Checking access for project owner...');
    const ownerAccessResult = await checkProjectAccess(testProject, testProject.user.toString(), null);
    console.log('Access Result:', ownerAccessResult);
    
    if (ownerAccessResult.hasAccess && ownerAccessResult.accessLevel === 'owner') {
      console.log('✅ PASS: Project owner access granted correctly');
    } else {
      console.log('❌ FAIL: Project owner access should be granted');
    }

    // Clean up test data
    await ProjectListing.findByIdAndDelete(testProject._id);
    await ProjectListing.findByIdAndDelete(premiumProject._id);
    console.log('\n✅ Cleaned up test data');

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testFreeProjectAccess();
