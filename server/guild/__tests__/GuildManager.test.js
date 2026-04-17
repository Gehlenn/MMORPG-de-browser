/**
 * GuildManager.test.js
 * Unit tests for GuildManager
 */

const GuildManager = require('../GuildManager');

describe('GuildManager', () => {
    let guildManager;
    let mockDb;
    let mockPlayerManager;

    beforeEach(() => {
        mockDb = {
            createGuild: jest.fn(),
            getPlayerGuild: jest.fn(),
            getGuildByName: jest.fn(),
            getGuildByTag: jest.fn(),
            getGuildById: jest.fn(),
            disbandGuild: jest.fn(),
            getGuildMembers: jest.fn()
        };

        mockPlayerManager = {
            getPlayer: jest.fn(),
            updateGold: jest.fn(),
            getPlayerByUsername: jest.fn()
        };

        guildManager = new GuildManager(mockDb, mockPlayerManager);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createGuild', () => {
        test('should create guild when requirements met', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'player123',
                level: 15,
                gold: 15000
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue(null);
            mockDb.createGuild.mockResolvedValue({
                id: 'guild_123',
                name: 'Test Guild',
                tag: 'TEST'
            });

            const result = await guildManager.createGuild('player123', {
                name: 'Test Guild',
                tag: 'TEST',
                description: 'Test'
            });

            expect(result.success).toBe(true);
            expect(result.guild).toBeDefined();
        });

        test('should fail when level too low', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'player123',
                level: 5,
                gold: 15000
            });

            const result = await guildManager.createGuild('player123', {
                name: 'Test Guild',
                tag: 'TEST'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('level');
        });

        test('should fail when insufficient gold', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'player123',
                level: 15,
                gold: 5000
            });

            const result = await guildManager.createGuild('player123', {
                name: 'Test Guild',
                tag: 'TEST'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('gold');
        });

        test('should fail when already in guild', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'player123',
                level: 15,
                gold: 15000
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'existing' });

            const result = await guildManager.createGuild('player123', {
                name: 'Test Guild',
                tag: 'TEST'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Already in a guild');
        });
    });

    describe('getPlayerGuildInfo', () => {
        test('should return guild info when in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild_123',
                rank: 'LEADER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild_123',
                name: 'Test Guild'
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player123', rank: 'LEADER' }
            ]);

            const result = await guildManager.getPlayerGuildInfo('player123');

            expect(result.success).toBe(true);
            expect(result.guild).toHaveProperty('id', 'guild_123');
            expect(result.guild).toHaveProperty('myRank', 'LEADER');
        });

        test('should return guild: null when not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await guildManager.getPlayerGuildInfo('player123');

            expect(result.success).toBe(true);
            expect(result.guild).toBeNull();
        });
    });
});
