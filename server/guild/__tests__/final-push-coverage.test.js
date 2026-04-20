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
                run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
                get: jest.fn((sql, params, callback) => {
                    // respondToInvitation: Get invitation after update
                    if (sql.includes('FROM guild_invitations') && sql.includes('WHERE id =')) {
                        callback(null, { 
                            id: 'inv1', 
                            guild_id: 'g1', 
                            invitee_id: 'newPlayer',
                            inviter_id: 'p2',
                            status: 'ACCEPTED' 
                        });
                    }
                    // respondToInvitation: Check if player already in guild
                    else if (sql.includes('FROM guild_members') && sql.includes('WHERE player_id =') && !sql.includes('gm.')) {
                        callback(null, null); // Not in guild
                    }
                    // respondToInvitation: Get member count
                    else if (sql.includes('COUNT(*)') && sql.includes('FROM guild_members')) {
                        callback(null, { count: 5 });
                    }
                    // respondToInvitation: Get max members
                    else if (sql.includes('max_members FROM guilds')) {
                        callback(null, { max_members: 100 });
                    }
                    // getGuildById
                    else if (sql.includes('FROM guilds g') && sql.includes('WHERE g.id =')) {
                        callback(null, { id: 'g1', name: 'Test', tag: 'TST', leader_id: 'p1', member_count: 5 });
                    }
                    else {
                        callback(null, null);
                    }
                }),
                all: jest.fn((sql, params, callback) => callback(null, [])),
                getPlayerGuild: jest.fn(),
                getGuildById: jest.fn(),
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
            const result = await gm.respondToInvitation('newPlayer', 'inv1', true);
            
            if (!result.success) {
                process.stderr.write(`DEBUG respondToInvitation error: ${result.error}\n`);
            }

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
                run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
                get: jest.fn((sql, params, callback) => callback(null, null)),
                all: jest.fn((sql, params, callback) => callback(null, [])),
                getPlayerGuild: jest.fn(),
                getGuildById: jest.fn(),
                removeMember: jest.fn()
            };
            db = new GuildDatabase(mockDb);
            gm = new GuildManager(db, {});
            gm.emit = jest.fn();
            
            // Mock getPlayerGuild to return null (not in guild)
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members gm') && sql.includes('gm.player_id =')) {
                    callback(null, null); // Not in any guild
                } else {
                    callback(null, null);
                }
            });
        });

        test('leave guild fails when not in guild (line 293)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not in a guild');
        });
    });
});
