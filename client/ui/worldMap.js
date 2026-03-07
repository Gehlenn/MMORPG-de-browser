/**
 * World Map System - Full World Navigation
 * Interactive world map with exploration tracking and fast travel
 * Version 0.3 - Complete Architecture Integration
 */

class WorldMap {
    constructor(game, worldGenerator) {
        this.game = game;
        this.worldGenerator = worldGenerator;
        
        // Map settings
        this.settings = {
            tileSize: 32,
            viewWidth: 800,
            viewHeight: 600,
            minZoom: 0.5,
            maxZoom: 3.0,
            defaultZoom: 1.0,
            showGrid: true,
            showBiomes: true,
            showPOI: true,
            showPlayers: true,
            enableFastTravel: true
        };
        
        // State
        this.isOpen = false;
        this.currentZoom = this.settings.defaultZoom;
        this.viewPosition = { x: 0, y: 0 };
        this.selectedRegion = null;
        this.hoveredTile = null;
        
        // Map data
        this.worldData = new Map();
        this.exploredRegions = new Set();
        this.discoveredPOI = new Map();
        this.fastTravelPoints = new Map();
        this.playerMarkers = new Map();
        
        // UI elements
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.infoPanel = null;
        this.controlPanel = null;
        
        // Interaction
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastPanPosition = { x: 0, y: 0 };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.createUI();
        this.setupEventHandlers();
        this.loadWorldData();
    }
    
    createUI() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'world-map-container';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${this.settings.viewWidth + 320}px;
            height: ${this.settings.viewHeight + 100}px;
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 40, 0.95));
            border: 3px solid rgba(100, 150, 255, 0.5);
            border-radius: 16px;
            color: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            z-index: 2000;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(15px);
            display: none;
        `;
        
        this.container.innerHTML = `
            <div class="world-map-header">
                <div class="map-title">
                    <span class="map-icon">🌍</span>
                    <span>Mapa Mundial</span>
                </div>
                <div class="map-controls">
                    <button class="map-zoom-in" title="Aumentar zoom">+</button>
                    <button class="map-zoom-out" title="Diminuir zoom">-</button>
                    <button class="map-reset" title="Resetar vista">⟲</button>
                    <button class="map-close" title="Fechar (M)">×</button>
                </div>
            </div>
            <div class="world-map-content">
                <div class="map-viewport">
                    <canvas class="world-map-canvas" width="${this.settings.viewWidth}" height="${this.settings.viewHeight}"></canvas>
                    <div class="map-overlay">
                        <div class="coordinates-display">X: 0, Y: 0</div>
                        <div class="region-info">Região Desconhecida</div>
                        <div class="zoom-display">Zoom: 100%</div>
                    </div>
                </div>
                <div class="map-sidebar">
                    <div class="info-panel">
                        <h3>Informações</h3>
                        <div class="region-details">
                            <div class="detail-row">
                                <span class="detail-label">Região:</span>
                                <span class="detail-value" id="region-name">-</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Bioma:</span>
                                <span class="detail-value" id="biome-type">-</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Perigo:</span>
                                <span class="detail-value" id="danger-level">-</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Explorado:</span>
                                <span class="detail-value" id="exploration-status">-</span>
                            </div>
                        </div>
                    </div>
                    <div class="poi-panel">
                        <h3>Pontos de Interesse</h3>
                        <div class="poi-list" id="poi-list">
                            <div class="poi-item">Nenhum POI descoberto</div>
                        </div>
                    </div>
                    <div class="travel-panel">
                        <h3>Viagem Rápida</h3>
                        <div class="travel-list" id="travel-list">
                            <div class="travel-item">Nenhum ponto disponível</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="world-map-footer">
                <div class="map-legend">
                    <div class="legend-item">
                        <span class="legend-color player"></span>
                        <span>Jogador</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color explored"></span>
                        <span>Explorado</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color poi"></span>
                        <span>POI</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color fast-travel"></span>
                        <span>Viagem Rápida</span>
                    </div>
                </div>
                <div class="map-tips">
                    <span>💡 Dica: Use M para fechar, arraste para mover, scroll para zoom</span>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(this.container);
        
        // Get references
        this.canvas = this.container.querySelector('.world-map-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.infoPanel = this.container.querySelector('.info-panel');
        this.controlPanel = this.container.querySelector('.map-controls');
        
        // Get display elements
        this.coordinatesDisplay = this.container.querySelector('.coordinates-display');
        this.regionInfo = this.container.querySelector('.region-info');
        this.zoomDisplay = this.container.querySelector('.zoom-display');
        this.regionName = this.container.querySelector('#region-name');
        this.biomeType = this.container.querySelector('#biome-type');
        this.dangerLevel = this.container.querySelector('#danger-level');
        this.explorationStatus = this.container.querySelector('#exploration-status');
        this.poiList = this.container.querySelector('#poi-list');
        this.travelList = this.container.querySelector('#travel-list');
        
        // Style elements
        this.styleWorldMapElements();
        
        // Setup canvas interactions
        this.setupCanvasInteractions();
    }
    
    styleWorldMapElements() {
        // Header styling
        const header = this.container.querySelector('.world-map-header');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: linear-gradient(90deg, rgba(100, 150, 255, 0.3), rgba(50, 100, 200, 0.2));
            border-bottom: 2px solid rgba(100, 150, 255, 0.4);
            border-radius: 13px 13px 0 0;
        `;
        
        // Title styling
        const title = this.container.querySelector('.map-title');
        title.style.cssText = `
            display: flex;
            align-items: center;
            font-size: 18px;
            font-weight: bold;
            color: #6495ff;
        `;
        
        const mapIcon = this.container.querySelector('.map-icon');
        mapIcon.style.cssText = `
            margin-right: 8px;
            font-size: 20px;
        `;
        
        // Controls styling
        const controls = this.container.querySelector('.map-controls');
        controls.style.cssText = `
            display: flex;
            gap: 6px;
        `;
        
        // Button styling
        const buttons = this.container.querySelectorAll('.map-controls button');
        buttons.forEach(button => {
            button.style.cssText = `
                background: rgba(100, 150, 255, 0.2);
                border: 1px solid rgba(100, 150, 255, 0.4);
                color: #ffffff;
                width: 28px;
                height: 28px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
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
        
        // Content layout
        const content = this.container.querySelector('.world-map-content');
        content.style.cssText = `
            display: flex;
            height: ${this.settings.viewHeight}px;
        `;
        
        // Viewport styling
        const viewport = this.container.querySelector('.map-viewport');
        viewport.style.cssText = `
            position: relative;
            flex: 1;
            background: rgba(0, 0, 0, 0.4);
            border-right: 1px solid rgba(100, 150, 255, 0.2);
        `;
        
        // Canvas styling
        this.canvas.style.cssText = `
            cursor: grab;
            border: 1px solid rgba(100, 150, 255, 0.2);
        `;
        
        // Overlay styling
        const overlay = this.container.querySelector('.map-overlay');
        overlay.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            pointer-events: none;
        `;
        
        const coordinatesDisplay = this.container.querySelector('.coordinates-display');
        coordinatesDisplay.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            color: #ccc;
            display: inline-block;
        `;
        
        const regionInfo = this.container.querySelector('.region-info');
        regionInfo.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            color: #6495ff;
            display: inline-block;
            margin-left: 10px;
        `;
        
        const zoomDisplay = this.container.querySelector('.zoom-display');
        zoomDisplay.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            color: #ccc;
            display: inline-block;
            margin-left: 10px;
        `;
        
        // Sidebar styling
        const sidebar = this.container.querySelector('.map-sidebar');
        sidebar.style.cssText = `
            width: 300px;
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
        `;
        
        // Panel styling
        const panels = this.container.querySelectorAll('.info-panel, .poi-panel, .travel-panel');
        panels.forEach(panel => {
            panel.style.cssText = `
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(100, 150, 255, 0.2);
                border-radius: 8px;
                padding: 12px;
            `;
            
            const heading = panel.querySelector('h3');
            if (heading) {
                heading.style.cssText = `
                    margin: 0 0 10px 0;
                    color: #6495ff;
                    font-size: 14px;
                    border-bottom: 1px solid rgba(100, 150, 255, 0.2);
                    padding-bottom: 5px;
                `;
            }
        });
        
        // Detail rows
        const detailRows = this.container.querySelectorAll('.detail-row');
        detailRows.forEach(row => {
            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 12px;
            `;
            
            const label = row.querySelector('.detail-label');
            const value = row.querySelector('.detail-value');
            
            if (label) label.style.color = '#ccc';
            if (value) value.style.color = '#fff';
        });
        
        // Footer styling
        const footer = this.container.querySelector('.world-map-footer');
        footer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.3);
            border-top: 1px solid rgba(100, 150, 255, 0.2);
            border-radius: 0 0 13px 13px;
        `;
        
        // Legend styling
        const legend = this.container.querySelector('.map-legend');
        legend.style.cssText = `
            display: flex;
            gap: 15px;
        `;
        
        const legendItems = this.container.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
                color: #ccc;
            `;
        });
        
        // Legend colors
        const legendColors = this.container.querySelectorAll('.legend-color');
        legendColors.forEach(color => {
            color.style.cssText = `
                width: 10px;
                height: 10px;
                border-radius: 2px;
            `;
        });
        
        this.container.querySelector('.legend-color.player').style.background = '#4ade80';
        this.container.querySelector('.legend-color.explored').style.background = '#6495ff';
        this.container.querySelector('.legend-color.poi').style.background = '#f59e0b';
        this.container.querySelector('.legend-color.fast-travel').style.background = '#a78bfa';
        
        // Tips styling
        const tips = this.container.querySelector('.map-tips');
        tips.style.cssText = `
            font-size: 10px;
            color: #888;
            font-style: italic;
        `;
    }
    
    setupCanvasInteractions() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    setupEventHandlers() {
        // Control buttons
        const zoomInBtn = this.container.querySelector('.map-zoom-in');
        const zoomOutBtn = this.container.querySelector('.map-zoom-out');
        const resetBtn = this.container.querySelector('.map-reset');
        const closeBtn = this.container.querySelector('.map-close');
        
        zoomInBtn.addEventListener('click', () => this.zoomIn());
        zoomOutBtn.addEventListener('click', () => this.zoomOut());
        resetBtn.addEventListener('click', () => this.resetView());
        closeBtn.addEventListener('click', () => this.close());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' || e.key === 'M') {
                if (this.isOpen) {
                    this.close();
                }
            }
        });
        
        // Game events
        if (this.game) {
            this.game.on('playerMoved', () => {
                if (this.isOpen) {
                    this.updatePlayerPosition();
                    this.render();
                }
            });
            
            this.game.on('regionDiscovered', (region) => {
                this.onRegionDiscovered(region);
            });
        }
    }
    
    loadWorldData() {
        // Generate sample world data
        this.generateSampleWorld();
        
        // Load player exploration data
        this.loadExplorationData();
        
        // Load discovered POIs
        this.loadPOIData();
    }
    
    generateSampleWorld() {
        // Create a sample world with different biomes
        const worldSize = 100;
        
        for (let x = -worldSize; x < worldSize; x += 10) {
            for (let y = -worldSize; y < worldSize; y += 10) {
                const biome = this.generateBiome(x, y);
                const danger = this.calculateDangerLevel(x, y, biome);
                
                this.worldData.set(`${x},${y}`, {
                    x, y,
                    biome,
                    danger,
                    explored: false,
                    poi: []
                });
            }
        }
        
        // Add sample POIs
        this.addSamplePOIs();
    }
    
    generateBiome(x, y) {
        // Simple biome generation based on coordinates
        const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1);
        
        if (noise < -0.5) return 'frozen';
        if (noise < -0.2) return 'mountain';
        if (noise < 0.2) return 'forest';
        if (noise < 0.5) return 'plains';
        return 'desert';
    }
    
    calculateDangerLevel(x, y, biome) {
        // Base danger by biome
        const biomeDanger = {
            frozen: 4,
            mountain: 3,
            forest: 2,
            plains: 1,
            desert: 2,
            swamp: 3,
            volcanic: 5,
            darklands: 5
        };
        
        let danger = biomeDanger[biome] || 1;
        
        // Increase danger further from origin
        const distance = Math.sqrt(x * x + y * y);
        danger += Math.floor(distance / 50);
        
        return Math.min(5, danger);
    }
    
    addSamplePOIs() {
        // Add sample points of interest
        const pois = [
            { x: 0, y: 0, type: 'town', name: 'Vila Principal', fastTravel: true },
            { x: 50, y: 30, type: 'dungeon', name: 'Caverna dos Goblins' },
            { x: -40, y: 60, type: 'boss', name: 'Ninho do Dragão' },
            { x: 80, y: -20, type: 'merchant', name: 'Posto Comercial' },
            { x: -60, y: -40, type: 'ruins', name: 'Ruínas Antigas', fastTravel: true },
            { x: 30, y: 70, type: 'tower', name: 'Torre do Mago' },
            { x: -70, y: 20, type: 'camp', name: 'Acampamento Aventureiro' }
        ];
        
        for (const poi of pois) {
            this.addPOI(poi);
        }
    }
    
    addPOI(poi) {
        const key = `${poi.x},${poi.y}`;
        const tile = this.worldData.get(key);
        
        if (tile) {
            tile.poi.push(poi);
        }
        
        this.discoveredPOI.set(poi.name, poi);
        
        if (poi.fastTravel) {
            this.fastTravelPoints.set(poi.name, poi);
        }
    }
    
    loadExplorationData() {
        // Load from player save or localStorage
        const saved = localStorage.getItem('worldMap_exploration');
        if (saved) {
            const data = JSON.parse(saved);
            this.exploredRegions = new Set(data.regions || []);
        }
        
        // Mark some initial areas as explored
        this.exploredRegions.add('0,0');
        this.exploredRegions.add('10,0');
        this.exploredRegions.add('0,10');
        this.exploredRegions.add('-10,0');
        this.exploredRegions.add('0,-10');
    }
    
    loadPOIData() {
        // Load discovered POIs from save
        const saved = localStorage.getItem('worldMap_poi');
        if (saved) {
            const data = JSON.parse(saved);
            // Merge with existing POIs
        }
    }
    
    // Map rendering
    render() {
        if (!this.ctx || !this.isOpen) return;
        
        const { width, height } = this.canvas;
        
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, width, height);
        
        // Save context
        this.ctx.save();
        
        // Apply transformations
        this.ctx.translate(width / 2, height / 2);
        this.ctx.scale(this.currentZoom, this.currentZoom);
        this.ctx.translate(-this.viewPosition.x, -this.viewPosition.y);
        
        // Draw world
        this.drawWorld();
        
        // Draw POIs
        if (this.settings.showPOI) {
            this.drawPOIs();
        }
        
        // Draw players
        if (this.settings.showPlayers) {
            this.drawPlayers();
        }
        
        // Restore context
        this.ctx.restore();
        
        // Draw UI overlay
        this.drawOverlay();
    }
    
    drawWorld() {
        const tileSize = this.settings.tileSize;
        const viewBounds = this.getViewBounds();
        
        for (let x = viewBounds.minX; x <= viewBounds.maxX; x += tileSize) {
            for (let y = viewBounds.minY; y <= viewBounds.maxY; y += tileSize) {
                const key = `${Math.floor(x/tileSize)*tileSize},${Math.floor(y/tileSize)*tileSize}`;
                const tile = this.worldData.get(key);
                
                if (tile) {
                    this.drawTile(tile);
                }
            }
        }
    }
    
    drawTile(tile) {
        const tileSize = this.settings.tileSize;
        const isExplored = this.exploredRegions.has(`${tile.x},${tile.y}`);
        
        // Set tile color based on biome and exploration
        let color = this.getBiomeColor(tile.biome);
        
        if (!isExplored) {
            // Unexplored areas are darker
            color = this.darkenColor(color, 0.6);
        }
        
        // Draw tile
        this.ctx.fillStyle = color;
        this.ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
        
        // Draw grid
        if (this.settings.showGrid) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 0.5;
            this.ctx.strokeRect(tile.x, tile.y, tileSize, tileSize);
        }
        
        // Draw danger indicator
        if (isExplored && tile.danger > 1) {
            this.drawDangerIndicator(tile);
        }
    }
    
    getBiomeColor(biome) {
        const colors = {
            forest: '#228b22',
            plains: '#90ee90',
            mountain: '#8b7355',
            desert: '#f4a460',
            swamp: '#556b2f',
            frozen: '#b0e0e6',
            volcanic: '#8b0000',
            darklands: '#4b0082',
            ocean: '#4682b4',
            beach: '#f0e68c'
        };
        
        return colors[biome] || '#808080';
    }
    
    darkenColor(color, factor) {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);
        
        return `rgb(${newR}, ${newG}, ${newB})`;
    }
    
    drawDangerIndicator(tile) {
        const centerX = tile.x + this.settings.tileSize / 2;
        const centerY = tile.y + this.settings.tileSize / 2;
        
        // Draw danger skull for high danger areas
        if (tile.danger >= 4) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('💀', centerX, centerY + 4);
        } else if (tile.danger >= 3) {
            this.ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚠', centerX, centerY + 3);
        }
    }
    
    drawPOIs() {
        for (const [name, poi] of this.discoveredPOI) {
            this.drawPOI(poi);
        }
    }
    
    drawPOI(poi) {
        const x = poi.x;
        const y = poi.y;
        
        // Draw POI icon
        this.ctx.fillStyle = this.getPOIColor(poi.type);
        this.ctx.beginPath();
        this.ctx.arc(x, y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw POI border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw fast travel indicator
        if (poi.fastTravel) {
            this.ctx.fillStyle = '#a78bfa';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw POI name when zoomed in
        if (this.currentZoom > 1.5) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(poi.name, x, y - 10);
        }
    }
    
    getPOIColor(type) {
        const colors = {
            town: '#4ade80',
            dungeon: '#f59e0b',
            boss: '#ef4444',
            merchant: '#06b6d4',
            ruins: '#a78bfa',
            tower: '#8b5cf6',
            camp: '#f97316',
            poi: '#6495ff'
        };
        
        return colors[type] || '#6495ff';
    }
    
    drawPlayers() {
        // Draw current player
        if (this.game && this.game.player) {
            this.drawPlayer(
                this.game.player.x || 0,
                this.game.player.y || 0,
                '#4ade80',
                'Você'
            );
        }
        
        // Draw other players (if multiplayer)
        for (const [id, marker] of this.playerMarkers) {
            this.drawPlayer(marker.x, marker.y, marker.color, marker.name);
        }
    }
    
    drawPlayer(x, y, color, name) {
        // Draw player marker
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw player border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw player name
        if (this.currentZoom > 1.2) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '9px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(name, x, y - 8);
        }
    }
    
    drawOverlay() {
        // Update displays
        this.updateDisplays();
    }
    
    // Interaction handlers
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.isDragging = true;
        this.dragStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.lastPanPosition = { ...this.viewPosition };
        this.canvas.style.cursor = 'grabbing';
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (this.isDragging) {
            // Pan the map
            const dx = mouseX - this.dragStart.x;
            const dy = mouseY - this.dragStart.y;
            
            this.viewPosition.x = this.lastPanPosition.x - dx / this.currentZoom;
            this.viewPosition.y = this.lastPanPosition.y - dy / this.currentZoom;
            
            this.render();
        } else {
            // Update hover info
            this.updateHoverInfo(mouseX, mouseY);
        }
    }
    
    onMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }
    
    onWheel(e) {
        e.preventDefault();
        
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(
            this.settings.minZoom,
            Math.min(this.settings.maxZoom, this.currentZoom * scaleFactor)
        );
        
        if (newZoom !== this.currentZoom) {
            this.currentZoom = newZoom;
            this.render();
        }
    }
    
    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to world coordinates
        const worldX = (mouseX - this.canvas.width / 2) / this.currentZoom + this.viewPosition.x;
        const worldY = (mouseY - this.canvas.height / 2) / this.currentZoom + this.viewPosition.y;
        
        // Check if clicking on POI
        const clickedPOI = this.getPOIAt(worldX, worldY);
        if (clickedPOI) {
            this.onPOIClick(clickedPOI);
        }
    }
    
    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            this.isDragging = true;
            this.dragStart = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            this.lastPanPosition = { ...this.viewPosition };
        }
    }
    
    onTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            
            const dx = touch.clientX - rect.left - this.dragStart.x;
            const dy = touch.clientY - rect.top - this.dragStart.y;
            
            this.viewPosition.x = this.lastPanPosition.x - dx / this.currentZoom;
            this.viewPosition.y = this.lastPanPosition.y - dy / this.currentZoom;
            
            this.render();
        }
    }
    
    onTouchEnd(e) {
        this.isDragging = false;
    }
    
    // Utility methods
    getViewBounds() {
        const { width, height } = this.canvas;
        const halfWidth = width / (2 * this.currentZoom);
        const halfHeight = height / (2 * this.currentZoom);
        
        return {
            minX: this.viewPosition.x - halfWidth,
            maxX: this.viewPosition.x + halfWidth,
            minY: this.viewPosition.y - halfHeight,
            maxY: this.viewPosition.y + halfHeight
        };
    }
    
    getPOIAt(x, y) {
        for (const [name, poi] of this.discoveredPOI) {
            const distance = Math.sqrt(Math.pow(poi.x - x, 2) + Math.pow(poi.y - y, 2));
            if (distance <= 10) {
                return poi;
            }
        }
        return null;
    }
    
    getTileAt(x, y) {
        const tileX = Math.floor(x / this.settings.tileSize) * this.settings.tileSize;
        const tileY = Math.floor(y / this.settings.tileSize) * this.settings.tileSize;
        return this.worldData.get(`${tileX},${tileY}`);
    }
    
    updateHoverInfo(mouseX, mouseY) {
        const worldX = (mouseX - this.canvas.width / 2) / this.currentZoom + this.viewPosition.x;
        const worldY = (mouseY - this.canvas.height / 2) / this.currentZoom + this.viewPosition.y;
        
        const tile = this.getTileAt(worldX, worldY);
        const poi = this.getPOIAt(worldX, worldY);
        
        if (tile) {
            this.hoveredTile = tile;
            this.updateInfoPanel(tile, poi);
        }
    }
    
    updateInfoPanel(tile, poi) {
        if (tile) {
            this.regionName.textContent = `${Math.floor(tile.x/10)}, ${Math.floor(tile.y/10)}`;
            this.biomeType.textContent = this.getBiomeDisplayName(tile.biome);
            this.dangerLevel.textContent = this.getDangerDisplayName(tile.danger);
            this.explorationStatus.textContent = this.exploredRegions.has(`${tile.x},${tile.y}`) ? 'Sim' : 'Não';
        }
        
        if (poi) {
            this.regionInfo.textContent = poi.name;
        }
    }
    
    updateDisplays() {
        // Update coordinates
        if (this.game && this.game.player) {
            this.coordinatesDisplay.textContent = 
                `X: ${Math.floor(this.game.player.x)}, Y: ${Math.floor(this.game.player.y)}`;
        }
        
        // Update zoom
        this.zoomDisplay.textContent = `Zoom: ${Math.round(this.currentZoom * 100)}%`;
        
        // Update POI list
        this.updatePOIList();
        
        // Update travel list
        this.updateTravelList();
    }
    
    updatePOIList() {
        const pois = Array.from(this.discoveredPOI.values())
            .filter(poi => this.isPOIInView(poi))
            .slice(0, 5);
        
        if (pois.length === 0) {
            this.poiList.innerHTML = '<div class="poi-item">Nenhum POI próximo</div>';
        } else {
            this.poiList.innerHTML = pois.map(poi => `
                <div class="poi-item" data-poi="${poi.name}">
                    <span class="poi-icon">${this.getPOIIcon(poi.type)}</span>
                    <span class="poi-name">${poi.name}</span>
                    <span class="poi-distance">${this.getDistanceToPOI(poi)}m</span>
                </div>
            `).join('');
            
            // Add click handlers
            this.poiList.querySelectorAll('.poi-item').forEach(item => {
                item.addEventListener('click', () => {
                    const poiName = item.dataset.poi;
                    const poi = this.discoveredPOI.get(poiName);
                    if (poi) {
                        this.centerOnPOI(poi);
                    }
                });
            });
        }
    }
    
    updateTravelList() {
        const travelPoints = Array.from(this.fastTravelPoints.values());
        
        if (travelPoints.length === 0) {
            this.travelList.innerHTML = '<div class="travel-item">Nenhum ponto disponível</div>';
        } else {
            this.travelList.innerHTML = travelPoints.map(poi => `
                <div class="travel-item" data-poi="${poi.name}">
                    <span class="travel-icon">🚀</span>
                    <span class="travel-name">${poi.name}</span>
                    <button class="travel-button">Viajar</button>
                </div>
            `).join('');
            
            // Add travel handlers
            this.travelList.querySelectorAll('.travel-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const poiName = button.parentElement.dataset.poi;
                    const poi = this.fastTravelPoints.get(poiName);
                    if (poi) {
                        this.fastTravelTo(poi);
                    }
                });
            });
        }
    }
    
    // Public API
    show() {
        this.isOpen = true;
        this.container.style.display = 'block';
        this.updatePlayerPosition();
        this.render();
    }
    
    close() {
        this.isOpen = false;
        this.container.style.display = 'none';
        this.saveExplorationData();
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.show();
        }
    }
    
    zoomIn() {
        this.currentZoom = Math.min(this.settings.maxZoom, this.currentZoom * 1.2);
        this.render();
    }
    
    zoomOut() {
        this.currentZoom = Math.max(this.settings.minZoom, this.currentZoom / 1.2);
        this.render();
    }
    
    resetView() {
        this.currentZoom = this.settings.defaultZoom;
        if (this.game && this.game.player) {
            this.viewPosition = {
                x: this.game.player.x || 0,
                y: this.game.player.y || 0
            };
        }
        this.render();
    }
    
    centerOnPlayer() {
        if (this.game && this.game.player) {
            this.viewPosition = {
                x: this.game.player.x || 0,
                y: this.game.player.y || 0
            };
            this.render();
        }
    }
    
    centerOnPOI(poi) {
        this.viewPosition = { x: poi.x, y: poi.y };
        this.render();
    }
    
    updatePlayerPosition() {
        if (this.game && this.game.player) {
            // Center view on player
            this.viewPosition = {
                x: this.game.player.x || 0,
                y: this.game.player.y || 0
            };
        }
    }
    
    onRegionDiscovered(region) {
        this.exploredRegions.add(`${region.x},${region.y}`);
        this.render();
    }
    
    onPOIClick(poi) {
        // Show POI details
        this.selectedRegion = poi;
        this.updateInfoPanel(this.getTileAt(poi.x, poi.y), poi);
        
        // Center on POI
        this.centerOnPOI(poi);
    }
    
    fastTravelTo(poi) {
        if (!this.settings.enableFastTravel) return;
        
        // Check if player can fast travel
        if (this.canFastTravelTo(poi)) {
            // Implement fast travel logic
            if (this.game && this.game.player) {
                this.game.player.x = poi.x;
                this.game.player.y = poi.y;
                
                // Show notification
                this.showNotification(`Viajou para ${poi.name}`);
                
                // Update view
                this.centerOnPlayer();
            }
        }
    }
    
    canFastTravelTo(poi) {
        // Check requirements (level, items, etc.)
        return true; // Simplified for now
    }
    
    // Utility methods
    getBiomeDisplayName(biome) {
        const names = {
            forest: 'Floresta',
            plains: 'Planícies',
            mountain: 'Montanhas',
            desert: 'Deserto',
            swamp: 'Pântano',
            frozen: 'Terras Congeladas',
            volcanic: 'Terras Vulcânicas',
            darklands: 'Terras Sombrias'
        };
        
        return names[biome] || biome;
    }
    
    getDangerDisplayName(level) {
        const names = {
            1: 'Seguro',
            2: 'Moderado',
            3: 'Perigoso',
            4: 'Muito Perigoso',
            5: 'Mortal'
        };
        
        return names[level] || 'Desconhecido';
    }
    
    getPOIIcon(type) {
        const icons = {
            town: '🏘️',
            dungeon: '⚔️',
            boss: '👹',
            merchant: '🏪',
            ruins: '🏛️',
            tower: '🗼',
            camp: '⛺',
            poi: '📍'
        };
        
        return icons[type] || '📍';
    }
    
    getDistanceToPOI(poi) {
        if (!this.game || !this.game.player) return 0;
        
        const dx = poi.x - (this.game.player.x || 0);
        const dy = poi.y - (this.game.player.y || 0);
        return Math.floor(Math.sqrt(dx * dx + dy * dy));
    }
    
    isPOIInView(poi) {
        const bounds = this.getViewBounds();
        return poi.x >= bounds.minX && poi.x <= bounds.maxX &&
               poi.y >= bounds.minY && poi.y <= bounds.maxY;
    }
    
    showNotification(message) {
        // Simple notification (could be enhanced)
        console.log('Fast Travel:', message);
    }
    
    saveExplorationData() {
        const data = {
            regions: Array.from(this.exploredRegions),
            pois: Array.from(this.discoveredPOI.keys())
        };
        
        localStorage.setItem('worldMap_exploration', JSON.stringify(data));
    }
    
    // Cleanup
    cleanup() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.worldData.clear();
        this.exploredRegions.clear();
        this.discoveredPOI.clear();
        this.fastTravelPoints.clear();
        this.playerMarkers.clear();
    }
}

export default WorldMap;
