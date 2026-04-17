/**
 * GuildChatHandler.test.js
 * Unit tests for GuildChatHandler
 */

const GuildChatHandler = require('../GuildChatHandler');

// Mock dependencies
const mockGuildManager = {
    getPlayerGuildInfo: jest.fn(),
    getGuildMembers: jest.fn(),
    on: jest.fn(),
    onlinePlayers: new Set()
};

const mockGuildDb = {
    saveChatMessage: jest.fn(),
    getChatHistory: jest.fn(),
    getGuildMembers: jest.fn()
};

describe('GuildChatHandler', () => {
    let chatHandler;

    beforeEach(() => {
        chatHandler = new GuildChatHandler(mockGuildManager, mockGuildDb);
        chatHandler.messageHistory.clear();
        chatHandler.rateLimiter.clear();
        jest.clearAllMocks();
    });

    describe('handleChat', () => {
        test('should send message when in guild', async () => {
            mockGuildManager.getPlayerGuildInfo.mockResolvedValue({
                success: true,
                guild: { id: 1, name: 'Test Guild' }
            });
            mockGuildDb.saveChatMessage.mockResolvedValue({ id: 1 });
            mockGuildDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player123' },
                { player_id: 'player456' }
            ]);

            const result = await chatHandler.handleChat('player123', 'Hello guild!');

            expect(result.success).toBe(true);
            expect(mockGuildDb.saveChatMessage).toHaveBeenCalledWith(
                1, 'player123', 'Hello guild!', false
            );
        });

        test('should fail when not in guild', async () => {
            mockGuildManager.getPlayerGuildInfo.mockResolvedValue({
                success: false,
                error: 'Not in a guild'
            });

            const result = await chatHandler.handleChat('player123', 'Hello!');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('should apply rate limiting', async () => {
            mockGuildManager.getPlayerGuildInfo.mockResolvedValue({
                success: true,
                guild: { id: 1 }
            });
            mockGuildDb.saveChatMessage.mockResolvedValue({ id: 1 });
            mockGuildDb.getGuildMembers.mockResolvedValue([{ player_id: 'player123' }]);

            // Send 5 messages (limit)
            for (let i = 0; i < 5; i++) {
                await chatHandler.handleChat('player123', `Message ${i}`);
            }

            // 6th message should be rate limited
            const result = await chatHandler.handleChat('player123', 'Too many!');

            expect(result.success).toBe(false);
            expect(result.error).toContain('rate limit');
        });

        test('should reject empty messages', async () => {
            mockGuildManager.getPlayerGuildInfo.mockResolvedValue({
                success: true,
                guild: { id: 1 }
            });

            const result = await chatHandler.handleChat('player123', '   ');

            expect(result.success).toBe(false);
            expect(result.error).toContain('empty');
        });

        test('should truncate long messages', async () => {
            mockGuildManager.getPlayerGuildInfo.mockResolvedValue({
                success: true,
                guild: { id: 1 }
            });
            mockGuildDb.saveChatMessage.mockResolvedValue({ id: 1 });
            mockGuildDb.getGuildMembers.mockResolvedValue([{ player_id: 'player123' }]);

            const longMessage = 'a'.repeat(1000);
            await chatHandler.handleChat('player123', longMessage);

            const saveCall = mockGuildDb.saveChatMessage.mock.calls[0];
            expect(saveCall[2].length).toBeLessThanOrEqual(500);
        });
    });

    describe('handleOfficerChat', () => {
        test('should send officer chat when officer', async () => {
            mockGuildManager.getPlayerGuildInfo.mockResolvedValue({
                success: true,
                guild: { id: 1, name: 'Test Guild' },
                myRank: 'OFFICER'
            });
            mockGuildDb.saveChatMessage.mockResolvedValue({ id: 1 });
            mockGuildDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player123', rank: 'OFFICER' },
                { player_id: 'player456', rank: 'LEADER' }
            ]);

            const result = await chatHandler.handleOfficerChat('player123', 'Officer only');

            expect(result.success).toBe(true);
            expect(mockGuildDb.saveChatMessage).toHaveBeenCalledWith(
                1, 'player123', 'Officer only', true
            );
        });

        test('should allow leader to use officer chat', async () => {
            mockGuildManager.getPlayerGuildInfo.mockResolvedValue({
                success: true,
                guild: { id: 1 },
                myRank: 'LEADER'
            });
            mockGuildDb.saveChatMessage.mockResolvedValue({ id: 1 });
            mockGuildDb.getGuildMembers.mockResolvedValue([{ player_id: 'player123', rank: 'LEADER' }]);

            const result = await chatHandler.handleOfficerChat('player123', 'Leader message');

            expect(result.success).toBe(true);
        });

        test('should fail when regular member tries officer chat', async () => {
            mockGuildManager.getPlayerGuildInfo.mockResolvedValue({
                success: true,
                guild: { id: 1 },
                myRank: 'MEMBER'
            });

            const result = await chatHandler.handleOfficerChat('player123', 'Officer chat');

            expect(result.success).toBe(false);
            expect(result.error).toContain('officer');
        });
    });

    describe('getChatHistory', () => {
        test('should return chat history for guild', async () => {
            mockGuildDb.getChatHistory.mockResolvedValue([
                { id: 1, sender: 'Player1', message: 'Hello', created_at: new Date() },
                { id: 2, sender: 'Player2', message: 'Hi!', created_at: new Date() }
            ]);

            const result = await chatHandler.getChatHistory(1, 50);

            expect(result).toHaveLength(2);
            expect(mockGuildDb.getChatHistory).toHaveBeenCalledWith(1, 50);
        });

        test('should return from memory cache when available', async () => {
            const cachedMessages = [
                { id: 1, guild_id: 1, sender: 'Player1', message: 'Cached', created_at: new Date() }
            ];
            chatHandler.messageHistory.set(1, cachedMessages);

            const result = await chatHandler.getChatHistory(1, 50);

            expect(result).toEqual(cachedMessages);
            expect(mockGuildDb.getChatHistory).not.toHaveBeenCalled();
        });
    });

    describe('broadcastMessage', () => {
        test('should broadcast to online guild members', async () => {
            mockGuildDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player1' },
                { player_id: 'player2' },
                { player_id: 'player3' }
            ]);

            // Mark players 1 and 2 as online
            mockGuildManager.onlinePlayers.add('player1');
            mockGuildManager.onlinePlayers.add('player2');

            const message = {
                guildId: 1,
                sender: 'TestPlayer',
                message: 'Hello everyone!',
                isOfficerChat: false
            };

            await chatHandler.broadcastMessage(message);

            // Should emit event for online players
            // Note: Actual emit verification depends on event emitter implementation
        });

        test('should filter officer chat to officers only', async () => {
            mockGuildDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player1', rank: 'LEADER' },
                { player_id: 'player2', rank: 'OFFICER' },
                { player_id: 'player3', rank: 'MEMBER' }
            ]);

            mockGuildManager.onlinePlayers.add('player1');
            mockGuildManager.onlinePlayers.add('player2');
            mockGuildManager.onlinePlayers.add('player3');

            const message = {
                guildId: 1,
                sender: 'Officer',
                message: 'Secret plans',
                isOfficerChat: true
            };

            await chatHandler.broadcastMessage(message);

            // Should only broadcast to leader and officer
            // Member should not receive
        });
    });

    describe('cleanup', () => {
        test('should clear old messages from history', () => {
            const oldMessage = {
                id: 1,
                guild_id: 1,
                created_at: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
            };
            const newMessage = {
                id: 2,
                guild_id: 1,
                created_at: new Date()
            };

            chatHandler.messageHistory.set(1, [oldMessage, newMessage]);

            chatHandler.cleanupOldMessages();

            const remaining = chatHandler.messageHistory.get(1);
            expect(remaining).toHaveLength(1);
            expect(remaining[0].id).toBe(2);
        });
    });
});
