/**
 * WorldMap.js
 * World map interface for zone navigation
 * Phase 3: Eldoria Zone
 */

class WorldMap {
    constructor(socket, zoneManager) {
        this.socket = socket;
        this.zoneManager = zoneManager;
        this.isOpen = false;
        
        // Map data
        this.zones = new Map();
        this.discoveredZones = new Set(['verdantis']);
        this.currentZone = 'verdantis';
        this.playerPosition = { x: 400, y: 300 };
        
        // Map configuration
        this.mapConfig = {
            verdantis: {
                id: 'verdantis',
                name: 'Verdantis',
                subtitle: 'The Living Forest',
                levelRange: '1-20',
                color: '#2E7D32',
                icon: '🌲',
                x: 200,
                y: 200,
                size: 120,
                description: 'Lush forests where your journey begins. Home to basic wildlife and beginner quests.',
                discovered: true,
                portals: [
                    { name: 'Eastern Gate', target: 'eldoria', x: 320, y: 200, levelReq: 20 }
                ]
            },
            eldoria: {
                id: 'eldoria',
                name: 'Eldoria',
                subtitle: 'The Central Kingdom',
                levelRange: '20-40',
                color: '#1565C0',
                icon: '🏰',
                x: 500,
                y: 200,
                size: 150,
                description: 'A medieval kingdom with vast forests, iron mines, and King Eldor\'s castle.',
                discovered: false,
                locked: true,
                portals: [
                    { name: 'Western Pass', target: 'verdantis', x: 380, y: 200, levelReq: 1 }
                ]
            },
            aurelia: {
                id: 'aurelia',
                name: 'Aurélia',
                subtitle: 'The Golden Desert',
                levelRange: '40-60',
                color: '#F9A825',
                icon: '🏜️',
                x: 800,
                y: 200,
                size: 140,
                description: 'Ancient desert with ruins and treasures. Coming in Phase 4.',
                discovered: false,
                locked: true,
                comingSoon: true
            }
        };
        
        this.setupSocketListeners();
        this.createDOM();
    }
    
    createDOM() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'world-map';
        this.container.className = 'world-map hidden';
        this.container.innerHTML = `
            <div class="map-overlay"></div>
            <div class="map-container">
                <div class="map-header">
                    <h2>🗺️ World Map</h2>
                    <button class="map-close-btn">&times;</button>
                </div>
                <div class="map-content">
                    <div class="map-canvas-container">
                        <canvas id="map-canvas" width="1000" height="500"></canvas>
                        <div class="map-legend">
                            <div class="legend-item">
                                <span class="legend-icon" style="background: #2E7D32;"></span>
                                <span>Current Zone</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-icon discovered"></span>
                                <span>Discovered</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-icon locked"></span>
                                <span>Locked</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-icon portal"></span>
                                <span>Portal</span>
                            </div>
                        </div>
                    </div>
                    <div class="map-sidebar">
                        <div class="zone-info" id="zone-info">
                            <div class="zone-info-placeholder">
                                <p>Hover over a zone to see details</p>
                                <p>Click a discovered zone to travel</p>
                            </div>
                        </div>
                        <div class="player-location">
                            <h4>Current Location</h4>
                            <p id="current-zone-name">Verdantis</p>
                            <p id="current-coords">X: 400, Y: 300</p>
                        </div>
                        <div class="fast-travel">
                            <h4>Fast Travel</h4>
                            <div id="fast-travel-list">
                                <p class="no-travel">No locations discovered yet</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="map-footer">
                    <div class="map-hints">
                        <span>Press <kbd>M</kbd> to toggle</span>
                        <span>Click zone to travel</span>
                        <span>Hover for details</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Get canvas
        this.canvas = this.container.querySelector('#map-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Close button
        this.container.querySelector('.map-close-btn').addEventListener('click', () => {
            this.close();
        });
        
        // Canvas interactions
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
        
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' || e.key === 'M') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                this.toggle();
            }
            
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // Close on overlay click
        this.container.querySelector('.map-overlay').addEventListener('click', () => {
            this.close();
        });
    }
    
    setupSocketListeners() {
        // Zone info update
        this.socket.on('zone:info', (data) => {
            if (data.success) {
                this.updateZoneInfo(data.zoneId, data.zoneInfo);
            }
        });
        
        // Zone discovery
        this.socket.on('zone:discovered', (data) => {
            this.discoverZone(data.zoneId);
        });
        
        // Position update
        this.socket.on('player:position', (data) => {
            this.playerPosition = { x: data.x, y: data.y };
            this.updatePlayerMarker();
        });
        
        // Current zone
        this.socket.on('player:zone_changed', (data) => {
            this.currentZone = data.zoneId;
            this.discoverZone(data.zoneId);
            this.render();
            this.updateSidebar();
        });
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if hovering over a zone
        const hoveredZone = this.getZoneAt(x, y);
        
        if (hoveredZone) {
            this.canvas.style.cursor = hoveredZone.discovered ? 'pointer' : 'not-allowed';
            this.showZoneInfo(hoveredZone);
            this.highlightZone(hoveredZone.id);
        } else {
            this.canvas.style.cursor = 'default';
            this.clearHighlight();
        }
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const zone = this.getZoneAt(x, y);
        
        if (zone && zone.discovered && !zone.comingSoon) {
            if (zone.id === this.currentZone) {
                this.showNotification('You are already in this zone', 'info');
                return;
            }
            
            // Check for portal
            const portal = this.getPortalToZone(zone.id);
            if (portal) {
                this.requestTravel(zone.id, portal);
            } else {
                this.showNotification('No known path to this zone', 'error');
            }
        }
    }
    
    getZoneAt(x, y) {
        for (const [id, zone] of Object.entries(this.mapConfig)) {
            const dx = x - zone.x;
            const dy = y - zone.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= zone.size / 2) {
                return {
                    ...zone,
                    discovered: this.discoveredZones.has(id)
                };
            }
        }
        return null;
    }
    
    getPortalToZone(zoneId) {
        const currentZoneConfig = this.mapConfig[this.currentZone];
        if (!currentZoneConfig || !currentZoneConfig.portals) return null;
        
        return currentZoneConfig.portals.find(p => p.target === zoneId);
    }
    
    highlightZone(zoneId) {
        this.highlightedZone = zoneId;
        this.render();
    }
    
    clearHighlight() {
        this.highlightedZone = null;
        this.render();
    }
    
    showZoneInfo(zone) {
        const infoPanel = this.container.querySelector('#zone-info');
        
        const travelButton = zone.discovered && !zone.comingSoon && zone.id !== this.currentZone
            ? `<button class="travel-btn" data-zone="${zone.id}">Travel Here</button>`
            : '';
        
        const lockedBadge = zone.locked && !zone.discovered
            ? `<span class="zone-badge locked">🔒 Locked</span>`
            : '';
        
        const currentBadge = zone.id === this.currentZone
            ? `<span class="zone-badge current">📍 Current</span>`
            : '';
        
        const comingSoonBadge = zone.comingSoon
            ? `<span class="zone-badge soon">🔜 Coming Soon</span>`
            : '';
        
        infoPanel.innerHTML = `
            <div class="zone-header">
                <h3>${zone.icon} ${zone.name}</h3>
                <div class="zone-badges">
                    ${currentBadge}
                    ${lockedBadge}
                    ${comingSoonBadge}
                </div>
            </div>
            <p class="zone-subtitle">${zone.subtitle}</p>
            <p class="zone-levels">Level Range: <strong>${zone.levelRange}</strong></p>
            <p class="zone-description">${zone.description}</p>
            ${travelButton}
        `;
        
        // Bind travel button
        const travelBtn = infoPanel.querySelector('.travel-btn');
        if (travelBtn) {
            travelBtn.addEventListener('click', () => {
                const portal = this.getPortalToZone(zone.id);
                if (portal) {
                    this.requestTravel(zone.id, portal);
                }
            });
        }
    }
    
    requestTravel(zoneId, portal) {
        // Show confirmation
        if (!confirm(`Travel to ${this.mapConfig[zoneId].name}?\n\nRequired Level: ${portal.levelReq}\nCost: Free (first time)`)) {
            return;
        }
        
        this.socket.emit('zone:travel_request', {
            targetZone: zoneId,
            portalId: portal.target
        }, (response) => {
            if (response.success) {
                this.close();
                this.showNotification(`Traveling to ${this.mapConfig[zoneId].name}...`, 'success');
            } else {
                this.showNotification(response.error || 'Travel failed', 'error');
            }
        });
    }
    
    discoverZone(zoneId) {
        this.discoveredZones.add(zoneId);
        
        if (this.mapConfig[zoneId]) {
            this.mapConfig[zoneId].discovered = true;
            this.mapConfig[zoneId].locked = false;
        }
        
        this.updateFastTravelList();
        this.render();
    }
    
    updateZoneInfo(zoneId, info) {
        if (this.mapConfig[zoneId]) {
            Object.assign(this.mapConfig[zoneId], info);
        }
    }
    
    updateSidebar() {
        const zoneName = this.container.querySelector('#current-zone-name');
        const coords = this.container.querySelector('#current-coords');
        
        if (zoneName && this.mapConfig[this.currentZone]) {
            zoneName.textContent = this.mapConfig[this.currentZone].name;
        }
        
        if (coords) {
            coords.textContent = `X: ${Math.floor(this.playerPosition.x)}, Y: ${Math.floor(this.playerPosition.y)}`;
        }
    }
    
    updateFastTravelList() {
        const list = this.container.querySelector('#fast-travel-list');
        
        if (this.discoveredZones.size <= 1) {
            list.innerHTML = '<p class="no-travel">Discover more zones to unlock fast travel</p>';
            return;
        }
        
        const discovered = Array.from(this.discoveredZones);
        list.innerHTML = discovered.map(zoneId => {
            const zone = this.mapConfig[zoneId];
            if (!zone) return '';
            
            const isCurrent = zoneId === this.currentZone;
            const buttonClass = isCurrent ? 'current-location' : 'travel-available';
            const disabled = isCurrent ? 'disabled' : '';
            
            return `
                <button class="fast-travel-btn ${buttonClass}" data-zone="${zoneId}" ${disabled}>
                    ${zone.icon} ${zone.name}
                    ${isCurrent ? ' (Current)' : ''}
                </button>
            `;
        }).join('');
        
        // Bind fast travel buttons
        list.querySelectorAll('.fast-travel-btn:not(.current-location)').forEach(btn => {
            btn.addEventListener('click', () => {
                const zoneId = btn.dataset.zone;
                const portal = this.getPortalToZone(zoneId);
                if (portal) {
                    this.requestTravel(zoneId, portal);
                }
            });
        });
    }
    
    render() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections between zones
        this.drawConnections();
        
        // Draw zones
        for (const [id, zone] of Object.entries(this.mapConfig)) {
            this.drawZone(zone);
        }
        
        // Draw player marker
        this.drawPlayerMarker();
    }
    
    drawConnections() {
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        // Draw portal connections
        for (const [id, zone] of Object.entries(this.mapConfig)) {
            if (zone.portals) {
                for (const portal of zone.portals) {
                    const targetZone = this.mapConfig[portal.target];
                    if (targetZone) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(zone.x, zone.y);
                        this.ctx.lineTo(targetZone.x, targetZone.y);
                        this.ctx.stroke();
                    }
                }
            }
        }
        
        this.ctx.setLineDash([]);
    }
    
    drawZone(zone) {
        const isDiscovered = this.discoveredZones.has(zone.id);
        const isCurrent = zone.id === this.currentZone;
        const isHighlighted = this.highlightedZone === zone.id;
        
        // Zone circle
        this.ctx.beginPath();
        this.ctx.arc(zone.x, zone.y, zone.size / 2, 0, Math.PI * 2);
        
        if (isCurrent) {
            // Current zone - pulsing effect
            this.ctx.fillStyle = zone.color;
            this.ctx.shadowColor = zone.color;
            this.ctx.shadowBlur = 20;
        } else if (isDiscovered) {
            this.ctx.fillStyle = this.adjustColor(zone.color, -40);
            this.ctx.shadowBlur = 0;
        } else {
            // Undiscovered - gray
            this.ctx.fillStyle = '#444';
            this.ctx.shadowBlur = 0;
        }
        
        if (isHighlighted) {
            this.ctx.shadowColor = '#fff';
            this.ctx.shadowBlur = 30;
        }
        
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Border
        this.ctx.strokeStyle = isCurrent ? '#fff' : (isDiscovered ? zone.color : '#666');
        this.ctx.lineWidth = isCurrent ? 4 : 2;
        this.ctx.stroke();
        
        // Zone icon
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(zone.icon, zone.x, zone.y - 10);
        
        // Zone name
        this.ctx.font = '14px Arial';
        this.ctx.fillText(zone.name, zone.x, zone.y + 20);
        
        // Level range
        if (isDiscovered) {
            this.ctx.font = '11px Arial';
            this.ctx.fillStyle = '#aaa';
            this.ctx.fillText(zone.levelRange, zone.x, zone.y + 35);
        }
        
        // Lock icon for locked zones
        if (!isDiscovered && zone.locked) {
            this.ctx.font = '16px Arial';
            this.ctx.fillText('🔒', zone.x + zone.size / 2 - 15, zone.y - zone.size / 2 + 15);
        }
    }
    
    drawPlayerMarker() {
        // Get current zone position
        const currentZoneConfig = this.mapConfig[this.currentZone];
        if (!currentZoneConfig) return;
        
        // Calculate position relative to zone
        // For simplicity, show marker near center of current zone with slight offset
        const markerX = currentZoneConfig.x + (this.playerPosition.x / 1000 - 0.5) * 40;
        const markerY = currentZoneConfig.y + (this.playerPosition.y / 1000 - 0.5) * 40;
        
        // Draw player marker
        this.ctx.beginPath();
        this.ctx.arc(markerX, markerY, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fill();
        
        // Pulse ring
        this.ctx.beginPath();
        this.ctx.arc(markerX, markerY, 12 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    updatePlayerMarker() {
        this.render();
    }
    
    adjustColor(color, amount) {
        // Simple color adjustment
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    open() {
        this.container.classList.remove('hidden');
        this.isOpen = true;
        this.render();
        this.updateSidebar();
        this.updateFastTravelList();
        
        // Request current zone info
        this.socket.emit('zone:get_info', { zoneId: this.currentZone });
    }
    
    close() {
        this.container.classList.add('hidden');
        this.isOpen = false;
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    showNotification(message, type) {
        if (window.gameNotification) {
            window.gameNotification.show(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
    
    hideTooltip() {
        // Tooltip is handled by zone info panel
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WorldMap;
}
