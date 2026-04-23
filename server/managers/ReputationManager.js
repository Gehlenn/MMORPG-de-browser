/**
 * ReputationManager - Sistema de Reputação e Facções
 * 
 * Features:
 * - Múltiplas facções com reputação independente
 * - Níveis de reputação (Odiado → Exaltado)
 * - Recompensas por nível de reputação
 * - Quests específicas de facção
 * - Descontos em mercadores aliados
 * - Territórios controlados por facções
 * - Guerras/alianças entre facções
 */

class ReputationManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Player reputation storage
        this.playerReputations = new Map(); // playerId -> { factionId -> reputationData }
        
        // Faction definitions
        this.factions = this.initializeFactions();
        
        // Reputation level thresholds
        this.reputationLevels = [
            { name: 'odiado', min: -10000, max: -3000, color: '#dc2626', discount: -0.5 },
            { name: 'hostil', min: -2999, max: -1000, color: '#ef4444', discount: -0.2 },
            { name: 'desconhecido', min: -999, max: 0, color: '#9ca3af', discount: 0 },
            { name: 'neutro', min: 1, max: 1000, color: '#fbbf24', discount: 0 },
            { name: 'amigavel', min: 1001, max: 3000, color: '#22c55e', discount: 0.05 },
            { name: 'honrado', min: 3001, max: 6000, color: '#16a34a', discount: 0.1 },
            { name: 'reverenciado', min: 6001, max: 10000, color: '#3b82f6', discount: 0.15 },
            { name: 'exaltado', min: 10001, max: 25000, color: '#8b5cf6', discount: 0.2 }
        ];
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        console.log('[ReputationManager] Sistema de reputação inicializado');
    }
    
    initializeFactions() {
        return {
            // Major factions
            alliance_sentinels: {
                id: 'alliance_sentinels',
                name: 'Sentinelas da Aliança',
                icon: '🛡️',
                description: 'Defensores da ordem e da justiça. Protegem as cidades e comércio justo.',
                startingReputation: 0,
                category: 'major',
                territory: ['eldoria', 'verdantis'],
                enemies: ['shadow_legion', 'pirate_coast'],
                rewards: {
                    amigavel: { items: ['sentinel_badge'], discount: 0.05 },
                    honrado: { items: ['sentinel_cape', 'alliance_tabard'], mount: 'horse_alliance' },
                    reverenciado: { items: ['sentinel_armor_set'], title: 'Defensor da Aliança' },
                    exaltado: { items: ['exalted_sentinel_blade'], discount: 0.2, special: 'alliance_champion' }
                }
            },
            
            shadow_legion: {
                id: 'shadow_legion',
                name: 'Legião das Sombras',
                icon: '⚔️',
                description: 'Guerreiros que buscam poder através da força. Não se importam com métodos.',
                startingReputation: -1000, // Hostile start
                category: 'major',
                territory: ['dracônia', 'shadowlands'],
                enemies: ['alliance_sentinels', 'light_temple'],
                rewards: {
                    amigavel: { items: ['shadow_cloak'], discount: 0.05 },
                    honrado: { items: ['shadow_blade', 'legion_tabard'], mount: 'wolf_shadow' },
                    reverenciado: { items: ['shadow_armor_set'], title: 'Legionário' },
                    exaltado: { items: ['exalted_shadow_reaver'], discount: 0.2, special: 'shadow_overlord' }
                }
            },
            
            light_temple: {
                id: 'light_temple',
                name: 'Templo da Luz',
                icon: '✨',
                description: 'Seguidores da luz divina. Curandeiros e paladinos dedicados ao bem.',
                startingReputation: 0,
                category: 'major',
                territory: ['eldoria', 'sanctuary'],
                enemies: ['shadow_legion', 'necromancers'],
                rewards: {
                    amigavel: { items: ['light_blessing'], discount: 0.05 },
                    honrado: { items: ['holy_symbol', 'temple_tabard'], spells: ['blessed_healing'] },
                    reverenciado: { items: ['radiant_armor_set'], title: 'Paladino da Luz' },
                    exaltado: { items: ['exalted_holy_aegis'], discount: 0.2, special: 'champion_of_light' }
                }
            },
            
            // Minor factions
            merchant_guild: {
                id: 'merchant_guild',
                name: 'Guilda dos Mercadores',
                icon: '💰',
                description: 'Comerciantes e artesãos. Controlam o comércio e oferecem os melhores preços.',
                startingReputation: 0,
                category: 'minor',
                territory: ['all_cities'],
                enemies: ['pirate_coast'],
                rewards: {
                    amigavel: { discount: 0.1 },
                    honrado: { discount: 0.15, items: ['merchant_satchel'] },
                    reverenciado: { discount: 0.2, items: ['guild_master_ring'] },
                    exaltado: { discount: 0.25, special: 'trade_prince', items: ['legendary_coin'] }
                }
            },
            
            explorer_league: {
                id: 'explorer_league',
                name: 'Liga dos Exploradores',
                icon: '🗺️',
                description: 'Aventureiros e arqueólogos. Descobrem tesouros e locais secretos.',
                startingReputation: 0,
                category: 'minor',
                territory: ['aurélia', 'ruins'],
                enemies: ['tomb_raiders'],
                rewards: {
                    amigavel: { items: ['explorer_kit'], xpBonus: 0.05 },
                    honrado: { items: ['treasure_map', 'archaeologist_tools'] },
                    reverenciado: { items: ['master_explorer_gear'], title: 'Arqueólogo' },
                    exaltado: { special: 'legendary_explorer', items: ['ancient_relic'] }
                }
            },
            
            druid_circle: {
                id: 'druid_circle',
                name: 'Círculo Druídico',
                icon: '🌿',
                description: 'Guardiões da natureza. Protegem as florestas e ensinam herbalismo.',
                startingReputation: 0,
                category: 'minor',
                territory: ['verdantis', 'forests'],
                enemies: ['defilers'],
                rewards: {
                    amigavel: { items: ['nature_seed'], herbalismBonus: 0.1 },
                    honrado: { items: ['druid_staff', 'nature_form'], spells: ['nature_heal'] },
                    reverenciado: { items: ['archdruid_robes'], title: 'Guardião da Natureza' },
                    exaltado: { special: 'archdruid', items: ['world_tree_branch'] }
                }
            },
            
            // Hostile factions (negative reputation)
            pirate_coast: {
                id: 'pirate_coast',
                name: 'Piratas da Costa',
                icon: '🏴‍☠️',
                description: 'Bandidos do mar. Atacam navios e costas.',
                startingReputation: -2000, // Hostile
                category: 'hostile',
                territory: ['aurélia_coast', 'seas'],
                enemies: ['alliance_sentinels', 'merchant_guild'],
                rewards: {
                    // Rewards for gaining positive rep with pirates
                    amigavel: { items: ['pirate_bandana'], discount: 0.05 },
                    honrado: { items: ['cutlass', 'pirate_outfit'], ship: 'small_sloop' },
                    reverenciado: { items: ['captain_hat'], title: 'Capitão' },
                    exaltado: { special: 'pirate_lord', ship: 'galleon', items: ['legendary_cutlass'] }
                }
            },
            
            // Raid factions (endgame)
            dragonsworn: {
                id: 'dragonsworn',
                name: 'Jurados do Dragão',
                icon: '🐉',
                description: 'Guerreiros que juraram lealdade aos dragões ancestrais.',
                startingReputation: 0,
                category: 'raid',
                levelRequirement: 40,
                territory: ['dracônia'],
                rewards: {
                    honrado: { items: ['dragon_scale_armor'], mount: 'drake_whelp' },
                    reverenciado: { items: ['dragon_rider_gear'], title: 'Cavaleiro de Dragão' },
                    exaltado: { special: 'dragon_aspect', items: ['dragon_artifact'] }
                }
            },
            
            // Secret faction
            secret_order: {
                id: 'secret_order',
                name: '???',
                icon: '❓',
                description: 'Uma facção misteriosa. Poucos sabem de sua existência.',
                startingReputation: -9999, // Hidden
                category: 'secret',
                hidden: true,
                territory: ['unknown'],
                rewards: {
                    exaltado: { items: ['ultimate_secret'], special: 'enlightened' }
                }
            }
        };
    }
    
    setupEventHandlers() {
        this.server.on('reputation:get_all', (socket) => {
            this.handleGetAllReputations(socket);
        });
        
        this.server.on('reputation:get_faction', (socket, data) => {
            this.handleGetFactionReputation(socket, data);
        });
        
        this.server.on('reputation:modify', (socket, data) => {
            this.handleModifyReputation(socket, data);
        });
        
        this.server.on('reputation:claim_reward', (socket, data) => {
            this.handleClaimReward(socket, data);
        });
        
        this.server.on('reputation:get_rewards', (socket, data) => {
            this.handleGetAvailableRewards(socket, data);
        });
    }
    
    // ===== PLAYER OPERATIONS =====
    
    getOrCreatePlayerReputations(playerId) {
        if (!this.playerReputations.has(playerId)) {
            const reps = {};
            
            // Initialize all factions with starting reputation
            for (const [id, faction] of Object.entries(this.factions)) {
                reps[id] = {
                    value: faction.startingReputation,
                    level: this.calculateLevel(faction.startingReputation),
                    rewardsClaimed: [],
                    discovered: !faction.hidden
                };
            }
            
            this.playerReputations.set(playerId, {
                playerId,
                reputations: reps,
                lastUpdated: Date.now()
            });
        }
        
        return this.playerReputations.get(playerId);
    }
    
    handleGetAllReputations(socket) {
        const playerData = this.getOrCreatePlayerReputations(socket.playerId);
        const result = [];
        
        for (const [factionId, repData] of Object.entries(playerData.reputations)) {
            const faction = this.factions[factionId];
            if (!faction) continue;
            
            // Don't show hidden factions until discovered
            if (faction.hidden && !repData.discovered) continue;
            
            const level = this.reputationLevels.find(l => 
                repData.value >= l.min && repData.value <= l.max
            );
            
            result.push({
                factionId,
                factionName: faction.name,
                factionIcon: faction.icon,
                value: repData.value,
                levelName: level?.name || 'neutro',
                levelColor: level?.color || '#fbbf24',
                nextLevel: this.getNextLevelInfo(repData.value),
                rewardsClaimed: repData.rewardsClaimed,
                availableRewards: this.getAvailableRewards(faction, repData),
                category: faction.category,
                enemies: faction.enemies
            });
        }
        
        socket.emit('reputation:list', result);
    }
    
    handleGetFactionReputation(socket, data) {
        const { factionId } = data;
        const playerData = this.getOrCreatePlayerReputations(socket.playerId);
        const repData = playerData.reputations[factionId];
        const faction = this.factions[factionId];
        
        if (!repData || !faction) {
            socket.emit('reputation:error', { message: 'Facção não encontrada!' });
            return;
        }
        
        const level = this.reputationLevels.find(l => 
            repData.value >= l.min && repData.value <= l.max
        );
        
        socket.emit('reputation:faction_detail', {
            factionId,
            faction: {
                name: faction.name,
                icon: faction.icon,
                description: faction.description,
                category: faction.category,
                territory: faction.territory
            },
            reputation: repData.value,
            level: level,
            rewardsClaimed: repData.rewardsClaimed,
            availableRewards: this.getAvailableRewards(faction, repData),
            history: this.getReputationHistory(socket.playerId, factionId)
        });
    }
    
    handleModifyReputation(socket, data) {
        const { factionId, amount, reason } = data;
        const playerData = this.getOrCreatePlayerReputations(socket.playerId);
        const repData = playerData.reputations[factionId];
        
        if (!repData) {
            socket.emit('reputation:error', { message: 'Facção não encontrada!' });
            return;
        }
        
        const oldValue = repData.value;
        const oldLevel = this.calculateLevel(oldValue);
        
        // Apply reputation change
        repData.value = Math.max(-10000, Math.min(25000, repData.value + amount));
        
        const newValue = repData.value;
        const newLevel = this.calculateLevel(newValue);
        
        // Check for level up
        if (newLevel.name !== oldLevel.name && amount > 0) {
            this.onReputationLevelUp(socket, factionId, newLevel);
        }
        
        // Check for level down
        if (newLevel.name !== oldLevel.name && amount < 0) {
            this.onReputationLevelDown(socket, factionId, newLevel);
        }
        
        // Propagate to enemies/allies
        this.propagateReputationChange(socket.playerId, factionId, amount);
        
        socket.emit('reputation:modified', {
            factionId,
            oldValue,
            newValue,
            change: amount,
            newLevel: newLevel.name,
            reason
        });
        
        // Notify
        const faction = this.factions[factionId];
        if (amount > 0) {
            socket.emit('notification', {
                type: 'reputation_gain',
                message: `Reputação com ${faction.name} aumentada em ${amount}`,
                icon: faction.icon
            });
        }
    }
    
    handleClaimReward(socket, data) {
        const { factionId, level } = data;
        const playerData = this.getOrCreatePlayerReputations(socket.playerId);
        const repData = playerData.reputations[factionId];
        const faction = this.factions[factionId];
        
        if (!repData || !faction || !faction.rewards[level]) {
            socket.emit('reputation:error', { message: 'Recompensa não encontrada!' });
            return;
        }
        
        // Check if already claimed
        if (repData.rewardsClaimed.includes(level)) {
            socket.emit('reputation:error', { message: 'Recompensa já resgatada!' });
            return;
        }
        
        // Check if player has required reputation
        const playerLevel = this.calculateLevel(repData.value);
        const levelIndex = this.reputationLevels.findIndex(l => l.name === level);
        const playerLevelIndex = this.reputationLevels.findIndex(l => l.name === playerLevel.name);
        
        if (playerLevelIndex < levelIndex) {
            socket.emit('reputation:error', { message: 'Reputação insuficiente!' });
            return;
        }
        
        // Mark as claimed
        repData.rewardsClaimed.push(level);
        
        // Give rewards
        const rewards = faction.rewards[level];
        const player = this.server.players.get(socket.playerId);
        
        if (rewards.items) {
            // Add items to player inventory
            for (const itemId of rewards.items) {
                // Would add to inventory
                console.log(`[Reputation] Gave item ${itemId} to ${player?.name}`);
            }
        }
        
        if (rewards.title) {
            // Would unlock title via TitleManager
        }
        
        socket.emit('reputation:reward_claimed', {
            factionId,
            level,
            rewards
        });
        
        socket.emit('notification', {
            type: 'reward_claimed',
            message: `Recompensa de ${faction.name} resgatada!`,
            icon: '🎁'
        });
    }
    
    handleGetAvailableRewards(socket, data) {
        const { factionId } = data;
        const playerData = this.getOrCreatePlayerReputations(socket.playerId);
        const repData = playerData.reputations[factionId];
        const faction = this.factions[factionId];
        
        if (!repData || !faction) {
            socket.emit('reputation:error', { message: 'Facção não encontrada!' });
            return;
        }
        
        const available = this.getAvailableRewards(faction, repData);
        
        socket.emit('reputation:available_rewards', {
            factionId,
            rewards: available
        });
    }
    
    // ===== UTILITIES =====
    
    calculateLevel(value) {
        return this.reputationLevels.find(l => value >= l.min && value <= l.max) ||
               this.reputationLevels[3]; // Default to neutral
    }
    
    getNextLevelInfo(currentValue) {
        const currentLevel = this.calculateLevel(currentValue);
        const currentIndex = this.reputationLevels.findIndex(l => l.name === currentLevel.name);
        
        if (currentIndex >= this.reputationLevels.length - 1) {
            return null; // Already at max
        }
        
        const nextLevel = this.reputationLevels[currentIndex + 1];
        const needed = nextLevel.min - currentValue;
        
        return {
            name: nextLevel.name,
            needed: needed > 0 ? needed : 0,
            color: nextLevel.color
        };
    }
    
    getAvailableRewards(faction, repData) {
        const available = [];
        const currentLevel = this.calculateLevel(repData.value);
        const currentIndex = this.reputationLevels.findIndex(l => l.name === currentLevel.name);
        
        for (const [levelName, rewards] of Object.entries(faction.rewards || {})) {
            const levelIndex = this.reputationLevels.findIndex(l => l.name === levelName);
            
            if (levelIndex <= currentIndex && !repData.rewardsClaimed.includes(levelName)) {
                available.push({ level: levelName, rewards });
            }
        }
        
        return available;
    }
    
    propagateReputationChange(playerId, factionId, amount) {
        const faction = this.factions[factionId];
        if (!faction || !faction.enemies) return;
        
        // Reputation change with enemies (opposite effect)
        for (const enemyId of faction.enemies) {
            this.modifyReputation(playerId, enemyId, -amount * 0.5, 'enemy_action');
        }
    }
    
    modifyReputation(playerId, factionId, amount, reason) {
        const playerData = this.getOrCreatePlayerReputations(playerId);
        const repData = playerData.reputations[factionId];
        
        if (!repData) return;
        
        const oldValue = repData.value;
        repData.value = Math.max(-10000, Math.min(25000, repData.value + amount));
        
        // Notify player if online
        const player = this.server.players.get(playerId);
        if (player?.socket && Math.abs(amount) >= 50) {
            player.socket.emit('reputation:modified', {
                factionId,
                oldValue,
                newValue: repData.value,
                change: amount,
                reason
            });
        }
    }
    
    onReputationLevelUp(socket, factionId, newLevel) {
        const faction = this.factions[factionId];
        
        socket.emit('reputation:level_up', {
            factionId,
            factionName: faction.name,
            newLevel: newLevel.name,
            color: newLevel.color,
            discount: newLevel.discount
        });
        
        // Check for rewards
        if (faction.rewards?.[newLevel.name]) {
            socket.emit('reputation:reward_available', {
                factionId,
                level: newLevel.name,
                rewards: faction.rewards[newLevel.name]
            });
        }
        
        // Announce major faction level ups
        if (faction.category === 'major' && ['reverenciado', 'exaltado'].includes(newLevel.name)) {
            this.io.emit('world:announcement', {
                message: `${socket.playerName || 'Um jogador'} alcançou ${newLevel.name} com ${faction.name}!`,
                icon: faction.icon,
                color: newLevel.color
            });
        }
    }
    
    onReputationLevelDown(socket, factionId, newLevel) {
        // Similar to level up but negative
    }
    
    getReputationHistory(playerId, factionId) {
        // Would return historical changes
        return [];
    }
    
    // ===== PUBLIC API =====
    
    getReputation(playerId, factionId) {
        const playerData = this.getOrCreatePlayerReputations(playerId);
        return playerData.reputations[factionId]?.value || 0;
    }
    
    getReputationLevel(playerId, factionId) {
        const value = this.getReputation(playerId, factionId);
        return this.calculateLevel(value);
    }
    
    getDiscount(playerId, factionId) {
        const level = this.getReputationLevel(playerId, factionId);
        return level.discount || 0;
    }
    
    isHostile(playerId, factionId) {
        const level = this.getReputationLevel(playerId, factionId);
        return ['odiado', 'hostil'].includes(level.name);
    }
    
    discoverFaction(playerId, factionId) {
        const playerData = this.getOrCreatePlayerReputations(playerId);
        if (playerData.reputations[factionId]) {
            playerData.reputations[factionId].discovered = true;
        }
    }
    
    // ===== EVENT TRIGGERS =====
    
    onQuestComplete(playerId, questData) {
        // Award reputation for quest faction
        if (questData.factionReward) {
            for (const [factionId, amount] of Object.entries(questData.factionReward)) {
                this.modifyReputation(playerId, factionId, amount, 'quest_complete');
            }
        }
    }
    
    onMobKill(playerId, mobData) {
        // Reputation with druid circle for killing defilers
        // Reputation loss for killing protected creatures
    }
    
    onTrade(playerId, merchantFaction, amount) {
        // Small reputation gain for trading
        this.modifyReputation(playerId, merchantFaction, Math.floor(amount / 100), 'trade');
    }
    
    onDungeonComplete(playerId, dungeonData) {
        // Reputation rewards for dungeon completions
    }
}

module.exports = ReputationManager;
