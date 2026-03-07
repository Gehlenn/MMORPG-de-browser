/**
 * NPC System - Non-Player Character Management
 * Handles NPCs, vendors, quest givers, and AI behaviors
 * Version 0.3 - First Playable Gameplay Systems
 */

class NPCSystem {
    constructor(server) {
        this.server = server;
        
        // NPC configuration
        this.config = {
            maxNPCsPerChunk: 20,
            aiUpdateInterval: 1000, // 1 second
            interactionRadius: 50,
            respawnTime: 300000, // 5 minutes
            patrolRadius: 100,
            fleeHealth: 0.3 // 30% health
        };
        
        // NPC templates
        this.npcTemplates = new Map();
        this.loadNPCTemplates();
        
        // Active NPCs
        this.activeNPCs = new Map();
        this.npcInstances = new Map();
        
        // AI behaviors
        this.aiBehaviors = new Map();
        this.loadAIBehaviors();
        
        // NPC types
        this.npcTypes = {
            vendor: 'Vendor',
            quest_giver: 'Quest Giver',
            guard: 'Guard',
            blacksmith: 'Blacksmith',
            innkeeper: 'Innkeeper',
            trainer: 'Trainer',
            banker: 'Banker',
            merchant: 'Merchant',
            commoner: 'Commoner',
            hostile: 'Hostile'
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Start AI update loop
        this.startAILoop();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Spawn initial NPCs
        this.spawnInitialNPCs();
        
        console.log('NPC System initialized');
    }
    
    loadNPCTemplates() {
        // Vendor NPCs
        this.npcTemplates.set('weapon_vendor', {
            id: 'weapon_vendor',
            name: 'Weapon Smith',
            type: 'vendor',
            subtype: 'weapons',
            level: 1,
            health: 100,
            maxHealth: 100,
            faction: 'neutral',
            appearance: {
                sprite: 'npc_blacksmith',
                color: '#8B4513'
            },
            dialogue: {
                greeting: 'Welcome! Looking for a fine weapon?',
                farewell: 'Come back anytime!',
                shop: 'Take a look at my wares.'
            },
            inventory: [
                { template: 'sword_common', price: 25, stock: 10 },
                { template: 'sword_uncommon', price: 75, stock: 5 },
                { template: 'axe_common', price: 30, stock: 8 }
            ],
            ai: 'vendor',
            shopType: 'weapons'
        });
        
        this.npcTemplates.set('armor_vendor', {
            id: 'armor_vendor',
            name: 'Armor Merchant',
            type: 'vendor',
            subtype: 'armor',
            level: 1,
            health: 100,
            maxHealth: 100,
            faction: 'neutral',
            appearance: {
                sprite: 'npc_merchant',
                color: '#4169E1'
            },
            dialogue: {
                greeting: 'Need protection? I have the finest armor!',
                farewell: 'Stay safe out there!',
                shop: 'My armor will keep you alive.'
            },
            inventory: [
                { template: 'armor_common', price: 30, stock: 10 },
                { template: 'armor_uncommon', price: 100, stock: 5 },
                { template: 'helmet_common', price: 20, stock: 8 }
            ],
            ai: 'vendor',
            shopType: 'armor'
        });
        
        this.npcTemplates.set('potion_vendor', {
            id: 'potion_vendor',
            name: 'Alchemist',
            type: 'vendor',
            subtype: 'potions',
            level: 1,
            health: 80,
            maxHealth: 80,
            faction: 'neutral',
            appearance: {
                sprite: 'npc_alchemist',
                color: '#9370DB'
            },
            dialogue: {
                greeting: 'Magical potions for all your needs!',
                farewell: 'May magic guide your path!',
                shop: 'These potions have powerful effects.'
            },
            inventory: [
                { template: 'potion_health', price: 15, stock: 20 },
                { template: 'potion_mana', price: 20, stock: 15 },
                { template: 'potion_strength', price: 50, stock: 5 }
            ],
            ai: 'vendor',
            shopType: 'potions'
        });
        
        // Quest Givers
        this.npcTemplates.set('quest_giver_town', {
            id: 'quest_giver_town',
            name: 'Town Mayor',
            type: 'quest_giver',
            subtype: 'town',
            level: 1,
            health: 100,
            maxHealth: 100,
            faction: 'town',
            appearance: {
                sprite: 'npc_mayor',
                color: '#FFD700'
            },
            dialogue: {
                greeting: 'Welcome to our town, adventurer!',
                farewell: 'Good luck on your journey!',
                quest: 'We need your help with something important.'
            },
            quests: ['intro_quest', 'monster_hunt', 'delivery_quest'],
            ai: 'quest_giver'
        });
        
        this.npcTemplates.set('quest_giver_forest', {
            id: 'quest_giver_forest',
            name: 'Forest Ranger',
            type: 'quest_giver',
            subtype: 'forest',
            level: 5,
            health: 120,
            maxHealth: 120,
            faction: 'forest',
            appearance: {
                sprite: 'npc_ranger',
                color: '#228B22'
            },
            dialogue: {
                greeting: 'The forest is in danger, hero.',
                farewell: 'Nature blesses your path.',
                quest: 'Dark forces threaten the woods.'
            },
            quests: ['forest_cleanup', 'wolf_problem', 'ancient_tree'],
            ai: 'quest_giver'
        });
        
        // Service NPCs
        this.npcTemplates.set('blacksmith', {
            id: 'blacksmith',
            name: 'Master Blacksmith',
            type: 'blacksmith',
            subtype: 'crafting',
            level: 10,
            health: 150,
            maxHealth: 150,
            faction: 'neutral',
            appearance: {
                sprite: 'npc_blacksmith',
                color: '#696969'
            },
            dialogue: {
                greeting: 'Need something forged or repaired?',
                farewell: 'May your weapons never fail!',
                service: 'I can craft and repair equipment.'
            },
            services: ['repair', 'craft', 'upgrade'],
            ai: 'service'
        });
        
        this.npcTemplates.set('innkeeper', {
            id: 'innkeeper',
            name: 'Innkeeper',
            type: 'innkeeper',
            subtype: 'rest',
            level: 1,
            health: 100,
            maxHealth: 100,
            faction: 'neutral',
            appearance: {
                sprite: 'npc_innkeeper',
                color: '#DEB887'
            },
            dialogue: {
                greeting: 'Welcome to the inn! Need a room?',
                farewell: 'Rest well, traveler!',
                service: 'Food, drink, and rooms available.'
            },
            services: ['rest', 'food', 'drink'],
            ai: 'service'
        });
        
        // Guards
        this.npcTemplates.set('town_guard', {
            id: 'town_guard',
            name: 'Town Guard',
            type: 'guard',
            subtype: 'town',
            level: 8,
            health: 200,
            maxHealth: 200,
            faction: 'town',
            appearance: {
                sprite: 'npc_guard',
                color: '#708090'
            },
            dialogue: {
                greeting: 'Halt! State your business.',
                farewell: 'Move along, citizen.',
                alert: 'Stop right there, criminal!'
            },
            combat: {
                attack: 15,
                defense: 20,
                weapon: 'sword'
            },
            ai: 'guard'
        });
        
        // Hostile NPCs
        this.npcTemplates.set('bandit', {
            id: 'bandit',
            name: 'Bandit',
            type: 'hostile',
            subtype: 'humanoid',
            level: 6,
            health: 120,
            maxHealth: 120,
            faction: 'bandit',
            appearance: {
                sprite: 'npc_bandit',
                color: '#8B4513'
            },
            dialogue: {
                hostile: 'Your money or your life!',
                victory: 'That\'ll teach you to mess with us!',
                defeat: 'Ugh... you got me...'
            },
            combat: {
                attack: 18,
                defense: 12,
                weapon: 'dagger'
            },
            ai: 'hostile',
            loot: {
                gold: { min: 20, max: 50 },
                items: ['gold_coin', 'bandit_mask']
            }
        });
        
        this.npcTemplates.set('goblin', {
            id: 'goblin',
            name: 'Goblin',
            type: 'hostile',
            subtype: 'monster',
            level: 4,
            health: 80,
            maxHealth: 80,
            faction: 'monster',
            appearance: {
                sprite: 'npc_goblin',
                color: '#556B2F'
            },
            dialogue: {
                hostile: 'Goblin smash!',
                victory: 'Hehehe! Goblin win!',
                defeat: 'Goblin run away!'
            },
            combat: {
                attack: 12,
                defense: 8,
                weapon: 'club'
            },
            ai: 'hostile',
            loot: {
                gold: { min: 5, max: 25 },
                items: ['goblin_ear', 'rusty_dagger']
            }
        });
    }
    
    loadAIBehaviors() {
        // Vendor AI
        this.aiBehaviors.set('vendor', {
            update: (npc) => this.vendorAI(npc),
            states: ['idle', 'attending_customer'],
            defaultState: 'idle'
        });
        
        // Quest Giver AI
        this.aiBehaviors.set('quest_giver', {
            update: (npc) => this.questGiverAI(npc),
            states: ['idle', 'giving_quest', 'rewarding'],
            defaultState: 'idle'
        });
        
        // Service AI
        this.aiBehaviors.set('service', {
            update: (npc) => this.serviceAI(npc),
            states: ['idle', 'providing_service'],
            defaultState: 'idle'
        });
        
        // Guard AI
        this.aiBehaviors.set('guard', {
            update: (npc) => this.guardAI(npc),
            states: ['patrolling', 'chasing', 'fighting', 'returning'],
            defaultState: 'patrolling'
        });
        
        // Hostile AI
        this.aiBehaviors.set('hostile', {
            update: (npc) => this.hostileAI(npc),
            states: ['idle', 'patrolling', 'chasing', 'fighting', 'fleeing'],
            defaultState: 'patrolling'
        });
    }
    
    setupEventHandlers() {
        // Player interaction
        this.server.on('npcInteract', (playerId, npcId, interactionType) => {
            this.handleNPCInteraction(playerId, npcId, interactionType);
        });
        
        // Player attack
        this.server.on('npcAttack', (playerId, npcId) => {
            this.handleNPCAttack(playerId, npcId);
        });
        
        // NPC death
        this.server.on('npcDeath', (npcId, killerId) => {
            this.handleNPCDeath(npcId, killerId);
        });
        
        // Time-based events
        this.server.on('timeChange', (timeData) => {
            this.handleTimeChange(timeData);
        });
    }
    
    startAILoop() {
        setInterval(() => {
            this.updateNPCAI();
        }, this.config.aiUpdateInterval);
    }
    
    spawnInitialNPCs() {
        // Spawn NPCs in starter city
        const cityCenter = {
            x: this.server.worldManager.config.worldWidth * this.server.worldManager.config.chunkSize * this.server.worldManager.config.tileSize / 2,
            y: this.server.worldManager.config.worldHeight * this.server.worldManager.config.chunkSize * this.server.worldManager.config.tileSize / 2
        };
        
        // Spawn vendors
        this.spawnNPC('weapon_vendor', cityCenter.x + 50, cityCenter.y);
        this.spawnNPC('armor_vendor', cityCenter.x - 50, cityCenter.y);
        this.spawnNPC('potion_vendor', cityCenter.x, cityCenter.y + 50);
        
        // Spawn quest givers
        this.spawnNPC('quest_giver_town', cityCenter.x, cityCenter.y - 50);
        
        // Spawn service NPCs
        this.spawnNPC('blacksmith', cityCenter.x + 100, cityCenter.y);
        this.spawnNPC('innkeeper', cityCenter.x - 100, cityCenter.y);
        
        // Spawn guards
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            const distance = 150;
            const x = cityCenter.x + Math.cos(angle) * distance;
            const y = cityCenter.y + Math.sin(angle) * distance;
            this.spawnNPC('town_guard', x, y);
        }
        
        console.log('Spawned initial NPCs in starter city');
    }
    
    // NPC spawning
    spawnNPC(templateId, x, y, options = {}) {
        const template = this.npcTemplates.get(templateId);
        if (!template) {
            console.error(`NPC template not found: ${templateId}`);
            return null;
        }
        
        const npc = {
            id: this.generateNPCId(),
            templateId: templateId,
            name: options.name || template.name,
            type: template.type,
            subtype: template.subtype,
            level: options.level || template.level,
            x: x,
            y: y,
            health: template.health,
            maxHealth: template.maxHealth,
            faction: template.faction,
            appearance: { ...template.appearance },
            dialogue: { ...template.dialogue },
            inventory: template.inventory ? [...template.inventory] : [],
            services: template.services ? [...template.services] : [],
            quests: template.quests ? [...template.quests] : [],
            combat: template.combat ? { ...template.combat } : null,
            loot: template.loot ? { ...template.loot } : null,
            ai: {
                type: template.ai,
                state: 'idle',
                target: null,
                homePosition: { x: x, y: y },
                patrolPath: [],
                currentPatrolIndex: 0,
                lastAction: Date.now(),
                actionCooldown: 2000
            },
            customData: options.customData || {},
            respawnTime: options.respawnTime || this.config.respawnTime,
            lastDeath: 0,
            isActive: true,
            visiblePlayers: new Set()
        };
        
        // Add to active NPCs
        this.activeNPCs.set(npc.id, npc);
        
        // Add to world manager
        this.server.worldManager.addEntity(npc);
        
        console.log(`Spawned NPC: ${npc.name} (${npc.id}) at (${x}, ${y})`);
        
        return npc;
    }
    
    // AI update system
    updateNPCAI() {
        for (const npc of this.activeNPCs.values()) {
            if (!npc.isActive) continue;
            
            const aiBehavior = this.aiBehaviors.get(npc.ai.type);
            if (aiBehavior) {
                try {
                    aiBehavior.update(npc);
                } catch (error) {
                    console.error(`Error updating AI for NPC ${npc.id}:`, error);
                }
            }
        }
    }
    
    // AI behaviors
    vendorAI(npc) {
        const now = Date.now();
        
        // Check for nearby players who might want to shop
        const nearbyPlayers = this.server.worldManager.getNearbyPlayers(
            npc.x, npc.y, this.config.interactionRadius
        );
        
        if (nearbyPlayers.length > 0 && npc.ai.state === 'idle') {
            // Vendor could greet nearby players
            if (Math.random() < 0.1) { // 10% chance to greet
                this.broadcastToNearbyPlayers(npc, {
                    type: 'npc_dialogue',
                    npcId: npc.id,
                    message: npc.dialogue.greeting
                });
            }
        }
    }
    
    questGiverAI(npc) {
        const now = Date.now();
        
        // Check for nearby players who might want quests
        const nearbyPlayers = this.server.worldManager.getNearbyPlayers(
            npc.x, npc.y, this.config.interactionRadius
        );
        
        if (nearbyPlayers.length > 0 && npc.ai.state === 'idle') {
            // Quest giver could hint at available quests
            if (Math.random() < 0.05) { // 5% chance to hint
                this.broadcastToNearbyPlayers(npc, {
                    type: 'npc_dialogue',
                    npcId: npc.id,
                    message: npc.dialogue.quest
                });
            }
        }
    }
    
    serviceAI(npc) {
        const now = Date.now();
        
        // Service NPCs mostly stay idle unless interacted with
        // They might occasionally advertise their services
        if (npc.ai.state === 'idle' && Math.random() < 0.03) { // 3% chance
            this.broadcastToNearbyPlayers(npc, {
                type: 'npc_dialogue',
                npcId: npc.id,
                message: npc.dialogue.service
            });
        }
    }
    
    guardAI(npc) {
        const now = Date.now();
        
        switch (npc.ai.state) {
            case 'patrolling':
                this.guardPatrol(npc);
                break;
            case 'chasing':
                this.guardChase(npc);
                break;
            case 'fighting':
                this.guardFight(npc);
                break;
            case 'returning':
                this.guardReturn(npc);
                break;
        }
        
        // Check for threats
        this.guardCheckThreats(npc);
    }
    
    guardPatrol(npc) {
        const now = Date.now();
        
        if (now - npc.ai.lastAction < npc.ai.actionCooldown) return;
        
        // Create patrol path if not exists
        if (npc.ai.patrolPath.length === 0) {
            this.createPatrolPath(npc);
        }
        
        // Move to next patrol point
        if (npc.ai.patrolPath.length > 0) {
            const targetPoint = npc.ai.patrolPath[npc.ai.currentPatrolIndex];
            const distance = Math.sqrt(
                Math.pow(targetPoint.x - npc.x, 2) + 
                Math.pow(targetPoint.y - npc.y, 2)
            );
            
            if (distance < 5) {
                // Reached patrol point, move to next
                npc.ai.currentPatrolIndex = (npc.ai.currentPatrolIndex + 1) % npc.ai.patrolPath.length;
            } else {
                // Move towards patrol point
                this.moveNPCTowards(npc, targetPoint);
            }
        }
        
        npc.ai.lastAction = now;
    }
    
    guardChase(npc) {
        if (!npc.ai.target) {
            npc.ai.state = 'patrolling';
            return;
        }
        
        const target = this.server.worldManager.players.get(npc.ai.target);
        if (!target) {
            npc.ai.target = null;
            npc.ai.state = 'patrolling';
            return;
        }
        
        const distance = Math.sqrt(
            Math.pow(target.x - npc.x, 2) + 
            Math.pow(target.y - npc.y, 2)
        );
        
        if (distance > 200) {
            // Target too far, return to patrol
            npc.ai.target = null;
            npc.ai.state = 'returning';
        } else if (distance <= 30) {
            // Close enough to fight
            npc.ai.state = 'fighting';
        } else {
            // Chase target
            this.moveNPCTowards(npc, target);
        }
    }
    
    guardFight(npc) {
        if (!npc.ai.target) {
            npc.ai.state = 'patrolling';
            return;
        }
        
        const target = this.server.worldManager.players.get(npc.ai.target);
        if (!target) {
            npc.ai.target = null;
            npc.ai.state = 'patrolling';
            return;
        }
        
        const distance = Math.sqrt(
            Math.pow(target.x - npc.x, 2) + 
            Math.pow(target.y - npc.y, 2)
        );
        
        if (distance > 50) {
            // Target moved away, chase
            npc.ai.state = 'chasing';
        } else {
            // Attack target
            this.attackTarget(npc, target);
        }
    }
    
    guardReturn(npc) {
        const homeDistance = Math.sqrt(
            Math.pow(npc.ai.homePosition.x - npc.x, 2) + 
            Math.pow(npc.ai.homePosition.y - npc.y, 2)
        );
        
        if (homeDistance < 5) {
            // Returned home, resume patrol
            npc.ai.state = 'patrolling';
        } else {
            // Move back home
            this.moveNPCTowards(npc, npc.ai.homePosition);
        }
    }
    
    guardCheckThreats(npc) {
        if (npc.ai.state === 'fighting' || npc.ai.state === 'chasing') return;
        
        // Check for hostile players or NPCs nearby
        const nearbyEntities = this.getNearbyEntities(npc.x, npc.y, 100);
        
        for (const entity of nearbyEntities) {
            if (this.isHostileToNPC(npc, entity)) {
                npc.ai.target = entity.id;
                npc.ai.state = 'chasing';
                
                // Alert other guards
                this.alertNearbyGuards(npc, entity);
                break;
            }
        }
    }
    
    hostileAI(npc) {
        const now = Date.now();
        
        switch (npc.ai.state) {
            case 'idle':
            case 'patrolling':
                this.hostilePatrol(npc);
                break;
            case 'chasing':
                this.hostileChase(npc);
                break;
            case 'fighting':
                this.hostileFight(npc);
                break;
            case 'fleeing':
                this.hostileFlee(npc);
                break;
        }
        
        // Check for targets
        this.hostileCheckTargets(npc);
    }
    
    hostilePatrol(npc) {
        const now = Date.now();
        
        if (now - npc.ai.lastAction < npc.ai.actionCooldown) return;
        
        // Random movement
        if (Math.random() < 0.3) { // 30% chance to move
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30;
            
            const newX = npc.x + Math.cos(angle) * distance;
            const newY = npc.y + Math.sin(angle) * distance;
            
            // Check if movement is valid
            if (this.isValidPosition(newX, newY)) {
                npc.x = newX;
                npc.y = newY;
                this.updateNPCPosition(npc);
            }
        }
        
        npc.ai.lastAction = now;
    }
    
    hostileChase(npc) {
        if (!npc.ai.target) {
            npc.ai.state = 'patrolling';
            return;
        }
        
        const target = this.server.worldManager.players.get(npc.ai.target);
        if (!target) {
            npc.ai.target = null;
            npc.ai.state = 'patrolling';
            return;
        }
        
        const distance = Math.sqrt(
            Math.pow(target.x - npc.x, 2) + 
            Math.pow(target.y - npc.y, 2)
        );
        
        if (distance > 150) {
            // Target too far, give up chase
            npc.ai.target = null;
            npc.ai.state = 'patrolling';
        } else if (distance <= 30) {
            // Close enough to attack
            npc.ai.state = 'fighting';
        } else {
            // Chase target
            this.moveNPCTowards(npc, target);
        }
    }
    
    hostileFight(npc) {
        if (!npc.ai.target) {
            npc.ai.state = 'patrolling';
            return;
        }
        
        const target = this.server.worldManager.players.get(npc.ai.target);
        if (!target) {
            npc.ai.target = null;
            npc.ai.state = 'patrolling';
            return;
        }
        
        const distance = Math.sqrt(
            Math.pow(target.x - npc.x, 2) + 
            Math.pow(target.y - npc.y, 2)
        );
        
        // Check if should flee
        if (npc.health / npc.maxHealth < this.config.fleeHealth) {
            npc.ai.state = 'fleeing';
            return;
        }
        
        if (distance > 50) {
            // Target moved away, chase
            npc.ai.state = 'chasing';
        } else {
            // Attack target
            this.attackTarget(npc, target);
        }
    }
    
    hostileFlee(npc) {
        // Run away from last known threat
        if (npc.ai.target) {
            const target = this.server.worldManager.players.get(npc.ai.target);
            if (target) {
                // Run in opposite direction
                const angle = Math.atan2(npc.y - target.y, npc.x - target.x);
                const distance = 20;
                
                const newX = npc.x + Math.cos(angle) * distance;
                const newY = npc.y + Math.sin(angle) * distance;
                
                if (this.isValidPosition(newX, newY)) {
                    npc.x = newX;
                    npc.y = newY;
                    this.updateNPCPosition(npc);
                }
            }
        }
        
        // Stop fleeing when health is restored or far enough
        if (npc.health / npc.maxHealth > 0.5 || !npc.ai.target) {
            npc.ai.target = null;
            npc.ai.state = 'patrolling';
        }
    }
    
    hostileCheckTargets(npc) {
        if (npc.ai.state === 'fighting' || npc.ai.state === 'chasing') return;
        
        // Check for nearby players
        const nearbyPlayers = this.server.worldManager.getNearbyPlayers(npc.x, npc.y, 80);
        
        if (nearbyPlayers.length > 0) {
            // Attack first player found
            npc.ai.target = nearbyPlayers[0].id;
            npc.ai.state = 'chasing';
            
            // Shout hostile dialogue
            this.broadcastToNearbyPlayers(npc, {
                type: 'npc_dialogue',
                npcId: npc.id,
                message: npc.dialogue.hostile
            });
        }
    }
    
    // Combat system
    attackTarget(npc, target) {
        const now = Date.now();
        
        if (now - npc.ai.lastAction < npc.ai.actionCooldown) return;
        
        if (!npc.combat) return;
        
        // Calculate damage
        const damage = npc.combat.attack + Math.floor(Math.random() * 10);
        
        // Apply damage to target
        // This would integrate with the combat system
        this.server.emit('npcDamagePlayer', {
            npcId: npc.id,
            playerId: target.id,
            damage: damage
        });
        
        npc.ai.lastAction = now;
    }
    
    // Event handlers
    handleNPCInteraction(playerId, npcId, interactionType) {
        const npc = this.activeNPCs.get(npcId);
        if (!npc) return;
        
        const player = this.server.worldManager.players.get(playerId);
        if (!player) return;
        
        // Check distance
        const distance = Math.sqrt(
            Math.pow(player.x - npc.x, 2) + 
            Math.pow(player.y - npc.y, 2)
        );
        
        if (distance > this.config.interactionRadius) {
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('interactionFailed', {
                    reason: 'Too far away'
                });
            }
            return;
        }
        
        // Handle interaction based on type
        switch (interactionType) {
            case 'talk':
                this.handleTalkInteraction(playerId, npc);
                break;
            case 'shop':
                this.handleShopInteraction(playerId, npc);
                break;
            case 'quest':
                this.handleQuestInteraction(playerId, npc);
                break;
            case 'service':
                this.handleServiceInteraction(playerId, npc);
                break;
            case 'attack':
                this.handleNPCAttack(playerId, npcId);
                break;
        }
    }
    
    handleTalkInteraction(playerId, npc) {
        const socket = this.server.getPlayerSocket(playerId);
        if (!socket) return;
        
        // Determine appropriate dialogue
        let message = npc.dialogue.greeting;
        
        if (npc.ai.state === 'fighting') {
            message = 'I\'m busy fighting!';
        } else if (npc.type === 'hostile') {
            message = npc.dialogue.hostile;
        }
        
        socket.emit('npcDialogue', {
            npcId: npc.id,
            npcName: npc.name,
            message: message,
            options: this.getDialogueOptions(npc, playerId)
        });
    }
    
    handleShopInteraction(playerId, npc) {
        if (npc.type !== 'vendor') {
            return;
        }
        
        const socket = this.server.getPlayerSocket(playerId);
        if (!socket) return;
        
        socket.emit('shopOpened', {
            npcId: npc.id,
            shopName: npc.name,
            shopType: npc.shopType,
            inventory: npc.inventory
        });
    }
    
    handleQuestInteraction(playerId, npc) {
        if (npc.type !== 'quest_giver') {
            return;
        }
        
        const socket = this.server.getPlayerSocket(playerId);
        if (!socket) return;
        
        // Get available quests for player
        const availableQuests = this.getAvailableQuests(npc, playerId);
        
        socket.emit('questDialogue', {
            npcId: npc.id,
            npcName: npc.name,
            availableQuests: availableQuests
        });
    }
    
    handleServiceInteraction(playerId, npc) {
        if (!npc.services || npc.services.length === 0) {
            return;
        }
        
        const socket = this.server.getPlayerSocket(playerId);
        if (!socket) return;
        
        socket.emit('serviceMenu', {
            npcId: npc.id,
            npcName: npc.name,
            services: npc.services
        });
    }
    
    handleNPCAttack(playerId, npcId) {
        const npc = this.activeNPCs.get(npcId);
        if (!npc) return;
        
        const player = this.server.worldManager.players.get(playerId);
        if (!player) return;
        
        // Check if NPC is hostile
        if (npc.type !== 'hostile' && npc.faction === 'neutral') {
            // Attacking neutral NPC makes them hostile
            npc.faction = 'hostile';
            npc.ai.type = 'hostile';
        }
        
        // NPC retaliates
        if (npc.combat) {
            npc.ai.target = playerId;
            npc.ai.state = 'fighting';
            
            // Alert nearby guards if attacking town NPC
            if (npc.faction === 'town') {
                this.alertNearbyGuards(npc, player);
            }
        }
    }
    
    handleNPCDeath(npcId, killerId) {
        const npc = this.activeNPCs.get(npcId);
        if (!npc) return;
        
        // Handle death
        npc.isActive = false;
        npc.lastDeath = Date.now();
        
        // Remove from world
        this.server.worldManager.removeEntity(npcId);
        
        // Generate loot if hostile
        if (npc.type === 'hostile' && npc.loot) {
            this.generateNPCLoot(npc, killerId);
        }
        
        // Handle respawn
        if (npc.respawnTime > 0) {
            setTimeout(() => {
                this.respawnNPC(npc);
            }, npc.respawnTime);
        }
        
        // Notify players
        this.broadcastToNearbyPlayers(npc, {
            type: 'npc_death',
            npcId: npcId,
            killerId: killerId
        });
        
        console.log(`NPC ${npc.name} (${npcId}) died, killer: ${killerId}`);
    }
    
    handleTimeChange(timeData) {
        // NPCs might have different behaviors based on time
        for (const npc of this.activeNPCs.values()) {
            if (npc.type === 'vendor' && timeData.hour >= 20) {
                // Vendors close at night
                npc.isActive = false;
            } else if (npc.type === 'vendor' && timeData.hour >= 6) {
                // Vendors open during day
                npc.isActive = true;
            }
        }
    }
    
    // Utility methods
    createPatrolPath(npc) {
        const path = [];
        const numPoints = 4;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints;
            const distance = this.config.patrolRadius;
            
            path.push({
                x: npc.ai.homePosition.x + Math.cos(angle) * distance,
                y: npc.ai.homePosition.y + Math.sin(angle) * distance
            });
        }
        
        npc.ai.patrolPath = path;
        npc.ai.currentPatrolIndex = 0;
    }
    
    moveNPCTowards(npc, target) {
        const dx = target.x - npc.x;
        const dy = target.y - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const moveSpeed = 2; // NPC movement speed
            const moveX = (dx / distance) * moveSpeed;
            const moveY = (dy / distance) * moveSpeed;
            
            const newX = npc.x + moveX;
            const newY = npc.y + moveY;
            
            if (this.isValidPosition(newX, newY)) {
                npc.x = newX;
                npc.y = newY;
                this.updateNPCPosition(npc);
            }
        }
    }
    
    updateNPCPosition(npc) {
        // Notify nearby players of NPC position change
        this.broadcastToNearbyPlayers(npc, {
            type: 'npc_move',
            npcId: npc.id,
            x: npc.x,
            y: npc.y
        });
    }
    
    isValidPosition(x, y) {
        // Check if position is valid (not in walls, etc.)
        // This would integrate with the world collision system
        return true; // Simplified
    }
    
    isHostileToNPC(npc, entity) {
        if (entity.type === 'player') {
            return npc.faction === 'hostile' || 
                   (npc.faction === 'town' && entity.criminal);
        } else if (entity.type === 'npc') {
            return npc.faction !== entity.faction;
        }
        
        return false;
    }
    
    getNearbyEntities(x, y, radius) {
        const entities = [];
        
        // Get nearby players
        const nearbyPlayers = this.server.worldManager.getNearbyPlayers(x, y, radius);
        entities.push(...nearbyPlayers);
        
        // Get nearby NPCs
        for (const npc of this.activeNPCs.values()) {
            const distance = Math.sqrt(
                Math.pow(npc.x - x, 2) + 
                Math.pow(npc.y - y, 2)
            );
            
            if (distance <= radius && npc.id !== npc.id) {
                entities.push(npc);
            }
        }
        
        return entities;
    }
    
    alertNearbyGuards(npc, threat) {
        const nearbyGuards = [];
        
        for (const guard of this.activeNPCs.values()) {
            if (guard.type === 'guard') {
                const distance = Math.sqrt(
                    Math.pow(guard.x - npc.x, 2) + 
                    Math.pow(guard.y - npc.y, 2)
                );
                
                if (distance <= 200) {
                    nearbyGuards.push(guard);
                }
            }
        }
        
        // Alert guards to threat
        for (const guard of nearbyGuards) {
            guard.ai.target = threat.id;
            guard.ai.state = 'chasing';
            
            this.broadcastToNearbyPlayers(guard, {
                type: 'npc_dialogue',
                npcId: guard.id,
                message: guard.dialogue.alert
            });
        }
    }
    
    broadcastToNearbyPlayers(npc, data) {
        const nearbyPlayers = this.server.worldManager.getNearbyPlayers(
            npc.x, npc.y, this.config.interactionRadius
        );
        
        for (const player of nearbyPlayers) {
            const socket = this.server.getPlayerSocket(player.id);
            if (socket) {
                socket.emit('npcUpdate', data);
            }
        }
    }
    
    generateNPCLoot(npc, killerId) {
        if (!npc.loot) return;
        
        const loot = {
            id: this.generateLootId(),
            source: npc,
            sourceId: npc.id,
            location: { x: npc.x, y: npc.y },
            gold: this.generateGoldDrop(npc.loot.gold),
            items: this.generateItemDrops(npc.loot.items),
            createdAt: Date.now(),
            despawnAt: Date.now() + 300000, // 5 minutes
            owner: killerId,
            allowedPlayers: new Set([killerId])
        };
        
        // Add to loot system
        this.server.lootSystem.activeLoot.set(loot.id, loot);
        
        // Notify killer
        const socket = this.server.getPlayerSocket(killerId);
        if (socket) {
            socket.emit('lootSpawned', {
                lootId: loot.id,
                location: loot.location,
                gold: loot.gold,
                itemCount: loot.items.length
            });
        }
    }
    
    generateGoldDrop(goldRange) {
        if (!goldRange) return 0;
        return Math.floor(Math.random() * (goldRange.max - goldRange.min + 1)) + goldRange.min;
    }
    
    generateItemDrops(items) {
        const droppedItems = [];
        
        for (const item of items) {
            if (Math.random() < 0.5) { // 50% chance for each item
                droppedItems.push({
                    id: this.generateItemId(),
                    templateId: item,
                    name: item,
                    count: 1
                });
            }
        }
        
        return droppedItems;
    }
    
    respawnNPC(npc) {
        // Respawn NPC at home position
        npc.x = npc.ai.homePosition.x;
        npc.y = npc.ai.homePosition.y;
        npc.health = npc.maxHealth;
        npc.isActive = true;
        npc.ai.state = 'idle';
        npc.ai.target = null;
        
        // Add back to world
        this.server.worldManager.addEntity(npc);
        
        console.log(`Respawned NPC: ${npc.name} (${npc.id})`);
    }
    
    getDialogueOptions(npc, playerId) {
        const options = [];
        
        if (npc.type === 'vendor') {
            options.push({ id: 'shop', text: 'Show me your wares' });
        }
        
        if (npc.type === 'quest_giver') {
            options.push({ id: 'quest', text: 'Do you have any quests for me?' });
        }
        
        if (npc.services && npc.services.length > 0) {
            options.push({ id: 'service', text: 'What services do you offer?' });
        }
        
        options.push({ id: 'goodbye', text: 'Goodbye' });
        
        return options;
    }
    
    getAvailableQuests(npc, playerId) {
        // This would integrate with the quest system
        // For now, return basic quest info
        return npc.quests.map(questId => ({
            id: questId,
            name: questId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            level: 1,
            description: 'A quest for the brave adventurer.'
        }));
    }
    
    // ID generators
    generateNPCId() {
        return 'npc_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateLootId() {
        return 'loot_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateItemId() {
        return 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Public API
    getNPC(npcId) {
        return this.activeNPCs.get(npcId);
    }
    
    getNPCsInArea(x, y, radius) {
        const npcs = [];
        
        for (const npc of this.activeNPCs.values()) {
            const distance = Math.sqrt(
                Math.pow(npc.x - x, 2) + 
                Math.pow(npc.y - y, 2)
            );
            
            if (distance <= radius) {
                npcs.push({
                    id: npc.id,
                    name: npc.name,
                    type: npc.type,
                    x: npc.x,
                    y: npc.y,
                    appearance: npc.appearance
                });
            }
        }
        
        return npcs;
    }
    
    getNPCStats() {
        const stats = {
            totalNPCs: this.activeNPCs.size,
            activeNPCs: Array.from(this.activeNPCs.values()).filter(npc => npc.isActive).length,
            byType: {}
        };
        
        for (const npc of this.activeNPCs.values()) {
            if (!stats.byType[npc.type]) {
                stats.byType[npc.type] = 0;
            }
            stats.byType[npc.type]++;
        }
        
        return stats;
    }
    
    // Cleanup
    cleanup() {
        this.activeNPCs.clear();
        this.npcInstances.clear();
        
        console.log('NPC System cleanup complete');
    }
}

module.exports = NPCSystem;
