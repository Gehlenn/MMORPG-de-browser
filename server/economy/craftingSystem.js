/**
 * Crafting System - Advanced Item Creation and Modification
 * Handles complex crafting recipes, item quality, enchanting, and customization
 * Version 0.3 - Complete Architecture Integration
 */

class CraftingSystem {
    constructor(worldManager, database, professionsSystem) {
        this.worldManager = worldManager;
        this.database = database;
        this.professionsSystem = professionsSystem;
        
        // Crafting configuration
        this.config = {
            maxCraftingLevel: 300,
            baseCraftingTime: 5000, // 5 seconds
            criticalSuccessChance: 0.05, // 5% base
            masterworkChance: 0.01, // 1% base for masterwork items
            enchantingSuccessChance: 0.75, // 75% base enchanting success
            
            // Quality tiers
            qualityMultipliers: {
                poor: 0.8,
                common: 1.0,
                uncommon: 1.2,
                rare: 1.5,
                epic: 2.0,
                legendary: 3.0
            },
            
            // Experience rates
            craftingXPRate: 25,
            enchantingXPRate: 30,
            modificationXPRate: 20,
            
            // Material costs
            materialReturnChance: 0.25, // 25% chance to return some materials on failure
            
            // Crafting stations
            stationTypes: ['forge', 'alchemy_lab', 'workbench', 'enchanting_table', 'tailoring_shop', 'kitchen'],
            
            // Item modification
            maxEnchants: 5,
            maxSockets: 4,
            gemSocketCost: 100
        };
        
        // Recipe definitions
        this.recipes = new Map();
        this.initializeRecipes();
        
        // Crafting stations
        this.craftingStations = new Map();
        this.initializeCraftingStations();
        
        // Item templates
        this.itemTemplates = new Map();
        this.initializeItemTemplates();
        
        // Enchanting definitions
        this.enchantments = new Map();
        this.initializeEnchantments();
        
        // Gem definitions
        this.gems = new Map();
        this.initializeGems();
        
        // Player crafting data
        this.playerCraftingData = new Map();
        
        // Active crafting sessions
        this.activeSessions = new Map();
        
        // Crafting queue (for mass production)
        this.craftingQueues = new Map();
        
        // Statistics
        this.craftingStats = {
            totalItemsCrafted: 0,
            totalEnchants: 0,
            totalMasterworks: 0,
            totalFailures: 0,
            mostCraftedItem: null,
            topCrafter: null,
            averageQuality: 0,
            craftingEconomy: {
                itemsCreated: 0,
                materialsConsumed: 0,
                goldEarned: 0
            }
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Load crafting data
        this.loadCraftingData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start update loop
        this.startUpdateLoop();
        
        console.log('Crafting System initialized');
    }
    
    initializeRecipes() {
        // Weapon recipes
        this.recipes.set('copper_dagger', {
            id: 'copper_dagger',
            name: 'Adaga de Cobre',
            category: 'weapon',
            type: 'dagger',
            profession: 'blacksmithing',
            requiredLevel: 1,
            station: 'forge',
            difficulty: 'easy',
            
            materials: [
                { id: 'copper_bar', quantity: 2 },
                { id: 'leather_strip', quantity: 1 }
            ],
            
            results: {
                base: { id: 'copper_dagger', quantity: 1 },
                critical: { id: 'copper_dagger_superior', quantity: 1 },
                masterwork: { id: 'copper_dagger_masterwork', quantity: 1 }
            },
            
            stats: {
                damage: { min: 5, max: 8 },
                speed: 1.8,
                durability: 30
            },
            
            experience: 25,
            craftingTime: 5000,
            
            unlocks: ['iron_dagger'],
            requirements: {
                skills: { blacksmithing: 1 }
            }
        });
        
        this.recipes.set('iron_sword', {
            id: 'iron_sword',
            name: 'Espada de Ferro',
            category: 'weapon',
            type: 'sword',
            profession: 'blacksmithing',
            requiredLevel: 25,
            station: 'forge',
            difficulty: 'medium',
            
            materials: [
                { id: 'iron_bar', quantity: 3 },
                { id: 'leather_strip', quantity: 2 },
                { id: 'coal', quantity: 1 }
            ],
            
            results: {
                base: { id: 'iron_sword', quantity: 1 },
                critical: { id: 'iron_sword_superior', quantity: 1 },
                masterwork: { id: 'iron_sword_masterwork', quantity: 1 }
            },
            
            stats: {
                damage: { min: 12, max: 18 },
                speed: 1.5,
                durability: 60
            },
            
            experience: 50,
            craftingTime: 8000,
            
            unlocks: ['steel_sword'],
            requirements: {
                skills: { blacksmithing: 25 }
            }
        });
        
        this.recipes.set('mithril_hammer', {
            id: 'mithril_hammer',
            name: 'Martelo de Mithril',
            category: 'weapon',
            type: 'hammer',
            profession: 'blacksmithing',
            requiredLevel: 150,
            station: 'forge',
            difficulty: 'hard',
            
            materials: [
                { id: 'mithril_bar', quantity: 5 },
                { id: 'rare_leather', quantity: 3 },
                { id: 'mithril_ore', quantity: 2 },
                { id: 'enchanted_dust', quantity: 1 }
            ],
            
            results: {
                base: { id: 'mithril_hammer', quantity: 1 },
                critical: { id: 'mithril_hammer_superior', quantity: 1 },
                masterwork: { id: 'mithril_hammer_masterwork', quantity: 1 }
            },
            
            stats: {
                damage: { min: 45, max: 65 },
                speed: 1.2,
                durability: 120,
                special: ['stun_chance_10%']
            },
            
            experience: 200,
            craftingTime: 15000,
            
            unlocks: ['elemental_mithril_hammer'],
            requirements: {
                skills: { blacksmithing: 150 },
                quests: ['master_blacksmith']
            }
        });
        
        // Armor recipes
        this.recipes.set('leather_armor', {
            id: 'leather_armor',
            name: 'Armadura de Couro',
            category: 'armor',
            type: 'light',
            slot: 'chest',
            profession: 'tailoring',
            requiredLevel: 1,
            station: 'workbench',
            difficulty: 'easy',
            
            materials: [
                { id: 'leather', quantity: 4 },
                { id: 'thread', quantity: 2 }
            ],
            
            results: {
                base: { id: 'leather_armor', quantity: 1 },
                critical: { id: 'leather_armor_superior', quantity: 1 },
                masterwork: { id: 'leather_armor_masterwork', quantity: 1 }
            },
            
            stats: {
                defense: 15,
                durability: 40,
                stats: { agility: 2 }
            },
            
            experience: 20,
            craftingTime: 6000,
            
            unlocks: ['hardened_leather_armor'],
            requirements: {
                skills: { tailoring: 1 }
            }
        });
        
        this.recipes.set('iron_plate_armor', {
            id: 'iron_plate_armor',
            name: 'Armadura de Placas de Ferro',
            category: 'armor',
            type: 'heavy',
            slot: 'chest',
            profession: 'blacksmithing',
            requiredLevel: 50,
            station: 'forge',
            difficulty: 'medium',
            
            materials: [
                { id: 'iron_bar', quantity: 8 },
                { id: 'leather', quantity: 4 },
                { id: 'coal', quantity: 3 }
            ],
            
            results: {
                base: { id: 'iron_plate_armor', quantity: 1 },
                critical: { id: 'iron_plate_armor_superior', quantity: 1 },
                masterwork: { id: 'iron_plate_armor_masterwork', quantity: 1 }
            },
            
            stats: {
                defense: 45,
                durability: 80,
                stats: { strength: 5, stamina: 3 }
            },
            
            experience: 75,
            craftingTime: 12000,
            
            unlocks: ['steel_plate_armor'],
            requirements: {
                skills: { blacksmithing: 50 }
            }
        });
        
        // Potion recipes
        this.recipes.set('minor_healing_potion', {
            id: 'minor_healing_potion',
            name: 'Poção de Cura Menor',
            category: 'consumable',
            type: 'potion',
            profession: 'alchemy',
            requiredLevel: 1,
            station: 'alchemy_lab',
            difficulty: 'easy',
            
            materials: [
                { id: 'peacebloom', quantity: 2 },
                { id: 'vial', quantity: 1 },
                { id: 'water', quantity: 1 }
            ],
            
            results: {
                base: { id: 'minor_healing_potion', quantity: 2 },
                critical: { id: 'minor_healing_potion_concentrated', quantity: 2 },
                masterwork: { id: 'minor_healing_potion_pure', quantity: 3 }
            },
            
            effects: {
                healing: { amount: 50, type: 'instant' }
            },
            
            experience: 15,
            craftingTime: 3000,
            
            unlocks: ['healing_potion'],
            requirements: {
                skills: { alchemy: 1 }
            }
        });
        
        this.recipes.set('major_mana_potion', {
            id: 'major_mana_potion',
            name: 'Poção de Mana Maior',
            category: 'consumable',
            type: 'potion',
            profession: 'alchemy',
            requiredLevel: 100,
            station: 'alchemy_lab',
            difficulty: 'hard',
            
            materials: [
                { id: 'dreamfoil', quantity: 3 },
                { id: 'vial', quantity: 1 },
                { id: 'crystal_vial', quantity: 1 },
                { id: 'mana_crystal', quantity: 1 }
            ],
            
            results: {
                base: { id: 'major_mana_potion', quantity: 1 },
                critical: { id: 'major_mana_potion_concentrated', quantity: 1 },
                masterwork: { id: 'major_mana_potion_pure', quantity: 2 }
            },
            
            effects: {
                mana: { amount: 200, type: 'instant' },
                regeneration: { amount: 50, duration: 30000, type: 'mana' }
            },
            
            experience: 120,
            craftingTime: 8000,
            
            unlocks: ['superior_mana_potion'],
            requirements: {
                skills: { alchemy: 100 },
                reputation: { alchemists_union: friendly }
            }
        });
        
        // Accessory recipes
        this.recipes.set('iron_ring', {
            id: 'iron_ring',
            name: 'Anel de Ferro',
            category: 'accessory',
            type: 'ring',
            profession: 'blacksmithing',
            requiredLevel: 20,
            station: 'forge',
            difficulty: 'easy',
            
            materials: [
                { id: 'iron_bar', quantity: 1 }
            ],
            
            results: {
                base: { id: 'iron_ring', quantity: 1 },
                critical: { id: 'iron_ring_polished', quantity: 1 },
                masterwork: { id: 'iron_ring_enchanted', quantity: 1 }
            },
            
            stats: {
                durability: 50,
                sockets: 1,
                stats: { stamina: 2 }
            },
            
            experience: 30,
            craftingTime: 4000,
            
            unlocks: ['silver_ring', 'gold_ring'],
            requirements: {
                skills: { blacksmithing: 20 }
            }
        });
        
        // Complex recipes
        this.recipes.set('enchanted_mithril_sword', {
            id: 'enchanted_mithril_sword',
            name: 'Espada de Mithril Encantada',
            category: 'weapon',
            type: 'sword',
            profession: 'blacksmithing',
            requiredLevel: 200,
            station: 'enchanting_table',
            difficulty: 'legendary',
            
            materials: [
                { id: 'mithril_sword', quantity: 1 },
                { id: 'void_crystal', quantity: 3 },
                { id: 'essence_of_power', quantity: 2 },
                { id: 'rune_of_blades', quantity: 1 }
            ],
            
            results: {
                base: { id: 'enchanted_mithril_sword', quantity: 1 },
                critical: { id: 'enchanted_mithril_sword_legendary', quantity: 1 },
                masterwork: { id: 'enchanted_mithril_sword_artifact', quantity: 1 }
            },
            
            stats: {
                damage: { min: 80, max: 120 },
                speed: 1.6,
                durability: 150,
                stats: { strength: 15, critical_chance: 5 },
                special: ['lightning_damage_20%', 'soul_bound'],
                enchantments: ['sharpness_5', 'fire_damage_3']
            },
            
            experience: 500,
            craftingTime: 30000,
            
            unlocks: [],
            requirements: {
                skills: { blacksmithing: 200, enchanting: 150 },
                quests: ['legendary_weaponsmith'],
                reputation: { mithril_order: revered }
            }
        });
    }
    
    initializeCraftingStations() {
        this.craftingStations.set('forge', {
            id: 'forge',
            name: 'Forja',
            type: 'blacksmithing',
            description: 'Estação para forjar armas e armaduras de metal',
            efficiency: 1.0,
            durability: 1000,
            maxDurability: 1000,
            fuelType: 'coal',
            fuelConsumption: 1,
            location: 'city_blacksmith'
        });
        
        this.craftingStations.set('alchemy_lab', {
            id: 'alchemy_lab',
            name: 'Laboratório de Alquimia',
            type: 'alchemy',
            description: 'Estação para criar poções e elixires',
            efficiency: 1.0,
            durability: 800,
            maxDurability: 800,
            fuelType: 'magical_essence',
            fuelConsumption: 0.5,
            location: 'tower_alchemist'
        });
        
        this.craftingStations.set('workbench', {
            id: 'workbench',
            name: 'Bancada de Trabalho',
            type: 'general',
            description: 'Estação multiuso para artesanato básico',
            efficiency: 0.9,
            durability: 600,
            maxDurability: 600,
            fuelType: null,
            fuelConsumption: 0,
            location: 'workshop'
        });
        
        this.craftingStations.set('enchanting_table', {
            id: 'enchanting_table',
            name: 'Mesa de Encantamento',
            type: 'enchanting',
            description: 'Estação para encantar itens e adicionar gemas',
            efficiency: 1.0,
            durability: 500,
            maxDurability: 500,
            fuelType: 'arcane_energy',
            fuelConsumption: 2,
            location: 'mage_tower'
        });
    }
    
    initializeItemTemplates() {
        // Weapon templates
        this.itemTemplates.set('dagger', {
            type: 'dagger',
            slot: 'weapon',
            damageType: 'piercing',
            baseStats: {
                damage: { min: 1, max: 1 },
                speed: 2.0,
                durability: 20
            },
            scaling: {
                damage: 1.5,
                durability: 2.0
            },
            enchantable: true,
            socketable: true,
            maxSockets: 1
        });
        
        this.itemTemplates.set('sword', {
            type: 'sword',
            slot: 'weapon',
            damageType: 'slashing',
            baseStats: {
                damage: { min: 1, max: 1 },
                speed: 1.5,
                durability: 30
            },
            scaling: {
                damage: 2.0,
                durability: 2.5
            },
            enchantable: true,
            socketable: true,
            maxSockets: 2
        });
        
        this.itemTemplates.set('hammer', {
            type: 'hammer',
            slot: 'weapon',
            damageType: 'blunt',
            baseStats: {
                damage: { min: 1, max: 1 },
                speed: 1.2,
                durability: 40
            },
            scaling: {
                damage: 2.5,
                durability: 3.0
            },
            enchantable: true,
            socketable: true,
            maxSockets: 1
        });
        
        // Armor templates
        this.itemTemplates.set('light_armor', {
            type: 'light_armor',
            slot: 'chest',
            armorType: 'light',
            baseStats: {
                defense: 1,
                durability: 25
            },
            scaling: {
                defense: 1.2,
                durability: 1.5
            },
            enchantable: true,
            socketable: true,
            maxSockets: 2
        });
        
        this.itemTemplates.set('heavy_armor', {
            type: 'heavy_armor',
            slot: 'chest',
            armorType: 'heavy',
            baseStats: {
                defense: 1,
                durability: 40
            },
            scaling: {
                defense: 2.0,
                durability: 2.5
            },
            enchantable: true,
            socketable: true,
            maxSockets: 3
        });
    }
    
    initializeEnchantments() {
        // Weapon enchantments
        this.enchantments.set('sharpness', {
            id: 'sharpness',
            name: 'Afiação',
            type: 'weapon',
            description: 'Aumenta o dano da arma',
            maxLevel: 5,
            levels: [
                { level: 1, bonus: { damage: 2 }, cost: 50 },
                { level: 2, bonus: { damage: 4 }, cost: 100 },
                { level: 3, bonus: { damage: 7 }, cost: 200 },
                { level: 4, bonus: { damage: 11 }, cost: 400 },
                { level: 5, bonus: { damage: 16 }, cost: 800 }
            ],
            requiredSkill: { enchanting: 25 }
        });
        
        this.enchantments.set('fire_damage', {
            id: 'fire_damage',
            name: 'Dano de Fogo',
            type: 'weapon',
            description: 'Adiciona dano de fogo aos ataques',
            maxLevel: 3,
            levels: [
                { level: 1, bonus: { fire_damage: 5 }, cost: 150 },
                { level: 2, bonus: { fire_damage: 12 }, cost: 350 },
                { level: 3, bonus: { fire_damage: 25 }, cost: 750 }
            ],
            requiredSkill: { enchanting: 50 }
        });
        
        this.enchantments.set('critical_strike', {
            id: 'critical_strike',
            name: 'Golpe Crítico',
            type: 'weapon',
            description: 'Aumenta a chance de golpe crítico',
            maxLevel: 3,
            levels: [
                { level: 1, bonus: { critical_chance: 2 }, cost: 200 },
                { level: 2, bonus: { critical_chance: 5 }, cost: 500 },
                { level: 3, bonus: { critical_chance: 10 }, cost: 1200 }
            ],
            requiredSkill: { enchanting: 75 }
        });
        
        // Armor enchantments
        this.enchantments.set('protection', {
            id: 'protection',
            name: 'Proteção',
            type: 'armor',
            description: 'Aumenta a defesa da armadura',
            maxLevel: 5,
            levels: [
                { level: 1, bonus: { defense: 3 }, cost: 40 },
                { level: 2, bonus: { defense: 7 }, cost: 90 },
                { level: 3, bonus: { defense: 12 }, cost: 180 },
                { level: 4, bonus: { defense: 18 }, cost: 350 },
                { level: 5, bonus: { defense: 25 }, cost: 600 }
            ],
            requiredSkill: { enchanting: 20 }
        });
        
        this.enchantments.set('magic_resistance', {
            id: 'magic_resistance',
            name: 'Resistência Mágica',
            type: 'armor',
            description: 'Aumenta a resistência a dano mágico',
            maxLevel: 3,
            levels: [
                { level: 1, bonus: { magic_resist: 5 }, cost: 120 },
                { level: 2, bonus: { magic_resist: 12 }, cost: 300 },
                { level: 3, bonus: { magic_resist: 25 }, cost: 700 }
            ],
            requiredSkill: { enchanting: 60 }
        });
        
        // Utility enchantments
        this.enchantments.set('durability', {
            id: 'durability',
            name: 'Durabilidade',
            type: 'utility',
            description: 'Aumenta a durabilidade máxima do item',
            maxLevel: 3,
            levels: [
                { level: 1, bonus: { durability: 20 }, cost: 80 },
                { level: 2, bonus: { durability: 50 }, cost: 200 },
                { level: 3, bonus: { durability: 100 }, cost: 500 }
            ],
            requiredSkill: { enchanting: 15 }
        });
    }
    
    initializeGems() {
        this.gems.set('ruby', {
            id: 'ruby',
            name: 'Rubi',
            color: '#ff0000',
            quality: 'uncommon',
            stats: { strength: 3, fire_resist: 5 },
            socketTypes: ['red'],
            cost: 100
        });
        
        this.gems.set('sapphire', {
            id: 'sapphire',
            name: 'Safira',
            color: '#0000ff',
            quality: 'uncommon',
            stats: { intellect: 3, frost_resist: 5 },
            socketTypes: ['blue'],
            cost: 100
        });
        
        this.gems.set('emerald', {
            id: 'emerald',
            name: 'Esmeralda',
            color: '#00ff00',
            quality: 'rare',
            stats: { agility: 4, nature_resist: 8 },
            socketTypes: ['green'],
            cost: 250
        });
        
        this.gems.set('diamond', {
            id: 'diamond',
            name: 'Diamante',
            color: '#b9f2ff',
            quality: 'epic',
            stats: { all_stats: 5, all_resist: 10 },
            socketTypes: ['meta'],
            cost: 1000
        });
        
        this.gems.set('void_crystal', {
            id: 'void_crystal',
            name: 'Cristal do Void',
            color: '#4b0082',
            quality: 'legendary',
            stats: { shadow_damage: 15, spell_power: 10 },
            socketTypes: ['prismatic'],
            cost: 5000
        });
    }
    
    async loadCraftingData() {
        try {
            // Load player crafting data
            const playerData = await this.database.get('player_crafting_data');
            if (playerData) {
                for (const [playerId, data] of Object.entries(playerData)) {
                    this.playerCraftingData.set(playerId, {
                        knownRecipes: new Set(data.knownRecipes || []),
                        favoriteRecipes: new Set(data.favoriteRecipes || []),
                        craftingHistory: data.craftingHistory || [],
                        enchantingHistory: data.enchantingHistory || [],
                        statistics: data.statistics || {
                            itemsCrafted: 0,
                            itemsEnchanted: 0,
                            masterworks: 0,
                            failures: 0,
                            totalMaterialsUsed: 0
                        },
                        lastUpdate: data.lastUpdate || Date.now()
                    });
                }
            }
            
            // Load crafting statistics
            const stats = await this.database.get('crafting_statistics');
            if (stats) {
                this.craftingStats = stats;
            }
            
        } catch (error) {
            console.error('Error loading crafting data:', error);
        }
    }
    
    setupEventHandlers() {
        // Listen to profession level ups
        this.professionsSystem.on('profession_level_up', (playerId, professionId, newLevel) => {
            this.onProfessionLevelUp(playerId, professionId, newLevel);
        });
        
        // Listen to player interactions
        this.worldManager.on('player_interact', (playerId, targetType, targetId) => {
            if (targetType === 'crafting_station') {
                this.onCraftingStationInteract(playerId, targetId);
            }
        });
    }
    
    startUpdateLoop() {
        setInterval(() => {
            this.updateActiveSessions();
            this.processCraftingQueues();
        }, 1000);
    }
    
    // Public API - Recipe Management
    async learnRecipe(playerId, recipeId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;
        
        // Check if already known
        const playerData = this.getPlayerCraftingData(playerId);
        if (playerData.knownRecipes.has(recipeId)) {
            return false;
        }
        
        // Check requirements
        if (!this.checkRecipeRequirements(playerId, recipe)) {
            return false;
        }
        
        // Learn recipe
        playerData.knownRecipes.add(recipeId);
        
        // Save data
        await this.savePlayerCraftingData(playerId);
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'recipe_learned',
            recipeId: recipeId,
            recipe: recipe,
            message: `Você aprendeu a receita: ${recipe.name}!`
        });
        
        console.log(`Player ${player.name} learned recipe: ${recipe.name}`);
        return true;
    }
    
    checkRecipeRequirements(playerId, recipe) {
        // Check skill requirements
        if (recipe.requirements && recipe.requirements.skills) {
            for (const [skill, requiredLevel] of Object.entries(recipe.requirements.skills)) {
                const playerLevel = this.professionsSystem.getProfessionLevel(playerId, skill);
                if (playerLevel < requiredLevel) {
                    return false;
                }
            }
        }
        
        // Check quest requirements (simplified)
        if (recipe.requirements && recipe.requirements.quests) {
            // This would check player's completed quests
            // For now, assume all quests are completed
        }
        
        // Check reputation requirements (simplified)
        if (recipe.requirements && recipe.requirements.reputation) {
            // This would check player's reputation with factions
            // For now, assume all reputations are sufficient
        }
        
        return true;
    }
    
    getAvailableRecipes(playerId, profession = null) {
        const playerData = this.getPlayerCraftingData(playerId);
        const available = [];
        
        for (const [recipeId, recipe] of this.recipes) {
            if (!playerData.knownRecipes.has(recipeId)) continue;
            if (profession && recipe.profession !== profession) continue;
            
            available.push(recipe);
        }
        
        return available.sort((a, b) => a.requiredLevel - b.requiredLevel);
    }
    
    // Crafting System
    async startCrafting(playerId, recipeId, quantity = 1, options = {}) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;
        
        // Check if recipe is known
        const playerData = this.getPlayerCraftingData(playerId);
        if (!playerData.knownRecipes.has(recipeId)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'crafting_failed',
                reason: 'recipe_unknown',
                message: 'Você não conhece esta receita.'
            });
            return false;
        }
        
        // Check if player can craft (level, station, etc.)
        if (!this.canCraftRecipe(playerId, recipe)) {
            return false;
        }
        
        // Check materials for all items
        const totalMaterials = this.calculateTotalMaterials(recipe, quantity);
        if (!this.hasMaterials(player, totalMaterials)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'crafting_failed',
                reason: 'insufficient_materials',
                message: 'Materiais insuficientes.',
                required: totalMaterials
            });
            return false;
        }
        
        // Check if already crafting
        if (this.activeSessions.has(playerId)) {
            this.addToCraftingQueue(playerId, recipeId, quantity, options);
            return true;
        }
        
        // Start crafting session
        const session = {
            playerId: playerId,
            recipeId: recipeId,
            quantity: quantity,
            options: options,
            startTime: Date.now(),
            duration: this.calculateCraftingTime(playerId, recipe, quantity),
            progress: 0,
            interrupted: false,
            station: options.station || recipe.station
        };
        
        this.activeSessions.set(playerId, session);
        
        // Remove materials
        this.removeMaterials(player, totalMaterials);
        
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
    
    canCraftRecipe(playerId, recipe) {
        // Check skill level
        const playerLevel = this.professionsSystem.getProfessionLevel(playerId, recipe.profession);
        if (playerLevel < recipe.requiredLevel) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'crafting_failed',
                reason: 'skill_too_low',
                message: `Você precisa de nível ${recipe.requiredLevel} em ${recipe.profession}.`
            });
            return false;
        }
        
        // Check crafting station
        if (recipe.station && recipe.station !== 'workbench') {
            // This would check if player is near the required station
            // For now, assume all stations are available
        }
        
        return true;
    }
    
    calculateTotalMaterials(recipe, quantity) {
        const total = {};
        
        for (const material of recipe.materials) {
            total[material.id] = (total[material.id] || 0) + (material.quantity * quantity);
        }
        
        return Object.entries(total).map(([id, quantity]) => ({ id, quantity }));
    }
    
    hasMaterials(player, materials) {
        for (const material of materials) {
            if (!player.hasItem(material.id, material.quantity)) {
                return false;
            }
        }
        return true;
    }
    
    removeMaterials(player, materials) {
        for (const material of materials) {
            player.removeFromInventory(material.id, material.quantity);
        }
        
        // Update statistics
        const playerData = this.getPlayerCraftingData(player.id);
        for (const material of materials) {
            playerData.statistics.totalMaterialsUsed += material.quantity;
            this.craftingStats.craftingEconomy.materialsConsumed += material.quantity;
        }
    }
    
    calculateCraftingTime(playerId, recipe, quantity) {
        let baseTime = recipe.craftingTime || this.config.baseCraftingTime;
        
        // Adjust for player skill
        const playerLevel = this.professionsSystem.getProfessionLevel(playerId, recipe.profession);
        const skillBonus = Math.min(0.5, playerLevel * 0.002); // Max 50% reduction
        baseTime *= (1 - skillBonus);
        
        // Adjust for quantity (bulk crafting bonus)
        const bulkBonus = Math.min(0.3, (quantity - 1) * 0.05); // Max 30% reduction
        baseTime *= (1 - bulkBonus);
        
        // Adjust for difficulty
        const difficultyMultiplier = {
            easy: 0.8,
            medium: 1.0,
            hard: 1.3,
            legendary: 1.8
        };
        
        baseTime *= difficultyMultiplier[recipe.difficulty] || 1.0;
        
        return Math.floor(baseTime * quantity);
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
        
        // Craft each item
        const results = [];
        for (let i = 0; i < session.quantity; i++) {
            const result = this.craftSingleItem(playerId, recipe, session.options);
            results.push(result);
            
            // Add item to inventory
            if (result.success) {
                player.addToInventory(result.item);
            }
        }
        
        // Calculate total experience
        const totalXP = results.reduce((sum, result) => sum + (result.experience || 0), 0);
        await this.professionsSystem.addProfessionExperience(playerId, recipe.profession, totalXP);
        
        // Update statistics
        this.updateCraftingStatistics(playerId, recipe, results);
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'crafting_completed',
            recipeId: session.recipeId,
            results: results,
            message: `Criação completa! Resultados: ${this.formatCraftingResults(results)}`
        });
        
        // Process next item in queue
        this.processCraftingQueue(playerId);
        
        // Clean up session
        this.activeSessions.delete(playerId);
    }
    
    craftSingleItem(playerId, recipe, options) {
        const playerLevel = this.professionsSystem.getProfessionLevel(playerId, recipe.profession);
        const playerData = this.getPlayerCraftingData(playerId);
        
        // Calculate success chance
        let successChance = this.calculateSuccessChance(playerId, recipe);
        
        // Roll for success
        const isSuccess = Math.random() < successChance;
        
        if (!isSuccess) {
            // Crafting failed
            playerData.statistics.failures++;
            this.craftingStats.totalFailures++;
            
            // Return some materials
            this.returnSomeMaterials(playerId, recipe);
            
            return {
                success: false,
                reason: 'crafting_failed',
                experience: Math.floor(recipe.experience * 0.2)
            };
        }
        
        // Determine quality
        const quality = this.determineItemQuality(playerId, recipe);
        
        // Check for critical success
        const critChance = this.config.criticalSuccessChance + (playerLevel * 0.001);
        const isCritical = Math.random() < critChance;
        
        // Check for masterwork
        const masterworkChance = this.config.masterworkChance + (playerLevel * 0.0005);
        const isMasterwork = Math.random() < masterworkChance;
        
        // Create item
        let itemTemplate = recipe.results.base;
        if (isMasterwork && recipe.results.masterwork) {
            itemTemplate = recipe.results.masterwork;
            playerData.statistics.masterworks++;
            this.craftingStats.totalMasterworks++;
        } else if (isCritical && recipe.results.critical) {
            itemTemplate = recipe.results.critical;
        }
        
        const item = this.createItemFromTemplate(itemTemplate, quality, recipe, options);
        
        // Update statistics
        playerData.statistics.itemsCrafted++;
        this.craftingStats.totalItemsCrafted++;
        this.craftingStats.craftingEconomy.itemsCreated++;
        
        return {
            success: true,
            item: item,
            quality: quality,
            critical: isCritical,
            masterwork: isMasterwork,
            experience: this.calculateCraftingExperience(recipe, quality, isCritical, isMasterwork)
        };
    }
    
    calculateSuccessChance(playerId, recipe) {
        const playerLevel = this.professionsSystem.getProfessionLevel(playerId, recipe.profession);
        const baseChance = 0.9; // 90% base success rate
        
        // Adjust based on skill level vs recipe difficulty
        const levelDifference = playerLevel - recipe.requiredLevel;
        const levelBonus = Math.min(0.1, levelDifference * 0.002); // Max 10% bonus
        
        // Adjust based on difficulty
        const difficultyPenalty = {
            easy: 0,
            medium: -0.05,
            hard: -0.1,
            legendary: -0.2
        };
        
        return Math.max(0.1, Math.min(0.99, baseChance + levelBonus + (difficultyPenalty[recipe.difficulty] || 0)));
    }
    
    determineItemQuality(playerId, recipe) {
        const playerLevel = this.professionsSystem.getProfessionLevel(playerId, recipe.profession);
        
        // Quality chance based on skill level
        const qualityRoll = Math.random();
        
        if (qualityRoll < 0.05 + (playerLevel * 0.0001)) { // Legendary
            return 'legendary';
        } else if (qualityRoll < 0.15 + (playerLevel * 0.0002)) { // Epic
            return 'epic';
        } else if (qualityRoll < 0.35 + (playerLevel * 0.0003)) { // Rare
            return 'rare';
        } else if (qualityRoll < 0.65 + (playerLevel * 0.0002)) { // Uncommon
            return 'uncommon';
        } else { // Common or Poor
            return Math.random() < 0.1 ? 'poor' : 'common';
        }
    }
    
    createItemFromTemplate(template, quality, recipe, options) {
        const item = {
            id: `crafted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            baseId: template.id,
            name: this.generateItemName(template, quality),
            type: recipe.type,
            category: recipe.category,
            quality: quality,
            stats: { ...recipe.stats },
            durability: recipe.stats?.durability || 100,
            maxDurability: recipe.stats?.durability || 100,
            crafted: true,
            crafterId: options.playerId,
            craftedAt: Date.now(),
            recipeId: recipe.id,
            enchantments: [],
            sockets: this.generateSockets(recipe, quality),
            value: this.calculateItemValue(template, quality, recipe)
        };
        
        // Apply quality multipliers
        if (this.config.qualityMultipliers[quality]) {
            const multiplier = this.config.qualityMultipliers[quality];
            
            // Scale stats
            if (item.stats) {
                for (const [stat, value] of Object.entries(item.stats)) {
                    if (typeof value === 'number') {
                        item.stats[stat] = Math.floor(value * multiplier);
                    }
                }
            }
            
            // Scale durability
            item.durability = Math.floor(item.durability * multiplier);
            item.maxDurability = item.durability;
        }
        
        return item;
    }
    
    generateItemName(template, quality) {
        const qualityPrefixes = {
            poor: 'Frágil',
            common: '',
            uncommon: 'Superior',
            rare: 'Raro',
            epic: 'Épico',
            legendary: 'Lendário'
        };
        
        const prefix = qualityPrefixes[quality] || '';
        return prefix ? `${prefix} ${template.id}` : template.id;
    }
    
    generateSockets(recipe, quality) {
        const template = this.itemTemplates.get(recipe.type);
        if (!template || !template.socketable) return [];
        
        const maxSockets = template.maxSockets || 0;
        const socketCount = Math.min(maxSockets, Math.floor(Math.random() * (maxSockets + 1)));
        
        // Higher quality items have better chance for more sockets
        const qualityBonus = {
            uncommon: 0.2,
            rare: 0.4,
            epic: 0.6,
            legendary: 0.8
        };
        
        const finalSockets = socketCount + (Math.random() < (qualityBonus[quality] || 0) ? 1 : 0);
        
        return Array(Math.min(maxSockets, finalSockets)).fill(null);
    }
    
    calculateItemValue(template, quality, recipe) {
        let baseValue = recipe.materials.reduce((sum, mat) => {
            return sum + (this.getMaterialValue(mat.id) * mat.quantity);
        }, 0);
        
        // Apply quality multiplier
        if (this.config.qualityMultipliers[quality]) {
            baseValue *= this.config.qualityMultipliers[quality];
        }
        
        return Math.floor(baseValue);
    }
    
    getMaterialValue(materialId) {
        // Simplified material values
        const values = {
            copper_bar: 10,
            iron_bar: 25,
            mithril_bar: 100,
            leather: 5,
            peacebloom: 3,
            vial: 2
        };
        
        return values[materialId] || 5;
    }
    
    calculateCraftingExperience(recipe, quality, isCritical, isMasterwork) {
        let xp = recipe.experience || this.config.craftingXPRate;
        
        // Quality bonus
        const qualityBonus = {
            uncommon: 1.2,
            rare: 1.5,
            epic: 2.0,
            legendary: 3.0
        };
        
        if (qualityBonus[quality]) {
            xp *= qualityBonus[quality];
        }
        
        // Critical bonus
        if (isCritical) xp *= 1.5;
        
        // Masterwork bonus
        if (isMasterwork) xp *= 2.0;
        
        return Math.floor(xp);
    }
    
    returnSomeMaterials(playerId, recipe) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return;
        
        if (Math.random() < this.config.materialReturnChance) {
            // Return 25-50% of materials
            for (const material of recipe.materials) {
                const returnAmount = Math.floor(material.quantity * (0.25 + Math.random() * 0.25));
                if (returnAmount > 0) {
                    player.addToInventory({ id: material.id, quantity: returnAmount });
                }
            }
        }
    }
    
    // Enchanting System
    async enchantItem(playerId, itemId, enchantmentId, level = 1) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const enchantment = this.enchantments.get(enchantmentId);
        if (!enchantment) return false;
        
        // Check if player knows enchantment
        const enchantingLevel = this.professionsSystem.getProfessionLevel(playerId, 'enchanting');
        if (enchantingLevel < (enchantment.requiredSkill?.enchanting || 0)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'enchanting_failed',
                reason: 'skill_too_low',
                message: 'Seu nível de encantamento é muito baixo.'
            });
            return false;
        }
        
        // Get item to enchant
        const item = player.getInventoryItem(itemId);
        if (!item) return false;
        
        // Check if item can be enchanted
        const template = this.itemTemplates.get(item.type);
        if (!template || !template.enchantable) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'enchanting_failed',
                reason: 'item_not_enchantable',
                message: 'Este item não pode ser encantado.'
            });
            return false;
        }
        
        // Check enchantment level
        if (level > enchantment.maxLevel) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'enchanting_failed',
                reason: 'level_too_high',
                message: `Nível máximo para este encantamento é ${enchantment.maxLevel}.`
            });
            return false;
        }
        
        // Check if already has this enchantment
        if (item.enchantments && item.enchantments.some(e => e.id === enchantmentId)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'enchanting_failed',
                reason: 'already_enchanted',
                message: 'Este item já possui este encantamento.'
            });
            return false;
        }
        
        // Check cost
        const enchantmentCost = enchantment.levels[level - 1].cost;
        if (player.gold < enchantmentCost) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'enchanting_failed',
                reason: 'insufficient_gold',
                message: `Você precisa de ${enchantmentCost} gold.`
            });
            return false;
        }
        
        // Attempt enchantment
        const success = Math.random() < this.config.enchantingSuccessChance;
        
        if (success) {
            // Apply enchantment
            if (!item.enchantments) item.enchantments = [];
            
            item.enchantments.push({
                id: enchantmentId,
                name: enchantment.name,
                level: level,
                bonus: enchantment.levels[level - 1].bonus,
                appliedAt: Date.now()
            });
            
            // Apply stat bonuses
            if (enchantment.levels[level - 1].bonus) {
                for (const [stat, value] of Object.entries(enchantment.levels[level - 1].bonus)) {
                    if (!item.stats) item.stats = {};
                    item.stats[stat] = (item.stats[stat] || 0) + value;
                }
            }
            
            // Add experience
            await this.professionsSystem.addProfessionExperience(playerId, 'enchanting', this.config.enchantingXPRate * level);
            
            // Update statistics
            const playerData = this.getPlayerCraftingData(playerId);
            playerData.statistics.itemsEnchanted++;
            this.craftingStats.totalEnchants++;
            
            // Notify success
            this.worldManager.sendToPlayer(playerId, {
                type: 'enchanting_success',
                itemId: itemId,
                enchantment: {
                    id: enchantmentId,
                    name: enchantment.name,
                    level: level
                },
                message: `${enchantment.name} nível ${level} aplicado com sucesso!`
            });
            
        } else {
            // Enchantment failed
            player.gold = Math.max(0, player.gold - Math.floor(enchantmentCost * 0.5)); // Lose half cost
            
            this.worldManager.sendToPlayer(playerId, {
                type: 'enchanting_failed',
                reason: 'enchantment_failed',
                cost: Math.floor(enchantmentCost * 0.5),
                message: 'O encantamento falhou! Você perdeu metade do custo.'
            });
        }
        
        return success;
    }
    
    // Gem Socketing
    async socketGem(playerId, itemId, gemId, socketIndex = 0) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const gem = this.gems.get(gemId);
        if (!gem) return false;
        
        // Get item
        const item = player.getInventoryItem(itemId);
        if (!item) return false;
        
        // Check if item has sockets
        if (!item.sockets || item.sockets.length === 0) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'socketing_failed',
                reason: 'no_sockets',
                message: 'Este item não possui sockets.'
            });
            return false;
        }
        
        // Check if socket is available
        if (socketIndex >= item.sockets.length || item.sockets[socketIndex] !== null) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'socketing_failed',
                reason: 'socket_unavailable',
                message: 'Socket não disponível.'
            });
            return false;
        }
        
        // Check if player has gem
        if (!player.hasItem(gemId, 1)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'socketing_failed',
                reason: 'no_gem',
                message: 'Você não possui esta gema.'
            });
            return false;
        }
        
        // Check cost
        if (player.gold < this.config.gemSocketCost) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'socketing_failed',
                reason: 'insufficient_gold',
                message: `Você precisa de ${this.config.gemSocketCost} gold.`
            });
            return false;
        }
        
        // Socket gem
        player.gold -= this.config.gemSocketCost;
        player.removeFromInventory(gemId, 1);
        
        item.sockets[socketIndex] = {
            id: gemId,
            name: gem.name,
            color: gem.color,
            quality: gem.quality,
            stats: { ...gem.stats },
            socketedAt: Date.now()
        };
        
        // Apply gem stats
        if (gem.stats) {
            if (!item.stats) item.stats = {};
            for (const [stat, value] of Object.entries(gem.stats)) {
                item.stats[stat] = (item.stats[stat] || 0) + value;
            }
        }
        
        // Notify success
        this.worldManager.sendToPlayer(playerId, {
            type: 'socketing_success',
            itemId: itemId,
            gem: {
                id: gemId,
                name: gem.name,
                socketIndex: socketIndex
            },
            message: `${gem.name} inserida com sucesso!`
        });
        
        return true;
    }
    
    // Crafting Queue
    addToCraftingQueue(playerId, recipeId, quantity, options) {
        if (!this.craftingQueues.has(playerId)) {
            this.craftingQueues.set(playerId, []);
        }
        
        const queue = this.craftingQueues.get(playerId);
        queue.push({
            recipeId: recipeId,
            quantity: quantity,
            options: options,
            addedAt: Date.now()
        });
        
        this.worldManager.sendToPlayer(playerId, {
            type: 'added_to_queue',
            queueLength: queue.length,
            message: 'Adicionado à fila de criação.'
        });
    }
    
    processCraftingQueue(playerId) {
        const queue = this.craftingQueues.get(playerId);
        if (!queue || queue.length === 0) return;
        
        const nextItem = queue.shift();
        this.startCrafting(playerId, nextItem.recipeId, nextItem.quantity, nextItem.options);
    }
    
    // Update loops
    updateActiveSessions() {
        const now = Date.now();
        
        for (const [playerId, session] of this.activeSessions) {
            const progress = Math.min(100, ((now - session.startTime) / session.duration) * 100);
            
            if (progress !== session.progress) {
                session.progress = progress;
                
                // Send progress update
                this.worldManager.sendToPlayer(playerId, {
                    type: 'crafting_progress',
                    progress: progress
                });
            }
        }
    }
    
    processCraftingQueues() {
        for (const [playerId, queue] of this.craftingQueues) {
            if (!this.activeSessions.has(playerId) && queue.length > 0) {
                this.processCraftingQueue(playerId);
            }
        }
    }
    
    // Utility methods
    getPlayerCraftingData(playerId) {
        if (!this.playerCraftingData.has(playerId)) {
            this.playerCraftingData.set(playerId, {
                knownRecipes: new Set(),
                favoriteRecipes: new Set(),
                craftingHistory: [],
                enchantingHistory: [],
                statistics: {
                    itemsCrafted: 0,
                    itemsEnchanted: 0,
                    masterworks: 0,
                    failures: 0,
                    totalMaterialsUsed: 0
                },
                lastUpdate: Date.now()
            });
        }
        
        return this.playerCraftingData.get(playerId);
    }
    
    formatCraftingResults(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        let message = `${successful.length} itens criados`;
        if (failed.length > 0) {
            message += `, ${failed.length} falharam`;
        }
        
        const masterworks = successful.filter(r => r.masterwork);
        if (masterworks.length > 0) {
            message += ` (${masterworks.length} obras-primas!)`;
        }
        
        return message;
    }
    
    // Event handlers
    onProfessionLevelUp(playerId, professionId, newLevel) {
        // Unlock new recipes based on new level
        const playerData = this.getPlayerCraftingData(playerId);
        
        for (const [recipeId, recipe] of this.recipes) {
            if (recipe.profession === professionId && 
                recipe.requiredLevel <= newLevel &&
                !playerData.knownRecipes.has(recipeId)) {
                
                // Auto-learn some basic recipes
                if (recipe.difficulty === 'easy' && Math.random() < 0.3) {
                    this.learnRecipe(playerId, recipeId);
                }
            }
        }
        
        this.savePlayerCraftingData(playerId);
    }
    
    onCraftingStationInteract(playerId, stationId) {
        const station = this.craftingStations.get(stationId);
        if (!station) return;
        
        // Open crafting interface for this station type
        this.worldManager.sendToPlayer(playerId, {
            type: 'crafting_station_opened',
            station: station,
            availableRecipes: this.getAvailableRecipes(playerId, station.type)
        });
    }
    
    // Database operations
    async savePlayerCraftingData(playerId) {
        try {
            const playerData = this.playerCraftingData.get(playerId);
            if (!playerData) return;
            
            const data = {
                knownRecipes: Array.from(playerData.knownRecipes),
                favoriteRecipes: Array.from(playerData.favoriteRecipes),
                craftingHistory: playerData.craftingHistory,
                enchantingHistory: playerData.enchantingHistory,
                statistics: playerData.statistics,
                lastUpdate: Date.now()
            };
            
            await this.database.set(`player_crafting_data_${playerId}`, data);
            
            // Also save to global collection
            const globalData = await this.database.get('player_crafting_data') || {};
            globalData[playerId] = data;
            await this.database.set('player_crafting_data', globalData);
            
        } catch (error) {
            console.error(`Error saving crafting data for player ${playerId}:`, error);
        }
    }
    
    async saveCraftingStatistics() {
        try {
            await this.database.set('crafting_statistics', this.craftingStats);
        } catch (error) {
            console.error('Error saving crafting statistics:', error);
        }
    }
    
    // Public API
    getRecipeInfo(recipeId) {
        return this.recipes.get(recipeId);
    }
    
    getAllRecipes() {
        return Array.from(this.recipes.values());
    }
    
    getCraftingStationInfo(stationId) {
        return this.craftingStations.get(stationId);
    }
    
    getEnchantmentInfo(enchantmentId) {
        return this.enchantments.get(enchantmentId);
    }
    
    getGemInfo(gemId) {
        return this.gems.get(gemId);
    }
    
    getCraftingStatistics() {
        return this.craftingStats;
    }
    
    interruptCrafting(playerId) {
        const session = this.activeSessions.get(playerId);
        if (session) {
            session.interrupted = true;
            this.activeSessions.delete(playerId);
            
            this.worldManager.sendToPlayer(playerId, {
                type: 'crafting_interrupted',
                message: 'Criação interrompida.'
            });
            
            return true;
        }
        return false;
    }
    
    // Cleanup
    cleanup() {
        this.activeSessions.clear();
        this.craftingQueues.clear();
        this.playerCraftingData.clear();
        this.recipes.clear();
        this.craftingStations.clear();
        this.itemTemplates.clear();
        this.enchantments.clear();
        this.gems.clear();
    }
}

export default CraftingSystem;
