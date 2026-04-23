/**
 * ZoneExpansionManager - Manages expanded zones and mob spawning
 * Integrates Eldoria, Aurélia, and Dracônia into the game world
 */

const ZoneExpansion = require('../data/ZoneExpansion');

class ZoneExpansionManager {
    constructor(io, mobController, bossController, aggroSystem) {
        this.io = io;
        this.mobController = mobController;
        this.bossController = bossController;
        this.aggroSystem = aggroSystem;
        
        // Active zone instances
        this.activeZones = new Map();
        
        // Mob spawning queues per zone
        this.spawnQueues = new Map();
        
        // Boss status per zone
        this.bossStatus = new Map();
        
        // Environmental effect timers
        this.environmentalTimers = new Map();
        
        // Player presence tracking
        this.zonePresence = new Map();
        
        this.SPAWN_CHECK_INTERVAL = 2000;
        this.MAX_MOBS_PER_ZONE = 40;
        this.BOSS_RESPAWN_WARNING = 60000; // 1 min warning
    }

    /**
     * Initialize zone expansion
     */
    initialize() {
        this.setupZones();
        this.startSpawnLoop();
        this.startEnvironmentalLoop();
        console.log('[ZoneExpansionManager] Initialized with 3 new zones');
    }

    /**
     * Setup zone instances
     */
    setupZones() {
        const zones = ZoneExpansion.getAllZones();
        
        for (const zone of zones) {
            this.activeZones.set(zone.id, {
                ...zone,
                activeMobs: new Map(),
                activeBoss: null,
                currentMobCount: 0,
                environmentalActive: false,
                lastBossKill: null
            });
            
            this.spawnQueues.set(zone.id, []);
            this.bossStatus.set(zone.id, {
                alive: false,
                respawnAt: null,
                killer: null
            });
            this.zonePresence.set(zone.id, new Set());
        }
    }

    /**
     * Start spawn loop
     */
    startSpawnLoop() {
        setInterval(() => {
            this.processSpawnQueues();
        }, this.SPAWN_CHECK_INTERVAL);
    }

    /**
     * Start environmental effects loop
     */
    startEnvironmentalLoop() {
        setInterval(() => {
            this.processEnvironmentalEffects();
        }, 5000);
    }

    /**
     * Player enters zone
     */
    playerEnterZone(playerId, zoneId, socket) {
        const zonePresence = this.zonePresence.get(zoneId);
        if (!zonePresence) return;
        
        zonePresence.add(playerId);
        
        // Send zone data to player
        const zone = ZoneExpansion.getZone(zoneId);
        if (zone && socket) {
            socket.emit('zone:enter', {
                zoneId,
                name: zone.name,
                description: zone.description,
                levelRange: zone.levelRange,
                environmentalEffects: zone.environmentalEffects || null,
                music: zone.music,
                ambientSounds: zone.ambientSounds
            });
            
            // Send current mobs in zone
            this.sendZoneMobs(playerId, zoneId, socket);
            
            // Check boss status
            this.sendBossStatus(playerId, zoneId, socket);
        }
        
        // Start environmental effects if first player
        if (zonePresence.size === 1) {
            this.activateZone(zoneId);
        }
        
        console.log(`[ZoneExpansion] Player ${playerId} entered ${zoneId}`);
    }

    /**
     * Player leaves zone
     */
    playerLeaveZone(playerId, zoneId) {
        const zonePresence = this.zonePresence.get(zoneId);
        if (!zonePresence) return;
        
        zonePresence.delete(playerId);
        
        // Deactivate zone if no players
        if (zonePresence.size === 0) {
            this.deactivateZone(zoneId);
        }
        
        console.log(`[ZoneExpansion] Player ${playerId} left ${zoneId}`);
    }

    /**
     * Activate zone processing
     */
    activateZone(zoneId) {
        const zone = this.activeZones.get(zoneId);
        if (!zone) return;
        
        zone.environmentalActive = true;
        console.log(`[ZoneExpansion] Zone ${zoneId} activated`);
        
        // Initial mob spawn
        this.spawnInitialMobs(zoneId);
    }

    /**
     * Deactivate zone processing
     */
    deactivateZone(zoneId) {
        const zone = this.activeZones.get(zoneId);
        if (!zone) return;
        
        zone.environmentalActive = false;
        console.log(`[ZoneExpansion] Zone ${zoneId} deactivated`);
    }

    /**
     * Spawn initial mobs for zone
     */
    spawnInitialMobs(zoneId) {
        const zone = ZoneExpansion.getZone(zoneId);
        if (!zone) return;
        
        const mobCount = Math.min(10, this.MAX_MOBS_PER_ZONE);
        const mobTypes = Object.values(zone.mobs).filter(m => !m.isElite);
        
        for (let i = 0; i < mobCount; i++) {
            const mobTemplate = mobTypes[Math.floor(Math.random() * mobTypes.length)];
            this.queueMobSpawn(zoneId, mobTemplate);
        }
        
        // Spawn 1-2 elite mobs
        const eliteTypes = Object.values(zone.mobs).filter(m => m.isElite);
        if (eliteTypes.length > 0) {
            const eliteCount = Math.min(2, eliteTypes.length);
            for (let i = 0; i < eliteCount; i++) {
                const eliteTemplate = eliteTypes[Math.floor(Math.random() * eliteTypes.length)];
                this.queueMobSpawn(zoneId, eliteTemplate, true);
            }
        }
    }

    /**
     * Queue mob for spawning
     */
    queueMobSpawn(zoneId, mobTemplate, isElite = false) {
        const spawnPoint = this.getRandomSpawnPoint(zoneId);
        if (!spawnPoint) return;
        
        const mobId = `${mobTemplate.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        this.spawnQueues.get(zoneId).push({
            mobId,
            template: mobTemplate,
            isElite,
            spawnPoint,
            spawnAt: Date.now() + (mobTemplate.respawnTime || 5000)
        });
    }

    /**
     * Process spawn queues
     */
    processSpawnQueues() {
        const now = Date.now();
        
        for (const [zoneId, queue] of this.spawnQueues) {
            const zone = this.activeZones.get(zoneId);
            if (!zone || !zone.environmentalActive) continue;
            
            // Process due spawns
            const readySpawns = queue.filter(s => s.spawnAt <= now);
            
            for (const spawn of readySpawns) {
                if (zone.currentMobCount >= this.MAX_MOBS_PER_ZONE) break;
                
                this.spawnMob(zoneId, spawn);
                
                // Remove from queue
                const index = queue.indexOf(spawn);
                if (index > -1) queue.splice(index, 1);
            }
        }
    }

    /**
     * Spawn a mob
     */
    spawnMob(zoneId, spawnData) {
        const zone = this.activeZones.get(zoneId);
        if (!zone) return;
        
        const { mobId, template, spawnPoint } = spawnData;
        
        // Create mob instance
        const mob = {
            id: mobId,
            type: template.id,
            name: template.name,
            x: spawnPoint.x + (Math.random() - 0.5) * 50,
            y: spawnPoint.y + (Math.random() - 0.5) * 50,
            zoneId,
            ...template,
            hp: template.maxHp,
            target: null,
            state: 'idle',
            threatTable: new Map(),
            spawnedAt: Date.now(),
            lastAttack: 0
        };
        
        // Add to zone tracking
        zone.activeMobs.set(mobId, mob);
        zone.currentMobCount++;
        
        // Add to mob controller
        if (this.mobController) {
            this.mobController.mobs.set(mobId, mob);
        }
        
        // Notify players in zone
        this.notifyZonePlayers(zoneId, 'mob:spawn', {
            mobId,
            type: template.id,
            name: template.name,
            x: mob.x,
            y: mob.y,
            hp: mob.hp,
            maxHp: mob.maxHp,
            level: template.level,
            isElite: !!template.isElite
        });
    }

    /**
     * Handle mob death
     */
    handleMobDeath(zoneId, mobId, killerId, damageLog) {
        const zone = this.activeZones.get(zoneId);
        if (!zone) return;
        
        const mob = zone.activeMobs.get(mobId);
        if (!mob) return;
        
        // Process drops
        const drops = this.calculateDrops(mob);
        
        // Distribute EXP
        this.distributeExperience(zoneId, mob, damageLog);
        
        // Remove from zone
        zone.activeMobs.delete(mobId);
        zone.currentMobCount--;
        
        // Remove from mob controller
        if (this.mobController) {
            this.mobController.mobs.delete(mobId);
        }
        
        // Notify players
        this.notifyZonePlayers(zoneId, 'mob:death', {
            mobId,
            mobName: mob.name,
            killerId,
            drops: drops.length > 0 ? drops : null,
            position: { x: mob.x, y: mob.y }
        });
        
        // Queue respawn
        this.queueMobSpawn(zoneId, mob);
        
        console.log(`[ZoneExpansion] ${mob.name} killed by ${killerId} in ${zoneId}`);
    }

    /**
     * Calculate drops
     */
    calculateDrops(mob) {
        const drops = [];
        
        if (mob.drops) {
            for (const drop of mob.drops) {
                if (drop.guaranteed || Math.random() < drop.chance) {
                    drops.push({
                        itemId: drop.itemId,
                        quantity: drop.quantity || 1
                    });
                }
            }
        }
        
        return drops;
    }

    /**
     * Distribute experience to damage dealers
     */
    distributeExperience(zoneId, mob, damageLog) {
        if (!damageLog || damageLog.length === 0) return;
        
        const totalDamage = damageLog.reduce((sum, entry) => sum + entry.damage, 0);
        const baseExp = mob.experience;
        
        for (const entry of damageLog) {
            const share = entry.damage / totalDamage;
            const exp = Math.floor(baseExp * share);
            
            // Notify player
            const playerSocket = this.getPlayerSocket(entry.playerId);
            if (playerSocket) {
                playerSocket.emit('combat:exp_gain', {
                    amount: exp,
                    source: mob.name,
                    bonus: entry.playerId === damageLog[0].playerId ? 0.1 : 0
                });
            }
        }
    }

    /**
     * Spawn boss
     */
    spawnBoss(zoneId) {
        const bossTemplate = ZoneExpansion.getBoss(zoneId);
        if (!bossTemplate) return;
        
        const zone = this.activeZones.get(zoneId);
        if (!zone) return;
        
        const bossId = `boss_${zoneId}_${Date.now()}`;
        const spawnPoint = this.getRandomSpawnPoint(zoneId);
        
        const boss = {
            id: bossId,
            type: 'boss',
            ...bossTemplate,
            x: spawnPoint.x,
            y: spawnPoint.y,
            zoneId,
            hp: bossTemplate.maxHp,
            state: 'idle',
            phase: 1,
            threatTable: new Map(),
            spawnedAt: Date.now(),
            abilitiesOnCooldown: new Map()
        };
        
        zone.activeBoss = boss;
        
        // Add to boss controller
        if (this.bossController) {
            this.bossController.bosses.set(bossId, boss);
        }
        
        // Update status
        this.bossStatus.set(zoneId, {
            alive: true,
            respawnAt: null,
            killer: null
        });
        
        // Notify all players in zone
        this.notifyZonePlayers(zoneId, 'boss:spawn', {
            bossId,
            name: boss.name,
            title: boss.title,
            x: boss.x,
            y: boss.y,
            hp: boss.hp,
            maxHp: boss.maxHp,
            level: boss.level,
            introDialogue: boss.introDialogue
        });
        
        console.log(`[ZoneExpansion] Boss ${boss.name} spawned in ${zoneId}`);
    }

    /**
     * Handle boss death
     */
    handleBossDeath(zoneId, bossId, killerId) {
        const zone = this.activeZones.get(zoneId);
        if (!zone || !zone.activeBoss) return;
        
        const boss = zone.activeBoss;
        
        // Calculate drops
        const drops = this.calculateDrops(boss);
        
        // Notify players
        this.notifyZonePlayers(zoneId, 'boss:death', {
            bossId,
            bossName: boss.name,
            killerId,
            drops,
            deathDialogue: boss.deathDialogue,
            achievements: boss.achievements
        });
        
        // Update status
        const respawnTime = boss.respawnTime || 600000;
        this.bossStatus.set(zoneId, {
            alive: false,
            respawnAt: Date.now() + respawnTime,
            killer: killerId
        });
        
        zone.activeBoss = null;
        zone.lastBossKill = Date.now();
        
        // Remove from boss controller
        if (this.bossController) {
            this.bossController.bosses.delete(bossId);
        }
        
        // Schedule respawn
        setTimeout(() => {
            this.spawnBoss(zoneId);
        }, respawnTime);
        
        console.log(`[ZoneExpansion] Boss ${boss.name} defeated by ${killerId}`);
    }

    /**
     * Process environmental effects
     */
    processEnvironmentalEffects() {
        for (const [zoneId, zone] of this.activeZones) {
            if (!zone.environmentalActive) continue;
            
            const zoneData = ZoneExpansion.getZone(zoneId);
            if (!zoneData || !zoneData.environmentalEffects) continue;
            
            const effects = zoneData.environmentalEffects;
            
            // Apply to all players in zone
            for (const playerId of this.zonePresence.get(zoneId) || []) {
                // Check heat damage
                if (effects.heat) {
                    this.applyEnvironmentalDamage(playerId, zoneId, effects.heat);
                }
                
                // Check altitude/oxygen
                if (effects.altitude) {
                    this.applyEnvironmentalDamage(playerId, zoneId, effects.altitude);
                }
            }
        }
    }

    /**
     * Apply environmental damage
     */
    applyEnvironmentalDamage(playerId, zoneId, effect) {
        // Check player protection
        // This would integrate with player equipment/skills
        // For now just notify
    }

    /**
     * Get random spawn point
     */
    getRandomSpawnPoint(zoneId) {
        const zone = ZoneExpansion.getZone(zoneId);
        if (!zone || !zone.spawnPoints || zone.spawnPoints.length === 0) {
            return { x: 400, y: 300 };
        }
        
        return zone.spawnPoints[Math.floor(Math.random() * zone.spawnPoints.length)];
    }

    /**
     * Send zone mobs to player
     */
    sendZoneMobs(playerId, zoneId, socket) {
        const zone = this.activeZones.get(zoneId);
        if (!zone) return;
        
        const mobs = Array.from(zone.activeMobs.values()).map(mob => ({
            id: mob.id,
            type: mob.type,
            name: mob.name,
            x: mob.x,
            y: mob.y,
            hp: mob.hp,
            maxHp: mob.maxHp,
            level: mob.level,
            isElite: !!mob.isElite
        }));
        
        socket.emit('zone:mobs_list', { zoneId, mobs });
    }

    /**
     * Send boss status to player
     */
    sendBossStatus(playerId, zoneId, socket) {
        const status = this.bossStatus.get(zoneId);
        if (!status) return;
        
        socket.emit('zone:boss_status', {
            zoneId,
            alive: status.alive,
            respawnAt: status.respawnAt,
            killer: status.killer
        });
    }

    /**
     * Notify all players in zone
     */
    notifyZonePlayers(zoneId, event, data) {
        const zonePresence = this.zonePresence.get(zoneId);
        if (!zonePresence) return;
        
        for (const playerId of zonePresence) {
            const socket = this.getPlayerSocket(playerId);
            if (socket) {
                socket.emit(event, data);
            }
        }
    }

    /**
     * Get player socket
     */
    getPlayerSocket(playerId) {
        // This would integrate with the main player management system
        // For now return null
        return null;
    }

    /**
     * Check if mob can attack player
     */
    canMobAttack(mob, player) {
        // Check level difference for aggro
        const levelDiff = Math.abs(mob.level - player.level);
        if (levelDiff > 10) return false;
        
        return true;
    }

    /**
     * Get zone info for level
     */
    getZoneRecommendation(level) {
        return ZoneExpansion.getRecommendedZone(level);
    }

    /**
     * Get all zone info
     */
    getAllZonesInfo() {
        return ZoneExpansion.getAllZones().map(zone => ({
            id: zone.id,
            name: zone.name,
            levelRange: zone.levelRange,
            description: zone.description,
            connectedZones: zone.connectedZones
        }));
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.activeZones.clear();
        this.spawnQueues.clear();
        this.bossStatus.clear();
        this.zonePresence.clear();
        
        for (const timer of this.environmentalTimers.values()) {
            clearInterval(timer);
        }
        this.environmentalTimers.clear();
    }
}

module.exports = ZoneExpansionManager;
