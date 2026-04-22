/**
 * Ancient Dragon Krazgoth Boss Test Suite
 * Tests for the 5-phase raid boss encounter
 */

const AncientDragonKrazgoth = require('../../server/bosses/AncientDragonKrazgoth');

describe('Ancient Dragon Krazgoth Boss', () => {
    let boss;

    beforeEach(() => {
        boss = new AncientDragonKrazgoth('krazgoth_test', 'draconia');
    });

    afterEach(() => {
        boss.cleanup();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with correct stats', () => {
            expect(boss.name).toBe('Ancient Dragon Krazgoth');
            expect(boss.level).toBe(80);
            expect(boss.maxHp).toBe(2500000);
            expect(boss.hp).toBe(2500000);
            expect(boss.damage).toBe(350);
            expect(boss.armor).toBe(150);
        });

        test('should have high resistances', () => {
            expect(boss.resistances.fire).toBe(0.9);
            expect(boss.resistances.ice).toBe(0.7);
            expect(boss.resistances.physical).toBe(0.5);
            expect(boss.resistances.magic).toBe(0.6);
        });

        test('should start in phase 1', () => {
            expect(boss.currentPhase).toBe(1);
            expect(boss.maxPhases).toBe(5);
        });

        test('should have correct phase thresholds', () => {
            expect(boss.phaseThresholds).toEqual([0.8, 0.6, 0.4, 0.2, 0]);
        });
    });

    describe('Phase System', () => {
        test('should transition to phase 2 at 80% HP', () => {
            const phaseSpy = jest.fn();
            boss.on('phaseTransition', phaseSpy);
            
            boss.hp = boss.maxHp * 0.75;
            boss.checkPhaseTransition();
            
            expect(boss.currentPhase).toBe(2);
            expect(phaseSpy).toHaveBeenCalledWith(expect.objectContaining({ phase: 2 }));
        });

        test('should transition to phase 3 at 60% HP', () => {
            boss.hp = boss.maxHp * 0.55;
            boss.checkPhaseTransition();
            expect(boss.currentPhase).toBe(3);
        });

        test('should transition to phase 4 at 40% HP', () => {
            boss.hp = boss.maxHp * 0.35;
            boss.checkPhaseTransition();
            expect(boss.currentPhase).toBe(4);
        });

        test('should transition to phase 5 at 20% HP', () => {
            boss.hp = boss.maxHp * 0.15;
            boss.checkPhaseTransition();
            expect(boss.currentPhase).toBe(5);
        });

        test('should emit phase transition event with correct data', () => {
            const phaseSpy = jest.fn();
            boss.on('phaseTransition', phaseSpy);
            
            boss.hp = boss.maxHp * 0.75;
            boss.checkPhaseTransition();
            
            expect(phaseSpy).toHaveBeenCalledWith({
                bossId: boss.id,
                phase: 2,
                hp: boss.hp,
                maxHp: boss.maxHp
            });
        });
    });

    describe('Phase Abilities', () => {
        test('should have phase 1 abilities: fireBreath, tailSwipe', () => {
            expect(boss.abilities).toHaveProperty('fireBreath');
            expect(boss.abilities).toHaveProperty('tailSwipe');
            expect(boss.abilities.fireBreath.damage).toBe(400);
            expect(boss.abilities.tailSwipe.damage).toBe(250);
        });

        test('should have phase 2 abilities: summonDrake, wingBuffet', () => {
            expect(boss.abilities).toHaveProperty('summonDrake');
            expect(boss.abilities).toHaveProperty('wingBuffet');
            expect(boss.abilities.summonDrake.count).toBe(2);
        });

        test('should have phase 3 abilities: fireStorm, magmaPool', () => {
            expect(boss.abilities).toHaveProperty('fireStorm');
            expect(boss.abilities).toHaveProperty('magmaPool');
            expect(boss.abilities.fireStorm.damage).toBe(150);
        });

        test('should have phase 4 abilities: ancientRoar, deathGrip', () => {
            expect(boss.abilities).toHaveProperty('ancientRoar');
            expect(boss.abilities).toHaveProperty('deathGrip');
            expect(boss.abilities.ancientRoar.stunDuration).toBe(3000);
            expect(boss.abilities.deathGrip.execute).toBe(true);
        });

        test('should have phase 5 ability: worldEnder', () => {
            expect(boss.abilities).toHaveProperty('worldEnder');
            expect(boss.abilities.worldEnder.damage).toBe(1000);
            expect(boss.abilities.worldEnder.interruptible).toBe(true);
        });
    });

    describe('Combat Mechanics', () => {
        test('should start combat with raid group', () => {
            const combatSpy = jest.fn();
            boss.on('combatStart', combatSpy);
            
            const raidGroup = ['player1', 'player2', 'player3'];
            boss.startCombat(raidGroup);
            
            expect(boss.inCombat).toBe(true);
            expect(boss.raidGroup).toEqual(raidGroup);
            expect(boss.combatStartTime).toBeTruthy();
            expect(combatSpy).toHaveBeenCalled();
        });

        test('should end combat and despawn adds', () => {
            boss.startCombat(['player1']);
            
            const endSpy = jest.fn();
            boss.on('combatEnd', endSpy);
            
            boss.endCombat();
            
            expect(boss.inCombat).toBe(false);
            expect(boss.raidGroup).toEqual([]);
            expect(endSpy).toHaveBeenCalled();
        });

        test('should take reduced damage from resisted types', () => {
            const fireDamage = boss.takeDamage(1000, { id: 'player1' }, 'fire');
            expect(fireDamage).toBeLessThan(1000);
            
            const physicalDamage = boss.takeDamage(1000, { id: 'player1' }, 'physical');
            expect(physicalDamage).toBeLessThan(1000);
        });

        test('should start combat when taking damage while not in combat', () => {
            const mockSource = { id: 'player1' };
            boss.takeDamage(100, mockSource);
            
            expect(boss.inCombat).toBe(true);
        });
    });

    describe('Enrage Mechanic', () => {
        test('should have 20 minute enrage timer', () => {
            expect(boss.enrageTimer).toBe(20 * 60 * 1000); // 20 minutes in ms
        });

        test('should enrage after timer expires', () => {
            const enrageSpy = jest.fn();
            boss.on('enrage', enrageSpy);
            
            boss.startCombat(['player1']);
            boss.combatStartTime = Date.now() - (21 * 60 * 1000); // 21 minutes ago
            
            boss.update(1);
            
            expect(boss.isEnraged).toBe(true);
            expect(enrageSpy).toHaveBeenCalled();
        });

        test('should increase damage when enraged', () => {
            const initialDamage = boss.damage;
            
            boss.enrage();
            
            expect(boss.damage).toBeGreaterThan(initialDamage);
        });
    });

    describe('World Ender (Phase 5)', () => {
        test('should start casting world ender', () => {
            boss.currentPhase = 5;
            
            const castSpy = jest.fn();
            boss.on('startCast', castSpy);
            
            boss.useAbility('worldEnder');
            
            expect(boss.isCasting).toBe(true);
            expect(boss.currentCast).toBeTruthy();
            expect(castSpy).toHaveBeenCalled();
        });

        test('should complete cast after cast time', () => {
            boss.currentPhase = 5;
            boss.useAbility('worldEnder');
            
            const worldEnderSpy = jest.fn();
            boss.on('worldEnder', worldEnderSpy);
            
            // Manually complete the cast instead of using timers
            boss.completeCast();
            
            expect(worldEnderSpy).toHaveBeenCalled();
            expect(boss.isCasting).toBe(false);
        });

        test('should be interruptible during cast', () => {
            boss.currentPhase = 5;
            boss.useAbility('worldEnder');
            
            expect(boss.isCasting).toBe(true);
            
            const interrupted = boss.interruptCast();
            expect(interrupted).toBe(true);
            expect(boss.isCasting).toBe(false);
        });
    });

    describe('Death and Loot', () => {
        test('should die when HP reaches 0', () => {
            boss.startCombat(['player1']); // Ensure combat state
            
            const deathSpy = jest.fn();
            boss.on('death', deathSpy);
            
            const mockSource = { id: 'player1' };
            // Deal massive damage to overcome resistances
            boss.takeDamage(boss.maxHp * 3, mockSource);
            
            expect(boss.hp).toBe(0);
            expect(deathSpy).toHaveBeenCalled();
        });

        test('should generate loot on death', () => {
            boss.startCombat(['player1', 'player2', 'player3']);
            
            const mockSource = { id: 'player1' };
            boss.die(mockSource);
            
            expect(boss.hp).toBe(0);
            expect(boss.lootTable.length).toBeGreaterThan(0);
        });

        test('should have dragon materials in loot table', () => {
            const dragonScales = boss.lootTable.find(l => l.item === 'dragon_scale');
            const krazgothFang = boss.lootTable.find(l => l.item === 'krazgoth_fang');
            
            expect(dragonScales).toBeDefined();
            expect(krazgothFang).toBeDefined();
        });
    });

    describe('Ability Usage', () => {
        test('should track cooldowns', () => {
            const now = Date.now();
            boss.abilities.fireBreath.lastUsed = now;
            
            expect(boss.canUseAbility('fireBreath')).toBe(false);
            
            boss.abilities.fireBreath.lastUsed = now - 15000;
            expect(boss.canUseAbility('fireBreath')).toBe(true);
        });

        test('should emit ability use events', () => {
            boss.currentPhase = 1;
            
            const fireBreathSpy = jest.fn();
            boss.on('fireBreath', fireBreathSpy);
            
            // Reset cooldown and use ability with target
            boss.abilities.fireBreath.lastUsed = 0;
            const mockTarget = { id: 'player1', x: 4200, y: 2200 };
            boss.useAbility('fireBreath', mockTarget);
            
            expect(fireBreathSpy).toHaveBeenCalled();
        });

        test('should calculate correct phase from HP', () => {
            expect(boss.getPhaseFromHp(0.9)).toBe(1);
            expect(boss.getPhaseFromHp(0.7)).toBe(2);
            expect(boss.getPhaseFromHp(0.5)).toBe(3);
            expect(boss.getPhaseFromHp(0.3)).toBe(4);
            expect(boss.getPhaseFromHp(0.1)).toBe(5);
        });
    });

    describe('Client Data Export', () => {
        test('should export client data correctly', () => {
            boss.currentPhase = 3;
            boss.isEnraged = true;
            
            const clientData = boss.getClientData();
            
            expect(clientData.id).toBe(boss.id);
            expect(clientData.name).toBe('Ancient Dragon Krazgoth');
            expect(clientData.level).toBe(80);
            expect(clientData.phase).toBe(3);
            expect(clientData.isEnraged).toBe(true);
            expect(clientData.hp).toBe(boss.hp);
            expect(clientData.maxHp).toBe(boss.maxHp);
        });

        test('should export full data for server', () => {
            boss.startCombat(['player1', 'player2']);
            
            const fullData = boss.getFullData();
            
            expect(fullData.damage).toBe(boss.damage);
            expect(fullData.armor).toBe(boss.armor);
            expect(fullData.resistances).toEqual(boss.resistances);
            expect(fullData.raidGroup).toEqual(['player1', 'player2']);
        });
    });
});
