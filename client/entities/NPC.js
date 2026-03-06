/**
 * NPC Entity Class
 * Represents non-player characters with dialogue and services
 */

import Entity from './Entity.js';

class NPC extends Entity {
    constructor(config = {}) {
        super({
            type: 'npc',
            solid: true,
            blocking: true,
            interactive: true,
            ...config
        });
        
        // NPC-specific properties
        this.npcType = config.npcType || 'vendor';
        this.faction = config.faction || 'neutral';
        this.personality = config.personality || 'friendly';
        
        // Dialogue system
        this.dialogueTree = config.dialogueTree || this.createDefaultDialogue();
        this.currentDialogue = null;
        this.dialogueState = {};
        
        // Services
        this.services = config.services || this.getDefaultServices();
        this.shopInventory = config.shopInventory || [];
        this.questGiver = config.questGiver || false;
        this.availableQuests = config.availableQuests || [];
        
        // Behavior
        this.schedule = config.schedule || this.getDefaultSchedule();
        this.currentAction = 'idle';
        this.homePosition = { x: this.x, y: this.y };
        this.patrolPath = config.patrolPath || [];
        this.patrolIndex = 0;
        
        // Relationships
        this.reputation = config.reputation || 0;
        this.relationships = config.relationships || {};
        this.memory = config.memory || {};
        
        // Visual customization
        this.appearance = config.appearance || this.getDefaultAppearance();
        this.equipment = config.equipment || {};
        
        // AI for NPCs
        this.aiConfig = {
            moveSpeed: 0.5,
            interactionRange: 2,
            workHours: { start: 8, end: 20 },
            restHours: { start: 22, end: 6 }
        };
        
        // State tracking
        this.lastInteractionTime = 0;
        this.interactionCooldown = 1000; // 1 second
        this.knownPlayers = new Set();
        
        // Initialize
        this.initializeNPC();
    }
    
    initializeNPC() {
        // Set up initial state
        this.updateAppearance();
        this.generatePatrolPath();
    }
    
    createDefaultDialogue() {
        return {
            greeting: {
                text: "Hello there, traveler!",
                responses: [
                    { text: "Who are you?", next: "introduction" },
                    { text: "What can you do?", next: "services" },
                    { text: "Goodbye", next: "farewell" }
                ]
            },
            introduction: {
                text: "I'm a local merchant. I've been in this town for many years.",
                responses: [
                    { text: "What do you sell?", next: "shop" },
                    { text: "Tell me about this town", next: "town_info" },
                    { text: "Never mind", next: "greeting" }
                ]
            },
            services: {
                text: "I offer various services to help adventurers like yourself.",
                responses: [
                    { text: "Show me your shop", next: "shop", action: "open_shop" },
                    { text: "Do you have any quests?", next: "quests", condition: "has_quests" },
                    { text: "I'll be back later", next: "farewell" }
                ]
            },
            shop: {
                text: "Take a look at my wares!",
                action: "open_shop",
                responses: [
                    { text: "Thanks", next: "greeting" }
                ]
            },
            quests: {
                text: "I do have some tasks that need doing...",
                action: "show_quests",
                responses: [
                    { text: "I'll help", next: "greeting" },
                    { text: "Maybe later", next: "greeting" }
                ]
            },
            town_info: {
                text: "This is a peaceful town, but the surrounding lands can be dangerous. Be careful out there!",
                responses: [
                    { text: "Thanks for the warning", next: "greeting" }
                ]
            },
            farewell: {
                text: "Safe travels, adventurer!",
                responses: []
            }
        };
    }
    
    getDefaultServices() {
        const services = {
            vendor: ['shop', 'repair'],
            blacksmith: ['shop', 'repair', 'craft'],
            alchemist: ['shop', 'craft'],
            innkeeper: ['shop', 'rest'],
            quest_giver: ['quests'],
            guard: ['information'],
            healer: ['heal', 'cure']
        };
        
        return services[this.npcType] || ['talk'];
    }
    
    getDefaultSchedule() {
        return [
            { time: 6, action: 'wake_up', location: 'home' },
            { time: 8, action: 'open_shop', location: 'work' },
            { time: 12, action: 'lunch_break', location: 'tavern' },
            { time: 13, action: 'open_shop', location: 'work' },
            { time: 18, action: 'close_shop', location: 'work' },
            { time: 19, action: 'dinner', location: 'tavern' },
            { time: 21, action: 'go_home', location: 'home' },
            { time: 22, action: 'sleep', location: 'home' }
        ];
    }
    
    getDefaultAppearance() {
        return {
            bodyColor: '#f4c2a1',
            hairColor: '#8b4513',
            eyeColor: '#654321',
            clothing: 'casual',
            accessories: []
        };
    }
    
    updateAppearance() {
        // Update sprite and visual properties based on appearance
        this.color = this.getNPCColor();
    }
    
    getNPCColor() {
        const colors = {
            vendor: '#3b82f6',
            blacksmith: '#6b7280',
            alchemist: '#8b5cf6',
            innkeeper: '#f59e0b',
            guard: '#ef4444',
            healer: '#10b981',
            quest_giver: '#facc15'
        };
        return colors[this.npcType] || '#6b7280';
    }
    
    generatePatrolPath() {
        if (this.patrolPath.length === 0) {
            // Generate simple patrol around home position
            const radius = 3;
            const points = 4;
            
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const x = Math.floor(this.homePosition.x + Math.cos(angle) * radius);
                const y = Math.floor(this.homePosition.y + Math.sin(angle) * radius);
                this.patrolPath.push({ x, y });
            }
        }
    }
    
    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
        
        // Update schedule-based behavior
        this.updateSchedule(deltaTime);
        
        // Update current action
        this.updateCurrentAction(deltaTime);
        
        // Face nearby players
        this.faceNearbyPlayers();
    }
    
    updateSchedule(deltaTime) {
        const hour = new Date().getHours();
        
        // Find current schedule entry
        let currentSchedule = null;
        for (const entry of this.schedule) {
            if (hour >= entry.time) {
                currentSchedule = entry;
            } else {
                break;
            }
        }
        
        if (currentSchedule && this.currentAction !== currentSchedule.action) {
            this.currentAction = currentSchedule.action;
            this.handleScheduleChange(currentSchedule);
        }
    }
    
    handleScheduleChange(schedule) {
        switch (schedule.action) {
            case 'open_shop':
                this.interactive = true;
                this.personality = 'friendly';
                break;
            case 'close_shop':
                this.interactive = false;
                this.personality = 'busy';
                break;
            case 'sleep':
                this.interactive = false;
                this.visible = false;
                break;
            case 'wake_up':
                this.visible = true;
                this.interactive = true;
                break;
        }
    }
    
    updateCurrentAction(deltaTime) {
        switch (this.currentAction) {
            case 'patrol':
                this.updatePatrol(deltaTime);
                break;
            case 'work':
                this.updateWorkBehavior(deltaTime);
                break;
            case 'idle':
                this.updateIdleBehavior(deltaTime);
                break;
        }
    }
    
    updatePatrol(deltaTime) {
        if (this.patrolPath.length === 0) return;
        
        const target = this.patrolPath[this.patrolIndex];
        const distance = this.getDistanceTo(target);
        
        if (distance < 1) {
            this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
        } else {
            this.tryMoveTo(target.x, target.y);
        }
    }
    
    updateWorkBehavior(deltaTime) {
        // NPCs might animate working or stay in place
        if (Math.random() < 0.01) {
            // Occasionally look around
            this.animationState = 'working';
        }
    }
    
    updateIdleBehavior(deltaTime) {
        // Random idle movements
        if (Math.random() < 0.005) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 2;
            const x = Math.floor(this.homePosition.x + Math.cos(angle) * distance);
            const y = Math.floor(this.homePosition.y + Math.sin(angle) * distance);
            this.tryMoveTo(x, y);
        }
    }
    
    faceNearbyPlayers() {
        if (this.entityManager) {
            const nearby = this.entityManager.getEntitiesInRange(this.x, this.y, 3);
            for (const entity of nearby) {
                if (entity.type === 'player') {
                    // Face towards the player
                    const dx = entity.x - this.x;
                    this.facingDirection = dx > 0 ? 'right' : 'left';
                    break;
                }
            }
        }
    }
    
    tryMoveTo(x, y) {
        // NPCs move slower than players
        const now = Date.now();
        const moveDelay = 2000 / this.aiConfig.moveSpeed;
        
        if (now - this.lastMoveTime < moveDelay) {
            return false;
        }
        
        if (this.moveTo(x, y)) {
            this.lastMoveTime = now;
            return true;
        }
        
        return false;
    }
    
    interact(interactor) {
        const now = Date.now();
        if (now - this.lastInteractionTime < this.interactionCooldown) {
            return null;
        }
        
        this.lastInteractionTime = now;
        
        // Remember this player
        if (interactor.type === 'player') {
            this.knownPlayers.add(interactor.id);
            this.updateRelationship(interactor.id, 'interaction', 1);
        }
        
        // Get appropriate dialogue
        const dialogue = this.getDialogueForInteractor(interactor);
        this.currentDialogue = dialogue;
        
        // Check reputation
        const reputation = this.getReputationWithInteractor(interactor);
        
        return {
            type: 'dialogue',
            npc: this,
            dialogue: dialogue,
            reputation: reputation,
            services: this.getAvailableServices(interactor)
        };
    }
    
    getDialogueForInteractor(interactor) {
        // Check if player has met this NPC before
        const hasMet = this.knownPlayers.has(interactor.id);
        
        // Get reputation-based dialogue
        const reputation = this.getReputationWithInteractor(interactor);
        
        // Start with greeting or return greeting
        let dialogueKey = hasMet ? 'return_greeting' : 'greeting';
        
        // Check for special conditions
        if (reputation > 50) {
            dialogueKey = 'friendly_greeting';
        } else if (reputation < -50) {
            dialogueKey = 'unfriendly_greeting';
        }
        
        // Get dialogue from tree
        let dialogue = this.dialogueTree[dialogueKey];
        if (!dialogue) {
            dialogue = this.dialogueTree.greeting;
        }
        
        // Process conditional responses
        dialogue = this.processDialogueConditionals(dialogue, interactor);
        
        return dialogue;
    }
    
    getReputationWithInteractor(interactor) {
        if (interactor.type === 'player') {
            return this.relationships[interactor.id] || 0;
        }
        return 0;
    }
    
    updateRelationship(playerId, type, amount) {
        if (!this.relationships[playerId]) {
            this.relationships[playerId] = 0;
        }
        
        switch (type) {
            case 'interaction':
                this.relationships[playerId] += amount * 0.1;
                break;
            case 'trade':
                this.relationships[playerId] += amount * 0.5;
                break;
            case 'quest_complete':
                this.relationships[playerId] += amount * 2;
                break;
            case 'attack':
                this.relationships[playerId] -= amount * 5;
                break;
        }
        
        // Clamp reputation
        this.relationships[playerId] = Math.max(-100, Math.min(100, this.relationships[playerId]));
    }
    
    processDialogueConditionals(dialogue, interactor) {
        // Create a copy to avoid modifying original
        const processedDialogue = {
            text: dialogue.text,
            responses: [...dialogue.responses]
        };
        
        // Process response conditions
        processedDialogue.responses = processedDialogue.responses.filter(response => {
            if (response.condition) {
                return this.checkDialogueCondition(response.condition, interactor);
            }
            return true;
        });
        
        // Replace dynamic text
        processedDialogue.text = this.replaceDialogueVariables(processedDialogue.text, interactor);
        
        return processedDialogue;
    }
    
    checkDialogueCondition(condition, interactor) {
        switch (condition) {
            case 'has_quests':
                return this.availableQuests.length > 0;
            case 'high_reputation':
                return this.getReputationWithInteractor(interactor) > 50;
            case 'low_reputation':
                return this.getReputationWithInteractor(interactor) < -50;
            case 'first_time':
                return !this.knownPlayers.has(interactor.id);
            default:
                return true;
        }
    }
    
    replaceDialogueVariables(text, interactor) {
        // Replace variables like {player_name}, {time_of_day}, etc.
        return text
            .replace(/{player_name}/g, interactor.name || 'traveler')
            .replace(/{npc_name}/g, this.name)
            .replace(/{time_of_day}/g, this.getTimeOfDay());
    }
    
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 6) return 'night';
        if (hour < 12) return 'morning';
        if (hour < 18) return 'afternoon';
        return 'evening';
    }
    
    getAvailableServices(interactor) {
        const services = [];
        
        for (const service of this.services) {
            if (this.canProvideService(service, interactor)) {
                services.push(service);
            }
        }
        
        return services;
    }
    
    canProvideService(service, interactor) {
        // Check if NPC can provide service based on time, reputation, etc.
        const hour = new Date().getHours();
        const reputation = this.getReputationWithInteractor(interactor);
        
        switch (service) {
            case 'shop':
                return hour >= this.aiConfig.workHours.start && hour <= this.aiConfig.workHours.end;
            case 'heal':
                return this.npcType === 'healer';
            case 'repair':
                return this.npcType === 'blacksmith';
            case 'craft':
                return ['blacksmith', 'alchemist'].includes(this.npcType);
            case 'quests':
                return this.questGiver && this.availableQuests.length > 0;
            default:
                return true;
        }
    }
    
    processDialogueResponse(responseIndex, interactor) {
        if (!this.currentDialogue || !this.currentDialogue.responses[responseIndex]) {
            return null;
        }
        
        const response = this.currentDialogue.responses[responseIndex];
        
        // Execute action if present
        if (response.action) {
            this.executeDialogueAction(response.action, interactor);
        }
        
        // Update relationship
        this.updateRelationship(interactor.id, 'interaction', 1);
        
        // Move to next dialogue or return
        if (response.next) {
            this.currentDialogue = this.dialogueTree[response.next];
            return this.currentDialogue;
        }
        
        return null; // End dialogue
    }
    
    executeDialogueAction(action, interactor) {
        switch (action) {
            case 'open_shop':
                this.openShop(interactor);
                break;
            case 'show_quests':
                this.showQuests(interactor);
                break;
            case 'heal':
                this.healPlayer(interactor);
                break;
            case 'repair':
                this.openRepair(interactor);
                break;
        }
    }
    
    openShop(interactor) {
        if (interactor.openShop) {
            interactor.openShop(this.shopInventory, this);
        }
    }
    
    showQuests(interactor) {
        if (interactor.showQuests) {
            interactor.showQuests(this.availableQuests, this);
        }
    }
    
    healPlayer(interactor) {
        if (interactor.heal && interactor.gold >= 50) {
            interactor.gold -= 50;
            interactor.heal(interactor.maxHealth);
            this.updateRelationship(interactor.id, 'trade', 10);
        }
    }
    
    openRepair(interactor) {
        if (interactor.openRepair) {
            interactor.openRepair(this);
        }
    }
    
    // Quest system integration
    addQuest(quest) {
        this.availableQuests.push(quest);
        this.questGiver = true;
    }
    
    removeQuest(questId) {
        const index = this.availableQuests.findIndex(q => q.id === questId);
        if (index > -1) {
            this.availableQuests.splice(index, 1);
        }
    }
    
    completeQuest(questId, interactor) {
        this.removeQuest(questId);
        this.updateRelationship(interactor.id, 'quest_complete', 10);
        
        // Award reputation bonus
        if (this.reputation !== undefined) {
            this.reputation += 5;
        }
    }
    
    renderEffects(ctx, x, y) {
        super.renderEffects(ctx, x, y);
        
        // Render NPC-specific effects
        if (this.interactive) {
            // Exclamation mark for interactive NPCs
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('!', x + 16, y - 5);
        }
        
        // Render service indicators
        if (this.services.includes('shop')) {
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(x + 28, y + 2, 4, 4);
        }
        
        if (this.questGiver && this.availableQuests.length > 0) {
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.arc(x + 30, y + 6, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Serialization
    serialize() {
        const baseData = super.serialize();
        
        return {
            ...baseData,
            npcType: this.npcType,
            faction: this.faction,
            personality: this.personality,
            dialogueTree: this.dialogueTree,
            services: this.services,
            shopInventory: this.shopInventory,
            questGiver: this.questGiver,
            availableQuests: this.availableQuests,
            schedule: this.schedule,
            reputation: this.reputation,
            relationships: this.relationships,
            appearance: this.appearance,
            equipment: this.equipment,
            knownPlayers: Array.from(this.knownPlayers)
        };
    }
    
    deserialize(data) {
        super.deserialize(data);
        
        this.npcType = data.npcType;
        this.faction = data.faction;
        this.personality = data.personality;
        this.dialogueTree = data.dialogueTree;
        this.services = data.services;
        this.shopInventory = data.shopInventory;
        this.questGiver = data.questGiver;
        this.availableQuests = data.availableQuests;
        this.schedule = data.schedule;
        this.reputation = data.reputation;
        this.relationships = data.relationships;
        this.appearance = data.appearance;
        this.equipment = data.equipment;
        this.knownPlayers = new Set(data.knownPlayers || []);
        
        this.homePosition = { x: this.x, y: this.y };
    }
}

export default NPC;
