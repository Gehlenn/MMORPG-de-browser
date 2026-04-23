/**
 * Enhanced AI System - Final Coverage Tests
 * Additional tests to reach 95%+ coverage for remaining methods
 */

const AIMobController = require('../server/ai/AIMobController');
const PathfindingSystem = require('../server/ai/PathfindingSystem');
const AIBossController = require('../server/ai/AIBossController');

describe('Enhanced AI System - Final Coverage', () => {
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

    describe('PathfindingSystem - Remaining Methods', () => {
        test('should call onPathRecalculated callback', () => {
            const mockCallback = jest.fn();
            pathfindingSystem.onPathRecalculated = mockCallback;
            pathfindingSystem.triggerPathRecalculation('entity-1');
            expect(mockCallback).toHaveBeenCalledWith('entity-1');
        });

        test('should not throw when triggerPathRecalculated called without callback', () => {
            pathfindingSystem.onPathRecalculated = null;
            expect(() => {
                pathfindingSystem.triggerPathRecalculation('entity-1');
            }).not.toThrow();
        });

        test('should cleanup cache with old entries', () => {
            pathfindingSystem.initialize(200, 200);
            const start = { x: 1, y: 1 };
            const end = { x: 5, y: 5 };
            pathfindingSystem.findPath(start, end, 'entity-1');
            pathfindingSystem.pathCache.forEach((value, key) => {
                value.timestamp = Date.now() - 15000;
            });
            pathfindingSystem.cleanupCache();
            expect(pathfindingSystem.pathCache.size).toBe(0);
        });

        test('should limit cache size when too large', () => {
            pathfindingSystem.config.pathCacheSize = 2;
            pathfindingSystem.pathCache.set('key1', { path: [], timestamp: Date.now() - 1000 });
            pathfindingSystem.pathCache.set('key2', { path: [], timestamp: Date.now() - 2000 });
            pathfindingSystem.pathCache.set('key3', { path: [], timestamp: Date.now() - 3000 });
            pathfindingSystem.cleanupCache();
            expect(pathfindingSystem.pathCache.size).toBeLessThanOrEqual(2);
        });

        test('should return null for findNearestWalkable when no walkable position found', () => {
            pathfindingSystem.initialize(10, 10);
            for (let y = 0; y < 10; y++) {
                for (let x = 0; x < 10; x++) {
                    pathfindingSystem.grid[y][x].walkable = false;
                }
            }
            const result = pathfindingSystem.findNearestWalkable({ x: 5, y: 5 }, 5);
            expect(result).toBeNull();
        });

        test('should handle invalid entity in isWalkable', () => {
            const node = pathfindingSystem.grid[5][5];
            node.walkable = true;
            node.entities.add('entity-1');
            const isWalkable = pathfindingSystem.isWalkable(node, 'entity-1');
            expect(isWalkable).toBe(true);
        });

        test('should get neighbors with entity', () => {
            pathfindingSystem.grid[5][5].entities.add('entity-1');
            const neighbors = pathfindingSystem.getNeighbors({ x: 5, y: 5 }, 'entity-1');
            expect(Array.isArray(neighbors)).toBe(true);
        });

        test('should reconstruct path correctly', () => {
            const node1 = { x: 1, y: 1 };
            const node2 = { x: 2, y: 2 };
            const node3 = { x: 3, y: 3 };
            const cameFrom = new Map();
            cameFrom.set('2,2', node1);
            cameFrom.set('3,3', node2);
            const path = pathfindingSystem.reconstructPath(cameFrom, node3);
            expect(path).toContainEqual(node1);
            expect(path).toContainEqual(node2);
            expect(path).toContainEqual(node3);
        });

        test('should handle reconstruct path with missing entries', () => {
            const node1 = { x: 1, y: 1 };
            const cameFrom = new Map();
            const path = pathfindingSystem.reconstructPath(cameFrom, node1);
            expect(path).toContainEqual(node1);
        });

        test('should clear cache for area', () => {
            pathfindingSystem.initialize(200, 200);
            const start = { x: 1, y: 1 };
            const end = { x: 5, y: 5 };
            pathfindingSystem.findPath(start, end);
            pathfindingSystem.clearCacheForArea({ x: 0, y: 0 }, { x: 10, y: 10 });
            expect(pathfindingSystem.pathCache.size).toBe(0);
        });

        test('should handle nodeKey with various nodes', () => {
            const node1 = { x: 10, y: 20 };
            const key1 = pathfindingSystem.nodeKey(node1);
            expect(key1).toBe('10,20');
            const node2 = { x: -5, y: 0 };
            const key2 = pathfindingSystem.nodeKey(node2);
            expect(key2).toBe('-5,0');
        });

        test('should return correct stats after multiple operations', () => {
            pathfindingSystem.initialize(200, 200);
            pathfindingSystem.findPath({ x: 1, y: 1 }, { x: 5, y: 5 });
            pathfindingSystem.findPath({ x: 1, y: 1 }, { x: 5, y: 5 });
            const stats = pathfindingSystem.getStatistics();
            expect(stats.pathsCalculated).toBeGreaterThanOrEqual(1);
            expect(stats).toHaveProperty('cacheHitRate');
            expect(stats).toHaveProperty('cacheSize');
            expect(stats).toHaveProperty('dynamicObstacles');
            expect(stats).toHaveProperty('movingEntities');
        });

        test('should handle updateStats with null path', () => {
            pathfindingSystem.updateStats(null, 100);
            expect(pathfindingSystem.stats.pathsCalculated).toBe(1);
        });
    });

    describe('AIBossController - Remaining Methods', () => {
        test('should initialize boss AI', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.initialize();
            expect(aiBossController.isRunning).toBe(true);
        });

        test('should setup ability patterns', () => {
            aiBossController.setupAbilityPatterns();
            expect(aiBossController.abilityPatterns).toBeDefined();
            expect(aiBossController.abilityPatterns.berserk).toBeDefined();
            expect(aiBossController.abilityPatterns.cleave).toBeDefined();
        });

        test('should add target to boss', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.addTarget('test_boss', 'player_1');
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(bossAI.targets).toContain('player_1');
        });

        test('should remove target from boss', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.addTarget('test_boss', 'player_1');
            aiBossController.removeTarget('test_boss', 'player_1');
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(bossAI.targets).not.toContain('player_1');
        });

        test('should get all targets', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.addTarget('test_boss', 'player_1');
            aiBossController.addTarget('test_boss', 'player_2');
            const targets = aiBossController.getAllTargets('test_boss');
            expect(targets).toContain('player_1');
            expect(targets).toContain('player_2');
        });

        test('should get boss health percentage', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 },
                stats: { hp: 50, maxHp: 100 }
            };
            aiBossController.addBoss(bossData);
            const healthPercent = aiBossController.getBossHealthPercent('test_boss');
            expect(healthPercent).toBe(50);
        });

        test('should determine current phase based on health', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 },
                stats: { hp: 100, maxHp: 100 }
            };
            aiBossController.addBoss(bossData);
            const phase = aiBossController.determineCurrentPhase('test_boss');
            expect(typeof phase).toBe('number');
        });

        test('should handle boss death', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.handleBossDeath('test_boss');
            expect(aiBossController.bosses.has('test_boss')).toBe(false);
        });

        test('should emit tactical change event', () => {
            const mockCallback = jest.fn();
            aiBossController.onTacticalChange = mockCallback;
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.changeTactic('test_boss', 'defensive');
            expect(mockCallback).toHaveBeenCalled();
        });

        test('should get ability cooldown', () => {
            aiBossController.setupAbilityPatterns();
            const cooldown = aiBossController.getAbilityCooldown('cleave');
            expect(typeof cooldown).toBe('number');
        });

        test('should set ability cooldown', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.setAbilityCooldown('test_boss', 'cleave');
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(bossAI.abilityCooldowns.get('cleave')).toBeDefined();
        });

        test('should check if ability is on cooldown', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.setAbilityCooldown('test_boss', 'cleave');
            const isOnCooldown = aiBossController.isAbilityOnCooldown('test_boss', 'cleave');
            expect(typeof isOnCooldown).toBe('boolean');
        });

        test('should reset ability cooldowns', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.setAbilityCooldown('test_boss', 'cleave');
            aiBossController.resetAbilityCooldowns('test_boss');
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(bossAI.abilityCooldowns.size).toBe(0);
        });

        test('should get minion count', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const count = aiBossController.getMinionCount('test_boss');
            expect(typeof count).toBe('number');
        });

        test('should add and remove minion', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.addMinion('test_boss', 'minion-1');
            expect(aiBossController.getMinionCount('test_boss')).toBe(1);
            aiBossController.removeMinion('test_boss', 'minion-1');
            expect(aiBossController.getMinionCount('test_boss')).toBe(0);
        });

        test('should get environmental interactions', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const interactions = aiBossController.getEnvironmentalInteractions('test_boss');
            expect(Array.isArray(interactions)).toBe(true);
        });

        test('should use environmental object', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const result = aiBossController.useEnvironmentalObject('test_boss', 'object-1');
            expect(typeof result).toBe('boolean');
        });

        test('should calculate optimal position', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const position = aiBossController.calculateOptimalPosition('test_boss');
            expect(position).toBeDefined();
            expect(position).toHaveProperty('x');
            expect(position).toHaveProperty('y');
        });

        test('should get recommended ability', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.addTarget('test_boss', 'player_1');
            const ability = aiBossController.getRecommendedAbility('test_boss');
            expect(typeof ability).toBe('string');
        });

        test('should get boss status', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 },
                stats: { hp: 75, maxHp: 100 }
            };
            aiBossController.addBoss(bossData);
            const status = aiBossController.getBossStatus('test_boss');
            expect(status).toBeDefined();
            expect(status).toHaveProperty('health');
            expect(status).toHaveProperty('phase');
            expect(status).toHaveProperty('targets');
        });
    });

    describe('AIMobController - Remaining Methods', () => {
        test('should get all mobs', () => {
            const mobData1 = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            const mobData2 = {
                id: 'test_mob_2',
                type: 'wolf',
                position: { x: 150, y: 150 },
                stats: { hp: 60, maxHp: 60 }
            };
            aiMobController.addMob(mobData1);
            aiMobController.addMob(mobData2);
            const allMobs = aiMobController.getAllMobs();
            expect(allMobs).toHaveLength(2);
        });

        test('should get mobs by type', () => {
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
            const goblins = aiMobController.getMobsByType('goblin');
            expect(goblins).toHaveLength(2);
        });

        test('should clear all mobs', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.clearAllMobs();
            expect(aiMobController.mobs.size).toBe(0);
        });

        test('should set mob position', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.setMobPosition('test_mob_1', { x: 200, y: 200 });
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.position.x).toBe(200);
            expect(aiData.position.y).toBe(200);
        });

        test('should get mob position', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const position = aiMobController.getMobPosition('test_mob_1');
            expect(position.x).toBe(100);
            expect(position.y).toBe(100);
        });

        test('should set mob health', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.setMobHealth('test_mob_1', 30);
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.stats.hp).toBe(30);
        });

        test('should damage mob', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.damageMob('test_mob_1', 20);
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.stats.hp).toBe(30);
        });

        test('should heal mob', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 30, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.healMob('test_mob_1', 10);
            const aiData = aiMobController.mobs.get('test_mob_1');
            expect(aiData.stats.hp).toBe(40);
        });

        test('should get mob health percent', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 25, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const healthPercent = aiMobController.getMobHealthPercent('test_mob_1');
            expect(healthPercent).toBe(50);
        });

        test('should check if mob is alive', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            expect(aiMobController.isMobAlive('test_mob_1')).toBe(true);
            aiMobController.damageMob('test_mob_1', 50);
            expect(aiMobController.isMobAlive('test_mob_1')).toBe(false);
        });

        test('should get mob behavior type', () => {
            const mobData = {
                id: 'test_mob_1',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const behaviorType = aiMobController.getMobBehaviorType('test_mob_1');
            expect(behaviorType).toBe('pack');
        });

        test('should get mob type from profile', () => {
            const type = aiMobController.getMobTypeFromProfile('aggressive');
            expect(type).toBeDefined();
        });
    });
});
