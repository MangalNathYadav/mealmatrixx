// Goals management and progress tracking
class GoalsManager {
    constructor() {
        this.goals = null;
        this.loadGoals();
    }

    async loadGoals() {
        const user = firebase.auth().currentUser;
        if (!user) return null;

        try {
            const snapshot = await firebase.database()
                .ref(`users/${user.uid}/nutritionGoals`)
                .once('value');
            this.goals = snapshot.val();
            return this.goals;
        } catch (error) {
            console.error('Error loading goals:', error);
            return null;
        }
    }

    async calculateDailyProgress(meals) {
        if (!this.goals) await this.loadGoals();
        if (!this.goals || !meals) return null;

        const today = new Date().toDateString();
        const todaysMeals = meals.filter(meal => 
            new Date(meal.dateTime).toDateString() === today
        );

        const progress = {
            calories: {
                current: todaysMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
                target: this.goals.targetCalories,
                percentage: 0
            },
            macros: {
                protein: {
                    current: todaysMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
                    target: this.goals.proteinGoal,
                    percentage: 0
                },
                carbs: {
                    current: todaysMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
                    target: this.goals.carbsGoal,
                    percentage: 0
                },
                fat: {
                    current: todaysMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0),
                    target: this.goals.fatGoal,
                    percentage: 0
                }
            }
        };

        // Calculate percentages
        if (this.goals.targetCalories) {
            progress.calories.percentage = Math.round(
                (progress.calories.current / progress.calories.target) * 100
            );
        }

        ['protein', 'carbs', 'fat'].forEach(macro => {
            if (this.goals[`${macro}Goal`]) {
                progress.macros[macro].percentage = Math.round(
                    (progress.macros[macro].current / progress.macros[macro].target) * 100
                );
            }
        });

        return progress;
    }

    getRecommendedCalories() {
        if (!this.goals) return null;

        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            very: 1.725,
            extra: 1.9
        };

        const baseCalories = this.goals.targetCalories;
        const multiplier = activityMultipliers[this.goals.activityLevel] || 1.55;

        return Math.round(baseCalories * multiplier);
    }

    async updateGoalProgress(element) {
        const user = firebase.auth().currentUser;
        if (!user) return;

        try {
            const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
            const snapshot = await mealsRef.once('value');
            const meals = Object.values(snapshot.val() || {});

            const progress = await this.calculateDailyProgress(meals);
            if (!progress) return;

            this.renderProgressUI(element, progress);
        } catch (error) {
            console.error('Error updating goal progress:', error);
        }
    }    renderProgressUI(element, progress) {
        if (!element || !progress) return;

        // Show loading state
        element.querySelector('.goals-loading').style.display = 'block';
        element.querySelector('.goals-empty').style.display = 'none';
        element.querySelector('.goals-data').style.display = 'none';

        // If no goals are set, show empty state
        if (!this.goals || (!this.goals.targetCalories && !this.goals.proteinGoal && !this.goals.carbsGoal && !this.goals.fatGoal)) {
            element.querySelector('.goals-loading').style.display = 'none';
            element.querySelector('.goals-empty').style.display = 'block';
            return;
        }

        // Prepare the goals data HTML
        const goalsDataHTML = `
            ${this.goals.targetCalories ? `
                <div class="goal-stat-card">
                    <div class="goal-stat-header">
                        <h4 class="goal-stat-title">Daily Calories</h4>
                        <span class="goal-stat-icon">🔥</span>
                    </div>
                    <div class="goal-stat-value">${progress.calories.current}</div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill ${this.getProgressClass(progress.calories.percentage)}" 
                             style="width: ${Math.min(progress.calories.percentage, 100)}%"></div>
                    </div>
                    <div class="goal-stat-footer">
                        <span>Target: ${progress.calories.target}</span>
                        <span>${progress.calories.percentage}%</span>
                    </div>
                </div>
            ` : ''}

            ${Object.entries(progress.macros)
                .filter(([_, data]) => data.target)
                .map(([macro, data]) => `
                    <div class="goal-stat-card">
                        <div class="goal-stat-header">
                            <h4 class="goal-stat-title">Daily ${macro.charAt(0).toUpperCase() + macro.slice(1)}</h4>
                            <span class="goal-stat-icon">${this.getMacroIcon(macro)}</span>
                        </div>
                        <div class="goal-stat-value">${data.current}g</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill ${this.getProgressClass(data.percentage)}" 
                                 style="width: ${Math.min(data.percentage, 100)}%"></div>
                        </div>
                        <div class="goal-stat-footer">
                            <span>Target: ${data.target}g</span>
                            <span>${data.percentage}%</span>
                        </div>
                    </div>
                `).join('')}

            ${this.goals.weightGoal ? `
                <div class="goal-stat-card">
                    <div class="goal-stat-header">
                        <h4 class="goal-stat-title">Weight Goal</h4>
                        <span class="goal-stat-icon">⚖️</span>
                    </div>
                    <div class="goal-stat-value">${this.goals.weightGoal} kg</div>
                    <div class="goal-stat-footer">
                        <span>${this.goals.goalType.charAt(0).toUpperCase() + this.goals.goalType.slice(1)}</span>
                        <span>${this.goals.weeklyGoal ? `${this.goals.weeklyGoal} kg/week` : 'Maintain'}</span>
                    </div>
                </div>
            ` : ''}
        `;

        // Update the UI
        const goalsData = element.querySelector('.goals-data');
        goalsData.innerHTML = goalsDataHTML;
        
        element.querySelector('.goals-loading').style.display = 'none';
        element.querySelector('.goals-empty').style.display = 'none';
        goalsData.style.display = 'grid';
    }

    getProgressClass(percentage) {
        if (percentage <= 90) return 'good';
        if (percentage <= 110) return 'warning';
        return 'over';
    }

    getMacroIcon(macro) {
        const icons = {
            protein: '🥩',
            carbs: '🌾',
            fat: '🥑'
        };
        return icons[macro] || '📊';
    }

    // Additional tracking features
    async getWeeklyStats() {
        const user = firebase.auth().currentUser;
        if (!user) return null;

        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
            const snapshot = await mealsRef.once('value');
            const meals = Object.values(snapshot.val() || {});
            const recentMeals = meals.filter(meal => new Date(meal.dateTime) >= weekAgo);

            return {
                averageCalories: this.calculateAverageCalories(recentMeals),
                macroDistribution: this.calculateMacroDistribution(recentMeals),
                goalCompletion: this.calculateGoalCompletion(recentMeals),
                streaks: this.calculateStreaks(recentMeals),
                trends: this.analyzeTrends(recentMeals)
            };
        } catch (error) {
            console.error('Error getting weekly stats:', error);
            return null;
        }
    }

    calculateAverageCalories(meals) {
        if (!meals.length) return 0;
        const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        return Math.round(totalCalories / meals.length);
    }

    calculateMacroDistribution(meals) {
        const totals = {
            protein: 0,
            carbs: 0,
            fat: 0
        };

        meals.forEach(meal => {
            totals.protein += meal.protein || 0;
            totals.carbs += meal.carbs || 0;
            totals.fat += meal.fat || 0;
        });

        const total = totals.protein + totals.carbs + totals.fat;
        return {
            protein: total ? Math.round((totals.protein / total) * 100) : 0,
            carbs: total ? Math.round((totals.carbs / total) * 100) : 0,
            fat: total ? Math.round((totals.fat / total) * 100) : 0
        };
    }

    calculateGoalCompletion(meals) {
        if (!this.goals) return null;

        const daysInPeriod = 7;
        const dailyGoals = {
            calories: this.goals.targetCalories,
            protein: this.goals.proteinGoal,
            carbs: this.goals.carbsGoal,
            fat: this.goals.fatGoal
        };

        const successfulDays = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };

        // Group meals by day
        const mealsByDay = meals.reduce((acc, meal) => {
            const day = new Date(meal.dateTime).toDateString();
            if (!acc[day]) acc[day] = [];
            acc[day].push(meal);
            return acc;
        }, {});

        Object.values(mealsByDay).forEach(dayMeals => {
            const dayTotals = dayMeals.reduce((totals, meal) => {
                totals.calories += meal.calories || 0;
                totals.protein += meal.protein || 0;
                totals.carbs += meal.carbs || 0;
                totals.fat += meal.fat || 0;
                return totals;
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

            if (dayTotals.calories >= dailyGoals.calories * 0.9 && 
                dayTotals.calories <= dailyGoals.calories * 1.1) {
                successfulDays.calories++;
            }
            if (dayTotals.protein >= dailyGoals.protein) successfulDays.protein++;
            if (dayTotals.carbs >= dailyGoals.carbs) successfulDays.carbs++;
            if (dayTotals.fat >= dailyGoals.fat) successfulDays.fat++;
        });

        return {
            calories: Math.round((successfulDays.calories / daysInPeriod) * 100),
            protein: Math.round((successfulDays.protein / daysInPeriod) * 100),
            carbs: Math.round((successfulDays.carbs / daysInPeriod) * 100),
            fat: Math.round((successfulDays.fat / daysInPeriod) * 100)
        };
    }

    calculateStreaks(meals) {
        if (!meals.length || !this.goals) return { current: 0, longest: 0 };

        const dayStatuses = new Array(7).fill(false);
        const today = new Date().toDateString();

        meals.forEach(meal => {
            const mealDate = new Date(meal.dateTime).toDateString();
            const daysAgo = Math.floor((new Date(today) - new Date(mealDate)) / (1000 * 60 * 60 * 24));
            
            if (daysAgo < 7 && meal.calories >= this.goals.targetCalories * 0.9 && 
                meal.calories <= this.goals.targetCalories * 1.1) {
                dayStatuses[daysAgo] = true;
            }
        });

        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        dayStatuses.forEach((status, index) => {
            if (status) {
                tempStreak++;
                if (index === 0) currentStreak = tempStreak;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        });

        return { current: currentStreak, longest: longestStreak };
    }

    analyzeTrends(meals) {
        if (!meals.length) return null;

        // Sort meals by date
        const sortedMeals = meals.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        // Calculate daily averages
        const dailyAverages = {};
        sortedMeals.forEach(meal => {
            const day = new Date(meal.dateTime).toDateString();
            if (!dailyAverages[day]) {
                dailyAverages[day] = {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    count: 0
                };
            }
            dailyAverages[day].calories += meal.calories || 0;
            dailyAverages[day].protein += meal.protein || 0;
            dailyAverages[day].carbs += meal.carbs || 0;
            dailyAverages[day].fat += meal.fat || 0;
            dailyAverages[day].count++;
        });

        // Calculate trends
        const trends = {
            calories: this.calculateTrend(Object.values(dailyAverages).map(day => day.calories)),
            protein: this.calculateTrend(Object.values(dailyAverages).map(day => day.protein)),
            carbs: this.calculateTrend(Object.values(dailyAverages).map(day => day.carbs)),
            fat: this.calculateTrend(Object.values(dailyAverages).map(day => day.fat))
        };

        return trends;
    }

    calculateTrend(values) {
        if (values.length < 2) return 'neutral';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const difference = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (difference > 5) return 'increasing';
        if (difference < -5) return 'decreasing';
        return 'stable';
    }
}

// Export the goals manager
export default new GoalsManager();
