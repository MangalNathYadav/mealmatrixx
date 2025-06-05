// Database Service
class DatabaseService {
    constructor() {
        this.db = firebase.database();
    }

    // Profile Methods
    async getUserProfile(userId) {
        try {
            const snapshot = await this.db.ref(`users/${userId}/profile`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
    }

    async updateUserProfile(userId, profileData) {
        try {
            await this.db.ref(`users/${userId}/profile`).update({
                ...profileData,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Meals Methods
    async getMeals(userId, options = {}) {
        try {
            let ref = this.db.ref(`users/${userId}/meals`);
            
            // Apply date range filter if provided
            if (options.startDate && options.endDate) {
                ref = ref.orderByChild('dateTime')
                    .startAt(options.startDate)
                    .endAt(options.endDate);
            }

            const snapshot = await ref.once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting meals:', error);
            throw error;
        }
    }

    async addMeal(userId, mealData) {
        try {
            const newMealRef = await this.db.ref(`users/${userId}/meals`).push({
                ...mealData,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return newMealRef.key;
        } catch (error) {
            console.error('Error adding meal:', error);
            throw error;
        }
    }

    async updateMeal(userId, mealId, mealData) {
        try {
            await this.db.ref(`users/${userId}/meals/${mealId}`).update({
                ...mealData,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        } catch (error) {
            console.error('Error updating meal:', error);
            throw error;
        }
    }

    async deleteMeal(userId, mealId) {
        try {
            await this.db.ref(`users/${userId}/meals/${mealId}`).remove();
            return true;
        } catch (error) {
            console.error('Error deleting meal:', error);
            throw error;
        }
    }

    // Nutrition Goals Methods
    async getNutritionGoals(userId) {
        try {
            const snapshot = await this.db.ref(`users/${userId}/nutritionGoals`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting nutrition goals:', error);
            throw error;
        }
    }

    async updateNutritionGoals(userId, goalsData) {
        try {
            await this.db.ref(`users/${userId}/nutritionGoals`).update({
                ...goalsData,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        } catch (error) {
            console.error('Error updating nutrition goals:', error);
            throw error;
        }
    }

    // Real-time listeners
    onMealsChange(userId, callback) {
        return this.db.ref(`users/${userId}/meals`)
            .on('value', snapshot => callback(snapshot.val()));
    }

    onProfileChange(userId, callback) {
        return this.db.ref(`users/${userId}/profile`)
            .on('value', snapshot => callback(snapshot.val()));
    }

    onNutritionGoalsChange(userId, callback) {
        return this.db.ref(`users/${userId}/nutritionGoals`)
            .on('value', snapshot => callback(snapshot.val()));
    }

    // Utility method to detach listeners
    detachListener(path) {
        this.db.ref(path).off();
    }
}

// Create and export service instance
const dbService = new DatabaseService();
export default dbService;
