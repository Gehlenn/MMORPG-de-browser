/**
 * Chunk System
 * Represents a chunk of the world map with caching and optimization
 */

import TileMap from './TileMap.js';

class Chunk {
    constructor(worldX, worldY, size = 50) {
        this.worldX = worldX;
        this.worldY = worldY;
        this.size = size;
        
        // Map data
        this.map = new TileMap(size, size);
        
        // Chunk metadata
        this.biome = null;
        this.entities = [];
        this.resources = [];
        this.structures = [];
        
        // Special structures
        this.city = null;
        this.road = null;
        this.dungeon = null;
        this.portal = null;
        
        // State
        this.loaded = false;
        this.modified = false;
        this.lastAccessed = Date.now();
        
        // Optimization
        this.hash = null;
        this.compressed = null;
    }
    
    setBiome(biome) {
        this.biome = biome;
        this.modified = true;
    }
    
    addEntity(entity) {
        if (!this.entities.includes(entity)) {
            this.entities.push(entity);
            this.modified = true;
        }
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            this.modified = true;
        }
    }
    
    addResource(resource) {
        this.resources.push(resource);
        this.modified = true;
    }
    
    addStructure(structure) {
        this.structures.push(structure);
        this.modified = true;
    }
    
    getEntitiesInArea(x, y, width, height) {
        return this.entities.filter(entity => {
            return entity.x >= x && entity.x < x + width &&
                   entity.y >= y && entity.y < y + height;
        });
    }
    
    getResourcesAt(x, y) {
        return this.resources.filter(resource => {
            return resource.x === x && resource.y === y;
        });
    }
    
    getStructureAt(x, y) {
        return this.structures.find(structure => {
            return structure.x === x && structure.y === y;
        });
    }
    
    update(deltaTime) {
        // Update entities in this chunk
        for (const entity of this.entities) {
            if (entity.update && entity.active !== false) {
                entity.update(deltaTime);
            }
        }
        
        // Update resources (respawn, regeneration, etc.)
        this.updateResources(deltaTime);
        
        // Update structures
        this.updateStructures(deltaTime);
        
        this.lastAccessed = Date.now();
    }
    
    updateResources(deltaTime) {
        for (const resource of this.resources) {
            if (resource.regenerate && resource.amount < resource.maxAmount) {
                resource.amount = Math.min(
                    resource.maxAmount,
                    resource.amount + (resource.regenerationRate * deltaTime / 1000)
                );
            }
        }
    }
    
    updateStructures(deltaTime) {
        for (const structure of this.structures) {
            if (structure.update) {
                structure.update(deltaTime);
            }
        }
    }
    
    markAsLoaded() {
        this.loaded = true;
    }
    
    markAsUnloaded() {
        this.loaded = false;
    }
    
    isExpired(maxAge = 300000) { // 5 minutes default
        return !this.loaded && (Date.now() - this.lastAccessed) > maxAge;
    }
    
    // Serialization
    serialize() {
        return {
            worldX: this.worldX,
            worldY: this.worldY,
            size: this.size,
            biome: this.biome?.id || null,
            map: this.map.serialize(),
            entities: this.entities.map(e => e.serialize ? e.serialize() : e),
            resources: this.resources,
            structures: this.structures,
            city: this.city,
            road: this.road,
            dungeon: this.dungeon,
            portal: this.portal,
            modified: this.modified
        };
    }
    
    deserialize(data) {
        this.worldX = data.worldX;
        this.worldY = data.worldY;
        this.size = data.size;
        
        if (data.biome) {
            // Biome would be set from biome system
            this.biome = { id: data.biome };
        }
        
        this.map.deserialize(data.map);
        this.entities = data.entities || [];
        this.resources = data.resources || [];
        this.structures = data.structures || [];
        this.city = data.city;
        this.road = data.road;
        this.dungeon = data.dungeon;
        this.portal = data.portal;
        this.modified = data.modified || false;
    }
    
    // Compression for storage/transmission
    compress() {
        if (this.compressed && !this.modified) {
            return this.compressed;
        }
        
        const data = this.serialize();
        this.compressed = this.compressData(data);
        this.hash = this.calculateHash(data);
        this.modified = false;
        
        return this.compressed;
    }
    
    decompress(compressedData) {
        const data = this.decompressData(compressedData);
        this.deserialize(data);
    }
    
    compressData(data) {
        // Simple compression - in a real implementation, use proper compression
        return JSON.stringify(data);
    }
    
    decompressData(compressedData) {
        // Simple decompression
        return JSON.parse(compressedData);
    }
    
    calculateHash(data) {
        // Simple hash calculation
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    
    // Utility methods
    getWorldPosition() {
        return {
            x: this.worldX * this.size,
            y: this.worldY * this.size
        };
    }
    
    getBounds() {
        const worldPos = this.getWorldPosition();
        return {
            left: worldPos.x,
            top: worldPos.y,
            right: worldPos.x + this.size,
            bottom: worldPos.y + this.size
        };
    }
    
    contains(worldX, worldY) {
        const bounds = this.getBounds();
        return worldX >= bounds.left && worldX < bounds.right &&
               worldY >= bounds.top && worldY < bounds.bottom;
    }
    
    getLocalCoordinates(worldX, worldY) {
        const worldPos = this.getWorldPosition();
        return {
            x: worldX - worldPos.x,
            y: worldY - worldPos.y
        };
    }
    
    getWorldCoordinates(localX, localY) {
        const worldPos = this.getWorldPosition();
        return {
            x: worldPos.x + localX,
            y: worldPos.y + localY
        };
    }
    
    // Debug methods
    getDebugInfo() {
        return {
            position: `${this.worldX},${this.worldY}`,
            biome: this.biome?.id || 'unknown',
            entities: this.entities.length,
            resources: this.resources.length,
            structures: this.structures.length,
            hasCity: !!this.city,
            hasRoad: !!this.road,
            hasDungeon: !!this.dungeon,
            hasPortal: !!this.portal,
            loaded: this.loaded,
            modified: this.modified,
            lastAccessed: new Date(this.lastAccessed).toISOString()
        };
    }
    
    // Resource management
    harvestResource(x, y, amount = 1) {
        const resources = this.getResourcesAt(x, y);
        let harvested = null;
        
        for (const resource of resources) {
            if (resource.amount >= amount) {
                resource.amount -= amount;
                harvested = {
                    type: resource.type,
                    amount: amount,
                    rarity: resource.rarity
                };
                
                // Remove resource if depleted
                if (resource.amount <= 0) {
                    const index = this.resources.indexOf(resource);
                    if (index > -1) {
                        this.resources.splice(index, 1);
                    }
                }
                
                break;
            }
        }
        
        if (harvested) {
            this.modified = true;
        }
        
        return harvested;
    }
    
    // Entity management
    spawnEntity(entity, x, y) {
        entity.x = x;
        entity.y = y;
        entity.chunkX = this.worldX;
        entity.chunkY = this.worldY;
        
        this.addEntity(entity);
        return entity;
    }
    
    despawnEntity(entity) {
        this.removeEntity(entity);
        return entity;
    }
    
    // Structure interaction
    interactWithStructure(x, y, player) {
        const structure = this.getStructureAt(x, y);
        if (structure && structure.interact) {
            return structure.interact(player);
        }
        return null;
    }
    
    // Chunk optimization
    optimize() {
        // Remove invalid entities
        this.entities = this.entities.filter(entity => {
            return entity && entity.x >= 0 && entity.x < this.size &&
                   entity.y >= 0 && entity.y < this.size;
        });
        
        // Remove invalid resources
        this.resources = this.resources.filter(resource => {
            return resource && resource.x >= 0 && resource.x < this.size &&
                   resource.y >= 0 && resource.y < this.size &&
                   resource.amount > 0;
        });
        
        // Remove invalid structures
        this.structures = this.structures.filter(structure => {
            return structure && structure.x >= 0 && structure.x < this.size &&
                   structure.y >= 0 && structure.y < this.size;
        });
    }
    
    // Clone
    clone() {
        const newChunk = new Chunk(this.worldX, this.worldY, this.size);
        newChunk.deserialize(this.serialize());
        return newChunk;
    }
    
    // Merge with adjacent chunks (for seamless transitions)
    getAdjacentChunks(chunkCache) {
        const adjacent = [];
        const directions = [
            { dx: -1, dy: 0 }, // West
            { dx: 1, dy: 0 },  // East
            { dx: 0, dy: -1 }, // North
            { dx: 0, dy: 1 }   // South
        ];
        
        for (const dir of directions) {
            const adjX = this.worldX + dir.dx;
            const adjY = this.worldY + dir.dy;
            const adjChunk = chunkCache.get(`${adjX},${adjY}`);
            
            if (adjChunk) {
                adjacent.push({
                    chunk: adjChunk,
                    direction: dir
                });
            }
        }
        
        return adjacent;
    }
    
    // Smooth transitions with adjacent chunks
    smoothTransitions(adjacentChunks) {
        // Smooth terrain at chunk boundaries
        for (const adj of adjacentChunks) {
            this.smoothBoundary(adj.chunk, adj.direction);
        }
    }
    
    smoothBoundary(adjacentChunk, direction) {
        // Simple boundary smoothing
        let startX, startY, endX, endY;
        let adjStartX, adjStartY;
        
        switch (direction.dx) {
            case -1: // West boundary
                startX = 0;
                endX = 1;
                startY = 0;
                endY = this.size;
                adjStartX = adjacentChunk.size - 1;
                adjStartY = 0;
                break;
            case 1: // East boundary
                startX = this.size - 1;
                endX = this.size;
                startY = 0;
                endY = this.size;
                adjStartX = 0;
                adjStartY = 0;
                break;
        }
        
        switch (direction.dy) {
            case -1: // North boundary
                startX = 0;
                endX = this.size;
                startY = 0;
                endY = 1;
                adjStartX = 0;
                adjStartY = adjacentChunk.size - 1;
                break;
            case 1: // South boundary
                startX = 0;
                endX = this.size;
                startY = this.size - 1;
                endY = this.size;
                adjStartX = 0;
                adjStartY = 0;
                break;
        }
        
        // Smooth the boundary by averaging tile types
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const adjX = adjStartX + (x - startX);
                const adjY = adjStartY + (y - startY);
                
                const currentTile = this.map.getTile(x, y);
                const adjacentTile = adjacentChunk.map.getTile(adjX, adjY);
                
                // Simple smoothing logic
                if (currentTile !== adjacentTile && Math.random() < 0.3) {
                    this.map.setTile(x, y, adjacentTile);
                }
            }
        }
    }
}

export default Chunk;
