// Goals Management Service
class GoalsManager {
    constructor() {
        this.goals = null;
        this.dailyProgress = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };
        this.isLoading = false;
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
        Object.keys(this.dailyProgress).forEach(key => {
            this.dailyProgress[key] = this.formatNumber(this.dailyProgress[key]);
        });

        this.updateGoalsUI();
    }

    updateGoalsUI() {
        if (!this.goals) return;
        const sidebar = document.querySelector('.dashboard-sidebar');
        
        // Handle visibility of sidebar based on goals existence
        if (sidebar) {
            if (!this.hasAnyGoals()) {
                sidebar.style.display = 'none';
            } else {
                sidebar.style.display = 'block';
                this.updateSidebarGoals(sidebar);
            }
        }

        // Update goal cards in the grid
        const elements = {
            calories: document.getElementById('caloriesProgress'),
            protein: document.getElementById('proteinProgress'),
            carbs: document.getElementById('carbsProgress'),
            fat: document.getElementById('fatProgress')
        };

        // Update each progress bar
        Object.entries(elements).forEach(([nutrient, element]) => {
            if (element) {
                const target = this.goals[`${nutrient}${nutrient === 'calories' ? 'Target' : 'Goal'}`];
                const current = this.dailyProgress[nutrient];
                const percentage = this.getPercentage(current, target);
                
                // Update progress bar fill
                const fillElement = element.querySelector('.progress-fill');
                if (fillElement) {
                    fillElement.style.width = `${percentage}%`;
                }

                // Update stats text
                const statsElement = element.querySelector('.goal-stats');
                if (statsElement) {
                    statsElement.innerHTML = `
                        <span>${current}${nutrient === 'calories' ? '' : 'g'} consumed</span>
                        <span>${percentage}%</span>
                    `;
                }
            }
        });
    }

    updateSidebarGoals(sidebar) {
        if (!sidebar || !this.goals) return;

        // Update calorie goals in sidebar
        const calorieGoalValue = sidebar.querySelector('.sidebar-section:nth-child(1) .goal-value');
        const calorieProgressFill = sidebar.querySelector('.sidebar-section:nth-child(1) .progress-fill');
        const calorieStats = sidebar.querySelector('.sidebar-section:nth-child(1) .goal-stats');

        if (calorieGoalValue && this.goals.targetCalories) {
            calorieGoalValue.textContent = `${this.formatNumber(this.goals.targetCalories)} kcal`;
        }
        
        if (calorieProgressFill && calorieStats && this.goals.targetCalories) {
            const caloriePercentage = this.getPercentage(this.dailyProgress.calories, this.goals.targetCalories);
            calorieProgressFill.style.width = `${caloriePercentage}%`;
            calorieStats.innerHTML = `
                <span>${this.formatNumber(this.dailyProgress.calories)} kcal consumed</span>
                <span>${caloriePercentage}%</span>
            `;
        }

        // Update macro goals in sidebar
        const macros = ['protein', 'carbs', 'fat'];
        const macroSection = sidebar.querySelector('.sidebar-section:nth-child(2)');
        
        if (macroSection) {
            macros.forEach((macro, index) => {
                const macroItem = macroSection.querySelector(`.goal-item:nth-child(${index + 1})`);
                if (!macroItem) return;

                const value = this.goals[`${macro}Goal`];
                const goalValue = macroItem.querySelector('.goal-value');
                const progressFill = macroItem.querySelector('.progress-fill');
                const stats = macroItem.querySelector('.goal-stats');

                if (goalValue && value) {
                    goalValue.textContent = `${this.formatNumber(value)}g`;
                }

                if (progressFill && stats && value) {
                    const percentage = this.getPercentage(this.dailyProgress[macro], value);
                    progressFill.style.width = `${percentage}%`;
                    stats.innerHTML = `
                        <span>${this.formatNumber(this.dailyProgress[macro])}g consumed</span>
                        <span>${percentage}%</span>
                    `;
                }
            });
        }

        // Update health goals in sidebar
        const healthSection = sidebar.querySelector('.sidebar-section:nth-child(3)');
        if (healthSection && this.goals.weightGoal) {
            const weightValue = healthSection.querySelector('.goal-item:nth-child(1) .goal-value');
            const weeklyValue = healthSection.querySelector('.goal-item:nth-child(2) .goal-value');
            const weightStats = healthSection.querySelector('.goal-item:nth-child(1) .goal-stats span');
            const weeklyStats = healthSection.querySelector('.goal-item:nth-child(2) .goal-stats span');

            if (weightValue) {
                weightValue.textContent = `${this.formatNumber(this.goals.weightGoal)} kg`;
            }

            if (weeklyValue && weightStats && weeklyStats) {
                const weeklyGoal = this.goals.weeklyGoal || 0;
                const prefix = weeklyGoal > 0 ? '+' : '';
                weeklyValue.textContent = `${prefix}${this.formatNumber(weeklyGoal)} kg`;
                
                const goalTypeText = this.goals.goalType === 'maintain' ? 
                    'Maintain Weight' : 
                    this.goals.goalType === 'gain' ? 
                    'Gain Muscle Mass' : 
                    'Lose Weight';
                    
                weightStats.textContent = goalTypeText;
                weeklyStats.textContent = weeklyGoal === 0 ? 
                    'Maintenance' : 
                    `Healthy ${weeklyGoal > 0 ? 'weight gain' : 'weight loss'} pace`;
            }
        }
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

    // UI Loading State
    showLoading(message) {
        const loadingOverlay = document.querySelector('.loading-overlay');
        const loadingMessage = document.querySelector('.loading-message');
        
        if (loadingOverlay && loadingMessage) {
            loadingMessage.textContent = message;
            loadingOverlay.classList.add('visible');
        }
    }

    hideLoading() {
        const loadingOverlay = document.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('visible');
        }
    }

    hasAnyGoals() {
        return !!(this.goals?.targetCalories || this.goals?.proteinGoal || this.goals?.carbsGoal || this.goals?.fatGoal);
    }
}

// Export a single instance
const goalsManager = new GoalsManager();
export default goalsManager;
