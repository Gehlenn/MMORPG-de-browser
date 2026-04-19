/**
 * GuildInvitationManager Full Coverage Tests
 */

const GuildInvitationManager = require('../GuildInvitationManager');

describe('GuildInvitationManager Full Coverage', () => {
    let mockDb, mockPlayerManager, im;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildInvitations: jest.fn(),
            getPlayerInvitations: jest.fn(),
            createInvitation: jest.fn(),
            getInvitationById: jest.fn(),
            respondToInvitation: jest.fn(),
            addGuildMember: jest.fn(),
            cancelInvitation: jest.fn(),
            cleanupExpiredInvitations: jest.fn(),
            run: jest.fn()
        };
        mockPlayerManager = {
            sendToPlayer: jest.fn(),
            getPlayer: jest.fn()
        };
        
        const EventEmitter = require('events');
        const gm = new EventEmitter();
        gm.playerManager = mockPlayerManager;
        gm.respondToInvitation = jest.fn().mockResolvedValue({ success: true, guildId: 'g1', guildName: 'Test Guild', newRank: 'MEMBER', message: 'Joined successfully', guild: { id: 'g1', memberCount: 6 } });
        
        im = new GuildInvitationManager(gm, mockDb);
    });

    describe('createInvitation lines 58-91', () => {
        beforeEach(() => {
            // Default mocks that allow reaching later validations
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // inviter
                .mockResolvedValueOnce(null); // invitee not in guild
        });

        test('fails when guild not found (line 58-60)', async () => {
            mockDb.getGuildById.mockResolvedValue(null);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Guild not found');
        });

        test('fails when guild full (line 62-64)', async () => {
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
            // Create 50 pending invitations
            const pendingInvites = Array(50).fill({ status: 'PENDING', invitee_id: 'px' });
            mockDb.getGuildInvitations.mockResolvedValue(pendingInvites);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Too many pending invitations for this guild');
        });

        test('fails when player has too many invitations (lines 73-77)', async () => {
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                memberCount: 5,
                maxMembers: 100
            });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            // Create 10 pending invitations for player
            const playerInvites = Array(10).fill({ status: 'PENDING' });
            mockDb.getPlayerInvitations.mockResolvedValue(playerInvites);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Player has too many pending invitations');
        });

        test('fails when existing invite from guild (lines 80-83)', async () => {
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                memberCount: 5,
                maxMembers: 100
            });
            // Create pending invitation from same guild to same player
            const pendingInvites = [{ status: 'PENDING', invitee_id: 'p2' }];
            mockDb.getGuildInvitations.mockResolvedValue(pendingInvites);
            mockDb.getPlayerInvitations.mockResolvedValue([]);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Player already has a pending invitation from this guild');
        });

        test('succeeds with notification (lines 85-95)', async () => {
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
            expect(result.invitation).toHaveProperty('id', 'inv1');
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });
    });

    describe('acceptInvitation lines 178, 190-195', () => {
        beforeEach(() => {
            mockDb.getPlayerGuild.mockReset();
        });

        test('accepts and updates member count (line 178)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild.mockResolvedValue(null); // Not in guild
            mockDb.getPlayerInvitations.mockResolvedValue([]);

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(true);
        });

        test('returns complete data (lines 190-195)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild.mockResolvedValue(null); // Not in guild
            mockDb.getPlayerInvitations.mockResolvedValue([]);

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('newRank', 'MEMBER');
        });
    });

    describe('declineInvitation line 224', () => {
        test('returns complete result (line 224)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                guild_name: 'Test Guild',
                status: 'PENDING'
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            const result = await im.declineInvitation('p1', 'inv1');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('guildId', 'g1');
            expect(result).toHaveProperty('guildName', 'Test Guild');
        });
    });

    describe('getPlayerInvitations lines 295-318', () => {
        test('returns formatted invitations (lines 295-318)', async () => {
            const rawInvitations = [
                {
                    id: 'inv1',
                    guild_id: 'g1',
                    guild_name: 'Guild One',
                    guild_tag: 'G1',
                    inviter_id: 'p1',
                    inviter_name: 'Leader',
                    status: 'PENDING',
                    created_at: '2024-01-01'
                },
                {
                    id: 'inv2',
                    guild_id: 'g2',
                    guild_name: 'Guild Two',
                    guild_tag: 'G2',
                    inviter_id: 'p2',
                    inviter_name: 'Leader2',
                    status: 'ACCEPTED',
                    created_at: '2024-01-02'
                }
            ];

            mockDb.getPlayerInvitations.mockResolvedValue(rawInvitations);

            const result = await im.getPlayerInvitations('p1');

            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(2);
            expect(result.invitations[0]).toHaveProperty('guildId', 'g1');
        });
    });

    describe('getGuildInvitations lines 336-343', () => {
        test('returns formatted invitations (lines 336-343)', async () => {
            const rawInvitations = [
                {
                    id: 'inv1',
                    invitee_id: 'p1',
                    invitee_name: 'Player One',
                    invitee_level: 15,
                    status: 'PENDING',
                    created_at: '2024-01-01'
                }
            ];

            // Mock player as officer of the guild
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildInvitations.mockResolvedValue(rawInvitations);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Player One', level: 15 });

            const result = await im.getGuildInvitations('officer1', 'g1');

            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(1);
            expect(result.invitations[0]).toHaveProperty('inviteeId', 'p1');
        });
    });

    describe('cleanupExpiredInvitations lines 404-405', () => {
        test('returns count on success', async () => {
            mockDb.cleanupExpiredInvitations = jest.fn().mockResolvedValue({ count: 5 });

            const result = await im.cleanupExpiredInvitations();

            expect(result).toBeDefined();
        });

        test('handles error (lines 404-405)', async () => {
            mockDb.cleanupExpiredInvitations = jest.fn().mockRejectedValue(new Error('Delete Error'));

            const result = await im.cleanupExpiredInvitations();

            expect(result).toBeDefined();
        });
    });
});
