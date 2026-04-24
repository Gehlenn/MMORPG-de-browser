/**
 * Coverage Gap Tests - Guild System
 * Foco: Aumentar coverage de 82% para 95%
 */

const GuildChatHandler = require('../GuildChatHandler');
const GuildInvitationManager = require('../GuildInvitationManager');
const GuildManager = require('../GuildManager');
const GuildDatabase = require('../GuildDatabase');

describe('Coverage Gap Tests', () => {
    let mockDb, mockPlayerManager, mockGuildManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockDb = {
            getPlayerGuild: jest.fn(),
            saveChatMessage: jest.fn().mockResolvedValue({ id: 'msg1' }),
            getGuildMembers: jest.fn().mockResolvedValue([
                { player_id: 'p1', rank: 'LEADER' },
                { player_id: 'p2', rank: 'MEMBER' }
            ]),
            getChatHistory: jest.fn().mockResolvedValue([]),
            createInvitation: jest.fn().mockResolvedValue({ 
                id: 'inv1', 
                guild_id: 'g1', 
                inviter_id: 'p1', 
                invitee_id: 'p3',
                status: 'PENDING' 
            }),
            getGuildInvitations: jest.fn().mockResolvedValue([]),
            getPlayerInvitations: jest.fn().mockResolvedValue([]),
            getGuildById: jest.fn().mockResolvedValue({ 
                id: 'g1', 
                name: 'Test Guild',
                memberCount: 5,
                maxMembers: 50 
            }),
            respondToInvitation: jest.fn().mockResolvedValue({ success: true }),
            getInvitationById: jest.fn().mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p3',
                inviter_id: 'p1',
                status: 'PENDING'
            }),
            cleanupExpiredInvitations: jest.fn().mockResolvedValue({ changes: 0 })
        };

        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'TestPlayer' }),
            sendToPlayer: jest.fn()
        };

        mockGuildManager = {
            playerManager: mockPlayerManager,
            on: jest.fn(),
            emit: jest.fn()
        };
    });

    describe('GuildChatHandler - Rate Limiting & Validation', () => {
        let chatHandler;

        beforeEach(() => {
            chatHandler = new GuildChatHandler(mockGuildManager, mockDb);
        });

        test('should reject message when rate limit exceeded', async () => {
            // Set up rate limit
            const now = Date.now();
            chatHandler.playerMessageCounts.set('p1', { count: 6, resetTime: now + 10000 });

            const result = await chatHandler.handleChat('p1', 'Test message');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Rate limit exceeded');
        });

        test('should reject empty message', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await chatHandler.handleChat('p1', '   ');

            expect(result.success).toBe(false);
            expect(result.error).toContain('cannot be empty');
        });

        test('should reject message too long (>500 chars)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            const longMessage = 'a'.repeat(501);

            const result = await chatHandler.handleChat('p1', longMessage);

            expect(result.success).toBe(false);
            expect(result.error).toContain('too long');
        });

        test('should reject when player not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await chatHandler.handleChat('p1', 'Hello');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('should reject when player not found', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await chatHandler.handleChat('p1', 'Hello');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not found');
        });

        test('should reset rate limit after time window', async () => {
            const pastTime = Date.now() - 20000; // 20 seconds ago
            chatHandler.playerMessageCounts.set('p1', { count: 6, resetTime: pastTime });

            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await chatHandler.checkRateLimit('p1');

            expect(result).toBe(true);
        });

        test('should initialize and listen to events', () => {
            chatHandler.initialize();

            expect(mockGuildManager.on).toHaveBeenCalledWith('guild:member_joined', expect.any(Function));
            expect(mockGuildManager.on).toHaveBeenCalledWith('guild:member_left', expect.any(Function));
            expect(mockGuildManager.on).toHaveBeenCalledWith('guild:member_kicked', expect.any(Function));
            expect(mockGuildManager.on).toHaveBeenCalledWith('guild:member_promoted', expect.any(Function));
            expect(mockGuildManager.on).toHaveBeenCalledWith('guild:leadership_transferred', expect.any(Function));
        });

        test('should send system message on member joined', () => {
            chatHandler.sendSystemMessage = jest.fn();
            chatHandler.initialize();

            // Get the callback for member_joined
            const memberJoinedCallback = mockGuildManager.on.mock.calls.find(
                call => call[0] === 'guild:member_joined'
            )[1];

            memberJoinedCallback({ guildId: 'g1', playerName: 'NewPlayer' });

            expect(chatHandler.sendSystemMessage).toHaveBeenCalledWith('g1', 'NewPlayer has joined the guild!');
        });
    });

    describe('GuildInvitationManager - Limits & Validations', () => {
        let invitationManager;

        beforeEach(() => {
            invitationManager = new GuildInvitationManager(mockGuildManager, mockDb);
        });

        test('should reject when guild has too many pending invitations', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' })  // inviter
                .mockResolvedValueOnce(null);  // invitee
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            
            // Create 50 pending invitations
            const manyInvites = Array(50).fill(null).map((_, i) => ({
                id: `inv${i}`,
                status: 'PENDING',
                invitee_id: `player${i}`
            }));
            mockDb.getGuildInvitations.mockResolvedValue(manyInvites);

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Too many pending invitations for this guild');
        });

        test('should reject when player has too many pending invitations', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' })  // inviter
                .mockResolvedValueOnce(null);  // invitee (not in guild)
            mockDb.getGuildInvitations.mockResolvedValue([]);
            
            // Create 10 pending invitations for the player
            const playerInvites = Array(10).fill(null).map((_, i) => ({
                id: `inv${i}`,
                status: 'PENDING',
                guild_id: `guild${i}`
            }));
            mockDb.getPlayerInvitations.mockResolvedValue(playerInvites);

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player has too many pending invitations');
        });

        test('should reject when player already has pending invitation from this guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' })  // inviter
                .mockResolvedValueOnce(null);  // invitee
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            
            // Create pending invitation from same guild to same player
            mockDb.getGuildInvitations.mockResolvedValue([{
                id: 'existing',
                status: 'PENDING',
                invitee_id: 'p99'
            }]);

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already has a pending invitation from this guild');
        });

        test('should reject when inviter not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in this guild');
        });

        test('should reject when inviter is member rank', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can invite');
        });

        test('should reject when inviter is in different guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g2', rank: 'OFFICER' });

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in this guild');
        });

        test('should reject when invitee already in guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' }) // inviter
                .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' }); // invitee

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test('should reject when guild is full', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' })  // inviter
                .mockResolvedValueOnce(null);  // invitee
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Full Guild',
                memberCount: 50,
                maxMembers: 50
            });

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Guild is full');
        });

        test('should reject when guild not found', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' })  // inviter
                .mockResolvedValueOnce(null);  // invitee
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockDb.getGuildById.mockResolvedValue(null);

            const result = await invitationManager.createInvitation('g1', 'p1', 'p99');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Guild not found');
        });

        test('should initialize with cleanup interval', () => {
            const setIntervalSpy = jest.spyOn(global, 'setInterval');
            
            invitationManager.initialize();
            
            expect(setIntervalSpy).toHaveBeenCalledWith(
                expect.any(Function),
                3600000 // 1 hour
            );

            setIntervalSpy.mockRestore();
        });

        test('should format invitation correctly', () => {
            const invitation = {
                id: 'inv1',
                guild_id: 'g1',
                inviter_id: 'p1',
                invitee_id: 'p2',
                created_at: new Date().toISOString(),
                status: 'PENDING'
            };
            const guild = { id: 'g1', name: 'Test Guild', tag: 'TST' };

            const formatted = invitationManager.formatInvitation(invitation, guild);

            expect(formatted.id).toBe('inv1');
            expect(formatted.guildName).toBe('Test Guild');
            expect(formatted.guildTag).toBe('TST');
        });
    });
});
