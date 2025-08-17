const axios = require('axios');

async function testFeaturedProjectsAPI() {
  try {
    console.log('🧪 Testing Featured Projects API...');
    
    const response = await axios.get('http://localhost:8000/api/project/getlistproject');
    
    console.log('✅ Response status:', response.status);
    
    if (response.data.projects) {
      console.log('📊 Number of projects found:', response.data.projects.length);
      
      if (response.data.projects.length > 0) {
        // Test featured projects logic
        const projects = response.data.projects;
        
        // Filter projects with bids
        const projectsWithBids = projects.filter(project => project.Project_Number_Of_Bids > 0);
        console.log('🎯 Projects with bids:', projectsWithBids.length);
        
        // Sort by featured criteria
        const featuredProjects = projectsWithBids
          .sort((a, b) => {
            // Primary sort: Number of bids (descending)
            const bidComparison = (b.Project_Number_Of_Bids || 0) - (a.Project_Number_Of_Bids || 0);
            if (bidComparison !== 0) return bidComparison;
            
            // Secondary sort: Budget (descending)
            const budgetComparison = (b.project_starting_bid || 0) - (a.project_starting_bid || 0);
            if (budgetComparison !== 0) return budgetComparison;
            
            // Tertiary sort: Creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
          })
          .slice(0, 6);
        
        console.log('⭐ Featured projects (top 6):', featuredProjects.length);
        
        if (featuredProjects.length > 0) {
          console.log('🏆 Top featured project:', {
            _id: featuredProjects[0]._id,
            title: featuredProjects[0].project_Title,
            bids: featuredProjects[0].Project_Number_Of_Bids,
            budget: featuredProjects[0].project_starting_bid,
            description: featuredProjects[0].Project_Description?.substring(0, 100) + '...',
            createdAt: featuredProjects[0].createdAt
          });
        }
        
        // Show sample of all projects
        console.log('📋 Sample project structure:', {
          _id: projects[0]._id,
          project_Title: projects[0].project_Title,
          Project_Description: projects[0].Project_Description?.substring(0, 100) + '...',
          Project_Number_Of_Bids: projects[0].Project_Number_Of_Bids,
          project_starting_bid: projects[0].project_starting_bid,
          Project_tech_stack: projects[0].Project_tech_stack,
          createdAt: projects[0].createdAt
        });
      } else {
        console.log('⚠️  No projects found in database');
      }
    } else {
      console.log('❌ No projects field in response');
      console.log('📄 Full response data:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

console.log('🚀 Starting Featured Projects API Test...');
testFeaturedProjectsAPI();
