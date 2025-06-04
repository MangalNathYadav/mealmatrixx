// User Profile Management
const profileForm = document.getElementById('profileForm');
const successMessage = document.getElementById('successMessage');
let currentPhotoData = null;

// Check if user is logged in
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadUserProfile();
    }
});

// Load existing profile data
async function loadUserProfile() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    try {
        const profileRef = firebase.database().ref(`users/${user.uid}/profile`);
        const snapshot = await profileRef.once('value');
        const profile = snapshot.val();

        if (profile) {
            document.getElementById('fullName').value = profile.fullName || '';
            document.getElementById('dob').value = profile.dob || '';
            document.getElementById('gender').value = profile.gender || '';
            document.getElementById('height').value = profile.height || '';
            document.getElementById('weight').value = profile.weight || '';
            document.getElementById('dietType').value = profile.dietType || 'none';
            document.getElementById('foodPreferences').value = profile.foodPreferences || '';
            document.getElementById('allergies').value = profile.allergies || '';
            document.getElementById('restrictions').value = profile.restrictions || '';
            document.getElementById('healthConditions').value = profile.healthConditions || '';

            // Load profile photo from base64 data
            if (profile.photo && profilePhoto) {
                profilePhoto.src = profile.photo;
                profilePhoto.style.display = 'block';
                currentPhotoData = profile.photo;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile', 'error');
    }
}

// Save profile data
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('Please log in to save your profile', 'error');
        return;
    }

    const profileData = {
        fullName: document.getElementById('fullName').value,
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        height: parseFloat(document.getElementById('height').value) || null,
        weight: parseFloat(document.getElementById('weight').value) || null,
        dietType: document.getElementById('dietType').value,
        foodPreferences: document.getElementById('foodPreferences').value,
        allergies: document.getElementById('allergies').value,
        restrictions: document.getElementById('restrictions').value,
        healthConditions: document.getElementById('healthConditions').value,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    // Add photo data if available
    if (currentPhotoData) {
        profileData.photo = currentPhotoData;
    }

    try {
        await firebase.database().ref(`users/${user.uid}/profile`).update(profileData);
        successMessage.classList.add('visible');
        setTimeout(() => {
            successMessage.classList.remove('visible');
        }, 3000);
        showToast('Profile saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Failed to save profile', 'error');
    }
});

// Handle profile photo upload
const photoUpload = document.getElementById('photoUpload');
const profilePhoto = document.getElementById('profilePhoto');

photoUpload?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
    }

    try {
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async function(event) {
            const base64Data = event.target.result;

            // Check if the base64 string is too large (max 10MB for RTDB)
            if (base64Data.length > 10 * 1024 * 1024) {
                showToast('Image is too large after encoding. Please choose a smaller image.', 'error');
                return;
            }

            // Update preview
            profilePhoto.src = base64Data;
            profilePhoto.style.display = 'block';

            // Store for saving later
            currentPhotoData = base64Data;

            showToast('Photo ready to be saved', 'success');
        };
        reader.onerror = () => {
            showToast('Failed to process image', 'error');
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error processing photo:', error);
        showToast('Failed to process photo', 'error');
    }
});

// Toast notification helper
function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
