/**
 * Advanced Spawn System - Legacy of Komodo
 * Gerencia spawn de mobs comuns, raros (0.1%) e mini-bosses
 */

class AdvancedSpawnSystem {
    constructor(worldMap) {
        this.worldMap = worldMap;
        this.activeMobs = new Map(); // mobs atualmente spawnados
        this.rareMobTimers = new Map(); // timers para respawn de mobs raros
        this.miniBossTimers = new Map(); // timers para respawn de mini-bosses
        this.lastRareSpawn = new Map(); // último spawn de cada mob raro
        this.lastMiniBossSpawn = new Map(); // último spawn de cada mini-boss
        
        // Configurações
        this.config = {
            rareMobChance: 0.001, // 0.1%
            rareMobRespawnTime: 1800000, // 30 minutos em ms
            miniBossRespawnTime: 7200000, // 2 horas em ms
            maxRareMobsPerRegion: 3,
            maxMiniBossesPerRegion: 1,
            notifyRareSpawn: true,
            notifyMiniBossSpawn: true
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🎮 Inicializando Advanced Spawn System...');
        
        // Inicializar spawn de mini-bosses para cada região
        this.worldMap.regions.forEach(region => {
            if (region.miniBoss) {
                this.scheduleMiniBossSpawn(region.id);
            }
        });
        
        // Inicializar sistema de rare spawns
        this.startRareSpawnSystem();
        
        console.log('✅ Advanced Spawn System inicializado com sucesso!');
    }
    
    /**
     * Spawn de mob comum
     */
    spawnCommonMob(regionId, mobType, position) {
        const region = this.worldMap.getRegionById(regionId);
        if (!region) return null;
        
        const mobTemplate = region.mobs.find(mob => mob.type === mobType);
        if (!mobTemplate) return null;
        
        const mob = {
            id: this.generateMobId(),
            type: mobType,
            level: mobTemplate.level,
            position: position,
            regionId: regionId,
            health: this.calculateMobHealth(mobTemplate.level),
            maxHealth: this.calculateMobHealth(mobTemplate.level),
            attack: this.calculateMobAttack(mobTemplate.level),
            defense: this.calculateMobDefense(mobTemplate.level),
            experience: this.calculateMobXP(mobTemplate.level),
            gold: this.calculateMobGold(mobTemplate.level),
            rarity: 'common',
            respawnTime: mobTemplate.respawnTime,
            spawnTime: Date.now()
        };
        
        this.activeMobs.set(mob.id, mob);
        return mob;
    }
    
    /**
     * Spawn de mob raro (0.1% chance)
     */
    spawnRareMob(regionId, position) {
        const region = this.worldMap.getRegionById(regionId);
        if (!region || !region.rareMobs || region.rareMobs.length === 0) return null;
        
        // Verificar se já tem muitos mobs raros na região
        const currentRareMobs = this.getActiveRareMobsInRegion(regionId);
        if (currentRareMobs.length >= this.config.maxRareMobsPerRegion) {
            return null;
        }
        
        // Verificar cooldown do último spawn
        const lastSpawn = this.lastRareSpawn.get(regionId);
        if (lastSpawn && (Date.now() - lastSpawn) < this.config.rareMobRespawnTime) {
            return null;
        }
        
        // Selecionar mob raro aleatório
        const rareTemplate = region.rareMobs[Math.floor(Math.random() * region.rareMobs.length)];
        
        const mob = {
            id: this.generateMobId(),
            type: rareTemplate.type,
            level: rareTemplate.level,
            position: position,
            regionId: regionId,
            health: this.calculateMobHealth(rareTemplate.level, rareTemplate.statsMultiplier),
            maxHealth: this.calculateMobHealth(rareTemplate.level, rareTemplate.statsMultiplier),
            attack: this.calculateMobAttack(rareTemplate.level, rareTemplate.statsMultiplier),
            defense: this.calculateMobDefense(rareTemplate.level, rareTemplate.statsMultiplier),
            experience: this.calculateMobXP(rareTemplate.level, rareTemplate.xpMultiplier),
            gold: this.calculateMobGold(rareTemplate.level, rareTemplate.lootMultiplier),
            rarity: 'rare',
            statsMultiplier: rareTemplate.statsMultiplier,
            lootMultiplier: rareTemplate.lootMultiplier,
            xpMultiplier: rareTemplate.xpMultiplier,
            respawnTime: rareTemplate.respawnTime,
            spawnTime: Date.now(),
            isRare: true
        };
        
        this.activeMobs.set(mob.id, mob);
        this.lastRareSpawn.set(regionId, Date.now());
        
        // Notificar spawn de mob raro
        if (this.config.notifyRareSpawn) {
            this.notifyRareMobSpawn(mob);
        }
        
        // Agendar próximo respawn
        this.scheduleRareMobRespawn(regionId, rareTemplate.type);
        
        return mob;
    }
    
    /**
     * Spawn de mini-boss
     */
    spawnMiniBoss(regionId) {
        const region = this.worldMap.getRegionById(regionId);
        if (!region || !region.miniBoss) return null;
        
        // Verificar se já tem mini-boss na região
        const currentMiniBoss = this.getActiveMiniBossInRegion(regionId);
        if (currentMiniBoss) {
            return currentMiniBoss;
        }
        
        const bossTemplate = region.miniBoss;
        
        const boss = {
            id: this.generateMobId(),
            type: bossTemplate.type,
            level: bossTemplate.level,
            position: this.getRandomPositionInRegion(region),
            regionId: regionId,
            health: this.calculateMobHealth(bossTemplate.level, bossTemplate.statsMultiplier),
            maxHealth: this.calculateMobHealth(bossTemplate.level, bossTemplate.statsMultiplier),
            attack: this.calculateMobAttack(bossTemplate.level, bossTemplate.statsMultiplier),
            defense: this.calculateMobDefense(bossTemplate.level, bossTemplate.statsMultiplier),
            experience: this.calculateMobXP(bossTemplate.level, bossTemplate.xpMultiplier),
            gold: this.calculateMobGold(bossTemplate.level, bossTemplate.lootMultiplier),
            rarity: 'boss',
            statsMultiplier: bossTemplate.statsMultiplier,
            lootMultiplier: bossTemplate.lootMultiplier,
            xpMultiplier: bossTemplate.xpMultiplier,
            drops: bossTemplate.drops,
            respawnTime: bossTemplate.respawnTime,
            spawnTime: Date.now(),
            isMiniBoss: true
        };
        
        this.activeMobs.set(boss.id, boss);
        this.lastMiniBossSpawn.set(regionId, Date.now());
        
        // Notificar spawn de mini-boss
        if (this.config.notifyMiniBossSpawn) {
            this.notifyMiniBossSpawn(boss);
        }
        
        return boss;
    }
    
    /**
     * Inicia sistema de rare spawns
     */
    startRareSpawnSystem() {
        setInterval(() => {
            this.worldMap.regions.forEach(region => {
                // Chance de spawn de mob raro
                if (Math.random() < this.config.rareMobChance) {
                    const position = this.getRandomPositionInRegion(region);
                    this.spawnRareMob(region.id, position);
                }
            });
        }, 30000); // Verificar a cada 30 segundos
    }
    
    /**
     * Agenda spawn de mini-boss
     */
    scheduleMiniBossSpawn(regionId) {
        // Fazer spawn imediato no início
        this.spawnMiniBoss(regionId);
        
        // Agendar respawn periódico
        setInterval(() => {
            this.spawnMiniBoss(regionId);
        }, this.config.miniBossRespawnTime);
    }
    
    /**
     * Agenda respawn de mob raro
     */
    scheduleRareMobRespawn(regionId, mobType) {
        const timer = setTimeout(() => {
            const position = this.getRandomPositionInRegion(this.worldMap.getRegionById(regionId));
            this.spawnRareMob(regionId, position);
        }, this.config.rareMobRespawnTime);
        
        this.rareMobTimers.set(`${regionId}_${mobType}`, timer);
    }
    
    /**
     * Remove mob do mundo
     */
    removeMob(mobId) {
        const mob = this.activeMobs.get(mobId);
        if (!mob) return false;
        
        // Se for mob raro ou mini-boss, agendar respawn
        if (mob.isRare) {
            this.scheduleRareMobRespawn(mob.regionId, mob.type);
        } else if (mob.isMiniBoss) {
            setTimeout(() => {
                this.spawnMiniBoss(mob.regionId);
            }, mob.respawnTime);
        }
        
        this.activeMobs.delete(mobId);
        return true;
    }
    
    /**
     * Obtém mobs ativos em uma região
     */
    getActiveMobsInRegion(regionId) {
        return Array.from(this.activeMobs.values()).filter(mob => mob.regionId === regionId);
    }
    
    /**
     * Obtém mobs raros ativos em uma região
     */
    getActiveRareMobsInRegion(regionId) {
        return this.getActiveMobsInRegion(regionId).filter(mob => mob.isRare);
    }
    
    /**
     * Obtém mini-boss ativo em uma região
     */
    getActiveMiniBossInRegion(regionId) {
        const mobs = this.getActiveMobsInRegion(regionId);
        return mobs.find(mob => mob.isMiniBoss);
    }
    
    /**
     * Notifica spawn de mob raro
     */
    notifyRareMobSpawn(mob) {
        const message = `🌟 MOB RARO APARECEU! ${mob.type.toUpperCase()} (Level ${mob.level}) spawnou em ${this.worldMap.getRegionById(mob.regionId).name}!`;
        console.log(message);
        // Aqui você pode implementar notificação para jogadores
        this.broadcastToPlayersInRegion(mob.regionId, message);
    }
    
    /**
     * Notifica spawn de mini-boss
     */
    notifyMiniBossSpawn(boss) {
        const message = `👹 MINI-BOSS APARECEU! ${boss.type.toUpperCase()} (Level ${boss.level}) spawnou em ${this.worldMap.getRegionById(boss.regionId).name}!`;
        console.log(message);
        // Aqui você pode implementar notificação para jogadores
        this.broadcastToPlayersInRegion(boss.regionId, message);
    }
    
    /**
     * Broadcast para jogadores na região
     */
    broadcastToPlayersInRegion(regionId, message) {
        // Implementar broadcast para jogadores na região
        // Isso depende do seu sistema de rede/comunicação
        console.log(`Broadcast para região ${regionId}: ${message}`);
    }
    
    /**
     * Gera ID único para mob
     */
    generateMobId() {
        return `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Calcula saúde do mob baseada no level e multiplicador
     */
    calculateMobHealth(level, multiplier = 1) {
        const baseHealth = 50 + (level * 15);
        return Math.floor(baseHealth * multiplier);
    }
    
    /**
     * Calcula ataque do mob baseada no level e multiplicador
     */
    calculateMobAttack(level, multiplier = 1) {
        const baseAttack = 5 + (level * 2);
        return Math.floor(baseAttack * multiplier);
    }
    
    /**
     * Calcula defesa do mob baseada no level e multiplicador
     */
    calculateMobDefense(level, multiplier = 1) {
        const baseDefense = 2 + (level * 1);
        return Math.floor(baseDefense * multiplier);
    }
    
    /**
     * Calcula XP do mob baseada no level e multiplicador
     */
    calculateMobXP(level, multiplier = 1) {
        const baseXP = 10 + (level * 5);
        return Math.floor(baseXP * multiplier);
    }
    
    /**
     * Calcula gold do mob baseada no level e multiplicador
     */
    calculateMobGold(level, multiplier = 1) {
        const baseGold = 2 + (level * 1);
        return Math.floor(baseGold * multiplier);
    }
    
    /**
     * Obtém posição aleatória na região
     */
    getRandomPositionInRegion(region) {
        // Implementar lógica para obter posição aleatória válida na região
        return {
            x: Math.random() * 1000,
            y: Math.random() * 1000
        };
    }
    
    /**
     * Obtém estatísticas do sistema
     */
    getSystemStats() {
        const stats = {
            totalActiveMobs: this.activeMobs.size,
            totalRareMobs: 0,
            totalMiniBosses: 0,
            regionsWithRareMobs: 0,
            regionsWithMiniBosses: 0
        };
        
        this.activeMobs.forEach(mob => {
            if (mob.isRare) stats.totalRareMobs++;
            if (mob.isMiniBoss) stats.totalMiniBosses++;
        });
        
        this.worldMap.regions.forEach(region => {
            const rareMobs = this.getActiveRareMobsInRegion(region.id);
            const miniBoss = this.getActiveMiniBossInRegion(region.id);
            
            if (rareMobs.length > 0) stats.regionsWithRareMobs++;
            if (miniBoss) stats.regionsWithMiniBosses++;
        });
        
        return stats;
    }
    
    /**
     * Limpa todos os mobs
     */
    clearAllMobs() {
        this.activeMobs.clear();
        this.rareMobTimers.forEach(timer => clearTimeout(timer));
        this.miniBossTimers.forEach(timer => clearTimeout(timer));
        this.rareMobTimers.clear();
        this.miniBossTimers.clear();
        this.lastRareSpawn.clear();
        this.lastMiniBossSpawn.clear();
    }
}

module.exports = AdvancedSpawnSystem;
