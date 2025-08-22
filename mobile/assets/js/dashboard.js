// Dashboard module for mobile app
import { showToast, showLoading, hideLoading } from './app.js';
import { getCurrentUser } from './auth.js';
import { initWaterTracker } from './water-tracker.js';

export default function initializeDashboard() {
    const nutritionSummary = document.getElementById('nutritionSummary');
    const recentMeals = document.getElementById('recentMeals');
    const nutritionTip = document.getElementById('nutritionTip');
    
    if (!nutritionSummary || !recentMeals || !nutritionTip) return;
    
    // Set current date
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const today = new Date();
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        currentDateElement.textContent = today.toLocaleDateString('en-US', options);
    }
    
    // Set user information
    const user = getCurrentUser();
    if (user) {
        const welcomeUserElement = document.getElementById('welcomeUser');
        const userInitialsElement = document.getElementById('userInitials');
        const userInitialsWelcomeElement = document.getElementById('userInitialsWelcome');
        
        // Get user's display name or email
        const displayName = user.displayName || user.email.split('@')[0];
        
        // Set welcome user text
        if (welcomeUserElement) {
            welcomeUserElement.textContent = displayName;
        }
        
        // Set user initials in avatar
        if (userInitialsElement) {
            userInitialsElement.textContent = getInitials(displayName);
        }
        
        // Set user initials in welcome section avatar
        if (userInitialsWelcomeElement) {
            userInitialsWelcomeElement.textContent = getInitials(displayName);
        }
    }
    
    // Initialize water tracker
    initWaterTracker();
    
    loadDashboardData();

    // Add real-time listener for recent meals
    const userForListener = getCurrentUser();
    if (userForListener) {
        const recentMeals = document.getElementById('recentMeals');
        firebase.database().ref(`users/${userForListener.uid}/meals`).on('value', () => {
            loadRecentMeals();
        });
    }
}

/**
 * Get user's initials from their name or email
 */
function getInitials(name) {
    if (!name) return 'U';
    
    // For email addresses, use the first letter of the local part
    if (name.includes('@')) {
        return name.split('@')[0][0].toUpperCase();
    }
    
    // For display names, use first letter of first and last name
    const parts = name.split(' ');
    if (parts.length === 1) {
        return parts[0][0].toUpperCase();
    } else {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
}

async function loadDashboardData() {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        // Load all data in parallel
        await Promise.all([
            loadNutritionSummary(),
            loadRecentMeals(),
            loadNutritionTip()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load dashboard data. Please try again.', 'error');
    }
}

async function loadNutritionSummary() {
    const nutritionSummary = document.getElementById('nutritionSummary');
    if (!nutritionSummary) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get user's nutrition goals
        const goalsSnapshot = await firebase.database()
            .ref(`users/${user.uid}/goals`)
            .once('value');
        const goals = goalsSnapshot.val() || {
            targetCalories: 2000,
            proteinGoal: 150,
            carbsGoal: 250,
            fatGoal: 65
        };
        
        // Get today's meals
        const mealsSnapshot = await firebase.database()
            .ref(`users/${user.uid}/meals`)
            .once('value');
        const meals = [];
        mealsSnapshot.forEach(childSnapshot => {
            const meal = childSnapshot.val();
            // Check if meal is for today
            let mealDate = '';
            if (meal.dateTime) {
                mealDate = new Date(meal.dateTime).toISOString().split('T')[0];
            } else if (meal.date) {
                mealDate = meal.date;
            }
            if (mealDate === today) {
                meals.push(meal);
            }
        });
        // Calculate nutrition totals
        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };
        meals.forEach(meal => {
            totals.calories += Number(meal.calories || 0);
            totals.protein += Number(meal.protein || 0);
            totals.carbs += Number(meal.carbs || 0);
            totals.fat += Number(meal.fat || 0);
        });
        // Calculate remaining calories and macros
        const remaining = {
            calories: Math.max(0, goals.targetCalories - totals.calories),
            protein: Math.max(0, goals.proteinGoal - totals.protein),
            carbs: Math.max(0, goals.carbsGoal - totals.carbs),
            fat: Math.max(0, goals.fatGoal - totals.fat)
        };
        // Calculate progress percentages
        const progress = {
            calories: goals.targetCalories ? Math.min(100, (totals.calories / goals.targetCalories) * 100) : 0,
            protein: goals.proteinGoal ? Math.min(100, (totals.protein / goals.proteinGoal) * 100) : 0,
            carbs: goals.carbsGoal ? Math.min(100, (totals.carbs / goals.carbsGoal) * 100) : 0,
            fat: goals.fatGoal ? Math.min(100, (totals.fat / goals.fatGoal) * 100) : 0
        };
        
        // Update the nutrition summary UI
        nutritionSummary.innerHTML = `
            <div class="nutrition-progress">
                <div class="progress-item">
                    <div class="progress-label">
                        <span>Calories</span>
                        <span>${totals.calories} / ${goals.targetCalories}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.calories}%"></div>
                    </div>
                </div>
                <div class="progress-item">
                    <div class="progress-label">
                        <span>Protein</span>
                        <span>${totals.protein}g / ${goals.proteinGoal}g</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.protein}%; background: #4ADE80;"></div>
                    </div>
                </div>
                <div class="progress-item">
                    <div class="progress-label">
                        <span>Carbs</span>
                        <span>${totals.carbs}g / ${goals.carbsGoal}g</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.carbs}%; background: #3B82F6;"></div>
                    </div>
                </div>
                <div class="progress-item">
                    <div class="progress-label">
                        <span>Fat</span>
                        <span>${totals.fat}g / ${goals.fatGoal}g</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress.fat}%; background: #F59E0B;"></div>
                    </div>
                </div>
            </div>
            <style>
                .nutrition-progress {
                    margin-top: 1rem;
                }
                .progress-item {
                    margin-bottom: 0.8rem;
                }
                .progress-label {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.3rem;
                    font-size: 0.9rem;
                }
                .progress-bar {
                    height: 0.6rem;
                    background: var(--gray-200);
                    border-radius: 999px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: var(--primary-color);
                    border-radius: 999px;
                    transition: width 0.5s ease;
                }
            </style>
        `;
    } catch (error) {
        console.error('Error loading nutrition summary:', error);
        nutritionSummary.innerHTML = '<p>Failed to load nutrition summary. Tap to retry.</p>';
        nutritionSummary.addEventListener('click', loadNutritionSummary);
    }
}

async function loadRecentMeals() {
    const recentMeals = document.getElementById('recentMeals');
    if (!recentMeals) {
        console.error('Element #recentMeals not found in DOM');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        // Get meals from the last 3 days
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const startDate = threeDaysAgo.toISOString().split('T')[0];
        
        const mealsSnapshot = await firebase.database()
            .ref(`users/${user.uid}/meals`)
            .once('value');

        // Debug: log raw snapshot value
        const rawMeals = mealsSnapshot.val();
        console.log('Raw meals snapshot:', rawMeals);

        const meals = [];
        mealsSnapshot.forEach(childSnapshot => {
            const meal = childSnapshot.val();
            // Parse date and time from dateTime
            let date = '', time = '', sortKey = 0;
            if (meal.dateTime) {
                const dt = new Date(meal.dateTime);
                date = dt.toISOString().split('T')[0];
                time = dt.toTimeString().slice(0,5);
                sortKey = dt.getTime();
            } else if (meal.timestamp) {
                sortKey = typeof meal.timestamp === 'number' ? meal.timestamp : 0;
            }
            meals.push({
                id: childSnapshot.key,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                date,
                time,
                mealName: meal.name,
                description: meal.notes,
                sortKey
            });
        });

        // Sort meals by sortKey (newest first)
        meals.sort((a, b) => b.sortKey - a.sortKey);

        // Only show the latest 10 meals
        const latestMeals = meals.slice(0, 10);
        
        if (meals.length === 0) {
            recentMeals.innerHTML = `
                <p>No recent meals found.</p>
                <a href="#add-meal" class="btn">Add Your First Meal</a>
                <pre style="font-size:0.8em;color:#888;background:#f8f8f8;padding:0.5em;">Debug: No meals loaded for user ${user.uid}. Check RTDB path users/${user.uid}/meals and field names.</pre>
            `;
            return;
        }
        
        // Update the UI with recent meals (horizontal rectangle cards)
        recentMeals.innerHTML = `
            <div class="meal-list-horizontal">
                ${latestMeals.map(meal => `
                    <div class="meal-card-horizontal" data-id="${meal.id}">
                        <div class="meal-card-left">
                            <div class="meal-card-title">${meal.mealName || 'Meal'}</div>
                            <div class="meal-card-macros">
                                <span class="macro calories">${meal.calories} kcal</span>
                                <span class="macro protein">P: ${meal.protein}g</span>
                                <span class="macro carbs">C: ${meal.carbs}g</span>
                                <span class="macro fat">F: ${meal.fat}g</span>
                            </div>
                            ${meal.description ? `<div class="meal-card-desc">${meal.description}</div>` : ''}
                        </div>
                        <div class="meal-card-right">
                            <div class="meal-card-date">${formatDateTime(meal.date, meal.time)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <style>
                .meal-list-horizontal {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .meal-card-horizontal {
                    display: flex;
                    flex-direction: row;
                    align-items: stretch;
                    background: rgba(255,255,255,0.85);
                    border-radius: 14px;
                    box-shadow: 0 2px 8px rgba(147,51,234,0.07);
                    border: 1px solid var(--gray-200);
                    padding: 1rem 1.25rem;
                    min-height: 80px;
                    transition: box-shadow 0.2s;
                }
                .meal-card-horizontal:hover {
                    box-shadow: 0 4px 16px rgba(147,51,234,0.13);
                }
                .meal-card-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .meal-card-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--primary-color);
                    margin-bottom: 0.3rem;
                }
                .meal-card-macros {
                    display: flex;
                    gap: 1.2rem;
                    font-size: 0.95rem;
                    margin-bottom: 0.2rem;
                }
                .macro {
                    background: rgba(124,58,237,0.07);
                    border-radius: 6px;
                    padding: 0.15em 0.6em;
                    font-weight: 500;
                }
                .macro.calories { color: #7C3AED; }
                .macro.protein { color: #4ADE80; }
                .macro.carbs { color: #3B82F6; }
                .macro.fat { color: #F59E0B; }
                .meal-card-desc {
                    font-size: 0.92rem;
                    color: var(--gray-600);
                    margin-top: 0.2rem;
                }
                .meal-card-right {
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    min-width: 90px;
                    padding-left: 1.2rem;
                }
                .meal-card-date {
                    font-size: 0.85rem;
                    color: var(--gray-500);
                    font-weight: 500;
                }
                @media (max-width: 600px) {
                    .meal-card-horizontal {
                        flex-direction: column;
                        padding: 1rem;
                    }
                    .meal-card-right {
                        padding-left: 0;
                        margin-top: 0.5rem;
                        min-width: unset;
                        align-items: flex-start;
                    }
                }
            </style>
        `;
        
        // Add event listeners for meal items
        document.querySelectorAll('.meal-item').forEach(item => {
            item.addEventListener('click', () => {
                const mealId = item.getAttribute('data-id');
                // TODO: Implement meal detail view or edit functionality
                showToast('Meal detail view coming soon!', 'info');
            });
        });
    } catch (error) {
        console.error('Error loading recent meals:', error);
        recentMeals.innerHTML = '<p>Failed to load recent meals. Tap to retry.</p>';
        recentMeals.addEventListener('click', loadRecentMeals);
    }
}

async function loadNutritionTip() {
    const nutritionTip = document.getElementById('nutritionTip');
    if (!nutritionTip) return;
    
    try {
        // We'll use a predefined list of tips for now
        // In a real app, this could be fetched from an API or using the AI capabilities
        const tips = [
            "Try to include protein in every meal to help with muscle repair and feeling full.",
            "Drinking water before meals can help control appetite and prevent overeating.",
            "Colorful vegetables contain different nutrients - aim to include a variety of colors in your diet.",
            "Healthy fats from sources like avocados and nuts are important for hormone production and nutrient absorption.",
            "Meal prep on weekends can help you make healthier choices during busy weekdays.",
            "Be mindful of hidden sugars in processed foods and beverages.",
            "Fiber helps with digestion and feeling full - aim for at least 25-30g daily.",
            "Try to eat slowly and without distractions to help recognize your body's fullness signals.",
            "Eggs are a nutrient-dense food providing high-quality protein and essential vitamins.",
            "Including fermented foods like yogurt can support gut health and digestion."
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        nutritionTip.innerHTML = `
            <div class="tip-content">
                <i class="fas fa-lightbulb" style="color: var(--primary-color); margin-right: 0.5rem;"></i>
                <p>${randomTip}</p>
            </div>
            <button id="newTipBtn" class="btn btn-secondary mt-2">New Tip</button>
            
            <style>
                .tip-content {
                    display: flex;
                    align-items: flex-start;
                    padding: 0.5rem;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 12px;
                }
            </style>
        `;
        
        // Add event listener for new tip button
        const newTipBtn = document.getElementById('newTipBtn');
        if (newTipBtn) {
            newTipBtn.addEventListener('click', loadNutritionTip);
        }
    } catch (error) {
        console.error('Error loading nutrition tip:', error);
        nutritionTip.innerHTML = '<p>Failed to load nutrition tip. Tap to retry.</p>';
        nutritionTip.addEventListener('click', loadNutritionTip);
    }
}

// Helper function to format date and time
function formatDateTime(dateStr, timeStr) {
    const date = new Date(`${dateStr}T${timeStr}`);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateFormatted = '';
    
    if (dateStr === today.toISOString().split('T')[0]) {
        dateFormatted = 'Today';
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
        dateFormatted = 'Yesterday';
    } else {
        dateFormatted = date.toLocaleDateString();
    }
    
    const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return `${dateFormatted}, ${timeFormatted}`;
}
