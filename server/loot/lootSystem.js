/**
 * Loot System - Item Drops and Reward Management
 * Handles monster loot, treasure chests, and reward distribution
 * Version 0.3 - First Playable Gameplay Systems
 */

class LootSystem {
    constructor(server) {
        this.server = server;
        
        // Loot configuration
        this.config = {
            dropRates: {
                common: 0.7,    // 70%
                uncommon: 0.2,  // 20%
                rare: 0.08,     // 8%
                epic: 0.019,    // 1.9%
                legendary: 0.001 // 0.1%
            },
            goldDropRange: {
                min: 10,
                max: 1000
            },
            maxDropsPerKill: 5,
            personalLootRadius: 50,
            lootDespawnTime: 300000, // 5 minutes
            groupLootSharing: true,
            rollTimeout: 30000 // 30 seconds
        };
        
        // Item templates
        this.itemTemplates = new Map();
        this.loadItemTemplates();
        
        // Active loot objects
        this.activeLoot = new Map();
        this.pendingRolls = new Map();
        
        // Loot tables
        this.lootTables = new Map();
        this.loadLootTables();
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Start cleanup loop
        this.startCleanupLoop();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        console.log('Loot System initialized');
    }
    
    loadItemTemplates() {
        // Weapon templates
        this.itemTemplates.set('sword_common', {
            id: 'sword_common',
            name: 'Iron Sword',
            type: 'weapon',
            subtype: 'sword',
            quality: 'common',
            level: 1,
            stats: { attack: 5, defense: 0, magic: 0 },
            value: 25,
            icon: 'sword',
            description: 'A simple iron sword.'
        });
        
        this.itemTemplates.set('sword_uncommon', {
            id: 'sword_uncommon',
            name: 'Steel Sword',
            type: 'weapon',
            subtype: 'sword',
            quality: 'uncommon',
            level: 5,
            stats: { attack: 12, defense: 2, magic: 0 },
            value: 75,
            icon: 'sword',
            description: 'A well-crafted steel sword.'
        });
        
        this.itemTemplates.set('sword_rare', {
            id: 'sword_rare',
            name: 'Enchanted Sword',
            type: 'weapon',
            subtype: 'sword',
            quality: 'rare',
            level: 10,
            stats: { attack: 25, defense: 5, magic: 10 },
            value: 250,
            icon: 'sword',
            description: 'A sword imbued with magical energy.'
        });
        
        // Armor templates
        this.itemTemplates.set('armor_common', {
            id: 'armor_common',
            name: 'Leather Armor',
            type: 'armor',
            subtype: 'chest',
            quality: 'common',
            level: 1,
            stats: { attack: 0, defense: 8, magic: 0 },
            value: 30,
            icon: 'armor',
            description: 'Basic leather armor.'
        });
        
        this.itemTemplates.set('armor_uncommon', {
            id: 'armor_uncommon',
            name: 'Chain Mail',
            type: 'armor',
            subtype: 'chest',
            quality: 'uncommon',
            level: 8,
            stats: { attack: 0, defense: 20, magic: 2 },
            value: 100,
            icon: 'armor',
            description: 'Interlinked chain armor.'
        });
        
        // Consumable templates
        this.itemTemplates.set('potion_health', {
            id: 'potion_health',
            name: 'Health Potion',
            type: 'consumable',
            subtype: 'potion',
            quality: 'common',
            level: 1,
            stats: { healing: 50 },
            value: 15,
            icon: 'potion',
            description: 'Restores 50 health points.',
            consumable: true,
            effect: 'heal'
        });
        
        this.itemTemplates.set('potion_mana', {
            id: 'potion_mana',
            name: 'Mana Potion',
            type: 'consumable',
            subtype: 'potion',
            quality: 'common',
            level: 1,
            stats: { mana: 30 },
            value: 20,
            icon: 'potion',
            description: 'Restores 30 mana points.',
            consumable: true,
            effect: 'restore_mana'
        });
        
        // Material templates
        this.itemTemplates.set('iron_ore', {
            id: 'iron_ore',
            name: 'Iron Ore',
            type: 'material',
            subtype: 'ore',
            quality: 'common',
            level: 1,
            stats: {},
            value: 5,
            icon: 'ore',
            description: 'Raw iron ore used for crafting.',
            stackable: true,
            maxStack: 99
        });
        
        this.itemTemplates.set('herb', {
            id: 'herb',
            name: 'Herb',
            type: 'material',
            subtype: 'herb',
            quality: 'common',
            level: 1,
            stats: {},
            value: 3,
            icon: 'herb',
            description: 'A common herb used in alchemy.',
            stackable: true,
            maxStack: 99
        });
        
        // Rare items
        this.itemTemplates.set('ring_epic', {
            id: 'ring_epic',
            name: 'Ring of Power',
            type: 'accessory',
            subtype: 'ring',
            quality: 'epic',
            level: 15,
            stats: { attack: 10, defense: 10, magic: 20 },
            value: 1000,
            icon: 'ring',
            description: 'A ring that enhances the wearer\'s abilities.'
        });
        
        this.itemTemplates.set('sword_legendary', {
            id: 'sword_legendary',
            name: 'Dragon Slayer',
            type: 'weapon',
            subtype: 'sword',
            quality: 'legendary',
            level: 25,
            stats: { attack: 100, defense: 20, magic: 30 },
            value: 5000,
            icon: 'sword',
            description: 'A legendary sword said to have slain dragons.',
            special: true
        });
    }
    
    loadLootTables() {
        // Monster loot tables
        this.lootTables.set('wolf', {
            gold: { min: 5, max: 25 },
            items: [
                { template: 'potion_health', chance: 0.1 },
                { template: 'herb', chance: 0.3 },
                { template: 'wolf_pelt', chance: 0.8 }
            ]
        });
        
        this.lootTables.set('bear', {
            gold: { min: 15, max: 50 },
            items: [
                { template: 'potion_health', chance: 0.2 },
                { template: 'armor_common', chance: 0.05 },
                { template: 'bear_claws', chance: 0.9 }
            ]
        });
        
        this.lootTables.set('goblin', {
            gold: { min: 10, max: 40 },
            items: [
                { template: 'sword_common', chance: 0.1 },
                { template: 'potion_mana', chance: 0.15 },
                { template: 'goblin_ear', chance: 0.7 }
            ]
        });
        
        // Boss loot tables
        this.lootTables.set('dragon', {
            gold: { min: 500, max: 2000 },
            items: [
                { template: 'sword_legendary', chance: 0.05 },
                { template: 'ring_epic', chance: 0.15 },
                { template: 'sword_epic', chance: 0.3 },
                { template: 'dragon_scale', chance: 0.8 }
            ],
            guaranteed: [
                { template: 'dragon_heart', count: 1 }
            ]
        });
        
        // Chest loot tables
        this.lootTables.set('chest_common', {
            gold: { min: 20, max: 100 },
            items: [
                { template: 'potion_health', chance: 0.4 },
                { template: 'potion_mana', chance: 0.3 },
                { template: 'armor_common', chance: 0.2 },
                { template: 'sword_common', chance: 0.2 }
            ]
        });
        
        this.lootTables.set('chest_rare', {
            gold: { min: 100, max: 500 },
            items: [
                { template: 'sword_rare', chance: 0.3 },
                { template: 'armor_uncommon', chance: 0.4 },
                { template: 'ring_epic', chance: 0.1 },
                { template: 'potion_health', chance: 0.5 }
            ]
        });
    }
    
    setupEventHandlers() {
        // Entity death handler
        this.server.on('entityDeath', (entityId, killerId) => {
            this.handleEntityDeath(entityId, killerId);
        });
        
        // Chest opened handler
        this.server.on('chestOpened', (chestId, playerId) => {
            this.handleChestOpened(chestId, playerId);
        });
        
        // Loot pickup handler
        this.server.on('lootPickup', (lootId, playerId) => {
            this.handleLootPickup(lootId, playerId);
        });
        
        // Roll request handler
        this.server.on('rollRequest', (rollId, playerId, choice) => {
            this.handleRollRequest(rollId, playerId, choice);
        });
    }
    
    startCleanupLoop() {
        setInterval(() => {
            this.cleanupExpiredLoot();
        }, 60000); // Check every minute
    }
    
    // Main loot generation
    generateLoot(source, killerId, location) {
        const lootTable = this.lootTables.get(source.type);
        if (!lootTable) {
            return null;
        }
        
        const loot = {
            id: this.generateLootId(),
            source: source,
            sourceId: source.id,
            location: location,
            gold: this.generateGoldDrop(lootTable),
            items: this.generateItemDrops(lootTable, source.level || 1),
            createdAt: Date.now(),
            despawnAt: Date.now() + this.config.lootDespawnTime,
            owner: killerId,
            allowedPlayers: new Set([killerId]),
            rolls: new Map()
        };
        
        // Add group members if applicable
        if (this.config.groupLootSharing) {
            this.addGroupMembers(loot, killerId);
        }
        
        // Store active loot
        this.activeLoot.set(loot.id, loot);
        
        // Notify nearby players
        this.notifyLootSpawn(loot);
        
        return loot;
    }
    
    generateGoldDrop(lootTable) {
        if (!lootTable.gold) return 0;
        
        const { min, max } = lootTable.gold;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    generateItemDrops(lootTable, sourceLevel) {
        const items = [];
        const dropCount = Math.floor(Math.random() * this.config.maxDropsPerKill) + 1;
        
        // Add guaranteed items
        if (lootTable.guaranteed) {
            for (const guaranteed of lootTable.guaranteed) {
                const item = this.createItemFromTemplate(guaranteed.template, guaranteed.count || 1);
                if (item) {
                    items.push(item);
                }
            }
        }
        
        // Add random items
        for (let i = 0; i < dropCount; i++) {
            for (const itemChance of lootTable.items) {
                if (Math.random() < itemChance.chance) {
                    const item = this.createItemFromTemplate(itemChance.template);
                    if (item) {
                        items.push(item);
                        break; // Only one item per drop chance
                    }
                }
            }
        }
        
        return items;
    }
    
    createItemFromTemplate(templateId, count = 1) {
        const template = this.itemTemplates.get(templateId);
        if (!template) {
            return null;
        }
        
        const item = JSON.parse(JSON.stringify(template)); // Deep copy
        item.id = this.generateItemId();
        item.count = count;
        item.createdAt = Date.now();
        
        // Add random variation
        if (item.stats && Object.keys(item.stats).length > 0) {
            item.stats = this.addStatVariation(item.stats);
        }
        
        return item;
    }
    
    addStatVariation(stats) {
        const variedStats = {};
        
        for (const [stat, value] of Object.entries(stats)) {
            const variation = 0.8 + (Math.random() * 0.4); // 80% to 120%
            variedStats[stat] = Math.floor(value * variation);
        }
        
        return variedStats;
    }
    
    addGroupMembers(loot, killerId) {
        // Get group members (simplified - in real implementation, check group system)
        const groupMembers = this.getGroupMembers(killerId);
        
        for (const memberId of groupMembers) {
            loot.allowedPlayers.add(memberId);
        }
    }
    
    getGroupMembers(playerId) {
        // Simplified group detection
        // In real implementation, this would query the group system
        return [];
    }
    
    // Event handlers
    handleEntityDeath(entityId, killerId) {
        const entity = this.server.worldManager.entities.get(entityId);
        if (!entity) return;
        
        const killer = this.server.worldManager.players.get(killerId);
        if (!killer) return;
        
        // Generate loot
        const loot = this.generateLoot(entity, killerId, {
            x: entity.x,
            y: entity.y
        });
        
        if (loot) {
            console.log(`Generated loot for entity ${entityId}: ${loot.items.length} items, ${loot.gold} gold`);
        }
    }
    
    handleChestOpened(chestId, playerId) {
        // Generate chest loot
        const chest = {
            id: chestId,
            type: 'chest',
            level: 10 // Chest level would be determined by chest data
        };
        
        const lootTable = Math.random() < 0.1 ? 'chest_rare' : 'chest_common';
        const loot = this.generateLoot(
            { ...chest, type: lootTable },
            playerId,
            { x: chest.x || 0, y: chest.y || 0 }
        );
        
        if (loot) {
            // Auto-distribute chest loot to opener
            this.distributeLootToPlayer(loot, playerId);
        }
    }
    
    handleLootPickup(lootId, playerId) {
        const loot = this.activeLoot.get(lootId);
        if (!loot) {
            return { success: false, message: 'Loot not found' };
        }
        
        // Check if player can pick up
        if (!loot.allowedPlayers.has(playerId)) {
            return { success: false, message: 'Cannot pick up this loot' };
        }
        
        // Check distance
        const player = this.server.worldManager.players.get(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        
        const distance = Math.sqrt(
            Math.pow(player.x - loot.location.x, 2) + 
            Math.pow(player.y - loot.location.y, 2)
        );
        
        if (distance > this.config.personalLootRadius) {
            return { success: false, message: 'Too far from loot' };
        }
        
        // Distribute loot
        return this.distributeLootToPlayer(loot, playerId);
    }
    
    async distributeLootToPlayer(loot, playerId) {
        try {
            let totalValue = 0;
            const acquiredItems = [];
            
            // Add gold
            if (loot.gold > 0) {
                await this.server.db.run(`
                    UPDATE characters SET gold = gold + ? WHERE player_id = ?
                `, [loot.gold, playerId]);
                totalValue += loot.gold;
            }
            
            // Add items
            for (const item of loot.items) {
                await this.addItemToPlayerInventory(playerId, item);
                acquiredItems.push(item);
                totalValue += item.value * (item.count || 1);
            }
            
            // Notify player
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('lootAcquired', {
                    lootId: loot.id,
                    gold: loot.gold,
                    items: acquiredItems,
                    totalValue: totalValue
                });
            }
            
            // Remove loot if fully distributed
            if (this.isLootFullyDistributed(loot)) {
                this.activeLoot.delete(loot.id);
            }
            
            console.log(`Player ${playerId} acquired loot: ${loot.gold} gold, ${acquiredItems.length} items`);
            
            return { success: true, message: 'Loot acquired successfully' };
            
        } catch (error) {
            console.error('Error distributing loot:', error);
            return { success: false, message: 'Error distributing loot' };
        }
    }
    
    async addItemToPlayerInventory(playerId, item) {
        // Check if item is stackable
        if (item.stackable) {
            // Try to stack with existing items
            await this.stackItemInInventory(playerId, item);
        } else {
            // Add as new item
            await this.addNewItemToInventory(playerId, item);
        }
    }
    
    async stackItemInInventory(playerId, item) {
        const existingItem = await this.server.db.get(`
            SELECT * FROM player_inventory 
            WHERE player_id = ? AND template_id = ? AND stack_count < max_stack
        `, [playerId, item.templateId]);
        
        if (existingItem) {
            // Add to existing stack
            const newCount = Math.min(existingItem.stack_count + item.count, existingItem.max_stack);
            const remaining = existingItem.stack_count + item.count - newCount;
            
            await this.server.db.run(`
                UPDATE player_inventory 
                SET stack_count = ? WHERE id = ?
            `, [newCount, existingItem.id]);
            
            // If there are remaining items, add as new
            if (remaining > 0) {
                item.count = remaining;
                await this.addNewItemToInventory(playerId, item);
            }
        } else {
            // Add as new stack
            await this.addNewItemToInventory(playerId, item);
        }
    }
    
    async addNewItemToInventory(playerId, item) {
        await this.server.db.run(`
            INSERT INTO player_inventory 
            (player_id, item_id, template_id, name, type, quality, level, stats, value, stack_count, max_stack) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            playerId,
            item.id,
            item.templateId || item.id,
            item.name,
            item.type,
            item.quality,
            item.level,
            JSON.stringify(item.stats),
            item.value,
            item.count || 1,
            item.maxStack || 1
        ]);
    }
    
    isLootFullyDistributed(loot) {
        // Check if all allowed players have picked up the loot
        // This is simplified - real implementation would track individual pickups
        return loot.gold === 0 && loot.items.length === 0;
    }
    
    // Roll system for rare items
    initiateRoll(loot, item, players) {
        const rollId = this.generateRollId();
        
        const roll = {
            id: rollId,
            lootId: loot.id,
            item: item,
            players: new Set(players),
            rolls: new Map(),
            startTime: Date.now(),
            timeout: Date.now() + this.config.rollTimeout,
            status: 'active'
        };
        
        this.pendingRolls.set(rollId, roll);
        
        // Notify players to roll
        for (const playerId of players) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('rollInitiated', {
                    rollId: rollId,
                    item: item,
                    timeout: this.config.rollTimeout
                });
            }
        }
        
        // Set timeout to resolve roll
        setTimeout(() => {
            this.resolveRoll(rollId);
        }, this.config.rollTimeout);
        
        return rollId;
    }
    
    handleRollRequest(rollId, playerId, choice) {
        const roll = this.pendingRolls.get(rollId);
        if (!roll || roll.status !== 'active') {
            return;
        }
        
        if (!roll.players.has(playerId)) {
            return;
        }
        
        if (choice === 'need') {
            const rollValue = Math.floor(Math.random() * 100) + 1;
            roll.rolls.set(playerId, { type: 'need', value: rollValue });
        } else if (choice === 'greed') {
            const rollValue = Math.floor(Math.random() * 100) + 1;
            roll.rolls.set(playerId, { type: 'greed', value: rollValue });
        } else if (choice === 'pass') {
            roll.rolls.set(playerId, { type: 'pass', value: 0 });
        }
        
        // Check if all players have rolled
        if (roll.rolls.size === roll.players.size) {
            this.resolveRoll(rollId);
        }
    }
    
    resolveRoll(rollId) {
        const roll = this.pendingRolls.get(rollId);
        if (!roll || roll.status !== 'active') {
            return;
        }
        
        roll.status = 'resolved';
        
        // Find winner
        let winner = null;
        let highestRoll = -1;
        
        for (const [playerId, playerRoll] of roll.rolls) {
            if (playerRoll.type === 'pass') continue;
            
            // Need rolls beat greed rolls
            if (playerRoll.type === 'need' && (!winner || roll.rolls.get(winner).type !== 'need')) {
                winner = playerId;
                highestRoll = playerRoll.value;
            } else if (playerRoll.type === 'need' && roll.rolls.get(winner).type === 'need') {
                if (playerRoll.value > highestRoll) {
                    winner = playerId;
                    highestRoll = playerRoll.value;
                }
            } else if (playerRoll.type === 'greed' && (!winner || roll.rolls.get(winner).type === 'pass')) {
                winner = playerId;
                highestRoll = playerRoll.value;
            } else if (playerRoll.type === 'greed' && roll.rolls.get(winner).type === 'greed') {
                if (playerRoll.value > highestRoll) {
                    winner = playerId;
                    highestRoll = playerRoll.value;
                }
            }
        }
        
        // Award item to winner
        if (winner) {
            this.distributeLootToPlayer(
                this.activeLoot.get(roll.lootId),
                winner
            );
            
            // Notify all players
            for (const playerId of roll.players) {
                const socket = this.server.getPlayerSocket(playerId);
                if (socket) {
                    socket.emit('rollResolved', {
                        rollId: rollId,
                        winner: winner,
                        rolls: Array.from(roll.rolls.entries())
                    });
                }
            }
        }
        
        // Clean up
        this.pendingRolls.delete(rollId);
    }
    
    // Notification system
    notifyLootSpawn(loot) {
        const nearbyPlayers = this.server.worldManager.getNearbyPlayers(
            loot.location.x,
            loot.location.y,
            100
        );
        
        for (const player of nearbyPlayers) {
            if (loot.allowedPlayers.has(player.id)) {
                const socket = this.server.getPlayerSocket(player.id);
                if (socket) {
                    socket.emit('lootSpawned', {
                        lootId: loot.id,
                        location: loot.location,
                        gold: loot.gold,
                        itemCount: loot.items.length,
                        canPickup: true
                    });
                }
            }
        }
    }
    
    // Cleanup
    cleanupExpiredLoot() {
        const now = Date.now();
        const expiredLoot = [];
        
        for (const [lootId, loot] of this.activeLoot) {
            if (now >= loot.despawnAt) {
                expiredLoot.push(lootId);
            }
        }
        
        for (const lootId of expiredLoot) {
            this.activeLoot.delete(lootId);
            console.log(`Despawned expired loot: ${lootId}`);
        }
        
        // Clean up expired rolls
        const expiredRolls = [];
        for (const [rollId, roll] of this.pendingRolls) {
            if (now >= roll.timeout) {
                expiredRolls.push(rollId);
            }
        }
        
        for (const rollId of expiredRolls) {
            this.resolveRoll(rollId);
        }
    }
    
    // Utility methods
    generateLootId() {
        return 'loot_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateItemId() {
        return 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateRollId() {
        return 'roll_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    determineItemQuality() {
        const roll = Math.random();
        let cumulative = 0;
        
        for (const [quality, chance] of Object.entries(this.config.dropRates)) {
            cumulative += chance;
            if (roll < cumulative) {
                return quality;
            }
        }
        
        return 'common';
    }
    
    // Public API
    getLoot(lootId) {
        return this.activeLoot.get(lootId);
    }
    
    getPlayerLoot(playerId) {
        const playerLoot = [];
        
        for (const loot of this.activeLoot.values()) {
            if (loot.allowedPlayers.has(playerId)) {
                playerLoot.push({
                    id: loot.id,
                    location: loot.location,
                    gold: loot.gold,
                    itemCount: loot.items.length,
                    canPickup: true,
                    timeRemaining: loot.despawnAt - Date.now()
                });
            }
        }
        
        return playerLoot;
    }
    
    getItemTemplate(templateId) {
        return this.itemTemplates.get(templateId);
    }
    
    addItemTemplate(template) {
        this.itemTemplates.set(template.id, template);
    }
    
    addLootTable(name, table) {
        this.lootTables.set(name, table);
    }
    
    getLootStats() {
        const stats = {
            activeLoot: this.activeLoot.size,
            pendingRolls: this.pendingRolls.size,
            totalItemsDropped: 0,
            totalGoldDropped: 0
        };
        
        for (const loot of this.activeLoot.values()) {
            stats.totalItemsDropped += loot.items.length;
            stats.totalGoldDropped += loot.gold;
        }
        
        return stats;
    }
    
    // Cleanup
    cleanup() {
        this.activeLoot.clear();
        this.pendingRolls.clear();
        
        console.log('Loot System cleanup complete');
    }
}

module.exports = LootSystem;
