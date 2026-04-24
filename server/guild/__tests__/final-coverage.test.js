/**
 * Final Coverage Tests
 * Objetivo: Atingir 95% coverage no Guild System
 */

const GuildChatHandler = require('../GuildChatHandler');
const GuildInvitationManager = require('../GuildInvitationManager');

describe('Final Coverage Tests - 95% Target', () => {
    let mockDb, mockPlayerManager, mockGuildManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockDb = {
            getPlayerGuild: jest.fn(),
            saveChatMessage: jest.fn().mockResolvedValue({ 
                id: 'msg1', 
                sent_at: new Date().toISOString() 
            }),
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
                status: 'PENDING',
                created_at: new Date().toISOString()
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
            cleanupExpiredInvitations: jest.fn().mockResolvedValue({ changes: 5 }),
            acceptInvitation: jest.fn().mockResolvedValue({ 
                success: true, 
                guildId: 'g1',
                memberCount: 6
            })
        };

        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'TestPlayer' }),
            sendToPlayer: jest.fn(),
            isPlayerOnline: jest.fn().mockReturnValue(true)
        };

        mockGuildManager = {
            playerManager: mockPlayerManager,
            on: jest.fn(),
            emit: jest.fn(),
            onlineMembers: new Map()
        };
        mockGuildManager.onlineMembers.set('g1', new Set(['p1', 'p2']));
    });

    describe('GuildChatHandler - Full Coverage', () => {
        let chatHandler;

        beforeEach(() => {
            chatHandler = new GuildChatHandler(mockGuildManager, mockDb);
        });

        test('should handle chat successfully', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            
            const result = await chatHandler.handleChat('p1', 'Hello guild!');
            
            expect(result.success).toBe(true);
            expect(result.message).toBe('Message sent');
        });

        test('should handle officer chat successfully', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            
            const result = await chatHandler.handleOfficerChat('p1', 'Officer meeting now');
            
            expect(result.success).toBe(true);
        });

        test('should reject officer chat when not officer', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            
            const result = await chatHandler.handleOfficerChat('p1', 'Test message');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers');
        });

        test('should get chat history successfully', async () => {
            const history = [
                { id: 'm1', message: 'Hello', senderName: 'Player1' },
                { id: 'm2', message: 'Hi', senderName: 'Player2' }
            ];
            mockDb.getChatHistory.mockResolvedValue(history);
            
            const result = await chatHandler.getChatHistory('g1', 50);
            
            expect(result.success).toBe(true);
            expect(result.history).toHaveLength(2);
        });

        test('should handle getChatHistory error', async () => {
            mockDb.getChatHistory.mockRejectedValue(new Error('DB Error'));
            
            const result = await chatHandler.getChatHistory('g1', 50);
            
            expect(result.success).toBe(false);
        });

        test('should broadcast message to online members', async () => {
            chatHandler.broadcastMessage = jest.fn();
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            
            await chatHandler.handleChat('p1', 'Test broadcast');
            
            expect(chatHandler.broadcastMessage).toHaveBeenCalledWith('g1', expect.any(Object));
        });

        test('should send system message', async () => {
            chatHandler.broadcastMessage = jest.fn();
            
            await chatHandler.sendSystemMessage('g1', 'Player joined the guild!');
            
            expect(chatHandler.broadcastMessage).toHaveBeenCalledWith('g1', expect.objectContaining({
                type: 'guild:system_message'
            }));
        });

        test('should check rate limit for new player', async () => {
            const result = chatHandler.checkRateLimit('new_player');
            expect(result).toBe(true);
        });

        test('should track message count correctly', async () => {
            const playerId = 'test_player';
            
            // Simula que já enviou 5 mensagens (limite)
            chatHandler.playerMessageCounts.set(playerId, {
                count: 5,
                resetTime: Date.now() + 10000 // Futuro, não expirado
            });
            
            // Sexta mensagem deve ser bloqueada (count >= maxMessages)
            const result = chatHandler.checkRateLimit(playerId);
            expect(result).toBe(false);
        });
    });

    describe('GuildInvitationManager - Full Coverage', () => {
        let invitationManager;

        beforeEach(() => {
            invitationManager = new GuildInvitationManager(mockGuildManager, mockDb);
            invitationManager.notifyPlayerOfInvitation = jest.fn();
        });

        test('should accept invitation successfully', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p3',
                inviter_id: 'p1',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Test Guild',
                memberCount: 5,
                maxMembers: 50
            });
            
            const result = await invitationManager.acceptInvitation('p3', 'inv1');
            
            expect(result.success).toBe(true);
        });

        test('should reject expired invitation', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 3); // 3 days ago
            
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p3',
                inviter_id: 'p1',
                status: 'PENDING',
                created_at: oldDate.toISOString()
            });
            
            const result = await invitationManager.acceptInvitation('p3', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('expired');
        });

        test('should cancel invitation successfully', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p3',
                inviter_id: 'p1',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.cancelInvitation = jest.fn().mockResolvedValue({ success: true });
            
            const result = await invitationManager.cancelInvitation('p1', 'inv1');
            
            expect(result.success).toBe(true);
        });

        test('should reject cancel when not inviter', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p3',
                inviter_id: 'p2',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            
            const result = await invitationManager.cancelInvitation('p1', 'inv1');
            
            expect(result.success).toBe(false);
        });

        test('should decline invitation successfully', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p3',
                inviter_id: 'p1',
                status: 'PENDING'
            });
            mockDb.respondToInvitation = jest.fn().mockResolvedValue({ success: true });
            
            const result = await invitationManager.declineInvitation('p3', 'inv1');
            
            expect(result.success).toBe(true);
        });

        test('should handle acceptInvitation with full guild', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p3',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Full Guild',
                memberCount: 50,
                maxMembers: 50
            });
            
            const result = await invitationManager.acceptInvitation('p3', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('full');
        });

        test('should handle acceptInvitation when already in guild', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p3',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g2' });
            
            const result = await invitationManager.acceptInvitation('p3', 'inv1');
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test('should get player invitations successfully', async () => {
            const invitations = [
                { id: 'inv1', guild_name: 'Guild 1' },
                { id: 'inv2', guild_name: 'Guild 2' }
            ];
            mockDb.getPlayerInvitations.mockResolvedValue(invitations);
            mockDb.getGuildById = jest.fn()
                .mockResolvedValueOnce({ id: 'g1', name: 'Guild 1', tag: 'G1' })
                .mockResolvedValueOnce({ id: 'g2', name: 'Guild 2', tag: 'G2' });
            
            const result = await invitationManager.getPlayerInvitations('p1');
            
            expect(result.success).toBe(true);
        });

        test('should handle getPlayerInvitations error', async () => {
            mockDb.getPlayerInvitations.mockRejectedValue(new Error('DB Error'));
            
            const result = await invitationManager.getPlayerInvitations('p1');
            
            expect(result.success).toBe(false);
        });

        test('should cleanup expired invitations', async () => {
            const result = await invitationManager.cleanupExpiredInvitations();
            
            expect(result.success).toBe(true);
            expect(result.count).toBe(5);
        });

        test('should format invitation correctly', () => {
            const invitation = {
                id: 'inv1',
                guild_id: 'g1',
                inviter_id: 'p1',
                invitee_id: 'p2',
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 86400000).toISOString(),
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
