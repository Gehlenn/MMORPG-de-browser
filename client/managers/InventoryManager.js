/**
 * InventoryManager - Sistema de Inventário e Banco
 */
class InventoryManager {
    constructor(playerId) {
        this.playerId = playerId;
        this.config = { baseSlots: 20, maxStackSize: 99, bankSlots: 40 };
        this.inventory = { items: [], gold: 0, equipped: { weapon: null, armor: null, helmet: null, boots: null, accessory1: null, accessory2: null }};
        this.bank = { items: [], gold: 0, tabs: [{ id: 'general', name: 'Geral', items: [] }, { id: 'materials', name: 'Materiais', items: [] }, { id: 'equipment', name: 'Equipamentos', items: [] }], activeTab: 'general' };
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.loadFromStorage();
        this.initialized = true;
        console.log(`📦 InventoryManager inicializado - Slots: ${this.getTotalSlots()}`);
    }

    getTotalSlots() { return this.config.baseSlots; }
    getFreeSlots() { return this.getTotalSlots() - this.inventory.items.length; }
    isFull() { return this.getFreeSlots() <= 0; }

    addItem(item, quantity = 1, source = 'loot') {
        if (!item || !item.id) return { success: false, reason: 'invalid_item' };
        const isStackable = item.stackable !== false && item.maxStack > 1;
        if (isStackable) {
            const existing = this.inventory.items.find(i => i.id === item.id && i.quantity < (item.maxStack || this.config.maxStackSize));
            if (existing) {
                const canAdd = Math.min(quantity, (item.maxStack || this.config.maxStackSize) - existing.quantity);
                existing.quantity += canAdd;
                quantity -= canAdd;
                if (quantity <= 0) { this.saveToStorage(); return { success: true, stacked: true }; }
            }
        }
        if (this.isFull()) return { success: false, reason: 'inventory_full' };
        const slot = this.findFreeSlot();
        this.inventory.items.push({ ...item, slot, quantity: Math.min(quantity, item.maxStack || this.config.maxStackSize), acquiredAt: Date.now(), source });
        this.saveToStorage();
        return { success: true, stacked: false, slot };
    }

    removeItem(slot, quantity = null) {
        const idx = this.inventory.items.findIndex(i => i.slot === slot);
        if (idx === -1) return { success: false, reason: 'not_found' };
        const item = this.inventory.items[idx];
        if (quantity === null || quantity >= item.quantity) {
            this.inventory.items.splice(idx, 1);
            this.saveToStorage();
            return { success: true, removed: true };
        }
        item.quantity -= quantity;
        this.saveToStorage();
        return { success: true, removed: false };
    }

    findFreeSlot() {
        const used = new Set(this.inventory.items.map(i => i.slot));
        for (let i = 0; i < this.getTotalSlots(); i++) if (!used.has(i)) return i;
        return -1;
    }

    equipItem(slot) {
        const item = this.getItemAt(slot);
        if (!item || !item.equipable) return { success: false };
        const equipSlot = item.equipSlot;
        if (!equipSlot || !this.inventory.equipped.hasOwnProperty(equipSlot)) return { success: false };
        if (this.inventory.equipped[equipSlot]) this.unequipItem(equipSlot);
        this.inventory.equipped[equipSlot] = { ...item, equippedAt: Date.now() };
        this.removeItem(slot);
        this.saveToStorage();
        return { success: true, slot: equipSlot };
    }

    unequipItem(equipSlot) {
        const item = this.inventory.equipped[equipSlot];
        if (!item || this.isFull()) return { success: false };
        const slot = this.findFreeSlot();
        this.inventory.items.push({ ...item, slot });
        this.inventory.equipped[equipSlot] = null;
        this.saveToStorage();
        return { success: true, slot };
    }

    depositToBank(slot, quantity = null, tab = 'general') {
        const item = this.getItemAt(slot);
        if (!item || item.bound) return { success: false };
        const bankTab = this.bank.tabs.find(t => t.id === tab);
        if (!bankTab || bankTab.items.length >= this.config.bankSlots / this.bank.tabs.length) return { success: false, reason: 'bank_full' };
        const qty = quantity || item.quantity;
        if (qty < item.quantity) item.quantity -= qty;
        else this.removeItem(slot);
        bankTab.items.push({ ...item, quantity: qty, depositedAt: Date.now() });
        this.saveToStorage();
        return { success: true };
    }

    withdrawFromBank(bankSlot, quantity = null, tab = 'general') {
        const bankTab = this.bank.tabs.find(t => t.id === tab);
        if (!bankTab) return { success: false };
        const item = bankTab.items[bankSlot];
        if (!item) return { success: false };
        if (this.isFull()) return { success: false, reason: 'inventory_full' };
        const qty = quantity || item.quantity;
        this.addItem(item, qty, 'bank');
        if (qty >= item.quantity) bankTab.items.splice(bankSlot, 1);
        else item.quantity -= qty;
        this.saveToStorage();
        return { success: true };
    }

    addGold(amount) {
        if (amount <= 0) return false;
        this.inventory.gold += amount;
        this.saveToStorage();
        return true;
    }

    removeGold(amount) {
        if (amount <= 0 || this.inventory.gold < amount) return false;
        this.inventory.gold -= amount;
        this.saveToStorage();
        return true;
    }

    transferGold(amount, toBank = true) {
        if (toBank) {
            if (this.inventory.gold < amount) return { success: false };
            this.inventory.gold -= amount;
            this.bank.gold += amount;
        } else {
            if (this.bank.gold < amount) return { success: false };
            this.bank.gold -= amount;
            this.inventory.gold += amount;
        }
        this.saveToStorage();
        return { success: true };
    }

    getItemAt(slot) { return this.inventory.items.find(i => i.slot === slot); }
    countItem(itemId) { return this.inventory.items.filter(i => i.id === itemId).reduce((t, i) => t + i.quantity, 0); }
    hasItem(itemId, qty = 1) { return this.countItem(itemId) >= qty; }

    getEquippedStats() {
        const stats = { attack: 0, defense: 0, hp: 0, mana: 0, speed: 0, critChance: 0 };
        Object.values(this.inventory.equipped).forEach(item => {
            if (item?.stats) Object.entries(item.stats).forEach(([s, v]) => { if (stats.hasOwnProperty(s)) stats[s] += v; });
        });
        return stats;
    }

    sortInventory(type = 'name') {
        const sortFn = { name: (a, b) => a.name.localeCompare(b.name), rarity: (a, b) => (b.rarityValue || 0) - (a.rarityValue || 0) }[type] || ((a, b) => a.name.localeCompare(b.name));
        this.inventory.items.sort(sortFn);
        this.inventory.items.forEach((item, idx) => item.slot = idx);
        this.saveToStorage();
    }

    moveItem(from, to) {
        const fromItem = this.getItemAt(from);
        const toItem = this.getItemAt(to);
        if (!fromItem) return { success: false };
        if (toItem && fromItem.id === toItem.id && fromItem.stackable) {
            const max = fromItem.maxStack || this.config.maxStackSize;
            const canMerge = Math.min(fromItem.quantity, max - toItem.quantity);
            if (canMerge > 0) {
                toItem.quantity += canMerge;
                fromItem.quantity -= canMerge;
                if (fromItem.quantity <= 0) this.removeItem(from);
                this.saveToStorage();
                return { success: true, merged: true };
            }
        }
        fromItem.slot = to;
        if (toItem) toItem.slot = from;
        this.saveToStorage();
        return { success: true };
    }

    saveToStorage() {
        try {
            localStorage.setItem(`inv_${this.playerId}`, JSON.stringify({ inv: this.inventory, bank: this.bank, cfg: this.config, ts: Date.now() }));
        } catch (e) { console.warn('Erro ao salvar inventário:', e); }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem(`inv_${this.playerId}`);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.inv) this.inventory = { ...this.inventory, ...data.inv };
                if (data.bank) this.bank = { ...this.bank, ...data.bank };
            }
        } catch (e) { console.warn('Erro ao carregar inventário:', e); }
    }

    getSummary() {
        return { total: this.getTotalSlots(), used: this.inventory.items.length, free: this.getFreeSlots(), gold: this.inventory.gold, bankGold: this.bank.gold };
    }

    clear() {
        this.inventory = { items: [], gold: 0, equipped: { weapon: null, armor: null, helmet: null, boots: null, accessory1: null, accessory2: null } };
        this.bank = { items: [], gold: 0, tabs: this.bank.tabs, activeTab: 'general' };
        this.saveToStorage();
    }
}

window.InventoryManager = InventoryManager;
