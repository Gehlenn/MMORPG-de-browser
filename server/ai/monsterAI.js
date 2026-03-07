/**
 * Monster AI System - Advanced Monster Behaviors
 * Implements complex AI behaviors, pathfinding, and decision making
 * Version 0.3 - Complete Architecture Integration
 */

class MonsterAI {
    constructor(worldManager, combatSystem, aggroSystem) {
        this.worldManager = worldManager;
        this.combatSystem = combatSystem;
        this.aggroSystem = aggroSystem;
        
        // AI configuration
        this.config = {
            updateInterval: 500, // AI updates every 500ms
            pathfindingInterval: 1000, // Pathfinding updates every 1 second
            decisionTimeout: 2000, // Max time for AI decisions
            maxPathLength: 50, // Maximum path nodes
            obstacleAvoidanceDistance: 10,
            formationDistance: 15,
            
            // AI difficulty settings
            reactionTime: { easy: 1500, normal: 1000, hard: 500, expert: 250 },
            accuracyBonus: { easy: -0.1, normal: 0, hard: 0.1, expert: 0.2 },
            damageBonus: { easy: 0.8, normal: 1.0, hard: 1.2, expert: 1.5 },
            
            // Behavior probabilities
            skillUsageChance: 0.3,
            repositionChance: 0.2,
            retreatChance: 0.1,
            assistChance: 0.4
        };
        
        // AI states
        this.aiStates = new Map(); // monsterId -> AI state
        this.behaviorTrees = new Map(); // monsterType -> behavior tree
        this.pathfindingCache = new Map(); // Cache for pathfinding results
        
        // Decision making
        this.decisionContexts = new Map(); // monsterId -> decision context
        this.behaviorWeights = new Map(); // monsterType -> behavior weights
        
        // Movement and pathfinding
        this.movementStates = new Map(); // monsterId -> movement state
        this.patrolPaths = new Map(); // monsterId -> patrol path
        this.formationData = new Map(); // groupId -> formation data
        
        // AI statistics
        this.aiStats = {
            totalDecisions: 0,
            averageDecisionTime: 0,
            skillUsageCount: 0,
            retreatCount: 0,
            assistCount: 0,
            pathfindingRequests: 0,
            successfulPathfinds: 0
        };
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Initialize behavior trees
        this.initializeBehaviorTrees();
        
        // Initialize behavior weights
        this.initializeBehaviorWeights();
        
        // Setup AI update loop
        this.startAILoop();
        
        // Setup pathfinding loop
        this.startPathfindingLoop();
        
        console.log('Monster AI System initialized');
    }
    
    initializeBehaviorTrees() {
        // Basic melee AI
        this.behaviorTrees.set('basic_melee', {
            name: 'Basic Melee',
            priority: 1,
            nodes: [
                {
                    type: 'selector',
                    name: 'Root Selector',
                    children: [
                        {
                            type: 'sequence',
                            name: 'Combat Sequence',
                            condition: (context) => context.inCombat,
                            children: [
                                { type: 'action', name: 'Check Target', action: 'checkTarget' },
                                { type: 'action', name: 'Move to Target', action: 'moveToTarget' },
                                { type: 'action', name: 'Attack', action: 'attack' }
                            ]
                        },
                        {
                            type: 'sequence',
                            name: 'Patrol Sequence',
                            condition: (context) => !context.inCombat && context.canPatrol,
                            children: [
                                { type: 'action', name: 'Patrol', action: 'patrol' }
                            ]
                        },
                        {
                            type: 'action',
                            name: 'Idle',
                            action: 'idle'
                        }
                    ]
                }
            ]
        });
        
        // Ranged AI
        this.behaviorTrees.set('ranged', {
            name: 'Ranged',
            priority: 1,
            nodes: [
                {
                    type: 'selector',
                    name: 'Root Selector',
                    children: [
                        {
                            type: 'sequence',
                            name: 'Combat Sequence',
                            condition: (context) => context.inCombat,
                            children: [
                                { type: 'action', name: 'Check Target', action: 'checkTarget' },
                                { type: 'decorator', name: 'Maintain Distance', decorator: 'maintainDistance',
                                    child: { type: 'action', name: 'Ranged Attack', action: 'rangedAttack' }
                                }
                            ]
                        },
                        {
                            type: 'sequence',
                            name: 'Patrol Sequence',
                            condition: (context) => !context.inCombat && context.canPatrol,
                            children: [
                                { type: 'action', name: 'Patrol', action: 'patrol' }
                            ]
                        },
                        {
                            type: 'action',
                            name: 'Idle',
                            action: 'idle'
                        }
                    ]
                }
            ]
        });
        
        // Pack hunter AI
        this.behaviorTrees.set('pack_hunter', {
            name: 'Pack Hunter',
            priority: 2,
            nodes: [
                {
                    type: 'selector',
                    name: 'Root Selector',
                    children: [
                        {
                            type: 'sequence',
                            name: 'Combat Sequence',
                            condition: (context) => context.inCombat,
                            children: [
                                { type: 'action', name: 'Check Pack', action: 'checkPack' },
                                { type: 'action', name: 'Coordinate Attack', action: 'coordinateAttack' },
                                { type: 'action', name: 'Attack', action: 'attack' }
                            ]
                        },
                        {
                            type: 'sequence',
                            name: 'Pack Patrol',
                            condition: (context) => !context.inCombat && context.canPatrol,
                            children: [
                                { type: 'action', name: 'Pack Patrol', action: 'packPatrol' }
                            ]
                        },
                        {
                            type: 'action',
                            name: 'Idle',
                            action: 'idle'
                        }
                    ]
                }
            ]
        });
        
        // Caster AI
        this.behaviorTrees.set('caster', {
            name: 'Caster',
            priority: 2,
            nodes: [
                {
                    type: 'selector',
                    name: 'Root Selector',
                    children: [
                        {
                            type: 'sequence',
                            name: 'Combat Sequence',
                            condition: (context) => context.inCombat,
                            children: [
                                { type: 'action', name: 'Check Mana', action: 'checkMana' },
                                { type: 'selector', name: 'Spell Selector',
                                    children: [
                                        { type: 'decorator', name: 'Low Health', decorator: 'healthCheck',
                                            child: { type: 'action', name: 'Heal', action: 'castHeal' }
                                        },
                                        { type: 'decorator', name: 'Buff Check', decorator: 'buffCheck',
                                            child: { type: 'action', name: 'Buff', action: 'castBuff' }
                                        },
                                        { type: 'action', name: 'Attack Spell', action: 'castAttackSpell' }
                                    ]
                                }
                            ]
                        },
                        {
                            type: 'sequence',
                            name: 'Patrol Sequence',
                            condition: (context) => !context.inCombat && context.canPatrol,
                            children: [
                                { type: 'action', name: 'Patrol', action: 'patrol' }
                            ]
                        },
                        {
                            type: 'action',
                            name: 'Idle',
                            action: 'idle'
                        }
                    ]
                }
            ]
        });
        
        // Tank AI
        this.behaviorTrees.set('tank', {
            name: 'Tank',
            priority: 2,
            nodes: [
                {
                    type: 'selector',
                    name: 'Root Selector',
                    children: [
                        {
                            type: 'sequence',
                            name: 'Combat Sequence',
                            condition: (context) => context.inCombat,
                            children: [
                                { type: 'action', name: 'Check Threat', action: 'checkThreat' },
                                { type: 'selector', name: 'Tank Action Selector',
                                    children: [
                                        { type: 'decorator', name: 'Low Health', decorator: 'healthCheck',
                                            child: { type: 'action', name: 'Defensive Stance', action: 'defensiveStance' }
                                        },
                                        { type: 'decorator', name: 'Losing Aggro', decorator: 'aggroCheck',
                                            child: { type: 'action', name: 'Taunt', action: 'taunt' }
                                        },
                                        { type: 'action', name: 'Attack', action: 'attack' }
                                    ]
                                }
                            ]
                        },
                        {
                            type: 'sequence',
                            name: 'Patrol Sequence',
                            condition: (context) => !context.inCombat && context.canPatrol,
                            children: [
                                { type: 'action', name: 'Patrol', action: 'patrol' }
                            ]
                        },
                        {
                            type: 'action',
                            name: 'Idle',
                            action: 'idle'
                        }
                    ]
                }
            ]
        });
        
        // Boss AI
        this.behaviorTrees.set('boss', {
            name: 'Boss',
            priority: 3,
            nodes: [
                {
                    type: 'selector',
                    name: 'Root Selector',
                    children: [
                        {
                            type: 'sequence',
                            name: 'Combat Sequence',
                            condition: (context) => context.inCombat,
                            children: [
                                { type: 'action', name: 'Check Phase', action: 'checkPhase' },
                                { type: 'selector', name: 'Phase Action Selector',
                                    children: [
                                        { type: 'sequence', name: 'Phase 1',
                                            condition: (context) => context.phase === 1,
                                            children: [
                                                { type: 'action', name: 'Basic Attack', action: 'basicAttack' },
                                                { type: 'decorator', name: 'Timer Check', decorator: 'abilityTimer',
                                                    child: { type: 'action', name: 'Special Ability', action: 'specialAbility' }
                                                }
                                            ]
                                        },
                                        { type: 'sequence', name: 'Phase 2',
                                            condition: (context) => context.phase === 2,
                                            children: [
                                                { type: 'action', name: 'Enraged Attack', action: 'enragedAttack' },
                                                { type: 'decorator', name: 'Health Check', decorator: 'healthCheck',
                                                    child: { type: 'action', name: 'Summon Minions', action: 'summonMinions' }
                                                }
                                            ]
                                        },
                                        { type: 'sequence', name: 'Phase 3',
                                            condition: (context) => context.phase === 3,
                                            children: [
                                                { type: 'action', name: 'Ultimate Attack', action: 'ultimateAttack' }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            type: 'action',
                            name: 'Idle',
                            action: 'idle'
                        }
                    ]
                }
            ]
        });
    }
    
    initializeBehaviorWeights() {
        // Weights for decision making
        this.behaviorWeights.set('basic_melee', {
            attack: 0.7,
            move: 0.2,
            skill: 0.1,
            retreat: 0.05
        });
        
        this.behaviorWeights.set('ranged', {
            attack: 0.5,
            move: 0.3,
            skill: 0.2,
            retreat: 0.1
        });
        
        this.behaviorWeights.set('pack_hunter', {
            attack: 0.6,
            move: 0.2,
            skill: 0.15,
            coordinate: 0.05,
            retreat: 0.05
        });
        
        this.behaviorWeights.set('caster', {
            attack: 0.3,
            move: 0.1,
            skill: 0.5,
            heal: 0.1,
            retreat: 0.15
        });
        
        this.behaviorWeights.set('tank', {
            attack: 0.4,
            move: 0.1,
            skill: 0.3,
            taunt: 0.15,
            retreat: 0.02
        });
        
        this.behaviorWeights.set('boss', {
            attack: 0.3,
            move: 0.1,
            skill: 0.4,
            special: 0.15,
            summon: 0.05,
            retreat: 0.0
        });
    }
    
    startAILoop() {
        setInterval(() => {
            this.updateAllAI();
        }, this.config.updateInterval);
    }
    
    startPathfindingLoop() {
        setInterval(() => {
            this.updatePathfinding();
        }, this.config.pathfindingInterval);
    }
    
    // Main AI update
    updateAllAI() {
        const startTime = Date.now();
        
        for (const [regionId, region] of this.worldManager.regions) {
            for (const [monsterId, monster] of region.monsters) {
                if (monster.isDead) continue;
                
                this.updateMonsterAI(monsterId, monster);
            }
        }
        
        const updateTime = Date.now() - startTime;
        this.updateAIStatistics(updateTime);
    }
    
    updateMonsterAI(monsterId, monster) {
        // Get or create AI state
        let aiState = this.aiStates.get(monsterId);
        if (!aiState) {
            aiState = this.createAIState(monsterId, monster);
            this.aiStates.set(monsterId, aiState);
        }
        
        // Update context
        const context = this.updateAIContext(monsterId, monster, aiState);
        
        // Execute behavior tree
        const behaviorTree = this.getBehaviorTree(monster);
        if (behaviorTree) {
            this.executeBehaviorTree(monsterId, monster, behaviorTree, context);
        }
        
        // Update AI state
        aiState.lastUpdate = Date.now();
        aiState.context = context;
    }
    
    createAIState(monsterId, monster) {
        return {
            monsterId: monsterId,
            behaviorType: monster.ai || 'basic_melee',
            currentAction: 'idle',
            actionStartTime: 0,
            lastDecision: 0,
            decisionHistory: [],
            
            // Movement state
            position: { x: monster.x, y: monster.y },
            targetPosition: null,
            path: [],
            patrolIndex: 0,
            
            // Combat state
            inCombat: false,
            target: null,
            lastAttackTime: 0,
            skillCooldowns: new Map(),
            
            // AI memory
            knownEnemies: new Set(),
            knownAllies: new Set(),
            threatMap: new Map(),
            
            // State flags
            canPatrol: monster.canPatrol !== false,
            canMove: monster.canMove !== false,
            isRetreating: false,
            isCoordinating: false,
            
            // Boss specific
            phase: 1,
            phaseStartTime: Date.now(),
            abilityTimers: new Map(),
            
            lastUpdate: Date.now()
        };
    }
    
    updateAIContext(monsterId, monster, aiState) {
        const context = {
            monsterId: monsterId,
            monster: monster,
            aiState: aiState,
            
            // Combat status
            inCombat: monster.combatId !== null,
            target: monster.target,
            healthPercent: monster.currentHealth / monster.maxHealth,
            manaPercent: (monster.currentMana || 0) / (monster.maxMana || 50),
            
            // Environment
            nearbyEnemies: this.getNearbyEnemies(monsterId, 100),
            nearbyAllies: this.getNearbyAllies(monsterId, 100),
            obstacles: this.getNearbyObstacles(monsterId, 50),
            
            // Timing
            currentTime: Date.now(),
            timeSinceLastAction: Date.now() - aiState.actionStartTime,
            timeSinceLastAttack: Date.now() - aiState.lastAttackTime,
            
            // Cooldowns
            skillCooldowns: aiState.skillCooldowns,
            canUseSkill: (skillId) => !aiState.skillCooldowns.has(skillId) || 
                                Date.now() > aiState.skillCooldowns.get(skillId)
        };
        
        return context;
    }
    
    executeBehaviorTree(monsterId, monster, behaviorTree, context) {
        const startTime = Date.now();
        
        try {
            const result = this.executeNode(behaviorTree.nodes[0], context);
            
            if (result && result.action) {
                this.executeAction(monsterId, monster, result.action, context);
            }
            
            // Record decision
            this.recordDecision(monsterId, result, Date.now() - startTime);
            
        } catch (error) {
            console.error(`AI execution error for monster ${monsterId}:`, error);
        }
    }
    
    executeNode(node, context) {
        // Check condition if exists
        if (node.condition && !node.condition(context)) {
            return null;
        }
        
        switch (node.type) {
            case 'selector':
                return this.executeSelector(node, context);
            case 'sequence':
                return this.executeSequence(node, context);
            case 'action':
                return this.executeActionNode(node, context);
            case 'decorator':
                return this.executeDecorator(node, context);
            default:
                return null;
        }
    }
    
    executeSelector(node, context) {
        for (const child of node.children) {
            const result = this.executeNode(child, context);
            if (result) {
                return result;
            }
        }
        return null;
    }
    
    executeSequence(node, context) {
        let lastResult = null;
        
        for (const child of node.children) {
            lastResult = this.executeNode(child, context);
            if (!lastResult) {
                return null; // Sequence failed
            }
        }
        
        return lastResult;
    }
    
    executeActionNode(node, context) {
        return { action: node.action, context: context };
    }
    
    executeDecorator(node, context) {
        const result = this.executeNode(node.child, context);
        
        if (result && this.checkDecorator(node.decorator, context)) {
            return result;
        }
        
        return null;
    }
    
    checkDecorator(decorator, context) {
        switch (decorator) {
            case 'maintainDistance':
                return this.maintainDistance(context);
            case 'healthCheck':
                return context.healthPercent < 0.3;
            case 'buffCheck':
                return this.needsBuff(context);
            case 'aggroCheck':
                return this.losingAggro(context);
            case 'abilityTimer':
                return this.canUseSpecialAbility(context);
            default:
                return true;
        }
    }
    
    // Action execution
    executeAction(monsterId, monster, action, context) {
        const aiState = this.aiStates.get(monsterId);
        
        switch (action) {
            case 'idle':
                this.executeIdle(monsterId, monster, context);
                break;
            case 'patrol':
                this.executePatrol(monsterId, monster, context);
                break;
            case 'packPatrol':
                this.executePackPatrol(monsterId, monster, context);
                break;
            case 'checkTarget':
                this.executeCheckTarget(monsterId, monster, context);
                break;
            case 'moveToTarget':
                this.executeMoveToTarget(monsterId, monster, context);
                break;
            case 'attack':
                this.executeAttack(monsterId, monster, context);
                break;
            case 'rangedAttack':
                this.executeRangedAttack(monsterId, monster, context);
                break;
            case 'checkPack':
                this.executeCheckPack(monsterId, monster, context);
                break;
            case 'coordinateAttack':
                this.executeCoordinateAttack(monsterId, monster, context);
                break;
            case 'checkMana':
                this.executeCheckMana(monsterId, monster, context);
                break;
            case 'castHeal':
                this.executeCastHeal(monsterId, monster, context);
                break;
            case 'castBuff':
                this.executeCastBuff(monsterId, monster, context);
                break;
            case 'castAttackSpell':
                this.executeCastAttackSpell(monsterId, monster, context);
                break;
            case 'checkThreat':
                this.executeCheckThreat(monsterId, monster, context);
                break;
            case 'defensiveStance':
                this.executeDefensiveStance(monsterId, monster, context);
                break;
            case 'taunt':
                this.executeTaunt(monsterId, monster, context);
                break;
            case 'checkPhase':
                this.executeCheckPhase(monsterId, monster, context);
                break;
            case 'basicAttack':
                this.executeBasicAttack(monsterId, monster, context);
                break;
            case 'specialAbility':
                this.executeSpecialAbility(monsterId, monster, context);
                break;
            case 'enragedAttack':
                this.executeEnragedAttack(monsterId, monster, context);
                break;
            case 'summonMinions':
                this.executeSummonMinions(monsterId, monster, context);
                break;
            case 'ultimateAttack':
                this.executeUltimateAttack(monsterId, monster, context);
                break;
        }
        
        aiState.currentAction = action;
        aiState.actionStartTime = Date.now();
    }
    
    // Individual action implementations
    executeIdle(monsterId, monster, context) {
        // Idle behavior - random small movements
        if (Math.random() < 0.1) { // 10% chance to move
            const randomX = monster.x + (Math.random() - 0.5) * 10;
            const randomY = monster.y + (Math.random() - 0.5) * 10;
            this.moveMonster(monsterId, randomX, randomY);
        }
    }
    
    executePatrol(monsterId, monster, context) {
        const aiState = this.aiStates.get(monsterId);
        
        // Create patrol path if not exists
        if (!this.patrolPaths.has(monsterId)) {
            this.createPatrolPath(monsterId, monster);
        }
        
        const patrolPath = this.patrolPaths.get(monsterId);
        if (patrolPath.length === 0) return;
        
        // Move to next patrol point
        const targetPoint = patrolPath[aiState.patrolIndex];
        const distance = this.calculateDistance(monster, targetPoint);
        
        if (distance < 5) {
            // Reached patrol point, move to next
            aiState.patrolIndex = (aiState.patrolIndex + 1) % patrolPath.length;
        } else {
            // Move towards patrol point
            this.moveMonsterTowards(monsterId, targetPoint.x, targetPoint.y);
        }
    }
    
    executePackPatrol(monsterId, monster, context) {
        // Patrol while maintaining formation with pack
        const packMembers = this.getNearbyAllies(monsterId, 50);
        
        if (packMembers.length > 0) {
            // Move in formation
            this.maintainFormation(monsterId, packMembers);
        } else {
            // Fall back to normal patrol
            this.executePatrol(monsterId, monster, context);
        }
    }
    
    executeCheckTarget(monsterId, monster, context) {
        // Verify target is still valid and in range
        if (!context.target) {
            // Find new target
            const newTarget = this.findBestTarget(monsterId, context);
            if (newTarget) {
                monster.target = newTarget;
                context.target = newTarget;
            }
        }
    }
    
    executeMoveToTarget(monsterId, monster, context) {
        if (!context.target) return;
        
        const target = this.getEntity(context.target);
        if (!target) return;
        
        const distance = this.calculateDistance(monster, target);
        const attackRange = monster.attackRange || 30;
        
        if (distance > attackRange) {
            // Move towards target
            this.moveMonsterTowards(monsterId, target.x, target.y);
        }
    }
    
    executeAttack(monsterId, monster, context) {
        if (!context.target) return;
        
        const target = this.getEntity(context.target);
        if (!target) return;
        
        const distance = this.calculateDistance(monster, target);
        const attackRange = monster.attackRange || 30;
        
        if (distance <= attackRange) {
            // Check attack cooldown
            const now = Date.now();
            const attackSpeed = monster.attackSpeed || 2000;
            
            if (now - context.aiState.lastAttackTime >= attackSpeed) {
                // Perform attack
                this.performAttack(monsterId, context.target);
                context.aiState.lastAttackTime = now;
            }
        } else {
            // Move towards target
            this.executeMoveToTarget(monsterId, monster, context);
        }
    }
    
    executeRangedAttack(monsterId, monster, context) {
        if (!context.target) return;
        
        const target = this.getEntity(context.target);
        if (!target) return;
        
        const distance = this.calculateDistance(monster, target);
        const minRange = monster.minRange || 20;
        const maxRange = monster.maxRange || 80;
        
        if (distance < minRange) {
            // Too close, move away
            this.moveMonsterAway(monsterId, target.x, target.y);
        } else if (distance > maxRange) {
            // Too far, move closer
            this.moveMonsterTowards(monsterId, target.x, target.y);
        } else {
            // In range, attack
            const now = Date.now();
            const attackSpeed = monster.attackSpeed || 2500;
            
            if (now - context.aiState.lastAttackTime >= attackSpeed) {
                this.performRangedAttack(monsterId, context.target);
                context.aiState.lastAttackTime = now;
            }
        }
    }
    
    executeCheckPack(monsterId, monster, context) {
        // Check pack status and coordination
        const packMembers = this.getNearbyAllies(monsterId, 100);
        context.aiState.packMembers = packMembers;
        
        // Update pack coordination
        if (packMembers.length > 0) {
            this.coordinatePack(monsterId, packMembers, context);
        }
    }
    
    executeCoordinateAttack(monsterId, monster, context) {
        // Coordinate attack with pack members
        const packMembers = context.aiState.packMembers || [];
        
        // Find pack's target
        let packTarget = null;
        for (const member of packMembers) {
            if (member.target) {
                packTarget = member.target;
                break;
            }
        }
        
        if (packTarget) {
            monster.target = packTarget;
            context.target = packTarget;
        }
        
        // Attack with slight delay for coordination
        setTimeout(() => {
            this.executeAttack(monsterId, monster, context);
        }, Math.random() * 500);
    }
    
    executeCheckMana(monsterId, monster, context) {
        // Check if monster has enough mana for spells
        if (context.manaPercent < 0.2) {
            // Low mana, switch to basic attacks
            monster.aiMode = 'melee';
        } else {
            monster.aiMode = 'caster';
        }
    }
    
    executeCastHeal(monsterId, monster, context) {
        // Find ally with lowest health
        const allies = this.getNearbyAllies(monsterId, 50);
        let targetAlly = null;
        let lowestHealth = 1.0;
        
        for (const ally of allies) {
            const healthPercent = ally.currentHealth / ally.maxHealth;
            if (healthPercent < lowestHealth) {
                lowestHealth = healthPercent;
                targetAlly = ally;
            }
        }
        
        if (targetAlly && lowestHealth < 0.5) {
            this.castSpell(monsterId, targetAlly.id, 'heal');
        }
    }
    
    executeCastBuff(monsterId, monster, context) {
        // Cast buff on self or allies
        const needsBuff = this.checkBuffNeeds(monsterId, context);
        
        if (needsBuff) {
            this.castSpell(monsterId, monsterId, needsBuff);
        }
    }
    
    executeCastAttackSpell(monsterId, monster, context) {
        if (!context.target) return;
        
        // Choose best attack spell
        const spell = this.chooseAttackSpell(monsterId, context);
        if (spell) {
            this.castSpell(monsterId, context.target, spell);
        }
    }
    
    executeCheckThreat(monsterId, monster, context) {
        // Check threat levels and adjust strategy
        const aggroTable = this.aggroSystem.getAggroTable(monsterId);
        if (!aggroTable) return;
        
        // Find highest threat target
        let highestThreat = 0;
        let highestThreatTarget = null;
        
        for (const [playerId, threat] of aggroTable) {
            if (threat > highestThreat) {
                highestThreat = threat;
                highestThreatTarget = playerId;
            }
        }
        
        if (highestThreatTarget !== monster.target) {
            monster.target = highestThreatTarget;
            context.target = highestThreatTarget;
        }
    }
    
    executeDefensiveStance(monsterId, monster, context) {
        // Apply defensive buff
        this.applyStatusEffect(monsterId, 'defensive_stance', 10000);
    }
    
    executeTaunt(monsterId, monster, context) {
        // Taunt highest threat target
        const highestThreatTarget = this.aggroSystem.getHighestThreatTarget(monsterId);
        if (highestThreatTarget) {
            this.aggroSystem.addThreat(monsterId, highestThreatTarget, 100, 'taunt');
        }
    }
    
    executeCheckPhase(monsterId, monster, context) {
        // Boss phase management
        const healthPercent = context.healthPercent;
        let newPhase = context.aiState.phase;
        
        if (healthPercent < 0.25 && newPhase < 3) {
            newPhase = 3;
        } else if (healthPercent < 0.5 && newPhase < 2) {
            newPhase = 2;
        }
        
        if (newPhase !== context.aiState.phase) {
            context.aiState.phase = newPhase;
            context.aiState.phaseStartTime = Date.now();
            this.notifyPhaseChange(monsterId, newPhase);
        }
    }
    
    executeBasicAttack(monsterId, monster, context) {
        this.executeAttack(monsterId, monster, context);
    }
    
    executeSpecialAbility(monsterId, monster, context) {
        // Execute special ability based on phase
        const abilities = this.getBossAbilities(context.aiState.phase);
        if (abilities.length > 0) {
            const ability = abilities[Math.floor(Math.random() * abilities.length)];
            this.executeBossAbility(monsterId, ability, context);
        }
    }
    
    executeEnragedAttack(monsterId, monster, context) {
        // Enhanced attack in phase 2
        monster.attackMultiplier = 1.5;
        this.executeAttack(monsterId, monster, context);
        monster.attackMultiplier = 1.0;
    }
    
    executeSummonMinions(monsterId, monster, context) {
        // Summon minions to assist
        const minionCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < minionCount; i++) {
            const offsetX = (Math.random() - 0.5) * 40;
            const offsetY = (Math.random() - 0.5) * 40;
            
            this.summonMinion(monsterId, monster.x + offsetX, monster.y + offsetY);
        }
    }
    
    executeUltimateAttack(monsterId, monster, context) {
        // Powerful ultimate attack in phase 3
        this.executeBossAbility(monsterId, 'ultimate_attack', context);
    }
    
    // Movement and pathfinding
    moveMonster(monsterId, x, y) {
        const monster = this.getMonster(monsterId);
        if (!monster || !this.canMoveTo(monsterId, x, y)) return;
        
        monster.x = x;
        monster.y = y;
        
        // Update AI state
        const aiState = this.aiStates.get(monsterId);
        if (aiState) {
            aiState.position = { x, y };
        }
        
        // Notify movement
        this.notifyMonsterMovement(monsterId, x, y);
    }
    
    moveMonsterTowards(monsterId, targetX, targetY) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        // Calculate direction
        const dx = targetX - monster.x;
        const dy = targetY - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // Normalize and apply speed
        const speed = monster.speed || 1.0;
        const moveX = monster.x + (dx / distance) * speed;
        const moveY = monster.y + (dy / distance) * speed;
        
        this.moveMonster(monsterId, moveX, moveY);
    }
    
    moveMonsterAway(monsterId, targetX, targetY) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        // Calculate direction away from target
        const dx = monster.x - targetX;
        const dy = monster.y - targetY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // Normalize and apply speed
        const speed = monster.speed || 1.0;
        const moveX = monster.x + (dx / distance) * speed;
        const moveY = monster.y + (dy / distance) * speed;
        
        this.moveMonster(monsterId, moveX, moveY);
    }
    
    // Utility methods
    getBehaviorTree(monster) {
        const aiType = monster.ai || 'basic_melee';
        return this.behaviorTrees.get(aiType);
    }
    
    getNearbyEnemies(monsterId, radius) {
        const monster = this.getMonster(monsterId);
        if (!monster) return [];
        
        const enemies = [];
        const region = this.worldManager.regions.get(monster.regionId);
        
        if (region) {
            for (const playerId of region.players) {
                const player = this.worldManager.connectedPlayers.get(playerId);
                if (player) {
                    const distance = this.calculateDistance(monster, player);
                    if (distance <= radius) {
                        enemies.push(player);
                    }
                }
            }
        }
        
        return enemies;
    }
    
    getNearbyAllies(monsterId, radius) {
        const monster = this.getMonster(monsterId);
        if (!monster) return [];
        
        const allies = [];
        const region = this.worldManager.regions.get(monster.regionId);
        
        if (region) {
            for (const [otherId, otherMonster] of region.monsters) {
                if (otherId === monsterId || otherMonster.isDead) continue;
                
                const distance = this.calculateDistance(monster, otherMonster);
                if (distance <= radius && otherMonster.type === monster.type) {
                    allies.push(otherMonster);
                }
            }
        }
        
        return allies;
    }
    
    getNearbyObstacles(monsterId, radius) {
        // Simplified obstacle detection
        // In a real implementation, this would check the actual map/terrain
        return [];
    }
    
    calculateDistance(entity1, entity2) {
        const dx = entity1.x - entity2.x;
        const dy = entity1.y - entity2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    canMoveTo(monsterId, x, y) {
        // Check if position is valid (no obstacles, within bounds, etc.)
        return true; // Simplified
    }
    
    findBestTarget(monsterId, context) {
        const enemies = context.nearbyEnemies;
        if (enemies.length === 0) return null;
        
        // Simple targeting - closest enemy
        let closestEnemy = null;
        let closestDistance = Infinity;
        
        for (const enemy of enemies) {
            const distance = this.calculateDistance(
                { x: context.monster.x, y: context.monster.y },
                enemy
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }
        
        return closestEnemy ? closestEnemy.id : null;
    }
    
    // Helper methods for specific behaviors
    maintainDistance(context) {
        if (!context.target) return false;
        
        const target = this.getEntity(context.target);
        if (!target) return false;
        
        const distance = this.calculateDistance(context.monster, target);
        const minRange = context.monster.minRange || 20;
        const maxRange = context.monster.maxRange || 80;
        
        return distance >= minRange && distance <= maxRange;
    }
    
    needsBuff(context) {
        // Check if monster needs buffs
        return !this.hasStatusEffect(context.monsterId, 'strength') &&
               context.healthPercent > 0.3;
    }
    
    losingAggro(context) {
        // Check if losing aggro on current target
        if (!context.target) return false;
        
        const threat = this.aggroSystem.getThreat(context.monsterId, context.target);
        const aggroTable = this.aggroSystem.getAggroTable(context.monsterId);
        
        if (!aggroTable || aggroTable.size <= 1) return false;
        
        // Check if others have significantly more threat
        let maxOtherThreat = 0;
        for (const [playerId, playerThreat] of aggroTable) {
            if (playerId !== context.target && playerThreat > maxOtherThreat) {
                maxOtherThreat = playerThreat;
            }
        }
        
        return maxOtherThreat > threat * 1.5;
    }
    
    canUseSpecialAbility(context) {
        // Check if enough time has passed since last special ability
        const lastSpecial = context.aiState.abilityTimers.get('special') || 0;
        return Date.now() - lastSpecial > 15000; // 15 second cooldown
    }
    
    // Spell casting
    castSpell(monsterId, targetId, spellId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        // Check mana cost
        const spell = this.getSpellData(spellId);
        if (!spell || (monster.currentMana || 0) < spell.manaCost) return;
        
        // Consume mana
        monster.currentMana = (monster.currentMana || 0) - spell.manaCost;
        
        // Cast spell through combat system
        if (monster.combatId) {
            this.combatSystem.performAction(monster.combatId, monsterId, {
                type: 'spell',
                targetId: targetId,
                spell: spellId
            });
        }
        
        // Set cooldown
        const aiState = this.aiStates.get(monsterId);
        if (aiState) {
            aiState.skillCooldowns.set(spellId, Date.now() + (spell.cooldown || 5000));
        }
        
        this.aiStats.skillUsageCount++;
    }
    
    // Combat actions
    performAttack(monsterId, targetId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        if (monster.combatId) {
            this.combatSystem.performAction(monster.combatId, monsterId, {
                type: 'attack',
                targetId: targetId,
                skill: 'basic_attack'
            });
        }
    }
    
    performRangedAttack(monsterId, targetId) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        if (monster.combatId) {
            this.combatSystem.performAction(monster.combatId, monsterId, {
                type: 'skill',
                targetId: targetId,
                skill: 'ranged_attack'
            });
        }
    }
    
    // Status effects
    applyStatusEffect(monsterId, effectId, duration) {
        this.combatSystem.applyStatusEffect(monsterId, effectId, duration);
    }
    
    hasStatusEffect(monsterId, effectId) {
        return this.combatSystem.hasStatusEffect(monsterId, effectId);
    }
    
    // Patrol and formation
    createPatrolPath(monsterId, monster) {
        const path = [];
        const numPoints = 4 + Math.floor(Math.random() * 3);
        const radius = 30 + Math.random() * 20;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = (Math.PI * 2 * i) / numPoints;
            const x = monster.homePosition?.x || monster.x + Math.cos(angle) * radius;
            const y = monster.homePosition?.y || monster.y + Math.sin(angle) * radius;
            path.push({ x, y });
        }
        
        this.patrolPaths.set(monsterId, path);
    }
    
    maintainFormation(monsterId, packMembers) {
        // Simple formation - circle around leader
        const leader = packMembers[0];
        if (!leader) return;
        
        const formationRadius = this.config.formationDistance;
        const memberIndex = packMembers.findIndex(m => m.id === monsterId);
        
        if (memberIndex > 0) {
            const angle = (Math.PI * 2 * memberIndex) / (packMembers.length - 1);
            const targetX = leader.x + Math.cos(angle) * formationRadius;
            const targetY = leader.y + Math.sin(angle) * formationRadius;
            
            this.moveMonsterTowards(monsterId, targetX, targetY);
        }
    }
    
    coordinatePack(monsterId, packMembers, context) {
        // Coordinate pack attacks and movement
        if (!context.aiState.isCoordinating) {
            context.aiState.isCoordinating = true;
            
            // Synchronize attacks
            for (const member of packMembers) {
                if (member.target === context.target) {
                    // Add small delay for coordinated attack
                    setTimeout(() => {
                        // Attack coordination handled in executeCoordinateAttack
                    }, Math.random() * 1000);
                }
            }
        }
    }
    
    // Boss abilities
    getBossAbilities(phase) {
        const abilities = {
            1: ['cleave', 'shout'],
            2: ['enrage', 'cleave', 'shout'],
            3: ['ultimate_attack', 'summon_minions']
        };
        
        return abilities[phase] || abilities[1];
    }
    
    executeBossAbility(monsterId, ability, context) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        switch (ability) {
            case 'cleave':
                this.executeCleave(monsterId, context);
                break;
            case 'shout':
                this.executeShout(monsterId, context);
                break;
            case 'enrage':
                this.executeEnrage(monsterId, context);
                break;
            case 'ultimate_attack':
                this.executeUltimateAttack(monsterId, context);
                break;
            case 'summon_minions':
                this.executeSummonMinions(monsterId, context);
                break;
        }
        
        // Set ability cooldown
        const aiState = this.aiStates.get(monsterId);
        if (aiState) {
            aiState.abilityTimers.set('special', Date.now());
        }
    }
    
    executeCleave(monsterId, context) {
        // Area attack hitting multiple targets
        for (const enemy of context.nearbyEnemies) {
            const distance = this.calculateDistance(context.monster, enemy);
            if (distance <= 40) {
                this.performAttack(monsterId, enemy.id);
            }
        }
    }
    
    executeShout(monsterId, context) {
        // Apply fear debuff to nearby enemies
        for (const enemy of context.nearbyEnemies) {
            const distance = this.calculateDistance(context.monster, enemy);
            if (distance <= 60) {
                this.applyStatusEffect(enemy.id, 'fear', 3000);
            }
        }
    }
    
    executeEnrage(monsterId, context) {
        // Apply enrage buff to self
        this.applyStatusEffect(monsterId, 'enrage', 15000);
    }
    
    summonMinion(monsterId, x, y) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        const region = this.worldManager.regions.get(monster.regionId);
        if (!region) return;
        
        // Summon a weaker version of the monster
        const minionType = monster.type + '_minion';
        const minionId = this.worldManager.spawnMonster(
            monster.regionId,
            minionType,
            x,
            y
        );
        
        if (minionId) {
            const minion = region.monsters.get(minionId);
            if (minion) {
                minion.summoner = monsterId;
                minion.level = Math.max(1, monster.level - 5);
                minion.maxHealth = Math.floor(monster.maxHealth * 0.3);
                minion.currentHealth = minion.maxHealth;
            }
        }
    }
    
    // Entity getters
    getMonster(monsterId) {
        for (const region of this.worldManager.regions.values()) {
            const monster = region.monsters.get(monsterId);
            if (monster) return monster;
        }
        return null;
    }
    
    getEntity(entityId) {
        // Try player first
        const player = this.worldManager.connectedPlayers.get(entityId);
        if (player) return player;
        
        // Try monster
        return this.getMonster(entityId);
    }
    
    getSpellData(spellId) {
        // Simplified spell data
        const spells = {
            heal: { manaCost: 20, cooldown: 5000 },
            fireball: { manaCost: 30, cooldown: 3000 },
            buff: { manaCost: 15, cooldown: 10000 },
            fear: { manaCost: 25, cooldown: 8000 }
        };
        
        return spells[spellId];
    }
    
    // Statistics and monitoring
    recordDecision(monsterId, decision, decisionTime) {
        const aiState = this.aiStates.get(monsterId);
        if (aiState) {
            aiState.decisionHistory.push({
                decision: decision,
                time: decisionTime,
                timestamp: Date.now()
            });
            
            // Keep only last 20 decisions
            if (aiState.decisionHistory.length > 20) {
                aiState.decisionHistory.splice(0, aiState.decisionHistory.length - 20);
            }
        }
        
        this.aiStats.totalDecisions++;
    }
    
    updateAIStatistics(updateTime) {
        this.aiStats.averageDecisionTime = 
            (this.aiStats.averageDecisionTime + updateTime) / 2;
    }
    
    // Notifications
    notifyMonsterMovement(monsterId, x, y) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        const region = this.worldManager.regions.get(monster.regionId);
        if (!region) return;
        
        for (const playerId of region.players) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'monster_movement',
                monsterId: monsterId,
                x: x,
                y: y
            });
        }
    }
    
    notifyPhaseChange(monsterId, newPhase) {
        const monster = this.getMonster(monsterId);
        if (!monster) return;
        
        const region = this.worldManager.regions.get(monster.regionId);
        if (!region) return;
        
        for (const playerId of region.players) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'boss_phase_change',
                monsterId: monsterId,
                monsterName: monster.name,
                newPhase: newPhase,
                message: `${monster.name} entrou na fase ${newPhase}!`
            });
        }
    }
    
    // Pathfinding (simplified)
    updatePathfinding() {
        // Update pathfinding for monsters that need it
        for (const [monsterId, aiState] of this.aiStates) {
            if (aiState.targetPosition && aiState.path.length === 0) {
                this.calculatePath(monsterId, aiState.position, aiState.targetPosition);
            }
        }
    }
    
    calculatePath(monsterId, start, end) {
        // Simplified pathfinding - direct line
        // In a real implementation, this would use A* or similar algorithm
        const path = [];
        const steps = 10;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            path.push({
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t
            });
        }
        
        const aiState = this.aiStates.get(monsterId);
        if (aiState) {
            aiState.path = path;
        }
        
        this.aiStats.pathfindingRequests++;
        this.aiStats.successfulPathfinds++;
    }
    
    // Public API
    getAIState(monsterId) {
        return this.aiStates.get(monsterId);
    }
    
    getAIStatistics() {
        return this.aiStats;
    }
    
    setBehaviorWeight(monsterType, action, weight) {
        if (!this.behaviorWeights.has(monsterType)) {
            this.behaviorWeights.set(monsterType, {});
        }
        
        this.behaviorWeights.get(monsterType)[action] = weight;
    }
    
    // Cleanup
    cleanup() {
        this.aiStates.clear();
        this.behaviorTrees.clear();
        this.pathfindingCache.clear();
        this.decisionContexts.clear();
        this.behaviorWeights.clear();
        this.movementStates.clear();
        this.patrolPaths.clear();
        this.formationData.clear();
    }
}

export default MonsterAI;
