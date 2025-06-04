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

        // Get all goal cards
        const goalsGrid = document.querySelector('.goals-grid');
        const sidebar = document.querySelector('.dashboard-sidebar');
        if (!goalsGrid || !sidebar) return;

        // Show first-time user message if no goals are set
        if (!this.hasAnyGoals()) {
            // Update main goals grid
            const allCards = goalsGrid.querySelectorAll('.goal-card');
            allCards.forEach(card => {
                this.showNoGoalMessage(card, 'Set up your nutrition goals to start tracking');
            });

            // Update sidebar sections
            this.updateSidebarNoGoals(sidebar);
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

        // Update sidebar sections
        this.updateSidebarWithGoals(sidebar);
    }

    updateSidebarNoGoals(sidebar) {
        const sections = sidebar.querySelectorAll('.sidebar-section');
        sections.forEach(section => {
            const title = section.querySelector('.sidebar-title')?.textContent?.toLowerCase() || '';
            
            // Skip the AI tips section
            if (title.includes('ai') || title.includes('tip')) return;

            const content = `
                <div class="goal-item">
                    <div class="no-goal-message">
                        <span class="no-goal-text">Set up your goals to start tracking your progress</span>
                        <a href="nutrition-goals.html" class="btn btn-primary btn-small">Set Goals</a>
                    </div>
                </div>
            `;

            // Clear existing items and add no-goals message
            const items = section.querySelectorAll('.goal-item');
            if (items.length) {
                items[0].innerHTML = content;
                // Remove any additional items
                for (let i = 1; i < items.length; i++) {
                    items[i].remove();
                }
            } else {
                // If no items exist, create one
                const newItem = document.createElement('div');
                newItem.className = 'goal-item';
                newItem.innerHTML = content;
                section.appendChild(newItem);
            }
        });
    }

    updateSidebarWithGoals(sidebar) {
        // Update daily calorie goals section
        const calorieSection = sidebar.querySelector('.sidebar-section');
        if (calorieSection && this.goals.targetCalories) {
            const caloriePercentage = this.getPercentage(this.dailyProgress.calories, this.goals.targetCalories);
            const calorieContent = `
                <div class="goal-item">
                    <div class="goal-header">
                        <span class="goal-label">Target Daily Calories</span>
                        <span class="goal-value">${this.formatValue(this.goals.targetCalories, ' kcal')}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${caloriePercentage}%"></div>
                    </div>
                    <div class="goal-stats">
                        <span>${this.formatValue(this.dailyProgress.calories, ' kcal')} consumed</span>
                        <span>${caloriePercentage}%</span>
                    </div>
                </div>
            `;
            const goalItem = calorieSection.querySelector('.goal-item');
            if (goalItem) {
                goalItem.innerHTML = calorieContent;
            }
        }

        // Update macro goals section
        const macroSection = sidebar.querySelector('.sidebar-section:nth-child(2)');
        if (macroSection) {
            const macros = [
                { label: 'Protein', current: this.dailyProgress.protein, target: this.goals.proteinGoal },
                { label: 'Carbs', current: this.dailyProgress.carbs, target: this.goals.carbsGoal },
                { label: 'Fat', current: this.dailyProgress.fat, target: this.goals.fatGoal }
            ];

            let macroContent = '';
            macros.forEach(macro => {
                if (macro.target) {
                    const percentage = this.getPercentage(macro.current, macro.target);
                    macroContent += `
                        <div class="goal-item">
                            <div class="goal-header">
                                <span class="goal-label">${macro.label}</span>
                                <span class="goal-value">${this.formatValue(macro.target, 'g')}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="goal-stats">
                                <span>${this.formatValue(macro.current, 'g')} consumed</span>
                                <span>${percentage}%</span>
                            </div>
                        </div>
                    `;
                }
            });

            if (macroContent) {
                const items = macroSection.querySelectorAll('.goal-item');
                items.forEach(item => item.remove());
                macroSection.insertAdjacentHTML('beforeend', macroContent);
            }
        }

        // Update health goals section
        const healthSection = sidebar.querySelector('.sidebar-section:nth-child(3)');
        if (healthSection && (this.goals.weightGoal || this.goals.weeklyGoal)) {
            let healthContent = '';
            
            if (this.goals.weightGoal) {
                healthContent += `
                    <div class="goal-item">
                        <div class="goal-header">
                            <span class="goal-label">Target Weight</span>
                            <span class="goal-value">${this.formatValue(this.goals.weightGoal, ' kg')}</span>
                        </div>
                        <div class="goal-stats">
                            <span>${this.goals.goalType === 'maintain' ? 'Maintain Weight' : 
                                   this.goals.goalType === 'lose' ? 'Weight Loss' : 'Gain Muscle Mass'}</span>
                        </div>
                    </div>
                `;
            }

            if (this.goals.weeklyGoal) {
                const sign = this.goals.weeklyGoal > 0 ? '+' : '';
                healthContent += `
                    <div class="goal-item">
                        <div class="goal-header">
                            <span class="goal-label">Weekly Goal</span>
                            <span class="goal-value">${sign}${this.formatValue(this.goals.weeklyGoal, ' kg')}</span>
                        </div>
                        <div class="goal-stats">
                            <span>${Math.abs(this.goals.weeklyGoal) <= 0.5 ? 'Healthy pace' : 'Ambitious pace'}</span>
                        </div>
                    </div>
                `;
            }

            if (healthContent) {
                const items = healthSection.querySelectorAll('.goal-item');
                items.forEach(item => item.remove());
                healthSection.insertAdjacentHTML('beforeend', healthContent);
            }
        }
    }
}

// Create and export a single instance
const goalsManager = new GoalsManager();
export default goalsManager;
