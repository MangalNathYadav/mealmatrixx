/**
 * Water Tracker Module
 * Handles tracking and updating water intake for the mobile dashboard
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initWaterTracker();
});

/**
 * Initialize the water tracker functionality
 */
function initWaterTracker() {
    const waterPlusBtn = document.getElementById('water-plus-btn');
    const waterMinusBtn = document.getElementById('water-minus-btn');
    const waterCountElement = document.getElementById('water-count');
    const waterProgressBar = document.querySelector('.water-progress-fill');
    
    // Default values
    let waterCount = 0;
    const waterGoal = 8; // Default goal of 8 glasses
    
    // Load from localStorage if available
    if (localStorage.getItem('waterCount')) {
        waterCount = parseInt(localStorage.getItem('waterCount'));
        updateWaterDisplay();
    }
    
    // Event listeners for buttons
    if (waterPlusBtn) {
        waterPlusBtn.addEventListener('click', () => {
            if (waterCount < waterGoal) {
                waterCount++;
                updateWaterDisplay();
                saveWaterCount();
                
                // Add animation class
                waterProgressBar.classList.add('progress-updated');
                setTimeout(() => {
                    waterProgressBar.classList.remove('progress-updated');
                }, 500);
            }
        });
    }
    
    if (waterMinusBtn) {
        waterMinusBtn.addEventListener('click', () => {
            if (waterCount > 0) {
                waterCount--;
                updateWaterDisplay();
                saveWaterCount();
                
                // Add animation class
                waterProgressBar.classList.add('progress-updated');
                setTimeout(() => {
                    waterProgressBar.classList.remove('progress-updated');
                }, 500);
            }
        });
    }
    
    /**
     * Update the water display elements
     */
    function updateWaterDisplay() {
        // Update the count text
        if (waterCountElement) {
            waterCountElement.textContent = `${waterCount}/${waterGoal}`;
        }
        
        // Update the progress bar
        if (waterProgressBar) {
            const percentage = (waterCount / waterGoal) * 100;
            waterProgressBar.style.width = `${percentage}%`;
            
            // Update color based on progress
            if (percentage < 25) {
                waterProgressBar.style.backgroundColor = 'var(--light-blue)';
            } else if (percentage < 75) {
                waterProgressBar.style.backgroundColor = 'var(--primary-blue)';
            } else {
                waterProgressBar.style.backgroundColor = 'var(--deep-blue)';
            }
        }
    }
    
    /**
     * Save water count to localStorage
     */
    function saveWaterCount() {
        localStorage.setItem('waterCount', waterCount.toString());
        
        // If user is authenticated, save to database as well
        // This would connect to your database service
        const user = firebase.auth().currentUser;
        if (user) {
            const userId = user.uid;
            const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            firebase.database().ref(`users/${userId}/waterIntake/${today}`).set({
                count: waterCount,
                goal: waterGoal,
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            }).catch(error => {
                console.error("Error saving water intake:", error);
            });
        }
    }
    
    /**
     * Reset water count at midnight
     */
    function setupDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            waterCount = 0;
            updateWaterDisplay();
            saveWaterCount();
            setupDailyReset(); // Setup next day's reset
        }, timeUntilMidnight);
    }
    
    // Setup the daily reset timer
    setupDailyReset();
}

// Export functions for potential use in other modules
export { initWaterTracker };
