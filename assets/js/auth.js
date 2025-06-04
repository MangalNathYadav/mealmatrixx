// Auth state management
let currentUser = null;
let authInitialized = false;

// Toast notification function
function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize auth when Firebase is ready
window.addEventListener('firebaseLoaded', () => {
    if (!authInitialized) {
        initializeAuth();
    }
});

// Initialize auth
function initializeAuth() {
    authInitialized = true;
    firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        // If on login/register page, redirect to dashboard
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        currentUser = null;
        // If on protected pages, redirect to login
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html') &&
            !window.location.pathname.includes('index.html')) {
            window.location.href = 'login.html';
        }
    }
    });
}

// Login form handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            showToast('Login successful!', 'success');
        } catch (error) {
            showToast(error.message);
        }
    });
}
