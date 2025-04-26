const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add a basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API server is running' });
});

// Your API endpoints
app.post('/chat', (req, res) => {
  // Handle chat endpoint
  res.status(200).json({ message: 'Chat endpoint deployed with Firebase Functions' });
});

app.post('/generate-template', (req, res) => {
  // Handle template generation
  res.status(200).json({ 
    html: '<div>Sample generated template</div>',
    message: 'Template generation endpoint deployed with Firebase Functions' 
  });
});

// Add more API endpoints as needed from your server.js

// Create Cloud Function from Express app
exports.api = functions.https.onRequest(app); 