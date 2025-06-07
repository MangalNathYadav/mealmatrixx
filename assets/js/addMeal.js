import { MealFormHandler } from './meal-form-handler.js';
import { MealAI } from './ai-features.js';

// Track Firebase listener
let mealDataListener = null;

// Loading overlay control functions with improved transitions
function showLoading(message = 'Loading...', subtext = 'Please wait...') {
    const overlay = document.getElementById('app-loading-overlay');
    if (!overlay) return;
    
    const title = overlay.querySelector('.dashboard-loading-title');
    const subtextElement = overlay.querySelector('.dashboard-loading-subtext');
    const spinner = overlay.querySelector('.dashboard-loading-spinner');
    
    if (title) {
        title.textContent = message;
        title.style.animation = 'fadeSlideUp 0.6s ease-out';
    }
    
    if (subtextElement) {
        subtextElement.textContent = subtext;
        subtextElement.style.animation = 'fadeSlideUp 0.6s ease-out 0.2s both';
    }
    
    if (spinner) {
        spinner.style.animation = 'spin 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite';
    }
    
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden');
    overlay.classList.add('visible');
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('app-loading-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('visible');
    overlay.classList.add('hidden');
    
    setTimeout(() => {
        document.body.style.overflow = '';
        overlay.style.display = 'none';
    }, 350); // Match transition duration from CSS
}

function showAnalysisLoading(message = 'Processing', subtext = 'Please wait while we analyze your meal...') {
    const overlay = document.getElementById('analysis-loading-overlay');
    if (!overlay) return;
    
    const title = overlay.querySelector('.dashboard-loading-title');
    const subtextElement = overlay.querySelector('.dashboard-loading-subtext');
    const spinner = overlay.querySelector('.dashboard-loading-spinner');
    
    if (title) {
        title.textContent = message;
        title.style.animation = 'fadeSlideUp 0.6s ease-out';
    }
    
    if (subtextElement) {
        subtextElement.textContent = subtext;
        subtextElement.style.animation = 'fadeSlideUp 0.6s ease-out 0.2s both';
    }
    
    if (spinner) {
        spinner.style.animation = 'spin 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite';
    }
    
    document.body.style.overflow = 'hidden';
    overlay.style.display = 'flex';
    
    // Force a reflow before adding the visible class for better animation
    overlay.offsetHeight;
    overlay.classList.add('visible');
}

function hideAnalysisLoading() {
    const overlay = document.getElementById('analysis-loading-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('visible');
    
    setTimeout(() => {
        document.body.style.overflow = '';
        overlay.style.display = 'none';
    }, 350); // Match transition duration from CSS
}

// Enhanced toast notification function with better styling
function showToast(message, type = 'success') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Create toast element with improved styling
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    // Improved icon and styling
    let icon = '✓';
    if (type === 'error') icon = '⚠';
    else if (type === 'info') icon = 'ℹ';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close notification">×</button>
    `;
    document.body.appendChild(toast);

    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Trigger animation with a slight delay for better visual effect
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after animation
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    toast.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Wait for DOM to be fully loaded with improved loading handling
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - initializing addMeal.js');
    
    // Show initial loading overlay immediately
    showLoading('Loading MealMatrix', 'Please wait while we prepare your meal entry form...');
    
    // Initialize form handler
    const formHandler = new MealFormHandler();
    console.log('MealFormHandler initialized');
    
    // Initialize AI features
    const mealAI = new MealAI();
    
    // Handle AI analysis button
    const analyzeButton = document.getElementById('analyzeButton');
    const mealDescription = document.getElementById('mealDescription');
    const aiResult = document.getElementById('aiResult');

    if (!analyzeButton || !mealDescription || !aiResult) {
        console.error('Required elements not found');
        hideLoading();
        return;
    }
    
    // Make sure form elements are properly initialized
    setTimeout(() => {
        // Ensure form elements are visible with smooth transitions
        const formContainer = document.querySelector('.meal-form-container');
        if (formContainer) {
            formContainer.style.opacity = '1';
        }
    }, 500);
    
    // Initialize Firebase Auth state with improved loading transitions
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            // Hide loading overlay with a smooth transition after content is ready
            setTimeout(() => {
                hideLoading();
                // Trigger a gentle pulse animation on the main container once loaded
                const addMealContainer = document.querySelector('.add-meal-container');
                if (addMealContainer) {
                    addMealContainer.style.animation = 'pulseScale 0.7s ease-out';
                }
            }, 1000);
        }
    });

    // Modify the MealFormHandler methods to use our enhanced loading overlays
    formHandler.showLoading = function(message = 'Saving meal...') {
        showLoading('Saving Meal', 'Please wait while we save your meal data...');
        this.submitBtn.disabled = true;
    };

    formHandler.hideLoading = function() {
        hideLoading();
        this.submitBtn.disabled = false;
    };
    
    analyzeButton.addEventListener('click', async () => {
        const description = mealDescription.value.trim();
        if (!description) {
            showToast('Please enter a meal description', 'error');
            return;
        }
        
        try {
            // Show loading state on button
            analyzeButton.disabled = true;
            analyzeButton.querySelector('.btn-loading').style.display = 'block';
            analyzeButton.querySelector('.btn-text').style.opacity = '0';
            
            // Show analysis loading overlay with animation
            showAnalysisLoading('Processing', 'Please wait while we analyze your meal...');
            
            // Analyze meal (with a slight delay for better UX)
            setTimeout(async () => {
                try {
                    const analysis = await mealAI.analyzeMeal(description);
                    
                    // Update AI result section
                    updateAIResult(analysis);
                    
                    // Populate form with AI results
                    formHandler.populateFromAIResult(analysis);
                    
                    // Show success message
                    showToast('Meal analyzed successfully!', 'success');
                } catch (error) {
                    console.error('AI Analysis error:', error);
                    showToast('Failed to analyze meal. Please try again or use manual entry.', 'error');
                } finally {
                    // Reset button state
                    analyzeButton.disabled = false;
                    analyzeButton.querySelector('.btn-loading').style.display = 'none';
                    analyzeButton.querySelector('.btn-text').style.opacity = '1';
                    
                    // Hide analysis loading overlay with fade out
                    hideAnalysisLoading();
                }
            }, 500); // Small delay for better visual transition
        } catch (error) {
            console.error('Analysis preparation error:', error);
            showToast('Failed to start meal analysis', 'error');
            
            // Reset button state
            analyzeButton.disabled = false;
            analyzeButton.querySelector('.btn-loading').style.display = 'none';
            analyzeButton.querySelector('.btn-text').style.opacity = '1';
        }
    });

    // Get meal ID from URL if editing
    const urlParams = new URLSearchParams(window.location.search);
    const mealId = urlParams.get('id');
    let editMode = false;

    // Set current datetime as default
    document.getElementById('dateTime').value = new Date().toISOString().slice(0, 16);

    // Clean up listener when leaving the page
    window.addEventListener('unload', () => {
        if (mealDataListener) {
            const user = firebase.auth().currentUser;
            if (user) {
                firebase.database().ref(`users/${user.uid}/meals/${mealId}`).off('value', mealDataListener);
            }
            mealDataListener = null;
        }
    });

    // If editing, load meal data
    if (mealId) {
        editMode = true;
        const formTitle = document.querySelector('.section-header h2');
        const submitBtn = document.querySelector('#mealForm button[type="submit"]');
        if (formTitle) formTitle.textContent = 'Edit Meal';
        if (submitBtn) submitBtn.textContent = 'Update Meal';
        
        const user = firebase.auth().currentUser;
        if (user) {
            const mealRef = firebase.database().ref(`users/${user.uid}/meals/${mealId}`);
            // Use once() instead of on() since we only need to load the data once
            mealRef.once('value')
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
    }

    // Modify form handler to handle edit mode and use our custom loading
    if (mealForm && editMode) {
        // Override the form handler's submit method only for edit mode
        formHandler.handleSubmit = async function(e) {
            e.preventDefault();
            
            // Validate all required fields
            let isValid = true;
            this.form.querySelectorAll('input[required], textarea[required]').forEach(field => {
                if (!field.value.trim()) {
                    this.validateField(field);
                    isValid = false;
                }
            });
    
            // Validate nutrient values
            const nutrientInputs = ['calories', 'protein', 'carbs', 'fat'];
            nutrientInputs.forEach(id => {
                if (!this.validateNutrientValue(document.getElementById(id))) {
                    isValid = false;
                }
            });
    
            if (!isValid) {
                showToast('Please fill in all required fields correctly', 'error');
                return;
            }
    
            showLoading('Updating Meal', 'Please wait while we update your meal...');
            this.submitBtn.disabled = true;
    
            try {
                const user = firebase.auth().currentUser;
                if (!user) {
                    throw new Error('Please log in to update meals');
                }
    
                const mealData = {
                    name: document.getElementById('mealName').value,
                    calories: parseNumberInput(document.getElementById('calories').value),
                    protein: parseNumberInput(document.getElementById('protein').value),
                    carbs: parseNumberInput(document.getElementById('carbs').value),
                    fat: parseNumberInput(document.getElementById('fat').value),
                    dateTime: document.getElementById('dateTime').value,
                    notes: document.getElementById('notes').value,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };
    
                // Update existing meal
                await firebase.database().ref(`users/${user.uid}/meals/${mealId}`).update(mealData);
                showToast('Meal updated successfully!', 'success');
                
                // Clean up listener before redirecting
                if (mealDataListener) {
                    firebase.database().ref(`users/${user.uid}/meals/${mealId}`).off('value', mealDataListener);
                    mealDataListener = null;
                }
                
                // Short delay to show the success message before redirecting
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1200);
            } catch (error) {
                console.error('Error updating meal:', error);
                showToast(error.message || 'Failed to update meal', 'error');
            } finally {
                hideLoading();
                this.submitBtn.disabled = false;
            }
        };
    }
});

// Note: The above code already handles URL parameters and datetime initialization

// Helper function to parse number inputs safely
function parseNumberInput(value, fallback = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

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
