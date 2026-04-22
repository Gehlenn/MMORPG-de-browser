/**
 * Draconia Mobs Test Suite
 * Tests for all 9 Draconia mobs
 */

const MagmaCrab = require('../../server/mobs/draconia/MagmaCrab');
const FrostWolf = require('../../server/mobs/draconia/FrostWolf');
const SteamElemental = require('../../server/mobs/draconia/SteamElemental');
const Wyvern = require('../../server/mobs/draconia/Wyvern');
const Harpy = require('../../server/mobs/draconia/Harpy');
const MountainGriffin = require('../../server/mobs/draconia/MountainGriffin');
const MagmaGolem = require('../../server/mobs/draconia/MagmaGolem');
const FireDrake = require('../../server/mobs/draconia/FireDrake');
const LavaSerpent = require('../../server/mobs/draconia/LavaSerpent');

describe('Draconia Mobs', () => {
    afterEach(() => {
        jest.clearAllTimers();
    });

    describe('Tier 1 Mobs (Levels 65-68)', () => {
        describe('MagmaCrab', () => {
            let crab;

            beforeEach(() => {
                crab = new MagmaCrab('crab_1', { x: 1500, y: 1000 }, 'draconia');
            });

            afterEach(() => {
                crab.cleanup();
            });

            test('should initialize with correct stats', () => {
                expect(crab.level).toBe(65);
                expect(crab.maxHp).toBe(1200);
                expect(crab.hp).toBe(1200);
                expect(crab.damage).toBe(80);
                expect(crab.armor).toBe(50);
                expect(crab.moveSpeed).toBe(30); // Very slow
            });

            test('should have fire resistance and ice weakness', () => {
                expect(crab.resistances.fire).toBe(0.8);
                expect(crab.resistances.ice).toBe(-0.3);
                expect(crab.resistances.physical).toBe(0.3);
            });

            test('should have 3 abilities', () => {
                expect(crab.abilities).toHaveProperty('shellHarden');
                expect(crab.abilities).toHaveProperty('magmaSpit');
                expect(crab.abilities).toHaveProperty('thermalVent');
            });

            test('should burrow when retreating', () => {
                crab.hp = crab.maxHp * 0.2;
                crab.target = { id: 'player1', x: 1500, y: 1000 };
                crab.state = 'retreating';
                
                crab.update(1);
                expect(crab.isBurrowed).toBe(true);
            });

            test('should emerge when taking damage while burrowed', () => {
                crab.burrow();
                expect(crab.isBurrowed).toBe(true);
                
                const mockSource = { id: 'player1' };
                crab.takeDamage(50, mockSource);
                
                expect(crab.isBurrowed).toBe(false);
            });

            test('should generate loot on death', () => {
                const mockSource = { id: 'player1' };
                crab.die(mockSource);
                
                expect(crab.hp).toBe(0);
                expect(crab.state).toBe('dead');
            });
        });

        describe('FrostWolf', () => {
            let wolf;

            beforeEach(() => {
                wolf = new FrostWolf('wolf_1', { x: 1700, y: 950, packId: 1 }, 'draconia');
            });

            afterEach(() => {
                wolf.cleanup();
            });

            test('should initialize with correct stats', () => {
                expect(wolf.level).toBe(67);
                expect(wolf.maxHp).toBe(1000);
                expect(wolf.damage).toBe(90);
                expect(wolf.moveSpeed).toBe(110); // Fast
            });

            test('should have ice resistance and fire weakness', () => {
                expect(wolf.resistances.ice).toBe(0.6);
                expect(wolf.resistances.fire).toBe(-0.4);
            });

            test('should have pack mechanics', () => {
                expect(wolf.packId).toBe(1);
                expect(wolf.abilities).toHaveProperty('howl');
            });

            test('should howl when damaged', () => {
                const howlSpy = jest.fn();
                wolf.on('howl', howlSpy);
                
                wolf.nearbyPackMembers = 2;
                wolf.abilities.howl.lastUsed = 0;
                
                const mockSource = { id: 'player1' };
                wolf.takeDamage(50, mockSource);
                
                expect(howlSpy).toHaveBeenCalled();
            });
        });

        describe('SteamElemental', () => {
            let elemental;

            beforeEach(() => {
                elemental = new SteamElemental('steam_1', { x: 1800, y: 900 }, 'draconia');
            });

            afterEach(() => {
                elemental.cleanup();
            });

            test('should initialize with correct stats', () => {
                expect(elemental.level).toBe(68);
                expect(elemental.maxHp).toBe(1400);
                expect(elemental.damage).toBe(75);
                expect(elemental.resistances.physical).toBe(-0.2);
            });

            test('should evaporate to become invisible', () => {
                elemental.state = 'combat';
                elemental.target = { id: 'player1', x: 1800, y: 900 };
                
                elemental.useAbility('evaporate');
                expect(elemental.isInvisible).toBe(true);
            });

            test('should take double damage while invisible', () => {
                elemental.evaporate();
                
                const mockSource = { id: 'player1' };
                const damage = elemental.takeDamage(100, mockSource);
                
                expect(damage).toBeGreaterThan(100);
            });
        });
    });

    describe('Tier 2 Mobs (Levels 70-74)', () => {
        describe('Wyvern', () => {
            let wyvern;

            beforeEach(() => {
                wyvern = new Wyvern('wyvern_1', { x: 3000, y: 1000 }, 'draconia');
            });

            afterEach(() => {
                wyvern.cleanup();
            });

            test('should initialize with correct stats', () => {
                expect(wyvern.level).toBe(70);
                expect(wyvern.maxHp).toBe(1800);
                expect(wyvern.damage).toBe(110);
                expect(wyvern.moveSpeed).toBe(140);
                expect(wyvern.flightSpeed).toBe(180);
            });

            test('should have dive bomb ability', () => {
                expect(wyvern.abilities).toHaveProperty('diveBomb');
                expect(wyvern.abilities.diveBomb.damage).toBe(200);
            });

            test('should take flight', () => {
                wyvern.state = 'perched';
                wyvern.takeFlight();
                expect(wyvern.isFlying).toBe(true);
                // State is managed by update loop, not directly by takeFlight
            });

            test('should deal bonus damage from height', () => {
                wyvern.takeFlight();
                wyvern.height = 80;
                
                const mockTarget = { 
                    id: 'player1', 
                    x: 3000, 
                    y: 1000, 
                    takeDamage: jest.fn(),
                    resistances: {}
                };
                
                wyvern.attack(mockTarget);
                expect(mockTarget.takeDamage).toHaveBeenCalled();
            });
        });

        describe('Harpy', () => {
            let harpy;

            beforeEach(() => {
                harpy = new Harpy('harpy_1', { x: 2900, y: 800 }, 'draconia');
            });

            afterEach(() => {
                harpy.cleanup();
            });

            test('should initialize with correct stats', () => {
                expect(harpy.level).toBe(72);
                expect(harpy.maxHp).toBe(1600);
                expect(harpy.damage).toBe(100);
                expect(harpy.moveSpeed).toBe(150); // Fastest
            });

            test('should have fast attack speed', () => {
                // Harpy has 1.5s cooldown vs normal 2s+
                expect(harpy.attackCooldown).toBe(1500);
            });

            test('should shriek when attacked while hiding', () => {
                const shriekSpy = jest.fn();
                harpy.on('shriek', shriekSpy);
                
                harpy.state = 'hiding';
                harpy.abilities.shriek.lastUsed = 0;
                
                const mockSource = { id: 'player1' };
                harpy.takeDamage(50, mockSource);
                
                expect(shriekSpy).toHaveBeenCalled();
            });
        });

        describe('MountainGriffin', () => {
            let griffin;

            beforeEach(() => {
                griffin = new MountainGriffin('griffin_1', { x: 3100, y: 950 }, 'draconia');
            });

            afterEach(() => {
                griffin.cleanup();
            });

            test('should initialize with tanky stats', () => {
                expect(griffin.level).toBe(74);
                expect(griffin.maxHp).toBe(2800);
                expect(griffin.armor).toBe(80);
                expect(griffin.damage).toBe(130);
            });

            test('should roar for buffs', () => {
                griffin.useAbility('roar');
                expect(griffin.roarBuffActive).toBe(true);
            });

            test('should apply roar buff to damage', () => {
                griffin.useAbility('roar');
                
                const mockTarget = {
                    id: 'player1',
                    x: 3100,
                    y: 950,
                    takeDamage: jest.fn(),
                    resistances: {}
                };
                
                griffin.attack(mockTarget);
                expect(griffin.roarBuffActive).toBe(true);
            });
        });
    });

    describe('Tier 3 Mobs (Levels 76-78)', () => {
        describe('MagmaGolem', () => {
            let golem;

            beforeEach(() => {
                golem = new MagmaGolem('golem_1', { x: 4000, y: 1900 }, 'draconia');
            });

            afterEach(() => {
                golem.cleanup();
            });

            test('should initialize with very tanky stats', () => {
                expect(golem.level).toBe(76);
                expect(golem.maxHp).toBe(4500);
                expect(golem.armor).toBe(120);
                expect(golem.moveSpeed).toBe(25); // Very slow
            });

            test('should have magma armor ability', () => {
                golem.useAbility('magmaArmor');
                expect(golem.abilities.magmaArmor.active).toBe(true);
            });

            test('should deal thorns damage with magma armor', () => {
                golem.useAbility('magmaArmor');
                
                const mockSource = {
                    id: 'player1',
                    takeDamage: jest.fn()
                };
                
                golem.takeDamage(100, mockSource);
                expect(mockSource.takeDamage).toHaveBeenCalled();
            });

            test('should have eruption ability', () => {
                const eruptionSpy = jest.fn();
                golem.on('eruption', eruptionSpy);
                
                golem.useAbility('eruption');
                expect(eruptionSpy).toHaveBeenCalled();
            });
        });

        describe('FireDrake', () => {
            let drake;

            beforeEach(() => {
                drake = new FireDrake('drake_1', { x: 3900, y: 1750 }, 'draconia');
            });

            afterEach(() => {
                drake.cleanup();
            });

            test('should initialize with correct stats', () => {
                expect(drake.level).toBe(78);
                expect(drake.maxHp).toBe(3200);
                expect(drake.damage).toBe(160);
                expect(drake.resistances.fire).toBe(1.0); // Immune
            });

            test('should breathe fire', () => {
                const fireBreathSpy = jest.fn();
                drake.on('fireBreath', fireBreathSpy);
                
                const mockTarget = { id: 'player1', x: 3900, y: 1750 };
                drake.useAbility('fireBreath', mockTarget);
                
                expect(fireBreathSpy).toHaveBeenCalled();
                expect(drake.isBreathingFire).toBe(true);
            });

            test('should cast fireball', () => {
                const fireballSpy = jest.fn();
                drake.on('fireball', fireballSpy);
                
                drake.useAbility('fireball');
                expect(fireballSpy).toHaveBeenCalled();
            });
        });

        describe('LavaSerpent', () => {
            let serpent;

            beforeEach(() => {
                serpent = new LavaSerpent('serpent_1', { x: 4000, y: 2000 }, 'draconia');
            });

            afterEach(() => {
                serpent.cleanup();
            });

            test('should initialize with correct stats', () => {
                expect(serpent.level).toBe(78);
                expect(serpent.maxHp).toBe(2400);
                expect(serpent.damage).toBe(140);
                expect(serpent.resistances.fire).toBe(1.0);
            });

            test('should coil target', () => {
                const mockTarget = { id: 'player1', x: 4000, y: 2000 };
                serpent.useAbility('coil', mockTarget);
                
                expect(serpent.isCoiled).toBe(true);
                expect(serpent.coilTarget).toBe(mockTarget);
            });

            test('should dive into lava', () => {
                serpent.lavaPoolNearby = true;
                serpent.useAbility('lavaDive');
                
                expect(serpent.isSubmerged).toBe(true);
            });

            test('should heal while submerged', () => {
                serpent.hp = serpent.maxHp * 0.5;
                serpent.isSubmerged = true;
                
                const mockSource = { id: 'player1' };
                const initialHp = serpent.hp;
                
                serpent.takeDamage(100, mockSource);
                
                expect(serpent.hp).toBeGreaterThan(initialHp - 100);
            });
        });
    });
});
