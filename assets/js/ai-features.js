import GeminiClient from './gemini-client-latest.js';

// AI Features for MealMatrix
class MealAI {
    constructor() {
        // Initialize Gemini client using config
        this.client = new GeminiClient();
        this.userProfile = null;
    }

    // Load user profile data
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

    // Check for allergies and dietary conflicts
    checkDietaryConflicts(foods) {
        if (!this.userProfile || !foods) return [];

        const warnings = [];
        const allergies = this.userProfile.allergies ? 
            this.userProfile.allergies.toLowerCase().split(/[,\n]/).map(a => a.trim()) : [];
        const restrictions = this.userProfile.restrictions ?
            this.userProfile.restrictions.toLowerCase().split(/[,\n]/).map(r => r.trim()) : [];
        const dietType = this.userProfile.dietType;

        // Check each food against allergies and restrictions
        foods.forEach(food => {
            const foodLower = food.toLowerCase();
            
            // Check allergies
            allergies.forEach(allergy => {
                if (foodLower.includes(allergy)) {
                    warnings.push({
                        type: 'allergy',
                        severity: 'high',
                        message: `⚠️ Warning: ${food} conflicts with your allergy to ${allergy}`
                    });
                }
            });

            // Check dietary restrictions
            restrictions.forEach(restriction => {
                if (foodLower.includes(restriction)) {
                    warnings.push({
                        type: 'restriction',
                        severity: 'medium',
                        message: `⚠️ Note: ${food} conflicts with your dietary restriction: ${restriction}`
                    });
                }
            });

            // Check diet type conflicts
            if (dietType) {
                const veganFoods = ['meat', 'fish', 'chicken', 'beef', 'pork', 'lamb', 'egg', 'milk', 'dairy', 'cheese', 'butter'];
                const vegetarianFoods = ['meat', 'fish', 'chicken', 'beef', 'pork', 'lamb'];
                const pescatarianFoods = ['meat', 'chicken', 'beef', 'pork', 'lamb'];

                if (dietType === 'vegan' && veganFoods.some(f => foodLower.includes(f))) {
                    warnings.push({
                        type: 'diet',
                        severity: 'medium',
                        message: `Note: ${food} is not suitable for a vegan diet`
                    });
                } else if (dietType === 'vegetarian' && vegetarianFoods.some(f => foodLower.includes(f))) {
                    warnings.push({
                        type: 'diet',
                        severity: 'medium',
                        message: `Note: ${food} is not suitable for a vegetarian diet`
                    });
                } else if (dietType === 'pescatarian' && pescatarianFoods.some(f => foodLower.includes(f))) {
                    warnings.push({
                        type: 'diet',
                        severity: 'medium',
                        message: `Note: ${food} is not suitable for a pescatarian diet`
                    });
                }
            }
        });

        return warnings;
    }

    // Analyze a meal from free text input
    async analyzeMeal(mealText) {
        try {
            await this.loadUserProfile(); // Load user profile before analysis
            console.log('Analyzing meal:', mealText);

            let dietaryContext = '';
            if (this.userProfile) {
                dietaryContext = `
                Consider the following dietary context:
                Diet Type: ${this.userProfile.dietType || 'No specific diet'}
                Allergies: ${this.userProfile.allergies || 'None'}
                Restrictions: ${this.userProfile.restrictions || 'None'}
                Health Conditions: ${this.userProfile.healthConditions || 'None'}
                `;
            }

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

            const result = await this.client.generateContent(prompt);
            console.log('Raw analysis result:', result);
            
            let parsedResult;
            if (result.text && typeof result.text === 'string') {
                const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/);
                if (jsonMatch && jsonMatch[1]) {
                    parsedResult = JSON.parse(jsonMatch[1]);
                } else {
                    parsedResult = JSON.parse(result.text);
                }
            }

            if (!parsedResult) {
                throw new Error('Invalid response format from AI service');
            }

            // Add dietary conflict warnings
            const conflictWarnings = this.checkDietaryConflicts(parsedResult.foods);
            if (conflictWarnings.length > 0) {
                parsedResult.warnings = [
                    ...(parsedResult.warnings || []),
                    ...conflictWarnings.map(w => w.message)
                ];
            }

            console.log('Final analyzed result:', parsedResult);
            return parsedResult;
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

    // Get a random health tip
    async getHealthTip() {
        try {
            console.log('Getting random health tip');
            const result = await this.client.generateHealthTip();
            console.log('Health tip result:', result);
            return result;
        } catch (error) {
            console.error('Health tip generation failed:', error);
            return {
                title: "Balanced Nutrition",
                tip: "Aim for a colorful plate at each meal. Different colored fruits and vegetables provide various nutrients essential for overall health.",
                category: "nutrition"
            };
        }
    }
}

// Create and export a single instance
const ai = new MealAI();
export default ai;
