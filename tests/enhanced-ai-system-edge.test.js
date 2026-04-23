/**
 * Enhanced AI System - Edge Cases Tests
 * Tests for edge cases, error handling, and boundary conditions
 */

const AIMobController = require('../server/ai/AIMobController');
const PathfindingSystem = require('../server/ai/PathfindingSystem');
const AIBossController = require('../server/ai/AIBossController');

describe('Enhanced AI System - Edge Cases', () => {
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
        if (aiBossController) aiBossController.stop();
    });

    describe('PathfindingSystem - Edge Cases', () => {
        test('should handle findPath with same start and end position', () => {
            pathfindingSystem.initialize(100, 100);
            const start = { x: 50, y: 50 };
            const end = { x: 50, y: 50 };
            const path = pathfindingSystem.findPath(start, end);
            expect(path).toBeDefined();
        });

        test('should handle findPath with out of bounds positions', () => {
            pathfindingSystem.initialize(100, 100);
            const start = { x: -10, y: -10 };
            const end = { x: 200, y: 200 };
            const path = pathfindingSystem.findPath(start, end);
            expect(path).toBeNull();
        });

        test('should handle findPath with blocked destination', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.addStaticObstacle({ x: 80, y: 80 }, 20, 20);
            const start = { x: 10, y: 10 };
            const end = { x: 80, y: 80 };
            const path = pathfindingSystem.findPath(start, end);
            expect(path).toBeNull();
        });

        test('should handle aStar with max iterations reached', () => {
            pathfindingSystem.initialize(10, 10);
            pathfindingSystem.config.maxPathLength = 5;
            const start = { x: 0, y: 0 };
            const end = { x: 9, y: 9 };
            const path = pathfindingSystem.aStar(start, end, null, {});
            expect(path).toBeNull();
        });

        test('should handle getNode with out of bounds coordinates', () => {
            pathfindingSystem.initialize(10, 10);
            expect(() => {
                pathfindingSystem.getNode(-1, 0);
            }).toThrow();
            expect(() => {
                pathfindingSystem.getNode(0, -1);
            }).toThrow();
        });

        test('should handle worldToGrid with negative coordinates', () => {
            const result = pathfindingSystem.worldToGrid({ x: -5, y: -5 });
            expect(result.x).toBeLessThan(0);
            expect(result.y).toBeLessThan(0);
        });

        test('should handle gridToWorldPath with empty array', () => {
            const result = pathfindingSystem.gridToWorldPath([]);
            expect(result).toEqual([]);
        });

        test('should handle isPathValid with expired timestamp', () => {
            pathfindingSystem.initialize(100, 100);
            const start = { x: 1, y: 1 };
            const end = { x: 5, y: 5 };
            pathfindingSystem.findPath(start, end);
            const [key, cachedPath] = pathfindingSystem.pathCache.entries().next().value;
            cachedPath.timestamp = Date.now() - 6000;
            const isValid = pathfindingSystem.isPathValid(cachedPath, null);
            expect(isValid).toBe(false);
        });

        test('should handle dynamic obstacle expiration', (done) => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.addDynamicObstacle('temp-entity', { x: 50, y: 50 }, 10, 10, 50);
            expect(pathfindingSystem.dynamicObstacles.has('temp-entity')).toBe(true);
            setTimeout(() => {
                pathfindingSystem.updateDynamicObstacles();
                expect(pathfindingSystem.dynamicObstacles.has('temp-entity')).toBe(false);
                done();
            }, 60);
        });

        test('should handle isWalkable with null node', () => {
            const result = pathfindingSystem.isWalkable(null, 'entity-1');
            expect(result).toBe(false);
        });

        test('should handle PriorityQueue with empty dequeue', () => {
            const pq = pathfindingSystem.PriorityQueue || require('../server/ai/PathfindingSystem').PriorityQueue;
            const queue = new pq();
            expect(() => {
                queue.dequeue();
            }).toThrow();
        });

        test('should handle PriorityQueue contains with non-existent element', () => {
            const pq = pathfindingSystem.PriorityQueue || require('../server/ai/PathfindingSystem').PriorityQueue;
            const queue = new pq();
            queue.enqueue({ id: 1 }, 5);
            const contains = queue.contains({ id: 2 });
            expect(contains).toBe(false);
        });

        test('should handle generateCacheKey without entityId', () => {
            const start = { x: 1, y: 1 };
            const end = { x: 5, y: 5 };
            const key = pathfindingSystem.generateCacheKey(start, end, null);
            expect(key).toContain('global');
        });

        test('should handle cleanupCache with empty cache', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.cleanupCache();
            expect(pathfindingSystem.pathCache.size).toBe(0);
        });

        test('should handle clearCacheForArea with no matching paths', () => {
            pathfindingSystem.initialize(100, 100);
            const start = { x: 1, y: 1 };
            const end = { x: 5, y: 5 };
            pathfindingSystem.findPath(start, end);
            pathfindingSystem.clearCacheForArea({ x: 50, y: 50 }, { x: 60, y: 60 });
            expect(pathfindingSystem.pathCache.size).toBe(1);
        });

        test('should handle updateStats with zero calculation time', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.updateStats([{ x: 0, y: 0 }], 0);
            expect(pathfindingSystem.stats.averageCalculationTime).toBe(0);
        });

        test('should handle reset on uninitialized system', () => {
            expect(() => {
                pathfindingSystem.reset();
            }).not.toThrow();
        });

        test('should handle removeStaticObstacle on non-existent obstacle', () => {
            pathfindingSystem.initialize(100, 100);
            expect(() => {
                pathfindingSystem.removeStaticObstacle({ x: 1000, y: 1000 }, 10, 10);
            }).not.toThrow();
        });

        test('should handle addStaticObstacle with zero dimensions', () => {
            pathfindingSystem.initialize(100, 100);
            expect(() => {
                pathfindingSystem.addStaticObstacle({ x: 50, y: 50 }, 0, 0);
            }).not.toThrow();
        });

        test('should handle findNearestWalkable starting from blocked position', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.addStaticObstacle({ x: 50, y: 50 }, 20, 20);
            const result = pathfindingSystem.findNearestWalkable({ x: 50, y: 50 }, 50);
            expect(result).toBeDefined();
        });

        test('should handle hasLineOfSight with obstacle in path', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.addStaticObstacle({ x: 50, y: 5 }, 10, 10);
            const start = { x: 10, y: 10 };
            const end = { x: 90, y: 10 };
            const hasLOS = pathfindingSystem.hasLineOfSight(start, end);
            expect(typeof hasLOS).toBe('boolean');
        });

        test('should handle getNeighbors at edge of grid', () => {
            pathfindingSystem.initialize(10, 10);
            const neighbors = pathfindingSystem.getNeighbors({ x: 0, y: 0 }, null);
            expect(neighbors.length).toBeLessThan(8);
        });

        test('should handle heuristic with same positions', () => {
            const pos = { x: 5, y: 5 };
            const h = pathfindingSystem.heuristic(pos, pos);
            expect(h).toBe(0);
        });

        test('should handle updateMovingEntity with non-existent entity', () => {
            pathfindingSystem.initialize(100, 100);
            expect(() => {
                pathfindingSystem.updateMovingEntity('non-existent', { x: 50, y: 50 });
            }).not.toThrow();
        });

        test('should handle registerMovingEntity with duplicate registration', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.registerMovingEntity('entity-1', { x: 10, y: 10 }, 5, 5);
            pathfindingSystem.registerMovingEntity('entity-1', { x: 20, y: 20 }, 5, 5);
            expect(pathfindingSystem.movingEntities.get('entity-1').position.x).toBe(20);
        });
    });

    describe('AIMobController - Edge Cases', () => {
        test('should handle addMob with null mobData', () => {
            expect(() => {
                aiMobController.addMob(null);
            }).toThrow();
        });

        test('should handle addMob with missing required fields', () => {
            expect(() => {
                aiMobController.addMob({ id: 'test' });
            }).toThrow();
        });

        test('should handle removeMob with non-existent mobId', () => {
            const result = aiMobController.removeMob('non-existent');
            expect(result).toBe(true);
        });

        test('should handle getMobProfile with unknown mob type', () => {
            const profile = aiMobController.getMobProfile('unknown_type');
            expect(profile).toBeDefined();
            expect(profile.personality).toBe('aggressive');
        });

        test('should handle evaluateDecisionTree with unknown tree name', () => {
            const result = aiMobController.evaluateDecisionTree('unknown_tree', {});
            expect(result).toBe('idle');
        });

        test('should handle evaluateNode with unknown node type', () => {
            const node = { type: 'unknown' };
            const result = aiMobController.evaluateNode(node, {});
            expect(result).toBe('idle');
        });

        test('should handle evaluateCondition with unknown condition', () => {
            const result = aiMobController.evaluateCondition('unknown_condition', {});
            expect(result).toBe(false);
        });

        test('should handle executeDecision with unknown decision', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            expect(() => {
                aiMobController.executeDecision('test_mob', aiMobController.mobs.get('test_mob'), 'unknown_decision');
            }).not.toThrow();
        });

        test('should handle transitionState with non-existent mob', () => {
            expect(() => {
                aiMobController.transitionState('non-existent', 'attack');
            }).not.toThrow();
        });

        test('should handle transitionState with same state', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const initialChanges = aiMobController.mobs.get('test_mob').stats.stateChanges;
            aiMobController.transitionState('test_mob', 'idle');
            const finalChanges = aiMobController.mobs.get('test_mob').stats.stateChanges;
            expect(finalChanges).toBe(initialChanges);
        });

        test('should handle updateMob with null aiData', () => {
            expect(() => {
                aiMobController.updateMob('non-existent', null);
            }).not.toThrow();
        });

        test('should handle makeDecision with missing tree', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.decisionTrees.delete('general');
            const aiData = aiMobController.mobs.get('test_mob');
            const result = aiMobController.makeDecision('test_mob', aiData);
            expect(result).toBe('idle');
        });

        test('should handle detectThreats with no server/players', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.server = null;
            const threats = aiMobController.detectThreats('test_mob');
            expect(threats).toEqual([]);
        });

        test('should handle isTargetInRange with null target', () => {
            const result = aiMobController.isTargetInRange('test_mob', null);
            expect(result).toBe(false);
        });

        test('should handle calculateDistance with same positions', () => {
            const pos = { x: 100, y: 100 };
            const distance = aiMobController.calculateDistance(pos, pos);
            expect(distance).toBe(0);
        });

        test('should handle updateMemory with invalid type', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            expect(() => {
                aiMobController.updateMemory('test_mob', 'invalid_type', {});
            }).not.toThrow();
        });

        test('should handle cleanupMemory with no memory', () => {
            expect(() => {
                aiMobController.cleanupMemory('non-existent');
            }).not.toThrow();
        });

        test('should handle getMobData with fallback', () => {
            global.mobSpawner = null;
            const data = aiMobController.getMobData('test_mob');
            expect(data).toBeDefined();
            expect(data.position).toBeDefined();
        });

        test('should handle getPlayerPosition with no server', () => {
            aiMobController.server = null;
            const pos = aiMobController.getPlayerPosition('player-1');
            expect(pos).toBeDefined();
        });

        test('should handle getNearbyMobs with no mobSpawner', () => {
            global.mobSpawner = null;
            const mobs = aiMobController.getNearbyMobs('test_mob', 100);
            expect(mobs).toEqual([]);
        });

        test('should handle callForHelp with no mobs', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            global.mobSpawner = null;
            expect(() => {
                aiMobController.callForHelp('test_mob');
            }).not.toThrow();
        });

        test('should handle performAttack with no server', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.server = null;
            expect(() => {
                aiMobController.performAttack('test_mob', 'player-1');
            }).not.toThrow();
        });

        test('should handle moveTowards with null target', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.server = null;
            expect(() => {
                aiMobController.moveTowards('test_mob', null);
            }).not.toThrow();
        });

        test('should handle updateIdle with null aiData', () => {
            expect(() => {
                aiMobController.updateIdle('non-existent');
            }).not.toThrow();
        });

        test('should handle state methods with non-existent mob', () => {
            expect(() => {
                aiMobController.enterIdle('non-existent');
                aiMobController.updateIdle('non-existent');
                aiMobController.exitIdle('non-existent');
                aiMobController.enterPatrol('non-existent');
                aiMobController.updatePatrol('non-existent');
                aiMobController.exitPatrol('non-existent');
                aiMobController.enterChase('non-existent');
                aiMobController.updateChase('non-existent');
                aiMobController.exitChase('non-existent');
                aiMobController.enterAttack('non-existent');
                aiMobController.updateAttack('non-existent');
                aiMobController.exitAttack('non-existent');
                aiMobController.enterFlee('non-existent');
                aiMobController.updateFlee('non-existent');
                aiMobController.exitFlee('non-existent');
            }).not.toThrow();
        });

        test('should handle getStatistics with no mobs', () => {
            const stats = aiMobController.getStatistics();
            expect(stats.totalMobs).toBe(0);
        });

        test('should handle stop when not running', () => {
            aiMobController.isRunning = false;
            expect(() => {
                aiMobController.stop();
            }).not.toThrow();
        });

        test('should handle generatePatrolTarget with null position', () => {
            global.mobSpawner = null;
            const target = aiMobController.generatePatrolTarget('non-existent');
            expect(target).toBeDefined();
            expect(target.x).toBeDefined();
            expect(target.y).toBeDefined();
        });

        test('should handle generateFleeTarget with null position', () => {
            global.mobSpawner = null;
            const target = aiMobController.generateFleeTarget('non-existent');
            expect(target).toBeDefined();
        });

        test('should handle findHidePosition with null position', () => {
            global.mobSpawner = null;
            const pos = aiMobController.findHidePosition('non-existent');
            expect(pos).toBeDefined();
        });
    });

    describe('AIBossController - Edge Cases', () => {
        test('should handle addBoss with null data', () => {
            expect(() => {
                aiBossController.addBoss(null);
            }).toThrow();
        });

        test('should handle removeBoss with non-existent boss', () => {
            const result = aiBossController.removeBoss('non-existent');
            expect(result).toBe(false);
        });

        test('should handle getBossData with fallback', () => {
            const data = aiBossController.getBossData('non-existent');
            expect(data).toBeDefined();
            expect(data.currentHp).toBeDefined();
        });

        test('should handle getTacticalProfile with unknown type', () => {
            aiBossController.setupTacticalProfiles();
            const profile = aiBossController.getTacticalProfile('unknown');
            expect(profile).toBeDefined();
        });

        test('should handle createPatternMemory with existing memory', () => {
            aiBossController.patterns.set('test_boss', {
                playerPatterns: new Map(),
                successfulAttacks: [],
                phaseHistory: []
            });
            const memory = aiBossController.createPatternMemory('test_boss');
            expect(memory).toBeDefined();
        });

        test('should handle createDifficultyData with existing data', () => {
            aiBossController.adaptiveDifficulty.set('test_boss', {
                playerSkillLevel: 0.5,
                damageMultiplier: 1.0
            });
            const data = aiBossController.createDifficultyData('test_boss');
            expect(data).toBeDefined();
        });

        test('should handle getTargetCount with no targets', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const count = aiBossController.getTargetCount('test_boss');
            expect(typeof count).toBe('number');
        });

        test('should handle updateBossAI with non-existent boss', () => {
            expect(() => {
                aiBossController.updateBossAI('non-existent');
            }).not.toThrow();
        });

        test('should handle evaluateTacticalSituation with null context', () => {
            const result = aiBossController.evaluateTacticalSituation(null);
            expect(result).toBeDefined();
        });

        test('should handle canUseAbility with null bossAI', () => {
            const result = aiBossController.canUseAbility({ boss_id: 'non-existent' }, 'cleave');
            expect(result).toBe(false);
        });

        test('should handle canUseAbility with unknown ability', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const result = aiBossController.canUseAbility({ boss_id: 'test_boss' }, 'unknown_ability');
            expect(result).toBe(false);
        });

        test('should handle checkAbilityConditions with null conditions', () => {
            const result = aiBossController.checkAbilityConditions({}, null);
            expect(result).toBe(true);
        });

        test('should handle checkAbilityConditions with unknown condition', () => {
            const result = aiBossController.checkAbilityConditions({}, { unknown: true });
            expect(result).toBe(true);
        });

        test('should handle executeBossDecision with unknown decision', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(() => {
                aiBossController.executeBossDecision('test_boss', bossAI, 'unknown_decision');
            }).not.toThrow();
        });

        test('should handle executeAbility with null ability', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(() => {
                aiBossController.executeAbility('test_boss', bossAI, 'non_existent_ability');
            }).not.toThrow();
        });

        test('should handle executeSummonMinions with on cooldown', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.abilities.get('summon').lastUsed = Date.now();
            bossAI.abilities.get('summon').cooldown = 10000;
            expect(() => {
                aiBossController.executeSummonMinions('test_boss', bossAI);
            }).not.toThrow();
        });

        test('should handle checkPhaseTransition with phase 3 already', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 },
                stats: { hp: 1, maxHp: 100 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.currentPhase = 3;
            aiBossController.checkPhaseTransition('test_boss', bossAI);
            expect(bossAI.currentPhase).toBe(3);
        });

        test('should handle transitionPhase with no phase config', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.tacticalProfile.phases[4] = null;
            expect(() => {
                aiBossController.transitionPhase('test_boss', bossAI, 4);
            }).not.toThrow();
        });

        test('should handle updateAdaptiveDifficulty with recent adjustment', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.difficultyData.lastAdjustment = Date.now();
            aiBossController.updateAdaptiveDifficulty('test_boss', bossAI);
            expect(bossAI.difficultyData.adjustmentHistory.length).toBe(0);
        });

        test('should handle calculateDifficultyAdjustment with no attacks', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.patternMemory.successfulAttacks = [];
            const adjustment = aiBossController.calculateDifficultyAdjustment('test_boss', bossAI);
            expect(typeof adjustment).toBe('number');
        });

        test('should handle getReadyAbilities with all on cooldown', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.abilities.forEach(ability => {
                ability.lastUsed = Date.now();
                ability.cooldown = 10000;
            });
            const ready = aiBossController.getReadyAbilities(bossAI);
            expect(ready).toEqual([]);
        });

        test('should handle getStatistics with no bosses', () => {
            const stats = aiBossController.getStatistics();
            expect(stats.totalBosses).toBe(0);
        });

        test('should handle stop when not running', () => {
            aiBossController.isRunning = false;
            expect(() => {
                aiBossController.stop();
            }).not.toThrow();
        });

        test('should handle setupTacticalProfiles with existing profiles', () => {
            aiBossController.setupTacticalProfiles();
            aiBossController.setupTacticalProfiles();
            expect(aiBossController.tactics.has('aggressive')).toBe(true);
        });

        test('should handle setupAbilityPatterns with existing patterns', () => {
            aiBossController.setupAbilityPatterns();
            aiBossController.setupAbilityPatterns();
            expect(aiBossController.abilityPatterns.berserk).toBeDefined();
        });
    });
});
