/**
 * Boss Manager - Sistema de Gerenciamento de Bosses
 * Responsável por spawns especiais, timers e recompensas de boss
 * Version 0.3.6v - Boss System Implementation
 */

class BossManager {
    constructor() {
        this.activeBosses = new Map(); // bossId -> BossData
        this.bossTimers = new Map(); // bossType -> Timer
        this.bossHistory = new Map(); // bossType -> SpawnHistory[]
        this.playerParticipation = new Map(); // playerId -> ParticipationData
        
        // Configuration
        this.config = {
            spawnChance: 0.01, // 1% de chance
            minSpawnInterval: 600000, // 10 minutos
            maxSpawnInterval: 900000, // 15 minutos
            announcementDuration: 30000, // 30 segundos de anúncio
            participationRewardThreshold: 0.1, // 10% de dano para recompensa
            maxActiveBosses: 3,
            bossDespawnTime: 300000 // 5 minutos sem combate
        };
        
        // Boss definitions
        this.bossDefinitions = {
            'dragon_lord': {
                id: 'dragon_lord',
                name: 'Senhor Dragão',
                type: 'dragon',
                level: 20,
                baseStats: {
                    hp: 5000,
                    attack: 50,
                    defense: 30,
                    speed: 60
                },
                abilities: ['fire_breath', 'tail_swipe', 'wing_attack'],
                lootTable: {
                    common: ['dragon_scale', 'fire_essence'],
                    rare: ['dragon_sword', 'fire_armor'],
                    legendary: ['dragon_heart', 'eternal_flame']
                },
                spawnZones: ['zone_mountain', 'zone_dark'],
                spawnChance: 0.005, // 0.5% chance
                respawnTime: 1800000, // 30 minutos
                announcement: '⚠️ Senhor Dragão apareceu em {zone}!'
            },
            'demon_king': {
                id: 'demon_king',
                name: 'Rei Demônio',
                type: 'demon',
                level: 25,
                baseStats: {
                    hp: 6000,
                    attack: 60,
                    defense: 25,
                    speed: 80
                },
                abilities: ['hell_fire', 'demon_claw', 'dark_aura'],
                lootTable: {
                    common: ['demon_horn', 'dark_essence'],
                    rare: ['demon_sword', 'shadow_armor'],
                    legendary: ['demon_crown', 'abyssal_core']
                },
                spawnZones: ['zone_dark'],
                spawnChance: 0.003, // 0.3% chance
                respawnTime: 2400000, // 40 minutos
                announcement: '🔥 Rei Demônio emergiu das sombras em {zone}!'
            },
            'ancient_treant': {
                id: 'ancient_treant',
                name: 'Treant Antigo',
                type: 'nature',
                level: 18,
                baseStats: {
                    hp: 4500,
                    attack: 40,
                    defense: 40,
                    speed: 30
                },
                abilities: ['root_bind', 'nature_heal', 'branch_slam'],
                lootTable: {
                    common: ['ancient_wood', 'nature_essence'],
                    rare: ['treant_staff', 'bark_armor'],
                    legendary: ['world_seed', 'nature_heart']
                },
                spawnZones: ['zone_forest'],
                spawnChance: 0.008, // 0.8% chance
                respawnTime: 1200000, // 20 minutos
                announcement: '🌳 Treant Antigo despertou na floresta em {zone}!'
            },
            'frost_giant': {
                id: 'frost_giant',
                name: 'Gigante do Gelo',
                type: 'ice',
                level: 22,
                baseStats: {
                    hp: 5500,
                    attack: 45,
                    defense: 35,
                    speed: 40
                },
                abilities: ['ice_breath', 'frost_armor', 'ground_slam'],
                lootTable: {
                    common: ['ice_crystal', 'frost_essence'],
                    rare: ['frost_hammer', 'ice_armor'],
                    legendary: ['frost_crown', 'eternal_ice']
                },
                spawnZones: ['zone_mountain'],
                spawnChance: 0.006, // 0.6% chance
                respawnTime: 1500000, // 25 minutos
                announcement: '❄️ Gigante do Gelo congelou as montanhas em {zone}!'
            }
        };
        
        // Event listeners
        this.onBossSpawn = null;
        this.onBossDeath = null;
        this.onBossDespawn = null;
        this.onBossAnnouncement = null;
        this.onDamageDealt = null;
        this.onRewardDistributed = null;
    }
    
    /**
     * Inicializa o boss system
     */
    initialize() {
        console.log('[BossManager] Inicializando boss system...');
        this.startBossSpawnTimer();
        this.startBossMonitoring();
        this.initializeBossHistory();
    }
    
    /**
     * Inicializa histórico de spawns
     */
    initializeBossHistory() {
        for (const bossType of Object.keys(this.bossDefinitions)) {
            this.bossHistory.set(bossType, []);
        }
    }
    
    /**
     * Inicia timer de spawn de bosses
     */
    startBossSpawnTimer() {
        setInterval(() => {
            this.attemptBossSpawn();
        }, 60000); // Verificar a cada minuto
    }
    
    /**
     * Tenta spawnar um boss
     */
    attemptBossSpawn() {
        // Verificar limite de bosses ativos
        if (this.activeBosses.size >= this.config.maxActiveBosses) {
            return;
        }
        
        // Para cada tipo de boss, verificar se pode spawnar
        for (const [bossType, definition] of Object.entries(this.bossDefinitions)) {
            if (this.canSpawnBoss(bossType)) {
                if (Math.random() < definition.spawnChance) {
                    this.spawnBoss(bossType);
                    break; // Apenas um boss por verificação
                }
            }
        }
    }
    
    /**
     * Verifica se um boss pode spawnar
     */
    canSpawnBoss(bossType) {
        const definition = this.bossDefinitions[bossType];
        const history = this.bossHistory.get(bossType) || [];
        
        // Verificar se já tem um boss ativo deste tipo
        const hasActiveBoss = Array.from(this.activeBosses.values())
            .some(boss => boss.type === bossType);
        
        if (hasActiveBoss) return false;
        
        // Verificar intervalo mínimo desde último spawn
        if (history.length > 0) {
            const lastSpawn = history[history.length - 1];
            const timeSinceLastSpawn = Date.now() - lastSpawn.spawnTime;
            
            if (timeSinceLastSpawn < definition.respawnTime) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Spawn de um boss
     */
    spawnBoss(bossType, zoneId = null) {
        const definition = this.bossDefinitions[bossType];
        if (!definition) {
            console.error(`[BossManager] Definição de boss ${bossType} não encontrada`);
            return null;
        }
        
        // Selecionar zona de spawn
        const spawnZone = zoneId || this.selectSpawnZone(definition.spawnZones);
        if (!spawnZone) {
            console.warn(`[BossManager] Nenhuma zona válida para spawn do boss ${bossType}`);
            return null;
        }
        
        // Gerar posição de spawn
        const spawnPosition = this.generateBossSpawnPosition(spawnZone);
        
        // Criar boss data
        const bossData = {
            id: `boss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: bossType,
            name: definition.name,
            level: definition.level,
            zoneId: spawnZone,
            position: spawnPosition,
            stats: this.generateBossStats(definition),
            abilities: [...definition.abilities],
            currentHp: definition.baseStats.hp,
            maxHp: definition.baseStats.hp,
            spawnedAt: Date.now(),
            lastCombatTime: Date.now(),
            participants: new Map(), // playerId -> damage
            phase: 1, // Fases do boss
            enrageTimer: null,
            isEnraged: false
        };
        
        // Adicionar aos sistemas
        this.activeBosses.set(bossData.id, bossData);
        
        // Adicionar ao histórico
        const history = this.bossHistory.get(bossType) || [];
        history.push({
            bossId: bossData.id,
            spawnTime: Date.now(),
            zoneId: spawnZone,
            spawnedBy: 'system'
        });
        this.bossHistory.set(bossType, history);
        
        // Anunciar spawn
        this.announceBossSpawn(bossData);
        
        // Trigger events
        if (this.onBossSpawn) {
            this.onBossSpawn(bossData);
        }
        
        console.log(`[BossManager] Boss ${bossType} spawnado na zona ${spawnZone}`);
        return bossData;
    }
    
    /**
     * Seleciona zona de spawn para boss
     */
    selectSpawnZone(availableZones) {
        // Lógica para selecionar zona baseada em população, etc.
        const validZones = availableZones.filter(zone => {
            // Verificar se zona existe e tem jogadores
            return true; // Simplificado
        });
        
        return validZones.length > 0 ? 
            validZones[Math.floor(Math.random() * validZones.length)] : null;
    }
    
    /**
     * Gera posição de spawn para boss
     */
    generateBossSpawnPosition(zoneId) {
        // Bosses spawnam em posições especiais (centro da zona, etc.)
        return {
            x: 400 + Math.random() * 200, // Área central
            y: 200 + Math.random() * 100
        };
    }
    
    /**
     * Gera stats do boss com variações
     */
    generateBossStats(definition) {
        const stats = { ...definition.baseStats };
        
        // Adicionar variabilidade baseada no nível
        const levelModifier = 1 + (definition.level - 20) * 0.05; // 5% por nível acima de 20
        
        return {
            hp: Math.floor(stats.hp * levelModifier),
            attack: Math.floor(stats.attack * levelModifier),
            defense: Math.floor(stats.defense * levelModifier),
            speed: Math.floor(stats.speed * levelModifier)
        };
    }
    
    /**
     * Anuncia spawn de boss
     */
    announceBossSpawn(bossData) {
        const definition = this.bossDefinitions[bossData.type];
        const message = definition.announcement.replace('{zone}', bossData.zoneId);
        
        console.log(`[BossManager] ANÚNCIO: ${message}`);
        
        // Trigger announcement event
        if (this.onBossAnnouncement) {
            this.onBossAnnouncement(bossData, message);
        }
        
        // Anúncio global para todos os jogadores
        this.sendGlobalAnnouncement(message);
    }
    
    /**
     * Envia anúncio global
     */
    sendGlobalAnnouncement(message) {
        // Implementar envio para todos os jogadores conectados
        console.log(`[BossManager] Anúncio global: ${message}`);
    }
    
    /**
     * Registra dano causado ao boss
     */
    registerDamage(bossId, playerId, damage) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return false;
        
        // Atualizar dano do jogador
        const currentDamage = boss.participants.get(playerId) || 0;
        boss.participants.set(playerId, currentDamage + damage);
        
        // Atualizar HP do boss
        boss.currentHp = Math.max(0, boss.currentHp - damage);
        boss.lastCombatTime = Date.now();
        
        // Verificar morte
        if (boss.currentHp <= 0) {
            this.handleBossDeath(boss);
        }
        
        // Verificar fases
        this.checkBossPhase(boss);
        
        // Trigger damage event
        if (this.onDamageDealt) {
            this.onDamageDealt(bossId, playerId, damage, boss.currentHp);
        }
        
        return true;
    }
    
    /**
     * Verifica mudança de fase do boss
     */
    checkBossPhase(boss) {
        const hpPercentage = boss.currentHp / boss.maxHp;
        
        // Fase 2: 50% HP
        if (boss.phase === 1 && hpPercentage <= 0.5) {
            boss.phase = 2;
            this.triggerBossPhaseChange(boss, 2);
        }
        
        // Fase 3: 25% HP
        if (boss.phase === 2 && hpPercentage <= 0.25) {
            boss.phase = 3;
            this.triggerBossPhaseChange(boss, 3);
        }
        
        // Enrage: 10% HP
        if (hpPercentage <= 0.1 && !boss.isEnraged) {
            this.triggerBossEnrage(boss);
        }
    }
    
    /**
     * Trigger mudança de fase do boss
     */
    triggerBossPhaseChange(boss, newPhase) {
        console.log(`[BossManager] Boss ${boss.id} entrou na fase ${newPhase}`);
        
        // Aumentar stats ou adicionar novas habilidades
        const phaseMultiplier = 1 + (newPhase - 1) * 0.2; // 20% por fase
        
        boss.stats.attack = Math.floor(boss.stats.attack * phaseMultiplier);
        boss.stats.speed = Math.floor(boss.stats.speed * phaseMultiplier);
        
        // Event para gameplay engine
        // Implementar efeitos visuais e sonoros
    }
    
    /**
     * Trigger enrage do boss
     */
    triggerBossEnrage(boss) {
        boss.isEnraged = true;
        boss.stats.attack = Math.floor(boss.stats.attack * 1.5); // 50% mais dano
        boss.stats.speed = Math.floor(boss.stats.speed * 1.3); // 30% mais rápido
        
        console.log(`[BossManager] Boss ${boss.id} está ENRAGED!`);
        
        // Efeitos visuais de enrage
        // Implementar partículas, aura, etc.
    }
    
    /**
     * Lida com morte do boss
     */
    handleBossDeath(boss) {
        console.log(`[BossManager] Boss ${boss.id} foi derrotado!`);
        
        // Distribuir recompensas
        this.distributeBossRewards(boss);
        
        // Remover boss ativo
        this.activeBosses.delete(boss.id);
        
        // Trigger death event
        if (this.onBossDeath) {
            this.onBossDeath(boss);
        }
        
        // Anunciar morte
        this.announceBossDeath(boss);
    }
    
    /**
     * Distribui recompensas do boss
     */
    distributeBossRewards(boss) {
        const definition = this.bossDefinitions[boss.type];
        const participants = Array.from(boss.participants.entries())
            .sort((a, b) => b[1] - a[1]); // Ordenar por dano
        
        const totalDamage = participants.reduce((sum, [_, damage]) => sum + damage, 0);
        
        for (const [playerId, damage] of participants) {
            const damagePercentage = damage / totalDamage;
            
            if (damagePercentage >= this.config.participationRewardThreshold) {
                const rewards = this.generateBossRewards(boss, damagePercentage);
                this.awardRewardsToPlayer(playerId, rewards);
            }
        }
    }
    
    /**
     * Gera recompensas baseado na participação
     */
    generateBossRewards(boss, damagePercentage) {
        const definition = this.bossDefinitions[boss.type];
        const rewards = {
            experience: Math.floor(1000 * damagePercentage * boss.level),
            gold: Math.floor(500 * damagePercentage * boss.level),
            items: []
        };
        
        // Chance de itens baseada na participação
        const roll = Math.random();
        
        if (damagePercentage > 0.3) { // Top 30%
            if (roll < 0.1) { // 10% chance
                rewards.items.push(this.selectLoot(definition.lootTable.legendary));
            } else if (roll < 0.3) { // 20% chance
                rewards.items.push(this.selectLoot(definition.lootTable.rare));
            } else { // 70% chance
                rewards.items.push(this.selectLoot(definition.lootTable.common));
            }
        } else if (damagePercentage > 0.1) { // Participação mínima
            if (roll < 0.2) { // 20% chance
                rewards.items.push(this.selectLoot(definition.lootTable.common));
            }
        }
        
        return rewards;
    }
    
    /**
     * Seleciona loot da tabela
     */
    selectLoot(lootArray) {
        return lootArray[Math.floor(Math.random() * lootArray.length)];
    }
    
    /**
     * Awards recompensas para um jogador
     */
    awardRewardsToPlayer(playerId, rewards) {
        console.log(`[BossManager] Recompensas para jogador ${playerId}:`, rewards);
        
        // Trigger reward event
        if (this.onRewardDistributed) {
            this.onRewardDistributed(playerId, rewards);
        }
        
        // Implementar entrega real dos itens/XP/gold
    }
    
    /**
     * Anuncia morte do boss
     */
    announceBossDeath(boss) {
        const topDamager = this.getTopDamager(boss);
        const message = `🎉 ${boss.name} foi derrotado! Top damager: ${topDamager}`;
        
        console.log(`[BossManager] ${message}`);
        this.sendGlobalAnnouncement(message);
    }
    
    /**
     * Obtém o jogador com maior dano
     */
    getTopDamager(boss) {
        const participants = Array.from(boss.participants.entries());
        if (participants.length === 0) return 'N/A';
        
        const topDamager = participants.reduce((max, current) => 
            current[1] > max[1] ? current : max
        );
        
        return `Player ${topDamager[0]} (${topDamager[1]} damage)`;
    }
    
    /**
     * Inicia monitoramento de bosses
     */
    startBossMonitoring() {
        setInterval(() => {
            this.monitorBossActivity();
        }, 30000); // Verificar a cada 30 segundos
    }
    
    /**
     * Monitora atividade dos bosses
     */
    monitorBossActivity() {
        const now = Date.now();
        
        for (const [bossId, boss] of this.activeBosses) {
            // Verificar despawn por inatividade
            const timeSinceCombat = now - boss.lastCombatTime;
            
            if (timeSinceCombat > this.config.bossDespawnTime) {
                console.log(`[BossManager] Boss ${bossId} despawnado por inatividade`);
                this.despawnBoss(bossId, 'inactivity');
            }
        }
    }
    
    /**
     * Despawn de um boss
     */
    despawnBoss(bossId, reason) {
        const boss = this.activeBosses.get(bossId);
        if (!boss) return false;
        
        // Remover boss ativo
        this.activeBosses.delete(bossId);
        
        // Trigger despawn event
        if (this.onBossDespawn) {
            this.onBossDespawn(boss, reason);
        }
        
        console.log(`[BossManager] Boss ${bossId} despawnado (${reason})`);
        return true;
    }
    
    /**
     * Obtém bosses ativos em uma zona
     */
    getActiveBossesInZone(zoneId) {
        return Array.from(this.activeBosses.values())
            .filter(boss => boss.zoneId === zoneId);
    }
    
    /**
     * Obtém todos os bosses ativos
     */
    getAllActiveBosses() {
        return Array.from(this.activeBosses.values());
    }
    
    /**
     * Obtém estatísticas do boss system
     */
    getBossStatistics() {
        const stats = {
            activeBosses: this.activeBosses.size,
            totalSpawnAttempts: 0,
            totalKills: 0,
            bossTypes: {}
        };
        
        for (const [bossType, history] of this.bossHistory) {
            const definition = this.bossDefinitions[bossType];
            const activeBoss = Array.from(this.activeBosses.values())
                .find(boss => boss.type === bossType);
            
            stats.bossTypes[bossType] = {
                name: definition.name,
                active: !!activeBoss,
                totalSpawns: history.length,
                lastSpawn: history.length > 0 ? history[history.length - 1].spawnTime : null,
                averageRespawnTime: this.calculateAverageRespawnTime(bossType)
            };
            
            stats.totalSpawnAttempts += history.length;
        }
        
        return stats;
    }
    
    /**
     * Calcula tempo médio de respawn
     */
    calculateAverageRespawnTime(bossType) {
        const history = this.bossHistory.get(bossType) || [];
        if (history.length < 2) return 0;
        
        let totalInterval = 0;
        for (let i = 1; i < history.length; i++) {
            totalInterval += history[i].spawnTime - history[i-1].spawnTime;
        }
        
        return Math.floor(totalInterval / (history.length - 1));
    }
    
    /**
     * Calcula tempo de respawn para um tipo de boss
     */
    calculateRespawnTime(bossType) {
        const definition = this.bossDefinitions[bossType];
        if (!definition) {
            console.warn(`[BossManager] Tipo de boss desconhecido: ${bossType}`);
            return 0;
        }
        
        return definition.respawnTime || 1800000; // Default 30 minutos
    }
}

module.exports = BossManager;
