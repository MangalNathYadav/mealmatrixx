// Create and export UI helper class
class AIUIHelper {
    constructor() {
        this.setupUI();
    }

    setupUI() {
        // Add loading overlay to body if it doesn't exist
        if (!document.getElementById('ai-loading-overlay')) {
            // Create backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop';
            document.body.appendChild(backdrop);

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'ai-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p id="loading-message">Analyzing your meal...</p>
                    <p id="retry-message" class="retry-message"></p>
                    <p id="retry-count" class="retry-count"></p>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        // Add styles if not already present
        if (!document.getElementById('ai-ui-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ai-ui-styles';
            styles.textContent = `                #ai-loading-overlay {
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 1000;
                }

                #ai-loading-overlay.visible {
                    display: block;
                }

                .loading-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    padding: 2rem;
                    text-align: center;
                    color: #333;
                    max-width: 400px;
                    margin: auto;
                    position: relative;
                }

                .modal-backdrop {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    z-index: 999;
                }

                .modal-backdrop.visible {
                    display: block;
                }                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #f0f0f0;
                    border-top: 3px solid var(--primary-color, #3498db);
                    border-radius: 50%;
                    margin: 0 auto 1rem;
                    animation: spin 1s linear infinite;
                }

                .retry-message {
                    color: #e67e22;
                    margin-top: 1rem;
                    font-size: 0.9rem;
                    padding: 0.5rem;
                    background: #fff8e1;
                    border-radius: 6px;
                }

                .retry-count {
                    font-size: 0.8rem;
                    color: #666;
                    margin-top: 0.5rem;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .ai-result {
                    background: white;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-top: 1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .nutrition-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 1rem;
                    margin: 1rem 0;
                }

                .nutrition-item {
                    padding: 1rem;
                    border-radius: 6px;
                    text-align: center;
                }

                .nutrition-item.high { background: #e3fcec; color: #0a3622; }
                .nutrition-item.medium { background: #fff8e6; color: #664d03; }
                .nutrition-item.low { background: #fee2e2; color: #7f1d1d; }

                .analysis-section {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #eee;
                }

                .analysis-section:last-child {
                    border-bottom: none;
                }

                .analysis-metadata {
                    margin-top: 1rem;
                    font-size: 0.85rem;
                    color: #666;
                }

                .analysis-metadata details {
                    background: #f8f9fa;
                    border-radius: 6px;
                    padding: 0.5rem;
                }

                .analysis-metadata summary {
                    cursor: pointer;
                    user-select: none;
                    color: #555;
                }

                .metadata-content {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: white;
                    border-radius: 4px;
                }

                .metadata-content p {
                    margin: 0.25rem 0;
                    font-family: monospace;
                }
            `;
            document.head.appendChild(styles);
        }
    }
      showLoading(message = 'Analyzing your meal...') {
        const overlay = document.getElementById('ai-loading-overlay');
        const backdrop = document.querySelector('.modal-backdrop');
        const loadingMsg = document.getElementById('loading-message');
        const retryMsg = document.getElementById('retry-message');
        const retryCount = document.getElementById('retry-count');
        
        loadingMsg.textContent = message;
        retryMsg.textContent = '';
        retryCount.textContent = '';
        overlay.classList.add('visible');
        backdrop.classList.add('visible');
    }

    hideLoading() {
        const overlay = document.getElementById('ai-loading-overlay');
        const backdrop = document.querySelector('.modal-backdrop');
        overlay.classList.remove('visible');
        backdrop.classList.remove('visible');
    }    showRetrying(seconds, currentRetry = 1, maxRetries = 10) {
        const retryMsg = document.getElementById('retry-message');
        const retryCount = document.getElementById('retry-count');
        retryMsg.textContent = `Service busy. Retrying in ${seconds} seconds...`;
        retryCount.textContent = `Attempt ${currentRetry} of ${maxRetries}`;
        
        const countDown = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                retryMsg.textContent = `Service busy. Retrying in ${seconds} seconds...`;
            } else {
                clearInterval(countDown);
            }
        }, 1000);

        return countDown;
    }    // Helper method to render metadata
    _renderMetadata(meta) {
        if (!meta) return '';
        return `
            <div class="analysis-metadata">
                <details>
                    <summary>Response Info</summary>
                    <div class="metadata-content">
                        <p>Model: ${meta.model}</p>
                        <p>Version: ${meta.version}</p>
                        <p>Time: ${new Date(meta.timestamp).toLocaleString()}</p>
                        ${meta.attempts > 1 ? `<p>Attempts: ${meta.attempts}</p>` : ''}
                    </div>
                </details>
            </div>
        `;
    }

    displayAnalysis(result, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !result) return;

        // Handle text-only responses
        if (result._meta?.format === 'text') {
            container.innerHTML = `
                <div class="ai-result">
                    <div class="analysis-section">
                        <p>${result.text}</p>
                    </div>
                    ${this._renderMetadata(result._meta)}
                </div>
            `;
            container.classList.add('visible');
            return;
        }

        // Ensure all required properties exist with defaults
        const safeResult = {
            foods: result.foods || [],
            calories: result.calories ? {
                total: result.calories.total || 0,
                breakdown: result.calories.breakdown || {}
            } : {
                total: 0,
                breakdown: {}
            },
            nutrition: result.nutrition || {
                protein: 'unknown',
                carbs: 'unknown',
                fats: 'unknown',
                fiber: 'unknown'
            },
            assessment: result.assessment || 'No assessment available',
            suggestion: result.suggestion || 'No suggestions available',
            alternatives: result.alternatives || [],
            _meta: result._meta || {
                version: '1.0',
                timestamp: new Date().toISOString()
            }
        };

        container.innerHTML = `
            <div class="ai-result">
                <div class="analysis-section">
                    <h3>Foods Analyzed</h3>
                    ${safeResult.foods.length > 0 ? `
                        <ul>
                            ${safeResult.foods.map(food => `<li>${food}</li>`).join('')}
                        </ul>
                    ` : '<p>No foods specified</p>'}
                </div>

                <div class="analysis-section">
                    <h3>Calories</h3>
                    <p class="total-calories">Total: ${safeResult.calories.total} calories</p>
                    ${Object.keys(safeResult.calories.breakdown).length > 0 ? `
                        <ul>
                            ${Object.entries(safeResult.calories.breakdown)
                                .map(([food, cals]) => `<li>${food}: ${cals} calories</li>`)
                                .join('')}
                        </ul>
                    ` : '<p>No calorie breakdown available</p>'}
                </div>

                <div class="analysis-section">
                    <h3>Nutritional Profile</h3>
                    <div class="nutrition-grid">
                        ${Object.entries(safeResult.nutrition)
                            .map(([nutrient, level]) => `
                                <div class="nutrition-item ${level.toLowerCase()}">
                                    <strong>${nutrient}</strong>
                                    <br>
                                    ${level}
                                </div>`)
                            .join('')}
                    </div>
                </div>

                <div class="analysis-section">
                    <h3>Assessment</h3>
                    <p>${safeResult.assessment}</p>
                </div>

                <div class="analysis-section">
                    <h3>Suggestions for Improvement</h3>
                    <p>${safeResult.suggestion}</p>
                </div>

                ${safeResult.alternatives.length > 0 ? `
                    <div class="analysis-section">
                        <h3>Healthier Alternatives</h3>
                        <ul>
                            ${safeResult.alternatives.map(alt => `<li>${alt}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${this._renderMetadata(safeResult._meta)}
            </div>
        `;
        container.classList.add('visible');
    }
}

// Create and export a single instance
const aiUI = new AIUIHelper();
export default aiUI;
