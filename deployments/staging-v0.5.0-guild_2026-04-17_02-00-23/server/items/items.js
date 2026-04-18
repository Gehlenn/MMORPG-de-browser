/**
 * Item System - Item Definitions and Management
 * Handles item creation, stats, and item database
 * Version 0.3.2 - Character Progression Systems
 */

class ItemSystem {
    constructor(server) {
        this.server = server;
        
        // Item database
        this.items = new Map();
        this.itemTemplates = new Map();
        
        // Item configuration
        this.config = {
            maxInventorySize: 24,
            maxStackSize: 99,
            itemDropChance: 0.7,
            rareItemChance: 0.1,
            epicItemChance: 0.01,
            legendaryItemChance: 0.001
        };
        
        // Item types
        this.itemTypes = {
            weapon: { name: 'Arma', slot: 'weapon' },
            helmet: { name: 'Elmo', slot: 'helmet' },
            armor: { name: 'Armadura', slot: 'armor' },
            gloves: { name: 'Luvas', slot: 'gloves' },
            boots: { name: 'Botas', slot: 'boots' },
            ring: { name: 'Anel', slot: 'ring' },
            amulet: { name: 'Amuleto', slot: 'amulet' },
            consumable: { name: 'Consumível', slot: null },
            material: { name: 'Material', slot: null },
            quest: { name: 'Quest', slot: null }
        };
        
        // Rarity system
        this.rarities = {
            common: { 
                name: 'Comum', 
                color: '#ffffff', 
                dropChance: 0.7,
                statMultiplier: 1.0
            },
            uncommon: { 
                name: 'Incomum', 
                color: '#00ff00', 
                dropChance: 0.2,
                statMultiplier: 1.2
            },
            rare: { 
                name: 'Raro', 
                color: '#0080ff', 
                dropChance: 0.08,
                statMultiplier: 1.5
            },
            epic: { 
                name: 'Épico', 
                color: '#8000ff', 
                dropChance: 0.019,
                statMultiplier: 2.0
            },
            legendary: { 
                name: 'Lendário', 
                color: '#ff8000', 
                dropChance: 0.001,
                statMultiplier: 3.0
            }
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        this.loadItemTemplates();
        this.setupEventHandlers();
        console.log('Item System initialized');
    }
    
    loadItemTemplates() {
        // Weapons
        this.createItemTemplate('wooden_sword', {
            name: 'Espada de Madeira',
            type: 'weapon',
            rarity: 'common',
            levelRequirement: 1,
            stats: { attack: 5 },
            description: 'Uma espada simples feita de madeira.',
            icon: '⚔️',
            value: 10
        });
        
        this.createItemTemplate('iron_sword', {
            name: 'Espada de Ferro',
            type: 'weapon',
            rarity: 'uncommon',
            levelRequirement: 5,
            stats: { attack: 12 },
            description: 'Uma espada de ferro bem balanceada.',
            icon: '⚔️',
            value: 50
        });
        
        this.createItemTemplate('steel_sword', {
            name: 'Espada de Aço',
            type: 'weapon',
            rarity: 'rare',
            levelRequirement: 10,
            stats: { attack: 25, critChance: 0.05 },
            description: 'Uma espada de aço afiada e resistente.',
            icon: '⚔️',
            value: 200
        });
        
        this.createItemTemplate('legendary_blade', {
            name: 'Lâmina Lendária',
            type: 'weapon',
            rarity: 'legendary',
            levelRequirement: 20,
            stats: { attack: 50, critChance: 0.15, critDamage: 0.25 },
            description: 'Uma lâmina lendária forjada em fogo divino.',
            icon: '⚔️',
            value: 2000
        });
        
        // Armor
        this.createItemTemplate('leather_armor', {
            name: 'Armadura de Couro',
            type: 'armor',
            rarity: 'common',
            levelRequirement: 1,
            stats: { defense: 8 },
            description: 'Armadura simples de couro.',
            icon: '🦺',
            value: 15
        });
        
        this.createItemTemplate('iron_armor', {
            name: 'Armadura de Ferro',
            type: 'armor',
            rarity: 'uncommon',
            levelRequirement: 6,
            stats: { defense: 20, health: 15 },
            description: 'Armadura de ferro robusta.',
            icon: '🦺',
            value: 80
        });
        
        this.createItemTemplate('steel_armor', {
            name: 'Armadura de Aço',
            type: 'armor',
            rarity: 'rare',
            levelRequirement: 12,
            stats: { defense: 40, health: 30 },
            description: 'Armadura de aço resistente.',
            icon: '🦺',
            value: 300
        });
        
        // Helmets
        this.createItemTemplate('leather_helmet', {
            name: 'Elmo de Couro',
            type: 'helmet',
            rarity: 'common',
            levelRequirement: 1,
            stats: { defense: 3 },
            description: 'Elmo simples de couro.',
            icon: '🪖',
            value: 8
        });
        
        this.createItemTemplate('iron_helmet', {
            name: 'Elmo de Ferro',
            type: 'helmet',
            rarity: 'uncommon',
            levelRequirement: 5,
            stats: { defense: 8, health: 5 },
            description: 'Elmo de ferro protetor.',
            icon: '🪖',
            value: 40
        });
        
        // Gloves
        this.createItemTemplate('leather_gloves', {
            name: 'Luvas de Couro',
            type: 'gloves',
            rarity: 'common',
            levelRequirement: 1,
            stats: { attack: 2, defense: 2 },
            description: 'Luvas simples de couro.',
            icon: '🧤',
            value: 6
        });
        
        this.createItemTemplate('iron_gloves', {
            name: 'Luvas de Ferro',
            type: 'gloves',
            rarity: 'uncommon',
            levelRequirement: 4,
            stats: { attack: 5, defense: 5 },
            description: 'Luvas de ferro reforçadas.',
            icon: '🧤',
            value: 30
        });
        
        // Boots
        this.createItemTemplate('leather_boots', {
            name: 'Botas de Couro',
            type: 'boots',
            rarity: 'common',
            levelRequirement: 1,
            stats: { defense: 3, speed: 5 },
            description: 'Botas confortáveis de couro.',
            icon: '👢',
            value: 7
        });
        
        this.createItemTemplate('iron_boots', {
            name: 'Botas de Ferro',
            type: 'boots',
            rarity: 'uncommon',
            levelRequirement: 4,
            stats: { defense: 7, speed: 3 },
            description: 'Botas de ferro resistentes.',
            icon: '👢',
            value: 35
        });
        
        // Accessories
        this.createItemTemplate('simple_ring', {
            name: 'Anel Simples',
            type: 'ring',
            rarity: 'common',
            levelRequirement: 3,
            stats: { attack: 3, defense: 3 },
            description: 'Um anel simples com propriedades mágicas.',
            icon: '💍',
            value: 25
        });
        
        this.createItemTemplate('magic_amulet', {
            name: 'Amuleto Mágico',
            type: 'amulet',
            rarity: 'rare',
            levelRequirement: 8,
            stats: { health: 20, mana: 15 },
            description: 'Amuleto com poderes mágicos.',
            icon: '📿',
            value: 150
        });
        
        // Consumables
        this.createItemTemplate('health_potion', {
            name: 'Poção de Vida',
            type: 'consumable',
            rarity: 'common',
            levelRequirement: 1,
            stats: { healthRestore: 50 },
            description: 'Restaura 50 pontos de vida.',
            icon: '🧪',
            value: 20,
            consumable: true,
            effect: 'heal'
        });
        
        this.createItemTemplate('mana_potion', {
            name: 'Poção de Mana',
            type: 'consumable',
            rarity: 'common',
            levelRequirement: 1,
            stats: { manaRestore: 30 },
            description: 'Restaura 30 pontos de mana.',
            icon: '🧪',
            value: 15,
            consumable: true,
            effect: 'mana'
        });
        
        this.createItemTemplate('strength_potion', {
            name: 'Poção de Força',
            type: 'consumable',
            rarity: 'uncommon',
            levelRequirement: 5,
            stats: { attackBoost: 10, duration: 60000 },
            description: 'Aumenta o ataque em 10 por 60 segundos.',
            icon: '🧪',
            value: 50,
            consumable: true,
            effect: 'buff'
        });
        
        // Materials
        this.createItemTemplate('iron_ore', {
            name: 'Minério de Ferro',
            type: 'material',
            rarity: 'common',
            levelRequirement: 1,
            description: 'Minério de ferro usado para forjamento.',
            icon: '🔨',
            value: 5
        });
        
        this.createItemTemplate('leather', {
            name: 'Couro',
            type: 'material',
            rarity: 'common',
            levelRequirement: 1,
            description: 'Couro usado para criar armaduras.',
            icon: '🔨',
            value: 3
        });
        
        console.log(`Loaded ${this.itemTemplates.size} item templates`);
    }
    
    createItemTemplate(id, template) {
        this.itemTemplates.set(id, {
            id,
            ...template,
            createdAt: Date.now()
        });
    }
    
    setupEventHandlers() {
        this.server.on('requestInventory', (socket) => {
            this.handleRequestInventory(socket);
        });
        
        this.server.on('moveItem', (socket, data) => {
            this.handleMoveItem(socket, data);
        });
        
        this.server.on('useItem', (socket, data) => {
            this.handleUseItem(socket, data);
        });
        
        this.server.on('equipItem', (socket, data) => {
            this.handleEquipItem(socket, data);
        });
        
        this.server.on('dropItem', (socket, data) => {
            this.handleDropItem(socket, data);
        });
    }
    
    handleRequestInventory(socket) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        socket.emit('inventoryUpdate', player.inventory || []);
    }
    
    handleMoveItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { fromSlot, toSlot } = data;
        
        // Validate slots
        if (fromSlot < 0 || fromSlot >= this.config.maxInventorySize ||
            toSlot < 0 || toSlot >= this.config.maxInventorySize) {
            socket.emit('itemMoveResult', { success: false, message: 'Slot inválido' });
            return;
        }
        
        // Initialize inventory if needed
        if (!player.inventory) {
            player.inventory = new Array(this.config.maxInventorySize).fill(null);
        }
        
        // Move items
        const tempItem = player.inventory[toSlot];
        player.inventory[toSlot] = player.inventory[fromSlot];
        player.inventory[fromSlot] = tempItem;
        
        // Save to database
        this.savePlayerInventory(socket.playerId);
        
        // Send updated inventory
        socket.emit('inventoryUpdate', player.inventory);
        socket.emit('itemMoveResult', { success: true });
    }
    
    handleUseItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { slotIndex } = data;
        const item = player.inventory?.[slotIndex];
        
        if (!item) {
            socket.emit('itemUseResult', { success: false, message: 'Item não encontrado' });
            return;
        }
        
        if (item.type !== 'consumable') {
            socket.emit('itemUseResult', { success: false, message: 'Item não é consumível' });
            return;
        }
        
        const template = this.itemTemplates.get(item.id);
        if (!template) return;
        
        // Apply item effect
        this.applyConsumableEffect(player, template);
        
        // Remove item from inventory
        if (item.quantity > 1) {
            item.quantity--;
        } else {
            player.inventory[slotIndex] = null;
        }
        
        // Save and update
        this.savePlayerInventory(socket.playerId);
        socket.emit('inventoryUpdate', player.inventory);
        socket.emit('itemUseResult', { success: true, effect: template.effect });
    }
    
    handleEquipItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { slotIndex } = data;
        const item = player.inventory?.[slotIndex];
        
        if (!item) {
            socket.emit('itemEquipResult', { success: false, message: 'Item não encontrado' });
            return;
        }
        
        const template = this.itemTemplates.get(item.id);
        if (!template) return;
        
        const itemType = this.itemTypes[template.type];
        if (!itemType || !itemType.slot) {
            socket.emit('itemEquipResult', { success: false, message: 'Item não pode ser equipado' });
            return;
        }
        
        // Initialize equipment if needed
        if (!player.equipment) {
            player.equipment = {};
        }
        
        // Unequip current item if exists
        const currentItem = player.equipment[itemType.slot];
        if (currentItem) {
            const emptySlot = this.findEmptyInventorySlot(player);
            if (emptySlot === -1) {
                socket.emit('itemEquipResult', { success: false, message: 'Inventário cheio' });
                return;
            }
            player.inventory[emptySlot] = currentItem;
        }
        
        // Equip new item
        player.equipment[itemType.slot] = item;
        player.inventory[slotIndex] = null;
        
        // Update player stats
        this.updatePlayerStats(player);
        
        // Save and update
        this.savePlayerInventory(socket.playerId);
        this.savePlayerEquipment(socket.playerId);
        
        socket.emit('inventoryUpdate', player.inventory);
        socket.emit('equipmentUpdate', player.equipment);
        socket.emit('playerStatsUpdate', this.getPlayerStats(player));
        socket.emit('itemEquipResult', { success: true });
    }
    
    handleDropItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { slotIndex } = data;
        const item = player.inventory?.[slotIndex];
        
        if (!item) {
            socket.emit('itemDropResult', { success: false, message: 'Item não encontrado' });
            return;
        }
        
        // Create loot entity in world
        const lootId = `loot_${Date.now()}_${Math.random()}`;
        this.server.entities.set(lootId, {
            id: lootId,
            type: 'loot',
            x: player.x,
            y: player.y,
            items: [item],
            ownerId: socket.playerId,
            createdAt: Date.now(),
            expiresAt: Date.now() + 60000 // 1 minute expiration
        });
        
        // Remove from inventory
        player.inventory[slotIndex] = null;
        
        // Save and update
        this.savePlayerInventory(socket.playerId);
        socket.emit('inventoryUpdate', player.inventory);
        socket.emit('itemDropResult', { success: true });
        
        // Broadcast loot drop
        this.broadcastLootDrop(lootId, player.x, player.y, item);
    }
    
    applyConsumableEffect(player, template) {
        switch (template.effect) {
            case 'heal':
                player.health = Math.min(player.health + (template.stats.healthRestore || 0), player.maxHealth);
                break;
            case 'mana':
                player.mana = Math.min(player.mana + (template.stats.manaRestore || 0), player.maxMana);
                break;
            case 'buff':
                // Apply temporary buff (simplified)
                player.attack += (template.stats.attackBoost || 0);
                setTimeout(() => {
                    player.attack -= (template.stats.attackBoost || 0);
                }, template.stats.duration || 30000);
                break;
        }
    }
    
    updatePlayerStats(player) {
        // Reset to base stats
        const baseStats = {
            attack: player.baseAttack || 10,
            defense: player.baseDefense || 5,
            health: player.baseHealth || 100,
            mana: player.baseMana || 50
        };
        
        // Apply equipment bonuses
        if (player.equipment) {
            for (const [slot, item] of Object.entries(player.equipment)) {
                const template = this.itemTemplates.get(item.id);
                if (template && template.stats) {
                    for (const [stat, value] of Object.entries(template.stats)) {
                        if (baseStats[stat] !== undefined) {
                            baseStats[stat] += value;
                        }
                    }
                }
            }
        }
        
        // Update player stats
        player.attack = baseStats.attack;
        player.defense = baseStats.defense;
        player.maxHealth = baseStats.health;
        player.maxMana = baseStats.mana;
        
        // Calculate gear score
        player.gearScore = this.calculateGearScore(player);
    }
    
    calculateGearScore(player) {
        if (!player.equipment) return 0;
        
        let score = 0;
        for (const item of Object.values(player.equipment)) {
            const template = this.itemTemplates.get(item.id);
            if (template && template.stats) {
                for (const value of Object.values(template.stats)) {
                    score += Math.abs(value);
                }
            }
        }
        
        return score;
    }
    
    getPlayerStats(player) {
        return {
            attack: player.attack,
            defense: player.defense,
            health: player.health,
            maxHealth: player.maxHealth,
            mana: player.mana,
            maxMana: player.maxMana,
            gearScore: player.gearScore || 0
        };
    }
    
    findEmptyInventorySlot(player) {
        if (!player.inventory) return -1;
        return player.inventory.findIndex(slot => !slot);
    }
    
    generateLoot(mobLevel, mobType) {
        const loot = [];
        
        // Gold
        if (Math.random() < 0.8) {
            const goldAmount = Math.floor(mobLevel * (5 + Math.random() * 10));
            loot.push({
                id: 'gold',
                name: 'Gold',
                type: 'currency',
                quantity: goldAmount,
                value: goldAmount
            });
        }
        
        // Items
        if (Math.random() < this.config.itemDropChance) {
            const rarity = this.rollRarity();
            const itemTemplate = this.getRandomItemTemplate(mobLevel, rarity);
            
            if (itemTemplate) {
                loot.push(this.createItemInstance(itemTemplate.id, rarity));
            }
        }
        
        return loot;
    }
    
    rollRarity() {
        const roll = Math.random();
        let cumulative = 0;
        
        for (const [rarity, data] of Object.entries(this.rarities)) {
            cumulative += data.dropChance;
            if (roll <= cumulative) {
                return rarity;
            }
        }
        
        return 'common';
    }
    
    getRandomItemTemplate(level, rarity) {
        const suitableItems = Array.from(this.itemTemplates.values())
            .filter(item => 
                (item.levelRequirement || 0) <= level &&
                (!item.rarity || item.rarity === rarity)
            );
        
        if (suitableItems.length === 0) return null;
        
        return suitableItems[Math.floor(Math.random() * suitableItems.length)];
    }
    
    createItemInstance(templateId, rarity = null) {
        const template = this.itemTemplates.get(templateId);
        if (!template) return null;
        
        const item = {
            id: template.id,
            name: template.name,
            type: template.type,
            rarity: rarity || template.rarity || 'common',
            levelRequirement: template.levelRequirement || 1,
            description: template.description,
            icon: template.icon,
            value: template.value || 0,
            quantity: 1,
            stats: { ...template.stats }
        };
        
        // Apply rarity multiplier to stats
        if (rarity && this.rarities[rarity]) {
            const multiplier = this.rarities[rarity].statMultiplier;
            for (const [stat, value] of Object.entries(item.stats)) {
                if (typeof value === 'number') {
                    item.stats[stat] = Math.floor(value * multiplier);
                }
            }
        }
        
        return item;
    }
    
    giveItemToPlayer(playerId, itemTemplateId, quantity = 1) {
        const player = this.server.players.get(playerId);
        if (!player) return false;
        
        const item = this.createItemInstance(itemTemplateId);
        if (!item) return false;
        
        item.quantity = quantity;
        
        // Initialize inventory if needed
        if (!player.inventory) {
            player.inventory = new Array(this.config.maxInventorySize).fill(null);
        }
        
        // Try to stack with existing items
        if (item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'helmet' && 
            item.type !== 'gloves' && item.type !== 'boots' && item.type !== 'ring' && 
            item.type !== 'amulet') {
            
            for (let i = 0; i < this.config.maxInventorySize; i++) {
                const existingItem = player.inventory[i];
                if (existingItem && existingItem.id === item.id && existingItem.quantity < this.config.maxStackSize) {
                    const canAdd = Math.min(quantity, this.config.maxStackSize - existingItem.quantity);
                    existingItem.quantity += canAdd;
                    quantity -= canAdd;
                    
                    if (quantity <= 0) {
                        this.savePlayerInventory(playerId);
                        return true;
                    }
                }
            }
        }
        
        // Add to empty slots
        while (quantity > 0) {
            const emptySlot = this.findEmptyInventorySlot(player);
            if (emptySlot === -1) {
                // Inventory full
                return false;
            }
            
            const stackSize = Math.min(quantity, this.config.maxStackSize);
            player.inventory[emptySlot] = { ...item, quantity: stackSize };
            quantity -= stackSize;
        }
        
        this.savePlayerInventory(playerId);
        return true;
    }
    
    broadcastLootDrop(lootId, x, y, item) {
        const nearbyPlayers = this.getNearbyPlayers(x, y, 200);
        
        for (const playerId of nearbyPlayers) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('lootDropped', {
                    lootId: lootId,
                    x: x,
                    y: y,
                    item: item
                });
            }
        }
    }
    
    getNearbyPlayers(x, y, range) {
        const nearby = [];
        
        for (const [playerId, player] of this.server.players) {
            if (!player.name) continue;
            
            const distance = Math.sqrt(
                Math.pow(x - player.x, 2) + 
                Math.pow(y - player.y, 2)
            );
            
            if (distance <= range) {
                nearby.push(playerId);
            }
        }
        
        return nearby;
    }
    
    // Database operations
    async savePlayerInventory(playerId) {
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        try {
            const inventoryJson = JSON.stringify(player.inventory || []);
            await this.server.database.run(
                'UPDATE characters SET inventory = ? WHERE player_id = ?',
                [inventoryJson, playerId]
            );
        } catch (error) {
            console.error('Error saving player inventory:', error);
        }
    }
    
    async savePlayerEquipment(playerId) {
        const player = this.server.players.get(playerId);
        if (!player) return;
        
        try {
            const equipmentJson = JSON.stringify(player.equipment || {});
            await this.server.database.run(
                'UPDATE characters SET equipment = ? WHERE player_id = ?',
                [equipmentJson, playerId]
            );
        } catch (error) {
            console.error('Error saving player equipment:', error);
        }
    }
    
    async loadPlayerInventory(playerId) {
        try {
            const row = await this.server.database.get(
                'SELECT inventory FROM characters WHERE player_id = ?',
                [playerId]
            );
            
            if (row && row.inventory) {
                return JSON.parse(row.inventory);
            }
        } catch (error) {
            console.error('Error loading player inventory:', error);
        }
        
        return new Array(this.config.maxInventorySize).fill(null);
    }
    
    async loadPlayerEquipment(playerId) {
        try {
            const row = await this.server.database.get(
                'SELECT equipment FROM characters WHERE player_id = ?',
                [playerId]
            );
            
            if (row && row.equipment) {
                return JSON.parse(row.equipment);
            }
        } catch (error) {
            console.error('Error loading player equipment:', error);
        }
        
        return {};
    }
    
    // Public API
    getItemTemplate(id) {
        return this.itemTemplates.get(id);
    }
    
    getAllItemTemplates() {
        return Array.from(this.itemTemplates.values());
    }
    
    getItemsByType(type) {
        return Array.from(this.itemTemplates.values()).filter(item => item.type === type);
    }
    
    getItemsByRarity(rarity) {
        return Array.from(this.itemTemplates.values()).filter(item => item.rarity === rarity);
    }
    
    // Cleanup
    cleanup() {
        this.items.clear();
        this.itemTemplates.clear();
        console.log('Item System cleanup complete');
    }
}

module.exports = ItemSystem;
