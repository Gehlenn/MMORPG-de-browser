/**
 * TitleManager - Sistema de Títulos
 * 
 * Features:
 * - Títulos desbloqueáveis por conquistas
 * - Títulos por ranking PvP
 * - Títulos de profissão
 * - Títulos especiais de eventos
 * - Exibição acima do nome do jogador
 * - Buffs passivos por título
 */

class TitleManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Storage
        this.playerTitles = new Map(); // playerId -> { unlockedTitles[], activeTitle }
        
        // Title database
        this.titleDatabase = this.initializeTitleDatabase();
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        console.log('[TitleManager] Sistema de títulos inicializado');
    }
    
    initializeTitleDatabase() {
        return {
            // Combat titles
            warrior: {
                id: 'warrior',
                name: 'Guerreiro',
                prefix: true, // "Guerreiro Name"
                color: '#9CA3AF',
                unlockRequirement: { level: 1 },
                buffs: { hp: 10 }
            },
            veteran: {
                id: 'veteran',
                name: 'Veterano',
                prefix: true,
                color: '#22c55e',
                unlockRequirement: { level: 20 },
                buffs: { hp: 50, attack: 5 }
            },
            champion: {
                id: 'champion',
                name: 'Campeão',
                prefix: true,
                color: '#3b82f6',
                unlockRequirement: { level: 40 },
                buffs: { hp: 100, attack: 10, defense: 5 }
            },
            slayer: {
                id: 'slayer',
                name: 'O Exterminador',
                prefix: true,
                color: '#a855f7',
                unlockRequirement: { achievement: 'monster_hunter' },
                buffs: { attack: 15, critChance: 0.02 }
            },
            boss_bane: {
                id: 'boss_bane',
                name: 'Flagelo dos Bosses',
                prefix: true,
                color: '#f59e0b',
                unlockRequirement: { achievement: 'boss_bane' },
                buffs: { attack: 25, defense: 10, bossDamage: 0.1 }
            },
            
            // PvP titles
            duelist: {
                id: 'duelist',
                name: 'Duelista',
                prefix: true,
                color: '#ef4444',
                unlockRequirement: { pvpWins: 10 },
                buffs: { attack: 10, pvpDamage: 0.05 }
            },
            gladiator: {
                id: 'gladiator',
                name: 'Gladiador',
                prefix: true,
                color: '#dc2626',
                unlockRequirement: { pvpWins: 50 },
                buffs: { attack: 20, pvpDamage: 0.1, pvpDefense: 0.05 }
            },
            warlord: {
                id: 'warlord',
                name: 'Senhor da Guerra',
                prefix: true,
                color: '#991b1b',
                unlockRequirement: { pvpWins: 100 },
                buffs: { attack: 35, pvpDamage: 0.15, pvpDefense: 0.1 }
            },
            
            // Profession titles
            apprentice_crafter: {
                id: 'apprentice_crafter',
                name: 'Aprendiz',
                suffix: true, // "Name, o Aprendiz"
                color: '#8b5cf6',
                unlockRequirement: { professionLevel: 50 },
                buffs: { craftingSpeed: 0.05 }
            },
            journeyman: {
                id: 'journeyman',
                name: 'Oficial',
                suffix: true,
                color: '#7c3aed',
                unlockRequirement: { professionLevel: 150 },
                buffs: { craftingSpeed: 0.1, craftingQuality: 0.05 }
            },
            master_crafter: {
                id: 'master_crafter',
                name: 'Mestre Artesão',
                suffix: true,
                color: '#6d28d9',
                unlockRequirement: { professionLevel: 300 },
                buffs: { craftingSpeed: 0.2, craftingQuality: 0.1, materialSave: 0.05 }
            },
            
            // Economic titles
            merchant: {
                id: 'merchant',
                name: 'Mercador',
                suffix: true,
                color: '#d69e2e',
                unlockRequirement: { goldEarned: 10000 },
                buffs: { sellPrice: 0.05, buyDiscount: 0.02 }
            },
            wealthy: {
                id: 'wealthy',
                name: 'O Próspero',
                suffix: true,
                color: '#f59e0b',
                unlockRequirement: { goldEarned: 100000 },
                buffs: { sellPrice: 0.1, buyDiscount: 0.05 }
            },
            
            // Social titles
            friendly: {
                id: 'friendly',
                name: 'Amigável',
                prefix: true,
                color: '#ec4899',
                unlockRequirement: { friends: 10 },
                buffs: { expShare: 0.05 }
            },
            guild_leader_title: {
                id: 'guild_leader_title',
                name: 'Líder de Guilda',
                suffix: true,
                color: '#db2777',
                unlockRequirement: { guildLeader: true },
                buffs: { guildExp: 0.1, guildGold: 0.05 }
            },
            
            // Exploration titles
            explorer: {
                id: 'explorer',
                name: 'Explorador',
                suffix: true,
                color: '#06b6d4',
                unlockRequirement: { zonesDiscovered: 3 },
                buffs: { moveSpeed: 0.03 }
            },
            adventurer: {
                id: 'adventurer',
                name: 'Aventureiro',
                suffix: true,
                color: '#0891b2',
                unlockRequirement: { zonesDiscovered: 6 },
                buffs: { moveSpeed: 0.05, expBonus: 0.05 }
            },
            
            // Special event titles
            early_adopter: {
                id: 'early_adopter',
                name: 'Pioneiro',
                prefix: true,
                color: '#ffd700',
                unlockRequirement: { accountAge: 30 }, // Days
                buffs: { expBonus: 0.1, prestige: true }
            },
            beta_tester: {
                id: 'beta_tester',
                name: 'Beta Tester',
                suffix: true,
                color: '#c0c0c0',
                unlockRequirement: { betaParticipant: true },
                buffs: { allStats: 5, prestige: true }
            },
            event_champion_2024: {
                id: 'event_champion_2024',
                name: 'Campeão de Eventos 2024',
                prefix: true,
                color: '#ff6b6b',
                unlockRequirement: { eventWins: 5, year: 2024 },
                buffs: { eventDamage: 0.1, prestige: true },
                timeLimited: true
            },
            
            // Legendary titles
            legend: {
                id: 'legend',
                name: 'A Lenda',
                prefix: true,
                color: '#ff0000',
                glow: true,
                unlockRequirement: { allAchievements: true, level: 100 },
                buffs: { allStats: 20, expBonus: 0.1, prestige: true }
            }
        };
    }
    
    setupEventHandlers() {
        this.server.on('title:get_list', (socket) => {
            this.handleGetTitleList(socket);
        });
        
        this.server.on('title:set_active', (socket, data) => {
            this.handleSetActiveTitle(socket, data);
        });
        
        this.server.on('title:clear', (socket) => {
            this.handleClearTitle(socket);
        });
        
        this.server.on('title:check_unlocks', (socket, data) => {
            this.handleCheckUnlocks(socket, data);
        });
    }
    
    // ===== PLAYER OPERATIONS =====
    
    getOrCreatePlayerTitles(playerId) {
        if (!this.playerTitles.has(playerId)) {
            this.playerTitles.set(playerId, {
                playerId,
                unlockedTitles: ['warrior'], // Starter title
                activeTitle: 'warrior',
                titleHistory: [],
                unlockedAt: Date.now()
            });
        }
        return this.playerTitles.get(playerId);
    }
    
    handleGetTitleList(socket) {
        const playerData = this.getOrCreatePlayerTitles(socket.playerId);
        const player = this.server.players.get(socket.playerId);
        
        // Format titles with buff details
        const unlocked = playerData.unlockedTitles.map(id => {
            const title = this.titleDatabase[id];
            return {
                ...title,
                id,
                isActive: playerData.activeTitle === id
            };
        });
        
        // Check available titles
        const available = Object.entries(this.titleDatabase)
            .filter(([id, title]) => !playerData.unlockedTitles.includes(id))
            .filter(([id, title]) => this.checkRequirements(player, title.unlockRequirement))
            .map(([id, title]) => ({ ...title, id }));
        
        socket.emit('title:list', {
            unlocked,
            available,
            activeTitle: playerData.activeTitle
        });
    }
    
    handleSetActiveTitle(socket, data) {
        const { titleId } = data;
        const playerData = this.getOrCreatePlayerTitles(socket.playerId);
        
        // Check if player owns this title
        if (!playerData.unlockedTitles.includes(titleId)) {
            socket.emit('title:error', { message: 'Título não desbloqueado!' });
            return;
        }
        
        // Set active
        const oldTitle = playerData.activeTitle;
        playerData.activeTitle = titleId;
        playerData.titleHistory.push({
            titleId,
            equippedAt: Date.now()
        });
        
        const title = this.titleDatabase[titleId];
        
        socket.emit('title:set_active', {
            titleId,
            title,
            oldTitle,
            buffs: title.buffs
        });
        
        // Notify nearby players of title change
        const player = this.server.players.get(socket.playerId);
        if (player) {
            this.io.to(`zone:${player.zone || 'default'}`).emit('player:title_changed', {
                playerId: socket.playerId,
                playerName: player.name,
                title: this.formatTitle(player.name, title)
            });
        }
        
        console.log(`[TitleManager] ${player?.name} equipou ${title.name}`);
    }
    
    handleClearTitle(socket) {
        const playerData = this.getOrCreatePlayerTitles(socket.playerId);
        playerData.activeTitle = null;
        
        socket.emit('title:cleared');
    }
    
    handleCheckUnlocks(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const playerData = this.getOrCreatePlayerTitles(socket.playerId);
        const newlyUnlocked = [];
        
        // Check all titles for unlocks
        for (const [id, title] of Object.entries(this.titleDatabase)) {
            if (playerData.unlockedTitles.includes(id)) continue;
            
            if (this.checkRequirements(player, title.unlockRequirement, data)) {
                playerData.unlockedTitles.push(id);
                newlyUnlocked.push({ id, ...title });
            }
        }
        
        if (newlyUnlocked.length > 0) {
            socket.emit('title:new_unlocks', newlyUnlocked);
        }
        
        return newlyUnlocked;
    }
    
    // ===== UNLOCK LOGIC =====
    
    checkRequirements(player, requirements, data = {}) {
        if (!requirements) return true;
        
        if (requirements.level && player.level < requirements.level) {
            return false;
        }
        
        if (requirements.achievement) {
            // Would check achievement manager
            // For now, check data passed from client
            if (!data.achievements?.includes(requirements.achievement)) {
                return false;
            }
        }
        
        if (requirements.pvpWins && (data.pvpWins || 0) < requirements.pvpWins) {
            return false;
        }
        
        if (requirements.professionLevel && (data.professionLevel || 0) < requirements.professionLevel) {
            return false;
        }
        
        if (requirements.goldEarned && (data.goldEarned || 0) < requirements.goldEarned) {
            return false;
        }
        
        if (requirements.friends && (data.friends || 0) < requirements.friends) {
            return false;
        }
        
        if (requirements.guildLeader && !data.isGuildLeader) {
            return false;
        }
        
        if (requirements.zonesDiscovered && (data.zonesDiscovered || 0) < requirements.zonesDiscovered) {
            return false;
        }
        
        if (requirements.accountAge && (data.accountAge || 0) < requirements.accountAge) {
            return false;
        }
        
        if (requirements.betaParticipant && !data.betaParticipant) {
            return false;
        }
        
        return true;
    }
    
    unlockTitle(playerId, titleId) {
        const playerData = this.getOrCreatePlayerTitles(playerId);
        
        if (playerData.unlockedTitles.includes(titleId)) {
            return null;
        }
        
        const title = this.titleDatabase[titleId];
        if (!title) return null;
        
        playerData.unlockedTitles.push(titleId);
        
        // Notify player
        const player = this.server.players.get(playerId);
        const socket = player?.socket;
        if (socket) {
            socket.emit('title:unlocked', { id: titleId, ...title });
        }
        
        console.log(`[TitleManager] ${player?.name} desbloqueou ${title.name}`);
        
        return title;
    }
    
    // ===== FORMATTING =====
    
    formatTitle(playerName, title) {
        if (!title) return playerName;
        
        if (title.prefix) {
            return `${title.name} ${playerName}`;
        } else if (title.suffix) {
            return `${playerName}, ${title.name}`;
        }
        
        return playerName;
    }
    
    getFormattedName(playerId, playerName) {
        const playerData = this.playerTitles.get(playerId);
        if (!playerData?.activeTitle) return playerName;
        
        const title = this.titleDatabase[playerData.activeTitle];
        if (!title) return playerName;
        
        return this.formatTitle(playerName, title);
    }
    
    // ===== BUFFS =====
    
    getActiveBuffs(playerId) {
        const playerData = this.playerTitles.get(playerId);
        if (!playerData?.activeTitle) return {};
        
        const title = this.titleDatabase[playerData.activeTitle];
        return title?.buffs || {};
    }
    
    calculateBuffedStat(playerId, statName, baseValue) {
        const buffs = this.getActiveBuffs(playerId);
        const buff = buffs[statName];
        
        if (!buff) return baseValue;
        
        if (typeof buff === 'number') {
            if (buff < 1) {
                // Percentage buff
                return baseValue * (1 + buff);
            } else {
                // Flat buff
                return baseValue + buff;
            }
        }
        
        return baseValue;
    }
    
    // ===== API =====
    
    getPlayerTitles(playerId) {
        return this.playerTitles.get(playerId);
    }
    
    getAllTitles() {
        return this.titleDatabase;
    }
    
    getTitle(titleId) {
        return this.titleDatabase[titleId];
    }
    
    // ===== AUTO-UNLOCK CHECKS =====
    
    onLevelUp(playerId, newLevel) {
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        const data = { level: newLevel };
        this.checkUnlocksForPlayer(playerId, data);
    }
    
    onAchievementUnlock(playerId, achievementId) {
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        const data = { achievements: [achievementId] };
        this.checkUnlocksForPlayer(playerId, data);
    }
    
    onPvPWin(playerId, totalWins) {
        const data = { pvpWins: totalWins };
        this.checkUnlocksForPlayer(playerId, data);
    }
    
    checkUnlocksForPlayer(playerId, data) {
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        const playerData = this.getOrCreatePlayerTitles(playerId);
        const newlyUnlocked = [];
        
        for (const [id, title] of Object.entries(this.titleDatabase)) {
            if (playerData.unlockedTitles.includes(id)) continue;
            
            if (this.checkRequirements(player, title.unlockRequirement, data)) {
                this.unlockTitle(playerId, id);
                newlyUnlocked.push(id);
            }
        }
        
        return newlyUnlocked;
    }
}

module.exports = TitleManager;
