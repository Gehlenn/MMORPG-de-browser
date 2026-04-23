/**
 * AI Complete Test Suite
 * Testes abrangentes para todos os módulos de IA
 * AIMobController, PathfindingSystem, AIBossController
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const AIMobController = require('../server/ai/AIMobController.js');
const PathfindingSystem = require('../server/ai/PathfindingSystem.js');
const AIBossController = require('../server/ai/AIBossController.js');

describe('AI Complete Test Suite', () => {
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
        });

        test('should setup behavior profiles', () => {
            aiMobController.setupBehaviorProfiles();
            expect(aiMobController.behaviors.has('aggressive')).toBe(true);
            expect(aiMobController.behaviors.has('defensive')).toBe(true);
        });

        test('should setup decision trees', () => {
            aiMobController.setupDecisionTrees();
            expect(aiMobController.decisionTrees.has('general')).toBe(true);
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

        test('should get mob profile', () => {
            aiMobController.setupBehaviorProfiles();
            const mobData = {
                id: 'profile_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const profile = aiMobController.getMobProfile('profile_mob');
            expect(profile).toBeDefined();
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

        test('should update mob state', () => {
            const mobData = {
                id: 'update_test',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.updateMob('update_test', { hp: 40 });
            const aiData = aiMobController.mobs.get('update_test');
            expect(aiData.stats.hp).toBe(40);
        });

        test('should get all mobs', () => {
            const mobs = aiMobController.getAllMobs();
            expect(Array.isArray(mobs)).toBe(true);
        });

        test('should make decision', () => {
            const mobData = {
                id: 'decision_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const decision = aiMobController.makeDecision('decision_mob');
            expect(typeof decision).toBe('string');
        });

        test('should evaluate decision tree', () => {
            aiMobController.setupDecisionTrees();
            const context = { has_target: true, target_in_range: true };
            const decision = aiMobController.evaluateDecisionTree('general', context);
            expect(typeof decision).toBe('string');
        });

        test('should get statistics', () => {
            const stats = aiMobController.getStatistics();
            expect(stats).toHaveProperty('totalMobs');
            expect(typeof stats.totalMobs).toBe('number');
        });
    });

    describe('AIMobController - State Machine', () => {
        test('should handle idle state', () => {
            const mobData = {
                id: 'idle_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('idle_mob', 'idle');
            const aiData = aiMobController.mobs.get('idle_mob');
            expect(aiData.stateMachine.currentState).toBe('idle');
        });

        test('should handle patrol state', () => {
            const mobData = {
                id: 'patrol_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('patrol_mob', 'patrol');
            const aiData = aiMobController.mobs.get('patrol_mob');
            expect(aiData.stateMachine.currentState).toBe('patrol');
        });

        test('should handle chase state', () => {
            const mobData = {
                id: 'chase_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('chase_mob', 'chase');
            const aiData = aiMobController.mobs.get('chase_mob');
            expect(aiData.stateMachine.currentState).toBe('chase');
        });

        test('should handle attack state', () => {
            const mobData = {
                id: 'attack_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('attack_mob', 'attack');
            const aiData = aiMobController.mobs.get('attack_mob');
            expect(aiData.stateMachine.currentState).toBe('attack');
        });

        test('should detect threat', () => {
            const mobData = {
                id: 'threat_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const hasThreat = aiMobController.detectThreat('threat_mob', { x: 150, y: 150 });
            expect(typeof hasThreat).toBe('boolean');
        });
    });

    describe('PathfindingSystem - Core', () => {
        test('should initialize grid', () => {
            pathfindingSystem.initialize(100, 100);
            expect(pathfindingSystem.grid).toBeDefined();
        });

        test('should create grid', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.createGrid();
            expect(pathfindingSystem.grid).toBeDefined();
        });

        test('should convert world to grid', () => {
            pathfindingSystem.initialize(1000, 1000);
            const gridPos = pathfindingSystem.worldToGrid({ x: 50, y: 50 });
            expect(gridPos).toHaveProperty('x');
            expect(gridPos).toHaveProperty('y');
        });

        test('should convert grid to world path', () => {
            pathfindingSystem.initialize(100, 100);
            const worldPath = pathfindingSystem.gridToWorldPath([{ x: 10, y: 10 }, { x: 20, y: 20 }]);
            expect(Array.isArray(worldPath)).toBe(true);
        });

        test('should validate positions', () => {
            pathfindingSystem.initialize(1000, 1000);
            const result = pathfindingSystem.isValidPosition({ x: 500, y: 500 });
            expect(typeof result).toBe('boolean');
        });

        test('should check walkable', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.createGrid();
            const node = pathfindingSystem.getNode(10, 10);
            const isWalkable = pathfindingSystem.isWalkable(node, 'test');
            expect(typeof isWalkable).toBe('boolean');
        });

        test('should add and remove static obstacle', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.addStaticObstacle({ x: 50, y: 50 }, 10, 10);
            pathfindingSystem.removeStaticObstacle({ x: 50, y: 50 }, 10, 10);
            expect(pathfindingSystem.obstacles).toBeDefined();
        });

        test('should add and remove dynamic obstacle', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.addDynamicObstacle('obs1', { x: 50, y: 50 }, 10, 10, 5000);
            pathfindingSystem.removeDynamicObstacle('obs1');
            expect(pathfindingSystem.dynamicObstacles.has('obs1')).toBe(false);
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

        test('should find nearest walkable', () => {
            pathfindingSystem.initialize(100, 100);
            const nearest = pathfindingSystem.findNearestWalkable({ x: 50, y: 50 }, 10);
            expect(nearest).toBeDefined();
        });

        test('should generate cache key', () => {
            pathfindingSystem.initialize(100, 100);
            const key = pathfindingSystem.generateCacheKey({ x: 10, y: 10 }, { x: 20, y: 20 }, 'test');
            expect(typeof key).toBe('string');
        });

        test('should get statistics', () => {
            const stats = pathfindingSystem.getStatistics();
            expect(stats).toBeDefined();
            expect(typeof stats).toBe('object');
        });

        test('should reset system', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.reset();
            expect(pathfindingSystem.grid).toBeNull();
        });
    });

    describe('PathfindingSystem - Pathfinding', () => {
        test('should calculate heuristic', () => {
            pathfindingSystem.initialize(100, 100);
            const h = pathfindingSystem.heuristic({ x: 10, y: 10 }, { x: 20, y: 20 });
            expect(typeof h).toBe('number');
            expect(h).toBeGreaterThanOrEqual(0);
        });

        test('should get neighbors', () => {
            pathfindingSystem.initialize(100, 100);
            pathfindingSystem.createGrid();
            const node = pathfindingSystem.getNode(10, 10);
            const neighbors = pathfindingSystem.getNeighbors(node, 'test');
            expect(Array.isArray(neighbors)).toBe(true);
        });

        test('should reconstruct path', () => {
            pathfindingSystem.initialize(100, 100);
            const cameFrom = new Map();
            cameFrom.set('10,10', { x: 9, y: 9 });
            cameFrom.set('9,9', { x: 8, y: 8 });
            const path = pathfindingSystem.reconstructPath(cameFrom, { x: 10, y: 10 });
            expect(Array.isArray(path)).toBe(true);
        });
    });

    describe('AIBossController - Core', () => {
        test('should initialize correctly', () => {
            expect(aiBossController.bosses).toBeInstanceOf(Map);
            expect(aiBossController.tactics).toBeInstanceOf(Map);
            expect(aiBossController.abilityPatterns).toBeUndefined();
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

        test('should get boss AI', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'get_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.getBossAI('get_boss');
            expect(bossAI).toBeDefined();
        });

        test('should get tactical profile', () => {
            aiBossController.setupTacticalProfiles();
            const profile = aiBossController.getTacticalProfile('dragon');
            expect(profile).toBeDefined();
            expect(profile).toHaveProperty('aggression');
        });

        test('should update boss', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'update_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
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

        test('should create difficulty data', () => {
            const difficultyData = aiBossController.createDifficultyData('test_boss');
            expect(difficultyData).toBeDefined();
            expect(typeof difficultyData.playerSkillLevel).toBe('number');
        });

        test('should evaluate direct assault', () => {
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

        test('should evaluate coordinated attack', () => {
            aiBossController.setupTacticalProfiles();
            const context = {
                bossHealth: 80,
                playerHealth: 60,
                distance: 50,
                hasMinions: true,
                minionCount: 3
            };
            const result = aiBossController.evaluateCoordinatedAttack(context);
            expect(typeof result).toBe('string');
        });

        test('should check ability cooldown', () => {
            aiBossController.setupAbilityPatterns();
            aiBossController.setupTacticalProfiles();
            const bossData = {
                id: 'cooldown_boss',
                type: 'dragon_lord',
                position: { x: 500, y: 500 },
                stats: { hp: 2000, maxHp: 2000 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('cooldown_boss');
            if (bossAI && bossAI.abilities) {
                bossAI.abilities.get('berserk').lastUsed = Date.now();
                const isOnCooldown = aiBossController.isAbilityOnCooldown('cooldown_boss', 'berserk');
                expect(typeof isOnCooldown).toBe('boolean');
            }
        });

        test('should can use ability', () => {
            aiBossController.setupAbilityPatterns();
            aiBossController.setupTacticalProfiles();
            const bossData = {
                id: 'can_use_boss',
                type: 'dragon_lord',
                position: { x: 500, y: 500 },
                stats: { hp: 2000, maxHp: 2000 }
            };
            aiBossController.addBoss(bossData);
            const context = { has_target: true, distance: 30 };
            const canUse = aiBossController.canUseAbility(context, 'berserk');
            expect(typeof canUse).toBe('boolean');
        });

        test('should get statistics', () => {
            const stats = aiBossController.getStatistics();
            expect(stats).toHaveProperty('totalBosses');
            expect(stats).toHaveProperty('tactics');
            expect(typeof stats.totalBosses).toBe('number');
        });

        test('should stop controller', () => {
            aiBossController.start();
            aiBossController.stop();
            expect(aiBossController.isRunning).toBe(false);
        });
    });

    describe('AIBossController - Phase Management', () => {
        test('should set boss phase', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'phase_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.setPhase('phase_boss', 2);
            const bossAI = aiBossController.bosses.get('phase_boss');
            expect(bossAI.currentPhase).toBe(2);
        });

        test('should handle phase transition', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'transition_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.handlePhaseTransition('transition_boss', 2);
            const bossAI = aiBossController.bosses.get('transition_boss');
            expect(bossAI.currentPhase).toBe(2);
        });
    });

    describe('AIBossController - Decision Making', () => {
        test('should make decision', () => {
            aiBossController.setupAbilityPatterns();
            aiBossController.setupTacticalProfiles();
            const bossData = {
                id: 'decision_boss',
                type: 'dragon',
                position: { x: 500, y: 500 },
                stats: { hp: 1000, maxHp: 1000 }
            };
            aiBossController.addBoss(bossData);
            const context = {
                bossHealth: 80,
                playerHealth: 60,
                distance: 50,
                abilitiesReady: true,
                hasMinions: false
            };
            const decision = aiBossController.makeDecision('decision_boss', context);
            expect(typeof decision).toBe('string');
        });

        test('should evaluate environment', () => {
            aiBossController.setupTacticalProfiles();
            const context = {
                bossHealth: 80,
                environmentalHazards: [],
                coverAvailable: true
            };
            const result = aiBossController.evaluateEnvironment(context);
            expect(typeof result).toBe('string');
        });

        test('should select best tactic', () => {
            aiBossController.setupTacticalProfiles();
            const scores = new Map([
                ['direct_assault', 0.8],
                ['coordinated_attack', 0.6],
                ['environmental_advantage', 0.4]
            ]);
            const tactic = aiBossController.selectBestTactic(scores);
            expect(typeof tactic).toBe('string');
        });
    });

    describe('AIBossController - Threat Assessment', () => {
        test('should assess threat level', () => {
            aiBossController.setupTacticalProfiles();
            const players = new Map([
                ['player1', { damage: 100, range: 'melee', abilities: [] }]
            ]);
            const threatLevel = aiBossController.assessThreatLevel(players, 1000);
            expect(typeof threatLevel).toBe('number');
        });
    });
});
