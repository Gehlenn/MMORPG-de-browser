/**
 * GuildInvitationManager.test.js
 * Unit tests for GuildInvitationManager
 */

const GuildInvitationManager = require('../GuildInvitationManager');

// Mock dependencies
const mockGuildManager = {
    getPlayerGuildInfo: jest.fn(),
    emit: jest.fn()
};

const mockGuildDb = {
    createInvitation: jest.fn(),
    cancelInvitation: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
    getPendingInvitations: jest.fn(),
    getPlayerGuild: jest.fn(),
    addMember: jest.fn(),
    cleanupExpiredInvitations: jest.fn()
};

describe('GuildInvitationManager', () => {
    let invitationManager;

    beforeEach(() => {
        invitationManager = new GuildInvitationManager(mockGuildManager, mockGuildDb);
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('createInvitation', () => {
        test('should create invitation successfully', async () => {
            mockGuildDb.getPlayerGuild.mockResolvedValue(null); // Player not in guild
            mockGuildDb.createInvitation.mockResolvedValue({
                id: 1,
                guild_id: 1,
                inviter_id: 'inviter123',
                invitee_id: 'invitee456',
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
            });

            const result = await invitationManager.createInvitation('inviter123', 1, 'invitee456');

            expect(result.success).toBe(true);
            expect(mockGuildDb.createInvitation).toHaveBeenCalledWith(
                1, 'inviter123', 'invitee456'
            );
        });

        test('should fail when invitee is already in a guild', async () => {
            mockGuildDb.getPlayerGuild.mockResolvedValue({ guild_id: 2 });

            const result = await invitationManager.createInvitation('inviter123', 1, 'invitee456');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });
    });

    describe('cancelInvitation', () => {
        test('should cancel invitation when inviter cancels', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([{
                id: 1,
                guild_id: 1,
                inviter_id: 'inviter123',
                invitee_id: 'invitee456'
            }]);
            mockGuildDb.cancelInvitation.mockResolvedValue(true);

            const result = await invitationManager.cancelInvitation('inviter123', 1);

            expect(result.success).toBe(true);
            expect(mockGuildDb.cancelInvitation).toHaveBeenCalledWith(1);
        });

        test('should fail when invitation not found', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([]);

            const result = await invitationManager.cancelInvitation('inviter123', 999);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('should fail when non-inviter tries to cancel', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([{
                id: 1,
                guild_id: 1,
                inviter_id: 'inviter123',
                invitee_id: 'invitee456'
            }]);

            const result = await invitationManager.cancelInvitation('otherPlayer', 1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('permission');
        });
    });

    describe('acceptInvitation', () => {
        test('should accept invitation and add member', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([{
                id: 1,
                guild_id: 1,
                guild_name: 'Test Guild',
                tag: 'TEST',
                inviter_id: 'inviter123',
                invitee_id: 'invitee456'
            }]);
            mockGuildDb.acceptInvitation.mockResolvedValue(true);
            mockGuildDb.addMember.mockResolvedValue({ id: 1 });

            const result = await invitationManager.acceptInvitation('invitee456', 1);

            expect(result.success).toBe(true);
            expect(mockGuildDb.addMember).toHaveBeenCalledWith(1, 'invitee456', 'INITIATE');
            expect(mockGuildManager.emit).toHaveBeenCalledWith('invitation:accepted', expect.any(Object));
        });

        test('should fail when invitation expired', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([]);

            const result = await invitationManager.acceptInvitation('invitee456', 1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });

    describe('declineInvitation', () => {
        test('should decline invitation', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([{
                id: 1,
                guild_id: 1,
                inviter_id: 'inviter123',
                invitee_id: 'invitee456'
            }]);
            mockGuildDb.declineInvitation.mockResolvedValue(true);

            const result = await invitationManager.declineInvitation('invitee456', 1);

            expect(result.success).toBe(true);
            expect(mockGuildDb.declineInvitation).toHaveBeenCalledWith(1);
        });
    });

    describe('getPlayerInvitations', () => {
        test('should return pending invitations for player', async () => {
            const mockInvitations = [
                {
                    id: 1,
                    guild_id: 1,
                    guild_name: 'Guild One',
                    tag: 'G1',
                    inviter_name: 'PlayerOne'
                },
                {
                    id: 2,
                    guild_id: 2,
                    guild_name: 'Guild Two',
                    tag: 'G2',
                    inviter_name: 'PlayerTwo'
                }
            ];
            mockGuildDb.getPendingInvitations.mockResolvedValue(mockInvitations);

            const result = await invitationManager.getPlayerInvitations('player123');

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('guild_name', 'Guild One');
            expect(mockGuildDb.getPendingInvitations).toHaveBeenCalledWith('player123');
        });

        test('should return empty array when no invitations', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([]);

            const result = await invitationManager.getPlayerInvitations('player123');

            expect(result).toEqual([]);
        });
    });

    describe('cleanupExpiredInvitations', () => {
        test('should cleanup expired invitations periodically', async () => {
            mockGuildDb.cleanupExpiredInvitations.mockResolvedValue(5);

            // Start cleanup interval
            invitationManager.startCleanupInterval(60000); // 1 minute for testing

            // Fast forward time
            jest.advanceTimersByTime(60000);

            expect(mockGuildDb.cleanupExpiredInvitations).toHaveBeenCalled();
        });

        test('should stop cleanup interval', () => {
            invitationManager.startCleanupInterval(60000);
            invitationManager.stopCleanupInterval();

            jest.advanceTimersByTime(60000);

            // Should not have been called after stopping
            expect(mockGuildDb.cleanupExpiredInvitations).not.toHaveBeenCalled();
        });
    });

    describe('canInvite', () => {
        test('should return true when invitee not in guild', async () => {
            mockGuildDb.getPlayerGuild.mockResolvedValue(null);

            const result = await invitationManager.canInvite('invitee456');

            expect(result).toBe(true);
        });

        test('should return false when invitee in guild', async () => {
            mockGuildDb.getPlayerGuild.mockResolvedValue({ guild_id: 1 });

            const result = await invitationManager.canInvite('invitee456');

            expect(result).toBe(false);
        });
    });

    describe('getInvitationStatus', () => {
        test('should return status for valid invitation', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([{
                id: 1,
                guild_id: 1,
                guild_name: 'Test Guild',
                tag: 'TEST',
                inviter_name: 'Inviter',
                created_at: new Date(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }]);

            const result = await invitationManager.getInvitationStatus('player123', 1);

            expect(result.valid).toBe(true);
            expect(result.invitation).toHaveProperty('guild_name', 'Test Guild');
        });

        test('should return invalid for non-existent invitation', async () => {
            mockGuildDb.getPendingInvitations.mockResolvedValue([]);

            const result = await invitationManager.getInvitationStatus('player123', 999);

            expect(result.valid).toBe(false);
        });
    });
});
