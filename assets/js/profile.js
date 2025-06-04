// User Profile Management
const profileForm = document.getElementById('profileForm');
const successMessage = document.getElementById('successMessage');
let currentPhotoData = null;

// Create loading overlay
function createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p id="loadingMessage">Loading...</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

// Show/hide loading functions
function showLoading(message = 'Loading...') {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = createLoadingOverlay();
    }
    const messageEl = overlay.querySelector('#loadingMessage');
    if (messageEl) {
        messageEl.textContent = message;
    }
    overlay.classList.add('visible');
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

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
    showLoading('Loading your profile...');
    
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
    } finally {
        hideLoading();
    }
}

// Show success message function
function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.innerHTML = `<span>✨</span> ${message}`;
        successMessage.classList.add('visible');
        
        // Remove any existing timeout
        if (successMessage.timeout) {
            clearTimeout(successMessage.timeout);
        }
        
        // Set up the fade out animation after 3 seconds
        successMessage.timeout = setTimeout(() => {
            successMessage.style.animation = 'slideOutRight 0.3s ease forwards';
            
            // Remove the visible class and reset animation after slide out
            setTimeout(() => {
                successMessage.classList.remove('visible');
                successMessage.style.animation = '';
            }, 300);
        }, 3000);
    }
}

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

    showLoading('Processing photo...');

    try {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const base64Data = event.target.result;

            if (base64Data.length > 10 * 1024 * 1024) {
                showToast('Image is too large after encoding. Please choose a smaller image.', 'error');
                return;
            }

            profilePhoto.src = base64Data;
            profilePhoto.style.display = 'block';
            currentPhotoData = base64Data;
            
            showSuccessMessage('Photo updated! Click Save Profile to keep these changes');
        };
        reader.onerror = () => {
            showToast('Failed to process image', 'error');
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error processing photo:', error);
        showToast('Failed to process photo', 'error');
    } finally {
        hideLoading();
    }
});

// Save profile data
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = firebase.auth().currentUser;
    if (!user) {
        showToast('Please log in to save your profile', 'error');
        return;
    }

    showLoading('Saving your profile...');

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

    if (currentPhotoData) {
        profileData.photo = currentPhotoData;
    }

    try {
        await firebase.database().ref(`users/${user.uid}/profile`).update(profileData);
        showSuccessMessage('Your profile has been updated successfully!');
        showToast('Profile saved!', 'success');
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Failed to save profile', 'error');
    } finally {
        hideLoading();
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
