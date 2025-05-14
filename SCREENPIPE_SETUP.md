# ScreenPipe Integration Setup

This document provides instructions for setting up ScreenPipe integration with the Project-ADelta application.

## What is ScreenPipe?

ScreenPipe is a third-party application that allows capturing screenshots and integrating them directly into applications. The tool provides a simple API for capturing screenshots and transferring them to your application.

## Installation Instructions

### 1. Install ScreenPipe

Download and install the ScreenPipe application from the official website:

```
https://screenpi.pe/download
```

Follow the installation instructions provided on the website for your operating system.

### 2. Configure ScreenPipe

After installation:

1. Open the ScreenPipe application
2. Go to Settings > Integrations
3. Enable API access
4. Generate a new API key if required
5. Allow browser integrations for your domain

### 3. Configure Project-ADelta

1. Create a `.env` file in the root of the project if it doesn't exist already
2. Add your ScreenPipe API key:

```
SCREENPIPE_API_KEY=your_api_key_here
```

3. Restart the application with `npm run dev`

## Using ScreenPipe in the Application

Once set up, you can use ScreenPipe to capture screenshots directly from the chat interface:

1. Open the template editor in Project-ADelta
2. In the chat interface, click the green screen capture icon (next to the send button)
3. The ScreenPipe interface will appear, allowing you to capture your screen
4. After capturing, the screenshot will be automatically inserted into the template

## Troubleshooting

If you encounter any issues with the ScreenPipe integration:

1. Ensure ScreenPipe is running in the background
2. Check that API access is enabled in ScreenPipe settings
3. Verify that your API key is correctly configured in the `.env` file
4. Try refreshing the page after ensuring ScreenPipe is running
5. Check the browser console for any error messages

## Note for Developers

The ScreenPipe integration uses the following components:

- `src/components/ScreenPipeCapture.tsx`: Main component for the ScreenPipe capture interface
- `src/lib/screenpipeUtils.ts`: Utility functions for ScreenPipe integration
- `src/lib/screenpipeConfig.ts`: Configuration and initialization of ScreenPipe

When developing, ensure that these components are properly maintained and updated when the ScreenPipe API changes. 