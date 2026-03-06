/**
 * Tile Map System
 * Handles tile-based world representation
 */

// Tile constants
export const TILE_SIZE = 32;
export const GRID_W = 25;
export const GRID_H = 15;

// Tile types
export const TILE_TYPES = {
    EMPTY: 0,
    WALL: 1,
    WATER: 2,
    LAVA: 3,
    GRASS: 4,
    STONE: 5,
    WOOD: 6,
    SAND: 7,
    SNOW: 8,
    SWAMP: 9,
    MOUNTAIN: 10,
    FOREST: 11,
    DESERT: 12,
    FROZEN: 13,
    VOLCANIC: 14,
    DARKLANDS: 15,
    PORTAL: 16,
    CHEST: 17,
    DOOR: 18,
    STAIRS_UP: 19,
    STAIRS_DOWN: 20
};

// Tile properties
export const TILE_PROPERTIES = {
    [TILE_TYPES.EMPTY]: {
        name: 'Empty',
        walkable: true,
        transparent: true,
        color: '#404040'
    },
    [TILE_TYPES.WALL]: {
        name: 'Wall',
        walkable: false,
        transparent: false,
        color: '#808080'
    },
    [TILE_TYPES.WATER]: {
        name: 'Water',
        walkable: false,
        transparent: true,
        color: '#006994'
    },
    [TILE_TYPES.LAVA]: {
        name: 'Lava',
        walkable: false,
        transparent: true,
        color: '#ff6b35',
        damage: 10
    },
    [TILE_TYPES.GRASS]: {
        name: 'Grass',
        walkable: true,
        transparent: true,
        color: '#4a7c59'
    },
    [TILE_TYPES.STONE]: {
        name: 'Stone',
        walkable: true,
        transparent: true,
        color: '#8b8680'
    },
    [TILE_TYPES.WOOD]: {
        name: 'Wood',
        walkable: true,
        transparent: true,
        color: '#8b4513'
    },
    [TILE_TYPES.SAND]: {
        name: 'Sand',
        walkable: true,
        transparent: true,
        color: '#c2b280'
    },
    [TILE_TYPES.SNOW]: {
        name: 'Snow',
        walkable: true,
        transparent: true,
        color: '#ffffff'
    },
    [TILE_TYPES.SWAMP]: {
        name: 'Swamp',
        walkable: true,
        transparent: true,
        color: '#4a5d23',
        speed: 0.7
    },
    [TILE_TYPES.MOUNTAIN]: {
        name: 'Mountain',
        walkable: false,
        transparent: false,
        color: '#696969'
    },
    [TILE_TYPES.FOREST]: {
        name: 'Forest',
        walkable: true,
        transparent: false,
        color: '#2d5016',
        speed: 0.8
    },
    [TILE_TYPES.DESERT]: {
        name: 'Desert',
        walkable: true,
        transparent: true,
        color: '#edc9af',
        speed: 0.9
    },
    [TILE_TYPES.FROZEN]: {
        name: 'Frozen',
        walkable: true,
        transparent: true,
        color: '#b0e0e6',
        speed: 0.6
    },
    [TILE_TYPES.VOLCANIC]: {
        name: 'Volcanic',
        walkable: true,
        transparent: true,
        color: '#8b0000',
        damage: 5
    },
    [TILE_TYPES.DARKLANDS]: {
        name: 'Darklands',
        walkable: true,
        transparent: false,
        color: '#1a1a1a'
    },
    [TILE_TYPES.PORTAL]: {
        name: 'Portal',
        walkable: true,
        transparent: true,
        color: '#9400d3',
        interactive: true
    },
    [TILE_TYPES.CHEST]: {
        name: 'Chest',
        walkable: false,
        transparent: true,
        color: '#8b4513',
        interactive: true
    },
    [TILE_TYPES.DOOR]: {
        name: 'Door',
        walkable: true,
        transparent: false,
        color: '#654321',
        interactive: true
    },
    [TILE_TYPES.STAIRS_UP]: {
        name: 'Stairs Up',
        walkable: true,
        transparent: true,
        color: '#d2691e',
        interactive: true
    },
    [TILE_TYPES.STAIRS_DOWN]: {
        name: 'Stairs Down',
        walkable: true,
        transparent: true,
        color: '#8b4513',
        interactive: true
    }
};

class TileMap {
    constructor(width = GRID_W, height = GRID_H) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.metadata = [];
        this.lighting = [];
        this.visibility = [];
        
        this.initialize();
    }
    
    initialize() {
        // Initialize tile array
        this.tiles = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(TILE_TYPES.EMPTY)
        );
        
        // Initialize metadata array
        this.metadata = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(null).map(() => ({}))
        );
        
        // Initialize lighting array
        this.lighting = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(1.0)
        );
        
        // Initialize visibility array
        this.visibility = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(false)
        );
        
        // Create border walls
        this.createBorderWalls();
    }
    
    createBorderWalls() {
        for (let x = 0; x < this.width; x++) {
            this.tiles[0][x] = TILE_TYPES.WALL;
            this.tiles[this.height - 1][x] = TILE_TYPES.WALL;
        }
        
        for (let y = 0; y < this.height; y++) {
            this.tiles[y][0] = TILE_TYPES.WALL;
            this.tiles[y][this.width - 1] = TILE_TYPES.WALL;
        }
    }
    
    setTile(x, y, tileType, metadata = {}) {
        if (this.isValidPosition(x, y)) {
            this.tiles[y][x] = tileType;
            this.metadata[y][x] = { ...this.metadata[y][x], ...metadata };
        }
    }
    
    getTile(x, y) {
        if (this.isValidPosition(x, y)) {
            return this.tiles[y][x];
        }
        return null;
    }
    
    getTileProperties(x, y) {
        const tileType = this.getTile(x, y);
        return TILE_PROPERTIES[tileType] || TILE_PROPERTIES[TILE_TYPES.EMPTY];
    }
    
    getTileMetadata(x, y) {
        if (this.isValidPosition(x, y)) {
            return this.metadata[y][x];
        }
        return {};
    }
    
    setTileMetadata(x, y, metadata) {
        if (this.isValidPosition(x, y)) {
            this.metadata[y][x] = { ...this.metadata[y][x], ...metadata };
        }
    }
    
    isValidPosition(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    isWalkable(x, y) {
        const props = this.getTileProperties(x, y);
        return props.walkable === true;
    }
    
    isTransparent(x, y) {
        const props = this.getTileProperties(x, y);
        return props.transparent === true;
    }
    
    isInteractive(x, y) {
        const props = this.getTileProperties(x, y);
        return props.interactive === true;
    }
    
    getMovementSpeed(x, y) {
        const props = this.getTileProperties(x, y);
        return props.speed || 1.0;
    }
    
    getTileDamage(x, y) {
        const props = this.getTileProperties(x, y);
        return props.damage || 0;
    }
    
    // Line of sight calculation
    hasLineOfSight(x1, y1, x2, y2, maxDistance = Infinity) {
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        if (distance > maxDistance) return false;
        
        // Bresenham's line algorithm
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            if (x === x2 && y === y2) break;
            if (!this.isTransparent(x, y)) return false;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return true;
    }
    
    // Pathfinding
    findPath(startX, startY, endX, endY, maxDistance = 100) {
        if (!this.isWalkable(endX, endY)) return null;
        
        const openSet = new Set();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${startX},${startY}`;
        const endKey = `${endX},${endY}`;
        
        openSet.add(startKey);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startX, startY, endX, endY));
        
        while (openSet.size > 0) {
            // Find node with lowest fScore
            let current = null;
            let lowestF = Infinity;
            
            for (const node of openSet) {
                const f = fScore.get(node) || Infinity;
                if (f < lowestF) {
                    lowestF = f;
                    current = node;
                }
            }
            
            if (current === endKey) {
                // Reconstruct path
                const path = [];
                let node = current;
                
                while (node) {
                    const [x, y] = node.split(',').map(Number);
                    path.unshift({ x, y });
                    node = cameFrom.get(node);
                }
                
                return path.length > maxDistance ? null : path;
            }
            
            openSet.delete(current);
            closedSet.add(current);
            
            // Check neighbors
            const [currentX, currentY] = current.split(',').map(Number);
            
            for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
                const neighborX = currentX + dx;
                const neighborY = currentY + dy;
                const neighborKey = `${neighborX},${neighborY}`;
                
                if (!this.isValidPosition(neighborX, neighborY) ||
                    !this.isWalkable(neighborX, neighborY) ||
                    closedSet.has(neighborKey)) {
                    continue;
                }
                
                const tentativeG = (gScore.get(current) || Infinity) + 1;
                
                if (!openSet.has(neighborKey)) {
                    openSet.add(neighborKey);
                } else if (tentativeG >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }
                
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + this.heuristic(neighborX, neighborY, endX, endY));
            }
        }
        
        return null; // No path found
    }
    
    heuristic(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1); // Manhattan distance
    }
    
    // Visibility and lighting
    updateVisibility(playerX, playerY, viewRadius = 8) {
        // Reset visibility
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.visibility[y][x] = false;
            }
        }
        
        // Calculate visible tiles using raycasting
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 180) {
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            
            for (let distance = 0; distance <= viewRadius; distance += 0.5) {
                const x = Math.floor(playerX + dx * distance);
                const y = Math.floor(playerY + dy * distance);
                
                if (!this.isValidPosition(x, y)) break;
                
                this.visibility[y][x] = true;
                
                if (!this.isTransparent(x, y)) break;
            }
        }
    }
    
    isVisible(x, y) {
        if (this.isValidPosition(x, y)) {
            return this.visibility[y][x];
        }
        return false;
    }
    
    setLighting(x, y, intensity) {
        if (this.isValidPosition(x, y)) {
            this.lighting[y][x] = Math.max(0, Math.min(1, intensity));
        }
    }
    
    getLighting(x, y) {
        if (this.isValidPosition(x, y)) {
            return this.lighting[y][x];
        }
        return 1.0;
    }
    
    // Utility methods
    fillRect(x, y, width, height, tileType, metadata = {}) {
        for (let py = y; py < y + height && py < this.height; py++) {
            for (let px = x; px < x + width && px < this.width; px++) {
                this.setTile(px, py, tileType, metadata);
            }
        }
    }
    
    fillCircle(centerX, centerY, radius, tileType, metadata = {}) {
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                if (x * x + y * y <= radius * radius) {
                    this.setTile(centerX + x, centerY + y, tileType, metadata);
                }
            }
        }
    }
    
    createLine(x1, y1, x2, y2, tileType, metadata = {}) {
        // Bresenham's line algorithm
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            this.setTile(x, y, tileType, metadata);
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }
    
    // Serialization
    serialize() {
        return {
            width: this.width,
            height: this.height,
            tiles: this.tiles,
            metadata: this.metadata,
            lighting: this.lighting
        };
    }
    
    deserialize(data) {
        this.width = data.width;
        this.height = data.height;
        this.tiles = data.tiles;
        this.metadata = data.metadata;
        this.lighting = data.lighting || Array(this.height).fill(null).map(() => 
            Array(this.width).fill(1.0)
        );
        this.visibility = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(false)
        );
    }
    
    // Clone
    clone() {
        const newMap = new TileMap(this.width, this.height);
        newMap.tiles = this.tiles.map(row => [...row]);
        newMap.metadata = this.metadata.map(row => row.map(meta => ({ ...meta })));
        newMap.lighting = this.lighting.map(row => [...row]);
        return newMap;
    }
}

export default TileMap;
