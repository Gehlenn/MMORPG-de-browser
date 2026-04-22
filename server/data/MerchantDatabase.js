/**
 * MerchantDatabase - Banco de dados de NPC Mercadores
 * 
 * Define:
 * - Mercadores por zona
 * - Inventários de cada loja
 * - Tipos de mercadores (armeiro, alquimista, etc.)
 */

const MerchantDatabase = {
    // ===================== VERDANTIS =====================
    verdantis: [
        {
            id: 'verdantis_general',
            name: 'Loja do Thorne',
            icon: '🏪',
            type: 'general',
            zoneId: 'verdantis',
            position: { x: 400, y: 300 },
            greeting: 'Bem-vindo! Tenho de tudo um pouco.',
            restockInterval: 20 * 60 * 1000, // 20 min
            inventory: [
                {
                    id: 'health_potion_small',
                    name: 'Poção de Vida Pequena',
                    icon: '🧪',
                    category: 'potion',
                    rarity: 'common',
                    value: 15,
                    stock: 20,
                    effect: { hp: 50 }
                },
                {
                    id: 'bread',
                    name: 'Pão',
                    icon: '🍞',
                    category: 'food',
                    rarity: 'common',
                    value: 5,
                    stock: 50,
                    effect: { hp: 30 }
                },
                {
                    id: 'torch',
                    name: 'Tocha',
                    icon: '🔥',
                    category: 'tool',
                    rarity: 'common',
                    value: 3,
                    stock: -1 // Infinito
                },
                {
                    id: 'rope',
                    name: 'Corda',
                    icon: '🪢',
                    category: 'tool',
                    rarity: 'common',
                    value: 10,
                    stock: 10
                },
                {
                    id: 'linen_cloth',
                    name: 'Tecido de Linho',
                    icon: '🧵',
                    category: 'material',
                    rarity: 'common',
                    value: 8,
                    stock: 30
                }
            ]
        },
        {
            id: 'verdantis_weaponsmith',
            name: 'Armaria do Grimgar',
            icon: '⚔️',
            type: 'weaponsmith',
            zoneId: 'verdantis',
            position: { x: 350, y: 280 },
            greeting: 'Precisa de uma lâmina afiada?',
            restockInterval: 30 * 60 * 1000,
            inventory: [
                {
                    id: 'iron_dagger',
                    name: 'Adaga de Ferro',
                    icon: '🗡️',
                    category: 'weapon',
                    rarity: 'common',
                    value: 50,
                    stock: 5,
                    stats: { attack: 5 },
                    equipSlot: 'weapon'
                },
                {
                    id: 'iron_sword',
                    name: 'Espada de Ferro',
                    icon: '⚔️',
                    category: 'weapon',
                    rarity: 'common',
                    value: 120,
                    stock: 3,
                    stats: { attack: 12 },
                    equipSlot: 'weapon'
                },
                {
                    id: 'wooden_staff',
                    name: 'Cajado de Madeira',
                    icon: '🪄',
                    category: 'weapon',
                    rarity: 'common',
                    value: 40,
                    stock: 5,
                    stats: { attack: 3, mana: 10 },
                    equipSlot: 'weapon'
                },
                {
                    id: 'short_bow',
                    name: 'Arco Curto',
                    icon: '🏹',
                    category: 'weapon',
                    rarity: 'uncommon',
                    value: 150,
                    stock: 2,
                    stats: { attack: 10, speed: 5 },
                    equipSlot: 'weapon'
                }
            ]
        },
        {
            id: 'verdantis_armorer',
            name: 'Armaduras da Mira',
            icon: '🛡️',
            type: 'armorer',
            zoneId: 'verdantis',
            position: { x: 450, y: 280 },
            greeting: 'Proteção é o que você precisa!',
            restockInterval: 30 * 60 * 1000,
            inventory: [
                {
                    id: 'linen_tunic',
                    name: 'Túnica de Linho',
                    icon: '👕',
                    category: 'armor',
                    rarity: 'common',
                    value: 30,
                    stock: 5,
                    stats: { defense: 2 },
                    equipSlot: 'armor'
                },
                {
                    id: 'leather_vest',
                    name: 'Colete de Couro',
                    icon: '🦺',
                    category: 'armor',
                    rarity: 'common',
                    value: 60,
                    stock: 4,
                    stats: { defense: 5 },
                    equipSlot: 'armor'
                },
                {
                    id: 'iron_helmet',
                    name: 'Capacete de Ferro',
                    icon: '⛑️',
                    category: 'armor',
                    rarity: 'common',
                    value: 80,
                    stock: 3,
                    stats: { defense: 5 },
                    equipSlot: 'helmet'
                },
                {
                    id: 'leather_boots',
                    name: 'Botas de Couro',
                    icon: '👢',
                    category: 'armor',
                    rarity: 'common',
                    value: 40,
                    stock: 5,
                    stats: { defense: 2, speed: 3 },
                    equipSlot: 'boots'
                }
            ]
        },
        {
            id: 'verdantis_alchemist',
            name: 'Ervas da Sage',
            icon: '🧪',
            type: 'alchemist',
            zoneId: 'verdantis',
            position: { x: 380, y: 340 },
            greeting: 'Poções para todos os males!',
            restockInterval: 15 * 60 * 1000,
            inventory: [
                {
                    id: 'health_potion_small',
                    name: 'Poção de Vida Pequena',
                    icon: '🧪',
                    category: 'potion',
                    rarity: 'common',
                    value: 15,
                    stock: 30,
                    effect: { hp: 50 }
                },
                {
                    id: 'health_potion_medium',
                    name: 'Poção de Vida Média',
                    icon: '🧪',
                    category: 'potion',
                    rarity: 'uncommon',
                    value: 40,
                    stock: 10,
                    effect: { hp: 150 }
                },
                {
                    id: 'mana_potion_small',
                    name: 'Poção de Mana Pequena',
                    icon: '💧',
                    category: 'potion',
                    rarity: 'common',
                    value: 15,
                    stock: 25,
                    effect: { mana: 50 }
                },
                {
                    id: 'antidote',
                    name: 'Antídoto',
                    icon: '💊',
                    category: 'potion',
                    rarity: 'uncommon',
                    value: 25,
                    stock: 15,
                    effect: { cureStatus: ['poison'] }
                },
                {
                    id: 'red_herb',
                    name: 'Erva Vermelha',
                    icon: '🌿',
                    category: 'material',
                    rarity: 'common',
                    value: 5,
                    stock: 50
                },
                {
                    id: 'blue_herb',
                    name: 'Erva Azul',
                    icon: '☘️',
                    category: 'material',
                    rarity: 'common',
                    value: 5,
                    stock: 50
                }
            ]
        },
        {
            id: 'verdantis_innkeeper',
            name: 'Taverna do Velho Tom',
            icon: '🍺',
            type: 'innkeeper',
            zoneId: 'verdantis',
            position: { x: 420, y: 320 },
            greeting: 'Entre! Comida e descanso!',
            restockInterval: 20 * 60 * 1000,
            inventory: [
                {
                    id: 'grilled_meat',
                    name: 'Carne Grelhada',
                    icon: '🍖',
                    category: 'food',
                    rarity: 'common',
                    value: 12,
                    stock: 20,
                    effect: { hpOverTime: 20, duration: 10 }
                },
                {
                    id: 'hearty_stew',
                    name: 'Ensopado Caprichado',
                    icon: '🥘',
                    category: 'food',
                    rarity: 'uncommon',
                    value: 35,
                    stock: 8,
                    effect: { maxHp: 50, duration: 1800 }
                },
                {
                    id: 'bread',
                    name: 'Pão',
                    icon: '🍞',
                    category: 'food',
                    rarity: 'common',
                    value: 5,
                    stock: 40,
                    effect: { hp: 30 }
                },
                {
                    id: 'ale',
                    name: 'Cerveja Artesanal',
                    icon: '🍺',
                    category: 'food',
                    rarity: 'common',
                    value: 8,
                    stock: 30,
                    effect: { morale: 10 }
                }
            ]
        }
    ],
    
    // ===================== ELDORIA =====================
    eldoria: [
        {
            id: 'eldoria_blacksmith',
            name: 'Forja de Eldoria',
            icon: '🔨',
            type: 'blacksmith',
            zoneId: 'eldoria',
            position: { x: 500, y: 400 },
            greeting: 'Aço de qualidade, preço justo!',
            restockInterval: 30 * 60 * 1000,
            inventory: [
                {
                    id: 'steel_sword',
                    name: 'Espada de Aço',
                    icon: '⚔️',
                    category: 'weapon',
                    rarity: 'uncommon',
                    value: 300,
                    stock: 3,
                    stats: { attack: 25, critChance: 3 },
                    equipSlot: 'weapon'
                },
                {
                    id: 'iron_armor',
                    name: 'Armadura de Ferro',
                    icon: '🛡️',
                    category: 'armor',
                    rarity: 'common',
                    value: 250,
                    stock: 3,
                    stats: { defense: 15, hp: 20 },
                    equipSlot: 'armor'
                },
                {
                    id: 'iron_boots',
                    name: 'Botas de Ferro',
                    icon: '👢',
                    category: 'armor',
                    rarity: 'common',
                    value: 120,
                    stock: 4,
                    stats: { defense: 3, speed: 2 },
                    equipSlot: 'boots'
                },
                {
                    id: 'steel_ingot',
                    name: 'Lingote de Aço',
                    icon: '🔩',
                    category: 'material',
                    rarity: 'uncommon',
                    value: 80,
                    stock: 15
                }
            ]
        },
        {
            id: 'eldoria_magic',
            name: 'Empório Arcano',
            icon: '🔮',
            type: 'magic',
            zoneId: 'eldoria',
            position: { x: 480, y: 420 },
            greeting: 'Magia está no ar...',
            restockInterval: 40 * 60 * 1000,
            inventory: [
                {
                    id: 'mana_potion_small',
                    name: 'Poção de Mana Pequena',
                    icon: '💧',
                    category: 'potion',
                    rarity: 'common',
                    value: 20,
                    stock: 30,
                    effect: { mana: 50 }
                },
                {
                    id: 'blank_rune',
                    name: 'Runa em Branco',
                    icon: '🔷',
                    category: 'material',
                    rarity: 'uncommon',
                    value: 100,
                    stock: 10
                },
                {
                    id: 'mana_dust',
                    name: 'Pó de Mana',
                    icon: '✨',
                    category: 'material',
                    rarity: 'uncommon',
                    value: 50,
                    stock: 20
                },
                {
                    id: 'scroll_teleport',
                    name: 'Pergaminho de Teleporte',
                    icon: '📜',
                    category: 'consumable',
                    rarity: 'rare',
                    value: 500,
                    stock: 2,
                    effect: { teleport: 'last_city' }
                }
            ]
        }
    ],
    
    // ===================== AURÉLIA =====================
    aurelia: [
        {
            id: 'aurelia_general',
            name: 'Bazar do Deserto',
            icon: '🏜️',
            type: 'general',
            zoneId: 'aurelia',
            position: { x: 600, y: 500 },
            greeting: 'Bem-vindo ao deserto! Temos suprimentos!',
            restockInterval: 25 * 60 * 1000,
            inventory: [
                {
                    id: 'stamina_potion',
                    name: 'Poção de Vigor',
                    icon: '⚡',
                    category: 'potion',
                    rarity: 'rare',
                    value: 100,
                    stock: 10,
                    effect: { speed: 20, duration: 300 }
                },
                {
                    id: 'water_skin',
                    name: 'Cantil de Água',
                    icon: '💧',
                    category: 'tool',
                    rarity: 'common',
                    value: 25,
                    stock: 20
                },
                {
                    id: 'desert_cloak',
                    name: 'Manto do Deserto',
                    icon: '🧥',
                    category: 'armor',
                    rarity: 'uncommon',
                    value: 180,
                    stock: 5,
                    stats: { defense: 8, heatResist: 15 },
                    equipSlot: 'armor'
                },
                {
                    id: 'sunscreen',
                    name: 'Protetor Solar',
                    icon: '🧴',
                    category: 'consumable',
                    rarity: 'common',
                    value: 15,
                    stock: 30,
                    effect: { heatResist: 10, duration: 600 }
                }
            ]
        },
        {
            id: 'aurelia_luxury',
            name: 'Mercado de Luxo',
            icon: '💎',
            type: 'general',
            zoneId: 'aurelia',
            position: { x: 620, y: 480 },
            greeting: 'Apenas o melhor para os melhores!',
            restockInterval: 60 * 60 * 1000,
            inventory: [
                {
                    id: 'elixir_luck',
                    name: 'Elixir da Sorte',
                    icon: '🌟',
                    category: 'potion',
                    rarity: 'epic',
                    value: 2000,
                    stock: 1,
                    effect: { luck: 25, duration: 600 }
                },
                {
                    id: 'fire_crystal',
                    name: 'Cristal de Fogo',
                    icon: '🔥',
                    category: 'material',
                    rarity: 'rare',
                    value: 300,
                    stock: 5
                },
                {
                    id: 'rainbow_crystal',
                    name: 'Cristal Arco-Íris',
                    icon: '🌈',
                    category: 'material',
                    rarity: 'epic',
                    value: 1000,
                    stock: 2
                }
            ]
        }
    ]
};

// ===================== FUNÇÕES AUXILIARES =====================

MerchantDatabase.getAll = function() {
    const all = [];
    for (const zone of Object.values(this)) {
        if (Array.isArray(zone)) {
            all.push(...zone);
        }
    }
    return all;
};

MerchantDatabase.getById = function(merchantId) {
    for (const zone of Object.values(this)) {
        if (Array.isArray(zone)) {
            const merchant = zone.find(m => m.id === merchantId);
            if (merchant) return merchant;
        }
    }
    return null;
};

MerchantDatabase.getByZone = function(zoneId) {
    return this[zoneId] || [];
};

MerchantDatabase.getByType = function(type) {
    const all = this.getAll();
    return all.filter(m => m.type === type);
};

MerchantDatabase.getNearby = function(x, y, zoneId, radius = 100) {
    const zone = this[zoneId];
    if (!zone) return [];
    
    return zone.filter(m => {
        const dx = m.position.x - x;
        const dy = m.position.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= radius;
    });
};

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MerchantDatabase;
} else {
    window.MerchantDatabase = MerchantDatabase;
}
