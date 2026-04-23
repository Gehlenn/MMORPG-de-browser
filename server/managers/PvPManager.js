/**
 * PvPManager - Sistema de Duelos e Arenas PvP
 * 
 * Features:
 * - Duelos 1v1 entre jogadores
 * - Arenas classificatórias
 * - Modos: Deathmatch, Capture the Flag, Domination
 * - Sistema de rating ELO
 * - Recompensas sazonais
 * - Espectadores
 */

class PvPManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Active matches
        this.activeDuels = new Map();
        this.activeArenas = new Map();
        this.queue = new Map(); // playerId -> queue data
        
        // Player stats
        this.playerStats = new Map();
        
        // Config
        this.config = {
            duelTimeout: 300000, // 5 minutes
            arenaTimeout: 600000, // 10 minutes
            respawnDelay: 5000, // 5 seconds
            maxSpectators: 20,
            ratingFloor: 0,
            ratingCeiling: 3000
        };
        
        // Arena modes
        this.arenaModes = {
            deathmatch: { name: 'Deathmatch', teamSize: 3, scoreLimit: 20 },
            ctf: { name: 'Capture the Flag', teamSize: 5, scoreLimit: 3 },
            domination: { name: 'Domination', teamSize: 5, scoreLimit: 500 }
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startCleanupLoop();
        console.log('[PvPManager] Sistema PvP inicializado');
    }
    
    setupEventHandlers() {
        // Duel system
        this.server.on('pvp:duel_request', (socket, data) => {
            this.handleDuelRequest(socket, data);
        });
        
        this.server.on('pvp:duel_accept', (socket, data) => {
            this.handleDuelAccept(socket, data);
        });
        
        this.server.on('pvp:duel_decline', (socket, data) => {
            this.handleDuelDecline(socket, data);
        });
        
        this.server.on('pvp:duel_forfeit', (socket) => {
            this.handleDuelForfeit(socket);
        });
        
        // Arena system
        this.server.on('pvp:arena_queue', (socket, data) => {
            this.handleArenaQueue(socket, data);
        });
        
        this.server.on('pvp:arena_leave_queue', (socket) => {
            this.handleLeaveQueue(socket);
        });
        
        this.server.on('pvp:arena_match_result', (socket, data) => {
            this.handleMatchResult(socket, data);
        });
        
        // Spectator system
        this.server.on('pvp:spectate', (socket, data) => {
            this.handleSpectate(socket, data);
        });
        
        this.server.on('pvp:stop_spectating', (socket) => {
            this.handleStopSpectating(socket);
        });
        
        // Stats
        this.server.on('pvp:get_stats', (socket) => {
            this.handleGetStats(socket);
        });
        
        this.server.on('pvp:get_leaderboard', (socket, data) => {
            this.handleGetLeaderboard(socket, data);
        });
    }
    
    // ===== DUEL SYSTEM =====
    
    handleDuelRequest(socket, data) {
        const { targetPlayerId } = data;
        const player = this.server.players.get(socket.playerId);
        const target = this.server.players.get(targetPlayerId);
        
        if (!player || !target) {
            socket.emit('pvp:error', { message: 'Jogador não encontrado!' });
            return;
        }
        
        // Check distance
        const distance = this.calculateDistance(player, target);
        if (distance > 100) {
            socket.emit('pvp:error', { message: 'Jogador muito longe!' });
            return;
        }
        
        // Check if either is in a match
        if (this.isPlayerInMatch(socket.playerId)) {
            socket.emit('pvp:error', { message: 'Você já está em um combate!' });
            return;
        }
        
        if (this.isPlayerInMatch(targetPlayerId)) {
            socket.emit('pvp:error', { message: 'Jogador já está em um combate!' });
            return;
        }
        
        // Send request
        const targetSocket = target.socket;
        if (targetSocket) {
            targetSocket.emit('pvp:duel_request_received', {
                fromPlayerId: socket.playerId,
                fromPlayerName: player.name,
                timeout: 30000
            });
        }
        
        socket.emit('pvp:duel_request_sent', {
            toPlayerId: targetPlayerId,
            toPlayerName: target.name
        });
    }
    
    handleDuelAccept(socket, data) {
        const { fromPlayerId } = data;
        const player = this.server.players.get(socket.playerId);
        const initiator = this.server.players.get(fromPlayerId);
        
        if (!player || !initiator) return;
        
        if (this.isPlayerInMatch(socket.playerId) || this.isPlayerInMatch(fromPlayerId)) {
            socket.emit('pvp:error', { message: 'Um dos jogadores já está em combate!' });
            return;
        }
        
        // Create duel
        const duelId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const duel = {
            id: duelId,
            type: 'duel',
            player1: {
                playerId: fromPlayerId,
                playerName: initiator.name,
                playerClass: initiator.class,
                hp: 100,
                maxHp: 100,
                kills: 0
            },
            player2: {
                playerId: socket.playerId,
                playerName: player.name,
                playerClass: player.class,
                hp: 100,
                maxHp: 100,
                kills: 0
            },
            status: 'starting',
            startedAt: null,
            endedAt: null,
            winner: null,
            spectators: [],
            logs: []
        };
        
        this.activeDuels.set(duelId, duel);
        
        // Countdown
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            if (countdown > 0) {
                this.io.to(duelId).emit('pvp:countdown', { seconds: countdown });
                countdown--;
            } else {
                clearInterval(countdownInterval);
                duel.status = 'active';
                duel.startedAt = Date.now();
                
                // Join room
                const p1Socket = initiator.socket;
                const p2Socket = player.socket;
                
                if (p1Socket) p1Socket.join(duelId);
                if (p2Socket) p2Socket.join(duelId);
                
                this.io.to(duelId).emit('pvp:duel_started', {
                    duelId,
                    duel: this.sanitizeDuelData(duel)
                });
            }
        }, 1000);
        
        // Notify both
        const initiatorSocket = initiator.socket;
        if (initiatorSocket) {
            initiatorSocket.emit('pvp:duel_accepted', {
                duelId,
                opponentId: socket.playerId,
                opponentName: player.name
            });
            initiatorSocket.join(duelId);
        }
        
        socket.emit('pvp:duel_accepted', {
            duelId,
            opponentId: fromPlayerId,
            opponentName: initiator.name
        });
        socket.join(duelId);
    }
    
    handleDuelDecline(socket, data) {
        const { fromPlayerId } = data;
        const initiator = this.server.players.get(fromPlayerId);
        
        if (initiator?.socket) {
            initiator.socket.emit('pvp:duel_declined', {
                byPlayerId: socket.playerId,
                byPlayerName: this.server.players.get(socket.playerId)?.name
            });
        }
    }
    
    handleDuelForfeit(socket) {
        const duel = this.findPlayerDuel(socket.playerId);
        if (!duel || duel.status !== 'active') return;
        
        const winner = duel.player1.playerId === socket.playerId ? duel.player2 : duel.player1;
        this.endDuel(duel, winner.playerId, 'forfeit');
    }
    
    endDuel(duel, winnerId, reason = 'normal') {
        duel.status = 'ended';
        duel.endedAt = Date.now();
        duel.winner = winnerId;
        
        const winner = duel.player1.playerId === winnerId ? duel.player1 : duel.player2;
        const loser = duel.player1.playerId === winnerId ? duel.player2 : duel.player1;
        
        // Update stats
        this.updatePlayerStats(winner.playerId, { duelsWon: 1, rating: 15 });
        this.updatePlayerStats(loser.playerId, { duelsLost: 1, rating: -10 });
        
        // Notify
        this.io.to(duel.id).emit('pvp:duel_ended', {
            duelId: duel.id,
            winner: winner.playerName,
            winnerId: winner.playerId,
            reason,
            duration: duel.endedAt - duel.startedAt
        });
        
        // Clean up
        setTimeout(() => {
            this.activeDuels.delete(duel.id);
        }, 30000);
    }
    
    // ===== ARENA SYSTEM =====
    
    handleArenaQueue(socket, data) {
        const { mode = 'deathmatch' } = data;
        const player = this.server.players.get(socket.playerId);
        
        if (!player) return;
        
        if (this.isPlayerInMatch(socket.playerId)) {
            socket.emit('pvp:error', { message: 'Você já está em um combate!' });
            return;
        }
        
        if (this.queue.has(socket.playerId)) {
            socket.emit('pvp:error', { message: 'Você já está na fila!' });
            return;
        }
        
        // Add to queue
        this.queue.set(socket.playerId, {
            playerId: socket.playerId,
            playerName: player.name,
            playerClass: player.class,
            rating: this.getPlayerRating(socket.playerId),
            mode,
            queuedAt: Date.now()
        });
        
        socket.emit('pvp:queued', { mode, position: this.queue.size });
        
        // Try to match
        this.tryMatchPlayers(mode);
    }
    
    handleLeaveQueue(socket) {
        if (this.queue.has(socket.playerId)) {
            this.queue.delete(socket.playerId);
            socket.emit('pvp:queue_left');
        }
    }
    
    tryMatchPlayers(mode) {
        const modeConfig = this.arenaModes[mode];
        if (!modeConfig) return;
        
        const playersNeeded = modeConfig.teamSize * 2; // Two teams
        
        const queuePlayers = Array.from(this.queue.values())
            .filter(q => q.mode === mode)
            .sort((a, b) => a.queuedAt - b.queuedAt);
        
        if (queuePlayers.length >= playersNeeded) {
            // Match found
            const matched = queuePlayers.slice(0, playersNeeded);
            
            // Remove from queue
            matched.forEach(p => this.queue.delete(p.playerId));
            
            // Create arena match
            this.createArenaMatch(matched, mode);
        }
    }
    
    createArenaMatch(players, mode) {
        const matchId = `arena_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const modeConfig = this.arenaModes[mode];
        
        // Split into teams
        const teamA = players.slice(0, modeConfig.teamSize);
        const teamB = players.slice(modeConfig.teamSize, modeConfig.teamSize * 2);
        
        const match = {
            id: matchId,
            type: 'arena',
            mode,
            teamA: {
                players: teamA.map(p => ({
                    playerId: p.playerId,
                    playerName: p.playerName,
                    playerClass: p.playerClass,
                    kills: 0,
                    deaths: 0,
                    score: 0
                })),
                score: 0
            },
            teamB: {
                players: teamB.map(p => ({
                    playerId: p.playerId,
                    playerName: p.playerName,
                    playerClass: p.playerClass,
                    kills: 0,
                    deaths: 0,
                    score: 0
                })),
                score: 0
            },
            status: 'starting',
            startedAt: null,
            endedAt: null,
            winner: null,
            spectators: [],
            scoreLimit: modeConfig.scoreLimit
        };
        
        this.activeArenas.set(matchId, match);
        
        // Notify players
        players.forEach(p => {
            const player = this.server.players.get(p.playerId);
            if (player?.socket) {
                player.socket.emit('pvp:arena_match_found', {
                    matchId,
                    mode,
                    team: teamA.find(t => t.playerId === p.playerId) ? 'A' : 'B',
                    teammates: (teamA.find(t => t.playerId === p.playerId) ? teamA : teamB)
                        .filter(t => t.playerId !== p.playerId)
                        .map(t => t.playerName)
                });
                player.socket.join(matchId);
            }
        });
        
        // Countdown
        let countdown = 10;
        const countdownInterval = setInterval(() => {
            if (countdown > 0) {
                this.io.to(matchId).emit('pvp:countdown', { seconds: countdown });
                countdown--;
            } else {
                clearInterval(countdownInterval);
                match.status = 'active';
                match.startedAt = Date.now();
                
                this.io.to(matchId).emit('pvp:arena_started', {
                    matchId,
                    match: this.sanitizeArenaData(match)
                });
            }
        }, 1000);
    }
    
    handleMatchResult(socket, data) {
        const { matchId, result } = data;
        const match = this.activeArenas.get(matchId);
        
        if (!match || match.status !== 'active') return;
        
        // Process result
        this.processArenaResult(match, result);
    }
    
    processArenaResult(match, result) {
        // Update scores based on result
        if (result.teamAScore >= match.scoreLimit || result.teamBScore >= match.scoreLimit) {
            match.endedAt = Date.now();
            match.winner = result.teamAScore > result.teamBScore ? 'A' : 'B';
            match.status = 'ended';
            
            // Update stats for all players
            const winningTeam = match.winner === 'A' ? match.teamA : match.teamB;
            const losingTeam = match.winner === 'A' ? match.teamB : match.teamA;
            
            winningTeam.players.forEach(p => {
                this.updatePlayerStats(p.playerId, { arenaWins: 1, rating: 25 });
            });
            
            losingTeam.players.forEach(p => {
                this.updatePlayerStats(p.playerId, { arenaLosses: 1, rating: -15 });
            });
            
            // Notify
            this.io.to(match.id).emit('pvp:arena_ended', {
                matchId: match.id,
                winner: match.winner,
                teamAScore: result.teamAScore,
                teamBScore: result.teamBScore,
                duration: match.endedAt - match.startedAt
            });
            
            // Clean up
            setTimeout(() => {
                this.activeArenas.delete(match.id);
            }, 60000);
        }
    }
    
    // ===== SPECTATOR SYSTEM =====
    
    handleSpectate(socket, data) {
        const { matchId } = data;
        const match = this.activeDuels.get(matchId) || this.activeArenas.get(matchId);
        
        if (!match) {
            socket.emit('pvp:error', { message: 'Partida não encontrada!' });
            return;
        }
        
        if (match.spectators.length >= this.config.maxSpectators) {
            socket.emit('pvp:error', { message: 'Limite de espectadores atingido!' });
            return;
        }
        
        if (this.isPlayerInMatch(socket.playerId)) {
            socket.emit('pvp:error', { message: 'Você não pode assistir enquanto está em combate!' });
            return;
        }
        
        match.spectators.push({
            playerId: socket.playerId,
            joinedAt: Date.now()
        });
        
        socket.join(matchId);
        socket.emit('pvp:spectating', {
            matchId,
            match: match.type === 'duel' ? this.sanitizeDuelData(match) : this.sanitizeArenaData(match)
        });
    }
    
    handleStopSpectating(socket) {
        // Find match being spectated
        for (const [matchId, match] of [...this.activeDuels, ...this.activeArenas]) {
            const specIndex = match.spectators.findIndex(s => s.playerId === socket.playerId);
            if (specIndex !== -1) {
                match.spectators.splice(specIndex, 1);
                socket.leave(matchId);
                socket.emit('pvp:stopped_spectating');
                break;
            }
        }
    }
    
    // ===== STATS SYSTEM =====
    
    getOrCreatePlayerStats(playerId) {
        if (!this.playerStats.has(playerId)) {
            this.playerStats.set(playerId, {
                playerId,
                rating: 1000,
                duelsWon: 0,
                duelsLost: 0,
                arenaWins: 0,
                arenaLosses: 0,
                kills: 0,
                deaths: 0,
                highestRating: 1000,
                titlesEarned: []
            });
        }
        return this.playerStats.get(playerId);
    }
    
    updatePlayerStats(playerId, updates) {
        const stats = this.getOrCreatePlayerStats(playerId);
        
        if (updates.duelsWon) stats.duelsWon += updates.duelsWon;
        if (updates.duelsLost) stats.duelsLost += updates.duelsLost;
        if (updates.arenaWins) stats.arenaWins += updates.arenaWins;
        if (updates.arenaLosses) stats.arenaLosses += updates.arenaLosses;
        if (updates.kills) stats.kills += updates.kills;
        if (updates.deaths) stats.deaths += updates.deaths;
        
        if (updates.rating) {
            stats.rating = Math.max(this.config.ratingFloor, 
                Math.min(this.config.ratingCeiling, stats.rating + updates.rating));
            stats.highestRating = Math.max(stats.highestRating, stats.rating);
        }
        
        // Check for title unlocks
        this.checkTitleUnlocks(playerId, stats);
    }
    
    checkTitleUnlocks(playerId, stats) {
        const titles = [];
        
        if (stats.rating >= 1500) titles.push('Gladiador');
        if (stats.rating >= 2000) titles.push('Duelista');
        if (stats.rating >= 2500) titles.push('Rival');
        if (stats.arenaWins >= 100) titles.push('Veterano de Arena');
        if (stats.duelsWon >= 50) titles.push('Mestre do Duelo');
        
        titles.forEach(title => {
            if (!stats.titlesEarned.includes(title)) {
                stats.titlesEarned.push(title);
                
                const player = this.server.players.get(playerId);
                if (player?.socket) {
                    player.socket.emit('pvp:title_unlocked', { title });
                }
            }
        });
    }
    
    getPlayerRating(playerId) {
        return this.getOrCreatePlayerStats(playerId).rating;
    }
    
    handleGetStats(socket) {
        const stats = this.getOrCreatePlayerStats(socket.playerId);
        
        // Calculate additional stats
        const duelWinRate = stats.duelsWon + stats.duelsLost > 0
            ? Math.round((stats.duelsWon / (stats.duelsWon + stats.duelsLost)) * 100)
            : 0;
        
        const arenaWinRate = stats.arenaWins + stats.arenaLosses > 0
            ? Math.round((stats.arenaWins / (stats.arenaWins + stats.arenaLosses)) * 100)
            : 0;
        
        const kdr = stats.deaths > 0
            ? (stats.kills / stats.deaths).toFixed(2)
            : stats.kills.toString();
        
        socket.emit('pvp:stats', {
            ...stats,
            duelWinRate,
            arenaWinRate,
            kdr
        });
    }
    
    handleGetLeaderboard(socket, data) {
        const { type = 'rating', limit = 100 } = data;
        
        let sorted = Array.from(this.playerStats.values());
        
        switch (type) {
            case 'rating':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case 'kills':
                sorted.sort((a, b) => b.kills - a.kills);
                break;
            case 'wins':
                sorted.sort((a, b) => (b.duelsWon + b.arenaWins) - (a.duelsWon + a.arenaWins));
                break;
        }
        
        const top = sorted.slice(0, limit).map((s, index) => {
            const player = this.server.players.get(s.playerId);
            return {
                rank: index + 1,
                playerId: s.playerId,
                playerName: player?.name || 'Desconhecido',
                rating: s.rating,
                wins: s.duelsWon + s.arenaWins,
                kills: s.kills
            };
        });
        
        socket.emit('pvp:leaderboard', { type, entries: top });
    }
    
    // ===== UTILITIES =====
    
    isPlayerInMatch(playerId) {
        for (const duel of this.activeDuels.values()) {
            if (duel.player1.playerId === playerId || duel.player2.playerId === playerId) {
                return true;
            }
        }
        
        for (const arena of this.activeArenas.values()) {
            if (arena.teamA.players.some(p => p.playerId === playerId) ||
                arena.teamB.players.some(p => p.playerId === playerId)) {
                return true;
            }
        }
        
        return false;
    }
    
    findPlayerDuel(playerId) {
        for (const duel of this.activeDuels.values()) {
            if (duel.player1.playerId === playerId || duel.player2.playerId === playerId) {
                return duel;
            }
        }
        return null;
    }
    
    calculateDistance(player1, player2) {
        const dx = (player1.x || 0) - (player2.x || 0);
        const dy = (player1.y || 0) - (player2.y || 0);
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    sanitizeDuelData(duel) {
        return {
            id: duel.id,
            type: duel.type,
            player1: duel.player1,
            player2: duel.player2,
            status: duel.status,
            spectators: duel.spectators.length
        };
    }
    
    sanitizeArenaData(match) {
        return {
            id: match.id,
            type: match.type,
            mode: match.mode,
            teamA: match.teamA,
            teamB: match.teamB,
            status: match.status,
            scoreLimit: match.scoreLimit,
            spectators: match.spectators.length
        };
    }
    
    startCleanupLoop() {
        setInterval(() => {
            const now = Date.now();
            
            // Clean up stale duels
            for (const [duelId, duel] of this.activeDuels) {
                if (duel.startedAt && now - duel.startedAt > this.config.duelTimeout) {
                    if (duel.status === 'active') {
                        this.endDuel(duel, null, 'timeout');
                    } else if (duel.status !== 'ended') {
                        this.activeDuels.delete(duelId);
                    }
                }
            }
            
            // Clean up stale arenas
            for (const [matchId, match] of this.activeArenas) {
                if (match.startedAt && now - match.startedAt > this.config.arenaTimeout) {
                    if (match.status === 'active') {
                        match.status = 'ended';
                        match.endedAt = now;
                        match.winner = 'draw';
                        
                        this.io.to(matchId).emit('pvp:arena_ended', {
                            matchId,
                            winner: 'draw',
                            reason: 'timeout'
                        });
                    }
                }
            }
            
            // Clean up old queue entries
            for (const [playerId, queueData] of this.queue) {
                if (now - queueData.queuedAt > 300000) { // 5 minutes
                    const player = this.server.players.get(playerId);
                    if (player?.socket) {
                        player.socket.emit('pvp:queue_expired');
                    }
                    this.queue.delete(playerId);
                }
            }
        }, 30000);
    }
}

module.exports = PvPManager;
