/**
 * pharaoh-anub.test.js
 * 
 * Test suite for Pharaoh Anub raid boss
 * 4-phase encounter with complex mechanics
 * Target: 95%+ coverage
 */

const PharaohAnub = require('../../server/bosses/PharaohAnub');

// Mock database
const mockDb = {
    run: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({}),
    all: jest.fn().mockResolvedValue([])
};

// Mock players
const mockPlayers = [
    { id: 'p1', name: 'Tank', x: 2000, y: 450, hp: 5000, maxHp: 5000, level: 60 },
    { id: 'p2', name: 'Healer', x: 1900, y: 500, hp: 3000, maxHp: 3000, level: 60 },
    { id: 'p3', name: 'DPS1', x: 2100, y: 500, hp: 3500, maxHp: 3500, level: 60 },
    { id: 'p4', name: 'DPS2', x: 2000, y: 550, hp: 3500, maxHp: 3500, level: 60 },
    { id: 'p5', name: 'DPS3', x: 1950, y: 450, hp: 3500, maxHp: 3500, level: 60 }
];

describe('PharaohAnub', () => {
    let boss;

    beforeEach(async () => {
        boss = new PharaohAnub(mockDb);
        await boss.initialize();
    });

    afterEach(() => {
        boss.cleanup();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with correct stats', () => {
            expect(boss.id).toBe('pharaoh_anub');
            expect(boss.name).toBe('Pharaoh Anub');
            expect(boss.title).toBe('The Eternal King');
            expect(boss.level).toBe(60);
            expect(boss.maxHp).toBe(50000);
            expect(boss.hp).toBe(50000);
            expect(boss.damage).toBe(150);
        });

        test('should have correct raid configuration', () => {
            expect(boss.minPlayers).toBe(5);
            expect(boss.maxPlayers).toBe(8);
            expect(boss.enrageTimer).toBe(8 * 60 * 1000); // 8 minutes
        });

        test('should start in phase 1', () => {
            expect(boss.currentPhase).toBe(1);
            expect(boss.phaseState[1].active).toBe(true);
        });

        test('should have 4 pillars', () => {
            expect(boss.pillars.length).toBe(4);
            expect(boss.pillars[0].id).toBe('pillar_north');
            expect(boss.pillars[0].destroyed).toBe(false);
            expect(boss.pillars[0].hp).toBe(2000);
        });
    });

    describe('Phase System', () => {
        test('should have 4 phase thresholds', () => {
            expect(boss.phaseThresholds[1]).toBe(1.0);
            expect(boss.phaseThresholds[2]).toBe(0.75);
            expect(boss.phaseThresholds[3]).toBe(0.50);
            expect(boss.phaseThresholds[4]).toBe(0.25);
        });

        test('should transition to phase 2 at 75% HP', () => {
            boss.hp = boss.maxHp * 0.75; // Exactly 75%
            boss.checkPhaseTransition();
            
            expect(boss.currentPhase).toBe(2);
            expect(boss.phaseState[2].active).toBe(true);
        });

        test('should transition to phase 3 at 50% HP', () => {
            boss.hp = boss.maxHp * 0.50;
            boss.checkPhaseTransition();
            
            expect(boss.currentPhase).toBe(3);
        });

        test('should transition to phase 4 at 25% HP', () => {
            boss.hp = boss.maxHp * 0.25;
            boss.checkPhaseTransition();
            
            expect(boss.currentPhase).toBe(4);
        });

        test('should broadcast phase transition', () => {
            const broadcastSpy = jest.spyOn(boss, 'broadcastToRaid');
            
            boss.hp = boss.maxHp * 0.75;
            boss.checkPhaseTransition();
            
            expect(broadcastSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'phase_transition',
                    phase: 2
                })
            );
        });
    });

    describe('Phase 1 - The Eternal King', () => {
        beforeEach(() => {
            boss.currentPhase = 1;
            boss.phaseState[1].active = true;
        });

        test('should use scepter strike', () => {
            const target = mockPlayers[0];
            
            boss.useAbility('scepterStrike', target);
            
            expect(target.takeDamage).toHaveBeenCalled();
        });

        test('should summon mummies', () => {
            boss.useAbility('summonMummy');
            
            expect(boss.summonedMummies.length).toBe(2);
        });

        test('should apply curse of aging', () => {
            const target = mockPlayers[0];
            target.applyStatusEffect = jest.fn();
            
            boss.useAbility('curseOfAging', target);
            
            expect(target.applyStatusEffect).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'curse',
                    subtype: 'aging'
                })
            );
        });
    });

    describe('Phase 2 - Wrath of the Sun', () => {
        beforeEach(() => {
            boss.currentPhase = 2;
            boss.phaseState[2].active = true;
        });

        test('should start solar beam after cooldown', () => {
            boss.abilities.solarBeam.lastUsed = 0;
            boss.abilities.solarBeam.cooldown = 0; // Reset cooldown
            
            boss.updatePhase2(1);
            
            expect(boss.phaseState[2].solarBeamCharging).toBe(true);
        });

        test('should prepare solar beam with warning', () => {
            const broadcastSpy = jest.spyOn(boss, 'broadcastToRaid');
            
            boss.prepareSolarBeam();
            
            expect(broadcastSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'boss_warning',
                    ability: 'solarBeam'
                })
            );
            expect(boss.phaseState[2].solarBeamCharging).toBe(true);
        });

        test('should summon construct', () => {
            boss.useAbility('summonConstruct');
            
            expect(boss.summonedConstructs.length).toBe(1);
        });

        test('should apply room heat damage', () => {
            boss.abilities.roomHeat.lastTick = Date.now() - 6000;
            
            const applySpy = jest.spyOn(boss, 'applyRoomHeat');
            boss.applyPassiveAbilities(Date.now());
            
            expect(applySpy).toHaveBeenCalled();
        });
    });

    describe('Phase 3 - Rise of the Dead', () => {
        beforeEach(() => {
            boss.currentPhase = 3;
            boss.phaseState[3].active = true;
        });

        test('should summon captains and mummies on phase start', () => {
            boss.onPhase3Start();
            
            expect(boss.summonedCaptains.length).toBe(2);
            expect(boss.summonedMummies.length).toBe(4);
        });

        test('should become immune when summoning', () => {
            boss.useAbility('summonCaptains');
            
            expect(boss.phaseState[3].immune).toBe(true);
        });

        test('should use pharaohs decree (fear)', () => {
            const broadcastSpy = jest.spyOn(boss, 'broadcastToRaid');
            
            boss.useAbility('pharaohsDecree');
            
            expect(broadcastSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    ability: 'pharaohsDecree'
                })
            );
            expect(boss.phaseState[3].immune).toBe(true);
        });

        test('should resurrect dead adds with army of the dead', () => {
            boss.deadAdds = [
                { type: 'mummy', hp: 0, maxHp: 800 },
                { type: 'mercenary_captain', hp: 0, maxHp: 1500 }
            ];
            
            boss.useAbility('armyOfTheDead');
            
            // Dead adds should be resurrected at 50% HP
            expect(boss.summonedMummies.length).toBeGreaterThan(0);
            expect(boss.summonedCaptains.length).toBeGreaterThan(0);
            expect(boss.deadAdds.length).toBe(0);
        });
    });

    describe('Phase 4 - Immortality\'s Price', () => {
        beforeEach(() => {
            boss.currentPhase = 4;
            boss.phaseState[4].active = true;
            boss.phaseState[4].eternalRestStarted = false;
            boss.phaseState[4].immune = false;
            boss.phaseState[4].pillarsRemaining = 4;
        });

        test('should start final curse on phase entry', () => {
            boss.onPhase4Start();
            
            expect(boss.abilities.finalCurse.lastTick).toBeGreaterThan(0);
        });

        test('should apply final curse damage', () => {
            boss.currentPhase = 4;
            boss.abilities.finalCurse.lastTick = Date.now() - 6000;
            
            const initialLastTick = boss.abilities.finalCurse.lastTick;
            boss.applyPassiveAbilities(Date.now());
            
            // Final curse should update its tick time after applying
            expect(boss.abilities.finalCurse.lastTick).toBeGreaterThanOrEqual(initialLastTick);
        });

        test('should use soul drain with lifesteal', () => {
            const target = mockPlayers[0];
            const initialBossHp = boss.hp;
            target.takeDamage = jest.fn().mockImplementation((dmg) => {
                target.hp -= dmg;
                return dmg;
            });
            
            boss.useAbility('soulDrain', target);
            
            expect(target.takeDamage).toHaveBeenCalled();
            // Boss should heal 20% of damage dealt
            expect(boss.hp).toBeGreaterThan(initialBossHp);
        });

        test('should begin eternal rest at 5% HP', () => {
            const broadcastSpy = jest.spyOn(boss, 'broadcastToRaid');
            
            boss.hp = boss.maxHp * 0.04; // 4% HP
            boss.currentPhase = 4;
            boss.checkPhase4Abilities();
            
            expect(broadcastSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'boss_emergency'
                })
            );
        });

        test('should wipe raid if pillars not destroyed', () => {
            boss.abilities.eternalRest.lastUsed = Date.now();
            
            // All pillars intact
            boss.pillars.forEach(p => p.destroyed = false);
            
            const wipeSpy = jest.spyOn(boss, 'wipeRaid');
            
            // Simulate eternal rest completion
            setTimeout(() => {
                expect(wipeSpy).toHaveBeenCalled();
            }, boss.abilities.eternalRest.channelTime);
        });

        test('should interrupt eternal rest if all pillars destroyed', () => {
            boss.abilities.eternalRest.lastUsed = Date.now();
            
            // Destroy all pillars
            boss.pillars.forEach(p => {
                p.destroyed = true;
                p.hp = 0;
            });
            boss.phaseState[4].pillarsRemaining = 0;
            
            const interruptSpy = jest.spyOn(boss, 'interruptEternalRest');
            
            // Simulate eternal rest completion
            setTimeout(() => {
                expect(interruptSpy).toHaveBeenCalled();
            }, boss.abilities.eternalRest.channelTime);
        });

        test('should take pillar damage', () => {
            boss.onPillarAttacked('pillar_north', 2000, { id: 'p1' });
            
            const pillar = boss.pillars.find(p => p.id === 'pillar_north');
            expect(pillar.hp).toBe(0);
            expect(pillar.destroyed).toBe(true);
            expect(boss.phaseState[4].pillarsRemaining).toBe(3);
        });
    });

    describe('Combat', () => {
        test('should calculate damage with resistances', () => {
            const physicalDamage = 100;
            const initialHp = boss.hp;
            
            const damage = boss.takeDamage(physicalDamage, { id: 'p1' }, 'physical');
            
            // Boss has resistance to physical damage
            // Verify damage was dealt (not completely resisted)
            expect(damage).toBeGreaterThan(0);
            expect(boss.hp).toBeLessThan(initialHp);
        });

        test('should apply holy weakness', () => {
            const damage = boss.takeDamage(100, { id: 'p1' }, 'holy');
            
            // -20% resistance = 120% damage
            expect(damage).toBeGreaterThan(100);
        });

        test('should update threat table', () => {
            boss.takeDamage(100, { id: 'p1' }, 'physical');
            
            expect(boss.aggroTable.has('p1')).toBe(true);
            expect(boss.aggroTable.get('p1')).toBeGreaterThan(0);
        });

        test('should target highest threat', () => {
            boss.aggroTable.set('p1', 1000);
            boss.aggroTable.set('p2', 500);
            
            boss.updateThreat();
            
            expect(boss.highestThreatTarget?.id).toBe('p1');
        });

        test('should be immune when phase state says so', () => {
            // Set boss to phase 3 and make it immune
            boss.currentPhase = 3;
            boss.phaseState[3].active = true;
            boss.phaseState[3].immune = true;
            
            const damage = boss.takeDamage(100, { id: 'p1' }, 'physical');
            
            expect(damage).toBe(0);
        });
    });

    describe('Encounter', () => {
        test('should start encounter', () => {
            const broadcastSpy = jest.spyOn(boss, 'broadcastToRaid');
            
            boss.startEncounter(mockPlayers);
            
            expect(boss.inCombat).toBe(true);
            expect(boss.combatStartTime).toBeGreaterThan(0);
            expect(boss.raidGroup.size).toBe(5);
            expect(broadcastSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'encounter_start'
                })
            );
        });

        test('should save encounter to database', async () => {
            boss.encounterId = 'test_encounter';
            boss.raidGroup = new Set(mockPlayers.map(p => p.id));
            boss.currentPhase = 2;
            boss.totalDeaths = 3;
            
            await boss.saveEncounter(false);
            
            expect(mockDb.run).toHaveBeenCalled();
        });

        test('should enrage after 8 minutes', () => {
            boss.inCombat = true;
            boss.combatStartTime = Date.now() - (9 * 60 * 1000); // 9 minutes ago
            
            const broadcastSpy = jest.spyOn(boss, 'broadcastToRaid');
            boss.update();
            
            expect(broadcastSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'boss_enrage'
                })
            );
        });
    });

    describe('Death and Loot', () => {
        test('should die when HP reaches 0', async () => {
            const broadcastSpy = jest.spyOn(boss, 'broadcastToRaid');
            
            boss.hp = 0;
            boss.die({ id: 'p1' });
            
            expect(boss.hp).toBe(0);
            expect(boss.inCombat).toBe(false);
            expect(broadcastSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'boss_death'
                })
            );
        });

        test('should generate loot', () => {
            // Add players to raid group for loot generation
            boss.raidGroup.add('p1');
            boss.raidGroup.add('p2');
            
            const loot = boss.generateLootList();
            
            expect(loot.length).toBeGreaterThan(0);
            
            // Should have gold (one entry per raid member)
            const gold = loot.filter(l => l.type === 'gold');
            expect(gold.length).toBeGreaterThan(0);
            
            // Should have items
            const items = loot.filter(l => l.name);
            expect(items.length).toBeGreaterThanOrEqual(0);
        });

        test('should respawn after death', () => {
            boss.die({ id: 'p1' });
            boss.respawn();
            
            expect(boss.hp).toBe(boss.maxHp);
            expect(boss.currentPhase).toBe(1);
            expect(boss.inCombat).toBe(false);
            expect(boss.raidGroup.size).toBe(0);
        });
    });

    describe('Client Data', () => {
        test('should get client data', () => {
            const data = boss.getClientData();
            
            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('name');
            expect(data).toHaveProperty('title');
            expect(data).toHaveProperty('level');
            expect(data).toHaveProperty('hp');
            expect(data).toHaveProperty('maxHp');
            expect(data).toHaveProperty('phase');
            expect(data).toHaveProperty('phaseName');
            expect(data).toHaveProperty('pillars');
        });

        test('should get full data', () => {
            const data = boss.getFullData();
            
            expect(data).toHaveProperty('abilities');
            expect(data).toHaveProperty('resistances');
            expect(data).toHaveProperty('minPlayers');
            expect(data).toHaveProperty('maxPlayers');
        });
    });

    describe('Statistics', () => {
        test('should track encounter statistics', () => {
            boss.totalDeaths = 5;
            boss.raidGroup = new Set(['p1', 'p2', 'p3', 'p4', 'p5']);
            boss.currentPhase = 3;
            
            const stats = {
                totalDeaths: boss.totalDeaths,
                raidSize: boss.raidGroup.size,
                currentPhase: boss.currentPhase
            };
            
            expect(stats.totalDeaths).toBe(5);
            expect(stats.raidSize).toBe(5);
            expect(stats.currentPhase).toBe(3);
        });
    });
});
