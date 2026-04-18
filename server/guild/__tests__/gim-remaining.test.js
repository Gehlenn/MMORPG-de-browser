/**
 * GuildInvitationManager Remaining Lines (58-91, 178, 232)
 */

const GuildInvitationManager = require('../GuildInvitationManager');

describe('GuildInvitationManager Remaining Lines', () => {
    let mockDb, mockPlayerManager, mockGuildManager, im;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildInvitations: jest.fn(),
            getPlayerInvitations: jest.fn(),
            createInvitation: jest.fn(),
            getInvitationById: jest.fn(),
            respondToInvitation: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            sendToPlayer: jest.fn()
        };
        
        mockGuildManager = {
            playerManager: mockPlayerManager
        };
        
        im = new GuildInvitationManager(mockGuildManager, mockDb);
    });

    describe('createInvitation lines 58-91', () => {
        beforeEach(() => {
            // Default mocks to reach line 58+
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // inviter
                .mockResolvedValueOnce(null); // invitee not in guild
        });

        test('fails when guild not found (lines 58-60)', async () => {
            mockDb.getGuildById.mockResolvedValue(null);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Guild not found');
        });

        test('fails when guild is full (lines 62-64)', async () => {
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                memberCount: 100,
                maxMembers: 100
            });

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Guild is full');
        });

        test('fails when too many guild invitations (lines 67-71)', async () => {
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                memberCount: 5,
                maxMembers: 100
            });
            const pendingInvites = Array(50).fill({ status: 'PENDING', invitee_id: 'px' });
            mockDb.getGuildInvitations.mockResolvedValue(pendingInvites);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Too many pending invitations for this guild');
        });

        test('fails when player has too many invitations (lines 74-77)', async () => {
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                memberCount: 5,
                maxMembers: 100
            });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            const playerInvites = Array(10).fill({ status: 'PENDING' });
            mockDb.getPlayerInvitations.mockResolvedValue(playerInvites);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Player has too many pending invitations');
        });

        test('fails when existing pending invite (lines 80-83)', async () => {
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                memberCount: 5,
                maxMembers: 100
            });
            const pendingInvites = [{ status: 'PENDING', invitee_id: 'p2' }];
            mockDb.getGuildInvitations.mockResolvedValue(pendingInvites);
            mockDb.getPlayerInvitations.mockResolvedValue([]);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Player already has a pending invitation from this guild');
        });

        test('succeeds and sends notification (lines 86-94)', async () => {
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Test Guild',
                tag: 'TST',
                memberCount: 5,
                maxMembers: 100
            });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            mockDb.createInvitation.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p2',
                inviter_id: 'p1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(true);
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });
    });

    describe('acceptInvitation line 178', () => {
        test('fails when invitation already processed (line 178)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                status: 'ACCEPTED' // Already processed
            };
            mockDb.getInvitationById.mockResolvedValue(invitation);

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invitation already processed');
        });
    });

    describe('declineInvitation line 232', () => {
        test('fails when invitation already processed (line 232)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                status: 'DECLINED' // Already processed
            };
            mockDb.getInvitationById.mockResolvedValue(invitation);

            const result = await im.declineInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invitation already processed');
        });
    });
});
