/**
 * GuildInvitationManager Tests
 */

const GuildInvitationManager = require('../GuildInvitationManager');

describe('GuildInvitationManager Coverage', () => {
    let mockDb;
    let mockGuildManager;
    let invitationManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockDb = {
            run: jest.fn((sql, params, callback) => callback.call({ changes: 1 }, null)),
            get: jest.fn((sql, params, callback) => callback(null, null)),
            all: jest.fn((sql, params, callback) => callback(null, [])),
            getPlayerGuild: jest.fn().mockResolvedValue(null),
            getGuildById: jest.fn().mockResolvedValue(null),
            getGuildMembers: jest.fn().mockResolvedValue([]),
            getInvitationById: jest.fn().mockResolvedValue(null),
            getPlayerInvitations: jest.fn().mockResolvedValue([]),
            getGuildInvitations: jest.fn().mockResolvedValue([]),
            createInvitation: jest.fn().mockResolvedValue({ id: 'inv1' }),
            cancelInvitation: jest.fn().mockResolvedValue(true),
            respondToInvitation: jest.fn().mockResolvedValue({ changes: 1 }),
            addGuildMember: jest.fn().mockResolvedValue(true),
            countGuildInvitations: jest.fn().mockResolvedValue(0),
            countPlayerInvitations: jest.fn().mockResolvedValue(0),
            cleanupExpiredInvitations: jest.fn().mockResolvedValue(5)
        };

        mockGuildManager = {
            playerManager: {
                getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'Test' }),
                getPlayerByUsername: jest.fn().mockResolvedValue({ id: 'p2', username: 'Invitee' }),
                sendToPlayer: jest.fn()
            },
            respondToInvitation: jest.fn().mockResolvedValue({ success: true, invitation: { id: 'inv1' } }),
            on: jest.fn(),
            emit: jest.fn()
        };

        invitationManager = new GuildInvitationManager(mockGuildManager, mockDb);
    });

    describe('createInvitation', () => {
        test('fails when inviter not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);
            
            const result = await invitationManager.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in this guild');
        });

        test('fails when inviter lacks permission', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            
            const result = await invitationManager.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can invite');
        });

        test('fails when invitee has pending invitation from this guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', memberCount: 5, maxMembers: 100 });
            // Invite already has a pending invitation from this guild
            mockDb.getGuildInvitations.mockResolvedValue([{ status: 'PENDING', invitee_id: 'p2' }]);
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            
            const result = await invitationManager.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('already has a pending invitation');
        });

        test('fails when invitee already in guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // inviter
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }); // invitee
            
            mockGuildManager.playerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2' });
            
            const result = await invitationManager.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test('fails when guild invitation limit reached', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })  // inviter
                .mockResolvedValueOnce(null);  // invitee not in guild
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', memberCount: 5, maxMembers: 100 });
            // Create 50 pending invitations to reach limit
            mockDb.getGuildInvitations.mockResolvedValue(Array(50).fill({ status: 'PENDING' }));
            mockGuildManager.playerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2' });
            
            const result = await invitationManager.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Too many pending invitations');
        });

        test('fails when player invitation limit reached', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', memberCount: 5, maxMembers: 100 });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockGuildManager.playerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2' });
            // Create 10 pending invitations for player to reach limit
            mockDb.getPlayerInvitations.mockResolvedValue(Array(10).fill({ status: 'PENDING' }));
            
            const result = await invitationManager.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Player has too many pending invitations');
        });

        test('succeeds with valid invitation', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', memberCount: 5, maxMembers: 100 });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            mockGuildManager.playerManager.getPlayerByUsername.mockResolvedValue({
                id: 'p2', username: 'Invitee'
            });
            mockDb.countGuildInvitations.mockResolvedValue(5);
            mockDb.countPlayerInvitations.mockResolvedValue(2);
            mockDb.createInvitation.mockResolvedValue({
                id: 'inv_123',
                guild_id: 'g1',
                invitee_id: 'p2',
                status: 'PENDING',
                created_at: '2024-01-01'
            });
            
            const result = await invitationManager.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(true);
            expect(result.invitation).toHaveProperty('id', 'inv_123');
        });

        test('handles database error', async () => {
            mockDb.getPlayerGuild.mockRejectedValue(new Error('DB Error'));
            
            const result = await invitationManager.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(false);
        });
    });

    describe('acceptInvitation', () => {
        test('fails when invitation not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);
            
            const result = await invitationManager.acceptInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('fails when invitation not for this player', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p2', // Different player
                guild_id: 'g1',
                status: 'PENDING'
            });
            
            const result = await invitationManager.acceptInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Not your invitation');
        });

        test('fails when already in guild', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'existing' });
            
            const result = await invitationManager.acceptInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test('fails when respondToInvitation returns error', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockGuildManager.respondToInvitation.mockResolvedValue({ success: false, error: 'Invitation has expired' });
            
            const result = await invitationManager.acceptInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('expired');
        });

        test('fails when guild is full', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockGuildManager.respondToInvitation.mockResolvedValue({ success: false, error: 'Guild is full' });
            
            const result = await invitationManager.acceptInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('full');
        });

        test('succeeds with valid invitation', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Test Guild',
                member_count: 5,
                max_members: 100
            });
            mockDb.addGuildMember.mockResolvedValue(true);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });
            
            const result = await invitationManager.acceptInvitation('p1', 'inv1');
            
            expect(result.success).toBe(true);
        });
    });

    describe('declineInvitation', () => {
        test('fails when invitation not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);
            
            const result = await invitationManager.declineInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('fails when invitation not for this player', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p2',
                status: 'PENDING'
            });
            
            const result = await invitationManager.declineInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Not your invitation');
        });

        test('succeeds and cancels invitation', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockGuildManager.respondToInvitation.mockResolvedValue({ success: true, invitation: { id: 'inv1', status: 'DECLINED' } });
            
            const result = await invitationManager.declineInvitation('p1', 'inv1');
            
            expect(result.success).toBe(true);
            expect(mockGuildManager.respondToInvitation).toHaveBeenCalledWith('p1', 'inv1', false);
        });

        test('handles database error', async () => {
            mockDb.getInvitationById.mockRejectedValue(new Error('DB Error'));
            
            const result = await invitationManager.declineInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
        });
    });

    describe('cancelInvitation', () => {
        test('fails when invitation not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);
            
            const result = await invitationManager.cancelInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
        });

        test('fails when not the inviter', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                inviter_id: 'p2', // Different player
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            
            const result = await invitationManager.cancelInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Not authorized');
        });

        test('succeeds for inviter', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                inviter_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.cancelInvitation.mockResolvedValue(true);
            
            const result = await invitationManager.cancelInvitation('p1', 'inv1');
            
            expect(result.success).toBe(true);
        });

        test('succeeds for leader', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                inviter_id: 'p2', // Different player
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.cancelInvitation.mockResolvedValue(true);
            
            const result = await invitationManager.cancelInvitation('p1', 'inv1');
            
            expect(result.success).toBe(true);
        });
    });

    describe('getPlayerInvitations', () => {
        test('returns invitations list', async () => {
            mockDb.getPlayerInvitations.mockResolvedValue([
                { id: 'inv1', guild_id: 'g1', inviter_id: 'p2', created_at: '2024-01-01', status: 'PENDING' },
                { id: 'inv2', guild_id: 'g2', inviter_id: 'p3', created_at: '2024-01-01', status: 'PENDING' }
            ]);
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Guild 1', tag: 'G1', memberCount: 5, maxMembers: 100 });
            mockGuildManager.playerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Inviter' });
            
            const result = await invitationManager.getPlayerInvitations('p1');
            
            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(2);
        });

        test('handles database error', async () => {
            mockDb.getPlayerInvitations.mockRejectedValue(new Error('DB Error'));
            
            const result = await invitationManager.getPlayerInvitations('p1');
            
            expect(result.success).toBe(false);
        });
    });

    describe('getGuildInvitations', () => {
        test('returns guild invitations', async () => {
            mockDb.getGuildInvitations.mockResolvedValue([
                { id: 'inv1', invitee_id: 'p2', inviter_id: 'p1', guild_id: 'g1', created_at: '2024-01-01', status: 'PENDING' }
            ]);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockGuildManager.playerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Test' });
            
            const result = await invitationManager.getGuildInvitations('p1', 'g1');
            
            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(1);
        });
    });

    describe('cleanupExpiredInvitations', () => {
        test('cleans up expired invitations', async () => {
            const result = await invitationManager.cleanupExpiredInvitations();
            
            expect(result.success).toBe(true);
            expect(result.count).toBe(5);
        });
    });

    describe('constants', () => {
        test('expiration hours is 24', () => {
            expect(invitationManager.EXPIRATION_HOURS).toBe(24);
        });

        test('max guild invitations is 50', () => {
            expect(invitationManager.MAX_GUILD_INVITATIONS).toBe(50);
        });

        test('max player invitations is 10', () => {
            expect(invitationManager.MAX_PLAYER_INVITATIONS).toBe(10);
        });
    });
});
