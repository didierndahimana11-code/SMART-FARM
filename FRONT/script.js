// =============================================
// SMARTFARM CREDIT - MAIN JAVASCRIPT
// =============================================

// API Configuration
const API_BASE_URL = '/api'; // Using relative path since server serves FRONT

// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    setupNavigation();
    setupFormValidation();
    setupLanguageToggle();
    checkUserSession();
}

// =============================================
// NAVIGATION SETUP
// =============================================

function setupNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // Active link highlighting
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.href.includes(currentPath)) {
            link.classList.add('active');
        }
    });
}

// =============================================
// FORM VALIDATION
// =============================================

function setupFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            if (!validateForm(form)) {
                e.preventDefault();
            }
        });

        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('change', () => validateField(input));
        });
    });
}

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });

    return isValid;
}

function validateField(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return true;

    // Remove existing error message
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Remove error class
    formGroup.classList.remove('error');

    const type = field.type;
    const value = field.value.trim();
    const name = field.getAttribute('name');
    const required = field.hasAttribute('required');

    // Check if required
    if (required && value === '') {
        showFieldError(formGroup, field, 'This field is required');
        return false;
    }

    // Check email format
    if (type === 'email' && value !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(formGroup, field, 'Please enter a valid email address');
            return false;
        }
    }

    // Check password strength
    if (name === 'password' && value !== '') {
        if (value.length < 8) {
            showFieldError(formGroup, field, 'Password must be at least 8 characters');
            return false;
        }
        if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
            showFieldError(formGroup, field, 'Password must contain uppercase letters and numbers');
            return false;
        }
    }

    // Check phone number
    if (type === 'tel' && value !== '') {
        const phoneRegex = /^\d{10,}$/;
        if (!phoneRegex.test(value.replace(/\D/g, ''))) {
            showFieldError(formGroup, field, 'Please enter a valid phone number');
            return false;
        }
    }

    // Check number field
    if (type === 'number' && value !== '') {
        const num = parseFloat(value);
        if (isNaN(num)) {
            showFieldError(formGroup, field, 'Please enter a valid number');
            return false;
        }
    }

    return true;
}

function showFieldError(formGroup, field, message) {
    formGroup.classList.add('error');
    const errorSpan = document.createElement('span');
    errorSpan.className = 'error-message';
    errorSpan.textContent = message;
    field.parentElement.appendChild(errorSpan);
}

// =============================================
// LANGUAGE TOGGLE
// =============================================

function setupLanguageToggle() {
    const langButtons = document.querySelectorAll('.lang-btn');

    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);

            // Update active state
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setLanguage(lang) {
    localStorage.setItem('preferredLanguage', lang);
    console.log('Language set to:', lang);
    // In a full app, this would trigger page translation
}

// =============================================
// API CALLS
// =============================================

async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        throw error;
    }
}

function getAuthToken() {
    return localStorage.getItem('authToken') || '';
}

// =============================================
// USER SESSION MANAGEMENT
// =============================================

function checkUserSession() {
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');

    if (token && userInfo) {
        const user = JSON.parse(userInfo);
        updateNavigation(user);
    }
}

function updateNavigation(user) {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const loginBtn = navActions.querySelector('.login-btn');
    const signupBtn = navActions.querySelector('.signup-btn');

    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';

    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
        <span>${user.name}</span>
        <button onclick="logout()">Logout</button>
    `;
    navActions.appendChild(userMenu);
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = 'index.html';
}

// =============================================
// NOTIFICATIONS
// =============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 6px;
        box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function getNotificationColor(type) {
    const colors = {
        'success': '#10B981',
        'error': '#EF4444',
        'warning': '#FCD34D',
        'info': '#1E40AF'
    };
    return colors[type] || colors['info'];
}

// =============================================
// LOAN CALCULATOR
// =============================================

function calculateLoan() {
    const principal = parseFloat(document.getElementById('principal')?.value) || 0;
    const rate = parseFloat(document.getElementById('rate')?.value) || 0;
    const months = parseFloat(document.getElementById('months')?.value) || 0;

    if (principal && rate && months) {
        const monthlyRate = rate / 100 / 12;
        const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
        const totalPayment = monthlyPayment * months;
        const totalInterest = totalPayment - principal;

        const resultDiv = document.getElementById('calculator-result');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="calculation-result">
                    <p><strong>Monthly Payment:</strong> $${monthlyPayment.toFixed(2)}</p>
                    <p><strong>Total Payment:</strong> $${totalPayment.toFixed(2)}</p>
                    <p><strong>Total Interest:</strong> $${totalInterest.toFixed(2)}</p>
                </div>
            `;
        }
    }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export functions for use in HTML
window.calculateLoan = calculateLoan;
window.openModal = openModal;
window.closeModal = closeModal;
window.logout = logout;
