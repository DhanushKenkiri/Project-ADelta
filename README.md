# Hover Mail Masterpiece

A modern email template generator powered by Groq AI. Create beautiful HTML email templates from text prompts in minutes.

## Features

- Generate HTML email templates using Groq AI
- Preview templates in real-time
- Save templates locally as HTML files
- Upload templates to Firebase Storage
- Interactive chat interface for refining templates

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory based on `.env.example`
   - Add your Groq API key (get one from [Groq](https://console.groq.com))
   - Add your Firebase configuration (set up a project at [Firebase Console](https://console.firebase.google.com))

4. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Enter your email content in the text area
2. Click "Generate Template" to create an HTML email template
3. The app will:
   - Generate an HTML template using Groq AI
   - Save the template locally
   - Upload the template to Firebase Storage
4. Preview the generated template in the Email Workspace
5. Use the chat interface to request modifications

## Technologies

- React
- TypeScript
- Vite
- Tailwind CSS
- Groq AI
- Firebase Storage

## Environment Variables

- `VITE_GROQ_API_KEY`: Your Groq API key
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID`: Firebase App ID

# Fluvio Platform Compatibility Fix

This patch addresses compatibility issues with the Fluvio real-time collaboration service in browser environments.

## Changes Made

### 1. FluvioService Class (`src/lib/fluvioService.ts`)

- Added better platform compatibility detection to handle cases where Fluvio isn't supported
- Implemented robust error handling for all operations
- Added graceful degradation so the app continues to function when Fluvio isn't available
- Introduced a flag to track compatibility warnings to avoid console flooding
- Improved message format consistency and error reporting
- Added reconnection logic for stream processing
- Implemented proper error propagation for collaborative editing operations

### 2. CollaborativeTemplateEditor Component (`src/components/CollaborativeTemplateEditor.tsx`)

- Added proper error handling throughout the component
- Fixed method references from `isEnabled` to `isFluvioEnabled`
- Added visual indicators when collaborative editing is unavailable
- Ensured the editor continues to function in local-only mode when Fluvio isn't available
- Added error states and notifications for users

### 3. useCollaborativeEditing Hook (`src/hooks/useCollaborativeEditing.ts`)

- Updated to handle platform support detection
- Added comprehensive error handling for all callbacks
- Ensured operation continuity when collaborative features aren't available
- Fixed method references to use the correct `isFluvioEnabled` method

## Usage

The application will now automatically detect when Fluvio is not supported and will:

1. Display a notification to users
2. Continue to function in local-only mode
3. Prevent unnecessary errors in the console
4. Provide a better user experience

No configuration changes are needed. The services will automatically adapt based on platform capabilities.

## Common Platform Compatibility Issues

Fluvio might not be supported in:

- Browsers without certain native capabilities
- Environments where dynamic imports are restricted
- Platforms that don't support required dependencies

The code now gracefully handles these scenarios without disrupting the user experience.
