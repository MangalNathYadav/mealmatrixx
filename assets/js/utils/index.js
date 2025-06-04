// Utility functions

// Show toast notification
export function showToast(message, type = 'error') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading overlay management
export function showLoading(message = 'Loading...') {
    const loadingOverlay = document.querySelector('.loading-overlay');
    const loadingMessage = document.querySelector('.loading-message');
    
    if (loadingOverlay && loadingMessage) {
        loadingMessage.textContent = message;
        loadingOverlay.classList.add('visible');
    }
}

export function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('visible');
    }
}

// Date formatting
export function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Number formatting
export function formatNumber(num, decimals = 1) {
    if (num === null || num === undefined) return 0;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function getPercentage(current, target, max = 100) {
    if (!target || !current) return 0;
    const percentage = (current / target) * 100;
    return Math.min(Math.max(Math.round(percentage), 0), max);
}

// Input parsing
export function parseNumberInput(value, fallback = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

// Data validation
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePassword(password) {
    return password && password.length >= 6;
}

// URL parsing
export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// DOM helpers
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
        element.className = options.className;
    }
    
    if (options.text) {
        element.textContent = options.text;
    }
    
    if (options.html) {
        element.innerHTML = options.html;
    }
    
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    return element;
}

// Array helpers
export function groupBy(array, key) {
    return array.reduce((acc, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {});
}

// Object helpers
export function objectToArray(obj) {
    return Object.entries(obj).map(([id, data]) => ({
        id,
        ...data
    }));
}

// Local storage helpers
export function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

export function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// CSV export
export function exportToCSV(data, filename) {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                let cell = row[header];
                // Handle special characters and ensure proper CSV formatting
                if (cell === null || cell === undefined) cell = '';
                cell = String(cell).replace(/"/g, '""');
                if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
