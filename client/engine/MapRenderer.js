/**
 * Map Renderer - Tibia Style
 * Renders tile-based maps on canvas
 */

class MapRenderer {
    constructor(ctx, map) {
        this.ctx = ctx;
        this.map = map;
        this.tileSize = 32;
        this.tileTypes = {
            grass: { color: "#2e8b57", walkable: true },
            water: { color: "#1e90ff", walkable: false },
            dirt: { color: "#8b4513", walkable: true },
            stone: { color: "#696969", walkable: true },
            sand: { color: "#f4a460", walkable: true },
            forest: { color: "#228b22", walkable: false },
            mountain: { color: "#808080", walkable: false }
        };
        
        console.log('🗺️ Map Renderer initialized');
    }
    
    /**
     * Draw the entire map
     */
    draw() {
        if (!this.map || !this.map.tiles) {
            console.warn('⚠️ No map data available for rendering');
            return;
        }
        
        // Draw tiles
        this.map.tiles.forEach(tile => {
            this.drawTile(tile);
        });
        
        // Draw grid lines (optional, for debugging)
        this.drawGrid();
    }
    
    /**
     * Draw a single tile
     */
    drawTile(tile) {
        const x = tile.x * this.tileSize;
        const y = tile.y * this.tileSize;
        const tileType = this.tileTypes[tile.type] || this.tileTypes.grass;
        
        // Fill tile with color
        this.ctx.fillStyle = tileType.color;
        this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
        
        // Add texture/details based on tile type
        this.addTileDetails(x, y, tile.type);
        
        // Draw border for non-walkable tiles
        if (!tileType.walkable) {
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        }
    }
    
    /**
     * Add visual details to tiles
     */
    addTileDetails(x, y, tileType) {
        switch (tileType) {
            case 'grass':
                // Add some grass texture dots
                this.ctx.fillStyle = 'rgba(46, 125, 87, 0.3)';
                for (let i = 0; i < 3; i++) {
                    const dotX = x + Math.random() * this.tileSize;
                    const dotY = y + Math.random() * this.tileSize;
                    this.ctx.fillRect(dotX, dotY, 2, 2);
                }
                break;
                
            case 'water':
                // Add wave effect
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x + 5, y + this.tileSize / 2);
                this.ctx.lineTo(x + this.tileSize - 5, y + this.tileSize / 2);
                this.ctx.stroke();
                break;
                
            case 'dirt':
                // Add dirt texture
                this.ctx.fillStyle = 'rgba(139, 69, 19, 0.2)';
                for (let i = 0; i < 2; i++) {
                    const dotX = x + Math.random() * this.tileSize;
                    const dotY = y + Math.random() * this.tileSize;
                    this.ctx.fillRect(dotX, dotY, 3, 3);
                }
                break;
                
            case 'forest':
                // Add tree representation
                this.ctx.fillStyle = '#0d5d0d';
                this.ctx.fillRect(x + this.tileSize / 2 - 4, y + this.tileSize / 2 - 4, 8, 8);
                break;
                
            case 'mountain':
                // Add mountain peak
                this.ctx.fillStyle = '#4a4a4a';
                this.ctx.beginPath();
                this.ctx.moveTo(x + this.tileSize / 2, y + 5);
                this.ctx.lineTo(x + 5, y + this.tileSize - 5);
                this.ctx.lineTo(x + this.tileSize - 5, y + this.tileSize - 5);
                this.ctx.closePath();
                this.ctx.fill();
                break;
        }
    }
    
    /**
     * Draw grid lines (for debugging)
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= this.map.width; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.tileSize, 0);
            this.ctx.lineTo(x * this.tileSize, this.map.height * this.tileSize);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.map.height; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.tileSize);
            this.ctx.lineTo(this.map.width * this.tileSize, y * this.tileSize);
            this.ctx.stroke();
        }
    }
    
    /**
     * Convert world coordinates to tile coordinates
     */
    worldToTile(worldX, worldY) {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }
    
    /**
     * Convert tile coordinates to world coordinates
     */
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * this.tileSize + this.tileSize / 2,
            y: tileY * this.tileSize + this.tileSize / 2
        };
    }
    
    /**
     * Check if a tile is walkable
     */
    isTileWalkable(tileX, tileY) {
        const tile = this.map.tiles.find(t => t.x === tileX && t.y === tileY);
        if (!tile) return false;
        
        const tileType = this.tileTypes[tile.type] || this.tileTypes.grass;
        return tileType.walkable;
    }
    
    /**
     * Get tile at position
     */
    getTileAt(worldX, worldY) {
        const tileCoords = this.worldToTile(worldX, worldY);
        return this.map.tiles.find(t => t.x === tileCoords.x && t.y === tileCoords.y);
    }
}

// Export for global use
window.MapRenderer = MapRenderer;
