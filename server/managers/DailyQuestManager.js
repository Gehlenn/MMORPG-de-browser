/**
 * DailyQuestManager - Sistema de Missões Diárias
 * 
 * Features:
 * - Missões diárias rotativas
 * - Recompensas diárias
 * - Streak de login
 * - Tipos: matar mobs, completar dungeons, craftar, PvP
 * - Recompensas escalam com nível
 */

class DailyQuestManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Storage
        this.dailyQuests = new Map(); // playerId -> quests
        this.playerStreaks = new Map(); // playerId -> streak data
        this.questTemplates = this.initializeQuestTemplates();
        
        // Config
        this.config = {
            questsPerDay: 3,
            resetHour: 6, // 6 AM server time
            streakMaxDays: 7,
            streakBonusPerDay: 0.1 // 10% per day
        };
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startResetLoop();
        console.log('[DailyQuestManager] Sistema de missões diárias inicializado');
    }
    
    initializeQuestTemplates() {
        return {
            kill_mobs: {
                type: 'kill_mobs',
                name: 'Caçador de Monstros',
                description: 'Derrote {target} monstros',
                icon: '⚔️',
                category: 'combat',
                generateTarget: (playerLevel) => Math.floor(10 + playerLevel * 2),
                generateReward: (playerLevel, streak) => ({
                    exp: Math.floor(100 + playerLevel * 20),
                    gold: Math.floor(50 + playerLevel * 10),
                    multiplier: 1 + (streak * this.config.streakBonusPerDay)
                })
            },
            complete_dungeon: {
                type: 'complete_dungeon',
                name: 'Explorador de Dungeons',
                description: 'Complete {target} dungeon(s)',
                icon: '🏰',
                category: 'dungeon',
                generateTarget: () => 1,
                generateReward: (playerLevel, streak) => ({
                    exp: Math.floor(200 + playerLevel * 50),
                    gold: Math.floor(100 + playerLevel * 20),
                    items: ['dungeon_chest'],
                    multiplier: 1 + (streak * this.config.streakBonusPerDay)
                })
            },
            craft_items: {
                type: 'craft_items',
                name: 'Artesão',
                description: 'Crafte {target} item(s)',
                icon: '⚒️',
                category: 'crafting',
                generateTarget: () => Math.floor(Math.random() * 3 + 3),
                generateReward: (playerLevel, streak) => ({
                    exp: Math.floor(75 + playerLevel * 15),
                    gold: Math.floor(30 + playerLevel * 5),
                    multiplier: 1 + (streak * this.config.streakBonusPerDay)
                })
            },
            win_pvp: {
                type: 'win_pvp',
                name: 'Guerreiro PvP',
                description: 'Vença {target} duelo(s) ou arena(s)',
                icon: '🏆',
                category: 'pvp',
                generateTarget: () => Math.floor(Math.random() * 2 + 1),
                generateReward: (playerLevel, streak) => ({
                    exp: Math.floor(150 + playerLevel * 30),
                    gold: Math.floor(75 + playerLevel * 15),
                    honor: 50,
                    multiplier: 1 + (streak * this.config.streakBonusPerDay)
                })
            },
            gather_resources: {
                type: 'gather_resources',
                name: 'Coletor',
                description: 'Colete {target} recursos',
                icon: '⛏️',
                category: 'gathering',
                generateTarget: (playerLevel) => Math.floor(15 + playerLevel * 1.5),
                generateReward: (playerLevel, streak) => ({
                    exp: Math.floor(80 + playerLevel * 12),
                    gold: Math.floor(40 + playerLevel * 8),
                    multiplier: 1 + (streak * this.config.streakBonusPerDay)
                })
            },
            trade_items: {
                type: 'trade_items',
                name: 'Comerciante',
                description: 'Realize {target} trocas com outros jogadores',
                icon: '🤝',
                category: 'social',
                generateTarget: () => Math.floor(Math.random() * 2 + 2),
                generateReward: (playerLevel, streak) => ({
                    exp: Math.floor(50 + playerLevel * 10),
                    gold: Math.floor(60 + playerLevel * 12),
                    multiplier: 1 + (streak * this.config.streakBonusPerDay)
                })
            },
            login: {
                type: 'login',
                name: 'Login Diário',
                description: 'Faça login hoje',
                icon: '📅',
                category: 'daily',
                generateTarget: () => 1,
                generateReward: (playerLevel, streak) => ({
                    exp: Math.floor(25 + playerLevel * 5),
                    gold: Math.floor(25 + playerLevel * 3),
                    streakBonus: streak > 1,
                    multiplier: 1 + (streak * this.config.streakBonusPerDay)
                }),
                autoComplete: true
            }
        };
    }
    
    setupEventHandlers() {
        this.server.on('dailyquest:get', (socket) => {
            this.handleGetDailyQuests(socket);
        });
        
        this.server.on('dailyquest:claim', (socket, data) => {
            this.handleClaimReward(socket, data);
        });
        
        this.server.on('dailyquest:claim_all', (socket) => {
            this.handleClaimAllRewards(socket);
        });
        
        // Listen for quest progress events
        this.server.on('player:kill_mob', (socket, data) => {
            this.updateQuestProgress(socket.playerId, 'kill_mobs', 1);
        });
        
        this.server.on('player:complete_dungeon', (socket, data) => {
            this.updateQuestProgress(socket.playerId, 'complete_dungeon', 1);
        });
        
        this.server.on('player:craft_item', (socket, data) => {
            this.updateQuestProgress(socket.playerId, 'craft_items', 1);
        });
        
        this.server.on('player:win_pvp', (socket, data) => {
            this.updateQuestProgress(socket.playerId, 'win_pvp', 1);
        });
        
        this.server.on('player:gather_resource', (socket, data) => {
            this.updateQuestProgress(socket.playerId, 'gather_resources', 1);
        });
        
        this.server.on('player:trade_complete', (socket, data) => {
            this.updateQuestProgress(socket.playerId, 'trade_items', 1);
        });
    }
    
    getOrCreatePlayerData(playerId) {
        if (!this.dailyQuests.has(playerId)) {
            this.dailyQuests.set(playerId, {
                playerId,
                quests: [],
                lastReset: null,
                completedToday: 0
            });
        }
        return this.dailyQuests.get(playerId);
    }
    
    getOrCreateStreakData(playerId) {
        if (!this.playerStreaks.has(playerId)) {
            this.playerStreaks.set(playerId, {
                playerId,
                currentStreak: 0,
                lastLogin: null,
                maxStreak: 0
            });
        }
        return this.playerStreaks.get(playerId);
    }
    
    generateDailyQuests(playerId) {
        const playerData = this.getOrCreatePlayerData(playerId);
        const player = this.server.players.get(playerId);
        const streakData = this.getOrCreateStreakData(playerId);
        
        if (!player) return;
        
        // Check if needs reset
        const now = new Date();
        const lastReset = playerData.lastReset ? new Date(playerData.lastReset) : null;
        
        if (lastReset) {
            const resetTime = new Date(lastReset);
            resetTime.setDate(resetTime.getDate() + 1);
            resetTime.setHours(this.config.resetHour, 0, 0, 0);
            
            if (now < resetTime) {
                return playerData.quests; // Still same day
            }
        }
        
        // Generate new quests
        const templates = Object.values(this.questTemplates);
        const shuffled = templates.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, this.config.questsPerDay);
        
        playerData.quests = selected.map(template => {
            const target = template.generateTarget(player.level);
            const reward = template.generateReward(player.level, streakData.currentStreak);
            
            return {
                id: `${template.type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: template.type,
                name: template.name,
                description: template.description.replace('{target}', target),
                icon: template.icon,
                category: template.category,
                target,
                progress: template.autoComplete ? target : 0,
                completed: template.autoComplete,
                claimed: false,
                reward,
                expiresAt: this.getNextResetTime()
            };
        });
        
        playerData.lastReset = now.toISOString();
        playerData.completedToday = 0;
        
        // Update streak
        this.updateLoginStreak(playerId);
        
        return playerData.quests;
    }
    
    updateLoginStreak(playerId) {
        const streakData = this.getOrCreateStreakData(playerId);
        const now = new Date();
        
        if (streakData.lastLogin) {
            const lastLogin = new Date(streakData.lastLogin);
            const daysDiff = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                // Consecutive day
                streakData.currentStreak = Math.min(streakData.currentStreak + 1, this.config.streakMaxDays);
            } else if (daysDiff > 1) {
                // Streak broken
                streakData.currentStreak = 1;
            }
        } else {
            streakData.currentStreak = 1;
        }
        
        streakData.maxStreak = Math.max(streakData.maxStreak, streakData.currentStreak);
        streakData.lastLogin = now.toISOString();
    }
    
    updateQuestProgress(playerId, questType, amount) {
        const playerData = this.getOrCreatePlayerData(playerId);
        
        // Check if needs new quests
        if (!playerData.quests.length || this.shouldReset(playerData)) {
            this.generateDailyQuests(playerId);
        }
        
        let updated = false;
        
        for (const quest of playerData.quests) {
            if (quest.type === questType && !quest.completed) {
                quest.progress = Math.min(quest.target, quest.progress + amount);
                
                if (quest.progress >= quest.target) {
                    quest.completed = true;
                    playerData.completedToday++;
                    
                    // Notify player
                    const player = this.server.players.get(playerId);
                    if (player?.socket) {
                        player.socket.emit('dailyquest:completed', {
                            questId: quest.id,
                            questName: quest.name
                        });
                    }
                }
                
                updated = true;
            }
        }
        
        if (updated) {
            const player = this.server.players.get(playerId);
            if (player?.socket) {
                player.socket.emit('dailyquest:update', {
                    quests: playerData.quests
                });
            }
        }
    }
    
    shouldReset(playerData) {
        if (!playerData.lastReset) return true;
        
        const now = new Date();
        const lastReset = new Date(playerData.lastReset);
        const resetTime = new Date(lastReset);
        resetTime.setDate(resetTime.getDate() + 1);
        resetTime.setHours(this.config.resetHour, 0, 0, 0);
        
        return now >= resetTime;
    }
    
    getNextResetTime() {
        const now = new Date();
        const reset = new Date(now);
        reset.setDate(reset.getDate() + 1);
        reset.setHours(this.config.resetHour, 0, 0, 0);
        return reset.toISOString();
    }
    
    handleGetDailyQuests(socket) {
        const quests = this.generateDailyQuests(socket.playerId);
        const streakData = this.getOrCreateStreakData(socket.playerId);
        
        socket.emit('dailyquest:list', {
            quests,
            streak: streakData.currentStreak,
            maxStreak: streakData.maxStreak,
            streakBonus: streakData.currentStreak * this.config.streakBonusPerDay,
            resetTime: this.getNextResetTime()
        });
    }
    
    handleClaimReward(socket, data) {
        const { questId } = data;
        const playerData = this.getOrCreatePlayerData(socket.playerId);
        const quest = playerData.quests.find(q => q.id === questId);
        
        if (!quest) {
            socket.emit('dailyquest:error', { message: 'Missão não encontrada!' });
            return;
        }
        
        if (!quest.completed) {
            socket.emit('dailyquest:error', { message: 'Missão não completada!' });
            return;
        }
        
        if (quest.claimed) {
            socket.emit('dailyquest:error', { message: 'Recompensa já resgatada!' });
            return;
        }
        
        // Give rewards
        const player = this.server.players.get(socket.playerId);
        if (player) {
            const multiplier = quest.reward.multiplier || 1;
            
            if (quest.reward.exp) {
                player.exp = (player.exp || 0) + Math.floor(quest.reward.exp * multiplier);
            }
            
            if (quest.reward.gold) {
                player.gold = (player.gold || 0) + Math.floor(quest.reward.gold * multiplier);
            }
            
            if (quest.reward.honor) {
                player.honor = (player.honor || 0) + quest.reward.honor;
            }
            
            quest.claimed = true;
            
            socket.emit('dailyquest:claimed', {
                questId,
                rewards: {
                    exp: quest.reward.exp ? Math.floor(quest.reward.exp * multiplier) : 0,
                    gold: quest.reward.gold ? Math.floor(quest.reward.gold * multiplier) : 0,
                    honor: quest.reward.honor || 0,
                    items: quest.reward.items || []
                }
            });
        }
    }
    
    handleClaimAllRewards(socket) {
        const playerData = this.getOrCreatePlayerData(socket.playerId);
        const completedUnclaimed = playerData.quests.filter(q => q.completed && !q.claimed);
        
        if (completedUnclaimed.length === 0) {
            socket.emit('dailyquest:error', { message: 'Nenhuma recompensa para resgatar!' });
            return;
        }
        
        const results = [];
        for (const quest of completedUnclaimed) {
            // Use existing claim logic
            this.handleClaimReward(socket, { questId: quest.id });
            results.push(quest.id);
        }
        
        socket.emit('dailyquest:all_claimed', {
            count: results.length
        });
    }
    
    startResetLoop() {
        // Check for resets every hour
        setInterval(() => {
            const now = new Date();
            if (now.getHours() === this.config.resetHour && now.getMinutes() === 0) {
                // Reset all players' quests
                for (const playerId of this.dailyQuests.keys()) {
                    this.generateDailyQuests(playerId);
                    
                    const player = this.server.players.get(playerId);
                    if (player?.socket) {
                        player.socket.emit('dailyquest:reset');
                    }
                }
            }
        }, 60000); // Check every minute
    }
}

module.exports = DailyQuestManager;
