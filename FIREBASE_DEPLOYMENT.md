# Firebase Deployment Guide (Spark Plan Only)

This guide will help you deploy your application to Firebase Hosting using the free Spark plan.

## Prerequisites

1. You need to have a Firebase account: [https://firebase.google.com/](https://firebase.google.com/)
2. You need to create a Firebase project in the Firebase Console and ensure it's on the Spark (free) plan
3. You need to have the Firebase CLI installed globally:

```bash
npm install -g firebase-tools
```

## Setting up the Firebase project

1. Log in to Firebase CLI:

```bash
npm run firebase:login
```

2. Update the `.firebaserc` file with your Firebase project ID:

```json
{
  "projects": {
    "default": "YOUR_FIREBASE_PROJECT_ID"
  }
}
```

3. Make sure your environment variables are properly set in your `.env` file:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Features Available on Spark (Free) Plan

The free Spark plan includes:

- Firebase Authentication
- Realtime Database (with limitations)
- Firebase Hosting
- Firebase Analytics

Features that require the paid Blaze plan:
- Cloud Functions
- Excessive Realtime Database usage
- Cloud Storage beyond the free tier
- Firestore beyond the free tier
- Cloud Messaging beyond the free tier

## Deploying the application (Hosting only)

To deploy your application to Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

This will build your application and deploy it to Firebase Hosting without deploying any functions.

## Viewing your deployed application

After deployment, you can visit your application at:

```
https://YOUR_FIREBASE_PROJECT_ID.web.app
```

or

```
https://YOUR_FIREBASE_PROJECT_ID.firebaseapp.com
```

## Troubleshooting

### Environment Variables

Firebase hosting doesn't have access to environment variables at runtime. Make sure:

1. All environment variables are prefixed with `VITE_` so they're bundled with the application
2. Avoid using features that require a Blaze plan (like Firebase Functions)

### Routing

The `firebase.json` configuration includes a rewrite rule to handle client-side routing. If you experience routing issues:

1. Make sure all your routes are properly defined in your React Router configuration
2. Check that the `firebase.json` rewrite rule is correctly sending all requests to `index.html`

## Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Spark Plan Limitations](https://firebase.google.com/docs/firestore/quotas)
- [Connect a Custom Domain](https://firebase.google.com/docs/hosting/custom-domain) 