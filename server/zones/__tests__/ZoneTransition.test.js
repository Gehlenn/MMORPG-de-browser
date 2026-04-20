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
            getSpawnPoint: jest.fn().mockReturnValue({ x: 100, y: 100 })
        });
        mockZones.set('eldoria', { 
            config: { id: 'eldoria', name: 'Eldoria' },
            getSpawnPoint: jest.fn().mockReturnValue({ x: 1000, y: 750 })
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
            expect(result.fromZone).toBe('verdantis');
            expect(result.toZone).toBe('eldoria');
            expect(mockPlayerManager.updatePlayer).toHaveBeenCalledWith('p1', expect.objectContaining({
                currentZone: 'eldoria'
            }));
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
        test('should return current zone info', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'p1',
                currentZone: 'eldoria',
                x: 500,
                y: 500
            });

            const result = await zoneTransition.getPlayerZoneInfo('p1');
            expect(result.currentZone).toBe('eldoria');
            expect(result.position).toEqual({ x: 500, y: 500 });
        });
    });

    describe('Combat Cooldown', () => {
        test('should check combat cooldown', () => {
            zoneTransition.playerCombatStatus.set('p1', Date.now());
            
            const inCombat = zoneTransition.isPlayerInCombat('p1');
            expect(inCombat).toBe(true);
        });

        test('should report not in combat if cooldown expired', () => {
            zoneTransition.playerCombatStatus.set('p1', Date.now() - 20000);
            
            const inCombat = zoneTransition.isPlayerInCombat('p1');
            expect(inCombat).toBe(false);
        });

        test('should record combat entry', () => {
            zoneTransition.recordCombatEntry('p1');
            
            expect(zoneTransition.playerCombatStatus.has('p1')).toBe(true);
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
