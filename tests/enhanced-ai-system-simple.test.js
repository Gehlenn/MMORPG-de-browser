/**
 * Enhanced AI System Test Suite - Simplified
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

    describe('AIMobController', () => {
        test('should initialize correctly', () => {
            expect(aiMobController.mobs).toBeInstanceOf(Map);
            expect(aiMobController.behaviors).toBeInstanceOf(Map);
        });

        test('should setup behavior profiles', () => {
            aiMobController.setupBehaviorProfiles();
            expect(aiMobController.behaviors.has('aggressive')).toBe(true);
            expect(aiMobController.behaviors.has('defensive')).toBe(true);
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

        test('should create state machine', () => {
            const profile = aiMobController.behaviors.get('aggressive') || { personality: 'aggressive' };
            const stateMachine = aiMobController.createStateMachine('test_mob', profile);
            expect(stateMachine.currentState).toBe('idle');
            expect(stateMachine.states).toBeDefined();
        });

        test('should create memory system', () => {
            const memory = aiMobController.createMemory('test_mob');
            expect(memory.shortTerm.threats).toBeInstanceOf(Map);
            expect(memory.longTerm.playerPatterns).toBeInstanceOf(Map);
            expect(memory.longTerm.successfulHunts).toBe(0);
        });

        test('should transition state', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('test_mob_1', 'patrol');
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.stateMachine.currentState).toBe('patrol');
        });

        test('should get statistics', () => {
            const stats = aiMobController.getStatistics();
            expect(stats).toHaveProperty('totalMobs');
            expect(stats).toHaveProperty('activeStates');
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
        });

        test('should generate patrol target', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const target = aiMobController.generatePatrolTarget('test_mob_1');
            expect(target).toBeDefined();
            expect(typeof target.x).toBe('number');
            expect(typeof target.y).toBe('number');
        });

        test('should update memory', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.updateMemory('test_mob_1', 'threat', {
                id: 'player_1',
                lastSeen: Date.now(),
                position: { x: 150, y: 150 }
            });
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.memory.shortTerm.threats.has('player_1')).toBe(true);
        });

        test('should detect threats', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const threats = aiMobController.detectThreats('test_mob_1');
            expect(Array.isArray(threats)).toBe(true);
        });

        test('should calculate distance', () => {
            const pos1 = { x: 0, y: 0 };
            const pos2 = { x: 3, y: 4 };
            const distance = aiMobController.calculateDistance(pos1, pos2);
            expect(distance).toBe(5);
        });

        test('should get mob data', () => {
            const mobData = aiMobController.getMobData('test_mob_1');
            expect(mobData).toBeDefined();
            expect(mobData.id).toBe('test_mob_1');
        });

        test('should stop controller', () => {
            aiMobController.stop();
            expect(aiMobController.isRunning).toBe(false);
        });
    });

    describe('PathfindingSystem', () => {
        test('should initialize', () => {
            pathfindingSystem.initialize(200, 200);
            expect(pathfindingSystem.grid).toBeDefined();
            expect(pathfindingSystem.width).toBe(20);
            expect(pathfindingSystem.height).toBe(20);
        });

        test('should convert world to grid coordinates', () => {
            pathfindingSystem.initialize(200, 200);
            const gridPos = pathfindingSystem.worldToGrid({ x: 50, y: 75 });
            expect(gridPos.x).toBe(5);
            expect(gridPos.y).toBe(7);
        });

        test('should find path', () => {
            pathfindingSystem.initialize(200, 200);
            const start = { x: 20, y: 20 };
            const end = { x: 100, y: 100 };
            const path = pathfindingSystem.findPath(start, end);
            expect(path).toBeDefined();
            expect(path.length).toBeGreaterThan(0);
        });

        test('should handle obstacles', () => {
            pathfindingSystem.initialize(200, 200);
            pathfindingSystem.addStaticObstacle({ x: 50, y: 50 }, 20, 20);
            const isWalkable = pathfindingSystem.isWalkable({ x: 5, y: 5 });
            expect(typeof isWalkable).toBe('boolean');
        });

        test('should get statistics', () => {
            const stats = pathfindingSystem.getStatistics();
            expect(stats).toHaveProperty('gridSize');
        });

        test('should reset caches', () => {
            pathfindingSystem.initialize(200, 200);
            pathfindingSystem.addStaticObstacle({ x: 50, y: 50 }, 20, 20);
            pathfindingSystem.reset();
            expect(pathfindingSystem.pathCache.size).toBe(0);
            expect(pathfindingSystem.nodeCache.size).toBe(0);
            expect(pathfindingSystem.obstacleCache.size).toBe(0);
        });
    });

    describe('AIBossController', () => {
        beforeEach(() => {
            aiBossController.setupTacticalProfiles();
        });

        test('should initialize', () => {
            expect(aiBossController.bosses).toBeInstanceOf(Map);
            expect(aiBossController.patterns).toBeInstanceOf(Map);
        });

        test('should setup tactical profiles', () => {
            expect(aiBossController.tactics.has('aggressive')).toBe(true);
            expect(aiBossController.tactics.has('defensive')).toBe(true);
        });

        test('should add and remove boss', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            expect(aiBossController.bosses.has('test_boss')).toBe(true);
            aiBossController.removeBoss('test_boss');
            expect(aiBossController.bosses.has('test_boss')).toBe(false);
        });

        test('should get boss data', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const data = aiBossController.getBossData('test_boss');
            expect(data).toBeDefined();
            expect(data.id).toBe('test_boss');
        });

        test('should get statistics', () => {
            const stats = aiBossController.getStatistics();
            expect(stats).toHaveProperty('totalBosses');
        });

        test('should get target count', () => {
            const count = aiBossController.getTargetCount('test_boss');
            expect(typeof count).toBe('number');
        });

        test('should create pattern memory', () => {
            const memory = aiBossController.createPatternMemory('test_boss');
            expect(memory.playerPatterns).toBeInstanceOf(Map);
            expect(memory.successfulAttacks).toBeInstanceOf(Array);
        });

        test('should create difficulty data', () => {
            const difficulty = aiBossController.createDifficultyData('test_boss');
            expect(difficulty).toHaveProperty('playerSkillLevel');
            expect(difficulty).toHaveProperty('damageMultiplier');
        });

    });

    test('should add and remove boss', () => {
        const bossData = {
            id: 'test_boss',
            name: 'Dragon Lord',
            type: 'dragon',
            position: { x: 400, y: 300 }
        };
        aiBossController.addBoss(bossData);
        expect(aiBossController.bosses.has('test_boss')).toBe(true);
        aiBossController.removeBoss('test_boss');
        expect(aiBossController.bosses.has('test_boss')).toBe(false);
    });

    test('should get boss data', () => {
        const bossData = {
            id: 'test_boss',
            name: 'Dragon Lord',
            type: 'dragon',
            position: { x: 400, y: 300 }
        };
        aiBossController.addBoss(bossData);
        const data = aiBossController.getBossData('test_boss');
        expect(data).toBeDefined();
        expect(data.id).toBe('test_boss');
    });

    test('should get statistics', () => {
        const stats = aiBossController.getStatistics();
        expect(stats).toHaveProperty('totalBosses');
    });

    test('should get target count', () => {
        const count = aiBossController.getTargetCount('test_boss');
        expect(typeof count).toBe('number');
    });

    test('should create pattern memory', () => {
        const memory = aiBossController.createPatternMemory('test_boss');
        expect(memory.playerPatterns).toBeInstanceOf(Map);
        expect(memory.successfulAttacks).toBeInstanceOf(Array);
    });

    test('should create difficulty data', () => {
        const difficulty = aiBossController.createDifficultyData('test_boss');
        expect(difficulty).toHaveProperty('playerSkillLevel');
        expect(difficulty).toHaveProperty('damageMultiplier');
    });

    test('should get tactical profile', () => {
        const profile = aiBossController.getTacticalProfile('dragon');
        expect(profile).toBeDefined();
    });

    test('should get target count with multiple targets', () => {
        const bossData = {
            id: 'test_boss',
            name: 'Dragon Lord',
            type: 'dragon',
            position: { x: 400, y: 300 }
        };
        aiBossController.addBoss(bossData);
        aiBossController.addTarget('test_boss', 'player_1');
        aiBossController.addTarget('test_boss', 'player_2');
        const count = aiBossController.getTargetCount('test_boss');
        expect(count).toBe(2);
    });

    test('should initialize boss AI', () => {
        const bossData = {
            id: 'test_boss_init',
            name: 'Dragon Lord',
            type: 'dragon',
            position: { x: 400, y: 300 }
        };
        aiBossController.addBoss(bossData);
        const bossAI = aiBossController.bosses.get('test_boss_init');
        expect(bossAI).toBeDefined();
        expect(bossAI.id).toBe('test_boss_init');
    });

    test('should update boss target', () => {
        const bossData = {
            id: 'test_boss_target',
            name: 'Dragon Lord',
            type: 'dragon',
            position: { x: 400, y: 300 }
        };
        aiBossController.addBoss(bossData);
        aiBossController.updateBossTarget('test_boss_target', { x: 500, y: 500 });
        const bossAI = aiBossController.bosses.get('test_boss_target');
        expect(bossAI.target).toBeDefined();
    });

    test('should handle boss death', () => {
        const bossData = {
            id: 'test_boss_death',
            name: 'Dragon Lord',
            type: 'dragon',
            position: { x: 400, y: 300 }
        };
        aiBossController.addBoss(bossData);
        aiBossController.handleBossDeath('test_boss_death');
        expect(aiBossController.bosses.has('test_boss_death')).toBe(false);
    });
});
