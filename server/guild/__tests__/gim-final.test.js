/**
 * Final tests for GuildInvitationManager remaining lines
 * Lines: 311, 354-358
 */

const GuildInvitationManager = require('../GuildInvitationManager');

describe('GuildInvitationManager final lines', () => {
    let mockDb, mockGuildManager, im;

    beforeEach(() => {
        mockDb = {
            getPlayerGuild: jest.fn(),
            getGuildInvitations: jest.fn(),
            getPlayerInvitations: jest.fn(),
            respondToInvitation: jest.fn()
        };
        mockGuildManager = {
            playerManager: {
                getPlayer: jest.fn(),
                sendToPlayer: jest.fn()
            }
        };
        im = new GuildInvitationManager(mockGuildManager, mockDb);
    });

    describe('Line 311 - getGuildInvitations permission check', () => {
        test('getGuildInvitations fails when not officer (line 311)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await im.getGuildInvitations('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can view');
        });
    });

    describe('Lines 354-358 - declineAllOtherInvitations loop', () => {
        test('declineAllOtherInvitations declines other pending invitations (lines 354-358)', async () => {
            mockDb.getPlayerInvitations.mockResolvedValue([
                { id: 'inv1', status: 'PENDING', guild_id: 'g1', inviter_id: 'p2' },
                { id: 'inv2', status: 'PENDING', guild_id: 'g2', inviter_id: 'p3' },  // Should be declined
                { id: 'inv3', status: 'ACCEPTED', guild_id: 'g3', inviter_id: 'p4' }  // Not pending, skip
            ]);
            mockDb.respondToInvitation.mockResolvedValue({ success: true });

            await im.declineAllOtherInvitations('p1', 'inv1');

            // Should decline inv2 but not inv1 (accepted) or inv3 (not pending)
            expect(mockDb.respondToInvitation).toHaveBeenCalledWith('inv2', 'DECLINED');
            expect(mockDb.respondToInvitation).not.toHaveBeenCalledWith('inv1', 'DECLINED');
            
            // Should notify inviter
            expect(mockGuildManager.playerManager.sendToPlayer).toHaveBeenCalledWith('p3', expect.any(Object));
        });

        test('declineAllOtherInvitations handles no other invitations', async () => {
            mockDb.getPlayerInvitations.mockResolvedValue([
                { id: 'inv1', status: 'PENDING', guild_id: 'g1', inviter_id: 'p2' }
            ]);

            await im.declineAllOtherInvitations('p1', 'inv1');

            // Should not call respondToInvitation since only one invitation exists
            expect(mockDb.respondToInvitation).not.toHaveBeenCalled();
        });
    });
});
