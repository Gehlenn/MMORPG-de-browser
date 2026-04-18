/**
 * GuildInvitationManager Targeted Tests for Uncovered Lines
 * Lines: 190, 203, 237, 310-333, 354-358, 419-420
 */

const GuildInvitationManager = require('../GuildInvitationManager');

describe('GuildInvitationManager Targeted Lines', () => {
    let mockDb, mockPlayerManager, mockGuildManager, im;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildInvitations: jest.fn(),
            getPlayerInvitations: jest.fn(),
            getInvitationById: jest.fn(),
            respondToInvitation: jest.fn(),
            addGuildMember: jest.fn(),
            run: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            sendToPlayer: jest.fn()
        };
        
        // Mock guildManager with respondToInvitation
        mockGuildManager = {
            playerManager: mockPlayerManager,
            respondToInvitation: jest.fn()
        };
        
        im = new GuildInvitationManager(mockGuildManager, mockDb);
    });

    describe('acceptInvitation line 190, 203', () => {
        test('uses guildManager.respondToInvitation when available (line 190)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild.mockResolvedValueOnce(null);
            mockGuildManager.respondToInvitation.mockResolvedValue({ 
                success: true, 
                invitation: { ...invitation, status: 'ACCEPTED' }
            });

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(mockGuildManager.respondToInvitation).toHaveBeenCalledWith('p1', 'inv1', true);
            expect(result.success).toBe(true);
        });

        test('returns result from guildManager (line 203)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild.mockResolvedValueOnce(null);
            mockGuildManager.respondToInvitation.mockResolvedValue({ 
                success: true,
                guild: { id: 'g1', name: 'Test' },
                newRank: 'MEMBER'
            });

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('guild');
        });
    });

    describe('declineInvitation line 237', () => {
        test('uses guildManager.respondToInvitation when available (line 237)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockGuildManager.respondToInvitation.mockResolvedValue({ 
                success: true, 
                invitation: { ...invitation, status: 'DECLINED' }
            });

            const result = await im.declineInvitation('p1', 'inv1');

            expect(mockGuildManager.respondToInvitation).toHaveBeenCalledWith('p1', 'inv1', false);
            expect(result.success).toBe(true);
        });
    });

    describe('getGuildInvitations lines 310-333', () => {
        test('fails when not officer (line 310-312)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await im.getGuildInvitations('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can view invitations');
        });

        test('enriches with invitee info (lines 317-330)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            const rawInvites = [
                { id: 'inv1', invitee_id: 'p2', created_at: '2024-01-01', expires_at: '2024-01-02', status: 'PENDING' }
            ];
            mockDb.getGuildInvitations.mockResolvedValue(rawInvites);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2', level: 15 });

            const result = await im.getGuildInvitations('p1', 'g1');

            expect(result.success).toBe(true);
            expect(result.invitations[0]).toHaveProperty('inviteeName', 'Player2');
            expect(result.invitations[0]).toHaveProperty('inviteeLevel', 15);
        });

        test('handles missing invitee gracefully (line 319)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            const rawInvites = [
                { id: 'inv1', invitee_id: 'p2', created_at: '2024-01-01', expires_at: null, status: 'PENDING' }
            ];
            mockDb.getGuildInvitations.mockResolvedValue(rawInvites);
            mockPlayerManager.getPlayer.mockResolvedValue(null); // Player not found

            const result = await im.getGuildInvitations('p1', 'g1');

            expect(result.success).toBe(true);
            expect(result.invitations[0]).toHaveProperty('inviteeName', undefined);
        });
    });

    describe('declineAllOtherInvitations lines 354-358', () => {
        test('declines other pending invitations (lines 354-358)', async () => {
            const invitations = [
                { id: 'inv1', status: 'PENDING', inviter_id: 'p1', guild_id: 'g1' },
                { id: 'inv2', status: 'PENDING', inviter_id: 'p2', guild_id: 'g2' },
                { id: 'inv3', status: 'ACCEPTED', inviter_id: 'p3', guild_id: 'g3' }
            ];
            mockDb.getPlayerInvitations.mockResolvedValue(invitations);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            // Call the private method directly
            await im.declineAllOtherInvitations('p4', 'inv3');

            // inv1 and inv2 should be declined (PENDING and not acceptedInvitationId)
            expect(mockDb.respondToInvitation).toHaveBeenCalledWith('inv1', 'DECLINED');
            expect(mockDb.respondToInvitation).toHaveBeenCalledWith('inv2', 'DECLINED');
            // inv3 should not be declined (it's the accepted one)
            expect(mockDb.respondToInvitation).not.toHaveBeenCalledWith('inv3', 'DECLINED');
        });

        test('notifies inviter when declining (line 357-358)', async () => {
            const invitations = [
                { id: 'inv1', status: 'PENDING', inviter_id: 'p1', guild_id: 'g1' }
            ];
            mockDb.getPlayerInvitations.mockResolvedValue(invitations);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            await im.declineAllOtherInvitations('p2', 'inv2');

            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalledWith('p1', {
                type: 'guild:invite_declined_auto',
                data: { playerId: 'p2', guildId: 'g1' }
            });
        });
    });

    describe('formatInvitation lines 419-420', () => {
        test('formats invitation with all fields', () => {
            const rawInvitation = {
                id: 'inv1',
                guild_id: 'g1',
                guild_name: 'Test Guild',
                guild_tag: 'TST',
                guild_member_count: 5,
                guild_max_members: 100,
                inviter_id: 'p1',
                inviter_name: 'Leader',
                invitee_id: 'p2',
                status: 'PENDING',
                created_at: '2024-01-01T00:00:00.000Z',
                expires_at: '2024-01-02T00:00:00.000Z'
            };

            const result = im.formatInvitation(rawInvitation);

            expect(result.id).toBe('inv1');
            expect(result.guildId).toBe('g1');
            expect(result.guildName).toBe('Test Guild');
            expect(result.guildTag).toBe('TST');
            expect(result.guildMemberCount).toBe(5);
            expect(result.guildMaxMembers).toBe(100);
            expect(result.inviterId).toBe('p1');
            expect(result.inviterName).toBe('Leader');
            expect(result.inviteeId).toBe('p2');
            expect(result.status).toBe('PENDING');
            expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
            expect(result.expiresAt).toBe('2024-01-02T00:00:00.000Z');
        });

        test('handles missing fields gracefully', () => {
            const rawInvitation = {
                id: 'inv1',
                guild_id: 'g1',
                inviter_id: 'p1',
                invitee_id: 'p2',
                status: 'PENDING',
                created_at: '2024-01-01T00:00:00.000Z'
            };

            const result = im.formatInvitation(rawInvitation);

            expect(result.id).toBe('inv1');
            expect(result.guildName).toBeUndefined();
            expect(result.expiresAt).toBeUndefined();
        });
    });
});
