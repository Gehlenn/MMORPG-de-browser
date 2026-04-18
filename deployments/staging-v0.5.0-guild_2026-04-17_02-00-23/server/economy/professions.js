/**
 * Professions System - Resource Gathering and Processing
 * Handles mining, herbalism, fishing, crafting, and other professions
 * Version 0.3 - Complete Architecture Integration
 */

class ProfessionsSystem {
    constructor(worldManager, database) {
        this.worldManager = worldManager;
        this.database = database;
        
        // Profession configuration
        this.config = {
            maxSkillLevel: 300,
            skillPointsPerLevel: 1,
            gatheringRange: 30,
            processingTime: 3000, // 3 seconds
            criticalSuccessChance: 0.05, // 5% base crit chance
            rareFindChance: 0.02, // 2% base rare find chance
            
            // Experience rates
            gatheringXPRate: 10,
            processingXPRate: 15,
            craftingXPRate: 20,
            
            // Tool durability
            toolDurabilityLoss: 1, // Per use
            toolRepairCost: 0.1, // 10% of tool cost
            
            // Profession tiers
            tiers: {
                apprentice: { minLevel: 1, maxLevel: 75, color: '#9b59b6' },
                journeyman: { minLevel: 50, maxLevel: 150, color: '#3498db' },
                expert: { minLevel: 125, maxLevel: 225, color: '#2ecc71' },
                artisan: { minLevel: 200, maxLevel: 275, color: '#f39c12' },
                master: { minLevel: 275, maxLevel: 300, color: '#e74c3c' }
            }
        };
        
        // Profession definitions
        this.professions = new Map();
        this.initializeProfessions();
        
        // Player profession data
        this.playerProfessions = new Map();
        
        // Active gathering sessions
        this.activeSessions = new Map();
        
        // Tool definitions
        this.tools = new Map();
        this.initializeTools();
        
        // Recipe definitions
        this.recipes = new Map();
        this.initializeRecipes();
        
        // Resource nodes
        this.resourceNodes = new Map();
        
        // Statistics
        this.professionStats = {
            totalGatheringActions: 0,
            totalCraftingActions: 0,
            totalRareFinds: 0,
            totalCriticalSuccesses: 0,
            mostGatheredResource: null,
            mostCraftedItem: null,
            topMiner: null,
            topHerbalist: null,
            topBlacksmith: null
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Load profession data
        this.loadProfessionData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start update loop
        this.startUpdateLoop();
        
        console.log('Professions System initialized');
    }
    
    initializeProfessions() {
        // Mining
        this.professions.set('mining', {
            id: 'mining',
            name: 'Mineração',
            description: 'Extrair minérios e gemas da terra',
            type: 'gathering',
            primaryStat: 'strength',
            secondaryStat: 'perception',
            tools: ['pickaxe'],
            resources: ['copper_ore', 'tin_ore', 'iron_ore', 'coal', 'silver_ore', 'gold_ore', 'mithril_ore', 'truesilver_ore', 'dark_iron_ore', 'elementium_ore'],
            skillModifiers: {
                criticalChance: 0.001, // +0.1% per level
                rareFindChance: 0.0005, // +0.05% per level
                gatheringSpeed: 0.002, // +0.2% per level
                bonusYield: 0.001 // +0.1% per level
            }
        });
        
        // Herbalism
        this.professions.set('herbalism', {
            id: 'herbalism',
            name: 'Herbalismo',
            description: 'Coletar ervas e plantas medicinais',
            type: 'gathering',
            primaryStat: 'perception',
            secondaryStat: 'dexterity',
            tools: ['herbalism_knife'],
            resources: ['peacebloom', 'silverleaf', 'earthroot', 'mageroyal', 'briarthorn', 'stranglekelp', 'swiftthistle', 'bruiseweed', 'wild_steelbloom', 'grave_moss', 'kingsblood', 'liferoot', 'fadeleaf', 'goldthorn', 'khadgars_whisker', 'wintersbite', 'firebloom', 'purple_lotus', 'arthas_tears', 'sungrass', 'blindweed', 'ghost_mushroom', 'gromsblood', 'golden_sansam', 'dreamfoil', 'mountain_silversage', 'plaguebloom', 'icecap', 'black_lotus'],
            skillModifiers: {
                criticalChance: 0.0012,
                rareFindChance: 0.0008,
                gatheringSpeed: 0.003,
                bonusYield: 0.0015
            }
        });
        
        // Fishing
        this.professions.set('fishing', {
            id: 'fishing',
            name: 'Pesca',
            description: 'Pescar peixes e tesouros aquáticos',
            type: 'gathering',
            primaryStat: 'patience',
            secondaryStat: 'perception',
            tools: ['fishing_rod'],
            resources: ['raw_fish', 'raw_slimy_mackerel', 'raw_bristle_whisker_catfish', 'raw_mightfish', 'raw_rockscale_cod', 'raw_spotted_fynfish', 'raw_freshwater_snapper', 'raw_longjaw_mud_snapper', 'raw_deviate_fish', 'raw_oily_blackmouth', 'raw_firefin_snapper', 'raw_sunscale_salmon', 'raw_bloodfin_catfish', 'raw_mightfish', 'raw_giant_frog', 'raw_shiny_fish', 'raw_rare_fish'],
            skillModifiers: {
                criticalChance: 0.0015,
                rareFindChance: 0.001,
                gatheringSpeed: 0.001,
                bonusYield: 0.0005
            }
        });
        
        // Blacksmithing
        this.professions.set('blacksmithing', {
            id: 'blacksmithing',
            name: 'Ferraria',
            description: 'Forjar armas e armaduras de metal',
            type: 'crafting',
            primaryStat: 'strength',
            secondaryStat: 'intelligence',
            tools: ['blacksmith_hammer'],
            resources: ['copper_bar', 'tin_bar', 'bronze_bar', 'iron_bar', 'steel_bar', 'mithril_bar', 'truesilver_bar', 'thorium_bar'],
            products: ['dagger', 'sword', 'axe', 'hammer', 'armor_light', 'armor_medium', 'armor_heavy', 'shield'],
            skillModifiers: {
                criticalChance: 0.0008,
                rareFindChance: 0.0003,
                craftingSpeed: 0.002,
                qualityBonus: 0.0015
            }
        });
        
        // Alchemy
        this.professions.set('alchemy', {
            id: 'alchemy',
            name: 'Alquimia',
            description: 'Criar poções e elixires mágicos',
            type: 'crafting',
            primaryStat: 'intelligence',
            secondaryStat: 'wisdom',
            tools: ['alchemy_lab'],
            resources: ['herb_bundle', 'vial', 'crystal_dust'],
            products: ['health_potion', 'mana_potion', 'strength_potion', 'intellect_potion', 'elixir_of_power', 'flask_of_endurance'],
            skillModifiers: {
                criticalChance: 0.001,
                rareFindChance: 0.0005,
                craftingSpeed: 0.003,
                qualityBonus: 0.002
            }
        });
        
        // Tailoring
        this.professions.set('tailoring', {
            id: 'tailoring',
            name: 'Alfaiataria',
            description: 'Confeccionar roupas e armaduras de tecido',
            type: 'crafting',
            primaryStat: 'dexterity',
            secondaryStat: 'creativity',
            tools: ['tailoring_kit'],
            resources: ['linen_cloth', 'wool_cloth', 'silk_cloth', 'mageweave_cloth', 'runecloth', 'felcloth'],
            products: ['cloth_armor', 'cloaks', 'bags', 'shirts', 'robes'],
            skillModifiers: {
                criticalChance: 0.0009,
                rareFindChance: 0.0004,
                craftingSpeed: 0.0025,
                qualityBonus: 0.0018
            }
        });
        
        // Cooking
        this.professions.set('cooking', {
            id: 'cooking',
            name: 'Culinária',
            description: 'Preparar comidas que fornecem buffs',
            type: 'crafting',
            primaryStat: 'creativity',
            secondaryStat: 'wisdom',
            tools: ['cooking_utensils'],
            resources: ['raw_meat', 'vegetables', 'spices', 'cooking_oil'],
            products: ['cooked_meat', 'stew', 'bread', 'feast', 'special_dish'],
            skillModifiers: {
                criticalChance: 0.0011,
                rareFindChance: 0.0006,
                craftingSpeed: 0.002,
                qualityBonus: 0.0012
            }
        });
    }
    
    initializeTools() {
        // Mining tools
        this.tools.set('pickaxe', {
            id: 'pickaxe',
            name: 'Picareta',
            type: 'mining',
            durability: 100,
            maxDurability: 100,
            quality: 'common',
            efficiency: 1.0,
            cost: 50,
            requiredLevel: 1
        });
        
        this.tools.set('iron_pickaxe', {
            id: 'iron_pickaxe',
            name: 'Picareta de Ferro',
            type: 'mining',
            durability: 200,
            maxDurability: 200,
            quality: 'uncommon',
            efficiency: 1.2,
            cost: 150,
            requiredLevel: 50
        });
        
        this.tools.set('mithril_pickaxe', {
            id: 'mithril_pickaxe',
            name: 'Picareta de Mithril',
            type: 'mining',
            durability: 300,
            maxDurability: 300,
            quality: 'rare',
            efficiency: 1.5,
            cost: 500,
            requiredLevel: 150
        });
        
        // Herbalism tools
        this.tools.set('herbalism_knife', {
            id: 'herbalism_knife',
            name: 'Faca de Herbalista',
            type: 'herbalism',
            durability: 80,
            maxDurability: 80,
            quality: 'common',
            efficiency: 1.0,
            cost: 30,
            requiredLevel: 1
        });
        
        // Fishing tools
        this.tools.set('fishing_rod', {
            id: 'fishing_rod',
            name: 'Vara de Pescar',
            type: 'fishing',
            durability: 120,
            maxDurability: 120,
            quality: 'common',
            efficiency: 1.0,
            cost: 40,
            requiredLevel: 1
        });
        
        // Crafting tools
        this.tools.set('blacksmith_hammer', {
            id: 'blacksmith_hammer',
            name: 'Martelo de Ferreiro',
            type: 'blacksmithing',
            durability: 150,
            maxDurability: 150,
            quality: 'common',
            efficiency: 1.0,
            cost: 60,
            requiredLevel: 1
        });
        
        this.tools.set('alchemy_lab', {
            id: 'alchemy_lab',
            name: 'Laboratório de Alquimia',
            type: 'alchemy',
            durability: 200,
            maxDurability: 200,
            quality: 'common',
            efficiency: 1.0,
            cost: 200,
            requiredLevel: 1
        });
    }
    
    initializeRecipes() {
        // Mining recipes
        this.recipes.set('smelt_copper', {
            id: 'smelt_copper',
            name: 'Fundir Cobre',
            profession: 'mining',
            type: 'processing',
            requiredLevel: 1,
            materials: [
                { id: 'copper_ore', quantity: 2 }
            ],
            results: [
                { id: 'copper_bar', quantity: 1 }
            ],
            experience: 10,
            processingTime: 3000
        });
        
        this.recipes.set('smelt_iron', {
            id: 'smelt_iron',
            name: 'Fundir Ferro',
            profession: 'mining',
            type: 'processing',
            requiredLevel: 50,
            materials: [
                { id: 'iron_ore', quantity: 2 }
            ],
            results: [
                { id: 'iron_bar', quantity: 1 }
            ],
            experience: 25,
            processingTime: 4000
        });
        
        // Blacksmithing recipes
        this.recipes.set('craft_dagger', {
            id: 'craft_dagger',
            name: 'Forjar Adaga',
            profession: 'blacksmithing',
            type: 'crafting',
            requiredLevel: 1,
            materials: [
                { id: 'copper_bar', quantity: 2 }
            ],
            results: [
                { id: 'copper_dagger', quantity: 1 }
            ],
            experience: 15,
            processingTime: 5000
        });
        
        this.recipes.set('craft_sword', {
            id: 'craft_sword',
            name: 'Forjar Espada',
            profession: 'blacksmithing',
            type: 'crafting',
            requiredLevel: 25,
            materials: [
                { id: 'iron_bar', quantity: 3 }
            ],
            results: [
                { id: 'iron_sword', quantity: 1 }
            ],
            experience: 35,
            processingTime: 8000
        });
        
        // Alchemy recipes
        this.recipes.set('brew_health_potion', {
            id: 'brew_health_potion',
            name: 'Preparar Poção de Cura',
            profession: 'alchemy',
            type: 'crafting',
            requiredLevel: 1,
            materials: [
                { id: 'peacebloom', quantity: 2 },
                { id: 'vial', quantity: 1 }
            ],
            results: [
                { id: 'health_potion', quantity: 1 }
            ],
            experience: 20,
            processingTime: 4000
        });
        
        this.recipes.set('brew_mana_potion', {
            id: 'brew_mana_potion',
            name: 'Preparar Poção de Mana',
            profession: 'alchemy',
            type: 'crafting',
            requiredLevel: 15,
            materials: [
                { id: 'silverleaf', quantity: 2 },
                { id: 'vial', quantity: 1 }
            ],
            results: [
                { id: 'mana_potion', quantity: 1 }
            ],
            experience: 25,
            processingTime: 4000
        });
        
        // Cooking recipes
        this.recipes.set('cook_meat', {
            id: 'cook_meat',
            name: 'Cozinhar Carne',
            profession: 'cooking',
            type: 'crafting',
            requiredLevel: 1,
            materials: [
                { id: 'raw_meat', quantity: 1 }
            ],
            results: [
                { id: 'cooked_meat', quantity: 1 }
            ],
            experience: 10,
            processingTime: 2000
        });
    }
    
    async loadProfessionData() {
        try {
            // Load player profession data
            const playerData = await this.database.get('player_professions');
            if (playerData) {
                for (const [playerId, data] of Object.entries(playerData)) {
                    this.playerProfessions.set(playerId, {
                        professions: new Map(Object.entries(data.professions || {})),
                        unlockedRecipes: new Set(data.unlockedRecipes || []),
                        toolInventory: new Map(Object.entries(data.toolInventory || {})),
                        statistics: data.statistics || {
                            totalGathering: 0,
                            totalCrafting: 0,
                            rareFinds: 0,
                            criticalSuccesses: 0
                        },
                        lastUpdate: data.lastUpdate || Date.now()
                    });
                }
            }
            
            // Load profession statistics
            const stats = await this.database.get('profession_statistics');
            if (stats) {
                this.professionStats = stats;
            }
            
        } catch (error) {
            console.error('Error loading profession data:', error);
        }
    }
    
    setupEventHandlers() {
        // Listen to resource node interactions
        this.worldManager.on('resource_harvested', (playerId, resourceId, amount) => {
            this.onResourceHarvested(playerId, resourceId, amount);
        });
        
        // Listen to player level up
        this.worldManager.on('player_level_up', (playerId, newLevel) => {
            this.onPlayerLevelUp(playerId, newLevel);
        });
    }
    
    startUpdateLoop() {
        setInterval(() => {
            this.updateActiveSessions();
        }, 1000); // Update every second
    }
    
    // Public API - Profession Management
    async learnProfession(playerId, professionId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const profession = this.professions.get(professionId);
        if (!profession) return false;
        
        // Get or create player profession data
        const playerData = this.getPlayerProfessionData(playerId);
        
        // Check if already learned
        if (playerData.professions.has(professionId)) {
            return false;
        }
        
        // Add profession
        playerData.professions.set(professionId, {
            level: 1,
            experience: 0,
            totalExperience: 0,
            skillPoints: 0,
            lastAction: Date.now()
        });
        
        // Save data
        await this.savePlayerProfessionData(playerId);
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'profession_learned',
            profession: profession,
            message: `Você aprendeu a profissão: ${profession.name}!`
        });
        
        console.log(`Player ${player.name} learned profession: ${profession.name}`);
        return true;
    }
    
    getPlayerProfessionData(playerId) {
        if (!this.playerProfessions.has(playerId)) {
            this.playerProfessions.set(playerId, {
                professions: new Map(),
                unlockedRecipes: new Set(),
                toolInventory: new Map(),
                statistics: {
                    totalGathering: 0,
                    totalCrafting: 0,
                    rareFinds: 0,
                    criticalSuccesses: 0
                },
                lastUpdate: Date.now()
            });
        }
        
        return this.playerProfessions.get(playerId);
    }
    
    getProfessionLevel(playerId, professionId) {
        const playerData = this.getPlayerProfessionData(playerId);
        const profession = playerData.professions.get(professionId);
        return profession ? profession.level : 0;
    }
    
    getProfessionExperience(playerId, professionId) {
        const playerData = this.getPlayerProfessionData(playerId);
        const profession = playerData.professions.get(professionId);
        return profession ? profession.experience : 0;
    }
    
    async addProfessionExperience(playerId, professionId, amount) {
        const playerData = this.getPlayerProfessionData(playerId);
        let profession = playerData.professions.get(professionId);
        
        if (!profession) {
            // Auto-learn profession if not exists
            await this.learnProfession(playerId, professionId);
            profession = playerData.professions.get(professionId);
        }
        
        // Add experience
        profession.experience += amount;
        profession.totalExperience += amount;
        
        // Check for level up
        const requiredXP = this.getRequiredExperience(profession.level);
        if (profession.experience >= requiredXP) {
            await this.levelUpProfession(playerId, professionId);
        }
        
        // Save data
        await this.savePlayerProfessionData(playerId);
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'profession_experience_gained',
            professionId: professionId,
            amount: amount,
            currentXP: profession.experience,
            level: profession.level
        });
    }
    
    getRequiredExperience(level) {
        return level * 100 + Math.floor(level * level * 10);
    }
    
    async levelUpProfession(playerId, professionId) {
        const playerData = this.getPlayerProfessionData(playerId);
        const profession = playerData.professions.get(professionId);
        
        if (!profession) return;
        
        const oldLevel = profession.level;
        profession.level++;
        profession.experience = 0;
        profession.skillPoints += this.config.skillPointsPerLevel;
        
        // Unlock new recipes
        this.unlockRecipesForLevel(playerId, professionId, profession.level);
        
        // Notify player
        const professionDef = this.professions.get(professionId);
        this.worldManager.sendToPlayer(playerId, {
            type: 'profession_level_up',
            professionId: professionId,
            oldLevel: oldLevel,
            newLevel: profession.level,
            skillPoints: profession.skillPoints,
            message: `${professionDef.name} alcançou o nível ${profession.level}!`
        });
        
        console.log(`Player ${playerId} leveled up ${professionId} to ${profession.level}`);
    }
    
    unlockRecipesForLevel(playerId, professionId, level) {
        const playerData = this.getPlayerProfessionData(playerId);
        
        // Find recipes that unlock at this level
        for (const [recipeId, recipe] of this.recipes) {
            if (recipe.profession === professionId && recipe.requiredLevel <= level) {
                playerData.unlockedRecipes.add(recipeId);
            }
        }
    }
    
    // Gathering System
    async startGathering(playerId, resourceId, toolId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        // Check if player is already gathering
        if (this.activeSessions.has(playerId)) {
            return false;
        }
        
        // Get resource node
        const resourceNode = this.getResourceNode(resourceId);
        if (!resourceNode) return false;
        
        // Check distance
        const distance = this.calculateDistance(player, resourceNode);
        if (distance > this.config.gatheringRange) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'gathering_failed',
                reason: 'too_far',
                message: 'Você está muito longe do recurso.'
            });
            return false;
        }
        
        // Get profession
        const profession = this.getResourceProfession(resourceNode.type);
        if (!profession) return false;
        
        // Check player level
        const playerLevel = this.getProfessionLevel(playerId, profession.id);
        if (playerLevel < resourceNode.requiredLevel) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'gathering_failed',
                reason: 'level_too_low',
                message: `Você precisa de nível ${resourceNode.requiredLevel} em ${profession.name}.`
            });
            return false;
        }
        
        // Check tool
        const tool = toolId ? this.getPlayerTool(playerId, toolId) : null;
        if (resourceNode.requiresTool && !tool) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'gathering_failed',
                reason: 'no_tool',
                message: 'Você precisa da ferramenta adequada.'
            });
            return false;
        }
        
        // Start gathering session
        const session = {
            playerId: playerId,
            resourceId: resourceId,
            professionId: profession.id,
            toolId: toolId,
            startTime: Date.now(),
            duration: this.calculateGatheringTime(playerId, profession.id, tool),
            progress: 0,
            interrupted: false
        };
        
        this.activeSessions.set(playerId, session);
        
        // Notify start
        this.worldManager.sendToPlayer(playerId, {
            type: 'gathering_started',
            resourceId: resourceId,
            resourceName: resourceNode.name,
            duration: session.duration,
            message: `Começando a coletar ${resourceNode.name}...`
        });
        
        // Auto-complete gathering
        setTimeout(() => {
            this.completeGathering(playerId);
        }, session.duration);
        
        return true;
    }
    
    calculateGatheringTime(playerId, professionId, tool) {
        const playerLevel = this.getProfessionLevel(playerId, professionId);
        const profession = this.professions.get(professionId);
        
        let baseTime = 5000; // 5 seconds base
        
        // Reduce time based on level
        const speedBonus = playerLevel * (profession.skillModifiers.gatheringSpeed || 0.001);
        baseTime *= (1 - speedBonus);
        
        // Reduce time based on tool
        if (tool) {
            const toolDef = this.tools.get(tool.type);
            if (toolDef) {
                baseTime /= toolDef.efficiency;
            }
        }
        
        return Math.max(1000, baseTime); // Minimum 1 second
    }
    
    async completeGathering(playerId) {
        const session = this.activeSessions.get(playerId);
        if (!session || session.interrupted) {
            this.activeSessions.delete(playerId);
            return;
        }
        
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) {
            this.activeSessions.delete(playerId);
            return;
        }
        
        const resourceNode = this.getResourceNode(session.resourceId);
        if (!resourceNode) {
            this.activeSessions.delete(playerId);
            return;
        }
        
        // Calculate results
        const results = this.calculateGatheringResults(playerId, session);
        
        // Apply results
        for (const result of results.items) {
            player.addToInventory({
                id: result.id,
                quantity: result.quantity,
                quality: result.quality
            });
        }
        
        // Add experience
        await this.addProfessionExperience(playerId, session.professionId, results.experience);
        
        // Update tool durability
        if (session.toolId) {
            this.reduceToolDurability(playerId, session.toolId);
        }
        
        // Update resource node
        this.updateResourceNode(session.resourceId, results.quantity);
        
        // Update statistics
        this.updateGatheringStatistics(playerId, session.professionId, results);
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'gathering_completed',
            resourceId: session.resourceId,
            results: results,
            message: `Coleta completa! Você obteve: ${this.formatResults(results.items)}`
        });
        
        // Clean up session
        this.activeSessions.delete(playerId);
    }
    
    calculateGatheringResults(playerId, session) {
        const playerLevel = this.getProfessionLevel(playerId, session.professionId);
        const profession = this.professions.get(session.professionId);
        const resourceNode = this.getResourceNode(session.resourceId);
        
        // Base quantity
        let quantity = resourceNode.baseYield || 1;
        
        // Bonus yield based on level
        const yieldBonus = playerLevel * (profession.skillModifiers.bonusYield || 0.001);
        quantity *= (1 + yieldBonus);
        
        // Tool efficiency bonus
        if (session.toolId) {
            const tool = this.getPlayerTool(playerId, session.toolId);
            if (tool) {
                const toolDef = this.tools.get(tool.type);
                if (toolDef) {
                    quantity *= toolDef.efficiency;
                }
            }
        }
        
        quantity = Math.floor(quantity);
        
        // Check for critical success
        const critChance = this.config.criticalSuccessChance + 
                          (playerLevel * (profession.skillModifiers.criticalChance || 0.001));
        const isCritical = Math.random() < critChance;
        
        if (isCritical) {
            quantity *= 2;
        }
        
        // Check for rare find
        const rareChance = this.config.rareFindChance + 
                          (playerLevel * (profession.skillModifiers.rareFindChance || 0.0005));
        const hasRareFind = Math.random() < rareChance;
        
        const items = [{
            id: resourceNode.type,
            quantity: quantity,
            quality: isCritical ? 'rare' : 'common'
        }];
        
        // Add rare find
        if (hasRareFind) {
            const rareItem = this.generateRareFind(resourceNode.type);
            if (rareItem) {
                items.push(rareItem);
            }
        }
        
        // Calculate experience
        const baseXP = this.config.gatheringXPRate;
        const experience = Math.floor(baseXP * (1 + playerLevel * 0.01) * (isCritical ? 1.5 : 1.0));
        
        return {
            items: items,
            experience: experience,
            critical: isCritical,
            rareFind: hasRareFind
        };
    }
    
    generateRareFind(resourceType) {
        const rareFinds = {
            'copper_ore': { id: 'tin_ore', quantity: 1, quality: 'uncommon' },
            'iron_ore': { id: 'gold_ore', quantity: 1, quality: 'rare' },
            'peacebloom': { id: 'silverleaf', quantity: 2, quality: 'uncommon' },
            'raw_fish': { id: 'raw_rare_fish', quantity: 1, quality: 'rare' }
        };
        
        return rareFinds[resourceType] || null;
    }
    
    // Crafting System
    async startCrafting(playerId, recipeId, quantity = 1) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;
        
        // Check if recipe is unlocked
        const playerData = this.getPlayerProfessionData(playerId);
        if (!playerData.unlockedRecipes.has(recipeId)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'crafting_failed',
                reason: 'recipe_not_unlocked',
                message: 'Você não desbloqueou esta receita.'
            });
            return false;
        }
        
        // Check profession level
        const playerLevel = this.getProfessionLevel(playerId, recipe.profession);
        if (playerLevel < recipe.requiredLevel) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'crafting_failed',
                reason: 'level_too_low',
                message: `Você precisa de nível ${recipe.requiredLevel} para criar isto.`
            });
            return false;
        }
        
        // Check materials
        for (const material of recipe.materials) {
            const hasMaterial = player.hasItem(material.id, material.quantity * quantity);
            if (!hasMaterial) {
                this.worldManager.sendToPlayer(playerId, {
                    type: 'crafting_failed',
                    reason: 'insufficient_materials',
                    message: `Material insuficiente: ${material.id} x${material.quantity * quantity}`
                });
                return false;
            }
        }
        
        // Check if already crafting
        if (this.activeSessions.has(playerId)) {
            return false;
        }
        
        // Start crafting session
        const session = {
            playerId: playerId,
            recipeId: recipeId,
            quantity: quantity,
            professionId: recipe.profession,
            startTime: Date.now(),
            duration: recipe.processingTime * quantity,
            progress: 0,
            interrupted: false
        };
        
        this.activeSessions.set(playerId, session);
        
        // Notify start
        this.worldManager.sendToPlayer(playerId, {
            type: 'crafting_started',
            recipeId: recipeId,
            recipeName: recipe.name,
            quantity: quantity,
            duration: session.duration,
            message: `Começando a criar: ${recipe.name} x${quantity}...`
        });
        
        // Auto-complete crafting
        setTimeout(() => {
            this.completeCrafting(playerId);
        }, session.duration);
        
        return true;
    }
    
    async completeCrafting(playerId) {
        const session = this.activeSessions.get(playerId);
        if (!session || session.interrupted) {
            this.activeSessions.delete(playerId);
            return;
        }
        
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) {
            this.activeSessions.delete(playerId);
            return;
        }
        
        const recipe = this.recipes.get(session.recipeId);
        if (!recipe) {
            this.activeSessions.delete(playerId);
            return;
        }
        
        // Calculate results
        const results = this.calculateCraftingResults(playerId, session);
        
        // Remove materials
        for (const material of recipe.materials) {
            player.removeFromInventory(material.id, material.quantity * session.quantity);
        }
        
        // Add results
        for (const result of results.items) {
            player.addToInventory({
                id: result.id,
                quantity: result.quantity,
                quality: result.quality
            });
        }
        
        // Add experience
        await this.addProfessionExperience(playerId, session.professionId, results.experience);
        
        // Update statistics
        this.updateCraftingStatistics(playerId, session.professionId, results);
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'crafting_completed',
            recipeId: session.recipeId,
            results: results,
            message: `Criação completa! Você obteve: ${this.formatResults(results.items)}`
        });
        
        // Clean up session
        this.activeSessions.delete(playerId);
    }
    
    calculateCraftingResults(playerId, session) {
        const playerLevel = this.getProfessionLevel(playerId, session.professionId);
        const profession = this.professions.get(session.professionId);
        const recipe = this.recipes.get(session.recipeId);
        
        // Base results
        const items = [];
        for (const result of recipe.results) {
            items.push({
                id: result.id,
                quantity: result.quantity * session.quantity,
                quality: 'common'
            });
        }
        
        // Check for critical success
        const critChance = this.config.criticalSuccessChance + 
                          (playerLevel * (profession.skillModifiers.criticalChance || 0.001));
        const isCritical = Math.random() < critChance;
        
        if (isCritical) {
            // Double results or improve quality
            for (const item of items) {
                if (Math.random() < 0.5) {
                    item.quantity *= 2;
                } else {
                    item.quality = 'rare';
                }
            }
        }
        
        // Check for bonus item
        const bonusChance = (playerLevel * (profession.skillModifiers.rareFindChance || 0.0005));
        const hasBonus = Math.random() < bonusChance;
        
        if (hasBonus) {
            const bonusItem = this.generateCraftingBonus(recipe);
            if (bonusItem) {
                items.push(bonusItem);
            }
        }
        
        // Calculate experience
        const baseXP = this.config.craftingXPRate * session.quantity;
        const experience = Math.floor(baseXP * (1 + playerLevel * 0.01) * (isCritical ? 1.5 : 1.0));
        
        return {
            items: items,
            experience: experience,
            critical: isCritical,
            bonus: hasBonus
        };
    }
    
    generateCraftingBonus(recipe) {
        // Generate bonus items based on recipe type
        if (recipe.profession === 'blacksmithing') {
            return { id: 'whetstone', quantity: 1, quality: 'uncommon' };
        } else if (recipe.profession === 'alchemy') {
            return { id: 'extra_vial', quantity: 2, quality: 'common' };
        }
        
        return null;
    }
    
    // Tool Management
    getPlayerTool(playerId, toolId) {
        const playerData = this.getPlayerProfessionData(playerId);
        return playerData.toolInventory.get(toolId);
    }
    
    async addToolToInventory(playerId, tool) {
        const playerData = this.getPlayerProfessionData(playerId);
        const toolId = `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const toolData = {
            id: toolId,
            type: tool.id,
            name: tool.name,
            durability: tool.maxDurability,
            maxDurability: tool.maxDurability,
            quality: tool.quality,
            efficiency: tool.efficiency,
            acquiredAt: Date.now()
        };
        
        playerData.toolInventory.set(toolId, toolData);
        await this.savePlayerProfessionData(playerId);
        
        return toolId;
    }
    
    reduceToolDurability(playerId, toolId, amount = 1) {
        const playerData = this.getPlayerProfessionData(playerId);
        const tool = playerData.toolInventory.get(toolId);
        
        if (!tool) return false;
        
        tool.durability -= amount;
        
        if (tool.durability <= 0) {
            // Tool broke
            playerData.toolInventory.delete(toolId);
            this.worldManager.sendToPlayer(playerId, {
                type: 'tool_broke',
                toolId: toolId,
                toolName: tool.name,
                message: `${tool.name} quebrou!`
            });
            return false;
        }
        
        // Notify durability change
        this.worldManager.sendToPlayer(playerId, {
            type: 'tool_durability_changed',
            toolId: toolId,
            currentDurability: tool.durability,
            maxDurability: tool.maxDurability
        });
        
        return true;
    }
    
    async repairTool(playerId, toolId) {
        const playerData = this.getPlayerProfessionData(playerId);
        const tool = playerData.toolInventory.get(toolId);
        
        if (!tool) return false;
        
        const toolDef = this.tools.get(tool.type);
        if (!toolDef) return false;
        
        const repairCost = Math.floor(toolDef.cost * this.config.toolRepairCost);
        
        // Check if player has enough gold
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player || player.gold < repairCost) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'repair_failed',
                reason: 'insufficient_gold',
                message: `Você precisa de ${repairCost} gold para reparar.`
            });
            return false;
        }
        
        // Repair tool
        player.gold -= repairCost;
        tool.durability = tool.maxDurability;
        
        await this.savePlayerProfessionData(playerId);
        
        this.worldManager.sendToPlayer(playerId, {
            type: 'tool_repaired',
            toolId: toolId,
            repairCost: repairCost,
            message: `${tool.name} foi reparado!`
        });
        
        return true;
    }
    
    // Update loops and utilities
    updateActiveSessions() {
        const now = Date.now();
        
        for (const [playerId, session] of this.activeSessions) {
            const progress = Math.min(100, ((now - session.startTime) / session.duration) * 100);
            
            if (progress !== session.progress) {
                session.progress = progress;
                
                // Send progress update
                this.worldManager.sendToPlayer(playerId, {
                    type: 'session_progress',
                    progress: progress
                });
            }
        }
    }
    
    updateGatheringStatistics(playerId, professionId, results) {
        const playerData = this.getPlayerProfessionData(playerId);
        
        playerData.statistics.totalGathering++;
        if (results.critical) {
            playerData.statistics.criticalSuccesses++;
            this.professionStats.totalCriticalSuccesses++;
        }
        if (results.rareFind) {
            playerData.statistics.rareFinds++;
            this.professionStats.totalRareFinds++;
        }
        
        this.professionStats.totalGatheringActions++;
        
        // Update top gatherers
        this.updateTopGatherers(playerId, professionId);
    }
    
    updateCraftingStatistics(playerId, professionId, results) {
        const playerData = this.getPlayerProfessionData(playerId);
        
        playerData.statistics.totalCrafting++;
        if (results.critical) {
            playerData.statistics.criticalSuccesses++;
            this.professionStats.totalCriticalSuccesses++;
        }
        if (results.bonus) {
            playerData.statistics.rareFinds++;
            this.professionStats.totalRareFinds++;
        }
        
        this.professionStats.totalCraftingActions++;
        
        // Update top crafters
        this.updateTopCrafters(playerId, professionId);
    }
    
    updateTopGatherers(playerId, professionId) {
        const playerLevel = this.getProfessionLevel(playerId, professionId);
        
        switch (professionId) {
            case 'mining':
                if (!this.professionStats.topMiner || playerLevel > this.professionStats.topMiner.level) {
                    this.professionStats.topMiner = {
                        playerId: playerId,
                        level: playerLevel
                    };
                }
                break;
            case 'herbalism':
                if (!this.professionStats.topHerbalist || playerLevel > this.professionStats.topHerbalist.level) {
                    this.professionStats.topHerbalist = {
                        playerId: playerId,
                        level: playerLevel
                    };
                }
                break;
        }
    }
    
    updateTopCrafters(playerId, professionId) {
        const playerLevel = this.getProfessionLevel(playerId, professionId);
        
        switch (professionId) {
            case 'blacksmithing':
                if (!this.professionStats.topBlacksmith || playerLevel > this.professionStats.topBlacksmith.level) {
                    this.professionStats.topBlacksmith = {
                        playerId: playerId,
                        level: playerLevel
                    };
                }
                break;
        }
    }
    
    // Utility methods
    getResourceNode(resourceId) {
        // This would get the actual resource node from the world
        // For now, return a mock node
        return {
            id: resourceId,
            type: 'copper_ore',
            name: 'Minério de Cobre',
            requiredLevel: 1,
            baseYield: 2,
            requiresTool: true,
            x: 0,
            y: 0
        };
    }
    
    getResourceProfession(resourceType) {
        for (const profession of this.professions.values()) {
            if (profession.resources && profession.resources.includes(resourceType)) {
                return profession;
            }
        }
        return null;
    }
    
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    formatResults(items) {
        return items.map(item => `${item.quantity}x ${item.id}`).join(', ');
    }
    
    updateResourceNode(resourceId, amountHarvested) {
        // Update resource node state (reduce remaining resources, respawn timer, etc.)
        // This would integrate with the world manager
    }
    
    // Event handlers
    onResourceHarvested(playerId, resourceId, amount) {
        // Handle resource harvested events
    }
    
    onPlayerLevelUp(playerId, newLevel) {
        // Award new recipes and abilities based on new level
        const playerData = this.getPlayerProfessionData(playerId);
        
        for (const [professionId, profession] of playerData.professions) {
            this.unlockRecipesForLevel(playerId, professionId, profession.level);
        }
        
        this.savePlayerProfessionData(playerId);
    }
    
    // Database operations
    async savePlayerProfessionData(playerId) {
        try {
            const playerData = this.playerProfessions.get(playerId);
            if (!playerData) return;
            
            const data = {
                professions: Object.fromEntries(playerData.professions),
                unlockedRecipes: Array.from(playerData.unlockedRecipes),
                toolInventory: Object.fromEntries(playerData.toolInventory),
                statistics: playerData.statistics,
                lastUpdate: Date.now()
            };
            
            await this.database.set(`player_professions_${playerId}`, data);
            
            // Also save to global collection
            const globalData = await this.database.get('player_professions') || {};
            globalData[playerId] = data;
            await this.database.set('player_professions', globalData);
            
        } catch (error) {
            console.error(`Error saving profession data for player ${playerId}:`, error);
        }
    }
    
    async saveProfessionStatistics() {
        try {
            await this.database.set('profession_statistics', this.professionStats);
        } catch (error) {
            console.error('Error saving profession statistics:', error);
        }
    }
    
    // Public API
    getProfessionInfo(professionId) {
        return this.professions.get(professionId);
    }
    
    getAllProfessions() {
        return Array.from(this.professions.values());
    }
    
    getRecipeInfo(recipeId) {
        return this.recipes.get(recipeId);
    }
    
    getAvailableRecipes(playerId, professionId) {
        const playerData = this.getPlayerProfessionData(playerId);
        const available = [];
        
        for (const [recipeId, recipe] of this.recipes) {
            if (recipe.profession === professionId && 
                playerData.unlockedRecipes.has(recipeId)) {
                available.push(recipe);
            }
        }
        
        return available;
    }
    
    getPlayerProfessions(playerId) {
        const playerData = this.getPlayerProfessionData(playerId);
        return Array.from(playerData.professions.entries()).map(([id, data]) => ({
            id: id,
            ...data,
            profession: this.professions.get(id)
        }));
    }
    
    getProfessionStatistics() {
        return this.professionStats;
    }
    
    interruptSession(playerId) {
        const session = this.activeSessions.get(playerId);
        if (session) {
            session.interrupted = true;
            this.activeSessions.delete(playerId);
            
            this.worldManager.sendToPlayer(playerId, {
                type: 'session_interrupted',
                message: 'Ação interrompida.'
            });
            
            return true;
        }
        return false;
    }
    
    // Cleanup
    cleanup() {
        this.activeSessions.clear();
        this.playerProfessions.clear();
        this.professions.clear();
        this.tools.clear();
        this.recipes.clear();
        this.resourceNodes.clear();
    }
}

export default ProfessionsSystem;
