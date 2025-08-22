// Firebase config and initialization for mobile version
const mobileFirebaseConfig = {
    apiKey: "AIzaSyDJRYvkh4ejfXHiYvTYcrcTMjA8awrnZzQ",
    authDomain: "mealmatrix-ac32a.firebaseapp.com",
    databaseURL: "https://mealmatrix-ac32a-default-rtdb.firebaseio.com",
    projectId: "mealmatrix-ac32a",
    storageBucket: "mealmatrix-ac32a.firebasestorage.app",
    messagingSenderId: "347054902442",
    appId: "1:347054902442:web:c83ed92e399e3f19c414d3",
    measurementId: "G-CN77EGX47T"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(mobileFirebaseConfig);
}
window.dispatchEvent(new Event('firebaseLoaded'));
