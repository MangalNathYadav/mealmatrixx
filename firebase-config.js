async function initFirebase() {
    const tried = [];
    async function attempt(url) {
        tried.push(url);
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON in config response'); }
        return json;
    }
    let config = null;
    const candidates = [
        '/.netlify/functions/getFirebaseConfig',
        './.netlify/functions/getFirebaseConfig',
        'netlify/functions/getFirebaseConfig'
    ];
    for (const u of candidates) {
        try {
            config = await attempt(u);
            break;
        } catch (e) {
            // continue
        }
    }
    if (!config) {
        console.warn('Falling back to hardcoded Firebase config placeholder. Replace with real values. Tried:', tried);
        config = {
            apiKey: "AIzaSyDJRYvkh4ejfXHiYvTYcrcTMjA8awrnZzQ",
  authDomain: "mealmatrix-ac32a.firebaseapp.com",
  databaseURL: "https://mealmatrix-ac32a-default-rtdb.firebaseio.com",
  projectId: "mealmatrix-ac32a",
  storageBucket: "mealmatrix-ac32a.firebasestorage.app",
  messagingSenderId: "347054902442",
  appId: "1:347054902442:web:c83ed92e399e3f19c414d3",
  measurementId: "G-CN77EGX47T"
        };
    }
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        window.dispatchEvent(new Event('firebaseLoaded'));
    } catch (err) {
        console.error('Firebase init failed:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}
