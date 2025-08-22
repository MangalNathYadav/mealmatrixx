// Login page logic
import { showToast, showLoading, hideLoading } from './app.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const togglePw = document.querySelector('.toggle-password');

  if (togglePw) {
    togglePw.addEventListener('click', () => {
      const type = passwordEl.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordEl.setAttribute('type', type);
      togglePw.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailEl.value.trim();
      const password = passwordEl.value;
      if (!email || !password) {
        showToast('Enter email & password', 'warning');
        return;
      }
      try {
        showLoading('Signing you in...');
        await firebase.auth().signInWithEmailAndPassword(email, password);
        hideLoading();
        showToast('Signed in', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 300);
      } catch (err) {
        hideLoading();
        console.error('Login failed:', err);
        let msg = 'Login failed';
        if (err && err.code) {
          switch (err.code) {
            case 'auth/invalid-email': msg = 'Invalid email'; break;
            case 'auth/user-disabled': msg = 'Account disabled'; break;
            case 'auth/user-not-found': msg = 'User not found'; break;
            case 'auth/wrong-password': msg = 'Wrong password'; break;
          }
        }
        showToast(msg, 'error');
      }
    });
  }
});
