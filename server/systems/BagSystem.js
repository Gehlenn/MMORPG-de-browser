/**
 * BagSystem.js - Sistema de Inventário estilo WoW
 * 
 * Implementação completa do sistema de bags conforme GDD:
 * - Bag principal: 20 slots (fixo)
 * - 4 slots para bags adicionais
 * - Tipos de bags variados (6-20 slots)
 * - Sistema de stacking (até 99)
 * - Bind on Pickup / Bind on Equip
 * - Banco com 48 slots
 * 
 * @version 1.0.0
 * @author Legacy of Komodo Team
 */

class BagSystem {
    constructor(database) {
        this.db = database;
        this.BAG_TYPES = {
            BACKPACK: { id: 'backpack', name: 'Mochila Inicial', slots: 20, icon: '🎒' },
            CLOTH_BAG: { id: 'cloth_bag', name: 'Bolsa de Pano', slots: 6, icon: '👜', price: 50 },
            LEATHER_BAG: { id: 'leather_bag', name: 'Mochila de Couro', slots: 8, icon: '🎒', price: 100 },
            REINFORCED_BAG: { id: 'reinforced_bag', name: 'Sacola Reforçada', slots: 10, icon: '🛍️', questReward: true },
            MERCHANT_BAG: { id: 'merchant_bag', name: 'Bolsa de Comerciante', slots: 12, icon: '💼', price: 500 },
            EXPLORER_BAG: { id: 'explorer_bag', name: 'Mochila do Explorador', slots: 14, icon: '🗺️', achievement: 'explorador_aethelgard' },
            BUILDER_BAG: { id: 'builder_bag', name: 'Bag dos Construtores', slots: 16, icon: '🏛️', dropZone: 'ruins_of_komodo' },
            LEGENDARY_KOMODO_BAG: { id: 'legendary_komodo_bag', name: 'Bag Lendária de Komodo', slots: 20, icon: '👑', price: 5000 }
        };
        
        this.MAX_STACK_SIZE = 99;
        this.BANK_SLOTS = 48;
        this.BAG_SLOT_COUNT = 4; // Slots para bags adicionais
    }

    /**
     * Inicializa o inventário de um novo jogador
     */
    initializePlayerInventory(playerId) {
        return {
            playerId,
            // Bag principal (sempre equipada)
            backpack: {
                type: 'backpack',
                slots: this.createEmptySlots(20)
            },
            // Slots para bags adicionais
            bagSlots: [
                { unlocked: true, bag: null },   // Slot 1: desbloqueado por padrão
                { unlocked: true, bag: null },   // Slot 2: desbloqueado por padrão
                { unlocked: true, bag: null },   // Slot 3: desbloqueado por padrão
                { unlocked: false, bag: null }    // Slot 4: desbloquea na quest lvl 30 ou Premium
            ],
            // Banco
            bank: {
                slots: this.createEmptySlots(24), // Free: 24 slots
                unlockedSlots: 24,
                maxSlots: 48
            },
            // Gold
            gold: 0,
            silver: 0,
            copper: 0,
            // Itens equipados
            equipment: {
                head: null,
                body: null,
                hands: null,
                feet: null,
                weapon: null,
                ring: null,
                amulet: null
            },
            // Estatísticas
            totalSlots: 20,  // Começa com apenas a backpack
            usedSlots: 0,
            freeSlots: 20
        };
    }

    /**
     * Cria slots vazios
     */
    createEmptySlots(count) {
        return Array(count).fill(null).map((_, index) => ({
            index,
            item: null,
            count: 0
        }));
    }

    /**
     * Calcula o total de slots disponíveis
     */
    calculateTotalSlots(inventory) {
        let total = inventory.backpack.slots.length; // Backpack sempre conta
        
        // Adicionar slots das bags equipadas
        inventory.bagSlots.forEach(slot => {
            if (slot.unlocked && slot.bag) {
                const bagType = this.BAG_TYPES[slot.bag.type];
                if (bagType) {
                    total += bagType.slots;
                }
            }
        });
        
        return total;
    }

    /**
     * Conta slots usados
     */
    calculateUsedSlots(inventory) {
        let used = 0;
        
        // Contar backpack
        inventory.backpack.slots.forEach(slot => {
            if (slot.item) used++;
        });
        
        // Contar bags equipadas
        inventory.bagSlots.forEach(bagSlot => {
            if (bagSlot.unlocked && bagSlot.bag && bagSlot.bag.slots) {
                bagSlot.bag.slots.forEach(slot => {
                    if (slot.item) used++;
                });
            }
        });
        
        return used;
    }

    /**
     * Equipa uma bag em um slot
     */
    equipBag(inventory, bagSlotIndex, bagTypeId) {
        const bagSlot = inventory.bagSlots[bagSlotIndex];
        
        if (!bagSlot) {
            return { success: false, error: 'Slot de bag inválido' };
        }
        
        if (!bagSlot.unlocked) {
            return { success: false, error: 'Slot de bag bloqueado' };
        }
        
        if (bagSlot.bag) {
            return { success: false, error: 'Slot já possui uma bag equipada' };
        }
        
        const bagType = this.BAG_TYPES[bagTypeId];
        if (!bagType) {
            return { success: false, error: 'Tipo de bag inválido' };
        }
        
        // Equipar a bag
        bagSlot.bag = {
            type: bagTypeId,
            slots: this.createEmptySlots(bagType.slots),
            bound: false
        };
        
        // Atualizar estatísticas
        this.updateInventoryStats(inventory);
        
        return { 
            success: true, 
            message: `${bagType.name} equipada com sucesso!`,
            totalSlots: inventory.totalSlots
        };
    }

    /**
     * Desequipa uma bag (move todos os itens para a backpack primeiro)
     */
    unequipBag(inventory, bagSlotIndex) {
        const bagSlot = inventory.bagSlots[bagSlotIndex];
        
        if (!bagSlot || !bagSlot.bag) {
            return { success: false, error: 'Nenhuma bag equipada neste slot' };
        }
        
        // Verificar se há espaço suficiente na backpack
        const itemsToMove = bagSlot.bag.slots.filter(s => s.item);
        const freeBackpackSlots = inventory.backpack.slots.filter(s => !s.item).length;
        
        if (itemsToMove.length > freeBackpackSlots) {
            return { 
                success: false, 
                error: `Espaço insuficiente na mochila. Libere ${itemsToMove.length - freeBackpackSlots} slots.` 
            };
        }
        
        // Mover itens para a backpack
        itemsToMove.forEach(itemSlot => {
            const targetSlot = inventory.backpack.slots.find(s => !s.item);
            if (targetSlot) {
                targetSlot.item = itemSlot.item;
                targetSlot.count = itemSlot.count;
            }
        });
        
        // Remover a bag
        const bagType = this.BAG_TYPES[bagSlot.bag.type];
        bagSlot.bag = null;
        
        // Atualizar estatísticas
        this.updateInventoryStats(inventory);
        
        return {
            success: true,
            message: `${bagType.name} removida. Itens movidos para a mochila.`,
            totalSlots: inventory.totalSlots
        };
    }

    /**
     * Adiciona um item ao inventário
     */
    addItem(inventory, item, count = 1) {
        // Verificar se é stackable
        const isStackable = item.stackable !== false;
        
        if (isStackable) {
            // Tentar stackar primeiro
            const stackResult = this.tryStackItem(inventory, item, count);
            if (stackResult.success) {
                this.updateInventoryStats(inventory);
                return stackResult;
            }
        }
        
        // Adicionar a um slot vazio
        const emptySlot = this.findEmptySlot(inventory);
        if (!emptySlot) {
            return { 
                success: false, 
                error: 'Inventário cheio',
                inventoryFull: true
            };
        }
        
        // Verificar Bind on Pickup
        if (item.bindOnPickup) {
            item.bound = true;
            item.boundTo = inventory.playerId;
        }
        
        emptySlot.slot.item = { ...item };
        emptySlot.slot.count = count;
        
        this.updateInventoryStats(inventory);
        
        return {
            success: true,
            message: `${item.name} adicionado ao inventário`,
            slot: emptySlot.slotIndex,
            bagIndex: emptySlot.bagIndex
        };
    }

    /**
     * Tenta stackar um item existente
     */
    tryStackItem(inventory, item, count) {
        // Procurar por itens iguais que possam ser stackados
        const existingStack = this.findStackableSlot(inventory, item);
        
        if (existingStack) {
            const canAdd = Math.min(count, this.MAX_STACK_SIZE - existingStack.slot.count);
            
            if (canAdd > 0) {
                existingStack.slot.count += canAdd;
                
                const remaining = count - canAdd;
                
                if (remaining > 0) {
                    // Ainda há itens restantes, tentar adicionar em outro slot
                    return this.addItem(inventory, item, remaining);
                }
                
                return {
                    success: true,
                    message: `${item.name} stackado (${existingStack.slot.count})`,
                    stacked: true,
                    slot: existingStack.slotIndex,
                    bagIndex: existingStack.bagIndex
                };
            }
        }
        
        return { success: false };
    }

    /**
     * Encontra um slot que pode receber mais deste item (para stackar)
     */
    findStackableSlot(inventory, item) {
        // Procurar na backpack
        for (let i = 0; i < inventory.backpack.slots.length; i++) {
            const slot = inventory.backpack.slots[i];
            if (slot.item && 
                slot.item.id === item.id && 
                slot.count < this.MAX_STACK_SIZE &&
                !slot.item.bound) { // Não stackar itens bound
                return { slot, slotIndex: i, bagIndex: -1 };
            }
        }
        
        // Procurar nas bags equipadas
        for (let bagIdx = 0; bagIdx < inventory.bagSlots.length; bagIdx++) {
            const bagSlot = inventory.bagSlots[bagIdx];
            if (bagSlot.unlocked && bagSlot.bag) {
                for (let i = 0; i < bagSlot.bag.slots.length; i++) {
                    const slot = bagSlot.bag.slots[i];
                    if (slot.item && 
                        slot.item.id === item.id && 
                        slot.count < this.MAX_STACK_SIZE &&
                        !slot.item.bound) {
                        return { slot, slotIndex: i, bagIndex: bagIdx };
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Encontra um slot vazio no inventário
     */
    findEmptySlot(inventory) {
        // Procurar na backpack primeiro
        for (let i = 0; i < inventory.backpack.slots.length; i++) {
            if (!inventory.backpack.slots[i].item) {
                return { slot: inventory.backpack.slots[i], slotIndex: i, bagIndex: -1 };
            }
        }
        
        // Procurar nas bags equipadas
        for (let bagIdx = 0; bagIdx < inventory.bagSlots.length; bagIdx++) {
            const bagSlot = inventory.bagSlots[bagIdx];
            if (bagSlot.unlocked && bagSlot.bag) {
                for (let i = 0; i < bagSlot.bag.slots.length; i++) {
                    if (!bagSlot.bag.slots[i].item) {
                        return { slot: bagSlot.bag.slots[i], slotIndex: i, bagIndex: bagIdx };
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Remove um item do inventário
     */
    removeItem(inventory, bagIndex, slotIndex, count = 1) {
        let slot;
        
        if (bagIndex === -1) {
            // Backpack
            slot = inventory.backpack.slots[slotIndex];
        } else {
            // Bag equipada
            const bagSlot = inventory.bagSlots[bagIndex];
            if (!bagSlot || !bagSlot.bag) {
                return { success: false, error: 'Bag inválida' };
            }
            slot = bagSlot.bag.slots[slotIndex];
        }
        
        if (!slot || !slot.item) {
            return { success: false, error: 'Slot vazio' };
        }
        
        if (slot.count < count) {
            return { success: false, error: 'Quantidade insuficiente' };
        }
        
        const itemName = slot.item.name;
        
        slot.count -= count;
        
        if (slot.count <= 0) {
            slot.item = null;
            slot.count = 0;
        }
        
        this.updateInventoryStats(inventory);
        
        return {
            success: true,
            message: `${count}x ${itemName} removido`,
            item: slot.item,
            remaining: slot.count
        };
    }

    /**
     * Move um item entre slots
     */
    moveItem(inventory, fromBagIndex, fromSlotIndex, toBagIndex, toSlotIndex) {
        // Obter slots de origem
        let fromSlot;
        if (fromBagIndex === -1) {
            fromSlot = inventory.backpack.slots[fromSlotIndex];
        } else {
            const fromBag = inventory.bagSlots[fromBagIndex]?.bag;
            if (!fromBag) return { success: false, error: 'Bag de origem inválida' };
            fromSlot = fromBag.slots[fromSlotIndex];
        }
        
        // Obter slots de destino
        let toSlot;
        if (toBagIndex === -1) {
            toSlot = inventory.backpack.slots[toSlotIndex];
        } else {
            const toBag = inventory.bagSlots[toBagIndex]?.bag;
            if (!toBag) return { success: false, error: 'Bag de destino inválida' };
            toSlot = toBag.slots[toSlotIndex];
        }
        
        if (!fromSlot.item) {
            return { success: false, error: 'Slot de origem vazio' };
        }
        
        // Tentar stackar se for o mesmo item
        if (toSlot.item && 
            toSlot.item.id === fromSlot.item.id && 
            toSlot.count < this.MAX_STACK_SIZE &&
            !toSlot.item.bound && !fromSlot.item.bound) {
            
            const canMove = Math.min(fromSlot.count, this.MAX_STACK_SIZE - toSlot.count);
            toSlot.count += canMove;
            fromSlot.count -= canMove;
            
            if (fromSlot.count <= 0) {
                fromSlot.item = null;
                fromSlot.count = 0;
            }
            
            this.updateInventoryStats(inventory);
            return { success: true, message: 'Itens stackados' };
        }
        
        // Trocar itens
        const tempItem = toSlot.item;
        const tempCount = toSlot.count;
        
        toSlot.item = fromSlot.item;
        toSlot.count = fromSlot.count;
        
        fromSlot.item = tempItem;
        fromSlot.count = tempCount;
        
        this.updateInventoryStats(inventory);
        
        return { success: true, message: 'Item movido' };
    }

    /**
     * Equipa um item
     */
    equipItem(inventory, bagIndex, slotIndex) {
        let slot;
        if (bagIndex === -1) {
            slot = inventory.backpack.slots[slotIndex];
        } else {
            const bagSlot = inventory.bagSlots[bagIndex];
            if (!bagSlot?.bag) return { success: false, error: 'Bag inválida' };
            slot = bagSlot.bag.slots[slotIndex];
        }
        
        if (!slot.item) {
            return { success: false, error: 'Slot vazio' };
        }
        
        const item = slot.item;
        
        if (!item.equipSlot) {
            return { success: false, error: 'Item não pode ser equipado' };
        }
        
        // Verificar Bind on Equip
        if (item.bindOnEquip && !item.bound) {
            item.bound = true;
            item.boundTo = inventory.playerId;
        }
        
        // Se já há um item equipado, trocar
        const currentlyEquipped = inventory.equipment[item.equipSlot];
        inventory.equipment[item.equipSlot] = {
            ...item,
            originalBagIndex: bagIndex,
            originalSlotIndex: slotIndex
        };
        
        if (currentlyEquipped) {
            // Devolver o item anterior ao slot
            slot.item = { ...currentlyEquipped };
            slot.count = 1;
        } else {
            slot.item = null;
            slot.count = 0;
        }
        
        this.updateInventoryStats(inventory);
        
        return {
            success: true,
            message: `${item.name} equipado`,
            slot: item.equipSlot
        };
    }

    /**
     * Desequipa um item
     */
    unequipItem(inventory, equipSlot) {
        const equipped = inventory.equipment[equipSlot];
        
        if (!equipped) {
            return { success: false, error: 'Nenhum item equipado neste slot' };
        }
        
        // Encontrar slot vazio
        const emptySlot = this.findEmptySlot(inventory);
        if (!emptySlot) {
            return { success: false, error: 'Inventário cheio' };
        }
        
        // Mover item para o inventário
        emptySlot.slot.item = { ...equipped };
        emptySlot.slot.count = 1;
        
        inventory.equipment[equipSlot] = null;
        
        this.updateInventoryStats(inventory);
        
        return {
            success: true,
            message: `${equipped.name} desequipado`,
            bagIndex: emptySlot.bagIndex,
            slotIndex: emptySlot.slotIndex
        };
    }

    /**
     * Desbloqueia um slot de bag (quest lvl 30 ou Premium)
     */
    unlockBagSlot(inventory, slotIndex) {
        if (slotIndex < 0 || slotIndex >= inventory.bagSlots.length) {
            return { success: false, error: 'Slot inválido' };
        }
        
        const slot = inventory.bagSlots[slotIndex];
        
        if (slot.unlocked) {
            return { success: false, error: 'Slot já desbloqueado' };
        }
        
        slot.unlocked = true;
        
        this.updateInventoryStats(inventory);
        
        return {
            success: true,
            message: `Slot de bag ${slotIndex + 1} desbloqueado!`,
            unlockedSlot: slotIndex
        };
    }

    /**
     * Expande o banco (Premium ou gold)
     */
    expandBank(inventory, slots) {
        const newTotal = inventory.bank.unlockedSlots + slots;
        
        if (newTotal > this.BANK_SLOTS) {
            return { success: false, error: `Limite máximo do banco é ${this.BANK_SLOTS} slots` };
        }
        
        // Adicionar novos slots vazios
        for (let i = inventory.bank.slots.length; i < newTotal; i++) {
            inventory.bank.slots.push({
                index: i,
                item: null,
                count: 0
            });
        }
        
        inventory.bank.unlockedSlots = newTotal;
        
        return {
            success: true,
            message: `Banco expandido para ${newTotal} slots`,
            totalSlots: newTotal
        };
    }

    /**
     * Atualiza estatísticas do inventário
     */
    updateInventoryStats(inventory) {
        inventory.totalSlots = this.calculateTotalSlots(inventory);
        inventory.usedSlots = this.calculateUsedSlots(inventory);
        inventory.freeSlots = inventory.totalSlots - inventory.usedSlots;
    }

    /**
     * Serializa o inventário para envio ao cliente
     */
    serializeForClient(inventory) {
        return {
            backpack: {
                type: inventory.backpack.type,
                slots: inventory.backpack.slots.map(s => ({
                    item: s.item ? this.serializeItem(s.item) : null,
                    count: s.count
                }))
            },
            bagSlots: inventory.bagSlots.map((slot, index) => ({
                index,
                unlocked: slot.unlocked,
                bag: slot.bag ? {
                    type: slot.bag.type,
                    slots: slot.bag.slots.map(s => ({
                        item: s.item ? this.serializeItem(s.item) : null,
                        count: s.count
                    }))
                } : null
            })),
            bank: {
                slots: inventory.bank.slots.map(s => ({
                    item: s.item ? this.serializeItem(s.item) : null,
                    count: s.count
                })),
                unlockedSlots: inventory.bank.unlockedSlots,
                maxSlots: inventory.bank.maxSlots
            },
            equipment: inventory.equipment,
            gold: inventory.gold,
            silver: inventory.silver,
            copper: inventory.copper,
            stats: {
                totalSlots: inventory.totalSlots,
                usedSlots: inventory.usedSlots,
                freeSlots: inventory.freeSlots
            }
        };
    }

    /**
     * Serializa um item (remove dados internos)
     */
    serializeItem(item) {
        if (!item) return null;
        
        return {
            id: item.id,
            name: item.name,
            icon: item.icon,
            quality: item.quality,
            bound: item.bound,
            boundTo: item.boundTo,
            stackable: item.stackable,
            equipSlot: item.equipSlot,
            stats: item.stats,
            description: item.description
        };
    }

    /**
     * Adiciona gold ao jogador
     */
    addGold(inventory, amount) {
        const copper = Math.floor(amount);
        inventory.copper += copper;
        
        // Converter copper -> silver -> gold
        while (inventory.copper >= 100) {
            inventory.copper -= 100;
            inventory.silver++;
        }
        
        while (inventory.silver >= 100) {
            inventory.silver -= 100;
            inventory.gold++;
        }
        
        return {
            gold: inventory.gold,
            silver: inventory.silver,
            copper: inventory.copper
        };
    }

    /**
     * Remove gold do jogador
     */
    removeGold(inventory, amount) {
        const totalCopper = inventory.gold * 10000 + inventory.silver * 100 + inventory.copper;
        
        if (totalCopper < amount) {
            return { success: false, error: 'Gold insuficiente' };
        }
        
        let remaining = totalCopper - amount;
        
        inventory.gold = Math.floor(remaining / 10000);
        remaining %= 10000;
        
        inventory.silver = Math.floor(remaining / 100);
        remaining %= 100;
        
        inventory.copper = remaining;
        
        return {
            success: true,
            gold: inventory.gold,
            silver: inventory.silver,
            copper: inventory.copper
        };
    }
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BagSystem;
}

// Exportar para browser
if (typeof window !== 'undefined') {
    window.BagSystem = BagSystem;
}
