// Import configuration
import config from './config.js';

// Gemini API Client
class GeminiClient {constructor(apiKey) {
        this.apiKey = apiKey || config.geminiApiKey; // Use config from config.js
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
        
        // Validate API key
        if (!this.apiKey) {
            throw new Error('Gemini API key is required');
        }
    }async generateContent(prompt) {
        try {
            console.log('Making API request to:', this.apiEndpoint);
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 1000,
                    }
                })
            });            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.error?.message || response.statusText;
                throw new Error(`API request failed: ${errorMessage}`);
            }

            const data = await response.json();
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response format');
            }

            const text = data.candidates[0].content.parts[0].text;
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    // Analyze a meal
    async analyzeMeal(mealText) {
        const prompt = `You are a professional nutritionist AI. Analyze this meal: "${mealText}"

        Instructions:
        1. Break down the meal into individual components
        2. Provide accurate calorie estimates based on standard portions
        3. Assess nutritional balance
        4. Suggest improvements while keeping cultural preferences in mind

        Return a JSON object with this exact structure:
        {
            "foods": ["item1 (portion)", "item2 (portion)"],
            "calories": {
                "total": number,
                "breakdown": {
                    "item1": number,
                    "item2": number
                }
            },
            "nutrition": {
                "protein": "high/medium/low",
                "carbs": "high/medium/low",
                "fats": "high/medium/low",
                "fiber": "high/medium/low"
            },
            "assessment": "Brief but specific health assessment",
            "suggestion": "Practical improvement suggestion",
            "alternatives": ["healthier option 1", "healthier option 2"]
        }`;

        return this.generateContent(prompt);
    }

    // Generate weekly summary
    async generateWeeklySummary(meals) {
        const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const avgCaloriesPerDay = totalCalories / 7;
        
        const prompt = `Analyze these meals for the week:
        Total Calories: ${totalCalories}
        Daily Average: ${avgCaloriesPerDay}
        Meals: ${JSON.stringify(meals)}

        Return a JSON object with this structure:
        {
            "summary": "Weekly pattern analysis",
            "patterns": {
                "timing": "Meal timing analysis",
                "portions": "Portion size analysis",
                "variety": "Food variety analysis"
            },
            "concerns": [
                {
                    "issue": "Specific concern",
                    "impact": "Health impact",
                    "solution": "Solution"
                }
            ],
            "positives": ["Good habits"],
            "suggestions": [
                {
                    "area": "Area to improve",
                    "action": "Action step",
                    "benefit": "Expected benefit"
                }
            ]
        }`;

        return this.generateContent(prompt);
    }

    // Suggest better meals
    async suggestBetterMeal(meal) {
        const prompt = `Suggest healthier alternatives for: "${meal.name}" (${meal.calories} calories)
        Return a JSON array of alternatives with this structure:
        [
            {
                "name": "Alternative name",
                "description": "Brief description",
                "calories": number,
                "benefits": ["health benefits"],
                "ingredients": ["ingredient (amount)"],
                "cookingMethod": "method"
            }
        ]`;        return this.generateContent(prompt);
    }
}

// Export the GeminiClient class
export default GeminiClient;
