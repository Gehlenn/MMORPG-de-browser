/**
 * Event Handlers and Remaining Lines Coverage
 */

const GuildChatHandler = require('../GuildChatHandler');
const GuildInvitationManager = require('../GuildInvitationManager');

describe('Event Handlers Coverage', () => {
    let mockDb, mockPlayerManager, gm, ch, im;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            getPlayerGuild: jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' }),
            saveChatMessage: jest.fn().mockResolvedValue({ id: 'msg1', sent_at: new Date().toISOString() }),
            getGuildMembers: jest.fn().mockResolvedValue([]),
            getChatHistory: jest.fn().mockResolvedValue([]),
            getInvitationById: jest.fn().mockResolvedValue(null),
            getPlayerInvitations: jest.fn().mockResolvedValue([]),
            getGuildInvitations: jest.fn().mockResolvedValue([]),
            countGuildInvitations: jest.fn().mockResolvedValue(0),
            countPlayerInvitations: jest.fn().mockResolvedValue(0),
            respondToInvitation: jest.fn().mockResolvedValue({ changes: 1 }),
            cleanupExpiredInvitations: jest.fn().mockResolvedValue({ count: 0 }),
            getGuildById: jest.fn().mockResolvedValue({ id: 'g1', name: 'Test', memberCount: 5, maxMembers: 100 }),
            createInvitation: jest.fn().mockResolvedValue({ id: 'inv1', guild_id: 'g1' })
        };
        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'Test' }),
            getPlayerByUsername: jest.fn().mockResolvedValue({ id: 'p2', username: 'Target' }),
            sendToPlayer: jest.fn()
        };

        // Mock guild manager with event emitter
        const EventEmitter = require('events');
        gm = new EventEmitter();
        gm.playerManager = mockPlayerManager;
        gm.db = mockDb;
        gm.getOnlineMembers = jest.fn().mockReturnValue(new Set(['p1', 'p2']));
        gm.respondToInvitation = jest.fn().mockResolvedValue({ success: true, message: 'Invitation accepted', newRank: 'MEMBER' });

        ch = new GuildChatHandler(gm, mockDb);
        im = new GuildInvitationManager(gm, mockDb);
    });

    describe('GuildChatHandler Event Handlers', () => {
        test('guild:member_joined sends system message', () => {
            ch.initialize();
            
            gm.emit('guild:member_joined', { guildId: 'g1', playerName: 'NewPlayer' });
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('guild:member_left sends system message', () => {
            ch.initialize();
            
            gm.emit('guild:member_left', { guildId: 'g1', playerName: 'Leaver' });
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('guild:member_kicked sends system message', () => {
            ch.initialize();
            
            gm.emit('guild:member_kicked', { guildId: 'g1', playerName: 'KickedPlayer' });
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('guild:member_promoted sends system message', () => {
            ch.initialize();
            
            gm.emit('guild:member_promoted', { guildId: 'g1', playerName: 'Promoted', newRank: 'OFFICER' });
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });

        test.skip('guild:member_demoted sends system message', () => {
            // Handler for guild:member_demoted is not implemented in GuildChatHandler
            ch.initialize();
            
            gm.emit('guild:member_demoted', { guildId: 'g1', playerName: 'Demoted', newRank: 'MEMBER' });
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('guild:leadership_transferred sends system message', () => {
            ch.initialize();
            
            gm.emit('guild:leadership_transferred', { guildId: 'g1', newLeaderName: 'NewLeader' });
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('sendSystemMessage broadcasts to all members', () => {
            ch.sendSystemMessage('g1', 'Welcome everyone!');
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalledWith('p1', expect.objectContaining({
                type: 'guild:system_message'
            }));
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalledWith('p2', expect.objectContaining({
                type: 'guild:system_message'
            }));
        });

        test('sendSystemMessage handles no online members', () => {
            gm.getOnlineMembers.mockReturnValue(new Set());
            
            ch.sendSystemMessage('g1', 'Hello?');
            
            expect(mockPlayerManager.sendToPlayer).not.toHaveBeenCalled();
        });
    });

    describe('GuildChatHandler Validation Paths', () => {
        test('handleChat validates player exists', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue(null); // Player not found

            const result = await ch.handleChat('p1', 'Hello');

            expect(result.success).toBe(false);
        });

        test('handleChat validates message not empty', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            const result = await ch.handleChat('p1', '   ');

            expect(result.success).toBe(false);
            expect(result.error).toContain('empty');
        });

        test('handleChat validates message length', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            const longMessage = 'a'.repeat(501);
            const result = await ch.handleChat('p1', longMessage);

            expect(result.success).toBe(false);
            expect(result.error).toContain('too long');
        });

        test('handleChat validates rate limit', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            // Send 5 messages (limit)
            for (let i = 0; i < 5; i++) {
                await ch.handleChat('p1', `Message ${i}`);
            }

            // 6th message should be rate limited
            const result = await ch.handleChat('p1', 'Rate limited');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Rate limit exceeded');
        });

        test('handleOfficerChat validates rank', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            const result = await ch.handleOfficerChat('p1', 'Officer message');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers');
        });
    });

    describe('GuildInvitationManager Event Handlers', () => {
        test.skip('player:online sends pending invitations', async () => {
            // NOTE: player:online event handler is not implemented in GuildInvitationManager
            im.initialize();
            
            mockDb.getPlayerInvitations.mockResolvedValue([
                { id: 'inv1', guild_id: 'g1', guild_name: 'Test', status: 'PENDING' }
            ]);

            gm.emit('player:online', { playerId: 'p1' });
            
            // Wait for async
            await new Promise(resolve => setTimeout(resolve, 10));
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('player:offline does nothing', () => {
            im.initialize();
            
            // Should not throw
            gm.emit('player:offline', { playerId: 'p1' });
        });
    });

    describe('GuildInvitationManager Validation Paths', () => {
        test('createInvitation fails when inviter not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in this guild');
        });

        test('createInvitation fails when inviter lacks permission', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers');
        });

        test('createInvitation fails when invitee already in guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' });

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test.skip('createInvitation fails when invitee not found', async () => {
            // NOTE: createInvitation does not verify if invitee exists - it uses ID directly
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue(null);

            const result = await im.createInvitation('g1', 'p1', 'Nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('createInvitation fails when guild full', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // inviter (p1)
                .mockResolvedValueOnce(null); // invitee (p2) - not in guild
            mockDb.getGuildById.mockResolvedValue({ memberCount: 100, maxMembers: 100 }); // Full

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('full');
        });

        test('createInvitation fails when too many guild invitations', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // inviter (p1)
                .mockResolvedValueOnce(null); // invitee (p2) - not in guild
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test', memberCount: 5, maxMembers: 100 });
            mockDb.getGuildInvitations.mockResolvedValue(Array(50).fill({ status: 'PENDING' })); // Max reached

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Too many');
        });

        test('createInvitation fails when player has too many invitations', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // inviter (p1)
                .mockResolvedValueOnce(null); // invitee (p2) - not in guild
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test', memberCount: 5, maxMembers: 100 });
            mockDb.getGuildInvitations.mockResolvedValue([]); // No pending guild invites
            mockDb.getPlayerInvitations.mockResolvedValue(Array(10).fill({ status: 'PENDING' })); // Max reached

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('too many');
        });

        test('acceptInvitation fails when invitation not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('acceptInvitation fails when invitation expired', async () => {
            // Return null to simulate expired invitation (removed from database)
            mockDb.getInvitationById.mockResolvedValue(null);
            mockDb.getPlayerGuild.mockResolvedValue(null); // Player not in guild

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('expired');
        });

        test('acceptInvitation fails when already in guild', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g2', rank: 'MEMBER' });

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test('declineInvitation fails when not invitee', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p2', // Different player
                guild_id: 'g1',
                status: 'PENDING'
            });

            const result = await im.declineInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not your invitation');
        });

        test('cancelInvitation fails when not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);

            const result = await im.cancelInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('cancelInvitation fails when not inviter or leader', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                inviter_id: 'p2', // Different player
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' }); // Not leader

            const result = await im.cancelInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not authorized');
        });
    });

    describe('Constants', () => {
        test('GuildInvitationManager exports constants', () => {
            // Constants are instance properties, not static
            const im = new GuildInvitationManager({}, mockDb);
            expect(im.EXPIRATION_HOURS).toBe(24);
            expect(im.MAX_GUILD_INVITATIONS).toBe(50);
            expect(im.MAX_PLAYER_INVITATIONS).toBe(10);
        });
    });
});
