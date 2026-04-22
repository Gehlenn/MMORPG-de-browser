/**
 * MerchantManager - Sistema de NPC Mercadores
 * 
 * Gerencia:
 * - Mercadores em diferentes locais
 * - Inventários de lojas
 * - Preços de compra/venda
 * - Transações com gold
 */

class MerchantManager {
    constructor() {
        this.merchants = new Map(); // merchantId -> merchantData
        this.currentMerchant = null;
        this.playerInventory = null;
        this.goldManager = null;
        
        // Configurações de preço
        this.buyMultiplier = 1.0; // Jogador compra pelo preço base
        this.sellMultiplier = 0.5;  // Jogador vende por 50% do preço
        
        // Callbacks
        this.onTransaction = null;
        this.onMerchantOpen = null;
        this.onMerchantClose = null;
        
        this.initialized = false;
    }
    
    init(playerInventory, goldManager) {
        if (this.initialized) return;
        
        this.playerInventory = playerInventory;
        this.goldManager = goldManager;
        
        this.loadMerchants();
        this.initialized = true;
        
        console.log('💰 MerchantManager inicializado');
        console.log('   - Mercadores:', this.merchants.size);
    }
    
    // ===================== MERCHANTS =====================
    
    /**
     * Carrega mercadores do banco de dados
     */
    loadMerchants() {
        if (!window.MerchantDatabase) return;
        
        const merchants = window.MerchantDatabase.getAll();
        for (const merchant of merchants) {
            this.merchants.set(merchant.id, {
                ...merchant,
                inventory: [...merchant.inventory], // Cópia mutável
                lastRestock: Date.now()
            });
        }
    }
    
    /**
     * Retorna um mercador pelo ID
     */
    getMerchant(merchantId) {
        return this.merchants.get(merchantId);
    }
    
    /**
     * Retorna mercadores por zona
     */
    getMerchantsByZone(zoneId) {
        const result = [];
        for (const merchant of this.merchants.values()) {
            if (merchant.zoneId === zoneId) {
                result.push(merchant);
            }
        }
        return result;
    }
    
    /**
     * Retorna mercadores por tipo
     */
    getMerchantsByType(type) {
        const result = [];
        for (const merchant of this.merchants.values()) {
            if (merchant.type === type) {
                result.push(merchant);
            }
        }
        return result;
    }
    
    // ===================== INTERAÇÃO =====================
    
    /**
     * Abre loja de um mercador
     */
    openMerchant(merchantId) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant) {
            console.warn('💰 Mercador não encontrado:', merchantId);
            return false;
        }
        
        // Verificar se precisa reabastecer
        this.checkRestock(merchant);
        
        this.currentMerchant = merchant;
        
        if (this.onMerchantOpen) {
            this.onMerchantOpen(merchant);
        }
        
        console.log('💰 Loja aberta:', merchant.name);
        return true;
    }
    
    /**
     * Fecha loja atual
     */
    closeMerchant() {
        this.currentMerchant = null;
        
        if (this.onMerchantClose) {
            this.onMerchantClose();
        }
        
        console.log('💰 Loja fechada');
    }
    
    /**
     * Verifica e executa reabastecimento
     */
    checkRestock(merchant) {
        const restockInterval = merchant.restockInterval || 30 * 60 * 1000; // 30 min default
        const timeSinceRestock = Date.now() - (merchant.lastRestock || 0);
        
        if (timeSinceRestock >= restockInterval) {
            this.restockMerchant(merchant.id);
        }
    }
    
    /**
     * Reabastece inventário do mercador
     */
    restockMerchant(merchantId) {
        const merchant = this.merchants.get(merchantId);
        if (!merchant) return;
        
        // Resetar para inventário base
        const baseMerchant = window.MerchantDatabase?.getById(merchantId);
        if (baseMerchant) {
            merchant.inventory = [...baseMerchant.inventory];
            merchant.lastRestock = Date.now();
            
            console.log('💰 Mercador reabastecido:', merchant.name);
        }
    }
    
    // ===================== COMPRA/VENDA =====================
    
    /**
     * Calcula preço de compra (jogador compra do NPC)
     */
    getBuyPrice(item) {
        const basePrice = item.value || item.price || 10;
        
        // Multiplicador de raridade
        const rarityMultiplier = {
            'common': 1.0,
            'uncommon': 1.5,
            'rare': 2.5,
            'epic': 5.0,
            'legendary': 10.0
        };
        
        const rarity = item.rarity || 'common';
        return Math.floor(basePrice * this.buyMultiplier * (rarityMultiplier[rarity] || 1.0));
    }
    
    /**
     * Calcula preço de venda (jogador vende para NPC)
     */
    getSellPrice(item) {
        const basePrice = item.value || item.price || 10;
        return Math.floor(basePrice * this.sellMultiplier);
    }
    
    /**
     * Compra item do mercador
     */
    buyItem(itemIndex, quantity = 1) {
        if (!this.currentMerchant) {
            return { success: false, reason: 'no_merchant_open' };
        }
        
        const item = this.currentMerchant.inventory[itemIndex];
        if (!item) {
            return { success: false, reason: 'item_not_found' };
        }
        
        const totalPrice = this.getBuyPrice(item) * quantity;
        
        // Verificar gold
        const playerGold = this.goldManager?.getGold() || 0;
        if (playerGold < totalPrice) {
            return { 
                success: false, 
                reason: 'insufficient_gold', 
                required: totalPrice, 
                has: playerGold 
            };
        }
        
        // Verificar espaço no inventário
        if (this.playerInventory?.isFull()) {
            return { success: false, reason: 'inventory_full' };
        }
        
        // Remover gold
        this.goldManager?.removeGold(totalPrice);
        
        // Adicionar item ao inventário
        const newItem = { ...item, acquiredAt: Date.now() };
        const result = this.playerInventory?.addItem(newItem, quantity, 'bought');
        
        if (!result?.success) {
            // Rollback
            this.goldManager?.addGold(totalPrice);
            return { success: false, reason: 'inventory_error' };
        }
        
        // Remover do estoque se for item limitado
        if (item.stock !== -1) {
            item.stock -= quantity;
            if (item.stock <= 0) {
                this.currentMerchant.inventory.splice(itemIndex, 1);
            }
        }
        
        // Evento
        if (this.onTransaction) {
            this.onTransaction('buy', item, quantity, totalPrice);
        }
        
        // Som
        if (window.audioManager) {
            window.audioManager.playSFX('buy_item');
        }
        
        return {
            success: true,
            item: newItem,
            quantity,
            price: totalPrice
        };
    }
    
    /**
     * Vende item para o mercador
     */
    sellItem(inventorySlot, quantity = 1) {
        if (!this.currentMerchant) {
            return { success: false, reason: 'no_merchant_open' };
        }
        
        // Pegar item do inventário
        const slot = this.playerInventory?.slots[inventorySlot];
        if (!slot || !slot.item) {
            return { success: false, reason: 'item_not_found' };
        }
        
        const item = slot.item;
        const actualQuantity = Math.min(quantity, slot.quantity);
        
        // Verificar se pode vender
        if (!this.canSell(item)) {
            return { success: false, reason: 'cannot_sell' };
        }
        
        const price = this.getSellPrice(item) * actualQuantity;
        
        // Remover do inventário
        const removed = this.playerInventory?.removeItem(inventorySlot, actualQuantity);
        if (!removed) {
            return { success: false, reason: 'remove_failed' };
        }
        
        // Adicionar gold
        this.goldManager?.addGold(price);
        
        // Evento
        if (this.onTransaction) {
            this.onTransaction('sell', item, actualQuantity, price);
        }
        
        // Som
        if (window.audioManager) {
            window.audioManager.playSFX('sell_item');
        }
        
        return {
            success: true,
            item,
            quantity: actualQuantity,
            price
        };
    }
    
    /**
     * Vende todos os itens de uma categoria
     */
    sellAll(category = null) {
        if (!this.currentMerchant) {
            return { success: false, reason: 'no_merchant_open' };
        }
        
        let totalGold = 0;
        let itemsSold = 0;
        const slotsToSell = [];
        
        // Identificar itens para vender (de trás para frente para não afetar índices)
        for (let i = this.playerInventory.slots.length - 1; i >= 0; i--) {
            const slot = this.playerInventory.slots[i];
            if (!slot || !slot.item) continue;
            
            // Pular equipados
            if (slot.item.equipped) continue;
            
            // Pular itens de missão
            if (slot.item.questItem) continue;
            
            // Filtrar por categoria se especificado
            if (category && slot.item.category !== category) continue;
            
            const price = this.getSellPrice(slot.item) * slot.quantity;
            totalGold += price;
            itemsSold += slot.quantity;
            slotsToSell.push({ slot: i, quantity: slot.quantity });
        }
        
        if (itemsSold === 0) {
            return { success: false, reason: 'no_items_to_sell' };
        }
        
        // Executar vendas
        for (const { slot, quantity } of slotsToSell) {
            this.playerInventory.removeItem(slot, quantity);
        }
        
        // Adicionar gold
        this.goldManager?.addGold(totalGold);
        
        // Evento
        if (this.onTransaction) {
            this.onTransaction('sell_bulk', null, itemsSold, totalGold);
        }
        
        return {
            success: true,
            itemsSold,
            totalGold
        };
    }
    
    /**
     * Verifica se um item pode ser vendido
     */
    canSell(item) {
        if (item.questItem) return false;
        if (item.noSell) return false;
        if (item.value === 0 || item.price === 0) return false;
        return true;
    }
    
    // ===================== UTILS =====================
    
    /**
     * Retorna inventário filtrado do mercador atual
     */
    getCurrentMerchantInventory(filter = null) {
        if (!this.currentMerchant) return [];
        
        let inventory = this.currentMerchant.inventory;
        
        if (filter?.category) {
            inventory = inventory.filter(item => item.category === filter.category);
        }
        
        if (filter?.search) {
            const search = filter.search.toLowerCase();
            inventory = inventory.filter(item => 
                item.name?.toLowerCase().includes(search)
            );
        }
        
        return inventory.map((item, index) => ({
            ...item,
            index,
            buyPrice: this.getBuyPrice(item),
            canAfford: this.canAfford(item),
            inStock: item.stock !== 0
        }));
    }
    
    /**
     * Verifica se jogador pode comprar item
     */
    canAfford(item) {
        const price = this.getBuyPrice(item);
        const gold = this.goldManager?.getGold() || 0;
        return gold >= price;
    }
    
    /**
     * Retorna gold atual do jogador
     */
    getPlayerGold() {
        return this.goldManager?.getGold() || 0;
    }
    
    /**
     * Retorna resumo da loja atual
     */
    getShopSummary() {
        if (!this.currentMerchant) return null;
        
        const inventory = this.currentMerchant.inventory;
        const categories = [...new Set(inventory.map(i => i.category))];
        
        return {
            merchant: this.currentMerchant,
            categories,
            totalItems: inventory.length,
            playerGold: this.getPlayerGold()
        };
    }
}

window.MerchantManager = MerchantManager;
