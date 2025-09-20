// Shiksha Leap - Database Synchronization Module
// Handles offline data storage and synchronization with the server

class DatabaseSync {
    constructor() {
        this.dbName = 'ShikshaLeapDB';
        this.dbVersion = 1;
        this.db = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        
        this.init();
    }
    
    async init() {
        try {
            await this.initIndexedDB();
            this.setupEventListeners();
            this.startPeriodicSync();
            console.log('DatabaseSync initialized successfully');
        } catch (error) {
            console.error('Failed to initialize DatabaseSync:', error);
        }
    }
    
    // Initialize IndexedDB for offline storage
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB opened successfully');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Game logs store
                if (!db.objectStoreNames.contains('gameLogs')) {
                    const gameLogsStore = db.createObjectStore('gameLogs', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    gameLogsStore.createIndex('studentId', 'studentId', { unique: false });
                    gameLogsStore.createIndex('synced', 'synced', { unique: false });
                    gameLogsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Achievements store
                if (!db.objectStoreNames.contains('achievements')) {
                    const achievementsStore = db.createObjectStore('achievements', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    achievementsStore.createIndex('studentId', 'studentId', { unique: false });
                    achievementsStore.createIndex('synced', 'synced', { unique: false });
                }
                
                // User progress store
                if (!db.objectStoreNames.contains('userProgress')) {
                    const progressStore = db.createObjectStore('userProgress', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    progressStore.createIndex('studentId', 'studentId', { unique: false });
                    progressStore.createIndex('subject', 'subject', { unique: false });
                }
                
                // Cached content store
                if (!db.objectStoreNames.contains('cachedContent')) {
                    const contentStore = db.createObjectStore('cachedContent', { 
                        keyPath: 'id' 
                    });
                    contentStore.createIndex('type', 'type', { unique: false });
                    contentStore.createIndex('grade', 'grade', { unique: false });
                }
                
                console.log('IndexedDB schema created/updated');
            };
        });
    }
    
    // Setup event listeners for online/offline detection
    setupEventListeners() {
        window.addEventListener('online', () => {
            console.log('Connection restored - starting sync');
            this.isOnline = true;
            this.syncPendingData();
        });
        
        window.addEventListener('offline', () => {
            console.log('Connection lost - switching to offline mode');
            this.isOnline = false;
        });
        
        // Listen for service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'SYNC_GAME_LOGS') {
                    this.syncGameLogs();
                } else if (event.data.type === 'SYNC_ACHIEVEMENTS') {
                    this.syncAchievements();
                }
            });
        }
    }
    
    // Save game log (works offline)
    async saveGameLog(gameLog) {
        const logEntry = {
            ...gameLog,
            timestamp: Date.now(),
            synced: false
        };
        
        try {
            // Save to IndexedDB
            await this.addToStore('gameLogs', logEntry);
            console.log('Game log saved locally:', logEntry);
            
            // Try to sync immediately if online
            if (this.isOnline) {
                this.syncGameLogs();
            }
            
            return logEntry;
        } catch (error) {
            console.error('Failed to save game log:', error);
            throw error;
        }
    }
    
    // Save achievement (works offline)
    async saveAchievement(achievement) {
        const achievementEntry = {
            ...achievement,
            timestamp: Date.now(),
            synced: false
        };
        
        try {
            // Save to IndexedDB
            await this.addToStore('achievements', achievementEntry);
            console.log('Achievement saved locally:', achievementEntry);
            
            // Try to sync immediately if online
            if (this.isOnline) {
                this.syncAchievements();
            }
            
            return achievementEntry;
        } catch (error) {
            console.error('Failed to save achievement:', error);
            throw error;
        }
    }
    
    // Save user progress
    async saveUserProgress(progress) {
        try {
            await this.addToStore('userProgress', {
                ...progress,
                timestamp: Date.now()
            });
            console.log('User progress saved:', progress);
        } catch (error) {
            console.error('Failed to save user progress:', error);
        }
    }
    
    // Get user progress
    async getUserProgress(studentId, subject = null) {
        try {
            const transaction = this.db.transaction(['userProgress'], 'readonly');
            const store = transaction.objectStore('userProgress');
            const index = store.index('studentId');
            
            return new Promise((resolve, reject) => {
                const request = index.getAll(studentId);
                
                request.onsuccess = () => {
                    let results = request.result;
                    
                    if (subject) {
                        results = results.filter(item => item.subject === subject);
                    }
                    
                    resolve(results);
                };
                
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to get user progress:', error);
            return [];
        }
    }
    
    // Sync game logs with server
    async syncGameLogs() {
        if (!this.isOnline) return;
        
        try {
            const unsyncedLogs = await this.getUnsyncedData('gameLogs');
            
            if (unsyncedLogs.length === 0) {
                console.log('No game logs to sync');
                return;
            }
            
            console.log(`Syncing ${unsyncedLogs.length} game logs...`);
            
            const response = await fetch('/api/sync-offline-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ logs: unsyncedLogs })
            });
            
            if (response.ok) {
                // Mark logs as synced
                await this.markAsSynced('gameLogs', unsyncedLogs);
                console.log('Game logs synced successfully');
                
                // Dispatch event for UI updates
                window.dispatchEvent(new CustomEvent('gameLogsSynced', {
                    detail: { count: unsyncedLogs.length }
                }));
            } else {
                console.error('Failed to sync game logs:', response.statusText);
            }
        } catch (error) {
            console.error('Error syncing game logs:', error);
        }
    }
    
    // Sync achievements with server
    async syncAchievements() {
        if (!this.isOnline) return;
        
        try {
            const unsyncedAchievements = await this.getUnsyncedData('achievements');
            
            if (unsyncedAchievements.length === 0) {
                console.log('No achievements to sync');
                return;
            }
            
            console.log(`Syncing ${unsyncedAchievements.length} achievements...`);
            
            for (const achievement of unsyncedAchievements) {
                try {
                    const response = await fetch('/api/achievements', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(achievement)
                    });
                    
                    if (response.ok) {
                        await this.markAsSynced('achievements', [achievement]);
                    }
                } catch (error) {
                    console.error('Failed to sync achievement:', achievement, error);
                }
            }
            
            console.log('Achievements synced successfully');
            
            // Dispatch event for UI updates
            window.dispatchEvent(new CustomEvent('achievementsSynced', {
                detail: { count: unsyncedAchievements.length }
            }));
        } catch (error) {
            console.error('Error syncing achievements:', error);
        }
    }
    
    // Sync all pending data
    async syncPendingData() {
        if (!this.isOnline) return;
        
        console.log('Starting full data sync...');
        
        try {
            await Promise.all([
                this.syncGameLogs(),
                this.syncAchievements()
            ]);
            
            console.log('Full data sync completed');
            
            // Show sync success notification
            this.showSyncNotification('Data synced successfully!', 'success');
        } catch (error) {
            console.error('Error during full sync:', error);
            this.showSyncNotification('Sync failed. Will retry later.', 'error');
        }
    }
    
    // Get unsynced data from a store
    async getUnsyncedData(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('synced');
            const request = index.getAll(false);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Mark data as synced
    async markAsSynced(storeName, items) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        for (const item of items) {
            item.synced = true;
            store.put(item);
        }
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    
    // Add item to IndexedDB store
    async addToStore(storeName, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Cache content for offline use
    async cacheContent(contentId, content, type, grade) {
        const cacheEntry = {
            id: contentId,
            content: content,
            type: type,
            grade: grade,
            cachedAt: Date.now()
        };
        
        try {
            const transaction = this.db.transaction(['cachedContent'], 'readwrite');
            const store = transaction.objectStore('cachedContent');
            store.put(cacheEntry);
            
            console.log('Content cached:', contentId);
        } catch (error) {
            console.error('Failed to cache content:', error);
        }
    }
    
    // Get cached content
    async getCachedContent(contentId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cachedContent'], 'readonly');
            const store = transaction.objectStore('cachedContent');
            const request = store.get(contentId);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result) {
                    // Check if content is still fresh (24 hours)
                    const isStale = Date.now() - result.cachedAt > 24 * 60 * 60 * 1000;
                    if (!isStale) {
                        resolve(result.content);
                        return;
                    }
                }
                resolve(null);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    // Start periodic sync (every 5 minutes when online)
    startPeriodicSync() {
        setInterval(() => {
            if (this.isOnline) {
                this.syncPendingData();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    // Show sync notification to user
    showSyncNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `sync-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Get sync status
    async getSyncStatus() {
        try {
            const [unsyncedLogs, unsyncedAchievements] = await Promise.all([
                this.getUnsyncedData('gameLogs'),
                this.getUnsyncedData('achievements')
            ]);
            
            return {
                isOnline: this.isOnline,
                pendingGameLogs: unsyncedLogs.length,
                pendingAchievements: unsyncedAchievements.length,
                totalPending: unsyncedLogs.length + unsyncedAchievements.length
            };
        } catch (error) {
            console.error('Failed to get sync status:', error);
            return {
                isOnline: this.isOnline,
                pendingGameLogs: 0,
                pendingAchievements: 0,
                totalPending: 0
            };
        }
    }
    
    // Clear all local data (for logout)
    async clearAllData() {
        try {
            const storeNames = ['gameLogs', 'achievements', 'userProgress', 'cachedContent'];
            
            for (const storeName of storeNames) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                store.clear();
            }
            
            console.log('All local data cleared');
        } catch (error) {
            console.error('Failed to clear local data:', error);
        }
    }
    
    // Export data for backup
    async exportData() {
        try {
            const data = {};
            const storeNames = ['gameLogs', 'achievements', 'userProgress'];
            
            for (const storeName of storeNames) {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                data[storeName] = await new Promise((resolve, reject) => {
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }
            
            return data;
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    }
}

// Initialize database sync when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dbSync = new DatabaseSync();
});

// Add CSS for sync notifications
const syncStyles = `
    .sync-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 12px 16px;
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    }
    
    .sync-notification.success {
        border-left: 4px solid #22c55e;
    }
    
    .sync-notification.error {
        border-left: 4px solid #ef4444;
    }
    
    .sync-notification.info {
        border-left: 4px solid #3b82f6;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .notification-message {
        font-size: 14px;
        color: #374151;
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
        .sync-notification {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
        }
    }
`;

// Inject sync styles
const syncStyleSheet = document.createElement('style');
syncStyleSheet.textContent = syncStyles;
document.head.appendChild(syncStyleSheet);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseSync;
}