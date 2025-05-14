import { NextApiRequest, NextApiResponse } from 'next';
import { getTemplateById } from '@/lib/templateUtils'; 
import puppeteer from 'puppeteer';

/**
 * Generate a thumbnail for a template
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { template: templateId } = req.query;
    
    if (!templateId || typeof templateId !== 'string') {
      return res.status(400).json({ error: 'Missing template ID' });
    }
    
    // Get template content
    const template = await getTemplateById(templateId);
    
    if (!template || !template.htmlContent) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    
    // Set viewport for a good thumbnail size (16:9 aspect ratio)
    await page.setViewport({
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
    });
    
    // Load HTML content into the page
    await page.setContent(template.htmlContent, {
      waitUntil: 'networkidle0',
    });
    
    // Take a screenshot
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 80,
      fullPage: false,
    });
    
    // Close browser
    await browser.close();
    
    // Return the image
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(screenshot);
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
} 