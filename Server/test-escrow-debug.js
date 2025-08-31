import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BonusPool from './src/Model/BonusPoolModel.js';
import EscrowWallet from './src/Model/EscrowWalletModel.js';
import ProjectListing from './src/Model/ProjectListingModel.js';
import ProjectSelection from './src/Model/ProjectSelectionModel.js';
import Bidding from './src/Model/BiddingModel.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function debugEscrowWalletCreation() {
  try {
    console.log('\n🔍 Debugging Escrow Wallet Creation...\n');

    // 1. Check all projects
    const projects = await ProjectListing.find({}).sort({ createdAt: -1 }).limit(10);
    console.log(`📊 Total Projects Found: ${projects.length}`);

    for (const project of projects) {
      console.log(`\n🏗️  Project: ${project.project_Title}`);
      console.log(`   - ID: ${project._id}`);
      console.log(`   - Owner: ${project.user}`);
      console.log(`   - Bonus Pool Amount: ${project.bonus_pool_amount}`);
      console.log(`   - Bonus Pool Contributors: ${project.bonus_pool_contributors}`);
      console.log(`   - Created: ${project.createdAt}`);

      // 2. Check bonus pool for this project
      const bonusPool = await BonusPool.findOne({ projectId: project._id });
      if (bonusPool) {
        console.log(`   ✅ Bonus Pool Found:`);
        console.log(`      - ID: ${bonusPool._id}`);
        console.log(`      - Status: ${bonusPool.status}`);
        console.log(`      - Total Amount: ₹${bonusPool.totalAmount}`);
        console.log(`      - Contributor Count: ${bonusPool.contributorCount}`);
        console.log(`      - Amount Per Contributor: ₹${bonusPool.amountPerContributor}`);
      } else {
        console.log(`   ❌ No Bonus Pool Found`);
      }

      // 3. Check project selection for this project
      const selection = await ProjectSelection.findOne({ projectId: project._id });
      if (selection) {
        console.log(`   ✅ Project Selection Found:`);
        console.log(`      - ID: ${selection._id}`);
        console.log(`      - Status: ${selection.status}`);
        console.log(`      - Required Contributors: ${selection.requiredContributors}`);
        console.log(`      - Selected Users: ${selection.selectedUsers.length}`);
        console.log(`      - Selection Completed At: ${selection.selectionCompletedAt || 'Not completed'}`);
      } else {
        console.log(`   ❌ No Project Selection Found`);
      }

      // 4. Check escrow wallet for this project
      const escrowWallet = await EscrowWallet.findOne({ projectId: project._id });
      if (escrowWallet) {
        console.log(`   ✅ Escrow Wallet Found:`);
        console.log(`      - ID: ${escrowWallet._id}`);
        console.log(`      - Status: ${escrowWallet.status}`);
        console.log(`      - Total Bid Amount: ₹${escrowWallet.totalBidAmount}`);
        console.log(`      - Total Bonus Pool: ₹${escrowWallet.totalBonusPool}`);
        console.log(`      - Total Escrow Amount: ₹${escrowWallet.totalEscrowAmount}`);
        console.log(`      - Locked Funds: ${escrowWallet.lockedFunds.length}`);
      } else {
        console.log(`   ❌ No Escrow Wallet Found`);
      }

      // 5. Check if escrow wallet should be created
      if (bonusPool && selection) {
        const shouldCreateEscrow = bonusPool.status === 'funded' && selection.status === 'completed';
        console.log(`   🔍 Escrow Creation Check:`);
        console.log(`      - Bonus Pool Funded: ${bonusPool.status === 'funded'}`);
        console.log(`      - Selection Completed: ${selection.status === 'completed'}`);
        console.log(`      - Should Create Escrow: ${shouldCreateEscrow}`);
        
        if (shouldCreateEscrow && !escrowWallet) {
          console.log(`   🚨 ESCROW WALLET SHOULD BE CREATED BUT IS MISSING!`);
        }
      }

      console.log('   ' + '─'.repeat(50));
    }

    // 6. Check for projects that should have escrow wallets
    console.log('\n🔍 Projects Missing Escrow Wallets:');
    let missingEscrows = 0;
    
    for (const project of projects) {
      const bonusPool = await BonusPool.findOne({ projectId: project._id });
      const selection = await ProjectSelection.findOne({ projectId: project._id });
      const escrowWallet = await EscrowWallet.findOne({ projectId: project._id });
      
      if (bonusPool && selection && !escrowWallet) {
        const shouldHaveEscrow = bonusPool.status === 'funded' && selection.status === 'completed';
        if (shouldHaveEscrow) {
          missingEscrows++;
          console.log(`   ❌ ${project.project_Title} (${project._id})`);
          console.log(`      - Bonus Pool: ${bonusPool.status} (₹${bonusPool.totalAmount})`);
          console.log(`      - Selection: ${selection.status} (${selection.selectedUsers.length} users)`);
        }
      }
    }
    
    if (missingEscrows === 0) {
      console.log('   ✅ All eligible projects have escrow wallets!');
    } else {
      console.log(`   🚨 Found ${missingEscrows} projects missing escrow wallets`);
    }

    // 7. Test escrow wallet creation for a sample project
    console.log('\n🧪 Testing Escrow Wallet Creation...');
    const testProject = projects.find(async (project) => {
      const bonusPool = await BonusPool.findOne({ projectId: project._id });
      const selection = await ProjectSelection.findOne({ projectId: project._id });
      const escrowWallet = await EscrowWallet.findOne({ projectId: project._id });
      
      return bonusPool && 
             bonusPool.status === 'funded' && 
             selection && 
             selection.status === 'completed' && 
             !escrowWallet;
    });

    if (testProject) {
      console.log(`\n🔧 Testing escrow creation for project: ${testProject.project_Title}`);
      
      // Import the function
      const { createEscrowWalletIfReady } = await import('./src/controller/EscrowWalletController.js');
      
      const escrowWallet = await createEscrowWalletIfReady(testProject._id, testProject.user);
      
      if (escrowWallet) {
        console.log('✅ Escrow wallet created successfully!');
        console.log(`   - Total Bid Amount: ₹${escrowWallet.totalBidAmount}`);
        console.log(`   - Total Bonus Pool: ₹${escrowWallet.totalBonusPool}`);
        console.log(`   - Total Escrow Amount: ₹${escrowWallet.totalEscrowAmount}`);
        console.log(`   - Status: ${escrowWallet.status}`);
      } else {
        console.log('❌ Escrow wallet creation failed');
      }
    } else {
      console.log('ℹ️  No test project available for escrow creation');
    }

  } catch (error) {
    console.error('❌ Debug Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the debug
debugEscrowWalletCreation();
