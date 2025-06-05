import { MealFormHandler } from './meal-form-handler.js';
import { MealAI } from './ai-features.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize form handler
    const formHandler = new MealFormHandler();
    
    // Initialize AI features
    const mealAI = new MealAI();
    
    // Handle AI analysis button
    const analyzeButton = document.getElementById('analyzeButton');
    const mealDescription = document.getElementById('mealDescription');
    const aiResult = document.getElementById('aiResult');

    if (!analyzeButton || !mealDescription || !aiResult) {
        console.error('Required elements not found');
        return;
    }
    
    analyzeButton.addEventListener('click', async () => {
        const description = mealDescription.value.trim();
        if (!description) {
            formHandler.showToast('Please enter a meal description', 'error');
            return;
        }
        
        try {
            // Show loading state
            analyzeButton.disabled = true;
            analyzeButton.querySelector('.btn-loading').style.display = 'block';
            analyzeButton.querySelector('.btn-text').style.opacity = '0';
            
            // Analyze meal
            const analysis = await mealAI.analyzeMeal(description);
            
            // Update AI result section
            updateAIResult(analysis);
            
            // Populate form with AI results
            formHandler.populateFromAIResult(analysis);
            
        } catch (error) {
            console.error('AI Analysis error:', error);
            formHandler.showToast('Failed to analyze meal. Please try again or use manual entry.', 'error');
        } finally {
            // Reset button state
            analyzeButton.disabled = false;
            analyzeButton.querySelector('.btn-loading').style.display = 'none';
            analyzeButton.querySelector('.btn-text').style.opacity = '1';
        }
    });
});

// Get meal ID from URL if editing
const urlParams = new URLSearchParams(window.location.search);
const mealId = urlParams.get('id');
let editMode = false;

// Set current datetime as default
document.getElementById('dateTime').value = new Date().toISOString().slice(0, 16);

// Helper function to parse number inputs safely
function parseNumberInput(value, fallback = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

// If editing, load meal data
if (mealId) {
    editMode = true;
    formTitle.textContent = 'Edit Meal';
    submitBtn.textContent = 'Update Meal';
    
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            firebase.database().ref(`users/${user.uid}/meals/${mealId}`).once('value')
                .then((snapshot) => {
                    const meal = snapshot.val();
                    if (meal) {
                        document.getElementById('mealName').value = meal.name || '';
                        document.getElementById('calories').value = meal.calories || '';
                        document.getElementById('protein').value = meal.protein || '';
                        document.getElementById('carbs').value = meal.carbs || '';
                        document.getElementById('fat').value = meal.fat || '';
                        document.getElementById('dateTime').value = meal.dateTime || '';
                        document.getElementById('notes').value = meal.notes || '';
                    }
                })
                .catch((error) => {
                    showToast(error.message);
                });
        }
    });
}

// Handle form submission
mealForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('Please log in to add meals', 'error');
        return;
    }

    const mealData = {
        name: document.getElementById('mealName').value,
        calories: parseNumberInput(document.getElementById('calories').value),
        protein: parseNumberInput(document.getElementById('protein').value),
        carbs: parseNumberInput(document.getElementById('carbs').value),
        fat: parseNumberInput(document.getElementById('fat').value),
        dateTime: document.getElementById('dateTime').value,
        notes: document.getElementById('notes').value
    };

    try {
        if (editMode) {
            // Update existing meal
            await firebase.database().ref(`users/${user.uid}/meals/${mealId}`).update(mealData);
            showToast('Meal updated successfully!', 'success');
        } else {
            // Add new meal
            await firebase.database().ref(`users/${user.uid}/meals`).push(mealData);
            showToast('Meal added successfully!', 'success');
        }
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Error saving meal:', error);
        showToast(error.message || 'Failed to save meal', 'error');
    }
});

// Function to update AI result display
function updateAIResult(analysis) {
    const aiResult = document.getElementById('aiResult');
    if (!aiResult) return;

    if (!analysis) {
        aiResult.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <p class="empty-state-text">Could not analyze meal. Please try again or use manual entry.</p>
            </div>
        `;
        return;
    }
    
    // Remove empty state
    aiResult.classList.remove('empty');
    aiResult.classList.add('with-data');
    
    // Create result HTML
    const html = `
        <div class="analysis-result">
            <div class="detected-items">
                <h4>Detected Items:</h4>
                <p>${analysis.foodItems ? analysis.foodItems.join(', ') : 'No items detected'}</p>
            </div>
            
            <div class="nutrient-display">
                <div class="nutrient-item">
                    <div class="label">Calories</div>
                    <div class="value">${Math.round(analysis.nutrients?.calories || 0)}</div>
                </div>
                <div class="nutrient-item">
                    <div class="label">Protein</div>
                    <div class="value">${Math.round(analysis.nutrients?.protein || 0)}g</div>
                </div>
                <div class="nutrient-item">
                    <div class="label">Carbs</div>
                    <div class="value">${Math.round(analysis.nutrients?.carbs || 0)}g</div>
                </div>
                <div class="nutrient-item">
                    <div class="label">Fat</div>
                    <div class="value">${Math.round(analysis.nutrients?.fat || 0)}g</div>
                </div>
            </div>
            
            ${renderWarnings(analysis.warnings)}
        </div>
    `;
    
    aiResult.innerHTML = html;
}

// Function to render warning messages
function renderWarnings(warnings) {
    if (!warnings || warnings.length === 0) return '';
    
    return `
        <div class="warnings">
            ${warnings.map(warning => `
                <div class="warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    ${warning.message}
                </div>
            `).join('')}
        </div>
    `;
}
