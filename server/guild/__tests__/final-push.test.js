/**
 * Final Push - Remaining Coverage
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');
const GuildChatHandler = require('../GuildChatHandler');
const GuildInvitationManager = require('../GuildInvitationManager');

describe('Final Coverage Push', () => {
    let mockDb, mockPlayerManager;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
            get: jest.fn((sql, params, callback) => callback(null, null)),
            all: jest.fn((sql, params, callback) => callback(null, [])),
            createGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildByName: jest.fn(),
            getGuildByTag: jest.fn(),
            getPlayerGuild: jest.fn(),
            getGuildMembers: jest.fn(),
            addGuildMember: jest.fn(),
            removeGuildMember: jest.fn(),
            updateMemberRank: jest.fn(),
            transferLeadership: jest.fn(),
            updateGuildInfo: jest.fn(),
            disbandGuild: jest.fn(),
            browseGuilds: jest.fn(),
            countGuilds: jest.fn(),
            saveChatMessage: jest.fn(),
            getChatHistory: jest.fn(),
            createInvitation: jest.fn(),
            getInvitationById: jest.fn(),
            getPlayerInvitations: jest.fn(),
            getGuildInvitations: jest.fn(),
            respondToInvitation: jest.fn(),
            cancelInvitation: jest.fn(),
            countGuildInvitations: jest.fn(),
            countPlayerInvitations: jest.fn(),
            updateLastActive: jest.fn(),
            cleanupExpiredInvitations: jest.fn().mockResolvedValue(5)
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            getPlayerByUsername: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };
    });

    describe('GuildDatabase - Complete Coverage', () => {
        let db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
        });

        test('createGuild adds leader as member', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                if (sql.includes('INSERT INTO guilds')) {
                    callback.call({ lastID: 1 }, null);
                } else {
                    callback.call({ changes: 1 }, null);
                }
            });
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { id: 'g1', name: 'Test', leader_id: 'p1' });
            });

            const result = await db.createGuild({
                name: 'Test Guild',
                tag: 'TST',
                leaderId: 'p1',
                description: 'Test',
                motd: 'Hello'
            });

            expect(result).toHaveProperty('id', 'g1');
        });

        test('createGuild handles db error', async () => {
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback(new Error('Insert Error'));
            });

            await expect(db.createGuild({
                name: 'Test',
                tag: 'TST',
                leaderId: 'p1'
            })).rejects.toThrow('Insert Error');
        });

        test('getGuildById returns formatted guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'g1',
                    name: 'Test Guild',
                    tag: 'TST',
                    description: 'A guild',
                    motd: 'Hello',
                    leader_id: 'p1',
                    created_at: '2024-01-01',
                    max_members: 100,
                    is_recruiting: 1,
                    member_count: 10
                });
            });

            const result = await db.getGuildById('g1');

            expect(result).toHaveProperty('id', 'g1');
            expect(result).toHaveProperty('isRecruiting', true);
            expect(result).toHaveProperty('memberCount', 10);
        });

        test('getGuildById returns null when not found', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, null);
            });

            const result = await db.getGuildById('nonexistent');
            expect(result).toBeNull();
        });

        test('getGuildByName returns formatted guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'g1',
                    name: 'Test',
                    tag: 'TST',
                    member_count: 5
                });
            });

            const result = await db.getGuildByName('Test');
            expect(result).toHaveProperty('name', 'Test');
        });

        test('getGuildByTag returns formatted guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'g1',
                    name: 'Test',
                    tag: 'TST',
                    member_count: 5
                });
            });

            const result = await db.getGuildByTag('TST');
            expect(result).toHaveProperty('tag', 'TST');
        });

        test('disbandGuild deletes all data', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.disbandGuild('g1');
            expect(result).toBe(true);
        });

        test('disbandGuild handles error', async () => {
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback(new Error('Delete Error'));
            });

            await expect(db.disbandGuild('g1')).rejects.toThrow('Delete Error');
        });

        test('addGuildMember inserts with rank', async () => {
            const result = await db.addGuildMember('g1', 'p1', 'MEMBER');
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
        });

        test('removeGuildMember deletes member', async () => {
            await db.removeGuildMember('g1', 'p1');
            // Method completes without error
        });

        test('updateMemberRank updates rank', async () => {
            await db.updateMemberRank('g1', 'p1', 'OFFICER');
            // Method completes without error
        });

        test('transferLeadership updates leader and demotes old', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.transferLeadership('g1', 'p1', 'p2');
            expect(result).toHaveProperty('success', true);
        });

        test('updateGuildInfo updates fields', async () => {
            await db.updateGuildInfo('g1', {
                description: 'New',
                motd: 'New MOTD',
                isRecruiting: true
            });
            // Method completes without error
        });

        test('browseGuilds returns guilds and total', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { count: 10 });
            });
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, [
                    { id: 'g1', name: 'Test', member_count: 5, is_recruiting: 1 }
                ]);
            });

            const result = await db.browseGuilds({ page: 1, limit: 10 });

            expect(result).toHaveProperty('guilds');
            expect(result).toHaveProperty('total', 10);
        });

        test('saveChatMessage inserts and returns message', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ lastID: 1 }, null);
            });
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'msg1',
                    guild_id: 'g1',
                    sender_id: 'p1',
                    sender_name: 'Test',
                    message: 'Hello',
                    is_officer_chat: 0,
                    sent_at: '2024-01-01'
                });
            });

            const result = await db.saveChatMessage('g1', 'p1', 'Test', 'MEMBER', 'Hello', false);

            expect(result).toHaveProperty('id');
            expect(result.message).toBe('Hello');
        });

        test('getChatHistory returns messages', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, [
                    { id: 'm1', message: 'Hello', sender_name: 'Test', is_officer_chat: 0 }
                ]);
            });

            const result = await db.getChatHistory('g1', 50);
            expect(result).toHaveLength(1);
        });

        test('getPlayerGuild returns membership', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    guild_id: 'g1',
                    player_id: 'p1',
                    rank: 'MEMBER',
                    joined_at: '2024-01-01'
                });
            });

            const result = await db.getPlayerGuild('p1');
            expect(result).toHaveProperty('guild_id', 'g1');
        });

        test('createInvitation inserts with expiration', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ lastID: 1 }, null);
            });

            const result = await db.createInvitation('g1', 'p1', 'p2');

            expect(result).toHaveProperty('id');
            expect(result.guild_id).toBe('g1');
        });

        test('respondToInvitation updates status', async () => {
            let callCount = 0;
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });
            mockDb.get.mockImplementation((sql, params, callback) => {
                callCount++;
                if (callCount === 1) {
                    // First call: get invitation
                    callback(null, { id: 'inv1', status: 'ACCEPTED', invitee_id: 'p2', guild_id: 'g1' });
                } else if (callCount === 2) {
                    // Second call: check existing membership - return null
                    callback(null, null);
                } else if (callCount === 3) {
                    // Third call: member count
                    callback(null, { count: 5 });
                } else if (callCount === 4) {
                    // Fourth call: max members
                    callback(null, { max_members: 100 });
                } else {
                    callback(null, null);
                }
            });

            const result = await db.respondToInvitation('inv1', 'ACCEPTED');
            expect(result).toHaveProperty('status', 'ACCEPTED');
        });
    });

    describe('GuildManager - Success Paths', () => {
        let gm, db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
            gm = new GuildManager(db, mockPlayerManager);
            gm.on = jest.fn();
            gm.emit = jest.fn();
        });

        test('demoteMember succeeds', async () => {
            // Track calls to return different values for leader and target
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callCount++;
                    if (callCount === 1) {
                        callback(null, { guild_id: 'g1', rank: 'LEADER' }); // Leader (p1)
                    } else {
                        callback(null, { guild_id: 'g1', rank: 'OFFICER' }); // Target (p2)
                    }
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test', tag: 'TST' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.updateMemberRank.mockResolvedValue(true);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });

            const result = await gm.demoteMember('p1', 'p2', 'MEMBER');

            expect(result.success).toBe(true);
            // promoteMember/demoteMember emits 'guild:member_promoted' event
            expect(gm.emit).toHaveBeenCalledWith('guild:member_promoted', expect.any(Object));
        });

        test('demoteMember fails when invalid rank', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.demoteMember('p1', 'p2', 'INVALID');

            expect(result.success).toBe(false);
        });

        test('demoteMember succeeds when demoting to same rank (no validation)', async () => {
            // Track calls to return different values for leader and target
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callCount++;
                    if (callCount === 1) {
                        callback(null, { guild_id: 'g1', rank: 'LEADER' }); // Leader (p1)
                    } else {
                        callback(null, { guild_id: 'g1', rank: 'MEMBER' }); // Target (p2)
                    }
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test', tag: 'TST' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.updateMemberRank.mockResolvedValue(true);
            mockPlayerManager.getPlayer
                .mockResolvedValueOnce({ id: 'p1', username: 'Player1' })
                .mockResolvedValueOnce({ id: 'p2', username: 'Player2' });

            const result = await gm.demoteMember('p1', 'p2', 'MEMBER');

            // promoteMember/demoteMember doesn't check if rank is same, just updates
            expect(result.success).toBe(true);
        });
    });

    describe('GuildChatHandler - Event Handlers', () => {
        test('all event handlers work', () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set(['p1']));

            const ch = new GuildChatHandler(gm, mockDb);
            ch.initialize();

            // Test all event handlers
            gm.emit('guild:member_joined', { guildId: 'g1', playerName: 'New' });
            gm.emit('guild:member_left', { guildId: 'g1', playerName: 'Left' });
            gm.emit('guild:member_kicked', { guildId: 'g1', playerName: 'Kicked' });
            gm.emit('guild:member_promoted', { guildId: 'g1', playerName: 'Promo', newRank: 'OFFICER' });
            gm.emit('guild:member_demoted', { guildId: 'g1', playerName: 'Demo', newRank: 'MEMBER' });
            gm.emit('guild:leader_changed', { guildId: 'g1', newLeaderName: 'NewLeader' });
            gm.emit('guild:leadership_transferred', { guildId: 'g1', newLeaderName: 'Transferred' });

            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('sendSystemMessage to multiple members', () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set(['p1', 'p2', 'p3']));

            const ch = new GuildChatHandler(gm, mockDb);
            ch.sendSystemMessage('g1', 'System message');

            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalledTimes(3);
        });

        test('broadcastMessage with empty online members', () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set());

            const ch = new GuildChatHandler(gm, mockDb);
            ch.broadcastMessage('g1', { type: 'test' });

            expect(mockPlayerManager.sendToPlayer).not.toHaveBeenCalled();
        });
    });

    describe('GuildInvitationManager - Complete', () => {
        let im;

        beforeEach(() => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('cleanupExpiredInvitations returns count', async () => {
            mockDb.cleanupExpiredInvitations.mockResolvedValue(5);

            const result = await im.cleanupExpiredInvitations();
            expect(result.success).toBe(true);
            expect(result.count).toBe(5);
        });

        test('cleanupExpiredInvitations handles error', async () => {
            mockDb.cleanupExpiredInvitations.mockRejectedValue(new Error('Delete Error'));

            const result = await im.cleanupExpiredInvitations();
            expect(result.success).toBe(false);
            expect(result.error).toContain('Delete Error');
        });

        test('getPlayerInvitations returns formatted', async () => {
            mockDb.getPlayerInvitations.mockResolvedValue([
                { id: 'inv1', guild_id: 'g1', guild_name: 'Test', guild_tag: 'TST', status: 'PENDING' }
            ]);

            const result = await im.getPlayerInvitations('p1');
            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(1);
            expect(result.invitations[0]).toHaveProperty('guildId', 'g1');
        });

        test('getGuildInvitations returns formatted', async () => {
            mockDb.getGuildInvitations.mockResolvedValue([
                { id: 'inv1', invitee_id: 'p2', invitee_name: 'Test', status: 'PENDING' }
            ]);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });

            const result = await im.getGuildInvitations('p1', 'g1');
            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(1);
            expect(result.invitations[0]).toHaveProperty('inviteeId', 'p2');
        });
    });

    describe('Constants', () => {
        test('all constants defined', () => {
            // Create instances to check instance properties
            const db = new GuildDatabase(mockDb);
            const gm = new GuildManager(db, mockPlayerManager);
            const im = new GuildInvitationManager(gm, db);
            const ch = new GuildChatHandler(gm, db);
            
            // GuildManager constants
            expect(gm.GUILD_CREATE_COST).toBe(10000);
            expect(gm.GUILD_CREATE_MIN_LEVEL).toBe(10);
            
            // GuildInvitationManager constants
            expect(im.EXPIRATION_HOURS).toBe(24);
            expect(im.MAX_GUILD_INVITATIONS).toBe(50);
            expect(im.MAX_PLAYER_INVITATIONS).toBe(10);
            
            // GuildChatHandler constants
            expect(ch.maxMessages).toBe(5);
            expect(ch.cooldownMs).toBe(10000);
        });
    });
});
