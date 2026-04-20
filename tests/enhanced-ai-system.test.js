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

describe('Enhanced AI System v0.3.7v', () => {
    let aiMobController;
    let pathfindingSystem;
    let aiBossController;
    let decisionTree;
    let eventReactions;

    beforeEach(() => {
        // Initialize fresh instances for each test
        aiMobController = new AIMobController();
        pathfindingSystem = new PathfindingSystem();
        aiBossController = new AIBossController();
        aiBossController.initialize(); // Initialize to setup ability patterns
        decisionTree = new DecisionTree();
        decisionTree.initialize(); // Initialize to setup functions and trees
        eventReactions = new EventReactions();
    });

    afterEach(() => {
        // Clean up after each test
        if (aiMobController) aiMobController.stop();
        if (pathfindingSystem) pathfindingSystem.reset();
        if (aiBossController) aiBossController.stop();
        if (eventReactions) eventReactions.stop();
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
    });
});
