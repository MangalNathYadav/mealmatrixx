// Authentication Service
class AuthService {
    // Check current auth state
    onAuthStateChanged(callback) {
        return firebase.auth().onAuthStateChanged(callback);
    }

    // Get current user
    getCurrentUser() {
        return firebase.auth().currentUser;
    }

    // Login
    async login(email, password) {
        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Register
    async register(email, password) {
        try {
            await firebase.auth().createUserWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            await firebase.auth().signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Reset password
    async resetPassword(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update profile
    async updateProfile(data) {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: 'No user logged in' };
        }

        try {
            await firebase.auth().currentUser.updateProfile(data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create and export service instance
const authService = new AuthService();
export default authService;
