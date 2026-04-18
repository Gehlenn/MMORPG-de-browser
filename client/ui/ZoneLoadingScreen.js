/**
 * ZoneLoadingScreen.js
 * Loading screen for zone transitions
 * Phase 3: Eldoria Zone
 */

class ZoneLoadingScreen {
    constructor() {
        this.isShowing = false;
        this.currentTip = null;
        this.loadingStartTime = null;
        
        // Tips database
        this.tips = {
            verdantis: [
                'Verdantis is home to peaceful wildlife and beginner quests.',
                'Collect herbs and resources while exploring the forest.',
                'Talk to NPCs in the starting village for quests.',
                'Train your combat skills on Slimes and Goblins.',
                'Save your gold - you\'ll need it for better equipment!'
            ],
            eldoria: [
                'Bring potions for the Iron Mines - the Golems hit hard!',
                'Royal Guards are neutral unless you attack civilians.',
                'King Eldor requires a team of 3-5 players to defeat.',
                'Watch out for Bandits in the Royal Forest - they steal gold!',
                'The Cave Troll regenerates health - burst it down quickly!',
                'Iron Golems are vulnerable to magic damage.',
                'Don\'t wander into Castle Grounds alone at low level!',
                'King Eldor\'s enrage timer is 5 minutes - be quick!'
            ],
            aurelia: [
                'Aurélia is coming in Phase 4 - prepare for desert adventures!',
                'Ancient Constructs are resistant to magic.',
                'Bring water for the desert... just kidding, it\'s a game!'
            ]
        };
        
        // Zone art/descriptions
        this.zoneData = {
            verdantis: {
                name: 'Verdantis',
                subtitle: 'The Living Forest',
                color: '#2E7D32',
                icon: '🌲',
                music: 'forest_ambient',
                estimatedLoad: '2-3 seconds'
            },
            eldoria: {
                name: 'Eldoria',
                subtitle: 'The Central Kingdom',
                color: '#1565C0',
                icon: '🏰',
                music: 'medieval_theme',
                estimatedLoad: '3-4 seconds'
            },
            aurelia: {
                name: 'Aurélia',
                subtitle: 'The Golden Desert',
                color: '#F9A825',
                icon: '🏜️',
                music: 'desert_wind',
                estimatedLoad: '3-4 seconds'
            }
        };
        
        this.createDOM();
    }
    
    createDOM() {
        this.container = document.createElement('div');
        this.container.id = 'zone-loading-screen';
        this.container.className = 'zone-loading hidden';
        this.container.innerHTML = `
            <div class="loading-content">
                <div class="loading-art">
                    <div class="zone-icon" id="loading-icon">🏰</div>
                    <div class="loading-particles"></div>
                </div>
                
                <div class="loading-text">
                    <h2 id="loading-zone-name">Eldoria</h2>
                    <p class="zone-subtitle" id="loading-zone-subtitle">The Central Kingdom</p>
                    <div class="loading-bar-container">
                        <div class="loading-bar" id="loading-bar"></div>
                    </div>
                    <p class="loading-status" id="loading-status">Loading zone data...</p>
                </div>
                
                <div class="loading-tip">
                    <div class="tip-icon">💡</div>
                    <div class="tip-content">
                        <span class="tip-label">Tip:</span>
                        <p id="loading-tip-text">Bring potions for the Iron Mines!</p>
                    </div>
                </div>
                
                <div class="loading-stats">
                    <span id="load-time">Est. time: 3-4 seconds</span>
                    <span id="loading-progress">0%</span>
                </div>
            </div>
            
            <div class="loading-background" id="loading-bg"></div>
        `;
        
        document.body.appendChild(this.container);
        
        // Cache elements
        this.elements = {
            icon: this.container.querySelector('#loading-icon'),
            zoneName: this.container.querySelector('#loading-zone-name'),
            zoneSubtitle: this.container.querySelector('#loading-zone-subtitle'),
            loadingBar: this.container.querySelector('#loading-bar'),
            status: this.container.querySelector('#loading-status'),
            tipText: this.container.querySelector('#loading-tip-text'),
            loadTime: this.container.querySelector('#load-time'),
            progress: this.container.querySelector('#loading-progress'),
            background: this.container.querySelector('#loading-bg')
        };
    }
    
    /**
     * Show loading screen for zone
     */
    show(zoneId, customData = {}) {
        const zone = this.zoneData[zoneId] || this.zoneData.verdantis;
        
        this.isShowing = true;
        this.loadingStartTime = Date.now();
        
        // Update content
        this.elements.icon.textContent = zone.icon;
        this.elements.zoneName.textContent = customData.name || zone.name;
        this.elements.zoneSubtitle.textContent = customData.subtitle || zone.subtitle;
        this.elements.loadTime.textContent = `Est. time: ${zone.estimatedLoad}`;
        
        // Random tip
        const tips = this.tips[zoneId] || this.tips.verdantis;
        this.currentTip = tips[Math.floor(Math.random() * tips.length)];
        this.elements.tipText.textContent = this.currentTip;
        
        // Update background color
        this.elements.background.style.background = `linear-gradient(135deg, ${zone.color}22, #1a1a2e)`;
        
        // Reset loading bar
        this.elements.loadingBar.style.width = '0%';
        this.elements.progress.textContent = '0%';
        this.elements.status.textContent = 'Connecting to server...';
        
        // Show
        this.container.classList.remove('hidden');
        
        // Start loading animation
        this.startLoadingAnimation();
        
        // Emit event
        this.emit('loading:started', { zoneId, zone });
    }
    
    /**
     * Start loading animation
     */
    startLoadingAnimation() {
        const stages = [
            { progress: 15, status: 'Loading zone assets...', delay: 300 },
            { progress: 35, status: 'Generating terrain...', delay: 600 },
            { progress: 55, status: 'Spawning entities...', delay: 900 },
            { progress: 75, status: 'Synchronizing players...', delay: 1200 },
            { progress: 90, status: 'Finalizing...', delay: 1500 },
            { progress: 100, status: 'Entering zone...', delay: 1800 }
        ];
        
        stages.forEach(stage => {
            setTimeout(() => {
                if (this.isShowing) {
                    this.updateProgress(stage.progress, stage.status);
                }
            }, stage.delay);
        });
    }
    
    /**
     * Update loading progress
     */
    updateProgress(percent, status) {
        this.elements.loadingBar.style.width = `${percent}%`;
        this.elements.progress.textContent = `${percent}%`;
        if (status) {
            this.elements.status.textContent = status;
        }
    }
    
    /**
     * Hide loading screen
     */
    hide() {
        if (!this.isShowing) return;
        
        // Ensure we show 100% before hiding
        this.updateProgress(100, 'Complete!');
        
        setTimeout(() => {
            this.container.classList.add('hidden');
            this.isShowing = false;
            
            const loadTime = Date.now() - this.loadingStartTime;
            this.emit('loading:complete', { loadTime });
        }, 500);
    }
    
    /**
     * Quick hide (for errors)
     */
    hideImmediate() {
        this.container.classList.add('hidden');
        this.isShowing = false;
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.elements.status.textContent = `Error: ${message}`;
        this.elements.status.style.color = '#e94560';
        this.elements.loadingBar.style.background = '#e94560';
        
        // Auto hide after delay
        setTimeout(() => {
            this.hideImmediate();
            // Reset styles
            setTimeout(() => {
                this.elements.status.style.color = '';
                this.elements.loadingBar.style.background = '';
            }, 300);
        }, 3000);
    }
    
    /**
     * Check if currently loading
     */
    isLoading() {
        return this.isShowing;
    }
    
    /**
     * Get current load time
     */
    getLoadTime() {
        if (!this.loadingStartTime) return 0;
        return Date.now() - this.loadingStartTime;
    }
    
    /**
     * Event emitter helpers
     */
    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
    
    on(eventName, callback) {
        document.addEventListener(eventName, (e) => callback(e.detail));
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZoneLoadingScreen;
}
