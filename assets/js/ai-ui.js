// UI Helper Functions for AI Features
function showAIResult(container, result) {
    // Clear previous results
    container.innerHTML = '';
    
    // Create result card
    const resultCard = document.createElement('div');
    resultCard.className = 'ai-result';
    
    let content = '';
    if (typeof result === 'string') {
        content = `<p>${result}</p>`;
    } else {
        content = '<div class="ai-content">';
        
        // Foods list
        if (result.foods && result.foods.length) {
            content += `<div class="foods">
                <h4>🍽️ Foods Identified:</h4>
                <ul>${result.foods.map(food => `<li>${food}</li>`).join('')}</ul>
            </div>`;
        }
        
        // Calories
        if (result.calories) {
            content += `<div class="calories">
                <h4>🔥 Calories:</h4>
                <p>Total: ${result.calories.total}</p>
                ${result.calories.breakdown ? `
                    <ul>${Object.entries(result.calories.breakdown)
                        .map(([item, cal]) => `<li>${item}: ${cal} cal</li>`)
                        .join('')}</ul>` : ''}
            </div>`;
        }
        
        // Nutrition
        if (result.nutrition) {
            content += `<div class="nutrition">
                <h4>📊 Nutritional Profile:</h4>
                <ul>
                    ${Object.entries(result.nutrition)
                        .map(([key, value]) => `<li>${key}: ${value}</li>`)
                        .join('')}
                </ul>
            </div>`;
        }
        
        // Assessment and Suggestions
        if (result.assessment) {
            content += `<div class="assessment">
                <h4>💡 Assessment:</h4>
                <p>${result.assessment}</p>
            </div>`;
        }
        if (result.suggestion) {
            content += `<div class="suggestions">
                <h4>✨ Suggestions:</h4>
                <p>${result.suggestion}</p>
            </div>`;
        }
        if (result.alternatives && result.alternatives.length) {
            content += `<div class="alternatives">
                <h4>🔄 Healthier Alternatives:</h4>
                <ul>${result.alternatives.map(alt => `<li>${alt}</li>`).join('')}</ul>
            </div>`;
        }
        
        content += '</div>';
    }
    
    resultCard.innerHTML = content;
    container.appendChild(resultCard);
    resultCard.classList.add('visible');
}
