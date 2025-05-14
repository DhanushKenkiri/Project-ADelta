# Setting Up Vercel Blob Storage

This project uses Vercel Blob Storage for storing files and assets. Follow these steps to set it up in your development environment.

## Prerequisites

- A Vercel account
- The project deployed on Vercel, or ready to be deployed
- Node.js and npm installed locally

## Steps to Configure Vercel Blob Storage

### 1. Create a Storage on Vercel Dashboard

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project or create a new one
3. Go to the "Storage" tab
4. Select "Blob" and follow the prompts to create a new Blob storage

### 2. Generate a BLOB_READ_WRITE_TOKEN

1. In the Vercel dashboard, go to your project's "Storage" tab
2. Select your Blob storage
3. Click on "Create Token"
4. Choose "Read & Write" permissions
5. Name your token (e.g., "Local Development")
6. Copy the generated token

### 3. Configure Your Local Environment

Create a `.env.local` file in your project root (if it doesn't exist) and add the following:

```
BLOB_READ_WRITE_TOKEN=your_token_here
```

Replace `your_token_here` with the token you copied from the Vercel dashboard.

### 4. Configure Your Vercel Project Environment

1. In the Vercel dashboard, go to your project's "Settings" tab
2. Select "Environment Variables"
3. Add a new variable with the name `BLOB_READ_WRITE_TOKEN` and paste your token as the value
4. Save your changes
5. Redeploy your project for the changes to take effect

## Testing Your Configuration

You can test if your configuration is working by:

1. Starting your development server locally
2. Navigate to the Storage Diagnostics page
3. Click the "Test Blob Storage Connection" button
4. If the connection is successful, you'll see a green success message

## Troubleshooting

If you encounter errors:

1. Check that your `BLOB_READ_WRITE_TOKEN` is correctly set in both your local `.env.local` file and in your Vercel project settings
2. Verify that you've created the Blob storage in the Vercel dashboard
3. Make sure your token has the correct permissions (Read & Write)
4. Check the browser console for any error messages

## Reference

For more information about Vercel Blob Storage, refer to the [official documentation](https://vercel.com/docs/storage/vercel-blob). 