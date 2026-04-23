/**
 * Enhanced AI System Test Suite - Simplified (Corrigido)
 * Testes básicos que funcionam com as implementações reais
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const AIMobController = require('../server/ai/AIMobController.js');
const PathfindingSystem = require('../server/ai/PathfindingSystem.js');
const AIBossController = require('../server/ai/AIBossController.js');

describe('Enhanced AI System', () => {
    let aiMobController;
    let pathfindingSystem;
    let aiBossController;

    beforeEach(() => {
        aiMobController = new AIMobController();
        pathfindingSystem = new PathfindingSystem();
        aiBossController = new AIBossController();
    });

    afterEach(() => {
        if (aiMobController) aiMobController.stop();
        if (pathfindingSystem) pathfindingSystem.reset();
        if (aiBossController) aiBossController.stop();
    });

    describe('AIMobController - Core', () => {
        test('should initialize with correct properties', () => {
            expect(aiMobController.mobs).toBeInstanceOf(Map);
            expect(aiMobController.behaviors).toBeInstanceOf(Map);
            expect(aiMobController.stateMachines).toBeInstanceOf(Map);
            expect(aiMobController.memorySystem).toBeInstanceOf(Map);
        });

        test('should setup behavior profiles', () => {
            aiMobController.setupBehaviorProfiles();
            expect(aiMobController.behaviors.has('aggressive')).toBe(true);
            expect(aiMobController.behaviors.has('defensive')).toBe(true);
            expect(aiMobController.behaviors.has('passive')).toBe(true);
        });

        test('should add and remove mob', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            expect(aiMobController.mobs.has('test_mob_1')).toBe(true);
            aiMobController.removeMob('test_mob_1');
            expect(aiMobController.mobs.has('test_mob_1')).toBe(false);
        });

        test('should create state machine with correct structure', () => {
            const profile = { personality: 'aggressive', aggressionLevel: 0.8 };
            const stateMachine = aiMobController.createStateMachine('test_mob', profile);
            expect(stateMachine.currentState).toBe('idle');
            expect(stateMachine.previousState).toBeNull();
            expect(stateMachine.states).toBeInstanceOf(Map);
        });

        test('should create memory system with correct structure', () => {
            const memory = aiMobController.createMemory('test_mob');
            expect(memory.shortTerm.threats).toBeInstanceOf(Map);
            expect(memory.shortTerm.nearbyAllies).toBeInstanceOf(Array);
            expect(memory.longTerm.playerPatterns).toBeInstanceOf(Map);
            expect(memory.longTerm.successfulHunts).toBe(0);
            expect(memory.longTerm.fleeCount).toBe(0);
        });

        test('should transition state correctly', () => {
            const mobData = {
                id: 'state_test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('state_test_mob', 'patrol');
            const aiData = aiMobController.mobs.get('state_test_mob');
            expect(aiData.stateMachine.currentState).toBe('patrol');
        });

        test('should get statistics', () => {
            const stats = aiMobController.getStatistics();
            expect(stats).toHaveProperty('totalMobs');
            expect(stats).toHaveProperty('activeStates');
            expect(stats).toHaveProperty('memoryCount');
            expect(typeof stats.totalMobs).toBe('number');
        });

        test('should setup decision trees', () => {
            aiMobController.setupDecisionTrees();
            expect(aiMobController.decisionTrees.has('general')).toBe(true);
        });

        test('should evaluate decision tree', () => {
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
            expect(typeof decision).toBe('string');
            expect(decision).toBeTruthy();
        });

        test('should get mob profile', () => {
            aiMobController.setupBehaviorProfiles();
            const profile = aiMobController.getMobProfile('goblin');
            expect(profile).toBeDefined();
            expect(profile.personality).toBeDefined();
        });

        test('should handle getMobData', () => {
            const mobData = {
                id: 'data_test_mob',
                type: 'orc',
                position: { x: 200, y: 200 },
                stats: { hp: 100, maxHp: 100 }
            };
            aiMobController.addMob(mobData);
            const retrieved = aiMobController.getMobData('data_test_mob');
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe('data_test_mob');
        });
    });

    describe('AIMobController - State Methods', () => {
        test('should handle enterIdle and updateIdle', () => {
            const mobData = {
                id: 'idle_test_mob',
                type: 'slime',
                position: { x: 100, y: 100 },
                stats: { hp: 30, maxHp: 30 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterIdle('idle_test_mob');
            aiMobController.updateIdle('idle_test_mob');
            const aiData = aiMobController.mobs.get('idle_test_mob');
            expect(aiData).toBeDefined();
        });

        test('should handle enterPatrol', () => {
            const mobData = {
                id: 'patrol_test_mob',
                type: 'wolf',
                position: { x: 100, y: 100 },
                stats: { hp: 40, maxHp: 40 },
                spawnPoint: { x: 100, y: 100 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterPatrol('patrol_test_mob');
            const aiData = aiMobController.mobs.get('patrol_test_mob');
            expect(aiData.patrolTarget).toBeDefined();
        });

        test('should handle enterChase', () => {
            const mobData = {
                id: 'chase_test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.mobs.get('chase_test_mob').currentTarget = { id: 'player1', position: { x: 150, y: 150 } };
            aiMobController.enterChase('chase_test_mob');
            const aiData = aiMobController.mobs.get('chase_test_mob');
            expect(aiData.chaseStartTime).toBeDefined();
        });

        test('should handle enterAttack', () => {
            const mobData = {
                id: 'attack_test_mob',
                type: 'orc',
                position: { x: 100, y: 100 },
                stats: { hp: 80, maxHp: 80 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterAttack('attack_test_mob');
            const aiData = aiMobController.mobs.get('attack_test_mob');
            expect(aiData.attackCooldown).toBeDefined();
        });

        test('should handle enterFlee', () => {
            const mobData = {
                id: 'flee_test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 10, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.mobs.get('flee_test_mob').currentTarget = { position: { x: 150, y: 150 } };
            aiMobController.enterFlee('flee_test_mob');
            const aiData = aiMobController.mobs.get('flee_test_mob');
            expect(aiData.fleeTarget).toBeDefined();
        });
    });

    describe('PathfindingSystem', () => {
        test('should initialize with correct grid size', () => {
            pathfindingSystem.initialize(100, 100);
            expect(pathfindingSystem.gridWidth).toBeGreaterThan(0);
            expect(pathfindingSystem.gridHeight).toBeGreaterThan(0);
        });

        test('should convert world to grid coordinates', () => {
            pathfindingSystem.initialize(1000, 1000);
            const gridPos = pathfindingSystem.worldToGrid({ x: 50, y: 50 });
            expect(gridPos).toHaveProperty('x');
            expect(gridPos).toHaveProperty('y');
            expect(typeof gridPos.x).toBe('number');
            expect(typeof gridPos.y).toBe('number');
        });

        test('should validate positions', () => {
            pathfindingSystem.initialize(100, 100);
            expect(pathfindingSystem.isValidPosition({ x: 50, y: 50 })).toBe(true);
            expect(pathfindingSystem.isValidPosition({ x: -10, y: 50 })).toBe(false);
        });

        test('should add and remove static obstacles', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.addStaticObstacle({ x: 50, y: 50 }, 10, 10);
            expect(pathfindingSystem.staticObstacles.length).toBeGreaterThan(0);
            pathfindingSystem.removeStaticObstacle({ x: 50, y: 50 }, 10, 10);
        });

        test('should add and remove dynamic obstacles', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.addDynamicObstacle('mob1', { x: 50, y: 50 }, 10, 10, 5000);
            expect(pathfindingSystem.dynamicObstacles.has('mob1')).toBe(true);
            pathfindingSystem.removeDynamicObstacle('mob1');
            expect(pathfindingSystem.dynamicObstacles.has('mob1')).toBe(false);
        });

        test('should calculate heuristic', () => {
            const h = pathfindingSystem.heuristic({ x: 0, y: 0 }, { x: 10, y: 10 });
            expect(typeof h).toBe('number');
            expect(h).toBeGreaterThanOrEqual(0);
        });

        test('should find simple path', () => {
            pathfindingSystem.initialize(100, 100);
            const start = { x: 10, y: 10 };
            const end = { x: 20, y: 20 };
            const path = pathfindingSystem.findSimplePath(start, end);
            expect(Array.isArray(path)).toBe(true);
        });

        test('should check line of sight', () => {
            pathfindingSystem.initialize(100, 100);
            const start = { x: 10, y: 10 };
            const end = { x: 20, y: 10 };
            const hasLos = pathfindingSystem.hasLineOfSight(start, end, 'test_entity');
            expect(typeof hasLos).toBe('boolean');
        });

        test('should find nearest walkable position', () => {
            pathfindingSystem.initialize(100, 100);
            const nearest = pathfindingSystem.findNearestWalkable({ x: 50, y: 50 }, 20);
            expect(nearest).toBeDefined();
            expect(nearest).toHaveProperty('x');
            expect(nearest).toHaveProperty('y');
        });

        test('should get node by coordinates', () => {
            pathfindingSystem.initialize(100, 100);
            const node = pathfindingSystem.getNode(5, 5);
            expect(node).toBeDefined();
            expect(node).toHaveProperty('x', 5);
            expect(node).toHaveProperty('y', 5);
        });

        test('should get neighbors of a node', () => {
            pathfindingSystem.initialize(100, 100);
            const node = pathfindingSystem.getNode(5, 5);
            const neighbors = pathfindingSystem.getNeighbors(node, 'test_entity');
            expect(Array.isArray(neighbors)).toBe(true);
            expect(neighbors.length).toBeGreaterThan(0);
        });

        test('should get statistics', () => {
            const stats = pathfindingSystem.getStatistics();
            expect(stats).toHaveProperty('totalRequests');
            expect(stats).toHaveProperty('cacheHitRate');
            expect(typeof stats.totalRequests).toBe('number');
        });
    });

    describe('AIBossController', () => {
        test('should initialize with correct properties', () => {
            expect(aiBossController.bosses).toBeInstanceOf(Map);
            expect(aiBossController.tactics).toBeInstanceOf(Map);
            expect(typeof aiBossController.abilityPatterns).toBe('object');
        });

        test('should setup tactical profiles', () => {
            aiBossController.setupTacticalProfiles();
            expect(aiBossController.tactics.has('aggressive')).toBe(true);
            expect(aiBossController.tactics.has('defensive')).toBe(true);
        });

        test('should setup ability patterns', () => {
            aiBossController.setupAbilityPatterns();
            expect(Object.keys(aiBossController.abilityPatterns).length).toBeGreaterThan(0);
        });

        test('should add and remove boss', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'test_boss_1',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            expect(aiBossController.bosses.has('test_boss_1')).toBe(true);
            aiBossController.removeBoss('test_boss_1');
            expect(aiBossController.bosses.has('test_boss_1')).toBe(false);
        });

        test('should get tactical profile', () => {
            aiBossController.setupTacticalProfiles();
            const profile = aiBossController.getTacticalProfile('dragon');
            expect(profile).toBeDefined();
            expect(profile).toHaveProperty('aggression');
        });

        test('should evaluate direct assault tactic', () => {
            aiBossController.setupTacticalProfiles();
            const context = {
                bossHealth: 80,
                playerHealth: 60,
                distance: 50,
                abilitiesReady: true
            };
            const result = aiBossController.evaluateDirectAssault(context);
            expect(typeof result).toBe('string');
        });

        test('should update boss AI', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'update_test_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.updateBossAI('update_test_boss');
            const boss = aiBossController.bosses.get('update_test_boss');
            expect(boss).toBeDefined();
        });

        test('should record player pattern', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'pattern_test_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            const action = { type: 'attack', damage: 50 };
            aiBossController.recordPlayerPattern('pattern_test_boss', 'player1', action);
            const boss = aiBossController.bosses.get('pattern_test_boss');
            expect(boss.playerPatterns.has('player1')).toBe(true);
        });

        test('should adapt to player patterns', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'adapt_test_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.adaptToPlayerPatterns('adapt_test_boss');
            const boss = aiBossController.bosses.get('adapt_test_boss');
            expect(boss).toBeDefined();
        });

        test('should use ability', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'ability_test_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.useAbility('ability_test_boss', 'fire_breath');
            const boss = aiBossController.bosses.get('ability_test_boss');
            expect(boss.abilitiesUsed).toBeDefined();
        });

        test('should get statistics', () => {
            const stats = aiBossController.getStatistics();
            expect(stats).toHaveProperty('totalBosses');
            expect(stats).toHaveProperty('tactics');
            expect(typeof stats.totalBosses).toBe('number');
        });
    });
});
