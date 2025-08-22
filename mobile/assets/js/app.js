// Main app.js - Handles mobile navigation and page routing
let currentPage = '';
let isAuthenticated = false;
// Detect if this page is using the old SPA-with-templates architecture
const HAS_SPA_ROOT = !!document.getElementById('mainContent');

// Only bind SPA init if the container exists (prevents errors on multi-page screens)
if (HAS_SPA_ROOT) {
    window.addEventListener('firebaseLoaded', () => {
        initializeApp();
    });
}

// Initialize the app
function initializeApp() {
    if (!HAS_SPA_ROOT) return; // Safety guard
    // Check auth state
    firebase.auth().onAuthStateChanged(user => {
        isAuthenticated = !!user;
        
        // Update username if user is logged in
        if (user) {
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = user.displayName || user.email;
            }
            handleNavigation();
        } else {
            navigateToPage('login');
        }
    });
    
    // Set up navigation
    setupBottomNavigation();
    setupFormSwitching();
    
    // Handle URL hash changes
    window.addEventListener('hashchange', handleNavigation);
    
    // Initial navigation based on URL hash
    handleNavigation();
}

// Set up bottom navigation
function setupBottomNavigation() {
    if (!HAS_SPA_ROOT) return; // In multi-page mode we let normal links work
    const navItems = document.querySelectorAll('.bottom-nav-item[data-page]');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Only allow navigation if authenticated (except for login/register)
            const page = item.getAttribute('data-page');
            if (!isAuthenticated && page !== 'login' && page !== 'register') {
                navigateToPage('login');
                return;
            }
            
            // Update active state
            navItems.forEach(navItem => navItem.classList.remove('active'));
            item.classList.add('active');
            
            // Navigate to page
            navigateToPage(page);
        });
    });
}

// Setup form switching (login/register)
function setupFormSwitching() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('switch-form')) {
            e.preventDefault();
            const formType = e.target.getAttribute('data-form');
            navigateToPage(formType);
        }
    });
}

// Handle navigation based on URL hash
function handleNavigation() {
    if (!HAS_SPA_ROOT) return; // Not in SPA mode
    let hash = window.location.hash.substring(1) || 'dashboard';
    
    // If not authenticated and trying to access a protected page
    if (!isAuthenticated && hash !== 'login' && hash !== 'register') {
        navigateToPage('login');
        return;
    }
    
    navigateToPage(hash);
}

// Navigate to a specific page
function navigateToPage(page) {
    if (!HAS_SPA_ROOT) return; // Ignore in multi-page context
    // Don't reload the same page
    if (page === currentPage) return;
    
    // Update the URL hash without triggering hashchange event again
    const oldHash = window.location.hash;
    if (oldHash !== `#${page}`) {
        window.removeEventListener('hashchange', handleNavigation);
        window.location.hash = page;
        setTimeout(() => {
            window.addEventListener('hashchange', handleNavigation);
        }, 0);
    }
    
    currentPage = page;
    
    // Get main content container
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        console.warn('[SPA] #mainContent not found; skipping navigateToPage("' + page + '")');
        return;
    }
    
    // Get template for the page
    const template = document.getElementById(`${page}-template`);
    
    if (!template) {
        mainContent.innerHTML = '<div class="card"><h2>Page Not Found</h2><p>The requested page does not exist.</p></div>';
        return;
    }
    
    // Clear current content and add new content from template
    mainContent.innerHTML = '';
    const content = template.content.cloneNode(true);
    mainContent.appendChild(content);
    
    // Initialize page specific logic
    initializePage(page);
    
    // Update active navigation item
    updateActiveNavItem(page);
}

// Update active navigation item in bottom nav
function updateActiveNavItem(page) {
    if (!HAS_SPA_ROOT) return;
    const navItems = document.querySelectorAll('.bottom-nav-item[data-page]');
    
    navItems.forEach(item => {
        const itemPage = item.getAttribute('data-page');
        if (itemPage === page) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Initialize page specific logic
function initializePage(page) {
    switch (page) {
        case 'dashboard':
            initializeDashboard();
            break;
        case 'add-meal':
            initializeAddMeal();
            break;
        case 'nutrition-goals':
            initializeGoals();
            break;
        case 'advanced':
            initializeAdvancedFeatures();
            break;
        case 'profile':
            initializeProfile();
            break;
        case 'login':
            initializeLogin();
            break;
        case 'register':
            initializeRegister();
            break;
    }
}

// Page specific initializations
function initializeDashboard() {
    // Import dashboard.js module when needed
    import('./dashboard.js')
        .then(module => {
            module.default();
        })
        .catch(error => {
            console.error('Failed to load dashboard module:', error);
            showToast('Failed to load dashboard. Please try again.', 'error');
        });
}

function initializeAddMeal() {
    // Import addMeal.js module when needed
    import('./addMeal.js')
        .then(module => {
            module.default();
        })
        .catch(error => {
            console.error('Failed to load add meal module:', error);
            showToast('Failed to load add meal form. Please try again.', 'error');
        });
}

function initializeGoals() {
    // Import goals.js module when needed
    import('./goals.js')
        .then(module => {
            module.default();
        })
        .catch(error => {
            console.error('Failed to load goals module:', error);
            showToast('Failed to load nutrition goals. Please try again.', 'error');
        });
}

function initializeAdvancedFeatures() {
    // Import advanced-features.js module when needed
    import('./advanced-features.js')
        .then(module => {
            module.default();
        })
        .catch(error => {
            console.error('Failed to load advanced features module:', error);
            showToast('Failed to load AI features. Please try again.', 'error');
        });
}

function initializeProfile() {
    // Import profile.js module when needed
    import('./profile.js')
        .then(module => {
            module.default();
        })
        .catch(error => {
            console.error('Failed to load profile module:', error);
            showToast('Failed to load profile. Please try again.', 'error');
        });
}

function initializeLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            showLoading();
            await firebase.auth().signInWithEmailAndPassword(email, password);
            hideLoading();
            navigateToPage('dashboard');
        } catch (error) {
            hideLoading();
            console.error('Login error:', error);
            showToast(error.message || 'Failed to log in. Please try again.', 'error');
        }
    });
}

function initializeRegister() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validate password match
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        try {
            showLoading();
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update user profile
            await userCredential.user.updateProfile({
                displayName: name
            });
            
            // Create user profile in database
            await firebase.database().ref(`users/${userCredential.user.uid}`).set({
                displayName: name,
                email: email,
                createdAt: new Date().toISOString()
            });
            
            hideLoading();
            navigateToPage('dashboard');
        } catch (error) {
            hideLoading();
            console.error('Registration error:', error);
            showToast(error.message || 'Failed to register. Please try again.', 'error');
        }
    });
}

// Enhanced utility functions
function showToast(message, type = 'info', duration = 3000) {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add toast content
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default: // info
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300); // Wait for fade out animation
    }, duration);
}

function showLoading(message = 'Loading...') {
    // Check if loading overlay already exists
    let loadingOverlay = document.getElementById('loadingOverlay');
    
    if (!loadingOverlay) {
        // Create loading overlay
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.className = 'loading-overlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        const messageEl = document.createElement('div');
        messageEl.className = 'loading-message';
        messageEl.textContent = message;
        
        loadingOverlay.appendChild(spinner);
        loadingOverlay.appendChild(messageEl);
        document.body.appendChild(loadingOverlay);
    } else {
        // Update message if needed
        const messageEl = loadingOverlay.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        // Make sure it's visible
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        // Use fade-out animation
        loadingOverlay.classList.add('fade-out');
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            loadingOverlay.classList.remove('fade-out');
        }, 300);
    }
}

// Format date to a human-readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Export utility functions for use in other modules
export {
    showToast,
    showLoading,
    hideLoading,
    navigateToPage,
    formatDate
};
