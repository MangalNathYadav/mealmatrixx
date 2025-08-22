// Profile module for mobile app
import { showToast, showLoading, hideLoading, navigateToPage } from './app.js';
import { getCurrentUser, signOut } from './auth.js';

export default function initializeProfile() {
    const profileInfo = document.getElementById('profileInfo');
    const updateProfileForm = document.getElementById('updateProfileForm');
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (profileInfo) {
        loadProfileInfo();
    }
    
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }
}

// Load user profile information
async function loadProfileInfo() {
    const profileInfo = document.getElementById('profileInfo');
    if (!profileInfo) return;
    
    const user = getCurrentUser();
    if (!user) {
        showToast('You must be logged in to view profile', 'error');
        return;
    }
    
    try {
        // Get user profile from Firebase
        const profileSnapshot = await firebase.database()
            .ref(`users/${user.uid}`)
            .once('value');
        
        const profile = profileSnapshot.val() || {};
        
        // Update UI with profile info
        profileInfo.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="profile-details">
                    <h3>${profile.displayName || user.displayName || user.email}</h3>
                    <p>${user.email}</p>
                    <p class="profile-member-since">Member since ${formatDate(user.metadata.creationTime || profile.createdAt)}</p>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="stat-item">
                    <div class="stat-value">${profile.weight ? `${profile.weight} kg` : '–'}</div>
                    <div class="stat-label">Weight</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${profile.height ? `${profile.height} cm` : '–'}</div>
                    <div class="stat-label">Height</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${calculateBMI(profile.weight, profile.height)}</div>
                    <div class="stat-label">BMI</div>
                </div>
            </div>
            
            <style>
                .profile-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                
                .profile-avatar {
                    width: 70px;
                    height: 70px;
                    background: var(--gradient-primary);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 1rem;
                    color: white;
                    font-size: 1.5rem;
                    flex-shrink: 0;
                    box-shadow: 0 4px 10px rgba(147, 51, 234, 0.25);
                }
                
                .profile-details h3 {
                    margin: 0 0 0.25rem 0;
                }
                
                .profile-details p {
                    margin: 0;
                    color: var(--gray-600);
                }
                
                .profile-member-since {
                    font-size: 0.8rem;
                    margin-top: 0.5rem !important;
                }
                
                .profile-stats {
                    display: flex;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 12px;
                    padding: 1rem;
                }
                
                .stat-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                }
                
                .stat-value {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--primary-color);
                }
                
                .stat-label {
                    font-size: 0.8rem;
                    color: var(--gray-500);
                }
            </style>
        `;
        
        // Pre-populate form with current values
        document.getElementById('displayName').value = profile.displayName || user.displayName || '';
        document.getElementById('weight').value = profile.weight || '';
        document.getElementById('height').value = profile.height || '';
        
        if (profile.activityLevel) {
            document.getElementById('activityLevel').value = profile.activityLevel;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        profileInfo.innerHTML = `
            <p>Failed to load profile information. Tap to retry.</p>
        `;
        profileInfo.addEventListener('click', loadProfileInfo);
    }
}

// Handle profile form submission
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        showToast('You must be logged in to update profile', 'error');
        return;
    }
    
    // Get form values
    const displayName = document.getElementById('displayName').value;
    const weight = document.getElementById('weight').value ? Number(document.getElementById('weight').value) : null;
    const height = document.getElementById('height').value ? Number(document.getElementById('height').value) : null;
    const activityLevel = document.getElementById('activityLevel').value;
    
    // Create profile update object
    const profileUpdate = {
        displayName,
        weight,
        height,
        activityLevel,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        showLoading();
        
        // Update Firebase Auth display name if provided
        if (displayName) {
            await user.updateProfile({
                displayName: displayName
            });
        }
        
        // Update profile in Firebase Database
        await firebase.database()
            .ref(`users/${user.uid}`)
            .update(profileUpdate);
        
        hideLoading();
        showToast('Profile updated successfully!', 'success');
        
        // Reload profile info to reflect changes
        loadProfileInfo();
    } catch (error) {
        hideLoading();
        console.error('Error updating profile:', error);
        showToast('Failed to update profile. Please try again.', 'error');
    }
}

// Handle sign out button click
async function handleSignOut() {
    try {
        showLoading();
        await signOut();
        hideLoading();
        
        // Navigate to login page
        navigateToPage('login');
    } catch (error) {
        hideLoading();
        console.error('Error signing out:', error);
        showToast('Failed to sign out. Please try again.', 'error');
    }
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

// Helper function to calculate BMI
function calculateBMI(weight, height) {
    if (!weight || !height) return '–';
    
    // Convert height from cm to m
    const heightInMeters = height / 100;
    
    // Calculate BMI: weight (kg) / (height (m))^2
    const bmi = weight / (heightInMeters * heightInMeters);
    
    return bmi.toFixed(1);
}
