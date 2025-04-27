import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { list } from '@vercel/blob';

type ResponseData = {
  success: boolean;
  message: string;
}

/**
 * API endpoint to test connection to Vercel Blob Storage
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    // Check authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check for Vercel Blob configuration
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!blobToken) {
      return res.status(500).json({ 
        success: false, 
        message: 'BLOB_READ_WRITE_TOKEN environment variable is missing'
      });
    }

    // Test the connection by listing blobs
    await list();

    return res.status(200).json({
      success: true,
      message: 'Successfully connected to Vercel Blob Storage'
    });
  } catch (error) {
    console.error('Error testing Vercel Blob storage connection:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to connect to Vercel Blob Storage: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
} 