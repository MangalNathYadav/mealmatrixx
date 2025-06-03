// AI Features for MealMatrix
const BASE_URL = 'https://us-central1-mealmatrix-ac32a.cloudfunctions.net';

class MealAI {
    constructor() {
        // Initialize Firebase functions
        this.analyzeMealFunction = firebase.functions().httpsCallable('analyzeMeal');
        this.weeklySummaryFunction = firebase.functions().httpsCallable('weeklySummary');
        this.suggestMealFunction = firebase.functions().httpsCallable('suggestMeal');
    }

    // Analyze a meal from free text input
    async analyzeMeal(mealText) {
        try {
            const prompt = `Analyze this meal: "${mealText}". Please provide:
                1. List of identified food items
                2. Estimated total calories
                3. Brief health assessment (balanced/unhealthy)
                4. A quick suggestion for improvement if needed
                Format the response in JSON.`;

            const result = await this.analyzeMealFunction({ prompt });
            return JSON.parse(result.data.result);
        } catch (error) {
            console.error('Meal analysis failed:', error);
            throw error;
        }
    }

    // Generate weekly summary from meal data
    async generateWeeklySummary(meals) {
        try {
            const prompt = `Analyze these meals from the past week: ${JSON.stringify(meals)}
                Create a natural language summary that includes:
                1. Overall eating pattern analysis
                2. Highlight any concerning days
                3. Specific suggestions for improvement
                4. Positive reinforcement for good choices`;

            const result = await this.weeklySummaryFunction({ prompt });
            return result.data.result;
        } catch (error) {
            console.error('Weekly summary generation failed:', error);
            throw error;
        }
    }

    // Get healthier meal suggestions
    async suggestBetterMeal(meal) {
        try {
            const prompt = `Based on this meal: "${meal.name}" with ${meal.calories} calories,
                suggest 2-3 healthier alternatives that are:
                1. Similar in taste profile
                2. Lower in calories
                3. More nutritionally balanced
                Format as JSON with name, calories, and reason for each suggestion.`;

            const result = await this.suggestMealFunction({ prompt });
            return JSON.parse(result.data.result);
        } catch (error) {
            console.error('Meal suggestion failed:', error);
            throw error;
        }
    }
}

// Helper function for AI-related UI elements
function createAISpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'ai-spinner';
    return spinner;
}

function showAILoading(container) {
    const spinner = createAISpinner();
    container.appendChild(spinner);
    return spinner;
}

function removeAILoading(spinner) {
    spinner.remove();
}

function showAIResult(container, result) {
    // Create result card
    const resultCard = document.createElement('div');
    resultCard.className = 'ai-result';
    resultCard.innerHTML = `
        <h4>🤖 AI Analysis</h4>
        <div class="ai-content">${formatAIResponse(result)}</div>
    `;
    
    // Add to container with animation
    container.appendChild(resultCard);
    setTimeout(() => resultCard.classList.add('visible'), 10);
}

function formatAIResponse(result) {
    if (typeof result === 'string') {
        return `<p>${result}</p>`;
    }
    
    let html = '<ul>';
    if (result.foods) {
        html += `<li>🍽️ <strong>Foods:</strong> ${result.foods.join(', ')}</li>`;
    }
    if (result.calories) {
        html += `<li>🔥 <strong>Estimated Calories:</strong> ${result.calories}</li>`;
    }
    if (result.assessment) {
        html += `<li>💡 <strong>Assessment:</strong> ${result.assessment}</li>`;
    }
    if (result.suggestion) {
        html += `<li>✨ <strong>Suggestion:</strong> ${result.suggestion}</li>`;
    }
    html += '</ul>';
    return html;
}

// Initialize and export AI instance
const mealAI = new MealAI();
export { mealAI, showAILoading, removeAILoading, showAIResult };