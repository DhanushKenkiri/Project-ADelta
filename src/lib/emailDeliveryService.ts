/**
 * Email Delivery Service
 * This service handles sending emails via Web2 providers (Resend or MailerSend)
 */

import ipfsService from './ipfsService';
import { EmailContent } from './dMailService';

// Delivery provider types
export type EmailProvider = 'resend' | 'mailersend' | 'mock';

// Interface for email delivery request
export interface EmailDeliveryRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

// Provider configuration
interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  fromEmail: string;
  fromName: string;
}

// Email delivery service
class EmailDeliveryService {
  private provider: EmailProvider = 'mock';
  private config: Record<EmailProvider, ProviderConfig> = {
    resend: {
      apiKey: import.meta.env.VITE_RESEND_API_KEY || '',
      baseUrl: 'https://api.resend.com',
      fromEmail: 'noreply@hovermail.io',
      fromName: 'Hover Mail'
    },
    mailersend: {
      apiKey: import.meta.env.VITE_MAILERSEND_API_KEY || '',
      baseUrl: 'https://api.mailersend.com/v1',
      fromEmail: 'noreply@hovermail.io',
      fromName: 'Hover Mail'
    },
    mock: {
      apiKey: 'mock-api-key',
      baseUrl: 'https://mock-api.example.com',
      fromEmail: 'noreply@hovermail.io',
      fromName: 'Hover Mail (Mock)'
    }
  };

  /**
   * Set the email provider to use
   * @param provider Provider name
   */
  setProvider(provider: EmailProvider): void {
    this.provider = provider;
  }

  /**
   * Send an email
   * @param request Email delivery request
   * @returns Success status
   */
  async sendEmail(request: EmailDeliveryRequest): Promise<boolean> {
    console.log(`Sending email via ${this.provider} provider`);
    
    try {
      switch (this.provider) {
        case 'resend':
          return await this.sendViaResend(request);
        case 'mailersend':
          return await this.sendViaMailerSend(request);
        case 'mock':
        default:
          return this.sendViaMock(request);
      }
    } catch (error) {
      console.error(`Error sending email via ${this.provider}:`, error);
      return false;
    }
  }

  /**
   * Fetch a message from IPFS and send it via Web2 email
   * @param ipfsHash IPFS hash of the encrypted message
   * @param decryptionKey Key to decrypt the message
   * @param recipientEmail Recipient's email address
   * @returns Success status
   */
  async deliverFromIpfs(
    ipfsHash: string,
    decryptionKey: string,
    recipientEmail: string
  ): Promise<boolean> {
    try {
      // Retrieve and decrypt content from IPFS
      const decryptedContent = await ipfsService.retrieveEncryptedContent(
        ipfsHash,
        decryptionKey
      );
      
      // Parse the content
      const emailContent: EmailContent = JSON.parse(decryptedContent);
      
      // Check if HTML content is available
      let htmlContent = emailContent.htmlContent || '';
      
      // If no HTML content but we have body, convert to simple HTML
      if (!htmlContent && emailContent.body) {
        htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
                p { line-height: 1.5; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
              </style>
            </head>
            <body>
              <p>${emailContent.body.replace(/\n/g, '<br>')}</p>
              <div class="footer">
                <p>This email was delivered via dMail decentralized email service.</p>
                <p>Content was securely stored on IPFS with reference: ${ipfsHash}</p>
              </div>
            </body>
          </html>
        `;
      }
      
      // Prepare attachments
      const attachments = emailContent.attachments?.map(attachment => ({
        filename: attachment.name,
        content: attachment.content,
        contentType: attachment.type
      })) || [];
      
      // Create delivery request
      const request: EmailDeliveryRequest = {
        to: recipientEmail,
        subject: emailContent.subject,
        html: htmlContent,
        text: emailContent.body,
        attachments
      };
      
      // Send the email
      return await this.sendEmail(request);
    } catch (error) {
      console.error('Failed to deliver from IPFS:', error);
      return false;
    }
  }

  /**
   * Send email via Resend API
   * @param request Email delivery request
   * @returns Success status
   */
  private async sendViaResend(request: EmailDeliveryRequest): Promise<boolean> {
    try {
      const config = this.config.resend;
      
      if (!config.apiKey) {
        console.warn('Resend API key not configured. Falling back to mock provider.');
        return this.sendViaMock(request);
      }
      
      const response = await fetch(`${config.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: request.from || `${config.fromName} <${config.fromEmail}>`,
          to: request.to,
          subject: request.subject,
          html: request.html,
          text: request.text,
          reply_to: request.replyTo,
          attachments: request.attachments
        })
      });
      
      if (!response.ok) {
        throw new Error(`Resend API error: ${response.status}`);
      }
      
      const result = await response.json();
      return !!result.id;
    } catch (error) {
      console.error('Error sending via Resend:', error);
      return false;
    }
  }

  /**
   * Send email via MailerSend API
   * @param request Email delivery request
   * @returns Success status
   */
  private async sendViaMailerSend(request: EmailDeliveryRequest): Promise<boolean> {
    try {
      const config = this.config.mailersend;
      
      if (!config.apiKey) {
        console.warn('MailerSend API key not configured. Falling back to mock provider.');
        return this.sendViaMock(request);
      }
      
      const response = await fetch(`${config.baseUrl}/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: {
            email: config.fromEmail,
            name: config.fromName
          },
          to: [
            {
              email: request.to
            }
          ],
          subject: request.subject,
          html: request.html,
          text: request.text
        })
      });
      
      if (!response.ok) {
        throw new Error(`MailerSend API error: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending via MailerSend:', error);
      return false;
    }
  }

  /**
   * Send email via mock service (for development)
   * @param request Email delivery request
   * @returns Success status
   */
  private sendViaMock(request: EmailDeliveryRequest): boolean {
    console.log('MOCK EMAIL DELIVERY');
    console.log('-------------------');
    console.log(`To: ${request.to}`);
    console.log(`Subject: ${request.subject}`);
    console.log(`HTML Length: ${request.html.length} characters`);
    console.log(`Text: ${request.text?.substring(0, 100)}${request.text && request.text.length > 100 ? '...' : ''}`);
    console.log(`Attachments: ${request.attachments?.length || 0}`);
    console.log('-------------------');
    
    return true;
  }
}

// Create singleton instance
export const emailDeliveryService = new EmailDeliveryService();
export default emailDeliveryService; 