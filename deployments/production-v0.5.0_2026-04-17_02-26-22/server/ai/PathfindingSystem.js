/**
 * Pathfinding System - Enhanced AI System v0.3.7v
 * Sistema de navegação inteligente com algoritmo A* e otimizações
 */

class PathfindingSystem {
    constructor() {
        this.grid = null;
        this.gridSize = 10; // Tamanho de cada célula do grid
        this.width = 0;
        this.height = 0;
        
        // Cache para performance
        this.pathCache = new Map(); // key -> PathData
        this.nodeCache = new Map(); // x,y -> Node
        this.obstacleCache = new Set(); // positions com obstáculos
        
        // Configuration
        this.config = {
            maxPathLength: 1000,
            pathCacheSize: 1000,
            heuristicWeight: 1.0,
            diagonalCost: 1.414, // √2
            straightCost: 1.0,
            updateFrequency: 100, // ms
            recalculationThreshold: 50 // pixels
        };
        
        // Dynamic obstacles
        this.dynamicObstacles = new Map(); // entityId -> ObstacleData
        this.movingEntities = new Map(); // entityId -> MovementData
        
        // Event listeners
        this.onPathFound = null;
        this.onPathBlocked = null;
        this.onPathRecalculated = null;
        
        // Performance metrics
        this.stats = {
            pathsCalculated: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averagePathLength: 0,
            averageCalculationTime: 0
        };
    }
    
    /**
     * Inicializa o sistema de pathfinding
     */
    initialize(worldWidth, worldHeight) {
        this.width = Math.ceil(worldWidth / this.gridSize);
        this.height = Math.ceil(worldHeight / this.gridSize);
        
        this.createGrid();
        this.startUpdateLoop();
        
        console.log(`[PathfindingSystem] Inicializado: ${this.width}x${this.height} grid`);
    }
    
    /**
     * Cria o grid de navegação
     */
    createGrid() {
        this.grid = [];
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = {
                    x: x,
                    y: y,
                    walkable: true,
                    cost: 1.0,
                    entities: new Set()
                };
            }
        }
    }
    
    /**
     * Inicia loop de update para obstáculos dinâmicos
     */
    startUpdateLoop() {
        setInterval(() => {
            this.updateDynamicObstacles();
            this.cleanupCache();
        }, this.config.updateFrequency);
    }
    
    /**
     * Encontra caminho usando algoritmo A*
     */
    findPath(startPos, endPos, entityId = null, options = {}) {
        const startTime = Date.now();
        
        // Converter para coordenadas do grid
        const start = this.worldToGrid(startPos);
        const end = this.worldToGrid(endPos);
        
        // Verificar cache
        const cacheKey = this.generateCacheKey(start, end, entityId);
        const cachedPath = this.pathCache.get(cacheKey);
        
        if (cachedPath && this.isPathValid(cachedPath, entityId)) {
            this.stats.cacheHits++;
            return this.gridToWorldPath(cachedPath.path);
        }
        
        this.stats.cacheMisses++;
        
        // Verificar se start/end são válidos
        if (!this.isValidPosition(start) || !this.isValidPosition(end)) {
            return null;
        }
        
        // Algoritmo A*
        const path = this.aStar(start, end, entityId, options);
        
        if (path) {
            // Adicionar ao cache
            const pathData = {
                path: path,
                timestamp: Date.now(),
                entityId: entityId,
                start: start,
                end: end
            };
            
            this.pathCache.set(cacheKey, pathData);
            
            // Trigger event
            if (this.onPathFound) {
                this.onPathFound(entityId, path, startPos, endPos);
            }
        }
        
        // Atualizar estatísticas
        const calculationTime = Date.now() - startTime;
        this.updateStats(path, calculationTime);
        
        return path ? this.gridToWorldPath(path) : null;
    }
    
    /**
     * Algoritmo A* otimizado
     */
    aStar(start, end, entityId, options) {
        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        // Inicializar start node
        const startNode = this.getNode(start.x, start.y);
        startNode.g = 0;
        startNode.f = this.heuristic(start, end);
        startNode.h = startNode.f;
        
        openSet.enqueue(startNode, startNode.f);
        gScore.set(this.nodeKey(start), 0);
        fScore.set(this.nodeKey(start), startNode.f);
        
        let iterations = 0;
        const maxIterations = this.config.maxPathLength;
        
        while (!openSet.isEmpty() && iterations < maxIterations) {
            iterations++;
            
            const current = openSet.dequeue();
            const currentKey = this.nodeKey(current);
            
            // Verificar se chegou ao destino
            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }
            
            closedSet.add(currentKey);
            
            // Explorar vizinhos
            const neighbors = this.getNeighbors(current, entityId);
            
            for (const neighbor of neighbors) {
                const neighborKey = this.nodeKey(neighbor);
                
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeG = gScore.get(currentKey) + neighbor.cost;
                
                if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    neighbor.h = this.heuristic(neighbor, end);
                    neighbor.f = tentativeG + neighbor.h;
                    neighbor.g = tentativeG;
                    
                    if (!openSet.contains(neighbor)) {
                        openSet.enqueue(neighbor, neighbor.f);
                    }
                }
            }
        }
        
        // Caminho não encontrado
        return null;
    }
    
    /**
     * Obtém vizinhos de um nó
     */
    getNeighbors(node, entityId) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1, cost: this.config.straightCost },  // Norte
            { x: 1, y: 0, cost: this.config.straightCost },   // Leste
            { x: 0, y: 1, cost: this.config.straightCost },   // Sul
            { x: -1, y: 0, cost: this.config.straightCost },  // Oeste
            { x: 1, y: -1, cost: this.config.diagonalCost },  // Nordeste
            { x: 1, y: 1, cost: this.config.diagonalCost },   // Sudeste
            { x: -1, y: 1, cost: this.config.diagonalCost },  // Sudoeste
            { x: -1, y: -1, cost: this.config.diagonalCost }  // Noroeste
        ];
        
        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;
            
            if (this.isValidPosition({ x: newX, y: newY })) {
                const gridNode = this.getNode(newX, newY);
                
                if (this.isWalkable(gridNode, entityId)) {
                    gridNode.cost = dir.cost * gridNode.cost;
                    neighbors.push(gridNode);
                }
            }
        }
        
        return neighbors;
    }
    
    /**
     * Verifica se uma posição é válida
     */
    isValidPosition(pos) {
        return pos.x >= 0 && pos.x < this.width && 
               pos.y >= 0 && pos.y < this.height;
    }
    
    /**
     * Verifica se um nó é navegável
     */
    isWalkable(node, entityId) {
        if (!node.walkable) return false;
        
        // Verificar obstáculos dinâmicos
        for (const obstacleId of node.entities) {
            if (obstacleId !== entityId && this.isBlockingObstacle(obstacleId)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Obtém nó do grid (com cache)
     */
    getNode(x, y) {
        const key = `${x},${y}`;
        
        if (!this.nodeCache.has(key)) {
            const node = this.grid[y][x];
            this.nodeCache.set(key, node);
        }
        
        return this.nodeCache.get(key);
    }
    
    /**
     * Função heurística (Manhattan distance)
     */
    heuristic(pos1, pos2) {
        const dx = Math.abs(pos1.x - pos2.x);
        const dy = Math.abs(pos1.y - pos2.y);
        return (dx + dy) * this.config.heuristicWeight;
    }
    
    /**
     * Reconstrói caminho a partir do cameFrom
     */
    reconstructPath(cameFrom, current) {
        const path = [current];
        
        while (cameFrom.has(this.nodeKey(current))) {
            current = cameFrom.get(this.nodeKey(current));
            path.unshift(current);
        }
        
        return path;
    }
    
    /**
     * Converte coordenadas do mundo para o grid
     */
    worldToGrid(worldPos) {
        return {
            x: Math.floor(worldPos.x / this.gridSize),
            y: Math.floor(worldPos.y / this.gridSize)
        };
    }
    
    /**
     * Converte caminho do grid para coordenadas do mundo
     */
    gridToWorldPath(gridPath) {
        return gridPath.map(node => ({
            x: node.x * this.gridSize + this.gridSize / 2,
            y: node.y * this.gridSize + this.gridSize / 2
        }));
    }
    
    /**
     * Gera chave para cache
     */
    generateCacheKey(start, end, entityId) {
        return `${start.x},${start.y}-${end.x},${end.y}-${entityId || 'global'}`;
    }
    
    /**
     * Verifica se caminho em cache ainda é válido
     */
    isPathValid(cachedPath, entityId) {
        const maxAge = 5000; // 5 segundos
        
        if (Date.now() - cachedPath.timestamp > maxAge) {
            return false;
        }
        
        // Verificar se há obstáculos no caminho
        for (const node of cachedPath.path) {
            if (!this.isWalkable(node, entityId)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Adiciona obstáculo estático
     */
    addStaticObstacle(position, width, height) {
        const start = this.worldToGrid({ x: position.x - width/2, y: position.y - height/2 });
        const end = this.worldToGrid({ x: position.x + width/2, y: position.y + height/2 });
        
        for (let y = start.y; y <= end.y && y < this.height; y++) {
            for (let x = start.x; x <= end.x && x < this.width; x++) {
                if (this.isValidPosition({ x, y })) {
                    this.grid[y][x].walkable = false;
                    this.obstacleCache.add(`${x},${y}`);
                }
            }
        }
        
        // Limpar cache afetado
        this.clearCacheForArea(start, end);
    }
    
    /**
     * Remove obstáculo estático
     */
    removeStaticObstacle(position, width, height) {
        const start = this.worldToGrid({ x: position.x - width/2, y: position.y - height/2 });
        const end = this.worldToGrid({ x: position.x + width/2, y: position.y + height/2 });
        
        for (let y = start.y; y <= end.y && y < this.height; y++) {
            for (let x = start.x; x <= end.x && x < this.width; x++) {
                if (this.isValidPosition({ x, y })) {
                    this.grid[y][x].walkable = true;
                    this.obstacleCache.delete(`${x},${y}`);
                }
            }
        }
        
        // Limpar cache afetado
        this.clearCacheForArea(start, end);
    }
    
    /**
     * Adiciona obstáculo dinâmico
     */
    addDynamicObstacle(entityId, position, width, height, duration = 0) {
        const obstacle = {
            id: entityId,
            position: position,
            width: width,
            height: height,
            duration: duration,
            createdAt: Date.now()
        };
        
        this.dynamicObstacles.set(entityId, obstacle);
        this.updateObstacleInGrid(obstacle, true);
    }
    
    /**
     * Remove obstáculo dinâmico
     */
    removeDynamicObstacle(entityId) {
        const obstacle = this.dynamicObstacles.get(entityId);
        if (obstacle) {
            this.updateObstacleInGrid(obstacle, false);
            this.dynamicObstacles.delete(entityId);
        }
    }
    
    /**
     * Atualiza obstáculo no grid
     */
    updateObstacleInGrid(obstacle, add) {
        const start = this.worldToGrid({ 
            x: obstacle.position.x - obstacle.width/2, 
            y: obstacle.position.y - obstacle.height/2 
        });
        const end = this.worldToGrid({ 
            x: obstacle.position.x + obstacle.width/2, 
            y: obstacle.position.y + obstacle.height/2 
        });
        
        for (let y = start.y; y <= end.y && y < this.height; y++) {
            for (let x = start.x; x <= end.x && x < this.width; x++) {
                if (this.isValidPosition({ x, y })) {
                    const node = this.grid[y][x];
                    
                    if (add) {
                        node.entities.add(obstacle.id);
                    } else {
                        node.entities.delete(obstacle.id);
                    }
                }
            }
        }
    }
    
    /**
     * Atualiza obstáculos dinâmicos
     */
    updateDynamicObstacles() {
        const now = Date.now();
        
        for (const [entityId, obstacle] of this.dynamicObstacles) {
            // Remover obstáculos expirados
            if (obstacle.duration > 0 && now - obstacle.createdAt > obstacle.duration) {
                this.removeDynamicObstacle(entityId);
                continue;
            }
            
            // Atualizar posição de entidades em movimento
            const movingEntity = this.movingEntities.get(entityId);
            if (movingEntity) {
                this.updateObstacleInGrid(obstacle, false);
                obstacle.position = movingEntity.position;
                this.updateObstacleInGrid(obstacle, true);
            }
        }
    }
    
    /**
     * Registra entidade em movimento
     */
    registerMovingEntity(entityId, position, width, height) {
        this.movingEntities.set(entityId, {
            position: position,
            width: width,
            height: height,
            lastUpdate: Date.now()
        });
        
        this.addDynamicObstacle(entityId, position, width, height);
    }
    
    /**
     * Remove entidade em movimento
     */
    unregisterMovingEntity(entityId) {
        this.movingEntities.delete(entityId);
        this.removeDynamicObstacle(entityId);
    }
    
    /**
     * Atualiza posição de entidade em movimento
     */
    updateMovingEntity(entityId, newPosition) {
        const entity = this.movingEntities.get(entityId);
        if (entity) {
            const oldPosition = entity.position;
            entity.position = newPosition;
            entity.lastUpdate = Date.now();
            
            // Verificar se precisa recalcular caminho
            const distance = Math.sqrt(
                Math.pow(newPosition.x - oldPosition.x, 2) + 
                Math.pow(newPosition.y - oldPosition.y, 2)
            );
            
            if (distance > this.config.recalculationThreshold) {
                this.triggerPathRecalculation(entityId);
            }
        }
    }
    
    /**
     * Verifica se obstáculo bloqueia passagem
     */
    isBlockingObstacle(obstacleId) {
        // Por enquanto, todos os obstáculos bloqueiam
        // Poderia ter lógica diferente para tipos diferentes
        return true;
    }
    
    /**
     * Limpa cache para área específica
     */
    clearCacheForArea(start, end) {
        const keysToDelete = [];
        
        for (const [key, cachedPath] of this.pathCache) {
            for (const node of cachedPath.path) {
                if (node.x >= start.x && node.x <= end.x &&
                    node.y >= start.y && node.y <= end.y) {
                    keysToDelete.push(key);
                    break;
                }
            }
        }
        
        for (const key of keysToDelete) {
            this.pathCache.delete(key);
        }
    }
    
    /**
     * Limpa cache antigo
     */
    cleanupCache() {
        const maxAge = 10000; // 10 segundos
        const now = Date.now();
        
        for (const [key, cachedPath] of this.pathCache) {
            if (now - cachedPath.timestamp > maxAge) {
                this.pathCache.delete(key);
            }
        }
        
        // Manter cache size limitado
        if (this.pathCache.size > this.config.pathCacheSize) {
            const entries = Array.from(this.pathCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toDelete = entries.slice(0, this.pathCache.size - this.config.pathCacheSize);
            for (const [key] of toDelete) {
                this.pathCache.delete(key);
            }
        }
    }
    
    /**
     * Dispara recálculo de caminho
     */
    triggerPathRecalculation(entityId) {
        // Trigger event para sistema AI
        if (this.onPathRecalculated) {
            this.onPathRecalculated(entityId);
        }
    }
    
    /**
     * Encontra caminho simplificado (para performance)
     */
    findSimplePath(startPos, endPos) {
        // Para casos simples, retorna linha reta se não houver obstáculos
        const steps = 20;
        const path = [];
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            path.push({
                x: startPos.x + (endPos.x - startPos.x) * t,
                y: startPos.y + (endPos.y - startPos.y) * t
            });
        }
        
        return path;
    }
    
    /**
     * Verifica se linha de visão está livre
     */
    hasLineOfSight(startPos, endPos, entityId = null) {
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const checkPos = {
                x: startPos.x + (endPos.x - startPos.x) * t,
                y: startPos.y + (endPos.y - startPos.y) * t
            };
            
            const gridPos = this.worldToGrid(checkPos);
            if (!this.isValidPosition(gridPos)) return false;
            
            const node = this.getNode(gridPos.x, gridPos.y);
            if (!this.isWalkable(node, entityId)) return false;
        }
        
        return true;
    }
    
    /**
     * Encontra posição mais próxima navegável
     */
    findNearestWalkable(position, maxDistance = 100) {
        const gridPos = this.worldToGrid(position);
        const radius = Math.ceil(maxDistance / this.gridSize);
        
        for (let r = 0; r <= radius; r++) {
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                const x = Math.round(gridPos.x + Math.cos(angle) * r);
                const y = Math.round(gridPos.y + Math.sin(angle) * r);
                
                if (this.isValidPosition({ x, y })) {
                    const node = this.getNode(x, y);
                    if (node.walkable && node.entities.size === 0) {
                        return this.gridToWorldPath([node])[0];
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * Atualiza estatísticas
     */
    updateStats(path, calculationTime) {
        this.stats.pathsCalculated++;
        this.stats.averageCalculationTime = 
            (this.stats.averageCalculationTime * (this.stats.pathsCalculated - 1) + calculationTime) / 
            this.stats.pathsCalculated;
        
        if (path) {
            this.stats.averagePathLength = 
                (this.stats.averagePathLength * (this.stats.pathsCalculated - 1) + path.length) / 
                this.stats.pathsCalculated;
        }
    }
    
    /**
     * Obtém chave do nó
     */
    nodeKey(node) {
        return `${node.x},${node.y}`;
    }
    
    /**
     * Obtém estatísticas do sistema
     */
    getStatistics() {
        return {
            ...this.stats,
            cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100,
            cacheSize: this.pathCache.size,
            dynamicObstacles: this.dynamicObstacles.size,
            movingEntities: this.movingEntities.size,
            gridSize: `${this.width}x${this.height}`
        };
    }
    
    /**
     * Reseta o sistema
     */
    reset() {
        this.pathCache.clear();
        this.nodeCache.clear();
        this.obstacleCache.clear();
        this.dynamicObstacles.clear();
        this.movingEntities.clear();
        
        // Resetar grid
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].walkable = true;
                this.grid[y][x].entities.clear();
            }
        }
        
        // Resetar estatísticas
        this.stats = {
            pathsCalculated: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averagePathLength: 0,
            averageCalculationTime: 0
        };
        
        console.log('[PathfindingSystem] Sistema resetado');
    }
}

/**
 * Fila de prioridade simplificada para A*
 */
class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    
    dequeue() {
        return this.elements.shift().element;
    }
    
    isEmpty() {
        return this.elements.length === 0;
    }
    
    contains(element) {
        return this.elements.some(item => item.element === element);
    }
}

module.exports = PathfindingSystem;
