# Netlify Deployment Guide for MealMatrix

This document describes how to set up environment variables for MealMatrix deployment on Netlify.

## Required Environment Variables

All sensitive API keys and configuration values are stored as environment variables in Netlify. You need to configure the following environment variables in the Netlify dashboard:

### Firebase Configuration
- `FIREBASE_API_KEY`: Your Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain (format: your-project-id.firebaseapp.com)
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL
- `FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `FIREBASE_APP_ID`: Your Firebase application ID

### AI Services
- `GEMINI_API_KEY`: Your Google Gemini API key

## How to Configure Environment Variables in Netlify

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your MealMatrix site
3. Go to Site settings > Build & deploy > Environment
4. Under "Environment variables", click "Edit variables"
5. Add each of the required variables with their values
6. Click "Save"

## API Access Security

The application uses Netlify functions to securely access API keys:

1. `/netlify/functions/getFirebaseConfig.js`: Returns Firebase configuration safely from environment variables
2. `/netlify/functions/getGeminiKey.js`: Returns the Gemini API key safely from environment variables

This approach ensures API keys are never exposed in the client-side code.

## API Key Security Implementation

The codebase has been updated to remove all hardcoded API keys and secrets:

1. Firebase Config: Updated to use Netlify functions
   - `assets/js/services/firebase-config.js` - Now fetches config securely
   - Root-level `firebase-config.js` - Uses environment variables

2. Gemini API:
   - Created `assets/js/services/api-key-client.js` to handle API key fetching
   - Updated all AI client implementations to use this secure method
   - Added initialization patterns to delay API calls until keys are available

3. Client-Side Security:
   - Removed all direct references to API keys in client-side code
   - Added proper error handling for API key fetch failures
   - Implemented async initialization patterns

## Testing Your Configuration

After setting up the environment variables, deploy your site and verify that:

1. User authentication works correctly
2. Database operations work correctly
3. AI features using the Gemini API work correctly
4. No API key exposure warnings appear in Netlify deployment logs

If you encounter any issues, check the browser console for errors and verify that all environment variables are set correctly in the Netlify dashboard.

## Troubleshooting

If Netlify detects sensitive information during deployment:
1. Check all JavaScript files for any remaining hardcoded API keys
2. Ensure all API calls use the appropriate Netlify functions
3. Verify that the Netlify functions are properly deployed
4. Clear the Netlify cache and redeploy
