// Nutrition Tip Generator for MealMatrix
class NutritionTipGenerator {
    constructor() {
        this.tips = [];
    }

    async generateTips(userData, mealsData) {
        const tips = [];
        const today = new Date().toDateString();
        
        // Get today's meals
        const todayMeals = mealsData ? Object.values(mealsData).filter(meal => 
            new Date(meal.dateTime).toDateString() === today
        ) : [];

        // Calculate daily totals
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

        // Get user's goals
        const goals = userData.nutritionGoals || {};
        
        // Check macronutrient goals and generate tips
        if (goals.proteinGoal) {
            const proteinPercentage = (dailyTotals.protein / goals.proteinGoal) * 100;
            if (proteinPercentage < 50) {
                tips.push({
                    icon: '🥩',
                    iconClass: 'protein',
                    tip: `You're at ${Math.round(proteinPercentage)}% of your protein goal. Consider adding lean proteins like chicken, fish, or legumes to your next meal.`
                });
            } else if (proteinPercentage > 90) {
                tips.push({
                    icon: '✅',
                    iconClass: 'success',
                    tip: `Great job! You're close to meeting your protein goal for the day.`
                });
            }
        }

        if (goals.carbsGoal) {
            const carbsPercentage = (dailyTotals.carbs / goals.carbsGoal) * 100;
            if (carbsPercentage < 30) {
                tips.push({
                    icon: '🌾',
                    iconClass: 'carbs',
                    tip: `Your carb intake is low today. Consider adding whole grains, fruits, or vegetables to maintain energy levels.`
                });
            } else if (carbsPercentage > 100) {
                tips.push({
                    icon: '⚠️',
                    iconClass: 'warning',
                    tip: `You've exceeded your carbs goal. Consider balancing with protein-rich foods for your next meal.`
                });
            }
        }

        if (goals.fatGoal) {
            const fatPercentage = (dailyTotals.fat / goals.fatGoal) * 100;
            if (fatPercentage < 40) {
                tips.push({
                    icon: '🥑',
                    iconClass: 'fats',
                    tip: `Include healthy fats like avocados, nuts, or olive oil to reach your fat intake goal.`
                });
            }
        }

        // Check calorie goals
        if (goals.targetCalories) {
            const caloriePercentage = (dailyTotals.calories / goals.targetCalories) * 100;
            if (caloriePercentage < 50 && new Date().getHours() >= 14) {
                tips.push({
                    icon: '🔥',
                    iconClass: 'calories',
                    tip: `You're quite below your calorie goal. Make sure to eat enough to maintain energy and meet nutritional needs.`
                });
            } else if (caloriePercentage > 90) {
                tips.push({
                    icon: '📊',
                    iconClass: 'info',
                    tip: `You're close to your daily calorie goal. Consider lighter options for remaining meals.`
                });
            }
        }

        // Check meal timing
        if (todayMeals.length > 0) {
            const lastMealTime = Math.max(...todayMeals.map(meal => new Date(meal.dateTime).getTime()));
            const hoursSinceLastMeal = (Date.now() - lastMealTime) / (1000 * 60 * 60);
            
            if (hoursSinceLastMeal > 5 && new Date().getHours() >= 11) {
                tips.push({
                    icon: '⏰',
                    iconClass: 'timing',
                    tip: `It's been ${Math.round(hoursSinceLastMeal)} hours since your last meal. Consider having a nutritious snack to maintain energy levels.`
                });
            }
        }

        // Check diet type specific tips
        if (userData.dietType) {
            switch(userData.dietType.toLowerCase()) {
                case 'vegan':
                    tips.push({
                        icon: '🌱',
                        iconClass: 'diet',
                        tip: `Remember to include vitamin B12 rich foods or supplements in your vegan diet.`
                    });
                    break;
                case 'vegetarian':
                    if (dailyTotals.protein < (goals.proteinGoal * 0.3)) {
                        tips.push({
                            icon: '🥜',
                            iconClass: 'diet',
                            tip: `Try adding plant-based proteins like lentils, quinoa, or tofu to meet your protein needs.`
                        });
                    }
                    break;
                case 'keto':
                    if (dailyTotals.carbs > 50) {
                        tips.push({
                            icon: '📉',
                            iconClass: 'diet',
                            tip: `Your carb intake is higher than recommended for keto. Aim to stay under 50g of carbs daily.`
                        });
                    }
                    break;
            }
        }

        // Always include a hydration reminder
        tips.push({
            icon: '💧',
            iconClass: 'hydration',
            tip: `Stay hydrated! Aim for 8 glasses of water today.`
        });

        // Return 3 random tips from the generated set
        return this.shuffleArray(tips).slice(0, 3);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

export default new NutritionTipGenerator();
