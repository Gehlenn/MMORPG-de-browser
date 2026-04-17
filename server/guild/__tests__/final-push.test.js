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
            updateLastActive: jest.fn()
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
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.addGuildMember('g1', 'p1', 'MEMBER');
            expect(result.changes).toBe(1);
        });

        test('removeGuildMember deletes member', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.removeGuildMember('g1', 'p1');
            expect(result.changes).toBe(1);
        });

        test('updateMemberRank updates rank', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.updateMemberRank('g1', 'p1', 'OFFICER');
            expect(result.changes).toBe(1);
        });

        test('transferLeadership updates leader and demotes old', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.transferLeadership('g1', 'p1', 'p2');
            expect(result).toHaveProperty('success', true);
        });

        test('updateGuildInfo updates fields', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.updateGuildInfo('g1', {
                description: 'New',
                motd: 'New MOTD',
                isRecruiting: true
            });
            expect(result.changes).toBe(1);
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

            const result = await db.saveChatMessage('g1', {
                senderId: 'p1',
                senderName: 'Test',
                senderRank: 'MEMBER',
                message: 'Hello',
                isOfficerChat: false
            });

            expect(result).toHaveProperty('id', 'msg1');
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
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { id: 'inv1', guild_id: 'g1', invitee_id: 'p2' });
            });

            const result = await db.createInvitation({
                guildId: 'g1',
                inviterId: 'p1',
                inviteeId: 'p2'
            });

            expect(result).toHaveProperty('id', 'inv1');
        });

        test('respondToInvitation updates status', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'inv1',
                    status: 'ACCEPTED',
                    guild_id: 'g1',
                    invitee_id: 'p2'
                });
            });

            const result = await db.respondToInvitation('inv1', 'ACCEPTED');
            expect(result).toHaveProperty('status', 'ACCEPTED');
        });
    });

    describe('GuildManager - Success Paths', () => {
        let gm;

        beforeEach(() => {
            gm = new GuildManager(mockDb, mockPlayerManager);
            gm.on = jest.fn();
            gm.emit = jest.fn();
        });

        test('demoteMember succeeds', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.demoteMember('p1', 'p2', 'MEMBER');

            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:member_demoted', expect.any(Object));
        });

        test('demoteMember fails when invalid rank', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.demoteMember('p1', 'p2', 'INVALID');

            expect(result.success).toBe(false);
        });

        test('demoteMember fails when already has rank', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.demoteMember('p1', 'p2', 'MEMBER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already a MEMBER');
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
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 5 }, null);
            });

            const result = await im.cleanupExpiredInvitations();
            expect(result.count).toBe(5);
        });

        test('cleanupExpiredInvitations handles error', async () => {
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback(new Error('Delete Error'));
            });

            const result = await im.cleanupExpiredInvitations();
            expect(result.success).toBe(false);
        });

        test('getPlayerInvitations returns formatted', async () => {
            mockDb.getPlayerInvitations.mockResolvedValue([
                { id: 'inv1', guild_id: 'g1', guild_name: 'Test', guild_tag: 'TST', status: 'PENDING' }
            ]);

            const result = await im.getPlayerInvitations('p1');
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('guildId', 'g1');
        });

        test('getGuildInvitations returns formatted', async () => {
            mockDb.getGuildInvitations.mockResolvedValue([
                { id: 'inv1', invitee_id: 'p1', invitee_name: 'Test', status: 'PENDING' }
            ]);

            const result = await im.getGuildInvitations('g1');
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('inviteeId', 'p1');
        });
    });

    describe('Constants', () => {
        test('all constants defined', () => {
            expect(GuildManager.GUILD_CREATE_COST).toBe(10000);
            expect(GuildManager.GUILD_CREATE_MIN_LEVEL).toBe(10);
            expect(GuildManager.MAX_GUILD_MEMBERS).toBe(100);
            expect(GuildManager.MAX_GUILD_NAME_LENGTH).toBe(32);
            expect(GuildManager.MAX_GUILD_TAG_LENGTH).toBe(4);
            expect(GuildManager.MIN_GUILD_TAG_LENGTH).toBe(2);
            
            expect(GuildInvitationManager.EXPIRATION_HOURS).toBe(24);
            expect(GuildInvitationManager.MAX_GUILD_INVITATIONS).toBe(50);
            expect(GuildInvitationManager.MAX_PLAYER_INVITATIONS).toBe(10);
            
            expect(GuildChatHandler.MAX_MESSAGE_LENGTH).toBe(500);
            expect(GuildChatHandler.RATE_LIMIT_MESSAGES).toBe(5);
            expect(GuildChatHandler.RATE_LIMIT_WINDOW).toBe(10000);
        });
    });
});
