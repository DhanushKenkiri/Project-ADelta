# Firebase Authentication Setup

This guide will help you complete the Firebase Authentication setup for your application.

## Prerequisites

1. You need to have a Firebase account: [https://firebase.google.com/](https://firebase.google.com/)
2. You need to create a Firebase project in the Firebase Console
3. You need to have the Firebase CLI installed globally:

```bash
npm install -g firebase-tools
```

## Step 1: Set Up Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project or use an existing one.
2. Click on "Add app" and choose the web platform (</> icon).
3. Register your app with a nickname and optionally set up Firebase Hosting.
4. Copy the Firebase configuration values shown.

## Step 2: Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add the following Firebase configuration:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Replace the placeholders with your actual Firebase configuration values.

## Step 3: Enable Authentication Methods in Firebase Console

1. In your Firebase Console, navigate to "Authentication" in the left sidebar.
2. Click on "Get started" or "Sign-in method" tab.
3. Enable the authentication methods you want to use:
   - Email/Password: Enable and save
   - Google: Enable, provide a support email, and save

## Step 4: Update .firebaserc File

Update the `.firebaserc` file with your Firebase project ID:

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

## Step 5: Test Authentication Flow

1. Run your application locally:

```bash
npm run dev
```

2. Navigate to `/login` or `/register` and test the authentication flow.
3. Make sure you can:
   - Register a new account
   - Log in with an existing account
   - Sign in with Google
   - Reset password
   - View and update profile
   - Sign out

## Step 6: Deploy Your Application

Once you've verified that authentication works locally, you can deploy your application:

```bash
npm run deploy
```

## Troubleshooting

### Authentication Errors

If you encounter authentication errors, check:

1. That your environment variables are correctly set
2. That you've enabled the authentication methods in Firebase Console
3. That your Firebase project rules allow the operations

### Google Authentication Issues

If Google authentication is not working:

1. Make sure you've correctly configured the Google Authentication provider in Firebase Console
2. Check that you've added a support email for Google Sign-In
3. Verify that you haven't restricted the application domains in the Google Cloud Console

### Password Reset Not Working

If password reset emails are not being received:

1. Check spam/junk folders
2. Verify that Firebase email templates are properly configured in the Firebase Console
3. Ensure the Firebase project is on a plan that supports email sending (Spark plan may have limitations)

## Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web SDK Authentication Guide](https://firebase.google.com/docs/auth/web/start)
- [Custom Authentication UI with React](https://firebase.google.com/docs/auth/web/custom-ui) 