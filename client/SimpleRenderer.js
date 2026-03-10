/**
 * Simple Renderer - Fallback rendering system
 * Renders basic game world without complex dependencies
 */

class SimpleRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 64;
        
        // Simple map data
        this.mapWidth = 25;
        this.mapHeight = 15;
        
        // Create simple map
        this.createSimpleMap();
        
        console.log('🎨 Simple renderer initialized');
    }
    
    createSimpleMap() {
        // Create a simple grass map with some obstacles
        this.mapData = [];
        
        for (let y = 0; y < this.mapHeight; y++) {
            const row = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // 0 = grass, 1 = obstacle
                if (x === 0 || x === this.mapWidth - 1 || y === 0 || y === this.mapHeight - 1) {
                    row.push(1); // Border walls
                } else if (x === 10 && y === 7) {
                    row.push(1); // Center obstacle
                } else {
                    row.push(0); // Grass
                }
            }
            this.mapData.push(row);
        }
    }
    
    render(ctx, entities = []) {
        if (!ctx) return;
        
        // Clear canvas with sky color
        ctx.fillStyle = '#87CEEB'; // Sky blue
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw map
        this.drawMap(ctx);
        
        // Draw entities
        this.drawEntities(ctx, entities);
        
        // Draw UI overlay
        this.drawUI(ctx);
    }
    
    drawMap(ctx) {
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.mapData[y][x];
                const pixelX = x * this.tileSize;
                const pixelY = y * this.tileSize;
                
                if (tile === 0) {
                    // Grass tile
                    ctx.fillStyle = '#4ade80';
                    ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
                    
                    // Add some texture
                    ctx.fillStyle = '#22c55e';
                    ctx.fillRect(pixelX + 5, pixelY + 5, 10, 10);
                    ctx.fillRect(pixelX + 40, pixelY + 20, 8, 8);
                    ctx.fillRect(pixelX + 20, pixelY + 45, 12, 12);
                } else if (tile === 1) {
                    // Wall tile
                    ctx.fillStyle = '#6b7280';
                    ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
                    
                    // Add brick texture
                    ctx.strokeStyle = '#4b5563';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(pixelX, pixelY, this.tileSize, this.tileSize);
                    ctx.strokeRect(pixelX + 16, pixelY + 16, 32, 32);
                }
            }
        }
    }
    
    drawEntities(ctx, entities) {
        for (const entity of entities) {
            const pixelX = entity.x;
            const pixelY = entity.y;
            
            if (entity.type === 'player') {
                // Draw player as a blue square
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(pixelX - 16, pixelY - 16, 32, 32);
                
                // Draw health bar
                this.drawHealthBar(ctx, pixelX, pixelY - 20, entity.health, entity.maxHealth);
                
                // Draw name
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(entity.name, pixelX, pixelY - 25);
            } else if (entity.type === 'mob') {
                // Draw mob as a red square
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(pixelX - 16, pixelY - 16, 32, 32);
                
                // Draw health bar
                this.drawHealthBar(ctx, pixelX, pixelY - 20, entity.health, entity.maxHealth);
            } else if (entity.type === 'npc') {
                // Draw NPC as a green square
                ctx.fillStyle = '#10b981';
                ctx.fillRect(pixelX - 16, pixelY - 16, 32, 32);
                
                // Draw name
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(entity.name, pixelX, pixelY - 25);
            }
        }
    }
    
    drawHealthBar(ctx, x, y, health, maxHealth) {
        const barWidth = 40;
        const barHeight = 4;
        const healthPercentage = health / maxHealth;
        
        // Background
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - barWidth/2, y, barWidth, barHeight);
        
        // Health fill
        ctx.fillStyle = healthPercentage > 0.5 ? '#22c55e' : 
                        healthPercentage > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.fillRect(x - barWidth/2, y, barWidth * healthPercentage, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barWidth/2, y, barWidth, barHeight);
    }
    
    drawUI(ctx) {
        // Draw minimap
        this.drawMinimap(ctx);
        
        // Draw coordinates
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('MMORPG Browser v0.4', 10, 25);
    }
    
    drawMinimap(ctx) {
        const minimapSize = 150;
        const minimapX = this.canvas.width - minimapSize - 10;
        const minimapY = 10;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);
        
        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Mapa', minimapX + minimapSize/2, minimapY + 15);
        
        // Draw simplified map
        const scale = minimapSize / Math.max(this.mapWidth, this.mapHeight);
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.mapData[y][x];
                if (tile === 1) {
                    ctx.fillStyle = '#6b7280';
                    ctx.fillRect(
                        minimapX + x * scale,
                        minimapY + 20 + y * scale,
                        scale,
                        scale
                    );
                }
            }
        }
    }
    
    isWalkable(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return false;
        }
        
        return this.mapData[tileY][tileX] === 0;
    }
}

// Export for use in main game
window.SimpleRenderer = SimpleRenderer;
