/**
 * Tests for new GuildManager methods
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');

describe('GuildManager New Methods', () => {
    let mockDb, mockPlayerManager, gm;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
            get: jest.fn((sql, params, callback) => {
                // Return guild data for getGuildById queries
                if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test Guild', tag: 'TST', leader_id: 'p1' });
                } else {
                    callback(null, null);
                }
            }),
            all: jest.fn((sql, params, callback) => callback(null, [])),
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildByName: jest.fn(),
            getGuildByTag: jest.fn(),
            getGuildMembers: jest.fn(),
            createGuild: jest.fn(),
            addGuildMember: jest.fn(),
            disbandGuild: jest.fn(),
            removeGuildMember: jest.fn(),
            updateMemberRank: jest.fn(),
            transferLeadership: jest.fn(),
            updateGuildInfo: jest.fn(),
            updateLastActive: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            updateGold: jest.fn()
        };
        
        const db = new GuildDatabase(mockDb);
        gm = new GuildManager(db, mockPlayerManager);
        gm.emit = jest.fn();
    });

    describe('setPlayerOnline', () => {
        test('initializes cache and adds player', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.updateLastActive.mockResolvedValue(true);

            await gm.setPlayerOnline('g1', 'p1');

            const online = gm.getOnlineMembers('g1');
            expect(online.has('p1')).toBe(true);
        });

        test('adds to existing cache', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.updateLastActive.mockResolvedValue(true);

            await gm.setPlayerOnline('g1', 'p1');
            await gm.setPlayerOnline('g1', 'p2');

            const online = gm.getOnlineMembers('g1');
            expect(online.has('p1')).toBe(true);
            expect(online.has('p2')).toBe(true);
        });

        test('does nothing when player not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            await gm.setPlayerOnline('g1', 'p1');

            const online = gm.getOnlineMembers('g1');
            expect(online.has('p1')).toBe(false);
        });
    });

    describe('setPlayerOffline', () => {
        test('removes player from cache', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.updateLastActive.mockResolvedValue(true);

            await gm.setPlayerOnline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);

            await gm.setPlayerOffline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });

        test('emits offline event', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            await gm.setPlayerOffline('g1', 'p1');

            expect(gm.emit).toHaveBeenCalledWith('guild:member_offline', {
                guildId: 'g1',
                playerId: 'p1'
            });
        });
    });

    describe('isPlayerOnline', () => {
        test('returns true when player online', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.updateLastActive.mockResolvedValue(true);

            await gm.setPlayerOnline('g1', 'p1');

            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);
        });

        test('returns false when player offline', () => {
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });

        test('returns false for non-existent guild', () => {
            expect(gm.isPlayerOnline('nonexistent', 'p1')).toBe(false);
        });
    });

    describe('demoteMember', () => {
        test('calls promoteMember with same parameters', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.demoteMember('p1', 'p2', 'MEMBER');

            expect(result.success).toBe(true);
        });
    });

    describe('createGuild error paths', () => {
        test('fails when player not found', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not found');
        });

        test('fails when level too low', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 5, gold: 15000 });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('level');
        });

        test('fails when insufficient gold', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 1000 });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('gold');
        });

        test('fails when already in guild', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Already in a guild');
        });

        test('fails when name too short', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'A', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('2-24 characters');
        });

        test('fails when name too long', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'A'.repeat(25), tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('2-24 characters');
        });

        test('fails when tag too short', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TS' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('3-4 characters');
        });

        test('fails when tag too long', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TESTS' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('3-4 characters');
        });

        test('fails when name exists', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue({ id: 'g2', name: 'Test' });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('name already exists');
        });

        test('fails when tag exists', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue({ id: 'g2', tag: 'TST' });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('tag already exists');
        });
    });

    describe('createGuild success', () => {
        test('succeeds with valid data', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue(null);
            mockPlayerManager.updateGold.mockResolvedValue(true);
            mockDb.createGuild.mockResolvedValue({
                id: 'g1',
                name: 'Test Guild',
                tag: 'TST'
            });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST', description: 'A guild' });

            if (!result.success) {
                throw new Error(`createGuild failed: ${result.error}`);
            }
            expect(result.success).toBe(true);
            expect(result.guild).toHaveProperty('id', 'g1');
            expect(gm.emit).toHaveBeenCalledWith('guild:created', expect.any(Object));
        });
    });
});
