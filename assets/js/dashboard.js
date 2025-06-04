// Import required modules
import goalsManager from './goals.js';
import ai from './ai-features.js';

// Toast notification helper
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Dashboard elements
const mealGrid = document.getElementById('mealGrid');
const logoutBtn = document.getElementById('logoutBtn');
const weeklySummaryBtn = document.getElementById('weeklySummaryBtn');
const popup = document.getElementById('weeklySummaryPopup');
const goalsProgressElement = document.getElementById('goalsProgress');

// Close weekly summary function
function closeWeeklySummary() {
    if (!popup) return;
    
    const content = popup.querySelector('.popup-content');
    document.body.classList.remove('popup-open');
    popup.classList.remove('visible');
    // Clear content after animation
    setTimeout(() => {
        if (content) content.innerHTML = '';
    }, 300);
}

// Handle logout
logoutBtn?.addEventListener('click', async () => {
    try {
        await firebase.auth().signOut();
        showToast('Logged out successfully', 'success');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to logout. Please try again.');
    }
});

// Load user's meals
async function loadMeals() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
        mealsRef.on('value', (snapshot) => {
            const meals = snapshot.val();
            if (mealGrid) {
                if (!meals) {
                    mealGrid.innerHTML = `
                        <div class="empty-state">
                            <h3>No meals added yet</h3>
                            <p>Click the + button to add your first meal</p>
                        </div>
                    `;
                    return;
                }

                // Convert meals object to array and sort by date (newest first)
                const mealsArray = Object.values(meals).sort((a, b) => 
                    new Date(b.dateTime) - new Date(a.dateTime)
                );

                mealGrid.innerHTML = mealsArray.map(meal => `
                    <div class="meal-card">
                        <div class="meal-header">
                            <h3>${meal.name}</h3>
                            <span class="meal-time">${new Date(meal.dateTime).toLocaleString()}</span>
                        </div>
                        <div class="meal-content">
                            <div class="meal-stats">
                                <div class="stat">
                                    <span>Calories</span>
                                    <strong>${meal.calories || 0}</strong>
                                </div>
                                <div class="stat">
                                    <span>Protein</span>
                                    <strong>${meal.protein || 0}g</strong>
                                </div>
                                <div class="stat">
                                    <span>Carbs</span>
                                    <strong>${meal.carbs || 0}g</strong>
                                </div>
                                <div class="stat">
                                    <span>Fat</span>
                                    <strong>${meal.fat || 0}g</strong>
                                </div>
                            </div>
                            ${meal.notes ? `<p class="meal-notes">${meal.notes}</p>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        });
    } catch (error) {
        console.error('Error loading meals:', error);
        showToast('Failed to load meals', 'error');
    }
}

// Initialize dashboard for authenticated user
async function initializeDashboard(user) {
    try {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // First check if user has goals
        const hasGoals = await goalsManager.checkGoalsExist(user.uid);
        
        // Update goals progress section
        if (goalsProgressElement) {
            if (!hasGoals) {
                goalsProgressElement.innerHTML = `
                    <div class="goals-empty" style="display: block;">
                        <div class="empty-goals-message">
                            <img src="assets/mealmatrixx_logo.png" alt="Set Goals">
                            <h4>Set Your Nutrition Goals</h4>
                            <p>Track your progress, get personalized insights, and achieve your health targets with customized nutrition goals.</p>
                            <a href="nutrition-goals.html" class="btn btn-primary">Get Started with Goals</a>
                        </div>
                    </div>`;
            } else {
                await goalsManager.updateGoalProgress(goalsProgressElement);
            }
        }

        // Load meals
        await loadMeals();

        // Setup weekly summary button
        if (weeklySummaryBtn && popup) {
            setupWeeklySummary();
        }

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast(error.message || 'Failed to initialize dashboard', 'error');
    }
}

// Setup event listeners and initialize
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        await initializeDashboard(user);
    } else {
        window.location.href = 'login.html';
    }
});

// Weekly Summary Button Click Handler
weeklySummaryBtn.addEventListener('click', async () => {
    const content = popup.querySelector('.popup-content');
    const spinner = weeklySummaryBtn.querySelector('.ai-spinner');
    
    if (!spinner || !popup || !content) {
        console.error('Required elements not found');
        return;
    }

    content.innerHTML = ''; // Clear previous results
    
    try {
        spinner.classList.add('visible');
        
        // Get last 7 days of meals
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('Please log in to view your weekly summary');
        }

        const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const snapshot = await mealsRef.once('value');
        const meals = snapshot.val() || {};
        const recentMeals = Object.values(meals).filter(meal => 
            new Date(meal.dateTime) >= weekAgo
        );

        if (recentMeals.length === 0) {
            showToast('No meals logged in the past week', 'info');
            return;
        }

        const summary = await ai.generateWeeklySummary(recentMeals);
        
        if (!summary || typeof summary !== 'object') {
            throw new Error('Invalid summary response from AI');
        }
        
        const summaryContent = `
            <div class="popup-header">
                <h2>🤖 Your Weekly Meal Analysis</h2>
            </div>
            <div class="ai-content">
                <div class="summary-section">
                    <h4>Overview</h4>
                    <p>${summary.summary || 'No overview available'}</p>
                </div>
                
                ${summary.analysis ? `
                    <div class="summary-section">
                        <h4>Detailed Analysis</h4>
                        <div class="analysis-grid">
                            ${summary.analysis.caloriesTrend ? `
                                <div class="analysis-item">
                                    <strong>Calories</strong>
                                    <p>${summary.analysis.caloriesTrend}</p>
                                </div>
                            ` : ''}
                            ${summary.analysis.mealTiming ? `
                                <div class="analysis-item">
                                    <strong>Meal Timing</strong>
                                    <p>${summary.analysis.mealTiming}</p>
                                </div>
                            ` : ''}
                            ${summary.analysis.nutritionBalance ? `
                                <div class="analysis-item">
                                    <strong>Nutrition</strong>
                                    <p>${summary.analysis.nutritionBalance}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${summary.insights && summary.insights.length > 0 ? `
                    <div class="summary-section">
                        <h4>Key Insights</h4>
                        <ul class="insights-list">
                            ${summary.insights.map(insight => `
                                <li>${insight}</li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${summary.recommendations && summary.recommendations.length > 0 ? `
                    <div class="summary-section">
                        <h4>Recommendations</h4>
                        <div class="recommendations-list">
                            ${summary.recommendations.map(rec => `
                                <div class="recommendation-item">
                                    <strong>${rec.area || 'Improvement Area'}</strong>
                                    <p>${rec.suggestion || rec}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Update popup content and show it
        content.innerHTML = summaryContent;
        document.body.classList.add('popup-open');
        popup.classList.add('visible');

    } catch (error) {
        console.error('Weekly summary error:', error);
        showToast(error.message || 'Failed to generate weekly summary', 'error');
    } finally {
        spinner.classList.remove('visible');
    }
});

// Expose closeWeeklySummary to window for HTML onclick handler
window.closeWeeklySummary = closeWeeklySummary;
