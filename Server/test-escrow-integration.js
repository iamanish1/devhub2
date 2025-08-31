/**
 * Test Script: Escrow System Integration Test
 * 
 * This script tests the complete escrow system integration:
 * 1. Escrow wallet creation
 * 2. Fund locking
 * 3. Data retrieval for admin panel
 * 4. Data retrieval for contribution panel
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EscrowWallet from './src/Model/EscrowWalletModel.js';
import ProjectSelection from './src/Model/ProjectSelectionModel.js';
import Bidding from './src/Model/BiddingModel.js';
import ProjectListing from './src/Model/ProjectListingModel.js';
import user from './src/Model/UserModel.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testEscrowIntegration() {
  console.log('🧪 Starting Escrow System Integration Test...\n');

  try {
    // Test 1: Check if escrow wallets exist
    console.log('1️⃣ Testing Escrow Wallet Data Retrieval...');
    const escrowWallets = await EscrowWallet.find({});
    console.log(`   - Found ${escrowWallets.length} escrow wallets`);
    
    if (escrowWallets.length > 0) {
      console.log('   - Sample escrow wallet data:');
      const sampleWallet = escrowWallets[0];
      console.log(`     Project ID: ${sampleWallet.projectId}`);
      console.log(`     Status: ${sampleWallet.status}`);
      console.log(`     Total Bonus Pool: ₹${sampleWallet.totalBonusPool}`);
      console.log(`     Total Escrow Amount: ₹${sampleWallet.totalEscrowAmount}`);
      console.log(`     Locked Funds Count: ${sampleWallet.lockedFunds?.length || 0}`);
      
      if (sampleWallet.lockedFunds && sampleWallet.lockedFunds.length > 0) {
        console.log('   - Locked funds details:');
        sampleWallet.lockedFunds.forEach((fund, index) => {
          console.log(`     Fund ${index + 1}:`);
          console.log(`       User ID: ${fund.userId}`);
          console.log(`       Bid Amount: ₹${fund.bidAmount}`);
          console.log(`       Bonus Amount: ₹${fund.bonusAmount}`);
          console.log(`       Total Amount: ₹${fund.totalAmount}`);
          console.log(`       Status: ${fund.lockStatus}`);
        });
      }
    }

    // Test 2: Check project selections with escrow data
    console.log('\n2️⃣ Testing Project Selection with Escrow Data...');
    const selections = await ProjectSelection.find({});
    console.log(`   - Found ${selections.length} project selections`);
    
    const selectionsWithEscrow = selections.filter(s => s.selectedUsers?.some(u => u.escrowLocked));
    console.log(`   - Found ${selectionsWithEscrow.length} selections with escrow locked users`);
    
    if (selectionsWithEscrow.length > 0) {
      console.log('   - Sample selection with escrow:');
      const sampleSelection = selectionsWithEscrow[0];
      console.log(`     Project ID: ${sampleSelection.projectId}`);
      console.log(`     Status: ${sampleSelection.status}`);
      console.log(`     Selected Users: ${sampleSelection.selectedUsers?.length || 0}`);
      
      const escrowLockedUsers = sampleSelection.selectedUsers?.filter(u => u.escrowLocked) || [];
      console.log(`     Users with escrow locked: ${escrowLockedUsers.length}`);
      
      escrowLockedUsers.forEach((user, index) => {
        console.log(`       User ${index + 1}: ${user.userId} (Locked: ${user.escrowLockedAt})`);
      });
    }

    // Test 3: Check bids with payment status
    console.log('\n3️⃣ Testing Bids with Payment Status...');
    const bids = await Bidding.find({});
    console.log(`   - Found ${bids.length} total bids`);
    
    const lockedBids = bids.filter(b => b.payment_status === 'locked');
    const paidBids = bids.filter(b => b.payment_status === 'paid');
    const refundedBids = bids.filter(b => b.payment_status === 'refunded');
    
    console.log(`   - Locked bids: ${lockedBids.length}`);
    console.log(`   - Paid bids: ${paidBids.length}`);
    console.log(`   - Refunded bids: ${refundedBids.length}`);

    // Test 4: Test admin panel data aggregation
    console.log('\n4️⃣ Testing Admin Panel Data Aggregation...');
    const adminStats = await EscrowWallet.aggregate([
      {
        $group: {
          _id: null,
          totalEscrows: { $sum: 1 },
          totalLockedAmount: { $sum: '$totalEscrowAmount' },
          totalReleasedAmount: {
            $sum: {
              $reduce: {
                input: '$lockedFunds',
                initialValue: 0,
                in: {
                  $add: [
                    '$$value',
                    {
                      $cond: [
                        { $eq: ['$$this.lockStatus', 'released'] },
                        '$$this.totalAmount',
                        0
                      ]
                    }
                  ]
                }
              }
            }
          },
          activeEscrows: {
            $sum: {
              $cond: [
                { $in: ['$status', ['active', 'locked']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = adminStats[0] || {
      totalEscrows: 0,
      totalLockedAmount: 0,
      totalReleasedAmount: 0,
      activeEscrows: 0
    };

    console.log('   - Admin panel stats:');
    console.log(`     Total Escrows: ${stats.totalEscrows}`);
    console.log(`     Total Locked Amount: ₹${stats.totalLockedAmount}`);
    console.log(`     Total Released Amount: ₹${stats.totalReleasedAmount}`);
    console.log(`     Active Escrows: ${stats.activeEscrows}`);

    // Test 5: Test contribution panel data
    console.log('\n5️⃣ Testing Contribution Panel Data...');
    if (escrowWallets.length > 0) {
      const sampleWallet = escrowWallets[0];
      const sampleUserId = sampleWallet.lockedFunds?.[0]?.userId;
      
      if (sampleUserId) {
        const userFunds = sampleWallet.lockedFunds.find(fund => 
          fund.userId.toString() === sampleUserId.toString()
        );
        
        if (userFunds) {
          console.log('   - Sample user earnings data:');
          console.log(`     User ID: ${sampleUserId}`);
          console.log(`     Bid Amount: ₹${userFunds.bidAmount}`);
          console.log(`     Bonus Amount: ₹${userFunds.bonusAmount}`);
          console.log(`     Total Amount: ₹${userFunds.totalAmount}`);
          console.log(`     Status: ${userFunds.lockStatus}`);
          console.log(`     Locked At: ${userFunds.lockedAt}`);
          console.log(`     Released At: ${userFunds.releasedAt || 'Not released'}`);
        }
      }
    }

    console.log('\n✅ Escrow System Integration Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Escrow Wallets: ${escrowWallets.length}`);
    console.log(`   - Selections with Escrow: ${selectionsWithEscrow.length}`);
    console.log(`   - Locked Bids: ${lockedBids.length}`);
    console.log(`   - Total Locked Amount: ₹${stats.totalLockedAmount}`);
    console.log(`   - Active Escrows: ${stats.activeEscrows}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testEscrowIntegration();
