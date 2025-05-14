/**
 * Mock AI Chat
 * Provides pre-designed responses to common questions about email templates
 * Used for local development without requiring API calls
 */

/**
 * Generate a realistic-sounding AI response based on the user's message
 * @param message User's message
 * @param template Current HTML template
 * @returns AI response
 */
export function getMockAIResponse(message: string, template: string): string {
  // Convert message to lowercase for easier matching
  const query = message.toLowerCase();
  
  // Check for different types of requests
  if (query.includes('color') || query.includes('colours')) {
    return getColorResponse(query);
  }
  
  if (query.includes('font') || query.includes('typography')) {
    return getFontResponse(query);
  }
  
  if (query.includes('header') || query.includes('heading') || query.includes('title')) {
    return getHeaderResponse(query);
  }
  
  if (query.includes('image') || query.includes('logo') || query.includes('picture')) {
    return getImageResponse(query);
  }
  
  if (query.includes('button') || query.includes('cta') || query.includes('call to action')) {
    return getButtonResponse(query);
  }
  
  if (query.includes('footer') || query.includes('bottom')) {
    return getFooterResponse(query);
  }
  
  if (query.includes('layout') || query.includes('structure') || query.includes('format')) {
    return getLayoutResponse(query);
  }
  
  if (query.includes('responsive') || query.includes('mobile') || query.includes('device')) {
    return getResponsiveResponse(query);
  }
  
  if (query.includes('background') || query.includes('bg')) {
    return getBackgroundResponse(query);
  }
  
  // For any other queries, provide a generic response
  return getGenericResponse(query);
}

/**
 * Get a response for color-related queries
 */
function getColorResponse(query: string): string {
  if (query.includes('change') || query.includes('update') || query.includes('modify')) {
    return `I can help you change the colors in your email template. Here's how to update the main color scheme:

\`\`\`html
<!-- To change header background color -->
<div style="background-color: #4285f4; color: #ffffff; padding: 20px; text-align: center;">
  <!-- Header content -->
</div>

<!-- To change button color -->
<a href="#" style="display: inline-block; background-color: #4285f4; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Click Here</a>
\`\`\`

You can replace #4285f4 with any hex color code of your choice. Do you want me to suggest a specific color scheme?`;
  }
  
  if (query.includes('recommend') || query.includes('suggest')) {
    return `Here are some professional color schemes for email templates:

1. **Classic Blue & White**:
   - Primary: #0047AB (Cobalt Blue)
   - Secondary: #FFFFFF (White)
   - Accent: #F8F8F8 (Off-White)

2. **Modern Green**:
   - Primary: #2E8B57 (Sea Green)
   - Secondary: #FFFFFF (White)
   - Accent: #F5F5F5 (Light Gray)

3. **Corporate Purple**:
   - Primary: #663399 (Rebecca Purple)
   - Secondary: #FFFFFF (White)
   - Accent: #F0F0F0 (Light Gray)

Would you like me to apply any of these to your template?`;
  }
  
  return `Colors play a crucial role in email templates. Here are some best practices:

1. Use a limited color palette (2-3 colors max)
2. Ensure good contrast for readability
3. Use brand colors consistently
4. Be mindful of color psychology

Would you like me to suggest specific color changes for your template?`;
}

/**
 * Get a response for font-related queries
 */
function getFontResponse(query: string): string {
  if (query.includes('change') || query.includes('update') || query.includes('modify')) {
    return `To change the fonts in your email template, you can update the font-family CSS property. Here's an example:

\`\`\`html
<!-- To change the body font -->
<body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333333;">
  <!-- Content -->
</body>

<!-- To change a specific text element font -->
<h1 style="font-family: 'Georgia', serif; font-size: 28px; color: #333333;">Your Heading</h1>
\`\`\`

For email templates, it's best to stick with web-safe fonts like Arial, Verdana, Georgia, or Times New Roman to ensure compatibility across email clients.`;
  }
  
  return `When it comes to fonts in email templates, here are some best practices:

1. Stick to web-safe fonts (Arial, Verdana, Georgia, Times New Roman)
2. Use a maximum of 2 font families (one for headings, one for body)
3. Keep font sizes readable (minimum 14px for body text)
4. Use proper hierarchy with font weights and sizes

Would you like me to provide specific font changes for your template?`;
}

/**
 * Get a response for header-related queries
 */
function getHeaderResponse(query: string): string {
  if (query.includes('change') || query.includes('update') || query.includes('modify')) {
    return `Here's how you can update the header of your email template:

\`\`\`html
<div style="background-color: #4f46e5; color: #ffffff; padding: 30px 20px; text-align: center;">
  <!-- Optional logo -->
  <img src="https://via.placeholder.com/150x50" alt="Company Logo" style="max-width: 150px; height: auto; margin-bottom: 15px;">
  
  <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Your New Header Title</h1>
  <p style="margin-top: 10px; margin-bottom: 0; font-size: 16px;">A brief subtitle or tagline goes here</p>
</div>
\`\`\`

You can customize the colors, sizes, and content to fit your needs. Would you like me to suggest any specific changes to your current header?`;
  }
  
  return `The header is one of the most important parts of an email template. Here are some tips:

1. Keep it clean and focused
2. Include your logo for brand recognition
3. Use contrasting colors for better visibility
4. Consider adding a brief tagline or value proposition
5. Make sure it looks good on mobile devices

Would you like me to suggest a specific header design for your template?`;
}

/**
 * Get a response for image-related queries
 */
function getImageResponse(query: string): string {
  if (query.includes('add') || query.includes('insert')) {
    return `Here's how to add an image to your email template:

\`\`\`html
<!-- Basic image -->
<img src="https://example.com/your-image.jpg" alt="Description of image" style="display: block; max-width: 100%; height: auto; margin: 20px 0;">

<!-- Image with border and shadow -->
<img src="https://example.com/your-image.jpg" alt="Description of image" style="display: block; max-width: 100%; height: auto; margin: 20px 0; border: 1px solid #dddddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
\`\`\`

For email templates, make sure to:
1. Host images on a reliable server
2. Always include alt text
3. Set max-width: 100% for responsiveness
4. Use display: block to avoid unwanted spacing

Would you like me to suggest places in your template where images would be effective?`;
  }
  
  return `Images can significantly improve engagement in email templates. Here are some best practices:

1. Keep file sizes small (under 200KB per image)
2. Use alt text for all images
3. Make sure images are responsive
4. Don't rely solely on images (some clients block them by default)
5. Consider using background images sparingly

Would you like me to help you implement images in your template?`;
}

/**
 * Get a response for button-related queries
 */
function getButtonResponse(query: string): string {
  if (query.includes('add') || query.includes('insert') || query.includes('create')) {
    return `Here's how to add a call-to-action button to your email template:

\`\`\`html
<!-- Simple button -->
<a href="https://example.com" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center; margin: 20px 0;">Click Here</a>

<!-- Button with hover effect (works in some email clients) -->
<a href="https://example.com" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center; margin: 20px 0; mso-line-height-rule: exactly; line-height: 100%;">
  <span style="mso-text-raise: 15pt;">Click Here</span>
</a>
\`\`\`

For maximum compatibility, buttons should be built with HTML and CSS rather than images. Would you like me to help you position this button somewhere specific in your template?`;
  }
  
  return `Call-to-action buttons are critical for email engagement. Here are some tips:

1. Use contrasting colors that stand out
2. Keep button text short and action-oriented (e.g., "Shop Now", "Learn More")
3. Make buttons large enough for mobile tapping (at least 44px tall)
4. Position buttons where they're easily seen
5. Use HTML/CSS buttons rather than images

Would you like me to help you create a specific button for your template?`;
}

/**
 * Get a response for footer-related queries
 */
function getFooterResponse(query: string): string {
  if (query.includes('add') || query.includes('update') || query.includes('modify')) {
    return `Here's how to create a professional footer for your email template:

\`\`\`html
<div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
  <p style="margin: 0 0 10px;">© 2025 Your Company Name. All rights reserved.</p>
  <p style="margin: 0 0 10px;">123 Street Address, City, Country</p>
  <p style="margin: 0 0 10px;">
    <a href="mailto:contact@example.com" style="color: #4f46e5; text-decoration: none;">contact@example.com</a> | 
    <a href="tel:+11234567890" style="color: #4f46e5; text-decoration: none;">+1 (123) 456-7890</a>
  </p>
  <p style="margin: 0;">
    <a href="#" style="display: inline-block; margin: 0 5px; color: #4f46e5;">Unsubscribe</a> | 
    <a href="#" style="display: inline-block; margin: 0 5px; color: #4f46e5;">Privacy Policy</a>
  </p>
</div>
\`\`\`

Remember to include legally required elements like your physical address and an unsubscribe link. Would you like me to customize this footer for your specific needs?`;
  }
  
  return `Email footers are important for both legal compliance and user experience. A good footer should include:

1. Company name and contact information
2. Physical address (required by law in many countries)
3. Unsubscribe link (legally required)
4. Privacy policy link
5. Social media links (optional)
6. Copyright notice

Would you like me to help you create a compliant and professional footer for your template?`;
}

/**
 * Get a response for layout-related queries
 */
function getLayoutResponse(query: string): string {
  if (query.includes('change') || query.includes('improve') || query.includes('fix')) {
    return `To improve the layout of your email template, consider this structure:

\`\`\`html
<table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f5f5f5">
  <tr>
    <td style="padding: 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color: #4f46e5; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Email Title</h1>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 30px 20px;">
            <p>Your content here...</p>
          </td>
        </tr>
        
        <!-- Call to Action -->
        <tr>
          <td style="padding: 0 20px 30px; text-align: center;">
            <a href="#" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Click Here</a>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">Footer content here</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
\`\`\`

This nested table structure is more reliable across email clients. Would you like me to help you implement this structure in your template?`;
  }
  
  return `Email layout is crucial for compatibility across email clients. Here are some best practices:

1. Use tables for layout (div-based layouts can break in some clients)
2. Keep width to 600px maximum
3. Use a single-column layout for mobile compatibility
4. Break content into distinct sections
5. Use proper spacing between elements
6. Include plenty of white space

Would you like me to suggest a specific layout improvement for your template?`;
}

/**
 * Get a response for responsive design queries
 */
function getResponsiveResponse(query: string): string {
  if (query.includes('make') || query.includes('create') || query.includes('convert')) {
    return `To make your email template responsive, add these meta tags and use this approach:

\`\`\`html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Email Subject</title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--<![endif]-->
</head>
\`\`\`

Then for responsive elements:

\`\`\`html
<!-- For images -->
<img src="image.jpg" alt="Description" style="display: block; width: 100%; max-width: 600px; height: auto;">

<!-- For text -->
<p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">Your text content here</p>

<!-- For two-column layouts that stack on mobile -->
<table width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 10px;" valign="top">
      <!-- Left column -->
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>Column 1 content</td>
        </tr>
      </table>
    </td>
    <td style="padding: 10px;" valign="top">
      <!-- Right column -->
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>Column 2 content</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
\`\`\`

Would you like me to help implement these responsive techniques in your specific template?`;
  }
  
  return `Making email templates responsive is essential since over 60% of emails are opened on mobile devices. Here are key principles:

1. Use a single-column layout when possible
2. Set images to max-width: 100%
3. Use large enough font sizes (min 14px for body text)
4. Make buttons at least 44px tall for easy tapping
5. Keep your design simple
6. Test on multiple devices and email clients

Would you like specific advice on making your template more responsive?`;
}

/**
 * Get a response for background-related queries
 */
function getBackgroundResponse(query: string): string {
  if (query.includes('change') || query.includes('add') || query.includes('update')) {
    return `Here's how to update the background in your email template:

\`\`\`html
<!-- For the entire email background -->
<table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f5f5f5">
  <tr>
    <td style="padding: 20px;">
      <!-- Your content table here -->
    </td>
  </tr>
</table>

<!-- For a section background -->
<table width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; overflow: hidden;">
  <tr>
    <td style="padding: 30px 20px; background-color: #f2f6ff;">
      <!-- Section content here -->
    </td>
  </tr>
</table>

<!-- For a background image (has limited support) -->
<td background="https://example.com/bg-image.jpg" bgcolor="#333333" style="background-image: url('https://example.com/bg-image.jpg'); background-position: center; background-repeat: no-repeat; background-size: cover; padding: 30px 20px;">
  <div style="color: #ffffff;">Content over background image</div>
</td>
\`\`\`

Note that background images have limited support in email clients, so always use a fallback background color. Would you like me to help implement a specific background change?`;
  }
  
  return `Backgrounds can enhance your email template's visual appeal, but should be used carefully:

1. Use light backgrounds for readability
2. Solid colors are most reliable across email clients
3. Background images have limited support
4. Always provide a fallback background color
5. Consider using different section backgrounds to create visual interest

Would you like me to suggest specific background improvements for your template?`;
}

/**
 * Get a generic response for any other query
 */
function getGenericResponse(query: string): string {
  const responses = [
    `I'd be happy to help with that. Could you be more specific about what changes you'd like to make to the template?`,
    
    `I can assist with modifying your email template. Here are some common improvements:
1. Updating colors and fonts
2. Adding or modifying sections
3. Improving the layout
4. Making it more responsive
5. Adding images or buttons

What specific changes would you like to make?`,
    
    `I can help you improve this email template. The key areas we could work on are:
- Visual design (colors, fonts, spacing)
- Content structure
- Call-to-action elements
- Mobile responsiveness
- Overall layout

Which area would you like to focus on first?`,
    
    `I can provide HTML code to modify your template. Before I do, could you clarify what specific aspect you'd like to change? For example:
- Header or footer design
- Color scheme
- Typography
- Layout structure
- Call-to-action buttons`
  ];
  
  // Return a random response
  return responses[Math.floor(Math.random() * responses.length)];
} 
 * Mock AI Chat
 * Provides pre-designed responses to common questions about email templates
 * Used for local development without requiring API calls
 */

/**
 * Generate a realistic-sounding AI response based on the user's message
 * @param message User's message
 * @param template Current HTML template
 * @returns AI response
 */
export function getMockAIResponse(message: string, template: string): string {
  // Convert message to lowercase for easier matching
  const query = message.toLowerCase();
  
  // Check for different types of requests
  if (query.includes('color') || query.includes('colours')) {
    return getColorResponse(query);
  }
  
  if (query.includes('font') || query.includes('typography')) {
    return getFontResponse(query);
  }
  
  if (query.includes('header') || query.includes('heading') || query.includes('title')) {
    return getHeaderResponse(query);
  }
  
  if (query.includes('image') || query.includes('logo') || query.includes('picture')) {
    return getImageResponse(query);
  }
  
  if (query.includes('button') || query.includes('cta') || query.includes('call to action')) {
    return getButtonResponse(query);
  }
  
  if (query.includes('footer') || query.includes('bottom')) {
    return getFooterResponse(query);
  }
  
  if (query.includes('layout') || query.includes('structure') || query.includes('format')) {
    return getLayoutResponse(query);
  }
  
  if (query.includes('responsive') || query.includes('mobile') || query.includes('device')) {
    return getResponsiveResponse(query);
  }
  
  if (query.includes('background') || query.includes('bg')) {
    return getBackgroundResponse(query);
  }
  
  // For any other queries, provide a generic response
  return getGenericResponse(query);
}

/**
 * Get a response for color-related queries
 */
function getColorResponse(query: string): string {
  if (query.includes('change') || query.includes('update') || query.includes('modify')) {
    return `I can help you change the colors in your email template. Here's how to update the main color scheme:

\`\`\`html
<!-- To change header background color -->
<div style="background-color: #4285f4; color: #ffffff; padding: 20px; text-align: center;">
  <!-- Header content -->
</div>

<!-- To change button color -->
<a href="#" style="display: inline-block; background-color: #4285f4; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px;">Click Here</a>
\`\`\`

You can replace #4285f4 with any hex color code of your choice. Do you want me to suggest a specific color scheme?`;
  }
  
  if (query.includes('recommend') || query.includes('suggest')) {
    return `Here are some professional color schemes for email templates:

1. **Classic Blue & White**:
   - Primary: #0047AB (Cobalt Blue)
   - Secondary: #FFFFFF (White)
   - Accent: #F8F8F8 (Off-White)

2. **Modern Green**:
   - Primary: #2E8B57 (Sea Green)
   - Secondary: #FFFFFF (White)
   - Accent: #F5F5F5 (Light Gray)

3. **Corporate Purple**:
   - Primary: #663399 (Rebecca Purple)
   - Secondary: #FFFFFF (White)
   - Accent: #F0F0F0 (Light Gray)

Would you like me to apply any of these to your template?`;
  }
  
  return `Colors play a crucial role in email templates. Here are some best practices:

1. Use a limited color palette (2-3 colors max)
2. Ensure good contrast for readability
3. Use brand colors consistently
4. Be mindful of color psychology

Would you like me to suggest specific color changes for your template?`;
}

/**
 * Get a response for font-related queries
 */
function getFontResponse(query: string): string {
  if (query.includes('change') || query.includes('update') || query.includes('modify')) {
    return `To change the fonts in your email template, you can update the font-family CSS property. Here's an example:

\`\`\`html
<!-- To change the body font -->
<body style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333333;">
  <!-- Content -->
</body>

<!-- To change a specific text element font -->
<h1 style="font-family: 'Georgia', serif; font-size: 28px; color: #333333;">Your Heading</h1>
\`\`\`

For email templates, it's best to stick with web-safe fonts like Arial, Verdana, Georgia, or Times New Roman to ensure compatibility across email clients.`;
  }
  
  return `When it comes to fonts in email templates, here are some best practices:

1. Stick to web-safe fonts (Arial, Verdana, Georgia, Times New Roman)
2. Use a maximum of 2 font families (one for headings, one for body)
3. Keep font sizes readable (minimum 14px for body text)
4. Use proper hierarchy with font weights and sizes

Would you like me to provide specific font changes for your template?`;
}

/**
 * Get a response for header-related queries
 */
function getHeaderResponse(query: string): string {
  if (query.includes('change') || query.includes('update') || query.includes('modify')) {
    return `Here's how you can update the header of your email template:

\`\`\`html
<div style="background-color: #4f46e5; color: #ffffff; padding: 30px 20px; text-align: center;">
  <!-- Optional logo -->
  <img src="https://via.placeholder.com/150x50" alt="Company Logo" style="max-width: 150px; height: auto; margin-bottom: 15px;">
  
  <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Your New Header Title</h1>
  <p style="margin-top: 10px; margin-bottom: 0; font-size: 16px;">A brief subtitle or tagline goes here</p>
</div>
\`\`\`

You can customize the colors, sizes, and content to fit your needs. Would you like me to suggest any specific changes to your current header?`;
  }
  
  return `The header is one of the most important parts of an email template. Here are some tips:

1. Keep it clean and focused
2. Include your logo for brand recognition
3. Use contrasting colors for better visibility
4. Consider adding a brief tagline or value proposition
5. Make sure it looks good on mobile devices

Would you like me to suggest a specific header design for your template?`;
}

/**
 * Get a response for image-related queries
 */
function getImageResponse(query: string): string {
  if (query.includes('add') || query.includes('insert')) {
    return `Here's how to add an image to your email template:

\`\`\`html
<!-- Basic image -->
<img src="https://example.com/your-image.jpg" alt="Description of image" style="display: block; max-width: 100%; height: auto; margin: 20px 0;">

<!-- Image with border and shadow -->
<img src="https://example.com/your-image.jpg" alt="Description of image" style="display: block; max-width: 100%; height: auto; margin: 20px 0; border: 1px solid #dddddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
\`\`\`

For email templates, make sure to:
1. Host images on a reliable server
2. Always include alt text
3. Set max-width: 100% for responsiveness
4. Use display: block to avoid unwanted spacing

Would you like me to suggest places in your template where images would be effective?`;
  }
  
  return `Images can significantly improve engagement in email templates. Here are some best practices:

1. Keep file sizes small (under 200KB per image)
2. Use alt text for all images
3. Make sure images are responsive
4. Don't rely solely on images (some clients block them by default)
5. Consider using background images sparingly

Would you like me to help you implement images in your template?`;
}

/**
 * Get a response for button-related queries
 */
function getButtonResponse(query: string): string {
  if (query.includes('add') || query.includes('insert') || query.includes('create')) {
    return `Here's how to add a call-to-action button to your email template:

\`\`\`html
<!-- Simple button -->
<a href="https://example.com" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center; margin: 20px 0;">Click Here</a>

<!-- Button with hover effect (works in some email clients) -->
<a href="https://example.com" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center; margin: 20px 0; mso-line-height-rule: exactly; line-height: 100%;">
  <span style="mso-text-raise: 15pt;">Click Here</span>
</a>
\`\`\`

For maximum compatibility, buttons should be built with HTML and CSS rather than images. Would you like me to help you position this button somewhere specific in your template?`;
  }
  
  return `Call-to-action buttons are critical for email engagement. Here are some tips:

1. Use contrasting colors that stand out
2. Keep button text short and action-oriented (e.g., "Shop Now", "Learn More")
3. Make buttons large enough for mobile tapping (at least 44px tall)
4. Position buttons where they're easily seen
5. Use HTML/CSS buttons rather than images

Would you like me to help you create a specific button for your template?`;
}

/**
 * Get a response for footer-related queries
 */
function getFooterResponse(query: string): string {
  if (query.includes('add') || query.includes('update') || query.includes('modify')) {
    return `Here's how to create a professional footer for your email template:

\`\`\`html
<div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
  <p style="margin: 0 0 10px;">© 2025 Your Company Name. All rights reserved.</p>
  <p style="margin: 0 0 10px;">123 Street Address, City, Country</p>
  <p style="margin: 0 0 10px;">
    <a href="mailto:contact@example.com" style="color: #4f46e5; text-decoration: none;">contact@example.com</a> | 
    <a href="tel:+11234567890" style="color: #4f46e5; text-decoration: none;">+1 (123) 456-7890</a>
  </p>
  <p style="margin: 0;">
    <a href="#" style="display: inline-block; margin: 0 5px; color: #4f46e5;">Unsubscribe</a> | 
    <a href="#" style="display: inline-block; margin: 0 5px; color: #4f46e5;">Privacy Policy</a>
  </p>
</div>
\`\`\`

Remember to include legally required elements like your physical address and an unsubscribe link. Would you like me to customize this footer for your specific needs?`;
  }
  
  return `Email footers are important for both legal compliance and user experience. A good footer should include:

1. Company name and contact information
2. Physical address (required by law in many countries)
3. Unsubscribe link (legally required)
4. Privacy policy link
5. Social media links (optional)
6. Copyright notice

Would you like me to help you create a compliant and professional footer for your template?`;
}

/**
 * Get a response for layout-related queries
 */
function getLayoutResponse(query: string): string {
  if (query.includes('change') || query.includes('improve') || query.includes('fix')) {
    return `To improve the layout of your email template, consider this structure:

\`\`\`html
<table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f5f5f5">
  <tr>
    <td style="padding: 20px;">
      <table width="100%" cellspacing="0" cellpadding="0" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color: #4f46e5; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Email Title</h1>
          </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
          <td style="padding: 30px 20px;">
            <p>Your content here...</p>
          </td>
        </tr>
        
        <!-- Call to Action -->
        <tr>
          <td style="padding: 0 20px 30px; text-align: center;">
            <a href="#" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">Click Here</a>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
            <p style="margin: 0;">Footer content here</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
\`\`\`

This nested table structure is more reliable across email clients. Would you like me to help you implement this structure in your template?`;
  }
  
  return `Email layout is crucial for compatibility across email clients. Here are some best practices:

1. Use tables for layout (div-based layouts can break in some clients)
2. Keep width to 600px maximum
3. Use a single-column layout for mobile compatibility
4. Break content into distinct sections
5. Use proper spacing between elements
6. Include plenty of white space

Would you like me to suggest a specific layout improvement for your template?`;
}

/**
 * Get a response for responsive design queries
 */
function getResponsiveResponse(query: string): string {
  if (query.includes('make') || query.includes('create') || query.includes('convert')) {
    return `To make your email template responsive, add these meta tags and use this approach:

\`\`\`html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Email Subject</title>
  <!--[if !mso]><!-->
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--<![endif]-->
</head>
\`\`\`

Then for responsive elements:

\`\`\`html
<!-- For images -->
<img src="image.jpg" alt="Description" style="display: block; width: 100%; max-width: 600px; height: auto;">

<!-- For text -->
<p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">Your text content here</p>

<!-- For two-column layouts that stack on mobile -->
<table width="100%" cellspacing="0" cellpadding="0">
  <tr>
    <td style="padding: 10px;" valign="top">
      <!-- Left column -->
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>Column 1 content</td>
        </tr>
      </table>
    </td>
    <td style="padding: 10px;" valign="top">
      <!-- Right column -->
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td>Column 2 content</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
\`\`\`

Would you like me to help implement these responsive techniques in your specific template?`;
  }
  
  return `Making email templates responsive is essential since over 60% of emails are opened on mobile devices. Here are key principles:

1. Use a single-column layout when possible
2. Set images to max-width: 100%
3. Use large enough font sizes (min 14px for body text)
4. Make buttons at least 44px tall for easy tapping
5. Keep your design simple
6. Test on multiple devices and email clients

Would you like specific advice on making your template more responsive?`;
}

/**
 * Get a response for background-related queries
 */
function getBackgroundResponse(query: string): string {
  if (query.includes('change') || query.includes('add') || query.includes('update')) {
    return `Here's how to update the background in your email template:

\`\`\`html
<!-- For the entire email background -->
<table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f5f5f5">
  <tr>
    <td style="padding: 20px;">
      <!-- Your content table here -->
    </td>
  </tr>
</table>

<!-- For a section background -->
<table width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; overflow: hidden;">
  <tr>
    <td style="padding: 30px 20px; background-color: #f2f6ff;">
      <!-- Section content here -->
    </td>
  </tr>
</table>

<!-- For a background image (has limited support) -->
<td background="https://example.com/bg-image.jpg" bgcolor="#333333" style="background-image: url('https://example.com/bg-image.jpg'); background-position: center; background-repeat: no-repeat; background-size: cover; padding: 30px 20px;">
  <div style="color: #ffffff;">Content over background image</div>
</td>
\`\`\`

Note that background images have limited support in email clients, so always use a fallback background color. Would you like me to help implement a specific background change?`;
  }
  
  return `Backgrounds can enhance your email template's visual appeal, but should be used carefully:

1. Use light backgrounds for readability
2. Solid colors are most reliable across email clients
3. Background images have limited support
4. Always provide a fallback background color
5. Consider using different section backgrounds to create visual interest

Would you like me to suggest specific background improvements for your template?`;
}

/**
 * Get a generic response for any other query
 */
function getGenericResponse(query: string): string {
  const responses = [
    `I'd be happy to help with that. Could you be more specific about what changes you'd like to make to the template?`,
    
    `I can assist with modifying your email template. Here are some common improvements:
1. Updating colors and fonts
2. Adding or modifying sections
3. Improving the layout
4. Making it more responsive
5. Adding images or buttons

What specific changes would you like to make?`,
    
    `I can help you improve this email template. The key areas we could work on are:
- Visual design (colors, fonts, spacing)
- Content structure
- Call-to-action elements
- Mobile responsiveness
- Overall layout

Which area would you like to focus on first?`,
    
    `I can provide HTML code to modify your template. Before I do, could you clarify what specific aspect you'd like to change? For example:
- Header or footer design
- Color scheme
- Typography
- Layout structure
- Call-to-action buttons`
  ];
  
  // Return a random response
  return responses[Math.floor(Math.random() * responses.length)];
} 
 