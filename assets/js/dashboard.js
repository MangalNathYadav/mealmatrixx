// Import required modules
import goalsManager from './goals.js';
import { MealAI } from './ai-features.js';
import nutritionTipGenerator from './nutrition-tip-generator.js';

// Initialize AI features
const ai = new MealAI();

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
let loadingTimeout;

// Initialize Firebase Auth
let firebaseInitialized = false;

// Initialize dashboard and Firebase
async function initializeFirebase() {
    if (firebaseInitialized) return;
    
    try {
        // Wait for Firebase to be available
        let attempts = 0;
        while (typeof firebase === 'undefined' && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof firebase === 'undefined') {
            throw new Error('Firebase failed to initialize');
        }

        // Initialize auth listener
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                initializeDashboard();
            } else {
                window.location.href = 'login.html';
            }
        });

        firebaseInitialized = true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showToast('Failed to initialize application', 'error');
    }
}

// Initialize loading state
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('app-loading-overlay');
    if (!overlay) return;

    // Initialize Firebase first
    initializeFirebase().catch(error => {
        console.error('Failed to initialize Firebase:', error);
        showToast('Failed to initialize application', 'error');
    });
});

// Loading overlay handling
function showLoading(message = 'Loading...', subtext = 'Please wait...') {
    const overlay = document.getElementById('app-loading-overlay');
    const textElement = overlay?.querySelector('#app-loading-text');
    const subtextElement = overlay?.querySelector('#app-loading-subtext');
    
    if (!overlay) return;
    
    loadingCount++;
    clearTimeout(loadingTimeout);
    
    // Update text content
    if (textElement) {
        textElement.textContent = message;
    }
    if (subtextElement) {
        subtextElement.textContent = subtext;
    }
    
    // Show overlay with proper animation
    requestAnimationFrame(() => {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
        overlay.classList.add('visible');
    });
}

function hideLoading() {
    loadingCount--;
    if (loadingCount <= 0) {
        loadingCount = 0; // Reset to prevent negative counts
        const overlay = document.getElementById('app-loading-overlay');
        if (!overlay) return;
        
        // Smooth fade out
        overlay.classList.remove('visible');
        
        // Hide after transition
        loadingTimeout = setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.display = 'none';
        }, 300);
    }
}

// Hide initial loading overlay after a short delay to show the nice animation
setTimeout(hideLoading, 2000);

// DOM elements and constants setup
const mealGrid = document.getElementById('mealGrid');
const logoutBtn = document.getElementById('logoutBtn');
const weeklySummaryBtn = document.getElementById('weeklySummaryBtn');
const popup = document.getElementById('weeklySummaryPopup');
const goalsProgressElement = document.getElementById('goalsProgress');
const welcomeNameElement = document.getElementById('welcomeName');
const welcomeProfilePhoto = document.getElementById('welcomeProfilePhoto');
const todayMealsCountElement = document.getElementById('todayMealsCount');
const streakCountElement = document.getElementById('streakCount');

// Setup event listeners for the dashboard
function setupEventListeners() {
    // Logout button click handler
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

    // Weekly summary button click handler
    weeklySummaryBtn?.addEventListener('click', async () => {
        const content = popup.querySelector('.popup-content');
        const spinner = weeklySummaryBtn.querySelector('.ai-spinner');
        spinner.classList.add('visible');
        
        try {
            const user = firebase.auth().currentUser;
            if (!user) return;

            // Get last week's meals
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
            const mealsSnap = await mealsRef.once('value');
            const allMeals = mealsSnap.val() || {};
            
            // Filter for recent meals
            const recentMeals = Object.values(allMeals).filter(meal => 
                new Date(meal.dateTime) >= oneWeekAgo
            );

            if (recentMeals.length === 0) {
                throw new Error('No meals logged in the past week');
            }

            // Get AI analysis
            const summary = await ai.generateWeeklySummary(recentMeals);
            
            if (!summary || typeof summary !== 'object') {
                throw new Error('Invalid summary response from AI');
            }
            
            const summaryContent = `
                <div class="popup-header">
                    <h2>🤖 Your Weekly Nutrition Analysis</h2>
                </div>
                <div class="ai-content">
                    <!-- Overview Section -->
                    <div class="summary-section overview">
                        <h3>Week Overview</h3>
                        <div class="overview-stats">
                            <div class="stat-item">
                                <span class="stat-label">Avg. Calories</span>
                                <span class="stat-value">${Math.round(summary.overview.averageCalories)} kcal</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Avg. Protein</span>
                                <span class="stat-value">${Math.round(summary.overview.averageProtein)}g</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Meals Logged</span>
                                <span class="stat-value">${summary.overview.mealFrequency}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Goal Progress</span>
                                <span class="stat-value">${summary.overview.goalProgress}</span>
                            </div>
                        </div>
                        <p class="overview-summary">${summary.overview.summary}</p>
                    </div>

                    <!-- Detailed Analysis -->
                    <div class="summary-section analysis">
                        <h3>Detailed Analysis</h3>
                        <div class="analysis-grid">
                            <div class="analysis-item">
                                <strong>Macro Balance</strong>
                                <p>${summary.analysis.macroBalance}</p>
                            </div>
                            <div class="analysis-item">
                                <strong>Meal Timing</strong>
                                <p>${summary.analysis.mealTiming}</p>
                            </div>
                            <div class="analysis-item">
                                <strong>Nutrition Balance</strong>
                                <p>${summary.analysis.nutritionBalance}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Key Insights -->
                    <div class="summary-section insights">
                        <h3>Key Insights</h3>
                        <ul class="insights-list">
                            ${summary.insights.map(insight => `
                                <li class="insight-item">${insight}</li>
                            `).join('')}
                        </ul>
                    </div>

                    <!-- Recommendations -->
                    <div class="summary-section recommendations">
                        <h3>Personalized Recommendations</h3>
                        <div class="recommendations-grid">
                            ${summary.recommendations.map(rec => `
                                <div class="recommendation-card">
                                    <div class="rec-header">
                                        <strong>${rec.area}</strong>
                                    </div>
                                    <p class="rec-suggestion">${rec.suggestion}</p>
                                    <p class="rec-benefit">${rec.benefit}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Health Scores -->
                    <div class="summary-section health-metrics">
                        <h3>Health Metrics</h3>
                        <div class="metrics-grid">
                            <div class="metric-item">
                                <span class="metric-label">Balance Score</span>
                                <div class="metric-score">${summary.healthMetrics.balanceScore}/10</div>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Variety Score</span>
                                <div class="metric-score">${summary.healthMetrics.varietyScore}/10</div>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Consistency Score</span>
                                <div class="metric-score">${summary.healthMetrics.consistencyScore}/10</div>
                            </div>
                        </div>
                    </div>
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

    // Window resize listener for layout changes
    window.addEventListener('resize', handleLayoutChange);

    // Firebase ready listener
    window.addEventListener('firebaseLoaded', () => {
        isFirebaseReady = true;
        tryInitialize();
    });
}

// Get elements
const healthTipSection = document.getElementById('healthTipSection');
const refreshHealthTipBtn = document.getElementById('refreshHealthTip');

// Health tip category icons
const categoryIcons = {
    nutrition: '🥗',
    fitness: '🏋️‍♂️',
    wellness: '🧘‍♂️',
    mindfulness: '🧠',
    hydration: '💧',
    default: '✨'
};

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

// Render a meal card
function renderMealCard(meal) {
    const mealTime = new Date(meal.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mealDate = new Date(meal.dateTime).toLocaleDateString();
    
    return `
        <div class="meal-card">
            <div class="meal-card-header">
                <div>
                    <h3 class="meal-title">${meal.name}</h3>
                    <span class="meal-time">${mealTime}</span>
                </div>
            </div>
            
            <div class="meal-nutrients">
                <div class="nutrient-item">
                    <div class="nutrient-label">Calories</div>
                    <div class="nutrient-value">${Math.round(meal.calories)}</div>
                </div>
                <div class="nutrient-item">
                    <div class="nutrient-label">Protein</div>
                    <div class="nutrient-value">${Math.round(meal.protein)}g</div>
                </div>
                <div class="nutrient-item">
                    <div class="nutrient-label">Carbs</div>
                    <div class="nutrient-value">${Math.round(meal.carbs)}g</div>
                </div>
                <div class="nutrient-item">
                    <div class="nutrient-label">Fat</div>
                    <div class="nutrient-value">${Math.round(meal.fat)}g</div>
                </div>
            </div>
            
            <div class="meal-actions">
                <button class="view-details-btn" onclick="showMealDetails('${meal.id}')">
                    AI Assessment
                </button>
            </div>
        </div>
    `;
}

// Show meal details in a modal
async function showMealDetails(mealId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('Please log in to view meal details');
        return;
    }

    try {
        // Create and show modal first with loading state
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop visible';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Loading...</h3>
                    <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Fetch meal data
        const snapshot = await firebase.database().ref(`users/${user.uid}/meals/${mealId}`).once('value');
        const meal = snapshot.val();
        if (!meal) {
            throw new Error('Meal not found');
        }

        // Get AI assessment of the meal
        const assessment = await ai.analyzeMeal(meal.name);

        // Update modal with meal details and assessment
        const modalContent = modal.querySelector('.modal');
        modalContent.innerHTML = `
            <div class="modal-header">
                <div class="modal-title-section">
                    <h3 class="modal-title">${meal.name}</h3>
                    <p class="modal-subtitle">${new Date(meal.dateTime).toLocaleString()}</p>
                </div>
                <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">×</button>
            </div>
            <div class="modal-body">
                <div class="meal-details">
                    <div class="nutrient-details">
                        <h4>Nutritional Information</h4>
                        <div class="nutrient-grid">
                            <div class="nutrient-detail">
                                <span class="label">Calories</span>
                                <span class="value">${Math.round(meal.calories)} kcal</span>
                            </div>
                            <div class="nutrient-detail">
                                <span class="label">Protein</span>
                                <span class="value">${Math.round(meal.protein)}g</span>
                            </div>
                            <div class="nutrient-detail">
                                <span class="label">Carbs</span>
                                <span class="value">${Math.round(meal.carbs)}g</span>
                            </div>
                            <div class="nutrient-detail">
                                <span class="label">Fat</span>
                                <span class="value">${Math.round(meal.fat)}g</span>
                            </div>
                        </div>
                    </div>

                    <div class="ai-assessment">
                        <h4>AI Assessment <span class="ai-badge">AI</span></h4>
                        <div class="assessment-content">
                            ${assessment.assessment ? `
                                <div class="assessment-section">
                                    <p>${assessment.assessment}</p>
                                </div>
                            ` : ''}
                            
                            ${assessment.suggestions ? `
                                <div class="suggestions-section">
                                    <h5>Suggestions</h5>
                                    <p>${assessment.suggestions}</p>
                                </div>
                            ` : ''}
                            
                            ${assessment.warnings && assessment.warnings.length > 0 ? `
                                <div class="warnings-section">
                                    <h5>Important Notes</h5>
                                    <ul>
                                        ${assessment.warnings.map(warning => `
                                            <li>${warning}</li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    ${meal.notes ? `
                        <div class="notes-section">
                            <h4>Additional Notes</h4>
                            <p>${meal.notes}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error showing meal details:', error);
        showToast('Failed to load meal details');
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.remove();
        }
    }
}

// Make showMealDetails available globally
window.showMealDetails = showMealDetails;

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
    
    if (!meals || Object.keys(meals).length === 0) {
        mealGrid.innerHTML = `
            <div class="meal-card empty-meal-card">
                <div class="empty-state">
                    <div class="empty-state-icon">🍽️</div>
                    <h3 class="empty-state-title">No meals added yet</h3>
                    <p class="empty-state-text">Click the + button to add your first meal</p>
                </div>
            </div>
        `;
        return;
    }

    const mealsArray = Object.values(meals).sort((a, b) => 
        new Date(b.dateTime) - new Date(a.dateTime)
    );

    mealGrid.innerHTML = mealsArray.map(meal => `
        <div class="meal-card">
            <div class="meal-card-header">
                <div>
                    <h3 class="meal-title">${meal.name}</h3>
                    <span class="meal-time">${new Date(meal.dateTime).toLocaleString()}</span>
                </div>
            </div>
            
            <div class="meal-nutrients">
                <div class="nutrient-item">
                    <div class="nutrient-label">Calories</div>
                    <div class="nutrient-value">${Math.round(meal.calories)}</div>
                </div>
                <div class="nutrient-item">
                    <div class="nutrient-label">Protein</div>
                    <div class="nutrient-value">${Math.round(meal.protein)}g</div>
                </div>
                <div class="nutrient-item">
                    <div class="nutrient-label">Carbs</div>
                    <div class="nutrient-value">${Math.round(meal.carbs)}g</div>
                </div>
                <div class="nutrient-item">
                    <div class="nutrient-label">Fat</div>
                    <div class="nutrient-value">${Math.round(meal.fat)}g</div>
                </div>
            </div>
            
            <div class="meal-actions">
                <button class="view-details-btn" onclick="showMealDetails('${meal.id}')">
                    AI Assessment
                </button>
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
    showLoading('Loading your dashboard...', 'This may take a moment');
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Load all data in parallel
        await Promise.all([
            loadUserProfile(),
            loadMealsAndStats(),
            goalsManager.loadGoals()
        ]);
        
        // Load AI tips based on the loaded data
        await generateAINutritionTips();
        
        // Hide loading after a slight delay to ensure smooth transition
        setTimeout(hideLoading, 500);
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast('Some dashboard features failed to load');
        hideLoading();
        throw error;
    }
}

// Update welcome message based on goals status
function updateWelcomeMessage(hasGoals) {
    const welcomeText = document.querySelector('.welcome-text p');
    if (welcomeText) {
        if (hasGoals) {
            welcomeText.textContent = "Here's your meal tracking overview for today";
        } else {
            welcomeText.innerHTML = 'Get started by <a href="nutrition-goals.html" class="text-primary">setting up your nutrition goals</a>';
        }
    }
}

// Weekly Summary Button Click Handler
weeklySummaryBtn.addEventListener('click', async () => {
    const content = popup.querySelector('.popup-content');
    const spinner = weeklySummaryBtn.querySelector('.ai-spinner');
    spinner.classList.add('visible');
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        // Get last week's meals
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
        const mealsSnap = await mealsRef.once('value');
        const allMeals = mealsSnap.val() || {};
        
        // Filter for recent meals
        const recentMeals = Object.values(allMeals).filter(meal => 
            new Date(meal.dateTime) >= oneWeekAgo
        );

        if (recentMeals.length === 0) {
            throw new Error('No meals logged in the past week');
        }

        // Get AI analysis
        const summary = await ai.generateWeeklySummary(recentMeals);
        
        if (!summary || typeof summary !== 'object') {
            throw new Error('Invalid summary response from AI');
        }
        
        const summaryContent = `
            <div class="popup-header">
                <h2>🤖 Your Weekly Nutrition Analysis</h2>
            </div>
            <div class="ai-content">
                <!-- Overview Section -->
                <div class="summary-section overview">
                    <h3>Week Overview</h3>
                    <div class="overview-stats">
                        <div class="stat-item">
                            <span class="stat-label">Avg. Calories</span>
                            <span class="stat-value">${Math.round(summary.overview.averageCalories)} kcal</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Avg. Protein</span>
                            <span class="stat-value">${Math.round(summary.overview.averageProtein)}g</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Meals Logged</span>
                            <span class="stat-value">${summary.overview.mealFrequency}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Goal Progress</span>
                            <span class="stat-value">${summary.overview.goalProgress}</span>
                        </div>
                    </div>
                    <p class="overview-summary">${summary.overview.summary}</p>
                </div>

                <!-- Detailed Analysis -->
                <div class="summary-section analysis">
                    <h3>Detailed Analysis</h3>
                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <strong>Macro Balance</strong>
                            <p>${summary.analysis.macroBalance}</p>
                        </div>
                        <div class="analysis-item">
                            <strong>Meal Timing</strong>
                            <p>${summary.analysis.mealTiming}</p>
                        </div>
                        <div class="analysis-item">
                            <strong>Nutrition Balance</strong>
                            <p>${summary.analysis.nutritionBalance}</p>
                        </div>
                    </div>
                </div>

                <!-- Key Insights -->
                <div class="summary-section insights">
                    <h3>Key Insights</h3>
                    <ul class="insights-list">
                        ${summary.insights.map(insight => `
                            <li class="insight-item">${insight}</li>
                        `).join('')}
                    </ul>
                </div>

                <!-- Recommendations -->
                <div class="summary-section recommendations">
                    <h3>Personalized Recommendations</h3>
                    <div class="recommendations-grid">
                        ${summary.recommendations.map(rec => `
                            <div class="recommendation-card">
                                <div class="rec-header">
                                    <strong>${rec.area}</strong>
                                </div>
                                <p class="rec-suggestion">${rec.suggestion}</p>
                                <p class="rec-benefit">${rec.benefit}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Health Scores -->
                <div class="summary-section health-metrics">
                    <h3>Health Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">Balance Score</span>
                            <div class="metric-score">${summary.healthMetrics.balanceScore}/10</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Variety Score</span>
                            <div class="metric-score">${summary.healthMetrics.varietyScore}/10</div>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Consistency Score</span>
                            <div class="metric-score">${summary.healthMetrics.consistencyScore}/10</div>
                        </div>
                    </div>
                </div>
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

// Load and display a health tip
async function loadHealthTip() {
    if (!healthTipSection) return;
    
    try {
        // Show loading state
        healthTipSection.innerHTML = `
            <div class="health-tip-loading">
                <div class="ai-spinner visible"></div>
                <p>Loading health insight...</p>
            </div>
        `;
        
        const tipData = await ai.getHealthTip();
        
        if (!tipData || !tipData.title || !tipData.tip) {
            throw new Error('Invalid health tip data');
        }

        // Get icon based on category
        const icon = categoryIcons[tipData.category?.toLowerCase()] || categoryIcons.default;
        
        healthTipSection.innerHTML = `
            <div class="health-tip-header">
                <span class="health-tip-icon">${icon}</span>
                <h3 class="health-tip-title">${tipData.title}</h3>
            </div>
            <p class="health-tip-content">${tipData.tip}</p>
            <span class="health-tip-category">${tipData.category || 'Wellness'}</span>
        `;
    } catch (error) {
        console.error('Failed to load health tip:', error);
        
        // Display fallback tip
        healthTipSection.innerHTML = `
            <div class="health-tip-header">
                <span class="health-tip-icon">💧</span>
                <h3 class="health-tip-title">Stay Hydrated</h3>
            </div>
            <p class="health-tip-content">Drinking enough water is crucial for metabolism, digestion, and nutrient absorption. Aim for at least 8 glasses daily, and more when exercising.</p>
            <span class="health-tip-category">Hydration</span>
        `;
    }
}

// Refresh health tip button click handler
refreshHealthTipBtn?.addEventListener('click', () => {
    loadHealthTip();
});

// Expose closeWeeklySummary to window for HTML onclick handler
window.closeWeeklySummary = closeWeeklySummary;

// AI Nutrition Tips functionality
function initializeAINutritionTips() {
    const refreshTipsBtn = document.querySelector('.btn-refresh-tips');
    
    // Check layout and move AI tips section if needed
    handleLayoutChange();
    window.addEventListener('resize', handleLayoutChange);
    
    // Set up refresh button
    if (refreshTipsBtn) {
        refreshTipsBtn.addEventListener('click', () => {
            generateAINutritionTips();
        });
    }
    
    // Generate initial tips
    generateAINutritionTips();
}

// Function to generate AI nutrition tips based on user data
async function generateAINutritionTips() {
    const tipSections = {
        general: document.querySelector('.ai-tips-section:nth-child(1) .ai-tips-content'),
        protein: document.querySelector('.ai-tips-section:nth-child(2) .ai-tips-content'),
        hydration: document.querySelector('.ai-tips-section:nth-child(3) .ai-tips-content')
    };
    
    if (!tipSections.general || !tipSections.protein || !tipSections.hydration) return;
    
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;

        // Get user data and meals
        const [userSnap, mealsSnap, goalsSnap] = await Promise.all([
            firebase.database().ref(`users/${user.uid}/profile`).once('value'),
            firebase.database().ref(`users/${user.uid}/meals`).once('value'),
            firebase.database().ref(`users/${user.uid}/nutritionGoals`).once('value')
        ]);

        const userData = {
            profile: userSnap.val() || {},
            nutritionGoals: goalsSnap.val() || {},
        };
        const mealsData = mealsSnap.val() || {};

        if (!goalsManager.hasAnyGoals()) {
            // If no goals are set, show setup prompts in each section
            const setupPrompt = `
                <div class="ai-tip-card">
                    <div class="ai-tip-icon general">✨</div>
                    <p>Set up your nutrition goals to get personalized AI tips and tracking!
                    <a href="nutrition-goals.html" class="btn btn-primary btn-small">Set Goals Now</a></p>
                </div>
            `;
            Object.values(tipSections).forEach(container => {
                container.innerHTML = setupPrompt;
            });
            return;
        }

        // Generate personalized tips
        const tips = await nutritionTipGenerator.generateTips(userData, mealsData);

        // Update each section with its corresponding tip
        Object.entries(tips).forEach(([category, tip]) => {
            if (tip && tipSections[category]) {
                tipSections[category].innerHTML = `
                    <div class="ai-tip-card">
                        <div class="ai-tip-icon ${tip.iconClass}">${tip.icon}</div>
                        <p>${tip.tip}</p>
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error('Failed to generate AI nutrition tips:', error);
        showToast('Failed to update nutrition tips', 'error');
    }
}

// Function to handle layout changes and move the AI tips sections if needed
function handleLayoutChange() {
    const mainContainer = document.querySelector('.dashboard-main');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const aiTipsSections = document.querySelectorAll('.ai-tips-section');
    
    if (!mainContainer || !aiTipsSections.length) return;

    // Move AI tips based on screen size and goals availability
    const isMobile = window.innerWidth < 768;
    const hasGoals = goalsManager.hasAnyGoals();

    aiTipsSections.forEach(section => {
        if (isMobile || !hasGoals) {
            mainContainer.appendChild(section);
        } else if (sidebar && hasGoals) {
            sidebar.appendChild(section);
        }
    });
}

// Update tips when meals or goals change
function setupAITipsListeners() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Listen for changes in meals
    firebase.database().ref(`users/${user.uid}/meals`).on('value', () => {
        generateAINutritionTips();
    });

    // Listen for changes in goals
    firebase.database().ref(`users/${user.uid}/nutritionGoals`).on('value', () => {
        generateAINutritionTips();
        handleLayoutChange();
    });
}

// Wait for both DOM and Firebase to be ready
let isDomReady = false;
let isFirebaseReady = false;

function tryInitialize() {
    if (isDomReady && isFirebaseReady) {
        // Check if user is authenticated
        const user = firebase.auth().currentUser;
        if (user) {
            initializeDashboard().catch(error => {
                console.error('Dashboard initialization error:', error);
                showToast('Failed to load dashboard. Please refresh the page.', 'error');
                hideLoading();
            });
        } else {
            hideLoading();
            window.location.href = 'login.html';
        }
    }
}

// DOM ready listener
document.addEventListener('DOMContentLoaded', () => {
    isDomReady = true;
    setupEventListeners();
    tryInitialize();
});

// Firebase ready listener
window.addEventListener('firebaseLoaded', () => {
    isFirebaseReady = true;
    tryInitialize();
});
