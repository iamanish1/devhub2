import mongoose from 'mongoose';
import ProjectListing from './src/Model/ProjectListingModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkProjects = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all projects
    const projects = await ProjectListing.find().populate('user', 'username email isPlatformAdmin');
    
    console.log(`\n📊 Found ${projects.length} projects in the database:\n`);
    
    if (projects.length === 0) {
      console.log('❌ No projects found in the database');
      console.log('💡 This is why the dashboard shows no projects');
      console.log('🔧 To test the system, you need to create some projects first');
    } else {
      // Group projects by category
      const projectsByCategory = {
        funded: [],
        basic: [],
        free: [],
        capsule: []
      };
      
      projects.forEach(project => {
        const category = project.project_category || 'funded';
        if (projectsByCategory[category]) {
          projectsByCategory[category].push(project);
        }
      });
      
      // Display projects by category
      Object.entries(projectsByCategory).forEach(([category, categoryProjects]) => {
        console.log(`\n📁 ${category.toUpperCase()} PROJECTS (${categoryProjects.length}):`);
        if (categoryProjects.length === 0) {
          console.log('   No projects in this category');
        } else {
          categoryProjects.forEach(project => {
            console.log(`   • ${project.project_Title}`);
            console.log(`     - Owner: ${project.user?.username} (${project.user?.email})`);
            console.log(`     - Platform Admin: ${project.user?.isPlatformAdmin ? 'Yes' : 'No'}`);
            console.log(`     - Starting Bid: ₹${project.project_starting_bid}`);
            console.log(`     - Bonus Pool: ₹${project.bonus_pool_amount || 0}`);
            console.log(`     - Free Project: ${project.is_free_project ? 'Yes' : 'No'}`);
            console.log(`     - Created: ${project.createdAt}`);
            console.log('');
          });
        }
      });
      
      // Summary
      console.log('\n📈 SUMMARY:');
      console.log(`   Total Projects: ${projects.length}`);
      console.log(`   Funded Projects: ${projectsByCategory.funded.length}`);
      console.log(`   Basic Projects: ${projectsByCategory.basic.length}`);
      console.log(`   Free Projects: ${projectsByCategory.free.length}`);
      console.log(`   Capsule Projects: ${projectsByCategory.capsule.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
    process.exit(0);
  }
};

checkProjects();
