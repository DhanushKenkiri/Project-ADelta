import { NextApiRequest, NextApiResponse } from 'next';
import mjml2html from 'mjml';

// Response data type
type ConvertResponse = {
  html: string;
};

// Error response type
type ErrorResponse = {
  error: string;
};

/**
 * API handler to convert MJML to HTML
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConvertResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Get the MJML content from the request body
    const { mjml } = req.body;

    if (!mjml) {
      return res.status(400).json({ error: 'Missing MJML content in request body' });
    }

    // Convert MJML to HTML
    const result = mjml2html(mjml);

    // Check for errors
    if (result.errors && result.errors.length > 0) {
      console.warn('MJML conversion warnings/errors:', result.errors);
    }

    // Return the HTML
    return res.status(200).json({ html: result.html });
  } catch (error) {
    console.error('Error converting MJML to HTML:', error);
    return res.status(500).json({ error: 'Failed to convert MJML to HTML' });
  }
} 