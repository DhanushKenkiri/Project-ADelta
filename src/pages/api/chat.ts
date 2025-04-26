import type { NextApiRequest, NextApiResponse } from 'next';
import { getChatCompletion } from '../../lib/groq';

// Define response types
type ResponseData = {
  updatedHtml: string;
};

type ErrorResponse = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, currentHtml } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!currentHtml) {
      return res.status(400).json({ message: 'Current HTML is required' });
    }

    // Default system prompt for template modifications
    const systemPrompt = `
You are an expert email template assistant. You will help users modify their existing HTML email templates.
You'll be provided with the current HTML of the template and a request for changes.

Follow these guidelines:
1. Carefully analyze the existing template structure before making changes
2. Modify ONLY what was requested, preserving the rest of the template
3. Return the COMPLETE updated HTML code, not just the modified parts
4. Use proper, valid HTML with inline CSS (required for email clients)
5. Ensure the template remains responsive and accessible

If you're not sure about what's being asked, make your best guess but preserve the template's core structure.
`;

    try {
      // Use the utility function instead of direct API call
      const updatedHtml = await getChatCompletion({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Current HTML template: ${currentHtml}\n\nRequest: ${message}`
          }
        ],
        temperature: 0.7
      });
      
      return res.status(200).json({ updatedHtml });
    } catch (error: any) {
      console.error('Error calling getChatCompletion:', error);
      return res.status(500).json({ 
        message: `Error: ${error.message || 'Unknown error'}`
      });
    }
  } catch (error: any) {
    console.error('Error processing chat request:', error);
    return res.status(500).json({ message: error.message || 'An unknown error occurred' });
  }
} 
import { getChatCompletion } from '../../lib/groq';

// Define response types
type ResponseData = {
  updatedHtml: string;
};

type ErrorResponse = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, currentHtml } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!currentHtml) {
      return res.status(400).json({ message: 'Current HTML is required' });
    }

    // Default system prompt for template modifications
    const systemPrompt = `
You are an expert email template assistant. You will help users modify their existing HTML email templates.
You'll be provided with the current HTML of the template and a request for changes.

Follow these guidelines:
1. Carefully analyze the existing template structure before making changes
2. Modify ONLY what was requested, preserving the rest of the template
3. Return the COMPLETE updated HTML code, not just the modified parts
4. Use proper, valid HTML with inline CSS (required for email clients)
5. Ensure the template remains responsive and accessible

If you're not sure about what's being asked, make your best guess but preserve the template's core structure.
`;

    try {
      // Use the utility function instead of direct API call
      const updatedHtml = await getChatCompletion({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Current HTML template: ${currentHtml}\n\nRequest: ${message}`
          }
        ],
        temperature: 0.7
      });
      
      return res.status(200).json({ updatedHtml });
    } catch (error: any) {
      console.error('Error calling getChatCompletion:', error);
      return res.status(500).json({ 
        message: `Error: ${error.message || 'Unknown error'}`
      });
    }
  } catch (error: any) {
    console.error('Error processing chat request:', error);
    return res.status(500).json({ message: error.message || 'An unknown error occurred' });
  }
} 
 