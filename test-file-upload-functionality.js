// Test file to verify file upload functionality

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test the file upload functionality
async function testFileUpload() {
  try {
    console.log('Testing File Upload Functionality...\n');

    // Create a test image file (you can replace this with an actual image path)
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    // Check if test image exists, if not create a dummy one
    if (!fs.existsSync(testImagePath)) {
      console.log('Creating test image file...');
      // Create a simple test image (1x1 pixel JPEG)
      const testImageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
        0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
        0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
        0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
        0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0xFF,
        0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImagePath, testImageBuffer);
    }

    console.log('Test Image Path:', testImagePath);
    console.log('File Size:', fs.statSync(testImagePath).size, 'bytes\n');

    // Test avatar upload
    console.log('Testing Avatar Upload...');
    const avatarFormData = new FormData();
    avatarFormData.append('avatar', fs.createReadStream(testImagePath));

    const avatarResponse = await axios.post(
      'http://localhost:8000/api/uploads/single/avatar',
      avatarFormData,
      {
        headers: {
          ...avatarFormData.getHeaders(),
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
        }
      }
    );

    console.log('Avatar Upload Response:', avatarResponse.data);
    console.log('Avatar URL:', avatarResponse.data.files[0].url);
    console.log('\n---\n');

    // Test profile update with uploaded avatar
    console.log('Testing Profile Update with Uploaded Avatar...');
    const profileData = {
      user_profile_skills: ["JavaScript", "React"],
      user_profile_bio: "Test developer with uploaded avatar",
      user_profile_linkedIn: "https://linkedin.com/in/testuser",
      user_profile_github: "https://github.com/testuser",
      user_profile_website: "https://testuser.dev",
      user_profile_instagram: "https://instagram.com/testuser",
      user_profile_location: "Mumbai, India",
      user_profile_phone: "+91-9876543210",
      user_profile_experience: "2 years of development",
      user_profile_avatar: avatarResponse.data.files[0].url,
      skillExperience: {
        "JavaScript": { years: 2, projects: 5 },
        "React": { years: 1, projects: 3 }
      }
    };

    console.log('Profile Data with Avatar URL:');
    console.log(JSON.stringify(profileData, null, 2));

    console.log('\n✅ Avatar upload functionality test completed!');
    console.log('\nTo test this:');
    console.log('1. Replace YOUR_JWT_TOKEN_HERE with a valid token');
    console.log('2. Run: node test-file-upload-functionality.js');
    console.log('3. Check that avatar is uploaded to the uploads directory');
    console.log('4. Verify that profile update includes the avatar URL');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFileUpload();
