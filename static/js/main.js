// Shiksha Leap - Main JavaScript Module
// Handles language switching, offline detection, and common utilities

class ShikshaLeap {
    constructor() {
        this.currentLanguage = 'en';
        this.isOnline = navigator.onLine;
        this.translations = {};
        
        this.init();
    }
    
    async init() {
        // Load saved language preference
        this.currentLanguage = localStorage.getItem('shikshaLanguage') || 'en';
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load translations
        await this.loadTranslations();
        
        // Apply translations
        this.applyTranslations();
        
        // Register service worker
        this.registerServiceWorker();
        
        // Setup offline sync
        this.setupOfflineSync();
        
        console.log('Shiksha Leap initialized successfully');
    }
    
    setupEventListeners() {
        // Language selector
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.value = this.currentLanguage;
            languageSelector.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
        
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineIndicator();
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineIndicator();
        });
        
        // Update offline indicator on load
        if (!this.isOnline) {
            this.showOfflineIndicator();
        }
        
        // Handle form submissions with loading states
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                this.handleFormSubmission(form);
            }
        });
        
        // Handle back button for PWA
        window.addEventListener('popstate', (e) => {
            // Handle navigation state if needed
        });
    }
    
    async loadTranslations() {
        try {
            const response = await fetch(`/static/locales/${this.currentLanguage}.json`);
            if (response.ok) {
                this.translations = await response.json();
            } else {
                console.warn(`Failed to load translations for ${this.currentLanguage}`);
                // Fallback to English
                if (this.currentLanguage !== 'en') {
                    const fallbackResponse = await fetch('/static/locales/en.json');
                    if (fallbackResponse.ok) {
                        this.translations = await fallbackResponse.json();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }
    
    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n-key]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            if (this.translations[key]) {
                if (element.tagName === 'INPUT' && element.type === 'text') {
                    element.placeholder = this.translations[key];
                } else {
                    element.textContent = this.translations[key];
                }
            }
        });
    }
    
    async changeLanguage(language) {
        this.currentLanguage = language;
        localStorage.setItem('shikshaLanguage', language);
        
        await this.loadTranslations();
        this.applyTranslations();
        
        // Update HTML lang attribute
        document.documentElement.lang = language;
        
        console.log(`Language changed to: ${language}`);
    }
    
    showOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    }
    
    hideOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Listen for service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailable();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
    
    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <span data-i18n-key="update_available">New version available!</span>
                <button onclick="window.location.reload()" data-i18n-key="refresh">Refresh</button>
            </div>
        `;
        document.body.appendChild(updateBanner);
    }
    
    handleFormSubmission(form) {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '<div class="spinner"></div> Loading...';
            
            // Re-enable button after 10 seconds as fallback
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }, 10000);
        }
    }
    
    async syncOfflineData() {
        if (!this.isOnline) return;
        
        try {
            // Sync offline game logs
            const offlineLogs = JSON.parse(localStorage.getItem('offlineGameLogs') || '[]');
            
            if (offlineLogs.length > 0) {
                const response = await fetch('/api/sync-offline-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ logs: offlineLogs })
                });
                
                if (response.ok) {
                    localStorage.removeItem('offlineGameLogs');
                    this.showNotification('Data synced successfully!', 'success');
                    console.log('Offline data synced successfully');
                }
            }
        } catch (error) {
            console.error('Error syncing offline data:', error);
        }
    }
    
    setupOfflineSync() {
        // Sync data when page becomes visible (user returns to app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.syncOfflineData();
            }
        });
        
        // Periodic sync every 5 minutes when online
        setInterval(() => {
            if (this.isOnline) {
                this.syncOfflineData();
            }
        }, 5 * 60 * 1000);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Utility functions
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    formatDate(date) {
        return new Intl.DateTimeFormat(this.currentLanguage, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }
    
    formatNumber(number) {
        return new Intl.NumberFormat(this.currentLanguage).format(number);
    }
    
    // Local storage helpers
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return defaultValue;
        }
    }
    
    // API helpers
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(endpoint, finalOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            
            if (!this.isOnline) {
                this.showNotification('You are offline. Data will be synced when connection is restored.', 'warning');
            } else {
                this.showNotification('Network error. Please try again.', 'error');
            }
            
            throw error;
        }
    }
    
    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
    
    // Accessibility helpers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Touch and gesture helpers
    setupSwipeGestures(element, callbacks) {
        let startX, startY, endX, endY;
        
        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        element.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50 && callbacks.swipeRight) {
                    callbacks.swipeRight();
                } else if (deltaX < -50 && callbacks.swipeLeft) {
                    callbacks.swipeLeft();
                }
            } else {
                if (deltaY > 50 && callbacks.swipeDown) {
                    callbacks.swipeDown();
                } else if (deltaY < -50 && callbacks.swipeUp) {
                    callbacks.swipeUp();
                }
            }
        });
    }
}

// Initialize Shiksha Leap when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shikshaLeap = new ShikshaLeap();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 300px;
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }
    
    .notification-info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
    }
    
    .notification-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
    
    .notification-warning {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
    }
    
    .notification-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .notification-content button {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0;
        margin-left: 1rem;
    }
    
    .update-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background-color: #4A90E2;
        color: white;
        padding: 1rem;
        text-align: center;
        z-index: 1001;
    }
    
    .update-content {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
    }
    
    .update-content button {
        background-color: white;
        color: #4A90E2;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-weight: 600;
        cursor: pointer;
    }
    
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @media (max-width: 480px) {
        .notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }
        
        .update-content {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShikshaLeap;
}