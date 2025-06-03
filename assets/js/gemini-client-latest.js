// Import configuration
import config from './config.js';

// Gemini API Client (v1beta)
class GeminiClient {    constructor(apiKey) {
        this.apiKey = apiKey || config.geminiApiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.modelName = 'models/gemini-2.0-flash';
        
        if (!this.apiKey) {
            throw new Error('Gemini API key is required - get one from https://aistudio.google.com/app/apikey');
        }
        console.log('Gemini client initialized with model:', this.modelName);
        this.listModels(); // Check available models on initialization
    }

    async listModels() {
        try {
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
    }    async generateContent(prompt, retryCount = 0, maxRetries = 10) {
        try {
            if (retryCount >= maxRetries) {
                throw new Error('Maximum retry attempts reached. Please try again later.');
            }

            const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
            console.log(`Making Gemini API request (attempt ${retryCount + 1}/${maxRetries})...`);
            
            // Add timeout to the fetch request
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                            text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048,
                            topK: 1,
                            topP: 0.8
                        }
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    let errorMessage;
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData?.error?.message || response.statusText;
                    } catch {
                        errorMessage = response.statusText;
                    }

                    // Handle 503 Service Unavailable with retries
                    if (response.status === 503 && retryCount < maxRetries) {
                        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                        console.log(`Service unavailable. Retrying in ${retryDelay/1000} seconds...`);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        return this.generateContent(prompt, retryCount + 1, maxRetries);
                    }
                    
                    throw new Error(`Gemini API request failed (${response.status}): ${errorMessage}`);
                }

                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('Failed to parse Gemini response:', parseError);
                    throw new Error('Failed to parse response from Gemini API');
                }

                // Enhanced response handling
                if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const text = data.candidates[0].content.parts[0].text;
                    let result;
                    
                    try {
                        result = JSON.parse(text);
                        // Add metadata about the API call
                        result._meta = {
                            model: this.modelName,
                            attempts: retryCount + 1,
                            timestamp: new Date().toISOString(),
                            version: '2.0'
                        };
                        console.log('✅ Gemini API Success (JSON):', result);
                        return result;
                    } catch {
                        // If not JSON, return formatted text response
                        result = {
                            text: text,
                            _meta: {
                                model: this.modelName,
                                attempts: retryCount + 1,
                                timestamp: new Date().toISOString(),
                                version: '2.0',
                                format: 'text'
                            }
                        };
                        console.log('✅ Gemini API Success (Text):', result);
                        return result;
                    }
                } else {
                    console.error('Invalid Gemini response format:', data);
                    throw new Error('Invalid response format from Gemini API');
                }
            } catch (fetchError) {
                clearTimeout(timeout);
                
                // Handle abort error (timeout)
                if (fetchError.name === 'AbortError') {
                    if (retryCount < maxRetries) {
                        console.log('Request timed out, retrying...');
                        return this.generateContent(prompt, retryCount + 1, maxRetries);
                    }
                    throw new Error('Request timed out after multiple retries');
                }
                
                // Handle other fetch errors
                if (retryCount < maxRetries) {
                    const retryDelay = Math.pow(2, retryCount) * 1000;
                    console.log(`Network error, retrying in ${retryDelay/1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    return this.generateContent(prompt, retryCount + 1, maxRetries);
                }
                throw fetchError;
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
