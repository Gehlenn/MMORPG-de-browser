/**
 * Cities System
 * Defines all major cities and their properties
 */

const cities = [
    {
        id: "greenhaven",
        name: "Greenhaven",
        region: "starter_plains",
        x: 400,
        y: 300,
        population: 5000,
        government: "Council of Elders",
        specialty: "basic_training",
        description: "Peaceful starter city where new adventurers begin their journey",
        services: [
            { type: "guild", name: "Adventurers Guild", level: 1 },
            { type: "shop", name: "Basic Equipment Shop", level: 1 },
            { type: "forge", name: "Basic Forge", level: 1 },
            { type: "alchemy", name: "Basic Alchemy Shop", level: 1 },
            { type: "temple", name: "Temple of Komodo", level: 1 },
            { type: "inn", name: "Traveler's Rest", level: 1 },
            { type: "bank", name: "Greenhaven Bank", level: 1 }
        ],
        npcs: [
            { name: "Captain Marcus", role: "quest_giver", location: "town_square" },
            { name: "Elder Thomas", role: "lore_master", location: "temple" },
            { name: "Blacksmith John", role: "equipment_vendor", location: "forge" },
            { name: "Merchant Sarah", role: "general_vendor", location: "shop" },
            { name: "Priest Michael", role: "healer", location: "temple" }
        ],
        quests: [
            { id: "first_steps", name: "First Steps", level: 1, type: "tutorial" },
            { id: "rat_problem", name: "Rat Problem", level: 2, type: "kill_quests" },
            { id: "lost_supplies", name: "Lost Supplies", level: 3, type: "fetch_quest" }
        ],
        connections: ["oakheart", "stonehold"],
        travelCost: 0, // Free travel from starting city
        safetyLevel: "safe"
    },
    {
        id: "oakheart",
        name: "Oakheart",
        region: "oakheart_forest",
        x: 1200,
        y: 800,
        population: 3000,
        government: "Druidic Circle",
        specialty: "alchemy_herbalism",
        description: "Mystical forest city home to druids and alchemists",
        services: [
            { type: "alchemy", name: "Master Alchemy Shop", level: 15 },
            { type: "herbalism", name: "Herbalism Center", level: 15 },
            { type: "temple", name: "Nature Temple", level: 15 },
            { type: "shop", name: "Forest Supplies", level: 15 },
            { type: "guild", name: "Druids Circle", level: 15 }
        ],
        npcs: [
            { name: "Archdruid Elara", role: "guild_master", location: "druid_circle" },
            { name: "Herbalist Luna", role: "alchemy_vendor", location: "alchemy_shop" },
            { name: "Forest Guardian", role: "quest_giver", location: "nature_temple" }
        ],
        quests: [
            { id: "ancient_tree", name: "Ancient Tree Blessing", level: 12, type: "escort_quest" },
            { id: "poison_remedy", name: "Poison Remedy", level: 14, type: "gather_quest" },
            { id: "forest_spirits", name: "Forest Spirits", level: 16, type: "spirit_quest" }
        ],
        connections: ["greenhaven", "stonehold", "sunspire"],
        travelCost: 50,
        safetyLevel: "safe"
    },
    {
        id: "stonehold",
        name: "Stonehold",
        region: "stonehold_mountains",
        x: 1600,
        y: 300,
        population: 8000,
        government: "Dwarven Clan",
        specialty: "mining_forging",
        description: "Great dwarven city built into the mountain",
        services: [
            { type: "forge", name: "Great Forge", level: 25 },
            { type: "mining", name: "Mining Guild", level: 25 },
            { type: "shop", name: "Dwarven Armory", level: 25 },
            { type: "tavern", name: "Hammer & Ale", level: 25 },
            { type: "bank", name: "Stonehold Treasury", level: 25 }
        ],
        npcs: [
            { name: "Forge Master Borin", role: "forge_master", location: "great_forge" },
            { name: "Mining Chief Grak", role: "mining_master", location: "mining_guild" },
            { name: "Tavern Keeper Dwalin", role: "vendor", location: "tavern" }
        ],
        quests: [
            { id: "lost_mine", name: "Lost Mine Rescue", level: 22, type: "dungeon_quest" },
            { id: "crystal_heart", name: "Crystal Heart", level: 26, type: "raid_quest" },
            { id: "mountain_titan", name: "Mountain Titan", level: 28, type: "boss_quest" }
        ],
        connections: ["greenhaven", "oakheart", "frostgard"],
        travelCost: 100,
        safetyLevel: "safe"
    },
    {
        id: "sunspire",
        name: "Sunspire",
        region: "sunspire_desert",
        x: 2000,
        y: 900,
        population: 6000,
        government: "Merchant Council",
        specialty: "commerce_trading",
        description: "Bustling desert city and center of international trade",
        services: [
            { type: "market", name: "Grand Market", level: 35 },
            { type: "auction", name: "Auction House", level: 35 },
            { type: "bank", name: "International Bank", level: 35 },
            { type: "caravan", name: "Caravan Guild", level: 35 },
            { type: "shop", name: "Desert Goods", level: 35 }
        ],
        npcs: [
            { name: "Merchant Prince Aziz", role: "auction_master", location: "auction_house" },
            { name: "Caravan Master Rashid", role: "travel_master", location: "caravan_guild" },
            { name: "Banker Fatima", role: "banker", location: "bank" }
        ],
        quests: [
            { id: "caravan_escort", name: "Caravan Escort", level: 32, type: "escort_quest" },
            { id: "lost_oasis", name: "Lost Oasis", level: 36, type: "exploration_quest" },
            { id: "sand_temple", name: "Sand Temple Secrets", level: 38, type: "dungeon_quest" }
        ],
        connections: ["oakheart", "ashenforge"],
        travelCost: 150,
        safetyLevel: "neutral"
    },
    {
        id: "frostgard",
        name: "Frostgard",
        region: "frostlands",
        x: 1800,
        y: 200,
        population: 4000,
        government: "Priestly Order",
        specialty: "divine_magic",
        description: "Frozen city of priests and mages",
        services: [
            { type: "temple", name: "Ice Cathedral", level: 65 },
            { type: "magic", name: "Arcane Academy", level: 65 },
            { type: "shop", name: "Frozen Supplies", level: 65 },
            { type: "library", name: "Arcane Library", level: 65 }
        ],
        npcs: [
            { name: "Archmage Winter", role: "magic_master", location: "arcane_academy" },
            { name: "High Priestess Frost", role: "healer", location: "ice_cathedral" },
            { name: "Librarian Sage", role: "lore_master", location: "arcane_library" }
        ],
        quests: [
            { id: "frozen_heart", name: "Frozen Heart", level: 62, type: "dungeon_quest" },
            { id: "ice_elemental", name: "Ice Elemental Lord", level: 66, type: "boss_quest" },
            { id: "glacier_peak", name: "Glacier Peak", level: 68, type: "exploration_quest" }
        ],
        connections: ["stonehold", "ashenforge"],
        travelCost: 200,
        safetyLevel: "neutral"
    },
    {
        id: "ashenforge",
        name: "Ashenforge",
        region: "ashen_volcano",
        x: 2100,
        y: 500,
        population: 2000,
        government: "Master Artisan",
        specialty: "legendary_crafting",
        description: "Volcanic city where legendary items are forged",
        services: [
            { type: "forge", name: "Volcanic Forge", level: 75 },
            { type: "refining", name: "Master Refinery", level: 75 },
            { type: "shop", name: "Legendary Supplies", level: 75 },
            { type: "guild", name: "Artisans Guild", level: 75 }
        ],
        npcs: [
            { name: "Master Artisan Ignis", role: "forge_master", location: "volcanic_forge" },
            { name: "Refiner Master", role: "refining_master", location: "master_refinery" },
            { name: "Legendary Merchant", role: "vendor", location: "legendary_supplies" }
        ],
        quests: [
            { id: "volcanic_heart", name: "Volcanic Heart", level: 72, type: "dungeon_quest" },
            { id: "ash_drake", name: "Ash Drake Hunt", level: 76, type: "boss_quest" },
            { id: "infernal_crucible", name: "Infernal Crucible", level: 78, type: "raid_quest" }
        ],
        connections: ["sunspire", "frostgard"],
        travelCost: 300,
        safetyLevel: "dangerous"
    }
];

// Utility functions
const citiesModule = {
    /**
     * Get city by ID
     */
    getCityById: function(id) {
        return cities.find(city => city.id === id);
    },
    
    /**
     * Get cities by region
     */
    getCitiesByRegion: function(regionId) {
        return cities.filter(city => city.region === regionId);
    },
    
    /**
     * Get all cities
     */
    getAllCities: function() {
        return cities;
    },
    
    /**
     * Get cities accessible by level
     */
    getCitiesByLevel: function(playerLevel) {
        const { getRegionByLevel } = require("./getRegionByLevel");
        const accessibleRegions = getRegionsByLevelRange(1, playerLevel);
        
        return cities.filter(city => 
            accessibleRegions.some(region => region.id === city.region)
        );
    },
    
    /**
     * Get city connections
     */
    getCityConnections: function(cityId) {
        const city = this.getCityById(cityId);
        if (!city) return [];
        
        return city.connections.map(connectionId => this.getCityById(connectionId))
            .filter(city => city !== undefined);
    },
    
    /**
     * Calculate travel cost between cities
     */
    calculateTravelCost: function(fromCityId, toCityId) {
        const fromCity = this.getCityById(fromCityId);
        const toCity = this.getCityById(toCityId);
        
        if (!fromCity || !toCity) return 0;
        
        // Base cost + destination cost
        return fromCity.travelCost + toCity.travelCost;
    },
    
    /**
     * Get city services
     */
    getCityServices: function(cityId) {
        const city = this.getCityById(cityId);
        return city ? city.services : [];
    },
    
    /**
     * Get city quests
     */
    getCityQuests: function(cityId) {
        const city = this.getCityById(cityId);
        return city ? city.quests : [];
    }
};

module.exports = citiesModule;
