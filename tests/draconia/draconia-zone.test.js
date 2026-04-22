/**
 * Draconia Zone Test Suite
 * Comprehensive tests for Draconia zone system
 */

const DraconiaZone = require('../../server/zones/DraconiaZone');
const DraconiaEnvironment = require('../../server/zones/DraconiaEnvironment');
const DraconiaIntegration = require('../../server/zones/DraconiaIntegration');
const Dragonforge = require('../../server/crafting/Dragonforge');

describe('Draconia Zone System', () => {
    let mockDb;
    let zone;
    let environment;
    let integration;
    let dragonforge;

    beforeEach(() => {
        mockDb = {
            run: jest.fn().mockResolvedValue({ lastID: 1 }),
            all: jest.fn().mockResolvedValue([]),
            get: jest.fn().mockResolvedValue(null)
        };
    });

    afterEach(() => {
        if (zone) zone.cleanup();
        if (environment) environment.cleanup();
        if (integration) integration.cleanup();
        jest.clearAllMocks();
    });

    describe('DraconiaZone', () => {
        beforeEach(async () => {
            zone = new DraconiaZone(mockDb, null, null);
            await zone.initialize();
        });

        test('should initialize with correct configuration', () => {
            expect(zone.config.id).toBe('draconia');
            expect(zone.config.name).toBe('Dracônia - The Dragon Peaks');
            expect(zone.config.levelRange.min).toBe(60);
            expect(zone.config.levelRange.max).toBe(80);
            expect(zone.config.size.width).toBe(5000);
            expect(zone.config.size.height).toBe(5000);
        });

        test('should have 5 sub-zones defined', () => {
            expect(Object.keys(zone.subZones)).toHaveLength(5);
            expect(zone.subZones).toHaveProperty('dragons_gate');
            expect(zone.subZones).toHaveProperty('frostfire_ridge');
            expect(zone.subZones).toHaveProperty('wyvern_heights');
            expect(zone.subZones).toHaveProperty('volcanic_core');
            expect(zone.subZones).toHaveProperty('peak_of_ancients');
        });

        test('should register and unregister players', async () => {
            const playerData = { x: 400, y: 400, level: 65 };
            await zone.registerPlayer('player1', playerData);
            
            expect(zone.players.has('player1')).toBe(true);
            expect(zone.getPlayerCount()).toBe(1);
            
            await zone.unregisterPlayer('player1');
            expect(zone.players.has('player1')).toBe(false);
            expect(zone.getPlayerCount()).toBe(0);
        });

        test('should validate positions correctly', () => {
            expect(zone.isValidPosition(100, 100)).toBe(true);
            expect(zone.isValidPosition(-10, 100)).toBe(false);
            expect(zone.isValidPosition(100, 5100)).toBe(false);
            expect(zone.isValidPosition(2500, 2500)).toBe(true);
        });

        test('should detect safe zones correctly', () => {
            const safeX = 400;
            const safeY = 400;
            expect(zone.isInSafeZone(safeX, safeY)).toBe(true);
            
            const unsafeX = 1500;
            const unsafeY = 1000;
            expect(zone.isInSafeZone(unsafeX, unsafeY)).toBe(false);
        });

        test('should detect sub-zones at positions', () => {
            expect(zone.getSubZoneAt(400, 400)?.id).toBe('dragons_gate');
            expect(zone.getSubZoneAt(2000, 1500)?.id).toBe('frostfire_ridge');
            expect(zone.getSubZoneAt(3500, 2000)?.id).toBe('wyvern_heights');
            expect(zone.getSubZoneAt(4200, 2400)?.id).toBe('volcanic_core');
            expect(zone.getSubZoneAt(3000, 4500)?.id).toBe('peak_of_ancients');
        });

        test('should check level requirements', () => {
            expect(zone.checkLevelRequirement(70)).toBe(true);
            expect(zone.checkLevelRequirement(55)).toBe(false);
            expect(zone.checkLevelRequirement(85)).toBe(false);
        });

        test('should have portals configured', () => {
            expect(zone.config.portals).toBeDefined();
            expect(zone.config.portals.length).toBeGreaterThan(0);
        });
    });

    describe('DraconiaEnvironment', () => {
        beforeEach(async () => {
            zone = new DraconiaZone(mockDb, null, null);
            await zone.initialize();
            environment = new DraconiaEnvironment(mockDb, zone);
            await environment.initialize();
        });

        test('should initialize environmental systems', () => {
            expect(environment.thermalVents).toHaveLength(5);
            expect(environment.iceFissures).toHaveLength(4);
            expect(environment.lavaRivers).toHaveLength(2);
            expect(environment.initialized).toBe(true);
        });

        test('should track player altitude sickness', () => {
            zone.registerPlayer('player1', { x: 1500, y: 1000, level: 65 });
            
            environment.updateAltitudeSickness('player1', 35);
            const data = environment.playerAltitudeData.get('player1');
            expect(data.timeAtAltitude).toBeGreaterThan(0);
        });

        test('should get current weather data', () => {
            const weatherData = environment.getClientData().weather;
            expect(weatherData).toHaveProperty('type');
            expect(weatherData).toHaveProperty('intensity');
            expect(weatherData).toHaveProperty('timeRemaining');
        });

        test('should detect thermal vent damage', () => {
            zone.registerPlayer('player1', { x: 1400, y: 950, level: 65 });
            const player = zone.players.get('player1');
            player.takeDamage = jest.fn();
            
            environment.checkThermalVentDamage('player1', player);
            expect(player.takeDamage).toHaveBeenCalled();
        });

        test('should track wind system', () => {
            const initialWind = { ...environment.windDirection };
            environment.lastWindChange = Date.now() - 35000;
            environment.updateWind();
            
            expect(environment.windDirection).not.toEqual(initialWind);
        });
    });

    describe('Dragonforge', () => {
        beforeEach(async () => {
            zone = new DraconiaZone(mockDb, null, null);
            await zone.initialize();
            dragonforge = new Dragonforge(mockDb, zone);
            await dragonforge.initialize();
        });

        test('should initialize with 12 recipes', () => {
            expect(dragonforge.recipes).toHaveLength(12);
        });

        test('should categorize recipes correctly', () => {
            const weapons = dragonforge.recipes.filter(r => r.type === 'weapon');
            const armors = dragonforge.recipes.filter(r => r.type === 'armor');
            const accessories = dragonforge.recipes.filter(r => r.type === 'accessory');
            
            expect(weapons).toHaveLength(4);
            expect(armors).toHaveLength(4);
            expect(accessories).toHaveLength(4);
        });

        test('should require specific materials for Dragonflame Blade', () => {
            const recipe = dragonforge.recipes.find(r => r.id === 'dragonflame_blade');
            expect(recipe.materials).toHaveProperty('dragon_scale', 5);
            expect(recipe.materials).toHaveProperty('fire_essence', 10);
            expect(recipe.materials).toHaveProperty('magma_core', 2);
            expect(recipe.materials).toHaveProperty('krazgoth_fang', 1);
        });

        test('should require level 75+ for most recipes', () => {
            const highLevelRecipes = dragonforge.recipes.filter(r => r.level >= 75);
            expect(highLevelRecipes.length).toBeGreaterThanOrEqual(8);
        });

        test('should have correct crafting times', () => {
            const weaponRecipe = dragonforge.recipes.find(r => r.id === 'dragonflame_blade');
            expect(weaponRecipe.craftingTime).toBe(600000); // 10 minutes
            
            const armorRecipe = dragonforge.recipes.find(r => r.id === 'dragonscale_plate');
            expect(armorRecipe.craftingTime).toBe(720000); // 12 minutes
        });

        test('should unlock recipes for players', async () => {
            const result = await dragonforge.unlockRecipe('player1', 'dragonflame_blade');
            expect(result.success).toBe(true);
            
            const playerUnlocks = dragonforge.playerUnlocks.get('player1');
            expect(playerUnlocks.has('dragonflame_blade')).toBe(true);
        });
    });
});
