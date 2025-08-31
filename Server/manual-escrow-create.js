import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BonusPool from './src/Model/BonusPoolModel.js';
import EscrowWallet from './src/Model/EscrowWalletModel.js';
import ProjectListing from './src/Model/ProjectListingModel.js';
import ProjectSelection from './src/Model/ProjectSelectionModel.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function manuallyCreateEscrowWallets() {
  try {
    console.log('\n🔧 Manually Creating Escrow Wallets...\n');

    // Find all projects with funded bonus pools and completed selections but no escrow wallets
    const projects = await ProjectListing.find({});
    let createdCount = 0;

    for (const project of projects) {
      const bonusPool = await BonusPool.findOne({ projectId: project._id });
      const selection = await ProjectSelection.findOne({ projectId: project._id });
      const existingEscrow = await EscrowWallet.findOne({ projectId: project._id });

      // Check if escrow wallet should be created
      if (bonusPool && 
          bonusPool.status === 'funded' && 
          selection && 
          selection.status === 'completed' && 
          !existingEscrow) {
        
        console.log(`\n🏗️  Creating Escrow Wallet for Project: ${project.project_Title}`);
        console.log(`   - Project ID: ${project._id}`);
        console.log(`   - Bonus Pool: ₹${bonusPool.totalAmount} (${bonusPool.status})`);
        console.log(`   - Selection: ${selection.selectedUsers.length} users (${selection.status})`);

        try {
          // Import the function
          const { createEscrowWalletIfReady } = await import('./src/controller/EscrowWalletController.js');
          
          const escrowWallet = await createEscrowWalletIfReady(project._id, project.user);
          
          if (escrowWallet) {
            createdCount++;
            console.log(`   ✅ Escrow wallet created successfully!`);
            console.log(`      - ID: ${escrowWallet._id}`);
            console.log(`      - Total Bid Amount: ₹${escrowWallet.totalBidAmount}`);
            console.log(`      - Total Bonus Pool: ₹${escrowWallet.totalBonusPool}`);
            console.log(`      - Total Escrow Amount: ₹${escrowWallet.totalEscrowAmount}`);
            console.log(`      - Status: ${escrowWallet.status}`);
          } else {
            console.log(`   ❌ Failed to create escrow wallet`);
          }
        } catch (error) {
          console.log(`   ❌ Error creating escrow wallet: ${error.message}`);
        }
      }
    }

    if (createdCount === 0) {
      console.log('\nℹ️  No escrow wallets needed to be created');
    } else {
      console.log(`\n🎉 Successfully created ${createdCount} escrow wallets!`);
    }

  } catch (error) {
    console.error('❌ Error creating escrow wallets:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the creation
manuallyCreateEscrowWallets();
