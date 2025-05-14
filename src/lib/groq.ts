import { toast } from "sonner";
// Define a type for chat completion message parameter
type ChatCompletionMessageParam = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
import { Groq } from 'groq-sdk';
import { apiPost } from './api';

// Get the API key from environment variables
const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Check if API key exists
if (!apiKey) {
  console.error('GROQ_API_KEY environment variable is missing. Please check your .env file.');
}

const groq = new Groq({
  apiKey: apiKey || 'dummy-key-for-initialization', // Provide a dummy key for initialization
  dangerouslyAllowBrowser: true
});

// Chat history for the current session
let chatHistory: Array<{ role: string, content: string }> = [
  {
    role: 'system',
    content: `You are an AI assistant that helps users with email templates. You can understand HTML and CSS and can make detailed modifications to email templates as requested.

Important capabilities:
1. You can and should modify colors, fonts, layouts, and styling when requested
2. You can completely change the theme or design of the email if asked
3. You can add new sections, images, buttons, or elements
4. You can restructure the layout of the email
5. You must maintain email compatibility with inline CSS

When asked to modify a template:
1. Provide clear HTML/CSS code that can be used to implement the changes
2. Focus on creating accessible, responsive email templates that work across email clients
3. Give brief explanations of your changes`
  }
];

/**
 * Reset the chat history to the initial state
 */
export function resetChatHistory() {
  chatHistory = [
    {
      role: 'system',
      content: `You are an AI assistant that helps users with email templates. You can understand HTML and CSS and can make detailed modifications to email templates as requested.

Important capabilities:
1. You can and should modify colors, fonts, layouts, and styling when requested
2. You can completely change the theme or design of the email if asked
3. You can add new sections, images, buttons, or elements
4. You can restructure the layout of the email
5. You must maintain email compatibility with inline CSS

When asked to modify a template:
1. Provide clear HTML/CSS code that can be used to implement the changes
2. Focus on creating accessible, responsive email templates that work across email clients
3. Give brief explanations of your changes`
    }
  ];
}

/**
 * Update the template context in the chat history
 * @param html Current HTML template
 */
export function updateTemplateInChat(html: string) {
  // Find if there's already a template context message
  const templateIndex = chatHistory.findIndex(
    (msg) => msg.role === 'system' && msg.content.includes('Current template HTML:')
  );
  
  // Prepare the template context message
  const templateContext = {
    role: 'system',
    content: `Current template HTML: ${html}`
  };
  
  // Replace or add the template context
  if (templateIndex !== -1) {
    chatHistory[templateIndex] = templateContext;
  } else if (chatHistory.length > 0) {
    // Insert after the first system message
    chatHistory.splice(1, 0, templateContext);
  } else {
    // Just add it if there's somehow no history
    chatHistory.push(templateContext);
  }
}

// Define API endpoints - remove /api prefix as it's handled by the API utility
const GENERATE_ENDPOINT = 'generate-template';
const CHAT_ENDPOINT = 'chat';

// Supported Groq models
export type GroqModel = 'llama3-70b-8192' | 'llama3-8b-8192' | 'mixtral-8x7b-32768';

// Response interface from Groq API
export interface GroqChatResponse {
  id: string;
  model: string;
  created: number;
  object: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Request options for chat completion
export interface ChatCompletionOptions {
  messages: ChatCompletionMessageParam[];
  model?: GroqModel;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Make a request to the Groq API for chat completion
 */
export async function getChatCompletion({
  messages,
  model = 'llama3-70b-8192',
  temperature = 0.7,
  maxTokens = 4000
}: ChatCompletionOptions): Promise<string> {
  // For browser environments, access the imported.meta.env.VITE_* variables
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API key not found in environment variables');
  }

  try {
    console.log('Making request to Groq API...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
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
      
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json() as GroqChatResponse;
    console.log('Successfully received Groq API response');
    return data.choices[0]?.message.content || '';
  } catch (error: any) {
    console.error('Error calling Groq API:', error);
    throw error;
  }
}

// API response types
interface GenerateTemplateResponse {
  html: string;
  logoUrl?: string;
  organization?: string;
}

interface ChatResponse {
  updatedHtml: string;
}

// Function to generate email template using Groq API
export async function generateEmailTemplate(content: string): Promise<{ html: string; logoUrl?: string; organization?: string }> {
  try {
    console.log('Sending request to generate email template...');
    
    // Try to use the backend API first
    try {
      const response = await apiPost<GenerateTemplateResponse>(GENERATE_ENDPOINT, { content });
      console.log('Response received from backend API');
      
      // Clean the HTML response client-side before returning it
      const cleanedHtml = sanitizeHtmlResponse(response.html);
      
      return {
        html: cleanedHtml,
        logoUrl: response.logoUrl,
        organization: response.organization
      };
    } catch (backendError) {
      console.warn('Backend API request failed, falling back to direct Groq API call:', backendError);
    }
    
    // Fallback to direct Groq API call
    console.log('Making direct Groq API call as fallback...');
    
    // Default system prompt for template generation
    const defaultTemplatePrompt = `
You are an expert email template designer. Create a responsive HTML email template based on the following content.
The template should be:
1. Modern, visually appealing, and professional with a strong design aesthetic
2. Fully responsive for all devices and email clients
3. Using clean, well-structured HTML with inline CSS (essential for email clients)
4. Including appropriate sections like header, content, call-to-action, and footer
5. Using a modern color scheme with good contrast and visual hierarchy
6. Following email best practices (maximum width 600px, basic fonts, etc.)
7. Incorporating design elements like buttons, dividers, and spacing for readability

Feel free to use your creativity for the design style, fonts, and color palette. Make the design visually striking.

Return only the HTML code, no explanations or markdown. The code should be ready to use.
`;
    
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key not found in environment variables');
    }
    
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
            content: content
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
      
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('Received direct response from Groq API');
    
    // Extract the HTML content from the response
    const rawHtml = data.choices[0]?.message?.content || '';
    const cleanedHtml = sanitizeHtmlResponse(rawHtml);
    
    return {
      html: cleanedHtml
    };
    
  } catch (error: any) {
    console.error('Error generating email template:', error);
    if (error.message.includes('API key')) {
      toast.error('Missing or invalid Groq API key. Please check your configuration.');
    } else {
      toast.error(error.message || 'Failed to generate template');
    }
    throw error;
  }
}

/**
 * Sanitize the HTML response to remove unwanted text and code fences
 */
export function sanitizeHtmlResponse(html: string): string {
  if (!html) return '';
  
  console.log('Original HTML starts with:', html.substring(0, 50));
  
  // Remove code fence markers with improved pattern matching
  let cleanedHtml = html.replace(/```(?:html|HTML)?/gi, '').replace(/```/g, '');
  
  // Remove common prefix patterns - expanded to catch more variants
  const prefixPatterns = [
    /^Here is (a|the) responsive HTML email template( based on your request)?:\s*/i,
    /^Here is (a|the|your) HTML email template:\s*/i,
    /^Here is the HTML code( for the email template)?:\s*/i,
    /^Here('s| is) (a|the|your) email template:\s*/i,
    /^Below is (a|the|your) responsive email template:\s*/i,
    /^I('ve| have) created (a|the|your) responsive email template:\s*/i,
    /^This is (a|the|your) responsive email template:\s*/i,
    /^The modified email template( is as follows)?:\s*/i,
    /^I('ve| have) updated the template (as requested|with your changes)( as follows)?:\s*/i,
    /^Here('s| is) the (updated|modified) (HTML )?template:\s*/i
  ];
  
  // Apply all prefix patterns
  for (const pattern of prefixPatterns) {
    cleanedHtml = cleanedHtml.replace(pattern, '');
  }
  
  // Remove common suffix patterns - expanded to catch more variants
  const suffixPatterns = [
    /\s*Replace the placeholder (text|logo|content|images)[\s\S]*?(\.|$)/i,
    /\s*You can (replace|customize|update)[\s\S]*?(\.|$)/i,
    /\s*Feel free to[\s\S]*?(\.|$)/i,
    /\s*This template uses a modern color scheme[\s\S]*?(\.|$)/i,
    /\s*The template (uses|features|includes|has)[\s\S]*?(\.|$)/i,
    /\s*This email template[\s\S]*?(\.|$)/i,
    /\s*This design[\s\S]*?(\.|$)/i,
    /\s*This responsive[\s\S]*?(\.|$)/i,
    /\s*It is fully responsive[\s\S]*?(\.|$)/i,
    /\s*The template is[\s\S]*?(\.|$)/i,
    /\s*I('ve| have) (made|implemented) the requested changes[\s\S]*?(\.|$)/i,
    /\s*The template now includes[\s\S]*?(\.|$)/i,
    /\s*Let me know if you[\s\S]*?(\.|$)/i
  ];
  
  // Apply all suffix patterns
  for (const pattern of suffixPatterns) {
    cleanedHtml = cleanedHtml.replace(pattern, '');
  }
  
  // Find the start of actual HTML content with improved detection
  let processedHtml = cleanedHtml;
  
  // Check if we have proper HTML structure
  const hasDoctype = cleanedHtml.includes('<!DOCTYPE') || cleanedHtml.includes('<!doctype');
  const hasHtmlTag = cleanedHtml.includes('<html') || cleanedHtml.includes('<HTML');
  
  if (hasDoctype || hasHtmlTag) {
    // Extract content from the start of the first major HTML element
    const possibleStartTags = ['<!DOCTYPE', '<!doctype', '<html', '<HTML', '<body', '<BODY', '<table', '<TABLE', '<div', '<DIV'];
    let startIndex = Number.MAX_SAFE_INTEGER;
    
    for (const tag of possibleStartTags) {
      const index = cleanedHtml.indexOf(tag);
      if (index !== -1 && index < startIndex) {
        startIndex = index;
      }
    }
    
    // Extract only the actual HTML content if a start tag was found
    if (startIndex !== Number.MAX_SAFE_INTEGER) {
      processedHtml = cleanedHtml.substring(startIndex);
    }
    
    // Find and remove any trailing text after the HTML
    if (processedHtml.includes('</html>') || processedHtml.includes('</HTML>')) {
      const htmlEndIndex = Math.max(
        processedHtml.lastIndexOf('</html>'), 
        processedHtml.lastIndexOf('</HTML>')
      );
      
      if (htmlEndIndex !== -1) {
        processedHtml = processedHtml.substring(0, htmlEndIndex + 7); // +7 to include '</html>'
      }
    }
  } else {
    // If no proper HTML structure, just clean up any non-HTML text at the beginning and end
    // Look for the first HTML tag
    const firstTagMatch = cleanedHtml.match(/<[a-z][^>]*>/i);
    if (firstTagMatch && firstTagMatch.index !== undefined) {
      const startIndex = firstTagMatch.index;
      processedHtml = cleanedHtml.substring(startIndex);
    }
    
    // Look for the last closing HTML tag
    const lastTagMatch = processedHtml.match(/<\/[a-z][^>]*>(?![\s\S]*<\/[a-z][^>]*>)/i);
    if (lastTagMatch && lastTagMatch.index !== undefined) {
      const endIndex = lastTagMatch.index + lastTagMatch[0].length;
      processedHtml = processedHtml.substring(0, endIndex);
    }
  }
  
  // Final validation - check if the HTML is potentially malformed
  if (processedHtml.trim().length < html.trim().length * 0.5) {
    // If we lost more than 50% of the content, it might be a mistake
    console.warn('Sanitization removed more than 50% of the content, returning original HTML');
    // Return the original HTML with just code fences removed as a fallback
    processedHtml = html.replace(/```(?:html|HTML)?/gi, '').replace(/```/g, '');
  }
  
  console.log('Cleaned HTML starts with:', processedHtml.substring(0, 50));
  
  return processedHtml.trim();
}

// Function to send chat message and get updated HTML template
export async function sendChatMessage(message: string, currentHtml: string): Promise<string> {
  try {
    // First, try to use the backend API
    try {
      const response = await apiPost<ChatResponse>(CHAT_ENDPOINT, { 
        message, 
        currentHtml 
      });
      
      return response.updatedHtml;
    } catch (backendError) {
      console.warn('Backend API request failed, falling back to direct Groq API call:', backendError);
    }
    
    // Fallback to direct Groq API call
    console.log('Making direct Groq API call for chat as fallback...');
    
    // Add the message to chat history for context
    chatHistory.push({
      role: 'user',
      content: message
    });
    
    // Default system prompt for template modification with improved reliability
    const templateUpdatePrompt = `
You are an expert email template editor. Based on the user's request, modify the provided HTML email template.
Your response should be the complete, updated HTML template with the requested changes applied.

Important capabilities and requirements:
1. You can and should modify colors, fonts, layouts, and styling when requested
2. You can completely change the theme or design of the email if asked
3. You can add new sections, images, buttons, or elements
4. You can restructure the layout of the email
5. You MUST maintain email compatibility with inline CSS
6. You MUST preserve the overall structure of the HTML document
7. You MUST include essential elements like <html>, <head>, and <body> tags (or proper email table structure)
8. You MUST return the ENTIRE HTML template, not just the modified parts
9. If making small changes, ensure the entire template is still included in your response
10. NEVER truncate or abbreviate your HTML response

Return ONLY the complete HTML code, no explanations, no markdown formatting.
`;
    
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key not found in environment variables');
    }
    
    // Create messages for API call with stronger instructions
    const messages = [
      {
        role: 'system',
        content: templateUpdatePrompt
      },
      {
        role: 'system',
        content: `Current HTML template (IMPORTANT: You must return a complete HTML template that includes all necessary structure, not just changed parts): ${currentHtml}`
      },
      {
        role: 'user',
        content: message
      }
    ];
    
    // Make direct API call to Groq with increased max tokens to avoid truncation
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: messages,
        temperature: 0.7,
        max_tokens: 8000 // Increased from 4000 to accommodate larger templates
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
      
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('Received direct chat response from Groq API');
    
    // Extract the HTML content from the response
    const rawHtml = data.choices[0]?.message?.content || '';
    
    // More extensive validation before cleaning
    if (!rawHtml || rawHtml.trim().length < 100) {
      throw new Error('AI response too short to be a valid HTML template');
    }
    
    // Check for basic HTML structure
    if (!rawHtml.includes('<html') && !rawHtml.includes('<!DOCTYPE') && 
        !rawHtml.includes('<body') && !rawHtml.includes('<table')) {
      throw new Error('AI response is missing required HTML structure');
    }
    
    const cleanedHtml = sanitizeHtmlResponse(rawHtml);
    
    // Final validation after cleaning
    if (cleanedHtml.length < 100) {
      throw new Error('Cleaned HTML is too short - possible template corruption');
    }
    
    // Add the assistant response to chat history
    chatHistory.push({
      role: 'assistant',
      content: 'I\'ve updated the template based on your request.'
    });
    
    return cleanedHtml;
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    if (error.message.includes('API key')) {
      toast.error('Missing or invalid Groq API key. Please check your configuration.');
    } else {
      toast.error(error.message || 'Failed to process your request');
    }
    throw error;
  }
}

// Function to update template in chat (different API endpoint)
export async function updateTemplateWithChat(
  message: string, 
  currentHtml: string
): Promise<{ updatedHtml: string; response: string }> {
  try {
    // First try to use the backend API
    try {
      const response = await fetch('/api/update-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          currentHtml
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      // If backend API fails with 404, fall back to direct Groq API call
      console.log('Update Template API not available (404). Falling back to direct Groq API call...');
    } catch (backendError) {
      console.warn('Backend API request failed, falling back to direct Groq API call:', backendError);
    }
    
    // Fallback to direct Groq API call
    console.log('Making direct Groq API call for update template as fallback...');
    
    // Add the message to chat history for context
    chatHistory.push({
      role: 'user',
      content: message
    });
    
    // Default system prompt for template modification
    const templateUpdatePrompt = `
You are an expert email template editor. Based on the user's request, modify the provided HTML email template.

Important capabilities:
1. You can and should modify colors, fonts, layouts, and styling when requested
2. You can completely change the theme or design of the email if asked
3. You can add new sections, images, buttons, or elements
4. You can restructure the layout of the email
5. You should maintain email compatibility with inline CSS

Provide two responses:
1. A brief explanation of the changes you made
2. The complete, updated HTML template with the requested changes applied

Format your response as:
EXPLANATION: [Your brief explanation here]
HTML: [The complete HTML code]
`;
    
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key not found in environment variables');
    }
    
    // Create messages for API call
    const messages = [
      {
        role: 'system',
        content: templateUpdatePrompt
      },
      {
        role: 'system',
        content: `Current HTML template: ${currentHtml}`
      },
      {
        role: 'user',
        content: message
      }
    ];
    
    // Make direct API call to Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: messages,
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
      
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('Received direct update template response from Groq API');
    
    // Extract the content from the response
    const content = data.choices[0]?.message?.content || '';
    
    // Parse the response to extract explanation and HTML
    let explanation = '';
    let htmlContent = '';
    
    if (content.includes('EXPLANATION:') && content.includes('HTML:')) {
      const explanationMatch = content.match(/EXPLANATION:(.*?)HTML:/s);
      explanation = explanationMatch ? explanationMatch[1].trim() : 'Template updated successfully';
      
      const htmlMatch = content.match(/HTML:(.*)/s);
      htmlContent = htmlMatch ? htmlMatch[1].trim() : content;
    } else {
      // If the format is not as expected, treat the whole response as HTML
      htmlContent = content;
      explanation = 'Template updated successfully';
    }
    
    // Clean the HTML
    const cleanedHtml = sanitizeHtmlResponse(htmlContent);
    
    // Add the assistant response to chat history
    chatHistory.push({
      role: 'assistant',
      content: explanation
    });
    
    return {
      updatedHtml: cleanedHtml,
      response: explanation
    };
  } catch (error: any) {
    console.error('Error updating template in chat:', error);
    if (error.message.includes('API key')) {
      toast.error('Missing or invalid Groq API key. Please check your configuration.');
    } else {
      toast.error(error.message || 'Failed to update template');
    }
    throw error;
  }
}

/**
 * Get the current chat history
 * @returns Array of chat messages
 */
export function getChatHistory() {
  return chatHistory;
}

/**
 * Generate a template using Groq directly
 * @param prompt The user prompt
 * @returns The generated template
 */
export async function generateTemplateWithGroq(prompt: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert email template designer. Create a responsive HTML email template based on the user prompt. The template should be well-designed, modern, and ready to use. Include inline CSS for email compatibility.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-70b-8192',
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating email template:', error);
    throw new Error('Failed to generate email template');
  }
} 