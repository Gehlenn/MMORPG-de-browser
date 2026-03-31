/**
 * LootModule.js
 * Módulo de loot do servidor MMORPG
 * Responsabilidade: Gerenciar drops, coleta e inventário
 */

class LootModule {
    constructor(server) {
        this.server = server;
        this.lootDrops = new Map();
    }

    /**
     * Create loot drop when mob dies (legacy - use createSharedLootDrops instead)
     */
    createLootDrop(mob, playerId) {
        const dropId = 'drop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const drop = {
            id: dropId,
            itemId: 'gold_coin',
            itemName: 'Gold Coin',
            quantity: 1 + Math.floor(Math.random() * 3),
            x: mob.x,
            y: mob.y,
            createdAt: Date.now(),
            droppedBy: mob.id,
            ownerId: playerId
        };
        
        this.lootDrops.set(dropId, drop);
        
        // Broadcast para todos os players
        this.server.io.emit('loot:drop_created', drop);
        
        console.log(`💰 Loot drop created: ${drop.itemName} x${drop.quantity}`);
        
        // Auto-remove após 60 segundos
        this.scheduleLootExpiration(dropId, 60000);
        
        return drop;
    }

    /**
     * Create individual drops for each contributor (shared loot system)
     */
    createSharedLootDrops(target, contributors) {
        for (const contributor of contributors) {
            const dropId = `drop_${target.id}_${contributor.playerId}_${Date.now()}`;
            
            const drop = {
                id: dropId,
                itemId: 'gold_coin',
                itemName: 'Gold Coin',
                quantity: 1 + Math.floor(Math.random() * 3),
                x: target.x + (Math.random() - 0.5) * 40,
                y: target.y + (Math.random() - 0.5) * 40,
                createdAt: Date.now(),
                droppedBy: target.id,
                ownerId: contributor.playerId,
                isSharedDrop: contributors.length > 1
            };
            
            this.lootDrops.set(dropId, drop);
            
            // Notificar apenas o jogador dono
            const socket = this.server.io.sockets.sockets.get(contributor.playerId);
            if (socket) {
                socket.emit('loot:drop_created', {
                    ...drop,
                    message: contributors.length > 1 
                        ? `💰 Loot compartilhado! ${drop.quantity} gold!` 
                        : `💰 ${drop.quantity} gold dropado!`
                });
            }
            
            // Auto-remove após 60 segundos
            this.scheduleLootExpiration(dropId, 60000);
        }
        
        console.log(`💰 ${contributors.length} drops criados para ${target.name}`);
    }

    /**
     * Schedule loot expiration
     */
    scheduleLootExpiration(dropId, timeout) {
        setTimeout(() => {
            if (this.lootDrops.has(dropId)) {
                this.lootDrops.delete(dropId);
                console.log(`🗑️ Loot expired: ${dropId}`);
            }
        }, timeout);
    }

    /**
     * Handle loot collection from player
     */
    handleLootCollect(socket, data) {
        const playerId = socket.id;
        const player = this.server.players.get(playerId);
        const dropId = data.dropId;
        
        if (!player) {
            socket.emit('loot:collected', {
                success: false,
                error: 'Player not found'
            });
            return;
        }
        
        const drop = this.lootDrops.get(dropId);
        if (!drop) {
            socket.emit('loot:collected', {
                success: false,
                error: 'Drop not found or already collected'
            });
            return;
        }
        
        // Validar distância
        const dx = drop.x - player.x;
        const dy = drop.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 100) {
            socket.emit('loot:collected', {
                success: false,
                error: 'Too far away'
            });
            return;
        }
        
        // Verificar se o drop tem dono e se o jogador é o dono
        if (drop.ownerId && drop.ownerId !== playerId) {
            socket.emit('loot:collected', {
                success: false,
                error: 'This loot belongs to another player'
            });
            return;
        }
        
        // Inicializar inventário se não existir
        player.inventory = player.inventory || [];
        
        // Verificar se item já existe no inventário
        const existingItem = player.inventory.find(item => item.itemId === drop.itemId);
        
        if (existingItem) {
            existingItem.quantity += drop.quantity;
        } else {
            player.inventory.push({
                itemId: drop.itemId,
                itemName: drop.itemName,
                quantity: drop.quantity,
                slot: player.inventory.length
            });
        }
        
        // Remover drop
        this.lootDrops.delete(dropId);
        
        // Dar gold ao jogador
        if (drop.itemId === 'gold_coin') {
            player.gold = (player.gold || 0) + drop.quantity;
        }
        
        // Notificar jogador
        socket.emit('loot:collected', {
            success: true,
            dropId: dropId,
            itemId: drop.itemId,
            itemName: drop.itemName,
            quantity: drop.quantity,
            inventory: player.inventory,
            gold: player.gold
        });
        
        // Sincronizar inventário
        socket.emit('inventory:sync', {
            items: player.inventory,
            gold: player.gold
        });
        
        console.log(`💰 Loot collected by ${player.name}: ${drop.itemName} x${drop.quantity}`);
    }

    /**
     * Get loot drops near a position
     */
    getLootDropsNear(x, y, range = 100) {
        const nearby = [];
        
        for (const [dropId, drop] of this.lootDrops) {
            const dx = drop.x - x;
            const dy = drop.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= range) {
                nearby.push(drop);
            }
        }
        
        return nearby;
    }

    /**
     * Get loot drops for a specific player
     */
    getLootDropsForPlayer(playerId) {
        const playerDrops = [];
        
        for (const [dropId, drop] of this.lootDrops) {
            // Retornar drops sem dono ou drops do jogador
            if (!drop.ownerId || drop.ownerId === playerId) {
                playerDrops.push(drop);
            }
        }
        
        return playerDrops;
    }

    /**
     * Get all loot drops
     */
    getAllLootDrops() {
        return Array.from(this.lootDrops.values());
    }

    /**
     * Clear all loot drops
     */
    clearAllLootDrops() {
        this.lootDrops.clear();
        console.log('🗑️ All loot drops cleared');
    }

    /**
     * Add item to player inventory
     */
    addItemToInventory(playerId, itemId, itemName, quantity = 1) {
        const player = this.server.players.get(playerId);
        if (!player) return false;
        
        player.inventory = player.inventory || [];
        
        const existingItem = player.inventory.find(item => item.itemId === itemId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            player.inventory.push({
                itemId: itemId,
                itemName: itemName,
                quantity: quantity,
                slot: player.inventory.length
            });
        }
        
        // Notificar jogador
        const socket = this.server.io.sockets.sockets.get(playerId);
        if (socket) {
            socket.emit('inventory:sync', {
                items: player.inventory,
                gold: player.gold
            });
        }
        
        return true;
    }

    /**
     * Remove item from player inventory
     */
    removeItemFromInventory(playerId, itemId, quantity = 1) {
        const player = this.server.players.get(playerId);
        if (!player || !player.inventory) return false;
        
        const itemIndex = player.inventory.findIndex(item => item.itemId === itemId);
        if (itemIndex === -1) return false;
        
        const item = player.inventory[itemIndex];
        item.quantity -= quantity;
        
        if (item.quantity <= 0) {
            player.inventory.splice(itemIndex, 1);
        }
        
        // Notificar jogador
        const socket = this.server.io.sockets.sockets.get(playerId);
        if (socket) {
            socket.emit('inventory:sync', {
                items: player.inventory,
                gold: player.gold
            });
        }
        
        return true;
    }
}

module.exports = LootModule;
