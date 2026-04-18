/**
 * Crafting System - Item Creation and Enhancement
 * Handles crafting recipes, professions, and item modification
 * Version 0.3 - First Playable Gameplay Systems
 */

class CraftingSystem {
    constructor(server) {
        this.server = server;
        
        // Crafting configuration
        this.config = {
            maxProfessions: 3,
            craftingTimeMultiplier: 1.0,
            criticalSuccessChance: 0.05, // 5%
            criticalFailureChance: 0.02, // 2%
            maxCraftingQueue: 5,
            experienceGainMultiplier: 1.0,
            durabilityLossOnCraft: 0.1, // 10%
            
            // Profession settings
            professions: {
                blacksmithing: {
                    name: 'Blacksmithing',
                    description: 'Craft weapons and armor from metal',
                    primaryStat: 'strength',
                    tools: ['hammer', 'anvil'],
                    stations: ['forge', 'anvil']
                },
                alchemy: {
                    name: 'Alchemy',
                    description: 'Create potions and elixirs',
                    primaryStat: 'intelligence',
                    tools: ['mortar_pestle', 'alembic'],
                    stations: ['alchemy_lab']
                },
                enchanting: {
                    name: 'Enchanting',
                    description: 'Enchant items with magical properties',
                    primaryStat: 'intelligence',
                    tools: ['enchanted_dust', 'rune_stone'],
                    stations: ['enchanting_table']
                },
                tailoring: {
                    name: 'Tailoring',
                    description: 'Craft cloth and leather armor',
                    primaryStat: 'dexterity',
                    tools: ['needle', 'thread'],
                    stations: ['loom', 'workbench']
                },
                cooking: {
                    name: 'Cooking',
                    description: 'Prepare food and drinks',
                    primaryStat: 'none',
                    tools: ['knife', 'cutting_board'],
                    stations: ['kitchen', 'campfire']
                },
                jewelcrafting: {
                    name: 'Jewelcrafting',
                    description: 'Create jewelry and gems',
                    primaryStat: 'dexterity',
                    tools: ['jeweler_kit', 'polishing_cloth'],
                    stations: ['jeweler_bench']
                }
            }
        };
        
        // Recipes
        this.recipes = new Map();
        this.loadRecipes();
        
        // Player crafting data
        this.playerCraftingData = new Map();
        
        // Crafting stations
        this.craftingStations = new Map();
        this.initializeCraftingStations();
        
        // Active crafting operations
        this.activeCrafting = new Map();
        
        // Materials and items
        this.materials = new Map();
        this.loadMaterials();
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Load player crafting data
        this.loadPlayerCraftingData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start crafting queue processing
        this.startCraftingProcessor();
        
        console.log('Crafting System initialized');
    }
    
    loadRecipes() {
        // Blacksmithing recipes
        this.recipes.set('iron_sword', {
            id: 'iron_sword',
            name: 'Iron Sword',
            profession: 'blacksmithing',
            skillLevel: 1,
            difficulty: 'easy',
            craftingTime: 30000, // 30 seconds
            materials: [
                { id: 'iron_ore', quantity: 3 },
                { id: 'coal', quantity: 1 },
                { id: 'leather_strip', quantity: 2 }
            ],
            results: [
                { id: 'sword_common', quantity: 1, quality: 'common' }
            ],
            experience: 25,
            tools: ['hammer'],
            stations: ['forge'],
            criticalBonus: { chance: 0.1, result: { quality: 'uncommon' } },
            failurePenalty: { materialLoss: 0.5 }
        });
        
        this.recipes.set('steel_sword', {
            id: 'steel_sword',
            name: 'Steel Sword',
            profession: 'blacksmithing',
            skillLevel: 25,
            difficulty: 'medium',
            craftingTime: 60000, // 1 minute
            materials: [
                { id: 'steel_ingot', quantity: 2 },
                { id: 'iron_ore', quantity: 1 },
                { id: 'leather_strip', quantity: 2 }
            ],
            results: [
                { id: 'sword_uncommon', quantity: 1, quality: 'uncommon' }
            ],
            experience: 75,
            tools: ['hammer'],
            stations: ['forge'],
            criticalBonus: { chance: 0.15, result: { quality: 'rare' } },
            failurePenalty: { materialLoss: 0.7 }
        });
        
        this.recipes.set('iron_armor', {
            id: 'iron_armor',
            name: 'Iron Armor',
            profession: 'blacksmithing',
            skillLevel: 15,
            difficulty: 'medium',
            craftingTime: 90000, // 1.5 minutes
            materials: [
                { id: 'iron_ore', quantity: 5 },
                { id: 'leather_strip', quantity: 4 }
            ],
            results: [
                { id: 'armor_common', quantity: 1, quality: 'common' }
            ],
            experience: 50,
            tools: ['hammer'],
            stations: ['forge'],
            criticalBonus: { chance: 0.1, result: { quality: 'uncommon' } },
            failurePenalty: { materialLoss: 0.6 }
        });
        
        // Alchemy recipes
        this.recipes.set('health_potion', {
            id: 'health_potion',
            name: 'Health Potion',
            profession: 'alchemy',
            skillLevel: 1,
            difficulty: 'easy',
            craftingTime: 15000, // 15 seconds
            materials: [
                { id: 'herb', quantity: 2 },
                { id: 'water_vial', quantity: 1 }
            ],
            results: [
                { id: 'potion_health', quantity: 1, quality: 'common' }
            ],
            experience: 15,
            tools: ['mortar_pestle'],
            stations: ['alchemy_lab'],
            criticalBonus: { chance: 0.2, result: { quantity: 2 } },
            failurePenalty: { materialLoss: 0.3 }
        });
        
        this.recipes.set('mana_potion', {
            id: 'mana_potion',
            name: 'Mana Potion',
            profession: 'alchemy',
            skillLevel: 10,
            difficulty: 'easy',
            craftingTime: 20000, // 20 seconds
            materials: [
                { id: 'mana_herb', quantity: 2 },
                { id: 'water_vial', quantity: 1 }
            ],
            results: [
                { id: 'potion_mana', quantity: 1, quality: 'common' }
            ],
            experience: 20,
            tools: ['mortar_pestle'],
            stations: ['alchemy_lab'],
            criticalBonus: { chance: 0.15, result: { quantity: 2 } },
            failurePenalty: { materialLoss: 0.4 }
        });
        
        this.recipes.set('strength_elixir', {
            id: 'strength_elixir',
            name: 'Strength Elixir',
            profession: 'alchemy',
            skillLevel: 30,
            difficulty: 'hard',
            craftingTime: 45000, // 45 seconds
            materials: [
                { id: 'giant_toe', quantity: 1 },
                { id: 'fire_flower', quantity: 2 },
                { id: 'crystal_vial', quantity: 1 }
            ],
            results: [
                { id: 'elixir_strength', quantity: 1, quality: 'uncommon' }
            ],
            experience: 100,
            tools: ['mortar_pestle', 'alembic'],
            stations: ['alchemy_lab'],
            criticalBonus: { chance: 0.1, result: { quality: 'rare' } },
            failurePenalty: { materialLoss: 0.8 }
        });
        
        // Enchanting recipes
        this.recipes.set('weapon_enchant_damage', {
            id: 'weapon_enchant_damage',
            name: 'Weapon Damage Enchant',
            profession: 'enchanting',
            skillLevel: 20,
            difficulty: 'medium',
            craftingTime: 60000, // 1 minute
            materials: [
                { id: 'enchanted_dust', quantity: 3 },
                { id: 'rune_stone', quantity: 1 }
            ],
            results: [
                { id: 'enchant_damage', quantity: 1, quality: 'common' }
            ],
            experience: 60,
            tools: ['enchanted_dust'],
            stations: ['enchanting_table'],
            criticalBonus: { chance: 0.1, result: { quality: 'uncommon' } },
            failurePenalty: { materialLoss: 0.5, itemDamage: 0.2 }
        });
        
        // Tailoring recipes
        this.recipes.set('cloth_robe', {
            id: 'cloth_robe',
            name: 'Cloth Robe',
            profession: 'tailoring',
            skillLevel: 1,
            difficulty: 'easy',
            craftingTime: 25000, // 25 seconds
            materials: [
                { id: 'linen_cloth', quantity: 3 },
                { id: 'thread', quantity: 1 }
            ],
            results: [
                { id: 'robe_common', quantity: 1, quality: 'common' }
            ],
            experience: 20,
            tools: ['needle'],
            stations: ['loom'],
            criticalBonus: { chance: 0.1, result: { quality: 'uncommon' } },
            failurePenalty: { materialLoss: 0.4 }
        });
        
        this.recipes.set('leather_armor', {
            id: 'leather_armor',
            name: 'Leather Armor',
            profession: 'tailoring',
            skillLevel: 10,
            difficulty: 'medium',
            craftingTime: 40000, // 40 seconds
            materials: [
                { id: 'leather_hide', quantity: 4 },
                { id: 'thread', quantity: 2 }
            ],
            results: [
                { id: 'armor_leather', quantity: 1, quality: 'common' }
            ],
            experience: 40,
            tools: ['needle'],
            stations: ['workbench'],
            criticalBonus: { chance: 0.15, result: { quality: 'uncommon' } },
            failurePenalty: { materialLoss: 0.5 }
        });
        
        // Cooking recipes
        this.recipes.set('bread', {
            id: 'bread',
            name: 'Bread',
            profession: 'cooking',
            skillLevel: 1,
            difficulty: 'easy',
            craftingTime: 10000, // 10 seconds
            materials: [
                { id: 'flour', quantity: 2 },
                { id: 'water', quantity: 1 }
            ],
            results: [
                { id: 'bread', quantity: 2, quality: 'common' }
            ],
            experience: 10,
            tools: ['knife'],
            stations: ['kitchen'],
            criticalBonus: { chance: 0.2, result: { quantity: 3 } },
            failurePenalty: { materialLoss: 0.2 }
        });
        
        this.recipes.set('grilled_meat', {
            id: 'grilled_meat',
            name: 'Grilled Meat',
            profession: 'cooking',
            skillLevel: 5,
            difficulty: 'easy',
            craftingTime: 15000, // 15 seconds
            materials: [
                { id: 'raw_meat', quantity: 2 },
                { id: 'spices', quantity: 1 }
            ],
            results: [
                { id: 'cooked_meat', quantity: 2, quality: 'common' }
            ],
            experience: 15,
            tools: ['knife'],
            stations: ['campfire'],
            criticalBonus: { chance: 0.15, result: { quality: 'uncommon' } },
            failurePenalty: { materialLoss: 0.3 }
        });
    }
    
    loadMaterials() {
        // Metals
        this.materials.set('iron_ore', {
            id: 'iron_ore',
            name: 'Iron Ore',
            type: 'metal',
            rarity: 'common',
            stackSize: 99,
            value: 5
        });
        
        this.materials.set('steel_ingot', {
            id: 'steel_ingot',
            name: 'Steel Ingot',
            type: 'metal',
            rarity: 'uncommon',
            stackSize: 99,
            value: 25
        });
        
        this.materials.set('coal', {
            id: 'coal',
            name: 'Coal',
            type: 'metal',
            rarity: 'common',
            stackSize: 99,
            value: 3
        });
        
        // Herbs
        this.materials.set('herb', {
            id: 'herb',
            name: 'Herb',
            type: 'herb',
            rarity: 'common',
            stackSize: 99,
            value: 3
        });
        
        this.materials.set('mana_herb', {
            id: 'mana_herb',
            name: 'Mana Herb',
            type: 'herb',
            rarity: 'uncommon',
            stackSize: 99,
            value: 15
        });
        
        this.materials.set('fire_flower', {
            id: 'fire_flower',
            name: 'Fire Flower',
            type: 'herb',
            rarity: 'rare',
            stackSize: 20,
            value: 50
        });
        
        // Cloth and leather
        this.materials.set('linen_cloth', {
            id: 'linen_cloth',
            name: 'Linen Cloth',
            type: 'cloth',
            rarity: 'common',
            stackSize: 99,
            value: 4
        });
        
        this.materials.set('leather_hide', {
            id: 'leather_hide',
            name: 'Leather Hide',
            type: 'leather',
            rarity: 'common',
            stackSize: 99,
            value: 6
        });
        
        // Misc
        this.materials.set('leather_strip', {
            id: 'leather_strip',
            name: 'Leather Strip',
            type: 'misc',
            rarity: 'common',
            stackSize: 99,
            value: 2
        });
        
        this.materials.set('thread', {
            id: 'thread',
            name: 'Thread',
            type: 'misc',
            rarity: 'common',
            stackSize: 99,
            value: 1
        });
        
        this.materials.set('water_vial', {
            id: 'water_vial',
            name: 'Water Vial',
            type: 'container',
            rarity: 'common',
            stackSize: 20,
            value: 2
        });
        
        this.materials.set('crystal_vial', {
            id: 'crystal_vial',
            name: 'Crystal Vial',
            type: 'container',
            rarity: 'uncommon',
            stackSize: 10,
            value: 20
        });
    }
    
    async loadPlayerCraftingData() {
        try {
            const craftingData = await this.server.db.all('SELECT * FROM player_crafting');
            
            for (const data of craftingData) {
                this.playerCraftingData.set(data.player_id, {
                    playerId: data.player_id,
                    professions: JSON.parse(data.professions || '{}'),
                    knownRecipes: JSON.parse(data.known_recipes || '[]'),
                    craftingQueue: [],
                    totalCrafted: data.total_crafted || 0,
                    experience: JSON.parse(data.experience || '{}'),
                    lastActivity: data.last_activity
                });
            }
            
            console.log(`Loaded crafting data for ${craftingData.length} players`);
            
        } catch (error) {
            console.error('Error loading player crafting data:', error);
        }
    }
    
    setupEventHandlers() {
        // Crafting requests
        this.server.on('craftItem', (playerId, recipeId, quantity) => {
            this.handleCraftRequest(playerId, recipeId, quantity);
        });
        
        this.server.on('learnRecipe', (playerId, recipeId) => {
            this.handleLearnRecipe(playerId, recipeId);
        });
        
        this.server.on('upgradeProfession', (playerId, profession) => {
            this.handleProfessionUpgrade(playerId, profession);
        });
        
        // Gathering events (would integrate with gathering system)
        this.server.on('materialGathered', (playerId, materialId, quantity) => {
            this.handleMaterialGathered(playerId, materialId, quantity);
        });
        
        // Station interactions
        this.server.on('useCraftingStation', (playerId, stationId) => {
            this.handleCraftingStationUse(playerId, stationId);
        });
    }
    
    initializeCraftingStations() {
        // Create crafting stations in the world
        const stations = [
            { id: 'forge_1', type: 'forge', x: 100, y: 100, name: 'Town Forge' },
            { id: 'anvil_1', type: 'anvil', x: 105, y: 100, name: 'Town Anvil' },
            { id: 'alchemy_lab_1', type: 'alchemy_lab', x: 200, y: 100, name: 'Alchemist Lab' },
            { id: 'enchanting_table_1', type: 'enchanting_table', x: 300, y: 100, name: 'Enchanting Table' },
            { id: 'loom_1', type: 'loom', x: 150, y: 200, name: 'Tailor Loom' },
            { id: 'kitchen_1', type: 'kitchen', x: 250, y: 200, name: 'Town Kitchen' }
        ];
        
        for (const station of stations) {
            this.craftingStations.set(station.id, {
                ...station,
                inUse: false,
                currentUser: null
            });
        }
    }
    
    startCraftingProcessor() {
        setInterval(() => {
            this.processCraftingQueue();
        }, 1000); // Process every second
    }
    
    // Profession management
    async learnProfession(playerId, profession) {
        const playerData = this.getPlayerCraftingData(playerId);
        if (!playerData) return { success: false, message: 'Player data not found' };
        
        // Check if profession exists
        if (!this.config.professions[profession]) {
            return { success: false, message: 'Profession not found' };
        }
        
        // Check if already learned
        if (playerData.professions[profession]) {
            return { success: false, message: 'Profession already learned' };
        }
        
        // Check profession limit
        const learnedCount = Object.keys(playerData.professions).length;
        if (learnedCount >= this.config.maxProfessions) {
            return { success: false, message: 'Maximum professions reached' };
        }
        
        // Add profession
        playerData.professions[profession] = {
            level: 1,
            experience: 0,
            totalExperience: 0,
            skillPoints: 0
        };
        
        // Learn basic recipes for this profession
        this.learnBasicRecipes(playerId, profession);
        
        // Save player data
        await this.savePlayerCraftingData(playerId);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('professionLearned', {
                profession: profession,
                professionData: this.config.professions[profession],
                playerProfession: playerData.professions[profession]
            });
        }
        
        console.log(`Player ${playerId} learned profession: ${profession}`);
        
        return { success: true, profession: playerData.professions[profession] };
    }
    
    learnBasicRecipes(playerId, profession) {
        const playerData = this.getPlayerCraftingData(playerId);
        const basicRecipes = [];
        
        // Find basic recipes for this profession
        for (const [recipeId, recipe] of this.recipes) {
            if (recipe.profession === profession && recipe.skillLevel <= 5) {
                if (!playerData.knownRecipes.includes(recipeId)) {
                    playerData.knownRecipes.push(recipeId);
                    basicRecipes.push(recipeId);
                }
            }
        }
        
        return basicRecipes;
    }
    
    async learnRecipe(playerId, recipeId) {
        const playerData = this.getPlayerCraftingData(playerId);
        if (!playerData) return { success: false, message: 'Player data not found' };
        
        const recipe = this.recipes.get(recipeId);
        if (!recipe) {
            return { success: false, message: 'Recipe not found' };
        }
        
        // Check if already known
        if (playerData.knownRecipes.includes(recipeId)) {
            return { success: false, message: 'Recipe already known' };
        }
        
        // Check if player has the profession
        if (!playerData.professions[recipe.profession]) {
            return { success: false, message: 'Profession not learned' };
        }
        
        // Check skill level requirement
        const playerProfession = playerData.professions[recipe.profession];
        if (playerProfession.level < recipe.skillLevel) {
            return { success: false, message: 'Skill level too low' };
        }
        
        // Learn recipe
        playerData.knownRecipes.push(recipeId);
        
        // Save player data
        await this.savePlayerCraftingData(playerId);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('recipeLearned', {
                recipeId: recipeId,
                recipe: recipe
            });
        }
        
        console.log(`Player ${playerId} learned recipe: ${recipe.name}`);
        
        return { success: true, recipe: recipe };
    }
    
    // Crafting system
    async craftItem(playerId, recipeId, quantity = 1) {
        const playerData = this.getPlayerCraftingData(playerId);
        if (!playerData) return { success: false, message: 'Player data not found' };
        
        const recipe = this.recipes.get(recipeId);
        if (!recipe) {
            return { success: false, message: 'Recipe not found' };
        }
        
        // Check if recipe is known
        if (!playerData.knownRecipes.includes(recipeId)) {
            return { success: false, message: 'Recipe not learned' };
        }
        
        // Check profession and skill level
        const playerProfession = playerData.professions[recipe.profession];
        if (!playerProfession || playerProfession.level < recipe.skillLevel) {
            return { success: false, message: 'Skill level too low' };
        }
        
        // Check crafting queue limit
        if (playerData.craftingQueue.length >= this.config.maxCraftingQueue) {
            return { success: false, message: 'Crafting queue full' };
        }
        
        // Check materials for all items
        const totalMaterials = this.calculateTotalMaterials(recipe, quantity);
        const hasMaterials = await this.checkPlayerMaterials(playerId, totalMaterials);
        
        if (!hasMaterials) {
            return { success: false, message: 'Insufficient materials' };
        }
        
        // Remove materials from inventory
        await this.removePlayerMaterials(playerId, totalMaterials);
        
        // Add to crafting queue
        const craftingJob = {
            id: this.generateCraftingJobId(),
            playerId: playerId,
            recipeId: recipeId,
            recipe: recipe,
            quantity: quantity,
            remainingQuantity: quantity,
            startTime: Date.now(),
            completionTime: Date.now() + (recipe.craftingTime * quantity * this.config.craftingTimeMultiplier),
            status: 'queued'
        };
        
        playerData.craftingQueue.push(craftingJob);
        this.activeCrafting.set(craftingJob.id, craftingJob);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('craftingStarted', {
                jobId: craftingJob.id,
                recipe: recipe,
                quantity: quantity,
                completionTime: craftingJob.completionTime
            });
        }
        
        console.log(`Player ${playerId} started crafting: ${recipe.name} x${quantity}`);
        
        return { success: true, job: craftingJob };
    }
    
    calculateTotalMaterials(recipe, quantity) {
        const totalMaterials = [];
        
        for (const material of recipe.materials) {
            totalMaterials.push({
                id: material.id,
                quantity: material.quantity * quantity
            });
        }
        
        return totalMaterials;
    }
    
    async checkPlayerMaterials(playerId, materials) {
        try {
            for (const material of materials) {
                const result = await this.server.db.get(`
                    SELECT SUM(stack_count) as total FROM player_inventory 
                    WHERE player_id = ? AND template_id = ?
                `, [playerId, material.id]);
                
                if (!result || result.total < material.quantity) {
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Error checking player materials:', error);
            return false;
        }
    }
    
    async removePlayerMaterials(playerId, materials) {
        try {
            for (const material of materials) {
                let remainingQuantity = material.quantity;
                
                // Find and remove from inventory stacks
                const stacks = await this.server.db.all(`
                    SELECT * FROM player_inventory 
                    WHERE player_id = ? AND template_id = ? AND stack_count > 0
                    ORDER BY id
                `, [playerId, material.id]);
                
                for (const stack of stacks) {
                    if (remainingQuantity <= 0) break;
                    
                    const removeQuantity = Math.min(stack.stack_count, remainingQuantity);
                    
                    if (removeQuantity === stack.stack_count) {
                        // Remove entire stack
                        await this.server.db.run(`
                            DELETE FROM player_inventory WHERE id = ?
                        `, [stack.id]);
                    } else {
                        // Update stack count
                        await this.server.db.run(`
                            UPDATE player_inventory SET stack_count = stack_count - ? WHERE id = ?
                        `, [removeQuantity, stack.id]);
                    }
                    
                    remainingQuantity -= removeQuantity;
                }
            }
        } catch (error) {
            console.error('Error removing player materials:', error);
        }
    }
    
    processCraftingQueue() {
        const now = Date.now();
        const completedJobs = [];
        
        for (const [jobId, job] of this.activeCrafting) {
            if (job.status === 'queued' && now >= job.startTime) {
                job.status = 'crafting';
            }
            
            if (job.status === 'crafting' && now >= job.completionTime) {
                // Complete one item
                const result = this.completeCraftingJob(job);
                
                if (result.success) {
                    job.remainingQuantity--;
                    
                    if (job.remainingQuantity <= 0) {
                        job.status = 'completed';
                        completedJobs.push(jobId);
                    } else {
                        // Schedule next item
                        job.completionTime = now + (job.recipe.craftingTime * this.config.craftingTimeMultiplier);
                    }
                }
            }
        }
        
        // Clean up completed jobs
        for (const jobId of completedJobs) {
            const job = this.activeCrafting.get(jobId);
            if (job) {
                // Remove from player queue
                const playerData = this.getPlayerCraftingData(job.playerId);
                if (playerData) {
                    const queueIndex = playerData.craftingQueue.findIndex(j => j.id === jobId);
                    if (queueIndex !== -1) {
                        playerData.craftingQueue.splice(queueIndex, 1);
                    }
                }
                
                this.activeCrafting.delete(jobId);
            }
        }
    }
    
    completeCraftingJob(job) {
        const playerData = this.getPlayerCraftingData(job.playerId);
        if (!playerData) return { success: false };
        
        const recipe = job.recipe;
        
        // Calculate success chance
        const successChance = this.calculateSuccessChance(playerData, recipe);
        const isSuccess = Math.random() < successChance;
        
        if (!isSuccess) {
            // Crafting failed
            this.handleCraftingFailure(job);
            return { success: false, reason: 'failure' };
        }
        
        // Check for critical success
        const isCritical = Math.random() < this.config.criticalSuccessChance;
        
        // Create results
        const results = [];
        for (const result of recipe.results) {
            const finalResult = { ...result };
            
            if (isCritical && recipe.criticalBonus) {
                // Apply critical bonus
                if (recipe.criticalBonus.result.quality) {
                    finalResult.quality = recipe.criticalBonus.result.quality;
                }
                if (recipe.criticalBonus.result.quantity) {
                    finalResult.quantity = recipe.criticalBonus.result.quantity;
                }
            }
            
            results.push(finalResult);
        }
        
        // Add items to player inventory
        this.addItemsToPlayerInventory(job.playerId, results);
        
        // Award experience
        this.awardCraftingExperience(job.playerId, recipe.profession, recipe.experience);
        
        // Update stats
        playerData.totalCrafted++;
        
        // Notify player
        const socket = this.server.getPlayerSocket(job.playerId);
        if (socket) {
            socket.emit('craftingCompleted', {
                jobId: job.id,
                results: results,
                isCritical: isCritical,
                remainingQuantity: job.remainingQuantity
            });
        }
        
        return { success: true, results: results, isCritical: isCritical };
    }
    
    handleCraftingFailure(job) {
        const playerData = this.getPlayerCraftingData(job.playerId);
        if (!playerData) return;
        
        const recipe = job.recipe;
        
        // Apply failure penalty
        if (recipe.failurePenalty) {
            if (recipe.failurePenalty.materialLoss) {
                // Some materials are lost on failure (already removed)
                console.log(`Player ${job.playerId} lost materials due to crafting failure`);
            }
            
            if (recipe.failurePenalty.itemDamage) {
                // Chance to damage tools or equipment
                console.log(`Player ${job.playerId} equipment damaged due to crafting failure`);
            }
        }
        
        // Notify player
        const socket = this.server.getPlayerSocket(job.playerId);
        if (socket) {
            socket.emit('craftingFailed', {
                jobId: job.id,
                reason: 'failure'
            });
        }
    }
    
    calculateSuccessChance(playerData, recipe) {
        const playerProfession = playerData.professions[recipe.profession];
        if (!playerProfession) return 0.5; // Base 50% if no profession
        
        // Base success chance by difficulty
        let baseChance = 0.8; // 80% base
        switch (recipe.difficulty) {
            case 'easy': baseChance = 0.9; break;
            case 'medium': baseChance = 0.8; break;
            case 'hard': baseChance = 0.7; break;
            case 'expert': baseChance = 0.6; break;
        }
        
        // Skill level bonus
        const levelDiff = playerProfession.level - recipe.skillLevel;
        const levelBonus = Math.min(levelDiff * 0.02, 0.2); // Max 20% bonus
        
        // Critical failure chance
        const failureChance = this.config.criticalFailureChance;
        
        return Math.min(baseChance + levelBonus, 0.95) - failureChance;
    }
    
    awardCraftingExperience(playerId, profession, experience) {
        const playerData = this.getPlayerCraftingData(playerId);
        if (!playerData) return;
        
        const playerProfession = playerData.professions[profession];
        if (!playerProfession) return;
        
        const expGain = Math.floor(experience * this.config.experienceGainMultiplier);
        playerProfession.experience += expGain;
        playerProfession.totalExperience += expGain;
        
        // Check for level up
        const expNeeded = this.getExperienceNeededForLevel(playerProfession.level + 1);
        if (playerProfession.experience >= expNeeded) {
            playerProfession.level++;
            playerProfession.experience -= expNeeded;
            playerProfession.skillPoints++;
            
            // Notify player of level up
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('professionLevelUp', {
                    profession: profession,
                    newLevel: playerProfession.level,
                    skillPoints: playerProfession.skillPoints
                });
            }
        }
        
        // Save player data
        this.savePlayerCraftingData(playerId);
    }
    
    getExperienceNeededForLevel(level) {
        return level * 100 + Math.pow(level, 2) * 10;
    }
    
    addItemsToPlayerInventory(playerId, items) {
        // This would integrate with the inventory system
        for (const item of items) {
            console.log(`Added item ${item.id} x${item.quantity} to player ${playerId}`);
        }
    }
    
    // Event handlers
    handleCraftRequest(playerId, recipeId, quantity) {
        this.craftItem(playerId, recipeId, quantity);
    }
    
    handleLearnRecipe(playerId, recipeId) {
        this.learnRecipe(playerId, recipeId);
    }
    
    handleProfessionUpgrade(playerId, profession) {
        // Handle skill point spending
        console.log(`Player ${playerId} upgrading profession: ${profession}`);
    }
    
    handleMaterialGathered(playerId, materialId, quantity) {
        // Handle material gathering from other systems
        console.log(`Player ${playerId} gathered ${quantity}x ${materialId}`);
    }
    
    handleCraftingStationUse(playerId, stationId) {
        const station = this.craftingStations.get(stationId);
        if (!station) return;
        
        // Check if station is available
        if (station.inUse) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('stationInUse', {
                    stationId: stationId,
                    currentUser: station.currentUser
                });
            }
            return;
        }
        
        // Reserve station
        station.inUse = true;
        station.currentUser = playerId;
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('stationReserved', {
                station: station
            });
        }
        
        // Auto-release after 5 minutes
        setTimeout(() => {
            if (station.currentUser === playerId) {
                station.inUse = false;
                station.currentUser = null;
            }
        }, 300000);
    }
    
    // Utility methods
    getPlayerCraftingData(playerId) {
        if (!this.playerCraftingData.has(playerId)) {
            this.playerCraftingData.set(playerId, {
                playerId: playerId,
                professions: {},
                knownRecipes: [],
                craftingQueue: [],
                totalCrafted: 0,
                experience: {},
                lastActivity: Date.now()
            });
        }
        
        return this.playerCraftingData.get(playerId);
    }
    
    async savePlayerCraftingData(playerId) {
        const playerData = this.playerCraftingData.get(playerId);
        if (!playerData) return;
        
        try {
            await this.server.db.run(`
                INSERT OR REPLACE INTO player_crafting 
                (player_id, professions, known_recipes, total_crafted, experience, last_activity)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                playerId,
                JSON.stringify(playerData.professions),
                JSON.stringify(playerData.knownRecipes),
                playerData.totalCrafted,
                JSON.stringify(playerData.experience),
                Date.now()
            ]);
        } catch (error) {
            console.error('Error saving player crafting data:', error);
        }
    }
    
    // ID generators
    generateCraftingJobId() {
        return 'craft_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Public API
    getRecipe(recipeId) {
        return this.recipes.get(recipeId);
    }
    
    getRecipesByProfession(profession) {
        const recipes = [];
        for (const [recipeId, recipe] of this.recipes) {
            if (recipe.profession === profession) {
                recipes.push(recipe);
            }
        }
        return recipes;
    }
    
    getPlayerRecipes(playerId) {
        const playerData = this.getPlayerCraftingData(playerId);
        const recipes = [];
        
        for (const recipeId of playerData.knownRecipes) {
            const recipe = this.recipes.get(recipeId);
            if (recipe) {
                recipes.push(recipe);
            }
        }
        
        return recipes;
    }
    
    getCraftingStation(stationId) {
        return this.craftingStations.get(stationId);
    }
    
    getCraftingStations(type = null) {
        const stations = [];
        for (const station of this.craftingStations.values()) {
            if (!type || station.type === type) {
                stations.push(station);
            }
        }
        return stations;
    }
    
    getPlayerCraftingStats(playerId) {
        const playerData = this.getPlayerCraftingData(playerId);
        
        return {
            professions: playerData.professions,
            knownRecipes: playerData.knownRecipes.length,
            totalCrafted: playerData.totalCrafted,
            craftingQueue: playerData.craftingQueue.length,
            experience: playerData.experience
        };
    }
    
    getCraftingLeaderboard(type = 'total_crafted', limit = 10) {
        const leaderboard = [];
        
        for (const [playerId, playerData] of this.playerCraftingData) {
            let score = 0;
            
            switch (type) {
                case 'total_crafted':
                    score = playerData.totalCrafted;
                    break;
                case 'recipes_learned':
                    score = playerData.knownRecipes.length;
                    break;
                case 'professions_mastered':
                    score = Object.values(playerData.professions).filter(p => p.level >= 50).length;
                    break;
            }
            
            leaderboard.push({
                playerId: playerId,
                score: score
            });
        }
        
        // Sort by score (descending)
        leaderboard.sort((a, b) => b.score - a.score);
        
        return leaderboard.slice(0, limit);
    }
    
    // Cleanup
    async cleanup() {
        // Save all player crafting data
        for (const [playerId, playerData] of this.playerCraftingData) {
            await this.savePlayerCraftingData(playerId);
        }
        
        // Clear active crafting
        this.activeCrafting.clear();
        
        console.log('Crafting System cleanup complete');
    }
}

module.exports = CraftingSystem;
