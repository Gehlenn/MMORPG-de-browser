/**
 * Coverage Boost Tests
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');
const GuildChatHandler = require('../GuildChatHandler');
const GuildInvitationManager = require('../GuildInvitationManager');

describe('Coverage Boost', () => {
    let mockDb, mockPlayerManager;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
            get: jest.fn((sql, params, callback) => callback(null, null)),
            all: jest.fn((sql, params, callback) => callback(null, [])),
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildMembers: jest.fn(),
            saveChatMessage: jest.fn(),
            getChatHistory: jest.fn(),
            createInvitation: jest.fn(),
            getInvitationById: jest.fn(),
            getPlayerInvitations: jest.fn(),
            getGuildInvitations: jest.fn(),
            respondToInvitation: jest.fn(),
            addGuildMember: jest.fn(),
            updateMemberRank: jest.fn(),
            transferLeadership: jest.fn(),
            removeGuildMember: jest.fn(),
            disbandGuild: jest.fn(),
            updateGuildInfo: jest.fn(),
            cancelInvitation: jest.fn(),
            createGuild: jest.fn(),
            getGuildByName: jest.fn(),
            getGuildByTag: jest.fn(),
            browseGuilds: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            getPlayerByUsername: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };
    });

    describe('GuildManager - All Error Paths', () => {
        let gm;

        beforeEach(() => {
            gm = new GuildManager(mockDb, mockPlayerManager);
            gm.on = jest.fn();
            gm.emit = jest.fn();
        });

        test('invitePlayer with missing guildId', async () => {
            const result = await gm.invitePlayer('p1', null, 'Target');
            expect(result.success).toBe(false);
        });

        test('invitePlayer with missing inviteeUsername', async () => {
            const result = await gm.invitePlayer('p1', 'g1', null);
            expect(result.success).toBe(false);
        });

        test('kickMember with missing target', async () => {
            const result = await gm.kickMember('p1', null);
            expect(result.success).toBe(false);
        });

        test('promoteMember with invalid rank', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });
            
            const result = await gm.promoteMember('p1', 'p2', 'LEADER');
            expect(result.success).toBe(false);
        });

        test('transferLeadership to non-member', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null); // Target not in guild

            const result = await gm.transferLeadership('p1', 'p2');
            expect(result.success).toBe(false);
        });

        test('transferLeadership to member of different guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' }); // Different guild

            const result = await gm.transferLeadership('p1', 'p2');
            expect(result.success).toBe(false);
        });

        test('updateGuildInfo not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });
            expect(result.success).toBe(false);
        });

        test('updateGuildInfo not leader/officer', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });
            expect(result.success).toBe(false);
        });

        test('setPlayerOnline adds to existing set', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.updateLastActive.mockResolvedValue(true);

            // First player
            await gm.setPlayerOnline('g1', 'p1');
            // Second player
            await gm.setPlayerOnline('g1', 'p2');

            const online = gm.getOnlineMembers('g1');
            expect(online.has('p1')).toBe(true);
            expect(online.has('p2')).toBe(true);
        });

        test('setPlayerOffline removes from set', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            
            await gm.setPlayerOnline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);
            
            await gm.setPlayerOffline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });

        test('isPlayerOnline with non-existent guild', async () => {
            const result = gm.isPlayerOnline('nonexistent', 'p1');
            expect(result).toBe(false);
        });

        test('getOnlineMembers returns empty set for new guild', async () => {
            const result = gm.getOnlineMembers('newguild');
            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(0);
        });
    });

    describe('GuildChatHandler - All Rate Limit Paths', () => {
        test('rate limit with cleanup', async () => {
            jest.useFakeTimers();
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set());

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            // Send 5 messages
            for (let i = 0; i < 5; i++) {
                await ch.handleChat('p1', `msg${i}`);
            }

            // Advance time to clear rate limit
            jest.advanceTimersByTime(11000);

            // Should work again
            const result = await ch.handleChat('p1', 'After cooldown');
            expect(result.success).toBe(true);

            jest.useRealTimers();
        });
    });

    describe('GuildDatabase - All Helper Methods', () => {
        let db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
        });

        test('run helper resolves with result', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ lastID: 123, changes: 5 }, null);
            });

            const result = await db.run('INSERT...', ['param']);
            expect(result.lastID).toBe(123);
            expect(result.changes).toBe(5);
        });

        test('run helper rejects on error', async () => {
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback(new Error('Run error'));
            });

            await expect(db.run('INSERT...', [])).rejects.toThrow('Run error');
        });

        test('get helper resolves with row', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { id: 1, name: 'Test' });
            });

            const result = await db.get('SELECT...', ['param']);
            expect(result).toEqual({ id: 1, name: 'Test' });
        });

        test('get helper resolves with null when no row', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, null);
            });

            const result = await db.get('SELECT...', []);
            expect(result).toBeNull();
        });

        test('get helper rejects on error', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(new Error('Get error'));
            });

            await expect(db.get('SELECT...', [])).rejects.toThrow('Get error');
        });

        test('all helper resolves with rows', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, [{ id: 1 }, { id: 2 }]);
            });

            const result = await db.all('SELECT...', []);
            expect(result).toHaveLength(2);
        });

        test('all helper rejects on error', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(new Error('All error'));
            });

            await expect(db.all('SELECT...', [])).rejects.toThrow('All error');
        });
    });

    describe('GuildInvitationManager - All Invitation Flows', () => {
        let im;

        beforeEach(() => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('cancelInvitation by non-inviter with rank check', async () => {
            const invitation = {
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p2',
                inviter_id: 'p1',
                status: 'PENDING'
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            // Canceler is not inviter but is officer
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' }) // Canceler
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }); // Not inviter

            mockDb.cancelInvitation.mockResolvedValue(true);

            const result = await im.cancelInvitation('p3', 'inv1');
            expect(result.success).toBe(true);
        });

        test('cancelInvitation fails when not inviter and not officer', async () => {
            const invitation = {
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p2',
                inviter_id: 'p1',
                status: 'PENDING'
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }) // Not officer
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }); // Not inviter

            const result = await im.cancelInvitation('p3', 'inv1');
            expect(result.success).toBe(false);
        });

        test('acceptInvitation when guild is full', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            };
            const guild = {
                id: 'g1',
                memberCount: 100,
                maxMembers: 100
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild.mockResolvedValue(null); // Not in guild
            mockDb.getGuildById.mockResolvedValue(guild);

            const result = await im.acceptInvitation('p1', 'inv1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('full');
        });

        test('acceptInvitation when already in guild', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g2', rank: 'MEMBER' }); // Already in guild

            const result = await im.acceptInvitation('p1', 'inv1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test('acceptInvitation already accepted', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                status: 'ACCEPTED'
            });

            const result = await im.acceptInvitation('p1', 'inv1');
            expect(result.success).toBe(false);
        });

        test('acceptInvitation not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);

            const result = await im.acceptInvitation('p1', 'inv1');
            expect(result.success).toBe(false);
        });

        test('declineInvitation not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);

            const result = await im.declineInvitation('p1', 'inv1');
            expect(result.success).toBe(false);
        });

        test('declineInvitation wrong player', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p2', // Different player
                status: 'PENDING'
            });

            const result = await im.declineInvitation('p1', 'inv1');
            expect(result.success).toBe(false);
        });

        test('declineInvitation already processed', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                status: 'ACCEPTED'
            });

            const result = await im.declineInvitation('p1', 'inv1');
            expect(result.success).toBe(false);
        });

        test('cleanupExpiredInvitations succeeds', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 10 }, null);
            });

            const result = await im.cleanupExpiredInvitations();
            expect(result.success).toBe(true);
            expect(result.count).toBe(10);
        });
    });
});
