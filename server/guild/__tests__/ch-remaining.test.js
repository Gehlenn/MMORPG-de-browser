/**
 * Tests for GuildChatHandler remaining uncovered lines
 * Lines: 64, 141, 166, 173, 181-211, 269-276
 */

const GuildChatHandler = require('../GuildChatHandler');

describe('GuildChatHandler remaining lines', () => {
    let mockDb, mockGuildManager, ch;

    beforeEach(() => {
        mockDb = {
            getPlayerGuild: jest.fn(),
            saveChatMessage: jest.fn(),
            getGuildMembers: jest.fn()
        };
        mockGuildManager = {
            getOnlineMembers: jest.fn(),
            playerManager: {
                getPlayer: jest.fn(),
                sendToPlayer: jest.fn()
            }
        };
        ch = new GuildChatHandler(mockGuildManager, mockDb);
        // Reset rate limits
        ch.playerMessageCounts.clear();
    });

    describe('Line 64 - handleChat not in guild', () => {
        test('handleChat returns error when not in guild (line 64)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await ch.handleChat('p1', 'Hello');

            expect(result.success).toBe(false);
            expect(result.error).toBe('You are not in a guild');
        });
    });

    describe('Line 141 - handleOfficerChat rate limited', () => {
        test('handleOfficerChat returns error when rate limited (line 141)', async () => {
            // Set rate limit for player (exceeded max messages)
            ch.playerMessageCounts.set('p1', { count: 5, resetTime: Date.now() + 10000 });

            const result = await ch.handleOfficerChat('p1', 'Hello');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Rate limit exceeded');
        });
    });

    describe('Line 166 - handleOfficerChat empty message', () => {
        test('handleOfficerChat returns error for empty message (line 166)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });

            const result = await ch.handleOfficerChat('p1', '   '); // Empty/whitespace

            expect(result.success).toBe(false);
            expect(result.error).toBe('Message cannot be empty');
        });
    });

    describe('Line 173 - handleOfficerChat message too long', () => {
        test('handleOfficerChat returns error for long message (line 173)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });

            const longMessage = 'a'.repeat(501); // Over 500 chars
            const result = await ch.handleOfficerChat('p1', longMessage);

            expect(result.success).toBe(false);
            expect(result.error).toContain('too long');
        });
    });

    describe('Line 182 - handleOfficerChat player not found', () => {
        test('handleOfficerChat returns error when player not found (line 182)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockGuildManager.playerManager.getPlayer.mockResolvedValue(null); // Player not found

            const result = await ch.handleOfficerChat('p1', 'Hello');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Player not found');
        });
    });

    describe('Lines 181-211 - handleOfficerChat success path', () => {
        test('handleOfficerChat succeeds with complete flow (lines 181-211)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockGuildManager.playerManager.getPlayer.mockResolvedValue({ 
                id: 'p1', 
                username: 'TestPlayer' 
            });
            mockDb.saveChatMessage.mockResolvedValue({
                id: 'msg1',
                sent_at: '2024-01-01T00:00:00Z'
            });
            // Mock for broadcastOfficerMessage
            mockDb.getGuildMembers = jest.fn().mockResolvedValue([{ player_id: 'p1', rank: 'LEADER' }]);
            mockGuildManager.getOnlineMembers = jest.fn().mockReturnValue(new Set(['p1']));

            const result = await ch.handleOfficerChat('p1', 'Officer message');

            expect(result.success).toBe(true);
            expect(result.message).toBe('Officer message sent');
        });
    });

    describe('Lines 269-276 - broadcastOfficerMessage', () => {
        test('broadcastOfficerMessage sends to online officers (lines 269-276)', async () => {
            // Mock guild members - 2 officers (1 online, 1 offline) and 1 member
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'p1', rank: 'LEADER' },
                { player_id: 'p2', rank: 'OFFICER' },
                { player_id: 'p3', rank: 'MEMBER' }
            ]);
            // Only p1 (LEADER) is online
            mockGuildManager.getOnlineMembers.mockReturnValue(new Set(['p1']));

            const messageData = { type: 'test', data: 'message' };
            await ch.broadcastOfficerMessage('g1', messageData);

            // Should send only to online leader (p1), not to offline officer (p2) or member (p3)
            expect(mockGuildManager.playerManager.sendToPlayer).toHaveBeenCalledWith('p1', messageData);
            expect(mockGuildManager.playerManager.sendToPlayer).not.toHaveBeenCalledWith('p2', expect.anything());
            expect(mockGuildManager.playerManager.sendToPlayer).not.toHaveBeenCalledWith('p3', expect.anything());
        });
    });
});
