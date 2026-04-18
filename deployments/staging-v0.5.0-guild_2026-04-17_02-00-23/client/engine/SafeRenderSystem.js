// === SAFE RENDER SYSTEM ===

/**
 * Sistema de renderização seguro
 * Nunca crasha com entidades vazias
 */

export class SafeRenderSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.minimap = null;
        this.minimapCtx = null;
        this.isInitialized = false;
        this.isEnabled = false;
        
        // Render layers
        this.layers = {
            background: 0,
            terrain: 1,
            items: 2,
            entities: 3,
            effects: 4,
            ui: 5
        };
        
        // Statistics
        this.stats = {
            frameCount: 0,
            renderTime: 0,
            entitiesRendered: 0,
            errors: 0
        };
        
        // Fallback rendering
        this.fallbackMode = false;
        this.lastRenderTime = 0;
        
        this.initialize();
    }
    
    initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Render system already initialized');
            return;
        }
        
        console.log('🎨 Initializing Safe Render System...');
        this.setupCanvas();
        this.isInitialized = true;
        console.log('✅ Safe Render System initialized');
    }
    
    setupCanvas() {
        if (!document) {
            console.warn('⚠️ Document not available, render system disabled');
            return false;
        }
        
        // Main canvas
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        // Minimap
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap ? this.minimap.getContext('2d') : null;
        
        if (!this.canvas || !this.ctx) {
            console.warn('⚠️ Main canvas not available, enabling fallback mode');
            this.fallbackMode = true;
            return false;
        }
        
        // Configure canvas
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        if (this.minimap && this.minimapCtx) {
            this.minimap.width = 150;
            this.minimap.height = 150;
        }
        
        return true;
    }
    
    // === SAFE RENDER METHODS ===
    
    render(deltaTime) {
        if (!this.canRender()) {
            return false;
        }
        
        const startTime = performance.now();
        
        try {
            // Clear canvas safely
            this.clearCanvas();
            
            // Render layers in order
            this.renderBackground();
            this.renderTerrain();
            this.renderItems();
            this.renderEntities();
            this.renderEffects();
            this.renderUI();
            
            // Render minimap
            this.renderMinimap();
            
            // Update stats
            this.updateStats(startTime);
            
            return true;
            
        } catch (error) {
            console.error('❌ Render error:', error);
            this.stats.errors++;
            this.handleRenderError(error);
            return false;
        }
    }
    
    canRender() {
        return this.isInitialized && 
               this.isEnabled && 
               (this.ctx || this.fallbackMode);
    }
    
    clearCanvas() {
        if (!this.ctx) return;
        
        try {
            // Clear main canvas
            this.ctx.fillStyle = '#405b33';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Clear minimap
            if (this.minimapCtx) {
                this.minimapCtx.fillStyle = '#405b33';
                this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
            }
        } catch (error) {
            console.error('❌ Failed to clear canvas:', error);
        }
    }
    
    renderBackground() {
        if (!this.ctx) return;
        
        try {
            // Render grid background
            this.renderGrid();
        } catch (error) {
            console.error('❌ Background render error:', error);
        }
    }
    
    renderGrid() {
        if (!this.ctx) return;
        
        const gridSize = 32;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    renderTerrain() {
        // Terrain rendering disabled for stabilization
        // In production, would render map tiles, obstacles, etc.
    }
    
    renderItems() {
        // Item rendering disabled for stabilization
        // In production, would render ground items
    }
    
    renderEntities() {
        if (!window.gameEngine) return;
        
        try {
            // Render player safely
            this.renderPlayer();
            
            // Render mobs safely
            this.renderMobs();
            
            // Render NPCs safely
            this.renderNPCs();
            
        } catch (error) {
            console.error('❌ Entity render error:', error);
            this.renderFallbackEntities();
        }
    }
    
    renderPlayer() {
        if (!window.gameEngine?.player) return;
        
        const player = window.gameEngine.player;
        
        try {
            // Validate player data
            if (!this.validateEntity(player)) {
                console.warn('⚠️ Invalid player entity data');
                return;
            }
            
            // Render player
            this.ctx.fillStyle = player.color || '#4CAF50';
            this.ctx.fillRect(
                player.x - (player.size || 32) / 2,
                player.y - (player.size || 32) / 2,
                player.size || 32,
                player.size || 32
            );
            
            // Player border
            this.ctx.strokeStyle = '#2E7D32';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                player.x - (player.size || 32) / 2,
                player.y - (player.size || 32) / 2,
                player.size || 32,
                player.size || 32
            );
            
            // Player name
            if (player.name) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(player.name, player.x, player.y - (player.size || 32) / 2 - 5);
            }
            
            this.stats.entitiesRendered++;
            
        } catch (error) {
            console.error('❌ Player render error:', error);
        }
    }
    
    renderMobs() {
        if (!window.gameEngine?.mobs) return;
        
        const mobs = window.gameEngine.mobs;
        
        if (!Array.isArray(mobs)) {
            console.warn('⚠️ Mobs is not an array');
            return;
        }
        
        mobs.forEach((mob, index) => {
            try {
                if (!mob || !this.validateEntity(mob)) {
                    console.warn(`⚠️ Invalid mob entity at index ${index}`);
                    return;
                }
                
                // Render mob
                this.ctx.fillStyle = mob.color || '#FF6B6B';
                this.ctx.fillRect(
                    mob.x - (mob.size || 28) / 2,
                    mob.y - (mob.size || 28) / 2,
                    mob.size || 28,
                    mob.size || 28
                );
                
                // Mob border
                this.ctx.strokeStyle = '#C62828';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(
                    mob.x - (mob.size || 28) / 2,
                    mob.y - (mob.size || 28) / 2,
                    mob.size || 28,
                    mob.size || 28
                );
                
                // Mob eyes
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(mob.x - 6, mob.y - 4, 4, 4);
                this.ctx.fillRect(mob.x + 2, mob.y - 4, 4, 4);
                
                // Health bar
                if (mob.health && mob.maxHealth) {
                    this.renderHealthBar(mob.x, mob.y - (mob.size || 28) / 2 - 10, 
                                       mob.health, mob.maxHealth, mob.size || 28);
                }
                
                this.stats.entitiesRendered++;
                
            } catch (error) {
                console.error(`❌ Mob ${index} render error:`, error);
            }
        });
    }
    
    renderNPCs() {
        // NPC rendering disabled for stabilization
        // In production, would render friendly NPCs
    }
    
    renderHealthBar(x, y, health, maxHealth, width) {
        const barHeight = 4;
        const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
        
        // Background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - width / 2, y, width, barHeight);
        
        // Health
        this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : 
                           healthPercent > 0.25 ? '#FFC107' : '#F44336';
        this.ctx.fillRect(x - width / 2, y, width * healthPercent, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - width / 2, y, width, barHeight);
    }
    
    renderEffects() {
        // Effects rendering disabled for stabilization
        // In production, would render particle effects, spell effects, etc.
    }
    
    renderUI() {
        // UI rendering handled by separate UI system
        // This would render game-world UI elements like damage numbers, etc.
    }
    
    renderMinimap() {
        if (!this.minimapCtx) return;
        
        try {
            // Clear minimap
            this.minimapCtx.fillStyle = '#405b33';
            this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
            
            // Render player on minimap
            if (window.gameEngine?.player) {
                const player = window.gameEngine.player;
                const miniX = (player.x / this.canvas.width) * this.minimap.width;
                const miniY = (player.y / this.canvas.height) * this.minimap.height;
                
                this.minimapCtx.fillStyle = '#4CAF50';
                this.minimapCtx.fillRect(miniX - 1, miniY - 1, 3, 3);
            }
            
            // Render mobs on minimap
            if (window.gameEngine?.mobs && Array.isArray(window.gameEngine.mobs)) {
                window.gameEngine.mobs.forEach(mob => {
                    if (!mob) return;
                    
                    const miniX = (mob.x / this.canvas.width) * this.minimap.width;
                    const miniY = (mob.y / this.canvas.height) * this.minimap.height;
                    
                    this.minimapCtx.fillStyle = mob.color || '#FF6B6B';
                    this.minimapCtx.fillRect(miniX - 1, miniY - 1, 2, 2);
                });
            }
            
            // Minimap border
            this.minimapCtx.strokeStyle = '#FFFFFF';
            this.minimapCtx.lineWidth = 1;
            this.minimapCtx.strokeRect(0, 0, this.minimap.width, this.minimap.height);
            
        } catch (error) {
            console.error('❌ Minimap render error:', error);
        }
    }
    
    // === FALLBACK RENDERING ===
    
    renderFallbackEntities() {
        if (!this.ctx) return;
        
        console.warn('⚠️ Using fallback entity rendering');
        
        try {
            // Render simple placeholder entities
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(390, 290, 20, 20);
            
            this.ctx.fillStyle = '#00FF00';
            this.ctx.fillRect(100, 100, 15, 15);
            this.ctx.fillRect(600, 400, 15, 15);
            
        } catch (error) {
            console.error('❌ Fallback render failed:', error);
        }
    }
    
    handleRenderError(error) {
        // Try to recover from render errors
        if (this.stats.errors > 10) {
            console.error('💥 Too many render errors, enabling fallback mode');
            this.fallbackMode = true;
            this.stats.errors = 0;
        }
    }
    
    // === VALIDATION ===
    
    validateEntity(entity) {
        if (!entity) return false;
        
        // Check required properties
        const required = ['x', 'y'];
        for (const prop of required) {
            if (!(prop in entity) || typeof entity[prop] !== 'number') {
                return false;
            }
        }
        
        // Check bounds
        if (entity.x < -100 || entity.x > this.canvas.width + 100 ||
            entity.y < -100 || entity.y > this.canvas.height + 100) {
            return false;
        }
        
        return true;
    }
    
    // === ECS RENDERING ===
    
    renderECS() {
        if (!window.gameEngine?.ecsManager) return;
        
        try {
            const entities = window.gameEngine.ecsManager.getEntities();
            
            if (!Array.isArray(entities)) {
                console.warn('⚠️ ECS entities is not an array');
                return;
            }
            
            entities.forEach(entity => {
                if (!entity || !entity.isActive()) return;
                
                this.renderECSEntity(entity);
            });
            
        } catch (error) {
            console.error('❌ ECS render error:', error);
        }
    }
    
    renderECSEntity(entity) {
        if (!this.ctx) return;
        
        try {
            const position = entity.getComponent('position');
            const render = entity.getComponent('render');
            
            if (!position || !render) return;
            
            // Validate position
            if (!this.validateEntity(position)) return;
            
            // Render entity
            this.ctx.fillStyle = render.color || '#FFFFFF';
            this.ctx.fillRect(
                position.x - (render.size || 32) / 2,
                position.y - (render.size || 32) / 2,
                render.size || 32,
                render.size || 32
            );
            
            this.stats.entitiesRendered++;
            
        } catch (error) {
            console.error(`❌ ECS entity ${entity.id} render error:`, error);
        }
    }
    
    // === PUBLIC METHODS ===
    
    enable() {
        this.isEnabled = true;
        console.log('✅ Render system enabled');
    }
    
    disable() {
        this.isEnabled = false;
        console.log('❌ Render system disabled');
    }
    
    resize(width, height) {
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }
    
    // === STATISTICS ===
    
    updateStats(startTime) {
        const renderTime = performance.now() - startTime;
        this.stats.renderTime = renderTime;
        this.stats.frameCount++;
        this.stats.entitiesRendered = 0; // Reset per frame
    }
    
    getStats() {
        return {
            ...this.stats,
            fps: this.stats.frameCount > 0 ? 1000 / this.stats.renderTime : 0,
            fallbackMode: this.fallbackMode,
            canvasAvailable: !!this.canvas,
            contextAvailable: !!this.ctx,
            minimapAvailable: !!this.minimapCtx
        };
    }
    
    resetStats() {
        this.stats.frameCount = 0;
        this.stats.renderTime = 0;
        this.stats.entitiesRendered = 0;
        this.stats.errors = 0;
    }
    
    // === CLEANUP ===
    
    destroy() {
        this.disable();
        
        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        if (this.minimapCtx) {
            this.minimapCtx.clearRect(0, 0, this.minimap.width, this.minimap.height);
        }
        
        this.isInitialized = false;
        console.log('🗑️ Safe Render System destroyed');
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.SafeRenderSystem = SafeRenderSystem;
}
