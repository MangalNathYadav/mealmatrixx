// Auth module for mobile app
let currentUser = null;
let authInitialized = false;

// Initialize auth when Firebase is ready
window.addEventListener('firebaseLoaded', () => {
    if (!authInitialized) {
        initializeAuth();
    }
});

// Initialize auth
function initializeAuth() {
    authInitialized = true;
    // Ensure app is initialized; if not, retry shortly
    if (!firebase.apps || !firebase.apps.length) {
        authInitialized = false; // allow re-init
        setTimeout(checkFirebaseAndInit, 150);
        return;
    }

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            // Dispatch an auth state change event for other modules
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { user, isAuthenticated: true }
            }));
            // If we're on login/register redirect to dashboard
            const path = window.location.pathname.split('/').pop();
            if (path === 'login.html' || path === 'register.html' || path === 'index.html') {
                // Small delay so UI updates smoothly
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 150);
            }
        } else {
            currentUser = null;
            // Dispatch an auth state change event for other modules
            window.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: { user: null, isAuthenticated: false }
            }));
            
            // Redirect to login if not already there
            const currentHash = window.location.hash.substring(1);
            if (currentHash !== 'login' && currentHash !== 'register') {
                window.location.hash = 'login';
            }
        }
    });
    
    // (Removed redundant re-dispatch of firebaseLoaded to prevent loops)
}

// Check if firebase is loaded and initialize auth
function checkFirebaseAndInit() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        if (!authInitialized) initializeAuth();
    } else {
        setTimeout(checkFirebaseAndInit, 100);
    }
}

// Start checking for Firebase
checkFirebaseAndInit();

// Sign out function
function signOut() {
    return firebase.auth().signOut();
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!currentUser;
}

// Export auth functions for use in other modules
export {
    getCurrentUser,
    isAuthenticated,
    signOut
};
