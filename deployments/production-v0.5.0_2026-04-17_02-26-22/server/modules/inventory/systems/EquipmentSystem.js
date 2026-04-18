/**
 * EquipmentSystem - Sistema de Equipamentos
 * Gerencia equipamentos dos jogadores e cálculo de stats
 */

class EquipmentSystem {
    constructor() {
        this.name = 'EquipmentSystem';
        
        // Slots de equipamento
        this.equipmentSlots = {
            weapon: { name: 'Weapon', types: ['weapon'] },
            shield: { name: 'Shield', types: ['shield'] },
            head: { name: 'Head', types: ['armor'] },
            chest: { name: 'Chest', types: ['armor'] },
            legs: { name: 'Legs', types: ['armor'] },
            feet: { name: 'Feet', types: ['armor'] },
            hands: { name: 'Hands', types: ['armor'] },
            ring1: { name: 'Ring 1', types: ['accessory'] },
            ring2: { name: 'Ring 2', types: ['accessory'] },
            amulet: { name: 'Amulet', types: ['accessory'] }
        };
        
        console.log('⚔️ EquipmentSystem created');
    }
    
    /**
     * Cria equipamento para um jogador
     * @param {object} player - Dados do jogador
     */
    createEquipment(player) {
        if (!player.equipment) {
            player.equipment = {};
            player.baseStats = this.calculateBaseStats(player);
            player.equipmentStats = {};
            player.totalStats = { ...player.baseStats };
            
            console.log(`⚔️ Equipment created for player ${player.name}`);
        }
    }
    
    /**
     * Equipa um item
     * @param {object} player - Dados do jogador
     * @param {object} item - Dados do item
     * @param {string} slot - Slot de equipamento
     * @returns {object} - Resultado da operação
     */
    equipItem(player, item, slot) {
        if (!player.equipment) {
            this.createEquipment(player);
        }
        
        // Validar slot
        if (!this.equipmentSlots[slot]) {
            return { success: false, error: 'Invalid equipment slot' };
        }
        
        // Validar tipo do item
        const slotConfig = this.equipmentSlots[slot];
        if (!slotConfig.types.includes(item.type)) {
            return { success: false, error: `Cannot equip ${item.type} in ${slotConfig.name} slot` };
        }
        
        // Verificar se jogador pode usar o item
        const { canUseItem } = require('../ItemDatabase');
        if (!canUseItem(player, item)) {
            return { success: false, error: 'Cannot use this item' };
        }
        
        // Obter item atualmente equipado
        const previousItem = player.equipment[slot];
        
        // Equipar novo item
        player.equipment[slot] = { ...item };
        
        // Recalcular stats
        this.recalculateStats(player);
        
        console.log(`⚔️ ${player.name} equipped ${item.name} in ${slotConfig.name}`);
        
        return {
            success: true,
            previousItem: previousItem,
            newStats: player.totalStats
        };
    }
    
    /**
     * Desequipa um item
     * @param {object} player - Dados do jogador
     * @param {string} slot - Slot de equipamento
     * @returns {object} - Resultado da operação
     */
    unequipItem(player, slot) {
        if (!player.equipment) {
            return { success: false, error: 'No equipment found' };
        }
        
        const item = player.equipment[slot];
        if (!item) {
            return { success: false, error: 'No item equipped in this slot' };
        }
        
        // Remover item
        player.equipment[slot] = null;
        
        // Recalcular stats
        this.recalculateStats(player);
        
        console.log(`⚔️ ${player.name} unequipped ${item.name} from ${this.equipmentSlots[slot].name}`);
        
        return {
            success: true,
            item: item,
            newStats: player.totalStats
        };
    }
    
    /**
     * Troca item entre inventário e equipamento
     * @param {object} player - Dados do jogador
     * @param {number} inventorySlot - Slot do inventário
     * @param {string} equipmentSlot - Slot de equipamento
     * @returns {object} - Resultado da operação
     */
    swapItem(player, inventorySlot, equipmentSlot) {
        const inventorySystem = require('./InventorySystem');
        
        // Obter item do inventário
        const inventoryItem = inventorySystem.getItem(player, inventorySlot);
        if (!inventoryItem) {
            return { success: false, error: 'No item in inventory slot' };
        }
        
        // Tentar equipar item
        const equipResult = this.equipItem(player, inventoryItem, equipmentSlot);
        
        if (equipResult.success) {
            // Se havia item anterior equipado, mover para inventário
            if (equipResult.previousItem) {
                const added = inventorySystem.addItem(player, equipResult.previousItem);
                if (!added) {
                    // Se não conseguiu adicionar, desfazer equipamento
                    this.unequipItem(player, equipmentSlot);
                    this.equipItem(player, equipResult.previousItem, equipmentSlot);
                    return { success: false, error: 'No inventory space for previous item' };
                }
            }
            
            // Remover item do inventário
            inventorySystem.removeItem(player, inventorySlot, 1);
            
            return {
                success: true,
                equippedItem: inventoryItem,
                previousItem: equipResult.previousItem,
                newStats: equipResult.newStats
            };
        }
        
        return equipResult;
    }
    
    /**
     * Calcula stats base do jogador
     * @param {object} player - Dados do jogador
     * @returns {object} - Stats base
     */
    calculateBaseStats(player) {
        return {
            level: player.level || 1,
            health: player.hp || 100,
            maxHealth: player.maxHp || 100,
            mana: player.mana || 50,
            maxMana: player.maxMana || 50,
            attack: player.attack || 10,
            defense: player.defense || 5,
            magic: player.magic || 5,
            speed: player.speed || 10,
            critChance: 0.05,
            critDamage: 1.5,
            healthRegen: 1,
            manaRegen: 0.5,
            // Stats base por classe
            strength: player.strength || 10,
            dexterity: player.dexterity || 10,
            intelligence: player.intelligence || 10,
            agility: player.agility || 10
        };
    }
    
    /**
     * Recalcula stats totais do jogador
     * @param {object} player - Dados do jogador
     */
    recalculateStats(player) {
        // Resetar stats de equipamento
        player.equipmentStats = {
            attack: 0,
            defense: 0,
            magic: 0,
            speed: 0,
            critChance: 0,
            critDamage: 1.5,
            maxHealth: 0,
            maxMana: 0,
            healthRegen: 0,
            manaRegen: 0
        };
        
        // Adicionar stats dos equipamentos
        for (const item of Object.values(player.equipment)) {
            if (item && item.stats) {
                for (const [stat, value] of Object.entries(item.stats)) {
                    if (player.equipmentStats[stat] !== undefined) {
                        player.equipmentStats[stat] += value;
                    }
                }
            }
        }
        
        // Calcular stats totais
        player.totalStats = { ...player.baseStats };
        
        // Adicionar bônus de equipamentos
        for (const [stat, value] of Object.entries(player.equipmentStats)) {
            if (player.totalStats[stat] !== undefined) {
                player.totalStats[stat] += value;
            }
        }
        
        // Aplicar limites mínimos
        player.totalStats.health = Math.max(1, player.totalStats.health);
        player.totalStats.mana = Math.max(0, player.totalStats.mana);
        player.totalStats.attack = Math.max(1, player.totalStats.attack);
        player.totalStats.defense = Math.max(0, player.totalStats.defense);
        player.totalStats.critChance = Math.max(0, Math.min(1, player.totalStats.critChance));
        
        // Atualizar stats máximos
        player.maxHp = player.totalStats.maxHealth;
        player.maxMana = player.totalStats.maxMana;
        
        // Limitar HP/MP atuais aos novos máximos
        player.hp = Math.min(player.hp, player.maxHp);
        player.mana = Math.min(player.mana, player.maxMana);
    }
    
    /**
     * Obtém item equipado em um slot
     * @param {object} player - Dados do jogador
     * @param {string} slot - Slot de equipamento
     * @returns {object|null} - Item equipado
     */
    getEquippedItem(player, slot) {
        if (!player.equipment) return null;
        return player.equipment[slot] || null;
    }
    
    /**
     * Obtém todos os itens equipados
     * @param {object} player - Dados do jogador
     * @returns {object} - Itens equipados
     */
    getAllEquippedItems(player) {
        if (!player.equipment) {
            this.createEquipment(player);
        }
        
        return { ...player.equipment };
    }
    
    /**
     * Verifica se jogador tem item equipado em um slot
     * @param {object} player - Dados do jogador
     * @param {string} slot - Slot de equipamento
     * @returns {boolean} - Tem item equipado
     */
    hasItemEquipped(player, slot) {
        return !!this.getEquippedItem(player, slot);
    }
    
    /**
     * Obtém power level do jogador
     * @param {object} player - Dados do jogador
     * @returns {number} - Power level
     */
    getPowerLevel(player) {
        if (!player.totalStats) {
            this.recalculateStats(player);
        }
        
        const stats = player.totalStats;
        
        // Fórmula simples de power level
        const powerLevel = 
            (stats.attack * 2) +
            (stats.defense * 1.5) +
            (stats.magic * 1.8) +
            (stats.maxHealth * 0.1) +
            (stats.maxMana * 0.05) +
            (stats.speed * 0.5) +
            (stats.critChance * 100) +
            (stats.level * 10);
        
        return Math.floor(powerLevel);
    }
    
    /**
     * Obtém resumo do equipamento para cliente
     * @param {object} player - Dados do jogador
     * @returns {object} - Resumo do equipamento
     */
    getEquipmentSummary(player) {
        if (!player.equipment) {
            this.createEquipment(player);
        }
        
        const summary = {
            equipment: {},
            stats: player.totalStats,
            powerLevel: this.getPowerLevel(player)
        };
        
        // Adicionar itens equipados
        for (const [slot, item] of Object.entries(player.equipment)) {
            if (item) {
                summary.equipment[slot] = {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    rarity: item.rarity,
                    icon: item.icon,
                    stats: item.stats || {}
                };
            }
        }
        
        return summary;
    }
    
    /**
     * Obtém slots disponíveis para um tipo de item
     * @param {string} itemType - Tipo do item
     * @returns {array} - Slots disponíveis
     */
    getAvailableSlots(itemType) {
        const availableSlots = [];
        
        for (const [slotName, slotConfig] of Object.entries(this.equipmentSlots)) {
            if (slotConfig.types.includes(itemType)) {
                availableSlots.push({
                    slot: slotName,
                    name: slotConfig.name,
                    types: slotConfig.types
                });
            }
        }
        
        return availableSlots;
    }
    
    /**
     * Valida se item pode ser equipado em um slot
     * @param {object} item - Dados do item
     * @param {string} slot - Slot de equipamento
     * @returns {boolean} - Pode equipar
     */
    canEquipInSlot(item, slot) {
        const slotConfig = this.equipmentSlots[slot];
        return slotConfig && slotConfig.types.includes(item.type);
    }
    
    /**
     * Obtém bônus de equipamento para um stat específico
     * @param {object} player - Dados do jogador
     * @param {string} stat - Stat desejado
     * @returns {number} - Bônus do equipamento
     */
    getEquipmentBonus(player, stat) {
        if (!player.equipmentStats) return 0;
        return player.equipmentStats[stat] || 0;
    }
    
    /**
     * Aplica penalidades de equipamento (ex: armadura pesada)
     * @param {object} player - Dados do jogador
     */
    applyEquipmentPenalties(player) {
        if (!player.totalStats) return;
        
        // Penalidade de armadura pesada
        let heavyArmorPenalty = 0;
        
        for (const item of Object.values(player.equipment)) {
            if (item && item.subtype === 'heavy') {
                heavyArmorPenalty += 5; // -5 de velocidade por peça de armadura pesada
            }
        }
        
        if (heavyArmorPenalty > 0) {
            player.totalStats.speed = Math.max(1, player.totalStats.speed - heavyArmorPenalty);
            console.log(`⚔️ Applied heavy armor penalty: -${heavyArmorPenalty} speed`);
        }
    }
    
    /**
     * Limpa todo o equipamento
     * @param {object} player - Dados do jogador
     */
    clearEquipment(player) {
        if (player.equipment) {
            player.equipment = {};
            this.recalculateStats(player);
            console.log(`⚔️ Cleared all equipment for player ${player.name}`);
        }
    }
    
    /**
     * Obtém estatísticas do sistema
     * @returns {object} - Estatísticas
     */
    getStats() {
        return {
            name: this.name,
            equipmentSlots: Object.keys(this.equipmentSlots).length,
            slotTypes: this.equipmentSlots
        };
    }
}

module.exports = EquipmentSystem;
