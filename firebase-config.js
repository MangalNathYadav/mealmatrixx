async function initFirebase() {
    try {
        const response = await fetch('/.netlify/functions/getFirebaseConfig');
        const firebaseConfig = await response.json();

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        window.dispatchEvent(new Event('firebaseLoaded'));
    } catch (err) {
        console.error('Failed to load Firebase config:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}
