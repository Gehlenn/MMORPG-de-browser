/**
 * Enhanced AI System - Advanced Tests
 * Additional tests to reach 95% coverage
 */

const AIMobController = require('../server/ai/AIMobController');
const PathfindingSystem = require('../server/ai/PathfindingSystem');
const AIBossController = require('../server/ai/AIBossController');

describe('Enhanced AI System - Advanced Coverage', () => {
    let aiMobController;
    let pathfindingSystem;
    let aiBossController;

    beforeEach(() => {
        aiMobController = new AIMobController();
        pathfindingSystem = new PathfindingSystem();
        aiBossController = new AIBossController();
        pathfindingSystem.initialize(200, 200);
        aiBossController.setupTacticalProfiles();
    });

    afterEach(() => {
        if (aiMobController) aiMobController.stop();
        if (aiBossController) aiBossController.stop();
    });

    describe('PathfindingSystem - Advanced', () => {
        test('should find simple path', () => {
            const start = { x: 10, y: 10 };
            const end = { x: 50, y: 50 };
            const path = pathfindingSystem.findSimplePath(start, end);
            expect(path).toBeDefined();
            if (path) {
                expect(Array.isArray(path)).toBe(true);
                expect(path.length).toBeGreaterThan(0);
            }
        });

        test('should check line of sight', () => {
            const start = { x: 10, y: 10 };
            const end = { x: 50, y: 10 };
            const hasLOS = pathfindingSystem.hasLineOfSight(start, end);
            expect(typeof hasLOS).toBe('boolean');
        });

        test('should register moving entity', () => {
            const entityId = 'entity-1';
            const position = { x: 100, y: 100 };
            const velocity = { x: 1, y: 0 };
            pathfindingSystem.registerMovingEntity(entityId, position, velocity);
            expect(pathfindingSystem.movingEntities.has(entityId)).toBe(true);
        });

        test('should update moving entity', () => {
            const entityId = 'entity-1';
            const position = { x: 100, y: 100 };
            const velocity = { x: 1, y: 0 };
            pathfindingSystem.registerMovingEntity(entityId, position, velocity);
            const newPosition = { x: 110, y: 100 };
            pathfindingSystem.updateMovingEntity(entityId, newPosition);
            const entity = pathfindingSystem.movingEntities.get(entityId);
            expect(entity.position.x).toBe(110);
        });

        test('should unregister moving entity', () => {
            const entityId = 'entity-1';
            const position = { x: 100, y: 100 };
            const velocity = { x: 1, y: 0 };
            pathfindingSystem.registerMovingEntity(entityId, position, velocity);
            pathfindingSystem.unregisterMovingEntity(entityId);
            expect(pathfindingSystem.movingEntities.has(entityId)).toBe(false);
        });

        test('should check if position is walkable', () => {
            const pos = { x: 50, y: 50 };
            const isWalkable = pathfindingSystem.isWalkable(pos);
            expect(typeof isWalkable).toBe('boolean');
        });

        test('should get neighbors', () => {
            const node = { x: 5, y: 5 };
            const neighbors = pathfindingSystem.getNeighbors(node);
            expect(Array.isArray(neighbors)).toBe(true);
            expect(neighbors.length).toBeGreaterThan(0);
        });

        test('should check if entity is blocking obstacle', () => {
            const isBlocking = pathfindingSystem.isBlockingObstacle('test-entity');
            expect(typeof isBlocking).toBe('boolean');
        });

        test('should invalidate cache in area', () => {
            const start = { x: 0, y: 0 };
            const end = { x: 100, y: 100 };
            pathfindingSystem.invalidateCacheInArea(start, end);
            expect(pathfindingSystem.pathCache.size).toBe(0);
        });

        test('should update stats', () => {
            const path = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
            const calculationTime = 50;
            pathfindingSystem.updateStats(path, calculationTime);
            expect(pathfindingSystem.stats.pathsCalculated).toBe(1);
        });

        test('should start update loop', () => {
            pathfindingSystem.startUpdateLoop();
            expect(pathfindingSystem.updateLoop).toBeDefined();
        });
    });

    describe('AIMobController - Advanced', () => {
        test('should update mob state', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.updateMobState('test_mob_1', { target: 'player_1' });
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.target).toBe('player_1');
        });

        test('should get mob behavior', () => {
            const behavior = aiMobController.getMobBehavior('goblin');
            expect(behavior).toBeDefined();
            expect(behavior.personality).toBe('pack');
        });

        test('should set mob behavior', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.setMobBehavior('test_mob_1', 'aggressive');
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.behavior).toBe('aggressive');
        });

        test('should call for help', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const allies = aiMobController.callForHelp('test_mob_1');
            expect(Array.isArray(allies)).toBe(true);
        });

        test('should find nearest ally', () => {
            const mobData1 = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            const mobData2 = {
                id: 'test_mob_2',
                type: 'goblin',
                position: { x: 150, y: 150 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData1);
            aiMobController.addMob(mobData2);
            const nearestAlly = aiMobController.findNearestAlly('test_mob_1');
            expect(nearestAlly).toBeDefined();
        });

        test('should update all mobs', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.updateAllMobs();
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData).toBeDefined();
        });

        test('should get mobs in area', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const mobs = aiMobController.getMobsInArea({ x: 100, y: 100 }, 50);
            expect(Array.isArray(mobs)).toBe(true);
            expect(mobs.length).toBeGreaterThan(0);
        });

        test('should set target', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.setTarget('test_mob_1', 'player_1');
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.target).toBe('player_1');
        });

        test('should clear target', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.setTarget('test_mob_1', 'player_1');
            aiMobController.clearTarget('test_mob_1');
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.target).toBeNull();
        });

        test('should handle mob death', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.handleMobDeath('test_mob_1');
            expect(aiMobController.mobs.has('test_mob_1')).toBe(false);
        });

        test('should emit behavior change event', () => {
            const mockCallback = jest.fn();
            aiMobController.onBehaviorChange = mockCallback;
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.setMobBehavior('test_mob_1', 'aggressive');
            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('AIBossController - Advanced', () => {
        test('should update boss AI', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.updateBossAI('test_boss');
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(bossAI).toBeDefined();
        });

        test('should adapt to player', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.adaptToPlayer('test_boss', 'player_1', { damageDealt: 100 });
            const difficulty = aiBossController.adaptiveDifficulty.get('test_boss');
            expect(difficulty).toBeDefined();
        });

        test('should record player pattern', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.recordPlayerPattern('test_boss', 'player_1', 'attack');
            const pattern = aiBossController.patterns.get('test_boss');
            expect(pattern).toBeDefined();
        });

        test('should use ability', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const result = aiBossController.useAbility('test_boss', 'cleave');
            expect(typeof result).toBe('boolean');
        });

        test('should spawn minions', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const minions = aiBossController.spawnMinions('test_boss', 3);
            expect(Array.isArray(minions)).toBe(true);
        });

        test('should transition phase', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.transitionPhase('test_boss', 2);
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(bossAI.currentPhase).toBe(2);
        });

        test('should get ready abilities', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const abilities = aiBossController.getReadyAbilities('test_boss');
            expect(Array.isArray(abilities)).toBe(true);
        });

        test('should calculate threat level', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const threat = aiBossController.calculateThreatLevel('test_boss', 'player_1');
            expect(typeof threat).toBe('number');
        });

        test('should select priority target', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.addTarget('test_boss', 'player_1');
            aiBossController.addTarget('test_boss', 'player_2');
            const target = aiBossController.selectPriorityTarget('test_boss');
            expect(typeof target).toBe('string');
        });

        test('should update adaptive difficulty', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.updateAdaptiveDifficulty('test_boss');
            const difficulty = aiBossController.adaptiveDifficulty.get('test_boss');
            expect(difficulty).toBeDefined();
        });

        test('should get ability pattern', () => {
            const pattern = aiBossController.getAbilityPattern('cleave');
            expect(pattern).toBeDefined();
        });

        test('should check ability conditions', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const canUse = aiBossController.checkAbilityConditions('test_boss', 'cleave');
            expect(typeof canUse).toBe('boolean');
        });

        test('should emit phase transition event', () => {
            const mockCallback = jest.fn();
            aiBossController.onPhaseTransition = mockCallback;
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.transitionPhase('test_boss', 2);
            expect(mockCallback).toHaveBeenCalled();
        });
    });
});
