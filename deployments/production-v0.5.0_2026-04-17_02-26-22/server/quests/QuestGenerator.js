/**
 * Procedural Quest Generator - Server-side
 * Generates dynamic quests using templates and parameters
 * Version 0.2.1 - Quest System Integration
 */

class QuestGenerator {
    constructor(database, worldGenerator) {
        this.database = database;
        this.worldGenerator = worldGenerator;
        
        // Quest templates
        this.templates = new Map();
        this.questChains = new Map();
        
        // Generation parameters
        this.generationSettings = {
            difficultyScaling: true,
            levelScaling: true,
            biomeSpecific: true,
            timeBased: true,
            playerProgression: true
        };
        
        // Quest pools
        this.questPools = {
            kill: [],
            collect: [],
            explore: [],
            boss: [],
            craft: [],
            delivery: [],
            escort: []
        };
        
        // Initialize
        this.initializeTemplates();
        this.initializeQuestChains();
        this.initializeQuestPools();
    }
    
    initializeTemplates() {
        // Kill quest templates
        this.addTemplate('kill_goblins', {
            type: 'kill',
            title: 'Ameaça Goblin',
            description: 'Os goblins estão assolando a área. Elimine a ameaça antes que ela se espalhe.',
            objectives: [
                { type: 'kill', target: 'goblin', amount: { min: 8, max: 15 } }
            ],
            rewards: {
                xp: { base: 100, scaling: 1.5 },
                gold: { base: 30, scaling: 1.2 },
                items: ['goblin_ear', 'rusty_dagger']
            },
            requirements: {
                level: { min: 1, max: 20 },
                biome: ['plains', 'forest']
            },
            difficulty: 1,
            timeLimit: 3600000, // 1 hour
            priority: 1
        });
        
        this.addTemplate('kill_wolves', {
            type: 'kill',
            title: 'Caça aos Lobos',
            description: 'Lobos selvagens estão atacando viajantes. Reduza a população para garantir a segurança.',
            objectives: [
                { type: 'kill', target: 'wolf', amount: { min: 6, max: 12 } }
            ],
            rewards: {
                xp: { base: 150, scaling: 1.6 },
                gold: { base: 50, scaling: 1.3 },
                items: ['wolf_pelt', 'wolf_fang']
            },
            requirements: {
                level: { min: 5, max: 30 },
                biome: ['forest', 'mountain']
            },
            difficulty: 2,
            timeLimit: 3600000,
            priority: 2
        });
        
        this.addTemplate('kill_orcs', {
            type: 'kill',
            title: 'Invasão Orc',
            description: 'Uma tribo orc foi vista na região. Derrote-os antes que estabeleçam uma base.',
            objectives: [
                { type: 'kill', target: 'orc', amount: { min: 5, max: 10 } },
                { type: 'kill', target: 'orc_warrior', amount: { min: 2, max: 5 } }
            ],
            rewards: {
                xp: { base: 300, scaling: 1.8 },
                gold: { base: 100, scaling: 1.5 },
                items: ['orc_axe', 'iron_ore']
            },
            requirements: {
                level: { min: 15, max: 50 },
                biome: ['mountain', 'darklands']
            },
            difficulty: 3,
            timeLimit: 7200000, // 2 hours
            priority: 3
        });
        
        // Collect quest templates
        this.addTemplate('collect_herbs', {
            type: 'collect',
            title: 'Coleta de Ervas',
            description: 'O aldeão precisa de ervas medicinais. Colete as plantas na área.',
            objectives: [
                { type: 'collect', target: 'healing_herb', amount: { min: 10, max: 20 } }
            ],
            rewards: {
                xp: { base: 80, scaling: 1.2 },
                gold: { base: 25, scaling: 1.1 },
                items: ['health_potion']
            },
            requirements: {
                level: { min: 1, max: 25 },
                biome: ['plains', 'forest', 'swamp']
            },
            difficulty: 1,
            timeLimit: 3600000,
            priority: 1
        });
        
        this.addTemplate('collect_minerals', {
            type: 'collect',
            title: 'Mineração Valiosa',
            description: 'O ferreiro precisa de minerais para suas ferramentas. Extraia os minerais ricos.',
            objectives: [
                { type: 'collect', target: 'iron_ore', amount: { min: 8, max: 15 } }
            ],
            rewards: {
                xp: { base: 120, scaling: 1.4 },
                gold: { base: 60, scaling: 1.3 },
                items: ['crafting_tools']
            },
            requirements: {
                level: { min: 10, max: 40 },
                biome: ['mountain', 'cave']
            },
            difficulty: 2,
            timeLimit: 3600000,
            priority: 2
        });
        
        // Explore quest templates
        this.addTemplate('explore_area', {
            type: 'explore',
            title: 'Exploração Regional',
            description: 'Mapeie a área desconhecida para o cartógrafo local.',
            objectives: [
                { type: 'explore', target: 'unexplored_area', amount: 1 }
            ],
            rewards: {
                xp: { base: 100, scaling: 1.3 },
                gold: { base: 40, scaling: 1.2 },
                items: ['map_fragment']
            },
            requirements: {
                level: { min: 5, max: 60 },
                biome: null // Any biome
            },
            difficulty: 1,
            timeLimit: 7200000,
            priority: 1
        });
        
        this.addTemplate('find_ruins', {
            type: 'explore',
            title: 'Ruínas Perdidas',
            description: 'Rumores falam de ruínas antigas na área. Encontre e explore o local.',
            objectives: [
                { type: 'explore', target: 'ancient_ruins', amount: 1 },
                { type: 'discover', target: 'artifact', amount: { min: 1, max: 3 } }
            ],
            rewards: {
                xp: { base: 250, scaling: 1.6 },
                gold: { base: 150, scaling: 1.4 },
                items: ['ancient_relic', 'rare_gem']
            },
            requirements: {
                level: { min: 20, max: 80 },
                biome: ['forest', 'mountain', 'desert']
            },
            difficulty: 3,
            timeLimit: 14400000, // 4 hours
            priority: 3
        });
        
        // Boss quest templates
        this.addTemplate('defeat_boss', {
            type: 'boss',
            title: 'Caça ao Chefão',
            description: 'Uma criatura poderosa está aterrorizando a região. Derrote o monstro.',
            objectives: [
                { type: 'kill', target: 'boss_monster', amount: 1 }
            ],
            rewards: {
                xp: { base: 500, scaling: 2.0 },
                gold: { base: 300, scaling: 1.8 },
                items: ['boss_weapon', 'boss_armor', 'rare_material']
            },
            requirements: {
                level: { min: 25, max: 100 },
                biome: null,
                partySize: { min: 2, max: 6 }
            },
            difficulty: 4,
            timeLimit: 14400000,
            priority: 4
        });
        
        // Craft quest templates
        this.addTemplate('craft_items', {
            type: 'craft',
            title: 'Encomenda Especial',
            description: 'Um cliente encomendou itens específicos. Crie os produtos solicitados.',
            objectives: [
                { type: 'craft', target: 'iron_sword', amount: { min: 2, max: 5 } }
            ],
            rewards: {
                xp: { base: 150, scaling: 1.4 },
                gold: { base: 80, scaling: 1.3 },
                items: ['crafting_recipe', 'rare_material']
            },
            requirements: {
                level: { min: 10, max: 50 },
                skill: { type: 'blacksmithing', level: { min: 2, max: 5 } }
            },
            difficulty: 2,
            timeLimit: 7200000,
            priority: 2
        });
        
        // Delivery quest templates
        this.addTemplate('delivery_package', {
            type: 'delivery',
            title: 'Entrega Urgente',
            description: 'Entregue um pacote importante para o destinatário em outra localidade.',
            objectives: [
                { type: 'deliver', target: 'npc_merchant', location: 'town_center', amount: 1 }
            ],
            rewards: {
                xp: { base: 60, scaling: 1.1 },
                gold: { base: 35, scaling: 1.2 },
                items: ['trade_goods']
            },
            requirements: {
                level: { min: 1, max: 30 },
                reputation: { faction: 'merchants', min: 0 }
            },
            difficulty: 1,
            timeLimit: 3600000,
            priority: 1
        });
    }
    
    initializeQuestChains() {
        // Goblin Threat chain
        this.addQuestChain('goblin_threat', [
            'kill_goblins',
            'find_goblin_camp',
            'defeat_goblin_king'
        ]);
        
        // Lost Explorer chain
        this.addQuestChain('lost_explorer', [
            'explore_area',
            'find_ruins',
            'recover_artifacts',
            'return_to_society'
        ]);
        
        // Master Craftsman chain
        this.addQuestChain('master_craftsman', [
            'collect_minerals',
            'craft_items',
            'deliver_masterwork',
            'earn_recognition'
        ]);
    }
    
    initializeQuestPools() {
        // Populate quest pools based on templates
        for (const [templateId, template] of this.templates) {
            if (!this.questPools[template.type]) {
                this.questPools[template.type] = [];
            }
            this.questPools[template.type].push(templateId);
        }
    }
    
    // Template management
    addTemplate(id, template) {
        this.templates.set(id, {
            id,
            ...template,
            createdAt: Date.now()
        });
    }
    
    addQuestChain(chainId, questIds) {
        this.questChains.set(chainId, {
            id: chainId,
            quests: questIds,
            currentStep: 0,
            createdAt: Date.now()
        });
    }
    
    // Quest generation methods
    generateQuest(player, options = {}) {
        const {
            type = null,
            difficulty = null,
            biome = null,
            level = player.level,
            forceTemplate = null
        } = options;
        
        let template;
        
        if (forceTemplate) {
            template = this.templates.get(forceTemplate);
            if (!template) {
                throw new Error(`Template not found: ${forceTemplate}`);
            }
        } else {
            template = this.selectTemplate(player, { type, difficulty, biome, level });
        }
        
        if (!template) {
            return null;
        }
        
        return this.generateQuestFromTemplate(template, player, options);
    }
    
    selectTemplate(player, options) {
        const { type, difficulty, biome, level } = options;
        let candidates = [];
        
        // Filter by type
        if (type) {
            const templateIds = this.questPools[type] || [];
            candidates = templateIds.map(id => this.templates.get(id)).filter(t => t);
        } else {
            candidates = Array.from(this.templates.values());
        }
        
        // Filter by level requirements
        candidates = candidates.filter(template => {
            if (!template.requirements || !template.requirements.level) {
                return true;
            }
            
            const minLevel = template.requirements.level.min || 0;
            const maxLevel = template.requirements.level.max || Infinity;
            
            return level >= minLevel && level <= maxLevel;
        });
        
        // Filter by biome
        if (biome) {
            candidates = candidates.filter(template => {
                if (!template.requirements || !template.requirements.biome) {
                    return true;
                }
                return template.requirements.biome.includes(biome);
            });
        }
        
        // Filter by difficulty
        if (difficulty !== null) {
            candidates = candidates.filter(template => template.difficulty === difficulty);
        }
        
        // Filter by player progression
        candidates = candidates.filter(template => {
            return this.checkPlayerRequirements(player, template.requirements);
        });
        
        if (candidates.length === 0) {
            return null;
        }
        
        // Weighted random selection based on priority and difficulty
        const weights = candidates.map(template => {
            let weight = template.priority || 1;
            
            // Adjust weight based on how well it matches player level
            if (template.requirements && template.requirements.level) {
                const minLevel = template.requirements.level.min || 0;
                const maxLevel = template.requirements.level.max || 100;
                const optimalLevel = (minLevel + maxLevel) / 2;
                const levelDiff = Math.abs(level - optimalLevel);
                weight *= Math.max(0.1, 1 - (levelDiff / 20));
            }
            
            return weight;
        });
        
        return this.weightedRandom(candidates, weights);
    }
    
    generateQuestFromTemplate(template, player, options = {}) {
        const quest = {
            id: this.generateQuestId(),
            templateId: template.id,
            type: template.type,
            title: this.processTemplateText(template.title, player, options),
            description: this.processTemplateText(template.description, player, options),
            objectives: this.generateObjectives(template.objectives, player, options),
            rewards: this.generateRewards(template.rewards, player, options),
            requirements: { ...template.requirements },
            difficulty: template.difficulty,
            timeLimit: template.timeLimit,
            priority: template.priority,
            generatedAt: Date.now(),
            generatedFor: player.id,
            expiresAt: Date.now() + (template.timeLimit || 3600000)
        };
        
        // Add objective IDs
        quest.objectives.forEach((objective, index) => {
            objective.id = `objective_${index}`;
            objective.description = this.generateObjectiveDescription(objective);
        });
        
        // Scale rewards based on player level and difficulty
        if (this.generationSettings.levelScaling) {
            quest.rewards = this.scaleRewards(quest.rewards, player.level, quest.difficulty);
        }
        
        return quest;
    }
    
    generateObjectives(templateObjectives, player, options) {
        const objectives = [];
        
        for (const templateObj of templateObjectives) {
            const objective = {
                type: templateObj.type,
                target: this.resolveTarget(templateObj.target, player, options),
                amount: this.resolveAmount(templateObj.amount, player, options)
            };
            
            if (templateObj.location) {
                objective.location = this.resolveLocation(templateObj.location, player, options);
            }
            
            objectives.push(objective);
        }
        
        return objectives;
    }
    
    generateRewards(templateRewards, player, options) {
        const rewards = {};
        
        for (const [key, value] of Object.entries(templateRewards)) {
            if (typeof value === 'object' && value.base !== undefined) {
                // Base + scaling rewards
                const scaling = value.scaling || 1.0;
                const levelMultiplier = Math.pow(scaling, (player.level - 1) / 10);
                rewards[key] = Math.floor(value.base * levelMultiplier);
            } else if (Array.isArray(value)) {
                // Item rewards
                rewards[key] = value.map(item => this.resolveItem(item, player, options));
            } else {
                // Fixed rewards
                rewards[key] = value;
            }
        }
        
        return rewards;
    }
    
    scaleRewards(rewards, playerLevel, difficulty) {
        const scaledRewards = { ...rewards };
        
        // Scale XP and gold
        const levelMultiplier = 1 + (playerLevel - 1) * 0.1;
        const difficultyMultiplier = 1 + (difficulty - 1) * 0.3;
        
        if (scaledRewards.xp) {
            scaledRewards.xp = Math.floor(scaledRewards.xp * levelMultiplier * difficultyMultiplier);
        }
        
        if (scaledRewards.gold) {
            scaledRewards.gold = Math.floor(scaledRewards.gold * levelMultiplier * difficultyMultiplier);
        }
        
        return scaledRewards;
    }
    
    // Dynamic quest generation based on context
    generateContextualQuest(player, context) {
        const { currentBiome, nearbyEntities, recentActivities, playerProgress } = context;
        
        // Generate biome-specific quests
        if (currentBiome && this.generationSettings.biomeSpecific) {
            const biomeQuest = this.generateBiomeQuest(player, currentBiome);
            if (biomeQuest) return biomeQuest;
        }
        
        // Generate quests based on nearby entities
        if (nearbyEntities && nearbyEntities.length > 0) {
            const entityQuest = this.generateEntityQuest(player, nearbyEntities);
            if (entityQuest) return entityQuest;
        }
        
        // Generate quests based on player progression
        if (this.generationSettings.playerProgression) {
            const progressionQuest = this.generateProgressionQuest(player, playerProgress);
            if (progressionQuest) return progressionQuest;
        }
        
        // Fallback to random quest
        return this.generateQuest(player);
    }
    
    generateBiomeQuest(player, biome) {
        const biomeQuestTypes = {
            plains: ['kill', 'collect', 'delivery'],
            forest: ['kill', 'collect', 'explore'],
            mountain: ['kill', 'collect', 'explore'],
            swamp: ['collect', 'explore'],
            desert: ['explore', 'delivery'],
            frozen: ['kill', 'collect'],
            volcanic: ['kill', 'boss'],
            darklands: ['kill', 'boss', 'explore']
        };
        
        const allowedTypes = biomeQuestTypes[biome] || ['kill', 'collect'];
        const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
        
        return this.generateQuest(player, { type, biome });
    }
    
    generateEntityQuest(player, entities) {
        // Find dominant entity type
        const entityTypes = {};
        for (const entity of entities) {
            if (entity.type === 'monster') {
                const monsterType = entity.monsterType || 'unknown';
                entityTypes[monsterType] = (entityTypes[monsterType] || 0) + 1;
            }
        }
        
        if (Object.keys(entityTypes).length === 0) {
            return null;
        }
        
        // Select most common entity
        const dominantEntity = Object.keys(entityTypes).reduce((a, b) => 
            entityTypes[a] > entityTypes[b] ? a : b
        );
        
        // Generate kill quest for this entity
        return this.generateQuest(player, {
            type: 'kill',
            forceTemplate: this.findKillTemplateForEntity(dominantEntity)
        });
    }
    
    generateProgressionQuest(player, playerProgress) {
        // Generate quests based on what player hasn't done much
        const questTypeScores = {
            kill: playerProgress.killQuests || 0,
            collect: playerProgress.collectQuests || 0,
            explore: playerProgress.exploreQuests || 0,
            craft: playerProgress.craftQuests || 0,
            boss: playerProgress.bossQuests || 0
        };
        
        // Find least done quest type
        let leastDoneType = 'kill';
        let lowestScore = questTypeScores.kill;
        
        for (const [type, score] of Object.entries(questTypeScores)) {
            if (score < lowestScore) {
                leastDoneType = type;
                lowestScore = score;
            }
        }
        
        return this.generateQuest(player, { type: leastDoneType });
    }
    
    // Quest chain management
    generateQuestChain(chainId, player) {
        const chain = this.questChains.get(chainId);
        if (!chain) {
            return null;
        }
        
        const quests = [];
        
        for (const templateId of chain.quests) {
            const template = this.templates.get(templateId);
            if (!template) continue;
            
            const quest = this.generateQuestFromTemplate(template, player, {
                chainId: chainId,
                chainStep: quests.length
            });
            
            if (quest) {
                quests.push(quest);
            }
        }
        
        return {
            id: chainId,
            name: this.getChainDisplayName(chainId),
            quests: quests,
            currentStep: 0
        };
    }
    
    // Utility methods
    processTemplateText(text, player, options) {
        if (!text || typeof text !== 'string') return text;
        
        // Replace template variables
        const variables = {
            '{player_name}': player.name,
            '{player_class}': player.className,
            '{player_level}': player.level,
            '{current_biome}': options.biome || 'área atual',
            '{nearby_town}': this.getNearbyTown(player),
            '{random_monster}': this.getRandomMonsterForLevel(player.level),
            '{random_resource}': this.getRandomResourceForBiome(options.biome),
            '{random_npc}': this.getRandomNPC()
        };
        
        let result = text;
        for (const [placeholder, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        }
        
        return result;
    }
    
    resolveTarget(target, player, options) {
        if (target.includes('{')) {
            return this.processTemplateText(target, player, options);
        }
        return target;
    }
    
    resolveAmount(amount, player, options) {
        if (typeof amount === 'object' && amount.min !== undefined && amount.max !== undefined) {
            // Scale amount based on player level
            const baseAmount = Math.floor(Math.random() * (amount.max - amount.min + 1)) + amount.min;
            const levelMultiplier = 1 + (player.level - 1) * 0.05;
            return Math.floor(baseAmount * levelMultiplier);
        }
        return amount;
    }
    
    resolveLocation(location, player, options) {
        if (location.includes('{')) {
            return this.processTemplateText(location, player, options);
        }
        return location;
    }
    
    resolveItem(item, player, options) {
        if (item.includes('{')) {
            return this.processTemplateText(item, player, options);
        }
        return item;
    }
    
    generateObjectiveDescription(objective) {
        const descriptions = {
            kill: `Derrotar ${objective.amount} ${objective.target}`,
            collect: `Coletar ${objective.amount} ${objective.target}`,
            explore: `Explorar ${objective.target}`,
            craft: `Craftar ${objective.amount} ${objective.target}`,
            deliver: `Entregar para ${objective.target}`,
            escort: `Escoltar ${objective.target}`,
            discover: `Descobrir ${objective.amount} ${objective.target}`
        };
        
        return descriptions[objective.type] || `${objective.type}: ${objective.target}`;
    }
    
    checkPlayerRequirements(player, requirements) {
        if (!requirements) return true;
        
        // Check level
        if (requirements.level) {
            const minLevel = requirements.level.min || 0;
            const maxLevel = requirements.level.max || Infinity;
            if (player.level < minLevel || player.level > maxLevel) {
                return false;
            }
        }
        
        // Check class
        if (requirements.class && requirements.class !== player.className) {
            return false;
        }
        
        // Check skills
        if (requirements.skill) {
            const playerSkill = player.skills[requirements.skill.type] || 0;
            const minSkill = requirements.skill.level.min || 0;
            const maxSkill = requirements.skill.level.max || Infinity;
            if (playerSkill < minSkill || playerSkill > maxSkill) {
                return false;
            }
        }
        
        // Check reputation
        if (requirements.reputation) {
            const playerRep = player.reputation[requirements.reputation.faction] || 0;
            if (playerRep < requirements.reputation.min) {
                return false;
            }
        }
        
        return true;
    }
    
    // Helper methods
    findKillTemplateForEntity(entityType) {
        for (const [templateId, template] of this.templates) {
            if (template.type === 'kill' && template.objectives) {
                for (const objective of template.objectives) {
                    if (objective.target === entityType) {
                        return templateId;
                    }
                }
            }
        }
        return null;
    }
    
    getChainDisplayName(chainId) {
        const names = {
            goblin_threat: 'Ameaça Goblin',
            lost_explorer: 'Explorador Perdido',
            master_craftsman: 'Mestre Artesão'
        };
        
        return names[chainId] || chainId;
    }
    
    getNearbyTown(player) {
        const towns = ['Vila Primavera', 'Cidade Comercial', 'Fortaleza Norte', 'Porto Sul'];
        return towns[Math.floor(Math.random() * towns.length)];
    }
    
    getRandomMonsterForLevel(level) {
        const monsters = {
            1: ['Goblin', 'Rat', 'Slime'],
            10: ['Wolf', 'Orc', 'Spider'],
            20: ['Bear', 'Troll', 'Skeleton Warrior'],
            30: ['Ogre', 'Demon', 'Dark Knight'],
            50: ['Dragon', 'Ancient Elemental', 'Lich']
        };
        
        const appropriateLevel = Math.floor(level / 10) * 10;
        const monsterList = monsters[appropriateLevel] || monsters[50];
        return monsterList[Math.floor(Math.random() * monsterList.length)];
    }
    
    getRandomResourceForBiome(biome) {
        const resources = {
            plains: ['Wheat', 'Flowers', 'Herbs'],
            forest: ['Wood', 'Berries', 'Mushrooms'],
            mountain: ['Stone', 'Iron Ore', 'Crystals'],
            swamp: ['Herbs', 'Rare Plants', 'Frog Legs'],
            desert: ['Sand', 'Cactus', 'Rare Minerals'],
            frozen: ['Ice Crystals', 'Snow Herbs', 'Fur'],
            volcanic: ['Lava Stones', 'Fire Gems', 'Sulfur'],
            darklands: ['Shadow Herbs', 'Dark Crystals', 'Cursed Items']
        };
        
        const resourceList = resources[biome] || resources.plains;
        return resourceList[Math.floor(Math.random() * resourceList.length)];
    }
    
    getRandomNPC() {
        const npcs = ['Mercador Joaquim', 'Guarda Real', 'Aldeã Maria', 'Feiticeiro Elara', 'Ferreiro Thorin'];
        return npcs[Math.floor(Math.random() * npcs.length)];
    }
    
    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }
    
    generateQuestId() {
        return 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Public API
    getAvailableQuests(player, count = 5) {
        const quests = [];
        
        for (let i = 0; i < count; i++) {
            const quest = this.generateQuest(player);
            if (quest) {
                quests.push(quest);
            }
        }
        
        return quests;
    }
    
    getQuestTemplate(templateId) {
        return this.templates.get(templateId);
    }
    
    getAllTemplates() {
        return Array.from(this.templates.values());
    }
    
    getQuestChains() {
        return Array.from(this.questChains.values());
    }
    
    // Cleanup
    cleanup() {
        this.templates.clear();
        this.questChains.clear();
        
        for (const pool of Object.values(this.questPools)) {
            pool.length = 0;
        }
    }
}

export default QuestGenerator;
