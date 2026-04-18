/**
 * Test for GuildChatHandler line 304 - filter officer chat for non-officers
 */

const GuildChatHandler = require('../GuildChatHandler');

describe('GuildChatHandler line 304 - officer chat filtering', () => {
    let mockDb, mockGuildManager, ch;

    beforeEach(() => {
        mockDb = {
            getPlayerGuild: jest.fn(),
            getChatHistory: jest.fn()
        };
        mockGuildManager = {
            playerManager: { sendToPlayer: jest.fn() }
        };
        ch = new GuildChatHandler(mockGuildManager, mockDb);
    });

    test('getChatHistory filters officer chat for non-officers (line 304)', async () => {
        // Member (not officer) viewing chat history
        mockDb.getPlayerGuild.mockResolvedValue({ 
            guild_id: 'g1', 
            rank: 'MEMBER'  // Not an officer
        });
        
        // Mix of regular and officer chat messages
        mockDb.getChatHistory.mockResolvedValue([
            { id: '1', sender_id: 'p1', sender_name: 'Leader', sender_rank: 'LEADER', message: 'Public msg', is_officer_chat: 0, sent_at: '2024-01-01' },
            { id: '2', sender_id: 'p1', sender_name: 'Leader', sender_rank: 'LEADER', message: 'Officer msg', is_officer_chat: 1, sent_at: '2024-01-01' },
            { id: '3', sender_id: 'p2', sender_name: 'Member', sender_rank: 'MEMBER', message: 'Member msg', is_officer_chat: 0, sent_at: '2024-01-01' }
        ]);

        const result = await ch.getChatHistory('p1');

        expect(result.success).toBe(true);
        // Should only see 2 messages (filtered out the officer chat)
        expect(result.history).toHaveLength(2);
        expect(result.history.some(msg => msg.message === 'Officer msg')).toBe(false);
    });
});
