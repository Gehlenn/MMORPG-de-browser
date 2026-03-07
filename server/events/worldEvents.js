/**
 * World Events System - Dynamic World Events and Global Activities
 * Handles random world events, invasions, bosses, and resource events
 * Version 0.3.4 - Dynamic World Events and MMO Game Loop
 */

class WorldEvents {
    constructor(server) {
        this.server = server;
        
        // Active events storage
        this.activeEvents = new Map(); // eventId -> event data
        this.eventHistory = new Map(); // region -> last event times
        this.participants = new Map(); // eventId -> Set of participant IDs
        
        // Configuration
        this.config = {
            maxConcurrentEvents: 3,
            eventCooldown: 300000, // 5 minutes between events in same region
            eventDuration: 600000, // 10 minutes per event
            announcementRadius: 1000, // pixels
            participationRadius: 500, // pixels
            cleanupInterval: 60000 // 1 minute cleanup check
        };
        
        // Event types
        this.eventTypes = {
            demon_invasion: {
                name: 'Invasão Demônica',
                description: 'Demônios invadiram a região!',
                duration: 600000, // 10 minutes
                minLevel: 10,
                maxParticipants: 20,
                spawnCount: 15,
                bossChance: 0.3,
                rewards: {
                    xpMultiplier: 1.5,
                    lootMultiplier: 1.3,
                    achievement: 'demon_slayer'
                },
                color: '#e74c3c',
                icon: '👹'
            },
            world_boss: {
                name: 'Chefão Mundial',
                description: 'Um chefão poderoso apareceu!',
                duration: 900000, // 15 minutes
                minLevel: 20,
                maxParticipants: 30,
                spawnCount: 1,
                bossChance: 1.0,
                rewards: {
                    xpMultiplier: 2.0,
                    lootMultiplier: 2.0,
                    achievement: 'world_champion'
                },
                color: '#f39c12',
                icon: '🐉'
            },
            resource_bonanza: {
                name: 'Bonança de Recursos',
                description: 'Recursos raros apareceram na região!',
                duration: 450000, // 7.5 minutes
                minLevel: 5,
                maxParticipants: 15,
                spawnCount: 20,
                bossChance: 0.0,
                rewards: {
                    xpMultiplier: 1.2,
                    lootMultiplier: 1.5,
                    achievement: 'resource_collector'
                },
                color: '#27ae60',
                icon: '💎'
            },
            temporal_dungeon: {
                name: 'Dungeon Temporal',
                description: 'Uma dungeon temporal apareceu!',
                duration: 1200000, // 20 minutes
                minLevel: 15,
                maxParticipants: 25,
                spawnCount: 25,
                bossChance: 0.5,
                rewards: {
                    xpMultiplier: 1.8,
                    lootMultiplier: 1.7,
                    achievement: 'time_traveler'
                },
                color: '#9b59b6',
                icon: '⏰'
            },
            celestial_blessing: {
                name: 'Bênção Celestial',
                description: 'Uma bênção divina cobre a terra!',
                duration: 300000, // 5 minutes
                minLevel: 1,
                maxParticipants: 50,
                spawnCount: 0,
                bossChance: 0.0,
                rewards: {
                    xpMultiplier: 1.3,
                    lootMultiplier: 1.0,
                    achievement: 'blessed'
                },
                color: '#3498db',
                icon: '✨'
            }
        };
        
        // World regions
        this.regions = [
            { id: 'starter_zone', name: 'Zona Inicial', x: 400, y: 300, radius: 200 },
            { id: 'forest_region', name: 'Floresta Misteriosa', x: 800, y: 400, radius: 250 },
            { id: 'mountain_area', name: 'Montanhas Geladas', x: 1200, y: 200, radius: 300 },
            { id: 'desert_zone', name: 'Deserto Ardente', x: 600, y: 600, radius: 280 },
            { id: 'dark_forest', name: 'Floresta Sombria', x: 1000, y: 800, radius: 320 }
        ];
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startEventScheduler();
        this.startCleanupTimer();
        console.log('World Events System initialized');
    }
    
    setupEventHandlers() {
        this.server.on('playerJoinedEvent', (socket, data) => {
            this.handlePlayerJoinedEvent(socket, data);
        });
        
        this.server.on('playerLeftEvent', (socket, data) => {
            this.handlePlayerLeftEvent(socket, data);
        });
        
        this.server.on('requestEventInfo', (socket) => {
            this.handleRequestEventInfo(socket);
        });
        
        this.server.on('playerDisconnected', (playerId) => {
            this.handlePlayerDisconnected(playerId);
        });
    }
    
    startEventScheduler() {
        // Schedule random events
        setInterval(() => {
            this.tryScheduleEvent();
        }, 180000); // Check every 3 minutes
        
        // Start with one event
        setTimeout(() => {
            this.tryScheduleEvent();
        }, 30000); // First event after 30 seconds
    }
    
    tryScheduleEvent() {
        // Check if we can spawn more events
        if (this.activeEvents.size >= this.config.maxConcurrentEvents) {
            return;
        }
        
        // Get available regions
        const availableRegions = this.getAvailableRegions();
        if (availableRegions.length === 0) {
            return;
        }
        
        // Select random region and event type
        const region = availableRegions[Math.floor(Math.random() * availableRegions.length)];
        const eventTypes = Object.keys(this.eventTypes);
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        // Check level requirements
        if (!this.hasEnoughPlayersInRegion(region, eventType)) {
            return;
        }
        
        // Create event
        this.createEvent(eventType, region);
    }
    
    getAvailableRegions() {
        const now = Date.now();
        const available = [];
        
        for (const region of this.regions) {
            const lastEvent = this.eventHistory.get(region.id);
            if (!lastEvent || (now - lastEvent) > this.config.eventCooldown) {
                available.push(region);
            }
        }
        
        return available;
    }
    
    hasEnoughPlayersInRegion(region, eventType) {
        const eventConfig = this.eventTypes[eventType];
        const nearbyPlayers = this.getNearbyPlayers(region.x, region.y, region.radius);
        
        // Count players meeting level requirement
        const eligiblePlayers = nearbyPlayers.filter(player => 
            player.level >= eventConfig.minLevel
        );
        
        return eligiblePlayers.length >= 2; // Need at least 2 players
    }
    
    createEvent(eventType, region) {
        const eventConfig = this.eventTypes[eventType];
        const eventId = this.generateEventId();
        
        const event = {
            id: eventId,
            type: eventType,
            region: region,
            x: region.x + (Math.random() - 0.5) * region.radius,
            y: region.y + (Math.random() - 0.5) * region.radius,
            startTime: Date.now(),
            endTime: Date.now() + eventConfig.duration,
            participants: new Set(),
            mobs: new Map(),
            resources: new Map(),
            completed: false,
            config: eventConfig
        };
        
        this.activeEvents.set(eventId, event);
        this.participants.set(eventId, new Set());
        this.eventHistory.set(region.id, Date.now());
        
        // Spawn event content
        this.spawnEventContent(event);
        
        // Announce event
        this.announceEvent(event);
        
        // Set event completion timer
        setTimeout(() => {
            this.completeEvent(eventId);
        }, eventConfig.duration);
        
        console.log(`World event created: ${eventConfig.name} in ${region.name}`);
    }
    
    spawnEventContent(event) {
        const config = event.config;
        
        switch (event.type) {
            case 'demon_invasion':
                this.spawnDemonInvasion(event);
                break;
            case 'world_boss':
                this.spawnWorldBoss(event);
                break;
            case 'resource_bonanza':
                this.spawnResourceBonanza(event);
                break;
            case 'temporal_dungeon':
                this.spawnTemporalDungeon(event);
                break;
            case 'celestial_blessing':
                this.spawnCelestialBlessing(event);
                break;
        }
    }
    
    spawnDemonInvasion(event) {
        const spawnCount = event.config.spawnCount;
        
        for (let i = 0; i < spawnCount; i++) {
            const mob = this.createEventMob(event, 'demon', {
                level: 15 + Math.floor(Math.random() * 10),
                health: 200 + Math.floor(Math.random() * 100),
                attack: 20 + Math.floor(Math.random() * 10),
                defense: 15 + Math.floor(Math.random() * 8)
            });
            
            event.mobs.set(mob.id, mob);
            this.server.systems.spawnSystem?.addMob(mob);
        }
        
        // Chance to spawn boss
        if (Math.random() < event.config.bossChance) {
            const boss = this.createEventMob(event, 'demon_lord', {
                level: 25,
                health: 1000,
                attack: 40,
                defense: 25,
                isBoss: true
            });
            
            event.mobs.set(boss.id, boss);
            this.server.systems.spawnSystem?.addMob(boss);
        }
    }
    
    spawnWorldBoss(event) {
        const boss = this.createEventMob(event, 'world_boss', {
            level: 30 + Math.floor(Math.random() * 10),
            health: 5000 + Math.floor(Math.random() * 2000),
            attack: 60 + Math.floor(Math.random() * 20),
            defense: 40 + Math.floor(Math.random() * 15),
            isBoss: true
        });
        
        event.mobs.set(boss.id, boss);
        this.server.systems.spawnSystem?.addMob(boss);
    }
    
    spawnResourceBonanza(event) {
        const resourceTypes = ['iron_ore', 'gold_ore', 'rare_gem', 'ancient_relic', 'magic_crystal'];
        const spawnCount = event.config.spawnCount;
        
        for (let i = 0; i < spawnCount; i++) {
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const resource = this.createEventResource(event, resourceType);
            
            event.resources.set(resource.id, resource);
        }
    }
    
    spawnTemporalDungeon(event) {
        // Spawn dungeon mobs
        const mobTypes = ['time_guardian', 'chrono_beast', 'temporal_wraith'];
        const spawnCount = event.config.spawnCount;
        
        for (let i = 0; i < spawnCount; i++) {
            const mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
            const mob = this.createEventMob(event, mobType, {
                level: 20 + Math.floor(Math.random() * 15),
                health: 300 + Math.floor(Math.random() * 150),
                attack: 30 + Math.floor(Math.random() * 15),
                defense: 20 + Math.floor(Math.random() * 10)
            });
            
            event.mobs.set(mob.id, mob);
            this.server.systems.spawnSystem?.addMob(mob);
        }
        
        // Spawn dungeon boss
        if (Math.random() < event.config.bossChance) {
            const boss = this.createEventMob(event, 'time_lord', {
                level: 35,
                health: 2000,
                attack: 50,
                defense: 35,
                isBoss: true
            });
            
            event.mobs.set(boss.id, boss);
            this.server.systems.spawnSystem?.addMob(boss);
        }
    }
    
    spawnCelestialBlessing(event) {
        // Create blessing area effect
        const blessing = {
            id: this.generateId(),
            type: 'blessing',
            x: event.x,
            y: event.y,
            radius: 200,
            effects: {
                healthRegen: 5,
                manaRegen: 3,
                xpBonus: 0.3,
                duration: event.config.duration
            }
        };
        
        event.blessing = blessing;
        
        // Apply effects to nearby players
        this.applyBlessingEffects(event);
    }
    
    createEventMob(event, mobType, stats) {
        const position = this.getRandomPosition(event.x, event.y, 100);
        
        return {
            id: this.generateMobId(),
            type: mobType,
            level: stats.level,
            x: position.x,
            y: position.y,
            health: stats.health,
            maxHealth: stats.health,
            attack: stats.attack,
            defense: stats.defense,
            eventId: event.id,
            isBoss: stats.isBoss || false,
            value: stats.level * 20,
            xp: stats.level * 30
        };
    }
    
    createEventResource(event, resourceType) {
        const position = this.getRandomPosition(event.x, event.y, 150);
        
        return {
            id: this.generateId(),
            type: resourceType,
            x: position.x,
            y: position.y,
            eventId: event.id,
            value: this.getResourceValue(resourceType),
            respawnTime: 0 // No respawn for event resources
        };
    }
    
    getResourceValue(resourceType) {
        const values = {
            iron_ore: 10,
            gold_ore: 25,
            rare_gem: 50,
            ancient_relic: 100,
            magic_crystal: 75
        };
        return values[resourceType] || 10;
    }
    
    getRandomPosition(centerX, centerY, radius) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        
        return {
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance
        };
    }
    
    announceEvent(event) {
        const announcement = {
            type: 'world_event_started',
            eventId: event.id,
            eventType: event.type,
            eventName: event.config.name,
            description: event.config.description,
            region: event.region.name,
            x: event.x,
            y: event.y,
            duration: event.config.duration,
            icon: event.config.icon,
            color: event.config.color
        };
        
        // Global announcement
        this.broadcastGlobal('worldEventAnnouncement', announcement);
        
        // Regional announcement to nearby players
        const nearbyPlayers = this.getNearbyPlayers(event.x, event.y, this.config.announcementRadius);
        for (const player of nearbyPlayers) {
            const socket = this.server.getPlayerSocket(player.id);
            if (socket) {
                socket.emit('nearbyEvent', announcement);
            }
        }
    }
    
    handlePlayerJoinedEvent(socket, data) {
        const { eventId } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        const event = this.activeEvents.get(eventId);
        if (!event) {
            socket.emit('eventError', { message: 'Evento não encontrado!' });
            return;
        }
        
        // Check if player can join
        const distance = this.calculateDistance(player, event);
        if (distance > this.config.participationRadius) {
            socket.emit('eventError', { message: 'Você está muito longe do evento!' });
            return;
        }
        
        if (player.level < event.config.minLevel) {
            socket.emit('eventError', { message: `Nível mínimo: ${event.config.minLevel}` });
            return;
        }
        
        if (event.participants.size >= event.config.maxParticipants) {
            socket.emit('eventError', { message: 'Evento cheio!' });
            return;
        }
        
        // Add player to event
        event.participants.add(socket.playerId);
        this.participants.get(eventId).add(socket.playerId);
        
        // Send event info to player
        socket.emit('eventJoined', {
            eventId: eventId,
            eventInfo: this.getEventInfo(event)
        });
        
        // Notify other participants
        this.broadcastToEvent(eventId, 'participantJoined', {
            playerId: socket.playerId,
            playerName: player.name
        }, socket.playerId);
        
        console.log(`Player ${player.name} joined event ${event.config.name}`);
    }
    
    handlePlayerLeftEvent(socket, data) {
        const { eventId } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        // Remove player from event
        event.participants.delete(socket.playerId);
        this.participants.get(eventId)?.delete(socket.playerId);
        
        // Send confirmation
        socket.emit('eventLeft', { eventId: eventId });
        
        // Notify other participants
        this.broadcastToEvent(eventId, 'participantLeft', {
            playerId: socket.playerId,
            playerName: player.name
        }, socket.playerId);
        
        console.log(`Player ${player.name} left event ${event.config.name}`);
    }
    
    handleRequestEventInfo(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const nearbyEvents = this.getNearbyEvents(player);
        const activeEvents = Array.from(this.activeEvents.values()).map(event => 
            this.getEventInfo(event)
        );
        
        socket.emit('eventInfo', {
            nearbyEvents: nearbyEvents,
            activeEvents: activeEvents
        });
    }
    
    handlePlayerDisconnected(playerId) {
        // Remove player from all events
        for (const [eventId, event] of this.activeEvents) {
            if (event.participants.has(playerId)) {
                event.participants.delete(playerId);
                this.participants.get(eventId)?.delete(playerId);
                
                // Notify other participants
                this.broadcastToEvent(eventId, 'participantDisconnected', {
                    playerId: playerId
                });
            }
        }
    }
    
    completeEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event || event.completed) return;
        
        event.completed = true;
        
        // Calculate rewards
        const rewards = this.calculateEventRewards(event);
        
        // Distribute rewards to participants
        this.distributeEventRewards(event, rewards);
        
        // Announce completion
        this.announceEventCompletion(event, rewards);
        
        // Cleanup event
        setTimeout(() => {
            this.cleanupEvent(eventId);
        }, 30000); // Cleanup after 30 seconds
        
        console.log(`Event completed: ${event.config.name}`);
    }
    
    calculateEventRewards(event) {
        const config = event.config;
        const participants = Array.from(event.participants);
        const rewards = {
            xp: Math.floor(1000 * config.rewards.xpMultiplier * participants.length),
            loot: [],
            achievement: config.rewards.achievement,
            participants: participants.length
        };
        
        // Generate loot based on event type
        if (event.type === 'resource_bonanza') {
            rewards.loot = this.generateResourceLoot(event);
        } else if (event.mobs.size > 0) {
            rewards.loot = this.generateCombatLoot(event);
        }
        
        return rewards;
    }
    
    generateResourceLoot(event) {
        const loot = [];
        const resourceTypes = ['rare_gem', 'ancient_relic', 'magic_crystal', 'legendary_fragment'];
        
        for (let i = 0; i < 5; i++) {
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            loot.push({
                id: resourceType,
                name: this.getResourceName(resourceType),
                type: 'material',
                rarity: 'rare',
                quantity: 1 + Math.floor(Math.random() * 3)
            });
        }
        
        return loot;
    }
    
    generateCombatLoot(event) {
        const loot = [];
        const avgLevel = this.getAverageParticipantLevel(event);
        
        // Generate items based on event difficulty
        const itemCount = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < itemCount; i++) {
            const item = this.server.systems.itemSystem?.generateLoot(avgLevel, 'event_mob');
            if (item && item.length > 0) {
                loot.push(...item);
            }
        }
        
        return loot;
    }
    
    getResourceName(resourceType) {
        const names = {
            rare_gem: 'Gema Rara',
            ancient_relic: 'Relíquia Antiga',
            magic_crystal: 'Cristal Mágico',
            legendary_fragment: 'Fragmento Lendário'
        };
        return names[resourceType] || resourceType;
    }
    
    getAverageParticipantLevel(event) {
        const participants = Array.from(event.participants);
        if (participants.length === 0) return 1;
        
        let totalLevel = 0;
        for (const playerId of participants) {
            const player = this.server.players.get(playerId);
            if (player) {
                totalLevel += player.level;
            }
        }
        
        return Math.floor(totalLevel / participants.length);
    }
    
    distributeEventRewards(event, rewards) {
        const participants = Array.from(event.participants);
        
        for (const playerId of participants) {
            const player = this.server.players.get(playerId);
            if (!player) continue;
            
            // Give XP
            const xpPerPlayer = Math.floor(rewards.xp / participants.length);
            this.giveXPToPlayer(player, xpPerPlayer);
            
            // Give loot
            const lootPerPlayer = Math.floor(rewards.loot.length / participants.length);
            for (let i = 0; i < lootPerPlayer; i++) {
                const item = rewards.loot[i];
                if (item) {
                    this.server.systems.itemSystem?.giveItemToPlayer(playerId, item.id, item.quantity || 1);
                }
            }
            
            // Give achievement
            if (rewards.achievement) {
                this.giveAchievement(playerId, rewards.achievement);
            }
            
            // Notify player
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('eventRewards', {
                    eventId: event.id,
                    xp: xpPerPlayer,
                    loot: rewards.loot.slice(0, lootPerPlayer),
                    achievement: rewards.achievement
                });
            }
        }
    }
    
    announceEventCompletion(event, rewards) {
        const announcement = {
            type: 'world_event_completed',
            eventId: event.id,
            eventName: event.config.name,
            participants: rewards.participants,
            success: true
        };
        
        this.broadcastGlobal('worldEventAnnouncement', announcement);
    }
    
    giveXPToPlayer(player, amount) {
        player.xp += amount;
        
        // Check for level up
        const xpNeeded = this.calculateXPNeeded(player.level);
        if (player.xp >= xpNeeded) {
            player.level++;
            player.xp -= xpNeeded;
            this.handleLevelUp(player);
        }
    }
    
    giveAchievement(playerId, achievementId) {
        // This would integrate with an achievement system
        console.log(`Player ${playerId} earned achievement: ${achievementId}`);
    }
    
    calculateXPNeeded(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }
    
    handleLevelUp(player) {
        // Increase stats
        player.maxHealth += 10;
        player.health = player.maxHealth;
        player.maxMana += 5;
        player.mana = player.maxMana;
        player.attack += 2;
        player.defense += 1;
        
        // Notify player
        const socket = this.server.getPlayerSocket(player.id);
        if (socket) {
            socket.emit('levelUp', {
                newLevel: player.level,
                stats: {
                    health: player.maxHealth,
                    mana: player.maxMana,
                    attack: player.attack,
                    defense: player.defense
                }
            });
        }
    }
    
    applyBlessingEffects(event) {
        if (!event.blessing) return;
        
        const nearbyPlayers = this.getNearbyPlayers(event.x, event.y, event.blessing.radius);
        
        for (const player of nearbyPlayers) {
            // Apply blessing effects
            player.blessing = {
                eventId: event.id,
                effects: event.blessing.effects,
                endTime: Date.now() + event.blessing.effects.duration
            };
            
            // Notify player
            const socket = this.server.getPlayerSocket(player.id);
            if (socket) {
                socket.emit('blessingApplied', {
                    eventId: event.id,
                    effects: event.blessing.effects,
                    duration: event.blessing.effects.duration
                });
            }
        }
    }
    
    cleanupEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        // Clean up mobs
        for (const mob of event.mobs.values()) {
            this.server.systems.spawnSystem?.removeMob(mob.id);
        }
        
        // Clean up blessing effects
        if (event.blessing) {
            for (const [playerId, player] of this.server.players) {
                if (player.blessing && player.blessing.eventId === eventId) {
                    delete player.blessing;
                    
                    const socket = this.server.getPlayerSocket(playerId);
                    if (socket) {
                        socket.emit('blessingRemoved', { eventId: eventId });
                    }
                }
            }
        }
        
        // Remove event
        this.activeEvents.delete(eventId);
        this.participants.delete(eventId);
        
        console.log(`Event cleaned up: ${eventId}`);
    }
    
    // Utility Methods
    generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateMobId() {
        return 'event_mob_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    generateId() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getNearbyPlayers(x, y, radius) {
        const nearby = [];
        
        for (const [playerId, player] of this.server.players) {
            if (!player.name) continue;
            
            const distance = this.calculateDistance({ x, y }, player);
            if (distance <= radius) {
                nearby.push(player);
            }
        }
        
        return nearby;
    }
    
    getNearbyEvents(player) {
        const nearby = [];
        
        for (const event of this.activeEvents.values()) {
            const distance = this.calculateDistance(player, event);
            if (distance <= this.config.announcementRadius) {
                nearby.push(this.getEventInfo(event));
            }
        }
        
        return nearby;
    }
    
    getEventInfo(event) {
        return {
            id: event.id,
            type: event.type,
            name: event.config.name,
            description: event.config.description,
            region: event.region.name,
            x: event.x,
            y: event.y,
            startTime: event.startTime,
            endTime: event.endTime,
            participants: event.participants.size,
            maxParticipants: event.config.maxParticipants,
            minLevel: event.config.minLevel,
            icon: event.config.icon,
            color: event.config.color,
            timeRemaining: Math.max(0, event.endTime - Date.now())
        };
    }
    
    broadcastGlobal(event, data) {
        for (const [playerId, player] of this.server.players) {
            if (!player.name) continue;
            
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit(event, data);
            }
        }
    }
    
    broadcastToEvent(eventId, event, data, excludePlayer = null) {
        const participants = this.participants.get(eventId);
        if (!participants) return;
        
        for (const playerId of participants) {
            if (playerId === excludePlayer) continue;
            
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit(event, data);
            }
        }
    }
    
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredEvents();
        }, this.config.cleanupInterval);
    }
    
    cleanupExpiredEvents() {
        const now = Date.now();
        
        for (const [eventId, event] of this.activeEvents) {
            if (now >= event.endTime && !event.completed) {
                this.completeEvent(eventId);
            }
        }
    }
    
    // Public API
    getActiveEvents() {
        return Array.from(this.activeEvents.values()).map(event => this.getEventInfo(event));
    }
    
    getEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        return event ? this.getEventInfo(event) : null;
    }
    
    isPlayerInEvent(playerId) {
        for (const [eventId, event] of this.activeEvents) {
            if (event.participants.has(playerId)) {
                return eventId;
            }
        }
        return null;
    }
    
    // Cleanup
    cleanup() {
        // Clean up all active events
        for (const [eventId] of this.activeEvents) {
            this.cleanupEvent(eventId);
        }
        
        this.activeEvents.clear();
        this.eventHistory.clear();
        this.participants.clear();
        
        console.log('World Events System cleanup complete');
    }
}

module.exports = WorldEvents;
