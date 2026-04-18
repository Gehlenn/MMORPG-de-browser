/**
 * Quest System - Mission and Task Management
 * Handles quest acceptance, tracking, completion, and rewards
 * Version 0.2.1 - Quest System Integration
 */

class QuestSystem {
    constructor(game, networkManager) {
        this.game = game;
        this.networkManager = networkManager;
        
        // Quest storage
        this.activeQuests = new Map();
        this.completedQuests = new Map();
        this.availableQuests = new Map();
        this.questChains = new Map();
        
        // Quest categories
        this.questTypes = {
            KILL: 'kill',
            COLLECT: 'collect',
            ESCORT: 'escort',
            EXPLORE: 'explore',
            BOSS: 'boss',
            CRAFT: 'craft',
            DELIVERY: 'delivery'
        };
        
        // Quest states
        this.questStates = {
            AVAILABLE: 'available',
            ACTIVE: 'active',
            COMPLETED: 'completed',
            FAILED: 'failed',
            ABANDONED: 'abandoned'
        };
        
        // Quest settings
        this.settings = {
            maxActiveQuests: 10,
            autoTrackQuest: true,
            showQuestNotifications: true,
            questMarkerOpacity: 0.8
        };
        
        // Quest tracking
        this.trackedQuestId = null;
        this.questProgress = new Map();
        
        // Event callbacks
        this.onQuestAccepted = null;
        this.onQuestCompleted = null;
        this.onQuestFailed = null;
        this.onObjectiveUpdated = null;
        
        // Initialize
        this.setupEventHandlers();
        this.initializeQuestTemplates();
    }
    
    setupEventHandlers() {
        // Listen to game events for quest progress
        if (this.game && this.game.entityManager) {
            this.game.entityManager.on('entityKilled', this.onEntityKilled.bind(this));
            this.game.entityManager.on('itemCollected', this.onItemCollected.bind(this));
            this.game.entityManager.on('areaDiscovered', this.onAreaDiscovered.bind(this));
        }
        
        // Player events
        if (this.game && this.game.player) {
            this.game.player.on('levelUp', this.checkLevelQuests.bind(this));
            this.game.player.on('itemCrafted', this.onItemCrafted.bind(this));
        }
        
        // Network events
        if (this.networkManager) {
            this.networkManager.registerHandler('quest_update', this.handleQuestUpdate.bind(this));
            this.networkManager.registerHandler('quest_reward', this.handleQuestReward.bind(this));
            this.networkManager.registerHandler('quest_available', this.handleQuestAvailable.bind(this));
        }
    }
    
    initializeQuestTemplates() {
        // Predefined quest templates for procedural generation
        this.questTemplates = {
            [this.questTypes.KILL]: [
                {
                    title: "Monster Hunt",
                    description: "Hunt down dangerous monsters in the area.",
                    objectives: [
                        { type: "kill", target: "{monster}", amount: {min: 5, max: 15} }
                    ],
                    rewards: {
                        xp: { min: 100, max: 300 },
                        gold: { min: 20, max: 100 }
                    },
                    requirements: { level: { min: 1, max: 50 } }
                },
                {
                    title: "Threat Elimination",
                    description: "Eliminate the {monster} threat to the local area.",
                    objectives: [
                        { type: "kill", target: "{monster}", amount: {min: 10, max: 25} }
                    ],
                    rewards: {
                        xp: { min: 200, max: 500 },
                        gold: { min: 50, max: 200 },
                        items: ["{monster}_essence"]
                    },
                    requirements: { level: { min: 10, max: 100 } }
                }
            ],
            [this.questTypes.COLLECT]: [
                {
                    title: "Resource Gathering",
                    description: "Collect valuable {resource} for the local merchant.",
                    objectives: [
                        { type: "collect", target: "{resource}", amount: {min: 10, max: 30} }
                    ],
                    rewards: {
                        xp: { min: 80, max: 250 },
                        gold: { min: 30, max: 150 }
                    },
                    requirements: { level: { min: 1, max: 40 } }
                },
                {
                    title: "Rare Materials",
                    description: "Gather rare {resource} needed for important crafting.",
                    objectives: [
                        { type: "collect", target: "{resource}", amount: {min: 5, max: 15} }
                    ],
                    rewards: {
                        xp: { min: 150, max: 400 },
                        gold: { min: 100, max: 300 },
                        items: ["crafting_recipe"]
                    },
                    requirements: { level: { min: 15, max: 80 } }
                }
            ],
            [this.questTypes.EXPLORE]: [
                {
                    title: "Area Exploration",
                    description: "Explore and discover the {area} region.",
                    objectives: [
                        { type: "explore", target: "{area}", amount: 1 }
                    ],
                    rewards: {
                        xp: { min: 120, max: 350 },
                        gold: { min: 40, max: 180 }
                    },
                    requirements: { level: { min: 5, max: 60 } }
                },
                {
                    title: "Cartographer's Request",
                    description: "Map out the dangerous {area} for the cartographer guild.",
                    objectives: [
                        { type: "explore", target: "{area}", amount: 1 },
                        { type: "discover", target: "{poi}", amount: {min: 3, max: 5} }
                    ],
                    rewards: {
                        xp: { min: 250, max: 600 },
                        gold: { min: 150, max: 400 },
                        items: ["map_{area}"]
                    },
                    requirements: { level: { min: 20, max: 100 } }
                }
            ],
            [this.questTypes.BOSS]: [
                {
                    title: "Boss Hunt",
                    description: "Defeat the powerful {boss} that terrorizes the region.",
                    objectives: [
                        { type: "kill", target: "{boss}", amount: 1 }
                    ],
                    rewards: {
                        xp: { min: 500, max: 1500 },
                        gold: { min: 200, max: 800 },
                        items: ["{boss}_weapon", "{boss}_armor"]
                    },
                    requirements: { level: { min: 25, max: 100 } }
                }
            ],
            [this.questTypes.CRAFT]: [
                {
                    title: "Crafting Request",
                    description: "Craft {item} for the local craftsman.",
                    objectives: [
                        { type: "craft", target: "{item}", amount: {min: 1, max: 5} }
                    ],
                    rewards: {
                        xp: { min: 100, max: 300 },
                        gold: { min: 80, max: 250 },
                        items: ["crafting_materials"]
                    },
                    requirements: { level: { min: 10, max: 70 } }
                }
            ],
            [this.questTypes.DELIVERY]: [
                {
                    title: "Package Delivery",
                    description: "Deliver important package to {npc} in {location}.",
                    objectives: [
                        { type: "deliver", target: "{npc}", location: "{location}", amount: 1 }
                    ],
                    rewards: {
                        xp: { min: 80, max: 200 },
                        gold: { min: 50, max: 150 }
                    },
                    requirements: { level: { min: 1, max: 30 } }
                }
            ]
        };
    }
    
    // Quest management
    acceptQuest(questId) {
        const quest = this.availableQuests.get(questId);
        if (!quest) {
            console.error('Quest not found:', questId);
            return false;
        }
        
        // Check requirements
        if (!this.meetsRequirements(quest.requirements)) {
            this.showNotification('Você não atende aos requisitos para esta quest!', 'error');
            return false;
        }
        
        // Check active quest limit
        if (this.activeQuests.size >= this.settings.maxActiveQuests) {
            this.showNotification('Você atingiu o limite de quests ativas!', 'error');
            return false;
        }
        
        // Initialize quest progress
        const questProgress = {
            ...quest,
            state: this.questStates.ACTIVE,
            acceptedAt: Date.now(),
            progress: this.initializeProgress(quest.objectives)
        };
        
        this.activeQuests.set(questId, questProgress);
        this.availableQuests.delete(questId);
        
        // Auto-track new quest
        if (this.settings.autoTrackQuest) {
            this.trackQuest(questId);
        }
        
        // Notify systems
        this.notifyQuestAccepted(questProgress);
        
        if (this.networkManager) {
            this.networkManager.sendMessage('quest_accept', { questId });
        }
        
        this.showNotification(`Quest aceita: ${quest.title}`, 'success');
        return true;
    }
    
    abandonQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) {
            return false;
        }
        
        quest.state = this.questStates.ABANDONED;
        quest.abandonedAt = Date.now();
        
        this.activeQuests.delete(questId);
        
        // Move to available if not timed out
        if (!quest.timeout || Date.now() < quest.timeout) {
            this.availableQuests.set(questId, quest);
        }
        
        // Clear tracking if this was the tracked quest
        if (this.trackedQuestId === questId) {
            this.trackedQuestId = null;
        }
        
        this.showNotification(`Quest abandonada: ${quest.title}`, 'info');
        
        if (this.networkManager) {
            this.networkManager.sendMessage('quest_abandon', { questId });
        }
        
        return true;
    }
    
    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) {
            return false;
        }
        
        // Check if all objectives are completed
        if (!this.areObjectivesCompleted(quest)) {
            return false;
        }
        
        // Mark as completed
        quest.state = this.questStates.COMPLETED;
        quest.completedAt = Date.now();
        
        // Move to completed
        this.completedQuests.set(questId, quest);
        this.activeQuests.delete(questId);
        
        // Award rewards
        this.awardRewards(quest.rewards);
        
        // Check for quest chain continuation
        this.checkQuestChain(questId);
        
        // Clear tracking
        if (this.trackedQuestId === questId) {
            this.trackedQuestId = null;
        }
        
        // Notify systems
        this.notifyQuestCompleted(quest);
        
        if (this.networkManager) {
            this.networkManager.sendMessage('quest_complete', { questId });
        }
        
        this.showNotification(`Quest completada: ${quest.title}`, 'success');
        return true;
    }
    
    trackQuest(questId) {
        if (!this.activeQuests.has(questId)) {
            return false;
        }
        
        this.trackedQuestId = questId;
        this.updateQuestTracker();
        return true;
    }
    
    // Progress tracking
    updateProgress(type, target, amount = 1) {
        let updated = false;
        
        for (const [questId, quest] of this.activeQuests) {
            for (const objective of quest.objectives) {
                if (objective.type === type && 
                    (objective.target === target || objective.targets?.includes(target))) {
                    
                    const currentProgress = quest.progress[objective.id] || 0;
                    const newProgress = Math.min(currentProgress + amount, objective.amount);
                    
                    if (newProgress !== currentProgress) {
                        quest.progress[objective.id] = newProgress;
                        updated = true;
                        
                        // Check if objective is completed
                        if (newProgress >= objective.amount) {
                            this.showNotification(`${objective.description || target} completado!`, 'info');
                        }
                        
                        // Check if quest is completed
                        if (this.areObjectivesCompleted(quest)) {
                            this.completeQuest(questId);
                        }
                        
                        // Update UI if this is the tracked quest
                        if (this.trackedQuestId === questId) {
                            this.updateQuestTracker();
                        }
                        
                        // Notify progress update
                        this.notifyObjectiveUpdated(questId, objective, newProgress);
                    }
                }
            }
        }
        
        return updated;
    }
    
    // Event handlers
    onEntityKilled(entity) {
        if (entity.type === 'monster') {
            this.updateProgress('kill', entity.monsterType || entity.type, 1);
        }
    }
    
    onItemCollected(item, amount = 1) {
        if (item.type === 'item') {
            this.updateProgress('collect', item.itemId || item.type, amount);
        }
    }
    
    onAreaDiscovered(area) {
        this.updateProgress('explore', area, 1);
    }
    
    onItemCrafted(item, amount = 1) {
        this.updateProgress('craft', item.itemId || item.type, amount);
    }
    
    checkLevelQuests() {
        // Check for level-based quest availability
        const playerLevel = this.game.player.level;
        
        for (const [questId, quest] of this.availableQuests.values()) {
            if (quest.requirements && quest.requirements.level) {
                const minLevel = quest.requirements.level.min || 0;
                const maxLevel = quest.requirements.level.max || Infinity;
                
                if (playerLevel >= minLevel && playerLevel <= maxLevel) {
                    this.makeQuestAvailable(questId);
                }
            }
        }
    }
    
    // Quest generation
    generateQuest(type, parameters = {}) {
        const templates = this.questTemplates[type];
        if (!templates || templates.length === 0) {
            return null;
        }
        
        // Select random template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Generate quest from template
        const quest = this.generateQuestFromTemplate(template, parameters);
        
        return quest;
    }
    
    generateQuestFromTemplate(template, parameters) {
        const quest = {
            id: this.generateQuestId(),
            title: this.replaceTemplateVariables(template.title, parameters),
            description: this.replaceTemplateVariables(template.description, parameters),
            type: template.type,
            objectives: this.generateObjectives(template.objectives, parameters),
            rewards: this.generateRewards(template.rewards, parameters),
            requirements: template.requirements || {},
            generatedAt: Date.now()
        };
        
        // Add objective IDs
        quest.objectives.forEach((obj, index) => {
            obj.id = `objective_${index}`;
            obj.description = this.generateObjectiveDescription(obj);
        });
        
        return quest;
    }
    
    generateObjectives(templateObjectives, parameters) {
        const objectives = [];
        
        for (const templateObj of templateObjectives) {
            const objective = {
                type: templateObj.type,
                target: this.replaceTemplateVariables(templateObj.target, parameters),
                amount: this.resolveValue(templateObj.amount)
            };
            
            if (templateObj.location) {
                objective.location = this.replaceTemplateVariables(templateObj.location, parameters);
            }
            
            objectives.push(objective);
        }
        
        return objectives;
    }
    
    generateRewards(templateRewards, parameters) {
        const rewards = {};
        
        for (const [key, value] of Object.entries(templateRewards)) {
            if (Array.isArray(value)) {
                rewards[key] = value.map(item => 
                    this.replaceTemplateVariables(item, parameters)
                );
            } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
                rewards[key] = Math.floor(Math.random() * (value.max - value.min + 1)) + value.min;
            } else {
                rewards[key] = value;
            }
        }
        
        return rewards;
    }
    
    // Quest chains
    createQuestChain(chainId, quests) {
        const chain = {
            id: chainId,
            quests: quests,
            currentStep: 0,
            completed: false
        };
        
        this.questChains.set(chainId, chain);
        
        // Make first quest available
        if (quests.length > 0) {
            this.makeQuestAvailable(quests[0]);
        }
    }
    
    checkQuestChain(completedQuestId) {
        for (const [chainId, chain] of this.questChains) {
            const currentQuestIndex = chain.quests.indexOf(completedQuestId);
            
            if (currentQuestIndex !== -1 && currentQuestIndex === chain.currentStep) {
                // Move to next step
                chain.currentStep++;
                
                if (chain.currentStep < chain.quests.length) {
                    // Make next quest available
                    const nextQuestId = chain.quests[chain.currentStep];
                    this.makeQuestAvailable(nextQuestId);
                    
                    this.showNotification('Próxima quest da cadeia disponível!', 'info');
                } else {
                    // Chain completed
                    chain.completed = true;
                    this.awardChainRewards(chainId);
                }
            }
        }
    }
    
    // Utility methods
    meetsRequirements(requirements) {
        if (!requirements) return true;
        
        const player = this.game.player;
        
        // Check level requirement
        if (requirements.level) {
            const minLevel = requirements.level.min || 0;
            const maxLevel = requirements.level.max || Infinity;
            
            if (player.level < minLevel || player.level > maxLevel) {
                return false;
            }
        }
        
        // Check class requirement
        if (requirements.class && requirements.class !== player.className) {
            return false;
        }
        
        // Check completed quest requirement
        if (requirements.completedQuest) {
            if (!this.completedQuests.has(requirements.completedQuest)) {
                return false;
            }
        }
        
        return true;
    }
    
    areObjectivesCompleted(quest) {
        for (const objective of quest.objectives) {
            const progress = quest.progress[objective.id] || 0;
            if (progress < objective.amount) {
                return false;
            }
        }
        return true;
    }
    
    initializeProgress(objectives) {
        const progress = {};
        
        for (const objective of objectives) {
            progress[objective.id] = 0;
        }
        
        return progress;
    }
    
    awardRewards(rewards) {
        const player = this.game.player;
        
        if (rewards.xp) {
            player.gainExperience(rewards.xp);
        }
        
        if (rewards.gold) {
            player.gold += rewards.gold;
        }
        
        if (rewards.items) {
            for (const item of rewards.items) {
                player.addToInventory({ id: item, quantity: 1 });
            }
        }
        
        if (rewards.skillPoints) {
            player.skillPoints += rewards.skillPoints;
        }
        
        if (rewards.reputation) {
            // Handle reputation system
            player.addReputation(rewards.reputation);
        }
        
        // Update UI
        if (this.game.updateUI) {
            this.game.updateUI();
        }
    }
    
    makeQuestAvailable(questId) {
        // This would typically be called by the server or NPC system
        console.log(`Quest ${questId} is now available`);
    }
    
    // UI methods
    updateQuestTracker() {
        if (this.game.ui && this.game.ui.updateQuestTracker) {
            this.game.ui.updateQuestTracker(this.getTrackedQuest());
        }
    }
    
    showNotification(message, type = 'info') {
        if (this.game.ui && this.game.ui.showNotification) {
            this.game.ui.showNotification(message, type);
        }
    }
    
    // Template utilities
    replaceTemplateVariables(text, parameters) {
        if (!text || typeof text !== 'string') return text;
        
        let result = text;
        
        // Replace common template variables
        const variables = {
            '{monster}': parameters.monster || this.getRandomMonster(),
            '{resource}': parameters.resource || this.getRandomResource(),
            '{area}': parameters.area || this.getRandomArea(),
            '{boss}': parameters.boss || this.getRandomBoss(),
            '{npc}': parameters.npc || this.getRandomNPC(),
            '{location}': parameters.location || this.getRandomLocation(),
            '{item}': parameters.item || this.getRandomItem(),
            '{poi}': parameters.poi || this.getRandomPointOfInterest()
        };
        
        for (const [placeholder, value] of Object.entries(variables)) {
            result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        }
        
        return result;
    }
    
    resolveValue(value) {
        if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            return Math.floor(Math.random() * (value.max - value.min + 1)) + value.min;
        }
        return value;
    }
    
    generateObjectiveDescription(objective) {
        const descriptions = {
            kill: `Derrotar ${objective.amount} ${objective.target}`,
            collect: `Coletar ${objective.amount} ${objective.target}`,
            explore: `Explorar ${objective.target}`,
            craft: `Craftar ${objective.amount} ${objective.target}`,
            deliver: `Entregar para ${objective.target}`,
            escort: `Escoltar ${objective.target}`
        };
        
        return descriptions[objective.type] || `${objective.type}: ${objective.target}`;
    }
    
    // Random generators (would be connected to game data)
    getRandomMonster() {
        const monsters = ['Goblin', 'Wolf', 'Orc', 'Spider', 'Bear', 'Skeleton'];
        return monsters[Math.floor(Math.random() * monsters.length)];
    }
    
    getRandomResource() {
        const resources = ['Madeira', 'Pedra', 'Ferro', 'Ouro', 'Ervas', 'Cristais'];
        return resources[Math.floor(Math.random() * resources.length)];
    }
    
    getRandomArea() {
        const areas = ['Floresta Norte', 'Montanhas do Leste', 'Pântano Sul', 'Deserto Oeste'];
        return areas[Math.floor(Math.random() * areas.length)];
    }
    
    getRandomBoss() {
        const bosses = ['Dragão Antigo', 'Lorde Demônio', 'Rei Goblin', 'Mago Sombrio'];
        return bosses[Math.floor(Math.random() * bosses.length)];
    }
    
    getRandomNPC() {
        const npcs = ['Mercador Joaquim', 'Guarda Real', 'Aldeã Maria', 'Feiticeiro Elara'];
        return npcs[Math.floor(Math.random() * npcs.length)];
    }
    
    getRandomLocation() {
        const locations = ['Vila Principal', 'Cidade Comercial', 'Fortaleza Norte', 'Porto Sul'];
        return locations[Math.floor(Math.random() * locations.length)];
    }
    
    getRandomItem() {
        const items = ['Espada de Ferro', 'Armadura de Couro', 'Poção de Cura', 'Anel Mágico'];
        return items[Math.floor(Math.random() * items.length)];
    }
    
    getRandomPointOfInterest() {
        const pois = ['Caverna Misteriosa', 'Ruína Antiga', 'Torre de Vigia', 'Altar Sagrado'];
        return pois[Math.floor(Math.random() * pois.length)];
    }
    
    generateQuestId() {
        return 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Network handlers
    handleQuestUpdate(data) {
        const { questId, updates } = data;
        
        if (this.activeQuests.has(questId)) {
            Object.assign(this.activeQuests.get(questId), updates);
            this.updateQuestTracker();
        }
    }
    
    handleQuestReward(data) {
        this.awardRewards(data.rewards);
    }
    
    handleQuestAvailable(data) {
        this.makeQuestAvailable(data.questId);
    }
    
    // Notification methods
    notifyQuestAccepted(quest) {
        if (this.onQuestAccepted) {
            this.onQuestAccepted(quest);
        }
    }
    
    notifyQuestCompleted(quest) {
        if (this.onQuestCompleted) {
            this.onQuestCompleted(quest);
        }
    }
    
    notifyObjectiveUpdated(questId, objective, progress) {
        if (this.onObjectiveUpdated) {
            this.onObjectiveUpdated(questId, objective, progress);
        }
    }
    
    // Public API
    getActiveQuests() {
        return Array.from(this.activeQuests.values());
    }
    
    getCompletedQuests() {
        return Array.from(this.completedQuests.values());
    }
    
    getAvailableQuests() {
        return Array.from(this.availableQuests.values());
    }
    
    getTrackedQuest() {
        return this.trackedQuestId ? this.activeQuests.get(this.trackedQuestId) : null;
    }
    
    getQuestProgress(questId) {
        const quest = this.activeQuests.get(questId);
        return quest ? quest.progress : null;
    }
    
    isQuestActive(questId) {
        return this.activeQuests.has(questId);
    }
    
    isQuestCompleted(questId) {
        return this.completedQuests.has(questId);
    }
    
    // Cleanup
    cleanup() {
        this.activeQuests.clear();
        this.completedQuests.clear();
        this.availableQuests.clear();
        this.questChains.clear();
        this.questProgress.clear();
        
        this.trackedQuestId = null;
    }
}

export default QuestSystem;
