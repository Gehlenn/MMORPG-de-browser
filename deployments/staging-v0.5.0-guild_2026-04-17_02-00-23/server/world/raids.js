/**
 * Raids System
 * Defines all major raid bosses and their requirements
 */

const raids = [
    {
        id: "fortress_of_agony",
        name: "Fortress of Agony",
        boss: "Arkazhul",
        title: "Master of Torture",
        level: 90,
        minPlayers: 20,
        maxPlayers: 40,
        region: "stonehold_mountains",
        location: { x: 1700, y: 350 },
        difficulty: "extreme",
        duration: 180, // 3 hours
        resetTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        description: "Dark fortress where Arkazhul tortures captured souls",
        mechanics: [
            "torture_chambers",
            "pain_auras",
            "soul_drain",
            "mental_torment",
            "despair_waves"
        ],
        phases: [
            { name: "Entry Hall", duration: 20, description: "Clear torture chambers" },
            { name: "Torture Master", duration: 30, description: "Defeat Torture Master" },
            { name: "Soul Harvest", duration: 40, description: "Stop soul harvesting" },
            { name: "Arkazhul Phase 1", duration: 25, description: "Fight Arkazhul's true form" },
            { name: "Arkazhul Phase 2", duration: 35, description: "Arkazhul empowered" },
            { name: "Final Stand", duration: 30, description: "Defeat Arkazhul completely" }
        ],
        requirements: {
            level: 90,
            quests: ["arkazhul_preparation"],
            items: ["torture_resistance_amulet"],
            reputation: { faction: "order_of_komodo", level: "exalted" }
        },
        rewards: {
            experience: 100000,
            gold: 50000,
            items: [
                { name: "Arkazhul's Painblade", type: "weapon", rarity: "legendary" },
                { name: "Torturer's Plate", type: "armor", rarity: "epic" },
                { name: "Soul Shard of Agony", type: "material", rarity: "rare" }
            ],
            achievements: ["torture_master", "arkazhul_slayer"],
            titles: ["Pain Eater", "Arkazhul's Bane"]
        }
    },
    {
        id: "infernal_crucible",
        name: "Infernal Crucible",
        boss: "Vorthrax",
        title: "General of Destruction",
        level: 92,
        minPlayers: 25,
        maxPlayers: 40,
        region: "ashen_volcano",
        location: { x: 2150, y: 550 },
        difficulty: "extreme",
        duration: 240, // 4 hours
        resetTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        description: "Volcanic crucible where Vorthrax forges weapons of destruction",
        mechanics: [
            "lava_waves",
            "fire_storms",
            "destruction_auras",
            "forge_hammers",
            "magma_eruptions"
        ],
        phases: [
            { name: "Lava Approach", duration: 30, description: "Navigate lava fields" },
            { name: "Fire Elementals", duration: 25, description: "Defeat fire guardians" },
            { name: "Forge Defense", duration: 35, description: "Destroy forge defenses" },
            { name: "Vorthrax Phase 1", duration: 40, description: "Fight Vorthrax" },
            { name: "Volcano Eruption", duration: 45, description: "Survive volcano eruption" },
            { name: "Vorthrax Phase 2", duration: 45, description: "Empowered Vorthrax" },
            { name: "Final Destruction", duration: 20, description: "Defeat Vorthrax completely" }
        ],
        requirements: {
            level: 92,
            quests: ["volcano_preparation"],
            items: ["fire_resistance_potion"],
            reputation: { faction: "ashenforge", level: "revered" }
        },
        rewards: {
            experience: 120000,
            gold: 60000,
            items: [
                { name: "Vorthrax's Destroyer", type: "weapon", rarity: "legendary" },
                { name: "Infernal Plate Set", type: "armor", rarity: "epic" },
                { name: "Volcanic Core", type: "material", rarity: "rare" }
            ],
            achievements: ["destruction_survivor", "vorthrax_slayer"],
            titles: ["Destroyer", "Vorthrax's Bane"]
        }
    },
    {
        id: "cathedral_of_decay",
        name: "Cathedral of Decay",
        boss: "Valzareth",
        title: "Lord of Corruption",
        level: 94,
        minPlayers: 30,
        maxPlayers: 40,
        region: "darklands",
        location: { x: 700, y: 1150 },
        difficulty: "extreme",
        duration: 300, // 5 hours
        resetTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        description: "Corrupted cathedral where Valzareth spreads his dark influence",
        mechanics: [
            "corruption_spread",
            "decay_auras",
            "soul_corruption",
            "dark_blessings",
            "necromantic_rituals"
        ],
        phases: [
            { name: "Corrupted Grounds", duration: 45, description: "Purify corrupted grounds" },
            { name: "Dark Priests", duration: 30, description: "Defeat dark priests" },
            { name: "Necromantic Ritual", duration: 40, description: "Stop necromantic ritual" },
            { name: "Valzareth Phase 1", duration: 50, description: "Fight Valzareth" },
            { name: "Corruption Outbreak", duration: 55, description: "Survive corruption outbreak" },
            { name: "Valzareth Phase 2", duration: 50, description: "Corrupted Valzareth" },
            { name: "Final Purification", duration: 30, description: "Purify and defeat Valzareth" }
        ],
        requirements: {
            level: 94,
            quests: ["corruption_investigation"],
            items: ["purification_crystal"],
            reputation: { faction: "order_of_komodo", level: "exalted" }
        },
        rewards: {
            experience: 150000,
            gold: 75000,
            items: [
                { name: "Valzareth's Corruptor", type: "weapon", rarity: "legendary" },
                { name: "Decay Lord's Robes", type: "armor", rarity: "epic" },
                { name: "Pure Crystal Shard", type: "material", rarity: "rare" }
            ],
            achievements: ["corruption_purifier", "valzareth_slayer"],
            titles: ["Purifier", "Valzareth's Bane"]
        }
    },
    {
        id: "citadel_of_the_void",
        name: "Citadel of the Void",
        boss: "Dravokhar",
        title: "Devourer of Souls",
        level: 96,
        minPlayers: 35,
        maxPlayers: 40,
        region: "ancient_ruins",
        location: { x: 1500, y: 1550 },
        difficulty: "extreme",
        duration: 360, // 6 hours
        resetTime: 7 * 24 * 60 * 60 * 1000, // 7 days
        description: "Dimensional citadel where Dravokhar devours souls",
        mechanics: [
            "void_portals",
            "soul_devouring",
            "dimensional_shifts",
            "void_auras",
            "reality_warping"
        ],
        phases: [
            { name: "Void Approach", duration: 60, description: "Navigate void portals" },
            { name: "Soul Collectors", duration: 40, description: "Defeat soul collectors" },
            { name: "Dimensional Rift", duration: 50, description: "Close dimensional rift" },
            { name: "Dravokhar Phase 1", duration: 60, description: "Fight Dravokhar" },
            { name: "Void Storm", duration: 70, description: "Survive void storm" },
            { name: "Dravokhar Phase 2", duration: 60, description: "Empowered Dravokhar" },
            { name: "Soul Devouring", duration: 40, description: "Prevent soul devouring" },
            { name: "Final Confrontation", duration: 20, description: "Defeat Dravokhar completely" }
        ],
        requirements: {
            level: 96,
            quests: ["void_investigation"],
            items: ["soul_protection_amulet"],
            reputation: { faction: "arcane_scholars", level: "exalted" }
        },
        rewards: {
            experience: 200000,
            gold: 100000,
            items: [
                { name: "Dravokhar's Soul Devourer", type: "weapon", rarity: "legendary" },
                { name: "Void Walker's Robes", type: "armor", rarity: "epic" },
                { name: "Dimensional Shard", type: "material", rarity: "rare" }
            ],
            achievements: ["void_walker", "dravokhar_slayer"],
            titles: ["Soul Protector", "Dravokhar's Bane"]
        }
    },
    {
        id: "abyss_gate",
        name: "The Abyss Gate",
        boss: "Malekondrius",
        title: "Lord of the Abyss",
        level: 99,
        minPlayers: 40,
        maxPlayers: 40,
        region: "abyss_rift",
        location: { x: 1100, y: 1900 },
        difficulty: "ultimate",
        duration: 480, // 8 hours
        resetTime: 14 * 24 * 60 * 60 * 1000, // 14 days
        description: "Final confrontation with the Lord of the Abyss himself",
        mechanics: [
            "abyssal_portals",
            "demonic_summons",
            "reality_corruption",
            "soul_drain",
            "abyssal_transformations",
            "dimensional_collapses"
        ],
        phases: [
            { name: "Abyssal Approach", duration: 60, description: "Navigate abyssal horrors" },
            { name: "Gate Guardians", duration: 45, description: "Defeat gate guardians" },
            { name: "Portal Sealing", duration: 50, description: "Seal lesser portals" },
            { name: "Malekondrius Phase 1", duration: 70, description: "Fight Malekondrius" },
            { name: "Demonic Legion", duration: 60, description: "Survive demonic legion" },
            { name: "Malekondrius Phase 2", duration: 65, description: "Transformed Malekondrius" },
            { name: "Abyssal Corruption", duration: 70, description: "Survive abyssal corruption" },
            { name: "Malekondrius Phase 3", duration: 40, description: "Final form" },
            { name: "Ultimate Confrontation", duration: 20, description: "Defeat Malekondrius completely" }
        ],
        requirements: {
            level: 99,
            quests: ["harbinger_defeated", "abyss_prepared"],
            items: ["abyssal_resistance_artifact"],
            reputation: { faction: "order_of_komodo", level: "legendary" },
            achievements: ["all_harbingers_defeated"]
        },
        rewards: {
            experience: 500000,
            gold: 250000,
            items: [
                { name: "Malekondrius' Abyssal Blade", type: "weapon", rarity: "mythic" },
                { name: "Abyssal Lord Plate", type: "armor", rarity: "mythic" },
                { name: "Abyssal Core", type: "material", rarity: "legendary" },
                { name: "Demonic Steed", type: "mount", rarity: "legendary" }
            ],
            achievements: ["abyssal_slayer", "world_savior", "malekondrius_bane"],
            titles: ["Abyssal Slayer", "World Savior", "Malekondrius' Bane"],
            specialRewards: [
                "New Game+ access",
                "Legendary status",
                "World monument"
            ]
        }
    }
];

// Utility functions
const raidsModule = {
    /**
     * Get raid by ID
     */
    getRaidById: function(id) {
        return raids.find(raid => raid.id === id);
    },
    
    /**
     * Get all raids
     */
    getAllRaids: function() {
        return raids;
    },
    
    /**
     * Get raids by level range
     */
    getRaidsByLevel: function(minLevel, maxLevel) {
        return raids.filter(raid => 
            raid.level >= minLevel && raid.level <= maxLevel
        );
    },
    
    /**
     * Get raids available for player level
     */
    getAvailableRaids: function(playerLevel) {
        return raids.filter(raid => raid.level <= playerLevel);
    },
    
    /**
     * Get raid difficulty rating
     */
    getRaidDifficulty: function(raidId) {
        const raid = this.getRaidById(raidId);
        return raid ? raid.difficulty : 'unknown';
    },
    
    /**
     * Check if player can join raid
     */
    canJoinRaid: function(player, raidId) {
        const raid = this.getRaidById(raidId);
        if (!raid) return { canJoin: false, reason: 'Raid not found' };
        
        // Check level requirement
        if (player.level < raid.level) {
            return { 
                canJoin: false, 
                reason: `Requires level ${raid.level}`,
                requiredLevel: raid.level
            };
        }
        
        // Check quest requirements (simplified)
        if (raid.requirements.quests) {
            // Would need to check player's completed quests
            // For now, assume player has required quests
        }
        
        return { canJoin: true, reason: 'Can join raid' };
    },
    
    /**
     * Get raid rewards summary
     */
    getRaidRewards: function(raidId) {
        const raid = this.getRaidById(raidId);
        return raid ? raid.rewards : null;
    },
    
    /**
     * Get raid phases
     */
    getRaidPhases: function(raidId) {
        const raid = this.getRaidById(raidId);
        return raid ? raid.phases : [];
    },
    
    /**
     * Get raid mechanics
     */
    getRaidMechanics: function(raidId) {
        const raid = this.getRaidById(raidId);
        return raid ? raid.mechanics : [];
    }
};

module.exports = raidsModule;
