// Advanced Features UI Components
class AdvancedFeaturesUI {
    constructor() {
        this.setupUI();
    }

    setupUI() {
        // Add styles
        if (!document.getElementById('advanced-features-styles')) {
            const styles = document.createElement('style');
            styles.id = 'advanced-features-styles';
            styles.textContent = `
                .feature-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 1rem 0;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s ease;
                }

                .feature-card:hover {
                    transform: translateY(-2px);
                }

                .feature-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .feature-icon {
                    width: 40px;
                    height: 40px;
                    background: var(--primary-color);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }

                .feature-content {
                    flex: 1;
                }

                .feature-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    margin: 0;
                }

                .feature-description {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0.5rem 0;
                }

                .feature-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1rem;
                }

                .feature-btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }

                .feature-btn-primary {
                    background: var(--primary-color);
                    color: white;
                }

                .feature-btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }

                .feature-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .feature-results {
                    margin-top: 1rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 8px;
                    display: none;
                }

                .feature-results.visible {
                    display: block;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .grid-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }

                .stat-card {
                    background: white;
                    padding: 1rem;
                    border-radius: 8px;
                    text-align: center;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: var(--primary-color);
                }

                .stat-label {
                    color: #666;
                    font-size: 0.9rem;
                }

                .chart-container {
                    background: white;
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    // Render meal plan section
    renderMealPlanSection(container) {
        container.innerHTML = `
            <div class="feature-card">
                <div class="feature-header">
                    <div class="feature-icon">📋</div>
                    <div class="feature-content">
                        <h3 class="feature-title">Personalized Meal Plan</h3>
                        <p class="feature-description">Get a custom meal plan based on your preferences and goals</p>
                    </div>
                </div>
                <div class="feature-actions">
                    <button class="feature-btn feature-btn-primary" id="generatePlanBtn">Generate Plan</button>
                    <button class="feature-btn feature-btn-secondary" id="modifyPlanBtn">Modify Existing</button>
                </div>
                <div class="feature-results" id="mealPlanResults"></div>
            </div>
        `;
    }

    // Render recipe modification section
    renderRecipeModSection(container) {
        container.innerHTML = `
            <div class="feature-card">
                <div class="feature-header">
                    <div class="feature-icon">🥗</div>
                    <div class="feature-content">
                        <h3 class="feature-title">Recipe Modification</h3>
                        <p class="feature-description">Adapt recipes to your dietary needs</p>
                    </div>
                </div>
                <div class="feature-actions">
                    <button class="feature-btn feature-btn-primary" id="modifyRecipeBtn">Modify Recipe</button>
                    <button class="feature-btn feature-btn-secondary" id="saveModifiedBtn">Save Modified</button>
                </div>
                <div class="feature-results" id="recipeModResults"></div>
            </div>
        `;
    }

    // Render grocery list section
    renderGrocerySection(container) {
        container.innerHTML = `
            <div class="feature-card">
                <div class="feature-header">
                    <div class="feature-icon">🛒</div>
                    <div class="feature-content">
                        <h3 class="feature-title">Smart Grocery List</h3>
                        <p class="feature-description">Generate optimized shopping lists</p>
                    </div>
                </div>
                <div class="feature-actions">
                    <button class="feature-btn feature-btn-primary" id="generateListBtn">Generate List</button>
                    <button class="feature-btn feature-btn-secondary" id="optimizeListBtn">Optimize Cost</button>
                </div>
                <div class="feature-results" id="groceryResults"></div>
            </div>
        `;
    }

    // Display results in a section
    showResults(containerId, data, type = 'default') {
        const container = document.getElementById(containerId);
        if (!container) return;

        let content = '';
        switch (type) {
            case 'mealPlan':
                content = this._formatMealPlan(data);
                break;
            case 'recipe':
                content = this._formatRecipe(data);
                break;
            case 'grocery':
                content = this._formatGroceryList(data);
                break;
            default:
                content = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        }

        container.innerHTML = content;
        container.classList.add('visible');
    }

    // Helper method to format meal plan
    _formatMealPlan(data) {
        return `
            <div class="meal-plan">
                ${data.weeklyPlan.map(day => `
                    <div class="day-plan">
                        <h4>${day.day}</h4>
                        ${day.meals.map(meal => `
                            <div class="meal-item">
                                <strong>${meal.type}</strong>: ${meal.name}
                                <div class="meal-details">
                                    ${meal.calories} calories
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
                <div class="grocery-summary">
                    <h4>Shopping List</h4>
                    <ul>${data.groceryList.map(item => `<li>${item}</li>`).join('')}</ul>
                </div>
            </div>
        `;
    }

    // Helper method to format recipe
    _formatRecipe(data) {
        return `
            <div class="recipe-mod">
                <h4>${data.modifiedRecipe.name}</h4>
                <div class="ingredients">
                    <h5>Ingredients</h5>
                    <ul>${data.modifiedRecipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
                </div>
                <div class="instructions">
                    <h5>Instructions</h5>
                    <ol>${data.modifiedRecipe.instructions.map(step => `<li>${step}</li>`).join('')}</ol>
                </div>
                <div class="changes">
                    <h5>Changes Made</h5>
                    <ul>${data.substitutionExplanations.map(exp => `<li>${exp}</li>`).join('')}</ul>
                </div>
            </div>
        `;
    }

    // Helper method to format grocery list
    _formatGroceryList(data) {
        return `
            <div class="grocery-list">
                ${Object.entries(data.organizedList).map(([category, items]) => `
                    <div class="category">
                        <h4>${category}</h4>
                        <ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>
                    </div>
                `).join('')}
                <div class="cost-summary">
                    <h4>Estimated Cost</h4>
                    <p>${data.estimatedCosts.total}</p>
                </div>
                <div class="storage-tips">
                    <h4>Storage Tips</h4>
                    <ul>${data.storageInstructions.map(tip => `<li>${tip}</li>`).join('')}</ul>
                </div>
            </div>
        `;
    }
}

// Create and export a single instance
const advancedUI = new AdvancedFeaturesUI();
export default advancedUI;
