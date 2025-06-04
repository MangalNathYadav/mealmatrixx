// Application Configuration
const config = {
    // Firebase Config
    firebase: {
        apiKey: "AIzaSyDJRYvkh4ejfXHiYvTYcrcTMjA8awrnZzQ",
        authDomain: "mealmatrix-ac32a.firebaseapp.com",
        projectId: "mealmatrix-ac32a",
        databaseURL: "https://mealmatrix-ac32a-default-rtdb.firebaseio.com",
        messagingSenderId: "347054902442",
        appId: "1:347054902442:web:c83ed92e399e3f19c414d3"
    },
    
    // AI Services
    ai: {
        geminiApiKey: 'AIzaSyCjLU7RoLVj-ahKYP7ULWdTY6PRFIxKdiM'
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
