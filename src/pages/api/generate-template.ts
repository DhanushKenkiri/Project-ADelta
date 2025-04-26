import type { NextApiRequest, NextApiResponse } from 'next';
import { extractOrganizationNames, generateLogoUrl, isLogoUrlValid } from '../../lib/logoService';

// Define response types
type ResponseData = {
  html: string;
  logoUrl?: string;
  organization?: string;
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
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Extract organization name and generate logo URL if possible
    const organizationNames = extractOrganizationNames(content);
    let logoUrl: string | null = null;
    let validLogoUrl: string | null = null;
    let detectedOrg: string | null = null;
    let logoInstructions = '';
    
    if (organizationNames.length > 0) {
      // Try each organization name until we find one with a valid logo
      for (const orgName of organizationNames) {
        detectedOrg = orgName;
        logoUrl = generateLogoUrl(orgName, 'colored', 200);
        console.log(`Trying organization: ${orgName}, Logo URL: ${logoUrl}`);
        
        // Check if the logo URL returns a valid response
        try {
          const isValid = await isLogoUrlValid(logoUrl);
          if (isValid) {
            validLogoUrl = logoUrl;
            console.log(`Found valid logo for ${orgName}: ${validLogoUrl}`);
            break;
          } else {
            console.log(`Invalid logo URL for ${orgName}: ${logoUrl}`);
          }
        } catch (error) {
          console.error(`Error checking logo URL for ${orgName}:`, error);
          continue;
        }
      }
      
      if (validLogoUrl) {
        // Add logo instructions to the prompt
        logoInstructions = `
IMPORTANT: For the detected organization "${detectedOrg}", include a logo at the top of the email.
Place this exact img tag in a prominent position in the header:
<img src="${validLogoUrl}" alt="${detectedOrg} logo" style="max-height: 60px; width: auto; display: block; margin: 0 auto;">
`;
      }
    }

    // Get API key from environment variable
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error('Groq API key not found in environment variables');
      return res.status(500).json({ message: 'Groq API key not found in environment variables' });
    }

    // Updated system prompt with logo instructions
    const defaultTemplatePrompt = `
You are an expert email template designer. Create a responsive HTML email template based on the following content.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. Output ONLY raw HTML code with no introduction text, no explanation, no backticks
2. Start your response with ONLY <!DOCTYPE html> or <html> tag
3. Do not include ANY text like "Here is...", "This is...", etc.
4. Do not include any code fences/backticks (```) at all
5. Do not include any notes or instructions about replacing content
6. Do not explain your code in any way
7. Do not add any commentary about the design, colors, or features used in the template
8. Do not include ANY text after the closing </html> tag
9. Your entire response should be valid HTML only with no explanatory text
${logoInstructions}

The template should be:
1. Modern, visually appealing, and professional
2. Fully responsive for all devices and email clients
3. Using clean, well-structured HTML with inline CSS (essential for email clients)
4. Including appropriate sections like header, content, call-to-action, and footer
5. Using a modern color scheme with good contrast
6. Following email best practices (maximum width 600px, basic fonts, etc.)
`;

    console.log('Making Groq API request with logo instructions...');
    
    try {
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
              content: `Create a responsive HTML email template with the following content: "${content}". EXTREMELY IMPORTANT: Your response must be ONLY the raw HTML code with NO introduction text, NO markdown backticks, NO explanations, and NO text about the design choices. Start directly with <!DOCTYPE html> or <html> and end with </html> - nothing else before or after.`
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      // First get the raw response text
      const responseText = await response.text();
      console.log('Groq API response received, status:', response.status);
      
      // Check if the response text is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Empty response received from Groq API');
        return res.status(500).json({ message: 'Empty response received from Groq API' });
      }
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Groq API response:', parseError);
        console.error('Response text:', responseText);
        return res.status(500).json({ message: 'Failed to parse Groq API response' });
      }

      if (!response.ok) {
        console.error('Groq API error:', data);
        return res.status(response.status).json({ 
          message: `Groq API error: ${data.error?.message || 'Unknown error'}`
        });
      }

      // Extract the HTML content from the response
      let html = data.choices?.[0]?.message?.content;
      
      if (!html) {
        console.error('No HTML content found in Groq API response:', data);
        return res.status(500).json({ message: 'No HTML content found in Groq API response' });
      }
      
      // Apply thorough cleaning to the HTML
      html = cleanHtmlResponse(html);
      
      // Log the first 100 characters of the cleaned HTML for debugging
      console.log('Cleaned HTML (first 100 chars):', html.substring(0, 100));
      
      return res.status(200).json({ 
        html,
        logoUrl: validLogoUrl || undefined,
        organization: detectedOrg || undefined
      });
    } catch (error: any) {
      console.error('Error making request to Groq API:', error);
      return res.status(500).json({ message: `Error making request to Groq API: ${error.message}` });
    }
  } catch (error: any) {
    console.error('Error generating email template:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate template' });
  }
}

/**
 * Apply thorough cleaning to remove any non-HTML preamble and code fences
 */
function cleanHtmlResponse(html: string): string {
  // Remove code fences completely
  html = html.replace(/```html/gi, '').replace(/```/g, '');
  
  // Extensive list of common prefixes to remove
  const prefixesToRemove = [
    'Here is a responsive HTML email template:',
    'Here is the responsive HTML email template:',
    'Here is a responsive HTML email template based on your content:',
    'Here is the HTML code for the email template:',
    'Here is the HTML code:',
    'Here is the HTML:',
    'Here\'s the HTML:',
    'Here\'s the responsive HTML email template:',
    'Here is your email template:',
    'Here\'s your email template:',
    'Here is your responsive email template:',
    'HTML email template:',
    'The HTML code is:',
    'The HTML code:',
    'Email template HTML:',
    'Responsive email template:',
    'HTML code for the responsive email template:'
  ];
  
  // Check for and remove any of the prefixes
  for (const prefix of prefixesToRemove) {
    if (html.includes(prefix)) {
      html = html.replace(prefix, '').trim();
    }
  }
  
  // Extensive list of common suffixes to remove
  const suffixesToRemove = [
    'Replace the placeholder text and links with your actual content.',
    'You can replace the placeholder content with your actual information.',
    'Replace the placeholders with your actual content.',
    'Feel free to replace the placeholder content with your actual information.',
    'You can replace the placeholder text with your actual content.',
    'Replace the placeholder images, text, and links with your own content.',
    'Replace all placeholder text and images with your own content.',
    'You can customize this template to fit your needs.',
    'You should replace these placeholders with your actual content.',
    'This template uses a modern color scheme with good contrast, and follows email best practices such as a maximum width of 600px and basic fonts.',
    'It is fully responsive and should work well in all devices and email clients.',
    'This template uses a modern color scheme with good contrast.',
    'This email template is designed to be responsive and work across various email clients.',
    'The template follows email best practices for maximum compatibility.'
  ];
  
  // Check for and remove any of the suffixes
  for (const suffix of suffixesToRemove) {
    if (html.includes(suffix)) {
      html = html.replace(suffix, '').trim();
    }
  }
  
  // Regex to find any variant of "Here is..." or similar at the start
  let cleanedHtml = html.replace(/^(Here\s+is|Here's|This\s+is|I've\s+created|I\s+have\s+created|Below\s+is|Please\s+find)[^<]*</i, '<');
  
  // Find where the real HTML starts (looking for common opening tags)
  const htmlStartIndex = Math.min(
    cleanedHtml.indexOf('<!DOCTYPE') >= 0 ? cleanedHtml.indexOf('<!DOCTYPE') : Number.MAX_SAFE_INTEGER,
    cleanedHtml.indexOf('<html') >= 0 ? cleanedHtml.indexOf('<html') : Number.MAX_SAFE_INTEGER,
    cleanedHtml.indexOf('<body') >= 0 ? cleanedHtml.indexOf('<body') : Number.MAX_SAFE_INTEGER,
    cleanedHtml.indexOf('<div') >= 0 ? cleanedHtml.indexOf('<div') : Number.MAX_SAFE_INTEGER,
    cleanedHtml.indexOf('<table') >= 0 ? cleanedHtml.indexOf('<table') : Number.MAX_SAFE_INTEGER
  );
  
  // If a valid HTML starting tag is found, trim everything before it
  if (htmlStartIndex !== Number.MAX_SAFE_INTEGER) {
    cleanedHtml = cleanedHtml.substring(htmlStartIndex);
  }
  
  // Find and remove any trailing explanatory text
  const htmlEndIndex = cleanedHtml.lastIndexOf('</html>');
  if (htmlEndIndex !== -1) {
    cleanedHtml = cleanedHtml.substring(0, htmlEndIndex + 7); // +7 to include '</html>'
  }
  
  return cleanedHtml.trim();
} 
import { extractOrganizationNames, generateLogoUrl, isLogoUrlValid } from '../../lib/logoService';

// Define response types
type ResponseData = {
  html: string;
  logoUrl?: string;
  organization?: string;
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
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Extract organization name and generate logo URL if possible
    const organizationNames = extractOrganizationNames(content);
    let logoUrl: string | null = null;
    let validLogoUrl: string | null = null;
    let detectedOrg: string | null = null;
    let logoInstructions = '';
    
    if (organizationNames.length > 0) {
      // Try each organization name until we find one with a valid logo
      for (const orgName of organizationNames) {
        detectedOrg = orgName;
        logoUrl = generateLogoUrl(orgName, 'colored', 200);
        console.log(`Trying organization: ${orgName}, Logo URL: ${logoUrl}`);
        
        // Check if the logo URL returns a valid response
        try {
          const isValid = await isLogoUrlValid(logoUrl);
          if (isValid) {
            validLogoUrl = logoUrl;
            console.log(`Found valid logo for ${orgName}: ${validLogoUrl}`);
            break;
          } else {
            console.log(`Invalid logo URL for ${orgName}: ${logoUrl}`);
          }
        } catch (error) {
          console.error(`Error checking logo URL for ${orgName}:`, error);
          continue;
        }
      }
      
      if (validLogoUrl) {
        // Add logo instructions to the prompt
        logoInstructions = `
IMPORTANT: For the detected organization "${detectedOrg}", include a logo at the top of the email.
Place this exact img tag in a prominent position in the header:
<img src="${validLogoUrl}" alt="${detectedOrg} logo" style="max-height: 60px; width: auto; display: block; margin: 0 auto;">
`;
      }
    }

    // Get API key from environment variable
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error('Groq API key not found in environment variables');
      return res.status(500).json({ message: 'Groq API key not found in environment variables' });
    }

    // Updated system prompt with logo instructions
    const defaultTemplatePrompt = `
You are an expert email template designer. Create a responsive HTML email template based on the following content.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. Output ONLY raw HTML code with no introduction text, no explanation, no backticks
2. Start your response with ONLY <!DOCTYPE html> or <html> tag
3. Do not include ANY text like "Here is...", "This is...", etc.
4. Do not include any code fences/backticks (```) at all
5. Do not include any notes or instructions about replacing content
6. Do not explain your code in any way
7. Do not add any commentary about the design, colors, or features used in the template
8. Do not include ANY text after the closing </html> tag
9. Your entire response should be valid HTML only with no explanatory text
${logoInstructions}

The template should be:
1. Modern, visually appealing, and professional
2. Fully responsive for all devices and email clients
3. Using clean, well-structured HTML with inline CSS (essential for email clients)
4. Including appropriate sections like header, content, call-to-action, and footer
5. Using a modern color scheme with good contrast
6. Following email best practices (maximum width 600px, basic fonts, etc.)
`;

    console.log('Making Groq API request with logo instructions...');
    
    try {
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
              content: `Create a responsive HTML email template with the following content: "${content}". EXTREMELY IMPORTANT: Your response must be ONLY the raw HTML code with NO introduction text, NO markdown backticks, NO explanations, and NO text about the design choices. Start directly with <!DOCTYPE html> or <html> and end with </html> - nothing else before or after.`
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      // First get the raw response text
      const responseText = await response.text();
      console.log('Groq API response received, status:', response.status);
      
      // Check if the response text is empty
      if (!responseText || responseText.trim() === '') {
        console.error('Empty response received from Groq API');
        return res.status(500).json({ message: 'Empty response received from Groq API' });
      }
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Groq API response:', parseError);
        console.error('Response text:', responseText);
        return res.status(500).json({ message: 'Failed to parse Groq API response' });
      }

      if (!response.ok) {
        console.error('Groq API error:', data);
        return res.status(response.status).json({ 
          message: `Groq API error: ${data.error?.message || 'Unknown error'}`
        });
      }

      // Extract the HTML content from the response
      let html = data.choices?.[0]?.message?.content;
      
      if (!html) {
        console.error('No HTML content found in Groq API response:', data);
        return res.status(500).json({ message: 'No HTML content found in Groq API response' });
      }
      
      // Apply thorough cleaning to the HTML
      html = cleanHtmlResponse(html);
      
      // Log the first 100 characters of the cleaned HTML for debugging
      console.log('Cleaned HTML (first 100 chars):', html.substring(0, 100));
      
      return res.status(200).json({ 
        html,
        logoUrl: validLogoUrl || undefined,
        organization: detectedOrg || undefined
      });
    } catch (error: any) {
      console.error('Error making request to Groq API:', error);
      return res.status(500).json({ message: `Error making request to Groq API: ${error.message}` });
    }
  } catch (error: any) {
    console.error('Error generating email template:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate template' });
  }
}

/**
 * Apply thorough cleaning to remove any non-HTML preamble and code fences
 */
function cleanHtmlResponse(html: string): string {
  // Remove code fences completely
  html = html.replace(/```html/gi, '').replace(/```/g, '');
  
  // Extensive list of common prefixes to remove
  const prefixesToRemove = [
    'Here is a responsive HTML email template:',
    'Here is the responsive HTML email template:',
    'Here is a responsive HTML email template based on your content:',
    'Here is the HTML code for the email template:',
    'Here is the HTML code:',
    'Here is the HTML:',
    'Here\'s the HTML:',
    'Here\'s the responsive HTML email template:',
    'Here is your email template:',
    'Here\'s your email template:',
    'Here is your responsive email template:',
    'HTML email template:',
    'The HTML code is:',
    'The HTML code:',
    'Email template HTML:',
    'Responsive email template:',
    'HTML code for the responsive email template:'
  ];
  
  // Check for and remove any of the prefixes
  for (const prefix of prefixesToRemove) {
    if (html.includes(prefix)) {
      html = html.replace(prefix, '').trim();
    }
  }
  
  // Extensive list of common suffixes to remove
  const suffixesToRemove = [
    'Replace the placeholder text and links with your actual content.',
    'You can replace the placeholder content with your actual information.',
    'Replace the placeholders with your actual content.',
    'Feel free to replace the placeholder content with your actual information.',
    'You can replace the placeholder text with your actual content.',
    'Replace the placeholder images, text, and links with your own content.',
    'Replace all placeholder text and images with your own content.',
    'You can customize this template to fit your needs.',
    'You should replace these placeholders with your actual content.',
    'This template uses a modern color scheme with good contrast, and follows email best practices such as a maximum width of 600px and basic fonts.',
    'It is fully responsive and should work well in all devices and email clients.',
    'This template uses a modern color scheme with good contrast.',
    'This email template is designed to be responsive and work across various email clients.',
    'The template follows email best practices for maximum compatibility.'
  ];
  
  // Check for and remove any of the suffixes
  for (const suffix of suffixesToRemove) {
    if (html.includes(suffix)) {
      html = html.replace(suffix, '').trim();
    }
  }
  
  // Regex to find any variant of "Here is..." or similar at the start
  let cleanedHtml = html.replace(/^(Here\s+is|Here's|This\s+is|I've\s+created|I\s+have\s+created|Below\s+is|Please\s+find)[^<]*</i, '<');
  
  // Find where the real HTML starts (looking for common opening tags)
  const htmlStartIndex = Math.min(
    cleanedHtml.indexOf('<!DOCTYPE') >= 0 ? cleanedHtml.indexOf('<!DOCTYPE') : Number.MAX_SAFE_INTEGER,
    cleanedHtml.indexOf('<html') >= 0 ? cleanedHtml.indexOf('<html') : Number.MAX_SAFE_INTEGER,
    cleanedHtml.indexOf('<body') >= 0 ? cleanedHtml.indexOf('<body') : Number.MAX_SAFE_INTEGER,
    cleanedHtml.indexOf('<div') >= 0 ? cleanedHtml.indexOf('<div') : Number.MAX_SAFE_INTEGER,
    cleanedHtml.indexOf('<table') >= 0 ? cleanedHtml.indexOf('<table') : Number.MAX_SAFE_INTEGER
  );
  
  // If a valid HTML starting tag is found, trim everything before it
  if (htmlStartIndex !== Number.MAX_SAFE_INTEGER) {
    cleanedHtml = cleanedHtml.substring(htmlStartIndex);
  }
  
  // Find and remove any trailing explanatory text
  const htmlEndIndex = cleanedHtml.lastIndexOf('</html>');
  if (htmlEndIndex !== -1) {
    cleanedHtml = cleanedHtml.substring(0, htmlEndIndex + 7); // +7 to include '</html>'
  }
  
  return cleanedHtml.trim();
} 
 