/**
 * AureliaIntegration.js
 * 
 * Main integration system for Aurélia zone
 * Connects all components: zone, environment, mobs, boss, transitions, crafting
 */

const AureliaZone = require('./AureliaZone');
const AureliaEnvironment = require('./AureliaEnvironment');
const AureliaTransition = require('./AureliaTransition');
const AureliaCrafting = require('../crafting/AureliaCrafting');

// Mob classes
const GiantScorpion = require('../mobs/aurelia/GiantScorpion');
const SandWorm = require('../mobs/aurelia/SandWorm');
const Mummy = require('../mobs/aurelia/Mummy');
const AncientConstruct = require('../mobs/aurelia/AncientConstruct');
const DesertBandit = require('../mobs/aurelia/DesertBandit');
const MercenaryCaptain = require('../mobs/aurelia/MercenaryCaptain');

// Boss
const PharaohAnub = require('../bosses/PharaohAnub');

class AureliaIntegration {
    constructor(database, io) {
        this.db = database;
        this.io = io;
        
        // Subsystems
        this.zone = null;
        this.environment = null;
        this.transition = null;
        this.crafting = null;
        
        // Mob management
        this.mobs = new Map();
        this.boss = null;
        
        // Spawn management
        this.spawnPoints = new Map();
        this.activeMobs = new Map();
        
        // Update loop
        this.updateInterval = null;
        this.lastUpdate = Date.now();
        
        // State
        this.initialized = false;
        this.active = false;
    }
    
    /**
     * Initialize all Aurelia systems
     */
    async initialize() {
        console.log('[AureliaIntegration] Initializing Aurélia zone systems...');
        
        try {
            // Initialize zone
            this.zone = new AureliaZone({ database: this.db });
            await this.zone.initialize();
            
            // Initialize environment
            this.environment = new AureliaEnvironment(this.db, this.zone);
            await this.environment.initialize();
            
            // Initialize transitions
            this.transition = new AureliaTransition(this.zone, this.db);
            await this.transition.initialize();
            
            // Initialize crafting
            this.crafting = new AureliaCrafting(this.db);
            await this.crafting.initialize();
            
            // Initialize boss
            this.boss = new PharaohAnub(this.db);
            await this.boss.initialize();
            
            // Setup spawn points
            this.setupSpawnPoints();
            
            // Start update loop
            this.startUpdateLoop();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.initialized = true;
            this.active = true;
            
            console.log('[AureliaIntegration] Aurélia zone fully initialized!');
            console.log(`  - Zone: ${this.zone.zoneName}`);
            console.log(`  - Sub-zones: ${Object.keys(this.zone.subZones).length}`);
            console.log(`  - Spawn points: ${this.spawnPoints.size}`);
            console.log(`  - Crafting stations: ${Object.keys(this.crafting.stations).length}`);
            
            return true;
        } catch (error) {
            console.error('[AureliaIntegration] Initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Setup spawn points for all mobs
     */
    setupSpawnPoints() {
        // Giant Scorpions in Golden Dunes
        for (let i = 0; i < 8; i++) {
            this.spawnPoints.set(`scorpion_${i}`, {
                id: `scorpion_${i}`,
                type: 'giant_scorpion',
                x: 1500 + Math.random() * 800,
                y: 2500 + Math.random() * 800,
                subZone: 'golden_dunes',
                respawnTime: 60000,
                lastSpawn: 0,
                currentMob: null
            });
        }
        
        // Sand Worms in deep desert
        for (let i = 0; i < 5; i++) {
            this.spawnPoints.set(`sandworm_${i}`, {
                id: `sandworm_${i}`,
                type: 'sand_worm',
                x: 500 + Math.random() * 600,
                y: 3000 + Math.random() * 600,
                subZone: 'golden_dunes',
                respawnTime: 90000,
                lastSpawn: 0,
                currentMob: null
            });
        }
        
        // Mummies in ruins
        for (let i = 0; i < 6; i++) {
            this.spawnPoints.set(`mummy_${i}`, {
                id: `mummy_${i}`,
                type: 'mummy',
                x: 3000 + Math.random() * 400,
                y: 1500 + Math.random() * 600,
                subZone: 'ruins_ankhet',
                respawnTime: 75000,
                lastSpawn: 0,
                currentMob: null
            });
        }
        
        // Ancient Constructs guarding treasures
        for (let i = 0; i < 3; i++) {
            this.spawnPoints.set(`construct_${i}`, {
                id: `construct_${i}`,
                type: 'ancient_construct',
                x: 2800 + Math.random() * 500,
                y: 1200 + Math.random() * 400,
                subZone: 'ruins_ankhet',
                respawnTime: 120000,
                lastSpawn: 0,
                currentMob: null,
                guardTreasure: `ruins_treasure_${i}`
            });
        }
        
        // Desert Bandits in Thief Valley
        for (let i = 0; i < 10; i++) {
            this.spawnPoints.set(`bandit_${i}`, {
                id: `bandit_${i}`,
                type: 'desert_bandit',
                x: 2200 + Math.random() * 600,
                y: 3500 + Math.random() * 600,
                subZone: 'thief_valley',
                respawnTime: 60000,
                lastSpawn: 0,
                currentMob: null
            });
        }
        
        // Mercenary Captains (rare, 2 total)
        for (let i = 0; i < 2; i++) {
            this.spawnPoints.set(`captain_${i}`, {
                id: `captain_${i}`,
                type: 'mercenary_captain',
                x: 2000 + Math.random() * 800,
                y: 3800 + Math.random() * 300,
                subZone: 'thief_valley',
                respawnTime: 90000,
                lastSpawn: 0,
                currentMob: null
            });
        }
        
        console.log(`[AureliaIntegration] Setup ${this.spawnPoints.size} spawn points`);
    }
    
    /**
     * Start main update loop
     */
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 200); // 5 times per second
    }
    
    /**
     * Main update loop
     */
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        // Update environment
        if (this.environment) {
            this.environment.update(deltaTime);
        }
        
        // Update spawn points
        this.updateSpawns();
        
        // Update active mobs
        this.updateMobs(deltaTime);
        
        // Update boss
        if (this.boss) {
            // Boss updates itself
        }
        
        // Broadcast environmental state
        this.broadcastEnvironmentState();
    }
    
    /**
     * Update spawn points and spawn mobs
     */
    updateSpawns() {
        const now = Date.now();
        
        for (const [id, spawnPoint] of this.spawnPoints) {
            // Check if mob needs to spawn
            if (!spawnPoint.currentMob) {
                const timeSinceLastSpawn = now - spawnPoint.lastSpawn;
                
                if (timeSinceLastSpawn >= spawnPoint.respawnTime) {
                    this.spawnMob(spawnPoint);
                }
            }
        }
    }
    
    /**
     * Spawn a mob at spawn point
     */
    spawnMob(spawnPoint) {
        let mob;
        
        const position = {
            x: spawnPoint.x,
            y: spawnPoint.y,
            subZone: spawnPoint.subZone
        };
        
        switch (spawnPoint.type) {
            case 'giant_scorpion':
                mob = new GiantScorpion(spawnPoint.id, position, 'aurelia');
                break;
            case 'sand_worm':
                mob = new SandWorm(spawnPoint.id, position, 'aurelia');
                break;
            case 'mummy':
                mob = new Mummy(spawnPoint.id, position, 'aurelia');
                break;
            case 'ancient_construct':
                mob = new AncientConstruct(
                    spawnPoint.id,
                    position,
                    'aurelia',
                    spawnPoint.guardTreasure
                );
                break;
            case 'desert_bandit':
                mob = new DesertBandit(spawnPoint.id, position, 'aurelia');
                break;
            case 'mercenary_captain':
                mob = new MercenaryCaptain(spawnPoint.id, position, 'aurelia');
                break;
        }
        
        if (mob) {
            spawnPoint.currentMob = mob;
            spawnPoint.lastSpawn = Date.now();
            this.activeMobs.set(mob.id, mob);
            
            console.log(`[AureliaIntegration] Spawned ${spawnPoint.type} at ${spawnPoint.subZone}`);
            
            // Setup mob death callback
            mob.onDeath = () => {
                this.handleMobDeath(spawnPoint, mob);
            };
        }
    }
    
    /**
     * Handle mob death
     */
    handleMobDeath(spawnPoint, mob) {
        console.log(`[AureliaIntegration] ${mob.name} died at ${spawnPoint.id}`);
        
        // Clear current mob reference
        spawnPoint.currentMob = null;
        spawnPoint.lastSpawn = Date.now();
        
        // Remove from active mobs
        this.activeMobs.delete(mob.id);
        
        // Broadcast death to nearby players
        this.broadcastMobDeath(mob);
    }
    
    /**
     * Update all active mobs
     */
    updateMobs(deltaTime) {
        // Mobs update themselves via their own intervals
        // This is for any global mob management
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for player entering Aurelia
        // this.io.on('playerEnterZone', (data) => { ... });
        
        // Listen for environmental events
        if (this.environment) {
            this.environment.on('sandstormStart', () => {
                this.broadcastToZone('sandstorm_start', {
                    intensity: this.environment.sandstormIntensity,
                    duration: this.environment.sandstormDuration
                });
            });
            
            this.environment.on('sandstormEnd', () => {
                this.broadcastToZone('sandstorm_end', {});
            });
        }
    }
    
    /**
     * Handle player entering Aurelia
     */
    async onPlayerEnter(player, fromZone) {
        console.log(`[AureliaIntegration] Player ${player.id} entered Aurelia from ${fromZone}`);
        
        // Register player in zone
        this.zone.registerPlayer(player.id, player);
        
        // Apply transition effects
        const transition = await this.transition.startTransition(player, fromZone, {
            isDaytime: this.environment?.isDaytime,
            sandstormActive: this.environment?.sandstormActive
        });
        
        // Apply environmental effects
        if (this.environment) {
            this.environment.registerPlayer(player.id, player);
        }
        
        // Send zone data to player
        this.sendZoneData(player);
        
        return transition;
    }
    
    /**
     * Handle player leaving Aurelia
     */
    onPlayerLeave(player, toZone) {
        console.log(`[AureliaIntegration] Player ${player.id} left Aurelia for ${toZone}`);
        
        // Unregister player
        this.zone.unregisterPlayer(player.id);
        
        if (this.environment) {
            this.environment.unregisterPlayer(player.id);
        }
        
        // Cancel any active crafting
        const craftingStatus = this.crafting.getCraftingStatus(player.id);
        if (craftingStatus) {
            this.crafting.cancelCrafting(player.id);
        }
    }
    
    /**
     * Send zone data to player
     */
    sendZoneData(player) {
        const zoneData = this.zone.getClientZoneData();
        const environmentData = this.environment.getClientData();
        const nearbyStations = this.crafting.getNearbyStations(player.x, player.y, 500);
        const nearbyPortals = this.transition.getZonePortals('aurelia');
        
        // Send to player
        const data = {
            zone: zoneData,
            environment: environmentData,
            craftingStations: nearbyStations,
            portals: nearbyPortals,
            timeOfDay: this.environment?.hour,
            isDaytime: this.environment?.isDaytime
        };
        
        // In real implementation: player.socket.emit('zoneData', data);
        console.log(`[AureliaIntegration] Sent zone data to player ${player.id}`);
    }
    
    /**
     * Handle player movement
     */
    onPlayerMove(player, x, y) {
        // Update player position
        player.x = x;
        player.y = y;
        
        // Check for environmental effects
        if (this.environment) {
            this.environment.onPlayerMove(player.id, x, y);
        }
        
        // Check for nearby mobs
        const nearbyMobs = this.getNearbyMobs(x, y, 200);
        
        // Check for sub-zone changes
        const subZone = this.zone.getSubZoneAt(x, y);
        if (subZone && subZone !== player.currentSubZone) {
            player.currentSubZone = subZone.id;
            this.onPlayerEnterSubZone(player, subZone);
        }
        
        // Check for quicksand
        const inQuicksand = this.environment?.isInQuicksand(x, y);
        if (inQuicksand && !player.inQuicksand) {
            player.inQuicksand = true;
            this.onPlayerEnterQuicksand(player);
        } else if (!inQuicksand && player.inQuicksand) {
            player.inQuicksand = false;
            this.onPlayerExitQuicksand(player);
        }
    }
    
    /**
     * Player enters sub-zone
     */
    onPlayerEnterSubZone(player, subZone) {
        console.log(`[AureliaIntegration] Player ${player.id} entered ${subZone.name}`);
        
        // Send sub-zone specific data
        // player.socket.emit('subZoneEnter', { ... });
    }
    
    /**
     * Player enters quicksand
     */
    onPlayerEnterQuicksand(player) {
        console.log(`[AureliaIntegration] Player ${player.id} entered quicksand!`);
        
        // Apply quicksand effects
        if (this.environment) {
            this.environment.applyQuicksandDamage(player.id);
        }
    }
    
    /**
     * Player exits quicksand
     */
    onPlayerExitQuicksand(player) {
        console.log(`[AureliaIntegration] Player ${player.id} escaped quicksand`);
    }
    
    /**
     * Get mobs near position
     */
    getNearbyMobs(x, y, radius) {
        const nearby = [];
        
        for (const [id, mob] of this.activeMobs) {
            const dx = mob.x - x;
            const dy = mob.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                nearby.push({
                    id: mob.id,
                    type: mob.type,
                    name: mob.name,
                    x: mob.x,
                    y: mob.y,
                    distance: Math.floor(distance)
                });
            }
        }
        
        return nearby;
    }
    
    /**
     * Get zone state for new player
     */
    getZoneState() {
        return {
            zone: this.zone?.getFullData(),
            environment: this.environment?.getFullData(),
            activeMobs: this.activeMobs.size,
            spawnPoints: this.spawnPoints.size,
            bossActive: this.boss?.inCombat || false,
            timeOfDay: this.environment?.hour,
            isDaytime: this.environment?.isDaytime,
            sandstormActive: this.environment?.sandstormActive
        };
    }
    
    /**
     * Broadcast to all players in zone
     */
    broadcastToZone(event, data) {
        // In real implementation:
        // this.io.to('aurelia').emit(event, data);
        console.log(`[AureliaIntegration] Broadcast to zone: ${event}`);
    }
    
    /**
     * Broadcast environmental state
     */
    broadcastEnvironmentState() {
        // Only broadcast on changes
        const state = {
            hour: this.environment?.hour,
            isDaytime: this.environment?.isDaytime,
            sandstormActive: this.environment?.sandstormActive,
            sandstormIntensity: this.environment?.sandstormIntensity,
            temperature: this.environment?.temperature
        };
        
        // Compare with last broadcast and send if changed
        // this.broadcastToZone('environmentUpdate', state);
    }
    
    /**
     * Broadcast mob death
     */
    broadcastMobDeath(mob) {
        this.broadcastToZone('mobDeath', {
            id: mob.id,
            type: mob.type,
            x: mob.x,
            y: mob.y,
            xpValue: mob.xpValue
        });
    }
    
    /**
     * Get mob by ID
     */
    getMob(mobId) {
        return this.activeMobs.get(mobId);
    }
    
    /**
     * Damage mob
     */
    damageMob(mobId, damage, source, type = 'physical') {
        const mob = this.activeMobs.get(mobId);
        if (!mob) return { success: false, reason: 'Mob not found' };
        
        const actualDamage = mob.takeDamage(damage, source, type);
        
        return {
            success: true,
            damage: actualDamage,
            mobHp: mob.hp,
            mobMaxHp: mob.maxHp,
            mobDead: mob.hp <= 0
        };
    }
    
    /**
     * Get statistics
     */
    getStatistics() {
        return {
            initialized: this.initialized,
            active: this.active,
            activeMobs: this.activeMobs.size,
            spawnPoints: this.spawnPoints.size,
            playersInZone: this.zone?.players?.size || 0,
            isDaytime: this.environment?.isDaytime,
            sandstormActive: this.environment?.sandstormActive,
            bossActive: this.boss?.inCombat || false,
            currentPhase: this.boss?.currentPhase || 0
        };
    }
    
    /**
     * Shutdown zone
     */
    async shutdown() {
        console.log('[AureliaIntegration] Shutting down Aurélia zone...');
        
        this.active = false;
        
        // Stop update loop
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Cleanup mobs
        for (const [id, mob] of this.activeMobs) {
            mob.cleanup();
        }
        this.activeMobs.clear();
        
        // Cleanup subsystems
        this.zone?.cleanup();
        this.environment?.cleanup();
        this.transition?.cleanup();
        this.crafting?.cleanup();
        this.boss?.cleanup();
        
        this.initialized = false;
        
        console.log('[AureliaIntegration] Aurélia zone shutdown complete');
    }
    
    /**
     * Reset zone (for testing)
     */
    async reset() {
        console.log('[AureliaIntegration] Resetting Aurélia zone...');
        
        // Kill all mobs
        for (const [id, mob] of this.activeMobs) {
            mob.hp = 0;
            mob.die({ id: 'system' });
        }
        
        // Reset environment
        this.environment?.reset();
        
        // Reset boss
        this.boss?.respawn();
        
        // Clear spawn timers
        for (const [id, spawnPoint] of this.spawnPoints) {
            spawnPoint.lastSpawn = 0;
            spawnPoint.currentMob = null;
        }
        
        console.log('[AureliaIntegration] Zone reset complete');
    }
}

module.exports = AureliaIntegration;
