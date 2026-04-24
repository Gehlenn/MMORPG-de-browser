/**
 * PVPArenaSystem.js
 * Sistema de PvP Ranqueado - 1v1, 2v2, 3v3
 * Legacy of Komodo MMORPG v0.5.0 - Nível 9
 */

class PVPArenaSystem {
    constructor(database, playerManager, combatSystem) {
        this.db = database;
        this.playerManager = playerManager;
        this.combatSystem = combatSystem;
        
        // Configurações de arenas
        this.arenas = {
            duel_pit: {
                id: 'duel_pit',
                name: 'Pit de Duelos',
                description: 'Arena simples para combates 1v1',
                modes: ['1v1'],
                maxPlayers: 2,
                minLevel: 20,
                mapSize: { width: 800, height: 600 }
            },
            battle_grounds: {
                id: 'battle_grounds',
                name: 'Campos de Batalha',
                description: 'Campo aberto para combates em equipe',
                modes: ['2v2', '3v3'],
                maxPlayers: 6,
                minLevel: 30,
                mapSize: { width: 1200, height: 900 }
            },
            coliseum: {
                id: 'coliseum',
                name: 'Coliseu de Eldoria',
                description: 'O maior coliseu do reino. Onde lendas nascem.',
                modes: ['1v1', '2v2', '3v3', 'ffa'],
                maxPlayers: 10,
                minLevel: 40,
                mapSize: { width: 1500, height: 1500 }
            }
        };
        
        // Divisões ranqueadas
        this.divisions = [
            { name: 'Bronze', tier: 5, minRating: 0, maxRating: 999 },
            { name: 'Silver', tier: 4, minRating: 1000, maxRating: 1499 },
            { name: 'Gold', tier: 3, minRating: 1500, maxRating: 1999 },
            { name: 'Platinum', tier: 2, minRating: 2000, maxRating: 2499 },
            { name: 'Diamond', tier: 1, minRating: 2500, maxRating: 2999 },
            { name: 'Legend', tier: 0, minRating: 3000, maxRating: 99999 }
        ];
        
        // Filas de matchmaking
        this.queues = {
            '1v1': [],
            '2v2': [],
            '3v3': [],
            'ffa': []
        };
        
        // Partidas ativas
        this.activeMatches = new Map();
        
        // Ratings dos jogadores
        this.ratings = new Map();
        
        // Temporada atual
        this.season = {
            id: 'season_1',
            name: 'Season of Legends',
            startDate: new Date().toISOString(),
            endDate: null,
            rewards: {
                bronze: 'bronze_crown',
                silver: 'silver_crown',
                gold: 'gold_crown',
                platinum: 'platinum_crown',
                diamond: 'diamond_crown',
                legend: 'legend_wings'
            }
        };
        
        console.log('⚔️ PVPArenaSystem initialized');
    }

    /**
     * Entra na fila de matchmaking
     */
    async joinQueue(playerId, mode, arenaId = null) {
        const player = await this.playerManager.getPlayer(playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }
        
        // Verifica arena
        const arena = arenaId ? this.arenas[arenaId] : this.getRandomArena(mode);
        if (!arena) {
            return { success: false, error: 'Invalid arena' };
        }
        
        // Verifica level
        if (player.level < arena.minLevel) {
            return { success: false, error: `Level ${arena.minLevel}+ required` };
        }
        
        // Verifica se já está na fila
        const queue = this.queues[mode];
        if (queue.some(p => p.id === playerId)) {
            return { success: false, error: 'Already in queue' };
        }
        
        // Adiciona à fila
        const queueEntry = {
            id: playerId,
            name: player.name,
            level: player.level,
            class: player.class,
            rating: await this.getRating(playerId, mode),
            itemLevel: this.calculateItemLevel(player),
            joinedAt: Date.now()
        };
        
        queue.push(queueEntry);
        
        // Tenta matchmaking
        const match = this.attemptMatchmaking(mode);
        if (match) {
            return {
                success: true,
                matched: true,
                match: match
            };
        }
        
        return {
            success: true,
            matched: false,
            position: queue.length,
            estimatedTime: this.estimateQueueTime(mode, queue.length)
        };
    }

    /**
     * Tenta criar partida
     */
    attemptMatchmaking(mode) {
        const queue = this.queues[mode];
        const requiredPlayers = this.getRequiredPlayers(mode);
        
        if (queue.length < requiredPlayers) {
            return null;
        }
        
        // Pega jogadores da fila
        const players = queue.splice(0, requiredPlayers);
        
        // Ordena por rating para balanceamento
        players.sort((a, b) => a.rating - b.rating);
        
        // Cria times
        const teams = this.createTeams(players, mode);
        
        // Cria partida
        return this.createMatch(mode, teams);
    }

    /**
     * Cria times balanceados
     */
    createTeams(players, mode) {
        if (mode === '1v1') {
            return {
                team1: [players[0]],
                team2: [players[1]]
            };
        }
        
        if (mode === 'ffa') {
            return {
                freeForAll: players
            };
        }
        
        // 2v2 ou 3v3 - distribui alternando por rating
        const team1 = [];
        const team2 = [];
        
        for (let i = 0; i < players.length; i++) {
            if (i % 2 === 0) {
                team1.push(players[i]);
            } else {
                team2.push(players[i]);
            }
        }
        
        return { team1, team2 };
    }

    /**
     * Cria partida
     */
    createMatch(mode, teams) {
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const match = {
            id: matchId,
            mode: mode,
            status: 'waiting', // waiting, in_progress, completed
            teams: teams,
            arena: this.getRandomArena(mode),
            startTime: null,
            endTime: null,
            winner: null,
            mvp: null,
            kills: new Map(),
            damage: new Map(),
            deaths: new Map(),
            spectators: [],
            createdAt: Date.now()
        };
        
        this.activeMatches.set(matchId, match);
        
        // Notifica todos os jogadores
        this.notifyMatchFound(match);
        
        // Inicia após 30 segundos (tempo para aceitar)
        setTimeout(() => {
            if (match.status === 'waiting') {
                this.startMatch(matchId);
            }
        }, 30000);
        
        return match;
    }

    /**
     * Notifica jogadores
     */
    notifyMatchFound(match) {
        const allPlayers = this.getAllPlayersInMatch(match);
        
        for (const player of allPlayers) {
            this.playerManager.notify(player.id, 'pvp:match:found', {
                matchId: match.id,
                mode: match.mode,
                arena: match.arena.name,
                team: this.getPlayerTeam(match, player.id),
                countdown: 30
            });
        }
    }

    /**
     * Inicia partida
     */
    async startMatch(matchId) {
        const match = this.activeMatches.get(matchId);
        if (!match) {
            return { success: false, error: 'Match not found' };
        }
        
        match.status = 'in_progress';
        match.startTime = Date.now();
        
        // Spawn players nas posições iniciais
        this.spawnPlayers(match);
        
        // Notifica início
        this.broadcastToMatch(match, 'pvp:match:start', {
            matchId: match.id,
            duration: 300000, // 5 minutos max
            message: 'Fight!'
        });
        
        // Timer de partida
        setTimeout(() => {
            if (match.status === 'in_progress') {
                this.endMatch(match, 'time_limit');
            }
        }, 300000);
        
        console.log(`⚔️ PvP Match ${match.id} started`);
        
        return { success: true, match: this.formatMatch(match) };
    }

    /**
     * Spawn players
     */
    spawnPlayers(match) {
        const arena = match.arena;
        const spawnPoints = this.generateSpawnPoints(arena.mapSize, match.mode);
        
        let spawnIndex = 0;
        
        // Spawn team 1
        if (match.teams.team1) {
            for (const player of match.teams.team1) {
                player.spawnPoint = spawnPoints[spawnIndex++];
                player.team = 'team1';
            }
        }
        
        // Spawn team 2
        if (match.teams.team2) {
            for (const player of match.teams.team2) {
                player.spawnPoint = spawnPoints[spawnIndex++];
                player.team = 'team2';
            }
        }
        
        // Spawn FFA
        if (match.teams.freeForAll) {
            for (const player of match.teams.freeForAll) {
                player.spawnPoint = spawnPoints[spawnIndex++];
                player.team = 'ffa';
            }
        }
    }

    /**
     * Gera pontos de spawn
     */
    generateSpawnPoints(mapSize, mode) {
        const points = [];
        
        if (mode === '1v1') {
            points.push({ x: mapSize.width * 0.2, y: mapSize.height * 0.5 });
            points.push({ x: mapSize.width * 0.8, y: mapSize.height * 0.5 });
        } else if (mode === '2v2') {
            points.push({ x: mapSize.width * 0.15, y: mapSize.height * 0.4 });
            points.push({ x: mapSize.width * 0.15, y: mapSize.height * 0.6 });
            points.push({ x: mapSize.width * 0.85, y: mapSize.height * 0.4 });
            points.push({ x: mapSize.width * 0.85, y: mapSize.height * 0.6 });
        } else if (mode === '3v3') {
            for (let i = 0; i < 3; i++) {
                points.push({ x: mapSize.width * 0.1, y: mapSize.height * (0.3 + i * 0.2) });
            }
            for (let i = 0; i < 3; i++) {
                points.push({ x: mapSize.width * 0.9, y: mapSize.height * (0.3 + i * 0.2) });
            }
        } else {
            // FFA - posições aleatórias
            for (let i = 0; i < 10; i++) {
                points.push({
                    x: mapSize.width * 0.2 + Math.random() * mapSize.width * 0.6,
                    y: mapSize.height * 0.2 + Math.random() * mapSize.height * 0.6
                });
            }
        }
        
        return points;
    }

    /**
     * Processa kill
     */
    async processKill(matchId, killerId, victimId) {
        const match = this.activeMatches.get(matchId);
        if (!match || match.status !== 'in_progress') {
            return { success: false, error: 'Match not active' };
        }
        
        // Registra kill
        const kills = match.kills.get(killerId) || 0;
        match.kills.set(killerId, kills + 1);
        
        // Registra morte
        const deaths = match.deaths.get(victimId) || 0;
        match.deaths.set(victimId, deaths + 1);
        
        // Broadcast
        this.broadcastToMatch(match, 'pvp:kill', {
            killer: killerId,
            victim: victimId,
            killerKills: kills + 1
        });
        
        // Verifica condições de vitória
        this.checkWinConditions(match);
        
        return { success: true };
    }

    /**
     * Verifica condições de vitória
     */
    checkWinConditions(match) {
        if (match.mode === '1v1') {
            // 1v1 - primeiro a 3 kills ou time limit
            for (const [playerId, kills] of match.kills) {
                if (kills >= 3) {
                    this.endMatch(match, 'kills', playerId);
                    return;
                }
            }
        } else if (match.mode === '2v2' || match.mode === '3v3') {
            // Team modes - todos de um time morreram
            const team1Dead = match.teams.team1.every(p => 
                (match.deaths.get(p.id) || 0) >= 1
            );
            const team2Dead = match.teams.team2.every(p => 
                (match.deaths.get(p.id) || 0) >= 1
            );
            
            if (team1Dead) {
                this.endMatch(match, 'team_wipe', 'team2');
            } else if (team2Dead) {
                this.endMatch(match, 'team_wipe', 'team1');
            }
        } else if (match.mode === 'ffa') {
            // FFA - último sobrevivente ou mais kills no time limit
            const survivors = match.teams.freeForAll.filter(p => 
                (match.deaths.get(p.id) || 0) < 1
            );
            
            if (survivors.length === 1) {
                this.endMatch(match, 'last_man_standing', survivors[0].id);
            }
        }
    }

    /**
     * Finaliza partida
     */
    async endMatch(match, reason, winnerId = null) {
        if (match.status === 'completed') {
            return;
        }
        
        match.status = 'completed';
        match.endTime = Date.now();
        
        // Determina vencedor
        if (!winnerId) {
            winnerId = this.determineWinnerByKills(match);
        }
        
        match.winner = winnerId;
        match.mvp = this.calculateMVP(match);
        
        // Calcula rating changes
        await this.updateRatings(match);
        
        // Salva resultado
        await this.db.saveMatchResult({
            matchId: match.id,
            mode: match.mode,
            arena: match.arena.id,
            teams: match.teams,
            winner: match.winner,
            mvp: match.mvp,
            duration: match.endTime - match.startTime,
            kills: Array.from(match.kills.entries()),
            damage: Array.from(match.damage.entries()),
            deaths: Array.from(match.deaths.entries()),
            season: this.season.id,
            endedAt: new Date().toISOString()
        });
        
        // Notifica resultado
        this.broadcastToMatch(match, 'pvp:match:end', {
            matchId: match.id,
            winner: match.winner,
            mvp: match.mvp,
            reason: reason,
            duration: match.endTime - match.startTime,
            ratingChanges: await this.getRatingChanges(match)
        });
        
        console.log(`⚔️ PvP Match ${match.id} ended. Winner: ${match.winner}`);
        
        // Limpa após 1 minuto
        setTimeout(() => {
            this.activeMatches.delete(match.id);
        }, 60000);
    }

    /**
     * Determina vencedor por kills (tiebreaker)
     */
    determineWinnerByKills(match) {
        let maxKills = -1;
        let winner = null;
        
        for (const [playerId, kills] of match.kills) {
            if (kills > maxKills) {
                maxKills = kills;
                winner = playerId;
            }
        }
        
        return winner;
    }

    /**
     * Calcula MVP
     */
    calculateMVP(match) {
        let maxScore = 0;
        let mvp = null;
        
        const allPlayers = this.getAllPlayersInMatch(match);
        
        for (const player of allPlayers) {
            const kills = match.kills.get(player.id) || 0;
            const damage = match.damage.get(player.id) || 0;
            const deaths = match.deaths.get(player.id) || 0;
            
            const score = kills * 100 + damage * 0.1 - deaths * 50;
            
            if (score > maxScore) {
                maxScore = score;
                mvp = player.id;
            }
        }
        
        return mvp;
    }

    /**
     * Atualiza ratings
     */
    async updateRatings(match) {
        if (!match.winner) return;
        
        const allPlayers = this.getAllPlayersInMatch(match);
        
        for (const player of allPlayers) {
            const currentRating = await this.getRating(player.id, match.mode);
            const isWinner = this.isPlayerInTeam(match, player.id, match.winner);
            
            // Sistema ELO simplificado
            const kFactor = 32;
            const expectedScore = this.calculateExpectedScore(
                currentRating, 
                this.getAverageOpponentRating(match, player.id)
            );
            const actualScore = isWinner ? 1 : 0;
            
            const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
            const newRating = Math.max(0, currentRating + ratingChange);
            
            await this.setRating(player.id, match.mode, newRating);
            
            // Atualiza divisão
            await this.updateDivision(player.id, newRating);
        }
    }

    /**
     * Calcula score esperado (ELO)
     */
    calculateExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }

    /**
     * Obtém rating do jogador
     */
    async getRating(playerId, mode) {
        const key = `${playerId}_${mode}`;
        if (this.ratings.has(key)) {
            return this.ratings.get(key);
        }
        
        // Busca no banco
        const rating = await this.db.getPVPRating(playerId, mode);
        const value = rating?.rating || 1000;
        this.ratings.set(key, value);
        
        return value;
    }

    /**
     * Define rating
     */
    async setRating(playerId, mode, rating) {
        const key = `${playerId}_${mode}`;
        this.ratings.set(key, rating);
        await this.db.setPVPRating(playerId, mode, rating);
    }

    /**
     * Atualiza divisão
     */
    async updateDivision(playerId, rating) {
        for (const division of this.divisions) {
            if (rating >= division.minRating && rating <= division.maxRating) {
                await this.db.setPlayerDivision(playerId, division.name);
                break;
            }
        }
    }

    /**
     * Sai da fila
     */
    leaveQueue(playerId, mode) {
        const queue = this.queues[mode];
        const index = queue.findIndex(p => p.id === playerId);
        
        if (index !== -1) {
            queue.splice(index, 1);
            return { success: true };
        }
        
        return { success: false, error: 'Not in queue' };
    }

    /**
     * Obtém leaderboard
     */
    async getLeaderboard(mode, limit = 100) {
        return await this.db.getPVPLeaderboard(mode, limit);
    }

    /**
     * Obtém estatísticas do jogador
     */
    async getPlayerStats(playerId) {
        const stats = {
            ratings: {},
            divisions: {},
            totalMatches: 0,
            wins: 0,
            losses: 0,
            winRate: 0
        };
        
        for (const mode of Object.keys(this.queues)) {
            stats.ratings[mode] = await this.getRating(playerId, mode);
        }
        
        const matchStats = await this.db.getPlayerPVPStats(playerId);
        if (matchStats) {
            stats.totalMatches = matchStats.totalMatches;
            stats.wins = matchStats.wins;
            stats.losses = matchStats.losses;
            stats.winRate = matchStats.totalMatches > 0 
                ? (matchStats.wins / matchStats.totalMatches * 100).toFixed(1)
                : 0;
        }
        
        return stats;
    }

    /**
     * Helper methods
     */
    getRequiredPlayers(mode) {
        const map = { '1v1': 2, '2v2': 4, '3v3': 6, 'ffa': 6 };
        return map[mode] || 2;
    }

    getRandomArena(mode) {
        const available = Object.values(this.arenas)
            .filter(a => a.modes.includes(mode));
        return available[Math.floor(Math.random() * available.length)];
    }

    getAllPlayersInMatch(match) {
        const players = [];
        if (match.teams.team1) players.push(...match.teams.team1);
        if (match.teams.team2) players.push(...match.teams.team2);
        if (match.teams.freeForAll) players.push(...match.teams.freeForAll);
        return players;
    }

    getPlayerTeam(match, playerId) {
        if (match.teams.team1?.some(p => p.id === playerId)) return 'team1';
        if (match.teams.team2?.some(p => p.id === playerId)) return 'team2';
        if (match.teams.freeForAll?.some(p => p.id === playerId)) return 'ffa';
        return null;
    }

    isPlayerInTeam(match, playerId, winner) {
        if (winner === 'team1') {
            return match.teams.team1?.some(p => p.id === playerId);
        } else if (winner === 'team2') {
            return match.teams.team2?.some(p => p.id === playerId);
        }
        return playerId === winner;
    }

    getAverageOpponentRating(match, playerId) {
        const allPlayers = this.getAllPlayersInMatch(match);
        const opponents = allPlayers.filter(p => {
            const playerTeam = this.getPlayerTeam(match, playerId);
            const opponentTeam = this.getPlayerTeam(match, p.id);
            return p.id !== playerId && playerTeam !== opponentTeam;
        });
        
        if (opponents.length === 0) return 1000;
        
        const total = opponents.reduce((sum, p) => sum + (p.rating || 1000), 0);
        return total / opponents.length;
    }

    broadcastToMatch(match, event, data) {
        const allPlayers = this.getAllPlayersInMatch(match);
        for (const player of allPlayers) {
            this.playerManager.notify(player.id, event, data);
        }
    }

    formatMatch(match) {
        return {
            id: match.id,
            mode: match.mode,
            status: match.status,
            arena: match.arena.name,
            teams: match.teams,
            startTime: match.startTime,
            endTime: match.endTime
        };
    }

    calculateItemLevel(player) {
        if (!player.equipment) return 0;
        let total = 0;
        let count = 0;
        for (const slot of ['weapon', 'armor', 'helmet', 'boots', 'accessory']) {
            const item = player.equipment[slot];
            if (item?.itemLevel) {
                total += item.itemLevel;
                count++;
            }
        }
        return count > 0 ? Math.floor(total / count) : 0;
    }

    estimateQueueTime(mode, position) {
        const baseTime = 60; // 1 min por jogador
        const needed = this.getRequiredPlayers(mode);
        return Math.max(0, (needed - position) * baseTime);
    }

    async getRatingChanges(match) {
        const changes = {};
        const allPlayers = this.getAllPlayersInMatch(match);
        
        for (const player of allPlayers) {
            const oldRating = player.rating;
            const newRating = await this.getRating(player.id, match.mode);
            changes[player.id] = {
                old: oldRating,
                new: newRating,
                change: newRating - oldRating
            };
        }
        
        return changes;
    }

    getStats() {
        return {
            activeMatches: this.activeMatches.size,
            playersInQueue: Object.values(this.queues).reduce((sum, q) => sum + q.length, 0),
            season: this.season,
            divisions: this.divisions.length
        };
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PVPArenaSystem;
} else {
    window.PVPArenaSystem = PVPArenaSystem;
}
