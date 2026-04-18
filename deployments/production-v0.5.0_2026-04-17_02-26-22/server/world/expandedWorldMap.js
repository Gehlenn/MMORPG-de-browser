/**
 * Expanded World Map System - Legacy of Komodo
 * 10 Mapas com 12+ mobs cada, sistema de rare mobs (0.1%) e mini-bosses
 */

const expandedWorldMap = {
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
                // 12+ Mobs Comuns
                { type: "rat", level: 1, count: 15, respawnTime: 5000, rarity: "common" },
                { type: "slime", level: 2, count: 12, respawnTime: 6000, rarity: "common" },
                { type: "young_wolf", level: 3, count: 8, respawnTime: 8000, rarity: "common" },
                { type: "bandit", level: 4, count: 6, respawnTime: 10000, rarity: "common" },
                { type: "wild_boar", level: 2, count: 10, respawnTime: 7000, rarity: "common" },
                { type: "goblin_scavenger", level: 3, count: 8, respawnTime: 9000, rarity: "common" },
                { type: "forest_squirrel", level: 1, count: 20, respawnTime: 4000, rarity: "common" },
                { type: "rabbit", level: 1, count: 25, respawnTime: 3000, rarity: "common" },
                { type: "mushroom_sprite", level: 2, count: 12, respawnTime: 8000, rarity: "uncommon" },
                { type: "lost_traveler", level: 3, count: 5, respawnTime: 12000, rarity: "uncommon" },
                { type: "baby_bear", level: 4, count: 4, respawnTime: 15000, rarity: "uncommon" },
                { type: "forest_imp", level: 3, count: 6, respawnTime: 10000, rarity: "uncommon" }
            ],
            rareMobs: [
                { type: "alpha_wolf", level: 5, count: 1, respawnTime: 1800000, rarity: "rare", 
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "giant_rat", level: 4, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "slime_king", level: 5, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "plains_guardian",
                level: 8,
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
            id: "oakheart_forest",
            name: "Oakheart Forest",
            levelRange: [10, 20],
            biome: "forest",
            city: "oakheart",
            description: "Ancient forest home to druids and mystical creatures",
            color: "#22c55e",
            mobs: [
                { type: "wolf", level: 12, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "boar", level: 14, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "goblin", level: 16, count: 12, respawnTime: 9000, rarity: "common" },
                { type: "forest_troll", level: 18, count: 6, respawnTime: 12000, rarity: "common" },
                { type: "brown_bear", level: 13, count: 8, respawnTime: 10000, rarity: "common" },
                { type: "forest_spider", level: 11, count: 18, respawnTime: 6000, rarity: "common" },
                { type: "mushroom_man", level: 15, count: 10, respawnTime: 11000, rarity: "uncommon" },
                { type: "pixie", level: 12, count: 12, respawnTime: 8000, rarity: "uncommon" },
                { type: "ent_sapling", level: 17, count: 5, respawnTime: 15000, rarity: "uncommon" },
                { type: "forest_imp", level: 14, count: 8, respawnTime: 9000, rarity: "uncommon" },
                { type: "owl", level: 11, count: 15, respawnTime: 7000, rarity: "common" },
                { type: "deer", level: 10, count: 20, respawnTime: 5000, rarity: "common" }
            ],
            rareMobs: [
                { type: "alpha_wolf", level: 20, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "giant_spider", level: 18, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "ancient_ent", level: 22, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "forest_guardian",
                level: 25,
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
            id: "stonehold_mountains",
            name: "Stonehold Mountains",
            levelRange: [20, 30],
            biome: "mountain",
            city: "stonehold",
            description: "Towering peaks home to dwarves and mountain creatures",
            color: "#6b7280",
            mobs: [
                { type: "harpy", level: 22, count: 18, respawnTime: 8000, rarity: "common" },
                { type: "stone_golem", level: 25, count: 10, respawnTime: 15000, rarity: "common" },
                { type: "mountain_wolf", level: 24, count: 15, respawnTime: 9000, rarity: "common" },
                { type: "frost_giant", level: 28, count: 5, respawnTime: 20000, rarity: "common" },
                { type: "eagle", level: 21, count: 12, respawnTime: 7000, rarity: "common" },
                { type: "mountain_lion", level: 23, count: 8, respawnTime: 12000, rarity: "uncommon" },
                { type: "dwarf_miner", level: 24, count: 10, respawnTime: 10000, rarity: "uncommon" },
                { type: "rock_elemental", level: 26, count: 6, respawnTime: 18000, rarity: "uncommon" },
                { type: "cave_bat", level: 20, count: 20, respawnTime: 6000, rarity: "common" },
                { type: "mountain_goat", level: 21, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "goblin_miner", level: 23, count: 12, respawnTime: 9000, rarity: "common" },
                { type: "ice_worm", level: 25, count: 8, respawnTime: 14000, rarity: "uncommon" }
            ],
            rareMobs: [
                { type: "harpy_queen", level: 30, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "ancient_golem", level: 32, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "frost_giant_king", level: 35, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "mountain_titan",
                level: 35,
                count: 1,
                respawnTime: 7200000,
                rarity: "boss",
                statsMultiplier: 5.0,
                lootMultiplier: 10,
                xpMultiplier: 8,
                drops: ["titan_heart", "mountain_axe", "rare_gem"]
            }
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
                { type: "sand_worm", level: 32, count: 16, respawnTime: 9000, rarity: "common" },
                { type: "scorpion", level: 34, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "bandit", level: 33, count: 12, respawnTime: 10000, rarity: "common" },
                { type: "desert_spirit", level: 38, count: 8, respawnTime: 12000, rarity: "uncommon" },
                { type: "vulture", level: 31, count: 15, respawnTime: 8000, rarity: "common" },
                { type: "camel", level: 30, count: 10, respawnTime: 11000, rarity: "common" },
                { type: "desert_cobra", level: 35, count: 12, respawnTime: 9000, rarity: "uncommon" },
                { type: "sand_elemental", level: 36, count: 6, respawnTime: 15000, rarity: "uncommon" },
                { type: "nomad_warrior", level: 34, count: 10, respawnTime: 10000, rarity: "common" },
                { type: "dune_stalker", level: 37, count: 8, respawnTime: 14000, rarity: "uncommon" },
                { type: "mirage_wisp", level: 35, count: 10, respawnTime: 12000, rarity: "uncommon" },
                { type: "desert_beetle", level: 31, count: 18, respawnTime: 7000, rarity: "common" }
            ],
            rareMobs: [
                { type: "giant_sand_worm", level: 42, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "scorpion_king", level: 40, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "desert_phantom", level: 45, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
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
            levelRange: [40, 50],
            biome: "swamp",
            city: null,
            description: "Damp swamp filled with poisonous creatures and dark magic",
            color: "#84cc16",
            mobs: [
                { type: "swamp_beast", level: 42, count: 18, respawnTime: 9000, rarity: "common" },
                { type: "poison_frog", level: 44, count: 25, respawnTime: 6000, rarity: "common" },
                { type: "swamp_zombie", level: 46, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "hydra", level: 48, count: 4, respawnTime: 25000, rarity: "uncommon" },
                { type: "mosquito_swarm", level: 41, count: 30, respawnTime: 5000, rarity: "common" },
                { type: "swamp_turtle", level: 43, count: 12, respawnTime: 10000, rarity: "common" },
                { type: "mud_elemental", level: 45, count: 8, respawnTime: 14000, rarity: "uncommon" },
                { type: "crocodile", level: 47, count: 10, respawnTime: 12000, rarity: "uncommon" },
                { type: "willow_wisp", level: 42, count: 15, respawnTime: 8000, rarity: "uncommon" },
                { type: "swamp_hag", level: 49, count: 6, respawnTime: 18000, rarity: "uncommon" },
                { type: "slime_mold", level: 40, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "bog_spirit", level: 46, count: 10, respawnTime: 11000, rarity: "uncommon" }
            ],
            rareMobs: [
                { type: "ancient_hydra", level: 55, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "swamp_king", level: 52, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "poison_lord", level: 58, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "swamp_lord",
                level: 55,
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
            id: "darklands",
            name: "Darklands",
            levelRange: [50, 60],
            biome: "corrupted",
            city: null,
            description: "Corrupted lands where demonic influence is strongest",
            color: "#7c3aed",
            mobs: [
                { type: "skeleton", level: 52, count: 25, respawnTime: 7000, rarity: "common" },
                { type: "dark_knight", level: 55, count: 15, respawnTime: 12000, rarity: "uncommon" },
                { type: "shadow_beast", level: 58, count: 12, respawnTime: 15000, rarity: "uncommon" },
                { type: "demon_minion", level: 54, count: 18, respawnTime: 10000, rarity: "common" },
                { type: "undead_warrior", level: 53, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "shadow_wolf", level: 56, count: 15, respawnTime: 10000, rarity: "common" },
                { type: "dark_mage", level: 57, count: 10, respawnTime: 14000, rarity: "uncommon" },
                { type: "corrupted_tree", level: 51, count: 12, respawnTime: 11000, rarity: "common" },
                { type: "void_walker", level: 59, count: 8, respawnTime: 18000, rarity: "uncommon" },
                { type: "demon_hound", level: 54, count: 16, respawnTime: 9000, rarity: "common" },
                { type: "shadow_imp", level: 52, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "dark_elemental", level: 58, count: 10, respawnTime: 16000, rarity: "uncommon" }
            ],
            rareMobs: [
                { type: "skeleton_lord", level: 65, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "shadow_titan", level: 68, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "demon_lieutenant", level: 70, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "darkland_overlord",
                level: 65,
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
            levelRange: [60, 70],
            biome: "snow",
            city: "frostgard",
            description: "Frozen wastelands where only the hardiest survive",
            color: "#06b6d4",
            mobs: [
                { type: "ice_wolf", level: 62, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "frost_giant", level: 65, count: 8, respawnTime: 20000, rarity: "uncommon" },
                { type: "ice_elemental", level: 68, count: 12, respawnTime: 15000, rarity: "uncommon" },
                { type: "yeti", level: 64, count: 10, respawnTime: 18000, rarity: "uncommon" },
                { type: "snow_leopard", level: 61, count: 15, respawnTime: 9000, rarity: "common" },
                { type: "ice_wraith", level: 66, count: 10, respawnTime: 14000, rarity: "uncommon" },
                { type: "frozen_zombie", level: 63, count: 18, respawnTime: 8000, rarity: "common" },
                { type: "ice_spider", level: 62, count: 20, respawnTime: 7000, rarity: "common" },
                { type: "frost_spirit", level: 67, count: 12, respawnTime: 13000, rarity: "uncommon" },
                { type: "polar_bear", level: 65, count: 8, respawnTime: 16000, rarity: "uncommon" },
                { type: "snow_golem", level: 69, count: 6, respawnTime: 20000, rarity: "uncommon" },
                { type: "ice_devil", level: 68, count: 10, respawnTime: 15000, rarity: "uncommon" }
            ],
            rareMobs: [
                { type: "ice_titan", level: 75, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "frost_giant_king", level: 78, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "yeti_chieftain", level: 80, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "frost_lord",
                level: 75,
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
            id: "ashen_volcano",
            name: "Ashenforge Volcano",
            levelRange: [70, 80],
            biome: "volcano",
            city: "ashenforge",
            description: "Active volcanic region with legendary forges",
            color: "#dc2626",
            mobs: [
                { type: "fire_elemental", level: 72, count: 18, respawnTime: 10000, rarity: "common" },
                { type: "lava_golem", level: 75, count: 10, respawnTime: 25000, rarity: "uncommon" },
                { type: "ash_drake", level: 78, count: 6, respawnTime: 30000, rarity: "uncommon" },
                { type: "fire_imp", level: 71, count: 20, respawnTime: 8000, rarity: "common" },
                { type: "magma_beast", level: 73, count: 15, respawnTime: 12000, rarity: "common" },
                { type: "salamander", level: 74, count: 12, respawnTime: 14000, rarity: "uncommon" },
                { type: "fire_giant", level: 77, count: 8, respawnTime: 22000, rarity: "uncommon" },
                { type: "lava_worm", level: 76, count: 10, respawnTime: 18000, rarity: "uncommon" },
                { type: "ash_elemental", level: 72, count: 16, respawnTime: 11000, rarity: "common" },
                { type: "inferno_hound", level: 74, count: 14, respawnTime: 13000, rarity: "common" },
                { type: "fire_spirit", level: 79, count: 8, respawnTime: 20000, rarity: "uncommon" },
                { type: "volcano_demon", level: 77, count: 10, respawnTime: 17000, rarity: "uncommon" }
            ],
            rareMobs: [
                { type: "lava_titan", level: 85, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "fire_dragon", level: 88, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "inferno_lord", level: 90, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "volcano_overlord",
                level: 85,
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
            levelRange: [80, 90],
            biome: "arcane",
            city: null,
            description: "Mysterious ruins of an ancient civilization",
            color: "#a855f7",
            mobs: [
                { type: "arcane_construct", level: 82, count: 15, respawnTime: 12000, rarity: "common" },
                { type: "ancient_guardian", level: 85, count: 8, respawnTime: 25000, rarity: "uncommon" },
                { type: "spell_wraith", level: 88, count: 10, respawnTime: 20000, rarity: "uncommon" },
                { type: "time_elemental", level: 84, count: 12, respawnTime: 18000, rarity: "uncommon" },
                { type: "rune_golem", level: 83, count: 14, respawnTime: 15000, rarity: "common" },
                { type: "arcane_specter", level: 86, count: 10, respawnTime: 22000, rarity: "uncommon" },
                { type: "void_walker", level: 87, count: 8, respawnTime: 24000, rarity: "uncommon" },
                { type: "crystal_golem", level: 89, count: 6, respawnTime: 28000, rarity: "uncommon" },
                { type: "ancient_mage", level: 84, count: 12, respawnTime: 16000, rarity: "common" },
                { type: "runic_guardian", level: 88, count: 8, respawnTime: 26000, rarity: "uncommon" },
                { type: "arcane_elemental", level: 85, count: 10, respawnTime: 20000, rarity: "uncommon" },
                { type: "time_phantom", level: 90, count: 5, respawnTime: 30000, rarity: "uncommon" }
            ],
            rareMobs: [
                { type: "arcane_titan", level: 95, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "time_lord", level: 98, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "void_master", level: 100, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "ruin_guardian",
                level: 95,
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
            id: "abyss_rift",
            name: "Abyss Rift",
            levelRange: [90, 99],
            biome: "abyss",
            city: null,
            description: "Dimensional rift leading to the abyss itself",
            color: "#991b1b",
            mobs: [
                { type: "abyss_demon", level: 92, count: 20, respawnTime: 15000, rarity: "common" },
                { type: "void_beast", level: 95, count: 12, respawnTime: 30000, rarity: "uncommon" },
                { type: "chaos_spawn", level: 98, count: 8, respawnTime: 40000, rarity: "uncommon" },
                { type: "abyssal_horror", level: 94, count: 15, respawnTime: 25000, rarity: "uncommon" },
                { type: "void_walker", level: 93, count: 18, respawnTime: 20000, rarity: "common" },
                { type: "chaos_elemental", level: 96, count: 10, respawnTime: 35000, rarity: "uncommon" },
                { type: "abyss_titan", level: 97, count: 6, respawnTime: 45000, rarity: "uncommon" },
                { type: "void_lord", level: 99, count: 4, respawnTime: 50000, rarity: "uncommon" },
                { type: "chaos_demon", level: 94, count: 16, respawnTime: 22000, rarity: "common" },
                { type: "abyss_wraith", level: 95, count: 12, respawnTime: 28000, rarity: "uncommon" },
                { type: "void_golem", level: 98, count: 8, respawnTime: 42000, rarity: "uncommon" },
                { type: "chaos_overlord", level: 99, count: 3, respawnTime: 60000, rarity: "uncommon" }
            ],
            rareMobs: [
                { type: "abyss_emperor", level: 105, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.5, lootMultiplier: 5, xpMultiplier: 3 },
                { type: "void_titan", level: 108, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 2.0, lootMultiplier: 4, xpMultiplier: 2.5 },
                { type: "chaos_lord", level: 110, count: 1, respawnTime: 1800000, rarity: "rare",
                  statsMultiplier: 3.0, lootMultiplier: 6, xpMultiplier: 4 }
            ],
            miniBoss: {
                type: "abyss_guardian",
                level: 105,
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
        name: "Aethelgard",
        description: "Continente de Legacy of Komodo - 10 regiões épicas",
        totalRegions: 10,
        maxLevel: 99,
        worldSize: { width: 3000, height: 2000 },
        startingRegion: "starter_plains",
        features: {
            rareMobChance: 0.001, // 0.1%
            rareMobRespawn: 1800000, // 30 minutos
            miniBossRespawn: 7200000, // 2 horas
            maxMobsPerRegion: 12,
            levelRangeSize: 10
        }
    }
};

// Utility functions
expandedWorldMap.getRegionById = function(id) {
    return this.regions.find(region => region.id === id);
};

expandedWorldMap.getRegionByLevel = function(level) {
    return this.regions.find(region => 
        level >= region.levelRange[0] && level <= region.levelRange[1]
    );
};

expandedWorldMap.getRandomMob = function(regionId, includeRare = false) {
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

expandedWorldMap.getMiniBoss = function(regionId) {
    const region = this.getRegionById(regionId);
    return region ? region.miniBoss : null;
};

expandedWorldMap.getTotalMobsCount = function() {
    return this.regions.reduce((total, region) => {
        return total + region.mobs.length + (region.rareMobs ? region.rareMobs.length : 0);
    }, 0);
};

module.exports = expandedWorldMap;
