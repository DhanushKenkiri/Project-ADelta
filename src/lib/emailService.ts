import dMailService, { EmailContent } from './dMailService';
import emailDeliveryService, { EmailDeliveryRequest } from './emailDeliveryService';
import walletService from './walletService';
import { generateEncryptionKey } from './cryptoService';

export interface SendOptions {
  useDecentralized?: boolean;
  storeOnIPFS?: boolean;
  useMicropayment?: boolean;
  paymentAmount?: string;
  paymentAsset?: string;
  web2Delivery?: boolean;
}

export async function sendTemplateEmail(
  to: string,
  subject: string,
  htmlContent: string,
  options?: SendOptions
): Promise<{ success: boolean; ipfsHash?: string; }> {
  console.log(`Sending email to ${to} with subject: ${subject}`);
  console.log(`Options:`, options);
  
  try {
    if (options?.useDecentralized) {
      if (!walletService.isConnected()) {
        console.log('Connecting to wallet for decentralized email...');
        await walletService.connect();
      }
      
      const encryptionKey = generateEncryptionKey();
      
      const emailContent: EmailContent = {
        subject,
        body: extractTextFromHtml(htmlContent),
        htmlContent,
        recipient: to,
      };
      
      const result = await dMailService.sendEmail(emailContent, to, {
        encryptionKey,
        useMicropayment: options.useMicropayment,
        paymentAmount: options.paymentAmount,
        paymentAsset: options.paymentAsset,
        isWeb2Delivery: options.web2Delivery
      });
      
      return {
        success: result.success,
        ipfsHash: result.ipfsHash
      };
    } else {
      console.log('Simulating email sending - in production this would actually send an email.');
      
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML length: ${htmlContent.length} characters`);
      
      const delivery: EmailDeliveryRequest = {
        to,
        subject,
        html: htmlContent,
        from: 'noreply@hovermail.io',
      };
      
      const sent = await emailDeliveryService.sendEmail(delivery);
      return { success: sent };
    }
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false };
  }
}

export async function sendHybridEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; ipfsHash?: string; }> {
  return sendTemplateEmail(to, subject, htmlContent, {
    useDecentralized: true,
    storeOnIPFS: true,
    web2Delivery: true
  });
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}