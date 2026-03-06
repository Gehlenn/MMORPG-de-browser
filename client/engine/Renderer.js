/**
 * Renderer System
 * Handles all rendering operations for the game
 */

import { TILE_SIZE, GRID_W, GRID_H } from '../world/TileMap.js';

class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.tileSize = TILE_SIZE;
        this.gridWidth = GRID_W;
        this.gridHeight = GRID_H;
        
        // Rendering layers
        this.layers = {
            terrain: 0,
            entities: 1,
            effects: 2,
            ui: 3
        };
        
        // Sprite cache
        this.spriteCache = new Map();
        
        // Animation state
        this.animations = new Map();
        this.gameTime = 0;
        
        // Performance optimization
        this.dirtyRects = [];
        this.lastCameraX = 0;
        this.lastCameraY = 0;
    }
    
    render(gameState, camera) {
        this.gameTime = gameState.gameTime;
        
        // Check if camera moved significantly
        const cameraMoved = Math.abs(camera.x - this.lastCameraX) > this.tileSize ||
                           Math.abs(camera.y - this.lastCameraY) > this.tileSize;
        
        if (cameraMoved) {
            this.lastCameraX = camera.x;
            this.lastCameraY = camera.y;
            this.dirtyRects = []; // Clear dirty rects on camera move
        }
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(-camera.x, -camera.y);
        
        // Render layers in order
        this.renderTerrain(gameState);
        this.renderEntities(gameState);
        this.renderEffects(gameState);
        
        // Restore context state
        this.ctx.restore();
        
        // Render UI (not affected by camera)
        this.renderUI(gameState);
    }
    
    renderTerrain(gameState) {
        if (!gameState.mapData) return;
        
        const { mapData, currentBiome } = gameState;
        const startX = Math.floor(this.lastCameraX / this.tileSize);
        const startY = Math.floor(this.lastCameraY / this.tileSize);
        const endX = Math.min(startX + Math.ceil(this.canvas.width / this.tileSize) + 1, this.gridWidth);
        const endY = Math.min(startY + Math.ceil(this.canvas.height / this.tileSize) + 1, this.gridHeight);
        
        // Render visible tiles only
        for (let y = Math.max(0, startY); y < endY; y++) {
            for (let x = Math.max(0, startX); x < endX; x++) {
                this.renderTile(x, y, mapData[y][x], currentBiome);
            }
        }
    }
    
    renderTile(x, y, tileType, biome) {
        const screenX = x * this.tileSize;
        const screenY = y * this.tileSize;
        
        // Get tile colors from biome
        const colors = this.getBiomeColors(biome);
        
        // Draw tile
        if (tileType === 1) {
            // Wall/blocked tile
            this.ctx.fillStyle = colors.wall;
        } else {
            // Floor tile
            this.ctx.fillStyle = colors.floor;
        }
        
        this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
        
        // Draw grid
        this.ctx.strokeStyle = colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
        
        // Add tile variations for visual interest
        if (tileType === 0 && Math.random() < 0.1) {
            this.renderTileDecoration(screenX, screenY, biome);
        }
    }
    
    renderTileDecoration(x, y, biome) {
        // Simple decoration based on biome
        this.ctx.globalAlpha = 0.3;
        
        switch (biome?.type) {
            case 'forest':
                this.ctx.fillStyle = '#2d5016';
                this.ctx.beginPath();
                this.ctx.arc(x + this.tileSize/2, y + this.tileSize/2, 3, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 'desert':
                this.ctx.fillStyle = '#d4a574';
                this.ctx.fillRect(x + 10, y + 10, 4, 4);
                break;
            case 'swamp':
                this.ctx.fillStyle = '#1a3d1a';
                this.ctx.fillRect(x + 8, y + 20, 6, 2);
                break;
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    getBiomeColors(biome) {
        const defaultColors = {
            floor: '#405b33',
            wall: '#213229',
            grid: 'rgba(255,255,255,0.08)'
        };
        
        if (!biome) return defaultColors;
        
        return {
            floor: biome.floorColor || defaultColors.floor,
            wall: biome.wallColor || defaultColors.wall,
            grid: biome.gridColor || defaultColors.grid
        };
    }
    
    renderEntities(gameState) {
        const entities = gameState.entities || [];
        
        // Sort entities by Y position for proper depth rendering
        entities.sort((a, b) => a.y - b.y);
        
        for (const entity of entities) {
            this.renderEntity(entity);
        }
        
        // Render player
        if (gameState.player) {
            this.renderEntity(gameState.player, true);
        }
    }
    
    renderEntity(entity, isPlayer = false) {
        const screenX = entity.x * this.tileSize;
        const screenY = entity.y * this.tileSize;
        
        // Calculate animation offset
        const wobble = this.getEntityWobble(entity);
        
        // Draw entity shadow
        this.renderShadow(screenX, screenY + this.tileSize - 8);
        
        // Draw entity sprite
        if (entity.sprite) {
            this.drawSprite(entity.sprite, screenX, screenY + wobble);
        } else {
            // Fallback colored rectangle
            this.renderEntityFallback(entity, screenX, screenY + wobble, isPlayer);
        }
        
        // Draw entity name/health bar
        if (isPlayer || entity.type === 'monster' || entity.type === 'npc') {
            this.renderEntityInfo(entity, screenX, screenY);
        }
        
        // Draw status effects
        if (entity.statusEffects) {
            this.renderStatusEffects(entity, screenX, screenY);
        }
    }
    
    renderEntityFallback(entity, x, y, isPlayer) {
        if (isPlayer) {
            this.ctx.fillStyle = '#4ade80';
        } else if (entity.type === 'monster') {
            this.ctx.fillStyle = '#ef4444';
        } else if (entity.type === 'npc') {
            this.ctx.fillStyle = '#3b82f6';
        } else {
            this.ctx.fillStyle = '#facc15';
        }
        
        this.ctx.fillRect(x + 5, y + 5, this.tileSize - 10, this.tileSize - 10);
    }
    
    renderShadow(x, y) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + this.tileSize/2, y, this.tileSize/3, this.tileSize/6, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderEntityInfo(entity, x, y) {
        const name = entity.name || entity.type || 'Unknown';
        const maxHp = entity.maxHp || entity.hp || 100;
        const currentHp = entity.hp || 0;
        const hpPercent = currentHp / maxHp;
        
        // Draw name
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, x + this.tileSize/2, y - 5);
        
        // Draw health bar
        const barWidth = this.tileSize - 4;
        const barHeight = 3;
        const barX = x + 2;
        const barY = y - 12;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        this.ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
        this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
    
    renderStatusEffects(entity, x, y) {
        const effects = entity.statusEffects || [];
        const iconSize = 8;
        const spacing = 2;
        let xOffset = 0;
        
        for (const effect of effects) {
            this.renderStatusIcon(effect, x + xOffset, y - 25, iconSize);
            xOffset += iconSize + spacing;
        }
    }
    
    renderStatusIcon(effect, x, y, size) {
        // Simple colored squares for different status effects
        switch (effect.type) {
            case 'poison':
                this.ctx.fillStyle = '#10b981';
                break;
            case 'burn':
                this.ctx.fillStyle = '#ef4444';
                break;
            case 'freeze':
                this.ctx.fillStyle = '#3b82f6';
                break;
            case 'buff':
                this.ctx.fillStyle = '#facc15';
                break;
            default:
                this.ctx.fillStyle = '#6b7280';
        }
        
        this.ctx.fillRect(x, y, size, size);
    }
    
    renderEffects(gameState) {
        // Render damage numbers, skill effects, particles, etc.
        this.renderDamageNumbers(gameState);
        this.renderParticles(gameState);
    }
    
    renderDamageNumbers(gameState) {
        const damageNumbers = gameState.damageNumbers || [];
        
        for (let i = damageNumbers.length - 1; i >= 0; i--) {
            const dmg = damageNumbers[i];
            const age = this.gameTime - dmg.startTime;
            const duration = 1000; // 1 second
            
            if (age > duration) {
                damageNumbers.splice(i, 1);
                continue;
            }
            
            const progress = age / duration;
            const alpha = 1 - progress;
            const yOffset = -progress * 30;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = dmg.color || '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                dmg.value.toString(),
                dmg.x * this.tileSize + this.tileSize/2,
                dmg.y * this.tileSize + yOffset
            );
            this.ctx.restore();
        }
    }
    
    renderParticles(gameState) {
        const particles = gameState.particles || [];
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            const age = this.gameTime - particle.startTime;
            const duration = particle.duration || 1000;
            
            if (age > duration) {
                particles.splice(i, 1);
                continue;
            }
            
            const progress = age / duration;
            const alpha = 1 - progress;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha * particle.opacity;
            this.ctx.fillStyle = particle.color;
            
            const size = particle.size * (1 + progress * particle.growth);
            this.ctx.fillRect(
                particle.x - size/2,
                particle.y - size/2,
                size,
                size
            );
            this.ctx.restore();
        }
    }
    
    renderUI(gameState) {
        // UI elements are rendered in screen space, not world space
        // This would include things like minimap, chat, inventory overlays, etc.
        // For now, we'll keep it simple since the main UI is handled by HTML
        
        // Render minimap if enabled
        if (gameState.showMinimap) {
            this.renderMinimap(gameState);
        }
    }
    
    renderMinimap(gameState) {
        const minimapSize = 150;
        const minimapX = this.canvas.width - minimapSize - 10;
        const minimapY = 10;
        const scale = minimapSize / Math.max(this.gridWidth, this.gridHeight);
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Player position
        if (gameState.player) {
            this.ctx.fillStyle = '#4ade80';
            this.ctx.fillRect(
                minimapX + gameState.player.x * scale - 2,
                minimapY + gameState.player.y * scale - 2,
                4,
                4
            );
        }
        
        // Entities
        const entities = gameState.entities || [];
        for (const entity of entities) {
            if (entity.type === 'monster') {
                this.ctx.fillStyle = '#ef4444';
            } else if (entity.type === 'npc') {
                this.ctx.fillStyle = '#3b82f6';
            } else {
                continue;
            }
            
            this.ctx.fillRect(
                minimapX + entity.x * scale - 1,
                minimapY + entity.y * scale - 1,
                2,
                2
            );
        }
    }
    
    getEntityWobble(entity) {
        // Simple breathing/idle animation
        if (!entity.animationOffset) {
            entity.animationOffset = Math.random() * Math.PI * 2;
        }
        
        return Math.sin(this.gameTime / 1000 + entity.animationOffset) * 2;
    }
    
    drawSprite(spritePath, x, y) {
        // Load and cache sprite
        if (!this.spriteCache.has(spritePath)) {
            const img = new Image();
            img.src = spritePath;
            this.spriteCache.set(spritePath, img);
        }
        
        const sprite = this.spriteCache.get(spritePath);
        
        if (sprite.complete) {
            this.ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
        } else {
            // Fallback while loading
            this.ctx.fillStyle = '#64a4ff';
            this.ctx.fillRect(x + 4, y + 4, this.tileSize - 8, this.tileSize - 8);
        }
    }
    
    // Utility methods
    addDamageNumber(x, y, value, color = '#ffffff') {
        if (!this.gameState.damageNumbers) {
            this.gameState.damageNumbers = [];
        }
        
        this.gameState.damageNumbers.push({
            x,
            y,
            value,
            color,
            startTime: this.gameTime
        });
    }
    
    addParticle(x, y, options = {}) {
        if (!this.gameState.particles) {
            this.gameState.particles = [];
        }
        
        this.gameState.particles.push({
            x: x * this.tileSize + this.tileSize/2,
            y: y * this.tileSize + this.tileSize/2,
            color: options.color || '#ffffff',
            size: options.size || 4,
            duration: options.duration || 1000,
            opacity: options.opacity || 1,
            growth: options.growth || 0,
            startTime: this.gameTime
        });
    }
}

export default Renderer;
