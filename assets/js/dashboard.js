// Dashboard functionality
const mealGrid = document.getElementById('mealGrid');
const logoutBtn = document.getElementById('logoutBtn');ment.getElementById('mealGrid');
const logoutBtn = document.getElementById('logoutBtn');

// Handle logout
logoutBtn.addEventListener('click', () => {
    firebase.auth().signOut();
});

// Load user's meals
function loadMeals() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const mealsRef = firebase.database().ref(`users/${user.uid}/meals`);
    mealsRef.on('value', (snapshot) => {
        const meals = snapshot.val();
        
        // Clear current meals
        mealGrid.innerHTML = '';
        
        if (!meals) {
            // Show empty state            mealGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No meals added yet</h3>
                    <p>Click the + button to add your first meal</p>
                </div>
            `;

            // Hide weekly summary when no meals
            document.getElementById('weeklySummary').classList.remove('visible');
            return;
        }

        // Display meals
        Object.entries(meals).forEach(([mealId, meal]) => {
            const mealCard = document.createElement('div');
            mealCard.className = 'meal-card';
            mealCard.innerHTML = `
                <h3>${meal.name}</h3>
                <div class="meal-metadata">
                    <p>Calories: ${meal.calories}</p>
                    <p>Date: ${new Date(meal.dateTime).toLocaleString()}</p>
                </div>
                ${meal.notes ? `<p>${meal.notes}</p>` : ''}
                <div class="meal-actions">
                    <button onclick="editMeal('${mealId}')" class="btn btn-edit">Edit</button>
                    <button onclick="deleteMeal('${mealId}')" class="btn btn-delete">Delete</button>
                </div>
            `;
            mealGrid.appendChild(mealCard);
        });
    });
}

// Edit meal
function editMeal(mealId) {
    window.location.href = `add-meal.html?id=${mealId}`;
}

// Delete meal
function deleteMeal(mealId) {
    if (confirm('Are you sure you want to delete this meal?')) {
        const user = firebase.auth().currentUser;
        firebase.database().ref(`users/${user.uid}/meals/${mealId}`).remove()
            .then(() => {
                showToast('Meal deleted successfully', 'success');
            })
            .catch((error) => {
                showToast(error.message);
            });
    }
}

// Initialize dashboard
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        loadMeals();
    }
});
