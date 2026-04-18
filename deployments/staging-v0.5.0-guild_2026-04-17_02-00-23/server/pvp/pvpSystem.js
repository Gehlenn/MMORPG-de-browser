/**
 * PvP System - Player vs Player Combat
 * Handles duels, arenas, battlegrounds, and open world PvP
 * Version 0.3 - First Playable Gameplay Systems
 */

class PvPSystem {
    constructor(server) {
        this.server = server;
        
        // PvP configuration
        this.config = {
            // General settings
            enabled: true,
            minLevel: 10,
            duelDistance: 50,
            duelDuration: 300000, // 5 minutes
            respawnTime: 10000, // 10 seconds
            
            // Arena settings
            arenaSize: { width: 500, height: 500 },
            arenaPrepTime: 30000, // 30 seconds
            arenaMatchDuration: 600000, // 10 minutes
            maxArenaParticipants: 10,
            arenaRewardPoints: 100,
            
            // Battleground settings
            battlegroundSize: { width: 1000, height: 1000 },
            battlegroundPrepTime: 60000, // 1 minute
            battlegroundMatchDuration: 1200000, // 20 minutes
            maxBattlegroundParticipants: 20,
            battlegroundRewardPoints: 250,
            
            // Open world PvP
            openWorldPvPEnabled: true,
            pvpZones: [
                { name: 'Wilderness', x: 1000, y: 1000, radius: 200, levelReq: 15 },
                { name: 'Battlefield', x: 2000, y: 2000, radius: 300, levelReq: 25 },
                { name: 'Arena District', x: 3000, y: 3000, radius: 150, levelReq: 10 }
            ],
            
            // Rankings
            rankingUpdateInterval: 300000, // 5 minutes
            seasonDuration: 604800000, // 7 days
            maxRankingEntries: 100,
            
            // Penalties
            deathPenalty: {
                experienceLoss: 0.05, // 5%
                durabilityLoss: 0.1, // 10%
                honorLoss: 10
            }
        };
        
        // Active PvP sessions
        this.activeDuels = new Map();
        this.activeArenas = new Map();
        this.activeBattlegrounds = new Map();
        
        // PvP zones
        this.pvpZones = new Map();
        this.initializePvPZones();
        
        // Player PvP data
        this.playerPvPData = new Map();
        this.playerStats = new Map();
        
        // Rankings
        this.rankings = {
            duels: [],
            arenas: [],
            battlegrounds: [],
            overall: []
        };
        
        // Seasons
        this.currentSeason = {
            id: this.generateSeasonId(),
            startTime: Date.now(),
            endTime: Date.now() + this.config.seasonDuration,
            number: 1
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Load PvP data
        this.loadPvPData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start ranking updates
        this.startRankingUpdates();
        
        // Start season management
        this.startSeasonManagement();
        
        console.log('PvP System initialized');
    }
    
    async loadPvPData() {
        try {
            // Load player PvP data
            const pvpData = await this.server.db.all('SELECT * FROM player_pvp_stats');
            
            for (const data of pvpData) {
                this.playerStats.set(data.player_id, {
                    playerId: data.player_id,
                    duels: {
                        wins: data.duel_wins || 0,
                        losses: data.duel_losses || 0,
                        draws: data.duel_draws || 0,
                        rating: data.duel_rating || 1000
                    },
                    arenas: {
                        wins: data.arena_wins || 0,
                        losses: data.arena_losses || 0,
                        kills: data.arena_kills || 0,
                        deaths: data.arena_deaths || 0,
                        rating: data.arena_rating || 1000,
                        points: data.arena_points || 0
                    },
                    battlegrounds: {
                        wins: data.bg_wins || 0,
                        losses: data.bg_losses || 0,
                        kills: data.bg_kills || 0,
                        deaths: data.bg_deaths || 0,
                        rating: data.bg_rating || 1000,
                        points: data.bg_points || 0
                    },
                    overall: {
                        honor: data.honor || 0,
                        totalKills: data.total_kills || 0,
                        totalDeaths: data.total_deaths || 0,
                        streak: data.streak || 0,
                        highestStreak: data.highest_streak || 0
                    },
                    season: data.season || this.currentSeason.id
                });
            }
            
            console.log(`Loaded PvP data for ${pvpData.length} players`);
            
        } catch (error) {
            console.error('Error loading PvP data:', error);
        }
    }
    
    setupEventHandlers() {
        // Player events
        this.server.on('playerDeath', (playerId, killerId) => {
            this.handlePlayerDeath(playerId, killerId);
        });
        
        this.server.on('playerRespawn', (playerId) => {
            this.handlePlayerRespawn(playerId);
        });
        
        // PvP requests
        this.server.on('duelRequest', (requesterId, targetId) => {
            this.handleDuelRequest(requesterId, targetId);
        });
        
        this.server.on('duelResponse', (response) => {
            this.handleDuelResponse(response);
        });
        
        this.server.on('arenaJoin', (playerId) => {
            this.handleArenaJoin(playerId);
        });
        
        this.server.on('battlegroundJoin', (playerId, bgType) => {
            this.handleBattlegroundJoin(playerId, bgType);
        });
        
        this.server.on('pvpZoneEnter', (playerId, zoneId) => {
            this.handlePvPZoneEnter(playerId, zoneId);
        });
        
        this.server.on('pvpZoneLeave', (playerId, zoneId) => {
            this.handlePvPZoneLeave(playerId, zoneId);
        });
        
        // Combat events
        this.server.on('playerDamage', (data) => {
            this.handlePlayerDamage(data);
        });
    }
    
    initializePvPZones() {
        for (const zoneConfig of this.config.pvpZones) {
            const zone = {
                id: this.generateZoneId(),
                name: zoneConfig.name,
                x: zoneConfig.x,
                y: zoneConfig.y,
                radius: zoneConfig.radius,
                levelRequirement: zoneConfig.levelReq,
                activePlayers: new Set(),
                type: 'open_world'
            };
            
            this.pvpZones.set(zone.id, zone);
        }
    }
    
    startRankingUpdates() {
        setInterval(() => {
            this.updateRankings();
        }, this.config.rankingUpdateInterval);
    }
    
    startSeasonManagement() {
        setInterval(() => {
            this.checkSeasonEnd();
        }, 60000); // Check every minute
    }
    
    // Duel system
    async requestDuel(requesterId, targetId) {
        const requester = await this.getPlayerData(requesterId);
        const target = await this.getPlayerData(targetId);
        
        if (!requester || !target) {
            return { success: false, message: 'Player not found' };
        }
        
        // Check level requirements
        if (requester.level < this.config.minLevel || target.level < this.config.minLevel) {
            return { success: false, message: 'Player level too low' };
        }
        
        // Check distance
        const distance = this.getPlayerDistance(requesterId, targetId);
        if (distance > this.config.duelDistance) {
            return { success: false, message: 'Target too far away' };
        }
        
        // Check if either player is already in a duel
        if (this.isPlayerInDuel(requesterId) || this.isPlayerInDuel(targetId)) {
            return { success: false, message: 'Player already in a duel' };
        }
        
        // Check if either player is in a PvP zone
        if (this.isPlayerInPvPZone(requesterId) || this.isPlayerInPvPZone(targetId)) {
            return { success: false, message: 'Cannot duel in PvP zone' };
        }
        
        // Send duel request
        const duelRequest = {
            id: this.generateDuelId(),
            requesterId: requesterId,
            requesterName: requester.name,
            targetId: targetId,
            targetName: target.name,
            timestamp: Date.now(),
            expiresAt: Date.now() + 30000 // 30 seconds
        };
        
        const targetSocket = this.server.getPlayerSocket(targetId);
        if (targetSocket) {
            targetSocket.emit('duelRequest', duelRequest);
        }
        
        // Notify requester
        const requesterSocket = this.server.getPlayerSocket(requesterId);
        if (requesterSocket) {
            requesterSocket.emit('duelRequestSent', {
                targetId: targetId,
                targetName: target.name
            });
        }
        
        console.log(`Duel request sent: ${requester.name} -> ${target.name}`);
        
        return { success: true, request: duelRequest };
    }
    
    async respondToDuel(response) {
        const { duelId, accept, targetId } = response;
        
        // Find the duel request (this would be stored temporarily)
        // For now, we'll create the duel directly
        
        if (!accept) {
            // Notify requester of decline
            const requesterSocket = this.server.getPlayerSocket(targetId);
            if (requesterSocket) {
                requesterSocket.emit('duelDeclined', {
                    playerId: response.playerId
                });
            }
            return { success: true, message: 'Duel declined' };
        }
        
        // Create duel
        const duel = await this.createDuel(targetId, response.playerId);
        if (!duel) {
            return { success: false, message: 'Failed to create duel' };
        }
        
        return { success: true, duel: duel };
    }
    
    async createDuel(player1Id, player2Id) {
        const player1 = await this.getPlayerData(player1Id);
        const player2 = await this.getPlayerData(player2Id);
        
        if (!player1 || !player2) {
            return null;
        }
        
        const duel = {
            id: this.generateDuelId(),
            type: 'duel',
            participants: [
                { playerId: player1Id, name: player1.name, health: player1.health, maxHealth: player1.maxHealth },
                { playerId: player2Id, name: player2.name, health: player2.health, maxHealth: player2.maxHealth }
            ],
            startTime: Date.now(),
            endTime: Date.now() + this.config.duelDuration,
            status: 'active',
            winner: null,
            loser: null,
            spectators: new Set()
        };
        
        this.activeDuels.set(duel.id, duel);
        
        // Set PvP flags
        this.setPlayerPvPFlag(player1Id, true, duel.id);
        this.setPlayerPvPFlag(player2Id, true, duel.id);
        
        // Notify participants
        this.notifyDuelParticipants(duel, 'duelStarted');
        
        console.log(`Duel created: ${player1.name} vs ${player2.name}`);
        
        return duel;
    }
    
    endDuel(duelId, winnerId, reason = 'victory') {
        const duel = this.activeDuels.get(duelId);
        if (!duel || duel.status !== 'active') {
            return;
        }
        
        duel.status = 'ended';
        duel.endTime = Date.now();
        duel.endReason = reason;
        
        if (winnerId) {
            duel.winner = winnerId;
            duel.loser = duel.participants.find(p => p.playerId !== winnerId)?.playerId;
            
            // Update stats
            this.updateDuelStats(winnerId, duel.loser, true);
            this.updateDuelStats(duel.loser, winnerId, false);
        }
        
        // Clear PvP flags
        for (const participant of duel.participants) {
            this.setPlayerPvPFlag(participant.playerId, false);
        }
        
        // Notify participants
        this.notifyDuelParticipants(duel, 'duelEnded');
        
        // Remove from active duels
        setTimeout(() => {
            this.activeDuels.delete(duelId);
        }, 5000);
        
        console.log(`Duel ended: ${duelId} - Winner: ${winnerId}`);
    }
    
    // Arena system
    async joinArena(playerId) {
        const player = await this.getPlayerData(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        
        // Check level requirement
        if (player.level < this.config.minLevel) {
            return { success: false, message: 'Level too low for arena' };
        }
        
        // Check if already in arena
        if (this.isPlayerInArena(playerId)) {
            return { success: false, message: 'Already in arena' };
        }
        
        // Find or create arena match
        let arena = this.findAvailableArena();
        if (!arena) {
            arena = this.createArenaMatch();
        }
        
        // Add player to arena
        arena.participants.push({
            playerId: playerId,
            name: player.name,
            level: player.level,
            health: player.health,
            maxHealth: player.maxHealth,
            kills: 0,
            deaths: 0,
            score: 0
        });
        
        // Set PvP flag
        this.setPlayerPvPFlag(playerId, true, arena.id);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('arenaJoined', {
                arenaId: arena.id,
                participants: arena.participants,
                startTime: arena.startTime,
                status: arena.status
            });
        }
        
        // Check if arena should start
        if (arena.participants.length >= 2) {
            this.startArenaMatch(arena.id);
        }
        
        console.log(`Player ${player.name} joined arena ${arena.id}`);
        
        return { success: true, arena: arena };
    }
    
    findAvailableArena() {
        for (const arena of this.activeArenas.values()) {
            if (arena.status === 'waiting' && arena.participants.length < this.config.maxArenaParticipants) {
                return arena;
            }
        }
        return null;
    }
    
    createArenaMatch() {
        const arena = {
            id: this.generateArenaId(),
            type: 'arena',
            participants: [],
            startTime: Date.now() + this.config.arenaPrepTime,
            endTime: 0,
            status: 'waiting',
            winner: null,
            scores: new Map(),
            leaderboard: []
        };
        
        this.activeArenas.set(arena.id, arena);
        
        console.log(`Arena match created: ${arena.id}`);
        
        return arena;
    }
    
    startArenaMatch(arenaId) {
        const arena = this.activeArenas.get(arenaId);
        if (!arena || arena.status !== 'waiting') {
            return;
        }
        
        arena.status = 'active';
        arena.startTime = Date.now();
        arena.endTime = Date.now() + this.config.arenaMatchDuration;
        
        // Notify all participants
        this.notifyArenaParticipants(arena, 'arenaStarted');
        
        // Set timeout for arena end
        setTimeout(() => {
            this.endArenaMatch(arenaId, 'time_limit');
        }, this.config.arenaMatchDuration);
        
        console.log(`Arena match started: ${arenaId}`);
    }
    
    endArenaMatch(arenaId, reason = 'time_limit') {
        const arena = this.activeArenas.get(arenaId);
        if (!arena || arena.status !== 'active') {
            return;
        }
        
        arena.status = 'ended';
        arena.endTime = Date.now();
        arena.endReason = reason;
        
        // Determine winner
        let topScorer = null;
        let highestScore = -1;
        
        for (const participant of arena.participants) {
            if (participant.score > highestScore) {
                highestScore = participant.score;
                topScorer = participant;
            }
        }
        
        if (topScorer) {
            arena.winner = topScorer.playerId;
        }
        
        // Update stats and award points
        for (const participant of arena.participants) {
            const isWinner = participant.playerId === arena.winner;
            this.updateArenaStats(participant.playerId, participant.kills, participant.deaths, isWinner);
            
            if (isWinner) {
                this.awardArenaPoints(participant.playerId, this.config.arenaRewardPoints);
            }
        }
        
        // Clear PvP flags
        for (const participant of arena.participants) {
            this.setPlayerPvPFlag(participant.playerId, false);
        }
        
        // Notify participants
        this.notifyArenaParticipants(arena, 'arenaEnded');
        
        // Remove from active arenas
        setTimeout(() => {
            this.activeArenas.delete(arenaId);
        }, 10000);
        
        console.log(`Arena match ended: ${arenaId} - Winner: ${arena.winner}`);
    }
    
    // Battleground system
    async joinBattleground(playerId, bgType = 'capture_flag') {
        const player = await this.getPlayerData(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        
        // Check level requirement
        if (player.level < this.config.minLevel) {
            return { success: false, message: 'Level too low for battleground' };
        }
        
        // Check if already in battleground
        if (this.isPlayerInBattleground(playerId)) {
            return { success: false, message: 'Already in battleground' };
        }
        
        // Find or create battleground match
        let battleground = this.findAvailableBattleground(bgType);
        if (!battleground) {
            battleground = this.createBattlegroundMatch(bgType);
        }
        
        // Add player to battleground
        battleground.participants.push({
            playerId: playerId,
            name: player.name,
            level: player.level,
            team: this.assignTeam(battleground),
            health: player.health,
            maxHealth: player.maxHealth,
            kills: 0,
            deaths: 0,
            score: 0,
            contributions: []
        });
        
        // Set PvP flag
        this.setPlayerPvPFlag(playerId, true, battleground.id);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('battlegroundJoined', {
                battlegroundId: battleground.id,
                type: battleground.type,
                team: battleground.participants[battleground.participants.length - 1].team,
                participants: battleground.participants,
                startTime: battleground.startTime,
                status: battleground.status
            });
        }
        
        // Check if battleground should start
        if (battleground.participants.length >= 4) { // Minimum 2v2
            this.startBattlegroundMatch(battleground.id);
        }
        
        console.log(`Player ${player.name} joined battleground ${battleground.id}`);
        
        return { success: true, battleground: battleground };
    }
    
    findAvailableBattleground(type) {
        for (const bg of this.activeBattlegrounds.values()) {
            if (bg.type === type && bg.status === 'waiting' && 
                bg.participants.length < this.config.maxBattlegroundParticipants) {
                return bg;
            }
        }
        return null;
    }
    
    createBattlegroundMatch(type) {
        const battleground = {
            id: this.generateBattlegroundId(),
            type: type,
            participants: [],
            teams: { red: [], blue: [] },
            startTime: Date.now() + this.config.battlegroundPrepTime,
            endTime: 0,
            status: 'waiting',
            winner: null,
            objectives: this.initializeBattlegroundObjectives(type),
            scores: { red: 0, blue: 0 }
        };
        
        this.activeBattlegrounds.set(battleground.id, battleground);
        
        console.log(`Battleground match created: ${battleground.id} (${type})`);
        
        return battleground;
    }
    
    initializeBattlegroundObjectives(type) {
        switch (type) {
            case 'capture_flag':
                return {
                    flags: {
                        red: { captured: false, holder: null },
                        blue: { captured: false, holder: null }
                    },
                    scoreToWin: 3
                };
            case 'control_points':
                return {
                    points: [
                        { id: 'center', controlledBy: null, captureProgress: 0 },
                        { id: 'north', controlledBy: null, captureProgress: 0 },
                        { id: 'south', controlledBy: null, captureProgress: 0 }
                    ],
                    scoreToWin: 500
                };
            default:
                return {};
        }
    }
    
    assignTeam(battleground) {
        const redCount = battleground.participants.filter(p => p.team === 'red').length;
        const blueCount = battleground.participants.filter(p => p.team === 'blue').length;
        
        return redCount <= blueCount ? 'red' : 'blue';
    }
    
    startBattlegroundMatch(bgId) {
        const battleground = this.activeBattlegrounds.get(bgId);
        if (!battleground || battleground.status !== 'waiting') {
            return;
        }
        
        battleground.status = 'active';
        battleground.startTime = Date.now();
        battleground.endTime = Date.now() + this.config.battlegroundMatchDuration;
        
        // Update teams
        battleground.teams.red = battleground.participants.filter(p => p.team === 'red');
        battleground.teams.blue = battleground.participants.filter(p => p.team === 'blue');
        
        // Notify all participants
        this.notifyBattlegroundParticipants(battleground, 'battlegroundStarted');
        
        // Set timeout for battleground end
        setTimeout(() => {
            this.endBattlegroundMatch(bgId, 'time_limit');
        }, this.config.battlegroundMatchDuration);
        
        console.log(`Battleground match started: ${bgId}`);
    }
    
    endBattlegroundMatch(bgId, reason = 'time_limit') {
        const battleground = this.activeBattlegrounds.get(bgId);
        if (!battleground || battleground.status !== 'active') {
            return;
        }
        
        battleground.status = 'ended';
        battleground.endTime = Date.now();
        battleground.endReason = reason;
        
        // Determine winner
        if (battleground.scores.red > battleground.scores.blue) {
            battleground.winner = 'red';
        } else if (battleground.scores.blue > battleground.scores.red) {
            battleground.winner = 'blue';
        }
        
        // Update stats and award points
        for (const participant of battleground.participants) {
            const isWinner = participant.team === battleground.winner;
            this.updateBattlegroundStats(
                participant.playerId, 
                participant.kills, 
                participant.deaths, 
                isWinner
            );
            
            if (isWinner) {
                this.awardBattlegroundPoints(participant.playerId, this.config.battlegroundRewardPoints);
            }
        }
        
        // Clear PvP flags
        for (const participant of battleground.participants) {
            this.setPlayerPvPFlag(participant.playerId, false);
        }
        
        // Notify participants
        this.notifyBattlegroundParticipants(battleground, 'battlegroundEnded');
        
        // Remove from active battlegrounds
        setTimeout(() => {
            this.activeBattlegrounds.delete(bgId);
        }, 15000);
        
        console.log(`Battleground match ended: ${bgId} - Winner: ${battleground.winner}`);
    }
    
    // Open world PvP
    handlePvPZoneEnter(playerId, zoneId) {
        const zone = this.pvpZones.get(zoneId);
        if (!zone) return;
        
        const player = this.playerPvPData.get(playerId);
        if (!player) {
            this.playerPvPData.set(playerId, {
                currentZone: zoneId,
                pvpFlag: false,
                combatTimer: null
            });
        } else {
            player.currentZone = zoneId;
        }
        
        zone.activePlayers.add(playerId);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('pvpZoneEntered', {
                zone: {
                    id: zone.id,
                    name: zone.name,
                    type: zone.type
                }
            });
        }
        
        console.log(`Player ${playerId} entered PvP zone: ${zone.name}`);
    }
    
    handlePvPZoneLeave(playerId, zoneId) {
        const zone = this.pvpZones.get(zoneId);
        if (!zone) return;
        
        zone.activePlayers.delete(playerId);
        
        const player = this.playerPvPData.get(playerId);
        if (player) {
            player.currentZone = null;
        }
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('pvpZoneLeft', {
                zoneId: zoneId
            });
        }
        
        console.log(`Player ${playerId} left PvP zone: ${zone.name}`);
    }
    
    // Combat handling
    handlePlayerDeath(playerId, killerId) {
        // Check if this is a PvP death
        const playerData = this.playerPvPData.get(playerId);
        if (!playerData || !playerData.pvpFlag) {
            return;
        }
        
        // Update PvP stats
        this.updatePvPStats(killerId, playerId);
        
        // Apply death penalties
        this.applyDeathPenalties(playerId);
        
        // Check for duel end
        if (playerData.pvpSessionType === 'duel') {
            this.endDuel(playerData.pvpSessionId, killerId);
        }
        
        // Handle arena/battleground deaths
        if (playerData.pvpSessionType === 'arena') {
            this.handleArenaDeath(playerData.pvpSessionId, playerId, killerId);
        } else if (playerData.pvpSessionType === 'battleground') {
            this.handleBattlegroundDeath(playerData.pvpSessionId, playerId, killerId);
        }
    }
    
    handlePlayerRespawn(playerId) {
        // Respawn player in appropriate location
        const playerData = this.playerPvPData.get(playerId);
        if (!playerData) return;
        
        let respawnLocation = null;
        
        if (playerData.pvpSessionType === 'duel') {
            // Respawn at duel location
            respawnLocation = this.getDuelRespawnLocation(playerData.pvpSessionId);
        } else if (playerData.pvpSessionType === 'arena') {
            // Respawn in arena
            respawnLocation = this.getArenaRespawnLocation(playerData.pvpSessionId);
        } else if (playerData.pvpSessionType === 'battleground') {
            // Respawn in battleground
            respawnLocation = this.getBattlegroundRespawnLocation(playerData.pvpSessionId);
        } else if (playerData.currentZone) {
            // Respawn in PvP zone
            respawnLocation = this.getPvPZoneRespawnLocation(playerData.currentZone);
        }
        
        if (respawnLocation) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('respawn', {
                    location: respawnLocation,
                    timer: this.config.respawnTime
                });
            }
        }
    }
    
    // Stats management
    updatePvPStats(killerId, victimId) {
        const killerStats = this.getOrCreatePlayerStats(killerId);
        const victimStats = this.getOrCreatePlayerStats(victimId);
        
        // Update overall stats
        killerStats.overall.totalKills++;
        killerStats.overall.streak++;
        if (killerStats.overall.streak > killerStats.overall.highestStreak) {
            killerStats.overall.highestStreak = killerStats.overall.streak;
        }
        
        victimStats.overall.totalDeaths++;
        victimStats.overall.streak = 0;
        
        // Award honor
        const honorGain = this.calculateHonorGain(killerId, victimId);
        killerStats.overall.honor += honorGain;
        victimStats.overall.honor = Math.max(0, victimStats.overall.honor - this.config.deathPenalty.honorLoss);
        
        // Save to database
        this.savePlayerStats(killerId);
        this.savePlayerStats(victimId);
    }
    
    updateDuelStats(winnerId, loserId, isWinner) {
        const winnerStats = this.getOrCreatePlayerStats(winnerId);
        const loserStats = this.getOrCreatePlayerStats(loserId);
        
        if (isWinner) {
            winnerStats.duels.wins++;
            winnerStats.duels.rating += 25;
            loserStats.duels.losses++;
            loserStats.duels.rating = Math.max(0, loserStats.duels.rating - 25);
        }
        
        this.savePlayerStats(winnerId);
        this.savePlayerStats(loserId);
    }
    
    updateArenaStats(playerId, kills, deaths, isWinner) {
        const stats = this.getOrCreatePlayerStats(playerId);
        
        stats.arenas.kills += kills;
        stats.arenas.deaths += deaths;
        
        if (isWinner) {
            stats.arenas.wins++;
            stats.arenas.rating += 15;
        } else {
            stats.arenas.losses++;
            stats.arenas.rating = Math.max(0, stats.arenas.rating - 10);
        }
        
        this.savePlayerStats(playerId);
    }
    
    updateBattlegroundStats(playerId, kills, deaths, isWinner) {
        const stats = this.getOrCreatePlayerStats(playerId);
        
        stats.battlegrounds.kills += kills;
        stats.battlegrounds.deaths += deaths;
        
        if (isWinner) {
            stats.battlegrounds.wins++;
            stats.battlegrounds.rating += 20;
        } else {
            stats.battlegrounds.losses++;
            stats.battlegrounds.rating = Math.max(0, stats.battlegrounds.rating - 15);
        }
        
        this.savePlayerStats(playerId);
    }
    
    calculateHonorGain(killerId, victimId) {
        const killerStats = this.getOrCreatePlayerStats(killerId);
        const victimStats = this.getOrCreatePlayerStats(victimId);
        
        // Base honor
        let honor = 10;
        
        // Rating difference bonus
        const ratingDiff = victimStats.duels.rating - killerStats.duels.rating;
        if (ratingDiff > 0) {
            honor += Math.min(ratingDiff / 50, 20); // Max 20 bonus honor
        }
        
        // Streak bonus
        if (killerStats.overall.streak > 5) {
            honor += Math.min(killerStats.overall.streak, 15); // Max 15 bonus honor
        }
        
        return Math.floor(honor);
    }
    
    // Rankings
    updateRankings() {
        // Update all ranking categories
        this.updateDuelRankings();
        this.updateArenaRankings();
        this.updateBattlegroundRankings();
        this.updateOverallRankings();
        
        // Broadcast rankings
        this.broadcastRankings();
    }
    
    updateDuelRankings() {
        const rankings = [];
        
        for (const [playerId, stats] of this.playerStats) {
            rankings.push({
                playerId: playerId,
                rating: stats.duels.rating,
                wins: stats.duels.wins,
                losses: stats.duels.losses,
                winRate: stats.duels.wins / Math.max(1, stats.duels.wins + stats.duels.losses)
            });
        }
        
        rankings.sort((a, b) => b.rating - a.rating);
        this.rankings.duels = rankings.slice(0, this.config.maxRankingEntries);
    }
    
    updateArenaRankings() {
        const rankings = [];
        
        for (const [playerId, stats] of this.playerStats) {
            rankings.push({
                playerId: playerId,
                rating: stats.arenas.rating,
                kills: stats.arenas.kills,
                deaths: stats.arenas.deaths,
                points: stats.arenas.points
            });
        }
        
        rankings.sort((a, b) => b.rating - a.rating);
        this.rankings.arenas = rankings.slice(0, this.config.maxRankingEntries);
    }
    
    updateBattlegroundRankings() {
        const rankings = [];
        
        for (const [playerId, stats] of this.playerStats) {
            rankings.push({
                playerId: playerId,
                rating: stats.battlegrounds.rating,
                kills: stats.battlegrounds.kills,
                deaths: stats.battlegrounds.deaths,
                points: stats.battlegrounds.points
            });
        }
        
        rankings.sort((a, b) => b.rating - a.rating);
        this.rankings.battlegrounds = rankings.slice(0, this.config.maxRankingEntries);
    }
    
    updateOverallRankings() {
        const rankings = [];
        
        for (const [playerId, stats] of this.playerStats) {
            rankings.push({
                playerId: playerId,
                honor: stats.overall.honor,
                totalKills: stats.overall.totalKills,
                totalDeaths: stats.overall.totalDeaths,
                highestStreak: stats.overall.highestStreak
            });
        }
        
        rankings.sort((a, b) => b.honor - a.honor);
        this.rankings.overall = rankings.slice(0, this.config.maxRankingEntries);
    }
    
    broadcastRankings() {
        this.server.io.emit('pvpRankingsUpdate', {
            duel: this.rankings.duels.slice(0, 10),
            arena: this.rankings.arenas.slice(0, 10),
            battleground: this.rankings.battlegrounds.slice(0, 10),
            overall: this.rankings.overall.slice(0, 10)
        });
    }
    
    // Season management
    checkSeasonEnd() {
        if (Date.now() >= this.currentSeason.endTime) {
            this.endSeason();
        }
    }
    
    async endSeason() {
        console.log(`Ending season ${this.currentSeason.number}`);
        
        // Award season rewards
        await this.awardSeasonRewards();
        
        // Reset ratings
        for (const stats of this.playerStats.values()) {
            stats.duels.rating = 1000;
            stats.arenas.rating = 1000;
            stats.battlegrounds.rating = 1000;
            stats.season = this.currentSeason.id + 1;
        }
        
        // Start new season
        this.currentSeason = {
            id: this.generateSeasonId(),
            startTime: Date.now(),
            endTime: Date.now() + this.config.seasonDuration,
            number: this.currentSeason.number + 1
        };
        
        // Notify players
        this.server.io.emit('seasonEnd', {
            oldSeason: this.currentSeason.number - 1,
            newSeason: this.currentSeason.number,
            rewards: this.getSeasonRewards()
        });
        
        console.log(`Started new season ${this.currentSeason.number}`);
    }
    
    async awardSeasonRewards() {
        // Award rewards to top players in each category
        const topPlayers = {
            duel: this.rankings.duels.slice(0, 10),
            arena: this.rankings.arenas.slice(0, 10),
            battleground: this.rankings.battlegrounds.slice(0, 10),
            overall: this.rankings.overall.slice(0, 10)
        };
        
        for (const [category, players] of Object.entries(topPlayers)) {
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                const reward = this.calculateSeasonReward(category, i + 1);
                
                await this.awardSeasonReward(player.playerId, reward);
            }
        }
    }
    
    calculateSeasonReward(category, rank) {
        const rewards = {
            1: { title: 'Gladiator', gold: 5000, items: ['epic_weapon'] },
            2: { title: 'Champion', gold: 3000, items: ['rare_armor'] },
            3: { title: 'Hero', gold: 2000, items: ['rare_weapon'] },
            4: { title: 'Veteran', gold: 1000, items: ['uncommon_armor'] },
            5: { title: 'Warrior', gold: 500, items: ['uncommon_weapon'] }
        };
        
        return rewards[rank] || { title: 'Combatant', gold: 200, items: [] };
    }
    
    async awardSeasonReward(playerId, reward) {
        try {
            // Award gold
            await this.server.db.run(`
                UPDATE characters SET gold = gold + ? WHERE player_id = ?
            `, [reward.gold, playerId]);
            
            // Award title
            if (reward.title) {
                await this.server.db.run(`
                    INSERT OR REPLACE INTO player_titles (player_id, title) VALUES (?, ?)
                `, [playerId, reward.title]);
            }
            
            // Award items (would integrate with inventory system)
            console.log(`Awarded season reward to player ${playerId}:`, reward);
            
        } catch (error) {
            console.error('Error awarding season reward:', error);
        }
    }
    
    // Utility methods
    getOrCreatePlayerStats(playerId) {
        if (!this.playerStats.has(playerId)) {
            this.playerStats.set(playerId, {
                playerId: playerId,
                duels: { wins: 0, losses: 0, draws: 0, rating: 1000 },
                arenas: { wins: 0, losses: 0, kills: 0, deaths: 0, rating: 1000, points: 0 },
                battlegrounds: { wins: 0, losses: 0, kills: 0, deaths: 0, rating: 1000, points: 0 },
                overall: { honor: 0, totalKills: 0, totalDeaths: 0, streak: 0, highestStreak: 0 },
                season: this.currentSeason.id
            });
        }
        
        return this.playerStats.get(playerId);
    }
    
    setPlayerPvPFlag(playerId, enabled, sessionId = null) {
        let playerData = this.playerPvPData.get(playerId);
        if (!playerData) {
            playerData = {
                currentZone: null,
                pvpFlag: false,
                combatTimer: null
            };
            this.playerPvPData.set(playerId, playerData);
        }
        
        playerData.pvpFlag = enabled;
        playerData.pvpSessionId = sessionId;
        
        // Determine session type
        if (sessionId) {
            if (this.activeDuels.has(sessionId)) {
                playerData.pvpSessionType = 'duel';
            } else if (this.activeArenas.has(sessionId)) {
                playerData.pvpSessionType = 'arena';
            } else if (this.activeBattlegrounds.has(sessionId)) {
                playerData.pvpSessionType = 'battleground';
            }
        }
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('pvpFlagUpdate', {
                enabled: enabled,
                sessionId: sessionId
            });
        }
    }
    
    isPlayerInDuel(playerId) {
        const playerData = this.playerPvPData.get(playerId);
        return playerData && playerData.pvpSessionType === 'duel';
    }
    
    isPlayerInArena(playerId) {
        const playerData = this.playerPvPData.get(playerId);
        return playerData && playerData.pvpSessionType === 'arena';
    }
    
    isPlayerInBattleground(playerId) {
        const playerData = this.playerPvPData.get(playerId);
        return playerData && playerData.pvpSessionType === 'battleground';
    }
    
    isPlayerInPvPZone(playerId) {
        const playerData = this.playerPvPData.get(playerId);
        return playerData && playerData.currentZone !== null;
    }
    
    async getPlayerData(playerId) {
        try {
            const player = await this.server.db.get(
                'SELECT * FROM characters WHERE player_id = ?',
                [playerId]
            );
            return player;
        } catch (error) {
            console.error('Error getting player data:', error);
            return null;
        }
    }
    
    async getPlayerName(playerId) {
        const player = await this.getPlayerData(playerId);
        return player ? player.name : 'Unknown';
    }
    
    getPlayerDistance(playerId1, playerId2) {
        const player1 = this.server.worldManager.players.get(playerId1);
        const player2 = this.server.worldManager.players.get(playerId2);
        
        if (!player1 || !player2) return Infinity;
        
        return Math.sqrt(
            Math.pow(player1.x - player2.x, 2) + 
            Math.pow(player1.y - player2.y, 2)
        );
    }
    
    applyDeathPenalties(playerId) {
        // Apply experience loss
        // Apply durability loss
        // Apply honor loss
        console.log(`Applied PvP death penalties to player ${playerId}`);
    }
    
    awardArenaPoints(playerId, points) {
        const stats = this.getOrCreatePlayerStats(playerId);
        stats.arenas.points += points;
        this.savePlayerStats(playerId);
    }
    
    awardBattlegroundPoints(playerId, points) {
        const stats = this.getOrCreatePlayerStats(playerId);
        stats.battlegrounds.points += points;
        this.savePlayerStats(playerId);
    }
    
    // Notification methods
    notifyDuelParticipants(duel, eventType) {
        for (const participant of duel.participants) {
            const socket = this.server.getPlayerSocket(participant.playerId);
            if (socket) {
                socket.emit('duelUpdate', {
                    type: eventType,
                    duel: duel
                });
            }
        }
    }
    
    notifyArenaParticipants(arena, eventType) {
        for (const participant of arena.participants) {
            const socket = this.server.getPlayerSocket(participant.playerId);
            if (socket) {
                socket.emit('arenaUpdate', {
                    type: eventType,
                    arena: arena
                });
            }
        }
    }
    
    notifyBattlegroundParticipants(battleground, eventType) {
        for (const participant of battleground.participants) {
            const socket = this.server.getPlayerSocket(participant.playerId);
            if (socket) {
                socket.emit('battlegroundUpdate', {
                    type: eventType,
                    battleground: battleground
                });
            }
        }
    }
    
    // Database operations
    async savePlayerStats(playerId) {
        const stats = this.playerStats.get(playerId);
        if (!stats) return;
        
        try {
            await this.server.db.run(`
                INSERT OR REPLACE INTO player_pvp_stats 
                (player_id, duel_wins, duel_losses, duel_draws, duel_rating, 
                 arena_wins, arena_losses, arena_kills, arena_deaths, arena_rating, arena_points,
                 bg_wins, bg_losses, bg_kills, bg_deaths, bg_rating, bg_points,
                 honor, total_kills, total_deaths, streak, highest_streak, season)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                playerId,
                stats.duels.wins, stats.duels.losses, stats.duels.draws, stats.duels.rating,
                stats.arenas.wins, stats.arenas.losses, stats.arenas.kills, stats.arenas.deaths, 
                stats.arenas.rating, stats.arenas.points,
                stats.battlegrounds.wins, stats.battlegrounds.losses, stats.battlegrounds.kills, 
                stats.battlegrounds.deaths, stats.battlegrounds.rating, stats.battlegrounds.points,
                stats.overall.honor, stats.overall.totalKills, stats.overall.totalDeaths,
                stats.overall.streak, stats.overall.highestStreak, stats.season
            ]);
        } catch (error) {
            console.error('Error saving player stats:', error);
        }
    }
    
    // ID generators
    generateDuelId() {
        return 'duel_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateArenaId() {
        return 'arena_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateBattlegroundId() {
        return 'bg_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateZoneId() {
        return 'zone_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateSeasonId() {
        return 'season_' + Date.now().toString(36);
    }
    
    // Public API
    getDuel(duelId) {
        return this.activeDuels.get(duelId);
    }
    
    getArena(arenaId) {
        return this.activeArenas.get(arenaId);
    }
    
    getBattleground(bgId) {
        return this.activeBattlegrounds.get(bgId);
    }
    
    getPlayerStats(playerId) {
        return this.playerStats.get(playerId);
    }
    
    getRankings(type = 'overall', limit = 10) {
        const rankings = this.rankings[type] || [];
        return rankings.slice(0, limit);
    }
    
    getCurrentSeason() {
        return this.currentSeason;
    }
    
    getActivePvPSessions(playerId) {
        const sessions = [];
        
        for (const duel of this.activeDuels.values()) {
            if (duel.participants.some(p => p.playerId === playerId)) {
                sessions.push({ type: 'duel', id: duel.id, name: 'Duel' });
            }
        }
        
        for (const arena of this.activeArenas.values()) {
            if (arena.participants.some(p => p.playerId === playerId)) {
                sessions.push({ type: 'arena', id: arena.id, name: 'Arena Match' });
            }
        }
        
        for (const bg of this.activeBattlegrounds.values()) {
            if (bg.participants.some(p => p.playerId === playerId)) {
                sessions.push({ type: 'battleground', id: bg.id, name: 'Battleground' });
            }
        }
        
        return sessions;
    }
    
    // Cleanup
    async cleanup() {
        // Save all player stats
        for (const [playerId, stats] of this.playerStats) {
            await this.savePlayerStats(playerId);
        }
        
        // Clear active sessions
        this.activeDuels.clear();
        this.activeArenas.clear();
        this.activeBattlegrounds.clear();
        
        console.log('PvP System cleanup complete');
    }
}

module.exports = PvPSystem;
