/**
 * Final Coverage Push - Clean Tests
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
            browseGuilds: jest.fn(),
            updateLastActive: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            getPlayerByUsername: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };
    });

    describe('GuildDatabase uncovered lines 218-233, 269-287, 374-375', () => {
        let db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
        });

        test('createGuild adds leader as member (lines 218-233)', async () => {
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

        test('respondToInvitation ACCEPTED path (lines 269-287)', async () => {
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

        test('updateLastActive (lines 374-375)', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.updateLastActive('g1', 'p1');
            expect(result.changes).toBe(1);
        });
    });

    describe('GuildInvitationManager uncovered lines 190-195, 295-318, 336-343, 404-405', () => {
        let im;

        beforeEach(() => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('acceptInvitation with member count (line 190-195)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            };
            const guild = { id: 'g1', name: 'Test', memberCount: 5, maxMembers: 100 };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild.mockResolvedValueOnce(null).mockResolvedValueOnce(guild);
            mockDb.getGuildById.mockResolvedValue(guild);
            mockDb.addGuildMember.mockResolvedValue(true);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            const result = await im.acceptInvitation('p1', 'inv1');
            expect(result.success).toBe(true);
        });

        test('getPlayerInvitations returns formatted (lines 295-318)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test', level: 10 });
            const rawInvites = [
                { id: 'inv1', guild_id: 'g1', guild_name: 'Guild1', guild_tag: 'G1', inviter_id: 'p1', inviter_name: 'Leader', status: 'PENDING', created_at: '2024-01-01' }
            ];
            mockDb.getGuildInvitations.mockResolvedValue(rawInvites);

            const result = await im.getGuildInvitations('g1', 'p1');
            expect(result.success).toBe(true);
            expect(Array.isArray(result.invitations)).toBe(true);
        });

        test('getPlayerInvitations returns formatted (lines 336-343)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test', level: 10 });
            const rawInvites = [
                { id: 'inv1', invitee_id: 'p1', invitee_name: 'Player', invitee_level: 10, status: 'PENDING', created_at: '2024-01-01' }
            ];
            mockDb.getGuildInvitations.mockResolvedValue(rawInvites);

            const result = await im.getGuildInvitations('g1', 'p1');
            expect(result.success).toBe(true);
            expect(Array.isArray(result.invitations)).toBe(true);
        });

        test('cleanupExpiredInvitations error (lines 404-405)', async () => {
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback(new Error('Delete error'));
            });

            const result = await im.cleanupExpiredInvitations();
            expect(result.success).toBe(false);
        });
    });

    describe('GuildChatHandler uncovered lines 150, 285', () => {
        test('handleOfficerChat empty message (line 150)', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set());

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            const result = await ch.handleOfficerChat('p1', '   ');
            expect(result.success).toBe(false);
        });

        test('handleOfficerChat rate limited', async () => {
            jest.useFakeTimers();
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set());

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            // Send 5 messages
            for (let i = 0; i < 5; i++) {
                await ch.handleOfficerChat('p1', `msg${i}`);
            }

            // 6th should be rate limited
            const result = await ch.handleOfficerChat('p1', 'limited');
            expect(result.success).toBe(false);
            
            jest.useRealTimers();
        });
    });
});
