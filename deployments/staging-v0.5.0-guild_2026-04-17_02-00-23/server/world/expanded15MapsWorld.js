/**
 * Expanded World Map System - Legacy of Komodo
 * 15 Mapas com 20+ mobs cada, biomas diferenciados e customização
 */

const expanded15MapsWorld = {
    regions: [
        // === TIER 1: ÁREAS INICIAIS (Level 1-30) ===
        {
            id: "starter_plains",
            name: "Starter Plains",
            levelRange: [1, 10],
            biome: "plains",
            theme: "peaceful_beginnings",
            description: "Verdant plains where new adventurers begin their journey",
            colors: { ground: "#7cb342", water: "#42a5f5", objects: "#8d6e63" },
            environment: {
                weather: ["sunny", "cloudy", "light_rain"],
                particles: ["dust", "pollen"],
                lighting: "natural"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "rat", level: 1, count: 15, respawnTime: 5000, rarity: "common" },
                { type: "slime", level: 2, count: 12, respawnTime: 6000, rarity: "common" },
                { type: "young_wolf", level: 3, count: 8, respawnTime: 8000, rarity: "common" },
                { type: "bandit", level: 4, count: 6, respawnTime: 10000, rarity: "common" },
                { type: "wild_boar", level: 2, count: 10, respawnTime: 7000, rarity: "common" },
                { type: "goblin_scavenger", level: 3, count: 8, respawnTime: 9000, rarity: "common" },
                { type: "forest_squirrel", level: 1, count: 20, respawnTime: 4000, rarity: "common" },
                { type: "rabbit", level: 1, count: 25, respawnTime: 3000, rarity: "common" },
                { type: "mushroom_sprite", level: 2, count: 12, respawnTime: 8000, rarity: "common" },
                { type: "lost_traveler", level: 3, count: 5, respawnTime: 12000, rarity: "common" },
                { type: "baby_bear", level: 4, count: 4, respawnTime: 15000, rarity: "common" },
                { type: "forest_imp", level: 3, count: 6, respawnTime: 10000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "alpha_wolf", level: 5, count: 3, respawnTime: 15000, rarity: "uncommon" },
                { type: "giant_boar", level: 4, count: 2, respawnTime: 20000, rarity: "uncommon" },
                { type: "goblin_warrior", level: 5, count: 4, respawnTime: 12000, rarity: "uncommon" },
                { type: "brown_bear", level: 6, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "forest_guardian", level: 7, count: 1, respawnTime: 30000, rarity: "uncommon" },
                { type: "plains_champion", level: 8, count: 1, respawnTime: 35000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "plains_titan", level: 10, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "nature_spirit", level: 12, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "plains_guardian",
                level: 15,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["guardian_shard", "plains_armor_piece", "rare_herb"]
            }
        },
        {
            id: "verdant_meadow",
            name: "Verdant Meadow",
            levelRange: [5, 15],
            biome: "meadow",
            theme: "flower_fields",
            description: "Beautiful meadow filled with flowers and gentle creatures",
            colors: { ground: "#8bc34a", water: "#4fc3f7", objects: "#ffb74d" },
            environment: {
                weather: ["sunny", "breeze", "flower_petals"],
                particles: ["pollen", "petals", "butterflies"],
                lighting: "golden_hour"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "meadow_deer", level: 6, count: 18, respawnTime: 7000, rarity: "common" },
                { type: "flower_sprite", level: 7, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "meadow_wolf", level: 8, count: 10, respawnTime: 10000, rarity: "common" },
                { type: "butterfly_swarm", level: 5, count: 25, respawnTime: 4000, rarity: "common" },
                { type: "meadow_rabbit", level: 6, count: 20, respawnTime: 5000, rarity: "common" },
                { type: "bee_swarm", level: 7, count: 12, respawnTime: 9000, rarity: "common" },
                { type: "grasshopper", level: 5, count: 30, respawnTime: 3000, rarity: "common" },
                { type: "meadow_fox", level: 9, count: 8, respawnTime: 12000, rarity: "common" },
                { type: "flower_golem", level: 10, count: 6, respawnTime: 15000, rarity: "common" },
                { type: "meadow_bear", level: 11, count: 4, respawnTime: 20000, rarity: "common" },
                { type: "nature_fairy", level: 8, count: 10, respawnTime: 11000, rarity: "common" },
                { type: "meadow_hawk", level: 9, count: 6, respawnTime: 14000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "alpha_deer", level: 12, count: 3, respawnTime: 18000, rarity: "uncommon" },
                { type: "flower_titan", level: 13, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "meadow_guardian", level: 14, count: 2, respawnTime: 22000, rarity: "uncommon" },
                { type: "nature_elemental", level: 15, count: 1, respawnTime: 30000, rarity: "uncommon" },
                { type: "meadow_champion", level: 16, count: 1, respawnTime: 35000, rarity: "uncommon" },
                { type: "spirit_bear", level: 17, count: 1, respawnTime: 40000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "meadow_sovereign", level: 20, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "flower_queen", level: 22, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "meadow_lord",
                level: 25,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["meadow_heart", "nature_scepter", "rare_flower"]
            }
        },
        {
            id: "oakheart_forest",
            name: "Oakheart Forest",
            levelRange: [10, 20],
            biome: "forest",
            theme: "ancient_woods",
            description: "Ancient forest home to druids and mystical creatures",
            colors: { ground: "#2e7d32", water: "#1976d2", objects: "#5d4037" },
            environment: {
                weather: ["foggy", "rainy", "mystical"],
                particles: ["leaves", "spores", "fireflies"],
                lighting: "canopy_shaded"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "wolf", level: 12, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "boar", level: 14, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "goblin", level: 16, count: 12, respawnTime: 9000, rarity: "common" },
                { type: "forest_troll", level: 18, count: 6, respawnTime: 12000, rarity: "common" },
                { type: "brown_bear", level: 13, count: 8, respawnTime: 10000, rarity: "common" },
                { type: "forest_spider", level: 11, count: 18, respawnTime: 6000, rarity: "common" },
                { type: "mushroom_man", level: 15, count: 10, respawnTime: 11000, rarity: "common" },
                { type: "pixie", level: 12, count: 12, respawnTime: 8000, rarity: "common" },
                { type: "ent_sapling", level: 17, count: 5, respawnTime: 15000, rarity: "common" },
                { type: "forest_imp", level: 14, count: 8, respawnTime: 9000, rarity: "common" },
                { type: "owl", level: 11, count: 15, respawnTime: 7000, rarity: "common" },
                { type: "deer", level: 10, count: 20, respawnTime: 5000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "alpha_wolf", level: 20, count: 3, respawnTime: 15000, rarity: "uncommon" },
                { type: "giant_spider", level: 18, count: 2, respawnTime: 20000, rarity: "uncommon" },
                { type: "ent_elder", level: 22, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "forest_demon", level: 19, count: 2, respawnTime: 18000, rarity: "uncommon" },
                { type: "druid_guardian", level: 21, count: 1, respawnTime: 30000, rarity: "uncommon" },
                { type: "shadow_beast", level: 23, count: 1, respawnTime: 35000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "ancient_ent", level: 25, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "forest_demon_lord", level: 28, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "forest_guardian",
                level: 30,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["guardian_essence", "forest_staff", "rare_mushroom"]
            }
        },
        {
            id: "crystal_river",
            name: "Crystal River",
            levelRange: [15, 25],
            biome: "river",
            theme: "magical_waters",
            description: "Mystical river with crystal-clear waters and magical creatures",
            colors: { ground: "#4db6ac", water: "#00acc1", objects: "#795548" },
            environment: {
                weather: ["misty", "rainy", "crystal_shine"],
                particles: ["water_spray", "crystals", "bubbles"],
                lighting: "reflective"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "water_sprite", level: 16, count: 18, respawnTime: 8000, rarity: "common" },
                { type: "river_crab", level: 17, count: 15, respawnTime: 7000, rarity: "common" },
                { type: "crystal_golem", level: 19, count: 8, respawnTime: 12000, rarity: "common" },
                { type: "river_serpent", level: 20, count: 6, respawnTime: 15000, rarity: "common" },
                { type: "water_elemental", level: 18, count: 10, respawnTime: 10000, rarity: "common" },
                { type: "crystal_fish", level: 16, count: 20, respawnTime: 6000, rarity: "common" },
                { type: "river_troll", level: 21, count: 5, respawnTime: 18000, rarity: "common" },
                { type: "fairy_dragon", level: 19, count: 8, respawnTime: 11000, rarity: "common" },
                { type: "crystal_imp", level: 17, count: 12, respawnTime: 9000, rarity: "common" },
                { type: "water_nymph", level: 20, count: 6, respawnTime: 14000, rarity: "common" },
                { type: "river_otter", level: 16, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "crystal_beetle", level: 18, count: 10, respawnTime: 10000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "alpha_serpent", level: 23, count: 3, respawnTime: 18000, rarity: "uncommon" },
                { type: "crystal_titan", level: 25, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "water_demon", level: 24, count: 2, respawnTime: 20000, rarity: "uncommon" },
                { type: "river_guardian", level: 26, count: 1, respawnTime: 30000, rarity: "uncommon" },
                { type: "crystal_elemental", level: 27, count: 1, respawnTime: 35000, rarity: "uncommon" },
                { type: "nymph_queen", level: 28, count: 1, respawnTime: 40000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "river_sovereign", level: 30, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "crystal_dragon", level: 33, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "river_lord",
                level: 35,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["river_pearl", "crystal_trident", "rare_water_gem"]
            }
        },
        {
            id: "stonehold_mountains",
            name: "Stonehold Mountains",
            levelRange: [20, 30],
            biome: "mountain",
            theme: "dwarven_peaks",
            description: "Towering peaks home to dwarves and mountain creatures",
            colors: { ground: "#757575", water: "#607d8b", objects: "#5d4037" },
            environment: {
                weather: ["snowy", "windy", "stormy"],
                particles: ["snow", "rocks", "dust"],
                lighting: "high_altitude"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "harpy", level: 22, count: 18, respawnTime: 8000, rarity: "common" },
                { type: "stone_golem", level: 25, count: 10, respawnTime: 15000, rarity: "common" },
                { type: "mountain_wolf", level: 24, count: 15, respawnTime: 9000, rarity: "common" },
                { type: "frost_giant", level: 28, count: 5, respawnTime: 20000, rarity: "common" },
                { type: "eagle", level: 21, count: 12, respawnTime: 7000, rarity: "common" },
                { type: "mountain_lion", level: 23, count: 8, respawnTime: 12000, rarity: "common" },
                { type: "dwarf_miner", level: 24, count: 10, respawnTime: 10000, rarity: "common" },
                { type: "rock_elemental", level: 26, count: 6, respawnTime: 18000, rarity: "common" },
                { type: "cave_bat", level: 20, count: 20, respawnTime: 6000, rarity: "common" },
                { type: "mountain_goat", level: 21, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "goblin_miner", level: 23, count: 12, respawnTime: 9000, rarity: "common" },
                { type: "ice_worm", level: 25, count: 8, respawnTime: 14000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "harpy_queen", level: 30, count: 3, respawnTime: 18000, rarity: "uncommon" },
                { type: "ancient_golem", level: 32, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "frost_giant_king", level: 35, count: 2, respawnTime: 30000, rarity: "uncommon" },
                { type: "mountain_dragon", level: 31, count: 1, respawnTime: 35000, rarity: "uncommon" },
                { type: "dwarf_lord", level: 33, count: 1, respawnTime: 40000, rarity: "uncommon" },
                { type: "rock_titan", level: 34, count: 1, respawnTime: 45000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "mountain_sovereign", level: 38, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "stone_dragon", level: 40, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "mountain_titan",
                level: 40,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["titan_heart", "mountain_axe", "rare_gem"]
            }
        },
        
        // === TIER 2: ÁREAS INTERMEDIÁRIAS (Level 25-60) ===
        {
            id: "sunspire_desert",
            name: "Sunspire Desert",
            levelRange: [25, 35],
            biome: "desert",
            theme: "golden_sands",
            description: "Vast desert with ancient ruins and trading caravans",
            colors: { ground: "#fdd835", water: "#ffb74d", objects: "#8d6e63" },
            environment: {
                weather: ["sunny", "sandstorm", "hot"],
                particles: ["sand", "heat_waves", "dust_devils"],
                lighting: "harsh_sunlight"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "sand_worm", level: 27, count: 16, respawnTime: 9000, rarity: "common" },
                { type: "scorpion", level: 29, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "bandit", level: 28, count: 12, respawnTime: 10000, rarity: "common" },
                { type: "desert_spirit", level: 33, count: 8, respawnTime: 12000, rarity: "common" },
                { type: "vulture", level: 26, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "camel", level: 25, count: 10, respawnTime: 11000, rarity: "common" },
                { type: "desert_cobra", level: 30, count: 12, respawnTime: 9000, rarity: "common" },
                { type: "sand_elemental", level: 31, count: 6, respawnTime: 15000, rarity: "common" },
                { type: "nomad_warrior", level: 29, count: 10, respawnTime: 10000, rarity: "common" },
                { type: "dune_stalker", level: 32, count: 8, respawnTime: 14000, rarity: "common" },
                { type: "mirage_wisp", level: 30, count: 10, respawnTime: 12000, rarity: "common" },
                { type: "desert_beetle", level: 26, count: 18, respawnTime: 7000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "giant_sand_worm", level: 35, count: 3, respawnTime: 18000, rarity: "uncommon" },
                { type: "scorpion_king", level: 37, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "desert_phantom", level: 38, count: 2, respawnTime: 20000, rarity: "uncommon" },
                { type: "sand_demon", level: 36, count: 2, respawnTime: 22000, rarity: "uncommon" },
                { type: "nomad_chieftain", level: 39, count: 1, respawnTime: 30000, rarity: "uncommon" },
                { type: "desert_titan", level: 40, count: 1, respawnTime: 35000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "desert_sovereign", level: 42, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "sand_dragon", level: 45, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "desert_colossus",
                level: 45,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["colossus_core", "desert_scimitar", "rare_spice"]
            }
        },
        {
            id: "rotwood_swamp",
            name: "Rotwood Swamp",
            levelRange: [30, 40],
            biome: "swamp",
            theme: "dark_waters",
            description: "Damp swamp filled with poisonous creatures and dark magic",
            colors: { ground: "#4e342e", water: "#37474f", objects: "#3e2723" },
            environment: {
                weather: ["foggy", "humid", "poisonous"],
                particles: ["mist", "spores", "fireflies"],
                lighting: "dim_swamp"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "swamp_beast", level: 32, count: 18, respawnTime: 9000, rarity: "common" },
                { type: "poison_frog", level: 34, count: 25, respawnTime: 6000, rarity: "common" },
                { type: "swamp_zombie", level: 36, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "hydra", level: 38, count: 4, respawnTime: 25000, rarity: "common" },
                { type: "mosquito_swarm", level: 31, count: 30, respawnTime: 5000, rarity: "common" },
                { type: "swamp_turtle", level: 33, count: 12, respawnTime: 10000, rarity: "common" },
                { type: "mud_elemental", level: 35, count: 8, respawnTime: 14000, rarity: "common" },
                { type: "crocodile", level: 37, count: 10, respawnTime: 12000, rarity: "common" },
                { type: "willow_wisp", level: 32, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "swamp_hag", level: 39, count: 6, respawnTime: 18000, rarity: "common" },
                { type: "slime_mold", level: 30, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "bog_spirit", level: 36, count: 10, respawnTime: 11000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "ancient_hydra", level: 42, count: 3, respawnTime: 22000, rarity: "uncommon" },
                { type: "swamp_king", level: 44, count: 2, respawnTime: 28000, rarity: "uncommon" },
                { type: "poison_lord", level: 45, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "mud_titan", level: 43, count: 2, respawnTime: 30000, rarity: "uncommon" },
                { type: "swamp_demon", level: 46, count: 1, respawnTime: 35000, rarity: "uncommon" },
                { type: "bog_monster", level: 47, count: 1, respawnTime: 40000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "swamp_sovereign", level: 50, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "hydra_queen", level: 52, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "swamp_lord",
                level: 50,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["swamp_heart", "venom_dagger", "rare_herb"]
            }
        },
        {
            id: "azure_coast",
            name: "Azure Coast",
            levelRange: [35, 45],
            biome: "coastal",
            theme: "tropical_shores",
            description: "Beautiful coastline with beaches, reefs and marine life",
            colors: { ground: "#fff59d", water: "#039be5", objects: "#8d6e63" },
            environment: {
                weather: ["sunny", "breeze", "tropical"],
                particles: ["sea_spray", "shells", "bubbles"],
                lighting: "coastal_glare"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "crab_warrior", level: 36, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "seagull", level: 35, count: 25, respawnTime: 5000, rarity: "common" },
                { type: "water_elemental", level: 38, count: 12, respawnTime: 10000, rarity: "common" },
                { type: "coral_golem", level: 39, count: 8, respawnTime: 15000, rarity: "common" },
                { type: "beast_crab", level: 37, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "tropical_fish", level: 35, count: 30, respawnTime: 4000, rarity: "common" },
                { type: "coastal_wolf", level: 38, count: 10, respawnTime: 12000, rarity: "common" },
                { type: "sea_serpent", level: 40, count: 6, respawnTime: 18000, rarity: "common" },
                { type: "shell_collector", level: 36, count: 12, respawnTime: 9000, rarity: "common" },
                { type: "coral_guardian", level: 41, count: 5, respawnTime: 20000, rarity: "common" },
                { type: "tropical_bird", level: 36, count: 18, respawnTime: 6000, rarity: "common" },
                { type: "sea_sprite", level: 38, count: 10, respawnTime: 11000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "crab_king", level: 43, count: 3, respawnTime: 18000, rarity: "uncommon" },
                { type: "coral_titan", level: 45, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "sea_demon", level: 44, count: 2, respawnTime: 22000, rarity: "uncommon" },
                { type: "coastal_dragon", level: 46, count: 1, respawnTime: 30000, rarity: "uncommon" },
                { type: "reef_guardian", level: 47, count: 1, respawnTime: 35000, rarity: "uncommon" },
                { type: "ocean_spirit", level: 48, count: 1, respawnTime: 40000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "coastal_sovereign", level: 50, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "sea_dragon", level: 53, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "coastal_lord",
                level: 55,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["coastal_pearl", "trident_of_tides", "rare_coral"]
            }
        },
        {
            id: "darklands",
            name: "Darklands",
            levelRange: [40, 50],
            biome: "corrupted",
            theme: "demon_infested",
            description: "Corrupted lands where demonic influence is strongest",
            colors: { ground: "#263238", water: "#37474f", objects: "#212121" },
            environment: {
                weather: ["dark", "blood_moon", "corrupted"],
                particles: ["dark_energy", "blood_drops", "shadows"],
                lighting: "eerie_glow"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "skeleton", level: 42, count: 25, respawnTime: 7000, rarity: "common" },
                { type: "dark_knight", level: 45, count: 15, respawnTime: 12000, rarity: "common" },
                { type: "shadow_beast", level: 48, count: 12, respawnTime: 15000, rarity: "common" },
                { type: "demon_minion", level: 44, count: 18, respawnTime: 10000, rarity: "common" },
                { type: "undead_warrior", level: 43, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "shadow_wolf", level: 46, count: 15, respawnTime: 10000, rarity: "common" },
                { type: "dark_mage", level: 47, count: 10, respawnTime: 14000, rarity: "common" },
                { type: "corrupted_tree", level: 41, count: 12, respawnTime: 11000, rarity: "common" },
                { type: "void_walker", level: 49, count: 8, respawnTime: 18000, rarity: "common" },
                { type: "demon_hound", level: 44, count: 16, respawnTime: 9000, rarity: "common" },
                { type: "shadow_imp", level: 42, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "dark_elemental", level: 48, count: 10, respawnTime: 16000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "skeleton_lord", level: 52, count: 3, respawnTime: 18000, rarity: "uncommon" },
                { type: "shadow_titan", level: 55, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "demon_lieutenant", level: 54, count: 2, respawnTime: 22000, rarity: "uncommon" },
                { type: "void_demon", level: 56, count: 2, respawnTime: 28000, rarity: "uncommon" },
                { type: "dark_archmage", level: 57, count: 1, respawnTime: 35000, rarity: "uncommon" },
                { type: "shadow_lord", level: 58, count: 1, respawnTime: 40000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "darklands_sovereign", level: 60, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "void_dragon", level: 63, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "darkland_overlord",
                level: 60,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["overlord_soul", "shadow_blade", "dark_crystal"]
            }
        },
        {
            id: "frostlands",
            name: "Frostlands",
            levelRange: [45, 55],
            biome: "snow",
            theme: "frozen_wastes",
            description: "Frozen wastelands where only the hardiest survive",
            colors: { ground: "#eceff1", water: "#b3e5fc", objects: "#78909c" },
            environment: {
                weather: ["blizzard", "snow", "freezing"],
                particles: ["snowflakes", "ice_crystals", "frost"],
                lighting: "cold_blue"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "ice_wolf", level: 46, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "frost_giant", level: 50, count: 8, respawnTime: 20000, rarity: "common" },
                { type: "ice_elemental", level: 52, count: 12, respawnTime: 15000, rarity: "common" },
                { type: "yeti", level: 48, count: 10, respawnTime: 18000, rarity: "common" },
                { type: "snow_leopard", level: 47, count: 15, respawnTime: 9000, rarity: "common" },
                { type: "ice_wraith", level: 51, count: 10, respawnTime: 14000, rarity: "common" },
                { type: "frozen_zombie", level: 45, count: 18, respawnTime: 8000, rarity: "common" },
                { type: "ice_spider", level: 47, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "frost_spirit", level: 52, count: 12, respawnTime: 13000, rarity: "common" },
                { type: "polar_bear", level: 49, count: 8, respawnTime: 16000, rarity: "common" },
                { type: "snow_golem", level: 53, count: 6, respawnTime: 20000, rarity: "common" },
                { type: "ice_devil", level: 54, count: 10, respawnTime: 15000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "ice_titan", level: 56, count: 3, respawnTime: 22000, rarity: "uncommon" },
                { type: "frost_giant_king", level: 58, count: 2, respawnTime: 28000, rarity: "uncommon" },
                { type: "yeti_chieftain", level: 57, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "ice_demon", level: 59, count: 2, respawnTime: 30000, rarity: "uncommon" },
                { type: "frost_lord", level: 60, count: 1, respawnTime: 35000, rarity: "uncommon" },
                { type: "winter_dragon", level: 61, count: 1, respawnTime: 40000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "frostlands_sovereign", level: 63, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "ice_dragon_ancient", level: 66, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "frost_lord",
                level: 65,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["frost_heart", "ice_crown", "rare_frost_gem"]
            }
        },
        {
            id: "jungle_depths",
            name: "Jungle Depths",
            levelRange: [50, 60],
            biome: "jungle",
            theme: "tropical_wilderness",
            description: "Dense jungle filled with ancient temples and exotic creatures",
            colors: { ground: "#1b5e20", water: "#00695c", objects: "#4e342e" },
            environment: {
                weather: ["humid", "rainy", "tropical_storm"],
                particles: ["leaves", "insects", "vines"],
                lighting: "canopy_filtered"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "jaguar", level: 51, count: 15, respawnTime: 9000, rarity: "common" },
                { type: "poison_dart_frog", level: 52, count: 25, respawnTime: 6000, rarity: "common" },
                { type: "tribal_warrior", level: 54, count: 12, respawnTime: 12000, rarity: "common" },
                { type: "jungle_titan", level: 56, count: 6, respawnTime: 20000, rarity: "common" },
                { type: "parrot_swarm", level: 50, count: 30, respawnTime: 5000, rarity: "common" },
                { type: "snake_charmer", level: 53, count: 10, respawnTime: 14000, rarity: "common" },
                { type: "venomous_snake", level: 52, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "jungle_elemental", level: 55, count: 8, respawnTime: 18000, rarity: "common" },
                { type: "monkey_troupe", level: 51, count: 18, respawnTime: 7000, rarity: "common" },
                { type: "tribal_shaman", level: 57, count: 5, respawnTime: 22000, rarity: "common" },
                { type: "jungle_spider", level: 53, count: 15, respawnTime: 10000, rarity: "common" },
                { type: "ancient_guardian", level: 58, count: 4, respawnTime: 25000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "jaguar_alpha", level: 60, count: 3, respawnTime: 18000, rarity: "uncommon" },
                { type: "jungle_demon", level: 62, count: 2, respawnTime: 25000, rarity: "uncommon" },
                { type: "tribal_chieftain", level: 63, count: 2, respawnTime: 22000, rarity: "uncommon" },
                { type: "venom_lord", level: 64, count: 2, respawnTime: 28000, rarity: "uncommon" },
                { type: "jungle_titan_ancient", level: 65, count: 1, respawnTime: 35000, rarity: "uncommon" },
                { type: "shaman_master", level: 66, count: 1, respawnTime: 40000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "jungle_sovereign", level: 68, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "jungle_dragon", level: 70, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "jungle_lord",
                level: 70,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["jungle_heart", "tribal_spear", "rare_jade"]
            }
        },
        
        // === TIER 3: ÁREAS AVANÇADAS (Level 55-99) ===
        {
            id: "ashen_volcano",
            name: "Ashenforge Volcano",
            levelRange: [55, 65],
            biome: "volcano",
            theme: "fiery_forges",
            description: "Active volcanic region with legendary forges",
            colors: { ground: "#d32f2f", water: "#ff6f00", objects: "#424242" },
            environment: {
                weather: ["ashen", "lava_glow", "volcanic"],
                particles: ["ash", "sparks", "lava_splatter"],
                lighting: "volcanic_glow"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "fire_elemental", level: 56, count: 18, respawnTime: 10000, rarity: "common" },
                { type: "lava_golem", level: 60, count: 10, respawnTime: 25000, rarity: "common" },
                { type: "ash_drake", level: 62, count: 6, respawnTime: 30000, rarity: "common" },
                { type: "fire_imp", level: 55, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "magma_beast", level: 58, count: 15, respawnTime: 12000, rarity: "common" },
                { type: "salamander", level: 59, count: 12, respawnTime: 14000, rarity: "common" },
                { type: "fire_giant", level: 63, count: 8, respawnTime: 22000, rarity: "common" },
                { type: "lava_worm", level: 61, count: 10, respawnTime: 18000, rarity: "common" },
                { type: "ash_elemental", level: 57, count: 16, respawnTime: 11000, rarity: "common" },
                { type: "inferno_hound", level: 59, count: 14, respawnTime: 13000, rarity: "common" },
                { type: "fire_spirit", level: 64, count: 8, respawnTime: 20000, rarity: "common" },
                { type: "volcano_demon", level: 62, count: 10, respawnTime: 17000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "lava_titan", level: 68, count: 3, respawnTime: 25000, rarity: "uncommon" },
                { type: "fire_dragon", level: 70, count: 2, respawnTime: 35000, rarity: "uncommon" },
                { type: "inferno_lord", level: 72, count: 2, respawnTime: 30000, rarity: "uncommon" },
                { type: "volcano_demon_king", level: 71, count: 2, respawnTime: 32000, rarity: "uncommon" },
                { type: "ash_demon", level: 73, count: 1, respawnTime: 40000, rarity: "uncommon" },
                { type: "fire_archon", level: 74, count: 1, respawnTime: 45000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "volcano_sovereign", level: 76, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "ancient_fire_dragon", level: 78, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "volcano_overlord",
                level: 75,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["volcano_core", "forge_hammer", "rare_fire_gem"]
            }
        },
        {
            id: "ancient_ruins",
            name: "Ancient Ruins",
            levelRange: [60, 70],
            biome: "arcane",
            theme: "mystical_remnants",
            description: "Mysterious ruins of an ancient civilization",
            colors: { ground: "#4a148c", water: "#7b1fa2", objects: "#6a1b9a" },
            environment: {
                weather: ["mystical", "arcane", "ancient"],
                particles: ["magic_sparkles", "ancient_dust", "runes"],
                lighting: "magical_glow"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "arcane_construct", level: 62, count: 15, respawnTime: 12000, rarity: "common" },
                { type: "ancient_guardian", level: 65, count: 8, respawnTime: 25000, rarity: "common" },
                { type: "spell_wraith", level: 68, count: 10, respawnTime: 20000, rarity: "common" },
                { type: "time_elemental", level: 64, count: 12, respawnTime: 18000, rarity: "common" },
                { type: "rune_golem", level: 63, count: 14, respawnTime: 15000, rarity: "common" },
                { type: "arcane_specter", level: 66, count: 10, respawnTime: 22000, rarity: "common" },
                { type: "void_walker", level: 67, count: 8, respawnTime: 24000, rarity: "common" },
                { type: "crystal_golem", level: 69, count: 6, respawnTime: 28000, rarity: "common" },
                { type: "ancient_mage", level: 64, count: 12, respawnTime: 16000, rarity: "common" },
                { type: "runic_guardian", level: 68, count: 8, respawnTime: 26000, rarity: "common" },
                { type: "arcane_elemental", level: 65, count: 10, respawnTime: 20000, rarity: "common" },
                { type: "time_phantom", level: 70, count: 5, respawnTime: 30000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "arcane_titan", level: 72, count: 3, respawnTime: 28000, rarity: "uncommon" },
                { type: "time_lord", level: 75, count: 2, respawnTime: 35000, rarity: "uncommon" },
                { type: "void_master", level: 74, count: 2, respawnTime: 32000, rarity: "uncommon" },
                { type: "runic_demon", level: 76, count: 2, respawnTime: 38000, rarity: "uncommon" },
                { type: "ancient_archon", level: 77, count: 1, respawnTime: 45000, rarity: "uncommon" },
                { type: "time_titan", level: 78, count: 1, respawnTime: 50000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "ruins_sovereign", level: 80, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "ancient_time_dragon", level: 83, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "ruin_guardian",
                level: 80,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["guardian_core", "arcane_staff", "rare_time_gem"]
            }
        },
        {
            id: "sky_peaks",
            name: "Sky Peaks",
            levelRange: [65, 75],
            biome: "mountain_peaks",
            theme: "celestial_heights",
            description: "Mystical mountain peaks reaching above the clouds",
            colors: { ground: "#b3e5fc", water: "#e1f5fe", objects: "#81d4fa" },
            environment: {
                weather: ["cloudy", "windy", "celestial"],
                particles: ["clouds", "star_dust", "wind"],
                lighting: "heavenly_glow"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "cloud_elemental", level: 66, count: 15, respawnTime: 13000, rarity: "common" },
                { type: "sky_griffin", level: 68, count: 10, respawnTime: 18000, rarity: "common" },
                { type: "wind_spirit", level: 70, count: 12, respawnTime: 20000, rarity: "common" },
                { type: "storm_giant", level: 72, count: 6, respawnTime: 28000, rarity: "common" },
                { type: "cloud_wolf", level: 67, count: 16, respawnTime: 14000, rarity: "common" },
                { type: "sky_eagle", level: 69, count: 12, respawnTime: 16000, rarity: "common" },
                { type: "thunder_elemental", level: 71, count: 8, respawnTime: 22000, rarity: "common" },
                { type: "wind_dragon", level: 73, count: 4, respawnTime: 35000, rarity: "common" },
                { type: "cloud_titan", level: 70, count: 10, respawnTime: 24000, rarity: "common" },
                { type: "storm_spirit", level: 72, count: 8, respawnTime: 26000, rarity: "common" },
                { type: "sky_guardian", level: 74, count: 5, respawnTime: 30000, rarity: "common" },
                { type: "celestial_imp", level: 68, count: 14, respawnTime: 15000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "griffin_alpha", level: 76, count: 3, respawnTime: 28000, rarity: "uncommon" },
                { type: "storm_titan", level: 78, count: 2, respawnTime: 35000, rarity: "uncommon" },
                { type: "wind_demon", level: 77, count: 2, respawnTime: 32000, rarity: "uncommon" },
                { type: "sky_dragon_lord", level: 79, count: 2, respawnTime: 38000, rarity: "uncommon" },
                { type: "thunder_lord", level: 80, count: 1, respawnTime: 45000, rarity: "uncommon" },
                { type: "celestial_guardian", level: 81, count: 1, respawnTime: 50000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "sky_sovereign", level: 83, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "ancient_wind_dragon", level: 86, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "sky_lord",
                level: 85,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["sky_heart", "wind_scepter", "rare_sky_gem"]
            }
        },
        {
            id: "abyss_rift",
            name: "Abyss Rift",
            levelRange: [70, 99],
            biome: "abyss",
            theme: "endgame_chaos",
            description: "Dimensional rift leading to the abyss itself - ultimate challenge",
            colors: { ground: "#1a1a1a", water: "#4a148c", objects: "#880e4f" },
            environment: {
                weather: ["chaotic", "dimensional", "apocalyptic"],
                particles: ["void_energy", "chaos_sparks", "abyss_mist"],
                lighting: "abyssal_glow"
            },
            mobs: [
                // 12 Mobs Comuns
                { type: "abyss_demon", level: 72, count: 20, respawnTime: 15000, rarity: "common" },
                { type: "void_beast", level: 75, count: 12, respawnTime: 30000, rarity: "common" },
                { type: "chaos_spawn", level: 78, count: 8, respawnTime: 40000, rarity: "common" },
                { type: "abyssal_horror", level: 74, count: 15, respawnTime: 25000, rarity: "common" },
                { type: "void_walker", level: 73, count: 18, respawnTime: 20000, rarity: "common" },
                { type: "chaos_elemental", level: 76, count: 10, respawnTime: 35000, rarity: "common" },
                { type: "abyss_titan", level: 77, count: 6, respawnTime: 45000, rarity: "common" },
                { type: "void_lord", level: 79, count: 4, respawnTime: 50000, rarity: "common" },
                { type: "chaos_demon", level: 74, count: 16, respawnTime: 22000, rarity: "common" },
                { type: "abyss_wraith", level: 75, count: 12, respawnTime: 28000, rarity: "common" },
                { type: "void_golem", level: 78, count: 8, respawnTime: 42000, rarity: "common" },
                { type: "chaos_overlord", level: 80, count: 3, respawnTime: 60000, rarity: "common" },
                // 6 Mobs Incomuns
                { type: "abyss_emperor", level: 85, count: 3, respawnTime: 35000, rarity: "uncommon" },
                { type: "void_titan", level: 88, count: 2, respawnTime: 50000, rarity: "uncommon" },
                { type: "chaos_lord", level: 90, count: 2, respawnTime: 45000, rarity: "uncommon" },
                { type: "abyss_demon_king", level: 92, count: 2, respawnTime: 55000, rarity: "uncommon" },
                { type: "void_archdemon", level: 94, count: 1, respawnTime: 70000, rarity: "uncommon" },
                { type: "chaos_titan", level: 95, count: 1, respawnTime: 80000, rarity: "uncommon" },
                // 2 Mobs Raros (0.1%)
                { type: "abyss_sovereign", level: 98, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "void_dragon_ancient", level: 105, count: 1, respawnTime: 1800000, rarity: "rare", statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "abyss_guardian",
                level: 99,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["abyss_heart", "void_blade", "rare_chaos_gem"]
            }
        }
    ],
    
    // World metadata
    metadata: {
        name: "Aethelgard - Legacy of Komodo",
        description: "Continente expandido com 15 regiões épicas e 300+ mobs",
        totalRegions: 15,
        maxLevel: 99,
        worldSize: { width: 4000, height: 3000 },
        startingRegion: "starter_plains",
        features: {
            rareMobChance: 0.001, // 0.1%
            rareMobRespawn: 1800000, // 30 minutos
            miniBossRespawn: 7200000, // 2 horas
            maxMobsPerRegion: 20,
            levelRangeSize: 10,
            uniqueBiomes: 13,
            totalMobs: 300
        }
    }
};

// Utility functions
expanded15MapsWorld.getRegionById = function(id) {
    return this.regions.find(region => region.id === id);
};

expanded15MapsWorld.getRegionByLevel = function(level) {
    return this.regions.find(region => 
        level >= region.levelRange[0] && level <= region.levelRange[1]
    );
};

expanded15MapsWorld.getRandomMob = function(regionId, includeRare = false) {
    const region = this.getRegionById(regionId);
    if (!region) return null;
    
    const allMobs = [...region.mobs];
    
    // Adicionar mobs raros baseado na chance
    if (includeRare && region.rareMobs && Math.random() < this.metadata.features.rareMobChance) {
        const rareMob = region.rareMobs[Math.floor(Math.random() * region.rareMobs.length)];
        return { ...rareMob, isRare: true };
    }
    
    return allMobs[Math.floor(Math.random() * allMobs.length)];
};

expanded15MapsWorld.getMiniBoss = function(regionId) {
    const region = this.getRegionById(regionId);
    return region ? region.miniBoss : null;
};

expanded15MapsWorld.getTotalMobsCount = function() {
    return this.regions.reduce((total, region) => {
        return total + region.mobs.length;
    }, 0);
};

expanded15MapsWorld.getBiomesList = function() {
    const biomes = new Set();
    this.regions.forEach(region => {
        biomes.add(region.biome);
    });
    return Array.from(biomes);
};

module.exports = expanded15MapsWorld;
