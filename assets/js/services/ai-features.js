// AI Features for MealMatrix
import GeminiClient from './gemini-client-latest.js';

export class MealAI {
    constructor() {
        this.client = new GeminiClient();
        this.userProfile = null;
    }

    async loadUserProfile() {
        const user = firebase.auth().currentUser;
        if (!user) return null;

        try {
            const profileRef = firebase.database().ref(`users/${user.uid}/profile`);
            const snapshot = await profileRef.once('value');
            this.userProfile = snapshot.val() || {};
            return this.userProfile;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }

    parseAIResponse(result) {
        try {
            let text = result.text || '';
            const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
            return jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(text);
        } catch (error) {
            console.error('Error parsing AI response:', error);
            throw new Error('Could not parse AI response');
        }
    }    formatAnalysisResponse(parsedResult) {
        const foodItems = (parsedResult.foods || []).map(food => 
            typeof food === 'string' ? food : food.name || ''
        ).filter(Boolean);

        return {
            foodItems,
            nutrients: {
                calories: parsedResult.calories || parsedResult.macros?.calories || 0,
                protein: parsedResult.macros?.protein || 0,
                carbs: parsedResult.macros?.carbs || 0,
                fat: parsedResult.macros?.fat || 0
            },
            suggestions: parsedResult.suggestions || '',
            assessment: parsedResult.assessment || '',
            additionalNotes: parsedResult.additionalNotes || '',
            warnings: []
        };
    }

    async analyzeMeal(mealText) {
        try {
            await this.loadUserProfile();
            console.log('Analyzing meal:', mealText);

            const prompt = `Analyze this meal: "${mealText}"
            
            Focus on identifying foods and their nutritional content, and provide detailed insights.
            Common Indian foods reference:
            - Rice (1 cup cooked): 200 calories, 45g carbs, 4g protein, 0g fat
            - Roti/Chapati (1 piece): 120 calories, 20g carbs, 3g protein, 3g fat
            - Dal (1 cup): 150 calories, 28g carbs, 9g protein, 1g fat
            - Aloo Sabji (1 cup): 180 calories, 35g carbs, 4g protein, 3g fat

            Return a detailed JSON object with this structure:
            {
                "foods": ["list of foods with portions"],
                "calories": number,
                "macros": {
                    "protein": number (in grams),
                    "carbs": number (in grams),
                    "fat": number (in grams)
                },
                "assessment": "Brief assessment of the meal's nutritional balance",
                "suggestions": "Specific suggestions for improvement",
                "additionalNotes": "Notes about preparation, timing, combinations, and cultural context of the meal",
                "warnings": ["any relevant warnings"]
            }`;

            const result = await this.client.generateContent(prompt);
            console.log('Raw analysis result:', result);
            
            const parsedResult = this.parseAIResponse(result);
            if (!parsedResult || !parsedResult.macros) {
                throw new Error('Invalid response format from AI service');
            }
            
            return this.formatAnalysisResponse(parsedResult);
        } catch (error) {
            console.error('Meal analysis failed:', error);
            throw new Error('Failed to analyze meal: ' + error.message);
        }
    }

    async generateWeeklySummary(recentMeals) {
        try {
            await this.loadUserProfile();
            
            const prompt = `Analyze this week's meals and provide a summary:
            Meals: ${JSON.stringify(recentMeals)}
            User Profile: ${JSON.stringify(this.userProfile)}

            Generate a summary that includes:
            1. Overview of nutritional intake
            2. Progress towards goals
            3. Areas for improvement
            4. Recommendations for next week

            Return a JSON object with this structure:
            {
                "overview": "General summary of the week",
                "progress": "Progress towards goals",
                "improvements": ["List of areas to improve"],
                "recommendations": ["List of specific recommendations"],
                "stats": {
                    "avgCalories": number,
                    "avgProtein": number,
                    "goalAchievement": number,
                    "totalMeals": number
                }
            }`;

            const result = await this.client.generateContent(prompt);
            const summary = this.parseAIResponse(result);
            return summary;
        } catch (error) {
            console.error('Weekly summary generation failed:', error);
            throw new Error('Failed to generate weekly summary');
        }
    }

    async getHealthTip() {
        try {
            await this.loadUserProfile();
            
            const prompt = `Generate a personalized health tip based on this profile:
            ${JSON.stringify(this.userProfile)}

            Return a JSON object with this structure:
            {
                "tip": "The health tip text",
                "category": "nutrition|hydration|protein|general",
                "importance": "high|medium|low",
                "icon": "Relevant emoji for the tip"
            }`;

            const result = await this.client.generateContent(prompt);
            const tip = this.parseAIResponse(result);
            return tip;
        } catch (error) {
            console.error('Health tip generation failed:', error);
            throw new Error('Failed to generate health tip');
        }
    }
}
