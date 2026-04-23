/**
 * aurelia-zone.test.js
 * 
 * Test suite for Aurélia zone system
 * Target: 95%+ coverage
 */

const AureliaZone = require('../../server/zones/AureliaZone');
const AureliaEnvironment = require('../../server/zones/AureliaEnvironment');
const AureliaTransition = require('../../server/zones/AureliaTransition');
const AureliaCrafting = require('../../server/crafting/AureliaCrafting');
const AureliaIntegration = require('../../server/zones/AureliaIntegration');

// Mock database
const mockDb = {
    run: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({}),
    all: jest.fn().mockResolvedValue([])
};

// Mock io
const mockIo = {
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    emit: jest.fn()
};

describe('Aurelia Zone System', () => {
    let zone;
    let environment;
    let transition;
    let crafting;
    let integration;
    
    // Increase timeout for async initialization
    jest.setTimeout(10000);

    beforeEach(async () => {
        zone = new AureliaZone({ database: mockDb });
        await zone.initialize();
        environment = new AureliaEnvironment(mockDb, zone);
        await environment.initialize();
        transition = new AureliaTransition(zone, mockDb);
        crafting = new AureliaCrafting(mockDb);
        await crafting.initialize();
        integration = new AureliaIntegration(mockDb, mockIo);
        await integration.initialize();
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (zone) zone.cleanup();
        if (environment) environment.cleanup();
        if (transition) transition.cleanup();
        if (crafting) crafting.cleanup();
        if (integration) integration.cleanup();
    });

    describe('AureliaZone', () => {
        describe('Initialization', () => {
            test('should initialize with correct configuration', async () => {
                await zone.initialize();
                
                expect(zone.zoneId).toBe('aurelia');
                expect(zone.zoneName).toBe('Aurélia - The Golden Desert');
                expect(zone.minLevel).toBe(40);
                expect(zone.maxLevel).toBe(60);
            });

            test('should have correct dimensions', () => {
                expect(zone.width).toBe(4000);
                expect(zone.height).toBe(4000);
                expect(zone.safeZoneRadius).toBe(300);
            });

            test('should have 4 sub-zones defined', () => {
                const subZones = Object.keys(zone.subZones);
                expect(subZones).toContain('oasis_shamara');
                expect(subZones).toContain('golden_dunes');
                expect(subZones).toContain('ruins_ankhet');
                expect(subZones).toContain('thief_valley');
                expect(subZones).toHaveLength(4);
            });
        });

        describe('Player Management', () => {
            test('should register player', () => {
                const player = { id: 'player1', x: 500, y: 500, level: 45 };
                
                zone.registerPlayer(player.id, player);
                
                expect(zone.players.has(player.id)).toBe(true);
                expect(zone.players.get(player.id)).toBe(player);
            });

            test('should unregister player', () => {
                const player = { id: 'player1', x: 500, y: 500 };
                zone.registerPlayer(player.id, player);
                
                zone.unregisterPlayer(player.id);
                
                expect(zone.players.has(player.id)).toBe(false);
            });

            test('should check if player is in zone', () => {
                const player = { id: 'player1', x: 500, y: 500 };
                zone.registerPlayer(player.id, player);
                
                expect(zone.isPlayerInZone(player.id)).toBe(true);
                expect(zone.isPlayerInZone('nonexistent')).toBe(false);
            });

            test('should get player count', () => {
                zone.registerPlayer('p1', { id: 'p1', x: 100, y: 100 });
                zone.registerPlayer('p2', { id: 'p2', x: 200, y: 200 });
                
                expect(zone.getPlayerCount()).toBe(2);
            });
        });

        describe('Position Validation', () => {
            test('should validate position within bounds', () => {
                expect(zone.isValidPosition(500, 500)).toBe(true);
                expect(zone.isValidPosition(-100, 500)).toBe(false);
                expect(zone.isValidPosition(500, 5000)).toBe(false);
            });

            test('should check safe zone', () => {
                expect(zone.isInSafeZone(600, 600)).toBe(true);
                expect(zone.isInSafeZone(1000, 1000)).toBe(false);
            });

            test('should identify sub-zones', () => {
                const oasis = zone.getSubZoneAt(600, 600);
                expect(oasis.id).toBe('oasis_shamara');
                
                const dunes = zone.getSubZoneAt(1800, 2800);
                expect(dunes.id).toBe('golden_dunes');
            });
        });

        describe('Level Requirements', () => {
            test('should check level requirement', () => {
                expect(zone.checkLevelRequirement(45)).toBe(true);
                expect(zone.checkLevelRequirement(35)).toBe(false);
                expect(zone.checkLevelRequirement(65)).toBe(false);
            });

            test('should get level range', () => {
                const range = zone.getLevelRange();
                expect(range.min).toBe(40);
                expect(range.max).toBe(60);
            });
        });

        describe('Resources', () => {
            test('should get resources in range', () => {
                const resources = zone.getResourcesInRange(600, 600, 200);
                expect(resources.length).toBeGreaterThan(0);
            });

            test('should respawn resources', async () => {
                await zone.initialize();
                
                const respawned = await zone.respawnResource('oasis_cactus_0');
                expect(respawned).toBe(true);
            });
        });

        describe('Portals', () => {
            test('should get portals for zone', () => {
                const portals = zone.getPortalsForZone('aurelia');
                expect(portals.length).toBeGreaterThan(0);
            });

            test('should get portal by ID', () => {
                const portal = zone.getPortal('portal_aurelia_eldoria');
                expect(portal).toBeDefined();
                expect(portal.toZone).toBe('eldoria');
            });
        });

        describe('Data Export', () => {
            test('should get client zone data', () => {
                const data = zone.getClientZoneData();
                expect(data).toHaveProperty('zoneId');
                expect(data).toHaveProperty('name');
                expect(data).toHaveProperty('dimensions');
                expect(data).toHaveProperty('subZones');
                expect(data).toHaveProperty('resources');
                expect(data).toHaveProperty('portals');
            });

            test('should get full zone data', () => {
                const data = zone.getFullData();
                expect(data).toHaveProperty('environment');
                expect(data).toHaveProperty('spawnPoints');
                expect(data).toHaveProperty('playerCount');
            });
        });
    });

    describe('AureliaEnvironment', () => {
        describe('Day/Night Cycle', () => {
            test('should initialize with correct time', async () => {
                await environment.initialize();
                expect(environment.hour).toBeGreaterThanOrEqual(0);
                expect(environment.hour).toBeLessThanOrEqual(23);
            });

            test('should detect daytime', () => {
                environment.hour = 12;
                expect(environment.isDaytime).toBe(true);
                
                environment.hour = 22;
                expect(environment.isDaytime).toBe(false);
            });

            test('should calculate temperature based on time', () => {
                environment.hour = 12; // Noon
                environment.updateTemperature();
                expect(environment.temperature).toBeGreaterThan(0);
                
                environment.hour = 2; // Night
                environment.updateTemperature();
                expect(environment.temperature).toBeLessThan(0);
            });
        });

        describe('Player Effects', () => {
            test('should register player', () => {
                const player = { id: 'p1', x: 500, y: 500, level: 45 };
                environment.registerPlayer(player.id, player);
                
                expect(environment.players.has(player.id)).toBe(true);
            });

            test('should apply heat damage during day', () => {
                const player = {
                    id: 'p1',
                    x: 1500,
                    y: 1500,
                    hp: 100,
                    maxHp: 100,
                    resistances: {},
                    takeDamage: jest.fn()
                };
                
                environment.hour = 12;
                environment.isDaytime = true;
                environment.registerPlayer('p1', player);
                
                environment.applyPlayerEffects('p1', 1);
                
                expect(player.takeDamage).toHaveBeenCalled();
            });

            test('should apply cold damage at night', () => {
                const player = {
                    id: 'p1',
                    x: 1500,
                    y: 1500,
                    hp: 100,
                    resistances: {},
                    takeDamage: jest.fn()
                };
                
                environment.hour = 2;
                environment.isDaytime = false;
                environment.registerPlayer('p1', player);
                
                environment.applyPlayerEffects('p1', 1);
                
                expect(player.takeDamage).toHaveBeenCalled();
            });

            test('should protect players in safe zones', () => {
                const player = {
                    id: 'p1',
                    x: 600, // Safe zone
                    y: 600,
                    hp: 100,
                    takeDamage: jest.fn()
                };
                
                environment.hour = 12;
                environment.isDaytime = true;
                environment.registerPlayer('p1', player);
                
                environment.applyPlayerEffects('p1', 1);
                
                expect(player.takeDamage).not.toHaveBeenCalled();
            });
        });

        describe('Sandstorm', () => {
            test('should start sandstorm', () => {
                environment.startSandstorm(30000);
                
                expect(environment.sandstormActive).toBe(true);
                expect(environment.sandstormEndTime).toBeGreaterThan(Date.now());
            });

            test('should end sandstorm', () => {
                environment.startSandstorm(1000);
                environment.sandstormEndTime = Date.now() - 100;
                
                environment.updateSandstorm();
                
                expect(environment.sandstormActive).toBe(false);
            });

            test('should apply sandstorm damage', () => {
                const player = {
                    id: 'p1',
                    x: 1500,
                    y: 1500,
                    hp: 100,
                    takeDamage: jest.fn()
                };
                
                environment.sandstormActive = true;
                environment.sandstormIntensity = 1.0;
                environment.registerPlayer('p1', player);
                
                environment.applySandstormDamage('p1');
                
                expect(player.takeDamage).toHaveBeenCalled();
            });
        });

        describe('Quicksand', () => {
            test('should detect quicksand', () => {
                // In quicksand zone
                expect(environment.isInQuicksand(2500, 3200)).toBe(true);
                
                // Not in quicksand
                expect(environment.isInQuicksand(600, 600)).toBe(false);
            });

            test('should apply quicksand damage', () => {
                const player = {
                    id: 'p1',
                    x: 2500,
                    y: 3200,
                    hp: 100,
                    takeDamage: jest.fn()
                };
                
                environment.registerPlayer('p1', player);
                environment.applyQuicksandDamage('p1');
                
                expect(player.takeDamage).toHaveBeenCalledWith(
                    expect.any(Number),
                    'environment',
                    'true'
                );
            });
        });
    });

    describe('AureliaTransition', () => {
        describe('Portal Management', () => {
            test('should register default portals', async () => {
                await transition.initialize();
                
                expect(transition.portals.size).toBeGreaterThan(0);
                expect(transition.portals.has('aurelia_to_eldoria')).toBe(true);
                expect(transition.portals.has('eldoria_to_aurelia')).toBe(true);
            });

            test('should get portal info', () => {
                const info = transition.getPortalInfo('aurelia_to_eldoria');
                expect(info).toHaveProperty('id');
                expect(info).toHaveProperty('from');
                expect(info).toHaveProperty('to');
                expect(info).toHaveProperty('levelRequirement');
            });

            test('should get zone portals', () => {
                const portals = transition.getZonePortals('aurelia');
                expect(Array.isArray(portals)).toBe(true);
            });
        });

        describe('Transition Validation', () => {
            test('should allow valid transition', async () => {
                const player = {
                    id: 'p1',
                    x: 100,
                    y: 2000,
                    level: 45,
                    inventory: { hasItem: jest.fn().mockReturnValue(false) }
                };
                
                const result = await transition.canUsePortal(
                    player,
                    'aurelia_to_eldoria',
                    { sandstormActive: false }
                );
                
                expect(result.allowed).toBe(true);
            });

            test('should block transition due to level', async () => {
                const player = {
                    id: 'p1',
                    x: 100,
                    y: 2000,
                    level: 30 // Too low
                };
                
                const result = await transition.canUsePortal(
                    player,
                    'pyramid_entrance',
                    {}
                );
                
                expect(result.allowed).toBe(false);
                expect(result.reason).toContain('Requires level');
            });

            test('should block transition during sandstorm', async () => {
                const player = {
                    id: 'p1',
                    x: 100,
                    y: 2000,
                    level: 45
                };
                
                // Mock random to always block
                jest.spyOn(Math, 'random').mockReturnValue(0.1);
                
                const result = await transition.canUsePortal(
                    player,
                    'aurelia_to_eldoria',
                    { sandstormActive: true }
                );
                
                expect(result.allowed).toBe(false);
                expect(result.sandstorm).toBe(true);
                
                Math.random.mockRestore();
            });

            test('should check distance to portal', async () => {
                const player = {
                    id: 'p1',
                    x: 1000, // Far from portal
                    y: 2000,
                    level: 45
                };
                
                const result = await transition.canUsePortal(
                    player,
                    'aurelia_to_eldoria',
                    {}
                );
                
                expect(result.allowed).toBe(false);
                expect(result.reason).toContain('Too far');
            });
        });

        describe('Transition Effects', () => {
            test('should calculate entry effects', () => {
                const portal = transition.portals.get('eldoria_to_aurelia');
                const player = { id: 'p1' };
                const environment = { isDaytime: true, sandstormActive: false };
                
                const effects = transition.calculateTransitionEffects(
                    player,
                    portal,
                    environment
                );
                
                // Should have heat exhaustion
                expect(effects.some(e => e.name === 'Heat Exhaustion')).toBe(true);
                
                // Should have sand in eyes from Eldoria
                expect(effects.some(e => e.name === 'Sand in Eyes')).toBe(true);
            });

            test('should calculate exit effects', () => {
                const portal = transition.portals.get('aurelia_to_eldoria');
                const player = { id: 'p1' };
                const environment = {};
                
                const effects = transition.calculateTransitionEffects(
                    player,
                    portal,
                    environment
                );
                
                // Should have relief
                expect(effects.some(e => e.name === 'Relief from Heat')).toBe(true);
            });
        });

        describe('Transition Flow', () => {
            test('should start transition', async () => {
                const player = {
                    id: 'p1',
                    x: 100,
                    y: 2000,
                    level: 45,
                    inventory: { hasItem: jest.fn().mockReturnValue(false) }
                };
                
                const result = await transition.startTransition(
                    player,
                    'aurelia_to_eldoria',
                    {}
                );
                
                expect(result.success).toBe(true);
                expect(result).toHaveProperty('delay');
                expect(result).toHaveProperty('effects');
                expect(result).toHaveProperty('destination');
            });

            test('should complete transition', async () => {
                const player = {
                    id: 'p1',
                    x: 100,
                    y: 2000,
                    level: 45,
                    inventory: { hasItem: jest.fn().mockReturnValue(false) }
                };
                
                await transition.startTransition(player, 'aurelia_to_eldoria', {});
                
                const result = await transition.completeTransition('p1');
                
                expect(result.success).toBe(true);
                expect(result).toHaveProperty('position');
            });

            test('should cancel transition', async () => {
                const player = {
                    id: 'p1',
                    x: 100,
                    y: 2000,
                    level: 45,
                    inventory: { hasItem: jest.fn().mockReturnValue(false) }
                };
                
                await transition.startTransition(player, 'aurelia_to_eldoria', {});
                
                const result = transition.cancelTransition('p1');
                
                expect(result.success).toBe(true);
                expect(transition.activeTransitions.has('p1')).toBe(false);
            });
        });
    });

    describe('AureliaCrafting', () => {
        describe('Recipes', () => {
            test('should have recipes defined', () => {
                const recipes = Object.keys(crafting.recipes);
                expect(recipes.length).toBeGreaterThan(0);
            });

            test('should get recipes for station', () => {
                const recipes = crafting.getRecipesForStation('oasis_campfire', 'p1');
                expect(Array.isArray(recipes)).toBe(true);
            });

            test('should get station info', () => {
                const info = crafting.getStationInfo('oasis_campfire');
                expect(info).toHaveProperty('id');
                expect(info).toHaveProperty('name');
                expect(info).toHaveProperty('type');
                expect(info).toHaveProperty('recipes');
            });

            test('should get nearby stations', () => {
                const stations = crafting.getNearbyStations(600, 500, 200);
                expect(Array.isArray(stations)).toBe(true);
            });
        });

        describe('Crafting Validation', () => {
            test('should allow valid craft', () => {
                const player = {
                    id: 'p1',
                    level: 40,
                    x: 600,
                    y: 500,
                    inventory: {
                        getItemCount: jest.fn().mockReturnValue(5),
                        removeItem: jest.fn().mockResolvedValue(true)
                    }
                };
                
                const result = crafting.canCraft(player, 'mirage_soup', 'oasis_campfire');
                
                expect(result.canCraft).toBe(true);
                expect(result.recipe).toBeDefined();
            });

            test('should block craft due to level', () => {
                const player = {
                    id: 'p1',
                    level: 30,
                    x: 600,
                    y: 500,
                    inventory: { getItemCount: jest.fn().mockReturnValue(5) }
                };
                
                const result = crafting.canCraft(player, 'mirage_soup', 'oasis_campfire');
                
                expect(result.canCraft).toBe(false);
                expect(result.reason).toContain('Requires level');
            });

            test('should block craft due to missing materials', () => {
                const player = {
                    id: 'p1',
                    level: 40,
                    x: 600,
                    y: 500,
                    inventory: { getItemCount: jest.fn().mockReturnValue(0) }
                };
                
                const result = crafting.canCraft(player, 'mirage_soup', 'oasis_campfire');
                
                expect(result.canCraft).toBe(false);
                expect(result.reason).toContain('Missing materials');
            });

            test('should block craft due to distance', () => {
                const player = {
                    id: 'p1',
                    level: 40,
                    x: 5000, // Far away
                    y: 5000,
                    inventory: { getItemCount: jest.fn().mockReturnValue(5) }
                };
                
                const result = crafting.canCraft(player, 'mirage_soup', 'oasis_campfire');
                
                expect(result.canCraft).toBe(false);
                expect(result.reason).toContain('Too far');
            });
        });

        describe('Crafting Flow', () => {
            test('should start crafting', async () => {
                const player = {
                    id: 'p1',
                    level: 40,
                    x: 600,
                    y: 500,
                    inventory: {
                        getItemCount: jest.fn().mockReturnValue(5),
                        removeItem: jest.fn().mockResolvedValue(true)
                    }
                };
                
                const result = await crafting.startCrafting(
                    player,
                    'mirage_soup',
                    'oasis_campfire'
                );
                
                expect(result.success).toBe(true);
                expect(result).toHaveProperty('recipe');
                expect(result).toHaveProperty('endTime');
                expect(crafting.activeCrafting.has('p1')).toBe(true);
            });

            test('should not start if already crafting', async () => {
                const player = {
                    id: 'p1',
                    level: 40,
                    x: 600,
                    y: 500,
                    inventory: {
                        getItemCount: jest.fn().mockReturnValue(5),
                        removeItem: jest.fn().mockResolvedValue(true)
                    }
                };
                
                await crafting.startCrafting(player, 'mirage_soup', 'oasis_campfire');
                
                const result = await crafting.startCrafting(player, 'mirage_soup', 'oasis_campfire');
                
                expect(result.success).toBe(false);
                expect(result.reason).toBe('Already crafting');
            });

            test('should get crafting status', async () => {
                const player = {
                    id: 'p1',
                    level: 40,
                    x: 600,
                    y: 500,
                    inventory: {
                        getItemCount: jest.fn().mockReturnValue(5),
                        removeItem: jest.fn().mockResolvedValue(true)
                    }
                };
                
                await crafting.startCrafting(player, 'mirage_soup', 'oasis_campfire');
                
                const status = crafting.getCraftingStatus('p1');
                
                expect(status).toHaveProperty('active');
                expect(status).toHaveProperty('recipeId');
                expect(status).toHaveProperty('remaining');
            });
        });

        describe('Unlocks', () => {
            test('should unlock recipe', async () => {
                await crafting.unlockRecipe('p1', 'mirage_soup');
                
                const unlocks = crafting.getPlayerUnlocks('p1');
                expect(unlocks).toContain('mirage_soup');
            });

            test('should not duplicate unlocks', async () => {
                await crafting.unlockRecipe('p1', 'mirage_soup');
                await crafting.unlockRecipe('p1', 'mirage_soup');
                
                const unlocks = crafting.getPlayerUnlocks('p1');
                const count = unlocks.filter(u => u === 'mirage_soup').length;
                expect(count).toBe(1);
            });
        });
    });

    describe('AureliaIntegration', () => {
        describe('Initialization', () => {
            test('should initialize all systems', async () => {
                // Mock the subsystem initializations
                zone.initialize = jest.fn().mockResolvedValue(true);
                environment.initialize = jest.fn().mockResolvedValue(true);
                transition.initialize = jest.fn().mockResolvedValue(true);
                crafting.initialize = jest.fn().mockResolvedValue(true);
                
                const result = await integration.initialize();
                
                expect(result).toBe(true);
                expect(integration.initialized).toBe(true);
                expect(integration.active).toBe(true);
            });
        });

        describe('Spawn Management', () => {
            test('should setup spawn points', () => {
                integration.setupSpawnPoints();
                
                expect(integration.spawnPoints.size).toBeGreaterThan(0);
                expect(integration.spawnPoints.has('scorpion_0')).toBe(true);
                expect(integration.spawnPoints.has('captain_0')).toBe(true);
            });

            test('should spawn mob', () => {
                integration.setupSpawnPoints();
                
                const spawnPoint = integration.spawnPoints.get('scorpion_0');
                integration.spawnMob(spawnPoint);
                
                expect(spawnPoint.currentMob).toBeDefined();
                expect(spawnPoint.currentMob.type).toBe('giant_scorpion');
                expect(integration.activeMobs.has(spawnPoint.currentMob.id)).toBe(true);
            });

            test('should get nearby mobs', () => {
                integration.setupSpawnPoints();
                
                const spawnPoint = integration.spawnPoints.get('scorpion_0');
                integration.spawnMob(spawnPoint);
                
                const nearby = integration.getNearbyMobs(spawnPoint.x, spawnPoint.y, 100);
                
                expect(Array.isArray(nearby)).toBe(true);
                expect(nearby.length).toBeGreaterThan(0);
            });
        });

        describe('Player Management', () => {
            test('should handle player enter', async () => {
                const player = {
                    id: 'p1',
                    x: 150,
                    y: 2000,
                    level: 45
                };
                
                zone.registerPlayer = jest.fn();
                environment.registerPlayer = jest.fn();
                transition.startTransition = jest.fn().mockResolvedValue({ success: true });
                
                await integration.onPlayerEnter(player, 'eldoria');
                
                expect(zone.registerPlayer).toHaveBeenCalledWith('p1', player);
                expect(environment.registerPlayer).toHaveBeenCalledWith('p1', player);
            });

            test('should handle player leave', () => {
                const player = {
                    id: 'p1',
                    x: 150,
                    y: 2000
                };
                
                zone.unregisterPlayer = jest.fn();
                environment.unregisterPlayer = jest.fn();
                crafting.getCraftingStatus = jest.fn().mockReturnValue(null);
                
                integration.onPlayerLeave(player, 'eldoria');
                
                expect(zone.unregisterPlayer).toHaveBeenCalledWith('p1');
                expect(environment.unregisterPlayer).toHaveBeenCalledWith('p1');
            });

            test('should handle player movement', () => {
                const player = {
                    id: 'p1',
                    x: 0,
                    y: 0,
                    currentSubZone: null,
                    inQuicksand: false
                };
                
                zone.getSubZoneAt = jest.fn().mockReturnValue({ id: 'golden_dunes' });
                environment.onPlayerMove = jest.fn();
                environment.isInQuicksand = jest.fn().mockReturnValue(true);
                
                integration.onPlayerMove(player, 2500, 3200);
                
                expect(player.x).toBe(2500);
                expect(player.y).toBe(3200);
                expect(player.currentSubZone).toBe('golden_dunes');
                expect(player.inQuicksand).toBe(true);
            });
        });

        describe('Mob Combat', () => {
            test('should damage mob', () => {
                integration.setupSpawnPoints();
                
                const spawnPoint = integration.spawnPoints.get('scorpion_0');
                integration.spawnMob(spawnPoint);
                
                const mob = spawnPoint.currentMob;
                const initialHp = mob.hp;
                
                const result = integration.damageMob(mob.id, 100, { id: 'p1' }, 'physical');
                
                expect(result.success).toBe(true);
                expect(result.damage).toBeGreaterThan(0);
                expect(mob.hp).toBeLessThan(initialHp);
            });

            test('should get mob', () => {
                integration.setupSpawnPoints();
                
                const spawnPoint = integration.spawnPoints.get('scorpion_0');
                integration.spawnMob(spawnPoint);
                
                const mob = spawnPoint.currentMob;
                const retrieved = integration.getMob(mob.id);
                
                expect(retrieved).toBe(mob);
            });
        });

        describe('Statistics', () => {
            test('should get statistics', () => {
                integration.initialized = true;
                integration.active = true;
                
                const stats = integration.getStatistics();
                
                expect(stats).toHaveProperty('initialized');
                expect(stats).toHaveProperty('active');
                expect(stats).toHaveProperty('activeMobs');
                expect(stats).toHaveProperty('spawnPoints');
            });
        });

        describe('Lifecycle', () => {
            test('should shutdown gracefully', async () => {
                integration.zone = { cleanup: jest.fn() };
                integration.environment = { cleanup: jest.fn() };
                integration.transition = { cleanup: jest.fn() };
                integration.crafting = { cleanup: jest.fn() };
                integration.boss = { cleanup: jest.fn() };
                integration.updateInterval = setInterval(() => {}, 1000);
                
                await integration.shutdown();
                
                expect(integration.active).toBe(false);
                expect(integration.initialized).toBe(false);
            });

            test('should reset zone', async () => {
                integration.setupSpawnPoints();
                integration.spawnMob(integration.spawnPoints.get('scorpion_0'));
                
                environment.reset = jest.fn();
                boss.respawn = jest.fn();
                
                await integration.reset();
                
                expect(environment.reset).toHaveBeenCalled();
                expect(boss.respawn).toHaveBeenCalled();
            });
        });
    });
});
