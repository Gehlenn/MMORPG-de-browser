/**
 * LootSystem - Sistema de Loot
 * Gerencia drop de itens de mobs e recompensas
 */

class LootSystem {
    constructor() {
        this.name = 'LootSystem';
        
        // Configurações
        this.config = {
            baseDropChance: 0.3,        // 30% chance base de drop
            maxDropsPerMob: 3,           // Máximo de itens por mob
            goldDropMultiplier: 1.0,    // Multiplicador de gold
            rareItemChance: 0.05,       // 5% chance de item raro
            epicItemChance: 0.01,       // 1% chance de item épico
            levelScalingFactor: 0.1     // Fator de escalonamento por nível
        };
        
        // Tabelas de loot
        this.lootTables = {
            // Mobs de nível baixo (1-10)
            low_level: {
                common: ['potion_health_small', 'iron_ore', 'leather_hide', 'gold_coin'],
                uncommon: ['sword_iron', 'armor_leather', 'bow_short'],
                rare: ['sword_steel', 'ring_health'],
                epic: []
            },
            
            // Mobs de nível médio (11-20)
            mid_level: {
                common: ['potion_health_large', 'iron_ore', 'magic_crystal', 'gold_coin'],
                uncommon: ['sword_steel', 'armor_chain', 'staff_apprentice', 'amulet_mana'],
                rare: ['sword_steel', 'staff_mystic', 'armor_iron'],
                epic: ['staff_mystic']
            },
            
            // Mobs de nível alto (21+)
            high_level: {
                common: ['potion_health_large', 'magic_crystal', 'gold_coin'],
                uncommon: ['armor_iron', 'staff_mystic'],
                rare: ['armor_iron', 'staff_mystic'],
                epic: ['armor_iron']
            }
        };
        
        console.log('💰 LootSystem created');
    }
    
    /**
     * Gera loot para um mob
     * @param {object} mob - Dados do mob
     * @param {object} killer - Dados do matador
     * @returns {array} - Itens dropados
     */
    generateLoot(mob, killer) {
        const loot = [];
        
        // Calcular chance de drop baseada no nível do mob e do killer
        const dropChance = this.calculateDropChance(mob, killer);
        
        // Sortear se vai dropar algo
        if (Math.random() < dropChance) {
            // Determinar quantos itens vão dropar
            const dropCount = this.calculateDropCount(mob);
            
            for (let i = 0; i < dropCount; i++) {
                const item = this.rollLootItem(mob, killer);
                if (item) {
                    loot.push(item);
                }
            }
        }
        
        // Sempre dropar gold
        const gold = this.generateGoldDrop(mob, killer);
        if (gold > 0) {
            loot.push({
                id: 'gold_coin',
                name: 'Gold Coin',
                type: 'currency',
                subtype: 'coin',
                rarity: 'common',
                quantity: gold,
                stackable: true,
                description: `${gold} gold coins`
            });
        }
        
        if (loot.length > 0) {
            console.log(`💰 Mob ${mob.name} dropped ${loot.length} items for ${killer.name}`);
        }
        
        return loot;
    }
    
    /**
     * Calcula chance de drop
     * @param {object} mob - Dados do mob
     * @param {object} killer - Dados do matador
     * @returns {number} - Chance de drop (0-1)
     */
    calculateDropChance(mob, killer) {
        let chance = this.config.baseDropChance;
        
        // Bônus por diferença de nível
        const levelDiff = killer.level - (mob.level || 1);
        if (levelDiff > 0) {
            // Killer mais alto nível = menor chance
            chance *= Math.max(0.1, 1 - (levelDiff * 0.05));
        } else if (levelDiff < 0) {
            // Killer mais baixo nível = maior chance
            chance *= Math.min(2.0, 1 + (Math.abs(levelDiff) * 0.1));
        }
        
        // Bônus por luck stat (se existir)
        if (killer.luck) {
            chance *= (1 + killer.luck * 0.01);
        }
        
        return Math.min(1.0, Math.max(0.0, chance));
    }
    
    /**
     * Calcula quantidade de itens dropados
     * @param {object} mob - Dados do mob
     * @returns {number} - Quantidade de itens
     */
    calculateDropCount(mob) {
        let count = 1;
        
        // Mobs mais altos podem dropar mais itens
        if (mob.level > 10) {
            count = Math.floor(1 + (mob.level / 10));
        }
        
        // Limitar pelo máximo configurado
        return Math.min(count, this.config.maxDropsPerMob);
    }
    
    /**
     * Sorteia um item para drop
     * @param {object} mob - Dados do mob
     * @param {object} killer - Dados do matador
     * @returns {object|null} - Item dropado
     */
    rollLootItem(mob, killer) {
        // Obter tabela de loot apropriada
        const lootTable = this.getLootTable(mob.level || 1);
        
        // Sortear raridade
        const rarity = this.rollRarity();
        
        // Obter itens da raridade
        const items = lootTable[rarity];
        if (!items || items.length === 0) {
            return null;
        }
        
        // Sortear item
        const itemId = items[Math.floor(Math.random() * items.length)];
        const { getItem } = require('../ItemDatabase');
        const item = getItem(itemId);
        
        if (!item) {
            return null;
        }
        
        // Criar cópia do item com quantidade
        const lootItem = { ...item };
        
        // Se for stackable, sortear quantidade
        if (item.stackable) {
            lootItem.quantity = this.rollItemQuantity(item, mob);
        } else {
            lootItem.quantity = 1;
        }
        
        return lootItem;
    }
    
    /**
     * Sorteia raridade do item
     * @returns {string} - Raridade
     */
    rollRarity() {
        const roll = Math.random();
        
        if (roll < this.config.epicItemChance) {
            return 'epic';
        } else if (roll < this.config.rareItemChance) {
            return 'rare';
        } else if (roll < 0.3) {
            return 'uncommon';
        } else {
            return 'common';
        }
    }
    
    /**
     * Sorteia quantidade de item
     * @param {object} item - Dados do item
     * @param {object} mob - Dados do mob
     * @returns {number} - Quantidade
     */
    rollItemQuantity(item, mob) {
        let quantity = 1;
        
        if (item.type === 'currency') {
            // Gold: baseado no nível do mob
            quantity = Math.floor(1 + (mob.level || 1) * 2);
            quantity = Math.floor(quantity * this.config.goldDropMultiplier);
        } else if (item.type === 'material') {
            // Materials: 1-3 unidades
            quantity = Math.floor(1 + Math.random() * 3);
        } else if (item.type === 'consumable') {
            // Consumables: 1-2 unidades
            quantity = Math.floor(1 + Math.random() * 2);
        }
        
        return quantity;
    }
    
    /**
     * Gera drop de gold
     * @param {object} mob - Dados do mob
     * @param {object} killer - Dados do matador
     * @returns {number} - Quantidade de gold
     */
    generateGoldDrop(mob, killer) {
        let baseGold = Math.floor((mob.level || 1) * 5);
        
        // Modificador por tipo de mob
        if (mob.type === 'elite') {
            baseGold *= 3;
        } else if (mob.type === 'boss') {
            baseGold *= 10;
        }
        
        // Bônus por diferença de nível
        const levelDiff = killer.level - (mob.level || 1);
        if (levelDiff > 5) {
            baseGold *= 0.5; // Penalidade por nível muito mais alto
        } else if (levelDiff < -5) {
            baseGold *= 2; // Bônus por desafio
        }
        
        // Randomização (±50%)
        const randomFactor = 0.5 + Math.random();
        baseGold = Math.floor(baseGold * randomFactor);
        
        // Aplicar multiplicador de gold
        baseGold = Math.floor(baseGold * this.config.goldDropMultiplier);
        
        return Math.max(1, baseGold);
    }
    
    /**
     * Obtém tabela de loot apropriada
     * @param {number} level - Nível
     * @returns {object} - Tabela de loot
     */
    getLootTable(level) {
        if (level <= 10) {
            return this.lootTables.low_level;
        } else if (level <= 20) {
            return this.lootTables.mid_level;
        } else {
            return this.lootTables.high_level;
        }
    }
    
    /**
     * Gera loot para baú
     * @param {string} chestType - Tipo de baú
     * @param {number} level - Nível do baú
     * @returns {array} - Itens do baú
     */
    generateChestLoot(chestType, level) {
        const loot = [];
        
        // Configurações por tipo de baú
        const chestConfigs = {
            common: {
                dropChance: 0.8,
                maxDrops: 3,
                goldMultiplier: 2.0,
                rareChance: 0.1
            },
            uncommon: {
                dropChance: 0.9,
                maxDrops: 5,
                goldMultiplier: 5.0,
                rareChance: 0.2
            },
            rare: {
                dropChance: 1.0,
                maxDrops: 8,
                goldMultiplier: 10.0,
                rareChance: 0.4
            }
        };
        
        const config = chestConfigs[chestType] || chestConfigs.common;
        
        // Sempre dropar gold
        const gold = Math.floor(level * 10 * config.goldMultiplier);
        loot.push({
            id: 'gold_coin',
            name: 'Gold Coin',
            type: 'currency',
            quantity: gold,
            stackable: true
        });
        
        // Sortear itens
        if (Math.random() < config.dropChance) {
            const dropCount = Math.floor(1 + Math.random() * config.maxDrops);
            
            for (let i = 0; i < dropCount; i++) {
                // Aumentar chance de itens raros em baús
                const originalRareChance = this.config.rareItemChance;
                this.config.rareItemChance = config.rareChance;
                
                const item = this.rollLootItem({ level }, { level });
                if (item) {
                    loot.push(item);
                }
                
                // Restaurar chance original
                this.config.rareItemChance = originalRareChance;
            }
        }
        
        return loot;
    }
    
    /**
     * Gera loot para quest
     * @param {array} questRewards - Recompensas da quest
     * @param {object} player - Dados do jogador
     * @returns {array} - Itens da quest
     */
    generateQuestLoot(questRewards, player) {
        const loot = [];
        
        for (const reward of questRewards) {
            if (reward.type === 'item') {
                const { getItem } = require('../ItemDatabase');
                const item = getItem(reward.itemId);
                
                if (item) {
                    const lootItem = { ...item };
                    
                    if (reward.quantity) {
                        lootItem.quantity = reward.quantity;
                    } else {
                        lootItem.quantity = item.stackable ? 1 : 1;
                    }
                    
                    loot.push(lootItem);
                }
            } else if (reward.type === 'gold') {
                loot.push({
                    id: 'gold_coin',
                    name: 'Gold Coin',
                    type: 'currency',
                    quantity: reward.amount,
                    stackable: true
                });
            } else if (reward.type === 'experience') {
                // XP é handled separadamente
                continue;
            }
        }
        
        return loot;
    }
    
    /**
     * Verifica se um item pode ser dropado por um mob
     * @param {string} itemId - ID do item
     * @param {object} mob - Dados do mob
     * @returns {boolean} - Pode dropar
     */
    canDrop(itemId, mob) {
        const lootTable = this.getLootTable(mob.level || 1);
        
        for (const rarityItems of Object.values(lootTable)) {
            if (rarityItems.includes(itemId)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Obtém informações de drop de um mob
     * @param {object} mob - Dados do mob
     * @returns {object} - Informações de drop
     */
    getMobDropInfo(mob) {
        const lootTable = this.getLootTable(mob.level || 1);
        
        const info = {
            possibleItems: [],
            dropChance: this.calculateDropChance(mob, { level: mob.level }),
            maxDrops: this.calculateDropCount(mob),
            goldRange: {
                min: Math.floor((mob.level || 1) * 5 * 0.5),
                max: Math.floor((mob.level || 1) * 5 * 1.5)
            }
        };
        
        // Coletar todos os itens possíveis
        for (const [rarity, items] of Object.entries(lootTable)) {
            for (const itemId of items) {
                const { getItem } = require('../ItemDatabase');
                const item = getItem(itemId);
                
                if (item) {
                    info.possibleItems.push({
                        ...item,
                        rarity: rarity,
                        dropChance: this.getRarityDropChance(rarity)
                    });
                }
            }
        }
        
        return info;
    }
    
    /**
     * Obtém chance de drop por raridade
     * @param {string} rarity - Raridade
     * @returns {number} - Chance de drop
     */
    getRarityDropChance(rarity) {
        switch (rarity) {
            case 'common': return 0.6;
            case 'uncommon': return 0.3;
            case 'rare': return 0.08;
            case 'epic': return 0.02;
            default: return 0.1;
        }
    }
    
    /**
     * Atualiza configurações do sistema
     * @param {object} newConfig - Nova configuração
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('💰 LootSystem configuration updated');
    }
    
    /**
     * Obtém estatísticas do sistema
     * @returns {object} - Estatísticas
     */
    getStats() {
        return {
            name: this.name,
            config: this.config,
            lootTables: Object.keys(this.lootTables)
        };
    }
}

module.exports = LootSystem;
