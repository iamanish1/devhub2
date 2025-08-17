const axios = require('axios');

async function testFeaturedProjectsAPI() {
  try {
    console.log('Testing featured projects API...');
    
    const response = await axios.get('http://localhost:8000/api/project/getlistproject');
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.projects) {
      console.log('Number of projects found:', response.data.projects.length);
      
      if (response.data.projects.length > 0) {
        console.log('First project sample:', {
          _id: response.data.projects[0]._id,
          project_Title: response.data.projects[0].project_Title,
          Project_Description: response.data.projects[0].Project_Description?.substring(0, 100) + '...',
          createdAt: response.data.projects[0].createdAt
        });
      } else {
        console.log('No projects found in database');
      }
    } else {
      console.log('No projects field in response');
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFeaturedProjectsAPI();
