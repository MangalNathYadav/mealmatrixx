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
        
        // Load health tip after initial dashboard load
        loadHealthTip();
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
    const aiTipsContent = document.querySelector('.ai-tips-content');
    if (!aiTipsContent) return;
    
    // Show loading state
    aiTipsContent.innerHTML = `
        <div class="ai-tip">
            <div class="ai-tip-icon">⏳</div>
            <p>Analyzing your nutrition data...</p>
        </div>
    `;
    
    try {
        // In a real app, this would call your AI service
        // For now we'll simulate tips based on available data
        const mockTips = [
            {
                icon: '🥩',
                tip: "Based on your protein intake, try adding more lean protein sources to reach your daily goal."
            },
            {
                icon: '🥦',
                tip: "You're low on fiber today. Adding vegetables or whole grains to your next meal would be beneficial."
            },
            {
                icon: '💧',
                tip: "Remember to stay hydrated. Aim for at least 8 glasses of water today."
            },
            {
                icon: '🍳',
                tip: "Consider having eggs for your next meal to boost your protein intake."
            },
            {
                icon: '🥑',
                tip: "You've reached 50% of your healthy fats goal. Avocados or nuts would be a great addition today."
            }
        ];
        
        // Randomly select two tips
        const selectedTips = [];
        while (selectedTips.length < 2 && mockTips.length > 0) {
            const randomIndex = Math.floor(Math.random() * mockTips.length);
            selectedTips.push(mockTips.splice(randomIndex, 1)[0]);
        }
        
        // Update the tips section
        let tipsHTML = '';
        selectedTips.forEach(tip => {
            tipsHTML += `
                <div class="ai-tip">
                    <div class="ai-tip-icon">${tip.icon}</div>
                    <p>${tip.tip}</p>
                </div>
            `;
        });
        
        aiTipsContent.innerHTML = `
            ${tipsHTML}
            <div class="ai-tip-actions">
                <button class="btn-refresh-tips">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1113 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Refresh Tips
                </button>
            </div>
        `;
        
        // Re-attach event listener to the new button
        const newRefreshBtn = aiTipsContent.querySelector('.btn-refresh-tips');
        if (newRefreshBtn) {
            newRefreshBtn.addEventListener('click', generateAINutritionTips);
        }
        
    } catch (error) {
        console.error('Failed to generate AI nutrition tips:', error);
        
        // Display fallback tip
        aiTipsContent.innerHTML = `
            <div class="ai-tip">
                <div class="ai-tip-icon">💡</div>
                <p>Always aim for a balanced diet with proteins, healthy fats, and complex carbohydrates.</p>
            </div>
            <div class="ai-tip">
                <div class="ai-tip-icon">🍎</div>
                <p>Include a variety of fruits and vegetables in your meals to ensure you get essential vitamins and minerals.</p>
            </div>
            <div class="ai-tip-actions">
                <button class="btn-refresh-tips">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1113 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Refresh Tips
                </button>
            </div>
        `;
        
        // Re-attach event listener to the new button
        const newRefreshBtn = aiTipsContent.querySelector('.btn-refresh-tips');
        if (newRefreshBtn) {
            newRefreshBtn.addEventListener('click', generateAINutritionTips);
        }
    }
}

// Function to handle layout changes and move the AI tips section if needed
function handleLayoutChange() {
    const aiTipsSection = document.querySelector('.ai-tips-section');
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');
    const dashboardMain = document.querySelector('.dashboard-main');
    const mealGrid = document.querySelector('.meals-container');
    
    if (!aiTipsSection || !dashboardSidebar || !dashboardMain || !mealGrid) return;
    
    // Check window width for mobile view
    if (window.innerWidth <= 767) {
        // On mobile, move the AI tips section to the main content area
        if (aiTipsSection.parentElement === dashboardSidebar) {
            aiTipsSection.classList.add('move-to-main');
            dashboardMain.insertBefore(aiTipsSection, null); // Insert at the end
        }
    } else {
        // On desktop, move back to sidebar if it was moved
        if (aiTipsSection.classList.contains('move-to-main')) {
            aiTipsSection.classList.remove('move-to-main');
            dashboardSidebar.insertBefore(aiTipsSection, null); // Insert at the end
        }
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            initializeDashboard();
        } else {
            window.location.href = 'login.html';
        }
    });
      // Health tip refresh button
    if (refreshHealthTipBtn) {
        refreshHealthTipBtn.addEventListener('click', () => {
            loadHealthTip();
        });
    }

    // Initialize AI Nutrition Tips
    initializeAINutritionTips();
});
