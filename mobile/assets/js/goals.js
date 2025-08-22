// Nutrition Goals module for mobile app
import { showToast, showLoading, hideLoading } from './app.js';
import { getCurrentUser } from './auth.js';

export default function initializeGoals() {
    const currentGoalsSection = document.getElementById('currentGoals');
    const goalsForm = document.getElementById('goalsForm');
    
    if (!currentGoalsSection || !goalsForm) return;
    // Load current goals
    loadCurrentGoals();
    // Listen for auth state changes and reload goals
    window.addEventListener('authStateChanged', loadCurrentGoals);
    // Handle form submission
    goalsForm.addEventListener('submit', handleGoalsSubmission);
}

// Load current nutrition goals from Firebase
async function loadCurrentGoals() {
    const currentGoalsSection = document.getElementById('currentGoals');
    if (!currentGoalsSection) return;
    
    const user = getCurrentUser();
    if (!user) {
        // Show login prompt in UI, disable form
        currentGoalsSection.innerHTML = `<h3 class="mb-2">Current Goals</h3><div class="goals-summary"><div class="goal-item"><span class="goal-label">Please login to view and update goals.</span></div></div>`;
        // Disable form fields and button
        ["targetCalories","proteinGoal","carbsGoal","fatGoal","activityLevel","goalType","currentWeight","weightGoal","weeklyGoal"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });
        const formBtn = document.querySelector('#goalsForm button[type="submit"]');
        if (formBtn) formBtn.disabled = true;
        // Also update weekly progress section
        const weeklyProgress = document.getElementById('weeklyProgress');
        if (weeklyProgress) weeklyProgress.innerHTML = `<div class="goal-item"><span class="goal-label">Please login to view progress.</span></div>`;
        return;
    } else {
        // Enable form fields and button
        ["targetCalories","proteinGoal","carbsGoal","fatGoal","activityLevel","goalType","currentWeight","weightGoal","weeklyGoal"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = false;
        });
        const formBtn = document.querySelector('#goalsForm button[type="submit"]');
        if (formBtn) formBtn.disabled = false;
    }
    
    try {
        // Get goals from Firebase
        const goalsSnapshot = await firebase.database()
            .ref(`users/${user.uid}/goals`)
            .once('value');
        const goals = goalsSnapshot.val();
        if (!goals || !goals.targetCalories) {
            currentGoalsSection.innerHTML = `<h3 class="mb-2">Current Goals</h3><div class="goals-summary"><div class="goal-item"><span class="goal-label">Please setup goals</span></div></div>`;
            // Clear form fields
            document.getElementById('targetCalories').value = '';
            document.getElementById('proteinGoal').value = '';
            document.getElementById('carbsGoal').value = '';
            document.getElementById('fatGoal').value = '';
            document.getElementById('activityLevel').value = 'sedentary';
            document.getElementById('goalType').value = 'maintain';
            if (document.getElementById('currentWeight')) document.getElementById('currentWeight').value = '';
            if (document.getElementById('weightGoal')) document.getElementById('weightGoal').value = '';
            if (document.getElementById('weeklyGoal')) document.getElementById('weeklyGoal').value = '';
            // Also update weekly progress section
            const weeklyProgress = document.getElementById('weeklyProgress');
            if (weeklyProgress) weeklyProgress.innerHTML = `<div class="goal-item"><span class="goal-label">Please setup goals</span></div>`;
            return;
        }
        // Update UI with current goals
        currentGoalsSection.innerHTML = `
            <h3 class="mb-2">Current Goals</h3>
            <div class="goals-summary">
                <div class="goal-item">
                    <span class="goal-label">Target Calories</span>
                    <span class="goal-value">${goals.targetCalories} kcal</span>
                </div>
                <div class="goal-item">
                    <span class="goal-label">Protein Goal</span>
                    <span class="goal-value">${goals.proteinGoal}g</span>
                </div>
                <div class="goal-item">
                    <span class="goal-label">Carbs Goal</span>
                    <span class="goal-value">${goals.carbsGoal}g</span>
                </div>
                <div class="goal-item">
                    <span class="goal-label">Fat Goal</span>
                    <span class="goal-value">${goals.fatGoal}g</span>
                </div>
                <div class="goal-item">
                    <span class="goal-label">Activity Level</span>
                    <span class="goal-value">${goals.activityLevel}</span>
                </div>
                <div class="goal-item">
                    <span class="goal-label">Goal Type</span>
                    <span class="goal-value">${goals.goalType}</span>
                </div>
            </div>
            <style>
                .goals-summary {
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 12px;
                    padding: 1rem;
                }
                .goal-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid rgba(203, 213, 225, 0.5);
                }
                .goal-item:last-child {
                    border-bottom: none;
                }
                .goal-label {
                    font-weight: 500;
                    color: var(--gray-700);
                }
                .goal-value {
                    font-weight: 600;
                    color: var(--primary-color);
                }
            </style>
        `;
        // Pre-populate form with current values
        document.getElementById('targetCalories').value = goals.targetCalories || 2000;
        document.getElementById('proteinGoal').value = goals.proteinGoal || 150;
        document.getElementById('carbsGoal').value = goals.carbsGoal || 250;
        document.getElementById('fatGoal').value = goals.fatGoal || 65;
        document.getElementById('activityLevel').value = goals.activityLevel || 'sedentary';
        document.getElementById('goalType').value = goals.goalType || 'maintain';
            // Fetch weight fields from users/uid/
            if (document.getElementById('currentWeight') || document.getElementById('weightGoal')) {
                const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
                const userData = userSnapshot.val() || {};
                if (document.getElementById('currentWeight')) document.getElementById('currentWeight').value = userData.currentWeight || '';
                if (document.getElementById('weightGoal')) document.getElementById('weightGoal').value = userData.weightGoal || '';
            }
            if (document.getElementById('weeklyGoal')) document.getElementById('weeklyGoal').value = goals.weeklyGoal || '';
            // Update weekly progress section
            const weeklyProgress = document.getElementById('weeklyProgress');
            if (weeklyProgress) {
                // Calculate weekly nutrition progress
                let weeklyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
                let daysWithMeals = 0;
                const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Sunday
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6); // Saturday
                await mealsRef.once('value').then(snapshot => {
                    const days = {};
                    snapshot.forEach(child => {
                        const meal = child.val();
                        let mealDate = '';
                        if (meal.dateTime) {
                            mealDate = new Date(meal.dateTime);
                        } else if (meal.date) {
                            mealDate = new Date(meal.date);
                        } else {
                            return;
                        }
                        if (mealDate >= weekStart && mealDate <= weekEnd) {
                            weeklyTotals.calories += Number(meal.calories || 0);
                            weeklyTotals.protein += Number(meal.protein || 0);
                            weeklyTotals.carbs += Number(meal.carbs || 0);
                            weeklyTotals.fat += Number(meal.fat || 0);
                            const dayKey = mealDate.toISOString().split('T')[0];
                            days[dayKey] = true;
                        }
                    });
                    daysWithMeals = Object.keys(days).length;
                });
                weeklyProgress.innerHTML = `
                    <div class="goal-item"><span class="goal-label">Weekly Calories</span><span class="goal-value">${weeklyTotals.calories} kcal</span></div>
                    <div class="goal-item"><span class="goal-label">Weekly Protein</span><span class="goal-value">${weeklyTotals.protein}g</span></div>
                    <div class="goal-item"><span class="goal-label">Weekly Carbs</span><span class="goal-value">${weeklyTotals.carbs}g</span></div>
                    <div class="goal-item"><span class="goal-label">Weekly Fat</span><span class="goal-value">${weeklyTotals.fat}g</span></div>
                    <div class="goal-item"><span class="goal-label">Days with Meals</span><span class="goal-value">${daysWithMeals}</span></div>
                    ${goals.weeklyGoal ? `<div class="goal-item"><span class="goal-label">Weekly Goal</span><span class="goal-value">${goals.weeklyGoal} kg/week</span></div>` : ''}
                `;
            }
    } catch (error) {
        console.error('Error loading goals:', error);
        currentGoalsSection.innerHTML = `
            <p>Failed to load current goals. Tap to retry.</p>
        `;
        currentGoalsSection.addEventListener('click', loadCurrentGoals);
    }
}

// Handle goals form submission
async function handleGoalsSubmission(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showToast('You must be logged in to update goals', 'error');
        return;
    }
    
    // Get form values
    const targetCalories = Number(document.getElementById('targetCalories').value);
    const proteinGoal = Number(document.getElementById('proteinGoal').value);
    const carbsGoal = Number(document.getElementById('carbsGoal').value);
    const fatGoal = Number(document.getElementById('fatGoal').value);
    const activityLevel = document.getElementById('activityLevel').value;
    const goalType = document.getElementById('goalType').value;
    // Validate values
    if (!targetCalories || targetCalories <= 0) {
        showToast('Please enter a valid calorie goal', 'error');
        return;
    }
    if (!proteinGoal || !carbsGoal || !fatGoal) {
        showToast('Please enter valid macro goals', 'error');
        return;
    }
    // Create goals object (flat fields)
    const goals = {
        targetCalories,
        proteinGoal,
        carbsGoal,
        fatGoal,
        activityLevel,
        goalType,
        weeklyGoal: Number(document.getElementById('weeklyGoal').value) || 0,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };
    // Get weight fields
    const currentWeight = Number(document.getElementById('currentWeight').value) || 0;
    const weightGoal = Number(document.getElementById('weightGoal').value) || 0;
    try {
        showLoading();
        // Update goals in Firebase
        await firebase.database()
            .ref(`users/${user.uid}/goals`)
            .set(goals);
        // Update weight fields in users/uid/
        await firebase.database()
            .ref(`users/${user.uid}`)
            .update({ currentWeight, weightGoal });
        hideLoading();
        showToast('Nutrition goals updated successfully!', 'success');
        // Reload current goals to reflect changes
        loadCurrentGoals();
    } catch (error) {
        hideLoading();
        console.error('Error updating goals:', error);
        showToast('Failed to update goals. Please try again.', 'error');
    }
}
