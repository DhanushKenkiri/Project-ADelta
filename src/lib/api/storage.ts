import { BlobServiceClient } from "@azure/storage-blob";

/**
 * Gets the SAS token for Azure Storage account from the app's API
 * @returns Promise with the SAS token string or null if failed
 */
export async function getStorageAccountSasToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/storage/sas-token');
    if (!response.ok) {
      throw new Error(`Failed to get SAS token: ${response.statusText}`);
    }
    const data = await response.json();
    return data.sasToken;
  } catch (error) {
    console.error("Error getting SAS token:", error);
    return null;
  }
}

/**
 * Tests connection to Azure Blob Storage
 * @returns Object with success status and message
 */
export async function testBlobStorageConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const sasToken = await getStorageAccountSasToken();
    
    if (!sasToken) {
      return { 
        success: false, 
        message: "Failed to get SAS token from API" 
      };
    }

    const storageAccountName = process.env.NEXT_PUBLIC_STORAGE_ACCOUNT_NAME || 
                              window.localStorage.getItem('storageAccountName');
    
    if (!storageAccountName) {
      return { 
        success: false, 
        message: "Storage account name not configured" 
      };
    }

    const blobServiceClient = new BlobServiceClient(
      `https://${storageAccountName}.blob.core.windows.net${sasToken}`
    );

    // Try to get service properties as a connection test
    await blobServiceClient.getProperties();
    
    return { 
      success: true, 
      message: "Successfully connected to Azure Blob Storage" 
    };
  } catch (error) {
    console.error("Error testing blob storage connection:", error);
    return { 
      success: false, 
      message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
} 