/**
 * ZoneTransition.test.js
 * Test suite for zone transition system
 * Phase 3: New Zones
 */

const ZoneTransition = require('../ZoneTransition');

describe('ZoneTransition', () => {
    let zoneTransition;
    let mockDb;
    let mockZones;
    let mockPlayerManager;

    beforeEach(() => {
        mockDb = {
            query: jest.fn()
        };
        
        mockZones = new Map();
        mockZones.set('verdantis', { 
            config: { id: 'verdantis', name: 'Verdantis' },
            getSpawnPoint: jest.fn().mockReturnValue({ x: 100, y: 100 }),
            getZoneInfo: jest.fn().mockReturnValue({ id: 'verdantis', name: 'Verdantis' }),
            playerLeave: jest.fn(),
            playerEnter: jest.fn(),
            getObjects: jest.fn(),
            getObject: jest.fn(),
            getNpcs: jest.fn(),
            getNpc: jest.fn(),
            getPortals: jest.fn(),
            getPortal: jest.fn()
        });
        mockZones.set('eldoria', { 
            config: { id: 'eldoria', name: 'Eldoria' },
            getSpawnPoint: jest.fn().mockReturnValue({ x: 1000, y: 750 }),
            getZoneInfo: jest.fn().mockReturnValue({ id: 'eldoria', name: 'Eldoria' }),
            playerLeave: jest.fn(),
            playerEnter: jest.fn(),
            getObjects: jest.fn(),
            getObject: jest.fn(),
            getNpcs: jest.fn(),
            getNpc: jest.fn(),
            getPortals: jest.fn(),
            getPortal: jest.fn()
        });

        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({
                id: 'p1',
                level: 25,
                currentZone: 'verdantis',
                x: 100,
                y: 100
            }),
            updatePlayer: jest.fn().mockResolvedValue(true)
        };

        zoneTransition = new ZoneTransition(mockDb, mockZones, mockPlayerManager);
    });

    describe('Portal Configuration', () => {
        test('should have portal from Verdantis to Eldoria', () => {
            const portal = zoneTransition.portals.get('verdantis_to_eldoria');
            expect(portal).toBeDefined();
            expect(portal.name).toBe('Eastern Gate');
            expect(portal.fromZone).toBe('verdantis');
            expect(portal.toZone).toBe('eldoria');
            expect(portal.requiredLevel).toBe(20);
        });

        test('should have portal from Eldoria to Verdantis', () => {
            const portal = zoneTransition.portals.get('eldoria_to_verdantis');
            expect(portal).toBeDefined();
            expect(portal.name).toBe('Western Pass');
            expect(portal.fromZone).toBe('eldoria');
            expect(portal.toZone).toBe('verdantis');
            expect(portal.requiredLevel).toBe(1);
        });

        test('should have correct portal positions', () => {
            const toEldoria = zoneTransition.portals.get('verdantis_to_eldoria');
            expect(toEldoria.fromPosition).toEqual({ x: 1200, y: 400 });
            expect(toEldoria.toPosition).toEqual({ x: 100, y: 750 });
        });
    });

    describe('canUsePortal', () => {
        test('should allow player with sufficient level', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'p1',
                level: 25
            });

            const result = await zoneTransition.canUsePortal('p1', 'verdantis_to_eldoria');
            expect(result.allowed).toBe(true);
        });

        test('should deny player with insufficient level', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'p1',
                level: 15
            });

            const result = await zoneTransition.canUsePortal('p1', 'verdantis_to_eldoria');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('level 20');
        });

        test('should return error for non-existent portal', async () => {
            const result = await zoneTransition.canUsePortal('p1', 'invalid_portal');
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Portal not found');
        });

        test('should return error for non-existent player', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await zoneTransition.canUsePortal('p1', 'verdantis_to_eldoria');
            expect(result.allowed).toBe(false);
            expect(result.reason).toBe('Player not found');
        });
    });

    describe('usePortal', () => {
        test('should successfully transition player', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'p1',
                level: 25,
                currentZone: 'verdantis',
                x: 1200,
                y: 400
            });

            const result = await zoneTransition.usePortal('p1', 'verdantis_to_eldoria');
            
            expect(result.success).toBe(true);
            expect(result.zone).toBe('eldoria');
            expect(result.position).toEqual({ x: 100, y: 750 });
            expect(result.zoneInfo).toBeDefined();
        });

        test('should fail if player cannot use portal', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'p1',
                level: 15
            });

            const result = await zoneTransition.usePortal('p1', 'verdantis_to_eldoria');
            expect(result.success).toBe(false);
        });
    });

    describe('getPlayerZoneInfo', () => {
        test('should return default zone info when no progress', async () => {
            mockDb.get = jest.fn().mockResolvedValue(null);

            const result = await zoneTransition.getPlayerZoneInfo('p1');
            expect(result.currentZone).toBe('verdantis');
            expect(result.discoveredZones).toEqual(['verdantis']);
            expect(result.lastPosition).toBeNull();
        });

        test('should return zone info from database', async () => {
            mockDb.get = jest.fn().mockResolvedValue({
                player_id: 'p1',
                current_zone: 'eldoria',
                discovered_zones: JSON.stringify(['verdantis', 'eldoria']),
                last_position: JSON.stringify({ x: 500, y: 500 })
            });

            const result = await zoneTransition.getPlayerZoneInfo('p1');
            expect(result.currentZone).toBe('eldoria');
            expect(result.discoveredZones).toContain('eldoria');
            expect(result.lastPosition).toEqual({ x: 500, y: 500 });
        });
    });

    describe('Combat Cooldown', () => {
        test('should check combat cooldown', () => {
            zoneTransition.setPlayerCombat('p1');
            
            const inCombat = zoneTransition.isInCombatCooldown('p1');
            expect(inCombat).toBe(true);
        });

        test('should report not in combat if cooldown expired', () => {
            zoneTransition.playerCombatStatus.set('p1', Date.now() - 20000);
            
            const inCombat = zoneTransition.isInCombatCooldown('p1');
            expect(inCombat).toBe(false);
        });

        test('should set and clear player combat', () => {
            zoneTransition.setPlayerCombat('p1');
            expect(zoneTransition.playerCombatStatus.has('p1')).toBe(true);
            
            zoneTransition.clearPlayerCombat('p1');
            expect(zoneTransition.playerCombatStatus.has('p1')).toBe(false);
        });

        test('should get remaining cooldown', () => {
            zoneTransition.setPlayerCombat('p1');
            
            const remaining = zoneTransition.getCombatCooldownRemaining('p1');
            expect(remaining).toBeGreaterThan(0);
            expect(remaining).toBeLessThanOrEqual(10000);
        });
    });

    describe('getAvailablePortals', () => {
        test('should return portals for current zone', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'p1',
                level: 25,
                currentZone: 'verdantis'
            });

            const portals = await zoneTransition.getAvailablePortals('p1', 'verdantis');
            expect(portals.length).toBeGreaterThan(0);
            expect(portals[0]).toHaveProperty('id');
            expect(portals[0]).toHaveProperty('name');
            expect(portals[0]).toHaveProperty('canUse');
        });
    });

    describe('getPortalAt', () => {
        test('should find portal at position', () => {
            const portal = zoneTransition.getPortalAt('verdantis', 1200, 400);
            expect(portal).toBeDefined();
            expect(portal.id).toBe('verdantis_to_eldoria');
        });

        test('should return null if no portal at position', () => {
            const portal = zoneTransition.getPortalAt('verdantis', 0, 0);
            expect(portal).toBeNull();
        });
    });
});
