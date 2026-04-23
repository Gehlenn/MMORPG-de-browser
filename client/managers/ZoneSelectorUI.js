/**
 * ZoneSelectorUI - Client-side UI for zone travel and selection
 * Shows available zones, level requirements, and allows travel
 */

class ZoneSelectorUI {
    constructor(gameplayEngine) {
        this.gameplayEngine = gameplayEngine;
        this.zones = [];
        this.currentZone = 'verdantis';
        this.playerLevel = 1;
        this.isVisible = false;
        
        this.createStyles();
        this.createPanel();
        this.setupSocketListeners();
    }

    /**
     * Initialize zone selector
     */
    initialize() {
        this.setupKeyboardShortcuts();
        console.log('[ZoneSelectorUI] Initialized');
    }

    /**
     * Setup socket listeners
     */
    setupSocketListeners() {
        if (!this.gameplayEngine.socket) return;
        
        // Zone list from server
        this.gameplayEngine.socket.on('zone:list', (data) => {
            this.zones = data.zones;
            this.render();
        });
        
        // Current zone update
        this.gameplayEngine.socket.on('zone:current', (data) => {
            this.currentZone = data.zoneId;
            this.render();
        });
        
        // Zone enter confirmation
        this.gameplayEngine.socket.on('zone:enter_success', (data) => {
            this.showZoneTransition(data);
        });
        
        // Zone enter error
        this.gameplayEngine.socket.on('zone:enter_error', (data) => {
            this.showError(data.error);
        });
    }

    /**
     * Create CSS styles
     */
    createStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .zone-selector {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 700px;
                height: 500px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #e94560;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                z-index: 10000;
                display: none;
                flex-direction: column;
                overflow: hidden;
            }
            
            .zone-selector.visible {
                display: flex;
            }
            
            .zone-header {
                background: linear-gradient(90deg, #e94560, #ff6b6b);
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .zone-title {
                font-size: 22px;
                font-weight: bold;
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .zone-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .zone-close:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }
            
            .zone-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .current-zone {
                background: rgba(233, 69, 96, 0.2);
                border: 1px solid #e94560;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 20px;
            }
            
            .current-zone-label {
                font-size: 12px;
                color: #e94560;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 4px;
            }
            
            .current-zone-name {
                font-size: 20px;
                font-weight: bold;
                color: white;
            }
            
            .zone-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 16px;
            }
            
            .zone-card {
                background: rgba(255,255,255,0.05);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 16px;
                transition: all 0.3s;
                cursor: pointer;
            }
            
            .zone-card:hover {
                background: rgba(255,255,255,0.08);
                transform: translateY(-2px);
            }
            
            .zone-card.current {
                border-color: #e94560;
                background: rgba(233, 69, 96, 0.1);
            }
            
            .zone-card.locked {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .zone-card.locked:hover {
                transform: none;
            }
            
            .zone-header-info {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
            }
            
            .zone-name {
                font-size: 18px;
                font-weight: bold;
                color: white;
            }
            
            .zone-level {
                background: rgba(255,215,0,0.2);
                color: #ffd700;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .zone-level.locked {
                background: rgba(255,0,0,0.2);
                color: #ff4444;
            }
            
            .zone-description {
                font-size: 13px;
                color: #aaa;
                margin-bottom: 12px;
                line-height: 1.4;
            }
            
            .zone-features {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 12px;
            }
            
            .zone-feature {
                background: rgba(255,255,255,0.1);
                padding: 3px 8px;
                border-radius: 8px;
                font-size: 11px;
                color: #ccc;
            }
            
            .zone-stats {
                display: flex;
                gap: 16px;
                font-size: 12px;
                color: #888;
            }
            
            .zone-stat {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .zone-status {
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            
            .zone-status-text {
                font-size: 12px;
                font-weight: bold;
            }
            
            .zone-status-text.available {
                color: #4CAF50;
            }
            
            .zone-status-text.locked {
                color: #ff4444;
            }
            
            .zone-status-text.current {
                color: #e94560;
            }
            
            .zone-travel-btn {
                width: 100%;
                margin-top: 12px;
                padding: 10px;
                background: linear-gradient(135deg, #e94560, #ff6b6b);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .zone-travel-btn:hover {
                transform: scale(1.02);
                box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
            }
            
            .zone-travel-btn:disabled {
                background: #444;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            /* Zone Transition Overlay */
            .zone-transition {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: black;
                z-index: 10001;
                display: none;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }
            
            .zone-transition.visible {
                display: flex;
                animation: zoneFadeIn 0.5s ease;
            }
            
            @keyframes zoneFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .zone-transition-text {
                color: white;
                font-size: 24px;
                margin-bottom: 20px;
            }
            
            .zone-transition-name {
                color: #e94560;
                font-size: 36px;
                font-weight: bold;
                animation: zonePulse 2s infinite;
            }
            
            @keyframes zonePulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
            
            /* Responsive */
            @media (max-width: 750px) {
                .zone-selector {
                    width: 95vw;
                    height: 80vh;
                }
                
                .zone-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Create the zone selector panel
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'zone-selector';
        this.panel.innerHTML = `
            <div class="zone-header">
                <div class="zone-title">
                    <span>🗺️</span>
                    <span>Viajar para Zona</span>
                </div>
                <button class="zone-close" onclick="window.zoneSelectorUI.hide()">×</button>
            </div>
            <div class="zone-content">
                <div class="current-zone">
                    <div class="current-zone-label">Zona Atual</div>
                    <div class="current-zone-name" id="current-zone-name">Verdantis</div>
                </div>
                <div class="zone-grid" id="zone-grid"></div>
            </div>
        `;
        
        // Create transition overlay
        this.transition = document.createElement('div');
        this.transition.className = 'zone-transition';
        this.transition.innerHTML = `
            <div class="zone-transition-text">Viajando para</div>
            <div class="zone-transition-name" id="transition-zone-name"></div>
        `;
        
        document.body.appendChild(this.panel);
        document.body.appendChild(this.transition);
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Z' && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Show zone selector
     */
    show() {
        this.isVisible = true;
        this.panel.classList.add('visible');
        this.requestZoneList();
    }

    /**
     * Hide zone selector
     */
    hide() {
        this.isVisible = false;
        this.panel.classList.remove('visible');
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Request zones from server
     */
    requestZoneList() {
        if (this.gameplayEngine.socket) {
            this.gameplayEngine.socket.emit('zone:get_list');
        } else {
            // Fallback: show hardcoded zones
            this.loadDefaultZones();
        }
    }

    /**
     * Load default zones (fallback)
     */
    loadDefaultZones() {
        this.zones = [
            {
                id: 'verdantis',
                name: 'Verdantis',
                description: 'Florestas verdes e ponto de partida para novos aventureiros.',
                levelRange: { min: 1, max: 20 },
                features: ['floresta', 'lago', 'aldeia'],
                connectedZones: ['eldoria']
            },
            {
                id: 'eldoria',
                name: 'Eldoria',
                description: 'O reino central de Aethelgard, coração político e religioso.',
                levelRange: { min: 20, max: 40 },
                features: ['castelos', 'templos', 'cidades'],
                connectedZones: ['verdantis', 'aurelia']
            },
            {
                id: 'aurelia',
                name: 'Aurélia',
                description: 'Desertos dourados com ruínas antigas e segredos enterrados.',
                levelRange: { min: 40, max: 60 },
                features: ['pirâmides', 'oásis', 'ruínas'],
                connectedZones: ['eldoria', 'draconia']
            },
            {
                id: 'draconia',
                name: 'Dracônia',
                description: 'Montanhas vulcânicas onde dragões ancestrais fazem seus ninhos.',
                levelRange: { min: 60, max: 80 },
                features: ['vulcões', 'ninhos', 'cavernas'],
                connectedZones: ['aurelia']
            }
        ];
        
        this.render();
    }

    /**
     * Render zones
     */
    render() {
        const currentNameEl = document.getElementById('current-zone-name');
        const grid = document.getElementById('zone-grid');
        
        if (currentNameEl) {
            const currentZone = this.zones.find(z => z.id === this.currentZone);
            currentNameEl.textContent = currentZone ? currentZone.name : this.currentZone;
        }
        
        if (!grid) return;
        
        grid.innerHTML = this.zones.map(zone => this.createZoneCard(zone)).join('');
    }

    /**
     * Create zone card HTML
     */
    createZoneCard(zone) {
        const isCurrent = zone.id === this.currentZone;
        const canEnter = this.playerLevel >= zone.levelRange.min;
        const isLocked = !canEnter && !isCurrent;
        
        const statusClass = isCurrent ? 'current' : (canEnter ? 'available' : 'locked');
        const statusText = isCurrent ? 'ZONA ATUAL' : (canEnter ? 'DISPONÍVEL' : `REQUER NÍVEL ${zone.levelRange.min}`);
        
        return `
            <div class="zone-card ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}">
                <div class="zone-header-info">
                    <div class="zone-name">${zone.name}</div>
                    <div class="zone-level ${isLocked ? 'locked' : ''}">
                        ${zone.levelRange.min}-${zone.levelRange.max}
                    </div>
                </div>
                <div class="zone-description">${zone.description}</div>
                <div class="zone-features">
                    ${zone.features.map(f => `<span class="zone-feature">${f}</span>`).join('')}
                </div>
                <div class="zone-stats">
                    <div class="zone-stat">🗡️ Mobs: ${zone.levelRange.min}-${zone.levelRange.max}</div>
                    <div class="zone-stat">👥 Jogadores: ${zone.playerCount || 0}</div>
                </div>
                <div class="zone-status">
                    <span class="zone-status-text ${statusClass}">${statusText}</span>
                </div>
                ${!isCurrent && canEnter ? `
                    <button class="zone-travel-btn" onclick="window.zoneSelectorUI.travel('${zone.id}')">
                        Viajar
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Travel to zone
     */
    travel(zoneId) {
        if (this.gameplayEngine.socket) {
            this.gameplayEngine.socket.emit('zone:travel_request', { zoneId });
        } else {
            // Fallback: just show transition
            this.showZoneTransition({ zoneId, name: this.zones.find(z => z.id === zoneId)?.name || zoneId });
        }
        
        this.hide();
    }

    /**
     * Show zone transition
     */
    showZoneTransition(data) {
        const zoneName = data.name || data.zoneId;
        const transitionNameEl = document.getElementById('transition-zone-name');
        
        if (transitionNameEl) {
            transitionNameEl.textContent = zoneName;
        }
        
        this.transition.classList.add('visible');
        
        // Play transition sound if available
        if (this.gameplayEngine.audioManager) {
            this.gameplayEngine.audioManager.playSFX('zone_transition');
        }
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.transition.classList.remove('visible');
            this.currentZone = data.zoneId;
            this.render();
        }, 3000);
    }

    /**
     * Show error
     */
    showError(message) {
        if (this.gameplayEngine.toastManager) {
            this.gameplayEngine.toastManager.show(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * Update player level
     */
    setPlayerLevel(level) {
        this.playerLevel = level;
        this.render();
    }

    /**
     * Get current zone
     */
    getCurrentZone() {
        return this.currentZone;
    }

    /**
     * Check if player can enter zone
     */
    canEnterZone(zoneId) {
        const zone = this.zones.find(z => z.id === zoneId);
        if (!zone) return false;
        return this.playerLevel >= zone.levelRange.min;
    }
}

// Expose to window
window.ZoneSelectorUI = ZoneSelectorUI;
