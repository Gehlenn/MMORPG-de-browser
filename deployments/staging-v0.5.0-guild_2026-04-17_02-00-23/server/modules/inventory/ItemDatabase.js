/**
 * ItemDatabase - Banco de Dados de Itens
 * Contém todos os itens do jogo com suas propriedades
 */

const items = {
    // Weapons - Espadas
    sword_iron: {
        id: 'sword_iron',
        name: 'Iron Sword',
        type: 'weapon',
        subtype: 'sword',
        rarity: 'common',
        level: 5,
        attack: 10,
        defense: 0,
        magic: 0,
        speed: 0,
        critChance: 0.05,
        description: 'A basic iron sword, reliable and sturdy.',
        icon: 'sword_iron.png',
        stackable: false,
        tradable: true,
        sellPrice: 25,
        buyPrice: 50,
        requirements: {
            level: 5,
            class: ['warrior', 'ranger'],
            strength: 10
        },
        stats: {
            attack: 10,
            critChance: 0.05
        }
    },
    
    sword_steel: {
        id: 'sword_steel',
        name: 'Steel Sword',
        type: 'weapon',
        subtype: 'sword',
        rarity: 'uncommon',
        level: 15,
        attack: 25,
        defense: 5,
        magic: 0,
        speed: 0,
        critChance: 0.08,
        description: 'A well-crafted steel sword with enhanced durability.',
        icon: 'sword_steel.png',
        stackable: false,
        tradable: true,
        sellPrice: 100,
        buyPrice: 200,
        requirements: {
            level: 15,
            class: ['warrior', 'ranger'],
            strength: 20
        },
        stats: {
            attack: 25,
            defense: 5,
            critChance: 0.08
        }
    },
    
    // Weapons - Staffs
    staff_apprentice: {
        id: 'staff_apprentice',
        name: 'Apprentice Staff',
        type: 'weapon',
        subtype: 'staff',
        rarity: 'common',
        level: 5,
        attack: 2,
        defense: 0,
        magic: 12,
        speed: 0,
        critChance: 0.02,
        manaRegen: 2,
        description: 'A simple wooden staff used by apprentice mages.',
        icon: 'staff_apprentice.png',
        stackable: false,
        tradable: true,
        sellPrice: 30,
        buyPrice: 60,
        requirements: {
            level: 5,
            class: ['mage'],
            intelligence: 12
        },
        stats: {
            attack: 2,
            magic: 12,
            manaRegen: 2,
            critChance: 0.02
        }
    },
    
    staff_mystic: {
        id: 'staff_mystic',
        name: 'Mystic Staff',
        type: 'weapon',
        subtype: 'staff',
        rarity: 'rare',
        level: 25,
        attack: 5,
        defense: 10,
        magic: 45,
        speed: 0,
        critChance: 0.10,
        manaRegen: 5,
        description: 'An enchanted staff that channels mystical energies.',
        icon: 'staff_mystic.png',
        stackable: false,
        tradable: true,
        sellPrice: 500,
        buyPrice: 1000,
        requirements: {
            level: 25,
            class: ['mage'],
            intelligence: 35
        },
        stats: {
            attack: 5,
            defense: 10,
            magic: 45,
            manaRegen: 5,
            critChance: 0.10
        }
    },
    
    // Weapons - Bows
    bow_short: {
        id: 'bow_short',
        name: 'Shortbow',
        type: 'weapon',
        subtype: 'bow',
        rarity: 'common',
        level: 5,
        attack: 8,
        defense: 0,
        magic: 0,
        speed: 15,
        critChance: 0.12,
        range: 150,
        description: 'A lightweight shortbow perfect for quick shots.',
        icon: 'bow_short.png',
        stackable: false,
        tradable: true,
        sellPrice: 35,
        buyPrice: 70,
        requirements: {
            level: 5,
            class: ['ranger'],
            dexterity: 12
        },
        stats: {
            attack: 8,
            speed: 15,
            critChance: 0.12,
            range: 150
        }
    },
    
    // Armor - Light
    armor_leather: {
        id: 'armor_leather',
        name: 'Leather Armor',
        type: 'armor',
        subtype: 'light',
        rarity: 'common',
        level: 3,
        attack: 0,
        defense: 8,
        magic: 0,
        speed: 5,
        description: 'Basic leather armor providing decent protection.',
        icon: 'armor_leather.png',
        stackable: false,
        tradable: true,
        sellPrice: 20,
        buyPrice: 40,
        requirements: {
            level: 3,
            class: ['warrior', 'ranger', 'mage'],
            agility: 8
        },
        stats: {
            defense: 8,
            speed: 5
        }
    },
    
    armor_chain: {
        id: 'armor_chain',
        name: 'Chain Mail',
        type: 'armor',
        subtype: 'medium',
        rarity: 'uncommon',
        level: 12,
        attack: 0,
        defense: 20,
        magic: 0,
        speed: -5,
        description: 'Interlocking metal rings provide solid protection.',
        icon: 'armor_chain.png',
        stackable: false,
        tradable: true,
        sellPrice: 120,
        buyPrice: 240,
        requirements: {
            level: 12,
            class: ['warrior'],
            strength: 18
        },
        stats: {
            defense: 20,
            speed: -5
        }
    },
    
    // Armor - Heavy
    armor_iron: {
        id: 'armor_iron',
        name: 'Iron Plate Armor',
        type: 'armor',
        subtype: 'heavy',
        rarity: 'rare',
        level: 20,
        attack: 0,
        defense: 35,
        magic: 0,
        speed: -10,
        description: 'Heavy iron plate armor offering maximum protection.',
        icon: 'armor_iron.png',
        stackable: false,
        tradable: true,
        sellPrice: 400,
        buyPrice: 800,
        requirements: {
            level: 20,
            class: ['warrior'],
            strength: 30
        },
        stats: {
            defense: 35,
            speed: -10
        }
    },
    
    // Armor - Robes
    robe_mage: {
        id: 'robe_mage',
        name: 'Mage Robe',
        type: 'armor',
        subtype: 'robe',
        rarity: 'common',
        level: 5,
        attack: 0,
        defense: 3,
        magic: 8,
        speed: 0,
        manaRegen: 3,
        description: 'Lightweight robes enchanted with magical properties.',
        icon: 'robe_mage.png',
        stackable: false,
        tradable: true,
        sellPrice: 25,
        buyPrice: 50,
        requirements: {
            level: 5,
            class: ['mage'],
            intelligence: 10
        },
        stats: {
            defense: 3,
            magic: 8,
            manaRegen: 3
        }
    },
    
    // Accessories
    ring_health: {
        id: 'ring_health',
        name: 'Ring of Health',
        type: 'accessory',
        subtype: 'ring',
        rarity: 'uncommon',
        level: 10,
        attack: 0,
        defense: 0,
        magic: 0,
        speed: 0,
        maxHealth: 25,
        healthRegen: 1,
        description: 'A silver ring that enhances vitality.',
        icon: 'ring_health.png',
        stackable: false,
        tradable: true,
        sellPrice: 80,
        buyPrice: 160,
        requirements: {
            level: 10
        },
        stats: {
            maxHealth: 25,
            healthRegen: 1
        }
    },
    
    amulet_mana: {
        id: 'amulet_mana',
        name: 'Amulet of Mana',
        type: 'accessory',
        subtype: 'amulet',
        rarity: 'uncommon',
        level: 12,
        attack: 0,
        defense: 0,
        magic: 5,
        speed: 0,
        maxMana: 30,
        manaRegen: 2,
        description: 'An enchanted amulet that increases magical power.',
        icon: 'amulet_mana.png',
        stackable: false,
        tradable: true,
        sellPrice: 100,
        buyPrice: 200,
        requirements: {
            level: 12,
            class: ['mage']
        },
        stats: {
            magic: 5,
            maxMana: 30,
            manaRegen: 2
        }
    },
    
    // Consumables
    potion_health_small: {
        id: 'potion_health_small',
        name: 'Small Health Potion',
        type: 'consumable',
        subtype: 'potion',
        rarity: 'common',
        level: 1,
        stackable: true,
        maxStack: 20,
        consumable: true,
        effect: 'heal',
        effectValue: 25,
        description: 'Restores 25 health points.',
        icon: 'potion_health_small.png',
        tradable: true,
        sellPrice: 5,
        buyPrice: 10,
        requirements: {
            level: 1
        }
    },
    
    potion_health_large: {
        id: 'potion_health_large',
        name: 'Large Health Potion',
        type: 'consumable',
        subtype: 'potion',
        rarity: 'uncommon',
        level: 10,
        stackable: true,
        maxStack: 10,
        consumable: true,
        effect: 'heal',
        effectValue: 75,
        description: 'Restores 75 health points.',
        icon: 'potion_health_large.png',
        tradable: true,
        sellPrice: 15,
        buyPrice: 30,
        requirements: {
            level: 10
        }
    },
    
    potion_mana: {
        id: 'potion_mana',
        name: 'Mana Potion',
        type: 'consumable',
        subtype: 'potion',
        rarity: 'common',
        level: 5,
        stackable: true,
        maxStack: 15,
        consumable: true,
        effect: 'mana',
        effectValue: 50,
        description: 'Restores 50 mana points.',
        icon: 'potion_mana.png',
        tradable: true,
        sellPrice: 8,
        buyPrice: 16,
        requirements: {
            level: 5,
            class: ['mage']
        }
    },
    
    // Materials
    iron_ore: {
        id: 'iron_ore',
        name: 'Iron Ore',
        type: 'material',
        subtype: 'ore',
        rarity: 'common',
        level: 1,
        stackable: true,
        maxStack: 50,
        description: 'Raw iron ore used for crafting.',
        icon: 'iron_ore.png',
        tradable: true,
        sellPrice: 2,
        buyPrice: 4,
        requirements: {
            level: 1
        }
    },
    
    leather_hide: {
        id: 'leather_hide',
        name: 'Leather Hide',
        type: 'material',
        subtype: 'hide',
        rarity: 'common',
        level: 1,
        stackable: true,
        maxStack: 50,
        description: 'Animal hide used for crafting leather armor.',
        icon: 'leather_hide.png',
        tradable: true,
        sellPrice: 1,
        buyPrice: 2,
        requirements: {
            level: 1
        }
    },
    
    magic_crystal: {
        id: 'magic_crystal',
        name: 'Magic Crystal',
        type: 'material',
        subtype: 'crystal',
        rarity: 'rare',
        level: 15,
        stackable: true,
        maxStack: 20,
        description: 'A crystal imbued with magical energy.',
        icon: 'magic_crystal.png',
        tradable: true,
        sellPrice: 50,
        buyPrice: 100,
        requirements: {
            level: 15
        }
    },
    
    // Quest Items
    quest_goblin_ear: {
        id: 'quest_goblin_ear',
        name: 'Goblin Ear',
        type: 'quest',
        subtype: 'quest',
        rarity: 'common',
        level: 1,
        stackable: true,
        maxStack: 10,
        description: 'A goblin ear, proof of defeating goblins.',
        icon: 'quest_goblin_ear.png',
        tradable: false,
        sellPrice: 0,
        buyPrice: 0,
        requirements: {
            level: 1
        }
    },
    
    // Currency
    gold_coin: {
        id: 'gold_coin',
        name: 'Gold Coin',
        type: 'currency',
        subtype: 'coin',
        rarity: 'common',
        level: 1,
        stackable: true,
        maxStack: 9999,
        description: 'Standard currency in the realm.',
        icon: 'gold_coin.png',
        tradable: true,
        sellPrice: 1,
        buyPrice: 1,
        requirements: {
            level: 1
        }
    }
};

/**
 * Obtém item por ID
 * @param {string} itemId - ID do item
 * @returns {object|null}
 */
function getItem(itemId) {
    return items[itemId] || null;
}

/**
 * Obtém todos os itens de um tipo
 * @param {string} type - Tipo do item
 * @returns {array}
 */
function getItemsByType(type) {
    return Object.values(items).filter(item => item.type === type);
}

/**
 * Obtém todos os itens de uma raridade
 * @param {string} rarity - Raridade do item
 * @returns {array}
 */
function getItemsByRarity(rarity) {
    return Object.values(items).filter(item => item.rarity === rarity);
}

/**
 * Obtém itens disponíveis para um nível
 * @param {number} level - Nível do jogador
 * @returns {array}
 */
function getItemsByLevel(level) {
    return Object.values(items).filter(item => item.level <= level);
}

/**
 * Obtém itens disponíveis para uma classe
 * @param {string} playerClass - Classe do jogador
 * @returns {array}
 */
function getItemsByClass(playerClass) {
    return Object.values(items).filter(item => 
        !item.requirements.class || 
        item.requirements.class.includes(playerClass)
    );
}

/**
 * Verifica se um jogador pode usar um item
 * @param {object} player - Dados do jogador
 * @param {object} item - Dados do item
 * @returns {boolean}
 */
function canUseItem(player, item) {
    // Verificar nível
    if (item.requirements.level && player.level < item.requirements.level) {
        return false;
    }
    
    // Verificar classe
    if (item.requirements.class && !item.requirements.class.includes(player.class)) {
        return false;
    }
    
    // Verificar atributos
    if (item.requirements.strength && (player.strength || 0) < item.requirements.strength) {
        return false;
    }
    
    if (item.requirements.dexterity && (player.dexterity || 0) < item.requirements.dexterity) {
        return false;
    }
    
    if (item.requirements.intelligence && (player.intelligence || 0) < item.requirements.intelligence) {
        return false;
    }
    
    if (item.requirements.agility && (player.agility || 0) < item.requirements.agility) {
        return false;
    }
    
    return true;
}

/**
 * Obtém cor da raridade
 * @param {string} rarity - Raridade
 * @returns {string}
 */
function getRarityColor(rarity) {
    const colors = {
        common: '#9e9e9e',      // Cinza
        uncommon: '#4caf50',    // Verde
        rare: '#2196f3',       // Azul
        epic: '#9c27b0',       // Roxo
        legendary: '#ff9800'   // Laranja
    };
    return colors[rarity] || colors.common;
}

/**
 * Obtém todos os itens
 * @returns {object}
 */
function getAllItems() {
    return items;
}

module.exports = {
    items,
    getItem,
    getItemsByType,
    getItemsByRarity,
    getItemsByLevel,
    getItemsByClass,
    canUseItem,
    getRarityColor,
    getAllItems
};
