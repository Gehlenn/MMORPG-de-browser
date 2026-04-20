/**
 * Spawn Manager - Sistema de Spawn de Mobs
 * Responsável pelo respawn, zones e controle de população
 * Version 0.3.6v - Spawn System Core
 */

class SpawnManager {
    constructor() {
        this.spawns = new Map(); // ID -> SpawnData
        this.respawnTimers = new Map(); // ID -> Timer
        this.spawnLimits = new Map(); // Zone -> Limit
        this.activeMobs = new Map(); // Zone -> Mob[]
        
        // Configuration
        this.config = {
            defaultRespawnTime: 10000, // 10 segundos
            minRespawnTime: 5000, // 5 segundos
            maxRespawnTime: 30000, // 30 segundos
            maxMobsPerZone: 8,
            spawnAnimationDuration: 1000 // 1 segundo
        };
        
        // Zone definitions - matching ZoneManager
        this.zones = {
            'zone_forest': {
                name: 'Floresta Verdejante',
                levelRange: [1, 5],
                mobTypes: ['goblin', 'wolf'],
                limit: 8,
                bounds: { x: 0, y: 0, width: 500, height: 400 }
            },
            'zone_mountain': {
                name: 'Montanhas Rochosas',
                levelRange: [6, 10],
                mobTypes: ['orc', 'hobgoblin'],
                limit: 6,
                bounds: { x: 500, y: 0, width: 500, height: 400 }
            },
            'zone_swamp': {
                name: 'Pântano Sombrio',
                levelRange: [8, 12],
                mobTypes: ['swamp_creature', 'poison_frog'],
                limit: 5,
                bounds: { x: 0, y: 400, width: 500, height: 400 }
            },
            'zone_dark': {
                name: 'Terras Escuras',
                levelRange: [11, 15],
                mobTypes: ['troll', 'ogre'],
                limit: 4,
                bounds: { x: 500, y: 400, width: 500, height: 400 }
            }
        };
        
        // Event listeners
        this.onMobSpawn = null;
        this.onMobDespawn = null;
        this.onRespawn = null;
    }
    
    /**
     * Inicializa o spawn system
     */
    initialize() {
        console.log('[SpawnManager] Inicializando spawn system...');
        this.setupZoneLimits();
        this.startRespawnMonitoring();
    }
    
    /**
     * Configura limites de spawn por zona
     */
    setupZoneLimits() {
        for (const [zoneId, zone] of Object.entries(this.zones)) {
            this.spawnLimits.set(zoneId, zone.limit);
            this.activeMobs.set(zoneId, []);
        }
    }
    
    /**
     * Spawn inicial de mobs
     */
    spawnInitialMobs() {
        for (const [zoneId, zone] of Object.entries(this.zones)) {
            const mobCount = Math.min(zone.limit, Math.floor(zone.limit * 0.7));
            
            for (let i = 0; i < mobCount; i++) {
                const mobType = zone.mobTypes[Math.floor(Math.random() * zone.mobTypes.length)];
                this.spawnMob(zoneId, mobType);
            }
        }
    }
    
    /**
     * Spawn de um mob específico
     */
    spawnMob(zoneId, mobType, position = null) {
        const zone = this.zones[zoneId];
        if (!zone) {
            console.error(`[SpawnManager] Zona ${zoneId} não encontrada`);
            return null;
        }
        
        // Verificar limite de mobs na zona
        const activeMobs = this.activeMobs.get(zoneId) || [];
        if (activeMobs.length >= zone.limit) {
            console.warn(`[SpawnManager] Limite de mobs atingido na zona ${zoneId}`);
            return null;
        }
        
        // Gerar posição se não fornecida
        const spawnPos = position || this.generateRandomPosition(zone.bounds);
        
        // Criar mob data
        const mobData = {
            id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: mobType,
            zoneId: zoneId,
            position: spawnPos,
            level: this.generateMobLevel(zone.levelRange),
            stats: this.generateMobStats(mobType),
            spawnedAt: Date.now(),
            isRespawn: false
        };
        
        // Adicionar aos sistemas
        this.spawns.set(mobData.id, mobData);
        activeMobs.push(mobData);
        this.activeMobs.set(zoneId, activeMobs);
        
        // Trigger events
        if (this.onMobSpawn) {
            this.onMobSpawn(mobData);
        }
        
        console.log(`[SpawnManager] Mob ${mobType} spawnado na zona ${zoneId}`);
        return mobData;
    }
    
    /**
     * Remove um mob (morte ou despawn)
     */
    removeMob(mobId, cause = 'death') {
        const mobData = this.spawns.get(mobId);
        if (!mobData) {
            console.warn(`[SpawnManager] Mob ${mobId} não encontrado`);
            return false;
        }
        
        // Remover dos sistemas
        this.spawns.delete(mobId);
        
        const activeMobs = this.activeMobs.get(mobData.zoneId) || [];
        const index = activeMobs.findIndex(mob => mob.id === mobId);
        if (index !== -1) {
            activeMobs.splice(index, 1);
            this.activeMobs.set(mobData.zoneId, activeMobs);
        }
        
        // Trigger events
        if (this.onMobDespawn) {
            this.onMobDespawn(mobData, cause);
        }
        
        // Iniciar respawn timer se for morte
        if (cause === 'death') {
            this.scheduleRespawn(mobData);
        }
        
        console.log(`[SpawnManager] Mob ${mobId} removido (${cause})`);
        return true;
    }
    
    /**
     * Agenda respawn de um mob
     */
    scheduleRespawn(mobData) {
        const respawnTime = this.calculateRespawnTime(mobData.type);
        
        const timer = setTimeout(() => {
            this.respawnMob(mobData);
        }, respawnTime);
        
        this.respawnTimers.set(mobData.id, timer);
        
        console.log(`[SpawnManager] Respawn agendado para ${mobData.id} em ${respawnTime}ms`);
    }
    
    /**
     * Respawn de um mob
     */
    respawnMob(originalMobData) {
        // Limpar timer
        const timer = this.respawnTimers.get(originalMobData.id);
        if (timer) {
            clearTimeout(timer);
            this.respawnTimers.delete(originalMobData.id);
        }
        
        // Spawn novo mob
        const newMob = this.spawnMob(originalMobData.zoneId, originalMobData.type);
        
        if (newMob) {
            newMob.isRespawn = true;
            newMob.originalMobId = originalMobData.id;
            
            // Trigger respawn event
            if (this.onRespawn) {
                this.onRespawn(newMob, originalMobData);
            }
            
            // Spawn animation
            this.playSpawnAnimation(newMob);
        }
    }
    
    /**
     * Calcula tempo de respawn baseado no tipo de mob
     */
    calculateRespawnTime(mobType) {
        const baseTime = this.config.defaultRespawnTime;
        const variance = this.config.maxRespawnTime - this.config.minRespawnTime;
        
        // Mobs diferentes podem tempos diferentes
        const typeModifiers = {
            'goblin': 0.8,
            'wolf': 0.9,
            'orc': 1.0,
            'hobgoblin': 1.1,
            'troll': 1.2,
            'ogre': 1.3
        };
        
        const modifier = typeModifiers[mobType] || 1.0;
        const randomVariance = Math.random() * variance;
        
        return Math.floor(baseTime * modifier + randomVariance);
    }
    
    /**
     * Gera posição aleatória dentro dos bounds da zona
     */
    generateRandomPosition(bounds) {
        return {
            x: bounds.x + Math.random() * bounds.width,
            y: bounds.y + Math.random() * bounds.height
        };
    }
    
    /**
     * Gera nível do mob baseado no range da zona
     */
    generateMobLevel(levelRange) {
        const [min, max] = levelRange;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Gera stats do mob baseado no tipo
     */
    generateMobStats(mobType) {
        const baseStats = {
            'goblin': { hp: 30, attack: 5, defense: 2, speed: 80 },
            'wolf': { hp: 40, attack: 8, defense: 3, speed: 120 },
            'orc': { hp: 60, attack: 12, defense: 5, speed: 70 },
            'hobgoblin': { hp: 70, attack: 15, defense: 6, speed: 75 },
            'troll': { hp: 100, attack: 20, defense: 10, speed: 50 },
            'ogre': { hp: 120, attack: 25, defense: 12, speed: 40 }
        };
        
        const stats = baseStats[mobType] || baseStats['goblin'];
        
        // Adicionar variabilidade
        return {
            hp: stats.hp + Math.floor(Math.random() * 10) - 5,
            attack: stats.attack + Math.floor(Math.random() * 4) - 2,
            defense: stats.defense + Math.floor(Math.random() * 2),
            speed: stats.speed + Math.floor(Math.random() * 10) - 5
        };
    }
    
    /**
     * Animação de spawn
     */
    playSpawnAnimation(mobData) {
        // Implementar efeito visual de spawn
        console.log(`[SpawnManager] Spawn animation para ${mobData.id}`);
        
        // Event para gameplay engine renderizar animação
        if (this.onSpawnAnimation) {
            this.onSpawnAnimation(mobData, this.config.spawnAnimationDuration);
        }
    }
    
    /**
     * Monitoramento de respawn
     */
    startRespawnMonitoring() {
        setInterval(() => {
            this.updateRespawnTimers();
        }, 1000);
    }
    
    /**
     * Atualiza timers de respawn
     */
    updateRespawnTimers() {
        // Lógica para monitorar e otimizar respawn timers
        const activeCount = this.spawns.size;
        const expectedCount = Object.values(this.zones).reduce((sum, zone) => sum + zone.limit, 0);
        
        if (activeCount < expectedCount * 0.5) {
            console.warn(`[SpawnManager] População baixa: ${activeCount}/${expectedCount}`);
        }
    }
    
    /**
     * Obtém mobs em uma zona específica
     */
    getMobsInZone(zoneId) {
        return this.activeMobs.get(zoneId) || [];
    }
    
    /**
     * Obtém todos os mobs ativos
     */
    getAllActiveMobs() {
        const allMobs = [];
        for (const mobs of this.activeMobs.values()) {
            allMobs.push(...mobs);
        }
        return allMobs;
    }
    
    /**
     * Verifica se uma posição está dentro de uma zona
     */
    getZoneAtPosition(position) {
        for (const [zoneId, zone] of Object.entries(this.zones)) {
            if (position.x >= zone.bounds.x && 
                position.x <= zone.bounds.x + zone.bounds.width &&
                position.y >= zone.bounds.y && 
                position.y <= zone.bounds.y + zone.bounds.height) {
                return zoneId;
            }
        }
        return null;
    }
    
    /**
     * Limpa todos os spawns (para reset/teste)
     */
    clearAllSpawns() {
        // Limpar timers
        for (const timer of this.respawnTimers.values()) {
            clearTimeout(timer);
        }
        this.respawnTimers.clear();
        
        // Limpar spawns
        this.spawns.clear();
        
        // Limpar mobs ativos
        for (const zoneId of Object.keys(this.zones)) {
            this.activeMobs.set(zoneId, []);
        }
        
        console.log('[SpawnManager] Todos os spawns limpos');
    }
    
    /**
     * Obtém estatísticas do spawn system
     */
    getStatistics() {
        const stats = {
            totalSpawns: this.spawns.size,
            activeTimers: this.respawnTimers.size,
            zones: {}
        };
        
        for (const [zoneId, zone] of Object.entries(this.zones)) {
            const activeMobs = this.activeMobs.get(zoneId) || [];
            stats.zones[zoneId] = {
                name: zone.name,
                active: activeMobs.length,
                limit: zone.limit,
                utilization: (activeMobs.length / zone.limit * 100).toFixed(1) + '%'
            };
        }
        
        return stats;
    }
}

module.exports = SpawnManager;
