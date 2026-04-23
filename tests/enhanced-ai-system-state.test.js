/**
 * Enhanced AI System - State Machine Tests
 * Tests for state transitions and state-specific methods
 */

const AIMobController = require('../server/ai/AIMobController');
const AIBossController = require('../server/ai/AIBossController');

describe('Enhanced AI System - State Machine Coverage', () => {
    let aiMobController;
    let aiBossController;

    beforeEach(() => {
        aiMobController = new AIMobController();
        aiBossController = new AIBossController();
    });

    afterEach(() => {
        if (aiMobController) aiMobController.stop();
        if (aiBossController) aiBossController.stop();
    });

    describe('AIMobController - State Transitions', () => {
        test('should transition from idle to patrol', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterIdle('test_mob');
            expect(aiMobController.mobs.get('test_mob').stateMachine.currentState).toBe('idle');
            aiMobController.transitionState('test_mob', 'patrol');
            expect(aiMobController.mobs.get('test_mob').stateMachine.currentState).toBe('patrol');
        });

        test('should transition from patrol to chase', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterPatrol('test_mob');
            aiMobController.transitionState('test_mob', 'chase');
            expect(aiMobController.mobs.get('test_mob').stateMachine.currentState).toBe('chase');
        });

        test('should transition from chase to attack', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterChase('test_mob');
            aiMobController.transitionState('test_mob', 'attack');
            expect(aiMobController.mobs.get('test_mob').stateMachine.currentState).toBe('attack');
        });

        test('should transition from attack to flee', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterAttack('test_mob');
            aiMobController.transitionState('test_mob', 'flee');
            expect(aiMobController.mobs.get('test_mob').stateMachine.currentState).toBe('flee');
        });

        test('should track previous state correctly', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterIdle('test_mob');
            aiMobController.transitionState('test_mob', 'patrol');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.stateMachine.previousState).toBe('idle');
        });

        test('should increment stateChanges counter on transition', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const initialChanges = aiMobController.mobs.get('test_mob').stats.stateChanges;
            aiMobController.transitionState('test_mob', 'chase');
            const finalChanges = aiMobController.mobs.get('test_mob').stats.stateChanges;
            expect(finalChanges).toBe(initialChanges + 1);
        });

        test('should call enter/exit methods on state transition', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            const enterSpy = jest.spyOn(aiMobController, 'enterChase');
            const exitSpy = jest.spyOn(aiMobController, 'exitIdle');
            aiMobController.enterIdle('test_mob');
            aiMobController.transitionState('test_mob', 'chase');
            expect(enterSpy).toHaveBeenCalledWith('test_mob');
            expect(exitSpy).toHaveBeenCalledWith('test_mob');
        });

        test('should handle update methods for all states', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.server = null;

            expect(() => {
                aiMobController.enterIdle('test_mob');
                aiMobController.updateIdle('test_mob');

                aiMobController.enterPatrol('test_mob');
                aiMobController.updatePatrol('test_mob');

                aiMobController.enterChase('test_mob');
                aiMobController.updateChase('test_mob');

                aiMobController.enterAttack('test_mob');
                aiMobController.updateAttack('test_mob');

                aiMobController.enterFlee('test_mob');
                aiMobController.updateFlee('test_mob');
            }).not.toThrow();
        });

        test('should handle hide state methods', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            expect(() => {
                aiMobController.enterHide('test_mob');
                aiMobController.updateHide('test_mob');
                aiMobController.exitHide('test_mob');
            }).not.toThrow();
        });

        test('should handle call_help state methods', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            expect(() => {
                aiMobController.enterCallHelp('test_mob');
                aiMobController.updateCallHelp('test_mob');
                aiMobController.exitCallHelp('test_mob');
            }).not.toThrow();
        });

        test('should handle transition to call_help state', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('test_mob', 'call_help');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.stateMachine.currentState).toBe('call_help');
        });

        test('should handle transition to hide state', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.transitionState('test_mob', 'hide');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.stateMachine.currentState).toBe('hide');
        });
    });

    describe('AIMobController - State Entry/Exit Hooks', () => {
        test('should set target on enterChase', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterChase('test_mob', 'player_1');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.target).toBe('player_1');
        });

        test('should set target on enterAttack', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterAttack('test_mob', 'player_1');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.target).toBe('player_1');
        });

        test('should set target on enterFlee', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterFlee('test_mob', 'player_1');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.target).toBe('player_1');
        });

        test('should track flee start time on enterFlee', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterFlee('test_mob', 'player_1');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.fleeStartTime).toBeDefined();
        });

        test('should set patrol target on enterPatrol', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterPatrol('test_mob');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.patrolTarget).toBeDefined();
        });

        test('should clear target on exitChase', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterChase('test_mob', 'player_1');
            aiMobController.exitChase('test_mob');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.target).toBeNull();
        });

        test('should clear target on exitAttack', () => {
            const mobData = {
                id: 'test_mob',
                type: 'goblin',
                position: { x: 100, y: 100 },
                stats: { hp: 50, maxHp: 50 }
            };
            aiMobController.addMob(mobData);
            aiMobController.enterAttack('test_mob', 'player_1');
            aiMobController.exitAttack('test_mob');
            const aiData = aiMobController.mobs.get('test_mob');
            expect(aiData.target).toBeNull();
        });
    });

    describe('AIMobController - Decision Tree Evaluation', () => {
        test('should evaluate condition: has_target', () => {
            const context = { has_target: true };
            const result = aiMobController.evaluateCondition('has_target', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: target_in_range', () => {
            const context = { target_in_range: true };
            const result = aiMobController.evaluateCondition('target_in_range', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: can_reach_target', () => {
            const context = { can_reach_target: true };
            const result = aiMobController.evaluateCondition('can_reach_target', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: is_patrolling', () => {
            const context = { is_patrolling: true };
            const result = aiMobController.evaluateCondition('is_patrolling', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: has_patrol_route', () => {
            const context = { has_patrol_route: true };
            const result = aiMobController.evaluateCondition('has_patrol_route', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: health_low', () => {
            const context = { health_low: true };
            const result = aiMobController.evaluateCondition('health_low', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: is_cowardly', () => {
            const context = { is_cowardly: true };
            const result = aiMobController.evaluateCondition('is_cowardly', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: has_allies_nearby', () => {
            const context = { has_allies_nearby: true };
            const result = aiMobController.evaluateCondition('has_allies_nearby', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: target_health_low', () => {
            const context = { target_health_low: true };
            const result = aiMobController.evaluateCondition('target_health_low', context);
            expect(result).toBe(true);
        });

        test('should evaluate condition: multiple_enemies', () => {
            const context = { multiple_enemies: true };
            const result = aiMobController.evaluateCondition('multiple_enemies', context);
            expect(result).toBe(true);
        });
    });

    describe('AIBossController - Phase Transitions', () => {
        test('should transition from phase 1 to phase 2', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 },
                stats: { hp: 50, maxHp: 100 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            aiBossController.transitionPhase('test_boss', bossAI, 2);
            expect(bossAI.currentPhase).toBe(2);
            expect(bossAI.stats.phaseChanges).toBe(1);
        });

        test('should transition from phase 2 to phase 3', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 },
                stats: { hp: 20, maxHp: 100 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            aiBossController.transitionPhase('test_boss', bossAI, 3);
            expect(bossAI.currentPhase).toBe(3);
        });

        test('should update current tactic on phase transition', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            const initialTactic = bossAI.currentTactic;
            aiBossController.transitionPhase('test_boss', bossAI, 2);
            expect(bossAI.currentTactic).not.toBe(initialTactic);
        });

        test('should record phase transition in history', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            const initialHistoryLength = bossAI.patternMemory.phaseHistory.length;
            aiBossController.transitionPhase('test_boss', bossAI, 2);
            expect(bossAI.patternMemory.phaseHistory.length).toBe(initialHistoryLength + 1);
        });

        test('should set phaseTransitionTime on transition', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            aiBossController.transitionPhase('test_boss', bossAI, 2);
            expect(bossAI.phaseTransitionTime).toBeDefined();
            expect(bossAI.phaseTransitionTime).toBeGreaterThan(0);
        });
    });

    describe('AIBossController - Tactical Evaluation', () => {
        test('should evaluate direct assault with single target', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const context = {
                boss_id: 'test_boss',
                has_target: true,
                target_count: 1
            };
            const result = aiBossController.evaluateDirectAssault(context);
            expect(result).toBeDefined();
        });

        test('should evaluate direct assault with multiple targets', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const context = {
                boss_id: 'test_boss',
                has_target: true,
                target_count: 3
            };
            const result = aiBossController.evaluateDirectAssault(context);
            expect(result).toBeDefined();
        });

        test('should evaluate coordinated attack', () => {
            aiBossController.setupAbilityPatterns();
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const context = {
                boss_id: 'test_boss',
                has_target: true,
                minions_alive: 0,
                target_count: 1
            };
            const result = aiBossController.evaluateCoordinatedAttack(context);
            expect(result).toBeDefined();
        });

        test('should evaluate desperate assault', () => {
            const context = {
                health_percentage: 0.1
            };
            const result = aiBossController.evaluateDesperateAssault(context);
            expect(result).toBeDefined();
        });

        test('should evaluate probe defenses', () => {
            const context = {
                has_target: false
            };
            const result = aiBossController.evaluateProbeDefenses(context);
            expect(result).toBe('scan_area');
        });

        test('should evaluate exploit weakness', () => {
            const context = {
                pattern_memory: {
                    abilityEffectiveness: new Map()
                }
            };
            const result = aiBossController.evaluateExploitWeakness(context);
            expect(result).toBeDefined();
        });

        test('should evaluate all out tactics', () => {
            const context = {
                target_count: 3,
                minions_alive: 1
            };
            const result = aiBossController.evaluateAllOutTactics(context);
            expect(result).toBeDefined();
        });

        test('should evaluate fortify position', () => {
            const context = {
                health_percentage: 0.7
            };
            const result = aiBossController.evaluateFortifyPosition(context);
            expect(result).toBeDefined();
        });

        test('should evaluate counter attack', () => {
            const context = {
                minions_alive: 1
            };
            const result = aiBossController.evaluateCounterAttack(context);
            expect(result).toBeDefined();
        });

        test('should evaluate last stand', () => {
            const context = {
                health_percentage: 0.1
            };
            const result = aiBossController.evaluateLastStand(context);
            expect(result).toBeDefined();
        });

        test('should evaluate track and hunt', () => {
            const context = {
                has_target: false
            };
            const result = aiBossController.evaluateTrackAndHunt(context);
            expect(result).toBe('hunt_for_targets');
        });

        test('should evaluate corner and trap', () => {
            const context = {
                minions_alive: 1
            };
            const result = aiBossController.evaluateCornerAndTrap(context);
            expect(result).toBeDefined();
        });

        test('should evaluate relentless pursuit', () => {
            const context = {};
            const result = aiBossController.evaluateRelentlessPursuit(context);
            expect(result).toBeDefined();
        });
    });

    describe('AIBossController - Ability Cooldown Management', () => {
        test('should set ability cooldown correctly', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            aiBossController.setAbilityCooldown('test_boss', 'cleave');
            const bossAI = aiBossController.bosses.get('test_boss');
            expect(bossAI.abilities.get('cleave').lastUsed).toBeGreaterThan(0);
        });

        test('should check if ability is on cooldown', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.abilities.get('cleave').lastUsed = Date.now();
            bossAI.abilities.get('cleave').cooldown = 10000;
            const isOnCooldown = aiBossController.isAbilityOnCooldown('test_boss', 'cleave');
            expect(isOnCooldown).toBe(true);
        });

        test('should reset ability cooldowns', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.abilities.get('cleave').lastUsed = Date.now();
            aiBossController.resetAbilityCooldowns('test_boss');
            bossAI.abilities.forEach(ability => {
                expect(ability.lastUsed).toBe(0);
            });
        });

        test('should update ability cooldowns over time', () => {
            const bossData = {
                id: 'test_boss',
                name: 'Dragon Lord',
                type: 'dragon',
                position: { x: 400, y: 300 }
            };
            aiBossController.addBoss(bossData);
            const bossAI = aiBossController.bosses.get('test_boss');
            bossAI.abilities.get('cleave').lastUsed = Date.now() - 100;
            bossAI.abilities.get('cleave').cooldown = 50;
            aiBossController.updateAbilityCooldowns(bossAI);
            expect(bossAI.abilities.get('cleave').lastUsed).toBe(0);
        });
    });
});
