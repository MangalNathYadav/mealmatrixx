// Goals management and progress tracking
class GoalsManager {
    constructor() {
        this.goals = null;
        this.isLoading = false;
        this.dailyProgress = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('app-loading-overlay');
        const textElement = overlay?.querySelector('#app-loading-text');
        const subtextElement = overlay?.querySelector('#app-loading-subtext');
        
        if (textElement) textElement.textContent = 'Loading Goals';
        if (subtextElement) subtextElement.textContent = message;
        if (overlay) overlay.classList.add('visible');
    }

    hideLoading() {
        const overlay = document.getElementById('app-loading-overlay');
        if (overlay) overlay.classList.remove('visible');
    }

    async loadGoals() {
        if (this.isLoading) return this.goals;
        this.isLoading = true;
        this.showLoading('Loading your nutrition goals...');

        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Please log in to view your goals');

            const snapshot = await firebase.database()
                .ref(`users/${user.uid}/nutritionGoals`)
                .once('value');
              this.goals = snapshot.val() || {
                targetCalories: null,
                proteinGoal: null,
                carbsGoal: null,
                fatGoal: null,
                weightGoal: null,
                goalType: 'maintain',
                weeklyGoal: 0
            };
            
            // Set up real-time listener for today's meals
            this.setupMealsListener(user.uid);
            
            return this.goals;
        } catch (error) {
            console.error('Error loading goals:', error);
            throw error;
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    setupMealsListener(userId) {
        const mealsRef = firebase.database().ref(`users/${userId}/meals`);
        mealsRef.on('value', (snapshot) => {
            const meals = snapshot.val();
            this.updateDailyProgress(meals);
        });
    }

    formatNumber(num) {
        if (num === null || num === undefined) return 0;
        return Math.round(num * 10) / 10;
    }

    getPercentage(current, target) {
        if (!target || !current) return 0;
        const percentage = (current / target) * 100;
        return Math.min(Math.max(Math.round(percentage), 0), 100);
    }

    updateDailyProgress(meals) {
        const today = new Date().toDateString();
        const todayMeals = meals ? Object.values(meals).filter(meal => 
            new Date(meal.dateTime).toDateString() === today
        ) : [];

        // Reset daily progress
        this.dailyProgress = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };

        // Calculate totals from today's meals
        todayMeals.forEach(meal => {
            this.dailyProgress.calories += parseFloat(meal.calories) || 0;
            this.dailyProgress.protein += parseFloat(meal.protein) || 0;
            this.dailyProgress.carbs += parseFloat(meal.carbs) || 0;
            this.dailyProgress.fat += parseFloat(meal.fat) || 0;
        });

        // Round the values to 1 decimal place
        this.dailyProgress = {
            calories: this.formatNumber(this.dailyProgress.calories),
            protein: this.formatNumber(this.dailyProgress.protein),
            carbs: this.formatNumber(this.dailyProgress.carbs),
            fat: this.formatNumber(this.dailyProgress.fat)
        };

        this.updateGoalsUI();
    }

    formatValue(value, unit = '') {
        if (value === undefined || value === null) return '--';
        return `${this.formatNumber(value)}${unit}`;
    }

    updateGoalsUI() {
        if (!this.goals) return;

        // Update calorie goal card
        const calorieCard = document.querySelector('.goals-card:nth-child(1)');
        if (calorieCard) {
            // Use targetCalories instead of calorieGoal
            const caloriePercentage = this.getPercentage(this.dailyProgress.calories, this.goals.targetCalories);
            const goalText = this.formatValue(this.goals.targetCalories, ' kcal');
            const goalValue = calorieCard.querySelector('.goal-item-value');
            if (goalValue) {
                goalValue.innerHTML = `
                    <span style="color: ${this.goals.targetCalories ? 'var(--primary-color)' : '#666'}">
                        ${goalText}
                    </span>
                `;
            }
            
            const progressContainer = calorieCard.querySelector('.goal-progress');
            if (progressContainer) {
                if (this.goals.targetCalories) {
                    progressContainer.style.display = 'block';
                    const progressFill = progressContainer.querySelector('.goal-progress-fill');
                    if (progressFill) {
                        progressFill.style.width = `${caloriePercentage}%`;
                    }
                    const labels = progressContainer.querySelectorAll('.goal-progress-labels span');
                    if (labels.length >= 2) {
                        labels[0].textContent = `${this.formatValue(this.dailyProgress.calories, ' kcal')} consumed`;
                        labels[1].textContent = `${caloriePercentage}%`;
                    }
                } else {
                    progressContainer.style.display = 'none';
                }
            }
        }

        // Update macro goals card
        const macroCard = document.querySelector('.goals-card:nth-child(2)');
        if (macroCard) {
            const macros = [
                { name: 'Protein', current: this.dailyProgress.protein, target: this.goals.proteinGoal },
                { name: 'Carbs', current: this.dailyProgress.carbs, target: this.goals.carbsGoal },
                { name: 'Fat', current: this.dailyProgress.fat, target: this.goals.fatGoal }
            ];

            macros.forEach((macro, index) => {
                const item = macroCard.querySelectorAll('.goal-item')[index];
                if (item) {
                    const percentage = this.getPercentage(macro.current, macro.target);
                    const goalText = this.formatValue(macro.target, 'g');
                    const valueElement = item.querySelector('.goal-item-value');
                    if (valueElement) {
                        valueElement.innerHTML = `
                            <span style="color: ${macro.target ? 'var(--primary-color)' : '#666'}">
                                ${goalText}
                            </span>
                        `;
                    }

                    const progressContainer = item.querySelector('.goal-progress');
                    if (progressContainer) {
                        if (macro.target) {
                            progressContainer.style.display = 'block';
                            const progressFill = progressContainer.querySelector('.goal-progress-fill');
                            if (progressFill) {
                                progressFill.style.width = `${percentage}%`;
                            }
                            const labels = progressContainer.querySelectorAll('.goal-progress-labels span');
                            if (labels.length >= 2) {
                                labels[0].textContent = `${this.formatValue(macro.current, 'g')} consumed`;
                                labels[1].textContent = `${percentage}%`;
                            }
                        } else {
                            progressContainer.style.display = 'none';
                        }
                    }
                }
            });
        }

        // Update health goals card
        const healthCard = document.querySelector('.goals-card:nth-child(3)');
        if (healthCard) {            const targetWeight = this.formatValue(this.goals.weightGoal, ' kg');
            const weightValueElement = healthCard.querySelector('.goal-item-value');
            if (weightValueElement) {
                weightValueElement.innerHTML = `
                    <span style="color: ${this.goals.weightGoal ? 'var(--primary-color)' : '#666'}">
                        ${targetWeight}
                    </span>
                `;
            }
            
            const weeklyGoal = this.goals.weeklyGoal || 0;
            const weeklyGoalElement = healthCard.querySelectorAll('.goal-item-value')[1];
            if (weeklyGoalElement) {
                const sign = weeklyGoal > 0 ? '+' : '';
                weeklyGoalElement.innerHTML = `
                    <span style="color: ${weeklyGoal ? 'var(--primary-color)' : '#666'}">
                        ${sign}${this.formatValue(weeklyGoal, ' kg')}
                    </span>
                `;
            }

            const goalType = this.goals.goalType || 'Not set';
            const subtitle = healthCard.querySelector('.goal-item-subtitle');
            if (subtitle) {
                subtitle.textContent = goalType;
            }
        }
    }
}

// Create and export a single instance
const goalsManager = new GoalsManager();
export default goalsManager;
