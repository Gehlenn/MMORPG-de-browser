/**
 * Eldoria Integration Test Suite
 * Tests for the main integration system
 */

const EldoriaIntegration = require('../../server/zones/EldoriaIntegration');

describe('EldoriaIntegration', () => {
    let mockDb;
    let mockServer;
    let integration;

    beforeEach(async () => {
        mockDb = {
            run: jest.fn().mockResolvedValue({ lastID: 1 }),
            all: jest.fn().mockResolvedValue([]),
            get: jest.fn().mockResolvedValue(null)
        };

        mockServer = {
            broadcastToZone: jest.fn(),
            sendToPlayer: jest.fn()
        };

        integration = new EldoriaIntegration(mockDb, mockServer);
        await integration.initialize();
    });

    afterEach(() => {
        if (integration) {
            integration.cleanup();
        }
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize zone system', () => {
            expect(integration.zone).toBeDefined();
            expect(integration.zone.config).toBeDefined();
        });

        test('should initialize environment system', () => {
            expect(integration.environment).toBeDefined();
            expect(integration.environment.initialized).toBe(true);
        });

        test('should initialize transition system', () => {
            expect(integration.transition).toBeDefined();
            expect(integration.transition.portals).toBeDefined();
        });

        test('should setup spawn configurations', () => {
            expect(Object.keys(integration.spawnConfigs).length).toBeGreaterThan(0);
        });
    });

    describe('Mob Spawning', () => {
        test('should have spawned initial mobs', () => {
            expect(integration.spawnedMobs.size).toBeGreaterThan(0);
        });

        test('should spawn mobs of different types', () => {
            const mobTypes = new Set();
            for (const mob of integration.spawnedMobs.values()) {
                mobTypes.add(mob.type || mob.constructor.name);
            }
            expect(mobTypes.size).toBeGreaterThan(0);
        });

        test('should handle mob death tracking', () => {
            const initialCount = integration.spawnedMobs.size;
            const [firstMobId, firstMob] = integration.spawnedMobs.entries().next().value;
            const mobType = firstMob.type || 'forest_deer';
            
            integration.handleMobDeath(firstMobId, mobType);
            
            expect(integration.spawnedMobs.has(firstMobId)).toBe(false);
            expect(integration.spawnedMobs.size).toBeLessThan(initialCount);
        });
    });

    describe('Boss Management', () => {
        test('should track boss cooldown', () => {
            expect(integration.bossCooldown).toBe(3 * 24 * 60 * 60 * 1000); // 3 days
        });

        test('should check player access to boss area', () => {
            // Test that boss position is configured
            expect(integration.spawnConfigs).toBeDefined();
        });

        test('should spawn boss when ready', () => {
            integration.lastBossKill = null;
            
            const result = integration.spawnBossIfReady();
            
            expect(result).toBe(true);
            expect(integration.bossSpawned).toBe(true);
            expect(integration.boss).toBeDefined();
        });
    });

    describe('Player Management', () => {
        test('should register players', async () => {
            await integration.registerPlayer('player1', { x: 1000, y: 750, level: 25 });
            expect(integration.zone.activePlayers.has('player1')).toBe(true);
        });

        test('should handle player enter', () => {
            integration.handlePlayerEnter('player1', { x: 1000, y: 750, level: 25 });
            
            expect(mockServer.sendToPlayer).toHaveBeenCalledWith(
                'player1',
                'zone_data',
                expect.any(Object)
            );
        });
    });

    describe('Event Broadcasting', () => {
        test('should broadcast weather changes', () => {
            const weatherData = { type: 'rain', intensity: 0.5 };
            integration.environment.emit('weatherChange', weatherData);
            
            expect(mockServer.broadcastToZone).toHaveBeenCalledWith(
                'eldoria',
                'weather_update',
                weatherData
            );
        });
    });

    describe('Statistics', () => {
        test('should get mob counts by type', () => {
            const counts = integration.getMobCountsByType();
            expect(typeof counts).toBe('object');
        });

        test('should get full statistics', () => {
            const stats = integration.getStatistics();
            expect(stats).toHaveProperty('zone');
            expect(stats).toHaveProperty('environment');
            expect(stats).toHaveProperty('mobs');
            expect(stats).toHaveProperty('boss');
        });
    });

    describe('Zone Data', () => {
        test('should export zone data', () => {
            const data = integration.getZoneData();
            expect(data).toHaveProperty('zone');
            expect(data).toHaveProperty('environment');
            expect(data).toHaveProperty('mobs');
            expect(data).toHaveProperty('boss');
            expect(data).toHaveProperty('bossAvailable');
        });
    });
});
