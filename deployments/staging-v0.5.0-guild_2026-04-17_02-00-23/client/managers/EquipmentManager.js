/**
 * EquipmentManager.js
 * Gerenciamento de equipamento no cliente - equipa, desequipa, calcula bônus de stats
 * Parte da refatoração MVP (Passo 2)
 */

class EquipmentManager {
    constructor(gameplayEngine) {
        this.engine = gameplayEngine;
        this.equipment = {
            weapon: null,
            armor: null,
            helmet: null,
            shield: null,
            accessory: null,
            boots: null
        };
        
        this.equipmentStats = {
            attack: 0,
            defense: 0,
            speed: 0,
            maxHealth: 0,
            maxMana: 0
        };
        
        // Configurações de slots válidos
        this.validSlots = ['weapon', 'armor', 'helmet', 'shield', 'accessory', 'boots'];
    }

    // ========== EQUIPAMENTO BÁSICO ==========
    
    equipItem(item, slot) {
        if (!item) {
            console.warn('EquipmentManager: Tentativa de equipar item nulo');
            return { success: false, error: 'Item inválido' };
        }
        
        // Validar slot
        const targetSlot = slot || this.getSlotForItem(item);
        if (!this.validSlots.includes(targetSlot)) {
            console.warn('EquipmentManager: Slot inválido:', targetSlot);
            return { success: false, error: 'Slot inválido' };
        }
        
        // Verificar se já tem algo equipado
        const previousItem = this.equipment[targetSlot];
        
        // Equipar novo item
        this.equipment[targetSlot] = {
            id: item.id,
            name: item.name,
            type: item.type,
            slot: targetSlot,
            stats: item.stats || {},
            rarity: item.rarity || 'common',
            level: item.level || 1,
            icon: item.icon || null
        };
        
        // Recalcular stats
        this.recalculateStats();
        
        console.log(`⚔️ Equipado: ${item.name} no slot ${targetSlot}`);
        
        // Notificação
        if (this.engine.hud) {
            this.engine.hud.addChatMessage(`⚔️ Equipado: ${item.name}`, '#64B5F6');
        }
        
        return { 
            success: true, 
            slot: targetSlot,
            item: this.equipment[targetSlot],
            previousItem: previousItem
        };
    }
    
    unequipItem(slot) {
        if (!this.validSlots.includes(slot)) {
            console.warn('EquipmentManager: Slot inválido para desequipar:', slot);
            return { success: false, error: 'Slot inválido' };
        }
        
        const item = this.equipment[slot];
        if (!item) {
            return { success: false, error: 'Nada equipado neste slot' };
        }
        
        this.equipment[slot] = null;
        this.recalculateStats();
        
        console.log(`Unequipado: ${item.name} do slot ${slot}`);
        
        if (this.engine.hud) {
            this.engine.hud.addChatMessage(`${item.name} desequipado`, '#9E9E9E');
        }
        
        return { success: true, item: item, slot: slot };
    }
    
    getEquippedItem(slot) {
        return this.equipment[slot] || null;
    }
    
    getAllEquipment() {
        return { ...this.equipment };
    }
    
    // ========== SLOTS E VALIDAÇÃO ==========
    
    getSlotForItem(item) {
        if (!item) return null;
        
        // Se o item já tem slot definido
        if (item.slot && this.validSlots.includes(item.slot)) {
            return item.slot;
        }
        
        // Inferir pelo tipo
        const typeToSlot = {
            'sword': 'weapon',
            'axe': 'weapon',
            'bow': 'weapon',
            'staff': 'weapon',
            'dagger': 'weapon',
            'armor': 'armor',
            'chest': 'armor',
            'helmet': 'helmet',
            'hat': 'helmet',
            'shield': 'shield',
            'boots': 'boots',
            'shoes': 'boots',
            'ring': 'accessory',
            'amulet': 'accessory',
            'necklace': 'accessory'
        };
        
        return typeToSlot[item.type] || 'accessory';
    }
    
    canEquipItem(item, playerLevel = 1) {
        if (!item) return false;
        
        // Verificar level requirement
        if (item.level && playerLevel < item.level) {
            return { canEquip: false, reason: `Requer nível ${item.level}` };
        }
        
        // Verificar classe (se aplicável)
        if (item.class && this.engine.player && this.engine.player.class !== item.class) {
            return { canEquip: false, reason: `Classe ${item.class} necessária` };
        }
        
        return { canEquip: true };
    }
    
    // ========== STATS E BÔNUS ==========
    
    recalculateStats() {
        const oldStats = { ...this.equipmentStats };
        
        // Resetar stats
        this.equipmentStats = {
            attack: 0,
            defense: 0,
            speed: 0,
            maxHealth: 0,
            maxMana: 0,
            strength: 0,
            agility: 0,
            intelligence: 0
        };
        
        // Somar bônus de todos os itens equipados
        Object.values(this.equipment).forEach(item => {
            if (item && item.stats) {
                Object.entries(item.stats).forEach(([stat, value]) => {
                    if (this.equipmentStats[stat] !== undefined) {
                        this.equipmentStats[stat] += value;
                    }
                });
            }
        });
        
        // Aplicar ao player se disponível
        if (this.engine.player) {
            this.applyStatsToPlayer();
        }
        
        // Notificar mudança
        if (this.engine.hud && this.statsChanged(oldStats, this.equipmentStats)) {
            this.engine.hud.updateEquipmentStats(this.equipmentStats);
        }
        
        return this.equipmentStats;
    }
    
    applyStatsToPlayer() {
        if (!this.engine.player) return;
        
        // Aplicar bônus (o engine/servidor deve calcular os stats finais)
        // Isso é mais para referência local
        this.engine.player.equipmentBonus = { ...this.equipmentStats };
    }
    
    getTotalStats() {
        return { ...this.equipmentStats };
    }
    
    getStatBonus(stat) {
        return this.equipmentStats[stat] || 0;
    }
    
    statsChanged(oldStats, newStats) {
        return Object.keys(oldStats).some(key => oldStats[key] !== newStats[key]);
    }
    
    // ========== COMPARAÇÃO DE ITENS ==========
    
    compareItemWithEquipped(item) {
        const slot = this.getSlotForItem(item);
        const equipped = this.getEquippedItem(slot);
        
        if (!equipped) {
            return { 
                better: true, 
                reason: 'Nada equipado',
                statComparison: this.getStatComparison(null, item)
            };
        }
        
        // Comparar stats totais
        const equippedTotal = this.getTotalItemStats(equipped);
        const newTotal = this.getTotalItemStats(item);
        
        const comparison = {
            attack: (item.stats?.attack || 0) - (equipped.stats?.attack || 0),
            defense: (item.stats?.defense || 0) - (equipped.stats?.defense || 0),
            speed: (item.stats?.speed || 0) - (equipped.stats?.speed || 0),
            maxHealth: (item.stats?.maxHealth || 0) - (equipped.stats?.maxHealth || 0)
        };
        
        const isBetter = Object.values(comparison).some(diff => diff > 0);
        const isWorse = Object.values(comparison).every(diff => diff <= 0) && 
                        Object.values(comparison).some(diff => diff < 0);
        
        return {
            better: isBetter,
            worse: isWorse,
            equipped: equipped,
            comparison: comparison,
            statComparison: this.getStatComparison(equipped, item)
        };
    }
    
    getTotalItemStats(item) {
        if (!item || !item.stats) return 0;
        return Object.values(item.stats).reduce((sum, val) => sum + (val || 0), 0);
    }
    
    getStatComparison(equipped, newItem) {
        const stats = ['attack', 'defense', 'speed', 'maxHealth', 'maxMana'];
        const comparison = {};
        
        stats.forEach(stat => {
            const equippedVal = equipped?.stats?.[stat] || 0;
            const newVal = newItem?.stats?.[stat] || 0;
            const diff = newVal - equippedVal;
            
            if (diff !== 0) {
                comparison[stat] = {
                    equipped: equippedVal,
                    new: newVal,
                    diff: diff,
                    better: diff > 0
                };
            }
        });
        
        return comparison;
    }
    
    // ========== SINCRONIZAÇÃO COM SERVIDOR ==========
    
    syncEquipmentFromServer(serverEquipment) {
        if (!serverEquipment) return;
        
        // Atualizar equipamentos
        Object.keys(serverEquipment).forEach(slot => {
            if (this.validSlots.includes(slot)) {
                const item = serverEquipment[slot];
                if (item) {
                    this.equipment[slot] = {
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        slot: slot,
                        stats: item.stats || {},
                        rarity: item.rarity || 'common',
                        level: item.level || 1,
                        icon: item.icon || null
                    };
                } else {
                    this.equipment[slot] = null;
                }
            }
        });
        
        this.recalculateStats();
        console.log('EquipmentManager: Equipamento sincronizado com servidor');
    }
    
    handleEquipmentSync(data) {
        if (!data || !data.equipment) return;
        
        this.syncEquipmentFromServer(data.equipment);
        
        if (this.engine.hud) {
            this.engine.hud.updateEquipment(this.getAllEquipment());
        }
    }
    
    // ========== SERIALIZAÇÃO ==========
    
    serializeForNetwork() {
        const serialized = {};
        
        Object.entries(this.equipment).forEach(([slot, item]) => {
            if (item) {
                serialized[slot] = {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    stats: item.stats,
                    rarity: item.rarity,
                    level: item.level
                };
            } else {
                serialized[slot] = null;
            }
        });
        
        return serialized;
    }
    
    // ========== UTILITÁRIOS ==========
    
    isSlotEmpty(slot) {
        return !this.equipment[slot];
    }
    
    getEmptySlots() {
        return this.validSlots.filter(slot => !this.equipment[slot]);
    }
    
    getEquippedCount() {
        return Object.values(this.equipment).filter(item => item !== null).length;
    }
    
    hasFullSet() {
        return this.getEquippedCount() === this.validSlots.length;
    }
    
    // ========== UI HELPERS ==========
    
    getEquipmentForUI() {
        return Object.entries(this.equipment).map(([slot, item]) => ({
            slot: slot,
            slotName: this.getSlotDisplayName(slot),
            item: item,
            empty: !item,
            icon: item?.icon || this.getDefaultIconForSlot(slot)
        }));
    }
    
    getSlotDisplayName(slot) {
        const names = {
            'weapon': 'Arma',
            'armor': 'Armadura',
            'helmet': 'Capacete',
            'shield': 'Escudo',
            'accessory': 'Acessório',
            'boots': 'Botas'
        };
        return names[slot] || slot;
    }
    
    getDefaultIconForSlot(slot) {
        const icons = {
            'weapon': '⚔️',
            'armor': '🛡️',
            'helmet': '⛑️',
            'shield': '🛡️',
            'accessory': '💍',
            'boots': '🥾'
        };
        return icons[slot] || '📦';
    }
}

// Exportar para uso global
window.EquipmentManager = EquipmentManager;
