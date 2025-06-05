// Wait for Firebase SDK to load
function initFirebase() {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDJRYvkh4ejfXHiYvTYcrcTMjA8awrnZzQ",
        authDomain: "mealmatrix-ac32a.firebaseapp.com",
        projectId: "mealmatrix-ac32a",
        databaseURL: "https://mealmatrix-ac32a-default-rtdb.firebaseio.com",
        messagingSenderId: "347054902442",
        appId: "1:347054902442:web:c83ed92e399e3f19c414d3"
    };

    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

    // Signal that Firebase is ready
    window.dispatchEvent(new Event('firebaseLoaded'));
}

// Initialize when the SDK is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}
