// Nutrition Tip Generator Service
class NutritionTipGenerator {
    constructor() {
        this.tipCategories = {
            nutrition: { icon: '🥗', iconClass: 'nutrition' },
            protein: { icon: '🥩', iconClass: 'protein' },
            hydration: { icon: '💧', iconClass: 'hydration' },
            wellness: { icon: '✨', iconClass: 'wellness' },
            fitness: { icon: '🏋️‍♂️', iconClass: 'fitness' },
            mindfulness: { icon: '🧘‍♀️', iconClass: 'mindfulness' }
        };
    }

    // Generate personalized tips based on user data and meals
    async generateTips(userData, mealsData) {
        try {
            const tips = [];

            // Profile-based tips
            if (userData.profile) {
                const profile = userData.profile;
                const dietType = profile.dietType;

                // Diet-specific tips
                if (dietType) {
                    tips.push(this.getDietTypeTip(dietType));
                }

                // Health condition tips
                if (profile.healthConditions) {
                    tips.push(this.getHealthConditionTip(profile.healthConditions));
                }
            }

            // Goal-based tips
            if (userData.nutritionGoals) {
                const goals = userData.nutritionGoals;
                tips.push(this.getGoalBasedTip(goals));
            }

            // Meal pattern tips
            if (mealsData) {
                const mealPatterns = this.analyzeMealPatterns(mealsData);
                tips.push(this.getMealPatternTip(mealPatterns));
            }

            // Add some general tips if we don't have enough
            while (tips.length < 3) {
                tips.push(this.getGeneralTip());
            }

            return tips;
        } catch (error) {
            console.error('Error generating nutrition tips:', error);
            return this.getFallbackTips();
        }
    }

    getDietTypeTip(dietType) {
        const tips = {
            vegan: {
                icon: '🌱',
                iconClass: 'nutrition',
                tip: "Remember to include B12 supplements and iron-rich foods like leafy greens in your vegan diet."
            },
            vegetarian: {
                icon: '🥗',
                iconClass: 'nutrition',
                tip: "Include a variety of plant-based proteins like legumes, nuts, and quinoa for complete nutrition."
            },
            pescatarian: {
                icon: '🐟',
                iconClass: 'nutrition',
                tip: "Fatty fish like salmon and mackerel are great sources of omega-3 fatty acids."
            },
            default: {
                icon: '🥘',
                iconClass: 'nutrition',
                tip: "Aim for a balanced plate with lean proteins, whole grains, and plenty of vegetables."
            }
        };

        return tips[dietType] || tips.default;
    }

    getHealthConditionTip(conditions) {
        // Simple condition-based tips
        return {
            icon: '❤️',
            iconClass: 'wellness',
            tip: "Work with your healthcare provider to ensure your diet supports your health conditions."
        };
    }

    getGoalBasedTip(goals) {
        const { goalType, weeklyGoal } = goals;
        
        const tips = {
            lose: {
                icon: '⚖️',
                iconClass: 'fitness',
                tip: `Focus on nutrient-dense, low-calorie foods to support your weight loss goal of ${weeklyGoal}kg per week.`
            },
            gain: {
                icon: '💪',
                iconClass: 'fitness',
                tip: "Include healthy calorie-dense foods like nuts, avocados, and lean proteins for muscle gain."
            },
            maintain: {
                icon: '✓',
                iconClass: 'check',
                tip: "Keep tracking your meals consistently to maintain your healthy weight."
            }
        };

        return tips[goalType] || tips.maintain;
    }

    analyzeMealPatterns(meals) {
        // Simple pattern analysis
        const totalMeals = Object.keys(meals).length;
        const recentMeals = Object.values(meals)
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
            .slice(0, 7);

        return {
            frequency: totalMeals / 7, // meals per day
            recentMeals
        };
    }

    getMealPatternTip(patterns) {
        const { frequency } = patterns;

        if (frequency < 3) {
            return {
                icon: '⏰',
                iconClass: 'timing',
                tip: "Try to eat regular meals throughout the day to maintain stable energy levels."
            };
        }

        return {
            icon: '✓',
            iconClass: 'check',
            tip: "Great job maintaining regular meal times! This helps regulate metabolism."
        };
    }

    getGeneralTip() {
        const generalTips = [
            {
                icon: '🌈',
                iconClass: 'nutrition',
                tip: "Eat a rainbow of fruits and vegetables to get diverse nutrients."
            },
            {
                icon: '💧',
                iconClass: 'hydration',
                tip: "Stay hydrated! Aim for 8 glasses of water daily."
            },
            {
                icon: '🏃‍♂️',
                iconClass: 'fitness',
                tip: "Combine healthy eating with regular physical activity for best results."
            }
        ];

        return generalTips[Math.floor(Math.random() * generalTips.length)];
    }

    getFallbackTips() {
        return [
            {
                icon: '✨',
                iconClass: 'general',
                tip: "Set your nutrition goals in the profile section to get personalized recommendations!"
            },
            {
                icon: '🥗',
                iconClass: 'nutrition',
                tip: "Try to include a variety of colorful fruits and vegetables in your meals for balanced nutrition."
            },
            {
                icon: '💧',
                iconClass: 'hydration',
                tip: "Staying hydrated is key! Aim to drink water throughout the day."
            }
        ];
    }
}

// Create and export instance
const nutritionTipGenerator = new NutritionTipGenerator();
export default nutritionTipGenerator;
