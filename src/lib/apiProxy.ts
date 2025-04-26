/**
 * This file provides a proxy for making API calls to services
 * that should ideally be called from a backend but are called from the browser
 * in this demo application
 */

/**
 * Call Groq API for template generation
 * In a production environment, this would be a backend API call
 * @param prompt User prompt
 * @returns Generated HTML
 */
export async function generateEmailTemplateViaProxy(prompt: string): Promise<string> {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key not found in environment variables');
    }
    
    // In a real application, this would be a call to your backend
    // For demo purposes, we're making a direct API call with necessary headers
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
            content: `
              You are an expert email template designer. Create a responsive HTML email template based on the user prompt.
              Follow these guidelines:
              1. The template should be well-designed, modern, and ready to use
              2. Use only inline CSS for email compatibility
              3. Make sure the template is responsive and works on mobile devices
              4. Include appropriate sections like header, content, footer
              5. Use appropriate font sizes (14-16px for body text, 18-24px for headings)
              6. Ensure good color contrast for readability
              7. Return only the HTML code, no explanations
            `
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in API proxy:', error);
    throw error;
  }
}

/**
 * Send a chat message via proxy
 * @param message User message
 * @param chatHistory Previous chat history
 * @returns Assistant response
 */
export async function sendChatMessageViaProxy(message: string, currentHtml: string, chatHistory: any[]): Promise<string> {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key not found in environment variables');
    }
    
    // Prepare messages for the API call
    const messages = [...chatHistory];
    
    // Add HTML context if it's a new conversation
    if (messages.length === 1) {
      messages.push({
        role: 'system',
        content: `The current HTML template is:\n\n${currentHtml}\n\nHelp the user modify this template.`
      });
    }
    
    // Add user message
    messages.push({
      role: 'user',
      content: message
    });
    
    // Make API call
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
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in chat API proxy:', error);
    throw error;
  }
} 
 * This file provides a proxy for making API calls to services
 * that should ideally be called from a backend but are called from the browser
 * in this demo application
 */

/**
 * Call Groq API for template generation
 * In a production environment, this would be a backend API call
 * @param prompt User prompt
 * @returns Generated HTML
 */
export async function generateEmailTemplateViaProxy(prompt: string): Promise<string> {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key not found in environment variables');
    }
    
    // In a real application, this would be a call to your backend
    // For demo purposes, we're making a direct API call with necessary headers
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
            content: `
              You are an expert email template designer. Create a responsive HTML email template based on the user prompt.
              Follow these guidelines:
              1. The template should be well-designed, modern, and ready to use
              2. Use only inline CSS for email compatibility
              3. Make sure the template is responsive and works on mobile devices
              4. Include appropriate sections like header, content, footer
              5. Use appropriate font sizes (14-16px for body text, 18-24px for headings)
              6. Ensure good color contrast for readability
              7. Return only the HTML code, no explanations
            `
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in API proxy:', error);
    throw error;
  }
}

/**
 * Send a chat message via proxy
 * @param message User message
 * @param chatHistory Previous chat history
 * @returns Assistant response
 */
export async function sendChatMessageViaProxy(message: string, currentHtml: string, chatHistory: any[]): Promise<string> {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key not found in environment variables');
    }
    
    // Prepare messages for the API call
    const messages = [...chatHistory];
    
    // Add HTML context if it's a new conversation
    if (messages.length === 1) {
      messages.push({
        role: 'system',
        content: `The current HTML template is:\n\n${currentHtml}\n\nHelp the user modify this template.`
      });
    }
    
    // Add user message
    messages.push({
      role: 'user',
      content: message
    });
    
    // Make API call
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
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error in chat API proxy:', error);
    throw error;
  }
} 
 