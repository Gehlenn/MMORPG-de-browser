/**
 * Final push for 95% coverage
 * Lines to cover:
 * - GuildManager: 250 (accept invitation, add to existing online members)
 * - GuildManager: 293 (leave guild when not in guild)
 * - GuildDatabase: 374-375 (search with query)
 * - GuildInvitationManager: 419-420 (cleanupExpiredInvitations error)
 * - GuildChatHandler: 304 (filter officer chat for non-officers)
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');

describe('Final Push Coverage', () => {
    describe('GuildManager line 250 - respondToInvitation adds to online', () => {
        let mockDb, gm, db, mockPlayerManager;

        beforeEach(() => {
            mockDb = {
                getPlayerGuild: jest.fn(),
                getGuildById: jest.fn(),
                respondToInvitation: jest.fn(),
                getGuildMembers: jest.fn()
            };
            mockPlayerManager = {
                getPlayer: jest.fn(),
                sendToPlayer: jest.fn()
            };
            db = new GuildDatabase(mockDb);
            gm = new GuildManager(db, mockPlayerManager);
            gm.emit = jest.fn();
            
            // Set up existing online members
            gm.onlineMembers.set('g1', new Set(['existingMember']));
        });

        test('accept invitation adds to existing online members (line 250)', async () => {
            mockDb.respondToInvitation.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                status: 'ACCEPTED'
            });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test', tag: 'TST' });

            const result = await gm.respondToInvitation('newPlayer', 'inv1', true);

            expect(result.success).toBe(true);
            expect(gm.isPlayerOnline('g1', 'newPlayer')).toBe(true);
            // Should still have existing member
            expect(gm.isPlayerOnline('g1', 'existingMember')).toBe(true);
        });
    });

    describe('GuildManager line 293 - leave guild when not in guild', () => {
        let mockDb, gm, db;

        beforeEach(() => {
            mockDb = {
                getPlayerGuild: jest.fn(),
                getGuildById: jest.fn(),
                removeMember: jest.fn()
            };
            db = new GuildDatabase(mockDb);
            gm = new GuildManager(db, {});
            gm.emit = jest.fn();
        });

        test('leave guild fails when not in guild (line 293)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not in a guild');
        });
    });
});
