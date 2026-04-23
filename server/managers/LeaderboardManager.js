/**
 * LeaderboardManager - Sistema de Estatísticas e Leaderboards
 * 
 * Features:
 * - Rankings de nível, PvP, riqueza, conquistas
 * - Hall da Fama semanal/mensal
 * - Estatísticas de guildas
 * - Rankings por classe
 * - Sistema de tiers (Bronze, Prata, Ouro, Platina, Diamante)
 * - Recompensas de ranking
 */

class LeaderboardManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Storage
        this.playerStats = new Map(); // playerId -> stats
        this.guildStats = new Map(); // guildId -> stats
        this.leaderboards = new Map(); // type -> sorted array
        this.seasonHistory = []; // Past seasons
        
        // Leaderboard types
        this.leaderboardTypes = [
            'level', 'pvp', 'wealth', 'achievements', 'dungeon', 'crafting'
        ];
        
        // Config
        this.config = {
            updateInterval: 300000, // 5 minutes
            seasonDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
            topPlayersShown: 100,
            tiers: [
                { name: 'Bronze', minRank: 100, color: '#cd7f32' },
                { name: 'Prata', minRank: 50, color: '#c0c0c0' },
                { name: 'Ouro', minRank: 20, color: '#ffd700' },
                { name: 'Platina', minRank: 10, color: '#e5e4e2' },
                { name: 'Diamante', minRank: 3, color: '#b9f2ff' },
                { name: 'Lendário', minRank: 1, color: '#ff6b6b' }
            ]
        };
        
        this.currentSeason = {
            id: 1,
            startedAt: Date.now(),
            endsAt: Date.now() + this.config.seasonDuration
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startUpdateLoop();
        this.startSeasonTimer();
        console.log('[LeaderboardManager] Sistema de leaderboards inicializado');
    }
    
    setupEventHandlers() {
        this.server.on('leaderboard:get', (socket, data) => {
            this.handleGetLeaderboard(socket, data);
        });
        
        this.server.on('leaderboard:get_player_rank', (socket, data) => {
            this.handleGetPlayerRank(socket, data);
        });
        
        this.server.on('leaderboard:get_stats', (socket) => {
            this.handleGetPlayerStats(socket);
        });
        
        this.server.on('leaderboard:get_guild_rankings', (socket) => {
            this.handleGetGuildRankings(socket);
        });
        
        this.server.on('leaderboard:get_hall_of_fame', (socket) => {
            this.handleGetHallOfFame(socket);
        });
        
        this.server.on('leaderboard:claim_rewards', (socket) => {
            this.handleClaimSeasonRewards(socket);
        });
    }
    
    // ===== PLAYER STATS =====
    
    getOrCreatePlayerStats(playerId) {
        if (!this.playerStats.has(playerId)) {
            this.playerStats.set(playerId, {
                playerId,
                level: 1,
                exp: 0,
                pvpWins: 0,
                pvpLosses: 0,
                pvpRating: 1000,
                gold: 0,
                achievementPoints: 0,
                dungeonsCompleted: 0,
                craftingLevel: 0,
                playTime: 0,
                lastUpdated: Date.now()
            });
        }
        return this.playerStats.get(playerId);
    }
    
    updatePlayerStat(playerId, stat, value) {
        const stats = this.getOrCreatePlayerStats(playerId);
        const oldValue = stats[stat];
        stats[stat] = value;
        stats.lastUpdated = Date.now();
        
        // Check for leaderboard changes
        this.checkLeaderboardChanges(playerId, stat, oldValue, value);
    }
    
    incrementPlayerStat(playerId, stat, amount = 1) {
        const stats = this.getOrCreatePlayerStats(playerId);
        const oldValue = stats[stat];
        stats[stat] = (stats[stat] || 0) + amount;
        stats.lastUpdated = Date.now();
        
        this.checkLeaderboardChanges(playerId, stat, oldValue, stats[stat]);
    }
    
    // ===== LEADERBOARD CALCULATIONS =====
    
    calculateAllLeaderboards() {
        const players = Array.from(this.playerStats.values());
        
        // Level leaderboard
        this.leaderboards.set('level', 
            players
                .filter(p => p.level > 1)
                .sort((a, b) => b.level - a.level || b.exp - a.exp)
                .slice(0, this.config.topPlayersShown)
                .map((p, index) => ({
                    rank: index + 1,
                    playerId: p.playerId,
                    value: p.level,
                    subValue: p.exp,
                    tier: this.calculateTier(index + 1)
                }))
        );
        
        // PvP leaderboard
        this.leaderboards.set('pvp',
            players
                .filter(p => p.pvpRating > 1000)
                .sort((a, b) => b.pvpRating - a.pvpRating)
                .slice(0, this.config.topPlayersShown)
                .map((p, index) => ({
                    rank: index + 1,
                    playerId: p.playerId,
                    value: p.pvpRating,
                    subValue: `${p.pvpWins}-${p.pvpLosses}`,
                    tier: this.calculateTier(index + 1)
                }))
        );
        
        // Wealth leaderboard
        this.leaderboards.set('wealth',
            players
                .filter(p => p.gold > 0)
                .sort((a, b) => b.gold - a.gold)
                .slice(0, this.config.topPlayersShown)
                .map((p, index) => ({
                    rank: index + 1,
                    playerId: p.playerId,
                    value: p.gold,
                    subValue: null,
                    tier: this.calculateTier(index + 1)
                }))
        );
        
        // Achievements leaderboard
        this.leaderboards.set('achievements',
            players
                .filter(p => p.achievementPoints > 0)
                .sort((a, b) => b.achievementPoints - a.achievementPoints)
                .slice(0, this.config.topPlayersShown)
                .map((p, index) => ({
                    rank: index + 1,
                    playerId: p.playerId,
                    value: p.achievementPoints,
                    subValue: null,
                    tier: this.calculateTier(index + 1)
                }))
        );
        
        // Dungeon leaderboard
        this.leaderboards.set('dungeon',
            players
                .filter(p => p.dungeonsCompleted > 0)
                .sort((a, b) => b.dungeonsCompleted - a.dungeonsCompleted)
                .slice(0, this.config.topPlayersShown)
                .map((p, index) => ({
                    rank: index + 1,
                    playerId: p.playerId,
                    value: p.dungeonsCompleted,
                    subValue: null,
                    tier: this.calculateTier(index + 1)
                }))
        );
        
        // Crafting leaderboard
        this.leaderboards.set('crafting',
            players
                .filter(p => p.craftingLevel > 0)
                .sort((a, b) => b.craftingLevel - a.craftingLevel)
                .slice(0, this.config.topPlayersShown)
                .map((p, index) => ({
                    rank: index + 1,
                    playerId: p.playerId,
                    value: p.craftingLevel,
                    subValue: null,
                    tier: this.calculateTier(index + 1)
                }))
        );
    }
    
    calculateTier(rank) {
        for (const tier of this.config.tiers) {
            if (rank <= tier.minRank) {
                return tier;
            }
        }
        return this.config.tiers[0];
    }
    
    // ===== EVENT HANDLERS =====
    
    handleGetLeaderboard(socket, data) {
        const { type = 'level', page = 0, pageSize = 20 } = data;
        
        if (!this.leaderboardTypes.includes(type)) {
            socket.emit('leaderboard:error', { message: 'Tipo de leaderboard inválido' });
            return;
        }
        
        const leaderboard = this.leaderboards.get(type) || [];
        const start = page * pageSize;
        const end = start + pageSize;
        const pageData = leaderboard.slice(start, end);
        
        // Get player names
        const enriched = pageData.map(entry => {
            const player = this.server.players.get(entry.playerId);
            return {
                ...entry,
                playerName: player?.name || 'Desconhecido',
                playerClass: player?.class || 'warrior',
                isOnline: !!player
            };
        });
        
        socket.emit('leaderboard:data', {
            type,
            entries: enriched,
            total: leaderboard.length,
            page,
            pageSize,
            currentSeason: this.currentSeason
        });
    }
    
    handleGetPlayerRank(socket, data) {
        const { type = 'level' } = data;
        const playerStats = this.getOrCreatePlayerStats(socket.playerId);
        
        const leaderboard = this.leaderboards.get(type) || [];
        const entry = leaderboard.find(e => e.playerId === socket.playerId);
        
        if (entry) {
            socket.emit('leaderboard:player_rank', {
                type,
                rank: entry.rank,
                tier: entry.tier,
                total: leaderboard.length,
                value: entry.value,
                percentile: Math.round(((leaderboard.length - entry.rank) / leaderboard.length) * 100)
            });
        } else {
            socket.emit('leaderboard:player_rank', {
                type,
                rank: null,
                tier: null,
                message: 'Você ainda não está no ranking. Continue progredindo!'
            });
        }
    }
    
    handleGetPlayerStats(socket) {
        const stats = this.getOrCreatePlayerStats(socket.playerId);
        const player = this.server.players.get(socket.playerId);
        
        // Calculate additional stats
        const enrichedStats = {
            ...stats,
            pvpWinRate: stats.pvpWins + stats.pvpLosses > 0 
                ? Math.round((stats.pvpWins / (stats.pvpWins + stats.pvpLosses)) * 100) 
                : 0,
            totalStats: Object.values(stats).reduce((a, b) => typeof b === 'number' ? a + b : a, 0),
            ranks: {}
        };
        
        // Get ranks for all types
        for (const type of this.leaderboardTypes) {
            const leaderboard = this.leaderboards.get(type) || [];
            const entry = leaderboard.find(e => e.playerId === socket.playerId);
            if (entry) {
                enrichedStats.ranks[type] = {
                    rank: entry.rank,
                    tier: entry.tier
                };
            }
        }
        
        socket.emit('leaderboard:player_stats', enrichedStats);
    }
    
    handleGetGuildRankings(socket) {
        const guilds = Array.from(this.guildStats.values())
            .sort((a, b) => b.totalPower - a.totalPower)
            .slice(0, 50)
            .map((g, index) => ({
                rank: index + 1,
                guildId: g.guildId,
                guildName: g.guildName,
                members: g.memberCount,
                power: g.totalPower,
                level: g.guildLevel
            }));
        
        socket.emit('leaderboard:guild_rankings', guilds);
    }
    
    handleGetHallOfFame(socket) {
        const hallOfFame = this.seasonHistory
            .slice(-10) // Last 10 seasons
            .map(season => ({
                seasonId: season.id,
                endedAt: season.endedAt,
                winners: season.winners || {}
            }));
        
        socket.emit('leaderboard:hall_of_fame', hallOfFame);
    }
    
    handleClaimSeasonRewards(socket) {
        const playerStats = this.getOrCreatePlayerStats(socket.playerId);
        const rewards = [];
        
        // Check each leaderboard type for rewards
        for (const type of this.leaderboardTypes) {
            const leaderboard = this.leaderboards.get(type) || [];
            const entry = leaderboard.find(e => e.playerId === socket.playerId);
            
            if (entry && entry.rank <= 10) {
                const reward = this.calculateSeasonReward(type, entry.rank, entry.tier);
                rewards.push({
                    type,
                    rank: entry.rank,
                    reward
                });
            }
        }
        
        if (rewards.length > 0) {
            // Give rewards
            for (const r of rewards) {
                // Would integrate with reward system
                console.log(`[Leaderboard] ${socket.playerId} recebeu recompensa por rank ${r.rank} em ${r.type}`);
            }
            
            socket.emit('leaderboard:rewards_claimed', rewards);
        } else {
            socket.emit('leaderboard:error', { message: 'Você não tem recompensas para resgatar nesta temporada' });
        }
    }
    
    calculateSeasonReward(type, rank, tier) {
        const baseRewards = {
            level: { gold: 5000, items: ['exp_boost_potion'] },
            pvp: { gold: 10000, items: ['pvp_chest', 'honor_badge'] },
            wealth: { gold: 0, items: ['merchant_crate', 'investment_note'] },
            achievements: { gold: 3000, items: ['trophy', 'title_scroll'] },
            dungeon: { gold: 4000, items: ['dungeon_chest', 'boss_token'] },
            crafting: { gold: 2000, items: ['crafting_materials', 'recipe_scroll'] }
        };
        
        const multiplier = Math.max(1, 11 - rank); // Rank 1 = 10x, Rank 10 = 1x
        const base = baseRewards[type] || { gold: 1000, items: [] };
        
        return {
            gold: base.gold * multiplier,
            items: base.items,
            title: rank === 1 ? `Campeão de ${type}` : null,
            badge: `${type}_rank_${rank}`
        };
    }
    
    // ===== SEASON MANAGEMENT =====
    
    startUpdateLoop() {
        setInterval(() => {
            this.calculateAllLeaderboards();
        }, this.config.updateInterval);
    }
    
    startSeasonTimer() {
        setInterval(() => {
            this.checkSeasonEnd();
        }, 60000); // Check every minute
    }
    
    checkSeasonEnd() {
        if (Date.now() >= this.currentSeason.endsAt) {
            this.endSeason();
        }
    }
    
    endSeason() {
        // Record season winners
        const winners = {};
        for (const type of this.leaderboardTypes) {
            const leaderboard = this.leaderboards.get(type) || [];
            const top3 = leaderboard.slice(0, 3);
            winners[type] = top3.map(e => ({
                playerId: e.playerId,
                rank: e.rank,
                value: e.value
            }));
        }
        
        // Save to history
        this.seasonHistory.push({
            ...this.currentSeason,
            endedAt: Date.now(),
            winners
        });
        
        // Announce
        this.io.emit('leaderboard:season_ended', {
            seasonId: this.currentSeason.id,
            winners,
            nextSeasonStarts: Date.now() + 60000 // 1 minute break
        });
        
        // Start new season
        this.currentSeason = {
            id: this.currentSeason.id + 1,
            startedAt: Date.now() + 60000,
            endsAt: Date.now() + 60000 + this.config.seasonDuration
        };
        
        // Reset relevant stats
        // (Keep lifetime stats, reset season-specific ones)
        
        console.log(`[LeaderboardManager] Season ${this.currentSeason.id - 1} ended`);
    }
    
    // ===== CHANGE DETECTION =====
    
    checkLeaderboardChanges(playerId, stat, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        // Notify player of significant rank changes
        for (const type of this.leaderboardTypes) {
            const leaderboard = this.leaderboards.get(type);
            if (!leaderboard) continue;
            
            const oldEntry = leaderboard.find(e => e.playerId === playerId);
            if (!oldEntry) continue;
            
            // Recalculate position
            // (Would need to resort the leaderboard)
        }
    }
    
    // ===== GUILD STATS =====
    
    updateGuildStats(guildId, data) {
        if (!this.guildStats.has(guildId)) {
            this.guildStats.set(guildId, {
                guildId,
                guildName: data.name,
                memberCount: 0,
                totalPower: 0,
                guildLevel: 1,
                territoryControl: [],
                warsWon: 0,
                lastUpdated: Date.now()
            });
        }
        
        const stats = this.guildStats.get(guildId);
        Object.assign(stats, data);
        stats.lastUpdated = Date.now();
    }
    
    // ===== API =====
    
    getTopPlayers(type, count = 10) {
        const leaderboard = this.leaderboards.get(type) || [];
        return leaderboard.slice(0, count);
    }
    
    getPlayerPosition(playerId, type) {
        const leaderboard = this.leaderboards.get(type) || [];
        const index = leaderboard.findIndex(e => e.playerId === playerId);
        return index !== -1 ? index + 1 : null;
    }
    
    getCurrentSeason() {
        return this.currentSeason;
    }
}

module.exports = LeaderboardManager;
