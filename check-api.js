// API Server Health Check Script
// This script tests if the API server is running and responding correctly

import fetch from 'node-fetch';

const API_PORT = process.env.API_PORT || 3000;
const API_URL = `http://localhost:${API_PORT}`;

async function checkApiHealth() {
  console.log(`Checking API server at ${API_URL}...`);
  
  try {
    // Health check endpoint
    const healthResponse = await fetch(`${API_URL}/api/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API server is running!');
      console.log('Response:', JSON.stringify(healthData, null, 2));
    } else {
      console.error('❌ API server health check failed:', healthResponse.status, healthResponse.statusText);
      const errorText = await healthResponse.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ API server is not running or not reachable:', error.message);
    console.log('Make sure the API server is running with: npm run api');
  }
}

checkApiHealth(); 