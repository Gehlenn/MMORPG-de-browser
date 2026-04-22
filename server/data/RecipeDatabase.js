/**
 * RecipeDatabase - Banco de dados de receitas de crafting
 * 
 * Organizado por profissão com materiais e resultados
 */

const RecipeDatabase = {
    // ===================== FERREIRO (Blacksmith) =====================
    blacksmith: [
        // Armas Básicas
        {
            id: 'iron_dagger',
            name: 'Adaga de Ferro',
            description: 'Uma adaga simples mas eficaz.',
            profession: 'blacksmith',
            category: 'weapon',
            requiredLevel: 1,
            materials: [
                { id: 'iron_ore', name: 'Minério de Ferro', icon: '⛏️', quantity: 2 },
                { id: 'wood', name: 'Madeira', icon: '🪵', quantity: 1 }
            ],
            result: {
                id: 'iron_dagger',
                name: 'Adaga de Ferro',
                icon: '🗡️',
                equipable: true,
                equipSlot: 'weapon',
                rarity: 'common',
                stats: { attack: 5 },
                quantity: 1
            },
            xpReward: 15
        },
        {
            id: 'iron_sword',
            name: 'Espada de Ferro',
            description: 'Uma espada balanceada para combate.',
            profession: 'blacksmith',
            category: 'weapon',
            requiredLevel: 5,
            materials: [
                { id: 'iron_ore', name: 'Minério de Ferro', icon: '⛏️', quantity: 4 },
                { id: 'wood', name: 'Madeira', icon: '🪵', quantity: 2 },
                { id: 'leather', name: 'Couro', icon: '🛡️', quantity: 1 }
            ],
            result: {
                id: 'iron_sword',
                name: 'Espada de Ferro',
                icon: '⚔️',
                equipable: true,
                equipSlot: 'weapon',
                rarity: 'common',
                stats: { attack: 12 },
                quantity: 1
            },
            xpReward: 25
        },
        {
            id: 'steel_sword',
            name: 'Espada de Aço',
            description: 'Uma espada superior forjada em aço.',
            profession: 'blacksmith',
            category: 'weapon',
            requiredLevel: 15,
            materials: [
                { id: 'steel_ingot', name: 'Lingote de Aço', icon: '🔩', quantity: 3 },
                { id: 'wood', name: 'Madeira', icon: '🪵', quantity: 2 },
                { id: 'leather', name: 'Couro', icon: '🛡️', quantity: 2 }
            ],
            result: {
                id: 'steel_sword',
                name: 'Espada de Aço',
                icon: '⚔️',
                equipable: true,
                equipSlot: 'weapon',
                rarity: 'uncommon',
                stats: { attack: 25, critChance: 3 },
                quantity: 1
            },
            xpReward: 50
        },
        // Armaduras
        {
            id: 'iron_helmet',
            name: 'Capacete de Ferro',
            description: 'Proteção básica para a cabeça.',
            profession: 'blacksmith',
            category: 'armor',
            requiredLevel: 3,
            materials: [
                { id: 'iron_ore', name: 'Minério de Ferro', icon: '⛏️', quantity: 3 },
                { id: 'leather', name: 'Couro', icon: '🛡️', quantity: 1 }
            ],
            result: {
                id: 'iron_helmet',
                name: 'Capacete de Ferro',
                icon: '⛑️',
                equipable: true,
                equipSlot: 'helmet',
                rarity: 'common',
                stats: { defense: 5 },
                quantity: 1
            },
            xpReward: 20
        },
        {
            id: 'iron_armor',
            name: 'Armadura de Ferro',
            description: 'Armadura pesada de placas.',
            profession: 'blacksmith',
            category: 'armor',
            requiredLevel: 8,
            materials: [
                { id: 'iron_ore', name: 'Minério de Ferro', icon: '⛏️', quantity: 6 },
                { id: 'leather', name: 'Couro', icon: '🛡️', quantity: 3 }
            ],
            result: {
                id: 'iron_armor',
                name: 'Armadura de Ferro',
                icon: '🛡️',
                equipable: true,
                equipSlot: 'armor',
                rarity: 'common',
                stats: { defense: 15, hp: 20 },
                quantity: 1
            },
            xpReward: 35
        },
        {
            id: 'iron_boots',
            name: 'Botas de Ferro',
            description: 'Botas reforçadas com placas.',
            profession: 'blacksmith',
            category: 'armor',
            requiredLevel: 5,
            materials: [
                { id: 'iron_ore', name: 'Minério de Ferro', icon: '⛏️', quantity: 2 },
                { id: 'leather', name: 'Couro', icon: '🛡️', quantity: 2 }
            ],
            result: {
                id: 'iron_boots',
                name: 'Botas de Ferro',
                icon: '👢',
                equipable: true,
                equipSlot: 'boots',
                rarity: 'common',
                stats: { defense: 3, speed: 2 },
                quantity: 1
            },
            xpReward: 25
        }
    ],
    
    // ===================== ALQUIMISTA (Alchemist) =====================
    alchemist: [
        // Poções de Vida
        {
            id: 'health_potion_small',
            name: 'Poção de Vida Pequena',
            description: 'Restaura 50 pontos de vida.',
            profession: 'alchemist',
            category: 'potion',
            requiredLevel: 1,
            materials: [
                { id: 'red_herb', name: 'Erva Vermelha', icon: '🌿', quantity: 2 },
                { id: 'water', name: 'Água', icon: '💧', quantity: 1 }
            ],
            result: {
                id: 'health_potion_small',
                name: 'Poção de Vida Pequena',
                icon: '🧪',
                consumable: true,
                rarity: 'common',
                effect: { hp: 50 },
                quantity: 1
            },
            xpReward: 10
        },
        {
            id: 'health_potion_medium',
            name: 'Poção de Vida Média',
            description: 'Restaura 150 pontos de vida.',
            profession: 'alchemist',
            category: 'potion',
            requiredLevel: 10,
            materials: [
                { id: 'red_herb', name: 'Erva Vermelha', icon: '🌿', quantity: 4 },
                { id: 'blue_herb', name: 'Erva Azul', icon: '☘️', quantity: 2 },
                { id: 'empty_bottle', name: 'Frasco Vazio', icon: '🍶', quantity: 1 }
            ],
            result: {
                id: 'health_potion_medium',
                name: 'Poção de Vida Média',
                icon: '🧪',
                consumable: true,
                rarity: 'uncommon',
                effect: { hp: 150 },
                quantity: 1
            },
            xpReward: 25
        },
        // Poções de Mana
        {
            id: 'mana_potion_small',
            name: 'Poção de Mana Pequena',
            description: 'Restaura 50 pontos de mana.',
            profession: 'alchemist',
            category: 'potion',
            requiredLevel: 5,
            materials: [
                { id: 'blue_herb', name: 'Erva Azul', icon: '☘️', quantity: 2 },
                { id: 'water', name: 'Água', icon: '💧', quantity: 1 }
            ],
            result: {
                id: 'mana_potion_small',
                name: 'Poção de Mana Pequena',
                icon: '💧',
                consumable: true,
                rarity: 'common',
                effect: { mana: 50 },
                quantity: 1
            },
            xpReward: 10
        },
        // Poções Especiais
        {
            id: 'stamina_potion',
            name: 'Poção de Vigor',
            description: 'Aumenta velocidade por 5 minutos.',
            profession: 'alchemist',
            category: 'potion',
            requiredLevel: 15,
            materials: [
                { id: 'yellow_herb', name: 'Erva Amarela', icon: '🌾', quantity: 3 },
                { id: 'honey', name: 'Mel', icon: '🍯', quantity: 1 },
                { id: 'empty_bottle', name: 'Frasco Vazio', icon: '🍶', quantity: 1 }
            ],
            result: {
                id: 'stamina_potion',
                name: 'Poção de Vigor',
                icon: '⚡',
                consumable: true,
                rarity: 'rare',
                effect: { speed: 20, duration: 300 },
                quantity: 1
            },
            xpReward: 40
        },
        {
            id: 'antidote',
            name: 'Antídoto',
            description: 'Cura veneno e outros efeitos negativos.',
            profession: 'alchemist',
            category: 'potion',
            requiredLevel: 8,
            materials: [
                { id: 'green_herb', name: 'Erva Verde', icon: '🌱', quantity: 3 },
                { id: 'water', name: 'Água', icon: '💧', quantity: 2 }
            ],
            result: {
                id: 'antidote',
                name: 'Antídoto',
                icon: '💊',
                consumable: true,
                rarity: 'uncommon',
                effect: { cureStatus: ['poison', 'bleed'] },
                quantity: 1
            },
            xpReward: 20
        }
    ],
    
    // ===================== ALFAIATE (Tailor) =====================
    tailor: [
        // Vestes Básicas
        {
            id: 'linen_cloth',
            name: 'Tecido de Linho',
            description: 'Material básico para confecção.',
            profession: 'tailor',
            category: 'material',
            requiredLevel: 1,
            materials: [
                { id: 'flax', name: 'Linho', icon: '🌾', quantity: 3 }
            ],
            result: {
                id: 'linen_cloth',
                name: 'Tecido de Linho',
                icon: '🧵',
                category: 'material',
                rarity: 'common',
                stackable: true,
                quantity: 2
            },
            xpReward: 8
        },
        // Roupas Leves
        {
            id: 'linen_tunic',
            name: 'Túnica de Linho',
            description: 'Vestes leves para iniciantes.',
            profession: 'tailor',
            category: 'armor',
            requiredLevel: 2,
            materials: [
                { id: 'linen_cloth', name: 'Tecido de Linho', icon: '🧵', quantity: 3 },
                { id: 'thread', name: 'Fio', icon: '🧶', quantity: 2 }
            ],
            result: {
                id: 'linen_tunic',
                name: 'Túnica de Linho',
                icon: '👕',
                equipable: true,
                equipSlot: 'armor',
                rarity: 'common',
                stats: { defense: 2, mana: 10 },
                quantity: 1
            },
            xpReward: 15
        },
        // Bolsas
        {
            id: 'small_bag',
            name: 'Bolsa Pequena',
            description: 'Aumenta capacidade de inventário em 5 slots.',
            profession: 'tailor',
            category: 'accessory',
            requiredLevel: 10,
            materials: [
                { id: 'leather', name: 'Couro', icon: '🛡️', quantity: 4 },
                { id: 'linen_cloth', name: 'Tecido de Linho', icon: '🧵', quantity: 2 },
                { id: 'thread', name: 'Fio', icon: '🧶', quantity: 4 }
            ],
            result: {
                id: 'small_bag',
                name: 'Bolsa Pequena',
                icon: '👜',
                usable: true,
                rarity: 'uncommon',
                effect: { inventorySlots: 5 },
                quantity: 1
            },
            xpReward: 50
        },
        // Acessórios
        {
            id: 'wool_cloak',
            name: 'Manto de Lã',
            description: 'Proteção contra frio e vento.',
            profession: 'tailor',
            category: 'accessory',
            requiredLevel: 8,
            materials: [
                { id: 'wool', name: 'Lã', icon: '🐑', quantity: 5 },
                { id: 'thread', name: 'Fio', icon: '🧶', quantity: 3 }
            ],
            result: {
                id: 'wool_cloak',
                name: 'Manto de Lã',
                icon: '🦇',
                equipable: true,
                equipSlot: 'accessory1',
                rarity: 'uncommon',
                stats: { defense: 5, hp: 15 },
                quantity: 1
            },
            xpReward: 30
        }
    ],
    
    // ===================== COZINHEIRO (Cook) =====================
    cook: [
        // Comidas Básicas
        {
            id: 'grilled_meat',
            name: 'Carne Grelhada',
            description: 'Restaura vida ao longo do tempo.',
            profession: 'cook',
            category: 'food',
            requiredLevel: 1,
            materials: [
                { id: 'raw_meat', name: 'Carne Crua', icon: '🥩', quantity: 1 },
                { id: 'wood', name: 'Madeira', icon: '🪵', quantity: 1 }
            ],
            result: {
                id: 'grilled_meat',
                name: 'Carne Grelhada',
                icon: '🍖',
                consumable: true,
                rarity: 'common',
                effect: { hpOverTime: 20, duration: 10 },
                quantity: 1
            },
            xpReward: 8
        },
        {
            id: 'bread',
            name: 'Pão',
            description: 'Alimento simples e nutritivo.',
            profession: 'cook',
            category: 'food',
            requiredLevel: 2,
            materials: [
                { id: 'flour', name: 'Farinha', icon: '🌾', quantity: 2 },
                { id: 'water', name: 'Água', icon: '💧', quantity: 1 }
            ],
            result: {
                id: 'bread',
                name: 'Pão',
                icon: '🍞',
                consumable: true,
                rarity: 'common',
                effect: { hp: 30 },
                quantity: 2
            },
            xpReward: 10
        },
        // Comidas Especiais
        {
            id: 'hearty_stew',
            name: 'Ensopado Caprichado',
            description: 'Aumenta HP máximo por 30 minutos.',
            profession: 'cook',
            category: 'food',
            requiredLevel: 15,
            materials: [
                { id: 'raw_meat', name: 'Carne Crua', icon: '🥩', quantity: 2 },
                { id: 'vegetables', name: 'Vegetais', icon: '🥕', quantity: 3 },
                { id: 'water', name: 'Água', icon: '💧', quantity: 2 },
                { id: 'salt', name: 'Sal', icon: '🧂', quantity: 1 }
            ],
            result: {
                id: 'hearty_stew',
                name: 'Ensopado Caprichado',
                icon: '🥘',
                consumable: true,
                rarity: 'rare',
                effect: { maxHp: 50, duration: 1800 },
                quantity: 1
            },
            xpReward: 35
        },
        {
            id: 'fish_fillet',
            name: 'Filé de Peixe',
            description: 'Restaura mana ao longo do tempo.',
            profession: 'cook',
            category: 'food',
            requiredLevel: 8,
            materials: [
                { id: 'fish', name: 'Peixe', icon: '🐟', quantity: 1 },
                { id: 'lemon', name: 'Limão', icon: '🍋', quantity: 1 }
            ],
            result: {
                id: 'fish_fillet',
                name: 'Filé de Peixe',
                icon: '🐠',
                consumable: true,
                rarity: 'uncommon',
                effect: { manaOverTime: 15, duration: 10 },
                quantity: 1
            },
            xpReward: 20
        }
    ],
    
    // ===================== ENCANTADOR (Enchanter) =====================
    enchanter: [
        // Runas Básicas
        {
            id: 'rune_fire',
            name: 'Runa de Fogo',
            description: 'Adiciona dano de fogo à arma.',
            profession: 'enchanter',
            category: 'enchant',
            requiredLevel: 10,
            materials: [
                { id: 'blank_rune', name: 'Runa em Branco', icon: '🔷', quantity: 1 },
                { id: 'fire_crystal', name: 'Cristal de Fogo', icon: '🔥', quantity: 2 },
                { id: 'mana_dust', name: 'Pó de Mana', icon: '✨', quantity: 3 }
            ],
            result: {
                id: 'rune_fire',
                name: 'Runa de Fogo',
                icon: '🔥',
                usable: true,
                rarity: 'rare',
                effect: { weaponEnchant: { type: 'fire', damage: 10 } },
                quantity: 1
            },
            xpReward: 45
        },
        {
            id: 'rune_protection',
            name: 'Runa de Proteção',
            description: 'Adiciona defesa à armadura.',
            profession: 'enchanter',
            category: 'enchant',
            requiredLevel: 8,
            materials: [
                { id: 'blank_rune', name: 'Runa em Branco', icon: '🔷', quantity: 1 },
                { id: 'earth_crystal', name: 'Cristal de Terra', icon: '🌍', quantity: 2 },
                { id: 'mana_dust', name: 'Pó de Mana', icon: '✨', quantity: 2 }
            ],
            result: {
                id: 'rune_protection',
                name: 'Runa de Proteção',
                icon: '🛡️',
                usable: true,
                rarity: 'uncommon',
                effect: { armorEnchant: { type: 'protection', defense: 8 } },
                quantity: 1
            },
            xpReward: 35
        },
        // Poções Especiais
        {
            id: 'elixir_luck',
            name: 'Elixir da Sorte',
            description: 'Aumenta chance de drops raros.',
            profession: 'enchanter',
            category: 'potion',
            requiredLevel: 20,
            materials: [
                { id: 'rainbow_crystal', name: 'Cristal Arco-Íris', icon: '🌈', quantity: 1 },
                { id: 'lucky_clover', name: 'Trevo de 4 Folhas', icon: '🍀', quantity: 3 },
                { id: 'mana_essence', name: 'Essência de Mana', icon: '💎', quantity: 1 }
            ],
            result: {
                id: 'elixir_luck',
                name: 'Elixir da Sorte',
                icon: '🌟',
                consumable: true,
                rarity: 'epic',
                effect: { luck: 25, duration: 600 },
                quantity: 1
            },
            xpReward: 80
        }
    ]
};

// ===================== FUNÇÕES AUXILIARES =====================

RecipeDatabase.getAll = function() {
    const all = [];
    for (const profession of Object.values(this)) {
        if (Array.isArray(profession)) {
            all.push(...profession);
        }
    }
    return all;
};

RecipeDatabase.getByProfession = function(professionId) {
    return this[professionId] || [];
};

RecipeDatabase.getById = function(recipeId) {
    for (const profession of Object.values(this)) {
        if (Array.isArray(profession)) {
            const recipe = profession.find(r => r.id === recipeId);
            if (recipe) return recipe;
        }
    }
    return null;
};

RecipeDatabase.getByCategory = function(category) {
    const all = this.getAll();
    return all.filter(r => r.category === category);
};

RecipeDatabase.getByLevelRange = function(min, max) {
    const all = this.getAll();
    return all.filter(r => r.requiredLevel >= min && r.requiredLevel <= max);
};

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecipeDatabase;
} else {
    window.RecipeDatabase = RecipeDatabase;
}
