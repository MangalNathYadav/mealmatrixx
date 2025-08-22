// Meal History JS for mobile app
import { getCurrentUser } from './auth.js';

function formatDateTime(dateStr, timeStr) {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function loadMealHistory() {
    const mealHistoryList = document.getElementById('mealHistoryList');
    if (!mealHistoryList) return;
    const user = getCurrentUser();
    if (!user) {
        mealHistoryList.innerHTML = '<p>Please login to view your meal history.</p>';
        return;
    }
    mealHistoryList.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const mealsSnapshot = await firebase.database().ref(`users/${user.uid}/meals`).once('value');
        const mealsByDate = {};
        mealsSnapshot.forEach(childSnapshot => {
            const meal = childSnapshot.val();
            let date = '';
            if (meal.dateTime) {
                date = new Date(meal.dateTime).toISOString().split('T')[0];
            } else if (meal.date) {
                date = meal.date;
            }
            if (!mealsByDate[date]) mealsByDate[date] = [];
            mealsByDate[date].push({
                ...meal,
                id: childSnapshot.key,
                sortKey: meal.dateTime ? new Date(meal.dateTime).getTime() : (meal.timestamp || 0)
            });
        });
        // Sort dates descending
        const sortedDates = Object.keys(mealsByDate).sort((a, b) => new Date(b) - new Date(a));
        let html = '';
        if (sortedDates.length === 0) {
            mealHistoryList.innerHTML = '<p>No meals found.</p>';
            return;
        }
        html += `<div class="meal-list-history">`;
        sortedDates.forEach(date => {
            html += `<div class="meal-history-date-group">
                <h4 class="meal-history-date">${new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</h4>
                <div class="meal-history-day-cards">`;
            // Sort meals in a day by time
            mealsByDate[date].sort((a, b) => b.sortKey - a.sortKey);
            mealsByDate[date].forEach(meal => {
                html += `<div class="meal-card-history" data-id="${meal.id}">
                    <div class="meal-card-left">
                        <div class="meal-card-title">${meal.name || 'Meal'}</div>
                        <div class="meal-card-macros">
                            <span class="macro calories">${meal.calories} kcal</span>
                            <span class="macro protein">P: ${meal.protein}g</span>
                            <span class="macro carbs">C: ${meal.carbs}g</span>
                            <span class="macro fat">F: ${meal.fat}g</span>
                        </div>
                        ${meal.notes ? `<div class="meal-card-desc">${meal.notes}</div>` : ''}
                    </div>
                    <div class="meal-card-right">
                        <div class="meal-card-date">${meal.dateTime ? new Date(meal.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </div>
                </div>`;
            });
            html += `</div></div>`;
        });
        html += `</div>`;
        mealHistoryList.innerHTML = html;
    } catch (error) {
        mealHistoryList.innerHTML = '<p>Failed to load meal history. Tap to retry.</p>';
        mealHistoryList.addEventListener('click', loadMealHistory);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadMealHistory();
    window.addEventListener('authStateChanged', loadMealHistory);
});
