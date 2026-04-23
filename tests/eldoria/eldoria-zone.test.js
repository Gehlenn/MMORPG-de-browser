/**
 * Eldoria Zone Test Suite
 * Tests for EldoriaZone, EldoriaEnvironment, and ZoneTransition
 */

const EldoriaZone = require('../../server/zones/EldoriaZone');
const EldoriaEnvironment = require('../../server/zones/EldoriaEnvironment');
const ZoneTransition = require('../../server/zones/ZoneTransition');

describe('Eldoria Zone System', () => {
    let mockDb;
    let zone;
    let environment;
    let transition;

    beforeEach(async () => {
        mockDb = {
            run: jest.fn().mockResolvedValue({ lastID: 1 }),
            all: jest.fn().mockResolvedValue([]),
            get: jest.fn().mockResolvedValue(null)
        };

        zone = new EldoriaZone(mockDb, null, null);
        await zone.initialize();
    });

    afterEach(() => {
        if (zone) zone.cleanup();
        if (environment) environment.cleanup();
        if (transition) transition.cleanup();
        jest.clearAllTimers();
    });

    describe('EldoriaZone', () => {
        test('should initialize with correct configuration', () => {
            expect(zone.config.id).toBe('eldoria');
            expect(zone.config.name).toBe('Eldoria - The Central Kingdom');
            expect(zone.config.levelRange).toEqual({ min: 20, max: 40 });
            expect(zone.config.size).toEqual({ width: 2000, height: 1500 });
        });

        test('should have Eldoria City as safe zone', () => {
            const safeZone = zone.config.safeZones[0];
            expect(safeZone.name).toBe('Eldoria City');
            expect(safeZone.x).toBe(1000);
            expect(safeZone.y).toBe(750);
            expect(safeZone.radius).toBe(200);
        });

        test('should have sub-zones configured', () => {
            expect(zone.config.subZones.length).toBeGreaterThanOrEqual(3);
            const subZoneNames = zone.config.subZones.map(sz => sz.name);
            expect(subZoneNames).toContain('Royal Forest');
            expect(subZoneNames).toContain('Iron Mines');
            expect(subZoneNames).toContain('Castle Grounds');
        });

        test('should track player enter and leave', () => {
            zone.playerEnter('player1', { x: 1000, y: 750 });
            expect(zone.activePlayers.has('player1')).toBe(true);
            
            zone.playerLeave('player1');
            expect(zone.activePlayers.has('player1')).toBe(false);
        });

        test('should have valid spawn points', () => {
            expect(zone.config.spawnPoints).toBeDefined();
            expect(zone.config.spawnPoints.newPlayers).toBeDefined();
            expect(zone.config.spawnPoints.fromVerdantis).toBeDefined();
        });

        test('should have safe zones configured', () => {
            expect(zone.config.safeZones).toBeDefined();
            expect(zone.config.safeZones.length).toBeGreaterThan(0);
            expect(zone.config.safeZones[0].name).toBe('Eldoria City');
        });

        test('should have level range configured', () => {
            expect(zone.config.levelRange).toBeDefined();
            expect(zone.config.levelRange.min).toBe(20);
            expect(zone.config.levelRange.max).toBe(40);
        });
    });

    describe('EldoriaEnvironment', () => {
        beforeEach(async () => {
            environment = new EldoriaEnvironment(mockDb, zone);
            await environment.initialize();
        });

        test('should initialize environmental systems', () => {
            expect(environment.features.streams.length).toBeGreaterThan(0);
            expect(environment.features.campfires.length).toBeGreaterThan(0);
            expect(environment.initialized).toBe(true);
        });

        test('should have weather cycle', () => {
            expect(environment.weather.current).toBeDefined();
            expect(environment.weather.nextChange).toBeGreaterThan(Date.now());
        });

        test('should get current weather data', () => {
            const weatherData = environment.getWeatherData();
            expect(weatherData).toHaveProperty('type');
            expect(weatherData).toHaveProperty('intensity');
            expect(weatherData).toHaveProperty('timeRemaining');
        });

        test('should detect stream proximity', () => {
            // Near first stream
            expect(environment.isNearStream(200, 300)).toBe(true);
            
            // Far from streams
            expect(environment.isNearStream(1500, 1200)).toBe(false);
        });

        test('should detect fog areas', () => {
            // In Iron Mines fog area
            expect(environment.isInFogArea(1200, 400)).toBe(true);
            
            // Outside fog
            expect(environment.isInFogArea(500, 500)).toBe(false);
        });

        test('should light and extinguish campfires', () => {
            const initialLitCount = environment.features.campfires.filter(c => c.lit).length;
            
            environment.extinguishCampfire(0);
            expect(environment.features.campfires[0].lit).toBe(false);
            
            environment.lightCampfire(0);
            expect(environment.features.campfires[0].lit).toBe(true);
        });

        test('should get ambient effects for positions', () => {
            const royalForestAmbient = environment.getAmbientForPosition(300, 400);
            expect(royalForestAmbient.birds || royalForestAmbient.wind).toBeDefined();
        });
    });

    describe('ZoneTransition', () => {
        test('should have portals configured', () => {
            expect(zone.config.portals).toBeDefined();
            expect(zone.config.portals.length).toBeGreaterThan(0);
        });
    });
});
