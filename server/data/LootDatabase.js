/**
 * LootDatabase - Definição de drops por mob
 * 
 * Cada mob tem uma tabela de loot com:
 * - Itens possíveis
 * - Quantidade (min/max)
 * - Chance de drop (%)
 * - Raridade do item
 */

const LootDatabase = {
    // ===================== VERDANTIS (Floresta) =====================
    
    // Slime Verde (mob básico)
    'slime_green': {
        name: 'Slime Verde',
        zone: 'verdantis',
        drops: [
            { id: 'gelatinous_essence', name: 'Essência Gelatinosa', icon: '💧', chance: 80, minQty: 1, maxQty: 3, rarity: 'common', category: 'material' },
            { id: 'slime_core', name: 'Núcleo de Slime', icon: '🔮', chance: 15, minQty: 1, maxQty: 1, rarity: 'uncommon', category: 'material' },
            { id: 'slime_crown', name: 'Coroa de Slime', icon: '👑', chance: 1, minQty: 1, maxQty: 1, rarity: 'rare', category: 'material' }
        ],
        gold: { min: 5, max: 15 }
    },
    
    // Lobo da Floresta
    'wolf_forest': {
        name: 'Lobo da Floresta',
        zone: 'verdantis',
        drops: [
            { id: 'wolf_fang', name: 'Presa de Lobo', icon: '🦷', chance: 70, minQty: 1, maxQty: 2, rarity: 'common', category: 'material' },
            { id: 'wolf_hide', name: 'Couro de Lobo', icon: '🟫', chance: 50, minQty: 1, maxQty: 1, rarity: 'common', category: 'material' },
            { id: 'wolf_meat', name: 'Carne de Lobo', icon: '🥩', chance: 60, minQty: 1, maxQty: 2, rarity: 'common', category: 'food' }
        ],
        gold: { min: 10, max: 25 }
    },
    
    // Aranha da Floresta
    'spider_forest': {
        name: 'Aranha da Floresta',
        zone: 'verdantis',
        drops: [
            { id: 'spider_silk', name: 'Seda de Aranha', icon: '🕸️', chance: 75, minQty: 1, maxQty: 3, rarity: 'common', category: 'material' },
            { id: 'spider_venom', name: 'Veneno de Aranha', icon: '🧪', chance: 40, minQty: 1, maxQty: 1, rarity: 'uncommon', category: 'material' },
            { id: 'spider_eye', name: 'Olho de Aranha', icon: '👁️', chance: 20, minQty: 1, maxQty: 1, rarity: 'uncommon', category: 'material' }
        ],
        gold: { min: 8, max: 20 }
    },
    
    // Urso Pardo
    'bear_brown': {
        name: 'Urso Pardo',
        zone: 'verdantis',
        drops: [
            { id: 'bear_fur', name: 'Pelagem de Urso', icon: '🐻', chance: 60, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' },
            { id: 'bear_claw', name: 'Garra de Urso', icon: '🐾', chance: 45, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' },
            { id: 'bear_meat', name: 'Carne de Urso', icon: '🥩', chance: 80, minQty: 2, maxQty: 4, rarity: 'common', category: 'food' }
        ],
        gold: { min: 20, max: 50 }
    },
    
    // Goblin Florestal
    'goblin_forest': {
        name: 'Goblin Florestal',
        zone: 'verdantis',
        drops: [
            { id: 'goblin_ear', name: 'Orelha de Goblin', icon: '👂', chance: 60, minQty: 1, maxQty: 2, rarity: 'common', category: 'material' },
            { id: 'goblin_dagger', name: 'Adaga Goblin', icon: '🗡️', chance: 10, minQty: 1, maxQty: 1, rarity: 'uncommon', category: 'weapon', value: 25 },
            { id: 'goblin_map', name: 'Mapa Goblin', icon: '🗺️', chance: 5, minQty: 1, maxQty: 1, rarity: 'rare', category: 'misc' }
        ],
        gold: { min: 15, max: 35 }
    },
    
    // Cervo
    'deer_forest': {
        name: 'Cervo',
        zone: 'verdantis',
        drops: [
            { id: 'deer_antler', name: 'Chifre de Cervo', icon: '🦌', chance: 65, minQty: 1, maxQty: 2, rarity: 'common', category: 'material' },
            { id: 'deer_hide', name: 'Couro de Cervo', icon: '🟫', chance: 70, minQty: 1, maxQty: 1, rarity: 'common', category: 'material' },
            { id: 'deer_meat', name: 'Carne de Cervo', icon: '🥩', chance: 90, minQty: 1, maxQty: 3, rarity: 'common', category: 'food' }
        ],
        gold: { min: 10, max: 30 }
    },
    
    // ===================== ELDORIA (Montanhas) =====================
    
    // Lobo das Neves
    'wolf_snow': {
        name: 'Lobo das Neves',
        zone: 'eldoria',
        drops: [
            { id: 'snow_wolf_fang', name: 'Presa de Lobo das Neves', icon: '🦷', chance: 75, minQty: 1, maxQty: 2, rarity: 'common', category: 'material' },
            { id: 'snow_wolf_pelt', name: 'Pelagem de Lobo das Neves', icon: '❄️', chance: 55, minQty: 1, maxQty: 1, rarity: 'uncommon', category: 'material' },
            { id: 'ice_shard', name: 'Fragmento de Gelo', icon: '🧊', chance: 30, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' }
        ],
        gold: { min: 20, max: 45 }
    },
    
    // Yeti
    'yeti': {
        name: 'Yeti',
        zone: 'eldoria',
        drops: [
            { id: 'yeti_fur', name: 'Pelagem de Yeti', icon: '🦍', chance: 70, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' },
            { id: 'yeti_claw', name: 'Garra de Yeti', icon: '🐾', chance: 50, minQty: 1, maxQty: 3, rarity: 'uncommon', category: 'material' },
            { id: 'ice_heart', name: 'Coração de Gelo', icon: '💙', chance: 10, minQty: 1, maxQty: 1, rarity: 'rare', category: 'material' }
        ],
        gold: { min: 40, max: 100 }
    },
    
    // Elemental de Gelo
    'elemental_ice': {
        name: 'Elemental de Gelo',
        zone: 'eldoria',
        drops: [
            { id: 'essence_ice', name: 'Essência de Gelo', icon: '❄️', chance: 80, minQty: 1, maxQty: 3, rarity: 'uncommon', category: 'material' },
            { id: 'frost_crystal', name: 'Cristal de Gelo', icon: '💎', chance: 35, minQty: 1, maxQty: 1, rarity: 'rare', category: 'material' },
            { id: 'frozen_rune', name: 'Runa Congelada', icon: '🔯', chance: 15, minQty: 1, maxQty: 1, rarity: 'rare', category: 'material' }
        ],
        gold: { min: 50, max: 120 }
    },
    
    // Golem de Pedra
    'golem_stone': {
        name: 'Golem de Pedra',
        zone: 'eldoria',
        drops: [
            { id: 'stone_fragment', name: 'Fragmento de Pedra', icon: '🪨', chance: 90, minQty: 2, maxQty: 5, rarity: 'common', category: 'material' },
            { id: 'golem_core', name: 'Núcleo de Golem', icon: '💠', chance: 25, minQty: 1, maxQty: 1, rarity: 'rare', category: 'material' },
            { id: 'earth_essence', name: 'Essência de Terra', icon: '🟤', chance: 40, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' }
        ],
        gold: { min: 30, max: 80 }
    },
    
    // ===================== AURÉLIA (Deserto) =====================
    
    // Escorpião do Deserto
    'scorpion_desert': {
        name: 'Escorpião do Deserto',
        zone: 'aurelia',
        drops: [
            { id: 'scorpion_tail', name: 'Cauda de Escorpião', icon: '🦂', chance: 65, minQty: 1, maxQty: 1, rarity: 'common', category: 'material' },
            { id: 'scorpion_venom', name: 'Veneno de Escorpião', icon: '🧪', chance: 50, minQty: 1, maxQty: 1, rarity: 'uncommon', category: 'material' },
            { id: 'scorpion_shell', name: 'Casco de Escorpião', icon: '🐚', chance: 35, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' }
        ],
        gold: { min: 15, max: 40 }
    },
    
    // Cobra do Deserto
    'snake_desert': {
        name: 'Cobra do Deserto',
        zone: 'aurelia',
        drops: [
            { id: 'snake_skin', name: 'Pele de Cobra', icon: '🐍', chance: 70, minQty: 1, maxQty: 2, rarity: 'common', category: 'material' },
            { id: 'snake_fang', name: 'Presa de Cobra', icon: '🦷', chance: 45, minQty: 1, maxQty: 2, rarity: 'common', category: 'material' },
            { id: 'snake_venom', name: 'Veneno de Cobra', icon: '🧪', chance: 40, minQty: 1, maxQty: 1, rarity: 'uncommon', category: 'material' }
        ],
        gold: { min: 12, max: 35 }
    },
    
    // Escaravelho Gigante
    'scarab_giant': {
        name: 'Escaravelho Gigante',
        zone: 'aurelia',
        drops: [
            { id: 'scarab_shell', name: 'Casco de Escaravelho', icon: '🪲', chance: 75, minQty: 1, maxQty: 2, rarity: 'common', category: 'material' },
            { id: 'scarab_wing', name: 'Asa de Escaravelho', icon: '🪶', chance: 40, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' },
            { id: 'sun_essence', name: 'Essência Solar', icon: '☀️', chance: 20, minQty: 1, maxQty: 1, rarity: 'rare', category: 'material' }
        ],
        gold: { min: 25, max: 60 }
    },
    
    // Mumia
    'mummy': {
        name: 'Múmia',
        zone: 'aurelia',
        drops: [
            { id: 'ancient_bandage', name: 'Ataduras Antigas', icon: '🩹', chance: 60, minQty: 1, maxQty: 3, rarity: 'common', category: 'material' },
            { id: 'mummy_ash', name: 'Cinzas de Múmia', icon: '⚱️', chance: 50, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' },
            { id: 'ancient_amulet', name: 'Amuleto Antigo', icon: '📿', chance: 8, minQty: 1, maxQty: 1, rarity: 'rare', category: 'accessory', value: 100 }
        ],
        gold: { min: 30, max: 75 }
    },
    
    // Elemental de Areia
    'elemental_sand': {
        name: 'Elemental de Areia',
        zone: 'aurelia',
        drops: [
            { id: 'sand_essence', name: 'Essência de Areia', icon: '🏜️', chance: 80, minQty: 1, maxQty: 3, rarity: 'uncommon', category: 'material' },
            { id: 'quartz_crystal', name: 'Cristal de Quartzo', icon: '💎', chance: 30, minQty: 1, maxQty: 2, rarity: 'uncommon', category: 'material' },
            { id: 'desert_pearl', name: 'Pérola do Deserto', icon: '⚪', chance: 5, minQty: 1, maxQty: 1, rarity: 'epic', category: 'material' }
        ],
        gold: { min: 45, max: 110 }
    },
    
    // ===================== BOSSES =====================
    
    // Slime Rei (Mini-boss Verdantis)
    'slime_king': {
        name: 'Slime Rei',
        zone: 'verdantis',
        boss: true,
        drops: [
            { id: 'royal_slime_essence', name: 'Essência Slime Real', icon: '👑', chance: 100, minQty: 3, maxQty: 5, rarity: 'rare', category: 'material' },
            { id: 'slime_crown', name: 'Coroa de Slime', icon: '👑', chance: 50, minQty: 1, maxQty: 1, rarity: 'rare', category: 'material' },
            { id: 'jelly_sword', name: 'Espada de Gelatina', icon: '⚔️', chance: 25, minQty: 1, maxQty: 1, rarity: 'epic', category: 'weapon', value: 200 },
            { id: 'slime_pet_egg', name: 'Ovo de Pet Slime', icon: '🥚', chance: 10, minQty: 1, maxQty: 1, rarity: 'legendary', category: 'pet' }
        ],
        gold: { min: 200, max: 500 }
    },
    
    // Rei dos Lobos (Mini-boss Eldoria)
    'wolf_king': {
        name: 'Rei dos Lobos',
        zone: 'eldoria',
        boss: true,
        drops: [
            { id: 'alpha_fang', name: 'Presa Alfa', icon: '🦷', chance: 100, minQty: 2, maxQty: 4, rarity: 'rare', category: 'material' },
            { id: 'alpha_pelt', name: 'Pelagem Alfa', icon: '🐺', chance: 70, minQty: 1, maxQty: 1, rarity: 'epic', category: 'material' },
            { id: 'howling_blade', name: 'Lâmina Uivante', icon: '⚔️', chance: 20, minQty: 1, maxQty: 1, rarity: 'epic', category: 'weapon', value: 350 },
            { id: 'wolf_companion_token', name: 'Token de Companheiro Lobo', icon: '🐕', chance: 15, minQty: 1, maxQty: 1, rarity: 'legendary', category: 'pet' }
        ],
        gold: { min: 300, max: 800 }
    },
    
    // Faraó Anubis (Boss Aurelia)
    'pharaoh_anubis': {
        name: 'Faraó Anubis',
        zone: 'aurelia',
        boss: true,
        drops: [
            { id: 'anubis_fragment', name: 'Fragmento de Anubis', icon: '🏺', chance: 100, minQty: 2, maxQty: 3, rarity: 'epic', category: 'material' },
            { id: 'scepter_of_sands', name: 'Cetro das Areias', icon: '𓀀', chance: 60, minQty: 1, maxQty: 1, rarity: 'epic', category: 'weapon', value: 500 },
            { id: 'ankh_of_eternity', name: 'Ankh da Eternidade', icon: '☥', chance: 30, minQty: 1, maxQty: 1, rarity: 'legendary', category: 'accessory', value: 800 },
            { id: 'pharaoh_headdress', name: 'Máscara do Faraó', icon: '👺', chance: 25, minQty: 1, maxQty: 1, rarity: 'legendary', category: 'armor', value: 600 },
            { id: 'desert_mount_token', name: 'Token de Montaria Desértica', icon: '🐪', chance: 10, minQty: 1, maxQty: 1, rarity: 'legendary', category: 'mount' }
        ],
        gold: { min: 1000, max: 3000 }
    }
};

// ===================== HELPER FUNCTIONS =====================

LootDatabase.getByMobId = function(mobId) {
    return this[mobId] || null;
};

LootDatabase.getByZone = function(zone) {
    const result = [];
    for (const [id, data] of Object.entries(this)) {
        if (data.zone === zone) {
            result.push({ id, ...data });
        }
    }
    return result;
};

LootDatabase.getAllMobs = function() {
    return Object.keys(this).map(id => ({ id, ...this[id] }));
};

LootDatabase.getBosses = function() {
    return Object.entries(this)
        .filter(([id, data]) => data.boss)
        .map(([id, data]) => ({ id, ...data }));
};

LootDatabase.getDroppableItems = function(category = null) {
    const items = new Set();
    for (const mobData of Object.values(this)) {
        for (const drop of mobData.drops) {
            if (!category || drop.category === category) {
                items.add(drop.id);
            }
        }
    }
    return Array.from(items);
};

// Categorias de materiais para crafting
LootDatabase.materialCategories = {
    'leather': ['wolf_hide', 'deer_hide', 'bear_fur', 'yeti_fur', 'alpha_pelt', 'snake_skin'],
    'bone': ['wolf_fang', 'bear_claw', 'deer_antler', 'spider_eye', 'alpha_fang'],
    'cloth': ['spider_silk', 'ancient_bandage', 'goblin_map'],
    'metal': ['stone_fragment', 'golem_core'],
    'crystal': ['ice_shard', 'frost_crystal', 'quartz_crystal', 'desert_pearl'],
    'essence': ['gelatinous_essence', 'essence_ice', 'essence_ice', 'sun_essence', 'earth_essence', 'sand_essence', 'royal_slime_essence'],
    'herb': ['wolf_meat', 'deer_meat', 'bear_meat'],
    'rune': ['frozen_rune']
};

window.LootDatabase = LootDatabase;
