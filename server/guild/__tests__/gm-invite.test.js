/**
 * GuildManager invitePlayer Complete Coverage
 */

const GuildManager = require('../GuildManager');

describe('GuildManager invitePlayer Lines 186-219', () => {
    let mockDb, mockPlayerManager, gm;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            createInvitation: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            getPlayerByUsername: jest.fn()
        };
        
        gm = new GuildManager(mockDb, mockPlayerManager);
        gm.on = jest.fn();
        gm.emit = jest.fn();
    });

    test('invitePlayer fails when guild not found (line 181-183)', async () => {
        mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        mockDb.getGuildById.mockResolvedValue(null);

        const result = await gm.invitePlayer('p1', 'g1', 'NewPlayer');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Guild not found');
    });

    test('invitePlayer fails when guild full (line 186-188)', async () => {
        mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        mockDb.getGuildById.mockResolvedValue({
            id: 'g1',
            memberCount: 100,
            maxMembers: 100
        });

        const result = await gm.invitePlayer('p1', 'g1', 'NewPlayer');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Guild is full');
    });

    test('invitePlayer fails when invitee not found (line 191-194)', async () => {
        mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        mockDb.getGuildById.mockResolvedValue({
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
        mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        mockDb.getGuildById.mockResolvedValue({
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
        mockDb.getPlayerGuild
            .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // Inviter
            .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' }); // Invitee already in guild
        
        mockDb.getGuildById.mockResolvedValue({
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
        mockDb.getPlayerGuild
            .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // inviter
            .mockResolvedValueOnce(null); // invitee not in guild
        mockDb.getGuildById.mockResolvedValue({
            id: 'g1',
            name: 'Test Guild',
            memberCount: 5,
            maxMembers: 100
        });
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'InviterName' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });
        mockDb.createInvitation.mockResolvedValue({
            id: 'inv1',
            guild_id: 'g1',
            invitee_id: 'p2',
            inviter_id: 'p1'
        });

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(true);
        expect(result.invitation).toHaveProperty('id', 'inv1');
        expect(gm.emit).toHaveBeenCalledWith('guild:invited', expect.any(Object));
    });

    test('invitePlayer handles getPlayerGuild error', async () => {
        mockDb.getPlayerGuild.mockRejectedValue(new Error('DB Error'));

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
    });

    test('invitePlayer handles getGuildById error', async () => {
        mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        mockDb.getGuildById.mockRejectedValue(new Error('DB Error'));

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
    });

    test('invitePlayer handles createInvitation error', async () => {
        mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
        mockDb.getGuildById.mockResolvedValue({
            id: 'g1',
            memberCount: 5,
            maxMembers: 100
        });
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Inviter' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });
        mockDb.createInvitation.mockRejectedValue(new Error('Create Error'));

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
    });

    test('invitePlayer with OFFICER rank', async () => {
        mockDb.getPlayerGuild
            .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' }) // inviter
            .mockResolvedValueOnce(null); // invitee not in guild
        mockDb.getGuildById.mockResolvedValue({
            id: 'g1',
            name: 'Test Guild',
            memberCount: 5,
            maxMembers: 100
        });
        mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Officer' });
        mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });
        mockDb.createInvitation.mockResolvedValue({ id: 'inv1' });

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(true);
    });

    test('invitePlayer fails when not officer or leader', async () => {
        mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Only officers can invite');
    });

    test('invitePlayer fails when inviter not in guild', async () => {
        mockDb.getPlayerGuild.mockResolvedValue(null);

        const result = await gm.invitePlayer('p1', 'g1', 'Target');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Not in this guild');
    });
});
