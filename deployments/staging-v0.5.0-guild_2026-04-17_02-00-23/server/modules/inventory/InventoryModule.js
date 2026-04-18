/**
 * InventoryModule - Módulo de Inventário e Equipamentos
 * Arquitetura estilo Blizzard/Riot - Feature Module
 * Controla inventário, equipamentos e loot
 */

class InventoryModule {
    constructor() {
        this.name = 'inventory';
        this.priority = 20; // Prioridade média (depois de combat)
        this.initialized = false;
        
        // Sistemas do módulo
        this.inventorySystem = null;
        this.equipmentSystem = null;
        this.lootSystem = null;
        
        // Estado do módulo
        this.playerInventories = new Map(); // playerId -> inventory data
        this.playerEquipment = new Map(); // playerId -> equipment data
        
        console.log('📦 InventoryModule created');
    }
    
    /**
     * Inicializa o módulo de inventário
     * @param {object} server - Instância do servidor
     */
    async init(server) {
        if (this.initialized) {
            console.warn('⚠️ InventoryModule already initialized');
            return;
        }
        
        console.log('📦 Initializing InventoryModule...');
        
        this.server = server;
        this.io = server.io;
        
        // Inicializar sistemas internos
        await this.initializeInventorySystem();
        await this.initializeEquipmentSystem();
        await this.initializeLootSystem();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        this.initialized = true;
        console.log('✅ InventoryModule initialized successfully');
    }
    
    /**
     * Inicializa sistema de inventário
     */
    async initializeInventorySystem() {
        const InventorySystem = require('./systems/InventorySystem');
        this.inventorySystem = new InventorySystem();
        console.log('📦 InventorySystem initialized');
    }
    
    /**
     * Inicializa sistema de equipamentos
     */
    async initializeEquipmentSystem() {
        const EquipmentSystem = require('./systems/EquipmentSystem');
        this.equipmentSystem = new EquipmentSystem();
        console.log('⚔️ EquipmentSystem initialized');
    }
    
    /**
     * Inicializa sistema de loot
     */
    async initializeLootSystem() {
        const LootSystem = require('./systems/LootSystem');
        this.lootSystem = new LootSystem();
        console.log('💰 LootSystem initialized');
    }
    
    /**
     * Setup de event handlers
     */
    setupEventHandlers() {
        // Eventos de inventário
        this.io.on('inventory_get', (socket, data) => {
            this.handleGetInventory(socket, data);
        });
        
        this.io.on('inventory_move', (socket, data) => {
            this.handleMoveItem(socket, data);
        });
        
        this.io.on('inventory_use', (socket, data) => {
            this.handleUseItem(socket, data);
        });
        
        this.io.on('inventory_drop', (socket, data) => {
            this.handleDropItem(socket, data);
        });
        
        // Eventos de equipamento
        this.io.on('equipment_equip', (socket, data) => {
            this.handleEquipItem(socket, data);
        });
        
        this.io.on('equipment_unequip', (socket, data) => {
            this.handleUnequipItem(socket, data);
        });
        
        this.io.on('equipment_swap', (socket, data) => {
            this.handleSwapItem(socket, data);
        });
        
        // Eventos de loot (integrados com combat)
        this.io.on('mobDeath', (data) => {
            this.handleMobDeath(data);
        });
        
        this.io.on('playerDeath', (data) => {
            this.handlePlayerDeath(data);
        });
        
        // Eventos de jogador
        this.io.on('playerConnected', (player) => {
            this.handlePlayerConnected(player);
        });
        
        this.io.on('playerDisconnected', (playerId) => {
            this.handlePlayerDisconnected(playerId);
        });
    }
    
    /**
     * Update do módulo
     * @param {number} delta - Delta time
     */
    update(delta) {
        if (!this.initialized) return;
        
        // Update de regeneração de HP/MP baseada em equipamentos
        this.updateEquipmentRegeneration(delta);
        
        // Processar efeitos de itens
        this.updateItemEffects(delta);
    }
    
    /**
     * Handle de obtenção de inventário
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados da requisição
     */
    handleGetInventory(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        // Criar inventário se não existir
        this.inventorySystem.createInventory(player);
        this.equipmentSystem.createEquipment(player);
        
        // Obter resumo do inventário
        const inventorySummary = this.inventorySystem.getInventorySummary(player);
        const equipmentSummary = this.equipmentSystem.getEquipmentSummary(player);
        
        // Enviar para cliente
        socket.emit('inventory_update', {
            inventory: inventorySummary,
            equipment: equipmentSummary
        });
        
        console.log(`📦 Sent inventory to ${player.name}`);
    }
    
    /**
     * Handle de movimento de item
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados do movimento
     */
    handleMoveItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { fromSlot, toSlot } = data;
        
        // Validar movimento
        if (fromSlot < 0 || fromSlot >= 30 || toSlot < 0 || toSlot >= 30) {
            socket.emit('inventory_error', { message: 'Invalid slot' });
            return;
        }
        
        // Mover item
        const success = this.inventorySystem.moveItem(player, fromSlot, toSlot);
        
        if (success) {
            // Notificar cliente
            socket.emit('inventory_moved', {
                fromSlot: fromSlot,
                toSlot: toSlot
            });
            
            // Enviar inventário atualizado
            this.handleGetInventory(socket, {});
        } else {
            socket.emit('inventory_error', { message: 'Cannot move item' });
        }
    }
    
    /**
     * Handle de uso de item
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados do uso
     */
    handleUseItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { slotIndex } = data;
        
        // Usar item
        const success = this.inventorySystem.useItem(player, slotIndex);
        
        if (success) {
            // Notificar cliente
            socket.emit('item_used', {
                slot: slotIndex
            });
            
            // Enviar inventário atualizado
            this.handleGetInventory(socket, {});
            
            // Enviar stats atualizados
            socket.emit('player_stats', {
                health: player.hp,
                maxHealth: player.maxHp,
                mana: player.mana,
                maxMana: player.maxMana
            });
        } else {
            socket.emit('inventory_error', { message: 'Cannot use item' });
        }
    }
    
    /**
     * Handle de drop de item
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados do drop
     */
    handleDropItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { slotIndex, quantity } = data;
        
        // Remover item
        const item = this.inventorySystem.removeItem(player, slotIndex, quantity || 1);
        
        if (item) {
            // Notificar clientes próximos
            this.notifyNearbyPlayers(player, 'item_dropped', {
                playerId: player.id,
                itemName: item.name,
                quantity: item.quantity,
                x: player.x,
                y: player.y
            });
            
            // Enviar inventário atualizado
            this.handleGetInventory(socket, {});
            
            console.log(`📦 ${player.name} dropped ${item.quantity} ${item.name}`);
        } else {
            socket.emit('inventory_error', { message: 'Cannot drop item' });
        }
    }
    
    /**
     * Handle de equipamento de item
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados do equipamento
     */
    handleEquipItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { inventorySlot, equipmentSlot } = data;
        
        // Trocar item entre inventário e equipamento
        const result = this.equipmentSystem.swapItem(player, inventorySlot, equipmentSlot);
        
        if (result.success) {
            // Notificar cliente
            socket.emit('item_equipped', {
                inventorySlot: inventorySlot,
                equipmentSlot: equipmentSlot,
                equippedItem: result.equippedItem,
                previousItem: result.previousItem,
                newStats: result.newStats
            });
            
            // Enviar inventário e equipamento atualizados
            this.handleGetInventory(socket, {});
            
            // Enviar stats atualizados
            socket.emit('player_stats', {
                health: player.hp,
                maxHealth: player.maxHp,
                mana: player.mana,
                maxMana: player.maxMana,
                attack: player.totalStats.attack,
                defense: player.totalStats.defense,
                magic: player.totalStats.magic,
                speed: player.totalStats.speed
            });
            
            console.log(`⚔️ ${player.name} equipped ${result.equippedItem.name}`);
        } else {
            socket.emit('inventory_error', { message: result.error });
        }
    }
    
    /**
     * Handle de desequipamento de item
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados do desequipamento
     */
    handleUnequipItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { equipmentSlot } = data;
        
        // Verificar se há espaço no inventário
        const equippedItem = this.equipmentSystem.getEquippedItem(player, equipmentSlot);
        if (!equippedItem) {
            socket.emit('inventory_error', { message: 'No item equipped' });
            return;
        }
        
        if (!this.inventorySystem.hasSpace(player, equippedItem)) {
            socket.emit('inventory_error', { message: 'No inventory space' });
            return;
        }
        
        // Desequipar item
        const result = this.equipmentSystem.unequipItem(player, equipmentSlot);
        
        if (result.success) {
            // Adicionar ao inventário
            this.inventorySystem.addItem(player, result.item);
            
            // Notificar cliente
            socket.emit('item_unequipped', {
                equipmentSlot: equipmentSlot,
                item: result.item,
                newStats: result.newStats
            });
            
            // Enviar inventário e equipamento atualizados
            this.handleGetInventory(socket, {});
            
            // Enviar stats atualizados
            socket.emit('player_stats', {
                health: player.hp,
                maxHealth: player.maxHp,
                mana: player.mana,
                maxMana: player.maxMana,
                attack: player.totalStats.attack,
                defense: player.totalStats.defense,
                magic: player.totalStats.magic,
                speed: player.totalStats.speed
            });
            
            console.log(`⚔️ ${player.name} unequipped ${result.item.name}`);
        } else {
            socket.emit('inventory_error', { message: result.error });
        }
    }
    
    /**
     * Handle de troca de item
     * @param {object} socket - Socket do cliente
     * @param {object} data - Dados da troca
     */
    handleSwapItem(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { inventorySlot, equipmentSlot } = data;
        
        // Usar o mesmo método de equipamento
        this.handleEquipItem(socket, { inventorySlot, equipmentSlot });
    }
    
    /**
     * Handle de morte de mob
     * @param {object} data - Dados da morte
     */
    handleMobDeath(data) {
        const { mob, killer } = data;
        
        if (!mob || !killer) return;
        
        // Gerar loot
        const loot = this.lootSystem.generateLoot(mob, killer);
        
        if (loot.length > 0) {
            // Adicionar itens ao inventário do killer
            for (const item of loot) {
                if (item.type === 'currency') {
                    // Adicionar gold diretamente
                    this.inventorySystem.addGold(killer, item.quantity);
                } else {
                    // Tentar adicionar ao inventário
                    const added = this.inventorySystem.addItem(killer, item);
                    if (!added) {
                        // Se não tiver espaço, dropar no chão
                        this.dropItemOnGround(killer, item);
                    }
                }
            }
            
            // Notificar killer sobre loot
            const killerSocket = this.server.getPlayerSocket(killer.id);
            if (killerSocket) {
                killerSocket.emit('loot_received', {
                    mobId: mob.id,
                    mobName: mob.name,
                    items: loot
                });
                
                // Enviar inventário atualizado
                this.handleGetInventory(killerSocket, {});
            }
            
            console.log(`💰 ${killer.name} received ${loot.length} items from ${mob.name}`);
        }
    }
    
    /**
     * Handle de morte de jogador
     * @param {object} data - Dados da morte
     */
    handlePlayerDeath(data) {
        const { player } = data;
        
        if (!player) return;
        
        // Perder uma porcentagem do gold
        const goldLoss = Math.floor((player.inventory?.gold || 0) * 0.1);
        if (goldLoss > 0) {
            this.inventorySystem.removeGold(player, goldLoss);
            console.log(`💀 ${player.name} lost ${goldLoss} gold on death`);
        }
        
        // Notificar jogador
        const playerSocket = this.server.getPlayerSocket(player.id);
        if (playerSocket) {
            playerSocket.emit('player_death_penalty', {
                goldLost: goldLoss,
                remainingGold: player.inventory?.gold || 0
            });
        }
    }
    
    /**
     * Handle de conexão de jogador
     * @param {object} player - Dados do jogador
     */
    handlePlayerConnected(player) {
        // Criar inventário e equipamento
        this.inventorySystem.createInventory(player);
        this.equipmentSystem.createEquipment(player);
        
        // Salvar referências
        this.playerInventories.set(player.id, player.inventory);
        this.playerEquipment.set(player.id, player.equipment);
        
        console.log(`📦 Created inventory for ${player.name}`);
    }
    
    /**
     * Handle de desconexão de jogador
     * @param {string} playerId - ID do jogador
     */
    handlePlayerDisconnected(playerId) {
        // Limpar referências
        this.playerInventories.delete(playerId);
        this.playerEquipment.delete(playerId);
        
        console.log(`📦 Cleaned up inventory for player ${playerId}`);
    }
    
    /**
     * Dropa item no chão
     * @param {object} player - Dados do jogador
     * @param {object} item - Dados do item
     */
    dropItemOnGround(player, item) {
        // TODO: Implementar sistema de itens no chão
        console.log(`📦 ${player.name} dropped ${item.name} on the ground`);
    }
    
    /**
     * Notifica jogadores próximos
     * @param {object} player - Jogador de referência
     * @param {string} event - Evento
     * @param {object} data - Dados do evento
     */
    notifyNearbyPlayers(player, event, data) {
        // TODO: Implementar notificação para players próximos
        // Usar spatial grid do gameLoop
    }
    
    /**
     * Update de regeneração baseada em equipamentos
     * @param {number} delta - Delta time
     */
    updateEquipmentRegeneration(delta) {
        const now = Date.now();
        
        // Update a cada 1 segundo
        if (now - (this.lastRegenUpdate || 0) < 1000) return;
        this.lastRegenUpdate = now;
        
        for (const player of this.server.players.values()) {
            if (!player.equipmentStats) continue;
            
            // Regeneração de HP
            if (player.hp < player.maxHp && player.equipmentStats.healthRegen > 0) {
                const regen = Math.min(player.equipmentStats.healthRegen, player.maxHp - player.hp);
                player.hp += regen;
                
                // Notificar jogador se houver mudança
                if (regen > 0) {
                    const socket = this.server.getPlayerSocket(player.id);
                    if (socket) {
                        socket.emit('health_regen', { amount: regen, current: player.hp });
                    }
                }
            }
            
            // Regeneração de MP
            if (player.mana < player.maxMana && player.equipmentStats.manaRegen > 0) {
                const regen = Math.min(player.equipmentStats.manaRegen, player.maxMana - player.mana);
                player.mana += regen;
                
                // Notificar jogador se houver mudança
                if (regen > 0) {
                    const socket = this.server.getPlayerSocket(player.id);
                    if (socket) {
                        socket.emit('mana_regen', { amount: regen, current: player.mana });
                    }
                }
            }
        }
    }
    
    /**
     * Update de efeitos de itens
     * @param {number} delta - Delta time
     */
    updateItemEffects(delta) {
        // TODO: Implementar sistema de efeitos de itens
        // Efeitos como buffs/debuffs temporários, etc.
    }
    
    /**
     * Obtém inventário completo de um jogador
     * @param {string} playerId - ID do jogador
     * @returns {object} - Inventário completo
     */
    getPlayerInventory(playerId) {
        const player = this.server.players.get(playerId);
        if (!player) return null;
        
        return {
            inventory: this.inventorySystem.getInventorySummary(player),
            equipment: this.equipmentSystem.getEquipmentSummary(player)
        };
    }
    
    /**
     * Adiciona item a um jogador
     * @param {string} playerId - ID do jogador
     * @param {object} item - Dados do item
     * @returns {boolean} - Sucesso da operação
     */
    addItemToPlayer(playerId, item) {
        const player = this.server.players.get(playerId);
        if (!player) return false;
        
        return this.inventorySystem.addItem(player, item);
    }
    
    /**
     * Remove item de um jogador
     * @param {string} playerId - ID do jogador
     * @param {string} itemId - ID do item
     * @param {number} quantity - Quantidade
     * @returns {number} - Quantidade removida
     */
    removeItemFromPlayer(playerId, itemId, quantity) {
        const player = this.server.players.get(playerId);
        if (!player) return 0;
        
        return this.inventorySystem.removeItemById(player, itemId, quantity);
    }
    
    /**
     * Cleanup do módulo
     */
    cleanup() {
        console.log('🧹 Cleaning up InventoryModule...');
        
        // Limpar referências
        this.playerInventories.clear();
        this.playerEquipment.clear();
        
        this.initialized = false;
        console.log('✅ InventoryModule cleaned up');
    }
    
    /**
     * Obtém estatísticas do módulo
     */
    getStats() {
        return {
            name: this.name,
            initialized: this.initialized,
            playerCount: this.playerInventories.size,
            systems: {
                inventory: !!this.inventorySystem,
                equipment: !!this.equipmentSystem,
                loot: !!this.lootSystem
            }
        };
    }
}

module.exports = InventoryModule;
