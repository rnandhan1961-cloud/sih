// Shiksha Leap - Authentication Module
// Handles OTP-based login and registration

class AuthManager {
    constructor() {
        this.currentStep = 'contact'; // 'contact' or 'otp'
        this.contactInfo = '';
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Send OTP button
        const sendOtpBtn = document.getElementById('sendOtpBtn');
        if (sendOtpBtn) {
            sendOtpBtn.addEventListener('click', () => this.sendOTP());
        }
        
        // Verify OTP button
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        if (verifyOtpBtn) {
            verifyOtpBtn.addEventListener('click', () => this.verifyOTP());
        }
        
        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBackToContact());
        }
        
        // Enter key handling
        const contactInput = document.getElementById('contactInput');
        if (contactInput) {
            contactInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendOTP();
                }
            });
        }
        
        const otpInput = document.getElementById('otpInput');
        if (otpInput) {
            otpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verifyOTP();
                }
            });
            
            // Auto-format OTP input
            otpInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                if (value.length > 6) {
                    value = value.substring(0, 6);
                }
                e.target.value = value;
                
                // Auto-submit when 6 digits entered
                if (value.length === 6) {
                    setTimeout(() => this.verifyOTP(), 500);
                }
            });
        }
    }
    
    async sendOTP() {
        const contactInput = document.getElementById('contactInput');
        const sendOtpBtn = document.getElementById('sendOtpBtn');
        
        if (!contactInput || !sendOtpBtn) return;
        
        const contact = contactInput.value.trim();
        
        // Validate input
        if (!this.validateContact(contact)) {
            this.showError('Please enter a valid mobile number or email address');
            return;
        }
        
        // Show loading state
        this.setButtonLoading(sendOtpBtn, true);
        
        try {
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ contact: contact })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.contactInfo = contact;
                this.showOTPSection();
                this.showSuccess('OTP sent successfully! Check your messages.');
            } else {
                this.showError(data.error || 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setButtonLoading(sendOtpBtn, false);
        }
    }
    
    async verifyOTP() {
        const otpInput = document.getElementById('otpInput');
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        
        if (!otpInput || !verifyOtpBtn) return;
        
        const otp = otpInput.value.trim();
        
        // Validate OTP
        if (!this.validateOTP(otp)) {
            this.showError('Please enter a valid 6-digit OTP');
            return;
        }
        
        // Show loading state
        this.setButtonLoading(verifyOtpBtn, true);
        
        try {
            const response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    contact: this.contactInfo, 
                    otp: otp 
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect after short delay
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            } else {
                this.showError(data.error || 'Invalid OTP. Please try again.');
                otpInput.value = '';
                otpInput.focus();
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setButtonLoading(verifyOtpBtn, false);
        }
    }
    
    validateContact(contact) {
        if (!contact) return false;
        
        // Check if it's an email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(contact)) {
            return true;
        }
        
        // Check if it's a mobile number (Indian format)
        const mobileRegex = /^[6-9]\d{9}$/;
        const cleanMobile = contact.replace(/\D/g, '');
        
        // Handle +91 prefix
        if (cleanMobile.startsWith('91') && cleanMobile.length === 12) {
            return mobileRegex.test(cleanMobile.substring(2));
        }
        
        return mobileRegex.test(cleanMobile);
    }
    
    validateOTP(otp) {
        return /^\d{6}$/.test(otp);
    }
    
    showOTPSection() {
        const authForm = document.querySelector('.auth-form');
        const otpSection = document.getElementById('otpSection');
        
        if (authForm && otpSection) {
            authForm.classList.add('hidden');
            otpSection.classList.remove('hidden');
            
            // Focus on OTP input
            const otpInput = document.getElementById('otpInput');
            if (otpInput) {
                setTimeout(() => otpInput.focus(), 100);
            }
            
            this.currentStep = 'otp';
        }
    }
    
    goBackToContact() {
        const authForm = document.querySelector('.auth-form');
        const otpSection = document.getElementById('otpSection');
        
        if (authForm && otpSection) {
            authForm.classList.remove('hidden');
            otpSection.classList.add('hidden');
            
            // Clear OTP input
            const otpInput = document.getElementById('otpInput');
            if (otpInput) {
                otpInput.value = '';
            }
            
            // Focus on contact input
            const contactInput = document.getElementById('contactInput');
            if (contactInput) {
                setTimeout(() => contactInput.focus(), 100);
            }
            
            this.currentStep = 'contact';
        }
    }
    
    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.innerHTML = '<div class="spinner"></div> Loading...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.auth-message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.textContent = message;
        
        // Insert message at the top of the current form
        const currentForm = this.currentStep === 'otp' ? 
            document.getElementById('otpSection') : 
            document.querySelector('.auth-form');
        
        if (currentForm) {
            currentForm.insertBefore(messageDiv, currentForm.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentElement) {
                    messageDiv.remove();
                }
            }, 5000);
        }
        
        // Announce to screen readers
        if (window.shikshaLeap) {
            window.shikshaLeap.announceToScreenReader(message);
        }
    }
    
    // Handle offline authentication
    handleOfflineAuth() {
        // Store authentication attempt for later sync
        const offlineAuth = {
            contact: this.contactInfo,
            timestamp: Date.now(),
            type: 'login_attempt'
        };
        
        const offlineData = JSON.parse(localStorage.getItem('offlineAuthAttempts') || '[]');
        offlineData.push(offlineAuth);
        localStorage.setItem('offlineAuthAttempts', JSON.stringify(offlineData));
        
        this.showError('You are offline. Please connect to the internet to complete login.');
    }
    
    // Sync offline authentication attempts when back online
    async syncOfflineAuth() {
        const offlineAttempts = JSON.parse(localStorage.getItem('offlineAuthAttempts') || '[]');
        
        if (offlineAttempts.length === 0) return;
        
        try {
            // In a real implementation, you might want to notify the server
            // about offline authentication attempts for security monitoring
            console.log('Syncing offline auth attempts:', offlineAttempts);
            
            // Clear offline attempts after successful sync
            localStorage.removeItem('offlineAuthAttempts');
        } catch (error) {
            console.error('Error syncing offline auth attempts:', error);
        }
    }
    
    // Format contact for display
    formatContactForDisplay(contact) {
        if (contact.includes('@')) {
            // Email - mask middle part
            const [username, domain] = contact.split('@');
            const maskedUsername = username.length > 3 ? 
                username.substring(0, 2) + '*'.repeat(username.length - 4) + username.slice(-2) :
                username;
            return `${maskedUsername}@${domain}`;
        } else {
            // Mobile - mask middle digits
            const cleanMobile = contact.replace(/\D/g, '');
            if (cleanMobile.length === 10) {
                return `${cleanMobile.substring(0, 2)}****${cleanMobile.slice(-2)}`;
            }
            return contact;
        }
    }
    
    // Auto-detect input type and format
    formatContactInput(input) {
        let value = input.value.trim();
        
        // If it looks like a mobile number, format it
        if (/^\d+$/.test(value) && value.length <= 12) {
            // Remove any existing formatting
            value = value.replace(/\D/g, '');
            
            // Add +91 prefix if it's a 10-digit number
            if (value.length === 10 && value.match(/^[6-9]/)) {
                // Don't auto-add +91, let user decide
            }
            
            input.value = value;
        }
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Add authentication-specific styles
const authStyles = `
    .auth-message {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
    }
    
    .auth-message-error {
        background-color: #fee;
        color: #c53030;
        border: 1px solid #feb2b2;
    }
    
    .auth-message-success {
        background-color: #f0fff4;
        color: #22543d;
        border: 1px solid #9ae6b4;
    }
    
    .auth-message-info {
        background-color: #ebf8ff;
        color: #2a69ac;
        border: 1px solid #90cdf4;
    }
    
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 0.5rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* OTP input styling */
    #otpInput {
        text-align: center;
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: 0.5rem;
        font-family: 'Courier New', monospace;
    }
    
    /* Contact input formatting */
    #contactInput {
        font-size: 1.125rem;
    }
    
    /* Loading state for buttons */
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    /* Smooth transitions */
    .auth-form, #otpSection {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .hidden {
        opacity: 0;
        transform: translateY(-10px);
        pointer-events: none;
    }
`;

// Inject authentication styles
const authStyleSheet = document.createElement('style');
authStyleSheet.textContent = authStyles;
document.head.appendChild(authStyleSheet);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}