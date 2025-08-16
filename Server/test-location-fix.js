const axios = require('axios');

// Test the location and member since fix
async function testLocationFix() {
  try {
    console.log('Testing Location and Member Since Fix...\n');

    // Test data with location
    const testProfileData = {
      user_profile_skills: ["JavaScript", "React"],
      user_profile_bio: "Test developer with location",
      user_profile_linkedIn: "https://linkedin.com/in/testuser",
      user_profile_github: "https://github.com/testuser",
      user_profile_website: "https://testuser.dev",
      user_profile_instagram: "https://instagram.com/testuser",
      user_profile_location: "Mumbai, India", // This should now be saved properly
      user_profile_phone: "+91-9876543210",
      user_profile_experience: "2 years of development",
      skillExperience: {
        "JavaScript": { years: 2, projects: 5 },
        "React": { years: 1, projects: 3 }
      }
    };

    console.log('Test Profile Data:');
    console.log(JSON.stringify(testProfileData, null, 2));
    console.log('\n---\n');

    console.log('Key Changes Made:');
    console.log('1. Fixed user lookup to use req.user._id instead of username');
    console.log('2. Made location field optional (default: "") instead of required');
    console.log('3. Added proper population of user data in response');
    console.log('4. Added fallback values for empty fields');
    console.log('\n---\n');

    console.log('Expected Response Structure:');
    console.log('{');
    console.log('  message: "Profile updated successfully",');
    console.log('  profile: {');
    console.log('    _id: "...",');
    console.log('    username: {');
    console.log('      _id: "...",');
    console.log('      username: "...",');
    console.log('      email: "...",');
    console.log('      createdAt: "...", // This is the member since date');
    console.log('      ...');
    console.log('    },');
    console.log('    user_profile_location: "Mumbai, India",');
    console.log('    user_profile_created_at: "...",');
    console.log('    user_profile_skills: [...],');
    console.log('    ...');
    console.log('  }');
    console.log('}');

    console.log('\n---\n');
    console.log('Note: This test requires a valid JWT token for authentication.');
    console.log('To test:');
    console.log('1. Login to get a token');
    console.log('2. Replace the Authorization header with your token');
    console.log('3. Run: node test-location-fix.js');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testLocationFix();
