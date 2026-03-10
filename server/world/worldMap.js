/**
 * World Map System - Eldoria Continent
 * Complete regional structure for MMORPG world
 */

const worldMap = {
    regions: [
        {
            id: "starter_plains",
            name: "Starter Plains",
            levelRange: [1, 10],
            biome: "plains",
            city: "greenhaven",
            description: "Verdant plains where new adventurers begin their journey",
            color: "#4ade80",
            mobs: [
                { type: "rat", level: 1, count: 15, respawnTime: 5000 },
                { type: "slime", level: 2, count: 12, respawnTime: 6000 },
                { type: "young_wolf", level: 3, count: 8, respawnTime: 8000 },
                { type: "bandit", level: 4, count: 6, respawnTime: 10000 }
            ],
            dungeons: [],
            raids: [],
            pois: [
                { id: "old_watchtower", name: "Old Watchtower", x: 400, y: 300 },
                { id: "bandit_camp", name: "Bandit Camp", x: 600, y: 400 },
                { id: "lost_farm", name: "Lost Farm", x: 800, y: 200 }
            ],
            spawnZones: [
                { x: 400, y: 300, radius: 200, mobTypes: ["rat", "slime"] },
                { x: 800, y: 400, radius: 150, mobTypes: ["young_wolf"] },
                { x: 600, y: 600, radius: 100, mobTypes: ["bandit"] }
            ]
        },
        {
            id: "oakheart_forest",
            name: "Oakheart Forest",
            levelRange: [10, 20],
            biome: "forest",
            city: "oakheart",
            description: "Ancient forest home to druids and mystical creatures",
            color: "#22c55e",
            mobs: [
                { type: "wolf", level: 12, count: 20, respawnTime: 7000 },
                { type: "boar", level: 14, count: 15, respawnTime: 8000 },
                { type: "goblin", level: 16, count: 12, respawnTime: 9000 },
                { type: "forest_troll", level: 18, count: 6, respawnTime: 12000 }
            ],
            dungeons: ["goblin_cave", "whispering_grove"],
            raids: [],
            pois: [
                { id: "ancient_tree", name: "Ancient Tree", x: 1200, y: 800 },
                { id: "whispering_shrine", name: "Whispering Shrine", x: 1400, y: 900 },
                { id: "hidden_grove", name: "Hidden Grove", x: 1000, y: 700 }
            ],
            spawnZones: [
                { x: 1200, y: 800, radius: 250, mobTypes: ["wolf", "boar"] },
                { x: 1400, y: 900, radius: 150, mobTypes: ["goblin"] },
                { x: 1000, y: 700, radius: 100, mobTypes: ["forest_troll"] }
            ]
        },
        {
            id: "stonehold_mountains",
            name: "Stonehold Mountains",
            levelRange: [20, 30],
            biome: "mountain",
            city: "stonehold",
            description: "Towering peaks home to dwarves and mountain creatures",
            color: "#6b7280",
            mobs: [
                { type: "harpy", level: 22, count: 18, respawnTime: 8000 },
                { type: "stone_golem", level: 25, count: 10, respawnTime: 15000 },
                { type: "mountain_wolf", level: 24, count: 15, respawnTime: 9000 },
                { type: "frost_giant", level: 28, count: 5, respawnTime: 20000 }
            ],
            dungeons: ["crystal_caverns", "titan_cliff"],
            raids: ["fortress_of_agony"],
            pois: [
                { id: "stone_titan_cliff", name: "Stone Titan Cliff", x: 1600, y: 300 },
                { id: "lost_mine", name: "Lost Mine", x: 1800, y: 400 },
                { id: "ancient_forge", name: "Ancient Forge", x: 1400, y: 200 }
            ],
            spawnZones: [
                { x: 1600, y: 300, radius: 200, mobTypes: ["harpy", "mountain_wolf"] },
                { x: 1800, y: 400, radius: 150, mobTypes: ["stone_golem"] },
                { x: 1400, y: 200, radius: 100, mobTypes: ["frost_giant"] }
            ]
        },
        {
            id: "sunspire_desert",
            name: "Sunspire Desert",
            levelRange: [30, 40],
            biome: "desert",
            city: "sunspire",
            description: "Vast desert with ancient ruins and trading caravans",
            color: "#f59e0b",
            mobs: [
                { type: "sand_worm", level: 32, count: 16, respawnTime: 9000 },
                { type: "scorpion", level: 34, count: 20, respawnTime: 7000 },
                { type: "bandit", level: 33, count: 12, respawnTime: 10000 },
                { type: "desert_spirit", level: 38, count: 8, respawnTime: 12000 }
            ],
            dungeons: ["sunken_temple", "lost_pyramid"],
            raids: [],
            pois: [
                { id: "forgotten_oasis", name: "Forgotten Oasis", x: 2000, y: 900 },
                { id: "caravan_ruins", name: "Caravan Ruins", x: 2200, y: 800 },
                { id: "sand_temple", name: "Sand Temple", x: 1800, y: 1000 }
            ],
            spawnZones: [
                { x: 2000, y: 900, radius: 250, mobTypes: ["sand_worm", "scorpion"] },
                { x: 2200, y: 800, radius: 150, mobTypes: ["bandit"] },
                { x: 1800, y: 1000, radius: 100, mobTypes: ["desert_spirit"] }
            ]
        },
        {
            id: "rotwood_swamp",
            name: "Rotwood Swamp",
            levelRange: [40, 50],
            biome: "swamp",
            city: null,
            description: "Damp swamp filled with poisonous creatures and dark magic",
            color: "#84cc16",
            mobs: [
                { type: "swamp_beast", level: 42, count: 18, respawnTime: 9000 },
                { type: "poison_frog", level: 44, count: 25, respawnTime: 6000 },
                { type: "swamp_zombie", level: 46, count: 20, respawnTime: 8000 },
                { type: "hydra", level: 48, count: 4, respawnTime: 25000 }
            ],
            dungeons: ["rotting_temple", "swamp_depths"],
            raids: [],
            pois: [
                { id: "sunken_village", name: "Sunken Village", x: 1000, y: 1200 },
                { id: "poison_bog", name: "Poison Bog", x: 800, y: 1400 },
                { id: "rotting_shrine", name: "Rotting Shrine", x: 1200, y: 1300 }
            ],
            spawnZones: [
                { x: 1000, y: 1200, radius: 200, mobTypes: ["swamp_beast", "poison_frog"] },
                { x: 800, y: 1400, radius: 150, mobTypes: ["swamp_zombie"] },
                { x: 1200, y: 1300, radius: 100, mobTypes: ["hydra"] }
            ]
        },
        {
            id: "darklands",
            name: "Darklands",
            levelRange: [50, 60],
            biome: "corrupted",
            city: null,
            description: "Corrupted lands where demonic influence is strongest",
            color: "#7c3aed",
            mobs: [
                { type: "skeleton", level: 52, count: 25, respawnTime: 7000 },
                { type: "dark_knight", level: 55, count: 15, respawnTime: 12000 },
                { type: "shadow_beast", level: 58, count: 12, respawnTime: 15000 },
                { type: "demon_minion", level: 54, count: 18, respawnTime: 10000 }
            ],
            dungeons: ["necropolis", "cathedral_of_decay"],
            raids: ["cathedral_of_decay"],
            pois: [
                { id: "shadow_rift", name: "Shadow Rift", x: 600, y: 1000 },
                { id: "bone_field", name: "Bone Field", x: 400, y: 1200 },
                { id: "cursed_tower", name: "Cursed Tower", x: 800, y: 1100 }
            ],
            spawnZones: [
                { x: 600, y: 1000, radius: 250, mobTypes: ["skeleton", "demon_minion"] },
                { x: 400, y: 1200, radius: 150, mobTypes: ["dark_knight"] },
                { x: 800, y: 1100, radius: 100, mobTypes: ["shadow_beast"] }
            ]
        },
        {
            id: "frostlands",
            name: "Frostlands",
            levelRange: [60, 70],
            biome: "snow",
            city: "frostgard",
            description: "Frozen wastelands where only the hardiest survive",
            color: "#06b6d4",
            mobs: [
                { type: "ice_wolf", level: 62, count: 20, respawnTime: 8000 },
                { type: "frost_giant", level: 65, count: 8, respawnTime: 20000 },
                { type: "ice_elemental", level: 68, count: 12, respawnTime: 15000 },
                { type: "yeti", level: 64, count: 10, respawnTime: 18000 }
            ],
            dungeons: ["frozen_catacomb", "ice_cavern"],
            raids: [],
            pois: [
                { id: "frozen_castle", name: "Frozen Castle", x: 1800, y: 200 },
                { id: "glacier_peak", name: "Glacier Peak", x: 2000, y: 100 },
                { id: "ice_cave", name: "Ice Cave", x: 1600, y: 300 }
            ],
            spawnZones: [
                { x: 1800, y: 200, radius: 200, mobTypes: ["ice_wolf", "yeti"] },
                { x: 2000, y: 100, radius: 150, mobTypes: ["frost_giant"] },
                { x: 1600, y: 300, radius: 100, mobTypes: ["ice_elemental"] }
            ]
        },
        {
            id: "ashen_volcano",
            name: "Ashenforge Volcano",
            levelRange: [70, 80],
            biome: "volcano",
            city: "ashenforge",
            description: "Active volcanic region with legendary forges",
            color: "#dc2626",
            mobs: [
                { type: "fire_elemental", level: 72, count: 18, respawnTime: 10000 },
                { type: "lava_golem", level: 75, count: 10, respawnTime: 25000 },
                { type: "ash_drake", level: 78, count: 6, respawnTime: 30000 },
                { type: "fire_imp", level: 71, count: 20, respawnTime: 8000 }
            ],
            dungeons: ["infernal_crucible", "magma_chamber"],
            raids: ["infernal_crucible"],
            pois: [
                { id: "volcano_peak", name: "Volcano Peak", x: 2100, y: 500 },
                { id: "lava_pools", name: "Lava Pools", x: 2300, y: 600 },
                { id: "ashen_forge", name: "Ashen Forge", x: 1900, y: 400 }
            ],
            spawnZones: [
                { x: 2100, y: 500, radius: 200, mobTypes: ["fire_elemental", "fire_imp"] },
                { x: 2300, y: 600, radius: 150, mobTypes: ["lava_golem"] },
                { x: 1900, y: 400, radius: 100, mobTypes: ["ash_drake"] }
            ]
        },
        {
            id: "ancient_ruins",
            name: "Ancient Ruins",
            levelRange: [80, 90],
            biome: "arcane",
            city: null,
            description: "Mysterious ruins of an ancient civilization",
            color: "#a855f7",
            mobs: [
                { type: "arcane_construct", level: 82, count: 15, respawnTime: 12000 },
                { type: "ancient_guardian", level: 85, count: 8, respawnTime: 25000 },
                { type: "spell_wraith", level: 88, count: 10, respawnTime: 20000 },
                { type: "time_elemental", level: 84, count: 12, respawnTime: 18000 }
            ],
            dungeons: ["forgotten_sanctum", "arcane_observatory"],
            raids: ["citadel_of_the_void"],
            pois: [
                { id: "arcane_library", name: "Arcane Library", x: 1400, y: 1400 },
                { id: "rune_monument", name: "Rune Monument", x: 1600, y: 1500 },
                { id: "ancient_portal", name: "Ancient Portal", x: 1200, y: 1600 }
            ],
            spawnZones: [
                { x: 1400, y: 1400, radius: 200, mobTypes: ["arcane_construct", "time_elemental"] },
                { x: 1600, y: 1500, radius: 150, mobTypes: ["ancient_guardian"] },
                { x: 1200, y: 1600, radius: 100, mobTypes: ["spell_wraith"] }
            ]
        },
        {
            id: "abyss_rift",
            name: "Abyss Rift",
            levelRange: [90, 99],
            biome: "abyss",
            city: null,
            description: "Dimensional rift leading to the abyss itself",
            color: "#991b1b",
            mobs: [
                { type: "abyss_demon", level: 92, count: 20, respawnTime: 15000 },
                { type: "void_beast", level: 95, count: 12, respawnTime: 30000 },
                { type: "chaos_spawn", level: 98, count: 8, respawnTime: 40000 },
                { type: "abyssal_horror", level: 94, count: 15, respawnTime: 25000 }
            ],
            dungeons: [],
            raids: ["abyss_gate"],
            pois: [
                { id: "abyss_entrance", name: "Abyss Entrance", x: 1000, y: 1800 },
                { id: "void_chamber", name: "Void Chamber", x: 800, y: 1900 },
                { id: "chaos_throne", name: "Chaos Throne", x: 1200, y: 1900 }
            ],
            spawnZones: [
                { x: 1000, y: 1800, radius: 250, mobTypes: ["abyss_demon", "abyssal_horror"] },
                { x: 800, y: 1900, radius: 150, mobTypes: ["void_beast"] },
                { x: 1200, y: 1900, radius: 100, mobTypes: ["chaos_spawn"] }
            ]
        }
    ],
    
    // World metadata
    metadata: {
        name: "Eldoria",
        description: "Ancient continent scarred by demonic wars",
        totalRegions: 10,
        maxLevel: 99,
        worldSize: { width: 3000, height: 2000 },
        startingRegion: "starter_plains"
    }
};

// Utility functions
worldMap.getRegionById = function(id) {
    return this.regions.find(region => region.id === id);
};

worldMap.getRegionByLevel = function(level) {
    return this.regions.find(region => 
        level >= region.levelRange[0] && level <= region.levelRange[1]
    );
};

worldMap.getRegionsByBiome = function(biome) {
    return this.regions.filter(region => region.biome === biome);
};

worldMap.getAdjacentRegions = function(regionId) {
    // Simplified adjacency logic - could be enhanced with actual map coordinates
    const region = this.getRegionById(regionId);
    if (!region) return [];
    
    return this.regions.filter(r => {
        if (r.id === regionId) return false;
        // Check if level ranges are adjacent
        return Math.abs(r.levelRange[0] - region.levelRange[1]) <= 10 ||
               Math.abs(r.levelRange[1] - region.levelRange[0]) <= 10;
    });
};

worldMap.getRegionMobs = function(regionId) {
    const region = this.getRegionById(regionId);
    return region ? region.mobs : [];
};

worldMap.getRegionDungeons = function(regionId) {
    const region = this.getRegionById(regionId);
    return region ? region.dungeons : [];
};

worldMap.getRegionRaids = function(regionId) {
    const region = this.getRegionById(regionId);
    return region ? region.raids : [];
};

module.exports = worldMap;
