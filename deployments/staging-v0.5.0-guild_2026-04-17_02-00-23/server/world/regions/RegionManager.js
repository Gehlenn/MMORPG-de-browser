/**
 * RegionManager - Sistema de Streaming de Mundo
 * Gerencia regiões do mundo para streaming eficiente
 */

class RegionManager {
    constructor() {
        this.name = 'RegionManager';
        
        // Configurações
        this.config = {
            regionSize: 500,          // Tamanho de cada região (500x500 pixels)
            maxRegions: 10000,       // Máximo de regiões ativas
            updateInterval: 1000,    // Update a cada segundo
            cleanupInterval: 5000,   // Cleanup a cada 5 segundos
            maxEntitiesPerRegion: 100 // Máximo de entidades por região
        };
        
        // Estado do sistema
        this.regions = new Map(); // regionKey -> region data
        this.entityRegions = new Map(); // entityId -> regionKey
        this.playerRegions = new Map(); // playerId -> Set of regionKeys
        this.lastCleanup = 0;
        
        // Estatísticas
        this.stats = {
            totalRegions: 0,
            activeRegions: 0,
            totalEntities: 0,
            averageEntitiesPerRegion: 0,
            memoryUsage: 0
        };
        
        console.log('🗺️ RegionManager created');
    }
    
    /**
     * Obtém chave da região baseada em coordenadas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {string} - Chave da região
     */
    getRegionKey(x, y) {
        const rx = Math.floor(x / this.config.regionSize);
        const ry = Math.floor(y / this.config.regionSize);
        return `${rx}:${ry}`;
    }
    
    /**
     * Obtém coordenadas do centro da região
     * @param {string} regionKey - Chave da região
     * @returns {object} - Coordenadas do centro
     */
    getRegionCenter(regionKey) {
        const [rx, ry] = regionKey.split(':').map(Number);
        return {
            x: rx * this.config.regionSize + this.config.regionSize / 2,
            y: ry * this.config.regionSize + this.config.regionSize / 2
        };
    }
    
    /**
     * Obtém bounds de uma região
     * @param {string} regionKey - Chave da região
     * @returns {object} - Bounds da região
     */
    getRegionBounds(regionKey) {
        const [rx, ry] = regionKey.split(':').map(Number);
        return {
            minX: rx * this.config.regionSize,
            minY: ry * this.config.regionSize,
            maxX: (rx + 1) * this.config.regionSize,
            maxY: (ry + 1) * this.config.regionSize
        };
    }
    
    /**
     * Adiciona entidade a uma região
     * @param {object} entity - Dados da entidade
     * @returns {string} - Chave da região
     */
    addEntity(entity) {
        const regionKey = this.getRegionKey(entity.x, entity.y);
        
        // Criar região se não existir
        if (!this.regions.has(regionKey)) {
            this.regions.set(regionKey, {
                key: regionKey,
                entities: new Map(),
                players: new Set(),
                mobs: new Set(),
                lastUpdate: Date.now(),
                entityCount: 0
            });
        }
        
        const region = this.regions.get(regionKey);
        
        // Remover entidade da região anterior se existir
        const oldRegionKey = this.entityRegions.get(entity.id);
        if (oldRegionKey && oldRegionKey !== regionKey) {
            this.removeEntityFromRegion(oldRegionKey, entity.id);
        }
        
        // Adicionar entidade à nova região
        region.entities.set(entity.id, entity);
        region.entityCount = region.entities.size;
        region.lastUpdate = Date.now();
        
        // Categorizar entidade
        if (entity.type === 'player') {
            region.players.add(entity.id);
        } else if (entity.type === 'mob') {
            region.mobs.add(entity.id);
        }
        
        // Atualizar mapeamento
        this.entityRegions.set(entity.id, regionKey);
        
        // Adicionar região ao conjunto do jogador
        if (entity.type === 'player') {
            if (!this.playerRegions.has(entity.id)) {
                this.playerRegions.set(entity.id, new Set());
            }
            this.playerRegions.get(entity.id).add(regionKey);
        }
        
        // Verificar limite de entidades
        if (region.entityCount > this.config.maxEntitiesPerRegion) {
            console.warn(`⚠️ Region ${regionKey} has ${region.entityCount} entities (limit: ${this.config.maxEntitiesPerRegion})`);
        }
        
        return regionKey;
    }
    
    /**
     * Remove entidade de uma região
     * @param {string} regionKey - Chave da região
     * @param {string} entityId - ID da entidade
     */
    removeEntityFromRegion(regionKey, entityId) {
        const region = this.regions.get(regionKey);
        if (!region) return;
        
        const entity = region.entities.get(entityId);
        if (entity) {
            // Remover das categorias
            if (entity.type === 'player') {
                region.players.delete(entityId);
            } else if (entity.type === 'mob') {
                region.mobs.delete(entityId);
            }
            
            // Remover da região
            region.entities.delete(entityId);
            region.entityCount = region.entities.size;
            region.lastUpdate = Date.now();
            
            // Limpar região se estiver vazia
            if (region.entities.size === 0) {
                this.regions.delete(regionKey);
            }
        }
    }
    
    /**
     * Remove entidade do sistema
     * @param {string} entityId - ID da entidade
     */
    removeEntity(entityId) {
        const regionKey = this.entityRegions.get(entityId);
        if (regionKey) {
            this.removeEntityFromRegion(regionKey, entityId);
            this.entityRegions.delete(entityId);
            
            // Limpar regiões do jogador
            this.playerRegions.delete(entityId);
        }
    }
    
    /**
     * Atualiza posição de entidade
     * @param {object} entity - Dados da entidade
     * @returns {boolean} - Mudou de região
     */
    updateEntityPosition(entity) {
        const oldRegionKey = this.entityRegions.get(entity.id);
        const newRegionKey = this.getRegionKey(entity.x, entity.y);
        
        if (oldRegionKey !== newRegionKey) {
            // Mudou de região
            this.addEntity(entity);
            
            // Atualizar regiões do jogador
            if (entity.type === 'player') {
                const playerRegionSet = this.playerRegions.get(entity.id);
                if (playerRegionSet) {
                    // Manter apenas regiões próximas
                    this.updatePlayerRegions(entity.id);
                }
            }
            
            return true;
        } else {
            // Mesma região, apenas atualizar dados
            const region = this.regions.get(oldRegionKey);
            if (region) {
                region.entities.set(entity.id, entity);
                region.lastUpdate = Date.now();
            }
            return false;
        }
    }
    
    /**
     * Obtém entidades próximas a uma posição
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {number} radius - Raio de busca
     * @returns {array} - Entidades próximas
     */
    getNearbyEntities(x, y, radius = this.config.regionSize) {
        const nearbyEntities = [];
        const centerRegionKey = this.getRegionKey(x, y);
        
        // Calcular regiões a verificar
        const regionRadius = Math.ceil(radius / this.config.regionSize);
        const [centerRx, centerRy] = centerRegionKey.split(':').map(Number);
        
        for (let rx = centerRx - regionRadius; rx <= centerRx + regionRadius; rx++) {
            for (let ry = centerRy - regionRadius; ry <= centerRy + regionRadius; ry++) {
                const regionKey = `${rx}:${ry}`;
                const region = this.regions.get(regionKey);
                
                if (region) {
                    // Verificar entidades na região
                    for (const entity of region.entities.values()) {
                        const distance = this.calculateDistance(x, y, entity.x, entity.y);
                        if (distance <= radius) {
                            nearbyEntities.push({
                                ...entity,
                                distance: distance
                            });
                        }
                    }
                }
            }
        }
        
        // Ordenar por distância
        nearbyEntities.sort((a, b) => a.distance - b.distance);
        
        return nearbyEntities;
    }
    
    /**
     * Obtém entidades de uma região específica
     * @param {string} regionKey - Chave da região
     * @returns {array} - Entidades da região
     */
    getRegionEntities(regionKey) {
        const region = this.regions.get(regionKey);
        if (!region) return [];
        
        return Array.from(region.entities.values());
    }
    
    /**
     * Obtém regiões próximas a um jogador
     * @param {object} player - Dados do jogador
     * @param {number} regionRadius - Raio de regiões
     * @returns {array} - Regiões próximas
     */
    getNearbyRegions(player, regionRadius = 2) {
        const centerRegionKey = this.getRegionKey(player.x, player.y);
        const [centerRx, centerRy] = centerRegionKey.split(':').map(Number);
        
        const nearbyRegions = [];
        
        for (let rx = centerRx - regionRadius; rx <= centerRx + regionRadius; rx++) {
            for (let ry = centerRy - regionRadius; ry <= centerRy + regionRadius; ry++) {
                const regionKey = `${rx}:${ry}`;
                const region = this.regions.get(regionKey);
                
                if (region && region.entities.size > 0) {
                    nearbyRegions.push({
                        key: regionKey,
                        entities: Array.from(region.entities.values()),
                        playerCount: region.players.size,
                        mobCount: region.mobs.size,
                        distance: this.calculateRegionDistance(centerRegionKey, regionKey)
                    });
                }
            }
        }
        
        // Ordenar por distância
        nearbyRegions.sort((a, b) => a.distance - b.distance);
        
        return nearbyRegions;
    }
    
    /**
     * Atualiza regiões de um jogador
     * @param {string} playerId - ID do jogador
     */
    updatePlayerRegions(playerId) {
        const playerRegionSet = this.playerRegions.get(playerId);
        if (!playerRegionSet) return;
        
        const player = this.getEntity(playerId);
        if (!player) return;
        
        // Limpar conjunto antigo
        playerRegionSet.clear();
        
        // Adicionar regiões próximas
        const nearbyRegions = this.getNearbyRegions(player, 2);
        for (const region of nearbyRegions) {
            playerRegionSet.add(region.key);
        }
    }
    
    /**
     * Obtém entidade por ID
     * @param {string} entityId - ID da entidade
     * @returns {object|null} - Entidade encontrada
     */
    getEntity(entityId) {
        const regionKey = this.entityRegions.get(entityId);
        if (!regionKey) return null;
        
        const region = this.regions.get(regionKey);
        if (!region) return null;
        
        return region.entities.get(entityId) || null;
    }
    
    /**
     * Obtém jogadores próximos a uma posição
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {number} radius - Raio de busca
     * @returns {array} - Jogadores próximos
     */
    getNearbyPlayers(x, y, radius = this.config.regionSize) {
        const nearbyEntities = this.getNearbyEntities(x, y, radius);
        return nearbyEntities.filter(entity => entity.type === 'player');
    }
    
    /**
     * Obtém mobs próximos a uma posição
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {number} radius - Raio de busca
     * @returns {array} - Mobs próximos
     */
    getNearbyMobs(x, y, radius = this.config.regionSize) {
        const nearbyEntities = this.getNearbyEntities(x, y, radius);
        return nearbyEntities.filter(entity => entity.type === 'mob');
    }
    
    /**
     * Calcula distância entre dois pontos
     * @param {number} x1 - Coordenada X1
     * @param {number} y1 - Coordenada Y1
     * @param {number} x2 - Coordenada X2
     * @param {number} y2 - Coordenada Y2
     * @returns {number} - Distância
     */
    calculateDistance(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Calcula distância entre regiões
     * @param {string} regionKey1 - Chave da região 1
     * @param {string} regionKey2 - Chave da região 2
     * @returns {number} - Distância em regiões
     */
    calculateRegionDistance(regionKey1, regionKey2) {
        const [rx1, ry1] = regionKey1.split(':').map(Number);
        const [rx2, ry2] = regionKey2.split(':').map(Number);
        
        return Math.sqrt(Math.pow(rx2 - rx1, 2) + Math.pow(ry2 - ry1, 2));
    }
    
    /**
     * Update do sistema
     * @param {number} delta - Delta time
     */
    update(delta) {
        const now = Date.now();
        
        // Cleanup periódico
        if (now - this.lastCleanup > this.config.cleanupInterval) {
            this.cleanup();
            this.lastCleanup = now;
        }
        
        // Atualizar estatísticas
        this.updateStats();
    }
    
    /**
     * Limpa regiões vazias e expiradas
     */
    cleanup() {
        const now = Date.now();
        const expiredRegions = [];
        
        for (const [regionKey, region] of this.regions) {
            // Remover regiões vazias
            if (region.entities.size === 0) {
                expiredRegions.push(regionKey);
                continue;
            }
            
            // Remover regiões sem update por muito tempo
            if (now - region.lastUpdate > 60000) { // 1 minuto
                expiredRegions.push(regionKey);
            }
        }
        
        for (const regionKey of expiredRegions) {
            this.regions.delete(regionKey);
        }
        
        if (expiredRegions.length > 0) {
            console.log(`🧹 Cleaned up ${expiredRegions.length} expired regions`);
        }
    }
    
    /**
     * Atualiza estatísticas
     */
    updateStats() {
        this.stats.totalRegions = this.regions.size;
        this.stats.activeRegions = Array.from(this.regions.values()).filter(r => r.entities.size > 0).length;
        this.stats.totalEntities = Array.from(this.regions.values()).reduce((sum, r) => sum + r.entities.size, 0);
        this.stats.averageEntitiesPerRegion = this.stats.totalRegions > 0 ? this.stats.totalEntities / this.stats.totalRegions : 0;
        this.stats.memoryUsage = this.estimateMemoryUsage();
    }
    
    /**
     * Estima uso de memória
     * @returns {number} - Uso de memória em bytes
     */
    estimateMemoryUsage() {
        let totalSize = 0;
        
        // Estimar tamanho das regiões
        for (const region of this.regions.values()) {
            totalSize += region.entities.size * 100; // ~100 bytes por entidade
            totalSize += 200; // overhead da região
        }
        
        return totalSize;
    }
    
    /**
     * Obtém regiões ativas
     * @returns {array} - Regiões ativas
     */
    getActiveRegions() {
        return Array.from(this.regions.values()).filter(region => region.entities.size > 0);
    }
    
    /**
     * Obtém regiões de um jogador
     * @param {string} playerId - ID do jogador
     * @returns {array} - Regiões do jogador
     */
    getPlayerRegions(playerId) {
        const regionKeys = this.playerRegions.get(playerId);
        if (!regionKeys) return [];
        
        return Array.from(regionKeys).map(key => this.regions.get(key)).filter(Boolean);
    }
    
    /**
     * Verifica se duas entidades estão na mesma região
     * @param {string} entityId1 - ID da entidade 1
     * @param {string} entityId2 - ID da entidade 2
     * @returns {boolean} - Estão na mesma região
     */
    areEntitiesInSameRegion(entityId1, entityId2) {
        const regionKey1 = this.entityRegions.get(entityId1);
        const regionKey2 = this.entityRegions.get(entityId2);
        
        return regionKey1 === regionKey2 && regionKey1 !== undefined;
    }
    
    /**
     * Obtém mapa de calor de entidades
     * @param {object} bounds - Bounds do mapa
     * @param {number} resolution - Resolução do mapa
     * @returns {array} - Mapa de calor
     */
    getHeatmap(bounds, resolution = 50) {
        const heatmap = [];
        const cellWidth = (bounds.maxX - bounds.minX) / resolution;
        const cellHeight = (bounds.maxY - bounds.minY) / resolution;
        
        for (let y = 0; y < resolution; y++) {
            for (let x = 0; x < resolution; x++) {
                const cellX = bounds.minX + x * cellWidth;
                const cellY = bounds.minY + y * cellHeight;
                
                const entities = this.getNearbyEntities(cellX, cellY, Math.max(cellWidth, cellHeight));
                
                heatmap.push({
                    x: x,
                    y: y,
                    intensity: entities.length,
                    entities: entities.length
                });
            }
        }
        
        return heatmap;
    }
    
    /**
     * Obtém estatísticas do sistema
     * @returns {object} - Estatísticas
     */
    getStats() {
        this.updateStats();
        
        return {
            name: this.name,
            config: this.config,
            stats: this.stats,
            regions: {
                total: this.stats.totalRegions,
                active: this.stats.activeRegions,
                averageEntities: this.stats.averageEntitiesPerRegion
            },
            memory: {
                estimatedUsage: this.stats.memoryUsage,
                usageMB: Math.round(this.stats.memoryUsage / 1024 / 1024 * 100) / 100
            }
        };
    }
    
    /**
     * Destrói o sistema
     */
    destroy() {
        console.log('🗑️ Destroying RegionManager...');
        
        // Limpar todos os dados
        this.regions.clear();
        this.entityRegions.clear();
        this.playerRegions.clear();
        
        console.log('✅ RegionManager destroyed');
    }
}

module.exports = RegionManager;
