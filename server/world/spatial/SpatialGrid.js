/**
 * Spatial Grid System
 * Implements spatial partitioning for efficient entity queries
 * Divides the world into a grid for fast nearby entity lookups
 */

class SpatialGrid {
    constructor(worldWidth, worldHeight, cellSize) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize;
        
        // Calculate grid dimensions
        this.gridWidth = Math.ceil(worldWidth / cellSize);
        this.gridHeight = Math.ceil(worldHeight / cellSize);
        
        // Initialize grid cells
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = new Set(); // Use Set for O(1) operations
            }
        }
        
        // Entity position cache for efficient updates
        this.entityPositions = new Map(); // entityId -> {gridX, gridY}
        
        // Performance tracking
        this.stats = {
            totalEntities: 0,
            updateOperations: 0,
            queryOperations: 0,
            averageUpdateTime: 0,
            averageQueryTime: 0
        };
    }

    /**
     * Convert world coordinates to grid coordinates
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {object} - Grid coordinates {gridX, gridY}
     */
    worldToGrid(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        
        return {
            gridX: Math.max(0, Math.min(this.gridWidth - 1, gridX)),
            gridY: Math.max(0, Math.min(this.gridHeight - 1, gridY))
        };
    }

    /**
     * Convert grid coordinates to world coordinates
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {object} - World coordinates {x, y}
     */
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.cellSize,
            y: gridY * this.cellSize
        };
    }

    /**
     * Add entity to the grid
     * @param {number} entityId - Entity ID
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @returns {boolean} - True if entity was added
     */
    addEntity(entityId, x, y) {
        const startTime = performance.now();
        
        const { gridX, gridY } = this.worldToGrid(x, y);
        
        // Remove from old position if exists
        this.removeEntity(entityId);
        
        // Add to new position
        this.grid[gridY][gridX].add(entityId);
        this.entityPositions.set(entityId, { gridX, gridY });
        
        // Update statistics
        this.stats.totalEntities = this.entityPositions.size;
        this.stats.updateOperations++;
        
        const endTime = performance.now();
        this.updateAverageStats('update', endTime - startTime);
        
        return true;
    }

    /**
     * Remove entity from the grid
     * @param {number} entityId - Entity ID
     * @returns {boolean} - True if entity was removed
     */
    removeEntity(entityId) {
        const startTime = performance.now();
        
        const position = this.entityPositions.get(entityId);
        if (!position) return false;
        
        // Remove from grid cell
        this.grid[position.gridY][position.gridX].delete(entityId);
        
        // Remove from cache
        this.entityPositions.delete(entityId);
        
        // Update statistics
        this.stats.totalEntities = this.entityPositions.size;
        this.stats.updateOperations++;
        
        const endTime = performance.now();
        this.updateAverageStats('update', endTime - startTime);
        
        return true;
    }

    /**
     * Update entity position
     * @param {number} entityId - Entity ID
     * @param {number} newX - New world X coordinate
     * @param {number} newY - New world Y coordinate
     * @returns {boolean} - True if position was updated
     */
    updateEntity(entityId, newX, newY) {
        const startTime = performance.now();
        
        const currentPos = this.entityPositions.get(entityId);
        if (!currentPos) {
            // Entity not in grid, add it
            return this.addEntity(entityId, newX, newY);
        }
        
        const { gridX, gridY } = this.worldToGrid(newX, newY);
        
        // Check if entity moved to a different cell
        if (currentPos.gridX === gridX && currentPos.gridY === gridY) {
            return false; // No movement needed
        }
        
        // Remove from old cell
        this.grid[currentPos.gridY][currentPos.gridX].delete(entityId);
        
        // Add to new cell
        this.grid[gridY][gridX].add(entityId);
        this.entityPositions.set(entityId, { gridX, gridY });
        
        // Update statistics
        this.stats.updateOperations++;
        
        const endTime = performance.now();
        this.updateAverageStats('update', endTime - startTime);
        
        return true;
    }

    /**
     * Get entities in a specific cell
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Set<number>} - Set of entity IDs in the cell
     */
    getEntitiesInCell(gridX, gridY) {
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return new Set();
        }
        
        return this.grid[gridY][gridX];
    }

    /**
     * Get entities in radius around a position
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     * @param {number} radius - Search radius
     * @returns {Set<number>} - Set of entity IDs in radius
     */
    getNearbyEntities(x, y, radius) {
        const startTime = performance.now();
        
        const { gridX, gridY } = this.worldToGrid(x, y);
        const radiusInCells = Math.ceil(radius / this.cellSize);
        
        const nearbyEntities = new Set();
        
        // Check all cells in radius
        for (let dy = -radiusInCells; dy <= radiusInCells; dy++) {
            for (let dx = -radiusInCells; dx <= radiusInCells; dx++) {
                const checkX = gridX + dx;
                const checkY = gridY + dy;
                
                if (checkX >= 0 && checkX < this.gridWidth && checkY >= 0 && checkY < this.gridHeight) {
                    const cellEntities = this.grid[checkY][checkX];
                    
                    // Check actual distance for entities in edge cells
                    for (const entityId of cellEntities) {
                        const entityPos = this.entityPositions.get(entityId);
                        if (entityPos) {
                            const worldPos = this.gridToWorld(entityPos.gridX, entityPos.gridY);
                            const distance = Math.sqrt(
                                Math.pow(worldPos.x - x, 2) + 
                                Math.pow(worldPos.y - y, 2)
                            );
                            
                            if (distance <= radius) {
                                nearbyEntities.add(entityId);
                            }
                        } else {
                            // Entity in cell but not tracked, add it (fallback)
                            nearbyEntities.add(entityId);
                        }
                    }
                }
            }
        }
        
        // Update statistics
        this.stats.queryOperations++;
        
        const endTime = performance.now();
        this.updateAverageStats('query', endTime - startTime);
        
        return nearbyEntities;
    }

    /**
     * Get entities in rectangular area
     * @param {number} x - World X coordinate (top-left)
     * @param {number} y - World Y coordinate (top-left)
     * @param {number} width - Area width
     * @param {number} height - Area height
     * @returns {Set<number>} - Set of entity IDs in area
     */
    getEntitiesInArea(x, y, width, height) {
        const startTime = performance.now();
        
        const { gridX: startX, gridY: startY } = this.worldToGrid(x, y);
        const { gridX: endX, gridY: endY } = this.worldToGrid(x + width, y + height);
        
        const areaEntities = new Set();
        
        // Check all cells in area
        for (let gridY = startY; gridY <= endY && gridY < this.gridHeight; gridY++) {
            for (let gridX = startX; gridX <= endX && gridX < this.gridWidth; gridX++) {
                if (gridX >= 0 && gridY >= 0) {
                    const cellEntities = this.grid[gridY][gridX];
                    for (const entityId of cellEntities) {
                        areaEntities.add(entityId);
                    }
                }
            }
        }
        
        // Update statistics
        this.stats.queryOperations++;
        
        const endTime = performance.now();
        this.updateAverageStats('query', endTime - startTime);
        
        return areaEntities;
    }

    /**
     * Get cells intersecting with a circle
     * @param {number} x - Circle center X
     * @param {number} y - Circle center Y
     * @param {number} radius - Circle radius
     * @returns {Array<object>} - Array of {gridX, gridY} cell coordinates
     */
    getCellsInCircle(x, y, radius) {
        const { gridX, gridY } = this.worldToGrid(x, y);
        const radiusInCells = Math.ceil(radius / this.cellSize);
        
        const cells = [];
        
        for (let dy = -radiusInCells; dy <= radiusInCells; dy++) {
            for (let dx = -radiusInCells; dx <= radiusInCells; dx++) {
                const checkX = gridX + dx;
                const checkY = gridY + dy;
                
                if (checkX >= 0 && checkX < this.gridWidth && checkY >= 0 && checkY < this.gridHeight) {
                    // Check if cell actually intersects with circle
                    const cellCenterX = (checkX + 0.5) * this.cellSize;
                    const cellCenterY = (checkY + 0.5) * this.cellSize;
                    const distance = Math.sqrt(
                        Math.pow(cellCenterX - x, 2) + 
                        Math.pow(cellCenterY - y, 2)
                    );
                    
                    if (distance <= radius + this.cellSize * 0.707) { // sqrt(2)/2 for corner
                        cells.push({ gridX: checkX, gridY: checkY });
                    }
                }
            }
        }
        
        return cells;
    }

    /**
     * Clear all entities from the grid
     */
    clear() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x].clear();
            }
        }
        
        this.entityPositions.clear();
        this.stats.totalEntities = 0;
    }

    /**
     * Get grid statistics
     * @returns {object} - Grid statistics
     */
    getStats() {
        return {
            ...this.stats,
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            cellSize: this.cellSize,
            totalCells: this.gridWidth * this.gridHeight,
            averageEntitiesPerCell: this.stats.totalEntities / (this.gridWidth * this.gridHeight)
        };
    }

    /**
     * Get cell occupancy information
     * @returns {object} - Cell occupancy stats
     */
    getOccupancyStats() {
        let occupiedCells = 0;
        let maxEntitiesInCell = 0;
        let totalEntitiesInCells = 0;
        
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cellSize = this.grid[y][x].size;
                if (cellSize > 0) {
                    occupiedCells++;
                    maxEntitiesInCell = Math.max(maxEntitiesInCell, cellSize);
                    totalEntitiesInCells += cellSize;
                }
            }
        }
        
        return {
            occupiedCells,
            emptyCells: (this.gridWidth * this.gridHeight) - occupiedCells,
            maxEntitiesInCell,
            averageEntitiesPerOccupiedCell: occupiedCells > 0 ? totalEntitiesInCells / occupiedCells : 0
        };
    }

    /**
     * Update average statistics
     * @param {string} type - 'update' or 'query'
     * @param {number} time - Operation time
     */
    updateAverageStats(type, time) {
        if (type === 'update') {
            this.stats.averageUpdateTime = 
                (this.stats.averageUpdateTime * (this.stats.updateOperations - 1) + time) / 
                this.stats.updateOperations;
        } else if (type === 'query') {
            this.stats.averageQueryTime = 
                (this.stats.averageQueryTime * (this.stats.queryOperations - 1) + time) / 
                this.stats.queryOperations;
        }
    }

    /**
     * Debug visualization of grid (for development)
     * @returns {object} - Grid visualization data
     */
    debugVisualization() {
        const visualization = [];
        
        for (let y = 0; y < this.gridHeight; y++) {
            const row = [];
            for (let x = 0; x < this.gridWidth; x++) {
                row.push(this.grid[y][x].size);
            }
            visualization.push(row);
        }
        
        return {
            grid: visualization,
            dimensions: { width: this.gridWidth, height: this.gridHeight },
            cellSize: this.cellSize,
            totalEntities: this.stats.totalEntities
        };
    }
}

module.exports = SpatialGrid;
