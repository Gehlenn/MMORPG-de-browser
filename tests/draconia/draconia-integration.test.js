/**
 * Draconia Integration Test Suite
 * Tests for the main integration system
 */

const DraconiaIntegration = require('../../server/zones/DraconiaIntegration');

describe('DraconiaIntegration', () => {
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

        integration = new DraconiaIntegration(mockDb, mockServer);
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
            expect(integration.zone.initialized).toBe(true);
        });

        test('should initialize environment system', () => {
            expect(integration.environment).toBeDefined();
            expect(integration.environment.initialized).toBe(true);
        });

        test('should setup spawn configurations', () => {
            expect(Object.keys(integration.spawnConfigs)).toHaveLength(9);
            expect(integration.spawnConfigs).toHaveProperty('magma_crab');
            expect(integration.spawnConfigs).toHaveProperty('frost_wolf');
            expect(integration.spawnConfigs).toHaveProperty('wyvern');
            expect(integration.spawnConfigs).toHaveProperty('fire_drake');
        });
    });

    describe('Mob Spawning', () => {
        test('should spawn initial mob packs', () => {
            // Should have spawned mobs from all configs
            expect(integration.spawnedMobs.size).toBeGreaterThan(0);
        });

        test('should assign correct sub-zones to mobs', () => {
            for (const [mobId, mob] of integration.spawnedMobs) {
                const mobType = mobId.split('_')[0];
                const config = integration.spawnConfigs[mobType];
                if (config) {
                    expect(mob.subZone).toBe(config.subZone);
                }
            }
        });

        test('should handle mob death and schedule respawn', () => {
            const initialCount = integration.spawnedMobs.size;
            
            // Get first mob
            const [firstMobId, firstMob] = integration.spawnedMobs.entries().next().value;
            
            // Simulate death
            integration.handleMobDeath(firstMobId, firstMob.type);
            
            expect(integration.spawnedMobs.has(firstMobId)).toBe(false);
        });
    });

    describe('Boss Management', () => {
        test('should track boss cooldown', () => {
            expect(integration.bossCooldown).toBe(7 * 24 * 60 * 60 * 1000); // 7 days
            expect(integration.bossSpawned).toBe(false);
        });

        test('should check player access to boss area', () => {
            const lowLevelPlayer = { x: 4500, y: 4500, level: 50 };
            expect(integration.canPlayerAccessBoss('player1', lowLevelPlayer)).toBe(false);

            const highLevelPlayer = { x: 4500, y: 4500, level: 65 };
            expect(integration.canPlayerAccessBoss('player2', highLevelPlayer)).toBe(true);
        });

        test('should spawn boss when ready', () => {
            integration.lastBossKill = null;
            
            const result = integration.spawnBossIfReady();
            
            expect(result).toBe(true);
            expect(integration.bossSpawned).toBe(true);
            expect(integration.boss).toBeDefined();
        });

        test('should not spawn boss if on cooldown', () => {
            integration.lastBossKill = Date.now() - (3 * 24 * 60 * 60 * 1000); // 3 days ago
            
            const result = integration.spawnBossIfReady();
            
            expect(result).toBe(false);
            expect(integration.bossSpawned).toBe(false);
        });

        test('should broadcast boss spawn to zone', () => {
            integration.lastBossKill = null;
            integration.spawnBossIfReady();
            
            expect(mockServer.broadcastToZone).toHaveBeenCalledWith(
                'draconia',
                'boss_spawned',
                expect.any(Object)
            );
        });
    });

    describe('Player Management', () => {
        test('should register players in zone', async () => {
            const playerData = { x: 400, y: 400, level: 65 };
            const result = await integration.registerPlayer('player1', playerData);
            
            expect(integration.zone.players.has('player1')).toBe(true);
        });

        test('should unregister players', async () => {
            await integration.registerPlayer('player1', { x: 400, y: 400, level: 65 });
            await integration.unregisterPlayer('player1');
            
            expect(integration.zone.players.has('player1')).toBe(false);
        });

        test('should send zone data on player enter', () => {
            integration.handlePlayerEnter('player1', { x: 400, y: 400, level: 65 });
            
            expect(mockServer.sendToPlayer).toHaveBeenCalledWith(
                'player1',
                'zone_data',
                expect.any(Object)
            );
        });
    });

    describe('Event Broadcasting', () => {
        test('should broadcast weather changes', () => {
            const weatherData = { type: 'ash_storm', intensity: 1.0 };
            integration.environment.emit('weatherChange', weatherData);
            
            expect(mockServer.broadcastToZone).toHaveBeenCalledWith(
                'draconia',
                'weather_update',
                weatherData
            );
        });

        test('should broadcast environmental hazards', () => {
            const hazardData = { x: 1500, y: 1000, direction: { x: 1, y: 0 } };
            integration.environment.emit('avalanche', hazardData);
            
            expect(mockServer.broadcastToZone).toHaveBeenCalledWith(
                'draconia',
                'environment_hazard',
                expect.objectContaining({ type: 'avalanche' })
            );
        });
    });

    describe('Statistics', () => {
        test('should get mob counts by type', () => {
            const counts = integration.getMobCountsByType();
            
            expect(typeof counts).toBe('object');
            Object.keys(counts).forEach(type => {
                expect(typeof counts[type]).toBe('number');
                expect(counts[type]).toBeGreaterThanOrEqual(0);
            });
        });

        test('should get mobs by sub-zone', () => {
            const byZone = integration.getMobsBySubZone();
            
            expect(typeof byZone).toBe('object');
        });

        test('should get full zone statistics', () => {
            const stats = integration.getStatistics();
            
            expect(stats).toHaveProperty('zone');
            expect(stats).toHaveProperty('environment');
            expect(stats).toHaveProperty('mobs');
            expect(stats).toHaveProperty('boss');
            
            expect(stats.mobs).toHaveProperty('totalSpawned');
            expect(stats.boss).toHaveProperty('spawned');
            expect(stats.boss).toHaveProperty('nextSpawnAvailable');
        });
    });

    describe('Zone Data Export', () => {
        test('should export full zone data', () => {
            const data = integration.getZoneData();
            
            expect(data).toHaveProperty('zone');
            expect(data).toHaveProperty('environment');
            expect(data).toHaveProperty('mobs');
            expect(data).toHaveProperty('boss');
            expect(data).toHaveProperty('bossAvailable');
        });

        test('should indicate boss availability correctly', () => {
            integration.lastBossKill = null;
            
            let data = integration.getZoneData();
            expect(data.bossAvailable).toBe(true);

            integration.lastBossKill = Date.now();
            data = integration.getZoneData();
            expect(data.bossAvailable).toBe(false);
        });
    });

    describe('Cleanup', () => {
        test('should clean up all systems', () => {
            integration.cleanup();
            
            expect(integration.spawnedMobs.size).toBe(0);
            expect(integration.mobs.size).toBe(0);
        });
    });
});
