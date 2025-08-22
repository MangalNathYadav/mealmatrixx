// Advanced Features module for mobile app
// Ensure initialization in non-SPA mode
if (!document.getElementById('mainContent')) {
    document.addEventListener('DOMContentLoaded', () => {
        initializeAdvancedFeatures();
    });
}
import { showToast, showLoading, hideLoading } from './app.js';
import { getCurrentUser } from './auth.js';
import GeminiClient from './gemini-client.mobile.js';

export default function initializeAdvancedFeatures() {
    const analyzeMealBtn = document.getElementById('analyzeMealBtn');
    const getTipsBtn = document.getElementById('getTipsBtn');
    const mealPlanningBtn = document.getElementById('mealPlanningBtn');

    if (analyzeMealBtn) {
        analyzeMealBtn.addEventListener('click', handleMealAnalysis);
    }
    if (getTipsBtn) {
        getTipsBtn.addEventListener('click', handleGetTips);
    }
    if (mealPlanningBtn) {
        mealPlanningBtn.addEventListener('click', handleMealPlanning);
    }
}

// Handle meal analysis button click
async function handleMealAnalysis() {
    const mealInput = document.getElementById('mealAnalysisInput');
    const resultContainer = document.getElementById('mealAnalysisResult');
    const analyzeBtn = document.getElementById('analyzeMealBtn');
    
    if (!mealInput || !resultContainer) return;
    
    const mealDescription = mealInput.value.trim();
    
    if (!mealDescription) {
        showToast('Please enter a meal description', 'error');
        return;
    }
    
    try {
        // Disable button and show loading state
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = `<div class="btn-spinner"></div> Analyzing...`;
        
        // Show the result container with loading indicator
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `<div class="loading-indicator"><div class="loading-spinner"></div><p>Analyzing meal...</p></div>`;
        
        // Use the Gemini client to analyze the meal
        const client = new GeminiClient();
        const prompt = `Analyze this meal: "${mealDescription}". Return a JSON object with calories, protein, carbs, fat, and notes.`;
        
        const result = await client.generateContent(prompt);
        let analysisResult;
        
        console.log('Gemini raw response:', result.text);
        analysisResult = safeParseJSON(result.text, {
            calories: '350-450', 
            protein: '15-25', 
            carbs: '30-40', 
            fat: '15-25', 
            notes: [result.text] 
        });
        console.log('Parsed analysisResult:', analysisResult);

        // Ensure notes is always an array for rendering
        let notesArr = [];
        if (Array.isArray(analysisResult.notes)) {
            notesArr = analysisResult.notes;
        } else if (typeof analysisResult.notes === 'string' && analysisResult.notes.length > 0) {
            notesArr = [analysisResult.notes];
        } else if (analysisResult.notes && typeof analysisResult.notes === 'object') {
            // If notes is an object, convert to string
            notesArr = [JSON.stringify(analysisResult.notes)];
        }

        let resultHtml;
        if (!analysisResult || !analysisResult.calories) {
            resultHtml = `<div class="error-message"><p>Sorry, the AI could not analyze your meal. Please try again or rephrase your description.<br><br><b>Raw response:</b><br><pre>${result.text}</pre></p></div>`;
        } else {
            resultHtml = `
                <div class="analysis-result">
                    <div class="nutrition-data">
                        <div class="nutrition-item">
                            <span class="nutrition-label">Calories</span>
                            <span class="nutrition-value">${analysisResult.calories} kcal</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Protein</span>
                            <span class="nutrition-value">${analysisResult.protein}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Carbs</span>
                            <span class="nutrition-value">${analysisResult.carbs}g</span>
                        </div>
                        <div class="nutrition-item">
                            <span class="nutrition-label">Fat</span>
                            <span class="nutrition-value">${analysisResult.fat}g</span>
                        </div>
                    </div>
                    <div class="analysis-notes">
                        <h5>Key Nutrition Facts:</h5>
                        <ul>
                            ${notesArr.map(note => `<li>${note}</li>`).join('')}
                        </ul>
                    </div>
                    <button id="addAnalyzedMealBtn" class="btn btn-primary mt-3">Add to My Meals</button>
                </div>
            `;
        }
        
    console.log('Meal Analyzer resultHtml:', resultHtml);
    showAIPopup(resultHtml, 'Meal Analysis Results');
        
        setTimeout(() => {
            const addMealBtn = document.getElementById('addAnalyzedMealBtn');
            if (addMealBtn) {
                addMealBtn.addEventListener('click', () => {
                    sessionStorage.setItem('analyzedMeal', JSON.stringify({ 
                        description: mealDescription, 
                        ...analysisResult 
                    }));
                    closeAIPopup();
                    window.location.href = 'add-meal.html';
                });
            }
        }, 100);
        
        resultContainer.innerHTML = ''; // Clear loading indicator
        resultContainer.style.display = 'none';
        
        // Restore button state
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `<i class="fas fa-robot"></i> Analyze Meal`;
    } catch (error) {
        console.error('Error analyzing meal:', error);
        resultContainer.innerHTML = '';
        resultContainer.style.display = 'none';
        
        // Restore button state
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `<i class="fas fa-robot"></i> Analyze Meal`;
        
        showAIPopup(`<div class="error-message"><p>Failed to analyze meal. Please try again.</p></div>`, 'Error');
    }
}

// Helper function to format calories and macros
function formatNutrientValue(value) {
    if (!value) return '0';
    if (typeof value === 'number') return value.toString();
    return value;
}

// Handle get tips button click
async function handleGetTips() {
    const resultContainer = document.getElementById('nutritionTipsResult');
    const tipsBtn = document.getElementById('getTipsBtn');
    if (!resultContainer) return;
    
    const user = getCurrentUser();
    if (!user) {
        showToast('You must be logged in to get personalized tips', 'error');
        return;
    }
    
    try {
        // Disable button and show loading state
        tipsBtn.disabled = true;
        tipsBtn.innerHTML = `<div class="btn-spinner"></div> Generating...`;
        
        // Show the result container with loading indicator
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `<div class="loading-indicator"><div class="loading-spinner"></div><p>Generating personalized tips...</p></div>`;
        
        // Use Gemini client to generate personalized tips
        const client = new GeminiClient();
        const prompt = `Generate 3 personalized nutrition tips for the user. Return a JSON array of tips, each with title, description, and icon (use FontAwesome icon names like fa-drumstick-bite, fa-glass-water, fa-wheat-awn, etc.).`;
        
        const result = await client.generateContent(prompt);
        let tips;
        
        try {
            // Try to parse JSON response
                tips = safeParseJSON(result.text, [
                    { 
                        title: "Nutrition Tip", 
                        description: result.text, 
                        icon: "fa-lightbulb" 
                    }
                ]);
        } catch (e) {
            console.warn('Failed to parse JSON response from Gemini, using default structure', e);
                // Already handled by safeParseJSON fallback
        }
        
        const tipsHtml = `
            <div class="tips-container">
                ${tips.map((tip, index) => `
                    <div class="tip-card" style="animation-delay: ${index * 150}ms">
                        <div class="tip-icon">
                            <i class="fas ${tip.icon || 'fa-lightbulb'}"></i>
                        </div>
                        <div class="tip-content">
                            <h5>${tip.title}</h5>
                            <p>${tip.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        showAIPopup(tipsHtml, 'Personalized Nutrition Tips');
        resultContainer.innerHTML = ''; // Clear loading indicator
        resultContainer.style.display = 'none';
        
        // Restore button state
        tipsBtn.disabled = false;
        tipsBtn.innerHTML = `<i class="fas fa-robot"></i> Get Personalized Tips`;
    } catch (error) {
        console.error('Error getting nutrition tips:', error);
        resultContainer.innerHTML = '';
        resultContainer.style.display = 'none';
        
        // Restore button state
        tipsBtn.disabled = false;
        tipsBtn.innerHTML = `<i class="fas fa-robot"></i> Get Personalized Tips`;
        
        showAIPopup(`<div class="error-message"><p>Failed to generate personalized tips. Please try again.</p></div>`, 'Error');
    }
}

// Helper function to map common meal types to icons
function getMealTypeIcon(mealType) {
    const mealTypeIcons = {
        'breakfast': 'fa-coffee',
        'lunch': 'fa-utensils',
        'dinner': 'fa-bowl-food',
        'snack': 'fa-apple-whole',
        'dessert': 'fa-ice-cream'
    };
    
    const type = mealType.toLowerCase();
    return mealTypeIcons[type] || 'fa-plate-wheat';
}
// Handle meal planning button click
async function handleMealPlanning() {
    const resultContainer = document.getElementById('mealPlanningResult');
    const planningBtn = document.getElementById('mealPlanningBtn');
    if (!resultContainer) return;
    
    const user = getCurrentUser();
    if (!user) {
        showToast('You must be logged in to use meal planning', 'error');
        return;
    }
    
    try {
        // Disable button and show loading state
        planningBtn.disabled = true;
        planningBtn.innerHTML = `<div class="btn-spinner"></div> Planning...`;
        
        // Show the result container with loading indicator
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `<div class="loading-indicator"><div class="loading-spinner"></div><p>Creating your personalized meal plan...</p></div>`;
        
        // Use Gemini client to generate personalized meal plan
        const client = new GeminiClient();
        const prompt = `Create a 3-day healthy meal plan. Return a JSON object with the structure: 
        {
            "days": [
                {
                    "day": 1,
                    "meals": [
                        {
                            "type": "Breakfast",
                            "foods": ["food1", "food2"],
                            "nutrition": "nutrition facts"
                        },
                        ...
                    ]
                },
                ...
            ]
        }`;
        
        const result = await client.generateContent(prompt);
        let mealPlan;
        
        mealPlan = safeParseJSON(result.text, {
            days: [
                {
                    day: 1,
                    meals: [
                        {
                            type: "Meals",
                            foods: [result.text],
                            nutrition: "Please see a nutritionist for detailed information"
                        }
                    ]
                }
            ]
        });
        
        const mealPlanHtml = `
            <div class="meal-plans-container">
                <div class="meal-plan-header">
                    <h4>Your 3-Day Balanced Meal Plan</h4>
                    <p class="meal-plan-intro">Based on your nutritional goals and preferences</p>
                </div>
                
                ${mealPlan.days.map((day, dayIndex) => `
                    <div class="meal-plan-day">
                        <h5 class="day-title">Day ${day.day}</h5>
                        
                        ${day.meals.map(meal => `
                            <div class="meal-plan-card">
                                <h5>${meal.type}</h5>
                                <ul>
                                    ${meal.foods.map(food => `<li>${food}</li>`).join('')}
                                </ul>
                                <div class="meal-nutrition">${meal.nutrition}</div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
        
        showAIPopup(mealPlanHtml, 'Your Personalized Meal Plan');
        resultContainer.innerHTML = ''; // Clear loading indicator
        resultContainer.style.display = 'none';
        
        // Restore button state
        planningBtn.disabled = false;
        planningBtn.innerHTML = `<i class="fas fa-robot"></i> Plan My Meals`;
    } catch (error) {
        console.error('Error planning meals:', error);
        resultContainer.innerHTML = '';
        resultContainer.style.display = 'none';
        
        // Restore button state
        planningBtn.disabled = false;
        planningBtn.innerHTML = `<i class="fas fa-robot"></i> Plan My Meals`;
        
        showAIPopup(`<div class="error-message"><p>Failed to generate meal plan. Please try again.</p></div>`, 'Error');
    }
}

// Helper function to safely parse JSON from AI response
function safeParseJSON(text, defaultValue) {
    try {
        // First try to extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);
        }
        
        // Otherwise try to parse the whole text as JSON
        return JSON.parse(text);
    } catch (e) {
        console.warn('Failed to parse JSON:', e);
        return defaultValue;
    }
}

// Popup card for AI responses
function showAIPopup(contentHtml, title = 'AI Results') {
    console.log('Showing AI popup with title:', title);
    let popup = document.getElementById('aiResponsePopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'aiResponsePopup';
        popup.className = 'ai-popup-overlay';
        popup.innerHTML = `
            <div class="ai-popup-card">
                <div class="ai-popup-header">
                    <h3 class="ai-popup-title"></h3>
                    <button class="ai-popup-close">&times;</button>
                </div>
                <div class="ai-popup-content"></div>
            </div>
        `;
        document.body.appendChild(popup);
        popup.querySelector('.ai-popup-close').addEventListener('click', closeAIPopup);
        
        // Add escape key listener to close popup
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popup.style.display === 'flex') {
                closeAIPopup();
            }
        });
        
        // Add click outside to close
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closeAIPopup();
            }
        });
    }
    
    // Set title and content, ensure content is visible
    popup.querySelector('.ai-popup-title').textContent = title;
    
    const contentContainer = popup.querySelector('.ai-popup-content');
    contentContainer.innerHTML = contentHtml;
    contentContainer.style.display = 'block';  // Ensure content is visible
    
    // Make sure popup is visible and correctly positioned
    popup.style.display = 'flex';
    popup.style.opacity = '1';
    popup.style.visibility = 'visible';
    document.body.classList.add('no-scroll');
}

function closeAIPopup() {
    const popup = document.getElementById('aiResponsePopup');
    if (popup) {
        popup.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }
}

// Add popup styles
if (!document.getElementById('aiPopupStyles')) {
    const style = document.createElement('style');
    style.id = 'aiPopupStyles';
    style.textContent = `
        .ai-popup-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.95), rgba(109, 40, 217, 0.9));
            display: none;
            align-items: flex-start;
            justify-content: center;
            z-index: 9999;
            overflow-y: auto;
        }
        
        .ai-popup-card {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 100%;
            height: 100%;
            min-height: 100vh;
            position: relative;
            animation: slideUp 0.4s ease;
            display: flex;
            flex-direction: column;
        }
        
        .ai-popup-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            position: sticky;
            top: 0;
            background: #fff;
            border-radius: 16px 16px 0 0;
            z-index: 1;
        }
        
        .ai-popup-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--primary-color);
            margin: 0;
        }
        
        .ai-popup-close {
            background: none;
            border: none;
            font-size: 1.75rem;
            color: var(--gray-500);
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .ai-popup-close:hover {
            background: var(--gray-100);
            color: var(--gray-800);
        }
        
        .ai-popup-content {
            padding: 20px;
            overflow-y: auto;
            flex: 1;
            display: block;
            background-color: #fff;
            color: var(--gray-900);
            z-index: 9999;
        }
        
        /* Animation for popup */
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        /* Fix for analysis result display inside popup */
        .ai-popup-content .analysis-result {
            display: block !important;
            background: #fff;
            animation: none;
        }
        
        /* Disable body scrolling when popup is active */
        body.no-scroll {
            overflow: hidden;
        }
        
        /* Nutrition data styling */
        .nutrition-data {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
            background: var(--gray-50);
            border-radius: 12px;
            padding: 16px;
        }
        
        .nutrition-item {
            display: flex;
            flex-direction: column;
            background: white;
            border-radius: 10px;
            padding: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            border-left: 4px solid var(--primary-color);
        }
        
        .nutrition-label {
            font-size: 0.875rem;
            color: var(--gray-600);
            font-weight: 500;
        }
        
        .nutrition-value {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--gray-900);
        }
        
        /* Tips container styling */
        .tips-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .tip-card {
            display: flex;
            gap: 14px;
            background: #fff;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-left: 4px solid var(--secondary-color);
            animation: fadeInRight 0.4s ease forwards;
            opacity: 0;
        }
        
        .tip-icon {
            width: 40px;
            height: 40px;
            background: var(--secondary-color);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            flex-shrink: 0;
        }
        
        .tip-content {
            flex: 1;
        }
        
        .tip-content h5 {
            margin: 0 0 6px 0;
            font-weight: 600;
        }
        
        .tip-content p {
            margin: 0;
            color: var(--gray-700);
            font-size: 0.9375rem;
        }
        
        /* Meal plan container */
        .meal-plans-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .meal-plan-card {
            background: #fff;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 3px 12px rgba(0,0,0,0.08);
            border-left: 4px solid var(--accent-color);
        }
        
        .meal-plan-card h5 {
            margin: 0 0 10px 0;
            color: var(--accent-color);
            font-weight: 600;
            font-size: 1.125rem;
        }
        
        .meal-plan-card ul {
            margin: 0 0 12px 0;
            padding: 0 0 0 20px;
        }
        
        .meal-plan-card li {
            margin-bottom: 8px;
            color: var(--gray-800);
        }
        
        .meal-nutrition {
            font-size: 0.875rem;
            color: var(--gray-600);
            font-style: italic;
            border-top: 1px solid var(--gray-200);
            padding-top: 10px;
            margin-top: 10px;
        }
        
        /* Loading indicator */
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 30px;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(124, 58, 237, 0.3);
            border-radius: 50%;
            border-top-color: var(--primary-color);
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        /* Button spinner for loading state */
        .btn-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
        }
        
        /* Disabled button styling */
        button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        /* New meal plan styling */
        .meal-plan-header {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .meal-plan-header h4 {
            color: var(--primary-color);
            font-size: 1.25rem;
            margin-bottom: 8px;
        }
        
        .meal-plan-intro {
            color: var(--gray-600);
            font-size: 0.9375rem;
        }
        
        .meal-plan-day {
            margin-bottom: 30px;
        }
        
        .day-title {
            background: var(--gradient-primary);
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-weight: 600;
            text-align: center;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
        }
        
        /* Error message styling */
        .error-message {
            background: #FEF2F2;
            border-left: 4px solid var(--error);
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
            color: #B91C1C;
            font-weight: 500;
        }
        
        /* Add button styling for consistency */
        .btn-primary {
            background: var(--gradient-primary);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
        }
        
        .btn-primary:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
        }
        
        .mt-2 {
            margin-top: 0.5rem;
        }
        
        .mt-3 {
            margin-top: 1rem;
        }
    `;
    document.head.appendChild(style);
}

// Common nutrition icons mapping
const nutritionIcons = {
    protein: "fa-drumstick-bite",
    water: "fa-glass-water",
    fiber: "fa-wheat-awn",
    mindful: "fa-brain",
    timing: "fa-clock",
    balance: "fa-scale-balanced",
    vegetables: "fa-carrot",
    fruits: "fa-apple-whole",
    sugar: "fa-cookie-slash",
    fats: "fa-oil-can"
};
