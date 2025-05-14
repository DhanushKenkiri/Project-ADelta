import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { BlobServiceClient } from '@azure/storage-blob';
import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  success: boolean;
  message: string;
  url?: string;
}

/**
 * API endpoint to upload a file to Azure Blob Storage
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

    // Get storage account details from environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'user-uploads';
    
    if (!accountName || !accountKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'Storage account configuration missing'
      });
    }

    // Parse the multipart form data
    const form = new formidable.IncomingForm();
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Get the file
    const file = files.file as formidable.File;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Create the BlobServiceClient object
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
    );

    // Get a reference to the container
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Create the container if it doesn't exist
    await containerClient.createIfNotExists({
      access: 'blob'
    });

    // Create a unique name for the blob
    const blobName = `${Date.now()}-${file.originalFilename?.replace(/\s+/g, '-')}`;
    
    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file to blob storage
    const fileBuffer = fs.readFileSync(file.filepath);
    const readableStream = Readable.from(fileBuffer);
    
    await blockBlobClient.uploadStream(
      readableStream,
      undefined,
      undefined,
      {
        blobHTTPHeaders: {
          blobContentType: file.mimetype || 'application/octet-stream'
        }
      }
    );

    // Get the URL of the uploaded blob
    const blobUrl = blockBlobClient.url;

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url: blobUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
} 