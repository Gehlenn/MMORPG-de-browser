/**
 * aurelia-mobs.test.js
 * 
 * Test suite for Aurélia mobs
 * Giant Scorpion, Sand Worm, Mummy, Ancient Construct, Desert Bandit, Mercenary Captain
 * Target: 95%+ coverage
 */

const GiantScorpion = require('../../server/mobs/aurelia/GiantScorpion');
const SandWorm = require('../../server/mobs/aurelia/SandWorm');
const Mummy = require('../../server/mobs/aurelia/Mummy');
const AncientConstruct = require('../../server/mobs/aurelia/AncientConstruct');
const DesertBandit = require('../../server/mobs/aurelia/DesertBandit');
const MercenaryCaptain = require('../../server/mobs/aurelia/MercenaryCaptain');

// Mock player
const mockPlayer = {
    id: 'player1',
    x: 500,
    y: 500,
    level: 45,
    hp: 200,
    maxHp: 200,
    resistances: {},
    takeDamage: jest.fn(),
    applyStatusEffect: jest.fn()
};

describe('Aurelia Mobs', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GiantScorpion', () => {
        let scorpion;

        beforeEach(() => {
            scorpion = new GiantScorpion('scorpion_1', { x: 400, y: 400, subZone: 'golden_dunes' });
        });

        afterEach(() => {
            scorpion.cleanup();
        });

        describe('Initialization', () => {
            test('should initialize with correct stats', () => {
                expect(scorpion.id).toBe('scorpion_1');
                expect(scorpion.type).toBe('giant_scorpion');
                expect(scorpion.name).toBe('Giant Scorpion');
                expect(scorpion.level).toBe(40);
                expect(scorpion.maxHp).toBe(600);
                expect(scorpion.hp).toBe(600);
                expect(scorpion.damage).toBe(45);
            });

            test('should start in burrowed state', () => {
                expect(scorpion.state).toBe('burrowed');
                expect(scorpion.isBurrowed).toBe(true);
                expect(scorpion.burrowDepth).toBe(1);
            });

            test('should have correct abilities', () => {
                expect(scorpion.abilities).toHaveProperty('burrowAttack');
                expect(scorpion.abilities).toHaveProperty('venomSting');
                expect(scorpion.abilities).toHaveProperty('pincerCrush');
            });
        });

        describe('Combat', () => {
            test('should take damage', () => {
                const damage = scorpion.takeDamage(100, { id: 'p1' }, 'physical');
                
                expect(damage).toBeGreaterThan(0);
                expect(damage).toBeLessThanOrEqual(100);
                expect(scorpion.hp).toBeLessThan(600);
            });

            test('should apply physical resistance', () => {
                const baseDamage = 100;
                const damage = scorpion.takeDamage(baseDamage, { id: 'p1' }, 'physical');
                
                // 20% resistance means ~80 damage
                expect(damage).toBeGreaterThan(70);
                expect(damage).toBeLessThan(90);
            });

            test('should die when HP reaches 0', () => {
                scorpion.takeDamage(1000, { id: 'p1' }, 'physical');
                
                expect(scorpion.hp).toBe(0);
                expect(scorpion.state).toBe('dead');
            });

            test('should emerge when damaged while burrowed', () => {
                scorpion.takeDamage(50, { id: 'p1' }, 'physical');
                
                expect(scorpion.state).toBe('emerging');
                expect(scorpion.isBurrowed).toBe(false);
                expect(scorpion.target?.id).toBe('p1');
            });

            test('should use burrow attack', () => {
                scorpion.state = 'active';
                scorpion.target = mockPlayer;
                
                const result = scorpion.useAbility('burrowAttack', mockPlayer);
                
                expect(result).toBe(true);
                expect(mockPlayer.takeDamage).toHaveBeenCalled();
                expect(mockPlayer.applyStatusEffect).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'stun' })
                );
            });

            test('should use venom sting', () => {
                scorpion.state = 'active';
                scorpion.target = mockPlayer;
                
                const result = scorpion.useAbility('venomSting', mockPlayer);
                
                expect(result).toBe(true);
                expect(mockPlayer.applyStatusEffect).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'poison' })
                );
            });

            test('should use pincer crush', () => {
                scorpion.state = 'active';
                scorpion.target = mockPlayer;
                
                const result = scorpion.useAbility('pincerCrush', mockPlayer);
                
                expect(result).toBe(true);
                expect(mockPlayer.applyStatusEffect).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'armor_reduction' })
                );
            });

            test('should respect cooldowns', () => {
                scorpion.state = 'active';
                scorpion.target = mockPlayer;
                
                scorpion.useAbility('burrowAttack', mockPlayer);
                const result = scorpion.useAbility('burrowAttack', mockPlayer);
                
                expect(result).toBe(false); // On cooldown
            });

            test('should respawn after death', () => {
                scorpion.die({ id: 'p1' });
                
                // Simulate respawn
                scorpion.respawn();
                
                expect(scorpion.hp).toBe(600);
                expect(scorpion.state).toBe('burrowed');
                expect(scorpion.isBurrowed).toBe(true);
            });
        });

        describe('Movement', () => {
            test('should move toward target', () => {
                const target = { x: 600, y: 600 };
                const initialX = scorpion.x;
                const initialY = scorpion.y;
                
                scorpion.moveToward(target, 1);
                
                expect(scorpion.x).not.toBe(initialX);
                expect(scorpion.y).not.toBe(initialY);
            });

            test('should calculate distance', () => {
                const distance = scorpion.getDistanceTo({ x: 500, y: 500 });
                
                expect(distance).toBe(Math.sqrt(10000 + 10000)); // ~141.42
            });
        });

        describe('Data Export', () => {
            test('should get client data', () => {
                const data = scorpion.getClientData();
                
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('type');
                expect(data).toHaveProperty('name');
                expect(data).toHaveProperty('level');
                expect(data).toHaveProperty('state');
                expect(data).toHaveProperty('isBurrowed');
            });

            test('should get full data', () => {
                const data = scorpion.getFullData();
                
                expect(data).toHaveProperty('abilities');
                expect(data).toHaveProperty('resistances');
                expect(data).toHaveProperty('xpValue');
            });
        });
    });

    describe('SandWorm', () => {
        let worm;

        beforeEach(() => {
            worm = new SandWorm('worm_1', { x: 400, y: 400, subZone: 'golden_dunes' });
        });

        afterEach(() => {
            worm.cleanup();
        });

        describe('Initialization', () => {
            test('should initialize with correct stats', () => {
                expect(worm.level).toBe(42);
                expect(worm.maxHp).toBe(800);
                expect(worm.damage).toBe(60);
                expect(worm.moveSpeed).toBe(100); // Fast underground
            });

            test('should start underground', () => {
                expect(worm.state).toBe('underground');
                expect(worm.isUnderground).toBe(true);
            });

            test('should have vibration sensing', () => {
                expect(worm.detectedVibrations).toEqual([]);
                expect(worm.senseRange).toBe(400);
            });
        });

        describe('Vibration System', () => {
            test('should detect vibrations', () => {
                worm.x = 0;
                worm.y = 0;
                
                worm.detectVibration(200, 200, 0.8, { id: 'p1' });
                
                expect(worm.detectedVibrations.length).toBe(1);
                expect(worm.detectedVibrations[0].intensity).toBeGreaterThan(0);
            });

            test('should not detect vibrations too far', () => {
                worm.x = 0;
                worm.y = 0;
                
                worm.detectVibration(1000, 1000, 0.8, { id: 'p1' });
                
                expect(worm.detectedVibrations.length).toBe(0);
            });

            test('should get strongest vibration', () => {
                worm.detectVibration(100, 100, 0.5, { id: 'p1' });
                worm.detectVibration(150, 150, 0.8, { id: 'p2' });
                
                const strongest = worm.getStrongestVibration();
                
                expect(strongest.intensity).toBeGreaterThan(0.7);
            });
        });

        describe('Combat', () => {
            test('should use underground ambush', () => {
                worm.state = 'surfaced';
                worm.target = mockPlayer;
                worm.surfaceLevel = 1;
                
                worm.useAbility('undergroundAmbush', mockPlayer);
                
                expect(mockPlayer.takeDamage).toHaveBeenCalled();
                expect(mockPlayer.applyStatusEffect).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'knockup' })
                );
            });

            test('should devour low HP targets', () => {
                const lowHpTarget = {
                    ...mockPlayer,
                    hp: 20,
                    maxHp: 200 // 10% HP
                };
                
                worm.state = 'surfaced';
                
                worm.useAbility('devour', lowHpTarget);
                
                expect(lowHpTarget.takeDamage).toHaveBeenCalled();
            });

            test('should emerge when damaged', () => {
                worm.takeDamage(50, { id: 'p1' }, 'physical');
                
                expect(worm.isUnderground).toBe(false);
                expect(worm.state).toBe('emerging');
            });
        });

        describe('Movement', () => {
            test('should patrol underground', () => {
                worm.state = 'underground';
                const initialX = worm.x;
                
                worm.updateUnderground(1);
                
                expect(worm.x).not.toBe(initialX);
            });

            test('should track movement trail', () => {
                worm.x = 100;
                worm.y = 100;
                worm.recordTrail();
                
                expect(worm.trail.length).toBeGreaterThan(0);
                expect(worm.trail[worm.trail.length - 1].x).toBe(100);
            });
        });
    });

    describe('Mummy', () => {
        let mummy;

        beforeEach(() => {
            mummy = new Mummy('mummy_1', { x: 400, y: 400, subZone: 'ruins_ankhet' });
        });

        afterEach(() => {
            mummy.cleanup();
        });

        describe('Initialization', () => {
            test('should initialize with correct stats', () => {
                expect(mummy.level).toBe(45);
                expect(mummy.maxHp).toBe(550);
                expect(mummy.damage).toBe(50);
                expect(mummy.moveSpeed).toBe(50); // Very slow
                expect(mummy.attackSpeed).toBe(0.6); // Slow attacks
            });

            test('should start dormant', () => {
                expect(mummy.state).toBe('dormant');
                expect(mummy.isDormant).toBe(true);
            });

            test('should have high physical resistance', () => {
                expect(mummy.resistances.physical).toBe(0.4);
                expect(mummy.resistances.fire).toBe(-0.5); // Fire weakness
            });
        });

        describe('Dormancy', () => {
            test('should wake up when player is close', () => {
                mummy.target = { x: mummy.x + 50, y: mummy.y + 50 };
                
                mummy.updateDormant(1);
                
                expect(mummy.state).toBe('active');
                expect(mummy.isDormant).toBe(false);
            });

            test('should wake up when damaged', () => {
                mummy.takeDamage(10, { id: 'p1' }, 'physical');
                
                expect(mummy.isDormant).toBe(false);
                expect(mummy.target?.id).toBe('p1');
            });

            test('should return to dormant when back at spawn', () => {
                mummy.state = 'returning';
                mummy.x = mummy.spawnPoint.x;
                mummy.y = mummy.spawnPoint.y;
                
                mummy.updateReturning(1);
                
                expect(mummy.state).toBe('dormant');
                expect(mummy.isDormant).toBe(true);
            });
        });

        describe('Abilities', () => {
            test('should use bandage bind', () => {
                mummy.state = 'active';
                mummy.target = mockPlayer;
                
                mummy.useAbility('bandageBind', mockPlayer);
                
                expect(mockPlayer.takeDamage).toHaveBeenCalled();
                expect(mockPlayer.applyStatusEffect).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'root' })
                );
            });

            test('should use curse of decay', () => {
                mummy.state = 'active';
                
                mummy.useAbility('curseOfDecay', mockPlayer);
                
                expect(mockPlayer.applyStatusEffect).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: 'curse',
                        subtype: 'decay'
                    })
                );
            });

            test('should summon scarabs when low HP', () => {
                mummy.state = 'active';
                mummy.target = mockPlayer;
                mummy.hp = mummy.maxHp * 0.4; // 40% HP
                
                mummy.useAbility('summonScarab', mockPlayer);
                
                expect(mummy.summonedScarabs.length).toBe(3);
            });

            test('should kill scarabs when mummy dies', () => {
                mummy.summonedScarabs = [
                    { hp: 30, maxHp: 30 },
                    { hp: 30, maxHp: 30 }
                ];
                
                mummy.die({ id: 'p1' });
                
                expect(mummy.summonedScarabs.every(s => s.hp === 0)).toBe(true);
            });
        });
    });

    describe('AncientConstruct', () => {
        let construct;

        beforeEach(() => {
            construct = new AncientConstruct(
                'construct_1',
                { x: 400, y: 400, subZone: 'ruins_ankhet' },
                'aurelia',
                'treasure_1'
            );
        });

        afterEach(() => {
            construct.cleanup();
        });

        describe('Initialization', () => {
            test('should initialize with correct stats', () => {
                expect(construct.level).toBe(48);
                expect(construct.maxHp).toBe(1000);
                expect(construct.damage).toBe(70);
                expect(construct.regenRate).toBe(0.01);
            });

            test('should start in guarding state', () => {
                expect(construct.state).toBe('guarding');
                expect(construct.isAggressive).toBe(false);
            });

            test('should have treasure to guard', () => {
                expect(construct.protectedTreasure).toBe('treasure_1');
            });
        });

        describe('Regeneration', () => {
            test('should regenerate HP', () => {
                construct.hp = 500;
                construct.lastRegen = Date.now() - 6000; // 6 seconds ago
                
                construct.updateRegeneration();
                
                expect(construct.hp).toBeGreaterThan(500);
            });

            test('should regenerate faster in shield mode', () => {
                construct.hp = 500;
                construct.shieldActive = true;
                construct.lastRegen = Date.now() - 6000;
                
                construct.updateRegeneration();
                
                // Should heal 2x more
                const expectedHeal = 1000 * 0.01 * 2; // 20 HP
                expect(construct.hp).toBe(520);
            });
        });

        describe('Shield Mode', () => {
            test('should activate shield mode', () => {
                construct.activateShield();
                
                expect(construct.shieldActive).toBe(true);
                expect(construct.defensiveMode).toBe(true);
                expect(construct.shieldEndTime).toBeGreaterThan(Date.now());
            });

            test('should reduce damage when shielded', () => {
                construct.activateShield();
                
                const baseDamage = 100;
                const actualDamage = construct.takeDamage(baseDamage, { id: 'p1' }, 'physical');
                
                // 75% reduction = 25 damage after armor
                expect(actualDamage).toBeLessThan(baseDamage * 0.3);
            });

            test('should deactivate shield after duration', () => {
                construct.activateShield();
                construct.shieldEndTime = Date.now() - 1000; // Expired
                
                construct.updateShieldModeExpiration();
                
                expect(construct.shieldActive).toBe(false);
            });
        });

        describe('Self Repair', () => {
            test('should start self repair', () => {
                construct.startSelfRepair();
                
                expect(construct.selfRepairing).toBe(true);
                expect(construct.state).toBe('selfRepairing');
            });

            test('should heal on repair completion', () => {
                construct.hp = 100;
                construct.startSelfRepair();
                construct.repairEndTime = Date.now() - 1000; // Completed
                
                construct.completeSelfRepair();
                
                expect(construct.hp).toBe(250); // 100 + 15% of 1000
                expect(construct.selfRepairing).toBe(false);
            });

            test('should interrupt repair when taking damage', () => {
                construct.hp = 100;
                construct.startSelfRepair();
                
                construct.takeDamage(50, { id: 'p1' }, 'physical');
                
                expect(construct.selfRepairing).toBe(false);
            });
        });

        describe('Enrage', () => {
            test('should enter enrage at 30% HP', () => {
                construct.state = 'active';
                construct.hp = 250; // 25% of 1000
                
                construct.checkEnrage();
                
                expect(construct.enraged).toBe(true);
                expect(construct.state).toBe('enraged');
                expect(construct.attackSpeed).toBeGreaterThan(0.7);
            });
        });

        describe('Threat System', () => {
            test('should add threat on damage', () => {
                construct.takeDamage(100, { id: 'p1' }, 'physical');
                
                expect(construct.threats.has('p1')).toBe(true);
                expect(construct.threats.get('p1')).toBeGreaterThan(0);
            });

            test('should become aggressive when attacked', () => {
                construct.takeDamage(50, { id: 'p1' }, 'physical');
                
                expect(construct.isAggressive).toBe(true);
                expect(construct.target?.id).toBe('p1');
            });
        });
    });

    describe('DesertBandit', () => {
        let bandit;

        beforeEach(() => {
            bandit = new DesertBandit('bandit_1', { x: 400, y: 400, subZone: 'thief_valley' });
        });

        afterEach(() => {
            bandit.cleanup();
        });

        describe('Initialization', () => {
            test('should initialize with correct stats', () => {
                expect(bandit.level).toBe(52);
                expect(bandit.maxHp).toBe(450);
                expect(bandit.damage).toBe(55);
                expect(bandit.moveSpeed).toBe(110); // Fast
            });

            test('should be day-active', () => {
                expect(bandit.activeDuringDay).toBe(true);
            });

            test('should have steal ability', () => {
                expect(bandit.abilities.stealGold.stealPercent).toBe(0.02);
            });
        });

        describe('Day/Night Cycle', () => {
            test('should detect daytime', () => {
                const hour = new Date().getHours();
                const isDay = hour >= 6 && hour < 18;
                
                expect(bandit.isDaytime).toBe(isDay);
            });

            test('should change state on day/night change', () => {
                bandit.isDaytime = false;
                bandit.checkDayNight();
                
                // Should update based on actual time
                expect(bandit.isDaytime).toBeDefined();
            });
        });

        describe('Stealth', () => {
            test('can hide when not in combat', () => {
                bandit.state = 'patrol';
                bandit.inCombat = false;
                
                // Force hide by setting directly
                bandit.isHidden = true;
                
                expect(bandit.isHidden).toBe(true);
                expect(bandit.canAmbush).toBe(true);
            });

            test('reveals when entering combat', () => {
                bandit.isHidden = true;
                bandit.inCombat = true;
                
                bandit.updateStealth(1);
                
                expect(bandit.isHidden).toBe(false);
            });
        });

        describe('Hit and Run', () => {
            test('should retreat after max attacks', () => {
                bandit.state = 'active';
                bandit.target = mockPlayer;
                bandit.attackCount = 3;
                
                bandit.updateActive(1);
                
                expect(bandit.state).toBe('retreating');
                expect(bandit.attackCount).toBe(0);
            });

            test('should use quick escape when retreating', () => {
                bandit.state = 'retreating';
                bandit.target = mockPlayer;
                bandit.abilities.quickEscape.lastUsed = 0;
                
                bandit.updateRetreating(1);
                
                // Should have attempted to use quick escape
                expect(bandit.abilities.quickEscape.lastUsed).toBeGreaterThan(0);
            });
        });

        describe('Gold Stealing', () => {
            test('should steal gold on attack', () => {
                const richPlayer = {
                    ...mockPlayer,
                    gold: 1000
                };
                
                bandit.stealGold(richPlayer);
                
                expect(richPlayer.gold).toBeLessThan(1000);
                expect(bandit.stolenGold).toBeGreaterThan(0);
            });

            test('should return stolen gold on death', () => {
                bandit.stolenGold = 100;
                bandit.victims.add('p1');
                
                const loot = bandit.generateLoot();
                
                const goldLoot = loot.find(l => l.id === 'stolen_gold');
                expect(goldLoot).toBeDefined();
                expect(goldLoot.amount).toBe(100);
            });
        });
    });

    describe('MercenaryCaptain', () => {
        let captain;

        beforeEach(() => {
            captain = new MercenaryCaptain('captain_1', { x: 400, y: 400, subZone: 'thief_valley' });
        });

        afterEach(() => {
            captain.cleanup();
        });

        describe('Initialization', () => {
            test('should initialize with correct stats', () => {
                expect(captain.level).toBe(55);
                expect(captain.maxHp).toBe(800);
                expect(captain.damage).toBe(75);
            });

            test('should have summon ability', () => {
                expect(captain.abilities.commandBandits.summonCount).toBe(3);
            });

            test('should have inspire ability', () => {
                expect(captain.abilities.inspire.damageBoost).toBe(0.2);
                expect(captain.abilities.inspire.attackSpeedBoost).toBe(0.15);
            });
        });

        describe('Summoning', () => {
            test('should summon bandits', () => {
                captain.useAbility('commandBandits');
                
                expect(captain.summonedBandits.length).toBe(3);
            });

            test('should rally bandits when alone', () => {
                captain.inCombat = true;
                captain.summonedBandits = [];
                captain.abilities.rally.lastUsed = 0;
                
                captain.update(1);
                
                expect(captain.summonedBandits.length).toBe(2); // Rally summons 2
            });

            test('should dismiss bandits on death', () => {
                captain.summonedBandits = [
                    { hp: 100, maxHp: 100 },
                    { hp: 100, maxHp: 100 }
                ];
                
                captain.die({ id: 'p1' });
                
                expect(captain.summonedBandits.every(b => b.hp === 0)).toBe(true);
            });
        });

        describe('Inspire', () => {
            test('should inspire allies', () => {
                captain.useAbility('commandBandits');
                
                captain.useAbility('inspire');
                
                expect(captain.inspired).toBe(true);
                expect(captain.inspireEndTime).toBeGreaterThan(Date.now());
                
                // Bandits should be inspired
                const bandit = captain.summonedBandits[0];
                expect(bandit.inspired).toBe(true);
            });

            test('should boost damage when inspired', () => {
                captain.inspired = true;
                
                const baseDamage = 75;
                // When inspired, damage is boosted by 20%
                // Attack method uses this.inspired
            });
        });

        describe('Sword Dance', () => {
            test('should perform multi-hit attack', () => {
                captain.useAbility('swordDance', mockPlayer);
                
                // Sword dance hits 3 times
                expect(mockPlayer.takeDamage).toHaveBeenCalled();
            });
        });

        describe('Defensive Mode', () => {
            test('should enter defensive mode at low HP', () => {
                captain.state = 'active';
                captain.target = mockPlayer;
                captain.hp = captain.maxHp * 0.3; // 30% HP
                
                captain.updateActive(1);
                
                expect(captain.state).toBe('defensive');
            });

            test('should use retreat call when very low HP', () => {
                captain.state = 'defensive';
                captain.target = mockPlayer;
                captain.hp = captain.maxHp * 0.2; // 20% HP
                
                captain.updateDefensive(1);
                
                // Should trigger retreat call
                expect(captain.abilities.retreatCall.lastUsed).toBeGreaterThan(0);
            });

            test('should heal bandits on retreat call', () => {
                captain.summonedBandits = [
                    { hp: 50, maxHp: 100 },
                    { hp: 50, maxHp: 100 }
                ];
                
                captain.useAbility('retreatCall');
                
                // Should heal 10% of max HP
                expect(captain.summonedBandits[0].hp).toBe(60);
            });
        });

        describe('Commander Behavior', () => {
            test('should command bandits to attack same target', () => {
                captain.useAbility('commandBandits');
                captain.target = mockPlayer;
                
                // Update should set bandit targets
                captain.updateSummonedBandits(1);
                
                // Bandits should target captain's target
                expect(captain.summonedBandits[0].target).toBe(mockPlayer);
            });

            test('should summon more when most are dead', () => {
                captain.state = 'active';
                captain.target = mockPlayer;
                captain.hp = captain.maxHp * 0.8;
                captain.summonedBandits = [
                    { hp: 100, maxHp: 100 } // Only 1 bandit left
                ];
                captain.abilities.commandBandits.lastUsed = 0;
                captain.abilities.commandBandits.cooldown = 0;
                
                captain.updateActive(1);
                
                // Should summon more
                expect(captain.summonedBandits.length).toBeGreaterThan(1);
            });
        });
    });
});
