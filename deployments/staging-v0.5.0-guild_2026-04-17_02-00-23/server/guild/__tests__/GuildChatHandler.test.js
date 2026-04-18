/**
 * GuildChatHandler.test.js
 * Unit tests for GuildChatHandler
 */

const GuildChatHandler = require('../GuildChatHandler');

describe('GuildChatHandler', () => {
    let chatHandler;
    let mockDb;
    let mockGuildManager;

    beforeEach(() => {
        mockDb = {
            saveChatMessage: jest.fn(),
            getChatHistory: jest.fn(),
            getPlayerGuild: jest.fn()
        };

        mockGuildManager = {
            playerManager: {
                getPlayer: jest.fn()
            },
            onlineMembers: new Map(),
            on: jest.fn(),
            emit: jest.fn()
        };

        chatHandler = new GuildChatHandler(mockGuildManager, mockDb);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handleChat', () => {
        test('should send message when in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild_123',
                rank: 'MEMBER'
            });
            mockGuildManager.playerManager.getPlayer.mockResolvedValue({
                id: 'player_123',
                username: 'TestPlayer'
            });
            mockDb.saveChatMessage.mockResolvedValue({
                id: 'msg_1',
                sent_at: new Date().toISOString()
            });

            const result = await chatHandler.handleChat('player_123', 'Hello Guild!');

            expect(result.success).toBe(true);
            expect(mockDb.saveChatMessage).toHaveBeenCalled();
        });

        test('should fail when not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await chatHandler.handleChat('player_123', 'Hello!');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('should reject empty message', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'guild_123', rank: 'MEMBER' });

            const result = await chatHandler.handleChat('player_123', '   ');

            expect(result.success).toBe(false);
            expect(result.error).toContain('empty');
        });

        test('should reject message too long', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'guild_123', rank: 'MEMBER' });
            const longMessage = 'a'.repeat(501);

            const result = await chatHandler.handleChat('player_123', longMessage);

            expect(result.success).toBe(false);
            expect(result.error).toContain('too long');
        });
    });

    describe('getChatHistory', () => {
        test('should call getChatHistory with correct params', async () => {
            mockDb.getChatHistory.mockResolvedValue([]);

            await chatHandler.getChatHistory('guild_123', 50);

            expect(mockDb.getChatHistory).toHaveBeenCalledWith('guild_123', 50);
        });
    });

    describe('rate limiting', () => {
        test('should have rate limit configured', () => {
            expect(chatHandler.cooldownMs).toBe(10000);
            expect(chatHandler.maxMessages).toBe(5);
        });
    });
});
