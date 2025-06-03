const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Firebase Admin
const admin = require('firebase-admin');
admin.initializeApp();

// Initialize Gemini API with the key from environment config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || functions.config().gemini.key);

// Helper function to generate AI response
async function generateGeminiResponse(prompt) {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 1000,
            }
        });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        
        if (!result.response) {
            throw new Error('No response from Gemini API');
        }

        const response = await result.response;
        let text = response.text();

        // Try to parse as JSON if it's a JSON string
        try {
            const jsonResponse = JSON.parse(text);
            return jsonResponse;
        } catch {
            // If not JSON, return as is
            return text;
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new functions.https.HttpsError('internal', 'AI processing failed');
    }
}

// Analyze meal endpoint
exports.analyzeMeal = functions.https.onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    // Input validation
    if (!data.mealText || typeof data.mealText !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Meal description is required');
    }

    try {
        const prompt = `Analyze this meal: "${data.mealText}"
            Return a JSON object with the following structure:
            {
                "foods": [list of individual food items],
                "calories": estimated total calories (number),
                "nutrition": {
                    "protein": "high/medium/low",
                    "carbs": "high/medium/low",
                    "fats": "high/medium/low"
                },
                "assessment": "brief health assessment",
                "suggestion": "improvement suggestion if needed"
            }
            Be specific with the calorie estimates for common foods.`;

        const response = await generateGeminiResponse(prompt);
        
        // Validate response structure
        if (!response.foods || !response.calories || !response.assessment) {
            throw new Error('Invalid AI response structure');
        }

        return { result: response };
    } catch (error) {
        console.error('Meal analysis error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to analyze meal');
    }
});

// Generate weekly summary
exports.weeklySummary = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    // Input validation
    if (!data.meals || !Array.isArray(data.meals)) {
        throw new functions.https.HttpsError('invalid-argument', 'Meals data must be an array');
    }

    try {
        // Calculate some basic statistics
        const totalCalories = data.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const avgCaloriesPerDay = totalCalories / 7;
        const mealTypes = data.meals.reduce((types, meal) => {
            const hour = new Date(meal.dateTime).getHours();
            if (hour < 11) types.breakfast++;
            else if (hour < 16) types.lunch++;
            else types.dinner++;
            return types;
        }, { breakfast: 0, lunch: 0, dinner: 0 });

        const prompt = `Analyze this week's meals:
            Total Calories: ${totalCalories}
            Average Daily Calories: ${avgCaloriesPerDay}
            Meal Distribution: ${JSON.stringify(mealTypes)}
            Detailed Meals: ${JSON.stringify(data.meals)}

            Return a JSON object with:
            {
                "summary": "overall eating pattern analysis",
                "concerns": ["list any concerning patterns"],
                "positives": ["list good habits observed"],
                "suggestions": ["specific, actionable improvements"],
                "weeklyGoal": "one main goal for next week"
            }
            Focus on constructive feedback and practical suggestions.`;

        const response = await generateGeminiResponse(prompt);
        
        return { 
            result: response,
            stats: {
                totalCalories,
                avgCaloriesPerDay,
                mealTypes
            }
        };
    } catch (error) {
        console.error('Weekly summary error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate weekly summary');
    }
});

// Rate limiting helper
const rateLimiter = new Map();

// Suggest better meals
exports.suggestMeal = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
    }

    // Rate limiting (5 requests per minute per user)
    const userId = context.auth.uid;
    const now = Date.now();
    const userRequests = rateLimiter.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= 5) {
        throw new functions.https.HttpsError('resource-exhausted', 
            'Too many requests. Please try again in a minute.');
    }
    
    rateLimiter.set(userId, [...recentRequests, now]);

    // Input validation
    if (!data.meal || !data.meal.name || !data.meal.calories) {
        throw new functions.https.HttpsError('invalid-argument', 
            'Meal must include name and calories');
    }

    try {
        const prompt = `For this meal: "${data.meal.name}" (${data.meal.calories} calories),
            suggest 3 healthier alternatives.
            Consider these factors:
            - Similar taste profile and cuisine type
            - Lower calories (aim for 20-30% reduction)
            - Better nutritional balance
            - Practical and easy to prepare
            - Common, accessible ingredients

            Return a JSON array of 3 objects with:
            {
                "name": "suggested meal name",
                "calories": estimated calories (number),
                "benefits": ["list of health benefits"],
                "ingredients": ["main ingredients"],
                "reason": "why this is a better choice"
            }`;

        const response = await generateGeminiResponse(prompt);
        
        // Validate response
        if (!Array.isArray(response) || response.length === 0) {
            throw new Error('Invalid suggestion format');
        }

        return { 
            result: response,
            originalMeal: data.meal
        };
    } catch (error) {
        console.error('Meal suggestion error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate meal suggestions');
    }
});
