// Application Configuration
const config = {
    // Firebase Config - Using environment variables from Netlify
    firebase: {
        apiKey: process.env.FIREBASE_API_KEY || "",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        databaseURL: process.env.FIREBASE_DATABASE_URL || "",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.FIREBASE_APP_ID || ""
    },
    
    // AI Services - Using environment variables from Netlify
    ai: {
        geminiApiKey: process.env.GEMINI_API_KEY || ""
    },
    
    // App Settings
    app: {
        name: 'MealMatrix',
        version: '1.0.0',
        description: 'Smart Nutrition Tracking',
    },
    
    // Default Values
    defaults: {
        goals: {
            targetCalories: 2000,
            proteinGoal: 150,
            carbsGoal: 250,
            fatGoal: 65,
            goalType: 'maintain',
            weeklyGoal: 0
        },
        
        activityLevels: [
            { value: 'sedentary', label: 'Sedentary (Office job, little exercise)' },
            { value: 'light', label: 'Lightly Active (Light exercise 1-3 days/week)' },
            { value: 'moderate', label: 'Moderately Active (Exercise 3-5 days/week)' },
            { value: 'very', label: 'Very Active (Hard exercise 6-7 days/week)' },
            { value: 'extra', label: 'Extra Active (Very hard exercise & physical job)' }
        ],
        
        dietTypes: [
            { value: 'none', label: 'No Specific Diet' },
            { value: 'vegetarian', label: 'Vegetarian' },
            { value: 'vegan', label: 'Vegan' },
            { value: 'pescatarian', label: 'Pescatarian' },
            { value: 'keto', label: 'Ketogenic' },
            { value: 'paleo', label: 'Paleo' }
        ],
        
        goalTypes: [
            { value: 'maintain', label: 'Maintain Weight' },
            { value: 'lose', label: 'Lose Weight' },
            { value: 'gain', label: 'Gain Muscle Mass' }
        ]
    }
};

export default config;
