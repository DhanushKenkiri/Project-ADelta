/**
 * Template utilities for loading and managing email templates
 */

import { loadTemplateContent, validateThumbnail } from './templateLoader';
import { getImageUrl } from './assetLoader';
import path from 'path';
import { promises as fs } from 'fs';
import { 
  getUserTemplates,
  getTemplateById as getSupabaseTemplateById,
  saveTemplate,
  updateTemplate,
  deleteTemplate
} from '@/services/templateStorageService';

// Template interface
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  htmlContent?: string;
  filePath?: string; // Path to the HTML file
}

// Template category interface
export interface TemplateCategory {
  id: string;
  name: string;
}

// Template categories
export const templateCategories: TemplateCategory[] = [
  { id: 'all', name: 'All templates' },
  { id: 'onboarding', name: 'Onboarding' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'woocommerce', name: 'WooCommerce' },
  { id: 'security', name: 'Security' },
  { id: 'ecommerce', name: 'E-Commerce' }
];

// Function to convert filename to readable name
function fileNameToReadableName(fileName: string): string {
  const nameWithoutExtension = fileName.replace(/\.html$/, '');
  
  if (nameWithoutExtension.startsWith('index')) {
    const indexNum = nameWithoutExtension.replace('index', '').trim();
    return `Template ${indexNum || '1'}`;
  }
  
  return nameWithoutExtension
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Function to categorize template based on name/content
function categorizeTemplate(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('welcome') || lowerName.includes('onboard')) {
    return 'onboarding';
  } else if (lowerName.includes('notif') || lowerName.includes('alert')) {
    return 'notifications';
  } else if (lowerName.includes('password') || lowerName.includes('security') || lowerName.includes('verify')) {
    return 'security';
  } else if (lowerName.includes('commerce') || lowerName.includes('order') || lowerName.includes('invoice') || 
             lowerName.includes('receipt') || lowerName.includes('product')) {
    return 'ecommerce';
  } else if (lowerName.includes('woo')) {
    return 'woocommerce';
  } else {
    // Default category
    return 'all';
  }
}

// Available thumbnail images in the public/templates/images directory
const availableThumbnails = [
  'work-1.jpg',
  'work-2.jpg',
  'work-3.jpg',
  'work-4.jpg',
  'work-5.jpg',
  'work-6.jpg',
  'work-7.jpg',
  'work-8.jpg',
  'product-1.jpg',
  'product-2.jpg',
  'product-3.jpg',
  'product-4.jpg',
  'product-5.jpg',
  'product-6.jpg',
  'destination-1.jpg',
  'destination-2.jpg',
  'destination-3.jpg',
  'destination-4.jpg',
  'destination-5.jpg',
  'destination-6.jpg',
  'destination-7.jpg',
  'destination-8.jpg',
  'person_1.jpg',
  'person_2.jpg',
  'person_3.jpg',
  'about.jpg',
  'about-2.jpg',
  'blog-1.jpg',
  'blog-2.jpg',
  // Include all image files from the images directory
];

// Generate template thumbnails
function getTemplateThumbnail(templateName: string): string {
  const baseFileName = templateName.replace(/\.html$/, '').toLowerCase();
  
  // Map for specific templates
  const thumbnailMap: Record<string, string> = {
    'invoice': 'work-1.jpg',
    'welcome': 'work-2.jpg',
    'newsletter': 'work-3.jpg',
    'receipt': 'work-4.jpg',
    'password': 'work-5.jpg',
    'order': 'work-6.jpg',
    'email': 'work-7.jpg',
    'template': 'work-8.jpg',
    'product': 'product-1.jpg',
    'promo': 'product-2.jpg',
    'offer': 'product-3.jpg',
    'sale': 'product-4.jpg',
    'discount': 'product-5.jpg',
    'black-friday': 'product-6.jpg',
    'christmas': 'destination-1.jpg',
    'holiday': 'destination-2.jpg',
    'travel': 'destination-3.jpg',
  };
  
  // Check for direct matches
  for (const [key, thumbnail] of Object.entries(thumbnailMap)) {
    if (baseFileName.includes(key)) {
      return `/templates/images/${thumbnail}`;
    }
  }
  
  // Assign one of the available thumbnails based on a hash of the template name
  const hash = baseFileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % availableThumbnails.length;
  return `/templates/images/${availableThumbnails[index]}`;
}

// Function to discover all HTML templates in the public/templates directory
async function discoverTemplateFiles(): Promise<string[]> {
  try {
    console.log('Attempting to discover template files...');
    
    // In browser environment, fetch the directory listing
    const response = await fetch('/templates?list');
    console.log('Template listing API response status:', response.status);
    
    if (response.ok) {
      // Check content type to ensure it's JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const fileList = await response.json();
          console.log(`Discovered ${fileList.length} template files:`, fileList);
          return fileList.filter((file: string) => file.endsWith('.html'));
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          console.log('Response was not valid JSON, falling back to static list');
          return staticTemplateFiles;
        }
      } else {
        console.warn('Response is not JSON (content-type:', contentType, ')');
        console.log('Falling back to static template list due to incorrect content type');
        return staticTemplateFiles;
      }
    } else {
      console.error('Failed to fetch template list:', await response.text());
      console.log('Falling back to static template list due to failed response');
      return staticTemplateFiles;
    }
  } catch (error) {
    console.error('Error discovering template files:', error);
    // Fallback to static list
    console.log('Falling back to static template list due to error');
    return staticTemplateFiles;
  }
}

// Static list of template files (fallback)
const staticTemplateFiles = [
  // HTML templates that we want to keep
  'newsletter.html',
  'welcom-email.html',
  'black-friday.html',
  'card.html',
  'christmas.html',
  'happy-new-year.html',
  'onepage.html',
  'proof.html',
  'reactivation-email.html',
  'real-estate.html',
  'reciept-email.html',
  'referral-email.html',
  'sphero-droids.html',
  'sphero-mini.html',
  'startwars.html',
  'ticketshop.html',
  'ugg-royale.html',
  'uoh1.html',
  'uoh2.html',
  'worldly.html',
  'arturia.html',
  'sample.html',
  'index.html',
  'index (2).html',
  'index (3).html',
  'index (4).html',
  'index (5).html',
  'index (6).html',
  'index (7).html',
  'index (8).html',
  'index (9).html',
  'index (10).html',
  'index (11).html',
  'index (12).html',
  'index (13).html',
  'index (14).html',
  'index (15).html',
  'index (16).html',
  'index (17).html',
  'index (18).html',
  'index (19).html',
];

// Check available templates in the public folder
let discoveredTemplates: string[] = [];

// Function to create templates from the template files
export async function getTemplatesFromPublicFolder(): Promise<Template[]> {
  // Make sure we've discovered templates (if not already)
  if (discoveredTemplates.length === 0) {
    discoveredTemplates = await discoverTemplateFiles();
  }
  
  return discoveredTemplates.map(fileName => {
    const name = fileNameToReadableName(fileName);
    const category = categorizeTemplate(name);
    const thumbnailUrl = getTemplateThumbnail(fileName);
    
    return {
      id: fileName.replace('.html', ''),
      name,
      description: `${name} email template`,
      category,
      thumbnailUrl,
      filePath: `/templates/${fileName}`
    };
  });
}

// Sample templates with predefined content
const predefinedTemplates: Template[] = [
  {
    id: 'invoice',
    name: 'Invoice',
    description: 'A clean invoice template for your customers',
    category: 'ecommerce',
    thumbnailUrl: '/templates/images/work-1.jpg',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice Template</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .invoice-details { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    .total { font-weight: bold; text-align: right; margin-top: 20px; }
    .footer { margin-top: 30px; text-align: center; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice</h1>
      <p>Invoice #: INV-001</p>
      <p>Date: April 18, 2025</p>
    </div>
    <div class="invoice-details">
      <div>
        <strong>Billed To:</strong>
        <p>Customer Name<br>
        123 Customer Street<br>
        Customer City, State 12345</p>
      </div>
      <div>
        <strong>From:</strong>
        <p>Your Company Name<br>
        123 Business Street<br>
        Business City, State 12345</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Product 1</td>
          <td>2</td>
          <td>$50.00</td>
          <td>$100.00</td>
        </tr>
        <tr>
          <td>Product 2</td>
          <td>1</td>
          <td>$75.00</td>
          <td>$75.00</td>
        </tr>
      </tbody>
    </table>
    <div class="total">
      <p>Subtotal: $175.00</p>
      <p>Tax (10%): $17.50</p>
      <p>Total: $192.50</p>
    </div>
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Payment due within 30 days.</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'Welcome new users to your platform',
    category: 'onboarding',
    thumbnailUrl: '/templates/images/work-2.jpg',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome Email</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { text-align: center; padding: 20px; }
    .content { padding: 20px; }
    .footer { margin-top: 30px; text-align: center; color: #777; font-size: 12px; padding: 20px; }
    .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Our Platform!</h1>
    </div>
    <div class="content">
      <p>Hello {{name}},</p>
      <p>We're excited to have you on board. Thank you for joining our platform.</p>
      <p>Here are a few things you can do to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Explore our features</li>
        <li>Connect with other users</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="#" class="button">Get Started</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Your Company Name. All rights reserved.</p>
      <p>You're receiving this email because you signed up for our platform.</p>
    </div>
  </div>
</body>
</html>`
  }
];

// Combined templates from predefined and public folder
let cachedTemplates: Template[] | null = null;

// Function to clear template cache
export function clearTemplateCache() {
  cachedTemplates = null;
  discoveredTemplates = [];
  console.log('Template cache cleared');
}

export async function getAllTemplates(): Promise<Template[]> {
  if (cachedTemplates) {
    return cachedTemplates;
  }
  
  const folderTemplates = await getTemplatesFromPublicFolder();
  cachedTemplates = [...predefinedTemplates, ...folderTemplates];
  return cachedTemplates;
}

// Function to get template by ID
export async function getTemplateById(id: string): Promise<Template | null> {
  // First check if it's in our predefined templates
  const predefinedTemplate = predefinedTemplates.find(t => t.id === id);
  if (predefinedTemplate) {
    return predefinedTemplate;
  }
  
  // Then check the public folder templates
  const allTemplates = await getAllTemplates();
  const template = allTemplates.find(t => t.id === id);
  
  if (template) {
    // If we have a file path, try to load the actual content
    if (template.filePath) {
      try {
        const content = await loadTemplateContent(template.filePath);
        return {
          ...template,
          htmlContent: content
        };
      } catch (error) {
        console.error(`Error loading template content for ${id}:`, error);
        return template; // Return template without content
      }
    }
    return template;
  }
  
  return null;
}

// Function to get templates by category
export async function getTemplatesByCategory(category: string): Promise<Template[]> {
  const allTemplates = await getAllTemplates();
  
  if (category === 'all') {
    return allTemplates;
  }
  
  return allTemplates.filter(template => template.category === category);
}

// Function to search templates
export async function searchTemplates(query: string): Promise<Template[]> {
  const allTemplates = await getAllTemplates();
  
  if (!query) {
    return allTemplates;
  }
  
  const lowerQuery = query.toLowerCase();
  return allTemplates.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) || 
    template.description.toLowerCase().includes(lowerQuery)
  );
}

// Function to get template ID from URL
export function getTemplateIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlPath = window.location.pathname;
  const segments = urlPath.split('/');
  
  // Check if we are on a template detail page
  if (segments.length >= 3 && segments[1] === 'template') {
    return segments[2];
  }
  
  return null;
}

// For backward compatibility
export const sampleTemplates = predefinedTemplates;

// Save template to Supabase
export async function saveTemplateToStorage(
  name: string,
  htmlContent: string,
  description: string = '',
  category: string = 'general',
  thumbnailImage?: File
): Promise<{ success: boolean; template?: Template; error?: any }> {
  try {
    const result = await saveTemplate(name, htmlContent, description, category, thumbnailImage);
    
    if (result.success && result.template) {
      // Clear cache to ensure we get the latest templates next time
      clearTemplateCache();
      
      return {
        success: true,
        template: {
          id: result.template.id,
          name: result.template.name,
          description: result.template.description,
          category: result.template.category,
          thumbnailUrl: result.template.thumbnailUrl,
          htmlContent: htmlContent
        }
      };
    }
    
    return { success: false, error: result.error };
  } catch (error) {
    console.error('Error saving template to Supabase:', error);
    return { success: false, error };
  }
}

// Update template in Supabase
export async function updateTemplateInStorage(
  templateId: string,
  updates: {
    name?: string;
    htmlContent?: string;
    description?: string;
    category?: string;
    thumbnailImage?: File;
  }
): Promise<{ success: boolean; template?: Template; error?: any }> {
  try {
    const result = await updateTemplate(templateId, updates);
    
    if (result.success && result.template) {
      // Clear cache to ensure we get the latest templates next time
      clearTemplateCache();
      
      return {
        success: true,
        template: {
          id: result.template.id,
          name: result.template.name,
          description: result.template.description,
          category: result.template.category,
          thumbnailUrl: result.template.thumbnailUrl,
          htmlContent: updates.htmlContent
        }
      };
    }
    
    return { success: false, error: result.error };
  } catch (error) {
    console.error('Error updating template in Supabase:', error);
    return { success: false, error };
  }
}

// Delete template from Supabase
export async function deleteTemplateFromStorage(
  templateId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const result = await deleteTemplate(templateId);
    
    if (result.success) {
      // Clear cache to ensure we get the latest templates next time
      clearTemplateCache();
      
      return { success: true };
    }
    
    return { success: false, error: result.error };
  } catch (error) {
    console.error('Error deleting template from Supabase:', error);
    return { success: false, error };
  }
} 