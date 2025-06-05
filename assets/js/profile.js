// User Profile Management
const profileForm = document.getElementById('profileForm');
const successMessage = document.getElementById('successMessage');
const profilePhoto = document.getElementById('profilePhoto');
const photoUpload = document.getElementById('photoUpload');
let currentPhotoData = null;

// Validation constants
const VALIDATION_RULES = {
    height: { min: 50, max: 300 }, // cm
    weight: { min: 20, max: 500 }, // kg
    fullName: { minLength: 2, maxLength: 100 }
};

// Validation functions
function validateNumber(value, min, max) {
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid number';
    if (num < min) return `Value must be at least ${min}`;
    if (num > max) return `Value must be less than ${max}`;
    return null;
}

function validateField(id, value) {
    if (!value) return null; // Optional fields can be empty

    switch (id) {
        case 'fullName':
            if (value.length < VALIDATION_RULES.fullName.minLength) {
                return `Name must be at least ${VALIDATION_RULES.fullName.minLength} characters`;
            }
            if (value.length > VALIDATION_RULES.fullName.maxLength) {
                return `Name must be less than ${VALIDATION_RULES.fullName.maxLength} characters`;
            }
            if (!/^[a-zA-Z\s-']+$/.test(value)) {
                return 'Name can only contain letters, spaces, hyphens, and apostrophes';
            }
            break;
        case 'height':
            return validateNumber(value, VALIDATION_RULES.height.min, VALIDATION_RULES.height.max);
        case 'weight':
            return validateNumber(value, VALIDATION_RULES.weight.min, VALIDATION_RULES.weight.max);
    }
    return null;
}

// Real-time validation
const formFields = ['fullName', 'height', 'weight'];
formFields.forEach(fieldId => {
    const element = document.getElementById(fieldId);
    if (element) {
        element.addEventListener('input', (e) => {
            const error = validateField(fieldId, e.target.value);
            const errorElement = document.getElementById(`${fieldId}Error`);
            
            if (error) {
                if (!errorElement) {
                    const errorDiv = document.createElement('div');
                    errorDiv.id = `${fieldId}Error`;
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = error;
                    e.target.parentNode.appendChild(errorDiv);
                } else {
                    errorElement.textContent = error;
                }
                errorElement.classList.add('visible');
                e.target.classList.add('error');
            } else {
                if (errorElement) {
                    errorElement.classList.remove('visible');
                }
                e.target.classList.remove('error');
            }
        });
    }
});

// Loading state management
function showLoading(message = 'Updating profile...') {
    const overlay = document.querySelector('.loading-overlay');
    const messageEl = document.getElementById('loadingMessage');
    
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    if (overlay) {
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        overlay.classList.add('visible');
    }
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    
    if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => {
            document.body.style.overflow = ''; // Restore scrolling
        }, 300); // Match transition duration
    }
}

// Toast notification functions
function createToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span>${message}`;
    document.body.appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Hide and remove the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Show success message function
function showSuccessMessage(message) {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.classList.add('visible');
        setTimeout(() => {
            successMessage.classList.remove('visible');
        }, 3000);
    }
}

// Image compression utility
async function compressImage(base64String) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = height * (MAX_WIDTH / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = width * (MAX_HEIGHT / height);
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = base64String;
    });
}

// Handle profile photo upload
if (photoUpload) {
    photoUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file (JPG, PNG, etc.)', 'error');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be smaller than 5MB', 'error');
            return;
        }

        showLoading('Processing photo...');

        try {
            // Read file as base64
            const base64String = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });

            // Compress image
            const compressedBase64 = await compressImage(base64String);
            
            // Update photo preview
            if (profilePhoto) {
                profilePhoto.src = compressedBase64;
                profilePhoto.style.display = 'block';
                currentPhotoData = compressedBase64;
            }
            
            showToast('Photo updated successfully! Don\'t forget to save your profile.', 'success');
        } catch (error) {
            console.error('Error processing photo:', error);
            showToast('Failed to process photo: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            hideLoading();
        }
    });
}

// Photo upload handling
photoUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        createToast('Please select an image file');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        createToast('Image size should be less than 5MB');
        return;
    }

    try {
        showLoading('Uploading photo...');

        // Create a preview
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePhoto.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Here you would typically upload to your storage service
        // For example, with Firebase Storage:
        // const storageRef = firebase.storage().ref();
        // const fileRef = storageRef.child(`profile-photos/${userId}`);
        // await fileRef.put(file);
        // const photoURL = await fileRef.getDownloadURL();

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        hideLoading();
        createToast('Profile photo updated successfully!');
    } catch (error) {
        console.error('Error uploading photo:', error);
        hideLoading();
        createToast('Failed to upload photo. Please try again.');
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
            // Load text fields
            const fields = {
                fullName: '',
                dob: '',
                gender: '',
                height: '',
                weight: '',
                dietType: 'none',
                foodPreferences: '',
                allergies: '',
                restrictions: '',
                healthConditions: ''
            };

            // Set values from profile or defaults
            Object.keys(fields).forEach(field => {
                const element = document.getElementById(field);
                if (element) {
                    element.value = profile[field] || fields[field];
                }
            });

            // Load profile photo
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

// Save profile data
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = firebase.auth().currentUser;
        if (!user) {
            showToast('Please log in to save your profile', 'error');
            return;
        }

        // Validate required fields
        const fullName = document.getElementById('fullName').value;
        if (!fullName.trim()) {
            showToast('Please enter your full name', 'error');
            return;
        }

        // Check optional numeric fields
        const height = document.getElementById('height').value;
        const weight = document.getElementById('weight').value;

        if (height && (height < 50 || height > 300)) {
            showToast('Please enter a valid height between 50 and 300 cm', 'error');
            return;
        }

        if (weight && (weight < 20 || weight > 500)) {
            showToast('Please enter a valid weight between 20 and 500 kg', 'error');
            return;
        }

        showLoading('Saving your profile...');

        const profileData = {
            fullName: fullName.trim(),
            dob: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            dietType: document.getElementById('dietType').value,
            foodPreferences: document.getElementById('foodPreferences').value.trim(),
            allergies: document.getElementById('allergies').value.trim(),
            restrictions: document.getElementById('restrictions').value.trim(),
            healthConditions: document.getElementById('healthConditions').value.trim(),
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };

        // Add photo if it exists
        if (currentPhotoData) {
            profileData.photo = currentPhotoData;
        }

        try {
            // Update profile in Firebase
            await firebase.database().ref(`users/${user.uid}/profile`).update(profileData);
            
            // Update Firebase Auth display name
            await user.updateProfile({
                displayName: profileData.fullName
            });
            
            // After successful update
            hideLoading();
            createToast('Your profile has been updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            hideLoading();
            createToast('Failed to update profile. Please try again.');
        } finally {
            hideLoading();
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    firebase.auth().onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            loadUserProfile();
        }
    });

    // Animate sections on scroll
    const sections = document.querySelectorAll('.section-card, .profile-photo-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transform = 'translateY(0)';
                entry.target.style.opacity = '1';
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        section.style.transform = 'translateY(20px)';
        section.style.opacity = '0';
        section.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
        observer.observe(section);
    });

    // Stagger animation of form groups
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(10px)';
        setTimeout(() => {
            group.style.transition = 'all 0.3s ease-out';
            group.style.transform = 'translateY(0)';
            group.style.opacity = '1';
        }, 100 * index);
    });

    // Advanced section card animations
    const cards = document.querySelectorAll('.section-card');
    
    const applyParallax = (e, card) => {
        const rect = card.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const mouseY = (e.clientY - rect.top - rect.height / 2) / rect.height;
        
        const tiltAmount = 5;
        const tiltX = mouseY * tiltAmount;
        const tiltY = -mouseX * tiltAmount;
        const glareX = mouseX * 100 + 50;
        const glareY = mouseY * 100 + 50;
        
        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.querySelector('::before').style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.2), transparent)`;
    };

    cards.forEach(card => {
        card.addEventListener('mousemove', e => applyParallax(e, card));
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // Smooth scroll animation for form sections
    const observer2 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transform = 'translateY(0) scale(1)';
                entry.target.style.opacity = '1';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '20px'
    });

    document.querySelectorAll('.form-group').forEach((group, index) => {
        group.style.transform = 'translateY(20px) scale(0.95)';
        group.style.opacity = '0';
        group.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        observer2.observe(group);
    });

    // Enhanced form validation with floating labels
    document.querySelectorAll('.form-control').forEach(input => {
        const updateLabel = () => {
            const label = input.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                if (input.value) {
                    label.classList.add('float');
                } else {
                    label.classList.remove('float');
                }
            }
        };

        input.addEventListener('input', updateLabel);
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
            updateLabel();
        });

        // Initialize on load
        updateLabel();
    });

    // Enhanced save button interaction
    const saveBtn = document.querySelector('.btn-save');
    if (saveBtn) {
        saveBtn.addEventListener('mouseenter', () => {
            const ripple = document.createElement('div');
            ripple.className = 'btn-ripple';
            saveBtn.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 1000);
        });
    }

    // Profile photo upload enhancement
    const photoWrapper = document.querySelector('.photo-wrapper');

    if (photoUpload && profilePhoto) {
        photoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                
                // Add loading animation
                photoWrapper.classList.add('loading');
                
                reader.onload = (e) => {
                    // Smooth transition for new image
                    const tempImg = new Image();
                    tempImg.src = e.target.result;
                    tempImg.onload = () => {
                        profilePhoto.style.opacity = '0';
                        setTimeout(() => {
                            profilePhoto.src = e.target.result;
                            profilePhoto.style.opacity = '1';
                            photoWrapper.classList.remove('loading');
                        }, 300);
                    };
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
});

// Enhanced form submission with advanced animations
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate all fields with enhanced animations
        let hasErrors = false;
        const fields = document.querySelectorAll('.form-control');
        
        fields.forEach(field => {
            const error = validateField(field.id, field.value);
            if (error) {
                hasErrors = true;
                field.classList.add('error-shake');
                showToast(error, 'error');
                
                // Create ripple effect for error
                const ripple = document.createElement('div');
                ripple.className = 'error-ripple';
                field.parentElement.appendChild(ripple);
                
                setTimeout(() => {
                    field.classList.remove('error-shake');
                    ripple.remove();
                }, 1000);
            }
        });

        if (hasErrors) return;

        try {
            // Enhanced save animation
            const saveBtn = document.querySelector('.btn-save');
            if (saveBtn) {
                saveBtn.classList.add('saving');
                saveBtn.innerHTML = `
                    <div class="save-loader">
                        <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                    </div>
                `;
            }

            showLoading('Saving your profile...');
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Success animation
            hideLoading();
            showToast('Profile updated successfully! 🎉', 'success');
            
            if (saveBtn) {
                saveBtn.classList.remove('saving');
                saveBtn.innerHTML = `
                    <span>Saved!</span>
                    <svg viewBox="0 0 24 24" class="check-icon">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                `;
                
                setTimeout(() => {
                    saveBtn.innerHTML = 'Save Profile';
                }, 2000);
            }

        } catch (error) {
            hideLoading();
            showToast('Failed to update profile. Please try again.', 'error');
            
            if (saveBtn) {
                saveBtn.classList.remove('saving');
                saveBtn.innerHTML = 'Save Profile';
            }
        }
    });
}
