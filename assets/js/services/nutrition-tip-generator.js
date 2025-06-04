import GeminiClient from '../gemini-client-latest.js';

// Nutrition Tip Generator Service
class NutritionTipGenerator {
    constructor() {
        this.gemini = new GeminiClient();
        this.tipCategories = {
            general: { icon: '✨', iconClass: 'general' },
            protein: { icon: '🥩', iconClass: 'protein' },
            hydration: { icon: '💧', iconClass: 'hydration' }
        };
    }

    // Generate personalized tips based on user data and meals
    async generateTips(userData, mealsData) {
        try {
            const prompt = this.constructPrompt(userData, mealsData);
            if (!prompt) {
                return this.getFallbackTips();
            }

            const result = await this.gemini.generateContent(prompt);
            
            // Parse the result and ensure proper structure
            let tips;
            if (typeof result === 'string') {
                try {
                    tips = JSON.parse(result);
                } catch {
                    console.error('Failed to parse Gemini response');
                    return this.getFallbackTips();
                }
            } else {
                tips = result;
            }

            // Validate and format tips
            return {
                general: {
                    icon: '🎯',
                    iconClass: 'general',
                    tip: tips.general || "Maintain a balanced diet with variety of nutrients."
                },
                protein: {
                    icon: '🥩',
                    iconClass: 'protein',
                    tip: tips.protein || "Include lean proteins in your meals for muscle health."
                },
                hydration: {
                    icon: '💧',
                    iconClass: 'hydration',
                    tip: tips.hydration || "Stay hydrated throughout the day."
                }
            };

        } catch (error) {
            console.error('Error generating nutrition tips:', error);
            return this.getFallbackTips();
        }
    }

    constructPrompt(userData, mealsData) {
        if (!userData?.nutritionGoals) return null;

        const goals = userData.nutritionGoals;
        const profile = userData.profile || {};
        
        // Calculate today's totals
        const today = new Date().toDateString();
        const todayMeals = mealsData ? Object.values(mealsData).filter(meal => 
            new Date(meal.dateTime).toDateString() === today
        ) : [];

        const dailyTotals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };

        todayMeals.forEach(meal => {
            dailyTotals.calories += parseFloat(meal.calories) || 0;
            dailyTotals.protein += parseFloat(meal.protein) || 0;
            dailyTotals.carbs += parseFloat(meal.carbs) || 0;
            dailyTotals.fat += parseFloat(meal.fat) || 0;
        });

        // Calculate percentages
        const getPercentage = (current, target) => {
            if (!target || !current) return 0;
            return Math.round((current / target) * 100);
        };

        const percentages = {
            calories: getPercentage(dailyTotals.calories, goals.targetCalories),
            protein: getPercentage(dailyTotals.protein, goals.proteinGoal),
            carbs: getPercentage(dailyTotals.carbs, goals.carbsGoal),
            fat: getPercentage(dailyTotals.fat, goals.fatGoal)
        };

        return `You are a professional nutritionist AI. Based on the user's current daily progress and goals, generate three personalized nutrition tips.

User Profile:
- Diet Type: ${profile.dietType || 'Not specified'}
- Goal Type: ${goals.goalType} (${goals.weeklyGoal > 0 ? 'gain' : 'lose'} ${Math.abs(goals.weeklyGoal)}kg/week)
- Target Weight: ${goals.weightGoal}kg

Daily Goals vs Progress:
- Calories: ${goals.targetCalories}kcal (Current: ${dailyTotals.calories}kcal, ${percentages.calories}%)
- Protein: ${goals.proteinGoal}g (Current: ${dailyTotals.protein}g, ${percentages.protein}%)
- Carbs: ${goals.carbsGoal}g (Current: ${dailyTotals.carbs}g, ${percentages.carbs}%)
- Fat: ${goals.fatGoal}g (Current: ${dailyTotals.fat}g, ${percentages.fat}%)

Today's Meals:
${todayMeals.map(meal => `- ${meal.name} (${meal.calories}kcal)`).join('\n')}

Return a JSON object with exactly these three tips:
{
    "general": "A tip about overall nutrition strategy based on their goal type (${goals.goalType}) and current calorie balance",
    "protein": "A specific protein-related tip based on their current protein intake and goal",
    "hydration": "A hydration tip considering their calorie intake and activity level"
}

Make tips specific, actionable, and personalized to their current progress. Consider their diet type and goals.`;
    }

    getFallbackTips() {
        return {
            general: {
                icon: '✨',
                iconClass: 'general',
                tip: "Focus on eating a balanced diet with a variety of nutrients to meet your goals."
            },
            protein: {
                icon: '🥩',
                iconClass: 'protein',
                tip: "Include a good source of protein with each meal to support your health goals."
            },
            hydration: {
                icon: '💧',
                iconClass: 'hydration',
                tip: "Stay hydrated! Aim for 8 glasses of water daily."
            }
        };
    }
}

// Create and export instance
const nutritionTipGenerator = new NutritionTipGenerator();
export default nutritionTipGenerator;
