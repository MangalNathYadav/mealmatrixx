// AI Features for MealMatrix
class MealAI {
    constructor() {
        // Initialize Gemini client using config
        this.client = new GeminiClient();
    }

    // Analyze a meal from free text input
    async analyzeMeal(mealText) {
        try {
            console.log('Analyzing meal:', mealText);
            const result = await this.client.analyzeMeal(mealText);
            console.log('Analysis result:', result);
            return result;
        } catch (error) {
            console.error('Meal analysis failed:', error);
            throw new Error('Failed to analyze meal: ' + error.message);
        }
    }

    // Generate weekly summary from meal data
    async generateWeeklySummary(meals) {
        try {
            console.log('Generating summary for meals:', meals);
            const result = await this.client.generateWeeklySummary(meals);
            console.log('Summary result:', result);
            return result;
        } catch (error) {
            console.error('Weekly summary generation failed:', error);
            throw new Error('Failed to generate summary: ' + error.message);
        }
    }

    // Get healthier meal suggestions
    async suggestBetterMeal(meal) {
        try {
            console.log('Getting suggestions for meal:', meal);
            const result = await this.client.suggestBetterMeal(meal);
            console.log('Suggestion result:', result);
            return result;
        } catch (error) {
            console.error('Meal suggestion failed:', error);
            throw new Error('Failed to suggest alternatives: ' + error.message);
        }
    }
}

// Initialize and export AI instance
const mealAI = new MealAI();
export { mealAI };
