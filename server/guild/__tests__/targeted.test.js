/**
 * Targeted Tests for Specific Uncovered Lines
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');
const GuildChatHandler = require('../GuildChatHandler');
const GuildInvitationManager = require('../GuildInvitationManager');

describe('Targeted Uncovered Lines', () => {
    let mockDb, mockPlayerManager;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
        
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
            cancelInvitation: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            getPlayerByUsername: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };
    });

    afterEach(() => {
        console.log.mockRestore();
    });

    describe('GuildInvitationManager Lines 58-91', () => {
        let im;

        beforeEach(() => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('createInvitation fails when guild not found (line 58-59)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue(null); // Guild not found

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Guild not found');
        });

        test('createInvitation fails when guild full (line 62-63)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                memberCount: 100,
                maxMembers: 100
            });

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Guild is full');
        });

        test('createInvitation fails when too many guild invitations (lines 67-71)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue({ memberCount: 5, maxMembers: 100 });
            
            // Create 50 pending invitations
            const pendingInvites = Array(50).fill({ status: 'PENDING', invitee_id: 'px' });
            mockDb.getGuildInvitations.mockResolvedValue(pendingInvites);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Too many pending invitations for this guild');
        });

        test('createInvitation fails when player has too many invitations (lines 74-77)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue({ memberCount: 5, maxMembers: 100 });
            mockDb.getGuildInvitations.mockResolvedValue([]); // No pending guild invites
            
            // Create 10 pending invitations for player
            const playerInvites = Array(10).fill({ status: 'PENDING' });
            mockDb.getPlayerInvitations.mockResolvedValue(playerInvites);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Player has too many pending invitations');
        });

        test('createInvitation fails when existing invite from guild (lines 80-83)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue({ memberCount: 5, maxMembers: 100 });
            
            // Create pending invitation from same guild to same player
            const pendingInvites = [{ status: 'PENDING', invitee_id: 'p2' }];
            mockDb.getGuildInvitations.mockResolvedValue(pendingInvites);
            mockDb.getPlayerInvitations.mockResolvedValue([]);

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Player already has a pending invitation from this guild');
        });

        test('createInvitation succeeds with notification (lines 86-94)', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Test Guild',
                tag: 'TST',
                memberCount: 5,
                maxMembers: 100
            });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            mockDb.createInvitation.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p2',
                inviter_id: 'p1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result.success).toBe(true);
            expect(result.invitation).toHaveProperty('id', 'inv1');
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalled(); // Notification sent
        });
    });

    describe('GuildInvitationManager Lines 178, 190-195, 224', () => {
        let im;

        beforeEach(() => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('acceptInvitation updates member count (line 178)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            };
            const guild = {
                id: 'g1',
                name: 'Test',
                memberCount: 5,
                maxMembers: 100
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild
                .mockResolvedValueOnce(null) // Not in guild
                .mockResolvedValueOnce(guild); // After joining
            mockDb.getGuildById.mockResolvedValue(guild);
            mockDb.addGuildMember.mockResolvedValue(true);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('guild');
            expect(result.guild).toHaveProperty('memberCount', 6); // Incremented
        });

        test('acceptInvitation with complete data (lines 190-195)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            };
            const guild = {
                id: 'g1',
                name: 'Test Guild',
                tag: 'TST',
                memberCount: 9,
                maxMembers: 100
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.getPlayerGuild
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(guild);
            mockDb.getGuildById.mockResolvedValue(guild);
            mockDb.addGuildMember.mockResolvedValue(true);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('newRank', 'MEMBER');
        });

        test('declineInvitation with complete result (line 224)', async () => {
            const invitation = {
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                guild_name: 'Test Guild',
                status: 'PENDING'
            };

            mockDb.getInvitationById.mockResolvedValue(invitation);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            const result = await im.declineInvitation('p1', 'inv1');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('guildId', 'g1');
            expect(result).toHaveProperty('guildName', 'Test Guild');
        });
    });

    describe('GuildInvitationManager Lines 295-318', () => {
        let im;

        beforeEach(() => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('getPlayerInvitations with formatted data (lines 295-318)', async () => {
            const rawInvitations = [
                {
                    id: 'inv1',
                    guild_id: 'g1',
                    guild_name: 'Guild One',
                    guild_tag: 'G1',
                    inviter_id: 'p1',
                    inviter_name: 'Leader',
                    status: 'PENDING',
                    created_at: '2024-01-01'
                },
                {
                    id: 'inv2',
                    guild_id: 'g2',
                    guild_name: 'Guild Two',
                    guild_tag: 'G2',
                    inviter_id: 'p2',
                    inviter_name: 'Leader2',
                    status: 'ACCEPTED',
                    created_at: '2024-01-02'
                }
            ];

            mockDb.getPlayerInvitations.mockResolvedValue(rawInvitations);

            const result = await im.getPlayerInvitations('p1');

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('guildName', 'Guild One');
            expect(result[1]).toHaveProperty('status', 'ACCEPTED');
        });
    });

    describe('GuildInvitationManager Lines 336-343, 404-405', () => {
        let im;

        beforeEach(() => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('getGuildInvitations with formatted data (lines 336-343)', async () => {
            const rawInvitations = [
                {
                    id: 'inv1',
                    invitee_id: 'p1',
                    invitee_name: 'Player One',
                    invitee_level: 15,
                    status: 'PENDING',
                    created_at: '2024-01-01'
                }
            ];

            mockDb.getGuildInvitations.mockResolvedValue(rawInvitations);

            const result = await im.getGuildInvitations('g1');

            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('inviteeName', 'Player One');
            expect(result[0]).toHaveProperty('inviteeLevel', 15);
        });

        test('cleanupExpiredInvitations error handling (lines 404-405)', async () => {
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback(new Error('Delete failed'));
            });

            const result = await im.cleanupExpiredInvitations();

            expect(result.success).toBe(false);
            expect(result.error).toContain('Delete failed');
        });
    });

    describe('GuildChatHandler Lines 141, 150, 166, 173, 285', () => {
        test('handleOfficerChat player not found (line 141)', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set());

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await ch.handleOfficerChat('p1', 'Test');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not found');
        });

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
            expect(result.error).toContain('empty');
        });

        test('handleOfficerChat message too long (line 166)', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set());

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            const longMessage = 'a'.repeat(501);
            const result = await ch.handleOfficerChat('p1', longMessage);

            expect(result.success).toBe(false);
            expect(result.error).toContain('too long');
        });

        test('handleOfficerChat rate limited (line 173)', async () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn().mockReturnValue(new Set());

            const ch = new GuildChatHandler(gm, mockDb);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            // Send 5 messages to hit rate limit
            for (let i = 0; i < 5; i++) {
                await ch.handleOfficerChat('p1', `Message ${i}`);
            }

            // 6th message should be rate limited
            const result = await ch.handleOfficerChat('p1', 'Rate limited');

            expect(result.success).toBe(false);
            expect(result.error).toContain('rate limit');
        });

        test('console.log initialized (line 285)', () => {
            const EventEmitter = require('events');
            const gm = new EventEmitter();
            gm.playerManager = mockPlayerManager;
            gm.getOnlineMembers = jest.fn();

            const ch = new GuildChatHandler(gm, mockDb);
            ch.initialize();

            expect(console.log).toHaveBeenCalledWith('💬 GuildChatHandler initialized');
        });
    });

    describe('GuildDatabase Lines 374-375', () => {
        let db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
        });

        test('updateLastActive updates timestamp (lines 374-375)', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.updateLastActive('g1', 'p1');

            expect(result.changes).toBe(1);
        });

        test('updateLastActive handles error', async () => {
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback(new Error('Update failed'));
            });

            await expect(db.updateLastActive('g1', 'p1')).rejects.toThrow('Update failed');
        });
    });
});
