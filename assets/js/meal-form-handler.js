// MealForm Handler
export class MealFormHandler {
    constructor() {
        this.form = document.getElementById('mealForm');
        this.aiResult = document.getElementById('aiResult');
        this.analyzeButton = document.getElementById('analyzeButton');
        this.submitBtn = document.getElementById('submitBtn');
        this.loadingOverlay = document.querySelector('.loading-overlay');
        
        this.setupEventListeners();
        this.initializeDatetime();
    }

    initializeDatetime() {
        // Set current datetime as default
        document.getElementById('dateTime').value = new Date().toISOString().slice(0, 16);
    }

    setupEventListeners() {
        // Form validation
        this.form.querySelectorAll('input[required], textarea[required]').forEach(input => {
            input.addEventListener('input', () => this.validateField(input));
        });

        // Real-time nutrient calculations
        const nutrientInputs = ['calories', 'protein', 'carbs', 'fat'];
        nutrientInputs.forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('input', () => this.validateNutrientValue(input));
        });

        // Submit handler
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    validateField(field) {
        if (!field.value) {
            field.classList.add('invalid');
            this.showFieldError(field, 'This field is required');
        } else {
            field.classList.remove('invalid');
            this.clearFieldError(field);
        }
    }

    validateNutrientValue(input) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < 0) {
            input.classList.add('invalid');
            this.showFieldError(input, 'Please enter a valid number');
            return false;
        }
        input.classList.remove('invalid');
        this.clearFieldError(input);
        return true;
    }

    showFieldError(field, message) {
        let errorDiv = field.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('field-error')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        }
        errorDiv.textContent = message;
    }

    clearFieldError(field) {
        const errorDiv = field.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('field-error')) {
            errorDiv.remove();
        }
    }

    // These methods will be overridden by addMeal.js
    showLoading(message = 'Saving meal...') {
        if (this.loadingOverlay && this.loadingOverlay.querySelector('#loadingMessage')) {
            this.loadingOverlay.querySelector('#loadingMessage').textContent = message;
            this.loadingOverlay.classList.add('active');
        }
        if (this.submitBtn) this.submitBtn.disabled = true;
    }

    hideLoading() {
        if (this.loadingOverlay) this.loadingOverlay.classList.remove('active');
        if (this.submitBtn) this.submitBtn.disabled = false;
    }

    async handleSubmit(e) {
        e.preventDefault();
        console.log('MealFormHandler handleSubmit called');
        
        // Validate all required fields
        let isValid = true;
        this.form.querySelectorAll('input[required], textarea[required]').forEach(field => {
            if (!field.value.trim()) {
                this.validateField(field);
                isValid = false;
            }
        });

        // Validate nutrient values
        const nutrientInputs = ['calories', 'protein', 'carbs', 'fat'];
        nutrientInputs.forEach(id => {
            if (!this.validateNutrientValue(document.getElementById(id))) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showToast('Please fill in all required fields correctly', 'error');
            return;
        }

        this.showLoading();

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                throw new Error('Please log in to add meals');
            }

            const mealData = {
                name: document.getElementById('mealName').value,
                calories: parseFloat(document.getElementById('calories').value),
                protein: parseFloat(document.getElementById('protein').value),
                carbs: parseFloat(document.getElementById('carbs').value),
                fat: parseFloat(document.getElementById('fat').value),
                dateTime: document.getElementById('dateTime').value,
                notes: document.getElementById('notes').value,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            // Check if we're in edit mode based on URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const mealId = urlParams.get('id');
            
            // Only proceed with create if we're not in edit mode
            // (Edit mode is handled by addMeal.js with a custom handleSubmit)
            if (!mealId) {
                await firebase.database().ref(`users/${user.uid}/meals`).push(mealData);
                this.showToast('Meal added successfully!', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 1200);
            }
        } catch (error) {
            console.error('Error saving meal:', error);
            this.showToast(error.message || 'Failed to save meal', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after animation
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    populateFromAIResult(analysis) {
        if (!analysis) return;

        // Set detected items as meal name
        document.getElementById('mealName').value = analysis.foodItems ? analysis.foodItems.join(', ') : '';
        
        // Set nutritional values
        document.getElementById('calories').value = Math.round(analysis.nutrients?.calories || 0);
        document.getElementById('protein').value = Math.round(analysis.nutrients?.protein || 0);
        document.getElementById('carbs').value = Math.round(analysis.nutrients?.carbs || 0);
        document.getElementById('fat').value = Math.round(analysis.nutrients?.fat || 0);

        // Combine AI insights into notes
        const notesArray = [];
        if (analysis.assessment) notesArray.push(`Assessment: ${analysis.assessment}`);
        if (analysis.suggestions) notesArray.push(`\nSuggestions: ${analysis.suggestions}`);
        if (analysis.additionalNotes) notesArray.push(`\nAdditional Context: ${analysis.additionalNotes}`);
        
        document.getElementById('notes').value = notesArray.join('\n');
    }
}
