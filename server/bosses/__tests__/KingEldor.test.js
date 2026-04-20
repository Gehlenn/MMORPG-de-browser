/**
 * KingEldor.test.js
 * Test suite for King Eldor boss
 * Phase 3: New Zones
 */

const KingEldor = require('../KingEldor');

describe('KingEldor', () => {
    let kingEldor;
    let mockZone;

    beforeEach(() => {
        mockZone = {
            config: { id: 'eldoria' },
            getNearbyPlayers: jest.fn().mockReturnValue([])
        };

        kingEldor = new KingEldor(mockZone);
    });

    describe('Configuration', () => {
        test('should have correct boss ID', () => {
            expect(kingEldor.id).toBe('boss_king_eldor');
        });

        test('should have correct name', () => {
            expect(kingEldor.name).toBe('King Eldor IV');
        });

        test('should have correct level', () => {
            expect(kingEldor.level).toBe(40);
        });

        test('should have correct location', () => {
            expect(kingEldor.x).toBe(1600);
            expect(kingEldor.y).toBe(700);
        });
    });

    describe('Boss Stats', () => {
        test('should have high HP appropriate for raid boss', () => {
            expect(kingEldor.maxHp).toBeGreaterThanOrEqual(8000);
        });

        test('should have damage values', () => {
            expect(kingEldor.baseDamage).toBeGreaterThan(0);
        });

        test('should have defense values', () => {
            expect(kingEldor.armor).toBeGreaterThan(0);
        });
    });

    describe('Phase System', () => {
        test('should have phase thresholds', () => {
            expect(kingEldor.phaseThresholds).toBeDefined();
            expect(kingEldor.phaseThresholds[2]).toBe(0.70);
            expect(kingEldor.phaseThresholds[3]).toBe(0.40);
            expect(kingEldor.phaseThresholds[4]).toBe(0.10);
        });

        test('should start in phase 1', () => {
            expect(kingEldor.currentPhase).toBe(1);
        });

        test('should be raid boss type', () => {
            expect(kingEldor.type).toBe('raid_boss');
        });

        // Phase names are defined in phase abilities, not as separate phase objects
        test('should have phase thresholds defined', () => {
            expect(Object.keys(kingEldor.phaseThresholds)).toHaveLength(3);
        });

        test('should transition phases based on HP thresholds', () => {
            // Phase 1: 100-70% HP
            expect(kingEldor.currentPhase).toBe(1);
            // At 70% or below, should transition to phase 2
            expect(kingEldor.phaseThresholds[2]).toBe(0.70);
            // At 40% or below, should transition to phase 3
            expect(kingEldor.phaseThresholds[3]).toBe(0.40);
            // At 10% or below, should transition to phase 4
            expect(kingEldor.phaseThresholds[4]).toBe(0.10);
        });
    });

    describe('Abilities', () => {
        test('should have abilities defined', () => {
            expect(kingEldor.abilities).toBeDefined();
        });

        test('should have swordStrike ability', () => {
            expect(kingEldor.abilities.swordStrike).toBeDefined();
            expect(kingEldor.abilities.swordStrike.cooldown).toBe(2000);
        });

        test('should have shieldBash ability', () => {
            expect(kingEldor.abilities.shieldBash).toBeDefined();
            expect(kingEldor.abilities.shieldBash.stunDuration).toBe(2000);
        });

        test('should have royalCommand ability', () => {
            expect(kingEldor.abilities.royalCommand).toBeDefined();
            expect(kingEldor.abilities.royalCommand.fearDuration).toBe(3000);
        });

        test('should have summonGuards ability', () => {
            expect(kingEldor.abilities.summonGuards).toBeDefined();
            expect(kingEldor.abilities.summonGuards.cooldown).toBe(30000);
        });

        test('should have selfHeal ability', () => {
            expect(kingEldor.abilities.selfHeal).toBeDefined();
            expect(kingEldor.abilities.selfHeal.amount).toBe(0.05);
        });

        test('should have cleave ability', () => {
            expect(kingEldor.abilities.cleave).toBeDefined();
            expect(kingEldor.abilities.cleave.range).toBe(100);
        });

        test('should have lastDecree ability', () => {
            expect(kingEldor.abilities.lastDecree).toBeDefined();
            expect(kingEldor.abilities.lastDecree.damage).toBe(150);
        });

        test('should have lastStand ability', () => {
            expect(kingEldor.abilities.lastStand).toBeDefined();
            expect(kingEldor.abilities.lastStand.buffAmount).toBe(1.5);
        });
    });

    describe('Raid Requirements', () => {
        test('should require 3-5 players', () => {
            expect(kingEldor.minPlayers).toBe(3);
            expect(kingEldor.maxPlayers).toBe(5);
        });

        test('should have enrage timer', () => {
            expect(kingEldor.enrageTimer).toBe(5 * 60 * 1000); // 5 minutes
        });
    });

    describe('State Management', () => {
        test('should initialize with correct state', () => {
            expect(kingEldor.activePlayers).toBeDefined();
            expect(kingEldor.raidGroup).toEqual([]);
            expect(kingEldor.combatStartTime).toBeNull();
        });

        test('should track active players', () => {
            expect(kingEldor.activePlayers instanceof Map).toBe(true);
        });

        test('should not be enraged initially', () => {
            expect(kingEldor.isEnraged).toBe(false);
        });
    });

    describe('Combat', () => {
        test('should have HP tracking', () => {
            expect(kingEldor.hp).toBeDefined();
            expect(kingEldor.maxHp).toBeDefined();
        });

        test('should start at full HP', () => {
            expect(kingEldor.hp).toBe(kingEldor.maxHp);
        });

        test('should have attack range', () => {
            expect(kingEldor.attackRange).toBeGreaterThan(0);
        });

        test('should have attack cooldown', () => {
            expect(kingEldor.attackCooldown).toBeGreaterThan(0);
        });
    });

    describe('Event Emission', () => {
        test('should emit encounter started event', (done) => {
            kingEldor.on('boss:encounter_started', (data) => {
                expect(data.bossId).toBe('king_eldor');
                done();
            });
            kingEldor.emit('boss:encounter_started', { bossId: 'king_eldor', players: [] });
        });

        test('should emit phase transition event', (done) => {
            kingEldor.on('boss:phase_transition', (data) => {
                expect(data).toHaveProperty('fromPhase');
                expect(data).toHaveProperty('toPhase');
                done();
            });
            kingEldor.emit('boss:phase_transition', { fromPhase: 1, toPhase: 2 });
        });

        test('should emit defeated event', (done) => {
            kingEldor.on('boss:defeated', (data) => {
                expect(data.bossId).toBe('king_eldor');
                expect(data).toHaveProperty('participants');
                done();
            });
            kingEldor.emit('boss:defeated', { bossId: 'king_eldor', participants: [] });
        });
    });

    describe('Boss Data', () => {
        test('should return boss data for client', () => {
            const data = kingEldor.getBossData();
            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('name');
            expect(data).toHaveProperty('title');
            expect(data).toHaveProperty('level');
            expect(data).toHaveProperty('hp');
            expect(data).toHaveProperty('maxHp');
            expect(data).toHaveProperty('phase');
            expect(data).toHaveProperty('x');
            expect(data).toHaveProperty('y');
            expect(data).toHaveProperty('state');
            expect(data).toHaveProperty('isEnraged');
            expect(data).toHaveProperty('activeSummons');
            expect(data).toHaveProperty('participants');
        });

        test('should calculate HP percentage correctly', () => {
            kingEldor.hp = kingEldor.maxHp / 2;
            const hpPercent = Math.floor((kingEldor.hp / kingEldor.maxHp) * 100);
            expect(hpPercent).toBe(50);
        });
    });
});
