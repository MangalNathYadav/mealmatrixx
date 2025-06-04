// Goals management and progress tracking
class GoalsManager {
    constructor() {
        this.goals = null;
        this.isLoading = false;
    }

    async loadGoals() {
        if (this.isLoading) return this.goals;
        this.isLoading = true;

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Please log in to view your goals');
            }

            const snapshot = await firebase.database()
                .ref(`users/${user.uid}/nutritionGoals`)
                .once('value');
            
            this.goals = snapshot.val();
            
            if (!this.goals) {
                throw new Error('No nutrition goals set. Click "Configure Goals" to get started!');
            }
            
            return this.goals;
        } catch (error) {
            console.error('Error loading goals:', error);
            throw error;
        } finally {
            this.isLoading = false;
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
                target: this.getRecommendedCalories(),
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
        if (progress.calories.target) {
            progress.calories.percentage = Math.round(
                (progress.calories.current / progress.calories.target) * 100
            );
        }

        Object.entries(progress.macros).forEach(([macro, data]) => {
            if (data.target) {
                data.percentage = Math.round(
                    (data.current / data.target) * 100
                );
            }
        });

        return progress;
    }

    getRecommendedCalories() {
        if (!this.goals?.targetCalories) return null;

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
        if (!element) return;
        
        const loadingEl = element.querySelector('.goals-loading');
        const emptyEl = element.querySelector('.goals-empty');
        const dataEl = element.querySelector('.goals-data');
        
        try {
            // Show loading state initially
            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            if (dataEl) dataEl.style.display = 'none';
            
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Please log in to view your goals');
            }

            // First ensure goals are loaded
            if (!this.goals) {
                await this.loadGoals();
            }
            
            // Load meals for today
            const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
            const snapshot = await mealsRef.once('value');
            const meals = snapshot.val() ? Object.values(snapshot.val()) : [];

            // Calculate and render progress
            const progress = await this.calculateDailyProgress(meals);
            await this.renderProgressUI(element, progress);

        } catch (error) {
            console.error('Error updating goal progress:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (dataEl) dataEl.style.display = 'none';
            
            // Show empty state with error message
            if (emptyEl) {
                emptyEl.style.display = 'block';
                const message = emptyEl.querySelector('p');
                if (message) {
                    message.textContent = error.message || 'Failed to load goals. Please try again.';
                }
            }
        }
    }

    async renderProgressUI(element, progress) {
        if (!element || !progress) return;

        // Check if we have any goals to display
        if (!this.goals || (!this.goals.targetCalories && !Object.values(progress.macros).some(macro => macro.target))) {
            throw new Error('No nutrition goals set. Click "Configure Goals" to get started!');
        }

        // Prepare the goals data HTML
        const goalsDataHTML = `
            ${progress.calories.target ? `
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
        const loadingEl = element.querySelector('.goals-loading');
        const emptyEl = element.querySelector('.goals-empty');
        const dataEl = element.querySelector('.goals-data');

        if (dataEl) {
            dataEl.innerHTML = goalsDataHTML;
            dataEl.style.display = 'grid';
        }
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'none';
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
}

// Create and export a single instance
const goalsManager = new GoalsManager();
export default goalsManager;
