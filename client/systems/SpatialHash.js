/**
 * SpatialHash.js
 * Sistema de Spatial Hashing para Colisão Otimizada
 * Legacy of Komodo MMORPG v0.5.0
 */

class SpatialHash {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.objects = new Map();
        
        console.log(`🎯 SpatialHash initialized (cell size: ${cellSize})`);
    }

    /**
     * Converte coordenada para chave de célula
     */
    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    /**
     * Obtém todas as chaves de células que o objeto ocupa
     */
    getCellsForObject(obj) {
        const cells = new Set();
        
        // Calcula células baseadas na bounding box do objeto
        const minX = obj.x - (obj.width || 32) / 2;
        const maxX = obj.x + (obj.width || 32) / 2;
        const minY = obj.y - (obj.height || 32) / 2;
        const maxY = obj.y + (obj.height || 32) / 2;
        
        const startCellX = Math.floor(minX / this.cellSize);
        const endCellX = Math.floor(maxX / this.cellSize);
        const startCellY = Math.floor(minY / this.cellSize);
        const endCellY = Math.floor(maxY / this.cellSize);
        
        for (let cx = startCellX; cx <= endCellX; cx++) {
            for (let cy = startCellY; cy <= endCellY; cy++) {
                cells.add(`${cx},${cy}`);
            }
        }
        
        return cells;
    }

    /**
     * Insere objeto no spatial hash
     */
    insert(obj) {
        if (!obj || !obj.id) {
            console.warn('Cannot insert object without id');
            return;
        }
        
        // Remove objeto anterior se existir
        this.remove(obj);
        
        // Obtém células que o objeto ocupa
        const cells = this.getCellsForObject(obj);
        
        // Insere em cada célula
        cells.forEach(cellKey => {
            if (!this.grid.has(cellKey)) {
                this.grid.set(cellKey, new Set());
            }
            this.grid.get(cellKey).add(obj.id);
        });
        
        // Armazena referência ao objeto e suas células
        this.objects.set(obj.id, {
            obj: obj,
            cells: cells
        });
    }

    /**
     * Remove objeto do spatial hash
     */
    remove(obj) {
        if (!obj || !obj.id) return;
        
        const stored = this.objects.get(obj.id);
        if (!stored) return;
        
        // Remove de todas as células
        stored.cells.forEach(cellKey => {
            const cell = this.grid.get(cellKey);
            if (cell) {
                cell.delete(obj.id);
                if (cell.size === 0) {
                    this.grid.delete(cellKey);
                }
            }
        });
        
        this.objects.delete(obj.id);
    }

    /**
     * Atualiza posição do objeto
     */
    update(obj) {
        if (!obj || !obj.id) return;
        
        const stored = this.objects.get(obj.id);
        if (!stored) {
            // Objeto não estava no hash, insere
            this.insert(obj);
            return;
        }
        
        // Verifica se mudou de célula
        const newCells = this.getCellsForObject(obj);
        const oldCells = stored.cells;
        
        // Se as células são as mesmas, não precisa atualizar
        if (this.setsEqual(newCells, oldCells)) return;
        
        // Remove das células antigas que não estão mais ocupadas
        oldCells.forEach(cellKey => {
            if (!newCells.has(cellKey)) {
                const cell = this.grid.get(cellKey);
                if (cell) {
                    cell.delete(obj.id);
                    if (cell.size === 0) {
                        this.grid.delete(cellKey);
                    }
                }
            }
        });
        
        // Adiciona às novas células
        newCells.forEach(cellKey => {
            if (!oldCells.has(cellKey)) {
                if (!this.grid.has(cellKey)) {
                    this.grid.set(cellKey, new Set());
                }
                this.grid.get(cellKey).add(obj.id);
            }
        });
        
        // Atualiza referência
        stored.cells = newCells;
        stored.obj = obj;
    }

    /**
     * Consulta objetos próximos a uma posição
     */
    query(x, y, radius = 100) {
        const results = new Set();
        
        // Calcula células na área de consulta
        const minCellX = Math.floor((x - radius) / this.cellSize);
        const maxCellX = Math.floor((x + radius) / this.cellSize);
        const minCellY = Math.floor((y - radius) / this.cellSize);
        const maxCellY = Math.floor((y + radius) / this.cellSize);
        
        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const cellKey = `${cx},${cy}`;
                const cell = this.grid.get(cellKey);
                
                if (cell) {
                    cell.forEach(id => {
                        const stored = this.objects.get(id);
                        if (stored) {
                            // Verifica distância real
                            const obj = stored.obj;
                            const dx = obj.x - x;
                            const dy = obj.y - y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            
                            if (dist <= radius) {
                                results.add(obj);
                            }
                        }
                    });
                }
            }
        }
        
        return Array.from(results);
    }

    /**
     * Consulta objetos em uma área retangular
     */
    queryRect(x, y, width, height) {
        const results = new Set();
        
        const minCellX = Math.floor(x / this.cellSize);
        const maxCellX = Math.floor((x + width) / this.cellSize);
        const minCellY = Math.floor(y / this.cellSize);
        const maxCellY = Math.floor((y + height) / this.cellSize);
        
        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const cellKey = `${cx},${cy}`;
                const cell = this.grid.get(cellKey);
                
                if (cell) {
                    cell.forEach(id => {
                        const stored = this.objects.get(id);
                        if (stored) {
                            const obj = stored.obj;
                            
                            // Verifica interseção AABB
                            const objLeft = obj.x - (obj.width || 32) / 2;
                            const objRight = obj.x + (obj.width || 32) / 2;
                            const objTop = obj.y - (obj.height || 32) / 2;
                            const objBottom = obj.y + (obj.height || 32) / 2;
                            
                            const rectRight = x + width;
                            const rectBottom = y + height;
                            
                            if (objLeft < rectRight && objRight > x &&
                                objTop < rectBottom && objBottom > y) {
                                results.add(obj);
                            }
                        }
                    });
                }
            }
        }
        
        return Array.from(results);
    }

    /**
     * Verifica colisão entre dois objetos
     */
    checkCollision(obj1, obj2) {
        const w1 = obj1.width || 32;
        const h1 = obj1.height || 32;
        const w2 = obj2.width || 32;
        const h2 = obj2.height || 32;
        
        return (obj1.x - w1/2 < obj2.x + w2/2 &&
                obj1.x + w1/2 > obj2.x - w2/2 &&
                obj1.y - h1/2 < obj2.y + h2/2 &&
                obj1.y + h1/2 > obj2.y - h2/2);
    }

    /**
     * Obtém vizinhos potencialmente colidindo
     */
    getPotentialCollisions(obj) {
        const results = [];
        const stored = this.objects.get(obj.id);
        
        if (!stored) return results;
        
        stored.cells.forEach(cellKey => {
            const cell = this.grid.get(cellKey);
            if (cell) {
                cell.forEach(id => {
                    if (id !== obj.id) {
                        const other = this.objects.get(id);
                        if (other) {
                            results.push(other.obj);
                        }
                    }
                });
            }
        });
        
        return results;
    }

    /**
     * Compara dois Sets
     */
    setsEqual(set1, set2) {
        if (set1.size !== set2.size) return false;
        for (let item of set1) {
            if (!set2.has(item)) return false;
        }
        return true;
    }

    /**
     * Limpa o spatial hash
     */
    clear() {
        this.grid.clear();
        this.objects.clear();
    }

    /**
     * Obtém estatísticas
     */
    getStats() {
        let totalObjects = 0;
        let totalCellRefs = 0;
        
        this.grid.forEach((cell, key) => {
            totalCellRefs += cell.size;
        });
        
        return {
            cells: this.grid.size,
            objects: this.objects.size,
            avgPerCell: this.grid.size > 0 ? (totalCellRefs / this.grid.size).toFixed(2) : 0,
            cellSize: this.cellSize
        };
    }
}

/**
 * CollisionManager - Gerencia colisões usando Spatial Hash
 */
class CollisionManager {
    constructor() {
        this.spatialHash = new SpatialHash(100);
        this.collisionLayers = new Map();
        
        console.log('💥 CollisionManager initialized');
    }

    /**
     * Inicializa layers de colisão
     */
    initialize() {
        // Player colide com: mobs, pickups, NPCs, obstacles
        this.collisionLayers.set('player', ['mobs', 'pickups', 'npcs', 'obstacles']);
        
        // Mobs colidem com: player, outros mobs, obstacles
        this.collisionLayers.set('mobs', ['player', 'obstacles']);
        
        // Projeteis colidem com: mobs, player (depende do dono), obstacles
        this.collisionLayers.set('projectiles', ['mobs', 'player', 'obstacles']);
        
        // Pickups colidem com: player
        this.collisionLayers.set('pickups', ['player']);
    }

    /**
     * Registra objeto no sistema de colisão
     */
    register(obj, layer) {
        obj._collisionLayer = layer;
        this.spatialHash.insert(obj);
    }

    /**
     * Remove objeto do sistema de colisão
     */
    unregister(obj) {
        this.spatialHash.remove(obj);
    }

    /**
     * Atualiza posição do objeto
     */
    update(obj) {
        this.spatialHash.update(obj);
    }

    /**
     * Verifica colisões para um objeto
     */
    checkCollisions(obj) {
        const layer = obj._collisionLayer;
        if (!layer) return [];
        
        const collidingLayers = this.collisionLayers.get(layer) || [];
        const potentials = this.spatialHash.getPotentialCollisions(obj);
        const collisions = [];
        
        potentials.forEach(other => {
            const otherLayer = other._collisionLayer;
            if (collidingLayers.includes(otherLayer)) {
                if (this.spatialHash.checkCollision(obj, other)) {
                    collisions.push(other);
                }
            }
        });
        
        return collisions;
    }

    /**
     * Query de objetos próximos
     */
    queryNearby(x, y, radius, layer = null) {
        const results = this.spatialHash.query(x, y, radius);
        
        if (layer) {
            return results.filter(obj => obj._collisionLayer === layer);
        }
        
        return results;
    }

    /**
     * Obtém estatísticas
     */
    getStats() {
        return this.spatialHash.getStats();
    }

    /**
     * Limpa todas as colisões
     */
    clear() {
        this.spatialHash.clear();
    }
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpatialHash, CollisionManager };
} else {
    window.SpatialHash = SpatialHash;
    window.CollisionManager = CollisionManager;
}
