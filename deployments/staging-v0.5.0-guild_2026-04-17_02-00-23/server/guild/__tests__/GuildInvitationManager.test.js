/**
 * GuildInvitationManager.test.js
 * Unit tests for GuildInvitationManager
 */

const GuildInvitationManager = require('../GuildInvitationManager');

describe('GuildInvitationManager', () => {
    let invitationManager;
    let mockDb;
    let mockGuildManager;

    beforeEach(() => {
        mockDb = {
            createInvitation: jest.fn(),
            getPlayerInvitations: jest.fn(),
            getGuildInvitations: jest.fn(),
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getInvitationById: jest.fn(),
            cancelInvitation: jest.fn()
        };

        mockGuildManager = {
            playerManager: {
                sendToPlayer: jest.fn()
            },
            respondToInvitation: jest.fn()
        };

        invitationManager = new GuildInvitationManager(mockGuildManager, mockDb);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createInvitation', () => {
        test('should create invitation when valid', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'guild_123', rank: 'LEADER' }) // Inviter
                .mockResolvedValueOnce(null); // Invitee

            mockDb.getGuildById.mockResolvedValue({
                id: 'guild_123',
                memberCount: 5,
                maxMembers: 100
            });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            mockDb.createInvitation.mockResolvedValue({
                id: 'invite_1',
                guild_id: 'guild_123',
                inviter_id: 'inviter_123',
                invitee_id: 'invitee_456',
                status: 'PENDING'
            });

            const result = await invitationManager.createInvitation(
                'guild_123',
                'inviter_123',
                'invitee_456'
            );

            expect(result.success).toBe(true);
        });

        test('should fail when invitee already in guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'guild_123', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'other_guild' });

            const result = await invitationManager.createInvitation(
                'guild_123',
                'inviter_123',
                'invitee_456'
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });
    });

    describe('acceptInvitation', () => {
        test('should call getInvitationById with correct params', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);

            await invitationManager.acceptInvitation('player_456', 'invite_1');

            expect(mockDb.getInvitationById).toHaveBeenCalledWith('invite_1');
        });
    });

    describe('declineInvitation', () => {
        test('should call getInvitationById with correct params', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);

            await invitationManager.declineInvitation('player_456', 'invite_1');

            expect(mockDb.getInvitationById).toHaveBeenCalledWith('invite_1');
        });
    });
});
