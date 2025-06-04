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

    // Update Goals UI
    updateGoalsUI() {
        if (!this.goals) return;

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
}

// Export a single instance
const goalsManager = new GoalsManager();
export default goalsManager;
