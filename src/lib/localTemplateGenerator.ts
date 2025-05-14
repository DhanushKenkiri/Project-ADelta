/**
 * Local HTML template generator
 * Provides pre-designed email templates based on user content
 * For local development/testing without API dependencies
 */

/**
 * Generate a basic email template based on the provided content
 * @param content User-provided email content
 * @returns HTML email template
 */
export function generateBasicTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f6f6f6; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #4f46e5; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Email Template</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 25px;">
      <p style="font-size: 16px; margin-top: 0;">Dear Recipient,</p>
      
      <div style="margin: 20px 0; color: #555555;">
        ${content}
      </div>
      
      <p style="margin-bottom: 0;">Best regards,</p>
      <p style="margin-top: 5px; font-weight: 600;">Your Name</p>
      
      <!-- Call to Action Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center;">Take Action</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
      <p style="margin: 0 0 10px;">Company Name Inc.</p>
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
  </div>
</body>
</html>`;
}

/**
 * Generate a modern newsletter template based on the provided content
 * @param content User-provided email content
 * @returns HTML email template
 */
export function generateNewsletterTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f9f9f9; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    <!-- Pre-header -->
    <div style="background-color: #333333; color: #ffffff; padding: 5px 20px; font-size: 12px; text-align: center;">
      <p style="margin: 0;">Your weekly newsletter - View Online</p>
    </div>
    
    <!-- Header -->
    <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #eeeeee;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #333333;">Weekly Newsletter</h1>
      <p style="margin-top: 5px; color: #777777; font-size: 14px;">The latest updates from our team</p>
    </div>
    
    <!-- Hero Section -->
    <div style="background-color: #f2f6ff; padding: 30px 25px; text-align: center;">
      <h2 style="margin-top: 0; color: #4f46e5; font-size: 24px;">This Week's Highlights</h2>
      <div style="margin: 20px 0; color: #555555; text-align: left;">
        ${content}
      </div>
      <a href="#" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center; margin-top: 20px;">Read More</a>
    </div>
    
    <!-- Features Section -->
    <div style="padding: 30px 25px;">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px; width: 33%; vertical-align: top; text-align: center;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #4f46e5;">Feature 1</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Brief description of the first feature goes here.</p>
            </div>
          </td>
          <td style="padding: 10px; width: 33%; vertical-align: top; text-align: center;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #4f46e5;">Feature 2</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Brief description of the second feature goes here.</p>
            </div>
          </td>
          <td style="padding: 10px; width: 33%; vertical-align: top; text-align: center;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #4f46e5;">Feature 3</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Brief description of the third feature goes here.</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #333333; padding: 30px 25px; color: #ffffff; text-align: center; font-size: 12px;">
      <p style="margin: 0 0 10px;">© 2025 Company Name. All rights reserved.</p>
      <p style="margin: 0 0 20px;">You are receiving this email because you subscribed to our newsletter.</p>
      <div>
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ffffff; text-decoration: none; border-bottom: 1px solid #ffffff;">Unsubscribe</a> | 
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ffffff; text-decoration: none; border-bottom: 1px solid #ffffff;">Preferences</a> | 
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ffffff; text-decoration: none; border-bottom: 1px solid #ffffff;">View Online</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a promotional email template based on the provided content
 * @param content User-provided email content
 * @returns HTML email template
 */
export function generatePromotionalTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f0f0f0; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #ff5722; color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 700;">SPECIAL OFFER</h1>
      <p style="margin-top: 10px; margin-bottom: 0; font-size: 18px;">Limited Time Only!</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 25px; text-align: center;">
      <h2 style="color: #ff5722; font-size: 26px; margin-top: 0;">Exclusive Deal For You</h2>
      
      <div style="margin: 25px 0; color: #555555; text-align: left; padding: 0 15px;">
        ${content}
      </div>
      
      <!-- Promotion Box -->
      <div style="background-color: #fff8f0; border: 2px dashed #ff5722; padding: 20px; margin: 30px 0; border-radius: 6px;">
        <h3 style="margin-top: 0; color: #ff5722; font-size: 24px;">GET 25% OFF</h3>
        <p style="margin-bottom: 15px; font-size: 16px;">Use code: <strong>SPECIAL25</strong></p>
        <p style="margin-bottom: 0; font-size: 14px; color: #777777;">Valid until December 31, 2025</p>
      </div>
      
      <!-- CTA Button -->
      <a href="#" style="display: inline-block; background-color: #ff5722; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 18px; margin-top: 10px;">SHOP NOW</a>
    </div>
    
    <!-- Product Highlights -->
    <div style="padding: 0 25px 30px; text-align: center;">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px; width: 50%; vertical-align: top; text-align: center;">
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #333333; font-size: 18px;">Product 1</h3>
              <p style="margin-bottom: 10px; font-size: 14px;">Short description of this amazing product.</p>
              <p style="margin-bottom: 0;"><strong style="color: #ff5722; font-size: 18px;">$49.99</strong> <span style="text-decoration: line-through; color: #999999;">$69.99</span></p>
            </div>
          </td>
          <td style="padding: 10px; width: 50%; vertical-align: top; text-align: center;">
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #333333; font-size: 18px;">Product 2</h3>
              <p style="margin-bottom: 10px; font-size: 14px;">Short description of this amazing product.</p>
              <p style="margin-bottom: 0;"><strong style="color: #ff5722; font-size: 18px;">$39.99</strong> <span style="text-decoration: line-through; color: #999999;">$59.99</span></p>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #333333; padding: 20px; text-align: center; font-size: 12px; color: #ffffff;">
      <p style="margin: 0 0 10px;">© 2025 Company Name. All rights reserved.</p>
      <p style="margin: 0 0 10px;">123 Street Address, City, Country</p>
      <p style="margin: 0 0 15px;">
        <a href="mailto:contact@example.com" style="color: #ff9980; text-decoration: none;">contact@example.com</a> | 
        <a href="tel:+11234567890" style="color: #ff9980; text-decoration: none;">+1 (123) 456-7890</a>
      </p>
      <p style="margin: 0;">
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ff9980;">Unsubscribe</a> | 
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ff9980;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a template based on the user content and a random template style
 * @param content User-provided email content
 * @returns HTML template
 */
export function generateRandomTemplate(content: string): string {
  const templates = [
    generateBasicTemplate,
    generateNewsletterTemplate,
    generatePromotionalTemplate
  ];
  
  // Select a random template function
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex](content);
} 
 * Local HTML template generator
 * Provides pre-designed email templates based on user content
 * For local development/testing without API dependencies
 */

/**
 * Generate a basic email template based on the provided content
 * @param content User-provided email content
 * @returns HTML email template
 */
export function generateBasicTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f6f6f6; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #4f46e5; color: #ffffff; padding: 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Email Template</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 25px;">
      <p style="font-size: 16px; margin-top: 0;">Dear Recipient,</p>
      
      <div style="margin: 20px 0; color: #555555;">
        ${content}
      </div>
      
      <p style="margin-bottom: 0;">Best regards,</p>
      <p style="margin-top: 5px; font-weight: 600;">Your Name</p>
      
      <!-- Call to Action Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center;">Take Action</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
      <p style="margin: 0 0 10px;">Company Name Inc.</p>
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
  </div>
</body>
</html>`;
}

/**
 * Generate a modern newsletter template based on the provided content
 * @param content User-provided email content
 * @returns HTML email template
 */
export function generateNewsletterTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f9f9f9; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    <!-- Pre-header -->
    <div style="background-color: #333333; color: #ffffff; padding: 5px 20px; font-size: 12px; text-align: center;">
      <p style="margin: 0;">Your weekly newsletter - View Online</p>
    </div>
    
    <!-- Header -->
    <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #eeeeee;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #333333;">Weekly Newsletter</h1>
      <p style="margin-top: 5px; color: #777777; font-size: 14px;">The latest updates from our team</p>
    </div>
    
    <!-- Hero Section -->
    <div style="background-color: #f2f6ff; padding: 30px 25px; text-align: center;">
      <h2 style="margin-top: 0; color: #4f46e5; font-size: 24px;">This Week's Highlights</h2>
      <div style="margin: 20px 0; color: #555555; text-align: left;">
        ${content}
      </div>
      <a href="#" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; text-align: center; margin-top: 20px;">Read More</a>
    </div>
    
    <!-- Features Section -->
    <div style="padding: 30px 25px;">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px; width: 33%; vertical-align: top; text-align: center;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #4f46e5;">Feature 1</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Brief description of the first feature goes here.</p>
            </div>
          </td>
          <td style="padding: 10px; width: 33%; vertical-align: top; text-align: center;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #4f46e5;">Feature 2</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Brief description of the second feature goes here.</p>
            </div>
          </td>
          <td style="padding: 10px; width: 33%; vertical-align: top; text-align: center;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #4f46e5;">Feature 3</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Brief description of the third feature goes here.</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #333333; padding: 30px 25px; color: #ffffff; text-align: center; font-size: 12px;">
      <p style="margin: 0 0 10px;">© 2025 Company Name. All rights reserved.</p>
      <p style="margin: 0 0 20px;">You are receiving this email because you subscribed to our newsletter.</p>
      <div>
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ffffff; text-decoration: none; border-bottom: 1px solid #ffffff;">Unsubscribe</a> | 
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ffffff; text-decoration: none; border-bottom: 1px solid #ffffff;">Preferences</a> | 
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ffffff; text-decoration: none; border-bottom: 1px solid #ffffff;">View Online</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a promotional email template based on the provided content
 * @param content User-provided email content
 * @returns HTML email template
 */
export function generatePromotionalTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f0f0f0; color: #333333;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="background-color: #ff5722; color: #ffffff; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 32px; font-weight: 700;">SPECIAL OFFER</h1>
      <p style="margin-top: 10px; margin-bottom: 0; font-size: 18px;">Limited Time Only!</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 25px; text-align: center;">
      <h2 style="color: #ff5722; font-size: 26px; margin-top: 0;">Exclusive Deal For You</h2>
      
      <div style="margin: 25px 0; color: #555555; text-align: left; padding: 0 15px;">
        ${content}
      </div>
      
      <!-- Promotion Box -->
      <div style="background-color: #fff8f0; border: 2px dashed #ff5722; padding: 20px; margin: 30px 0; border-radius: 6px;">
        <h3 style="margin-top: 0; color: #ff5722; font-size: 24px;">GET 25% OFF</h3>
        <p style="margin-bottom: 15px; font-size: 16px;">Use code: <strong>SPECIAL25</strong></p>
        <p style="margin-bottom: 0; font-size: 14px; color: #777777;">Valid until December 31, 2025</p>
      </div>
      
      <!-- CTA Button -->
      <a href="#" style="display: inline-block; background-color: #ff5722; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 18px; margin-top: 10px;">SHOP NOW</a>
    </div>
    
    <!-- Product Highlights -->
    <div style="padding: 0 25px 30px; text-align: center;">
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px; width: 50%; vertical-align: top; text-align: center;">
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #333333; font-size: 18px;">Product 1</h3>
              <p style="margin-bottom: 10px; font-size: 14px;">Short description of this amazing product.</p>
              <p style="margin-bottom: 0;"><strong style="color: #ff5722; font-size: 18px;">$49.99</strong> <span style="text-decoration: line-through; color: #999999;">$69.99</span></p>
            </div>
          </td>
          <td style="padding: 10px; width: 50%; vertical-align: top; text-align: center;">
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #333333; font-size: 18px;">Product 2</h3>
              <p style="margin-bottom: 10px; font-size: 14px;">Short description of this amazing product.</p>
              <p style="margin-bottom: 0;"><strong style="color: #ff5722; font-size: 18px;">$39.99</strong> <span style="text-decoration: line-through; color: #999999;">$59.99</span></p>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #333333; padding: 20px; text-align: center; font-size: 12px; color: #ffffff;">
      <p style="margin: 0 0 10px;">© 2025 Company Name. All rights reserved.</p>
      <p style="margin: 0 0 10px;">123 Street Address, City, Country</p>
      <p style="margin: 0 0 15px;">
        <a href="mailto:contact@example.com" style="color: #ff9980; text-decoration: none;">contact@example.com</a> | 
        <a href="tel:+11234567890" style="color: #ff9980; text-decoration: none;">+1 (123) 456-7890</a>
      </p>
      <p style="margin: 0;">
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ff9980;">Unsubscribe</a> | 
        <a href="#" style="display: inline-block; margin: 0 5px; color: #ff9980;">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a template based on the user content and a random template style
 * @param content User-provided email content
 * @returns HTML template
 */
export function generateRandomTemplate(content: string): string {
  const templates = [
    generateBasicTemplate,
    generateNewsletterTemplate,
    generatePromotionalTemplate
  ];
  
  // Select a random template function
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex](content);
} 
 