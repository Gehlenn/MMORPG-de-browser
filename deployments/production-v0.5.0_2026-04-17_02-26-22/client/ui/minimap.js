/**
 * Minimap System - Real-time Miniature World Map
 * Displays player position, mobs, cities, POI, and events
 * Version 0.3 - First Playable Gameplay Systems
 */

class Minimap {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.ctx = game.ctx;
        
        // Minimap configuration
        this.config = {
            position: { x: 'right', y: 'top' },
            size: { width: 200, height: 200 },
            scale: 0.1, // 10% of world size
            updateRate: 1000, // Update every second
            maxZoom: 2.0,
            minZoom: 0.5,
            
            // Colors
            colors: {
                background: 'rgba(0, 0, 0, 0.8)',
                border: '#444444',
                player: '#00ff00',
                otherPlayer: '#4488ff',
                mob: '#ff4444',
                elite: '#ff8800',
                boss: '#ff00ff',
                city: '#ffff00',
                poi: '#00ffff',
                dungeon: '#ff00ff',
                event: '#ffaa00',
                explored: 'rgba(255, 255, 255, 0.1)',
                unexplored: 'rgba(0, 0, 0, 0.8)',
                grid: 'rgba(255, 255, 255, 0.05)'
            },
            
            // Icons
            iconSize: 4,
            playerIconSize: 6,
            
            // Fog of war
            fogRadius: 50, // pixels
            fadeDistance: 10
        };
        
        // World data
        this.world = {
            width: 5000,
            height: 5000,
            chunks: new Map(),
            explored: new Set()
        };
        
        // Entities on minimap
        this.entities = {
            player: null,
            otherPlayers: new Map(),
            mobs: new Map(),
            cities: new Map(),
            poi: new Map(),
            dungeons: new Map(),
            events: new Map()
        };
        
        // UI elements
        this.elements = {};
        
        // State
        this.visible = true;
        this.zoom = 1.0;
        this.lastUpdate = 0;
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.createMinimapUI();
        this.setupEventListeners();
        this.startUpdateLoop();
        
        console.log('Minimap System initialized');
    }
    
    createMinimapUI() {
        // Create minimap container
        const container = document.createElement('div');
        container.id = 'minimap-container';
        container.style.cssText = `
                    <span>Mapa</span>
                </div>
                <div class="minimap-controls">
                    <button class="minimap-zoom-in" title="Aumentar zoom">+</button>
                    <button class="minimap-zoom-out" title="Diminuir zoom">-</button>
                    <button class="minimap-toggle" title="Minimizar">_</button>
                </div>
            </div>
            <div class="minimap-viewport">
                <canvas class="minimap-canvas" width="200" height="200"></canvas>
                <div class="minimap-overlay">
                    <div class="coordinates">X: 0, Y: 0</div>
                    <div class="biome-info">Floresta</div>
                </div>
            </div>
            <div class="minimap-legend">
                <div class="legend-item">
                    <span class="legend-color player"></span>
                    <span>Jogador</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color poi"></span>
                    <span>POI</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color monster"></span>
                    <span>Monstro</span>
                </div>
                <div class="legend-item">
                    <span class="legend-color explored"></span>
                    <span>Explorado</span>
                </div>
            </div>
        `;
        
        // Style the minimap
        minimapContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 220px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 40, 0.9));
            border: 2px solid rgba(100, 150, 255, 0.3);
            border-radius: 12px;
            color: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 11px;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        `;
        
        // Add to DOM
        document.body.appendChild(minimapContainer);
        
        // Get references
        this.canvas = minimapContainer.querySelector('.minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.controls = minimapContainer;
        this.coordinatesDisplay = minimapContainer.querySelector('.coordinates');
        this.biomeDisplay = minimapContainer.querySelector('.biome-info');
        
        // Style sub-elements
        this.styleMinimapElements(minimapContainer);
        
        // Setup drag functionality
        this.setupDragHandling(minimapContainer);
        
        // Replace canvas reference
        const oldCanvas = this.container?.querySelector('.minimap-canvas');
        if (oldCanvas) {
            oldCanvas.parentNode.replaceChild(this.canvas, oldCanvas);
        }
    }
    
    styleMinimapElements(container) {
        // Header styling
        const header = container.querySelector('.minimap-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background: linear-gradient(90deg, rgba(100, 150, 255, 0.2), rgba(50, 100, 200, 0.1));
            border-bottom: 1px solid rgba(100, 150, 255, 0.3);
            border-radius: 10px 10px 0 0;
            cursor: move;
        `;
        
        // Title styling
        const title = container.querySelector('.minimap-title');
        title.style.cssText = `
            display: flex;
            align-items: center;
            font-weight: bold;
            font-size: 12px;
            color: #6495ff;
        `;
        
        const icon = container.querySelector('.minimap-icon');
        icon.style.cssText = `
            margin-right: 6px;
            font-size: 14px;
        `;
        
        // Controls styling
        const controls = container.querySelector('.minimap-controls');
        controls.style.cssText = `
            display: flex;
            gap: 4px;
        `;
        
        // Button styling
        const buttons = container.querySelectorAll('.minimap-controls button');
        buttons.forEach(button => {
            button.style.cssText = `
                background: rgba(100, 150, 255, 0.2);
                border: 1px solid rgba(100, 150, 255, 0.4);
                color: #ffffff;
                width: 20px;
                height: 20px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            `;
            
            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(100, 150, 255, 0.4)';
                button.style.transform = 'scale(1.1)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = 'rgba(100, 150, 255, 0.2)';
                button.style.transform = 'scale(1)';
            });
        });
        
        // Viewport styling
        const viewport = container.querySelector('.minimap-viewport');
        viewport.style.cssText = `
            position: relative;
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.3);
        `;
        
        // Canvas styling
        this.canvas.style.cssText = `
            border: 1px solid rgba(100, 150, 255, 0.2);
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.5);
        `;
        
        // Overlay styling
        const overlay = container.querySelector('.minimap-overlay');
        overlay.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        `;
        
        const coordinates = container.querySelector('.coordinates');
        coordinates.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            color: #ccc;
            align-self: flex-start;
        `;
        
        const biomeInfo = container.querySelector('.biome-info');
        biomeInfo.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            color: #6495ff;
            align-self: flex-end;
        `;
        
        // Legend styling
        const legend = container.querySelector('.minimap-legend');
        legend.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(100, 150, 255, 0.2);
            border-radius: 0 0 10px 10px;
        `;
        
        // Legend items
        const legendItems = container.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 9px;
                color: #ccc;
            `;
        });
        
        // Legend colors
        const legendColors = container.querySelectorAll('.legend-color');
        legendColors.forEach(color => {
            color.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 2px;
            `;
        });
        
        container.querySelector('.legend-color.player').style.background = '#4ade80';
        container.querySelector('.legend-color.poi').style.background = '#f59e0b';
        container.querySelector('.legend-color.monster').style.background = '#ef4444';
        container.querySelector('.legend-color.explored').style.background = '#6495ff';
    }
    
    setupDragHandling(container) {
        const header = container.querySelector('.minimap-header');
        
        header.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragOffset.x = e.clientX - container.offsetLeft;
            this.dragOffset.y = e.clientY - container.offsetTop;
            header.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            container.style.left = x + 'px';
            container.style.top = y + 'px';
            container.style.right = 'auto';
        });
        
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            header.style.cursor = 'move';
        });
    }
    
    setupEventHandlers() {
        // Zoom controls
        const zoomInBtn = this.controls.querySelector('.minimap-zoom-in');
        const zoomOutBtn = this.controls.querySelector('.minimap-zoom-out');
        
        zoomInBtn.addEventListener('click', () => {
            this.settings.zoom = Math.min(this.settings.zoom * 1.2, 3.0);
            this.render();
        });
        
        zoomOutBtn.addEventListener('click', () => {
            this.settings.zoom = Math.max(this.settings.zoom / 1.2, 0.5);
            this.render();
        });
        
        // Toggle minimize
        const toggleBtn = this.controls.querySelector('.minimap-toggle');
        toggleBtn.addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        // World map toggle (M key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' || e.key === 'M') {
                this.toggleWorldMap();
            }
        });
        
        // Canvas click for world map
        this.canvas.addEventListener('click', (e) => {
            if (e.shiftKey) {
                this.toggleWorldMap();
            }
        });
    }
    
    startUpdateLoop() {
        setInterval(() => {
            this.update();
        }, this.settings.updateInterval);
    }
    
    update() {
        if (!this.game || !this.game.player) return;
        
        // Update player position
        this.playerPosition = {
            x: this.game.player.x || 0,
            y: this.game.player.y || 0
        };
        
        // Update exploration
        this.updateExploration();
        
        // Update visible entities
        this.updateVisibleEntities();
        
        // Update displays
        this.updateDisplays();
        
        // Render
        this.render();
    }
    
    updateExploration() {
        const { x, y } = this.playerPosition;
        const radius = this.explorationRadius;
        
        // Add tiles around player to explored set
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const tileX = Math.floor((x + dx) / 10);
                const tileY = Math.floor((y + dy) / 10);
                const tileKey = `${tileX},${tileY}`;
                
                if (!this.exploredTiles.has(tileKey)) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= radius) {
                        this.exploredTiles.add(tileKey);
                    }
                }
            }
        }
    }
    
    updateVisibleEntities() {
        this.visibleEntities.clear();
        
        if (!this.game.entityManager) return;
        
        const entities = this.game.entityManager.getAllEntities();
        const { x, y } = this.playerPosition;
        const viewRadius = this.settings.viewRadius;
        
        for (const entity of entities) {
            const distance = Math.sqrt(
                Math.pow(entity.x - x, 2) + Math.pow(entity.y - y, 2)
            );
            
            if (distance <= viewRadius) {
                this.visibleEntities.set(entity.id, {
                    type: entity.type,
                    x: entity.x,
                    y: entity.y,
                    name: entity.name || entity.type
                });
            }
        }
    }
    
    updateDisplays() {
        // Update coordinates
        this.coordinatesDisplay.textContent = 
            `X: ${Math.floor(this.playerPosition.x)}, Y: ${Math.floor(this.playerPosition.y)}`;
        
        // Update biome info
        const biome = this.getCurrentBiome();
        this.biomeDisplay.textContent = biome;
    }
    
    getCurrentBiome() {
        // This would typically get biome from world generator
        const biomes = ['Floresta', 'Planícies', 'Montanhas', 'Pântano', 'Deserto'];
        const index = Math.floor((this.playerPosition.x + this.playerPosition.y) / 100) % biomes.length;
        return biomes[Math.abs(index)];
    }
    
    render() {
        if (!this.ctx) return;
        
        const { width, height } = this.canvas;
        const scale = this.settings.scale * this.settings.zoom;
        
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, width, height);
        
        // Save context
        this.ctx.save();
        
        // Center on player
        this.ctx.translate(width / 2, height / 2);
        
        // Draw grid
        if (this.settings.showGrid) {
            this.drawGrid(scale);
        }
        
        // Draw explored areas
        if (this.settings.showFogOfWar) {
            this.drawExploredAreas(scale);
        }
        
        // Draw points of interest
        if (this.settings.showPOI) {
            this.drawPointsOfInterest(scale);
        }
        
        // Draw entities
        this.drawEntities(scale);
        
        // Draw player
        this.drawPlayer();
        
        // Draw view radius
        this.drawViewRadius();
        
        // Restore context
        this.ctx.restore();
    }
    
    drawGrid(scale) {
        this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        const gridSize = 10 * scale;
        const gridCount = 20;
        
        for (let i = -gridCount; i <= gridCount; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(i * gridSize, -gridCount * gridSize);
            this.ctx.lineTo(i * gridSize, gridCount * gridSize);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(-gridCount * gridSize, i * gridSize);
            this.ctx.lineTo(gridCount * gridSize, i * gridSize);
            this.ctx.stroke();
        }
    }
    
    drawExploredAreas(scale) {
        this.ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
        
        for (const tileKey of this.exploredTiles) {
            const [tileX, tileY] = tileKey.split(',').map(Number);
            const x = (tileX * 10 - this.playerPosition.x) * scale;
            const y = (tileY * 10 - this.playerPosition.y) * scale;
            const size = 10 * scale;
            
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawPointsOfInterest(scale) {
        // Sample POIs
        const pois = [
            { x: 100, y: 100, type: 'town', name: 'Vila Principal' },
            { x: -50, y: 80, type: 'dungeon', name: 'Caverna Misteriosa' },
            { x: 120, y: -60, type: 'boss', name: 'Boss Lair' }
        ];
        
        for (const poi of pois) {
            const x = (poi.x - this.playerPosition.x) * scale;
            const y = (poi.y - this.playerPosition.y) * scale;
            
            // Draw POI icon
            this.ctx.fillStyle = this.getPOIColor(poi.type);
            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw POI border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
    
    drawEntities(scale) {
        for (const [id, entity] of this.visibleEntities) {
            const x = (entity.x - this.playerPosition.x) * scale;
            const y = (entity.y - this.playerPosition.y) * scale;
            
            if (entity.type === 'monster') {
                // Draw monster
                this.ctx.fillStyle = '#ef4444';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (entity.type === 'npc') {
                // Draw NPC
                this.ctx.fillStyle = '#f59e0b';
                this.ctx.fillRect(x - 2, y - 2, 4, 4);
            } else if (entity.type === 'item') {
                // Draw item
                this.ctx.fillStyle = '#a78bfa';
                this.ctx.beginPath();
                this.ctx.moveTo(x, y - 3);
                this.ctx.lineTo(x - 2, y + 2);
                this.ctx.lineTo(x + 2, y + 2);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }
    
    drawPlayer() {
        // Draw player as a larger green circle
        this.ctx.fillStyle = '#4ade80';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw player border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw direction indicator
        if (this.game.player && this.game.player.direction) {
            this.ctx.strokeStyle = '#4ade80';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            
            const dir = this.game.player.direction;
            let dx = 0, dy = 0;
            
            switch (dir) {
                case 'up': dy = -8; break;
                case 'down': dy = 8; break;
                case 'left': dx = -8; break;
                case 'right': dx = 8; break;
            }
            
            this.ctx.lineTo(dx, dy);
            this.ctx.stroke();
        }
    }
    
    drawViewRadius() {
        const radius = this.settings.viewRadius * this.settings.scale * this.settings.zoom;
        
        this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    getPOIColor(type) {
        const colors = {
            town: '#4ade80',
            dungeon: '#f59e0b',
            boss: '#ef4444',
            poi: '#a78bfa',
            merchant: '#06b6d4'
        };
        
        return colors[type] || '#6495ff';
    }
    
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        
        const viewport = this.controls.querySelector('.minimap-viewport');
        const legend = this.controls.querySelector('.minimap-legend');
        const toggleBtn = this.controls.querySelector('.minimap-toggle');
        
        if (this.isMinimized) {
            viewport.style.display = 'none';
            legend.style.display = 'none';
            toggleBtn.textContent = '□';
            this.controls.style.width = '220px';
        } else {
            viewport.style.display = 'flex';
            legend.style.display = 'grid';
            toggleBtn.textContent = '_';
            this.controls.style.width = '220px';
        }
    }
    
    toggleWorldMap() {
        // This would open the world map window
        if (this.game && this.game.ui && this.game.ui.showWorldMap) {
            this.game.ui.showWorldMap();
        } else {
            console.log('World map feature not yet implemented');
        }
    }
    
    // Public API
    addPointOfInterest(id, x, y, type, name) {
        this.pointsOfInterest.set(id, { x, y, type, name });
    }
    
    removePointOfInterest(id) {
        this.pointsOfInterest.delete(id);
    }
    
    setZoom(level) {
        this.settings.zoom = Math.max(0.5, Math.min(3.0, level));
        this.render();
    }
    
    getExploredTiles() {
        return Array.from(this.exploredTiles);
    }
    
    isExplored(x, y) {
        const tileX = Math.floor(x / 10);
        const tileY = Math.floor(y / 10);
        const tileKey = `${tileX},${tileY}`;
        return this.exploredTiles.has(tileKey);
    }
    
    cleanup() {
        if (this.controls && this.controls.parentNode) {
            this.controls.parentNode.removeChild(this.controls);
        }
        
        this.exploredTiles.clear();
        this.pointsOfInterest.clear();
        this.visibleEntities.clear();
    }
}

export default Minimap;
