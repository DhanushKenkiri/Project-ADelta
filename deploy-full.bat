@echo off
echo Starting full deployment process to Firebase...

REM Check if .env file exists
if not exist .env (
  echo Error: .env file not found. Please create one with your Firebase configuration.
  exit /b 1
)

REM Check if Firebase CLI is installed
where firebase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Firebase CLI not found. Installing globally...
  call npm install -g firebase-tools
)

REM Check if user is logged in to Firebase
firebase projects:list >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo You are not logged in to Firebase CLI. Logging in...
  call firebase login
)

REM Setup Functions environment
echo Setting up Firebase Functions...
cd functions
if not exist node_modules (
  echo Installing Firebase Functions dependencies...
  call npm install
)

REM Create .env file for Functions from the main .env file
echo Creating .env file for Functions...
echo # Firebase Functions Environment Variables > .env
echo. >> .env
echo GROQ_API_KEY=%VITE_GROQ_API_KEY% >> .env
cd ..

REM Extract project ID from .firebaserc
for /f "tokens=2 delims=:, " %%a in ('findstr "default" .firebaserc') do set PROJECT_ID=%%a
set PROJECT_ID=%PROJECT_ID:"=%

REM Check if .firebaserc has been updated
if "%PROJECT_ID%"=="your-firebase-project-id" (
  echo Error: You need to update the .firebaserc file with your Firebase project ID.
  echo Current Firebase projects:
  call firebase projects:list
  echo Please update .firebaserc with your project ID before continuing.
  exit /b 1
)

REM Build the project
echo Building the frontend...
call npm run build

REM Check if build succeeded
if %ERRORLEVEL% NEQ 0 (
  echo Frontend build failed. Exiting deployment process.
  exit /b 1
)

REM Deploy to Firebase (both Hosting and Functions)
echo Deploying to Firebase (Hosting and Functions)...
call firebase deploy

REM Check if deployment succeeded
if %ERRORLEVEL% EQU 0 (
  echo Deployment successful!
  echo Your app is now available at:
  echo https://%PROJECT_ID%.web.app
  echo https://%PROJECT_ID%.firebaseapp.com
) else (
  echo Deployment failed. Please check the error messages above.
  exit /b 1
)

echo Full deployment process completed! 