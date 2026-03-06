/**
 * Game Configuration
 * Central configuration for MMORPG de Browser v0.2
 */

// Game settings
export const GAME_CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 480,
    TILE_SIZE: 32,
    
    // Performance
    TARGET_FPS: 60,
    MAX_ENTITIES: 500,
    CHUNK_SIZE: 50,
    VIEWPORT_CHUNKS: 3,
    
    // World generation
    WORLD_SEED: Math.random() * 1000000,
    BIOME_SIZE: 100,
    CITY_DENSITY: 0.02,
    DUNGEON_DENSITY: 0.05,
    
    // Player settings
    STARTING_LEVEL: 1,
    STARTING_GOLD: 100,
    STARTING_INVENTORY_SIZE: 30,
    MAX_LEVEL: 99,
    
    // Combat settings
    BASE_ATTACK_COOLDOWN: 1000,
    AUTO_ATTACK_RANGE: 5,
    SKILL_GLOBAL_COOLDOWN: 500,
    
    // Economy settings
    MARKET_TAX: 0.05,
    TRADE_FEE: 0.02,
    REPAIR_COST_MULTIPLIER: 0.1,
    
    // UI settings
    LOG_MAX_ENTRIES: 100,
    UI_UPDATE_INTERVAL: 100,
    ANIMATION_SPEED: 1.0,
    
    // Network settings (for future multiplayer)
    SERVER_URL: 'http://localhost:3000',
    API_VERSION: 'v1',
    TIMEOUT: 5000,
    
    // Debug settings
    DEBUG_MODE: false,
    SHOW_FPS: false,
    SHOW_COORDINATES: true,
    ENABLE_LOGGING: true
};

// Biome configuration
export const BIOME_CONFIG = {
    PLAINS: {
        id: 'plains',
        name: 'Plains',
        color: '#4a7c59',
        monsterLevel: { min: 1, max: 5 },
        resourceDensity: 0.15
    },
    FOREST: {
        id: 'forest',
        name: 'Forest',
        color: '#2d5016',
        monsterLevel: { min: 3, max: 8 },
        resourceDensity: 0.25
    },
    MOUNTAIN: {
        id: 'mountain',
        name: 'Mountain',
        color: '#696969',
        monsterLevel: { min: 8, max: 15 },
        resourceDensity: 0.20
    },
    SWAMP: {
        id: 'swamp',
        name: 'Swamp',
        color: '#4a5d23',
        monsterLevel: { min: 5, max: 12 },
        resourceDensity: 0.18
    },
    DESERT: {
        id: 'desert',
        name: 'Desert',
        color: '#edc9af',
        monsterLevel: { min: 10, max: 18 },
        resourceDensity: 0.12
    },
    FROZEN: {
        id: 'frozen',
        name: 'Frozen Lands',
        color: '#b0e0e6',
        monsterLevel: { min: 12, max: 20 },
        resourceDensity: 0.10
    },
    VOLCANIC: {
        id: 'volcanic',
        name: 'Volcanic Wastes',
        color: '#8b0000',
        monsterLevel: { min: 15, max: 25 },
        resourceDensity: 0.08
    },
    DARKLANDS: {
        id: 'darklands',
        name: 'Darklands',
        color: '#1a1a1a',
        monsterLevel: { min: 20, max: 30 },
        resourceDensity: 0.05
    }
};

// Class configuration
export const CLASS_CONFIG = {
    WARRIOR: {
        id: 'warrior',
        name: 'Warrior',
        baseStats: { str: 12, agi: 8, int: 5, vit: 10, dex: 7, wis: 5 },
        weaponTypes: ['sword', 'axe', 'mace'],
        armorTypes: ['heavy', 'medium'],
        skills: ['slash', 'heavy_attack', 'shield_bash']
    },
    MAGE: {
        id: 'mage',
        name: 'Mage',
        baseStats: { str: 5, agi: 6, int: 12, vit: 6, dex: 8, wis: 10 },
        weaponTypes: ['staff', 'wand'],
        armorTypes: ['cloth'],
        skills: ['fireball', 'frost_bolt', 'arcane_missiles']
    },
    HUNTER: {
        id: 'hunter',
        name: 'Hunter',
        baseStats: { str: 8, agi: 12, int: 6, vit: 8, dex: 10, wis: 6 },
        weaponTypes: ['bow', 'crossbow'],
        armorTypes: ['light', 'medium'],
        skills: ['precise_shot', 'multi_shot', 'pet_command']
    },
    ROGUE: {
        id: 'rogue',
        name: 'Rogue',
        baseStats: { str: 7, agi: 12, int: 6, vit: 7, dex: 12, wis: 5 },
        weaponTypes: ['dagger', 'sword'],
        armorTypes: ['light'],
        skills: ['backstab', 'stealth', 'poison_blade']
    },
    PRIEST: {
        id: 'priest',
        name: 'Priest',
        baseStats: { str: 5, agi: 6, int: 10, vit: 8, dex: 6, wis: 12 },
        weaponTypes: ['mace', 'staff'],
        armorTypes: ['cloth', 'light'],
        skills: ['heal', 'holy_smite', 'blessing']
    },
    DRUID: {
        id: 'druid',
        name: 'Druid',
        baseStats: { str: 7, agi: 8, int: 10, vit: 9, dex: 7, wis: 10 },
        weaponTypes: ['staff', 'claw'],
        armorTypes: ['light', 'medium'],
        skills: ['nature_heal', 'animal_form', 'earth_spike']
    }
};

// Item configuration
export const ITEM_CONFIG = {
    RARITY: {
        COMMON: { color: '#ffffff', multiplier: 1.0, dropChance: 0.7 },
        UNCOMMON: { color: '#1eff00', multiplier: 1.5, dropChance: 0.2 },
        RARE: { color: '#0070dd', multiplier: 2.5, dropChance: 0.08 },
        EPIC: { color: '#a335ee', multiplier: 5.0, dropChance: 0.015 },
        LEGENDARY: { color: '#ff8000', multiplier: 10.0, dropChance: 0.004 },
        MYTHIC: { color: '#e6cc80', multiplier: 25.0, dropChance: 0.001 }
    },
    
    UPGRADE: {
        MATERIALS: {
            '1-3': { name: 'Essence of Harmony', cost: 100 },
            '4-6': { name: 'Crystal of Ascension', cost: 500 },
            '7-9': { name: 'Core of Dominion', cost: 2000 }
        },
        SUCCESS_RATES: {
            1: 1.0, 2: 1.0, 3: 0.95, 4: 0.85, 5: 0.70,
            6: 0.55, 7: 0.40, 8: 0.25, 9: 0.15
        }
    }
};

// Monster configuration
export const MONSTER_CONFIG = {
    VARIANTS: {
        NORMAL: { spawnChance: 0.95, statMultiplier: 1.0, expMultiplier: 1.0 },
        ELITE: { spawnChance: 0.04, statMultiplier: 2.0, expMultiplier: 2.0 },
        RARE: { spawnChance: 0.009, statMultiplier: 3.0, expMultiplier: 4.0 },
        BOSS: { spawnChance: 0.001, statMultiplier: 10.0, expMultiplier: 20.0 }
    },
    
    AI: {
        AGGRO_RANGE: 5,
        ATTACK_RANGE: 1,
        SIGHT_RANGE: 8,
        LEASH_RANGE: 15,
        RESPAWN_TIME: 30000
    }
};

// UI configuration
export const UI_CONFIG = {
    COLORS: {
        PRIMARY: '#4ade80',
        SECONDARY: '#3b82f6',
        DANGER: '#ef4444',
        WARNING: '#f59e0b',
        SUCCESS: '#10b981',
        INFO: '#6b7280'
    },
    
    ANIMATIONS: {
        FADE_DURATION: 300,
        SLIDE_DURATION: 200,
        BOUNCE_DURATION: 500
    },
    
    SIZES: {
        BUTTON_HEIGHT: 40,
        INPUT_HEIGHT: 36,
        BORDER_RADIUS: 8,
        PADDING: 16
    }
};

// Development utilities
export const DEV_TOOLS = {
    ENABLE_CHEATS: false,
    GOD_MODE: false,
    INFINITE_GOLD: false,
    INSTANT_KILL: false,
    SHOW_COLLISIONS: false,
    SHOW_PATHFINDING: false,
    LOG_NETWORK: false
};

// Export all configurations
export default {
    GAME_CONFIG,
    BIOME_CONFIG,
    CLASS_CONFIG,
    ITEM_CONFIG,
    MONSTER_CONFIG,
    UI_CONFIG,
    DEV_TOOLS
};
