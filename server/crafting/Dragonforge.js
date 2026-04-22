/**
 * Dragonforge.js
 * 
 * Legendary crafting system for Draconia
 * Creates powerful items using dragon materials
 */

const EventEmitter = require('events');

class Dragonforge extends EventEmitter {
    constructor(database, zone) {
        super();
        this.db = database;
        this.zone = zone;
        
        // Station location
        this.stationLocation = { x: 3900, y: 1850 }; // Volcanic Core
        this.interactionRadius = 100;
        
        // Recipe database
        this.recipes = this.setupRecipes();
        
        // Player unlocks
        this.playerUnlocks = new Map(); // playerId -> Set(unlockedRecipes)
        
        // Crafting queue
        this.craftingQueue = new Map(); // playerId -> { recipe, progress, startTime }
        
        this.initialized = false;
    }
    
    async initialize() {
        console.log('[Dragonforge] Initializing Dragonforge crafting system...');
        await this.loadPlayerUnlocks();
        this.initialized = true;
        console.log('[Dragonforge] Crafting system initialized with', this.recipes.length, 'recipes');
        this.emit('initialized');
        return true;
    }
    
    setupRecipes() {
        return [
            // Weapons (4 recipes)
            {
                id: 'dragonflame_blade',
                name: 'Dragonflame Blade',
                type: 'weapon',
                level: 75,
                materials: {
                    'dragon_scale': 5,
                    'fire_essence': 10,
                    'magma_core': 2,
                    'krazgoth_fang': 1
                },
                goldCost: 50000,
                craftingTime: 600000, // 10 minutes
                result: {
                    itemId: 'dragonflame_blade',
                    damage: 450,
                    fireDamage: 120,
                    stats: { strength: 25, critChance: 0.15 }
                }
            },
            {
                id: 'frostwyrm_bow',
                name: 'Frostwyrm Bow',
                type: 'weapon',
                level: 75,
                materials: {
                    'wyvern_wing': 3,
                    'frost_essence': 8,
                    'wyvern_talon': 6,
                    'dragon_scale': 3
                },
                goldCost: 48000,
                craftingTime: 600000,
                result: {
                    itemId: 'frostwyrm_bow',
                    damage: 420,
                    iceDamage: 100,
                    stats: { agility: 30, attackSpeed: 0.2 }
                }
            },
            {
                id: 'volcanic_staff',
                name: 'Volcanic Staff',
                type: 'weapon',
                level: 75,
                materials: {
                    'obsidian_chunk': 15,
                    'fire_heart': 1,
                    'inferno_essence': 5,
                    'drake_scale': 8
                },
                goldCost: 52000,
                craftingTime: 600000,
                result: {
                    itemId: 'volcanic_staff',
                    damage: 380,
                    fireDamage: 150,
                    stats: { intelligence: 35, spellPower: 0.25 }
                }
            },
            {
                id: 'ancient_dragon_dagger',
                name: 'Ancient Dragon Dagger',
                type: 'weapon',
                level: 75,
                materials: {
                    'krazgoth_claw': 3,
                    'dragonforge_ingot': 5,
                    'dragon_scale': 4,
                    'serpent_fang': 6
                },
                goldCost: 55000,
                craftingTime: 600000,
                result: {
                    itemId: 'ancient_dragon_dagger',
                    damage: 350,
                    poisonDamage: 80,
                    stats: { agility: 20, critChance: 0.25, attackSpeed: 0.3 }
                }
            },
            // Armor (4 recipes)
            {
                id: 'dragonscale_plate',
                name: 'Dragonscale Plate',
                type: 'armor',
                slot: 'chest',
                level: 75,
                materials: {
                    'dragon_scale': 15,
                    'drake_scale': 10,
                    'magma_shell': 5,
                    'dragonforge_ingot': 8
                },
                goldCost: 60000,
                craftingTime: 720000, // 12 minutes
                result: {
                    itemId: 'dragonscale_plate',
                    armor: 450,
                    fireResistance: 0.3,
                    stats: { strength: 20, vitality: 30, maxHp: 500 }
                }
            },
            {
                id: 'wyvern_hide_vest',
                name: 'Wyvern Hide Vest',
                type: 'armor',
                slot: 'chest',
                level: 75,
                materials: {
                    'wyvern_scale': 12,
                    'griffin_feather': 8,
                    'frost_pelt': 6,
                    'wind_essence': 5
                },
                goldCost: 55000,
                craftingTime: 720000,
                result: {
                    itemId: 'wyvern_hide_vest',
                    armor: 320,
                    windResistance: 0.25,
                    stats: { agility: 25, dexterity: 20, moveSpeed: 0.1 }
                }
            },
            {
                id: 'magma_golem_helm',
                name: 'Magma Golem Helm',
                type: 'armor',
                slot: 'head',
                level: 75,
                materials: {
                    'obsidian_chunk': 20,
                    'golem_fragment': 10,
                    'magma_core': 3,
                    'fire_essence': 8
                },
                goldCost: 45000,
                craftingTime: 600000,
                result: {
                    itemId: 'magma_golem_helm',
                    armor: 280,
                    fireResistance: 0.4,
                    stats: { vitality: 20, fireDamage: 0.15 }
                }
            },
            {
                id: 'phoenix_guard_boots',
                name: 'Phoenix Guard Boots',
                type: 'armor',
                slot: 'feet',
                level: 75,
                materials: {
                    'phoenix_feather': 10,
                    'dragon_scale': 6,
                    'fire_heart': 1,
                    'inferno_essence': 3
                },
                goldCost: 40000,
                craftingTime: 540000, // 9 minutes
                result: {
                    itemId: 'phoenix_guard_boots',
                    armor: 200,
                    fireResistance: 0.2,
                    stats: { agility: 15, moveSpeed: 0.15, fireTrail: true }
                }
            },
            // Accessories (4 recipes)
            {
                id: 'dragon_heart_amulet',
                name: 'Dragon Heart Amulet',
                type: 'accessory',
                slot: 'neck',
                level: 78,
                materials: {
                    'ancient_dragon_heart': 1,
                    'dragonforge_ingot': 5,
                    'krazgoth_horn': 2,
                    'dragon_scale': 8
                },
                goldCost: 80000,
                craftingTime: 900000, // 15 minutes
                result: {
                    itemId: 'dragon_heart_amulet',
                    stats: {
                        allStats: 15,
                        maxHp: 800,
                        hpRegen: 50,
                        dragonAura: true
                    }
                }
            },
            {
                id: 'serpent_coil_ring',
                name: 'Serpent Coil Ring',
                type: 'accessory',
                slot: 'ring',
                level: 76,
                materials: {
                    'serpent_eye': 2,
                    'lava_fang': 8,
                    'magma_sac': 3,
                    'obsidian_chunk': 10
                },
                goldCost: 35000,
                craftingTime: 480000,
                result: {
                    itemId: 'serpent_coil_ring',
                    stats: {
                        poisonDamage: 50,
                        critChance: 0.1,
                        poisonCoil: true
                    }
                }
            },
            {
                id: 'griffin_talon_clasp',
                name: 'Griffin Talon Clasp',
                type: 'accessory',
                slot: 'cloak',
                level: 76,
                materials: {
                    'griffin_claw': 6,
                    'griffin_feather': 12,
                    'wyvern_wing': 4,
                    'wind_essence': 8
                },
                goldCost: 38000,
                craftingTime: 480000,
                result: {
                    itemId: 'griffin_talon_clasp',
                    stats: {
                        agility: 20,
                        moveSpeed: 0.1,
                        fallDamageImmunity: true,
                        glide: true
                    }
                }
            },
            {
                id: 'inferno_band',
                name: 'Inferno Band',
                type: 'accessory',
                slot: 'ring',
                level: 78,
                materials: {
                    'inferno_essence': 5,
                    'fire_heart': 2,
                    'magma_core': 5,
                    'dragonforge_ingot': 8
                },
                goldCost: 45000,
                craftingTime: 540000,
                result: {
                    itemId: 'inferno_band',
                    stats: {
                        fireDamage: 100,
                        fireResistance: 0.25,
                        burnAura: true
                    }
                }
            }
        ];
    }
    
    async loadPlayerUnlocks() {
        try {
            const rows = await this.db.all(`
                SELECT player_id, recipe_id FROM draconia_crafting_unlocks
            `);
            
            for (const row of rows) {
                if (!this.playerUnlocks.has(row.player_id)) {
                    this.playerUnlocks.set(row.player_id, new Set());
                }
                this.playerUnlocks.get(row.player_id).add(row.recipe_id);
            }
        } catch (error) {
            console.error('[Dragonforge] Error loading unlocks:', error);
        }
    }
    
    canPlayerAccess(playerId, playerData) {
        // Check if player is near the forge
        const dx = playerData.x - this.stationLocation.x;
        const dy = playerData.y - this.stationLocation.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= this.interactionRadius;
    }
    
    getAvailableRecipes(playerId) {
        const playerLevel = this.getPlayerLevel(playerId);
        const unlocked = this.playerUnlocks.get(playerId) || new Set();
        
        return this.recipes.map(recipe => ({
            ...recipe,
            unlocked: unlocked.has(recipe.id),
            canCraft: this.canCraftRecipe(playerId, recipe),
            missingMaterials: this.getMissingMaterials(playerId, recipe)
        }));
    }
    
    canCraftRecipe(playerId, recipe) {
        const playerLevel = this.getPlayerLevel(playerId);
        if (playerLevel < recipe.level) return false;
        
        // Check materials
        const missing = this.getMissingMaterials(playerId, recipe);
        return missing.length === 0;
    }
    
    getMissingMaterials(playerId, recipe) {
        // In real implementation, would check player inventory
        // For now, return empty (assume player has materials)
        return [];
    }
    
    getPlayerLevel(playerId) {
        // Would get from player data
        return 75; // Placeholder
    }
    
    async startCrafting(playerId, recipeId) {
        if (this.craftingQueue.has(playerId)) {
            return { success: false, error: 'Already crafting' };
        }
        
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) {
            return { success: false, error: 'Recipe not found' };
        }
        
        if (!this.canCraftRecipe(playerId, recipe)) {
            return { success: false, error: 'Cannot craft this recipe' };
        }
        
        // Check if recipe is unlocked
        const unlocked = this.playerUnlocks.get(playerId) || new Set();
        if (!unlocked.has(recipeId)) {
            return { success: false, error: 'Recipe not unlocked' };
        }
        
        // Start crafting
        const craftSession = {
            recipe: recipe,
            progress: 0,
            startTime: Date.now(),
            endTime: Date.now() + recipe.craftingTime
        };
        
        this.craftingQueue.set(playerId, craftSession);
        
        // Schedule completion
        setTimeout(() => {
            this.completeCrafting(playerId);
        }, recipe.craftingTime);
        
        this.emit('craftingStarted', {
            playerId,
            recipeId,
            endTime: craftSession.endTime
        });
        
        return {
            success: true,
            endTime: craftSession.endTime,
            duration: recipe.craftingTime
        };
    }
    
    completeCrafting(playerId) {
        const session = this.craftingQueue.get(playerId);
        if (!session) return;
        
        this.craftingQueue.delete(playerId);
        
        // Create item
        const item = { ...session.recipe.result, craftedAt: Date.now() };
        
        // Log to database
        this.logCrafting(playerId, session.recipe.id, item);
        
        this.emit('craftingComplete', {
            playerId,
            recipeId: session.recipe.id,
            item: item
        });
        
        return { success: true, item };
    }
    
    cancelCrafting(playerId) {
        if (!this.craftingQueue.has(playerId)) {
            return { success: false, error: 'Not crafting' };
        }
        
        this.craftingQueue.delete(playerId);
        
        this.emit('craftingCancelled', { playerId });
        return { success: true };
    }
    
    getCraftingProgress(playerId) {
        const session = this.craftingQueue.get(playerId);
        if (!session) return null;
        
        const now = Date.now();
        const elapsed = now - session.startTime;
        const progress = Math.min(100, (elapsed / session.recipe.craftingTime) * 100);
        const remaining = Math.max(0, session.endTime - now);
        
        return {
            recipeId: session.recipe.id,
            progress: Math.floor(progress),
            remainingTime: remaining
        };
    }
    
    async unlockRecipe(playerId, recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return { success: false, error: 'Recipe not found' };
        
        if (!this.playerUnlocks.has(playerId)) {
            this.playerUnlocks.set(playerId, new Set());
        }
        
        this.playerUnlocks.get(playerId).add(recipeId);
        
        // Save to database
        try {
            await this.db.run(`
                INSERT OR IGNORE INTO draconia_crafting_unlocks (player_id, recipe_id, unlocked_at)
                VALUES (?, ?, datetime('now'))
            `, [playerId, recipeId]);
        } catch (error) {
            console.error('[Dragonforge] Error saving unlock:', error);
        }
        
        this.emit('recipeUnlocked', { playerId, recipeId });
        return { success: true };
    }
    
    async logCrafting(playerId, recipeId, item) {
        try {
            await this.db.run(`
                INSERT INTO draconia_crafting_history (player_id, recipe_id, item_created, crafted_at)
                VALUES (?, ?, ?, datetime('now'))
            `, [playerId, recipeId, JSON.stringify(item)]);
        } catch (error) {
            console.error('[Dragonforge] Error logging crafting:', error);
        }
    }
    
    getStationData() {
        return {
            location: this.stationLocation,
            radius: this.interactionRadius,
            recipeCount: this.recipes.length,
            categories: ['weapon', 'armor', 'accessory']
        };
    }
    
    getStatistics() {
        return {
            totalRecipes: this.recipes.length,
            recipesByCategory: this.getRecipesByCategory(),
            activeCrafting: this.craftingQueue.size,
            totalUnlocks: Array.from(this.playerUnlocks.values()).reduce((sum, set) => sum + set.size, 0)
        };
    }
    
    getRecipesByCategory() {
        const byCategory = {};
        for (const recipe of this.recipes) {
            byCategory[recipe.type] = (byCategory[recipe.type] || 0) + 1;
        }
        return byCategory;
    }
}

module.exports = Dragonforge;
