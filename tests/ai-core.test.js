/**
 * AI Core Tests - v3 (Arquivo Novo)
 * Testes funcionais para AIMobController, PathfindingSystem e AIBossController
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const AIMobController = require('../server/ai/AIMobController.js');
const PathfindingSystem = require('../server/ai/PathfindingSystem.js');
const AIBossController = require('../server/ai/AIBossController.js');

describe('AI Core Tests', () => {
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
        test('should initialize with correct properties', () => {
            expect(aiMobController.mobs).toBeInstanceOf(Map);
            expect(aiMobController.behaviors).toBeInstanceOf(Map);
            expect(aiMobController.stateMachines).toBeInstanceOf(Map);
        });

        test('should setup behavior profiles', () => {
            aiMobController.setupBehaviorProfiles();
            expect(aiMobController.behaviors.has('aggressive')).toBe(true);
            expect(aiMobController.behaviors.has('defensive')).toBe(true);
        });

        test('should add and remove mob', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            expect(aiMobController.mobs.has('test_mob')).toBe(true);
            aiMobController.removeMob('test_mob');
            expect(aiMobController.mobs.has('test_mob')).toBe(false);
        });

        test('should transition state', () => {
            const mobData = {
                id: 'state_test',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('state_test', 'patrol');
            const aiData = aiMobController.mobs.get('state_test');
            expect(aiData.stateMachine.currentState).toBe('patrol');
        });

        test('should get statistics', () => {
            const stats = aiMobController.getStatistics();
            expect(stats).toHaveProperty('totalMobs');
            expect(typeof stats.totalMobs).toBe('number');
        });

        test('should evaluate decision tree', () => {
            aiMobController.setupDecisionTrees();
            const context = { has_target: true, target_in_range: true };
            const decision = aiMobController.evaluateDecisionTree('general', context);
            expect(typeof decision).toBe('string');
        });
    });

    describe('PathfindingSystem', () => {
        test('should initialize grid', () => {
            pathfindingSystem.initialize(100, 100);
            expect(pathfindingSystem.grid).toBeDefined();
        });

        test('should convert world to grid', () => {
            pathfindingSystem.initialize(1000, 1000);
            const gridPos = pathfindingSystem.worldToGrid({ x: 50, y: 50 });
            expect(gridPos).toHaveProperty('x');
            expect(gridPos).toHaveProperty('y');
        });

        test('should validate positions', () => {
            pathfindingSystem.initialize(1000, 1000);
            const result = pathfindingSystem.isValidPosition({ x: 500, y: 500 });
            expect(typeof result).toBe('boolean');
        });

        test('should find simple path', () => {
            pathfindingSystem.initialize(100, 100);
            const path = pathfindingSystem.findSimplePath({ x: 10, y: 10 }, { x: 20, y: 20 });
            expect(Array.isArray(path)).toBe(true);
        });

        test('should check line of sight', () => {
            pathfindingSystem.initialize(100, 100);
            const hasLos = pathfindingSystem.hasLineOfSight({ x: 10, y: 10 }, { x: 20, y: 10 }, 'test');
            expect(typeof hasLos).toBe('boolean');
        });

        test('should get statistics', () => {
            const stats = pathfindingSystem.getStatistics();
            expect(stats).toBeDefined();
            expect(typeof stats).toBe('object');
        });
    });

    describe('AIBossController', () => {
        test('should initialize correctly', () => {
            expect(aiBossController.bosses).toBeInstanceOf(Map);
            expect(aiBossController.tactics).toBeInstanceOf(Map);
            // abilityPatterns é undefined até setupAbilityPatterns ser chamado
            expect(aiBossController.abilityPatterns).toBeUndefined();
        });

        test('should setup tactical profiles', () => {
            aiBossController.setupTacticalProfiles();
            expect(aiBossController.tactics.has('aggressive')).toBe(true);
        });

        test('should setup ability patterns', () => {
            aiBossController.setupAbilityPatterns();
            expect(Object.keys(aiBossController.abilityPatterns).length).toBeGreaterThan(0);
        });

        test('should add and remove boss', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'boss_test',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            expect(aiBossController.bosses.has('boss_test')).toBe(true);
            aiBossController.removeBoss('boss_test');
            expect(aiBossController.bosses.has('boss_test')).toBe(false);
        });

        test('should get tactical profile', () => {
            aiBossController.setupTacticalProfiles();
            const profile = aiBossController.getTacticalProfile('dragon');
            expect(profile).toBeDefined();
            expect(profile).toHaveProperty('aggression');
        });

        test('should evaluate direct assault', () => {
            aiBossController.setupTacticalProfiles();
            const context = { bossHealth: 80, playerHealth: 60, distance: 50, abilitiesReady: true };
            const result = aiBossController.evaluateDirectAssault(context);
            expect(typeof result).toBe('string');
        });

        test('should update boss', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = { id: 'update_boss', type: 'dragon', position: { x: 500, y: 500 }, stats: { hp: 1000, maxHp: 1000 } };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('update_boss');
            aiBossController.updateBoss('update_boss', bossAI);
            expect(aiBossController.bosses.get('update_boss')).toBeDefined();
        });

        test('should create pattern memory', () => {
            const patternMemory = aiBossController.createPatternMemory('test_boss');
            expect(patternMemory).toBeDefined();
            expect(patternMemory.playerPatterns).toBeInstanceOf(Map);
        });


        test('should get statistics', () => {
            const stats = aiBossController.getStatistics();
            expect(stats).toHaveProperty('totalBosses');
            expect(stats).toHaveProperty('tactics');
        });
    });
});
