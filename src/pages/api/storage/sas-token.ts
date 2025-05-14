import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';

type ResponseData = {
  sasToken: string;
} | {
  error: string;
}

/**
 * API endpoint to generate a SAS token for secure access to Azure Blob Storage
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Check authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get Azure Storage credentials from environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

    if (!accountName || !accountKey) {
      return res.status(500).json({ error: 'Storage account configuration missing' });
    }

    // Create credentials object
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Set permissions and expiry time
    const permissions = new BlobSASPermissions();
    permissions.read = true;
    permissions.write = true;
    permissions.create = true;
    permissions.delete = true;
    permissions.list = true;

    // Token expires in 1 hour
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1);

    // Generate SAS token
    const sasToken = generateBlobSASQueryParameters({
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'templates',
      permissions,
      expiresOn: expiryTime,
    }, sharedKeyCredential).toString();

    // Return the SAS token
    return res.status(200).json({ sasToken: `?${sasToken}` });
  } catch (error) {
    console.error('Error generating SAS token:', error);
    return res.status(500).json({ error: 'Failed to generate SAS token' });
  }
} 