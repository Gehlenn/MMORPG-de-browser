/**
 * GuildManager invitePlayer Complete Coverage
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');

describe('GuildManager invitePlayer Lines 186-219', () => {
    let mockDb, mockPlayerManager, gm;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            get: jest.fn(),
            all: jest.fn(),
            run: jest.fn(),
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            createInvitation: jest.fn(),
            getGuildInvitations: jest.fn(),
            getPlayerInvitations: jest.fn(),
            getInvitationById: jest.fn(),
            respondToInvitation: jest.fn()
        };
        // Configure SQLite mocks after clearAllMocks
        mockDb.get.mockImplementation((sql, params, callback) => callback(null, null));
        mockDb.all.mockImplementation((sql, params, callback) => callback(null, []));
        mockDb.run.mockImplementation((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null));
        
        mockPlayerManager = {
            getPlayer: jest.fn(),
            getPlayerByUsername: jest.fn()
        };
        
        const db = new GuildDatabase(mockDb);
        gm = new GuildManager(db, mockPlayerManager);
        gm.on = jest.fn();
        gm.emit = jest.fn();
        
        // Expose db for tests to mock
        gm.testDb = db;
    });

    test('invitePlayer fails when guild not found (line 181-183)', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        gm.testDb.getGuildById = jest.fn().mockResolvedValue(null);

        const result = await gm.invitePlayer('p1', 'g1', 'NewPlayer');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Guild not found');
    });

    test('invitePlayer fails when guild full (line 186-188)', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        gm.testDb.getGuildById = jest.fn().mockResolvedValue({
            id: 'g1',
            memberCount: 100,
            maxMembers: 100
        });

        const result = await gm.invitePlayer('p1', 'g1', 'NewPlayer');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Guild is full');
    });

    test('invitePlayer fails when invitee not found (line 191-194)', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        gm.testDb.getGuildById = jest.fn().mockResolvedValue({
            id: 'g1',
            memberCount: 5,
            maxMembers: 100
        });
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Inviter' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue(null);

        const result = await gm.invitePlayer('p1', 'g1', 'Nonexistent');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Player not found');
    });

    test('invitePlayer fails when inviting self (line 196-198)', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        gm.testDb.getGuildById = jest.fn().mockResolvedValue({
            id: 'g1',
            memberCount: 5,
            maxMembers: 100
        });
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Self' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p1', username: 'Self' });

        const result = await gm.invitePlayer('p1', 'g1', 'Self');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Cannot invite yourself');
    });

    test('invitePlayer fails when invitee already in guild (line 201-204)', async () => {
        gm.testDb.getPlayerGuild = jest.fn()
            .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // Inviter
            .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' }); // Invitee already in guild
        
        gm.testDb.getGuildById = jest.fn().mockResolvedValue({
            id: 'g1',
            memberCount: 5,
            maxMembers: 100
        });
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Inviter' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Player already in a guild');
    });

    test('invitePlayer succeeds with complete flow (lines 207-223)', async () => {
        gm.testDb.getPlayerGuild = jest.fn()
            .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // inviter
            .mockResolvedValueOnce(null); // invitee not in guild
        gm.testDb.getGuildById = jest.fn().mockResolvedValue({
            id: 'g1',
            name: 'Test Guild',
            memberCount: 5,
            maxMembers: 100
        });
        gm.testDb.createInvitation = jest.fn().mockResolvedValue({
            id: 'inv1',
            guild_id: 'g1',
            invitee_id: 'p2',
            inviter_id: 'p1'
        });
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'InviterName' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(true);
        expect(result.invitation).toHaveProperty('id', 'inv1');
        expect(gm.emit).toHaveBeenCalledWith('guild:invited', expect.any(Object));
    });

    test('invitePlayer handles getPlayerGuild error', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockRejectedValue(new Error('DB Error'));

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
    });

    test('invitePlayer handles getGuildById error', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        gm.testDb.getGuildById = jest.fn().mockRejectedValue(new Error('DB Error'));

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
    });

    test('invitePlayer handles createInvitation error', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        gm.testDb.getGuildById = jest.fn().mockResolvedValue({
            id: 'g1',
            memberCount: 5,
            maxMembers: 100
        });
        gm.testDb.createInvitation = jest.fn().mockRejectedValue(new Error('Create Error'));
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Inviter' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
    });

    test('invitePlayer with OFFICER rank', async () => {
        gm.testDb.getPlayerGuild = jest.fn()
            .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' }) // inviter
            .mockResolvedValueOnce(null); // invitee not in guild
        gm.testDb.getGuildById = jest.fn().mockResolvedValue({
            id: 'g1',
            name: 'Test Guild',
            memberCount: 5,
            maxMembers: 100
        });
        gm.testDb.createInvitation = jest.fn().mockResolvedValue({ id: 'inv1' });
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Officer' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(true);
    });

    test('invitePlayer fails when not officer or leader', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Only officers can invite');
    });

    test('invitePlayer fails when inviter not in guild', async () => {
        gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue(null);

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Not in this guild');
    });
});
