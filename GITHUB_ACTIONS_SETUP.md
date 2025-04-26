# GitHub Actions Setup for Firebase Deployment

This guide will help you set up GitHub Actions to automatically deploy your application to Firebase Hosting whenever you push to the main branch.

## Prerequisites

1. Your code is hosted on GitHub
2. You have a Firebase project set up
3. You have the Firebase CLI installed and configured locally

## Getting the Firebase Service Account Key

To allow GitHub Actions to deploy to Firebase, you need to generate a service account key:

1. Go to your Firebase project settings
2. Navigate to the "Service accounts" tab
3. Click "Generate new private key" for the Firebase Admin SDK
4. This will download a JSON file with your credentials

## Setting up GitHub Secrets

In your GitHub repository, you need to add the following secrets:

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the following secrets:

### Firebase Configuration Secrets

| Name | Value |
|------|-------|
| `FIREBASE_API_KEY` | Your Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Your Firebase Auth domain |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Your Firebase messaging sender ID |
| `FIREBASE_APP_ID` | Your Firebase app ID |
| `FIREBASE_SERVICE_ACCOUNT` | The **entire content** of the JSON service account file you downloaded earlier |

### Other API Secrets

| Name | Value |
|------|-------|
| `GROQ_API_KEY` | Your Groq API key |
| `SOCKET_SERVER_URL` | Your Socket server URL |

## Workflow File

The workflow file `.github/workflows/firebase-deploy.yml` is already set up to use these secrets. It will:

1. Check out your code
2. Set up Node.js
3. Install dependencies
4. Create a .env file using your secrets
5. Build the project
6. Deploy to Firebase Hosting

## Manual Deployments

You can also trigger a deployment manually:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy to Firebase Hosting" workflow
3. Click "Run workflow"
4. Select the branch you want to deploy
5. Click "Run workflow"

## Troubleshooting

### Build Failures

If your build fails, check:

1. GitHub Actions logs to see specific error messages
2. That all required environment variables are correctly set as secrets
3. That your code builds locally with `npm run build`

### Deployment Failures

If deployment fails, check:

1. That your `FIREBASE_SERVICE_ACCOUNT` secret contains the entire JSON content of your service account key
2. That your `FIREBASE_PROJECT_ID` matches the project ID in your Firebase console
3. That the service account has the necessary permissions to deploy to Firebase Hosting

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli) 

This guide will help you set up GitHub Actions to automatically deploy your application to Firebase Hosting whenever you push to the main branch.

## Prerequisites

1. Your code is hosted on GitHub
2. You have a Firebase project set up
3. You have the Firebase CLI installed and configured locally

## Getting the Firebase Service Account Key

To allow GitHub Actions to deploy to Firebase, you need to generate a service account key:

1. Go to your Firebase project settings
2. Navigate to the "Service accounts" tab
3. Click "Generate new private key" for the Firebase Admin SDK
4. This will download a JSON file with your credentials

## Setting up GitHub Secrets

In your GitHub repository, you need to add the following secrets:

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add the following secrets:

### Firebase Configuration Secrets

| Name | Value |
|------|-------|
| `FIREBASE_API_KEY` | Your Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Your Firebase Auth domain |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Your Firebase messaging sender ID |
| `FIREBASE_APP_ID` | Your Firebase app ID |
| `FIREBASE_SERVICE_ACCOUNT` | The **entire content** of the JSON service account file you downloaded earlier |

### Other API Secrets

| Name | Value |
|------|-------|
| `GROQ_API_KEY` | Your Groq API key |
| `SOCKET_SERVER_URL` | Your Socket server URL |

## Workflow File

The workflow file `.github/workflows/firebase-deploy.yml` is already set up to use these secrets. It will:

1. Check out your code
2. Set up Node.js
3. Install dependencies
4. Create a .env file using your secrets
5. Build the project
6. Deploy to Firebase Hosting

## Manual Deployments

You can also trigger a deployment manually:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy to Firebase Hosting" workflow
3. Click "Run workflow"
4. Select the branch you want to deploy
5. Click "Run workflow"

## Troubleshooting

### Build Failures

If your build fails, check:

1. GitHub Actions logs to see specific error messages
2. That all required environment variables are correctly set as secrets
3. That your code builds locally with `npm run build`

### Deployment Failures

If deployment fails, check:

1. That your `FIREBASE_SERVICE_ACCOUNT` secret contains the entire JSON content of your service account key
2. That your `FIREBASE_PROJECT_ID` matches the project ID in your Firebase console
3. That the service account has the necessary permissions to deploy to Firebase Hosting

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli) 
 