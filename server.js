import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables with debugging
dotenv.config();
console.log('Environment variables loaded');
console.log('API_PORT:', process.env.API_PORT);
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');

const app = express();
const PORT = process.env.API_PORT || 3000;

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add a basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API server is running' });
});

// API Routes
app.post('/api/generate-template', async (req, res) => {
  try {
    console.log('Received request to generate template');
    const { content } = req.body;

    if (!content) {
      console.error('Missing content in request');
      return res.status(400).json({ message: 'Content is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error('Missing GROQ_API_KEY in environment variables');
      return res.status(500).json({ message: 'Groq API key not found in environment variables' });
    }

    // Default system prompt for template generation
    const defaultTemplatePrompt = `
You are an expert email template designer. Create a responsive HTML email template based on the following content.
The template should be:
1. Modern, visually appealing, and professional
2. Fully responsive for all devices and email clients
3. Using clean, well-structured HTML with inline CSS (essential for email clients)
4. Including appropriate sections like header, content, call-to-action, and footer
5. Using a modern color scheme with good contrast
6. Following email best practices (maximum width 600px, basic fonts, etc.)

Return only the HTML code, no explanations or markdown. The code should be ready to use.
`;

    console.log('Making request to Groq API...');
    
    // Make direct API call to Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: defaultTemplatePrompt
          },
          {
            role: 'user',
            content
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error status:', response.status);
      console.error('Error response:', errorText);
      
      let errorMessage = 'Unknown error';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || 'Error communicating with Groq API';
      } catch (e) {
        errorMessage = errorText || `HTTP error: ${response.status}`;
      }
      
      return res.status(response.status).json({ message: `Groq API error: ${errorMessage}` });
    }

    const data = await response.json();
    console.log('Received response from Groq API');
    
    // Extract the HTML content from the response
    const html = data.choices[0]?.message?.content || '';
    
    return res.status(200).json({ html });
  } catch (error) {
    console.error('Error generating email template:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate template' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received chat request');
    const { message, currentHtml } = req.body;

    if (!message || !currentHtml) {
      console.error('Missing message or currentHtml in request');
      return res.status(400).json({ message: 'Message and current HTML are required' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error('Missing GROQ_API_KEY in environment variables');
      return res.status(500).json({ message: 'Groq API key not found in environment variables' });
    }

    // Default system prompt for HTML editing in chat
    const defaultChatSystemPrompt = `
You are an expert email template editor. You'll be helping to refine HTML email templates based on user requests.
You have the following capabilities:
1. Edit, improve, or reformat existing HTML
2. Ensure changes maintain proper HTML structure and best practices for email
3. Keep all content responsive and compatible with email clients
4. Follow good design practices like proper spacing, contrast, and hierarchy

The user will provide their current HTML template and a request for changes.
Return only the complete updated HTML code, no explanations, markdown formatting, or additional text.
`;

    console.log('Making chat request to Groq API...');
    
    // Make direct API call to Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: defaultChatSystemPrompt
          },
          {
            role: 'user',
            content: `Current HTML:\n\n${currentHtml}\n\nRequest: ${message}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error status:', response.status);
      console.error('Error response:', errorText);
      
      let errorMessage = 'Unknown error';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || 'Error communicating with Groq API';
      } catch (e) {
        errorMessage = errorText || `HTTP error: ${response.status}`;
      }
      
      return res.status(response.status).json({ message: `Groq API error: ${errorMessage}` });
    }

    const data = await response.json();
    console.log('Received chat response from Groq API');
    
    // Extract the updated HTML content from the response
    const updatedHtml = data.choices[0]?.message?.content || '';
    
    return res.status(200).json({ updatedHtml });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ message: error.message || 'Failed to process chat message' });
  }
});

// Add a directory listing endpoint for templates
app.get('/templates', (req, res, next) => {
  // Check if we're requesting a listing
  if (req.query.list !== undefined) {
    const templatesDir = path.join(__dirname, 'public', 'templates');
    console.log(`Reading templates from: ${templatesDir}`);
    
    try {
      const files = fs.readdirSync(templatesDir);
      // Filter to only include HTML files (exclude directories and MJML files)
      const htmlFiles = files.filter(file => {
        try {
          const filePath = path.join(templatesDir, file);
          const stats = fs.statSync(filePath);
          return stats.isFile() && file.endsWith('.html') && !file.endsWith('.mjml');
        } catch (err) {
          console.error(`Error checking file ${file}:`, err);
          return false;
        }
      });
      
      console.log(`Found ${htmlFiles.length} HTML templates in ${templatesDir}`);
      return res.json(htmlFiles);
    } catch (error) {
      console.error('Error reading templates directory:', error);
      return res.status(500).json({ error: 'Failed to list templates', details: error.message });
    }
  } else {
    // Not requesting a listing, continue to next middleware (static file serving)
    next();
  }
});

// Default 404 handler for API routes
app.use('/api', (req, res) => {
  console.error(`API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start the server
try {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/api/health`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 