import mongoose from 'mongoose';
import user from './src/Model/UserModel.js';
import dotenv from 'dotenv';

dotenv.config();

const makePlatformAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: node make-platform-admin.js <email>');
      process.exit(1);
    }

    // Find user by email
    const foundUser = await user.findOne({ email });
    
    if (!foundUser) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    // Update user to be platform admin
    foundUser.isPlatformAdmin = true;
    await foundUser.save();

    console.log(`✅ User ${foundUser.username} (${foundUser.email}) is now a platform administrator`);
    console.log('🎉 They can now create basic projects and access platform admin features');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    process.exit(0);
  }
};

makePlatformAdmin();
