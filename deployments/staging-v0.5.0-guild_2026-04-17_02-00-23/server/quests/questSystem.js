/**
 * Quest System - Mission and Task Management
 * Handles quest creation, tracking, and completion
 * Version 0.3 - First Playable Gameplay Systems
 */

class QuestSystem {
    constructor(server) {
        this.server = server;
        
        // Quest configuration
        this.config = {
            maxActiveQuests: 10,
            maxCompletedQuests: 100,
            questShareRadius: 100,
            dailyResetTime: '00:00', // Midnight
            weeklyResetDay: 1, // Monday
            autoSaveInterval: 300000 // 5 minutes
        };
        
        // Quest templates
        this.questTemplates = new Map();
        this.loadQuestTemplates();
        
        // Player quest data
        this.playerQuests = new Map();
        
        // Quest chains
        this.questChains = new Map();
        this.loadQuestChains();
        
        // Daily and weekly quests
        this.dailyQuests = new Map();
        this.weeklyQuests = new Map();
        
        // Quest rewards
        this.rewardTypes = {
            experience: 'experience',
            gold: 'gold',
            items: 'items',
            reputation: 'reputation',
            skills: 'skills',
            titles: 'titles'
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start auto-save
        this.startAutoSave();
        
        // Schedule daily/weekly resets
        this.scheduleQuestResets();
        
        // Load player quest data
        this.loadPlayerQuestData();
        
        console.log('Quest System initialized');
    }
    
    loadQuestTemplates() {
        // Tutorial quests
        this.questTemplates.set('intro_quest', {
            id: 'intro_quest',
            name: 'Welcome to the World',
            description: 'Learn the basics of the world and meet the townspeople.',
            type: 'tutorial',
            difficulty: 'easy',
            level: 1,
            prerequisites: [],
            objectives: [
                {
                    id: 'talk_to_mayor',
                    type: 'talk',
                    target: 'quest_giver_town',
                    description: 'Talk to the Town Mayor',
                    completed: false
                },
                {
                    id: 'visit_vendor',
                    type: 'visit',
                    target: 'weapon_vendor',
                    description: 'Visit the Weapon Smith',
                    completed: false
                },
                {
                    id: 'learn_movement',
                    type: 'explore',
                    target: { x: 100, y: 100, radius: 20 },
                    description: 'Explore the town square',
                    completed: false
                }
            ],
            rewards: {
                experience: 100,
                gold: 50,
                items: [
                    { template: 'potion_health', count: 2 }
                ]
            },
            nextQuest: 'first_blood',
            repeatable: false,
            timeLimit: null,
            autoAccept: true
        });
        
        // Combat quests
        this.questTemplates.set('first_blood', {
            id: 'first_blood',
            name: 'First Blood',
            description: 'Prove your worth by defeating some monsters outside town.',
            type: 'combat',
            difficulty: 'easy',
            level: 2,
            prerequisites: ['intro_quest'],
            objectives: [
                {
                    id: 'kill_wolves',
                    type: 'kill',
                    target: 'wolf',
                    count: 5,
                    current: 0,
                    description: 'Defeat 5 Wolves',
                    completed: false
                },
                {
                    id: 'kill_boars',
                    type: 'kill',
                    target: 'boar',
                    count: 3,
                    current: 0,
                    description: 'Defeat 3 Wild Boars',
                    completed: false
                }
            ],
            rewards: {
                experience: 200,
                gold: 100,
                items: [
                    { template: 'sword_common', count: 1 }
                ]
            },
            nextQuest: 'monster_hunt',
            repeatable: false,
            timeLimit: 3600000, // 1 hour
            autoAccept: false
        });
        
        this.questTemplates.set('monster_hunt', {
            id: 'monster_hunt',
            name: 'Monster Hunt',
            description: 'The forest is overrun with dangerous creatures. Clear them out!',
            type: 'combat',
            difficulty: 'medium',
            level: 5,
            prerequisites: ['first_blood'],
            objectives: [
                {
                    id: 'kill_bears',
                    type: 'kill',
                    target: 'bear',
                    count: 3,
                    current: 0,
                    description: 'Defeat 3 Bears',
                    completed: false
                },
                {
                    id: 'kill_spiders',
                    type: 'kill',
                    target: 'spider',
                    count: 8,
                    current: 0,
                    description: 'Defeat 8 Giant Spiders',
                    completed: false
                }
            ],
            rewards: {
                experience: 500,
                gold: 250,
                items: [
                    { template: 'armor_uncommon', count: 1 },
                    { template: 'potion_mana', count: 3 }
                ]
            },
            nextQuest: 'cave_exploration',
            repeatable: true,
            repeatDelay: 86400000, // 24 hours
            timeLimit: 7200000, // 2 hours
            autoAccept: false
        });
        
        // Collection quests
        this.questTemplates.set('herb_collection', {
            id: 'herb_collection',
            name: 'Herb Collection',
            description: 'Collect herbs for the local alchemist.',
            type: 'collection',
            difficulty: 'easy',
            level: 3,
            prerequisites: [],
            objectives: [
                {
                    id: 'collect_herbs',
                    type: 'collect',
                    target: 'herb',
                    count: 10,
                    current: 0,
                    description: 'Collect 10 Herbs',
                    completed: false
                }
            ],
            rewards: {
                experience: 150,
                gold: 75,
                items: [
                    { template: 'potion_health', count: 5 }
                ]
            },
            nextQuest: null,
            repeatable: true,
            repeatDelay: 3600000, // 1 hour
            timeLimit: 1800000, // 30 minutes
            autoAccept: false
        });
        
        // Delivery quests
        this.questTemplates.set('delivery_quest', {
            id: 'delivery_quest',
            name: 'Important Delivery',
            description: 'Deliver a package to the forest ranger.',
            type: 'delivery',
            difficulty: 'easy',
            level: 4,
            prerequisites: [],
            objectives: [
                {
                    id: 'talk_to_mayor',
                    type: 'talk',
                    target: 'quest_giver_town',
                    description: 'Get the package from the Town Mayor',
                    completed: false
                },
                {
                    id: 'deliver_to_ranger',
                    type: 'talk',
                    target: 'quest_giver_forest',
                    description: 'Deliver the package to the Forest Ranger',
                    completed: false
                }
            ],
            rewards: {
                experience: 180,
                gold: 90,
                reputation: {
                    town: 10,
                    forest: 15
                }
            },
            nextQuest: 'forest_cleanup',
            repeatable: true,
            repeatDelay: 43200000, // 12 hours
            timeLimit: 3600000, // 1 hour
            autoAccept: false
        });
        
        // Exploration quests
        this.questTemplates.set('cave_exploration', {
            id: 'cave_exploration',
            name: 'Cave Exploration',
            description: 'Explore the mysterious cave to the north and discover its secrets.',
            type: 'exploration',
            difficulty: 'medium',
            level: 8,
            prerequisites: ['monster_hunt'],
            objectives: [
                {
                    id: 'find_cave',
                    type: 'discover',
                    target: 'cave_entrance',
                    description: 'Find the cave entrance',
                    completed: false
                },
                {
                    id: 'explore_cave',
                    type: 'explore',
                    target: { x: 500, y: 300, radius: 50 },
                    description: 'Explore the cave depths',
                    completed: false
                },
                {
                    id: 'find_treasure',
                    type: 'discover',
                    target: 'hidden_treasure',
                    description: 'Find the hidden treasure',
                    completed: false
                }
            ],
            rewards: {
                experience: 800,
                gold: 400,
                items: [
                    { template: 'ring_epic', count: 1 }
                ]
            },
            nextQuest: 'dungeon_raid',
            repeatable: false,
            timeLimit: 14400000, // 4 hours
            autoAccept: false
        });
        
        // Dungeon quests
        this.questTemplates.set('dungeon_raid', {
            id: 'dungeon_raid',
            name: 'Dungeon Raid',
            description: 'Lead a raid into the ancient dungeon and defeat the evil within.',
            type: 'dungeon',
            difficulty: 'hard',
            level: 15,
            prerequisites: ['cave_exploration'],
            objectives: [
                {
                    id: 'enter_dungeon',
                    type: 'enter_dungeon',
                    target: 'ancient_dungeon',
                    description: 'Enter the Ancient Dungeon',
                    completed: false
                },
                {
                    id: 'defeat_boss',
                    type: 'kill_boss',
                    target: 'dungeon_boss',
                    description: 'Defeat the Dungeon Boss',
                    completed: false
                },
                {
                    id: 'rescue_prisoners',
                    type: 'escort',
                    target: 'prisoners',
                    count: 3,
                    current: 0,
                    description: 'Rescue 3 Prisoners',
                    completed: false
                }
            ],
            rewards: {
                experience: 2000,
                gold: 1000,
                items: [
                    { template: 'sword_legendary', count: 1 },
                    { template: 'potion_health', count: 10 }
                ],
                titles: ['Dungeon Raider']
            },
            nextQuest: 'world_saver',
            repeatable: false,
            timeLimit: 21600000, // 6 hours
            autoAccept: false
        });
        
        // Daily quests
        this.questTemplates.set('daily_monster_slay', {
            id: 'daily_monster_slay',
            name: 'Daily Monster Slay',
            description: 'Help keep the roads safe by defeating monsters.',
            type: 'daily',
            difficulty: 'medium',
            level: 5,
            prerequisites: [],
            objectives: [
                {
                    id: 'kill_any_monsters',
                    type: 'kill',
                    target: 'any',
                    count: 10,
                    current: 0,
                    description: 'Defeat 10 monsters',
                    completed: false
                }
            ],
            rewards: {
                experience: 300,
                gold: 150,
                items: [
                    { template: 'potion_health', count: 2 }
                ]
            },
            nextQuest: null,
            repeatable: true,
            repeatDelay: 86400000, // 24 hours
            timeLimit: 86400000, // 24 hours
            autoAccept: true
        });
        
        // Weekly quests
        this.questTemplates.set('weekly_boss_hunt', {
            id: 'weekly_boss_hunt',
            name: 'Weekly Boss Hunt',
            description: 'Hunt down powerful bosses for great rewards.',
            type: 'weekly',
            difficulty: 'hard',
            level: 20,
            prerequisites: [],
            objectives: [
                {
                    id: 'defeat_world_boss',
                    type: 'kill_boss',
                    target: 'world_boss',
                    count: 1,
                    current: 0,
                    description: 'Defeat a World Boss',
                    completed: false
                },
                {
                    id: 'defeat_dungeon_boss',
                    type: 'kill_boss',
                    target: 'dungeon_boss',
                    count: 2,
                    current: 0,
                    description: 'Defeat 2 Dungeon Bosses',
                    completed: false
                }
            ],
            rewards: {
                experience: 5000,
                gold: 2500,
                items: [
                    { template: 'chest_epic', count: 1 }
                ],
                titles: ['Boss Hunter']
            },
            nextQuest: null,
            repeatable: true,
            repeatDelay: 604800000, // 7 days
            timeLimit: 604800000, // 7 days
            autoAccept: true
        });
    }
    
    loadQuestChains() {
        // Main story chain
        this.questChains.set('main_story', {
            name: 'Main Story',
            description: 'The epic journey to save the world',
            quests: [
                'intro_quest',
                'first_blood',
                'monster_hunt',
                'cave_exploration',
                'dungeon_raid',
                'world_saver'
            ]
        });
        
        // Warrior chain
        this.questChains.set('warrior_path', {
            name: 'Path of the Warrior',
            description: 'Become a legendary warrior',
            quests: [
                'first_blood',
                'monster_hunt',
                'warrior_trials',
                'arena_champion',
                'blade_master'
            ]
        });
        
        // Crafter chain
        this.questChains.set('crafter_path', {
            name: 'Path of the Crafter',
            description: 'Master the art of crafting',
            quests: [
                'herb_collection',
                'crafting_apprentice',
                'journeyman_crafter',
                'master_artisan',
                'legendary_smith'
            ]
        });
    }
    
    setupEventHandlers() {
        // Player events
        this.server.on('playerLevelUp', (playerId, newLevel) => {
            this.handlePlayerLevelUp(playerId, newLevel);
        });
        
        // Combat events
        this.server.on('entityDeath', (entityId, killerId) => {
            this.handleEntityDeath(entityId, killerId);
        });
        
        this.server.on('bossDefeated', (bossId, participants) => {
            this.handleBossDefeated(bossId, participants);
        });
        
        // Interaction events
        this.server.on('npcInteract', (playerId, npcId, interactionType) => {
            this.handleNPCInteraction(playerId, npcId, interactionType);
        });
        
        // Discovery events
        this.server.on('poiDiscovered', (playerId, poiId) => {
            this.handlePOIDiscovered(playerId, poiId);
        });
        
        this.server.on('dungeonCompleted', (dungeonId, playerId) => {
            this.handleDungeonCompleted(dungeonId, playerId);
        });
        
        // Item events
        this.server.on('itemCollected', (playerId, itemTemplate, count) => {
            this.handleItemCollected(playerId, itemTemplate, count);
        });
        
        // Time events
        this.server.on('dailyReset', () => {
            this.handleDailyReset();
        });
        
        this.server.on('weeklyReset', () => {
            this.handleWeeklyReset();
        });
    }
    
    startAutoSave() {
        setInterval(() => {
            this.savePlayerQuestData();
        }, this.config.autoSaveInterval);
    }
    
    scheduleQuestResets() {
        // Schedule daily reset at midnight
        const dailyReset = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const msUntilMidnight = tomorrow - now;
            
            setTimeout(() => {
                this.handleDailyReset();
                setInterval(this.handleDailyReset, 86400000); // Repeat daily
            }, msUntilMidnight);
        };
        
        // Schedule weekly reset on Monday
        const weeklyReset = () => {
            const now = new Date();
            const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7;
            const nextMonday = new Date(now);
            nextMonday.setDate(now.getDate() + daysUntilMonday);
            nextMonday.setHours(0, 0, 0, 0);
            
            const msUntilMonday = nextMonday - now;
            
            setTimeout(() => {
                this.handleWeeklyReset();
                setInterval(this.handleWeeklyReset, 604800000); // Repeat weekly
            }, msUntilMonday);
        };
        
        dailyReset();
        weeklyReset();
    }
    
    async loadPlayerQuestData() {
        try {
            const questData = await this.server.db.all('SELECT * FROM player_quests');
            
            for (const data of questData) {
                this.playerQuests.set(data.player_id, {
                    playerId: data.player_id,
                    activeQuests: JSON.parse(data.active_quests || '[]'),
                    completedQuests: JSON.parse(data.completed_quests || '[]'),
                    dailyQuests: JSON.parse(data.daily_quests || '[]'),
                    weeklyQuests: JSON.parse(data.weekly_quests || '[]'),
                    questHistory: JSON.parse(data.quest_history || '[]'),
                    lastDailyReset: data.last_daily_reset,
                    lastWeeklyReset: data.last_weekly_reset,
                    questPoints: data.quest_points || 0
                });
            }
            
            console.log(`Loaded quest data for ${questData.length} players`);
            
        } catch (error) {
            console.error('Error loading player quest data:', error);
        }
    }
    
    // Quest management
    async acceptQuest(playerId, questId) {
        const playerData = this.getPlayerQuestData(playerId);
        if (!playerData) return { success: false, message: 'Player data not found' };
        
        // Check if quest exists
        const questTemplate = this.questTemplates.get(questId);
        if (!questTemplate) {
            return { success: false, message: 'Quest not found' };
        }
        
        // Check prerequisites
        if (!this.checkPrerequisites(playerId, questTemplate)) {
            return { success: false, message: 'Prerequisites not met' };
        }
        
        // Check level requirement
        const player = await this.getPlayerData(playerId);
        if (player.level < questTemplate.level) {
            return { success: false, message: 'Level requirement not met' };
        }
        
        // Check if already completed
        if (playerData.completedQuests.includes(questId)) {
            return { success: false, message: 'Quest already completed' };
        }
        
        // Check if already active
        if (playerData.activeQuests.some(q => q.id === questId)) {
            return { success: false, message: 'Quest already active' };
        }
        
        // Check active quest limit
        if (playerData.activeQuests.length >= this.config.maxActiveQuests) {
            return { success: false, message: 'Too many active quests' };
        }
        
        // Create quest instance
        const questInstance = this.createQuestInstance(questTemplate);
        
        // Add to active quests
        playerData.activeQuests.push(questInstance);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('questAccepted', {
                quest: questInstance
            });
        }
        
        console.log(`Player ${playerId} accepted quest: ${questTemplate.name}`);
        
        return { success: true, quest: questInstance };
    }
    
    createQuestInstance(template) {
        const quest = {
            id: template.id,
            name: template.name,
            description: template.description,
            type: template.type,
            difficulty: template.difficulty,
            level: template.level,
            objectives: JSON.parse(JSON.stringify(template.objectives)),
            rewards: template.rewards,
            startTime: Date.now(),
            timeLimit: template.timeLimit,
            autoAccept: template.autoAccept,
            progress: 0,
            status: 'active'
        };
        
        // Set time limit if applicable
        if (quest.timeLimit) {
            quest.endTime = quest.startTime + quest.timeLimit;
        }
        
        return quest;
    }
    
    checkPrerequisites(playerId, questTemplate) {
        const playerData = this.getPlayerQuestData(playerId);
        if (!playerData) return false;
        
        for (const prereq of questTemplate.prerequisites) {
            if (!playerData.completedQuests.includes(prereq)) {
                return false;
            }
        }
        
        return true;
    }
    
    async abandonQuest(playerId, questId) {
        const playerData = this.getPlayerQuestData(playerId);
        if (!playerData) return { success: false, message: 'Player data not found' };
        
        // Find quest in active quests
        const questIndex = playerData.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            return { success: false, message: 'Quest not found in active quests' };
        }
        
        const quest = playerData.activeQuests[questIndex];
        
        // Remove from active quests
        playerData.activeQuests.splice(questIndex, 1);
        
        // Add to history as abandoned
        playerData.questHistory.push({
            questId: questId,
            name: quest.name,
            status: 'abandoned',
            timestamp: Date.now()
        });
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('questAbandoned', {
                questId: questId
            });
        }
        
        console.log(`Player ${playerId} abandoned quest: ${quest.name}`);
        
        return { success: true };
    }
    
    async completeQuest(playerId, questId) {
        const playerData = this.getPlayerQuestData(playerId);
        if (!playerData) return { success: false, message: 'Player data not found' };
        
        // Find quest in active quests
        const questIndex = playerData.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) {
            return { success: false, message: 'Quest not found in active quests' };
        }
        
        const quest = playerData.activeQuests[questIndex];
        
        // Check if all objectives are completed
        if (!this.areAllObjectivesCompleted(quest)) {
            return { success: false, message: 'Not all objectives completed' };
        }
        
        // Award rewards
        await this.awardQuestRewards(playerId, quest);
        
        // Move to completed quests
        playerData.activeQuests.splice(questIndex, 1);
        playerData.completedQuests.push({
            questId: questId,
            name: quest.name,
            completedAt: Date.now(),
            rewards: quest.rewards
        });
        
        // Add to history
        playerData.questHistory.push({
            questId: questId,
            name: quest.name,
            status: 'completed',
            timestamp: Date.now()
        });
        
        // Award quest points
        playerData.questPoints += this.calculateQuestPoints(quest);
        
        // Check for next quest in chain
        const nextQuest = this.getNextQuest(playerId, questId);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('questCompleted', {
                quest: quest,
                rewards: quest.rewards,
                questPoints: playerData.questPoints,
                nextQuest: nextQuest
            });
        }
        
        console.log(`Player ${playerId} completed quest: ${quest.name}`);
        
        return { success: true, quest: quest, nextQuest: nextQuest };
    }
    
    areAllObjectivesCompleted(quest) {
        return quest.objectives.every(objective => objective.completed);
    }
    
    async awardQuestRewards(playerId, quest) {
        try {
            const rewards = quest.rewards;
            
            // Award experience
            if (rewards.experience) {
                await this.server.db.run(`
                    UPDATE characters SET experience = experience + ? WHERE player_id = ?
                `, [rewards.experience, playerId]);
            }
            
            // Award gold
            if (rewards.gold) {
                await this.server.db.run(`
                    UPDATE characters SET gold = gold + ? WHERE player_id = ?
                `, [rewards.gold, playerId]);
            }
            
            // Award items
            if (rewards.items) {
                for (const item of rewards.items) {
                    await this.addItemToPlayerInventory(playerId, item);
                }
            }
            
            // Award reputation
            if (rewards.reputation) {
                await this.awardReputation(playerId, rewards.reputation);
            }
            
            // Award titles
            if (rewards.titles) {
                await this.awardTitles(playerId, rewards.titles);
            }
            
        } catch (error) {
            console.error('Error awarding quest rewards:', error);
        }
    }
    
    async addItemToPlayerInventory(playerId, item) {
        // This would integrate with the inventory system
        console.log(`Added item ${item.template} x${item.count} to player ${playerId}`);
    }
    
    async awardReputation(playerId, reputation) {
        // This would integrate with the reputation system
        console.log(`Awarded reputation to player ${playerId}:`, reputation);
    }
    
    async awardTitles(playerId, titles) {
        // This would integrate with the title system
        console.log(`Awarded titles to player ${playerId}:`, titles);
    }
    
    calculateQuestPoints(quest) {
        let points = 0;
        
        // Base points by difficulty
        switch (quest.difficulty) {
            case 'easy': points = 10; break;
            case 'medium': points = 25; break;
            case 'hard': points = 50; break;
            case 'epic': points = 100; break;
        }
        
        // Bonus points by level
        points += quest.level * 2;
        
        return points;
    }
    
    getNextQuest(playerId, completedQuestId) {
        const template = this.questTemplates.get(completedQuestId);
        if (!template || !template.nextQuest) {
            return null;
        }
        
        const nextTemplate = this.questTemplates.get(template.nextQuest);
        if (!nextTemplate) {
            return null;
        }
        
        // Check if player can accept next quest
        if (this.checkPrerequisites(playerId, nextTemplate)) {
            return {
                id: nextTemplate.id,
                name: nextTemplate.name,
                description: nextTemplate.description,
                autoAccept: nextTemplate.autoAccept
            };
        }
        
        return null;
    }
    
    // Objective progress
    updateObjectiveProgress(playerId, objectiveType, target, progress = 1) {
        const playerData = this.getPlayerQuestData(playerId);
        if (!playerData) return;
        
        for (const quest of playerData.activeQuests) {
            for (const objective of quest.objectives) {
                if (objective.type === objectiveType && 
                    (objective.target === target || objective.target === 'any')) {
                    
                    if (objective.type === 'kill' || objective.type === 'collect') {
                        objective.current = Math.min((objective.current || 0) + progress, objective.count);
                    } else {
                        objective.completed = true;
                    }
                    
                    // Check if objective is completed
                    if (objective.type === 'kill' || objective.type === 'collect') {
                        objective.completed = objective.current >= objective.count;
                    }
                    
                    // Notify player of progress
                    this.notifyObjectiveProgress(playerId, quest, objective);
                    
                    // Check if quest is completed
                    if (this.areAllObjectivesCompleted(quest)) {
                        this.notifyQuestCompleted(playerId, quest);
                    }
                }
            }
        }
    }
    
    notifyObjectiveProgress(playerId, quest, objective) {
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('objectiveProgress', {
                questId: quest.id,
                objectiveId: objective.id,
                progress: objective.current,
                completed: objective.completed
            });
        }
    }
    
    notifyQuestCompleted(playerId, quest) {
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('questReadyToTurnIn', {
                quest: quest
            });
        }
    }
    
    // Event handlers
    handlePlayerLevelUp(playerId, newLevel) {
        // Check for new available quests
        const availableQuests = this.getAvailableQuests(playerId);
        
        if (availableQuests.length > 0) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('newQuestsAvailable', {
                    quests: availableQuests
                });
            }
        }
    }
    
    handleEntityDeath(entityId, killerId) {
        const entity = this.server.worldManager.entities.get(entityId);
        if (!entity) return;
        
        // Update kill objectives
        this.updateObjectiveProgress(killerId, 'kill', entity.templateId || entity.type, 1);
    }
    
    handleBossDefeated(bossId, participants) {
        // Update boss kill objectives for all participants
        for (const playerId of participants) {
            this.updateObjectiveProgress(playerId, 'kill_boss', bossId, 1);
        }
    }
    
    handleNPCInteraction(playerId, npcId, interactionType) {
        if (interactionType === 'talk') {
            // Update talk objectives
            this.updateObjectiveProgress(playerId, 'talk', npcId, 1);
        }
    }
    
    handlePOIDiscovered(playerId, poiId) {
        // Update discovery objectives
        this.updateObjectiveProgress(playerId, 'discover', poiId, 1);
    }
    
    handleDungeonCompleted(dungeonId, playerId) {
        // Update dungeon objectives
        this.updateObjectiveProgress(playerId, 'enter_dungeon', dungeonId, 1);
    }
    
    handleItemCollected(playerId, itemTemplate, count) {
        // Update collection objectives
        this.updateObjectiveProgress(playerId, 'collect', itemTemplate, count);
    }
    
    handleDailyReset() {
        console.log('Performing daily quest reset');
        
        // Reset daily quests for all players
        for (const [playerId, playerData] of this.playerQuests) {
            this.resetDailyQuests(playerId);
        }
        
        // Notify server
        this.server.emit('dailyReset');
    }
    
    handleWeeklyReset() {
        console.log('Performing weekly quest reset');
        
        // Reset weekly quests for all players
        for (const [playerId, playerData] of this.playerQuests) {
            this.resetWeeklyQuests(playerId);
        }
        
        // Notify server
        this.server.emit('weeklyReset');
    }
    
    resetDailyQuests(playerId) {
        const playerData = this.getPlayerQuestData(playerId);
        if (!playerData) return;
        
        // Remove completed daily quests
        playerData.dailyQuests = [];
        
        // Add new daily quests
        const dailyQuests = this.getDailyQuests();
        for (const questId of dailyQuests) {
            const quest = this.createQuestInstance(this.questTemplates.get(questId));
            playerData.dailyQuests.push(quest);
        }
        
        playerData.lastDailyReset = Date.now();
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('dailyQuestsReset', {
                quests: playerData.dailyQuests
            });
        }
    }
    
    resetWeeklyQuests(playerId) {
        const playerData = this.getPlayerQuestData(playerId);
        if (!playerData) return;
        
        // Remove completed weekly quests
        playerData.weeklyQuests = [];
        
        // Add new weekly quests
        const weeklyQuests = this.getWeeklyQuests();
        for (const questId of weeklyQuests) {
            const quest = this.createQuestInstance(this.questTemplates.get(questId));
            playerData.weeklyQuests.push(quest);
        }
        
        playerData.lastWeeklyReset = Date.now();
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('weeklyQuestsReset', {
                quests: playerData.weeklyQuests
            });
        }
    }
    
    // Utility methods
    getPlayerQuestData(playerId) {
        if (!this.playerQuests.has(playerId)) {
            this.playerQuests.set(playerId, {
                playerId: playerId,
                activeQuests: [],
                completedQuests: [],
                dailyQuests: [],
                weeklyQuests: [],
                questHistory: [],
                lastDailyReset: 0,
                lastWeeklyReset: 0,
                questPoints: 0
            });
        }
        
        return this.playerQuests.get(playerId);
    }
    
    async getPlayerData(playerId) {
        try {
            const player = await this.server.db.get(
                'SELECT * FROM characters WHERE player_id = ?',
                [playerId]
            );
            return player || { level: 1 };
        } catch (error) {
            console.error('Error getting player data:', error);
            return { level: 1 };
        }
    }
    
    getAvailableQuests(playerId) {
        const playerData = this.getPlayerQuestData(playerId);
        const availableQuests = [];
        
        for (const [questId, template] of this.questTemplates) {
            // Skip if already completed or active
            if (playerData.completedQuests.some(q => q.questId === questId) ||
                playerData.activeQuests.some(q => q.id === questId)) {
                continue;
            }
            
            // Check prerequisites and level
            if (this.checkPrerequisites(playerId, template)) {
                availableQuests.push({
                    id: questId,
                    name: template.name,
                    description: template.description,
                    level: template.level,
                    difficulty: template.difficulty,
                    type: template.type
                });
            }
        }
        
        return availableQuests;
    }
    
    getDailyQuests() {
        // Return a selection of daily quests
        return ['daily_monster_slay'];
    }
    
    getWeeklyQuests() {
        // Return a selection of weekly quests
        return ['weekly_boss_hunt'];
    }
    
    getQuestChain(chainId) {
        return this.questChains.get(chainId);
    }
    
    getQuestProgress(playerId) {
        const playerData = this.getPlayerQuestData(playerId);
        
        return {
            activeQuests: playerData.activeQuests,
            completedQuests: playerData.completedQuests.length,
            dailyQuests: playerData.dailyQuests,
            weeklyQuests: playerData.weeklyQuests,
            questPoints: playerData.questPoints,
            totalQuestsCompleted: playerData.completedQuests.length + playerData.questHistory.length
        };
    }
    
    getQuestLeaderboard(type = 'quest_points', limit = 10) {
        const leaderboard = [];
        
        for (const [playerId, playerData] of this.playerQuests) {
            let score = 0;
            
            switch (type) {
                case 'quest_points':
                    score = playerData.questPoints;
                    break;
                case 'quests_completed':
                    score = playerData.completedQuests.length;
                    break;
                case 'daily_quests':
                    score = playerData.dailyQuests.filter(q => q.status === 'completed').length;
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
    
    // Database operations
    async savePlayerQuestData() {
        try {
            for (const [playerId, data] of this.playerQuests) {
                await this.server.db.run(`
                    INSERT OR REPLACE INTO player_quests 
                    (player_id, active_quests, completed_quests, daily_quests, weekly_quests, quest_history, last_daily_reset, last_weekly_reset, quest_points) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    playerId,
                    JSON.stringify(data.activeQuests),
                    JSON.stringify(data.completedQuests),
                    JSON.stringify(data.dailyQuests),
                    JSON.stringify(data.weeklyQuests),
                    JSON.stringify(data.questHistory),
                    data.lastDailyReset,
                    data.lastWeeklyReset,
                    data.questPoints
                ]);
            }
            
            console.log(`Saved quest data for ${this.playerQuests.size} players`);
            
        } catch (error) {
            console.error('Error saving player quest data:', error);
        }
    }
    
    // Cleanup
    async cleanup() {
        // Save all player quest data
        await this.savePlayerQuestData();
        
        // Clear data
        this.playerQuests.clear();
        
        console.log('Quest System cleanup complete');
    }
}

module.exports = QuestSystem;
