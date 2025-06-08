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

## Testing Your Configuration

After setting up the environment variables, deploy your site and verify that:

1. User authentication works correctly
2. Database operations work correctly
3. AI features using the Gemini API work correctly

If you encounter any issues, check the browser console for errors and verify that all environment variables are set correctly in the Netlify dashboard.
