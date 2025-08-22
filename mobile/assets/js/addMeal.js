// Add Meal module for mobile app
import { showToast, showLoading, hideLoading } from './app.js';
import { getCurrentUser } from './auth.js';

export default function initializeAddMeal() {
    const mealForm = document.getElementById('mealForm');
    const aiAssistBtn = document.getElementById('aiAssistBtn');
    
    if (!mealForm) return;
    
    // Set default date and time values
    setDefaultDateTimeValues();
    
    // Handle form submission
    mealForm.addEventListener('submit', handleMealSubmission);
    
    // Handle AI assist button
    if (aiAssistBtn) {
        aiAssistBtn.addEventListener('click', showAiAssistDialog);
    }
}

// Set default date and time values
function setDefaultDateTimeValues() {
    const dateInput = document.getElementById('mealDate');
    const timeInput = document.getElementById('mealTime');
    
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    if (timeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
}

// Handle meal form submission
async function handleMealSubmission(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showToast('You must be logged in to add meals', 'error');
        return;
    }
    
    // Get form values
    const mealName = document.getElementById('mealName').value;
    const mealDescription = document.getElementById('mealDescription').value;
    const calories = document.getElementById('calories').value;
    const protein = document.getElementById('protein').value;
    const carbs = document.getElementById('carbs').value;
    const fat = document.getElementById('fat').value;
    const mealDate = document.getElementById('mealDate').value;
    const mealTime = document.getElementById('mealTime').value;
    
    // Validate required fields
    if (!mealName || !calories || !mealDate || !mealTime) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Create meal object matching RTDB structure
    const meal = {
        calories: Number(calories),
        carbs: Number(carbs) || 0,
        dateTime: `${mealDate}T${mealTime}`,
        fat: Number(fat) || 0,
        name: mealName,
        notes: mealDescription || '',
        protein: Number(protein) || 0,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        showLoading();
        
        // Add meal to database
        const newMealRef = firebase.database().ref(`users/${user.uid}/meals`).push();
        await newMealRef.set(meal);
        
        hideLoading();
        showToast('Meal added successfully!', 'success');
        
        // Reset form
        document.getElementById('mealForm').reset();
        setDefaultDateTimeValues();
        
    } catch (error) {
        hideLoading();
        console.error('Error adding meal:', error);
        showToast('Failed to add meal. Please try again.', 'error');
    }
}

// Show AI assistant dialog
function showAiAssistDialog() {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.className = 'ai-dialog-overlay';
    
    // Create dialog content
    const dialog = document.createElement('div');
    dialog.className = 'ai-dialog';
    dialog.innerHTML = `
        <div class="ai-dialog-header">
            <h3>AI Meal Assistant</h3>
            <button class="close-btn">&times;</button>
        </div>
        <div class="ai-dialog-content">
            <p>Describe what you ate and the AI will help analyze it.</p>
            <textarea class="form-control" id="mealDescription" rows="4" placeholder="E.g., I had a grilled chicken sandwich with a side salad and a small apple"></textarea>
            <button class="btn mt-2" id="analyzeMealBtn">Analyze</button>
            <div id="analysisResult" class="mt-2"></div>
        </div>
        
        <style>
            .ai-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                padding: 1rem;
            }
            
            .ai-dialog {
                width: 100%;
                max-width: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                overflow: hidden;
            }
            
            .ai-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: var(--primary-color);
                color: white;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }
            
            .ai-dialog-content {
                padding: 1rem;
            }
            
            #analysisResult {
                background: rgba(147, 51, 234, 0.05);
                border-radius: 8px;
                padding: 1rem;
                display: none;
            }
        </style>
    `;
    
    // Add dialog to body
    document.body.appendChild(overlay);
    
    // Handle close button
    const closeBtn = dialog.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        overlay.remove();
    });
    
    // Handle analyze button
    const analyzeMealBtn = dialog.querySelector('#analyzeMealBtn');
    analyzeMealBtn.addEventListener('click', async () => {
        const description = dialog.querySelector('#mealDescription').value;
        if (!description) {
            showToast('Please enter a meal description', 'error');
            return;
        }
        
        // Show loading state
        analyzeMealBtn.disabled = true;
        analyzeMealBtn.textContent = 'Analyzing...';
        
        try {
            // In a real implementation, we would call an AI service here
            // For now, we'll just simulate a response after a delay
            await simulateAiAnalysis(description, dialog);
        } catch (error) {
            console.error('Error analyzing meal:', error);
            showToast('Failed to analyze meal. Please try again.', 'error');
        } finally {
            analyzeMealBtn.disabled = false;
            analyzeMealBtn.textContent = 'Analyze';
        }
    });
    
    // Add dialog to overlay
    overlay.appendChild(dialog);
}

// Simulate AI analysis (this would be replaced with a real AI service call)
async function simulateAiAnalysis(description, dialog) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a simple "analysis" based on keywords in the description
    const lowerDesc = description.toLowerCase();
    
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    
    // Very simplistic keyword matching (just for demo purposes)
    if (lowerDesc.includes('chicken')) {
        calories += 200;
        protein += 25;
        fat += 8;
    }
    
    if (lowerDesc.includes('beef') || lowerDesc.includes('steak')) {
        calories += 250;
        protein += 30;
        fat += 15;
    }
    
    if (lowerDesc.includes('rice')) {
        calories += 150;
        carbs += 35;
    }
    
    if (lowerDesc.includes('bread') || lowerDesc.includes('sandwich')) {
        calories += 120;
        carbs += 20;
    }
    
    if (lowerDesc.includes('salad')) {
        calories += 50;
        carbs += 5;
    }
    
    if (lowerDesc.includes('cheese')) {
        calories += 100;
        protein += 7;
        fat += 8;
    }
    
    if (lowerDesc.includes('apple')) {
        calories += 80;
        carbs += 20;
    }
    
    // Add some randomness to make it seem more realistic
    calories = Math.round(calories * (0.9 + Math.random() * 0.2));
    protein = Math.round(protein * (0.9 + Math.random() * 0.2));
    carbs = Math.round(carbs * (0.9 + Math.random() * 0.2));
    fat = Math.round(fat * (0.9 + Math.random() * 0.2));
    
    // If no matches found, generate some reasonable defaults
    if (calories === 0) {
        calories = Math.round(300 + Math.random() * 300);
        protein = Math.round(15 + Math.random() * 20);
        carbs = Math.round(30 + Math.random() * 30);
        fat = Math.round(10 + Math.random() * 10);
    }
    
    // Show the results
    const analysisResult = dialog.querySelector('#analysisResult');
    analysisResult.style.display = 'block';
    analysisResult.innerHTML = `
        <h4>Analysis Results:</h4>
        <p>Based on your description, here's an estimate:</p>
        <ul>
            <li><strong>Calories:</strong> ~${calories} kcal</li>
            <li><strong>Protein:</strong> ~${protein}g</li>
            <li><strong>Carbs:</strong> ~${carbs}g</li>
            <li><strong>Fat:</strong> ~${fat}g</li>
        </ul>
        <button class="btn btn-secondary mt-2" id="useValuesBtn">Use These Values</button>
    `;
    
    // Add event listener for using the values
    const useValuesBtn = analysisResult.querySelector('#useValuesBtn');
    useValuesBtn.addEventListener('click', () => {
        // Fill in the form with the AI-generated values
        document.getElementById('calories').value = calories;
        document.getElementById('protein').value = protein;
        document.getElementById('carbs').value = carbs;
        document.getElementById('fat').value = fat;
        
        // Extract meal name from description (first few words)
        const words = description.split(' ');
        const mealNameGuess = words.slice(0, Math.min(4, words.length)).join(' ');
        document.getElementById('mealName').value = mealNameGuess;
        document.getElementById('mealDescription').value = description;
        
        // Close the dialog
        dialog.parentElement.remove();
        
        showToast('Values applied to form', 'success');
    });
}
