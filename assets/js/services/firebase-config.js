// Wait for Firebase SDK to load
async function initFirebase() {
    try {
        // Fetch Firebase configuration from Netlify function
        const response = await fetch('/.netlify/functions/getFirebaseConfig');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Firebase config: ${response.status} ${response.statusText}`);
        }
        
        const firebaseConfig = await response.json();
        
        // Initialize Firebase if not already initialized
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        // Signal that Firebase is ready
        window.dispatchEvent(new Event('firebaseLoaded'));
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        // Attempt to show user-friendly error message
        if (typeof showToast === 'function') {
            showToast('Failed to initialize Firebase. Please reload the page.', 'error');
        } else {
            alert('Failed to initialize Firebase. Please reload the page.');
        }
    }
}

// Initialize when the SDK is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}
