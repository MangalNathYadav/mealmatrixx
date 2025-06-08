// Import API key client
import ApiKeyClient from './services/api-key-client.js';

// Gemini API Client (v1beta)
class GeminiClient {
    constructor(apiKey = null) {
        this.apiKey = apiKey; // Will be fetched if not provided
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.modelName = 'models/gemini-1.5-pro-latest';
        this.isInitialized = false;
        
        console.log('Gemini client created with model:', this.modelName);
    }
    
    async initialize() {
        if (!this.apiKey) {
            try {
                this.apiKey = await ApiKeyClient.getGeminiApiKey();
            } catch (error) {
                console.error('Failed to get Gemini API key:', error);
                throw new Error('Failed to initialize Gemini client. API key not available.');
            }
        }
        this.isInitialized = true;
        console.log('Gemini client initialized');
        this.listModels(); // Check available models on initialization
    }

    async listModels() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            const url = `${this.baseUrl}/models?key=${this.apiKey}`;
            console.log('Fetching available Gemini models...');
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Available Gemini models:', data);
            return data;
        } catch (error) {
            console.error('Error listing Gemini models:', error);
            throw error;
        }
    }    
    
    async generateContent(prompt) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            const url = `${this.baseUrl}/models/${this.modelName}:generateContent?key=${this.apiKey}`;
            console.log('Making Gemini API request to:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },                body: JSON.stringify({
                    prompt: {
                        text: prompt
                    },
                    temperature: 0.7,
                    maxOutputTokens: 800
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error('Gemini API Error Response:', errorData);
                const errorMessage = errorData?.error?.message || response.statusText;
                throw new Error(`Gemini API request failed (${response.status}): ${errorMessage}`);
            }

            const data = await response.json();
            console.log('Gemini API Response:', data);

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                console.error('Invalid Gemini response format:', data);
                throw new Error('Invalid response format from Gemini API');
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
        ]`;
        
        return this.generateContent(prompt);
    }
}

// Export the GeminiClient class
export default GeminiClient;
