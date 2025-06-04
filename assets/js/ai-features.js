import GeminiClient from './gemini-client-latest.js';

// AI Features for MealMatrix
class MealAI {
    constructor() {
        // Initialize Gemini client using config
        this.client = new GeminiClient();
    }

    // Analyze a meal from free text input
    async analyzeMeal(mealText) {
        try {
            console.log('Analyzing meal:', mealText);
            const prompt = `Analyze this meal: "${mealText}"
            Return a JSON object with exactly this structure:
            {
                "foods": ["list of foods with portions"],
                "calories": number,
                "macros": {
                    "protein": number,
                    "carbs": number,
                    "fat": number
                },
                "suggestions": "nutrition advice",
                "assessment": "health assessment"
            }
            
            Must include numerical values for calories and all macros in grams.
            Example: 
            {
                "foods": ["banana (medium)", "apple (large)"],
                "calories": 210,
                "macros": {
                    "protein": 2.5,
                    "carbs": 54,
                    "fat": 0.5
                },
                "suggestions": "Add protein source for better balance",
                "assessment": "Good source of carbs and fiber"
            }`;

            const result = await this.client.generateContent(prompt);
            console.log('Raw analysis result:', result);
            
            // Extract JSON from markdown code blocks if present
            if (result.text && typeof result.text === 'string') {
                const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch && jsonMatch[1]) {
                    try {
                        const parsedResult = JSON.parse(jsonMatch[1]);
                        console.log('Parsed JSON result:', parsedResult);
                        return parsedResult;
                    } catch (parseError) {
                        console.error('Failed to parse JSON from response:', parseError);
                        throw new Error('Invalid response format from AI service');
                    }
                }
                
                // Try parsing the entire response as JSON if no code blocks found
                try {
                    const parsedResult = JSON.parse(result.text);
                    console.log('Parsed full response as JSON:', parsedResult);
                    return parsedResult;
                } catch (parseError) {
                    console.error('Failed to parse full response as JSON:', parseError);
                }
            }
            
            throw new Error('Invalid response format from AI service');
        } catch (error) {
            console.error('Meal analysis failed:', error);
            throw new Error('Failed to analyze meal: ' + error.message);
        }
    }

    // Generate weekly summary from meal data
    async generateWeeklySummary(meals) {
        try {
            console.log('Generating summary for meals:', meals);
            const result = await this.client.generateWeeklySummary(meals);
            console.log('Summary result:', result);
            return result;
        } catch (error) {
            console.error('Weekly summary generation failed:', error);
            throw new Error('Failed to generate summary: ' + error.message);
        }
    }

    // Get healthier meal suggestions
    async suggestBetterMeal(meal) {
        try {
            console.log('Getting suggestions for meal:', meal);
            const result = await this.client.suggestBetterMeal(meal);
            console.log('Suggestion result:', result);
            return result;
        } catch (error) {
            console.error('Meal suggestion failed:', error);
            throw new Error('Failed to suggest alternatives: ' + error.message);
        }
    }
}

// Create and export a single instance
const ai = new MealAI();
export default ai;
