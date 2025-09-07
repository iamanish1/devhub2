/**
 * Test script for project status functionality
 * This script tests the project status calculation logic
 */

import { calculateProjectStatus } from './src/utils/projectStatusUtils.js';

// Test data - different project scenarios
const testProjects = [
  {
    _id: 'project1',
    project_Title: 'Active Project',
    project_duration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    selectedContributors: [],
    project_category: 'funded'
  },
  {
    _id: 'project2',
    project_Title: 'Expired Project',
    project_duration: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    selectedContributors: [],
    project_category: 'funded'
  },
  {
    _id: 'project3',
    project_Title: 'Contributors Selected',
    project_duration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    selectedContributors: [
      { userId: 'user1', status: 'pending' },
      { userId: 'user2', status: 'paid' }
    ],
    project_category: 'funded'
  },
  {
    _id: 'project4',
    project_Title: 'Team Working',
    project_duration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    selectedContributors: [
      { userId: 'user1', status: 'paid' },
      { userId: 'user2', status: 'paid' }
    ],
    project_category: 'funded'
  }
];

async function testProjectStatus() {
  console.log('Testing Project Status Functionality\n');
  
  for (const project of testProjects) {
    try {
      const statusInfo = await calculateProjectStatus(project);
      console.log(`Project: ${project.project_Title}`);
      console.log(`   Status: ${statusInfo.status}`);
      console.log(`   Message: ${statusInfo.message}`);
      console.log(`   Icon: ${statusInfo.icon}`);
      console.log(`   Description: ${statusInfo.description}`);
      console.log(`   Color: ${statusInfo.color}`);
      console.log('   ---');
    } catch (error) {
      console.error(`Error testing project ${project.project_Title}:`, error.message);
    }
  }
  
  console.log('\nProject status testing completed!');
}

// Run the test
testProjectStatus().catch(console.error);
