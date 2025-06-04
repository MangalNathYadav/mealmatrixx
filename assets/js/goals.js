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

    hasAnyGoals() {
        return !!(this.goals?.targetCalories || this.goals?.proteinGoal || this.goals?.carbsGoal || this.goals?.fatGoal);
    }

    showNoGoalMessage(card, message = 'Goal not set') {
        if (!card) return;
        
        const valueElement = card.querySelector('.goal-content');
        if (valueElement) {
            valueElement.innerHTML = `
                <div class="no-goal-message">
                    <span class="no-goal-text">${message}</span>
                    <a href="nutrition-goals.html" class="btn btn-primary btn-small">Set Your Goals</a>
                </div>
            `;
        }

        const progressBar = card.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }

    updateGoalsUI() {
        if (!this.goals) return;

        // Get all goal cards and sidebar
        const goalsGrid = document.querySelector('.goals-grid');
        const sidebar = document.querySelector('.dashboard-sidebar');
        if (!goalsGrid) return;

        // Handle visibility of sidebar based on goals existence
        if (sidebar) {
            if (!this.hasAnyGoals()) {
                sidebar.style.display = 'none';
            } else {
                sidebar.style.display = 'block';
                this.updateSidebarGoals(sidebar);
            }
        }

        // Show first-time user message if no goals are set
        if (!this.hasAnyGoals()) {
            const allCards = goalsGrid.querySelectorAll('.goal-card');
            allCards.forEach(card => {
                this.showNoGoalMessage(card, 'Set up your nutrition goals to start tracking');
            });
            return;
        }

        // Update calorie goal card
        const calorieCard = goalsGrid.querySelector('.goal-card:nth-child(1)');
        if (calorieCard) {
            if (!this.goals.targetCalories) {
                this.showNoGoalMessage(calorieCard, 'Set your daily calorie goal');
                return;
            }

            const caloriePercentage = this.getPercentage(this.dailyProgress.calories, this.goals.targetCalories);
            const content = calorieCard.querySelector('.goal-content');
            
            if (content) {
                content.innerHTML = `
                    <div class="goal-target">
                        <span class="goal-target-label">Target</span>
                        <span class="goal-target-value">${this.formatValue(this.goals.targetCalories, ' kcal')}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${caloriePercentage}%"></div>
                    </div>
                    <div class="goal-stats">
                        <span>${this.formatValue(this.dailyProgress.calories, ' kcal')} consumed</span>
                        <span>${caloriePercentage}%</span>
                    </div>
                `;
            }
        }

        // Update macro goal cards
        const macroData = [
            { name: 'Protein', icon: '🥩', current: this.dailyProgress.protein, target: this.goals.proteinGoal },
            { name: 'Carbs', icon: '🌾', current: this.dailyProgress.carbs, target: this.goals.carbsGoal },
            { name: 'Fat', icon: '🥑', current: this.dailyProgress.fat, target: this.goals.fatGoal }
        ];

        macroData.forEach((macro, index) => {
            const card = goalsGrid.querySelector(`.goal-card:nth-child(${index + 2})`);
            if (!card) return;

            if (!macro.target) {
                this.showNoGoalMessage(card, `Set your ${macro.name.toLowerCase()} goal`);
                return;
            }

            const percentage = this.getPercentage(macro.current, macro.target);
            const content = card.querySelector('.goal-content');
            
            if (content) {
                content.innerHTML = `
                    <div class="goal-target">
                        <span class="goal-target-label">Target</span>
                        <span class="goal-target-value">${this.formatValue(macro.target, 'g')}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="goal-stats">
                        <span>${this.formatValue(macro.current, 'g')} consumed</span>
                        <span>${percentage}%</span>
                    </div>
                `;
            }
        });
    }

    updateSidebarGoals(sidebar) {
        // Update calorie goals in sidebar
        const calorieGoalValue = sidebar.querySelector('.sidebar-section:nth-child(1) .goal-value');
        const calorieProgressFill = sidebar.querySelector('.sidebar-section:nth-child(1) .progress-fill');
        const calorieStats = sidebar.querySelector('.sidebar-section:nth-child(1) .goal-stats');

        if (calorieGoalValue && this.goals.targetCalories) {
            calorieGoalValue.textContent = `${this.formatValue(this.goals.targetCalories)} kcal`;
        }
        
        if (calorieProgressFill && calorieStats && this.goals.targetCalories) {
            const caloriePercentage = this.getPercentage(this.dailyProgress.calories, this.goals.targetCalories);
            calorieProgressFill.style.width = `${caloriePercentage}%`;
            calorieStats.innerHTML = `
                <span>${this.formatValue(this.dailyProgress.calories)} kcal consumed</span>
                <span>${caloriePercentage}%</span>
            `;
        }

        // Update macro goals in sidebar
        const macros = ['protein', 'carbs', 'fat'];
        macros.forEach((macro, index) => {
            const macroItem = sidebar.querySelector(`.sidebar-section:nth-child(2) .goal-item:nth-child(${index + 1})`);
            if (!macroItem) return;

            const value = this.goals[`${macro}Goal`];
            const goalValue = macroItem.querySelector('.goal-value');
            const progressFill = macroItem.querySelector('.progress-fill');
            const stats = macroItem.querySelector('.goal-stats');

            if (goalValue && value) {
                goalValue.textContent = `${this.formatValue(value)}g`;
            }

            if (progressFill && stats && value) {
                const percentage = this.getPercentage(this.dailyProgress[macro], value);
                progressFill.style.width = `${percentage}%`;
                stats.innerHTML = `
                    <span>${this.formatValue(this.dailyProgress[macro])}g consumed</span>
                    <span>${percentage}%</span>
                `;
            }
        });

        // Update health goals in sidebar
        const weightValue = sidebar.querySelector('.sidebar-section:nth-child(3) .goal-item:nth-child(1) .goal-value');
        const weeklyValue = sidebar.querySelector('.sidebar-section:nth-child(3) .goal-item:nth-child(2) .goal-value');
        const weightStats = sidebar.querySelector('.sidebar-section:nth-child(3) .goal-item:nth-child(1) .goal-stats span');
        const weeklyStats = sidebar.querySelector('.sidebar-section:nth-child(3) .goal-item:nth-child(2) .goal-stats span');

        if (weightValue && this.goals.weightGoal) {
            weightValue.textContent = `${this.formatValue(this.goals.weightGoal)} kg`;
        }

        if (weeklyValue && weightStats && weeklyStats && this.goals.weightGoal) {
            const weeklyGoal = this.goals.weeklyGoal || 0;
            const prefix = weeklyGoal > 0 ? '+' : '';
            weeklyValue.textContent = `${prefix}${this.formatValue(weeklyGoal)} kg`;
            
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

    generateAIPrompt() {
        if (!this.goals || !this.hasAnyGoals()) return null;

        // Calculate percentages for each goal
        const caloriePercentage = this.getPercentage(this.dailyProgress.calories, this.goals.targetCalories);
        const proteinPercentage = this.getPercentage(this.dailyProgress.protein, this.goals.proteinGoal);
        const carbsPercentage = this.getPercentage(this.dailyProgress.carbs, this.goals.carbsGoal);
        const fatPercentage = this.getPercentage(this.dailyProgress.fat, this.goals.fatGoal);

        let lowestMacro = 'protein';
        let lowestPercentage = proteinPercentage;
        
        if (carbsPercentage < lowestPercentage) {
            lowestMacro = 'carbs';
            lowestPercentage = carbsPercentage;
        }
        if (fatPercentage < lowestPercentage) {
            lowestMacro = 'fat';
            lowestPercentage = fatPercentage;
        }

        return `Based on the user's current daily progress and goals:

Daily Goals:
- Calories: ${this.goals.targetCalories} kcal (Currently: ${this.dailyProgress.calories} kcal, ${caloriePercentage}%)
- Protein: ${this.goals.proteinGoal}g (Currently: ${this.dailyProgress.protein}g, ${proteinPercentage}%)
- Carbs: ${this.goals.carbsGoal}g (Currently: ${this.dailyProgress.carbs}g, ${carbsPercentage}%)
- Fat: ${this.goals.fatGoal}g (Currently: ${this.dailyProgress.fat}g, ${fatPercentage}%)

Goal Type: ${this.goals.goalType}
Weight Goal: ${this.goals.weightGoal}kg (${this.goals.weeklyGoal > 0 ? 'gain' : 'lose'} ${Math.abs(this.goals.weeklyGoal)}kg per week)
Lowest macro: ${lowestMacro} at ${lowestPercentage}%

Provide 3 personalized nutrition tips focused on:
1. Overall nutrition strategy for ${this.goals.goalType} goal
2. Improving ${lowestMacro} intake which is currently low
3. Hydration recommendations based on ${this.dailyProgress.calories} calories consumed

Keep tips actionable and specific to their current progress.`;
    }
}

// Create and export a single instance
const goalsManager = new GoalsManager();
export default goalsManager;
