/**
 * InventorySystem - Sistema de Inventário
 * Gerencia inventários de jogadores
 */

class InventorySystem {
    constructor() {
        this.name = 'InventorySystem';
        
        // Configurações
        this.config = {
            maxSlots: 30,        // Máximo de slots no inventário
            maxStack: 99,        // Máximo de itens por stack
            startingGold: 100    // Gold inicial
        };
        
        console.log('📦 InventorySystem created');
    }
    
    /**
     * Cria inventário para um jogador
     * @param {object} player - Dados do jogador
     */
    createInventory(player) {
        if (!player.inventory) {
            player.inventory = {
                slots: new Array(this.config.maxSlots).fill(null),
                gold: this.config.startingGold,
                maxSlots: this.config.maxSlots,
                usedSlots: 0
            };
            
            // Adicionar itens iniciais
            this.addStartingItems(player);
            
            console.log(`📦 Inventory created for player ${player.name}`);
        }
    }
    
    /**
     * Adiciona itens iniciais
     * @param {object} player - Dados do jogador
     */
    addStartingItems(player) {
        const { getItem } = require('../ItemDatabase');
        
        // Adicionar poções de cura iniciais
        const healthPotion = getItem('potion_health_small');
        if (healthPotion) {
            this.addItem(player, {
                ...healthPotion,
                quantity: 3
            });
        }
        
        // Adicionar gold inicial
        player.inventory.gold = this.config.startingGold;
    }
    
    /**
     * Adiciona item ao inventário
     * @param {object} player - Dados do jogador
     * @param {object} itemData - Dados do item
     * @returns {boolean} - Sucesso da operação
     */
    addItem(player, itemData) {
        if (!player.inventory) {
            this.createInventory(player);
        }
        
        const inventory = player.inventory;
        
        // Verificar se o item é stackable
        if (itemData.stackable) {
            // Tentar adicionar a um stack existente
            for (let i = 0; i < inventory.slots.length; i++) {
                const slot = inventory.slots[i];
                
                if (slot && slot.id === itemData.id) {
                    const maxStack = itemData.maxStack || this.config.maxStack;
                    const canAdd = Math.min(itemData.quantity, maxStack - slot.quantity);
                    
                    if (canAdd > 0) {
                        slot.quantity += canAdd;
                        itemData.quantity -= canAdd;
                        
                        // Se ainda tiver itens, tentar adicionar a outro slot
                        if (itemData.quantity > 0) {
                            return this.addToNewSlot(player, itemData);
                        }
                        
                        this.updateUsedSlots(player);
                        console.log(`📦 Added ${canAdd} ${itemData.name} to existing stack (slot ${i})`);
                        return true;
                    }
                }
            }
        }
        
        // Adicionar a um novo slot
        return this.addToNewSlot(player, itemData);
    }
    
    /**
     * Adiciona item a um novo slot
     * @param {object} player - Dados do jogador
     * @param {object} itemData - Dados do item
     * @returns {boolean} - Sucesso da operação
     */
    addToNewSlot(player, itemData) {
        const inventory = player.inventory;
        
        // Encontrar slot vazio
        for (let i = 0; i < inventory.slots.length; i++) {
            if (!inventory.slots[i]) {
                inventory.slots[i] = { ...itemData };
                this.updateUsedSlots(player);
                console.log(`📦 Added ${itemData.name} to slot ${i}`);
                return true;
            }
        }
        
        console.warn(`⚠️ No available slots for item ${itemData.name}`);
        return false;
    }
    
    /**
     * Remove item do inventário
     * @param {object} player - Dados do jogador
     * @param {number} slotIndex - Índice do slot
     * @param {number} quantity - Quantidade a remover
     * @returns {object|null} - Item removido
     */
    removeItem(player, slotIndex, quantity = 1) {
        if (!player.inventory) return null;
        
        const inventory = player.inventory;
        const slot = inventory.slots[slotIndex];
        
        if (!slot) {
            console.warn(`⚠️ No item in slot ${slotIndex}`);
            return null;
        }
        
        const item = { ...slot };
        
        if (slot.stackable && slot.quantity > quantity) {
            // Remover parte do stack
            slot.quantity -= quantity;
            item.quantity = quantity;
        } else {
            // Remover item completamente
            inventory.slots[slotIndex] = null;
            item.quantity = slot.quantity || 1;
        }
        
        this.updateUsedSlots(player);
        console.log(`📦 Removed ${item.quantity} ${item.name} from slot ${slotIndex}`);
        return item;
    }
    
    /**
     * Move item entre slots
     * @param {object} player - Dados do jogador
     * @param {number} fromSlot - Slot de origem
     * @param {number} toSlot - Slot de destino
     * @returns {boolean} - Sucesso da operação
     */
    moveItem(player, fromSlot, toSlot) {
        if (!player.inventory) return false;
        
        const inventory = player.inventory;
        
        // Validar slots
        if (fromSlot < 0 || fromSlot >= inventory.slots.length ||
            toSlot < 0 || toSlot >= inventory.slots.length) {
            return false;
        }
        
        const fromItem = inventory.slots[fromSlot];
        const toItem = inventory.slots[toSlot];
        
        // Se não houver item no slot de origem
        if (!fromItem) return false;
        
        // Se o slot de destino estiver vazio
        if (!toItem) {
            inventory.slots[toSlot] = fromItem;
            inventory.slots[fromSlot] = null;
            console.log(`📦 Moved ${fromItem.name} from slot ${fromSlot} to slot ${toSlot}`);
            return true;
        }
        
        // Se os itens forem do mesmo tipo e stackable
        if (fromItem.id === toItem.id && toItem.stackable) {
            const maxStack = toItem.maxStack || this.config.maxStack;
            const canStack = Math.min(fromItem.quantity, maxStack - toItem.quantity);
            
            if (canStack > 0) {
                toItem.quantity += canStack;
                fromItem.quantity -= canStack;
                
                // Se o item de origem ficou vazio
                if (fromItem.quantity <= 0) {
                    inventory.slots[fromSlot] = null;
                }
                
                console.log(`📦 Stacked ${canStack} ${fromItem.name} in slot ${toSlot}`);
                return true;
            }
        }
        
        // Trocar itens
        inventory.slots[fromSlot] = toItem;
        inventory.slots[toSlot] = fromItem;
        
        console.log(`📦 Swapped items between slots ${fromSlot} and ${toSlot}`);
        return true;
    }
    
    /**
     * Usa item do inventário
     * @param {object} player - Dados do jogador
     * @param {number} slotIndex - Índice do slot
     * @returns {boolean} - Sucesso da operação
     */
    useItem(player, slotIndex) {
        if (!player.inventory) return false;
        
        const inventory = player.inventory;
        const slot = inventory.slots[slotIndex];
        
        if (!slot) {
            console.warn(`⚠️ No item in slot ${slotIndex}`);
            return false;
        }
        
        // Verificar se é consumível
        if (!slot.consumable) {
            console.warn(`⚠️ Item ${slot.name} is not consumable`);
            return false;
        }
        
        // Aplicar efeito do item
        const success = this.applyItemEffect(player, slot);
        
        if (success) {
            // Remover item consumido
            this.removeItem(player, slotIndex, 1);
            console.log(`📦 Used ${slot.name} from slot ${slotIndex}`);
        }
        
        return success;
    }
    
    /**
     * Aplica efeito de item consumível
     * @param {object} player - Dados do jogador
     * @param {object} item - Dados do item
     * @returns {boolean} - Sucesso da operação
     */
    applyItemEffect(player, item) {
        switch (item.effect) {
            case 'heal':
                if (player.health < player.maxHealth) {
                    const healAmount = Math.min(item.effectValue, player.maxHealth - player.health);
                    player.health += healAmount;
                    console.log(`💊 Healed ${healAmount} HP`);
                    return true;
                }
                break;
                
            case 'mana':
                if (player.mana < player.maxMana) {
                    const manaAmount = Math.min(item.effectValue, player.maxMana - player.mana);
                    player.mana += manaAmount;
                    console.log(`💊 Restored ${manaAmount} MP`);
                    return true;
                }
                break;
                
            case 'buff':
                // TODO: Implementar sistema de buffs
                console.log(`💊 Applied buff: ${item.name}`);
                return true;
                
            case 'debuff':
                // TODO: Implementar sistema de debuffs
                console.log(`💊 Applied debuff: ${item.name}`);
                return true;
        }
        
        return false;
    }
    
    /**
     * Obtém item do inventário
     * @param {object} player - Dados do jogador
     * @param {number} slotIndex - Índice do slot
     * @returns {object|null} - Dados do item
     */
    getItem(player, slotIndex) {
        if (!player.inventory) return null;
        
        const inventory = player.inventory;
        return inventory.slots[slotIndex] || null;
    }
    
    /**
     * Verifica se inventário tem espaço
     * @param {object} player - Dados do jogador
     * @param {object} itemData - Dados do item
     * @returns {boolean} - Tem espaço
     */
    hasSpace(player, itemData) {
        if (!player.inventory) {
            this.createInventory(player);
            return true;
        }
        
        const inventory = player.inventory;
        
        // Se for stackable, verificar se há stack existente
        if (itemData.stackable) {
            for (const slot of inventory.slots) {
                if (slot && slot.id === itemData.id) {
                    const maxStack = itemData.maxStack || this.config.maxStack;
                    return slot.quantity < maxStack;
                }
            }
        }
        
        // Verificar se há slot vazio
        return inventory.slots.some(slot => !slot);
    }
    
    /**
     * Obtém quantidade de um item no inventário
     * @param {object} player - Dados do jogador
     * @param {string} itemId - ID do item
     * @returns {number} - Quantidade total
     */
    getItemCount(player, itemId) {
        if (!player.inventory) return 0;
        
        const inventory = player.inventory;
        let total = 0;
        
        for (const slot of inventory.slots) {
            if (slot && slot.id === itemId) {
                total += slot.quantity || 1;
            }
        }
        
        return total;
    }
    
    /**
     * Remove quantidade específica de um item
     * @param {object} player - Dados do jogador
     * @param {string} itemId - ID do item
     * @param {number} quantity - Quantidade a remover
     * @returns {number} - Quantidade realmente removida
     */
    removeItemById(player, itemId, quantity) {
        if (!player.inventory) return 0;
        
        const inventory = player.inventory;
        let removed = 0;
        
        for (let i = 0; i < inventory.slots.length && removed < quantity; i++) {
            const slot = inventory.slots[i];
            
            if (slot && slot.id === itemId) {
                const canRemove = Math.min(slot.quantity || 1, quantity - removed);
                
                if (slot.stackable && slot.quantity > canRemove) {
                    slot.quantity -= canRemove;
                } else {
                    inventory.slots[i] = null;
                }
                
                removed += canRemove;
            }
        }
        
        this.updateUsedSlots(player);
        
        if (removed > 0) {
            console.log(`📦 Removed ${removed} ${itemId} from inventory`);
        }
        
        return removed;
    }
    
    /**
     * Adiciona gold ao inventário
     * @param {object} player - Dados do jogador
     * @param {number} amount - Quantidade de gold
     */
    addGold(player, amount) {
        if (!player.inventory) {
            this.createInventory(player);
        }
        
        player.inventory.gold = Math.max(0, player.inventory.gold + amount);
        console.log(`💰 Added ${amount} gold to ${player.name} (total: ${player.inventory.gold})`);
    }
    
    /**
     * Remove gold do inventário
     * @param {object} player - Dados do jogador
     * @param {number} amount - Quantidade de gold
     * @returns {boolean} - Sucesso da operação
     */
    removeGold(player, amount) {
        if (!player.inventory) {
            this.createInventory(player);
        }
        
        if (player.inventory.gold >= amount) {
            player.inventory.gold -= amount;
            console.log(`💰 Removed ${amount} gold from ${player.name} (total: ${player.inventory.gold})`);
            return true;
        }
        
        console.warn(`⚠️ Insufficient gold: need ${amount}, have ${player.inventory.gold}`);
        return false;
    }
    
    /**
     * Atualiza contador de slots usados
     * @param {object} player - Dados do jogador
     */
    updateUsedSlots(player) {
        if (!player.inventory) return;
        
        const inventory = player.inventory;
        inventory.usedSlots = inventory.slots.filter(slot => slot !== null).length;
    }
    
    /**
     * Obtém informações do inventário
     * @param {object} player - Dados do jogador
     * @returns {object} - Informações do inventário
     */
    getInventoryInfo(player) {
        if (!player.inventory) {
            this.createInventory(player);
        }
        
        const inventory = player.inventory;
        
        return {
            slots: [...inventory.slots],
            gold: inventory.gold,
            maxSlots: inventory.maxSlots,
            usedSlots: inventory.usedSlots,
            freeSlots: inventory.maxSlots - inventory.usedSlots
        };
    }
    
    /**
     * Obtém resumo do inventário para cliente
     * @param {object} player - Dados do jogador
     * @returns {object} - Resumo do inventário
     */
    getInventorySummary(player) {
        if (!player.inventory) {
            this.createInventory(player);
        }
        
        const inventory = player.inventory;
        const summary = {
            gold: inventory.gold,
            maxSlots: inventory.maxSlots,
            usedSlots: inventory.usedSlots,
            items: []
        };
        
        // Adicionar itens não nulos
        for (let i = 0; i < inventory.slots.length; i++) {
            const slot = inventory.slots[i];
            if (slot) {
                summary.items.push({
                    slot: i,
                    id: slot.id,
                    name: slot.name,
                    quantity: slot.quantity || 1,
                    type: slot.type,
                    rarity: slot.rarity,
                    icon: slot.icon
                });
            }
        }
        
        return summary;
    }
    
    /**
     * Limpa inventário
     * @param {object} player - Dados do jogador
     */
    clearInventory(player) {
        if (player.inventory) {
            player.inventory.slots = new Array(this.config.maxSlots).fill(null);
            player.inventory.gold = 0;
            this.updateUsedSlots(player);
            console.log(`📦 Cleared inventory for player ${player.name}`);
        }
    }
    
    /**
     * Obtém estatísticas do sistema
     * @returns {object} - Estatísticas
     */
    getStats() {
        return {
            name: this.name,
            maxSlots: this.config.maxSlots,
            maxStack: this.config.maxStack,
            startingGold: this.config.startingGold
        };
    }
}

module.exports = InventorySystem;
