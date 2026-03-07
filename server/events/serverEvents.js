/**
 * Server Events System - Real-time Event Management
 * Manages server-wide events, notifications, and broadcasts
 * Version 0.3 - First Playable Gameplay Systems
 */

class ServerEvents {
    constructor(server) {
        this.server = server;
        
        // Event configuration
        this.config = {
            maxActiveEvents: 10,
            eventDuration: 3600000, // 1 hour
            notificationRadius: 1000,
            broadcastInterval: 30000, // 30 seconds
            eventTypes: {
                invasion: {
                    name: 'Monster Invasion',
                    duration: 1800000, // 30 minutes
                    minParticipants: 5,
                    maxParticipants: 50,
                    rewards: { experience: 1000, gold: 500 },
                    difficulty: 'medium'
                },
                worldBoss: {
                    name: 'World Boss',
                    duration: 3600000, // 1 hour
                    minParticipants: 10,
                    maxParticipants: 100,
                    rewards: { experience: 5000, gold: 2000 },
                    difficulty: 'hard'
                },
                festival: {
                    name: 'Seasonal Festival',
                    duration: 7200000, // 2 hours
                    minParticipants: 1,
                    maxParticipants: 200,
                    rewards: { experience: 500, gold: 200 },
                    difficulty: 'easy'
                },
                raid: {
                    name: 'Raid Event',
                    duration: 5400000, // 1.5 hours
                    minParticipants: 20,
                    maxParticipants: 80,
                    rewards: { experience: 3000, gold: 1500 },
                    difficulty: 'hard'
                },
                treasureHunt: {
                    name: 'Treasure Hunt',
                    duration: 2700000, // 45 minutes
                    minParticipants: 3,
                    maxParticipants: 30,
                    rewards: { experience: 800, gold: 400 },
                    difficulty: 'medium'
                }
            }
        };
        
        // Active events
        this.activeEvents = new Map();
        this.eventHistory = [];
        this.eventQueue = [];
        
        // Event participants
        this.eventParticipants = new Map();
        
        // Notifications
        this.notifications = [];
        this.broadcastQueue = [];
        
        // State
        this.isRunning = false;
        this.lastBroadcast = 0;
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Start event loop
        this.startEventLoop();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start with some initial events
        this.scheduleInitialEvents();
        
        console.log('Server Events System initialized');
    }
    
    startEventLoop() {
        this.isRunning = true;
        
        // Main update loop
        setInterval(() => {
            this.update();
        }, 5000); // Update every 5 seconds
        
        // Broadcast loop
        setInterval(() => {
            this.processBroadcasts();
        }, this.config.broadcastInterval);
        
        // Event scheduling loop
        setInterval(() => {
            this.scheduleRandomEvent();
        }, 900000); // Check every 15 minutes
    }
    
    setupEventHandlers() {
        // Player event handlers
        this.server.on('playerJoined', (playerId, playerData) => {
            this.handlePlayerJoined(playerId, playerData);
        });
        
        this.server.on('playerLeft', (playerId) => {
            this.handlePlayerLeft(playerId);
        });
        
        this.server.on('playerDeath', (playerId, killerId) => {
            this.handlePlayerDeath(playerId, killerId);
        });
        
        this.server.on('playerLevelUp', (playerId, newLevel) => {
            this.handlePlayerLevelUp(playerId, newLevel);
        });
        
        // Combat event handlers
        this.server.on('entityDeath', (entityId, killerId) => {
            this.handleEntityDeath(entityId, killerId);
        });
        
        this.server.on('bossDefeated', (bossId, participants) => {
            this.handleBossDefeated(bossId, participants);
        });
        
        // World event handlers
        this.server.on('dungeonCompleted', (dungeonId, playerId) => {
            this.handleDungeonCompleted(dungeonId, playerId);
        });
        
        this.server.on('rareItemFound', (playerId, item) => {
            this.handleRareItemFound(playerId, item);
        });
    }
    
    // Event management
    createEvent(type, options = {}) {
        const eventType = this.config.eventTypes[type];
        if (!eventType) {
            console.error(`Unknown event type: ${type}`);
            return null;
        }
        
        // Check if we can create more events
        if (this.activeEvents.size >= this.config.maxActiveEvents) {
            console.log('Maximum active events reached');
            return null;
        }
        
        const event = {
            id: this.generateEventId(),
            type: type,
            name: eventType.name,
            description: options.description || this.generateEventDescription(type),
            startTime: Date.now(),
            endTime: Date.now() + (options.duration || eventType.duration),
            location: options.location || this.generateEventLocation(),
            participants: new Set(),
            maxParticipants: options.maxParticipants || eventType.maxParticipants,
            minParticipants: options.minParticipants || eventType.minParticipants,
            rewards: options.rewards || eventType.rewards,
            difficulty: options.difficulty || eventType.difficulty,
            status: 'active',
            progress: 0,
            objectives: options.objectives || this.generateEventObjectives(type),
            data: options.data || {}
        };
        
        // Add to active events
        this.activeEvents.set(event.id, event);
        
        // Announce event
        this.announceEvent(event);
        
        // Initialize event-specific logic
        this.initializeEventLogic(event);
        
        console.log(`Created event: ${event.name} (${event.id})`);
        
        return event;
    }
    
    generateEventDescription(type) {
        const descriptions = {
            invasion: 'Monsters are invading the region! Help defend the land!',
            worldBoss: 'A powerful boss has appeared! Gather your allies to defeat it!',
            festival: 'A seasonal festival is being held! Join the celebrations!',
            raid: 'A raid is in progress! Coordinate with other players to succeed!',
            treasureHunt: 'Treasure has been hidden somewhere in the world! Find it first!'
        };
        
        return descriptions[type] || 'An event is happening in the world!';
    }
    
    generateEventLocation() {
        // Generate random location in the world
        const worldWidth = this.server.worldManager.config.worldWidth * this.server.worldManager.config.chunkSize * this.server.worldManager.config.tileSize;
        const worldHeight = this.server.worldManager.config.worldHeight * this.server.worldManager.config.chunkSize * this.server.worldManager.config.tileSize;
        
        return {
            x: Math.floor(Math.random() * worldWidth),
            y: Math.floor(Math.random() * worldHeight),
            radius: 500
        };
    }
    
    generateEventObjectives(type) {
        const objectives = {
            invasion: [
                { id: 'kill_monsters', description: 'Defeat invading monsters', progress: 0, target: 50 }
            ],
            worldBoss: [
                { id: 'defeat_boss', description: 'Defeat the world boss', progress: 0, target: 1 }
            ],
            festival: [
                { id: 'participate', description: 'Participate in festival activities', progress: 0, target: 10 }
            ],
            raid: [
                { id: 'complete_raid', description: 'Complete the raid objectives', progress: 0, target: 5 }
            ],
            treasureHunt: [
                { id: 'find_treasure', description: 'Find the hidden treasure', progress: 0, target: 1 }
            ]
        };
        
        return objectives[type] || [];
    }
    
    initializeEventLogic(event) {
        switch (event.type) {
            case 'invasion':
                this.initializeInvasionEvent(event);
                break;
            case 'worldBoss':
                this.initializeWorldBossEvent(event);
                break;
            case 'festival':
                this.initializeFestivalEvent(event);
                break;
            case 'raid':
                this.initializeRaidEvent(event);
                break;
            case 'treasureHunt':
                this.initializeTreasureHuntEvent(event);
                break;
        }
    }
    
    initializeInvasionEvent(event) {
        // Spawn invasion monsters
        const monsterCount = 20;
        const spawnRadius = event.location.radius;
        
        for (let i = 0; i < monsterCount; i++) {
            const angle = (Math.PI * 2 * i) / monsterCount;
            const distance = Math.random() * spawnRadius;
            
            const x = event.location.x + Math.cos(angle) * distance;
            const y = event.location.y + Math.sin(angle) * distance;
            
            const monster = this.server.worldManager.spawnSystem.forceSpawn('invasion_monster', x, y, 15);
            if (monster) {
                monster.eventId = event.id;
                monster.isEventMonster = true;
            }
        }
        
        this.addNotification({
            type: 'event_start',
            title: 'Invasion Started!',
            message: `Monster invasion at ${event.location.x}, ${event.location.y}`,
            level: 'warning',
            duration: 10000
        });
    }
    
    initializeWorldBossEvent(event) {
        // Spawn world boss
        const boss = this.server.worldManager.spawnSystem.forceSpawn('world_boss', event.location.x, event.location.y, 50);
        if (boss) {
            boss.eventId = event.id;
            boss.isWorldBoss = true;
            boss.isEventMonster = true;
            
            event.data.bossId = boss.id;
        }
        
        this.addNotification({
            type: 'event_start',
            title: 'World Boss Appeared!',
            message: `World boss at ${event.location.x}, ${event.location.y}`,
            level: 'danger',
            duration: 15000
        });
    }
    
    initializeFestivalEvent(event) {
        // Create festival area
        event.data.festivalActivities = [
            { type: 'games', description: 'Play festival games' },
            { type: 'food', description: 'Enjoy festival food' },
            { type: 'music', description: 'Listen to festival music' }
        ];
        
        this.addNotification({
            type: 'event_start',
            title: 'Festival Started!',
            message: `Seasonal festival at ${event.location.x}, ${event.location.y}`,
            level: 'info',
            duration: 10000
        });
    }
    
    initializeRaidEvent(event) {
        // Initialize raid objectives
        event.data.raidObjectives = [
            { id: 'clear_area', description: 'Clear the raid area', completed: false },
            { id: 'defend_point', description: 'Defend strategic points', completed: false },
            { id: 'defeat_leaders', description: 'Defeat raid leaders', completed: false }
        ];
        
        this.addNotification({
            type: 'event_start',
            title: 'Raid Started!',
            message: `Raid event at ${event.location.x}, ${event.location.y}`,
            level: 'warning',
            duration: 12000
        });
    }
    
    initializeTreasureHuntEvent(event) {
        // Hide treasure
        const treasureCount = 5;
        event.data.treasureLocations = [];
        
        for (let i = 0; i < treasureCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * event.location.radius;
            
            const x = event.location.x + Math.cos(angle) * distance;
            const y = event.location.y + Math.sin(angle) * distance;
            
            event.data.treasureLocations.push({ x, y, found: false, id: this.generateTreasureId() });
        }
        
        this.addNotification({
            type: 'event_start',
            title: 'Treasure Hunt Started!',
            message: `Treasure hunt in the area around ${event.location.x}, ${event.location.y}`,
            level: 'info',
            duration: 10000
        });
    }
    
    // Event participation
    joinEvent(playerId, eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) {
            return { success: false, message: 'Event not found' };
        }
        
        if (event.participants.size >= event.maxParticipants) {
            return { success: false, message: 'Event is full' };
        }
        
        if (event.participants.has(playerId)) {
            return { success: false, message: 'Already participating' };
        }
        
        // Check if player is close enough
        const player = this.server.worldManager.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        
        const distance = Math.sqrt(
            Math.pow(player.x - event.location.x, 2) + 
            Math.pow(player.y - event.location.y, 2)
        );
        
        if (distance > event.location.radius) {
            return { success: false, message: 'Too far from event location' };
        }
        
        // Add participant
        event.participants.add(playerId);
        
        // Track participant data
        if (!this.eventParticipants.has(playerId)) {
            this.eventParticipants.set(playerId, new Set());
        }
        this.eventParticipants.get(playerId).add(eventId);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('eventJoined', {
                eventId: eventId,
                event: this.getEventSummary(event)
            });
        }
        
        console.log(`Player ${playerId} joined event ${eventId}`);
        
        return { success: true, message: 'Joined event successfully' };
    }
    
    leaveEvent(playerId, eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) {
            return { success: false, message: 'Event not found' };
        }
        
        if (!event.participants.has(playerId)) {
            return { success: false, message: 'Not participating in event' };
        }
        
        // Remove participant
        event.participants.delete(playerId);
        
        // Update participant tracking
        const playerEvents = this.eventParticipants.get(playerId);
        if (playerEvents) {
            playerEvents.delete(eventId);
            if (playerEvents.size === 0) {
                this.eventParticipants.delete(playerId);
            }
        }
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('eventLeft', {
                eventId: eventId
            });
        }
        
        console.log(`Player ${playerId} left event ${eventId}`);
        
        return { success: true, message: 'Left event successfully' };
    }
    
    // Event progress
    updateEventProgress(eventId, objectiveId, progress) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        const objective = event.objectives.find(obj => obj.id === objectiveId);
        if (!objective) return;
        
        objective.progress = Math.min(objective.progress + progress, objective.target);
        
        // Check if event is complete
        if (event.objectives.every(obj => obj.progress >= obj.target)) {
            this.completeEvent(eventId);
        }
        
        // Notify participants
        this.notifyEventProgress(event);
    }
    
    completeEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        event.status = 'completed';
        event.endTime = Date.now();
        
        // Award rewards to participants
        this.awardEventRewards(event);
        
        // Notify all players
        this.broadcastEventCompletion(event);
        
        // Move to history
        this.eventHistory.push(event);
        this.activeEvents.delete(eventId);
        
        console.log(`Event completed: ${event.name} (${eventId})`);
    }
    
    awardEventRewards(event) {
        for (const playerId of event.participants) {
            this.awardPlayerEventRewards(playerId, event);
        }
    }
    
    async awardPlayerEventRewards(playerId, event) {
        try {
            // Award experience
            if (event.rewards.experience > 0) {
                await this.server.db.run(`
                    UPDATE characters SET experience = experience + ? WHERE player_id = ?
                `, [event.rewards.experience, playerId]);
            }
            
            // Award gold
            if (event.rewards.gold > 0) {
                await this.server.db.run(`
                    UPDATE characters SET gold = gold + ? WHERE player_id = ?
                `, [event.rewards.gold, playerId]);
            }
            
            // Notify player
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('eventReward', {
                    eventId: event.id,
                    rewards: event.rewards
                });
            }
            
        } catch (error) {
            console.error('Error awarding event rewards:', error);
        }
    }
    
    // Event handlers
    handlePlayerJoined(playerId, playerData) {
        // Notify about active events
        const activeEvents = this.getActiveEvents();
        const socket = this.server.getPlayerSocket(playerId);
        
        if (socket && activeEvents.length > 0) {
            socket.emit('activeEvents', activeEvents);
        }
    }
    
    handlePlayerLeft(playerId) {
        // Remove from all events
        const playerEvents = this.eventParticipants.get(playerId);
        if (playerEvents) {
            for (const eventId of playerEvents) {
                this.leaveEvent(playerId, eventId);
            }
        }
    }
    
    handlePlayerDeath(playerId, killerId) {
        // Check if player was in an event
        const playerEvents = this.eventParticipants.get(playerId);
        if (playerEvents) {
            for (const eventId of playerEvents) {
                const event = this.activeEvents.get(eventId);
                if (event) {
                    this.notifyPlayerDeathInEvent(event, playerId, killerId);
                }
            }
        }
    }
    
    handlePlayerLevelUp(playerId, newLevel) {
        // Check if player leveled up during an event
        const playerEvents = this.eventParticipants.get(playerId);
        if (playerEvents) {
            for (const eventId of playerEvents) {
                const event = this.activeEvents.get(eventId);
                if (event) {
                    this.notifyPlayerLevelUpInEvent(event, playerId, newLevel);
                }
            }
        }
    }
    
    handleEntityDeath(entityId, killerId) {
        // Check if entity was part of an event
        const entity = this.server.worldManager.entities.get(entityId);
        if (entity && entity.eventId) {
            const event = this.activeEvents.get(entity.eventId);
            if (event) {
                this.handleEventEntityDeath(event, entity, killerId);
            }
        }
    }
    
    handleBossDefeated(bossId, participants) {
        // Find the event this boss belonged to
        for (const event of this.activeEvents.values()) {
            if (event.data.bossId === bossId) {
                this.updateEventProgress(event.id, 'defeat_boss', 1);
                break;
            }
        }
    }
    
    handleDungeonCompleted(dungeonId, playerId) {
        // Award bonus if player was in a raid event
        const playerEvents = this.eventParticipants.get(playerId);
        if (playerEvents) {
            for (const eventId of playerEvents) {
                const event = this.activeEvents.get(eventId);
                if (event && event.type === 'raid') {
                    this.updateEventProgress(eventId, 'complete_raid', 1);
                    break;
                }
            }
        }
    }
    
    handleRareItemFound(playerId, item) {
        // Create special notification
        this.addNotification({
            type: 'achievement',
            title: 'Rare Item Found!',
            message: `${playerId} found a rare item: ${item.name}`,
            level: 'success',
            duration: 15000,
            playerId: playerId
        });
    }
    
    handleEventEntityDeath(event, entity, killerId) {
        switch (event.type) {
            case 'invasion':
                this.updateEventProgress(event.id, 'kill_monsters', 1);
                break;
        }
        
        // Notify participants
        this.notifyEventEntityDeath(event, entity, killerId);
    }
    
    // Notifications and broadcasts
    announceEvent(event) {
        this.addNotification({
            type: 'event_announcement',
            title: 'New Event!',
            message: `${event.name} has started! Join now!`,
            level: 'info',
            duration: 20000,
            eventId: event.id
        });
        
        // Broadcast to all players
        this.server.io.emit('eventAnnouncement', {
            event: this.getEventSummary(event)
        });
    }
    
    notifyEventProgress(event) {
        for (const playerId of event.participants) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('eventProgress', {
                    eventId: event.id,
                    objectives: event.objectives,
                    progress: event.progress
                });
            }
        }
    }
    
    notifyPlayerDeathInEvent(event, playerId, killerId) {
        for (const participantId of event.participants) {
            const socket = this.server.getPlayerSocket(participantId);
            if (socket) {
                socket.emit('eventPlayerDeath', {
                    eventId: event.id,
                    playerId: playerId,
                    killerId: killerId
                });
            }
        }
    }
    
    notifyPlayerLevelUpInEvent(event, playerId, newLevel) {
        for (const participantId of event.participants) {
            const socket = this.server.getPlayerSocket(participantId);
            if (socket) {
                socket.emit('eventPlayerLevelUp', {
                    eventId: event.id,
                    playerId: playerId,
                    newLevel: newLevel
                });
            }
        }
    }
    
    notifyEventEntityDeath(event, entity, killerId) {
        for (const participantId of event.participants) {
            const socket = this.server.getPlayerSocket(participantId);
            if (socket) {
                socket.emit('eventEntityDeath', {
                    eventId: event.id,
                    entityId: entity.id,
                    killerId: killerId
                });
            }
        }
    }
    
    broadcastEventCompletion(event) {
        this.addNotification({
            type: 'event_completion',
            title: 'Event Completed!',
            message: `${event.name} has been completed successfully!`,
            level: 'success',
            duration: 15000
        });
        
        this.server.io.emit('eventCompleted', {
            event: this.getEventSummary(event)
        });
    }
    
    // Update loop
    update() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        
        // Update active events
        for (const [eventId, event] of this.activeEvents) {
            if (now >= event.endTime) {
                // Event timed out
                this.timeoutEvent(eventId);
            } else {
                // Update event-specific logic
                this.updateEventLogic(event);
            }
        }
        
        // Process notifications
        this.processNotifications();
        
        // Clean up old notifications
        this.cleanupNotifications();
    }
    
    updateEventLogic(event) {
        switch (event.type) {
            case 'invasion':
                this.updateInvasionEvent(event);
                break;
            case 'worldBoss':
                this.updateWorldBossEvent(event);
                break;
            case 'festival':
                this.updateFestivalEvent(event);
                break;
            case 'raid':
                this.updateRaidEvent(event);
                break;
            case 'treasureHunt':
                this.updateTreasureHuntEvent(event);
                break;
        }
    }
    
    updateInvasionEvent(event) {
        // Check invasion progress
        const invasionMonsters = Array.from(this.server.worldManager.entities.values())
            .filter(entity => entity.eventId === event.id && entity.isEventMonster);
        
        if (invasionMonsters.length === 0) {
            // All monsters defeated
            this.updateEventProgress(event.id, 'kill_monsters', 50);
        }
    }
    
    updateWorldBossEvent(event) {
        // Check if boss is still alive
        const boss = this.server.worldManager.entities.get(event.data.bossId);
        if (!boss || boss.health <= 0) {
            // Boss defeated
            this.updateEventProgress(event.id, 'defeat_boss', 1);
        }
    }
    
    updateFestivalEvent(event) {
        // Update festival activities
        // This would involve mini-games and activities
    }
    
    updateRaidEvent(event) {
        // Update raid objectives
        // This would involve complex raid mechanics
    }
    
    updateTreasureHuntEvent(event) {
        // Check if all treasures are found
        const allFound = event.data.treasureLocations.every(treasure => treasure.found);
        if (allFound) {
            this.updateEventProgress(event.id, 'find_treasure', 1);
        }
    }
    
    timeoutEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        event.status = 'timeout';
        event.endTime = Date.now();
        
        // Notify participants
        for (const playerId of event.participants) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('eventTimeout', {
                    eventId: eventId
                });
            }
        }
        
        // Move to history
        this.eventHistory.push(event);
        this.activeEvents.delete(eventId);
        
        console.log(`Event timed out: ${event.name} (${eventId})`);
    }
    
    // Notification system
    addNotification(notification) {
        notification.id = this.generateNotificationId();
        notification.timestamp = Date.now();
        notification.expiry = notification.timestamp + (notification.duration || 10000);
        
        this.notifications.push(notification);
    }
    
    processNotifications() {
        const now = Date.now();
        
        for (const notification of this.notifications) {
            if (notification.timestamp <= now && !notification.processed) {
                this.sendNotification(notification);
                notification.processed = true;
            }
        }
    }
    
    sendNotification(notification) {
        if (notification.playerId) {
            // Send to specific player
            const socket = this.server.getPlayerSocket(notification.playerId);
            if (socket) {
                socket.emit('notification', notification);
            }
        } else {
            // Send to all players
            this.server.io.emit('notification', notification);
        }
    }
    
    cleanupNotifications() {
        const now = Date.now();
        this.notifications = this.notifications.filter(
            notification => now < notification.expiry
        );
    }
    
    processBroadcasts() {
        const now = Date.now();
        
        if (now - this.lastBroadcast >= this.config.broadcastInterval) {
            this.sendBroadcasts();
            this.lastBroadcast = now;
        }
    }
    
    sendBroadcasts() {
        // Send various broadcasts
        this.sendWorldStatusBroadcast();
        this.sendActiveEventsBroadcast();
        this.sendLeaderboardBroadcast();
    }
    
    sendWorldStatusBroadcast() {
        const worldStats = this.server.worldManager.getWorldStats();
        
        this.server.io.emit('worldStatus', {
            onlinePlayers: this.server.players.size,
            worldTime: worldStats.worldTime,
            activeEvents: this.activeEvents.size
        });
    }
    
    sendActiveEventsBroadcast() {
        const activeEvents = this.getActiveEvents();
        
        this.server.io.emit('activeEventsUpdate', activeEvents);
    }
    
    sendLeaderboardBroadcast() {
        const leaderboard = this.getEventLeaderboard();
        
        this.server.io.emit('eventLeaderboard', leaderboard);
    }
    
    // Event scheduling
    scheduleInitialEvents() {
        // Schedule some initial events
        setTimeout(() => {
            this.createEvent('festival');
        }, 60000); // 1 minute after start
        
        setTimeout(() => {
            this.createEvent('treasureHunt');
        }, 300000); // 5 minutes after start
    }
    
    scheduleRandomEvent() {
        if (this.activeEvents.size >= this.config.maxActiveEvents) {
            return;
        }
        
        const eventTypes = Object.keys(this.config.eventTypes);
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        this.createEvent(randomType);
    }
    
    // Utility methods
    getActiveEvents() {
        const events = [];
        
        for (const event of this.activeEvents.values()) {
            events.push(this.getEventSummary(event));
        }
        
        return events;
    }
    
    getEventSummary(event) {
        return {
            id: event.id,
            type: event.type,
            name: event.name,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            participants: event.participants.size,
            maxParticipants: event.maxParticipants,
            status: event.status,
            progress: event.progress,
            objectives: event.objectives,
            difficulty: event.difficulty
        };
    }
    
    getEvent(eventId) {
        return this.activeEvents.get(eventId);
    }
    
    getPlayerEvents(playerId) {
        const playerEvents = this.eventParticipants.get(playerId);
        if (!playerEvents) return [];
        
        const events = [];
        for (const eventId of playerEvents) {
            const event = this.activeEvents.get(eventId);
            if (event) {
                events.push(this.getEventSummary(event));
            }
        }
        
        return events;
    }
    
    getEventLeaderboard() {
        const leaderboard = [];
        
        for (const [playerId, playerEvents] of this.eventParticipants) {
            let score = 0;
            
            for (const eventId of playerEvents) {
                const event = this.activeEvents.get(eventId);
                if (event) {
                    score += event.participants.has(playerId) ? 10 : 0;
                }
            }
            
            leaderboard.push({
                playerId: playerId,
                score: score,
                eventsParticipated: playerEvents.size
            });
        }
        
        // Sort by score
        leaderboard.sort((a, b) => b.score - a.score);
        
        return leaderboard.slice(0, 10); // Top 10
    }
    
    getEventHistory() {
        return this.eventHistory.slice(-20); // Last 20 events
    }
    
    // ID generators
    generateEventId() {
        return 'event_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateNotificationId() {
        return 'notif_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateTreasureId() {
        return 'treasure_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Cleanup
    cleanup() {
        this.isRunning = false;
        
        // Complete all active events
        for (const [eventId, event] of this.activeEvents) {
            this.timeoutEvent(eventId);
        }
        
        // Clear data
        this.activeEvents.clear();
        this.eventParticipants.clear();
        this.notifications = [];
        
        console.log('Server Events System cleanup complete');
    }
}

module.exports = ServerEvents;
