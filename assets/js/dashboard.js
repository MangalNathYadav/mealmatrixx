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

// Loading overlay control
let loadingCount = 0;

function showLoading(message = 'Loading...', section = null) {
    loadingCount++;
    const overlay = document.querySelector('.loading-overlay');
    const textElement = overlay?.querySelector('.loading-text');
    if (textElement) {
        textElement.textContent = message;
    }
    if (overlay) {
        if (section) {
            const rect = section.getBoundingClientRect();
            overlay.style.top = `${rect.top + rect.height/2}px`;
            overlay.style.left = `${rect.left + rect.width/2}px`;
        }
        overlay.classList.add('visible');
    }
}

function hideLoading() {
    loadingCount--;
    if (loadingCount <= 0) {
        loadingCount = 0;
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }
}

// Dashboard elements
const mealGrid = document.getElementById('mealGrid');
const logoutBtn = document.getElementById('logoutBtn');
const weeklySummaryBtn = document.getElementById('weeklySummaryBtn');
const popup = document.getElementById('weeklySummaryPopup');
const goalsProgressElement = document.getElementById('goalsProgress');
const welcomeNameElement = document.getElementById('welcomeName');
const welcomeProfilePhoto = document.getElementById('welcomeProfilePhoto');
const todayMealsCountElement = document.getElementById('todayMealsCount');
const streakCountElement = document.getElementById('streakCount');

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

// Load user's meals and update stats
async function loadMealsAndStats() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        showLoading('Loading your meals...');
        const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
        
        return new Promise((resolve, reject) => {
            mealsRef.on('value', (snapshot) => {
                try {
                    const meals = snapshot.val();
                    updateMealGrid(meals);
                    updateStats(meals);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    hideLoading();
                }
            }, (error) => {
                console.error('Error loading meals:', error);
                showToast('Failed to load meals. Please try again.');
                hideLoading();
                reject(error);
            });
        });
    } catch (error) {
        console.error('Error setting up meals listener:', error);
        showToast('Failed to initialize meals loading. Please refresh the page.');
        hideLoading();
        throw error;
    }
}

// Update meal grid UI
function updateMealGrid(meals) {
    if (!mealGrid) return;
    
    if (!meals) {
        mealGrid.innerHTML = `
            <div class="empty-state">
                <h3>No meals added yet</h3>
                <p>Click the + button to add your first meal</p>
            </div>
        `;
        return;
    }

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

// Update stats UI
function updateStats(meals) {
    const today = new Date().toDateString();
    const todayMeals = meals ? Object.values(meals).filter(meal => 
        new Date(meal.dateTime).toDateString() === today
    ) : [];

    if (todayMealsCountElement) {
        todayMealsCountElement.textContent = todayMeals.length;
    }

    // Calculate streak
    let streak = 0;
    if (meals) {
        const dates = [...new Set(Object.values(meals).map(meal => 
            new Date(meal.dateTime).toDateString()
        ))];
        dates.sort((a, b) => new Date(b) - new Date(a));
        
        let currentDate = new Date();
        for (const date of dates) {
            if (new Date(date).toDateString() === currentDate.toDateString()) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
    }

    if (streakCountElement) {
        streakCountElement.textContent = streak;
    }
}

// Load user's profile data
async function loadUserProfile() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    showLoading('Loading your profile...');
    try {
        const profileRef = firebase.database().ref(`users/${user.uid}/profile`);
        const snapshot = await profileRef.once('value');
        const profile = snapshot.val();

        if (profile) {
            // Update welcome name
            if (profile.fullName && welcomeNameElement) {
                welcomeNameElement.textContent = profile.fullName.split(' ')[0];
            }

            // Update profile photo
            if (profile.photo && welcomeProfilePhoto) {
                welcomeProfilePhoto.src = profile.photo;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile');
    } finally {
        hideLoading();
    }
}

// Initialize dashboard
async function initializeDashboard() {
    showLoading('Loading your dashboard...');
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        await Promise.all([
            loadUserProfile(),
            loadMealsAndStats(),
            goalsManager.loadGoals()
        ]);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast('Some dashboard features failed to load');
    } finally {
        hideLoading();
    }
}

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

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            initializeDashboard();
        } else {
            window.location.href = 'login.html';
        }
    });
});
