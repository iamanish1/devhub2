import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BonusPool from './src/Model/BonusPoolModel.js';
import ProjectListing from './src/Model/ProjectListingModel.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function manuallyFundBonusPools() {
  try {
    console.log('\n💰 Manually Funding Bonus Pools...\n');

    // Find all pending bonus pools
    const pendingBonusPools = await BonusPool.find({ status: 'pending' });
    console.log(`📊 Found ${pendingBonusPools.length} pending bonus pools`);

    if (pendingBonusPools.length === 0) {
      console.log('ℹ️  No pending bonus pools found');
      return;
    }

    for (const bonusPool of pendingBonusPools) {
      console.log(`\n🏗️  Funding Bonus Pool for Project: ${bonusPool.projectTitle || bonusPool.projectId}`);
      console.log(`   - ID: ${bonusPool._id}`);
      console.log(`   - Current Status: ${bonusPool.status}`);
      console.log(`   - Total Amount: ₹${bonusPool.totalAmount}`);
      console.log(`   - Contributor Count: ${bonusPool.contributorCount}`);

      // Update bonus pool status to funded
      bonusPool.status = 'funded';
      bonusPool.fundedAt = new Date();
      await bonusPool.save();

      console.log(`   ✅ Updated status to: ${bonusPool.status}`);
      console.log(`   ✅ Funded at: ${bonusPool.fundedAt}`);
    }

    console.log('\n🎉 All pending bonus pools have been funded!');

  } catch (error) {
    console.error('❌ Error funding bonus pools:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the funding
manuallyFundBonusPools();
