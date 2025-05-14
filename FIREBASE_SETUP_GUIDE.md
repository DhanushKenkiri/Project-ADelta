# Firebase Setup Guide for Project ADelta

This guide will help you complete the Firebase setup for authentication in your Project ADelta application.

## Prerequisites

1. Node.js and npm installed
2. Firebase CLI installed globally (`npm install -g firebase-tools`)
3. A Google account to create a Firebase project

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "project-adelta")
4. Configure Google Analytics (optional)
5. Click "Create project"

## Step 2: Register Your Web Application

1. In the Firebase project dashboard, click the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "Project ADelta Web")
3. Check "Also set up Firebase Hosting" if you plan to deploy
4. Click "Register app"

## Step 3: Copy Firebase Configuration

After registering your app, you'll see Firebase configuration code that looks like this:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Copy these values for the next step.

## Step 4: Configure Environment Variables

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add the following with your actual Firebase values:

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

## Step 5: Enable Authentication Methods

1. In the Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable the authentication methods you need:
   - Email/Password: Click enable and save
   - Google: Click enable, add a support email, and save

## Step 6: Update Firebase Configuration Files

1. Update the `.firebaserc` file with your Firebase project ID:

```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

2. Run the Firebase init command (if not done already):

```bash
firebase init
```

Select the services you need:
- Hosting (for web deployment)
- Storage (for file storage)
- Firestore (for database, if needed)

## Step 7: Test the Authentication Flow

1. Start your application locally:

```bash
npm run dev
```

2. Navigate to the login page and verify you can:
   - Register a new user
   - Log in with email/password
   - Log in with Google
   - Reset password
   - View and update user profile
   - Sign out

## Step 8: Deploy to Firebase Hosting

Once everything is working locally, deploy your application:

```bash
npm run build
firebase deploy
```

## Troubleshooting

### Authentication Errors

- Check if your environment variables are correctly set
- Verify that authentication methods are enabled in Firebase Console
- Check browser console for specific error messages

### Google Authentication Issues

- Make sure you've properly configured Google Sign-In in Firebase Console
- Verify you've added a support email

### Deployment Issues

- Make sure your `.firebaserc` file has the correct project ID
- Verify the build is generating files in the `dist` directory
- Check that Firebase hosting configuration is pointing to the correct public directory

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase Storage Documentation](https://firebase.google.com/docs/storage) 