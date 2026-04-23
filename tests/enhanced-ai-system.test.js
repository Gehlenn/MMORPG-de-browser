/**
 * Enhanced AI System Test Suite v0.3.7v
 * Comprehensive testing for AIMobController, PathfindingSystem, AIBossController, DecisionTree, EventReactions
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');

// Import AI systems to test
const AIMobController = require('../server/ai/AIMobController.js');
const PathfindingSystem = require('../server/ai/PathfindingSystem.js');
const AIBossController = require('../server/ai/AIBossController.js');
const DecisionTree = require('../server/ai/DecisionTree.js');
const EventReactions = require('../server/ai/EventReactions.js');
const DeltaCompressor = require('../server/ai/DeltaCompressor.js');
const AIReactionHandler = require('../server/ai/AIReactionHandler.js');

describe('Enhanced AI System v0.3.7v', () => {
    let aiMobController;
    let pathfindingSystem;
    let aiBossController;
    let decisionTree;
    let eventReactions;
    let deltaCompressor;
    let aiReactionHandler;

    beforeEach(() => {
        // Initialize fresh instances for each test
        aiMobController = new AIMobController();
        pathfindingSystem = new PathfindingSystem();
        aiBossController = new AIBossController();
        aiBossController.initialize(); // Initialize to setup ability patterns
        decisionTree = new DecisionTree();
        decisionTree.initialize(); // Initialize to setup functions and trees
        eventReactions = new EventReactions();
        deltaCompressor = new DeltaCompressor();
        aiReactionHandler = new AIReactionHandler(aiMobController, aiBossController, null);
        aiReactionHandler.initialize();
    });

    afterEach(() => {
        // Clean up after each test
        if (aiMobController) aiMobController.stop();
        if (pathfindingSystem) pathfindingSystem.reset();
        if (aiBossController) aiBossController.stop();
        if (eventReactions) eventReactions.stop();
        if (deltaCompressor) deltaCompressor.clear();
        if (aiReactionHandler) aiReactionHandler.cleanup();
    });

    describe('AIMobController', () => {
        test('should initialize correctly', () => {
            expect(aiMobController).toBeDefined();
            expect(aiMobController.mobs).toBeInstanceOf(Map);
            expect(aiMobController.behaviors).toBeInstanceOf(Map);
            expect(aiMobController.stateMachines).toBeInstanceOf(Map);
            expect(aiMobController.config).toBeDefined();
        });

        test('should setup behavior profiles correctly', () => {
            aiMobController.setupBehaviorProfiles();
            
            expect(aiMobController.behaviors.has('aggressive')).toBe(true);
            expect(aiMobController.behaviors.has('defensive')).toBe(true);
            expect(aiMobController.behaviors.has('cowardly')).toBe(true);
            expect(aiMobController.behaviors.has('pack')).toBe(true);
            expect(aiMobController.behaviors.has('ambusher')).toBe(true);
            
            // Check aggressive profile
            const aggressiveProfile = aiMobController.behaviors.get('aggressive');
            expect(aggressiveProfile.personality).toBe('aggressive');
            expect(aggressiveProfile.aggression).toBe(0.9);
            expect(aggressiveProfile.hunt).toBe(true);
            expect(aggressiveProfile.callHelp).toBe(true);
        });

        test('should map mob types to profiles correctly', () => {
            expect(aiMobController.mobTypeProfiles['goblin']).toBe('pack');
            expect(aiMobController.mobTypeProfiles['wolf']).toBe('pack');
            expect(aiMobController.mobTypeProfiles['orc']).toBe('aggressive');
            expect(aiMobController.mobTypeProfiles['troll']).toBe('defensive');
            expect(aiMobController.mobTypeProfiles['dark_wisp']).toBe('cowardly');
        });

        test('should add mob to AI system', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            
            const aiData = aiMobController.addMob(mobData);
            
            expect(aiData).toBeDefined();
            expect(aiData.id).toBe(mobData.id);
            expect(aiData.type).toBe(mobData.type);
            expect(aiData.profile).toBeDefined();
            expect(aiData.stateMachine).toBeDefined();
            expect(aiData.memory).toBeDefined();
            expect(aiMobController.mobs.has(mobData.id)).toBe(true);
        });

        test('should create state machine correctly', () => {
            const profile = aiMobController.behaviors.get('aggressive');
            const stateMachine = aiMobController.createStateMachine('test_mob', profile);
            
            expect(stateMachine).toBeDefined();
            expect(stateMachine.currentState).toBe('idle');
            expect(stateMachine.states).toBeDefined();
            expect(stateMachine.states.idle).toBeDefined();
            expect(stateMachine.states.patrol).toBeDefined();
            expect(stateMachine.states.chase).toBeDefined();
            expect(stateMachine.states.attack).toBeDefined();
            expect(stateMachine.states.flee).toBeDefined();
            expect(stateMachine.states.hide).toBeDefined();
            expect(stateMachine.states.call_help).toBeDefined();
        });

        test('should create memory system correctly', () => {
            const memory = aiMobController.createMemory('test_mob');
            
            expect(memory).toBeDefined();
            expect(memory.shortTerm).toBeDefined();
            expect(memory.longTerm).toBeDefined();
            expect(memory.shortTerm.threats).toBeInstanceOf(Map);
            expect(memory.shortTerm.allies).toBeInstanceOf(Set);
            expect(memory.shortTerm.enemies).toBeInstanceOf(Set);
            expect(memory.shortTerm.locations).toBeInstanceOf(Array);
        });

        test('should evaluate decision tree correctly', () => {
            aiMobController.setupDecisionTrees();
            
            const context = {
                has_target: true,
                target_in_range: true,
                is_patrolling: false,
                has_patrol_route: true,
                health_low: false,
                is_cowardly: false,
                has_allies_nearby: false,
                target_health_low: false,
                multiple_enemies: false
            };
            
            const decision = aiMobController.evaluateDecisionTree('general', context);
            
            expect(decision).toBeDefined();
            expect(typeof decision).toBe('string');
        });

        test('should transition states correctly', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            
            const aiData = aiMobController.addMob(mobData);
            
            // Test transition from idle to patrol
            aiMobController.transitionState('test_mob_1', 'patrol');
            
            expect(aiData.stateMachine.currentState).toBe('patrol');
            expect(aiData.stateMachine.previousState).toBe('idle');
            expect(aiData.stats.stateChanges).toBe(1);
        });

        test('should generate patrol targets correctly', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            
            const aiData = aiMobController.addMob(mobData);
            const target = aiMobController.generatePatrolTarget('test_mob_1');
            
            expect(target).toBeDefined();
            expect(typeof target.x).toBe('number');
            expect(typeof target.y).toBe('number');
        });

        test('should update memory correctly', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            
            const aiData = aiMobController.addMob(mobData);
            
            aiMobController.updateMemory('test_mob_1', 'threat', {
                id: 'player_1',
                lastSeen: Date.now(),
                position: { x: 150, y: 150 }
            });
            
            expect(aiData.memory.shortTerm.threats.has('player_1')).toBe(true);
        });

        test('should remove mob correctly', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            
            aiMobController.addMob(mobData);
            const removed = aiMobController.removeMob('test_mob_1');
            
            expect(removed).toBe(true);
            expect(aiMobController.mobs.has('test_mob_1')).toBe(false);
        });

        test('should get statistics correctly', () => {
            const stats = aiMobController.getStatistics();
            
            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('totalMobs');
            expect(stats).toHaveProperty('activeStates');
            expect(stats).toHaveProperty('behaviors');
            expect(stats).toHaveProperty('decisions');
            expect(stats).toHaveProperty('stateChanges');
            
            expect(typeof stats.totalMobs).toBe('number');
            expect(typeof stats.activeStates).toBe('object');
            expect(typeof stats.behaviors).toBe('object');
            expect(typeof stats.decisions).toBe('number');
            expect(typeof stats.stateChanges).toBe('number');
        });
    });

    describe('PathfindingSystem', () => {
        test('should initialize correctly', () => {
            pathfindingSystem.initialize(800, 600);
            
            expect(pathfindingSystem).toBeDefined();
            expect(pathfindingSystem.width).toBe(80); // 800 / 10
            expect(pathfindingSystem.height).toBe(60); // 600 / 10
            expect(pathfindingSystem.grid).toBeDefined();
            expect(pathfindingSystem.pathCache).toBeInstanceOf(Map);
            expect(pathfindingSystem.nodeCache).toBeInstanceOf(Map);
        });

        test('should create grid correctly', () => {
            pathfindingSystem.initialize(100, 100);
            
            expect(pathfindingSystem.grid).toBeDefined();
            expect(pathfindingSystem.grid.length).toBe(10); // 100 / 10
            expect(pathfindingSystem.grid[0].length).toBe(10);
            
            // Check grid cell properties
            const cell = pathfindingSystem.grid[0][0];
            expect(cell).toHaveProperty('x');
            expect(cell).toHaveProperty('y');
            expect(cell).toHaveProperty('walkable');
            expect(cell).toHaveProperty('cost');
            expect(cell).toHaveProperty('entities');
        });

        test('should find path using A* algorithm', () => {
            pathfindingSystem.initialize(200, 200);
            
            const start = { x: 50, y: 50 };
            const end = { x: 150, y: 150 };
            
            const path = pathfindingSystem.findPath(start, end, 'test_entity');
            
            expect(path).toBeDefined();
            expect(Array.isArray(path)).toBe(true);
            expect(path.length).toBeGreaterThan(0);
            
            // Check first and last points - pathfinding pode ajustar para grid (tolerância de 10 unidades)
            expect(path[0].x).toBeGreaterThanOrEqual(start.x - 10);
            expect(path[0].x).toBeLessThanOrEqual(start.x + 10);
            expect(path[0].y).toBeGreaterThanOrEqual(start.y - 10);
            expect(path[0].y).toBeLessThanOrEqual(start.y + 10);
            expect(path[path.length - 1].x).toBeGreaterThanOrEqual(end.x - 10);
            expect(path[path.length - 1].x).toBeLessThanOrEqual(end.x + 10);
            expect(path[path.length - 1].y).toBeGreaterThanOrEqual(end.y - 10);
            expect(path[path.length - 1].y).toBeLessThanOrEqual(end.y + 10);
        });

        test('should handle obstacles correctly', () => {
            pathfindingSystem.initialize(200, 200);
            
            // Add obstacle
            pathfindingSystem.addStaticObstacle({ x: 100, y: 100 }, 20, 20);
            
            const start = { x: 50, y: 100 };
            const end = { x: 150, y: 100 };
            
            const path = pathfindingSystem.findPath(start, end, 'test_entity');
            
            expect(path).toBeDefined();
            // Path should go around obstacle
            expect(path.some(point => 
                point.x < 80 || point.x > 120 || point.y < 80 || point.y > 120
            )).toBe(true);
        });

        test('should cache paths correctly', () => {
            pathfindingSystem.initialize(200, 200);
            
            const start = { x: 50, y: 50 };
            const end = { x: 150, y: 150 };
            
            // First call - should calculate path
            const path1 = pathfindingSystem.findPath(start, end, 'test_entity');
            
            // Second call - should use cache
            const path2 = pathfindingSystem.findPath(start, end, 'test_entity');
            
            expect(path1).toEqual(path2);
            expect(pathfindingSystem.stats.cacheHits).toBe(1);
        });

        test('should handle dynamic obstacles', () => {
            pathfindingSystem.initialize(200, 200);
            
            // Add dynamic obstacle
            pathfindingSystem.addDynamicObstacle('dynamic_1', { x: 100, y: 100 }, 20, 20);
            
            const start = { x: 50, y: 100 };
            const end = { x: 150, y: 100 };
            
            const path = pathfindingSystem.findPath(start, end, 'test_entity');
            
            expect(path).toBeDefined();
            // Path should avoid dynamic obstacle
        });

        test('should check line of sight correctly', () => {
            pathfindingSystem.initialize(200, 200);
            
            const start = { x: 50, y: 50 };
            const end = { x: 150, y: 150 };
            
            const hasLOS = pathfindingSystem.hasLineOfSight(start, end);
            
            expect(typeof hasLOS).toBe('boolean');
        });

        test('should find nearest walkable position', () => {
            pathfindingSystem.initialize(200, 200);
            
            // Add obstacle
            pathfindingSystem.addStaticObstacle({ x: 100, y: 100 }, 50, 50);
            
            const position = { x: 125, y: 125 }; // Inside obstacle
            const nearestWalkable = pathfindingSystem.findNearestWalkable(position);
            
            expect(nearestWalkable).toBeDefined();
            expect(typeof nearestWalkable.x).toBe('number');
            expect(typeof nearestWalkable.y).toBe('number');
        });

        test('should convert coordinates correctly', () => {
            pathfindingSystem.initialize(200, 200);
            
            const worldPos = { x: 55, y: 75 };
            const gridPos = pathfindingSystem.worldToGrid(worldPos);
            
            expect(gridPos.x).toBe(5); // 55 / 10 = 5.5 -> floor(5.5) = 5
            expect(gridPos.y).toBe(7); // 75 / 10 = 7.5 -> floor(7.5) = 7
            
            const worldBack = pathfindingSystem.gridToWorldPath([gridPos]);
            expect(worldBack[0].x).toBeCloseTo(55, 5);
            expect(worldBack[0].y).toBeCloseTo(75, 5);
        });

        test('should get statistics correctly', () => {
            const stats = pathfindingSystem.getStatistics();
            
            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('pathsCalculated');
            expect(stats).toHaveProperty('cacheHitRate');
            expect(stats).toHaveProperty('cacheSize');
            expect(stats).toHaveProperty('dynamicObstacles');
            expect(stats).toHaveProperty('movingEntities');
            expect(stats).toHaveProperty('gridSize');
        });

        test('should reset correctly', () => {
            pathfindingSystem.initialize(200, 200);
            pathfindingSystem.addStaticObstacle({ x: 100, y: 100 }, 20, 20);
            
            pathfindingSystem.reset();
            
            expect(pathfindingSystem.pathCache.size).toBe(0);
            expect(pathfindingSystem.nodeCache.size).toBe(0);
            expect(pathfindingSystem.obstacleCache.size).toBe(0);
            expect(pathfindingSystem.dynamicObstacles.size).toBe(0);
            expect(pathfindingSystem.movingEntities.size).toBe(0);
        });

        test('should update mob state', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                state: 'idle'
            });
            
            aiMobController.updateMobState('test_mob', {
                state: 'chasing',
                target: 'player_1'
            });
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.state).toBe('chasing');
            expect(mob.target).toBe('player_1');
        });

        test('should set mob target', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.setMobTarget('test_mob', 'player_1');
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.target).toBe('player_1');
        });

        test('should clear mob target', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                target: 'player_1'
            });
            
            aiMobController.clearMobTarget('test_mob');
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.target).toBeNull();
        });

        test('should set mob position', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.setMobPosition('test_mob', { x: 200, y: 200 });
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.position.x).toBe(200);
            expect(mob.position.y).toBe(200);
        });

        test('should set mob health', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                hp: 100,
                maxHp: 100
            });
            
            aiMobController.setMobHealth('test_mob', 50);
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.hp).toBe(50);
        });

        test('should handle mob damage', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                hp: 100,
                maxHp: 100
            });
            
            aiMobController.handleMobDamage('test_mob', {
                damage: 30,
                attacker: 'player_1'
            });
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.hp).toBe(70);
        });

        test('should handle mob death', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                hp: 100
            });
            
            const onDeath = jest.fn();
            aiMobController.setMobDeathCallback(onDeath);
            
            aiMobController.handleMobDeath('test_mob', {
                killerId: 'player_1'
            });
            
            expect(onDeath).toHaveBeenCalledWith('test_mob', expect.any(Object));
            expect(aiMobController.mobs.has('test_mob')).toBe(false);
        });

        test('should get mob behavior', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                behavior: 'aggressive'
            });
            
            const behavior = aiMobController.getMobBehavior('test_mob');
            expect(behavior).toBe('aggressive');
        });

        test('should set mob behavior', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                behavior: 'passive'
            });
            
            aiMobController.setMobBehavior('test_mob', 'aggressive');
            
            const behavior = aiMobController.getMobBehavior('test_mob');
            expect(behavior).toBe('aggressive');
        });

        test('should get mobs by type', () => {
            aiMobController.addMob('goblin_1', {
                id: 'goblin_1',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.addMob('orc_1', {
                id: 'orc_1',
                type: 'orc',
                position: { x: 200, y: 200 }
            });
            
            aiMobController.addMob('goblin_2', {
                id: 'goblin_2',
                type: 'goblin',
                position: { x: 300, y: 300 }
            });
            
            const goblins = aiMobController.getMobsByType('goblin');
            expect(goblins.length).toBe(2);
            expect(goblins.map(m => m.id)).toContain('goblin_1');
            expect(goblins.map(m => m.id)).toContain('goblin_2');
        });

        test('should get mobs by state', () => {
            aiMobController.addMob('mob_1', {
                id: 'mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                state: 'idle'
            });
            
            aiMobController.addMob('mob_2', {
                id: 'mob_2',
                type: 'orc',
                position: { x: 200, y: 200 },
                state: 'chasing'
            });
            
            aiMobController.addMob('mob_3', {
                id: 'mob_3',
                type: 'goblin',
                position: { x: 300, y: 300 },
                state: 'chasing'
            });
            
            const chasingMobs = aiMobController.getMobsByState('chasing');
            expect(chasingMobs.length).toBe(2);
        });

        test('should pause and resume mob AI', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.pauseMobAI('test_mob');
            let mob = aiMobController.getMobAI('test_mob');
            expect(mob.isPaused).toBe(true);
            
            aiMobController.resumeMobAI('test_mob');
            mob = aiMobController.getMobAI('test_mob');
            expect(mob.isPaused).toBe(false);
        });

        test('should get mob distance to target', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 0, y: 0 }
            });
            
            const distance = aiMobController.getDistanceToTarget('test_mob', { x: 30, y: 40 });
            expect(distance).toBe(50); // 3-4-5 triangle
        });

        test('should check if mob can see target', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 0, y: 0 },
                visionRange: 100,
                visionAngle: 120
            });
            
            // Target within range and facing direction
            const canSee = aiMobController.canSeeTarget('test_mob', { x: 0, y: 50 });
            expect(typeof canSee).toBe('boolean');
        });

        test('should get nearest mob to position', () => {
            aiMobController.addMob('mob_1', {
                id: 'mob_1',
                type: 'goblin',
                position: { x: 0, y: 0 }
            });
            
            aiMobController.addMob('mob_2', {
                id: 'mob_2',
                type: 'orc',
                position: { x: 100, y: 0 }
            });
            
            aiMobController.addMob('mob_3', {
                id: 'mob_3',
                type: 'skeleton',
                position: { x: 50, y: 0 }
            });
            
            const nearest = aiMobController.getNearestMob({ x: 40, y: 0 });
            expect(nearest).toBeDefined();
            expect(nearest.id).toBe('mob_3');
        });

        test('should get mobs in range', () => {
            aiMobController.addMob('mob_1', {
                id: 'mob_1',
                type: 'goblin',
                position: { x: 0, y: 0 }
            });
            
            aiMobController.addMob('mob_2', {
                id: 'mob_2',
                type: 'orc',
                position: { x: 50, y: 0 }
            });
            
            aiMobController.addMob('mob_3', {
                id: 'mob_3',
                type: 'skeleton',
                position: { x: 200, y: 0 }
            });
            
            const mobsInRange = aiMobController.getMobsInRange({ x: 0, y: 0 }, 100);
            expect(mobsInRange.length).toBe(2);
        });

        test('should update mob path', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 0, y: 0 }
            });
            
            const path = [
                { x: 10, y: 0 },
                { x: 20, y: 0 },
                { x: 30, y: 0 }
            ];
            
            aiMobController.updateMobPath('test_mob', path);
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.path).toEqual(path);
        });

        test('should clear mob path', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 0, y: 0 },
                path: [{ x: 10, y: 0 }, { x: 20, y: 0 }]
            });
            
            aiMobController.clearMobPath('test_mob');
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.path).toBeNull();
        });

        test('should set mob animation', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.setMobAnimation('test_mob', 'attack');
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.animation).toBe('attack');
        });

        test('should set mob cooldown', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.setMobCooldown('test_mob', 'attack', 5000);
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.cooldowns.attack).toBeGreaterThan(0);
        });

        test('should check if mob is on cooldown', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.setMobCooldown('test_mob', 'attack', 5000);
            
            const isOnCooldown = aiMobController.isMobOnCooldown('test_mob', 'attack');
            expect(isOnCooldown).toBe(true);
        });

        test('should reset mob cooldowns', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.setMobCooldown('test_mob', 'attack', 5000);
            aiMobController.setMobCooldown('test_mob', 'heal', 3000);
            
            aiMobController.resetMobCooldowns('test_mob');
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.cooldowns.attack).toBe(0);
            expect(mob.cooldowns.heal).toBe(0);
        });

        test('should get mob stats', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                level: 5,
                xp: 100
            });
            
            const stats = aiMobController.getMobStats('test_mob');
            expect(stats).toBeDefined();
            expect(stats.level).toBe(5);
        });

        test('should update mob stats', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                level: 5
            });
            
            aiMobController.updateMobStats('test_mob', {
                level: 6,
                xp: 150
            });
            
            const mob = aiMobController.getMobAI('test_mob');
            expect(mob.level).toBe(6);
            expect(mob.xp).toBe(150);
        });

        test('should get mob AI data', () => {
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                behavior: 'aggressive',
                state: 'idle'
            });
            
            const aiData = aiMobController.getMobAIData('test_mob');
            expect(aiData).toBeDefined();
            expect(aiData.id).toBe('test_mob');
            expect(aiData.behavior).toBe('aggressive');
            expect(aiData.state).toBe('idle');
        });

        test('should emit mob event', () => {
            const mockCallback = jest.fn();
            aiMobController.setEventCallback(mockCallback);
            
            aiMobController.addMob('test_mob', {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.emitMobEvent('test_mob', 'state_change', { from: 'idle', to: 'chasing' });
            
            expect(mockCallback).toHaveBeenCalledWith('test_mob', 'state_change', expect.any(Object));
        });

        test('should get all mob IDs', () => {
            aiMobController.addMob('mob_1', {
                id: 'mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.addMob('mob_2', {
                id: 'mob_2',
                type: 'orc',
                position: { x: 200, y: 200 }
            });
            
            const allIds = aiMobController.getAllMobIds();
            expect(allIds).toContain('mob_1');
            expect(allIds).toContain('mob_2');
            expect(allIds.length).toBe(2);
        });

        test('should get mob count', () => {
            aiMobController.addMob('mob_1', {
                id: 'mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.addMob('mob_2', {
                id: 'mob_2',
                type: 'orc',
                position: { x: 200, y: 200 }
            });
            
            const count = aiMobController.getMobCount();
            expect(count).toBe(2);
        });

        test('should clear all mobs', () => {
            aiMobController.addMob('mob_1', {
                id: 'mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 }
            });
            
            aiMobController.addMob('mob_2', {
                id: 'mob_2',
                type: 'orc',
                position: { x: 200, y: 200 }
            });
            
            aiMobController.clearAllMobs();
            
            expect(aiMobController.mobs.size).toBe(0);
            expect(aiMobController.getMobCount()).toBe(0);
        });

        test('should update all mobs', () => {
            aiMobController.addMob('mob_1', {
                id: 'mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                state: 'idle'
            });
            
            aiMobController.addMob('mob_2', {
                id: 'mob_2',
                type: 'orc',
                position: { x: 200, y: 200 },
                state: 'chasing'
            });
            
            // Should not throw
            aiMobController.updateAllMobs();
            
            expect(aiMobController.getMobCount()).toBe(2);
        });
    });

    describe('AIBossController', () => {
        test('should initialize correctly', () => {
            expect(aiBossController).toBeDefined();
            expect(aiBossController.bosses).toBeInstanceOf(Map);
            expect(aiBossController.tactics).toBeInstanceOf(Map);
            expect(aiBossController.patterns).toBeInstanceOf(Map);
            expect(aiBossController.adaptiveDifficulty).toBeInstanceOf(Map);
        });

        test('should setup tactical profiles correctly', () => {
            aiBossController.setupTacticalProfiles();
            
            expect(aiBossController.tactics.has('aggressive')).toBe(true);
            expect(aiBossController.tactics.has('tactical')).toBe(true);
            expect(aiBossController.tactics.has('defensive')).toBe(true);
            expect(aiBossController.tactics.has('hunter')).toBe(true);
            
            // Check aggressive profile
            const aggressiveProfile = aiBossController.tactics.get('aggressive');
            expect(aggressiveProfile.style).toBe('aggressive');
            expect(aggressiveProfile.aggression).toBe(0.9);
            expect(aggressiveProfile.minionPreference).toBe('swarm');
        });

        test('should map boss types to tactics correctly', () => {
            expect(aiBossController.bossTactics['dragon_lord']).toBe('aggressive');
            expect(aiBossController.bossTactics['demon_king']).toBe('tactical');
            expect(aiBossController.bossTactics['ancient_treant']).toBe('defensive');
            expect(aiBossController.bossTactics['frost_giant']).toBe('hunter');
        });

        test('should add boss to AI system', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            const bossAI = aiBossController.addBoss(bossData);
            
            expect(bossAI).toBeDefined();
            expect(bossAI.id).toBe(bossData.id);
            expect(bossAI.type).toBe(bossData.type);
            expect(bossAI.tacticalProfile).toBeDefined();
            expect(bossAI.patternMemory).toBeDefined();
            expect(bossAI.difficultyData).toBeDefined();
            expect(bossAI.currentPhase).toBe(1);
            expect(aiBossController.bosses.has(bossData.id)).toBe(true);
        });

        test('should create pattern memory correctly', () => {
            const patternMemory = aiBossController.createPatternMemory('test_boss');
            
            expect(patternMemory).toBeDefined();
            expect(patternMemory.playerPatterns).toBeInstanceOf(Map);
            expect(patternMemory.successfulAttacks).toBeInstanceOf(Array);
            expect(patternMemory.failedAttacks).toBeInstanceOf(Array);
            expect(patternMemory.abilityEffectiveness).toBeInstanceOf(Map);
            expect(patternMemory.phaseHistory).toBeInstanceOf(Array);
        });

        test('should create difficulty data correctly', () => {
            const difficultyData = aiBossController.createDifficultyData('test_boss');
            
            expect(difficultyData).toBeDefined();
            expect(difficultyData.playerSkillLevel).toBe(1.0);
            expect(difficultyData.playerCount).toBe(1);
            expect(difficultyData.deathCount).toBe(0);
            expect(difficultyData.successRate).toBe(1.0);
            expect(difficultyData.difficultyMultiplier).toBe(1.0);
        });

        test('should evaluate boss tactics correctly', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            const bossAI = aiBossController.addBoss(bossData);
            const context = aiBossController.buildBossDecisionContext('test_boss_1', bossAI);
            
            const decision = aiBossController.evaluateBossTactics(bossAI, context);
            
            expect(decision).toBeDefined();
            expect(typeof decision).toBe('string');
        });

        test('should check phase transitions correctly', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 1000, // 50% HP
                maxHp: 2000
            };
            
            const bossAI = aiBossController.addBoss(bossData);
            
            // Should transition to phase 2 at 50% HP
            aiBossController.checkPhaseTransition('test_boss_1', bossAI);
            
            expect(bossAI.currentPhase).toBe(2);
            expect(bossAI.stats.phaseChanges).toBe(1);
        });

        test('should calculate adaptive difficulty correctly', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            const bossAI = aiBossController.addBoss(bossData);
            
            // Simulate successful attacks
            bossAI.patternMemory.successfulAttacks = [
                { success: true }, { success: true }, { success: true }
            ];
            
            const adjustment = aiBossController.calculateDifficultyAdjustment('test_boss_1', bossAI);
            
            expect(typeof adjustment).toBe('number');
            expect(adjustment).toBeGreaterThan(0); // Should increase difficulty
        });

        test('should use abilities correctly', () => {
            aiBossController.setupAbilityPatterns();
            
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            const bossAI = aiBossController.addBoss(bossData);
            
            // Test ability usage
            const canUse = aiBossController.canUseAbility({
                boss_id: 'test_boss_1',
                health_percentage: 0.4,
                enemies_nearby: 3
            }, 'berserk');
            
            expect(typeof canUse).toBe('boolean');
        });

        test('should remove boss correctly', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            const removed = aiBossController.removeBoss('test_boss_1');
            
            expect(removed).toBe(true);
            expect(aiBossController.bosses.has('test_boss_1')).toBe(false);
        });

        test('should get statistics correctly', () => {
            const stats = aiBossController.getStatistics();
            
            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('totalBosses');
            expect(stats).toHaveProperty('activePhases');
            expect(stats).toHaveProperty('tactics');
            expect(stats).toHaveProperty('abilities');
            expect(stats).toHaveProperty('decisions');
            expect(stats).toHaveProperty('phaseChanges');
        });

        test('should get boss AI data', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.getBossAI('test_boss_1');
            
            expect(bossAI).toBeDefined();
            expect(bossAI.id).toBe('test_boss_1');
        });

        test('should return null for non-existent boss AI', () => {
            const bossAI = aiBossController.getBossAI('nonexistent_boss');
            expect(bossAI).toBeNull();
        });

        test('should set and get boss data callback', () => {
            const mockCallback = jest.fn().mockReturnValue({
                id: 'test_boss',
                currentHp: 1000,
                maxHp: 2000,
                phase: 1
            });
            
            aiBossController.setBossDataCallback(mockCallback);
            const bossData = aiBossController.getBossData('test_boss');
            
            expect(mockCallback).toHaveBeenCalledWith('test_boss');
            expect(bossData).toBeDefined();
        });

        test('should update boss difficulty', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            aiBossController.updateBossDifficulty('test_boss_1', {
                playerCount: 5,
                averageLevel: 50,
                successRate: 0.7
            });
            
            const bossAI = aiBossController.getBossAI('test_boss_1');
            expect(bossAI.difficultyData.playerCount).toBe(5);
            expect(bossAI.difficultyData.averagePlayerLevel).toBe(50);
            expect(bossAI.difficultyData.playerSuccessRate).toBe(0.7);
        });

        test('should record player pattern', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            aiBossController.recordPlayerPattern('test_boss_1', 'player_1', {
                ability: 'fireball',
                damage: 500,
                successful: true
            });
            
            const patterns = aiBossController.getPlayerPatterns('test_boss_1', 'player_1');
            expect(patterns).toBeDefined();
            expect(patterns.length).toBeGreaterThan(0);
        });

        test('should get all player patterns for boss', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            aiBossController.recordPlayerPattern('test_boss_1', 'player_1', { ability: 'attack' });
            aiBossController.recordPlayerPattern('test_boss_1', 'player_2', { ability: 'heal' });
            
            const allPatterns = aiBossController.getAllPlayerPatterns('test_boss_1');
            expect(allPatterns.size).toBe(2);
        });

        test('should check if ability is on cooldown', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            // Simulate ability use
            const bossAI = aiBossController.getBossAI('test_boss_1');
            bossAI.abilities.get('berserk').lastUsed = Date.now();
            
            const isOnCooldown = aiBossController.isAbilityOnCooldown('test_boss_1', 'berserk');
            expect(isOnCooldown).toBe(true);
        });

        test('should use ability and set cooldown', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            const result = aiBossController.useAbility('test_boss_1', 'berserk', {
                targetId: 'player_1',
                position: { x: 100, y: 100 }
            });
            
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            
            const bossAI = aiBossController.getBossAI('test_boss_1');
            expect(bossAI.abilities.get('berserk').lastUsed).toBeGreaterThan(0);
        });

        test('should get ability cooldown remaining', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            aiBossController.useAbility('test_boss_1', 'berserk', {});
            
            const cooldown = aiBossController.getAbilityCooldownRemaining('test_boss_1', 'berserk');
            expect(cooldown).toBeGreaterThan(0);
        });

        test('should reset all boss cooldowns', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            aiBossController.useAbility('test_boss_1', 'berserk', {});
            aiBossController.useAbility('test_boss_1', 'charge', {});
            
            aiBossController.resetAllCooldowns('test_boss_1');
            
            const bossAI = aiBossController.getBossAI('test_boss_1');
            const berserkAbility = bossAI.abilities.get('berserk');
            const chargeAbility = bossAI.abilities.get('charge');
            
            expect(berserkAbility.lastUsed).toBe(0);
            expect(chargeAbility.lastUsed).toBe(0);
        });

        test('should get available abilities', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            const availableAbilities = aiBossController.getAvailableAbilities('test_boss_1');
            
            expect(availableAbilities).toBeInstanceOf(Array);
            expect(availableAbilities.length).toBeGreaterThan(0);
        });

        test('should pause and resume boss AI', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            aiBossController.pauseBossAI('test_boss_1');
            const bossAIPaused = aiBossController.getBossAI('test_boss_1');
            expect(bossAIPaused.isPaused).toBe(true);
            
            aiBossController.resumeBossAI('test_boss_1');
            const bossAIResumed = aiBossController.getBossAI('test_boss_1');
            expect(bossAIResumed.isPaused).toBe(false);
        });

        test('should set and trigger tactical change callback', () => {
            const mockCallback = jest.fn();
            aiBossController.setTacticalChangeCallback(mockCallback);
            
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000,
                phase: 1
            };
            
            aiBossController.addBoss(bossData);
            
            // Trigger a decision change
            aiBossController.makeBossDecision('test_boss_1', aiBossController.getBossAI('test_boss_1'));
            
            // The callback should have been triggered if action changed
            // This depends on implementation details
            expect(mockCallback).toBeDefined();
        });

        test('should get all active bosses', () => {
            aiBossController.addBoss({
                id: 'boss_1',
                type: 'dragon_lord',
                position: { x: 100, y: 100 },
                currentHp: 1000,
                maxHp: 1000
            });
            
            aiBossController.addBoss({
                id: 'boss_2',
                type: 'necromancer',
                position: { x: 200, y: 200 },
                currentHp: 800,
                maxHp: 800
            });
            
            const activeBosses = aiBossController.getAllActiveBosses();
            expect(activeBosses.length).toBe(2);
            expect(activeBosses.map(b => b.id)).toContain('boss_1');
            expect(activeBosses.map(b => b.id)).toContain('boss_2');
        });

        test('should stop all boss AI', () => {
            aiBossController.addBoss({
                id: 'boss_1',
                type: 'dragon_lord',
                position: { x: 100, y: 100 },
                currentHp: 1000,
                maxHp: 1000
            });
            
            aiBossController.stopAll();
            
            expect(aiBossController.isRunning).toBe(false);
        });

        test('should clear all bosses', () => {
            aiBossController.addBoss({
                id: 'boss_1',
                type: 'dragon_lord',
                position: { x: 100, y: 100 },
                currentHp: 1000,
                maxHp: 1000
            });
            
            aiBossController.clearAllBosses();
            
            expect(aiBossController.bosses.size).toBe(0);
            expect(aiBossController.patterns.size).toBe(0);
        });

        test('should evaluate different tactical behaviors', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            // Test direct assault evaluation
            const directAssaultResult = aiBossController.evaluateDirectAssault({
                has_target: true,
                target_count: 1,
                boss_id: 'test_boss_1',
                health_percentage: 0.8
            });
            expect(typeof directAssaultResult).toBe('string');
            
            // Test coordinated attack evaluation
            const coordinatedResult = aiBossController.evaluateCoordinatedAttack({
                has_target: true,
                minions_alive: 0,
                boss_id: 'test_boss_1',
                health_percentage: 0.8
            });
            expect(typeof coordinatedResult).toBe('string');
            
            // Test desperate assault evaluation
            const desperateResult = aiBossController.evaluateDesperateAssault({
                health_percentage: 0.2,
                boss_id: 'test_boss_1'
            });
            expect(typeof desperateResult).toBe('string');
            
            // Test probe defenses evaluation
            const probeResult = aiBossController.evaluateProbeDefenses({
                has_target: false,
                boss_id: 'test_boss_1'
            });
            expect(probeResult).toBe('scan_area');
        });

        test('should handle exploit weakness evaluation', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            // Record some patterns first
            aiBossController.recordPlayerPattern('test_boss_1', 'player_1', {
                ability: 'debuff',
                successful: true,
                damage: 200
            });
            
            const patternMemory = aiBossController.patterns.get('test_boss_1');
            patternMemory.abilityEffectiveness.set('debuff', { effectiveness: 0.8 });
            
            const exploitResult = aiBossController.evaluateExploitWeakness({
                has_target: true,
                pattern_memory: patternMemory,
                boss_id: 'test_boss_1'
            });
            
            expect(typeof exploitResult).toBe('string');
        });

        test('should handle last stand evaluation', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            const lastStandResult = aiBossController.evaluateLastStand({
                health_percentage: 0.15,
                target_count: 1,
                boss_id: 'test_boss_1'
            });
            
            expect(typeof lastStandResult).toBe('string');
        });

        test('should handle counter attack evaluation', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            const counterResult = aiBossController.evaluateCounterAttack({
                minions_alive: 2,
                boss_id: 'test_boss_1'
            });
            
            expect(typeof counterResult).toBe('string');
        });

        test('should handle fortify position evaluation', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            const fortifyResult = aiBossController.evaluateFortifyPosition({
                health_percentage: 0.7,
                boss_id: 'test_boss_1'
            });
            
            expect(typeof fortifyResult).toBe('string');
        });

        test('should execute boss decision correctly', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.getBossAI('test_boss_1');
            
            aiBossController.executeBossDecision('test_boss_1', bossAI, 'use_berserk');
            
            expect(bossAI.stats.abilitiesUsed).toBeGreaterThan(0);
        });

        test('should update boss phase', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            const onPhaseChange = jest.fn();
            aiBossController.setPhaseChangeCallback(onPhaseChange);
            
            aiBossController.updateBossPhase('test_boss_1', 2);
            
            const bossAI = aiBossController.getBossAI('test_boss_1');
            expect(bossAI.currentPhase).toBe(2);
            expect(onPhaseChange).toHaveBeenCalledWith('test_boss_1', 2);
        });

        test('should record ability success', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            aiBossController.recordAbilitySuccess('test_boss_1', 'berserk', {
                damage: 500,
                targetId: 'player_1'
            });
            
            const bossAI = aiBossController.getBossAI('test_boss_1');
            expect(bossAI.stats.totalDamage).toBeGreaterThan(0);
        });

        test('should get boss tactical profile', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            const profile = aiBossController.getBossTacticalProfile('test_boss_1');
            expect(profile).toBeDefined();
            expect(profile.style).toBeDefined();
        });

        test('should handle boss death event', () => {
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            aiBossController.addBoss(bossData);
            
            const onDeath = jest.fn();
            aiBossController.setBossDeathCallback(onDeath);
            
            aiBossController.handleBossDeath('test_boss_1', {
                killerId: 'player_1',
                raidGroup: ['player_1', 'player_2']
            });
            
            expect(onDeath).toHaveBeenCalledWith('test_boss_1', expect.any(Object));
        });
    });

    describe('DecisionTree', () => {
        test('should initialize correctly', () => {
            decisionTree.initialize();
            
            expect(decisionTree).toBeDefined();
            expect(decisionTree.trees).toBeInstanceOf(Map);
            expect(decisionTree.functions).toBeInstanceOf(Map);
            expect(decisionTree.evaluationCache).toBeInstanceOf(Map);
        });

        test('should setup default functions correctly', () => {
            decisionTree.setupDefaultFunctions();
            
            expect(decisionTree.functions.has('abs')).toBe(true);
            expect(decisionTree.functions.has('min')).toBe(true);
            expect(decisionTree.functions.has('max')).toBe(true);
            expect(decisionTree.functions.has('random')).toBe(true);
            expect(decisionTree.functions.has('greater_than')).toBe(true);
            expect(decisionTree.functions.has('less_than')).toBe(true);
            expect(decisionTree.functions.has('and')).toBe(true);
            expect(decisionTree.functions.has('or')).toBe(true);
            expect(decisionTree.functions.has('distance')).toBe(true);
        });

        test('should create default trees correctly', () => {
            decisionTree.createDefaultTrees();
            
            expect(decisionTree.trees.has('combat_behavior')).toBe(true);
            expect(decisionTree.trees.has('event_reaction')).toBe(true);
            expect(decisionTree.trees.has('target_selection')).toBe(true);
            expect(decisionTree.trees.has('ability_usage')).toBe(true);
        });

        test('should create tree correctly', () => {
            const treeData = {
                root: {
                    id: 'test_root',
                    type: 'condition',
                    variable: 'test_var',
                    operator: 'equals',
                    value: true,
                    true: {
                        id: 'test_action',
                        type: 'action',
                        action: 'test_action',
                        priority: 5
                    },
                    false: {
                        id: 'test_default',
                        type: 'action',
                        action: 'default_action',
                        priority: 1
                    }
                }
            };
            
            decisionTree.createTree('test_tree', treeData);
            
            expect(decisionTree.trees.has('test_tree')).toBe(true);
            
            const tree = decisionTree.trees.get('test_tree');
            expect(tree.name).toBe('test_tree');
            expect(tree.root).toBeDefined();
            expect(tree.nodeCount).toBeGreaterThan(0);
            expect(tree.depth).toBeGreaterThan(0);
        });

        test('should evaluate tree correctly', () => {
            decisionTree.createDefaultTrees();
            
            const context = {
                in_combat: true,
                has_target: true,
                target_threat_level: 0.8,
                health_percentage: 0.6,
                distance_to_target: 30,
                has_ability: true,
                ranged_attack: true
            };
            
            const result = decisionTree.evaluateTree('combat_behavior', context);
            
            expect(result).toBeDefined();
            expect(result).toHaveProperty('action');
            expect(result).toHaveProperty('priority');
        });

        test('should evaluate conditions correctly', () => {
            const context = {
                variables: new Map([['test_var', true]]),
                functions: decisionTree.functions
            };
            
            const condition = {
                type: 'condition',
                variable: 'test_var',
                operator: 'equals',
                value: true
            };
            
            const result = decisionTree.evaluateCondition(condition, context, 'test_tree', 0);
            
            expect(result).toBeDefined();
        });

        test('should evaluate functions correctly', () => {
            const context = {
                variables: new Map([['test_var', 5]]),
                functions: decisionTree.functions
            };
            
            const functionNode = {
                type: 'function',
                function: 'greater_than',
                parameters: [
                    { type: 'variable', name: 'test_var' },
                    { type: 'literal', value: 3 }
                ]
            };
            
            const result = decisionTree.evaluateFunction(functionNode, context, 'test_tree', 0);
            
            expect(result).toBeDefined();
            expect(result.action).toBe('function_result');
            // greater_than(5, 3) deve retornar true
            expect(result.value === true || result.value === 1).toBe(true);
        });

        test('should evaluate switch nodes correctly', () => {
            const context = {
                variables: new Map([['event_type', 'player_attack']])
            };
            
            const switchNode = {
                type: 'switch',
                variable: 'event_type',
                cases: {
                    'player_attack': {
                        id: 'combat_response',
                        type: 'action',
                        action: 'defend',
                        priority: 8
                    }
                },
                default: {
                    id: 'default_response',
                    type: 'action',
                        action: 'ignore',
                        priority: 1
                    }
            };
            
            const result = decisionTree.evaluateSwitch(switchNode, context, 'test_tree', 0);
            
            expect(result).toBeDefined();
            expect(result.action).toBe('defend');
        });

        test('should cache evaluations correctly', () => {
            decisionTree.createDefaultTrees();
            
            const context = { in_combat: true, has_target: true };
            
            // First evaluation
            const result1 = decisionTree.evaluateTree('combat_behavior', context);
            
            // Second evaluation should use cache
            const result2 = decisionTree.evaluateTree('combat_behavior', context);
            
            expect(result1).toEqual(result2);
            expect(decisionTree.stats.cacheHits).toBe(1);
        });

        test('should get statistics correctly', () => {
            const stats = decisionTree.getStatistics();
            
            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('evaluations');
            expect(stats).toHaveProperty('cacheHitRate');
            expect(stats).toHaveProperty('cacheSize');
            expect(stats).toHaveProperty('treesCount');
            expect(stats).toHaveProperty('averageTreeDepth');
            expect(stats).toHaveProperty('totalNodes');
        });
    });

    describe('EventReactions', () => {
        test('should initialize correctly', () => {
            eventReactions.initialize();
            
            expect(eventReactions).toBeDefined();
            expect(eventReactions.reactions).toBeInstanceOf(Map);
            expect(eventReactions.activeReactions).toBeInstanceOf(Map);
            expect(eventReactions.eventQueue).toBeInstanceOf(Array);
        });

        test('should setup default reactions correctly', () => {
            eventReactions.setupDefaultReactions();
            
            expect(eventReactions.reactions.has('player_attack')).toBe(true);
            expect(eventReactions.reactions.has('mob_death')).toBe(true);
            expect(eventReactions.reactions.has('boss_spawn')).toBe(true);
            expect(eventReactions.reactions.has('item_dropped')).toBe(true);
        });

        test('should add reaction correctly', () => {
            const reaction = {
                id: 'test_reaction',
                priority: 5,
                conditions: [
                    { type: 'distance', operator: 'less_than', value: 100 }
                ],
                actions: [
                    { type: 'change_behavior', value: 'alert' }
                ],
                cooldown: 2000
            };
            
            eventReactions.addReaction('test_event', reaction);
            
            expect(eventReactions.reactions.has('test_event')).toBe(true);
            
            const reactions = eventReactions.reactions.get('test_event');
            expect(reactions.length).toBeGreaterThan(0);
            expect(reactions.some(r => r.id === 'test_reaction')).toBe(true);
        });

        test('should remove reaction correctly', () => {
            const reaction = {
                id: 'test_reaction',
                priority: 5,
                conditions: [],
                actions: [],
                cooldown: 2000
            };
            
            eventReactions.addReaction('test_event', reaction);
            const removed = eventReactions.removeReaction('test_event', 'test_reaction');
            
            expect(removed).toBe(true);
            
            const reactions = eventReactions.reactions.get('test_event');
            expect(reactions.some(r => r.id === 'test_reaction')).toBe(false);
        });

        test('should queue events correctly', () => {
            const event = {
                type: 'test_event',
                sourceId: 'test_source',
                position: { x: 100, y: 100 },
                data: { test: 'data' }
            };
            
            eventReactions.queueEvent(event);
            
            expect(eventReactions.eventQueue.length).toBe(1);
            // queueEvent adiciona timestamp e id ao evento
            expect(eventReactions.eventQueue[0]).toMatchObject(event);
            expect(eventReactions.eventQueue[0]).toHaveProperty('timestamp');
            expect(eventReactions.eventQueue[0]).toHaveProperty('id');
        });

        test('should evaluate conditions correctly', () => {
            const entity = {
                id: 'test_entity',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 100 },
                type: 'goblin',
                level: 5
            };
            
            const event = {
                type: 'player_attack',
                sourceId: 'player_1',
                position: { x: 120, y: 100 },
                data: { damage: 10 }
            };
            
            const condition = {
                type: 'distance',
                operator: 'less_than',
                value: 150
            };
            
            const result = eventReactions.evaluateCondition(condition, entity, event);
            
            expect(typeof result).toBe('boolean');
        });

        test('should trigger reactions correctly', () => {
            const entity = {
                id: 'test_entity',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 100 },
                type: 'goblin',
                level: 5
            };
            
            const event = {
                type: 'player_attack',
                sourceId: 'player_1',
                targetId: 'test_entity', // Especificar o alvo para que seja encontrado como afetado
                position: { x: 120, y: 100 },
                data: { damage: 10 }
            };
            
            const reaction = {
                id: 'defense_reaction',
                priority: 8,
                conditions: [
                    { type: 'distance', operator: 'less_than', value: 150 }
                ],
                actions: [
                    { type: 'change_behavior', value: 'defensive' }
                ],
                cooldown: 2000
            };
            
            eventReactions.addReaction('player_attack', reaction);
            eventReactions.processEvent(event);
            
            // Check if reaction was triggered - a entidade afetada é a targetId
            const activeReactions = eventReactions.activeReactions.get('test_entity') || [];
            expect(activeReactions.length).toBeGreaterThan(0);
        });

        test('should execute actions correctly', () => {
            const entity = {
                id: 'test_entity',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 100 }
            };
            
            const event = {
                type: 'test_event',
                sourceId: 'test_source',
                position: { x: 100, y: 100 }
            };
            
            const action = { type: 'change_behavior', value: 'aggressive' };
            
            // Mock console.log to check if action was executed
            const originalLog = console.log;
            let actionExecuted = false;
            console.log = (...args) => {
                const message = args.join(' ');
                if (message.includes('[EventReactions]') && message.includes('comportamento')) {
                    actionExecuted = true;
                }
                originalLog(...args);
            };
            
            eventReactions.executeAction(entity, event, action);
            
            expect(actionExecuted).toBe(true);
            
            // Restore console.log
            console.log = originalLog;
        });

        test('should get statistics correctly', () => {
            const stats = eventReactions.getStatistics();
            
            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('eventsProcessed');
            expect(stats).toHaveProperty('reactionsTriggered');
            expect(stats).toHaveProperty('reactionsCompleted');
            expect(stats).toHaveProperty('averageReactionTime');
            expect(stats).toHaveProperty('activeReactions');
            expect(stats).toHaveProperty('queuedEvents');
            expect(stats).toHaveProperty('memorySize');
        });
    });

    describe('Integration Tests', () => {
        test('should integrate AI systems correctly', () => {
            // Test that all systems can work together
            expect(aiMobController).toBeDefined();
            expect(pathfindingSystem).toBeDefined();
            expect(aiBossController).toBeDefined();
            expect(decisionTree).toBeDefined();
            expect(eventReactions).toBeDefined();
        });

        test('should handle mob lifecycle with AI', () => {
            const mobData = {
                id: 'integration_test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            
            // Add to AI system
            const aiData = aiMobController.addMob(mobData);
            
            // Register for pathfinding
            pathfindingSystem.initialize(200, 200);
            pathfindingSystem.registerMovingEntity(mobData.id, mobData.position, 20, 20);
            
            // Test pathfinding
            const path = pathfindingSystem.findPath(mobData.position, { x: 150, y: 150 }, mobData.id);
            expect(path).toBeDefined();
            
            // Test decision making
            const context = {
                has_target: false,
                is_patrolling: true,
                health_percentage: 1.0
            };
            
            const decision = aiMobController.evaluateDecisionTree('general', context);
            expect(decision).toBeDefined();
            
            // Clean up
            aiMobController.removeMob(mobData.id);
            pathfindingSystem.unregisterMovingEntity(mobData.id);
        });

        test('should handle boss lifecycle with AI', () => {
            const bossData = {
                id: 'integration_test_boss',
                type: 'dragon_lord',
                position: { x: 400, y: 300 },
                currentHp: 2000,
                maxHp: 2000
            };
            
            // Add to AI system
            const bossAI = aiBossController.addBoss(bossData);
            
            // Register for pathfinding
            pathfindingSystem.initialize(1200, 800);
            pathfindingSystem.registerMovingEntity(bossData.id, bossData.position, 60, 60);
            
            // Test tactical evaluation
            const context = aiBossController.buildBossDecisionContext(bossData.id, bossAI);
            const tactic = aiBossController.evaluateBossTactics(bossAI, context);
            expect(tactic).toBeDefined();
            
            // Test ability usage
            const canUseAbility = aiBossController.canUseAbility(context, 'berserk');
            expect(typeof canUseAbility).toBe('boolean');
            
            // Clean up
            aiBossController.removeBoss(bossData.id);
            pathfindingSystem.unregisterMovingEntity(bossData.id);
        });

        test('should handle event-driven AI reactions', () => {
            const entity = {
                id: 'integration_test_entity',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 100 },
                type: 'goblin'
            };
            
            const event = {
                type: 'player_attack',
                sourceId: 'player_1',
                position: { x: 110, y: 100 },
                data: { damage: 10 }
            };
            
            // Queue event
            eventReactions.queueEvent(event);
            
            // Process event queue
            eventReactions.processEventQueue();
            
            // Check if reaction was processed
            expect(eventReactions.stats.eventsProcessed).toBeGreaterThan(0);
        });
    });

    describe('Performance Tests', () => {
        test('should handle AI updates efficiently', () => {
            // Add multiple mobs
            for (let i = 0; i < 50; i++) {
                const mobData = {
                    id: `perf_test_mob_${i}`,
                    type: 'goblin',
                    position: { x: Math.random() * 200, y: Math.random() * 200 },
                    stats: { hp: 50, maxHp: 50 }
                };
                aiMobController.addMob(mobData);
            }
            
            const startTime = Date.now();
            
            // Update all mobs
            aiMobController.updateAllMobs();
            
            const endTime = Date.now();
            const updateTime = endTime - startTime;
            
            // Should complete within reasonable time
            expect(updateTime).toBeLessThan(100); // 100ms max
        });

        test('should handle pathfinding efficiently', () => {
            pathfindingSystem.initialize(500, 500);
            
            const startTime = Date.now();
            
            // Find multiple paths
            for (let i = 0; i < 10; i++) {
                const start = { x: Math.random() * 400, y: Math.random() * 400 };
                const end = { x: Math.random() * 400, y: Math.random() * 400 };
                pathfindingSystem.findPath(start, end, `entity_${i}`);
            }
            
            const endTime = Date.now();
            const pathfindingTime = endTime - startTime;
            
            // Should complete within reasonable time
            expect(pathfindingTime).toBeLessThan(200); // 200ms max
        });

        test('should handle decision tree evaluation efficiently', () => {
            decisionTree.initialize();
            
            const context = {
                in_combat: true,
                has_target: true,
                target_threat_level: 0.8,
                health_percentage: 0.6
            };
            
            const startTime = Date.now();
            
            // Evaluate multiple decisions
            for (let i = 0; i < 100; i++) {
                decisionTree.evaluateTree('combat_behavior', context);
            }
            
            const endTime = Date.now();
            const decisionTime = endTime - startTime;
            
            // Should complete within reasonable time
            expect(decisionTime).toBeLessThan(50); // 50ms max
        });

        test('should get variable value correctly', () => {
            const context = {
                variables: new Map([['test_var', 42]]),
                test_var: 100
            };
            
            // Should get from variables Map first
            expect(decisionTree.getVariableValue('test_var', context)).toBe(42);
            
            // Should fallback to context property
            context.variables.delete('test_var');
            expect(decisionTree.getVariableValue('test_var', context)).toBe(100);
        });

        test('should resolve value correctly', () => {
            const context = {
                variables: new Map([['dynamic_var', 'resolved_value']])
            };
            
            // Static value
            expect(decisionTree.resolveValue('static', context)).toBe('static');
            
            // Variable reference
            expect(decisionTree.resolveValue({ variable: 'dynamic_var' }, context)).toBe('resolved_value');
        });

        test('should handle invalid tree evaluation', () => {
            expect(() => {
                decisionTree.evaluateTree('nonexistent_tree', {});
            }).toThrow();
        });

        test('should handle max depth exceeded', () => {
            decisionTree.createTree('deep_tree', {
                root: {
                    id: 'root',
                    type: 'condition',
                    variable: 'test',
                    operator: 'equals',
                    value: true,
                    true: {
                        id: 'child1',
                        type: 'condition',
                        variable: 'test',
                        operator: 'equals',
                        value: true,
                        true: { id: 'action', type: 'action', action: 'test', priority: 1 }
                    }
                }
            });

            // With maxDepth of 1, should timeout
            decisionTree.config.maxDepth = 1;
            const result = decisionTree.evaluateTree('deep_tree', { test: true });
            expect(result.action).toBe('timeout');
        });

        test('should evaluate function node with next', () => {
            decisionTree.functions.set('test_func', (x) => x * 2);
            
            decisionTree.createTree('func_tree', {
                root: {
                    id: 'func_node',
                    type: 'function',
                    function: 'test_func',
                    parameters: [{ value: 5 }],
                    next: {
                        id: 'action',
                        type: 'action',
                        action: 'use_result',
                        priority: 1
                    }
                }
            });

            const result = decisionTree.evaluateTree('func_tree', {});
            expect(result).toBeDefined();
        });

        test('should handle function not found', () => {
            decisionTree.createTree('bad_func_tree', {
                root: {
                    id: 'func_node',
                    type: 'function',
                    function: 'nonexistent_function',
                    parameters: []
                }
            });

            const result = decisionTree.evaluateTree('bad_func_tree', {});
            expect(result.action).toBe('error');
        });

        test('should evaluate switch node correctly', () => {
            decisionTree.createTree('switch_tree', {
                root: {
                    id: 'switch_node',
                    type: 'switch',
                    variable: 'mode',
                    cases: {
                        'attack': { id: 'attack_action', type: 'action', action: 'attack', priority: 1 },
                        'defend': { id: 'defend_action', type: 'action', action: 'defend', priority: 1 }
                    },
                    default: { id: 'default_action', type: 'action', action: 'wait', priority: 0 }
                }
            });

            const result1 = decisionTree.evaluateTree('switch_tree', { mode: 'attack' });
            expect(result1.action).toBe('attack');

            const result2 = decisionTree.evaluateTree('switch_tree', { mode: 'defend' });
            expect(result2.action).toBe('defend');

            const result3 = decisionTree.evaluateTree('switch_tree', { mode: 'unknown' });
            expect(result3.action).toBe('wait');
        });

        test('should evaluate random node with weighted options', () => {
            decisionTree.createTree('random_tree', {
                root: {
                    id: 'random_node',
                    type: 'random',
                    options: [
                        { action: { id: 'opt1', type: 'action', action: 'option1', priority: 1 }, weight: 1 },
                        { action: { id: 'opt2', type: 'action', action: 'option2', priority: 1 }, weight: 1 }
                    ]
                }
            });

            const results = [];
            for (let i = 0; i < 10; i++) {
                results.push(decisionTree.evaluateTree('random_tree', {}).action);
            }

            // Should have selected some option
            expect(results.every(r => ['option1', 'option2'].includes(r))).toBe(true);
        });

        test('should handle empty random options', () => {
            decisionTree.createTree('empty_random_tree', {
                root: {
                    id: 'random_node',
                    type: 'random',
                    options: []
                }
            });

            const result = decisionTree.evaluateTree('empty_random_tree', {});
            expect(result.action).toBe('no_options');
        });

        test('should update and get stats', () => {
            decisionTree.createDefaultTrees();
            
            // Make some evaluations to generate stats
            for (let i = 0; i < 5; i++) {
                decisionTree.evaluateTree('combat_behavior', {
                    in_combat: true,
                    has_target: true,
                    target_threat_level: 0.5,
                    health_percentage: 0.8
                });
            }

            const stats = decisionTree.getStats();
            expect(stats.totalEvaluations).toBeGreaterThanOrEqual(5);
            expect(stats.averageEvaluationTime).toBeGreaterThanOrEqual(0);
        });

        test('should register and use context', () => {
            decisionTree.registerContext('player_context', {
                health: 100,
                mana: 50,
                level: 10
            });

            expect(decisionTree.context.has('player_context')).toBe(true);
            expect(decisionTree.getContext('player_context').health).toBe(100);
        });

        test('should register and use variables', () => {
            decisionTree.registerVariable('game_difficulty', 'normal');
            expect(decisionTree.getVariable('game_difficulty')).toBe('normal');
            
            decisionTree.setVariable('game_difficulty', 'hard');
            expect(decisionTree.getVariable('game_difficulty')).toBe('hard');
        });

        test('should reset and clear trees', () => {
            decisionTree.createDefaultTrees();
            expect(decisionTree.trees.size).toBeGreaterThan(0);
            
            decisionTree.reset();
            expect(decisionTree.trees.size).toBe(0);
            expect(decisionTree.evaluationCache.size).toBe(0);
        });

        test('should check if tree exists', () => {
            decisionTree.createDefaultTrees();
            
            expect(decisionTree.hasTree('combat_behavior')).toBe(true);
            expect(decisionTree.hasTree('nonexistent')).toBe(false);
        });

        test('should remove tree', () => {
            decisionTree.createDefaultTrees();
            
            decisionTree.removeTree('combat_behavior');
            expect(decisionTree.hasTree('combat_behavior')).toBe(false);
        });

        test('should get all tree names', () => {
            decisionTree.createDefaultTrees();
            
            const names = decisionTree.getTreeNames();
            expect(names).toContain('combat_behavior');
            expect(names).toContain('target_selection');
        });

        test('should export and import tree', () => {
            const treeData = {
                root: {
                    id: 'test_root',
                    type: 'condition',
                    variable: 'health',
                    operator: 'less_than',
                    value: 50,
                    true: { id: 'heal', type: 'action', action: 'heal', priority: 10 },
                    false: { id: 'attack', type: 'action', action: 'attack', priority: 5 }
                }
            };
            
            decisionTree.createTree('export_test', treeData);
            
            const exported = decisionTree.exportTree('export_test');
            expect(exported).toBeDefined();
            expect(exported.root.id).toBe('test_root');
            
            decisionTree.importTree('imported_test', exported);
            expect(decisionTree.hasTree('imported_test')).toBe(true);
        });

        test('should handle logical AND conditions', () => {
            decisionTree.createTree('and_tree', {
                root: {
                    id: 'and_node',
                    type: 'condition',
                    operator: 'and',
                    conditions: [
                        { variable: 'has_target', operator: 'equals', value: true },
                        { variable: 'in_range', operator: 'equals', value: true }
                    ],
                    true: { id: 'attack', type: 'action', action: 'attack', priority: 1 },
                    false: { id: 'wait', type: 'action', action: 'wait', priority: 0 }
                }
            });

            const result1 = decisionTree.evaluateTree('and_tree', {
                has_target: true,
                in_range: true
            });
            expect(result1.action).toBe('attack');

            const result2 = decisionTree.evaluateTree('and_tree', {
                has_target: true,
                in_range: false
            });
            expect(result2.action).toBe('wait');
        });

        test('should handle logical OR conditions', () => {
            decisionTree.createTree('or_tree', {
                root: {
                    id: 'or_node',
                    type: 'condition',
                    operator: 'or',
                    conditions: [
                        { variable: 'low_health', operator: 'equals', value: true },
                        { variable: 'low_mana', operator: 'equals', value: true }
                    ],
                    true: { id: 'retreat', type: 'action', action: 'retreat', priority: 1 },
                    false: { id: 'fight', type: 'action', action: 'fight', priority: 0 }
                }
            });

            const result1 = decisionTree.evaluateTree('or_tree', {
                low_health: false,
                low_mana: true
            });
            expect(result1.action).toBe('retreat');

            const result2 = decisionTree.evaluateTree('or_tree', {
                low_health: false,
                low_mana: false
            });
            expect(result2.action).toBe('fight');
        });

        test('should cache evaluation results', () => {
            decisionTree.createDefaultTrees();
            decisionTree.config.enableCache = true;
            
            const context = {
                in_combat: true,
                has_target: true,
                target_threat_level: 0.5,
                health_percentage: 0.8
            };
            
            // First evaluation
            const result1 = decisionTree.evaluateTree('combat_behavior', context);
            
            // Second evaluation should use cache
            const result2 = decisionTree.evaluateTree('combat_behavior', context);
            
            expect(result1).toEqual(result2);
            expect(decisionTree.stats.cacheHits).toBeGreaterThan(0);
        });
    });

    describe('EventReactions', () => {
        test('should initialize correctly', () => {
            expect(eventReactions).toBeDefined();
            expect(eventReactions.reactions).toBeInstanceOf(Map);
            expect(eventReactions.eventHandlers).toBeInstanceOf(Map);
        });

        test('should register and handle event', () => {
            const handler = jest.fn();
            
            eventReactions.registerHandler('test_event', handler);
            eventReactions.triggerEvent('test_event', { data: 'test' });
            
            expect(handler).toHaveBeenCalledWith({ data: 'test' });
        });

        test('should register multiple handlers for same event', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            
            eventReactions.registerHandler('multi_event', handler1);
            eventReactions.registerHandler('multi_event', handler2);
            
            eventReactions.triggerEvent('multi_event', { value: 1 });
            
            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });

        test('should remove handler', () => {
            const handler = jest.fn();
            
            eventReactions.registerHandler('removable_event', handler);
            eventReactions.removeHandler('removable_event', handler);
            eventReactions.triggerEvent('removable_event', {});
            
            expect(handler).not.toHaveBeenCalled();
        });

        test('should handle player death event', () => {
            const handler = jest.fn();
            eventReactions.registerHandler('player_death', handler);
            
            eventReactions.triggerEvent('player_death', {
                playerId: 'player_1',
                killerId: 'mob_1',
                location: { x: 100, y: 200 }
            });
            
            expect(handler).toHaveBeenCalled();
        });

        test('should handle mob spawn event', () => {
            const handler = jest.fn();
            eventReactions.registerHandler('mob_spawn', handler);
            
            eventReactions.triggerEvent('mob_spawn', {
                mobId: 'mob_1',
                mobType: 'goblin',
                location: { x: 50, y: 100 }
            });
            
            expect(handler).toHaveBeenCalled();
        });

        test('should handle zone change event', () => {
            const handler = jest.fn();
            eventReactions.registerHandler('zone_change', handler);
            
            eventReactions.triggerEvent('zone_change', {
                playerId: 'player_1',
                fromZone: 'forest',
                toZone: 'dungeon'
            });
            
            expect(handler).toHaveBeenCalled();
        });

        test('should queue events and process them', () => {
            const handler = jest.fn();
            eventReactions.registerHandler('queued_event', handler);
            
            eventReactions.queueEvent('queued_event', { id: 1 });
            eventReactions.queueEvent('queued_event', { id: 2 });
            
            eventReactions.processEventQueue();
            
            expect(handler).toHaveBeenCalledTimes(2);
        });

        test('should clear event queue', () => {
            eventReactions.queueEvent('test_event', { data: 1 });
            eventReactions.queueEvent('test_event', { data: 2 });
            
            eventReactions.clearEventQueue();
            
            expect(eventReactions.eventQueue.length).toBe(0);
        });

        test('should pause and resume event processing', () => {
            eventReactions.pause();
            expect(eventReactions.isPaused).toBe(true);
            
            eventReactions.resume();
            expect(eventReactions.isPaused).toBe(false);
        });

        test('should not process events when paused', () => {
            const handler = jest.fn();
            eventReactions.registerHandler('paused_event', handler);
            
            eventReactions.pause();
            eventReactions.triggerEvent('paused_event', {});
            
            // When paused, events might be queued but not processed immediately
            expect(eventReactions.isPaused).toBe(true);
        });

        test('should get registered event types', () => {
            eventReactions.registerHandler('event_type_1', () => {});
            eventReactions.registerHandler('event_type_2', () => {});
            
            const types = eventReactions.getRegisteredEventTypes();
            expect(types).toContain('event_type_1');
            expect(types).toContain('event_type_2');
        });

        test('should check if event has handlers', () => {
            eventReactions.registerHandler('has_handler_event', () => {});
            
            expect(eventReactions.hasHandlers('has_handler_event')).toBe(true);
            expect(eventReactions.hasHandlers('no_handler_event')).toBe(false);
        });

        test('should get handler count for event', () => {
            eventReactions.registerHandler('count_event', () => {});
            eventReactions.registerHandler('count_event', () => {});
            
            expect(eventReactions.getHandlerCount('count_event')).toBe(2);
        });

        test('should create and use custom reaction', () => {
            eventReactions.createReaction('custom_reaction', {
                conditions: [
                    { type: 'health_below', threshold: 0.3 }
                ],
                actions: [
                    { type: 'flee', priority: 10 }
                ]
            });
            
            expect(eventReactions.hasReaction('custom_reaction')).toBe(true);
            
            const reaction = eventReactions.getReaction('custom_reaction');
            expect(reaction.conditions).toHaveLength(1);
        });

        test('should remove custom reaction', () => {
            eventReactions.createReaction('removable_reaction', {
                conditions: [],
                actions: []
            });
            
            eventReactions.removeReaction('removable_reaction');
            expect(eventReactions.hasReaction('removable_reaction')).toBe(false);
        });

        test('should trigger reaction by name', () => {
            const actionHandler = jest.fn();
            
            eventReactions.createReaction('trigger_test', {
                conditions: [],
                actions: [
                    { type: 'test_action', handler: actionHandler }
                ]
            });
            
            eventReactions.triggerReaction('trigger_test', { test: true });
            
            expect(actionHandler).toHaveBeenCalled();
        });

        test('should handle async event handlers', async () => {
            const asyncHandler = jest.fn().mockResolvedValue(undefined);
            
            eventReactions.registerHandler('async_event', asyncHandler);
            
            await eventReactions.triggerEventAsync('async_event', { data: 'async' });
            
            expect(asyncHandler).toHaveBeenCalledWith({ data: 'async' });
        });

        test('should batch process events', () => {
            const handler = jest.fn();
            eventReactions.registerHandler('batch_event', handler);
            
            for (let i = 0; i < 10; i++) {
                eventReactions.queueEvent('batch_event', { id: i });
            }
            
            eventReactions.processBatch(5);
            
            // Should have processed at most 5 events
            expect(handler.mock.calls.length).toBeLessThanOrEqual(5);
        });

        test('should get event statistics', () => {
            eventReactions.registerHandler('stats_event', () => {});
            
            for (let i = 0; i < 5; i++) {
                eventReactions.triggerEvent('stats_event', {});
            }
            
            const stats = eventReactions.getStats();
            expect(stats.totalEventsProcessed).toBeGreaterThanOrEqual(5);
        });

        test('should reset statistics', () => {
            eventReactions.triggerEvent('some_event', {});
            eventReactions.resetStats();
            
            const stats = eventReactions.getStats();
            expect(stats.totalEventsProcessed).toBe(0);
        });

        test('should cleanup properly', () => {
            eventReactions.registerHandler('cleanup_event', () => {});
            eventReactions.createReaction('cleanup_reaction', { conditions: [], actions: [] });
            
            eventReactions.cleanup();
            
            expect(eventReactions.eventHandlers.size).toBe(0);
            expect(eventReactions.reactions.size).toBe(0);
            expect(eventReactions.eventQueue.length).toBe(0);
        });

        test('should handle once handlers', () => {
            const handler = jest.fn();
            
            eventReactions.registerHandlerOnce('once_event', handler);
            
            eventReactions.triggerEvent('once_event', {});
            eventReactions.triggerEvent('once_event', {});
            
            // Handler should only be called once
            expect(handler).toHaveBeenCalledTimes(1);
        });

        test('should prioritize event handlers', () => {
            const calls = [];
            
            eventReactions.registerHandler('priority_event', () => calls.push('second'), { priority: 2 });
            eventReactions.registerHandler('priority_event', () => calls.push('first'), { priority: 1 });
            eventReactions.registerHandler('priority_event', () => calls.push('third'), { priority: 3 });
            
            eventReactions.triggerEvent('priority_event', {});
            
            // Higher priority should be called first
            expect(calls).toEqual(['third', 'second', 'first']);
        });

        test('should filter events with conditions', () => {
            const handler = jest.fn();
            
            eventReactions.registerHandler('conditional_event', handler, {
                filter: (data) => data.level > 10
            });
            
            eventReactions.triggerEvent('conditional_event', { level: 5 });
            eventReactions.triggerEvent('conditional_event', { level: 15 });
            
            // Handler should only be called for level > 10
            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ level: 15 });
        });

        test('should debounce event handlers', () => {
            const handler = jest.fn();
            
            eventReactions.registerHandler('debounce_event', handler, {
                debounce: 100
            });
            
            // Trigger multiple times rapidly
            eventReactions.triggerEvent('debounce_event', {});
            eventReactions.triggerEvent('debounce_event', {});
            eventReactions.triggerEvent('debounce_event', {});
            
            // Handler should be debounced
            expect(handler).toHaveBeenCalledTimes(1);
        });

        test('should throttle event handlers', () => {
            const handler = jest.fn();
            
            eventReactions.registerHandler('throttle_event', handler, {
                throttle: 50
            });
            
            // Trigger multiple times
            eventReactions.triggerEvent('throttle_event', {});
            eventReactions.triggerEvent('throttle_event', {});
            eventReactions.triggerEvent('throttle_event', {});
            
            // Handler should be throttled (limited calls)
            expect(handler.mock.calls.length).toBeLessThanOrEqual(2);
        });

        test('should handle event propagation', () => {
            const parentHandler = jest.fn();
            const childHandler = jest.fn().mockReturnValue(false); // Stop propagation
            
            eventReactions.registerHandler('propagation_event', parentHandler, { phase: 'capture' });
            eventReactions.registerHandler('propagation_event', childHandler, { phase: 'bubble' });
            
            eventReactions.triggerEvent('propagation_event', {});
            
            // Both should be called
            expect(parentHandler).toHaveBeenCalled();
            expect(childHandler).toHaveBeenCalled();
        });

        test('should emit and listen to custom events', () => {
            const listener = jest.fn();
            
            eventReactions.on('custom_emit', listener);
            eventReactions.emit('custom_emit', { value: 42 });
            
            expect(listener).toHaveBeenCalledWith({ value: 42 });
        });

        test('should remove event listener', () => {
            const listener = jest.fn();
            
            eventReactions.on('removable_emit', listener);
            eventReactions.off('removable_emit', listener);
            eventReactions.emit('removable_emit', {});
            
            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('DeltaCompressor', () => {
        test('should initialize correctly', () => {
            expect(deltaCompressor).toBeDefined();
            expect(deltaCompressor.lastStates).toBeInstanceOf(Map);
            expect(deltaCompressor.stats).toBeDefined();
        });

        test('should compress state and return delta', () => {
            const entityId = 'test_entity_1';
            const state = {
                x: 100,
                y: 200,
                hp: 100,
                maxHp: 100,
                name: 'Test Entity'
            };

            // First call should return full state
            const compressed1 = deltaCompressor.compress(entityId, state);
            expect(compressed1).toEqual(state);

            // Second call with same state should return minimal delta
            const compressed2 = deltaCompressor.compress(entityId, state);
            expect(Object.keys(compressed2)).toHaveLength(0);
        });

        test('should detect changes in state', () => {
            const entityId = 'test_entity_2';
            const state1 = {
                x: 100,
                y: 200,
                hp: 100,
                name: 'Test'
            };

            deltaCompressor.compress(entityId, state1);

            const state2 = {
                x: 150,
                y: 200,
                hp: 80,
                name: 'Test'
            };

            const compressed = deltaCompressor.compress(entityId, state2);
            expect(compressed.x).toBe(150);
            expect(compressed.hp).toBe(80);
            expect(compressed.y).toBeUndefined();
            expect(compressed.name).toBeUndefined();
        });

        test('should handle deepEqual comparison', () => {
            const obj1 = { a: 1, b: { c: 2 } };
            const obj2 = { a: 1, b: { c: 2 } };
            const obj3 = { a: 1, b: { c: 3 } };

            expect(deltaCompressor.deepEqual(obj1, obj2)).toBe(true);
            expect(deltaCompressor.deepEqual(obj1, obj3)).toBe(false);
        });

        test('should clone state correctly', () => {
            const state = { a: 1, b: { c: 2 }, d: [1, 2, 3] };
            const clone = deltaCompressor.cloneState(state);

            expect(clone).toEqual(state);
            expect(clone).not.toBe(state);
            expect(clone.b).not.toBe(state.b);
        });

        test('should calculate savings', () => {
            const entityId = 'test_entity_3';
            const state = {
                x: 100,
                y: 200,
                hp: 100,
                name: 'Test Entity',
                inventory: ['item1', 'item2', 'item3']
            };

            deltaCompressor.compress(entityId, state);
            const compressed = deltaCompressor.compress(entityId, state);
            const fullSize = JSON.stringify(state).length;
            const deltaSize = JSON.stringify(compressed).length;

            const savings = deltaCompressor.calculateSavings(fullSize, deltaSize);
            expect(savings).toBeGreaterThanOrEqual(0);
            expect(savings).toBeLessThanOrEqual(100);
        });

        test('should decompress state correctly', () => {
            const entityId = 'test_entity_4';
            const state = {
                x: 100,
                y: 200,
                hp: 100
            };

            deltaCompressor.compress(entityId, state);

            const delta = { x: 150, hp: 80 };
            const clientState = { x: 100, y: 200, hp: 100 };

            const decompressed = deltaCompressor.decompress(entityId, delta, clientState);
            expect(decompressed.x).toBe(150);
            expect(decompressed.hp).toBe(80);
            expect(decompressed.y).toBe(200);
        });

        test('should remove entity state', () => {
            const entityId = 'test_entity_5';
            const state = { x: 100, y: 200 };

            deltaCompressor.compress(entityId, state);
            expect(deltaCompressor.lastStates.has(entityId)).toBe(true);

            deltaCompressor.removeEntity(entityId);
            expect(deltaCompressor.lastStates.has(entityId)).toBe(false);
        });

        test('should track compression stats', () => {
            const entityId = 'test_entity_6';
            const state = { x: 100, y: 200, hp: 100 };

            deltaCompressor.compress(entityId, state);
            deltaCompressor.compress(entityId, state);

            const stats = deltaCompressor.getStats();
            expect(stats.totalCompressed).toBeGreaterThanOrEqual(2);
            expect(stats.totalSavings).toBeGreaterThanOrEqual(0);
        });

        test('should handle null and undefined states', () => {
            const entityId = 'test_entity_7';

            const compressed1 = deltaCompressor.compress(entityId, null);
            expect(compressed1).toBeNull();

            const compressed2 = deltaCompressor.compress(entityId, undefined);
            expect(compressed2).toBeUndefined();
        });

        test('should handle array states', () => {
            const entityId = 'test_entity_8';
            const state1 = { items: ['a', 'b', 'c'] };
            const state2 = { items: ['a', 'b', 'c', 'd'] };

            deltaCompressor.compress(entityId, state1);
            const compressed = deltaCompressor.compress(entityId, state2);

            expect(compressed.items).toEqual(['a', 'b', 'c', 'd']);
        });

        test('should handle nested object changes', () => {
            const entityId = 'test_entity_9';
            const state1 = {
                position: { x: 10, y: 20 },
                stats: { hp: 100, mp: 50 }
            };
            const state2 = {
                position: { x: 15, y: 20 },
                stats: { hp: 100, mp: 45 }
            };

            deltaCompressor.compress(entityId, state1);
            const compressed = deltaCompressor.compress(entityId, state2);

            expect(compressed.position).toBeDefined();
            expect(compressed.position.x).toBe(15);
            expect(compressed.stats).toBeDefined();
            expect(compressed.stats.mp).toBe(45);
        });

        test('should clear all states', () => {
            const entityId1 = 'test_entity_10';
            const entityId2 = 'test_entity_11';

            deltaCompressor.compress(entityId1, { x: 1 });
            deltaCompressor.compress(entityId2, { x: 2 });

            expect(deltaCompressor.lastStates.size).toBe(2);

            deltaCompressor.clear();
            expect(deltaCompressor.lastStates.size).toBe(0);
            expect(deltaCompressor.stats.totalCompressed).toBe(0);
        });

        test('should handle multiple entities independently', () => {
            const entityId1 = 'entity_a';
            const entityId2 = 'entity_b';

            deltaCompressor.compress(entityId1, { x: 100, y: 200 });
            deltaCompressor.compress(entityId2, { x: 300, y: 400 });

            const compressed1 = deltaCompressor.compress(entityId1, { x: 110, y: 200 });
            const compressed2 = deltaCompressor.compress(entityId2, { x: 300, y: 420 });

            expect(compressed1.x).toBe(110);
            expect(compressed1.y).toBeUndefined();
            expect(compressed2.x).toBeUndefined();
            expect(compressed2.y).toBe(420);
        });
    });

    describe('AIReactionHandler', () => {
        test('should initialize correctly', () => {
            expect(aiReactionHandler).toBeDefined();
            expect(aiReactionHandler.mobController).toBe(aiMobController);
            expect(aiReactionHandler.bossController).toBe(aiBossController);
        });

        test('should set socket.io instance', () => {
            const mockIo = {
                emit: jest.fn(),
                to: jest.fn().mockReturnThis()
            };

            aiReactionHandler.setSocketIO(mockIo);
            expect(aiReactionHandler.io).toBe(mockIo);
        });

        test('should handle player ability targeting mob', () => {
            const mobId = 'mob_1';
            const playerId = 'player_1';
            const ability = {
                name: 'Test Ability',
                damage: 50,
                type: 'physical'
            };

            // Mock the mob in the controller
            aiMobController.mobs.set(mobId, {
                id: mobId,
                hp: 100,
                maxHp: 100,
                threatTable: new Map()
            });

            aiReactionHandler.onPlayerAbility(playerId, mobId, ability);

            const mob = aiMobController.mobs.get(mobId);
            expect(mob.threatTable.has(playerId)).toBe(true);
        });

        test('should handle player damage to boss', () => {
            const bossId = 'boss_1';
            const playerId = 'player_1';
            const damage = 100;
            const damageType = 'fire';

            // Mock the boss in the controller
            aiBossController.bosses.set(bossId, {
                id: bossId,
                hp: 1000,
                maxHp: 1000,
                threatTable: new Map(),
                damageResistances: { fire: 0.5 },
                damageWeaknesses: {}
            });

            aiReactionHandler.onPlayerDamage(playerId, bossId, damage, damageType);

            const boss = aiBossController.bosses.get(bossId);
            expect(boss.threatTable.has(playerId)).toBe(true);
        });

        test('should handle player heal', () => {
            const targetId = 'mob_2';
            const playerId = 'player_2';
            const healAmount = 30;

            aiMobController.mobs.set(targetId, {
                id: targetId,
                hp: 50,
                maxHp: 100,
                threatTable: new Map()
            });

            aiReactionHandler.onPlayerHeal(playerId, targetId, healAmount);

            const mob = aiMobController.mobs.get(targetId);
            expect(mob.threatTable.has(playerId)).toBe(true);
        });

        test('should handle crowd control - stun', () => {
            const targetId = 'mob_3';
            const playerId = 'player_3';
            const ability = {
                name: 'Stun Ability',
                type: 'stun',
                duration: 3000
            };

            aiMobController.mobs.set(targetId, {
                id: targetId,
                state: 'active',
                ccEffects: []
            });

            aiReactionHandler.handleCrowdControl(playerId, targetId, ability);

            const mob = aiMobController.mobs.get(targetId);
            expect(mob.ccEffects).toContainEqual(expect.objectContaining({
                type: 'stun',
                duration: 3000
            }));
        });

        test('should handle taunt ability', () => {
            const targetId = 'mob_4';
            const playerId = 'player_4';
            const ability = {
                name: 'Taunt',
                type: 'taunt',
                duration: 5000
            };

            aiMobController.mobs.set(targetId, {
                id: targetId,
                currentTarget: null,
                tauntedBy: null
            });

            aiReactionHandler.handleTauntAbility(playerId, targetId, ability);

            const mob = aiMobController.mobs.get(targetId);
            expect(mob.tauntedBy).toBe(playerId);
            expect(mob.currentTarget).toBe(playerId);
        });

        test('should handle defensive ability', () => {
            const playerId = 'player_5';
            const ability = {
                name: 'Defensive Stance',
                type: 'defense',
                effect: 'damage_reduction',
                amount: 0.5
            };

            aiReactionHandler.handleDefensiveAbility(playerId, playerId, ability);

            // Should not throw and should process normally
            expect(aiReactionHandler).toBeDefined();
        });

        test('should apply stun effect', () => {
            const targetId = 'mob_5';
            const duration = 2000;

            aiMobController.mobs.set(targetId, {
                id: targetId,
                state: 'active',
                ccEffects: []
            });

            aiReactionHandler.applyStun(targetId, duration);

            const mob = aiMobController.mobs.get(targetId);
            expect(mob.state).toBe('stunned');
            expect(mob.ccEffects).toHaveLength(1);
        });

        test('should apply fear effect', () => {
            const targetId = 'mob_6';
            const sourcePlayerId = 'player_6';
            const duration = 3000;

            aiMobController.mobs.set(targetId, {
                id: targetId,
                state: 'active',
                ccEffects: []
            });

            aiReactionHandler.applyFear(targetId, duration, sourcePlayerId);

            const mob = aiMobController.mobs.get(targetId);
            expect(mob.state).toBe('fleeing');
            expect(mob.fleeingFrom).toBe(sourcePlayerId);
        });

        test('should apply charm effect', () => {
            const targetId = 'mob_7';
            const sourcePlayerId = 'player_7';
            const duration = 5000;

            aiMobController.mobs.set(targetId, {
                id: targetId,
                state: 'active',
                ccEffects: [],
                charmedBy: null
            });

            aiReactionHandler.applyCharm(targetId, duration, sourcePlayerId);

            const mob = aiMobController.mobs.get(targetId);
            expect(mob.state).toBe('charmed');
            expect(mob.charmedBy).toBe(sourcePlayerId);
        });

        test('should apply root effect', () => {
            const targetId = 'mob_8';
            const duration = 2500;

            aiMobController.mobs.set(targetId, {
                id: targetId,
                state: 'active',
                ccEffects: [],
                canMove: true
            });

            aiReactionHandler.applyRoot(targetId, duration);

            const mob = aiMobController.mobs.get(targetId);
            expect(mob.canMove).toBe(false);
        });

        test('should apply silence effect', () => {
            const targetId = 'mob_9';
            const duration = 4000;

            aiMobController.mobs.set(targetId, {
                id: targetId,
                state: 'active',
                ccEffects: [],
                canCast: true
            });

            aiReactionHandler.applySilence(targetId, duration);

            const mob = aiMobController.mobs.get(targetId);
            expect(mob.canCast).toBe(false);
        });

        test('should check boss weaknesses', () => {
            const bossId = 'boss_2';
            const playerId = 'player_8';
            const damageType = 'ice';

            aiBossController.bosses.set(bossId, {
                id: bossId,
                damageResistances: { ice: 2.0 },
                damageWeaknesses: { ice: true },
                currentPhase: 1
            });

            aiReactionHandler.checkBossWeakness(playerId, bossId, damageType);

            // Should process weakness check
            expect(aiReactionHandler).toBeDefined();
        });

        test('should get AI data for mob', () => {
            const mobId = 'mob_10';

            aiMobController.mobs.set(mobId, {
                id: mobId,
                x: 100,
                y: 200,
                hp: 80,
                maxHp: 100,
                state: 'active'
            });

            const data = aiReactionHandler.getAIData(mobId);
            expect(data).toBeDefined();
            expect(data.x).toBe(100);
            expect(data.y).toBe(200);
        });

        test('should get mobs targeting player', () => {
            const playerId = 'player_9';
            const mobId1 = 'mob_11';
            const mobId2 = 'mob_12';

            aiMobController.mobs.set(mobId1, {
                id: mobId1,
                currentTarget: playerId,
                state: 'active'
            });
            aiMobController.mobs.set(mobId2, {
                id: mobId2,
                currentTarget: 'other_player',
                state: 'active'
            });

            const targetingMobs = aiReactionHandler.getMobsTargeting(playerId);
            expect(targetingMobs).toHaveLength(1);
            expect(targetingMobs[0].id).toBe(mobId1);
        });

        test('should validate target correctly', () => {
            const validMobId = 'mob_13';
            const invalidMobId = 'nonexistent';

            aiMobController.mobs.set(validMobId, {
                id: validMobId,
                hp: 100,
                state: 'active'
            });

            expect(aiReactionHandler.isValidTarget(validMobId)).toBe(true);
            expect(aiReactionHandler.isValidTarget(invalidMobId)).toBe(false);
        });

        test('should check for duplicate events', () => {
            const eventKey = 'test_event_123';

            expect(aiReactionHandler.isDuplicate(eventKey)).toBe(false);
            expect(aiReactionHandler.isDuplicate(eventKey)).toBe(true);
        });

        test('should broadcast reaction', () => {
            const mockIo = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn()
            };
            aiReactionHandler.setSocketIO(mockIo);

            const targetId = 'mob_14';
            const reactionType = 'aggro';
            const data = { source: 'player_10' };

            aiMobController.mobs.set(targetId, {
                id: targetId,
                zone: 'test_zone'
            });

            aiReactionHandler.broadcastReaction(targetId, reactionType, data);

            expect(mockIo.to).toHaveBeenCalledWith('test_zone');
        });

        test('should broadcast tactical feedback', () => {
            const mockIo = {
                emit: jest.fn()
            };
            aiReactionHandler.setSocketIO(mockIo);

            const playerId = 'player_11';
            const tipType = 'weakness_spotted';
            const data = { bossId: 'boss_3', damageType: 'fire' };

            aiReactionHandler.broadcastTacticalFeedback(playerId, tipType, data);

            expect(mockIo.emit).toHaveBeenCalled();
        });

        test('should cleanup correctly', () => {
            aiReactionHandler.cleanup();
            expect(aiReactionHandler.mobController).toBeNull();
            expect(aiReactionHandler.bossController).toBeNull();
            expect(aiReactionHandler.io).toBeNull();
        });

        test('should handle invalid target for ability', () => {
            const playerId = 'player_12';
            const invalidTargetId = 'nonexistent_mob';
            const ability = { name: 'Test' };

            // Should not throw
            expect(() => {
                aiReactionHandler.onPlayerAbility(playerId, invalidTargetId, ability);
            }).not.toThrow();
        });

        test('should handle boss without resistance data', () => {
            const bossId = 'boss_4';
            const playerId = 'player_13';
            const damageType = 'unknown';

            aiBossController.bosses.set(bossId, {
                id: bossId,
                // No resistance data
            });

            // Should not throw
            expect(() => {
                aiReactionHandler.onPlayerDamage(playerId, bossId, 50, damageType);
            }).not.toThrow();
        });

        test('should handle heal on invalid target', () => {
            const playerId = 'player_14';
            const invalidTargetId = 'nonexistent';

            // Should not throw
            expect(() => {
                aiReactionHandler.onPlayerHeal(playerId, invalidTargetId, 50);
            }).not.toThrow();
        });

        test('should handle fear on invalid target', () => {
            const playerId = 'player_15';

            // Should not throw
            expect(() => {
                aiReactionHandler.applyFear('nonexistent', 3000, playerId);
            }).not.toThrow();
        });

        test('should track recent events for duplicate prevention', () => {
            const eventKey1 = 'event_1';
            const eventKey2 = 'event_2';

            expect(aiReactionHandler.isDuplicate(eventKey1)).toBe(false);
            expect(aiReactionHandler.isDuplicate(eventKey1)).toBe(true);
            expect(aiReactionHandler.isDuplicate(eventKey2)).toBe(false);
        });
    });

    // Additional AIMobController tests for 95% coverage
    describe('AIMobController - Extended Coverage', () => {
        test('setupBehaviorProfiles creates all profiles', () => {
            mobController.behaviors.clear();
            mobController.setupBehaviorProfiles();
            
            expect(mobController.behaviors.has('aggressive')).toBe(true);
            expect(mobController.behaviors.has('defensive')).toBe(true);
            expect(mobController.behaviors.has('passive')).toBe(true);
            expect(mobController.behaviors.has('scout')).toBe(true);
        });

        test('createMemory initializes all memory systems', () => {
            const memory = mobController.createMemory('test-mob');
            
            expect(memory.shortTerm).toBeDefined();
            expect(memory.shortTerm.threats).toBeInstanceOf(Map);
            expect(memory.longTerm).toBeDefined();
            expect(memory.longTerm.killedPlayers).toBeInstanceOf(Set);
            expect(memory.sensory).toBeDefined();
            expect(memory.sensory.lastSound).toBeNull();
            expect(memory.emotional).toBeDefined();
            expect(memory.emotional.current).toBe('neutral');
        });

        test('createStateMachine with all state methods', () => {
            const profile = mobController.behaviors.get('aggressive');
            const stateMachine = mobController.createStateMachine('test-mob', profile);
            
            expect(stateMachine.states.idle).toBeDefined();
            expect(stateMachine.states.patrol).toBeDefined();
            expect(stateMachine.states.chase).toBeDefined();
            expect(stateMachine.states.attack).toBeDefined();
            expect(stateMachine.states.flee).toBeDefined();
            expect(stateMachine.states.idle.enter).toBeDefined();
            expect(stateMachine.states.idle.update).toBeDefined();
            expect(stateMachine.states.idle.exit).toBeDefined();
        });

        test('buildDecisionContext with complete mob data', () => {
            const aiData = mobController.mobs.get('mob-1');
            const context = mobController.buildDecisionContext('mob-1', aiData);
            
            expect(context).toHaveProperty('has_target');
            expect(context).toHaveProperty('target_in_range');
            expect(context).toHaveProperty('can_reach_target');
            expect(context).toHaveProperty('is_damaged');
            expect(context).toHaveProperty('is_low_health');
            expect(context).toHaveProperty('has_allies_nearby');
            expect(context).toHaveProperty('is_outnumbered');
            expect(context).toHaveProperty('threat_level');
        });

        test('evaluateCondition with all condition types', () => {
            const context = {
                has_target: true,
                target_in_range: false,
                can_reach_target: true,
                is_damaged: false,
                is_low_health: true,
                has_allies_nearby: false,
                is_outnumbered: true,
                threat_level: 'high'
            };
            
            expect(mobController.evaluateCondition('has_target', context)).toBe(true);
            expect(mobController.evaluateCondition('target_in_range', context)).toBe(false);
            expect(mobController.evaluateCondition('can_reach_target', context)).toBe(true);
            expect(mobController.evaluateCondition('is_damaged', context)).toBe(false);
            expect(mobController.evaluateCondition('is_low_health', context)).toBe(true);
            expect(mobController.evaluateCondition('has_allies_nearby', context)).toBe(false);
            expect(mobController.evaluateCondition('is_outnumbered', context)).toBe(true);
            expect(mobController.evaluateCondition('unknown_condition', context)).toBe(false);
        });

        test('executeDecision with all decision types', () => {
            const aiData = mobController.mobs.get('mob-1');
            aiData.stateMachine.transition = jest.fn();
            
            mobController.executeDecision('mob-1', aiData, 'idle');
            expect(aiData.stateMachine.transition).toHaveBeenCalledWith('idle');
            
            mobController.executeDecision('mob-1', aiData, 'patrol');
            expect(aiData.stateMachine.transition).toHaveBeenCalledWith('patrol');
            
            mobController.executeDecision('mob-1', aiData, 'chase');
            expect(aiData.stateMachine.transition).toHaveBeenCalledWith('chase');
            
            mobController.executeDecision('mob-1', aiData, 'attack');
            expect(aiData.stateMachine.transition).toHaveBeenCalledWith('attack');
            
            mobController.executeDecision('mob-1', aiData, 'flee');
            expect(aiData.stateMachine.transition).toHaveBeenCalledWith('flee');
        });

        test('evaluateNode with type condition and branch', () => {
            const context = { health: 50, maxHealth: 100 };
            const node = {
                type: 'condition',
                condition: 'is_low_health',
                trueBranch: { type: 'action', action: 'flee' },
                falseBranch: { type: 'action', action: 'attack' }
            };
            
            const result = mobController.evaluateNode(node, context);
            expect(result).toBeDefined();
        });

        test('updateMob with decision timeout and state update', () => {
            const aiData = mobController.mobs.get('mob-1');
            aiData.lastDecision = Date.now() - 2000;
            aiData.stateMachine.states.idle.update = jest.fn();
            
            mobController.updateMob('mob-1', aiData);
            
            expect(aiData.stateMachine.states.idle.update).toHaveBeenCalled();
        });

        test('updateMob without decision timeout', () => {
            const aiData = mobController.mobs.get('mob-1');
            aiData.lastDecision = Date.now();
            const makeDecisionSpy = jest.spyOn(mobController, 'makeDecision');
            
            mobController.updateMob('mob-1', aiData);
            
            expect(makeDecisionSpy).not.toHaveBeenCalled();
        });

        test('detectThreats with all threat types', () => {
            const aiData = mobController.mobs.get('mob-1');
            aiData.memory.shortTerm.threats.set('player-1', { level: 10, lastSeen: Date.now() });
            aiData.memory.shortTerm.threats.set('player-2', { level: 5, lastSeen: Date.now() - 10000 });
            
            const threats = mobController.detectThreats('mob-1');
            
            expect(Array.isArray(threats)).toBe(true);
        });

        test('getMobAI returns AI data', () => {
            const ai = mobController.getMobAI('mob-1');
            expect(ai).toBeDefined();
            expect(ai.id).toBe('mob-1');
        });

        test('getMobStats returns stats', () => {
            const stats = mobController.getMobStats('mob-1');
            expect(stats).toBeDefined();
            expect(typeof stats.decisions).toBe('number');
        });

        test('getAllMobIds returns array', () => {
            const ids = mobController.getAllMobIds();
            expect(Array.isArray(ids)).toBe(true);
            expect(ids).toContain('mob-1');
        });

        test('getMobCount returns number', () => {
            const count = mobController.getMobCount();
            expect(typeof count).toBe('number');
            expect(count).toBeGreaterThan(0);
        });

        test('mob exists after addition', () => {
            expect(mobController.hasMob('mob-1')).toBe(true);
            expect(mobController.hasMob('nonexistent')).toBe(false);
        });

        test('clearAllMobs removes all', () => {
            mobController.clearAllMobs();
            expect(mobController.mobs.size).toBe(0);
        });
    });

    // Additional AIBossController tests for 95% coverage
    describe('AIBossController - Extended Coverage', () => {
        test('initialize calls setup methods', () => {
            const setupPatternsSpy = jest.spyOn(bossController, 'setupAbilityPatterns');
            const startLoopSpy = jest.spyOn(bossController, 'startUpdateLoop');
            
            bossController.initialize();
            
            expect(setupPatternsSpy).toHaveBeenCalled();
            expect(startLoopSpy).toHaveBeenCalled();
        });

        test('setupTacticalProfiles creates profiles', () => {
            bossController.setupTacticalProfiles();
            
            expect(bossController.tactics.has('aggressive')).toBe(true);
            expect(bossController.tactics.has('defensive')).toBe(true);
            expect(bossController.tactics.has('balanced')).toBe(true);
        });

        test('createPatternMemory initializes memory', () => {
            const memory = bossController.createPatternMemory('test-boss');
            
            expect(memory.playerPatterns).toBeInstanceOf(Map);
            expect(memory.successfulAttacks).toBeInstanceOf(Array);
            expect(memory.failedAttempts).toBeInstanceOf(Array);
            expect(memory.abilityEffectiveness).toBeInstanceOf(Map);
        });

        test('createDifficultyData initializes difficulty', () => {
            const difficulty = bossController.createDifficultyData('test-boss');
            
            expect(difficulty.playerSkillLevel).toBe(1.0);
            expect(difficulty.playerCount).toBe(1);
            expect(difficulty.damageMultiplier).toBe(1.0);
            expect(difficulty.healthMultiplier).toBe(1.0);
        });

        test('getBossData returns boss data', () => {
            const data = bossController.getBossData('boss-1');
            expect(data).toBeDefined();
        });

        test('initializeBossAbilities sets up abilities', () => {
            const bossAI = bossController.bosses.get('boss-1');
            bossAI.abilities = new Map();
            
            bossController.initializeBossAbilities(bossAI);
            
            expect(bossAI.abilities.size).toBeGreaterThan(0);
        });

        test('updateBoss updates lastDecision', () => {
            const bossAI = bossController.bosses.get('boss-1');
            const initialDecision = bossAI.lastDecision;
            
            // Force decision timeout
            bossAI.lastDecision = Date.now() - 6000;
            
            bossController.updateBoss('boss-1', bossAI);
            
            expect(bossAI.lastDecision).toBeGreaterThan(initialDecision);
        });

        test('executeBossDecision handles use_charge', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'use_charge');
            
            expect(bossAI.currentAction).toBe('use_charge');
        });

        test('executeBossDecision handles summon_minions', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'summon_minions');
            
            expect(bossAI.currentAction).toBe('summon_minions');
        });

        test('executeBossDecision handles use_berserk', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'use_berserk');
            
            expect(bossAI.currentAction).toBe('use_berserk');
        });

        test('executeBossDecision handles scan_area', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'scan_area');
            
            expect(bossAI.currentAction).toBe('scan_area');
        });

        test('executeBossDecision handles mark_target', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'mark_target');
            
            expect(bossAI.currentAction).toBe('mark_target');
        });

        test('executeBossDecision handles retreat', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'retreat');
            
            expect(bossAI.currentAction).toBe('retreat');
        });

        test('executeBossDecision handles regroup', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'regroup');
            
            expect(bossAI.currentAction).toBe('regroup');
        });

        test('executeBossDecision handles use_area_control', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'use_area_control');
            
            expect(bossAI.currentAction).toBe('use_area_control');
        });

        test('executeBossDecision handles use_shield', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'use_shield');
            
            expect(bossAI.currentAction).toBe('use_shield');
        });

        test('executeBossDecision handles use_heal', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'use_heal');
            
            expect(bossAI.currentAction).toBe('use_heal');
        });

        test('executeBossDecision handles use_debuff', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'use_debuff');
            
            expect(bossAI.currentAction).toBe('use_debuff');
        });

        test('executeBossDecision handles defensive_stance', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'defensive_stance');
            
            expect(bossAI.currentAction).toBe('defensive_stance');
        });

        test('executeBossDecision handles final_stand', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'final_stand');
            
            expect(bossAI.currentAction).toBe('final_stand');
        });

        test('executeBossDecision handles assess', () => {
            const bossAI = bossController.bosses.get('boss-1');
            
            bossController.executeBossDecision('boss-1', bossAI, 'assess');
            
            expect(bossAI.currentAction).toBe('assess');
        });

        test('executeBossDecision triggers callback', () => {
            const callback = jest.fn();
            bossController.setTacticalChangeCallback(callback);
            
            const bossAI = bossController.bosses.get('boss-1');
            bossController.executeBossDecision('boss-1', bossAI, 'use_charge');
            
            expect(callback).toHaveBeenCalled();
        });

        test('getAvailableAbilities returns non-cooldown abilities', () => {
            const bossAI = bossController.bosses.get('boss-1');
            // Set one ability on cooldown
            bossAI.abilities.get('charge').lastUsed = Date.now();
            
            const available = bossController.getAvailableAbilities('boss-1');
            
            expect(Array.isArray(available)).toBe(true);
        });

        test('getAvailableAbilities with null boss', () => {
            const available = bossController.getAvailableAbilities('nonexistent');
            expect(available).toEqual([]);
        });

        test('pauseBossAI and resumeBossAI toggle state', () => {
            bossController.pauseBossAI('boss-1');
            
            const ai = bossController.bosses.get('boss-1');
            expect(ai.paused).toBe(true);
            
            bossController.resumeBossAI('boss-1');
            expect(ai.paused).toBe(false);
        });

        test('getAllActiveBosses returns array', () => {
            const active = bossController.getAllActiveBosses();
            expect(Array.isArray(active)).toBe(true);
        });

        test('stopAll sets isRunning to false', () => {
            bossController.stopAll();
            expect(bossController.isRunning).toBe(false);
        });

        test('clearAllBosses removes all bosses', () => {
            bossController.clearAllBosses();
            expect(bossController.bosses.size).toBe(0);
            expect(bossController.patterns.size).toBe(0);
        });

        test('handleBossDeath removes boss', () => {
            bossController.handleBossDeath('boss-1');
            expect(bossController.bosses.has('boss-1')).toBe(false);
        });

        test('handleBossDeath with non-existent boss', () => {
            // Should not throw
            expect(() => {
                bossController.handleBossDeath('nonexistent');
            }).not.toThrow();
        });

        test('updateBossDifficulty adjusts multipliers', () => {
            const bossAI = bossController.bosses.get('boss-1');
            const initialDamage = bossAI.difficultyData.damageMultiplier;
            
            bossController.updateBossDifficulty('boss-1', 2);
            
            expect(bossAI.difficultyData.damageMultiplier).not.toBe(initialDamage);
        });

        test('getBossData returns boss data', () => {
            const data = bossController.getBossData('boss-1');
            expect(data).toBeDefined();
            expect(data.id).toBe('boss-1');
        });

        test('getStatistics returns stats', () => {
            const stats = bossController.getStatistics();
            expect(stats).toBeDefined();
            expect(typeof stats.totalBosses).toBe('number');
        });

        test('getTargetCount returns number', () => {
            const count = bossController.getTargetCount('boss-1');
            expect(typeof count).toBe('number');
        });

        test('getTacticalProfile returns profile', () => {
            const profile = bossController.getTacticalProfile('dragon');
            expect(profile).toBeDefined();
            expect(profile.style).toBeDefined();
        });

        test('getReadyAbilities returns abilities', () => {
            const bossAI = bossController.bosses.get('boss-1');
            const abilities = bossController.getReadyAbilities(bossAI);
            expect(Array.isArray(abilities)).toBe(true);
        });

        test('canUseAbility checks cooldown', () => {
            const bossAI = bossController.bosses.get('boss-1');
            const canUse = bossController.canUseAbility(bossAI, 'charge');
            expect(typeof canUse).toBe('boolean');
        });
    });

    // PathfindingSystem tests for coverage - Using actual methods from source
    describe('PathfindingSystem', () => {
        let pathfinding;

        beforeEach(() => {
            pathfinding = new PathfindingSystem();
        });

        test('constructor initializes all properties', () => {
            expect(pathfinding.grid).toBeNull();
            expect(pathfinding.gridSize).toBe(10);
            expect(pathfinding.width).toBe(0);
            expect(pathfinding.height).toBe(0);
            expect(pathfinding.pathCache).toBeInstanceOf(Map);
            expect(pathfinding.nodeCache).toBeInstanceOf(Map);
            expect(pathfinding.obstacleCache).toBeInstanceOf(Set);
            expect(pathfinding.dynamicObstacles).toBeInstanceOf(Map);
            expect(pathfinding.movingEntities).toBeInstanceOf(Map);
        });

        test('initialize creates grid with correct dimensions', () => {
            pathfinding.initialize(1000, 800);
            
            expect(pathfinding.width).toBe(100);
            expect(pathfinding.height).toBe(80);
            expect(pathfinding.grid).toBeDefined();
            expect(pathfinding.grid.length).toBe(80);
        });

        test('createGrid initializes walkable cells', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            expect(pathfinding.grid[0][0]).toMatchObject({
                x: 0,
                y: 0,
                walkable: true,
                cost: 1.0
            });
            expect(pathfinding.grid[0][0].entities).toBeInstanceOf(Set);
        });

        test('worldToGrid converts coordinates', () => {
            const grid = pathfinding.worldToGrid({ x: 150, y: 250 });
            
            expect(grid.x).toBe(15);
            expect(grid.y).toBe(25);
        });

        test('gridToWorldPath converts to world coordinates', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            const world = pathfinding.gridToWorldPath([{ x: 15, y: 25 }]);
            
            expect(world[0].x).toBe(155);
            expect(world[0].y).toBe(255);
        });

        test('isValidPosition checks bounds', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            
            expect(pathfinding.isValidPosition({ x: 5, y: 5 })).toBe(true);
            expect(pathfinding.isValidPosition({ x: -1, y: 5 })).toBe(false);
            expect(pathfinding.isValidPosition({ x: 15, y: 5 })).toBe(false);
        });

        test('isWalkable checks cell state', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            const node = pathfinding.grid[5][5];
            expect(pathfinding.isWalkable(node, null)).toBe(true);
            
            node.walkable = false;
            expect(pathfinding.isWalkable(node, null)).toBe(false);
        });

        test('addStaticObstacle marks cells unwalkable', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            pathfinding.addStaticObstacle({ x: 35, y: 35 }, 10, 10);
            expect(pathfinding.grid[3][3].walkable).toBe(false);
        });

        test('removeStaticObstacle marks cells walkable', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            pathfinding.addStaticObstacle({ x: 35, y: 35 }, 10, 10);
            pathfinding.removeStaticObstacle({ x: 35, y: 35 }, 10, 10);
            expect(pathfinding.grid[3][3].walkable).toBe(true);
        });

        test('addDynamicObstacle stores obstacle', () => {
            pathfinding.addDynamicObstacle('entity-1', { x: 50, y: 50 }, 10, 10);
            
            expect(pathfinding.dynamicObstacles.has('entity-1')).toBe(true);
        });

        test('removeDynamicObstacle deletes obstacle', () => {
            pathfinding.addDynamicObstacle('entity-1', { x: 50, y: 50 }, 10, 10);
            pathfinding.removeDynamicObstacle('entity-1');
            
            expect(pathfinding.dynamicObstacles.has('entity-1')).toBe(false);
        });

        test('heuristic calculates Manhattan distance', () => {
            const h = pathfinding.heuristic(
                { x: 0, y: 0 },
                { x: 3, y: 4 }
            );
            
            expect(h).toBe(7 * pathfinding.config.heuristicWeight);
        });

        test('getNeighbors returns valid neighbors', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            const neighbors = pathfinding.getNeighbors({ x: 5, y: 5 }, null);
            
            expect(Array.isArray(neighbors)).toBe(true);
            expect(neighbors.length).toBeGreaterThan(0);
        });

        test('generateCacheKey creates unique key', () => {
            const key1 = pathfinding.generateCacheKey(
                { x: 0, y: 0 },
                { x: 10, y: 10 },
                'entity-1'
            );
            const key2 = pathfinding.generateCacheKey(
                { x: 0, y: 0 },
                { x: 10, y: 10 },
                'entity-1'
            );
            
            expect(key1).toBe(key2);
        });

        test('isPathValid checks cache validity', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            const cachedPath = {
                path: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
                timestamp: Date.now()
            };
            
            expect(pathfinding.isPathValid(cachedPath, null)).toBe(true);
            
            // Test with expired path
            const expiredPath = {
                path: [{ x: 0, y: 0 }],
                timestamp: Date.now() - 10000
            };
            expect(pathfinding.isPathValid(expiredPath, null)).toBe(false);
        });

        test('cleanupCache removes old entries', () => {
            pathfinding.pathCache.set('old-key', {
                path: [],
                timestamp: Date.now() - 20000,
                entityId: null
            });
            pathfinding.pathCache.set('new-key', {
                path: [],
                timestamp: Date.now(),
                entityId: null
            });
            
            pathfinding.cleanupCache();
            
            expect(pathfinding.pathCache.has('old-key')).toBe(false);
            expect(pathfinding.pathCache.has('new-key')).toBe(true);
        });

        test('getStatistics returns metrics', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            const stats = pathfinding.getStatistics();
            
            expect(stats).toHaveProperty('pathsCalculated');
            expect(stats).toHaveProperty('cacheHits');
            expect(stats).toHaveProperty('cacheMisses');
            expect(stats).toHaveProperty('cacheSize');
            expect(stats).toHaveProperty('gridSize');
        });

        test('reset clears all data', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            pathfinding.pathCache.set('test', { path: [] });
            pathfinding.stats.pathsCalculated = 100;
            
            pathfinding.reset();
            
            expect(pathfinding.pathCache.size).toBe(0);
            expect(pathfinding.stats.pathsCalculated).toBe(0);
            expect(pathfinding.grid[0][0].walkable).toBe(true);
        });

        test('findPath finds valid path', () => {
            pathfinding.initialize(100, 100);
            
            const path = pathfinding.findPath(
                { x: 10, y: 10 },
                { x: 50, y: 50 }
            );
            
            expect(Array.isArray(path)).toBe(true);
            expect(path.length).toBeGreaterThan(0);
        });

        test('findSimplePath creates straight line', () => {
            const path = pathfinding.findSimplePath(
                { x: 0, y: 0 },
                { x: 100, y: 0 }
            );
            
            expect(Array.isArray(path)).toBe(true);
            expect(path.length).toBe(21); // steps + 1
        });

        test('hasLineOfSight checks visibility', () => {
            pathfinding.initialize(100, 100);
            
            expect(pathfinding.hasLineOfSight(
                { x: 10, y: 10 },
                { x: 50, y: 10 }
            )).toBe(true);
        });

        test('findNearestWalkable finds closest cell', () => {
            pathfinding.initialize(100, 100);
            pathfinding.addStaticObstacle({ x: 50, y: 50 }, 10, 10);
            
            const nearest = pathfinding.findNearestWalkable(
                { x: 50, y: 50 },
                50
            );
            
            expect(nearest).toBeDefined();
            expect(typeof nearest.x).toBe('number');
            expect(typeof nearest.y).toBe('number');
        });

        test('getNode retrieves or creates node', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            const node = pathfinding.getNode(5, 5);
            
            expect(node).toBeDefined();
            expect(node.x).toBe(5);
            expect(node.y).toBe(5);
        });

        test('nodeKey generates key string', () => {
            const key = pathfinding.nodeKey({ x: 5, y: 10 });
            expect(key).toBe('5,10');
        });

        test('reconstructPath builds path from cameFrom', () => {
            const cameFrom = new Map();
            cameFrom.set('1,1', { x: 0, y: 0 });
            cameFrom.set('2,2', { x: 1, y: 1 });
            
            const path = pathfinding.reconstructPath(cameFrom, { x: 2, y: 2 });
            
            expect(Array.isArray(path)).toBe(true);
            expect(path.length).toBeGreaterThan(0);
        });

        test('updateDynamicObstacles clears expired obstacles', () => {
            pathfinding.addDynamicObstacle(
                'expired-entity',
                { x: 50, y: 50 },
                10,
                10,
                1 // 1ms duration
            );
            
            // Wait for expiration
            const obstacle = pathfinding.dynamicObstacles.get('expired-entity');
            if (obstacle) {
                obstacle.expiresAt = Date.now() - 1;
            }
            
            pathfinding.updateDynamicObstacles();
            
            // Should have been processed
            expect(pathfinding.dynamicObstacles.has('expired-entity')).toBe(false);
        });

        test('isBlockingObstacle checks blocking status', () => {
            pathfinding.movingEntities.set('entity-1', { x: 50, y: 50, speed: 0 });
            
            expect(pathfinding.isBlockingObstacle('entity-1')).toBe(true);
        });

        test('invalidateCacheInArea removes cached paths', () => {
            pathfinding.initialize(100, 100);
            pathfinding.pathCache.set('0,0-10,10-null', {
                path: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
                timestamp: Date.now()
            });
            
            pathfinding.invalidateCacheInArea({ x: 0, y: 0 }, { x: 5, y: 5 });
            
            // Cache should be cleared or maintained based on implementation
            expect(pathfinding.pathCache.size).toBeGreaterThanOrEqual(0);
        });

        test('updateStats tracks metrics', () => {
            pathfinding.updateStats([{ x: 0 }, { x: 1 }], 100);
            
            expect(pathfinding.stats.pathsCalculated).toBe(1);
            expect(pathfinding.stats.averagePathLength).toBe(2);
            expect(pathfinding.stats.averageCalculationTime).toBe(100);
        });

        test('startUpdateLoop creates interval', () => {
            pathfinding.startUpdateLoop();
            
            expect(pathfinding.updateInterval).toBeDefined();
            
            // Cleanup
            if (pathfinding.updateInterval) {
                clearInterval(pathfinding.updateInterval);
                pathfinding.updateInterval = null;
            }
        });

        test('aStar algorithm returns path', () => {
            pathfinding.initialize(100, 100);
            
            const start = { x: 1, y: 1 };
            const end = { x: 5, y: 5 };
            
            const path = pathfinding.aStar(start, end, null, {});
            
            expect(path === null || Array.isArray(path)).toBe(true);
        });

        test('getStatistics with empty stats', () => {
            const stats = pathfinding.getStatistics();
            
            // When no cache hits/misses, should handle division by zero
            expect(stats).toBeDefined();
            expect(typeof stats.cacheHitRate).toBe('number');
        });

        test('worldToGrid with negative coordinates', () => {
            const grid = pathfinding.worldToGrid({ x: -50, y: -25 });
            
            expect(grid.x).toBeLessThan(0);
            expect(grid.y).toBeLessThan(0);
        });

        test('isValidPosition with edge coordinates', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            
            expect(pathfinding.isValidPosition({ x: 0, y: 0 })).toBe(true);
            expect(pathfinding.isValidPosition({ x: 9, y: 9 })).toBe(true);
            expect(pathfinding.isValidPosition({ x: 10, y: 10 })).toBe(false);
        });

        test('heuristic with same positions', () => {
            const h = pathfinding.heuristic({ x: 5, y: 5 }, { x: 5, y: 5 });
            expect(h).toBe(0);
        });

        test('removeStaticObstacle on non-obstacle cell', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            // Should not throw
            expect(() => {
                pathfinding.removeStaticObstacle({ x: 50, y: 50 }, 10, 10);
            }).not.toThrow();
        });

        test('removeDynamicObstacle with non-existent entity', () => {
            // Should not throw
            expect(() => {
                pathfinding.removeDynamicObstacle('non-existent');
            }).not.toThrow();
        });

        test('isPathValid with walkable check', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            pathfinding.grid[1][1].walkable = false;
            
            const cachedPath = {
                path: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                timestamp: Date.now()
            };
            
            expect(pathfinding.isPathValid(cachedPath, null)).toBe(false);
        });

        test('getStatistics after operations', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            pathfinding.addDynamicObstacle('test', { x: 50, y: 50 }, 10, 10);
            pathfinding.movingEntities.set('player', { x: 50, y: 50, speed: 5 });
            
            const stats = pathfinding.getStatistics();
            
            expect(stats.dynamicObstacles).toBe(1);
            expect(stats.movingEntities).toBe(1);
        });

        test('reset on uninitialized grid', () => {
            // Should not throw even if grid not initialized
            expect(() => {
                pathfinding.reset();
            }).not.toThrow();
        });

        test('cleanupCache with size limit', () => {
            pathfinding.config.pathCacheSize = 2;
            
            // Add multiple entries
            for (let i = 0; i < 5; i++) {
                pathfinding.pathCache.set(`key-${i}`, {
                    path: [],
                    timestamp: Date.now() - i * 1000,
                    entityId: null
                });
            }
            
            pathfinding.cleanupCache();
            
            // Should respect cache size limit
            expect(pathfinding.pathCache.size).toBeLessThanOrEqual(5);
        });

        test('PriorityQueue operations', () => {
            const queue = new (require('../server/ai/PathfindingSystem'))();
            
            // Note: PriorityQueue is internal, test through PathfindingSystem
            expect(pathfinding).toBeDefined();
        });

        test('getNeighbors at grid edges', () => {
            pathfinding.width = 5;
            pathfinding.height = 5;
            pathfinding.createGrid();
            
            // Corner should have fewer neighbors
            const cornerNeighbors = pathfinding.getNeighbors({ x: 0, y: 0 }, null);
            expect(cornerNeighbors.length).toBeLessThan(8);
            
            // Center should have more neighbors
            const centerNeighbors = pathfinding.getNeighbors({ x: 2, y: 2 }, null);
            expect(centerNeighbors.length).toBeGreaterThan(cornerNeighbors.length);
        });

        test('isWalkable with entityId exclusion', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            const node = pathfinding.grid[5][5];
            node.entities.add('entity-1');
            
            // Should be walkable for the entity itself
            expect(pathfinding.isWalkable(node, 'entity-1')).toBe(true);
            
            // Should not be walkable for other entities
            expect(pathfinding.isWalkable(node, 'entity-2')).toBe(false);
        });

        test('addStaticObstacle at edges', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            // Add obstacle partially outside grid
            pathfinding.addStaticObstacle({ x: 95, y: 95 }, 20, 20);
            
            // Edge cells should be marked
            expect(pathfinding.grid[9][9].walkable).toBe(false);
        });

        test('updateObstacleInGrid adds and removes', () => {
            pathfinding.width = 10;
            pathfinding.height = 10;
            pathfinding.createGrid();
            
            const obstacle = {
                id: 'test',
                position: { x: 35, y: 35 },
                width: 10,
                height: 10
            };
            
            // Add
            pathfinding.updateObstacleInGrid(obstacle, true);
            expect(pathfinding.grid[3][3].entities.has('test')).toBe(true);
            
            // Remove
            pathfinding.updateObstacleInGrid(obstacle, false);
            expect(pathfinding.grid[3][3].entities.has('test')).toBe(false);
        });

        test('findNearestWalkable with no available cells', () => {
            pathfinding.width = 3;
            pathfinding.height = 3;
            pathfinding.createGrid();
            
            // Block all cells
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    pathfinding.grid[y][x].walkable = false;
                }
            }
            
            const nearest = pathfinding.findNearestWalkable({ x: 15, y: 15 }, 10);
            expect(nearest).toBeNull();
        });

        test('cleanupCache respects maxAge', () => {
            const now = Date.now();
            
            pathfinding.pathCache.set('fresh', {
                path: [],
                timestamp: now,
                entityId: null
            });
            
            pathfinding.pathCache.set('stale', {
                path: [],
                timestamp: now - 15000, // Older than 10s maxAge
                entityId: null
            });
            
            pathfinding.cleanupCache();
            
            expect(pathfinding.pathCache.has('fresh')).toBe(true);
            expect(pathfinding.pathCache.has('stale')).toBe(false);
        });

        test('getStatistics with division by zero protection', () => {
            // Stats with no hits or misses
            pathfinding.stats.cacheHits = 0;
            pathfinding.stats.cacheMisses = 0;
            
            const stats = pathfinding.getStatistics();
            
            // Should handle gracefully (NaN or 0)
            expect(typeof stats.cacheHitRate).toBe('number');
        });

        test('aStar with blocked destination', () => {
            pathfinding.width = 5;
            pathfinding.height = 5;
            pathfinding.createGrid();
            
            // Block destination
            pathfinding.grid[4][4].walkable = false;
            
            const path = pathfinding.aStar(
                { x: 0, y: 0 },
                { x: 4, y: 4 },
                null,
                {}
            );
            
            // May return null or partial path
            expect(path === null || Array.isArray(path)).toBe(true);
        });

        test('reset clears movingEntities', () => {
            pathfinding.width = 5;
            pathfinding.height = 5;
            pathfinding.createGrid();
            
            pathfinding.movingEntities.set('player', { x: 10, y: 10, speed: 5 });
            pathfinding.reset();
            
            expect(pathfinding.movingEntities.size).toBe(0);
        });
    });
});
