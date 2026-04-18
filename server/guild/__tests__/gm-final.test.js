/**
 * GuildManager Final Lines Coverage
 * Lines: 207-219, 249, 292, 303-315, 368-381
 */

const GuildManager = require('../GuildManager');

describe('GuildManager Final Lines', () => {
    let mockDb, mockPlayerManager, gm;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildMembers: jest.fn(),
            removeGuildMember: jest.fn(),
            removeMember: jest.fn(),
            disbandGuild: jest.fn(),
            transferLeadership: jest.fn(),
            updateMemberRank: jest.fn(),
            updateGuildInfo: jest.fn(),
            addGuildMember: jest.fn(),
            createInvitation: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            updateGold: jest.fn(),
            getPlayerByUsername: jest.fn()
        };
        
        gm = new GuildManager(mockDb, mockPlayerManager);
        gm.emit = jest.fn();
    });

    describe('leaveGuild lines 207-219', () => {
        test('leader cannot leave directly (lines 295-297)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('transfer leadership or disband');
        });

        test('member leaving removes from cache (lines 302-306)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test', tag: 'TST' });
            mockDb.removeMember = jest.fn().mockResolvedValue(true);

            // Set up online cache
            gm.onlineMembers.set('g1', new Set(['p1', 'p2']));
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(true);
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });
    });

    describe('kickMember lines 249', () => {
        test('kickMember updates cache (line 249)', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // kicker
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }); // target
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', leader_id: 'p1' });
            mockDb.removeMember.mockResolvedValue(true);

            // Set up online members cache
            gm.onlineMembers.set('g1', new Set(['p1', 'p2']));
            expect(gm.isPlayerOnline('g1', 'p2')).toBe(true);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(true);
            expect(gm.isPlayerOnline('g1', 'p2')).toBe(false);
        });
    });

    describe('promoteMember lines 292, 303-315', () => {
        test('promote to OFFICER (line 292)', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // promoter
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }); // target
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(true);
            expect(result.message).toContain('OFFICER');
        });

        test('promote fails when target not in guild (lines 303-315)', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // promoter
                .mockResolvedValueOnce(null); // target not in guild
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in your guild');
        });
    });

    describe('transferLeadership lines 368-381', () => {
        test('transfer succeeds (lines 368-381)', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // current leader
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' }); // new leader
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.transferLeadership.mockResolvedValue(true);
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(true);
            expect(result.message).toContain('transferred');
        });
    });
});
