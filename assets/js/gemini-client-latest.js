// Import API key client
import ApiKeyClient from './services/api-key-client.js';

// Gemini API Client (v1beta)
class GeminiClient {
    constructor(apiKey = null) {
        this.apiKey = apiKey; // Will be fetched if not provided
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.modelName = 'models/gemini-2.0-flash';
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
    }    async generateContent(prompt, retryCount = 0, maxRetries = 10) {
        try {
            if (retryCount >= maxRetries) {
                throw new Error('Maximum retry attempts reached. Please try again later.');
            }
            
            if (!this.isInitialized) {
                await this.initialize();
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

        Return ONLY a JSON object without any markdown formatting or additional text. Use this exact structure:
        {
            "foods": ["item1 (portion)", "item2 (portion)"],
            "calories": {
                "total": number
            },
            "assessment": "Brief but specific health assessment",
            "suggestion": "Practical improvement suggestion"
        }

        The JSON should be valid and directly parseable. Do not include any code blocks, quotes, or other formatting.`;

        const result = await this.generateContent(prompt);
        
        // If we got a text response with markdown, try to extract the JSON
        if (result.text && typeof result.text === 'string') {
            try {
                // Try to extract JSON from markdown code blocks if present
                const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || 
                                result.text.match(/```\n([\s\S]*?)\n```/) ||
                                result.text.match(/({[\s\S]*})/);
                                
                if (jsonMatch && jsonMatch[1]) {
                    const parsed = JSON.parse(jsonMatch[1]);
                    return {
                        ...parsed,
                        _meta: result._meta
                    };
                }
                
                // If no JSON found in markdown, try parsing the entire text
                return {
                    ...JSON.parse(result.text),
                    _meta: result._meta
                };
            } catch (error) {
                console.error('Failed to parse JSON from Gemini response:', error);
                throw new Error('Invalid response format from AI service');
            }
        }
        
        return result;
    }

    // Generate weekly summary with improved prompt
    async generateWeeklySummary(meals) {
        const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const avgCaloriesPerDay = Math.round(totalCalories / 7);
        
        const prompt = `You are a professional nutritionist AI. Analyze these meals from the past week:
        Total Meals: ${meals.length}
        Total Calories: ${totalCalories}
        Daily Average: ${avgCaloriesPerDay}
        Meals: ${JSON.stringify(meals)}

        Return ONLY a JSON object without any markdown formatting or additional text. Use this exact structure:
        {
            "summary": "Brief overview of eating patterns",
            "analysis": {
                "caloriesTrend": "Analysis of calorie patterns",
                "mealTiming": "Analysis of meal timing",
                "nutritionBalance": "Analysis of nutritional balance"
            },
            "insights": [
                "Key insight 1",
                "Key insight 2"
            ],
            "recommendations": [
                {
                    "area": "Area to improve",
                    "suggestion": "Specific actionable suggestion"
                }
            ]
        }

        The JSON should be valid and directly parseable. Do not include any code blocks, quotes, or other formatting.`;

        const result = await this.generateContent(prompt);
        
        // If we got a text response with markdown, try to extract the JSON
        if (result.text && typeof result.text === 'string') {
            try {
                // Try to extract JSON from markdown code blocks if present
                const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || 
                                result.text.match(/```\n([\s\S]*?)\n```/) ||
                                result.text.match(/({[\s\S]*})/);
                                
                if (jsonMatch && jsonMatch[1]) {
                    const parsed = JSON.parse(jsonMatch[1]);
                    return {
                        ...parsed,
                        _meta: result._meta
                    };
                }
                
                // If no JSON found in markdown, try parsing the entire text
                return {
                    ...JSON.parse(result.text),
                    _meta: result._meta
                };
            } catch (error) {
                console.error('Failed to parse JSON from Gemini response:', error);
                throw new Error('Invalid response format from AI service');
            }
        }
        
        return result;
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

    // Generate random health tip
    async generateHealthTip() {
        const prompt = `You are a professional nutritionist and fitness expert. Generate a single, concise health tip or insight that would be useful for someone tracking their nutrition and fitness goals.

        The tip should be specific, actionable, and evidence-based. Keep it under 100 words.

        Return ONLY a JSON object without any markdown formatting or additional text. Use this exact structure:
        {
            "title": "Short catchy title",
            "tip": "The actual health tip content",
            "category": "One of: nutrition, fitness, wellness, mindfulness, hydration"
        }

        The JSON should be valid and directly parseable. Do not include any code blocks, quotes, or other formatting.`;

        const result = await this.generateContent(prompt);
        
        // If we got a text response with markdown, try to extract the JSON
        if (result.text && typeof result.text === 'string') {
            try {
                // Try to extract JSON from markdown code blocks if present
                const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || 
                                result.text.match(/```\n([\s\S]*?)\n```/) ||
                                result.text.match(/({[\s\S]*})/);
                                
                if (jsonMatch && jsonMatch[1]) {
                    return JSON.parse(jsonMatch[1]);
                }
                
                // If no JSON found in markdown, try parsing the entire text
                return JSON.parse(result.text);
            } catch (error) {
                console.error('Failed to parse JSON from Gemini response:', error);
                return {
                    title: "Stay Hydrated",
                    tip: "Drinking enough water is crucial for metabolism, digestion, and nutrient absorption. Aim for at least 8 glasses daily, and more when exercising.",
                    category: "hydration"
                };
            }
        }
        
        // Return default tip if JSON extraction failed
        return {
            title: "Stay Hydrated",
            tip: "Drinking enough water is crucial for metabolism, digestion, and nutrient absorption. Aim for at least 8 glasses daily, and more when exercising.",
            category: "hydration"
        };
    }
}

// Export the GeminiClient class
export default GeminiClient;
