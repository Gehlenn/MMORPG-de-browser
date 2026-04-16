/**
 * Zone Manager - Sistema de Gerenciamento de Zonas
 * Responsável pelo controle de zonas, patrulhamento e densidade
 * Version 0.3.6v - Zone Management System
 */

class ZoneManager {
    constructor() {
        this.zones = new Map(); // zoneId -> ZoneData
        this.mobPatrols = new Map(); // mobId -> PatrolData
        this.zoneTransitions = new Map(); // mobId -> TransitionData
        this.playerZones = new Map(); // playerId -> zoneId
        
        // Configuration
        this.config = {
            patrolRadius: 50,
            patrolSpeed: 0.5,
            transitionCooldown: 30000, // 30 segundos
            densityCheckInterval: 5000, // 5 segundos
            maxDensityPerZone: 1.5 // 150% do limite base
        };
        
        // Zone definitions
        this.zoneDefinitions = {
            'zone_forest': {
                id: 'zone_forest',
                name: 'Floresta Verdejante',
                type: 'forest',
                levelRange: [1, 5],
                bounds: { x: 0, y: 0, width: 500, height: 400 },
                baseLimit: 8,
                mobTypes: ['goblin', 'wolf', 'forest_spirit'],
                environment: {
                    weather: 'sunny',
                    visibility: 1.0,
                    movementModifier: 1.0
                },
                connections: ['zone_mountain', 'zone_swamp'],
                difficulty: 1.0
            },
            'zone_mountain': {
                id: 'zone_mountain',
                name: 'Montanhas Rochosas',
                type: 'mountain',
                levelRange: [6, 10],
                bounds: { x: 500, y: 0, width: 500, height: 400 },
                baseLimit: 6,
                mobTypes: ['orc', 'hobgoblin', 'mountain_troll'],
                environment: {
                    weather: 'windy',
                    visibility: 0.9,
                    movementModifier: 0.8
                },
                connections: ['zone_forest', 'zone_dark'],
                difficulty: 1.3
            },
            'zone_swamp': {
                id: 'zone_swamp',
                name: 'Pântano Sombrio',
                type: 'swamp',
                levelRange: [8, 12],
                bounds: { x: 0, y: 400, width: 500, height: 400 },
                baseLimit: 5,
                mobTypes: ['swamp_creature', 'poison_frog', 'dark_wisp'],
                environment: {
                    weather: 'foggy',
                    visibility: 0.7,
                    movementModifier: 0.6
                },
                connections: ['zone_forest', 'zone_dark'],
                difficulty: 1.5
            },
            'zone_dark': {
                id: 'zone_dark',
                name: 'Terras Escuras',
                type: 'dark',
                levelRange: [11, 15],
                bounds: { x: 500, y: 400, width: 500, height: 400 },
                baseLimit: 4,
                mobTypes: ['troll', 'ogre', 'shadow_beast'],
                environment: {
                    weather: 'dark',
                    visibility: 0.5,
                    movementModifier: 0.9
                },
                connections: ['zone_mountain', 'zone_swamp'],
                difficulty: 2.0
            }
        };
        
        // Event listeners
        this.onZoneEnter = null;
        this.onZoneExit = null;
        this.onMobPatrol = null;
        this.onZoneTransition = null;
    }
    
    /**
     * Inicializa o zone system
     */
    initialize() {
        console.log('[ZoneManager] Inicializando zone system...');
        this.setupZones();
        this.startDensityMonitoring();
        this.startPatrolSystem();
    }
    
    /**
     * Configura as zonas definidas
     */
    setupZones() {
        for (const [zoneId, definition] of Object.entries(this.zoneDefinitions)) {
            const zoneData = {
                ...definition,
                currentMobs: [],
                currentPlayers: [],
                density: 0,
                lastDensityCheck: Date.now(),
                patrolPoints: this.generatePatrolPoints(definition.bounds),
                spawnPoints: this.generateSpawnPoints(definition.bounds, zoneId)
            };
            
            this.zones.set(zoneId, zoneData);
        }
        
        console.log(`[ZoneManager] ${this.zones.size} zonas configuradas`);
    }
    
    /**
     * Gera pontos de patrulhamento para uma zona
     */
    generatePatrolPoints(bounds) {
        const points = [];
        const gridSize = 100;
        
        for (let x = bounds.x + gridSize; x < bounds.x + bounds.width - gridSize; x += gridSize) {
            for (let y = bounds.y + gridSize; y < bounds.y + bounds.height - gridSize; y += gridSize) {
                // Adicionar variação aleatória
                const offsetX = (Math.random() - 0.5) * gridSize * 0.5;
                const offsetY = (Math.random() - 0.5) * gridSize * 0.5;
                
                points.push({
                    x: x + offsetX,
                    y: y + offsetY,
                    weight: Math.random() // Peso para priorização
                });
            }
        }
        
        return points;
    }
    
    /**
     * Gera pontos de spawn para uma zona
     */
    generateSpawnPoints(bounds, zoneId) {
        const points = [];
        const margin = 50;
        
        // Spawn points gerais
        for (let i = 0; i < 5; i++) {
            const x = bounds.x + margin + Math.random() * (bounds.width - 2 * margin);
            const y = bounds.y + margin + Math.random() * (bounds.height - 2 * margin);
            
            points.push({
                x: x,
                y: y,
                type: 'random'
            });
        }
        
        // Spawn points específicos por tipo de zona
        if (this.zoneDefinitions[zoneId]?.type === 'forest') {
            // Forest: clusters de árvores
            for (let i = 0; i < 3; i++) {
                const centerX = bounds.x + Math.random() * bounds.width;
                const centerY = bounds.y + Math.random() * bounds.height;
                
                for (let j = 0; j < 3; j++) {
                    points.push({
                        x: centerX + (Math.random() - 0.5) * 80,
                        y: centerY + (Math.random() - 0.5) * 80,
                        type: 'cluster'
                    });
                }
            }
        }
        
        return points;
    }
    
    /**
     * Verifica em qual zona uma posição está
     */
    getZoneAtPosition(position) {
        for (const [zoneId, zone] of this.zones) {
            if (this.isPositionInZone(position, zone.bounds)) {
                return zoneId;
            }
        }
        return null;
    }
    
    /**
     * Verifica se uma posição está dentro dos bounds de uma zona
     */
    isPositionInZone(position, bounds) {
        return position.x >= bounds.x && 
               position.x <= bounds.x + bounds.width &&
               position.y >= bounds.y && 
               position.y <= bounds.y + bounds.height;
    }
    
    /**
     * Obtém dados de uma zona
     */
    getZoneData(zoneId) {
        return this.zones.get(zoneId);
    }
    
    /**
     * Adiciona um mob a uma zona
     */
    addMobToZone(mobId, zoneId, position) {
        const zone = this.zones.get(zoneId);
        if (!zone) {
            console.error(`[ZoneManager] Zona ${zoneId} não encontrada`);
            return false;
        }
        
        // Verificar limite de densidade
        if (zone.currentMobs.length >= zone.baseLimit * this.config.maxDensityPerZone) {
            console.warn(`[ZoneManager] Limite de densidade atingido na zona ${zoneId}`);
            return false;
        }
        
        // Adicionar mob à zona
        zone.currentMobs.push({
            id: mobId,
            position: position,
            enteredAt: Date.now()
        });
        
        // Iniciar patrulhamento
        this.startMobPatrol(mobId, zoneId);
        
        console.log(`[ZoneManager] Mob ${mobId} adicionado à zona ${zoneId}`);
        return true;
    }
    
    /**
     * Remove um mob de uma zona
     */
    removeMobFromZone(mobId, zoneId) {
        const zone = this.zones.get(zoneId);
        if (!zone) return false;
        
        const index = zone.currentMobs.findIndex(mob => mob.id === mobId);
        if (index !== -1) {
            zone.currentMobs.splice(index, 1);
            
            // Parar patrulhamento
            this.stopMobPatrol(mobId);
            
            console.log(`[ZoneManager] Mob ${mobId} removido da zona ${zoneId}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Inicia patrulhamento de um mob
     */
    startMobPatrol(mobId, zoneId) {
        const zone = this.zones.get(zoneId);
        if (!zone || zone.patrolPoints.length === 0) return;
        
        // Selecionar ponto de patrulha aleatório
        const targetPoint = this.selectPatrolPoint(zone.patrolPoints);
        
        const patrolData = {
            mobId: mobId,
            zoneId: zoneId,
            targetPoint: targetPoint,
            startTime: Date.now(),
            lastUpdate: Date.now()
        };
        
        this.mobPatrols.set(mobId, patrolData);
        
        console.log(`[ZoneManager] Patrulha iniciada para mob ${mobId} na zona ${zoneId}`);
    }
    
    /**
     * Seleciona ponto de patrulha baseado em peso
     */
    selectPatrolPoint(patrolPoints) {
        const totalWeight = patrolPoints.reduce((sum, point) => sum + point.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const point of patrolPoints) {
            random -= point.weight;
            if (random <= 0) {
                return point;
            }
        }
        
        return patrolPoints[0]; // Fallback
    }
    
    /**
     * Para patrulhamento de um mob
     */
    stopMobPatrol(mobId) {
        this.mobPatrols.delete(mobId);
    }
    
    /**
     * Atualiza patrulhamento de todos os mobs
     */
    updatePatrols() {
        for (const [mobId, patrolData] of this.mobPatrols) {
            this.updateMobPatrol(mobId, patrolData);
        }
    }
    
    /**
     * Atualiza patrulhamento de um mob específico
     */
    updateMobPatrol(mobId, patrolData) {
        const now = Date.now();
        const deltaTime = (now - patrolData.lastUpdate) / 1000;
        
        // Calcular movimento em direção ao ponto alvo
        const zone = this.zones.get(patrolData.zoneId);
        const mobData = zone.currentMobs.find(mob => mob.id === mobId);
        
        if (!mobData) {
            this.stopMobPatrol(mobId);
            return;
        }
        
        const dx = patrolData.targetPoint.x - mobData.position.x;
        const dy = patrolData.targetPoint.y - mobData.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
            // Chegou ao ponto, selecionar novo
            const newTarget = this.selectPatrolPoint(zone.patrolPoints);
            patrolData.targetPoint = newTarget;
        } else {
            // Mover em direção ao alvo
            const moveSpeed = this.config.patrolSpeed * zone.environment.movementModifier;
            const moveX = (dx / distance) * moveSpeed * deltaTime;
            const moveY = (dy / distance) * moveSpeed * deltaTime;
            
            mobData.position.x += moveX;
            mobData.position.y += moveY;
            
            // Trigger event
            if (this.onMobPatrol) {
                this.onMobPatrol(mobId, mobData.position, patrolData);
            }
        }
        
        patrolData.lastUpdate = now;
    }
    
    /**
     * Inicia sistema de patrulhamento
     */
    startPatrolSystem() {
        setInterval(() => {
            this.updatePatrols();
        }, 100); // Update a cada 100ms
    }
    
    /**
     * Verifica se um mob pode transicionar para outra zona
     */
    canTransitionToZone(mobId, fromZoneId, toZoneId) {
        const fromZone = this.zones.get(fromZoneId);
        const toZone = this.zones.get(toZoneId);
        
        if (!fromZone || !toZone) return false;
        
        // Verificar se zonas são conectadas
        if (!fromZone.connections.includes(toZoneId)) return false;
        
        // Verificar cooldown
        const transition = this.zoneTransitions.get(mobId);
        if (transition && (Date.now() - transition.lastTransition) < this.config.transitionCooldown) {
            return false;
        }
        
        // Verificar nível do mob
        const mobData = fromZone.currentMobs.find(mob => mob.id === mobId);
        if (!mobData) return false;
        
        // Verificar se nível é compatível com a nova zona
        const mobLevel = this.getMobLevel(mobId); // Implementar based on mob data
        const [minLevel, maxLevel] = toZone.levelRange;
        
        return mobLevel >= minLevel && mobLevel <= maxLevel;
    }
    
    /**
     * Transiciona um mob para outra zona
     */
    transitionMobToZone(mobId, fromZoneId, toZoneId) {
        if (!this.canTransitionToZone(mobId, fromZoneId, toZoneId)) {
            return false;
        }
        
        const fromZone = this.zones.get(fromZoneId);
        const toZone = this.zones.get(toZoneId);
        const mobData = fromZone.currentMobs.find(mob => mob.id === mobId);
        
        if (!mobData) return false;
        
        // Remover da zona atual
        this.removeMobFromZone(mobId, fromZoneId);
        
        // Adicionar à nova zona
        const newPosition = this.getTransitionPosition(fromZone.bounds, toZone.bounds);
        this.addMobToZone(mobId, toZoneId, newPosition);
        
        // Registrar transição
        this.zoneTransitions.set(mobId, {
            fromZone: fromZoneId,
            toZone: toZoneId,
            lastTransition: Date.now()
        });
        
        // Trigger events
        if (this.onZoneTransition) {
            this.onZoneTransition(mobId, fromZoneId, toZoneId, newPosition);
        }
        
        console.log(`[ZoneManager] Mob ${mobId} transicionado de ${fromZoneId} para ${toZoneId}`);
        return true;
    }
    
    /**
     * Obtém posição de transição entre zonas
     */
    getTransitionPosition(fromBounds, toBounds) {
        // Encontrar ponto de fronteira mais próximo
        const positions = [];
        
        // Fronteira direita/esquerda
        if (fromBounds.x + fromBounds.width === toBounds.x) {
            positions.push({
                x: toBounds.x,
                y: Math.max(fromBounds.y, toBounds.y) + Math.random() * Math.min(fromBounds.height, toBounds.height)
            });
        }
        
        // Fronteira esquerda/direita
        if (fromBounds.x === toBounds.x + toBounds.width) {
            positions.push({
                x: fromBounds.x,
                y: Math.max(fromBounds.y, toBounds.y) + Math.random() * Math.min(fromBounds.height, toBounds.height)
            });
        }
        
        // Fronteira superior/inferior
        if (fromBounds.y + fromBounds.height === toBounds.y) {
            positions.push({
                x: Math.max(fromBounds.x, toBounds.x) + Math.random() * Math.min(fromBounds.width, toBounds.width),
                y: toBounds.y
            });
        }
        
        // Fronteira inferior/superior
        if (fromBounds.y === toBounds.y + toBounds.height) {
            positions.push({
                x: Math.max(fromBounds.x, toBounds.x) + Math.random() * Math.min(fromBounds.width, toBounds.width),
                y: fromBounds.y
            });
        }
        
        return positions.length > 0 ? positions[0] : {
            x: toBounds.x + toBounds.width / 2,
            y: toBounds.y + toBounds.height / 2
        };
    }
    
    /**
     * Inicia monitoramento de densidade
     */
    startDensityMonitoring() {
        setInterval(() => {
            this.updateDensityMetrics();
        }, this.config.densityCheckInterval);
    }
    
    /**
     * Atualiza métricas de densidade das zonas
     */
    updateDensityMetrics() {
        for (const [zoneId, zone] of this.zones) {
            const mobCount = zone.currentMobs.length;
            const playerCount = zone.currentPlayers.length;
            const totalEntities = mobCount + playerCount;
            
            zone.density = totalEntities / zone.baseLimit;
            zone.lastDensityCheck = Date.now();
            
            // Alertas de densidade
            if (zone.density > this.config.maxDensityPerZone) {
                console.warn(`[ZoneManager] Alta densidade na zona ${zoneId}: ${zone.density.toFixed(2)}`);
            }
        }
    }
    
    /**
     * Obtém estatísticas das zonas
     */
    getZoneStatistics() {
        const stats = {
            totalZones: this.zones.size,
            totalMobs: 0,
            totalPlayers: 0,
            zones: {}
        };
        
        for (const [zoneId, zone] of this.zones) {
            const mobCount = zone.currentMobs.length;
            const playerCount = zone.currentPlayers.length;
            
            stats.totalMobs += mobCount;
            stats.totalPlayers += playerCount;
            
            stats.zones[zoneId] = {
                name: zone.name,
                type: zone.type,
                levelRange: zone.levelRange,
                mobs: mobCount,
                players: playerCount,
                density: zone.density.toFixed(2),
                utilization: ((mobCount / zone.baseLimit) * 100).toFixed(1) + '%',
                difficulty: zone.difficulty
            };
        }
        
        return stats;
    }
    
    /**
     * Obtém nível de um mob (placeholder)
     */
    getMobLevel(mobId) {
        // Implementar baseado no sistema de mobs
        return 5; // Placeholder
    }
}

module.exports = ZoneManager;
