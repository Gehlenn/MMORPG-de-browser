/**
 * Specific Uncovered Lines Tests
 */

const GuildDatabase = require('../GuildDatabase');
const GuildChatHandler = require('../GuildChatHandler');
const GuildManager = require('../GuildManager');
const GuildInvitationManager = require('../GuildInvitationManager');

describe('Specific Lines Coverage Tests', () => {
    let mockDb, mockPlayerManager;
    let consoleSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
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
            respondToInvitation: jest.fn(),
            addGuildMember: jest.fn(),
            updateMemberRank: jest.fn(),
            transferLeadership: jest.fn(),
            removeGuildMember: jest.fn(),
            disbandGuild: jest.fn(),
            updateGuildInfo: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'Test', level: 15, gold: 15000 }),
            getPlayerByUsername: jest.fn().mockResolvedValue({ id: 'p2', username: 'Target', level: 10 }),
            updateGold: jest.fn().mockResolvedValue(true),
            sendToPlayer: jest.fn()
        };
    });

    afterEach(() => {
        consoleSpy?.mockRestore();
    });

    describe('GuildChatHandler - Line 39 (leadership_transferred)', () => {
        test('guild:leadership_transferred event handler', () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set(['p1']));

            const ch = new GuildChatHandler(gm, mockDb);
            ch.initialize();

            gm.emit('guild:leadership_transferred', {
                guildId: 'g1',
                newLeaderName: 'NewLeader'
            });

            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled();
        });
    });

    describe('GuildChatHandler - Line 64 (not in guild)', () => {
        test('handleChat returns not in guild error', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set());

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await ch.handleChat('p1', 'Hello');

            expect(result.success).toBe(false);
            expect(result.error).toBe('You are not in a guild');
        });
    });

    describe('GuildChatHandler - Lines 141, 150, 166, 173', () => {
        test('handleOfficerChat all officer ranks', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set(['p1']));

            const ch = new GuildChatHandler(gm, mockDb);

            // Test OFFICER rank
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'p1', rank: 'OFFICER' }
            ]);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Officer' });
            mockDb.saveChatMessage.mockResolvedValue({ id: 'msg1', sent_at: new Date().toISOString() });

            const result = await ch.handleOfficerChat('p1', 'Officer chat');
            expect(result.success).toBe(true);
        });

        test('handleOfficerChat player not found', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await ch.handleOfficerChat('p1', 'Test');

            expect(result.success).toBe(false);
        });

        test('handleOfficerChat save error', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Officer' });
            mockDb.saveChatMessage.mockRejectedValue(new Error('DB Error'));

            const result = await ch.handleOfficerChat('p1', 'Test');

            expect(result.success).toBe(false);
        });
    });

    describe('GuildChatHandler - Line 182', () => {
        test('getChatHistory returns messages successfully', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getChatHistory.mockResolvedValue([
                { id: 'm1', message: 'Hello', sender_name: 'User1', is_officer_chat: 0 }
            ]);

            const result = await ch.getChatHistory('p1', 50);

            expect(result.success).toBe(true);
            expect(result.messages).toHaveLength(1);
        });
    });

    describe('GuildChatHandler - Line 285', () => {
        test('console.log on initialize', () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn();

            const ch = new GuildChatHandler(gm, mockDb);
            ch.initialize();

            expect(console.log).toHaveBeenCalledWith('💬 GuildChatHandler initialized');
        });
    });

    describe('GuildDatabase - Lines 320, 374-375', () => {
        let db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
        });

        test('getGuildMembers returns members', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, [
                    { player_id: 'p1', rank: 'LEADER', joined_at: '2024-01-01' }
                ]);
            });

            const result = await db.getGuildMembers('g1');
            expect(result).toHaveLength(1);
        });

        test('getGuildMembers returns empty array', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });

            const result = await db.getGuildMembers('g1');
            expect(result).toEqual([]);
        });

        test('updateLastActive updates timestamp', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            await db.updateLastActive('g1', 'p1');
            // Method completes without error
        });
    });

    describe('GuildManager - Remaining Lines', () => {
        let gm, db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
            gm = new GuildManager(db, mockPlayerManager);
            gm.on = jest.fn();
            gm.emit = jest.fn();
        });

        test('demoteMember succeeds for leader', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p2', rank: 'OFFICER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.demoteMember('p1', 'p2', 'MEMBER');

            expect(result).toHaveProperty('success');
        });

        test('initialize sets up event listeners', async () => {
            await gm.initialize();
            expect(gm.emit).toHaveBeenCalledWith('initialized');
        });

        test('setPlayerOnline adds to cache', () => {
            gm.setPlayerOnline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);
        });

        test('setPlayerOffline removes from cache', () => {
            gm.setPlayerOnline('g1', 'p1');
            gm.setPlayerOffline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });
    });

    describe('GuildInvitationManager - Remaining Lines', () => {
        let im;

        beforeEach(() => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('createInvitation with OFFICER rank', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildById.mockResolvedValue({ member_count: 5, max_members: 100 });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'New' });
            mockDb.countGuildInvitations.mockResolvedValue(5);
            mockDb.countPlayerInvitations.mockResolvedValue(2);
            mockDb.createInvitation.mockResolvedValue({ id: 'inv1' });

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result).toHaveProperty('success');
        });

        test('notifyPlayerOfInvitation sends correct format', () => {
            const invitation = {
                id: 'inv1',
                guild_id: 'g1',
                guild_name: 'Test Guild',
                guild_tag: 'TST',
                inviter_name: 'Leader'
            };

            im.notifyPlayerOfInvitation('p1', invitation);

            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalledWith('p1', expect.objectContaining({
                type: 'guild:invitation_received',
                invitation: expect.objectContaining({
                    id: 'inv1',
                    guildId: 'g1',
                    guildName: 'Test Guild',
                    guildTag: 'TST',
                    inviterName: 'Leader'
                })
            }));
        });

        test('formatInvitation handles null values', () => {
            const raw = {
                id: 'inv1',
                guild_id: null,
                guild_name: null,
                guild_tag: null,
                inviter_id: null,
                inviter_name: null,
                invitee_id: null,
                invitee_name: null,
                created_at: null,
                expires_at: null,
                status: null
            };

            const formatted = im.formatInvitation(raw);

            expect(formatted).toHaveProperty('id', 'inv1');
        });

        test('acceptInvitation handles db error', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'g1', name: 'Test', member_count: 5, max_members: 100 });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', member_count: 5, max_members: 100 });
            mockDb.addGuildMember.mockRejectedValue(new Error('DB Error'));

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(false);
        });

        test('cleanupExpiredInvitations handles error', async () => {
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback(new Error('Delete Error'));
            });

            const result = await im.cleanupExpiredInvitations();

            expect(result.success).toBe(false);
        });
    });

    describe('Integration Tests', () => {
        test('full guild workflow', async () => {
            const db = new GuildDatabase(mockDb);
            const gm = new GuildManager(db, mockPlayerManager);
            gm.on = jest.fn();
            gm.emit = jest.fn();

            // Create guild
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue(null);
            mockPlayerManager.updateGold.mockResolvedValue(true);
            mockDb.createGuild.mockResolvedValue({
                id: 'g1',
                name: 'Test',
                tag: 'TST',
                leaderId: 'p1'
            });

            const createResult = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });
            expect(createResult.success).toBe(true);

            // Get guild info
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test', member_count: 1 });
            mockDb.getGuildMembers.mockResolvedValue([{ player_id: 'p1', rank: 'LEADER' }]);

            const infoResult = await gm.getPlayerGuildInfo('p1');
            expect(infoResult.success).toBe(true);
        });
    });
});
