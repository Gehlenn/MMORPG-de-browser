/**
 * Test for GuildInvitationManager cleanupExpiredInvitations lines 419-420
 */

const GuildInvitationManager = require('../GuildInvitationManager');

describe('GuildInvitationManager cleanupExpiredInvitations (lines 419-420)', () => {
    let mockDb, mockGuildManager, im;
    let consoleLogSpy, consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        // Console is already mocked by global setup, just get reference
        consoleLogSpy = console.log;
        consoleErrorSpy = console.error;
        
        mockDb = {
            cleanupExpiredInvitations: jest.fn()
        };
        mockGuildManager = {};
        
        im = new GuildInvitationManager(mockGuildManager, mockDb);
    });

    test('cleanupExpiredInvitations logs count when expired > 0 (lines 419-420)', async () => {
        mockDb.cleanupExpiredInvitations.mockResolvedValue(5); // 5 expired invitations

        await im.cleanupExpiredInvitations();

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('5'));
    });

    test('cleanupExpiredInvitations does not log when no expired', async () => {
        mockDb.cleanupExpiredInvitations.mockResolvedValue(0); // No expired

        await im.cleanupExpiredInvitations();

        // Should not log the "Expired X invitations" message
        const expiredLogCalls = consoleLogSpy.mock.calls.filter(
            call => call[0] && call[0].includes('Expired')
        );
        expect(expiredLogCalls).toHaveLength(0);
    });

    test('cleanupExpiredInvitations handles error gracefully', async () => {
        mockDb.cleanupExpiredInvitations.mockRejectedValue(new Error('DB Error'));

        await im.cleanupExpiredInvitations();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error cleaning up'),
            expect.any(Error)
        );
    });
});
