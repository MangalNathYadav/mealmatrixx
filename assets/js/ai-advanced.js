// Advanced AI Features for MealMatrix
import GeminiClient from './gemini-client-latest.js';

class AdvancedAI {
    constructor() {
        this.client = new GeminiClient();
    }

    // Generate personalized meal plan based on preferences and health goals
    async generateMealPlan(preferences) {
        const prompt = `Create a personalized meal plan based on these preferences:
        Goals: ${preferences.goals}
        Dietary Restrictions: ${preferences.restrictions}
        Calories Target: ${preferences.calorieTarget}
        Days: ${preferences.days}

        Return a JSON object with this structure:
        {
            "weeklyPlan": [
                {
                    "day": "Day name",
                    "meals": [
                        {
                            "type": "Breakfast/Lunch/Dinner",
                            "name": "Meal name",
                            "calories": number,
                            "ingredients": ["ingredients"],
                            "nutrients": {
                                "protein": "amount",
                                "carbs": "amount",
                                "fats": "amount"
                            }
                        }
                    ]
                }
            ],
            "groceryList": ["items"],
            "estimatedCost": "cost range",
            "preparationTips": ["tips"]
        }`;

        return this.client.generateContent(prompt);
    }

    // Recipe modification based on dietary needs
    async modifyRecipe(recipe, modifications) {
        const prompt = `Modify this recipe:
        Original Recipe: ${recipe}
        Required Modifications: ${modifications}

        Return a JSON object with:
        {
            "modifiedRecipe": {
                "name": "Recipe name",
                "ingredients": ["modified ingredients"],
                "instructions": ["steps"],
                "nutritionalChanges": {
                    "calories": "difference",
                    "protein": "difference",
                    "carbs": "difference",
                    "fats": "difference"
                }
            },
            "substitutionExplanations": ["why each change was made"]
        }`;

        return this.client.generateContent(prompt);
    }

    // Smart grocery list generator
    async generateGroceryList(meals, preferences) {
        const prompt = `Generate an optimized grocery list for these meals:
        Meals: ${JSON.stringify(meals)}
        Preferences: ${JSON.stringify(preferences)}

        Return a JSON object with:
        {
            "organizedList": {
                "produce": ["items"],
                "dairy": ["items"],
                "proteins": ["items"],
                "pantry": ["items"]
            },
            "estimatedCosts": {
                "total": "range",
                "perCategory": {}
            },
            "substitutionOptions": ["budget alternatives"],
            "storageInstructions": ["how to store items"]
        }`;

        return this.client.generateContent(prompt);
    }

    // Nutritional analysis with health insights
    async analyzeNutrition(mealHistory) {
        const prompt = `Analyze these meals for nutritional patterns and health insights:
        Meal History: ${JSON.stringify(mealHistory)}

        Return a JSON object with:
        {
            "nutritionalTrends": {
                "calories": "trend analysis",
                "macronutrients": {},
                "micronutrients": {}
            },
            "healthInsights": [
                {
                    "observation": "insight",
                    "impact": "health impact",
                    "recommendation": "what to do"
                }
            ],
            "balanceScore": "score/10",
            "recommendations": {
                "additions": ["foods to add"],
                "reductions": ["foods to reduce"],
                "substitutions": ["healthier swaps"]
            }
        }`;

        return this.client.generateContent(prompt);
    }

    // Social meal sharing recommendations
    async getSocialRecommendations(userProfile, mealHistory) {
        const prompt = `Generate social meal recommendations based on:
        Profile: ${JSON.stringify(userProfile)}
        History: ${JSON.stringify(mealHistory)}

        Return a JSON object with:
        {
            "trendingMeals": ["popular meals"],
            "healthyAlternatives": ["healthier versions"],
            "socialTags": ["relevant hashtags"],
            "sharingSuggestions": {
                "caption": "suggested caption",
                "tags": ["relevant tags"],
                "bestTimeToShare": "optimal sharing time"
            }
        }`;

        return this.client.generateContent(prompt);
    }
}

// Create and export a single instance
const advancedAI = new AdvancedAI();
export default advancedAI;
