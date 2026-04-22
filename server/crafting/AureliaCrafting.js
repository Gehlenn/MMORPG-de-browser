/**
 * AureliaCrafting.js
 * 
 * Crafting system for Aurélia desert resources
 * Recipes using desert materials and unique Aurelia crafting stations
 */

class AureliaCrafting {
    constructor(database) {
        this.db = database;
        
        // Crafting stations in Aurelia
        this.stations = {
            oasis_campfire: {
                id: 'oasis_campfire',
                name: 'Oasis Campfire',
                location: { x: 600, y: 500, subZone: 'oasis_shamara' },
                type: 'cooking',
                recipes: ['mirage_soup', 'cactus_stew', 'dried_meat', 'purified_water']
            },
            nomad_workbench: {
                id: 'nomad_workbench',
                name: 'Nomad Workbench',
                location: { x: 800, y: 3500, subZone: 'golden_dunes' },
                type: 'crafting',
                recipes: ['desert_cloak', 'sun_hat', 'sand_boots', 'water_skin']
            },
            ancient_forge: {
                id: 'ancient_forge',
                name: 'Ancient Forge',
                location: { x: 1800, y: 1800, subZone: 'ruins_ankhet' },
                type: 'smithing',
                recipes: ['sunsteel_blade', 'cursed_dagger', 'pharaoh_ring', 'ankh_pendant']
            },
            alchemist_tent: {
                id: 'alchemist_tent',
                name: 'Nomad Alchemist Tent',
                location: { x: 2200, y: 2800, subZone: 'thief_valley' },
                type: 'alchemy',
                recipes: ['sunscreen_potion', 'heat_resistance', 'mirage_eye_drops', 'venom_antidote']
            }
        };
        
        // Crafting recipes
        this.recipes = {
            // Cooking recipes
            mirage_soup: {
                id: 'mirage_soup',
                name: 'Mirage Soup',
                description: 'Restores HP and stamina, grants heat resistance',
                station: 'oasis_campfire',
                level: 35,
                materials: [
                    { id: 'oasis_water', amount: 2 },
                    { id: 'cactus_flesh', amount: 3 },
                    { id: 'desert_herbs', amount: 1 }
                ],
                result: {
                    id: 'mirage_soup',
                    amount: 1,
                    effects: {
                        hpRestore: 150,
                        staminaRestore: 50,
                        heatResistance: 300 // 5 minutes
                    }
                },
                time: 30, // seconds
                xp: 45
            },
            
            cactus_stew: {
                id: 'cactus_stew',
                name: 'Cactus Stew',
                description: 'Restores HP over time',
                station: 'oasis_campfire',
                level: 38,
                materials: [
                    { id: 'cactus_flesh', amount: 5 },
                    { id: 'oasis_water', amount: 1 },
                    { id: 'spicy_peppers', amount: 2 }
                ],
                result: {
                    id: 'cactus_stew',
                    amount: 1,
                    effects: {
                        hpRestoreOverTime: 200,
                        duration: 15000
                    }
                },
                time: 45,
                xp: 55
            },
            
            dried_meat: {
                id: 'dried_meat',
                name: 'Sun-Dried Meat',
                description: 'Long-lasting food that provides strength',
                station: 'oasis_campfire',
                level: 40,
                materials: [
                    { id: 'raw_meat', amount: 3 },
                    { id: 'desert_salt', amount: 1 },
                    { id: 'drying_rack', amount: 1, consumed: false } // Tool, not consumed
                ],
                result: {
                    id: 'dried_meat',
                    amount: 5,
                    effects: {
                        strengthBonus: 10,
                        duration: 600000 // 10 minutes
                    }
                },
                time: 120, // 2 minutes
                xp: 70
            },
            
            purified_water: {
                id: 'purified_water',
                name: 'Purified Water',
                description: 'Clean water that restores stamina and removes heat effects',
                station: 'oasis_campfire',
                level: 32,
                materials: [
                    { id: 'oasis_water', amount: 1 },
                    { id: 'desert_salt', amount: 1 },
                    { id: 'filter_cloth', amount: 1, consumed: false }
                ],
                result: {
                    id: 'purified_water',
                    amount: 1,
                    effects: {
                        staminaRestore: 80,
                        removesDebuffs: ['heat_exhaustion', 'sun_stroke']
                    }
                },
                time: 15,
                xp: 30
            },
            
            // Crafting recipes (Nomad Workbench)
            desert_cloak: {
                id: 'desert_cloak',
                name: 'Desert Cloak',
                description: 'Reduces heat damage, increases water retention',
                station: 'nomad_workbench',
                level: 42,
                materials: [
                    { id: 'linen_wraps', amount: 8 },
                    { id: 'chitin_plate', amount: 2 },
                    { id: 'desert_dye', amount: 3 }
                ],
                result: {
                    id: 'desert_cloak',
                    amount: 1,
                    slot: 'chest',
                    stats: {
                        defense: 45,
                        heatResistance: 25,
                        waterRetention: 30
                    }
                },
                time: 180,
                xp: 120
            },
            
            sun_hat: {
                id: 'sun_hat',
                name: 'Sun Hat',
                description: 'Protects from sun exposure',
                station: 'nomad_workbench',
                level: 38,
                materials: [
                    { id: 'dried_palm_leaves', amount: 6 },
                    { id: 'linen_thread', amount: 3 }
                ],
                result: {
                    id: 'sun_hat',
                    amount: 1,
                    slot: 'head',
                    stats: {
                        defense: 15,
                        sunProtection: 40,
                        heatResistance: 15
                    }
                },
                time: 60,
                xp: 60
            },
            
            sand_boots: {
                id: 'sand_boots',
                name: 'Sand Boots',
                description: 'Reduces movement penalty in sand, prevents quicksand',
                station: 'nomad_workbench',
                level: 45,
                materials: [
                    { id: 'chitin_plate', amount: 4 },
                    { id: 'cured_leather', amount: 3 },
                    { id: 'golden_gear', amount: 2 }
                ],
                result: {
                    id: 'sand_boots',
                    amount: 1,
                    slot: 'feet',
                    stats: {
                        defense: 35,
                        sandMoveSpeed: 20,
                        quicksandImmunity: true
                    }
                },
                time: 150,
                xp: 100
            },
            
            water_skin: {
                id: 'water_skin',
                name: 'Reinforced Water Skin',
                description: 'Holds more water and keeps it cool',
                station: 'nomad_workbench',
                level: 36,
                materials: [
                    { id: 'cured_leather', amount: 4 },
                    { id: 'chitin_plate', amount: 1 },
                    { id: 'wax_seal', amount: 2 }
                ],
                result: {
                    id: 'water_skin',
                    amount: 1,
                    slot: 'accessory',
                    stats: {
                        waterCapacity: 500,
                        waterCooling: true
                    }
                },
                time: 90,
                xp: 75
            },
            
            // Smithing recipes (Ancient Forge)
            sunsteel_blade: {
                id: 'sunsteel_blade',
                name: 'Sunsteel Blade',
                description: 'Blade forged with desert heat, burns enemies',
                station: 'ancient_forge',
                level: 50,
                materials: [
                    { id: 'steel_ingot', amount: 5 },
                    { id: 'desert_sun_shard', amount: 2 },
                    { id: 'golden_gear', amount: 3 },
                    { id: 'scorpion_tail', amount: 1 }
                ],
                result: {
                    id: 'sunsteel_blade',
                    amount: 1,
                    slot: 'weapon',
                    type: 'sword',
                    stats: {
                        damage: 120,
                        attackSpeed: 1.2,
                        fireDamage: 25,
                        burnChance: 0.15
                    }
                },
                time: 300, // 5 minutes
                xp: 200
            },
            
            cursed_dagger: {
                id: 'cursed_dagger',
                name: 'Cursed Dagger of Ankhet',
                description: 'Stolen from the ruins, curses the wielder and victim',
                station: 'ancient_forge',
                level: 52,
                materials: [
                    { id: 'cursed_amulet', amount: 1 },
                    { id: 'ancient_relics', amount: 3 },
                    { id: 'obsidian_shard', amount: 2 },
                    { id: 'linen_wraps', amount: 4 }
                ],
                result: {
                    id: 'cursed_dagger',
                    amount: 1,
                    slot: 'weapon',
                    type: 'dagger',
                    stats: {
                        damage: 85,
                        attackSpeed: 1.8,
                        curseDamage: 15,
                        lifeDrain: 0.05,
                        curseOnWielder: true
                    }
                },
                time: 240,
                xp: 180
            },
            
            pharaoh_ring: {
                id: 'pharaoh_ring',
                name: "Pharaoh's Signet Ring",
                description: 'Grants command authority over desert creatures',
                station: 'ancient_forge',
                level: 55,
                materials: [
                    { id: 'ancient_relics', amount: 5 },
                    { id: 'gold_nuggets', amount: 10 },
                    { id: 'cursed_amulet', amount: 2 },
                    { id: 'captain_insignia', amount: 3 }
                ],
                result: {
                    id: 'pharaoh_ring',
                    amount: 1,
                    slot: 'ring',
                    stats: {
                        charisma: 15,
                        desertCommand: true,
                        sandstormResistance: 50,
                        mummyPacification: true
                    }
                },
                time: 360,
                xp: 250
            },
            
            ankh_pendant: {
                id: 'ankh_pendant',
                name: 'Ankh of Life',
                description: 'Ancient symbol grants regeneration and revival chance',
                station: 'ancient_forge',
                level: 58,
                materials: [
                    { id: 'ancient_relics', amount: 8 },
                    { id: 'gold_nuggets', amount: 5 },
                    { id: 'ankh_fragment', amount: 1 },
                    { id: 'oasis_water', amount: 3 }
                ],
                result: {
                    id: 'ankh_pendant',
                    amount: 1,
                    slot: 'necklace',
                    stats: {
                        hpRegen: 0.02,
                        staminaRegen: 0.05,
                        reviveChance: 0.10,
                        poisonImmunity: true
                    }
                },
                time: 420,
                xp: 300
            },
            
            // Alchemy recipes
            sunscreen_potion: {
                id: 'sunscreen_potion',
                name: 'Desert Sunscreen',
                description: 'Protects from heat damage for extended periods',
                station: 'alchemist_tent',
                level: 40,
                materials: [
                    { id: 'cactus_flesh', amount: 3 },
                    { id: 'desert_herbs', amount: 2 },
                    { id: 'oasis_water', amount: 1 },
                    { id: 'wax_seal', amount: 1 }
                ],
                result: {
                    id: 'sunscreen_potion',
                    amount: 1,
                    type: 'potion',
                    effects: {
                        heatImmunity: true,
                        duration: 600000 // 10 minutes
                    }
                },
                time: 45,
                xp: 65
            },
            
            heat_resistance: {
                id: 'heat_resistance',
                name: 'Elixir of Heat Resistance',
                description: 'Grants immunity to environmental heat',
                station: 'alchemist_tent',
                level: 44,
                materials: [
                    { id: 'desert_herbs', amount: 4 },
                    { id: 'cactus_flesh', amount: 2 },
                    { id: 'scorpion_tail', amount: 1 },
                    { id: 'purified_water', amount: 2 }
                ],
                result: {
                    id: 'heat_resistance',
                    amount: 1,
                    type: 'elixir',
                    effects: {
                        heatImmunity: true,
                        fireResistance: 30,
                        duration: 1800000 // 30 minutes
                    }
                },
                time: 90,
                xp: 110
            },
            
            mirage_eye_drops: {
                id: 'mirage_eye_drops',
                name: 'Mirage Eye Drops',
                description: 'Reveals hidden enemies and true forms',
                station: 'alchemist_tent',
                level: 48,
                materials: [
                    { id: 'desert_herbs', amount: 3 },
                    { id: 'mirage_essence', amount: 1 },
                    { id: 'oasis_water', amount: 2 }
                ],
                result: {
                    id: 'mirage_eye_drops',
                    amount: 1,
                    type: 'potion',
                    effects: {
                        trueSight: true,
                        revealHidden: true,
                        illusionImmunity: true,
                        duration: 300000 // 5 minutes
                    }
                },
                time: 75,
                xp: 130
            },
            
            venom_antidote: {
                id: 'venom_antidote',
                name: 'Scorpion Venom Antidote',
                description: 'Cures poison and grants temporary poison immunity',
                station: 'alchemist_tent',
                level: 42,
                materials: [
                    { id: 'scorpion_tail', amount: 2 },
                    { id: 'desert_herbs', amount: 4 },
                    { id: 'oasis_water', amount: 2 }
                ],
                result: {
                    id: 'venom_antidote',
                    amount: 2,
                    type: 'potion',
                    effects: {
                        curePoison: true,
                        poisonImmunity: true,
                        duration: 300000
                    }
                },
                time: 60,
                xp: 90
            }
        };
        
        // Active crafting sessions
        this.activeCrafting = new Map(); // playerId -> crafting data
        
        // Unlock tracking
        this.playerUnlocks = new Map(); // playerId -> unlocked recipes[]
    }
    
    /**
     * Initialize crafting system
     */
    async initialize() {
        console.log('[AureliaCrafting] Initializing crafting system...');
        
        // Load player unlocks from database
        await this.loadUnlocks();
        
        console.log(`[AureliaCrafting] System initialized with ${Object.keys(this.recipes).length} recipes`);
    }
    
    /**
     * Load recipe unlocks from database
     */
    async loadUnlocks() {
        try {
            const rows = await this.db.all(
                'SELECT player_id, recipe_id FROM aurelia_crafting_unlocks'
            );
            
            for (const row of rows) {
                if (!this.playerUnlocks.has(row.player_id)) {
                    this.playerUnlocks.set(row.player_id, new Set());
                }
                this.playerUnlocks.get(row.player_id).add(row.recipe_id);
            }
        } catch (error) {
            console.error('[AureliaCrafting] Error loading unlocks:', error);
        }
    }
    
    /**
     * Get recipes for a station
     */
    getRecipesForStation(stationId, playerId) {
        const station = this.stations[stationId];
        if (!station) return [];
        
        const playerUnlocks = this.playerUnlocks.get(playerId) || new Set();
        
        return station.recipes
            .map(recipeId => this.recipes[recipeId])
            .filter(recipe => {
                // Check if recipe is unlocked or player meets level
                return playerUnlocks.has(recipe.id) || recipe.level <= 60; // Show if level appropriate
            })
            .map(recipe => ({
                id: recipe.id,
                name: recipe.name,
                description: recipe.description,
                level: recipe.level,
                materials: recipe.materials,
                time: recipe.time,
                xp: recipe.xp,
                unlocked: playerUnlocks.has(recipe.id),
                canCraft: false // Will be determined client-side based on inventory
            }));
    }
    
    /**
     * Check if player can craft recipe
     */
    canCraft(player, recipeId, stationId) {
        const recipe = this.recipes[recipeId];
        if (!recipe) {
            return { canCraft: false, reason: 'Recipe not found' };
        }
        
        // Check station
        if (recipe.station !== stationId) {
            return { canCraft: false, reason: 'Wrong crafting station' };
        }
        
        // Check level
        if (player.level < recipe.level) {
            return { canCraft: false, reason: `Requires level ${recipe.level}` };
        }
        
        // Check if already crafting
        if (this.activeCrafting.has(player.id)) {
            return { canCraft: false, reason: 'Already crafting' };
        }
        
        // Check materials
        const missingMaterials = [];
        for (const material of recipe.materials) {
            const hasAmount = player.inventory?.getItemCount(material.id) || 0;
            if (hasAmount < material.amount) {
                missingMaterials.push({
                    id: material.id,
                    required: material.amount,
                    has: hasAmount
                });
            }
        }
        
        if (missingMaterials.length > 0) {
            return {
                canCraft: false,
                reason: 'Missing materials',
                missingMaterials
            };
        }
        
        // Check distance to station
        const station = this.stations[stationId];
        const distance = Math.sqrt(
            Math.pow(player.x - station.location.x, 2) +
            Math.pow(player.y - station.location.y, 2)
        );
        
        if (distance > 150) {
            return { canCraft: false, reason: 'Too far from station' };
        }
        
        return { canCraft: true, recipe };
    }
    
    /**
     * Start crafting
     */
    async startCrafting(player, recipeId, stationId) {
        const check = this.canCraft(player, recipeId, stationId);
        
        if (!check.canCraft) {
            return { success: false, message: check.reason, ...check };
        }
        
        const recipe = check.recipe;
        
        // Consume materials
        for (const material of recipe.materials) {
            if (material.consumed !== false) {
                await player.inventory.removeItem(material.id, material.amount);
            }
        }
        
        // Create crafting session
        const session = {
            playerId: player.id,
            recipeId,
            stationId,
            startTime: Date.now(),
            endTime: Date.now() + (recipe.time * 1000),
            status: 'crafting'
        };
        
        this.activeCrafting.set(player.id, session);
        
        // Schedule completion
        setTimeout(() => {
            this.completeCrafting(player.id);
        }, recipe.time * 1000);
        
        return {
            success: true,
            recipe: {
                id: recipe.id,
                name: recipe.name,
                time: recipe.time
            },
            endTime: session.endTime,
            message: `Started crafting ${recipe.name}`
        };
    }
    
    /**
     * Complete crafting
     */
    async completeCrafting(playerId) {
        const session = this.activeCrafting.get(playerId);
        if (!session) return;
        
        const recipe = this.recipes[session.recipeId];
        
        // Add result to player inventory
        // Would call: await player.inventory.addItem(recipe.result);
        
        // Grant XP
        // await player.addCraftingXP('aurelia', recipe.xp);
        
        // Mark recipe as unlocked
        await this.unlockRecipe(playerId, session.recipeId);
        
        // Save to database
        await this.saveCrafting(playerId, session, true);
        
        // Clean up
        this.activeCrafting.delete(playerId);
        
        // Notify player
        return {
            success: true,
            result: recipe.result,
            xp: recipe.xp,
            message: `Crafting complete! Created ${recipe.name}`
        };
    }
    
    /**
     * Cancel crafting
     */
    cancelCrafting(playerId) {
        const session = this.activeCrafting.get(playerId);
        if (!session) {
            return { success: false, reason: 'No active crafting' };
        }
        
        // Return materials (partial?)
        // Would return some or all materials based on progress
        
        session.status = 'cancelled';
        this.saveCrafting(playerId, session, false);
        this.activeCrafting.delete(playerId);
        
        return {
            success: true,
            message: 'Crafting cancelled'
        };
    }
    
    /**
     * Unlock recipe for player
     */
    async unlockRecipe(playerId, recipeId) {
        if (!this.playerUnlocks.has(playerId)) {
            this.playerUnlocks.set(playerId, new Set());
        }
        
        const unlocks = this.playerUnlocks.get(playerId);
        if (!unlocks.has(recipeId)) {
            unlocks.add(recipeId);
            
            try {
                await this.db.run(
                    'INSERT OR IGNORE INTO aurelia_crafting_unlocks (player_id, recipe_id) VALUES (?, ?)',
                    [playerId, recipeId]
                );
                
                console.log(`[AureliaCrafting] Player ${playerId} unlocked recipe ${recipeId}`);
            } catch (error) {
                console.error('[AureliaCrafting] Error saving unlock:', error);
            }
        }
    }
    
    /**
     * Save crafting to database
     */
    async saveCrafting(playerId, session, success) {
        try {
            await this.db.run(
                `INSERT INTO aurelia_crafting_log 
                 (player_id, recipe_id, station_id, start_time, end_time, success)
                 VALUES (?, ?, ?, datetime('now', '-${this.recipes[session.recipeId].time} seconds'), datetime('now'), ?)`,
                [playerId, session.recipeId, session.stationId, success]
            );
        } catch (error) {
            console.error('[AureliaCrafting] Error saving crafting:', error);
        }
    }
    
    /**
     * Get player crafting status
     */
    getCraftingStatus(playerId) {
        const session = this.activeCrafting.get(playerId);
        if (!session) return null;
        
        const now = Date.now();
        const remaining = Math.max(0, session.endTime - now);
        const progress = ((now - session.startTime) / (session.endTime - session.startTime)) * 100;
        
        return {
            active: true,
            recipeId: session.recipeId,
            recipeName: this.recipes[session.recipeId]?.name,
            stationId: session.stationId,
            remaining: Math.ceil(remaining / 1000),
            progress: Math.min(100, progress)
        };
    }
    
    /**
     * Get nearby stations
     */
    getNearbyStations(x, y, radius = 200) {
        const nearby = [];
        
        for (const [id, station] of Object.entries(this.stations)) {
            const distance = Math.sqrt(
                Math.pow(x - station.location.x, 2) +
                Math.pow(y - station.location.y, 2)
            );
            
            if (distance <= radius) {
                nearby.push({
                    id,
                    name: station.name,
                    distance: Math.floor(distance),
                    type: station.type,
                    recipes: station.recipes.length
                });
            }
        }
        
        return nearby.sort((a, b) => a.distance - b.distance);
    }
    
    /**
     * Get station info
     */
    getStationInfo(stationId) {
        const station = this.stations[stationId];
        if (!station) return null;
        
        return {
            id: station.id,
            name: station.name,
            location: station.location,
            type: station.type,
            recipeCount: station.recipes.length,
            recipes: station.recipes.map(id => ({
                id,
                name: this.recipes[id]?.name
            }))
        };
    }
    
    /**
     * Get all recipes
     */
    getAllRecipes() {
        return Object.values(this.recipes).map(recipe => ({
            id: recipe.id,
            name: recipe.name,
            level: recipe.level,
            station: recipe.station,
            time: recipe.time,
            xp: recipe.xp
        }));
    }
    
    /**
     * Get player unlocks
     */
    getPlayerUnlocks(playerId) {
        const unlocks = this.playerUnlocks.get(playerId);
        return unlocks ? Array.from(unlocks) : [];
    }
    
    /**
     * Get crafting statistics
     */
    async getStatistics() {
        try {
            const totalCrafted = await this.db.get(
                'SELECT COUNT(*) as count FROM aurelia_crafting_log WHERE success = 1'
            );
            
            const popularRecipe = await this.db.get(
                `SELECT recipe_id, COUNT(*) as count 
                 FROM aurelia_crafting_log 
                 WHERE success = 1
                 GROUP BY recipe_id 
                 ORDER BY count DESC 
                 LIMIT 1`
            );
            
            const uniqueCrafters = await this.db.get(
                'SELECT COUNT(DISTINCT player_id) as count FROM aurelia_crafting_log'
            );
            
            return {
                totalCrafted: totalCrafted?.count || 0,
                mostCraftedRecipe: popularRecipe?.recipe_id || 'none',
                uniqueCrafters: uniqueCrafters?.count || 0,
                activeCrafting: this.activeCrafting.size,
                totalRecipes: Object.keys(this.recipes).length
            };
        } catch (error) {
            console.error('[AureliaCrafting] Error getting statistics:', error);
            return null;
        }
    }
    
    /**
     * Cleanup
     */
    cleanup() {
        this.activeCrafting.clear();
        this.playerUnlocks.clear();
    }
}

module.exports = AureliaCrafting;
