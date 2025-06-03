// Add/Edit Meal functionality
const mealForm = document.getElementById('mealForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');

// Get meal ID from URL if editing
const urlParams = new URLSearchParams(window.location.search);
const mealId = urlParams.get('id');
let editMode = false;

// Set current datetime as default
document.getElementById('dateTime').value = new Date().toISOString().slice(0, 16);

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
                        document.getElementById('mealName').value = meal.name;
                        document.getElementById('calories').value = meal.calories;
                        document.getElementById('dateTime').value = meal.dateTime;
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
    if (!user) return;

    const mealData = {
        name: document.getElementById('mealName').value,
        calories: parseInt(document.getElementById('calories').value),
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
        showToast(error.message);
    }
});
