const axios = require('axios');

// Test the updated profile API
async function testProfileAPI() {
  try {
    console.log('Testing Profile API...\n');

    // Test data for the new profile system
    const testProfileData = {
      user_profile_skills: ["JavaScript", "React", "Node.js"],
      user_profile_bio: "Passionate developer with expertise in modern web technologies",
      user_profile_linkedIn: "https://linkedin.com/in/testuser",
      user_profile_github: "https://github.com/testuser",
      user_profile_website: "https://testuser.dev",
      user_profile_instagram: "https://instagram.com/testuser",
      user_profile_location: "Mumbai, India",
      user_profile_phone: "+91-9876543210",
      user_profile_experience: "3 years of full-stack development",
      skillExperience: {
        "JavaScript": { years: 3, projects: 8 },
        "React": { years: 2, projects: 6 },
        "Node.js": { years: 2, projects: 5 }
      }
    };

    console.log('Test Profile Data:');
    console.log(JSON.stringify(testProfileData, null, 2));
    console.log('\n---\n');

    // Note: This test requires authentication
    console.log('Note: This test requires a valid JWT token for authentication.');
    console.log('To run this test:');
    console.log('1. Login to get a token');
    console.log('2. Replace the Authorization header with your token');
    console.log('3. Run: node test-profile-api.js');

    // Example API call (commented out as it needs authentication)
    /*
    const response = await axios.post('http://localhost:8000/api/editprofile', testProfileData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
      }
    });

    console.log('API Response:', response.data);
    */

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testProfileAPI();
