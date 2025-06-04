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
    }    setupMealsListener(userId) {
        // Listen for meals changes
        const mealsRef = firebase.database().ref(`users/${userId}/meals`);
        mealsRef.on('value', (snapshot) => {
            const meals = snapshot.val();
            this.updateDailyProgress(meals);
        });

        // Listen for nutrition goals changes
        const goalsRef = firebase.database().ref(`users/${userId}/nutritionGoals`);
        goalsRef.on('value', async (snapshot) => {
            const newGoals = snapshot.val();
            if (newGoals) {
                // Update all goals, including health goals
                this.goals = {
                    ...this.goals,
                    targetCalories: this.getValidatedValue(newGoals.targetCalories),
                    proteinGoal: this.getValidatedValue(newGoals.proteinGoal),
                    carbsGoal: this.getValidatedValue(newGoals.carbsGoal),
                    fatGoal: this.getValidatedValue(newGoals.fatGoal),
                    weightGoal: this.getValidatedValue(newGoals.weightGoal),
                    goalType: newGoals.goalType || 'maintain',
                    weeklyGoal: this.getValidatedValue(newGoals.weeklyGoal, 0)
                };
                this.updateGoalsUI(); // This updates both welcome section and sidebar
            }
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

        // Calculate totals from today's meals with validation
        todayMeals.forEach(meal => {
            this.dailyProgress.calories += this.getValidatedValue(parseFloat(meal.calories));
            this.dailyProgress.protein += this.getValidatedValue(parseFloat(meal.protein));
            this.dailyProgress.carbs += this.getValidatedValue(parseFloat(meal.carbs));
            this.dailyProgress.fat += this.getValidatedValue(parseFloat(meal.fat));
        });

        // Format values to 1 decimal place
        Object.keys(this.dailyProgress).forEach(key => {
            this.dailyProgress[key] = this.formatNumber(this.dailyProgress[key]);
        });

        // Update both UI elements
        this.updateGoalsUI();
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
            if (!this.validateGoalValue(this.goals.targetCalories)) {
                this.showNoGoalMessage(calorieCard, 'Set your daily calorie goal');
                return;
            }

            const caloriePercentage = this.getPercentage(this.dailyProgress.calories, this.goals.targetCalories);
            const progressStyle = this.getProgressStyle(caloriePercentage);
            const content = calorieCard.querySelector('.goal-content');
            
            if (content) {
                content.innerHTML = `
                    <div class="goal-target">
                        <span class="goal-target-label">Target</span>
                        <span class="goal-target-value">${this.formatValue(this.goals.targetCalories, ' kcal')}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressStyle}" style="width: ${caloriePercentage}%"></div>
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

            if (!this.validateGoalValue(macro.target)) {
                this.showNoGoalMessage(card, `Set your ${macro.name.toLowerCase()} goal`);
                return;
            }

            const percentage = this.getPercentage(macro.current, macro.target);
            const progressStyle = this.getProgressStyle(percentage);
            const content = card.querySelector('.goal-content');
            
            if (content) {
                content.innerHTML = `
                    <div class="goal-target">
                        <span class="goal-target-label">Target</span>
                        <span class="goal-target-value">${this.formatValue(macro.target, 'g')}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${progressStyle}" style="width: ${percentage}%"></div>
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
        if (!sidebar || !this.goals) return;

        // Update calorie goals in sidebar
        const calorieGoalValue = sidebar.querySelector('.sidebar-section:nth-child(1) .goal-value');
        const calorieProgressFill = sidebar.querySelector('.sidebar-section:nth-child(1) .progress-fill');
        const calorieStats = sidebar.querySelector('.sidebar-section:nth-child(1) .goal-stats');

        if (calorieGoalValue && this.validateGoalValue(this.goals.targetCalories)) {
            calorieGoalValue.textContent = `${this.formatNumber(this.goals.targetCalories)} kcal`;
        }
        
        if (calorieProgressFill && calorieStats && this.validateGoalValue(this.goals.targetCalories)) {
            const caloriePercentage = this.getPercentage(this.dailyProgress.calories, this.goals.targetCalories);
            const progressStyle = this.getProgressStyle(caloriePercentage);
            
            calorieProgressFill.style.width = `${caloriePercentage}%`;
            calorieProgressFill.className = `progress-fill ${progressStyle}`;
            
            calorieStats.innerHTML = `
                <span>${this.formatNumber(this.dailyProgress.calories)} kcal consumed</span>
                <span>${caloriePercentage}%</span>
            `;
        }

        // Update macro goals section
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

                if (goalValue && this.validateGoalValue(value)) {
                    goalValue.textContent = `${this.formatNumber(value)}g`;
                }

                if (progressFill && stats && this.validateGoalValue(value)) {
                    const percentage = this.getPercentage(this.dailyProgress[macro], value);
                    const progressStyle = this.getProgressStyle(percentage);
                    
                    progressFill.style.width = `${percentage}%`;
                    progressFill.className = `progress-fill ${progressStyle}`;
                    
                    stats.innerHTML = `
                        <span>${this.formatNumber(this.dailyProgress[macro])}g consumed</span>
                        <span>${percentage}%</span>
                    `;
                }
            });
        }

        // Update health goals section
        const healthSection = sidebar.querySelector('.sidebar-section:nth-child(3)');
        if (healthSection) {
            const weightValue = healthSection.querySelector('.goal-item:nth-child(1) .goal-value');
            const weeklyValue = healthSection.querySelector('.goal-item:nth-child(2) .goal-value');
            const weightStats = healthSection.querySelector('.goal-item:nth-child(1) .goal-stats span');
            const weeklyStats = healthSection.querySelector('.goal-item:nth-child(2) .goal-stats span');

            // Handle target weight display
            if (weightValue && weightStats) {
                if (this.validateGoalValue(this.goals.weightGoal)) {
                    weightValue.textContent = `${this.formatNumber(this.goals.weightGoal)} kg`;
                    
                    // Update weight goal description based on goal type
                    const goalTypeText = this.goals.goalType === 'maintain' ? 
                        'Maintain Weight' : 
                        this.goals.goalType === 'gain' ? 
                        'Gain Muscle Mass' : 
                        'Lose Weight';
                    weightStats.textContent = goalTypeText;
                } else {
                    weightValue.textContent = 'Not set';
                    weightStats.textContent = 'Set target weight in goals';
                }
            }

            // Handle weekly goal display
            if (weeklyValue && weeklyStats) {
                if (this.validateGoalValue(this.goals.weeklyGoal)) {
                    const weeklyGoal = this.getValidatedValue(this.goals.weeklyGoal, 0);
                    const prefix = weeklyGoal > 0 ? '+' : '';
                    weeklyValue.textContent = `${prefix}${this.formatNumber(weeklyGoal)} kg`;
                    
                    // Update weekly goal description
                    weeklyStats.textContent = weeklyGoal === 0 ? 
                        'Maintenance' : 
                        `Healthy ${weeklyGoal > 0 ? 'weight gain' : 'weight loss'} pace`;
                } else {
                    weeklyValue.textContent = '0 kg';
                    weeklyStats.textContent = 'Set weekly goal in settings';
                }
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

    validateGoalValue(value) {
        return value !== null && value !== undefined && !isNaN(value) && value >= 0;
    }

    getValidatedValue(value, defaultValue = 0) {
        return this.validateGoalValue(value) ? value : defaultValue;
    }

    getProgressStyle(percentage) {
        if (percentage >= 100) {
            return 'over';
        } else if (percentage >= 80) {
            return 'good';
        } else if (percentage >= 50) {
            return 'warning';
        }
        return 'default';
    }
}

// Export a single instance
const goalsManager = new GoalsManager();
export default goalsManager;
