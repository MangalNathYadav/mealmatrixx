// AI Client Implementation
import config from '../config.js';

class AIClient {
    constructor() {
        this.apiKey = config.geminiApiKey;
    }

    async generateContent(prompt) {
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
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
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return this._processResponse(data);
        } catch (error) {
            console.error('AI generation failed:', error);
            throw new Error('Failed to generate AI content: ' + error.message);
        }
    }

    _processResponse(data) {
        try {
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response format');
            }

            const text = data.candidates[0].content.parts[0].text;
            
            // Try to extract JSON if the response is wrapped in code blocks
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]);
            }

            // If the text is a JSON string, parse it
            try {
                return JSON.parse(text);
            } catch {
                // If not JSON, return the text as is
                return { text };
            }
        } catch (error) {
            throw new Error('Failed to process AI response: ' + error.message);
        }
    }

    // Standard AI prompts
    async analyzeMeal(mealText, dietaryContext = '') {
        const prompt = `Analyze this meal: "${mealText}"
        ${dietaryContext}
        Return a JSON object with exactly this structure:
        {
            "foods": ["list of foods with portions"],
            "calories": number,
            "macros": {
                "protein": number,
                "carbs": number,
                "fat": number
            },
            "suggestions": "nutrition advice considering dietary context",
            "assessment": "health assessment considering dietary restrictions and conditions",
            "warnings": ["any health or dietary warnings"]
        }`;

        return this.generateContent(prompt);
    }

    async generateWeeklySummary(meals) {
        const prompt = `Analyze this week's nutrition data and provide detailed insights:
        Meals: ${JSON.stringify(meals)}

        Return a JSON object with this exact structure:
        {
            "overview": {
                "summary": "Brief overview of the week's nutrition patterns",
                "averageCalories": number,
                "averageProtein": number,
                "mealFrequency": number,
                "goalProgress": "Percentage or description of goal achievement"
            },
            "analysis": {
                "macroBalance": "Analysis of protein, carbs, and fat distribution",
                "mealTiming": "Analysis of meal timing patterns",
                "nutritionBalance": "Overall nutritional balance assessment",
                "weeklyTrends": ["List of identified trends"]
            },
            "insights": [
                "Specific insights about nutrition patterns",
                "Notable achievements or areas for improvement",
                "Comparison with previous weeks if available"
            ],
            "recommendations": [
                {
                    "area": "Specific area for improvement",
                    "suggestion": "Actionable recommendation",
                    "benefit": "Expected health benefit"
                }
            ],
            "healthMetrics": {
                "balanceScore": number,
                "varietyScore": number,
                "consistencyScore": number
            }
        }`;
        
        return this.generateContent(prompt);
    }

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

    async generateHealthTip() {
        const prompt = `Generate a random health tip about nutrition.
        Return a JSON object with:
        {
            "title": "Topic title",
            "tip": "The actual tip",
            "category": "nutrition/fitness/wellness/mindfulness"
        }`;

        return this.generateContent(prompt);
    }
}

// Create and export a single instance
const aiClient = new AIClient();
export default aiClient;
