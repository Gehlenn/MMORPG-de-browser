/**
 * EldoriaZone.test.js
 * Test suite for Eldoria zone system
 * Phase 3: New Zones
 */

const EldoriaZone = require('../EldoriaZone');

describe('EldoriaZone', () => {
    let eldoriaZone;
    let mockDb;
    let mockMobSpawner;
    let mockLootManager;

    beforeEach(() => {
        mockDb = {
            query: jest.fn()
        };
        mockMobSpawner = {
            registerMob: jest.fn(),
            spawnMob: jest.fn()
        };
        mockLootManager = {
            generateLoot: jest.fn()
        };

        eldoriaZone = new EldoriaZone(mockDb, mockMobSpawner, mockLootManager);
    });

    describe('Configuration', () => {
        test('should have correct zone ID', () => {
            expect(eldoriaZone.config.id).toBe('eldoria');
        });

        test('should have correct name', () => {
            expect(eldoriaZone.config.name).toBe('Eldoria - The Central Kingdom');
        });

        test('should have correct level range', () => {
            expect(eldoriaZone.config.levelRange).toEqual({ min: 20, max: 40 });
        });

        test('should have correct size', () => {
            expect(eldoriaZone.config.size).toEqual({ width: 2000, height: 1500 });
        });

        test('should have safe zone - Eldoria City', () => {
            const safeZone = eldoriaZone.config.safeZones[0];
            expect(safeZone.name).toBe('Eldoria City');
            expect(safeZone.x).toBe(1000);
            expect(safeZone.y).toBe(750);
            expect(safeZone.radius).toBe(200);
        });

        test('should have 3 sub-zones', () => {
            expect(eldoriaZone.config.subZones).toHaveLength(3);
        });

        test('should have Royal Forest sub-zone', () => {
            const forest = eldoriaZone.config.subZones.find(z => z.name === 'Royal Forest');
            expect(forest).toBeDefined();
            expect(forest.levelRange).toEqual({ min: 20, max: 25 });
            expect(forest.mobs).toContain('forest_deer');
            expect(forest.mobs).toContain('wild_boar');
            expect(forest.mobs).toContain('bandit');
        });

        test('should have Iron Mines sub-zone', () => {
            const mines = eldoriaZone.config.subZones.find(z => z.name === 'Iron Mines');
            expect(mines).toBeDefined();
            expect(mines.levelRange).toEqual({ min: 25, max: 30 });
            expect(mines.mobs).toContain('iron_golem');
            expect(mines.isDungeon).toBe(true);
        });

        test('should have Castle Grounds sub-zone', () => {
            const castle = eldoriaZone.config.subZones.find(z => z.name === 'Castle Grounds');
            expect(castle).toBeDefined();
            expect(castle.levelRange).toEqual({ min: 30, max: 35 });
            expect(castle.mobs).toContain('royal_guard');
            expect(castle.mobs).toContain('knight');
        });
    });

    describe('Boss Configuration', () => {
        test('should have King Eldor boss', () => {
            expect(eldoriaZone.config.boss.id).toBe('king_eldor');
            expect(eldoriaZone.config.boss.name).toBe('King Eldor');
        });

        test('should have correct boss position', () => {
            expect(eldoriaZone.config.boss.x).toBe(1600);
            expect(eldoriaZone.config.boss.y).toBe(700);
        });

        test('should have correct boss level', () => {
            expect(eldoriaZone.config.boss.level).toBe(40);
        });

        test('should be raid boss', () => {
            expect(eldoriaZone.config.boss.isRaid).toBe(true);
        });

        test('should have min players requirement', () => {
            expect(eldoriaZone.config.boss.minPlayers).toBe(3);
        });

        test('should have max players requirement', () => {
            expect(eldoriaZone.config.boss.maxPlayers).toBe(5);
        });

        test('should have respawn time', () => {
            expect(eldoriaZone.config.boss.respawnTime).toBe(6 * 60 * 60 * 1000);
        });

        test('should have boss state initialized', () => {
            expect(eldoriaZone.bossState).toBeDefined();
            expect(eldoriaZone.bossState.isSpawned).toBe(false);
            expect(eldoriaZone.bossState.currentHP).toBeNull();
            expect(eldoriaZone.bossState.phase).toBe(1);
        });
    });

    describe('Spawn Points', () => {
        test('should have spawn point for new players', () => {
            expect(eldoriaZone.config.spawnPoints.newPlayers).toEqual({ x: 1000, y: 750 });
        });

        test('should have spawn point from Verdantis', () => {
            expect(eldoriaZone.config.spawnPoints.fromVerdantis).toEqual({ x: 100, y: 750 });
        });
    });

    describe('Helper Methods', () => {
        test('isInSafeZone should return true for safe position', () => {
            const isSafe = eldoriaZone.isInSafeZone(1000, 750);
            expect(isSafe).toBe(true);
        });

        test('isInSafeZone should return false for unsafe position', () => {
            const isSafe = eldoriaZone.isInSafeZone(0, 0);
            expect(isSafe).toBe(false);
        });

        test('getSafeZoneAt should return safe zone at position', () => {
            const safeZone = eldoriaZone.getSafeZoneAt(1000, 750);
            expect(safeZone?.name).toBe('Eldoria City');
        });

        test('getSubZoneAt should return sub-zone for position in Royal Forest', () => {
            const subZone = eldoriaZone.getSubZoneAt(300, 400);
            expect(subZone?.name).toBe('Royal Forest');
        });

        test('getSubZoneAt should return sub-zone for position in Iron Mines', () => {
            // Position at edge of Iron Mines, away from Royal Forest overlap
            const subZone = eldoriaZone.getSubZoneAt(600, 200);
            expect(subZone?.name).toBe('Iron Mines');
        });

        test('getSubZoneAt should return sub-zone for position in Castle Grounds', () => {
            const subZone = eldoriaZone.getSubZoneAt(1500, 600);
            expect(subZone?.name).toBe('Castle Grounds');
        });

        test('isInSubZone should work correctly', () => {
            const forest = eldoriaZone.config.subZones.find(z => z.name === 'Royal Forest');
            const isInForest = eldoriaZone.isInSubZone(300, 400, forest);
            expect(isInForest).toBe(true);
        });
    });

    describe('Event Emission', () => {
        test('should emit mob:spawned event', (done) => {
            eldoriaZone.on('mob:spawned', (data) => {
                expect(data).toBeDefined();
                done();
            });
            eldoriaZone.emit('mob:spawned', { mobId: 'test', type: 'forest_deer' });
        });

        test('should emit boss:spawned event', (done) => {
            eldoriaZone.on('boss:spawned', (data) => {
                expect(data.bossId).toBe('king_eldor');
                done();
            });
            eldoriaZone.emit('boss:spawned', { bossId: 'king_eldor' });
        });
    });
});
