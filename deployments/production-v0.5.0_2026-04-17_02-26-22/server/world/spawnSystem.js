/**
 * Spawn System - Biome-based Entity Spawning
 * Manages mob spawning, rare spawns, and respawn timers
 * Version 0.3 - First Playable Gameplay Systems
 */

class SpawnSystem {
    constructor(worldManager) {
        this.worldManager = worldManager;
        this.database = worldManager.server.database;
        
        // Spawn configuration
        this.config = {
            maxMonstersPerRegion: 50,
            maxNPCsPerRegion: 20,
            maxResourcesPerRegion: 100,
            maxItemsPerRegion: 30,
            
            spawnCheckInterval: 30000, // 30 seconds
            respawnInterval: 60000, // 1 minute
            rareSpawnChance: 0.05, // 5%
            bossSpawnChance: 0.01, // 1%
            
            // Spawn radius settings
            playerSpawnRadius: 200,
            resourceSpawnRadius: 50,
            monsterSpawnRadius: 100,
            
            // Density settings
            monsterDensity: {
                plains: 0.8,
                forest: 1.2,
                mountain: 0.6,
                desert: 0.4,
                swamp: 1.0,
                frozen: 0.3,
                volcanic: 0.2,
                darklands: 1.5
            },
            
            resourceDensity: {
                plains: 1.0,
                forest: 1.5,
                mountain: 1.2,
                desert: 0.3,
                swamp: 0.8,
                frozen: 0.5,
                volcanic: 0.4,
                darklands: 0.2
            }
        };
        
        // Spawn templates
        this.monsterTemplates = new Map();
        this.npcTemplates = new Map();
        this.resourceTemplates = new Map();
        this.rareSpawnTemplates = new Map();
        this.bossTemplates = new Map();
        
        // Spawn tracking
        this.spawnHistory = new Map();
        this.rareSpawnCooldowns = new Map();
        this.bossSpawnCooldowns = new Map();
        this.lastSpawnCheck = new Map();
        
        // Regional spawn data
        this.regionalSpawnData = new Map();
        
        // Initialize
        this.initialize();
    }
    
    async initialize() {
        // Load spawn templates
        await this.loadSpawnTemplates();
        
        // Load spawn history
        await this.loadSpawnHistory();
        
        // Setup spawn loops
        this.setupSpawnLoops();
        
        console.log('Spawn System initialized');
    }
    
    async loadSpawnTemplates() {
        // Monster templates
        this.monsterTemplates.set('goblin', {
            name: 'Goblin',
            level: { min: 1, max: 5 },
            health: { min: 50, max: 80 },
            attack: { min: 5, max: 10 },
            defense: { min: 2, max: 5 },
            speed: 1.0,
            aggroRadius: 30,
            respawnTime: 45000,
            experience: { min: 20, max: 40 },
            gold: { min: 5, max: 15 },
            loot: ['cloth', 'rusty_dagger', 'gold'],
            biomes: ['plains', 'forest', 'mountain'],
            spawnWeight: 10,
            behavior: 'aggressive',
            abilities: ['basic_attack'],
            ai: 'basic_melee'
        });
        
        this.monsterTemplates.set('wolf', {
            name: 'Lobo',
            level: { min: 3, max: 8 },
            health: { min: 60, max: 100 },
            attack: { min: 8, max: 15 },
            defense: { min: 3, max: 6 },
            speed: 1.5,
            aggroRadius: 40,
            respawnTime: 50000,
            experience: { min: 30, max: 60 },
            gold: { min: 8, max: 20 },
            loot: ['wolf_pelt', 'wolf_fang', 'meat'],
            biomes: ['forest', 'plains', 'mountain'],
            spawnWeight: 8,
            behavior: 'pack_hunter',
            abilities: ['basic_attack', 'bite'],
            ai: 'pack_hunter'
        });
        
        this.monsterTemplates.set('bear', {
            name: 'Urso',
            level: { min: 8, max: 15 },
            health: { min: 120, max: 200 },
            attack: { min: 15, max: 25 },
            defense: { min: 8, max: 12 },
            speed: 1.2,
            aggroRadius: 25,
            respawnTime: 90000,
            experience: { min: 80, max: 150 },
            gold: { min: 20, max: 50 },
            loot: ['bear_pelt', 'bear_claws', 'meat', 'honey'],
            biomes: ['forest', 'mountain'],
            spawnWeight: 3,
            behavior: 'territorial',
            abilities: ['basic_attack', 'claw_swipe', 'roar'],
            ai: 'territorial'
        });
        
        this.monsterTemplates.set('orc', {
            name: 'Orc',
            level: { min: 10, max: 20 },
            health: { min: 150, max: 250 },
            attack: { min: 20, max: 35 },
            defense: { min: 10, max: 15 },
            speed: 1.0,
            aggroRadius: 35,
            respawnTime: 70000,
            experience: { min: 100, max: 200 },
            gold: { min: 30, max: 80 },
            loot: ['iron_ore', 'orc_axe', 'leather_armor'],
            biomes: ['mountain', 'plains'],
            spawnWeight: 5,
            behavior: 'aggressive',
            abilities: ['basic_attack', 'power_strike'],
            ai: 'aggressive_melee'
        });
        
        this.monsterTemplates.set('spider', {
            name: 'Aranha',
            level: { min: 5, max: 12 },
            health: { min: 40, max: 80 },
            attack: { min: 10, max: 18 },
            defense: { min: 2, max: 4 },
            speed: 1.8,
            aggroRadius: 20,
            respawnTime: 40000,
            experience: { min: 40, max: 80 },
            gold: { min: 10, max: 25 },
            loot: ['spider_silk', 'venom', 'legs'],
            biomes: ['forest', 'swamp', 'darklands'],
            spawnWeight: 12,
            behavior: 'ambusher',
            abilities: ['basic_attack', 'poison_bite', 'web'],
            ai: 'ambusher'
        });
        
        this.monsterTemplates.set('troll', {
            name: 'Troll',
            level: { min: 15, max: 25 },
            health: { min: 300, max: 500 },
            attack: { min: 25, max: 40 },
            defense: { min: 15, max: 20 },
            speed: 0.8,
            aggroRadius: 30,
            respawnTime: 120000,
            experience: { min: 200, max: 400 },
            gold: { min: 50, max: 150 },
            loot: ['troll_blood', 'rare_gems', 'magic_essence'],
            biomes: ['mountain', 'swamp'],
            spawnWeight: 2,
            behavior: 'regenerator',
            abilities: ['basic_attack', 'regenerate', 'rock_throw'],
            ai: 'regenerator'
        });
        
        // Rare spawn templates
        this.rareSpawnTemplates.set('golden_wolf', {
            name: 'Lobo Dourado',
            baseTemplate: 'wolf',
            levelMultiplier: 1.5,
            healthMultiplier: 2.0,
            attackMultiplier: 1.8,
            experienceMultiplier: 3.0,
            goldMultiplier: 5.0,
            specialLoot: ['golden_pelt', 'lucky_charm'],
            spawnChance: 0.02,
            respawnTime: 600000, // 10 minutes
            announcement: 'Um Lobo Dourado raro apareceu na região!'
        });
        
        this.rareSpawnTemplates.set('shadow_assassin', {
            name: 'Assassino Sombrio',
            baseTemplate: 'orc',
            levelMultiplier: 1.8,
            healthMultiplier: 1.5,
            attackMultiplier: 2.2,
            experienceMultiplier: 4.0,
            goldMultiplier: 8.0,
            specialLoot: ['shadow_dagger', 'assassin_mask'],
            spawnChance: 0.015,
            respawnTime: 900000, // 15 minutes
            announcement: 'Um Assassino Sombrio mortal foi avistado!'
        });
        
        this.rareSpawnTemplates.set('crystal_golem', {
            name: 'Golem de Cristal',
            baseTemplate: 'troll',
            levelMultiplier: 2.0,
            healthMultiplier: 3.0,
            attackMultiplier: 1.5,
            experienceMultiplier: 5.0,
            goldMultiplier: 10.0,
            specialLoot: ['crystal_core', 'golem_shard'],
            spawnChance: 0.01,
            respawnTime: 1800000, // 30 minutes
            announcement: 'Um Golem de Cristal lendário emergiu!'
        });
        
        // Boss templates
        this.bossTemplates.set('dragon_whelp', {
            name: 'Filhote de Dragão',
            level: { min: 20, max: 30 },
            health: { min: 1000, max: 1500 },
            attack: { min: 50, max: 80 },
            defense: { min: 25, max: 35 },
            speed: 2.0,
            aggroRadius: 100,
            respawnTime: 3600000, // 1 hour
            experience: { min: 1000, max: 2000 },
            gold: { min: 500, max: 1500 },
            loot: ['dragon_scale', 'dragon_blood', 'dragon_essence', 'rare_gem'],
            biomes: ['mountain', 'volcanic'],
            spawnWeight: 1,
            behavior: 'boss',
            abilities: ['fire_breath', 'tail_swipe', 'wing_attack', 'roar'],
            ai: 'boss_dragon',
            phases: 2,
            announcement: '⚠️ Um Filhote de Dragão apareceu! Reúna seu grupo!'
        });
        
        this.bossTemplates.set('demon_lord', {
            name: 'Lorde Demônio',
            level: { min: 25, max: 40 },
            health: { min: 2000, max: 3000 },
            attack: { min: 80, max: 120 },
            defense: { min: 40, max: 60 },
            speed: 1.5,
            aggroRadius: 150,
            respawnTime: 7200000, // 2 hours
            experience: { min: 2000, max: 4000 },
            gold: { min: 1000, max: 3000 },
            loot: ['demon_soul', 'infernal_sword', 'dark_armor', 'cursed_gem'],
            biomes: ['darklands', 'volcanic'],
            spawnWeight: 1,
            behavior: 'boss',
            abilities: ['hellfire', 'shadow_bolt', 'summon_minions', 'life_drain'],
            ai: 'boss_demon',
            phases: 3,
            announcement: '⚠️ O Lorde Demônio invadiu este realm! Cuidado!'
        });
        
        // Resource templates
        this.resourceTemplates.set('herbs', {
            name: 'Ervas',
            type: 'herbs',
            amount: { min: 1, max: 3 },
            respawnTime: 300000, // 5 minutes
            requiredSkill: 'herbalism',
            requiredLevel: 1,
            toolRequired: null,
            harvestYield: ['healing_herb', 'mana_herb', 'rare_herb'],
            biomes: ['plains', 'forest', 'swamp'],
            spawnWeight: 15,
            clusterSize: { min: 2, max: 5 },
            spawnRadius: 20
        });
        
        this.resourceTemplates.set('wood', {
            name: 'Madeira',
            type: 'wood',
            amount: { min: 5, max: 15 },
            respawnTime: 600000, // 10 minutes
            requiredSkill: 'woodcutting',
            requiredLevel: 1,
            toolRequired: 'axe',
            harvestYield: ['wood', 'rare_wood'],
            biomes: ['forest', 'plains'],
            spawnWeight: 12,
            clusterSize: { min: 3, max: 8 },
            spawnRadius: 30
        });
        
        this.resourceTemplates.set('stone', {
            name: 'Pedra',
            type: 'stone',
            amount: { min: 10, max: 25 },
            respawnTime: 450000, // 7.5 minutes
            requiredSkill: 'mining',
            requiredLevel: 1,
            toolRequired: 'pickaxe',
            harvestYield: ['stone', 'iron_ore', 'coal'],
            biomes: ['mountain', 'plains'],
            spawnWeight: 10,
            clusterSize: { min: 4, max: 10 },
            spawnRadius: 25
        });
        
        this.resourceTemplates.set('iron_ore', {
            name: 'Minério de Ferro',
            type: 'ore',
            amount: { min: 3, max: 8 },
            respawnTime: 900000, // 15 minutes
            requiredSkill: 'mining',
            requiredLevel: 5,
            toolRequired: 'pickaxe',
            harvestYield: ['iron_ore', 'copper_ore'],
            biomes: ['mountain'],
            spawnWeight: 6,
            clusterSize: { min: 2, max: 6 },
            spawnRadius: 15
        });
        
        this.resourceTemplates.set('rare_crystals', {
            name: 'Cristais Raros',
            type: 'crystal',
            amount: { min: 1, max: 2 },
            respawnTime: 1800000, // 30 minutes
            requiredSkill: 'mining',
            requiredLevel: 15,
            toolRequired: 'pickaxe',
            harvestYield: ['magic_crystal', 'rare_gem'],
            biomes: ['mountain', 'volcanic', 'darklands'],
            spawnWeight: 2,
            clusterSize: { min: 1, max: 3 },
            spawnRadius: 10
        });
        
        // NPC templates
        this.npcTemplates.set('merchant', {
            name: 'Mercador',
            type: 'merchant',
            behavior: 'shopkeeper',
            dialogue: {
                greeting: 'Olá, viajante! Tenho itens excelentes para você.',
                farewell: 'Volte sempre!',
                noMoney: 'Você não tem dinheiro suficiente.',
                soldOut: 'Infelizmente estou sem estoque deste item.'
            },
            shop: {
                buyRate: 0.7,
                sellRate: 1.3,
                inventory: ['health_potion', 'mana_potion', 'basic_sword', 'leather_armor']
            },
            respawnTime: 0, // NPCs don't respawn
            biomes: ['plains', 'forest', 'mountain'],
            spawnWeight: 5
        });
        
        this.npcTemplates.set('guard', {
            name: 'Guarda',
            type: 'guard',
            behavior: 'patrol',
            dialogue: {
                greeting: 'Estado de alerta. Mantenha-se seguro.',
                warning: 'Cuidado com os monstros nas redondezas.',
                threat: 'Pare! Você não pode passar!'
            },
            patrol: {
                route: [],
                speed: 0.8,
                alertRadius: 50
            },
            respawnTime: 0,
            biomes: ['plains', 'forest', 'mountain'],
            spawnWeight: 8
        });
        
        this.npcTemplates.set('quest_giver', {
            name: 'Ancião',
            type: 'quest_giver',
            behavior: 'static',
            dialogue: {
                greeting: 'Bem-vindo, jovem aventureiro.',
                quest: 'Tenho uma tarefa importante para você.',
                thanks: 'Muito obrigado por sua ajuda!'
            },
            quests: ['starter_quest', 'collection_quest', 'exploration_quest'],
            respawnTime: 0,
            biomes: ['plains', 'forest'],
            spawnWeight: 3
        });
    }
    
    async loadSpawnHistory() {
        try {
            const history = await this.database.get('spawn_history');
            if (history) {
                this.spawnHistory = new Map(Object.entries(history));
            }
            
            const cooldowns = await this.database.get('spawn_cooldowns');
            if (cooldowns) {
                this.rareSpawnCooldowns = new Map(Object.entries(cooldowns.rare || {}));
                this.bossSpawnCooldowns = new Map(Object.entries(cooldowns.boss || {}));
            }
        } catch (error) {
            console.error('Error loading spawn history:', error);
        }
    }
    
    setupSpawnLoops() {
        // Main spawn check loop
        setInterval(() => {
            this.checkAllRegionSpawns();
        }, this.config.spawnCheckInterval);
        
        // Respawn check loop
        setInterval(() => {
            this.checkRespawns();
        }, this.config.respawnInterval);
        
        // Rare spawn check loop
        setInterval(() => {
            this.checkRareSpawns();
        }, 300000); // Check every 5 minutes
        
        // Boss spawn check loop
        setInterval(() => {
            this.checkBossSpawns();
        }, 600000); // Check every 10 minutes
    }
    
    // Main spawn management
    checkAllRegionSpawns() {
        const now = Date.now();
        
        for (const [regionId, region] of this.worldManager.regions) {
            if (!region.loaded) continue;
            
            // Check if it's time to spawn in this region
            const lastCheck = this.lastSpawnCheck.get(regionId) || 0;
            if (now - lastCheck < this.config.spawnCheckInterval) continue;
            
            this.lastSpawnCheck.set(regionId, now);
            this.checkRegionSpawns(regionId);
        }
    }
    
    checkRegionSpawns(regionId) {
        const region = this.worldManager.regions.get(regionId);
        if (!region) return;
        
        // Get regional spawn data
        const spawnData = this.getRegionalSpawnData(regionId);
        
        // Check monster spawns
        this.checkMonsterSpawns(regionId, spawnData);
        
        // Check resource spawns
        this.checkResourceSpawns(regionId, spawnData);
        
        // Check NPC spawns (only on region load)
        if (region.npcs.size === 0) {
            this.checkNPCSpawns(regionId, spawnData);
        }
    }
    
    checkMonsterSpawns(regionId, spawnData) {
        const region = this.worldManager.regions.get(regionId);
        if (!region) return;
        
        const currentMonsters = region.monsters.size;
        const maxMonsters = Math.floor(this.config.maxMonstersPerRegion * spawnData.densityMultiplier);
        
        if (currentMonsters >= maxMonsters) return;
        
        const monstersToSpawn = Math.min(3, maxMonsters - currentMonsters);
        
        for (let i = 0; i < monstersToSpawn; i++) {
            const monsterType = this.selectMonsterSpawn(region, spawnData);
            if (monsterType) {
                const position = this.findSpawnPosition(region, 'monster', monsterType);
                if (position) {
                    this.worldManager.spawnMonster(regionId, monsterType, position.x, position.y);
                }
            }
        }
    }
    
    checkResourceSpawns(regionId, spawnData) {
        const region = this.worldManager.regions.get(regionId);
        if (!region) return;
        
        const currentResources = region.resources.size;
        const maxResources = Math.floor(this.config.maxResourcesPerRegion * spawnData.resourceDensityMultiplier);
        
        if (currentResources >= maxResources) return;
        
        const resourcesToSpawn = Math.min(5, maxResources - currentResources);
        
        for (let i = 0; i < resourcesToSpawn; i++) {
            const resourceType = this.selectResourceSpawn(region, spawnData);
            if (resourceType) {
                const positions = this.findResourceClusterPositions(region, resourceType);
                for (const pos of positions) {
                    this.worldManager.spawnResource(regionId, resourceType, pos.x, pos.y);
                }
            }
        }
    }
    
    checkNPCSpawns(regionId, spawnData) {
        const region = this.worldManager.regions.get(regionId);
        if (!region) return;
        
        // Spawn NPCs based on region configuration
        for (const npcType of region.npcs) {
            const template = this.npcTemplates.get(npcType);
            if (!template) continue;
            
            // Check if NPC already exists
            let npcExists = false;
            for (const npc of region.npcs.values()) {
                if (npc.type === npcType) {
                    npcExists = true;
                    break;
                }
            }
            
            if (!npcExists) {
                const position = this.findSpawnPosition(region, 'npc', npcType);
                if (position) {
                    this.worldManager.spawnNPC(regionId, npcType, position.x, position.y);
                }
            }
        }
    }
    
    checkRespawns() {
        const now = Date.now();
        
        for (const [regionId, region] of this.worldManager.regions) {
            if (!region.loaded) continue;
            
            // Check monster respawns
            for (const [monsterId, monster] of region.monsters) {
                if (monster.lastDeath && (now - monster.lastDeath) >= monster.respawnTime) {
                    // Respawn monster
                    const position = this.findSpawnPosition(region, 'monster', monster.type);
                    if (position) {
                        // Remove dead monster and spawn new one
                        region.monsters.delete(monsterId);
                        this.worldManager.spawnMonster(regionId, monster.type, position.x, position.y);
                    }
                }
            }
            
            // Check resource respawns
            for (const [resourceId, resource] of region.resources) {
                if (resource.lastHarvested && (now - resource.lastHarvested) >= resource.respawnTime) {
                    // Respawn resource
                    resource.amount = resource.maxAmount;
                    resource.lastHarvested = null;
                    
                    // Notify players
                    this.worldManager.notifyRegionPlayers(regionId, {
                        type: 'resource_respawned',
                        resource: this.worldManager.getResourceDataForClient(resource)
                    });
                }
            }
        }
    }
    
    checkRareSpawns() {
        const now = Date.now();
        
        for (const [regionId, region] of this.worldManager.regions) {
            if (!region.loaded || region.players.size === 0) continue;
            
            // Check cooldown
            const cooldown = this.rareSpawnCooldowns.get(regionId);
            if (cooldown && (now - cooldown) < 600000) continue; // 10 minute cooldown
            
            // Check spawn chance
            if (Math.random() > this.config.rareSpawnChance) continue;
            
            // Select rare spawn
            const rareType = this.selectRareSpawn(region);
            if (rareType) {
                const position = this.findSpawnPosition(region, 'monster', rareType);
                if (position) {
                    this.spawnRareMonster(regionId, rareType, position.x, position.y);
                    this.rareSpawnCooldowns.set(regionId, now);
                }
            }
        }
    }
    
    checkBossSpawns() {
        const now = Date.now();
        
        for (const [regionId, region] of this.worldManager.regions) {
            if (!region.loaded || region.players.size < 3) continue; // Need at least 3 players
            
            // Check cooldown
            const cooldown = this.bossSpawnCooldowns.get(regionId);
            if (cooldown && (now - cooldown) < 3600000) continue; // 1 hour cooldown
            
            // Check spawn chance
            if (Math.random() > this.config.bossSpawnChance) continue;
            
            // Select boss
            const bossType = this.selectBossSpawn(region);
            if (bossType) {
                const position = this.findSpawnPosition(region, 'boss', bossType);
                if (position) {
                    this.spawnBossMonster(regionId, bossType, position.x, position.y);
                    this.bossSpawnCooldowns.set(regionId, now);
                }
            }
        }
    }
    
    // Spawn selection methods
    selectMonsterSpawn(region, spawnData) {
        const availableMonsters = [];
        
        for (const [monsterType, template] of this.monsterTemplates) {
            if (!this.canSpawnInBiome(template, region.type)) continue;
            if (!this.isLevelAppropriate(template, region)) continue;
            
            availableMonsters.push({
                type: monsterType,
                weight: template.spawnWeight * spawnData.biomeModifiers[monsterType] || 1
            });
        }
        
        if (availableMonsters.length === 0) return null;
        
        return this.weightedRandom(availableMonsters);
    }
    
    selectResourceSpawn(region, spawnData) {
        const availableResources = [];
        
        for (const [resourceType, template] of this.resourceTemplates) {
            if (!this.canSpawnInBiome(template, region.type)) continue;
            
            availableResources.push({
                type: resourceType,
                weight: template.spawnWeight * spawnData.resourceBiomeModifiers[resourceType] || 1
            });
        }
        
        if (availableResources.length === 0) return null;
        
        return this.weightedRandom(availableResources);
    }
    
    selectRareSpawn(region) {
        const availableRares = [];
        
        for (const [rareType, template] of this.rareSpawnTemplates) {
            const baseTemplate = this.monsterTemplates.get(template.baseTemplate);
            if (!baseTemplate) continue;
            if (!this.canSpawnInBiome(baseTemplate, region.type)) continue;
            if (!this.isLevelAppropriate(baseTemplate, region, true)) continue;
            
            if (Math.random() < template.spawnChance) {
                availableRares.push(rareType);
            }
        }
        
        return availableRares.length > 0 ? 
            availableRares[Math.floor(Math.random() * availableRares.length)] : null;
    }
    
    selectBossSpawn(region) {
        const availableBosses = [];
        
        for (const [bossType, template] of this.bossTemplates) {
            if (!this.canSpawnInBiome(template, region.type)) continue;
            if (!this.isLevelAppropriate(template, region, true)) continue;
            
            availableBosses.push(bossType);
        }
        
        return availableBosses.length > 0 ? 
            availableBosses[Math.floor(Math.random() * availableBosses.length)] : null;
    }
    
    // Position finding
    findSpawnPosition(region, entityType, entityTemplate) {
        const maxAttempts = 50;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            let x, y;
            
            if (entityType === 'npc' || entityType === 'boss') {
                // NPCs and bosses spawn at predefined locations
                const poi = region.poi.find(p => p.type === 'town' || p.type === 'dungeon');
                if (poi) {
                    x = poi.x + (Math.random() - 0.5) * 20;
                    y = poi.y + (Math.random() - 0.5) * 20;
                } else {
                    x = region.bounds.x + region.bounds.width / 2;
                    y = region.bounds.y + region.bounds.height / 2;
                }
            } else {
                // Random spawn within region bounds
                x = region.bounds.x + Math.random() * region.bounds.width;
                y = region.bounds.y + Math.random() * region.bounds.height;
            }
            
            // Check if position is valid
            if (this.isValidSpawnPosition(region, x, y, entityType)) {
                return { x, y };
            }
        }
        
        return null;
    }
    
    findResourceClusterPositions(region, resourceType) {
        const template = this.resourceTemplates.get(resourceType);
        if (!template) return [];
        
        const positions = [];
        const clusterSize = template.clusterSize;
        const spawnRadius = template.spawnRadius;
        
        // Find center position
        const center = this.findSpawnPosition(region, 'resource', resourceType);
        if (!center) return positions;
        
        // Generate cluster around center
        for (let i = 0; i < clusterSize; i++) {
            const angle = (Math.PI * 2 * i) / clusterSize;
            const distance = Math.random() * spawnRadius;
            
            const x = center.x + Math.cos(angle) * distance;
            const y = center.y + Math.sin(angle) * distance;
            
            if (this.isValidSpawnPosition(region, x, y, 'resource')) {
                positions.push({ x, y });
            }
        }
        
        return positions;
    }
    
    isValidSpawnPosition(region, x, y, entityType) {
        // Check if position is within region bounds
        if (x < region.bounds.x || x > region.bounds.x + region.bounds.width ||
            y < region.bounds.y || y > region.bounds.y + region.bounds.height) {
            return false;
        }
        
        // Check distance from players
        const minPlayerDistance = entityType === 'boss' ? 100 : 50;
        for (const playerId of region.players) {
            const player = this.worldManager.connectedPlayers.get(playerId);
            if (player) {
                const distance = Math.sqrt(Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2));
                if (distance < minPlayerDistance) {
                    return false;
                }
            }
        }
        
        // Check distance from other entities
        const minEntityDistance = entityType === 'resource' ? 5 : 10;
        
        // Check monsters
        for (const monster of region.monsters.values()) {
            const distance = Math.sqrt(Math.pow(monster.x - x, 2) + Math.pow(monster.y - y, 2));
            if (distance < minEntityDistance) {
                return false;
            }
        }
        
        // Check NPCs
        for (const npc of region.npcs.values()) {
            const distance = Math.sqrt(Math.pow(npc.x - x, 2) + Math.pow(npc.y - y, 2));
            if (distance < minEntityDistance) {
                return false;
            }
        }
        
        // Check resources
        for (const resource of region.resources.values()) {
            const distance = Math.sqrt(Math.pow(resource.x - x, 2) + Math.pow(resource.y - y, 2));
            if (distance < minEntityDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    // Special spawn methods
    spawnRareMonster(regionId, rareType, x, y) {
        const rareTemplate = this.rareSpawnTemplates.get(rareType);
        const baseTemplate = this.monsterTemplates.get(rareTemplate.baseTemplate);
        
        if (!rareTemplate || !baseTemplate) return null;
        
        // Create enhanced monster
        const monsterData = this.createEnhancedMonster(baseTemplate, rareTemplate, x, y);
        
        // Spawn the monster
        const monsterId = this.worldManager.spawnMonster(regionId, rareTemplate.baseTemplate, x, y);
        
        if (monsterId) {
            const region = this.worldManager.regions.get(regionId);
            const monster = region.monsters.get(monsterId);
            
            if (monster) {
                // Apply enhancements
                Object.assign(monster, monsterData);
                monster.isRare = true;
                monster.rareType = rareType;
                
                // Announce rare spawn
                this.announceRareSpawn(regionId, rareType, monster);
            }
        }
        
        return monsterId;
    }
    
    spawnBossMonster(regionId, bossType, x, y) {
        const bossTemplate = this.bossTemplates.get(bossType);
        if (!bossTemplate) return null;
        
        // Spawn the boss
        const monsterId = this.worldManager.spawnMonster(regionId, bossType, x, y);
        
        if (monsterId) {
            const region = this.worldManager.regions.get(regionId);
            const monster = region.monsters.get(monsterId);
            
            if (monster) {
                // Apply boss properties
                Object.assign(monster, bossTemplate);
                monster.isBoss = true;
                monster.bossType = bossType;
                monster.currentPhase = 1;
                
                // Announce boss spawn
                this.announceBossSpawn(regionId, bossType, monster);
            }
        }
        
        return monsterId;
    }
    
    createEnhancedMonster(baseTemplate, rareTemplate, x, y) {
        return {
            x: x,
            y: y,
            level: Math.floor(baseTemplate.level.min * rareTemplate.levelMultiplier),
            health: Math.floor(baseTemplate.health.max * rareTemplate.healthMultiplier),
            maxHealth: Math.floor(baseTemplate.health.max * rareTemplate.healthMultiplier),
            attack: Math.floor(baseTemplate.attack.max * rareTemplate.attackMultiplier),
            defense: Math.floor(baseTemplate.defense.max * 1.5),
            experience: Math.floor(baseTemplate.experience.max * rareTemplate.experienceMultiplier),
            gold: Math.floor(baseTemplate.gold.max * rareTemplate.goldMultiplier),
            loot: [...baseTemplate.loot, ...rareTemplate.specialLoot],
            respawnTime: rareTemplate.respawnTime,
            abilities: [...baseTemplate.abilities, 'rare_ability'],
            ai: 'enhanced_' + baseTemplate.ai
        };
    }
    
    announceRareSpawn(regionId, rareType, monster) {
        const template = this.rareSpawnTemplates.get(rareType);
        const announcement = template.announcement || `Um ${monster.name} raro apareceu!`;
        
        this.worldManager.notifyRegionPlayers(regionId, {
            type: 'rare_spawn_announcement',
            message: announcement,
            monster: this.worldManager.getMonsterDataForClient(monster),
            position: { x: monster.x, y: monster.y }
        });
        
        console.log(`Rare spawn announcement in ${regionId}: ${announcement}`);
    }
    
    announceBossSpawn(regionId, bossType, monster) {
        const template = this.bossTemplates.get(bossType);
        const announcement = template.announcement || `⚠️ Um ${monster.name} apareceu!`;
        
        // Announce to all regions
        for (const [id, region] of this.worldManager.regions) {
            if (region.loaded) {
                this.worldManager.notifyRegionPlayers(id, {
                    type: 'boss_spawn_announcement',
                    message: announcement,
                    monster: this.worldManager.getMonsterDataForClient(monster),
                    regionId: regionId,
                    position: { x: monster.x, y: monster.y }
                });
            }
        }
        
        console.log(`Boss spawn announcement: ${announcement}`);
    }
    
    // Utility methods
    getRegionalSpawnData(regionId) {
        if (this.regionalSpawnData.has(regionId)) {
            return this.regionalSpawnData.get(regionId);
        }
        
        const region = this.worldManager.regions.get(regionId);
        if (!region) return this.getDefaultSpawnData();
        
        const data = {
            densityMultiplier: this.config.monsterDensity[region.type] || 1.0,
            resourceDensityMultiplier: this.config.resourceDensity[region.type] || 1.0,
            biomeModifiers: {},
            resourceBiomeModifiers: {},
            lastSpawnTime: Date.now()
        };
        
        // Calculate biome modifiers for monsters
        for (const [monsterType, template] of this.monsterTemplates) {
            let modifier = 1.0;
            
            if (template.biomes.includes(region.type)) {
                modifier = 1.5; // 50% more likely in native biome
            }
            
            data.biomeModifiers[monsterType] = modifier;
        }
        
        // Calculate biome modifiers for resources
        for (const [resourceType, template] of this.resourceTemplates) {
            let modifier = 1.0;
            
            if (template.biomes.includes(region.type)) {
                modifier = 2.0; // 100% more likely in native biome
            }
            
            data.resourceBiomeModifiers[resourceType] = modifier;
        }
        
        this.regionalSpawnData.set(regionId, data);
        return data;
    }
    
    getDefaultSpawnData() {
        return {
            densityMultiplier: 1.0,
            resourceDensityMultiplier: 1.0,
            biomeModifiers: {},
            resourceBiomeModifiers: {},
            lastSpawnTime: Date.now()
        };
    }
    
    canSpawnInBiome(template, biome) {
        return template.biomes.includes(biome);
    }
    
    isLevelAppropriate(template, region, isRare = false) {
        if (isRare) {
            // Rare spawns can be higher level
            return template.level.min <= region.levelRange.max + 10;
        }
        
        return template.level.min <= region.levelRange.max && 
               template.level.max >= region.levelRange.min;
    }
    
    weightedRandom(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item.type;
            }
        }
        
        return items[0].type;
    }
    
    // Public API
    forceSpawn(regionId, entityType, entityTemplate, x = null, y = null) {
        const region = this.worldManager.regions.get(regionId);
        if (!region) return null;
        
        if (!x || !y) {
            const position = this.findSpawnPosition(region, entityType, entityTemplate);
            if (!position) return null;
            x = position.x;
            y = position.y;
        }
        
        switch (entityType) {
            case 'monster':
                return this.worldManager.spawnMonster(regionId, entityTemplate, x, y);
            case 'npc':
                return this.worldManager.spawnNPC(regionId, entityTemplate, x, y);
            case 'resource':
                return this.worldManager.spawnResource(regionId, entityTemplate, x, y);
            case 'item':
                return this.worldManager.spawnItem(regionId, entityTemplate, x, y);
            default:
                return null;
        }
    }
    
    getSpawnStatistics(regionId) {
        const region = this.worldManager.regions.get(regionId);
        if (!region) return null;
        
        return {
            monsters: region.monsters.size,
            npcs: region.npcs.size,
            resources: region.resources.size,
            items: region.items.size,
            players: region.players.size,
            lastSpawnCheck: this.lastSpawnCheck.get(regionId) || 0
        };
    }
    
    async saveSpawnData() {
        try {
            const data = {
                spawnHistory: Object.fromEntries(this.spawnHistory),
                cooldowns: {
                    rare: Object.fromEntries(this.rareSpawnCooldowns),
                    boss: Object.fromEntries(this.bossSpawnCooldowns)
                }
            };
            
            await this.database.set('spawn_history', data.spawnHistory);
            await this.database.set('spawn_cooldowns', data.cooldowns);
        } catch (error) {
            console.error('Error saving spawn data:', error);
        }
    }
    
    // Cleanup
    cleanup() {
        this.spawnHistory.clear();
        this.rareSpawnCooldowns.clear();
        this.bossSpawnCooldowns.clear();
        this.regionalSpawnData.clear();
    }
}

module.exports = SpawnSystem;
