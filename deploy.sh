#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process to Firebase...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found. Please create one with your Firebase configuration.${NC}"
  exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo -e "${RED}Firebase CLI not found. Installing globally...${NC}"
  npm install -g firebase-tools
fi

# Check if user is logged in to Firebase
FIREBASE_STATUS=$(firebase projects:list 2>&1)
if [[ $FIREBASE_STATUS == *"Error: Authentication Error"* ]]; then
  echo -e "${YELLOW}You are not logged in to Firebase CLI. Logging in...${NC}"
  firebase login
fi

# Check if .firebaserc has been updated
FIREBASE_PROJECT_ID=$(grep -o '"default": "[^"]*' .firebaserc | sed 's/"default": "//')
if [[ $FIREBASE_PROJECT_ID == "YOUR_FIREBASE_PROJECT_ID" ]]; then
  echo -e "${RED}Error: You need to update the .firebaserc file with your Firebase project ID.${NC}"
  echo "Current Firebase projects:"
  firebase projects:list
  echo -e "${YELLOW}Please update .firebaserc with your project ID before continuing.${NC}"
  exit 1
fi

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Exiting deployment process.${NC}"
  exit 1
fi

# Deploy to Firebase
echo -e "${YELLOW}Deploying to Firebase...${NC}"
firebase deploy --only hosting

# Check if deployment succeeded
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deployment successful!${NC}"
  echo -e "Your app is now available at:"
  echo -e "${GREEN}https://$FIREBASE_PROJECT_ID.web.app${NC}"
  echo -e "${GREEN}https://$FIREBASE_PROJECT_ID.firebaseapp.com${NC}"
else
  echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
fi 

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process to Firebase...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found. Please create one with your Firebase configuration.${NC}"
  exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo -e "${RED}Firebase CLI not found. Installing globally...${NC}"
  npm install -g firebase-tools
fi

# Check if user is logged in to Firebase
FIREBASE_STATUS=$(firebase projects:list 2>&1)
if [[ $FIREBASE_STATUS == *"Error: Authentication Error"* ]]; then
  echo -e "${YELLOW}You are not logged in to Firebase CLI. Logging in...${NC}"
  firebase login
fi

# Check if .firebaserc has been updated
FIREBASE_PROJECT_ID=$(grep -o '"default": "[^"]*' .firebaserc | sed 's/"default": "//')
if [[ $FIREBASE_PROJECT_ID == "YOUR_FIREBASE_PROJECT_ID" ]]; then
  echo -e "${RED}Error: You need to update the .firebaserc file with your Firebase project ID.${NC}"
  echo "Current Firebase projects:"
  firebase projects:list
  echo -e "${YELLOW}Please update .firebaserc with your project ID before continuing.${NC}"
  exit 1
fi

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Exiting deployment process.${NC}"
  exit 1
fi

# Deploy to Firebase
echo -e "${YELLOW}Deploying to Firebase...${NC}"
firebase deploy --only hosting

# Check if deployment succeeded
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deployment successful!${NC}"
  echo -e "Your app is now available at:"
  echo -e "${GREEN}https://$FIREBASE_PROJECT_ID.web.app${NC}"
  echo -e "${GREEN}https://$FIREBASE_PROJECT_ID.firebaseapp.com${NC}"
else
  echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
fi 
 