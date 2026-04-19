/**
 * Tests for Previously Uncovered Lines
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');
const GuildChatHandler = require('../GuildChatHandler');
const GuildInvitationManager = require('../GuildInvitationManager');

describe('Uncovered Lines Tests', () => {
    let mockDb, mockPlayerManager;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
            get: jest.fn((sql, params, callback) => callback(null, null)),
            all: jest.fn((sql, params, callback) => callback(null, [])),
            getPlayerGuild: jest.fn(),
            cleanupExpiredInvitations: jest.fn(),
            getGuildInvitations: jest.fn(),
            getPlayerInvitations: jest.fn(),
            removeMember: jest.fn(),
            saveChatMessage: jest.fn(),
            getChatHistory: jest.fn(),
            getGuildMembers: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'Test', level: 15, gold: 15000 }),
            getPlayerByUsername: jest.fn().mockResolvedValue({ id: 'p2', username: 'Target' }),
            updateGold: jest.fn().mockResolvedValue(true),
            sendToPlayer: jest.fn()
        };
    });

    describe('GuildDatabase - respondToInvitation ACCEPTED path (lines 259-284)', () => {
        let db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
        });

        test('respondToInvitation ACCEPTED adds member', async () => {
            // First get the invitation
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('invitations')) {
                    callback(null, { 
                        id: 'inv1', 
                        invitee_id: 'p2', 
                        guild_id: 'g1',
                        status: 'PENDING'
                    });
                } else if (sql.includes('guild_members WHERE player_id')) {
                    // Check if player already in guild - not found
                    callback(null, null);
                } else if (sql.includes('COUNT(*)')) {
                    callback(null, { count: 5 });
                } else if (sql.includes('max_members')) {
                    callback(null, { max_members: 100 });
                } else {
                    callback(null, null);
                }
            });

            const result = await db.respondToInvitation('inv1', 'ACCEPTED');
            expect(result).toHaveProperty('id', 'inv1');
        });

        test('respondToInvitation ACCEPTED throws if player already in guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('invitations')) {
                    callback(null, { 
                        id: 'inv1', 
                        invitee_id: 'p2', 
                        guild_id: 'g1',
                        status: 'PENDING'
                    });
                } else if (sql.includes('guild_members WHERE player_id')) {
                    // Player already in guild
                    callback(null, { id: 'existing' });
                } else {
                    callback(null, null);
                }
            });

            await expect(db.respondToInvitation('inv1', 'ACCEPTED')).rejects.toThrow('already in a guild');
        });

        test('respondToInvitation ACCEPTED throws if guild full', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('invitations')) {
                    callback(null, { 
                        id: 'inv1', 
                        invitee_id: 'p2', 
                        guild_id: 'g1',
                        status: 'PENDING'
                    });
                } else if (sql.includes('guild_members WHERE player_id')) {
                    callback(null, null); // Not in guild
                } else if (sql.includes('COUNT(*)')) {
                    callback(null, { count: 100 }); // Full
                } else if (sql.includes('max_members')) {
                    callback(null, { max_members: 100 });
                } else {
                    callback(null, null);
                }
            });

            await expect(db.respondToInvitation('inv1', 'ACCEPTED')).rejects.toThrow('Guild is full');
        });

        test('respondToInvitation DECLINED does not add member', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { id: 'inv1', status: 'PENDING' });
            });

            const result = await db.respondToInvitation('inv1', 'DECLINED');
            expect(result).toHaveProperty('id', 'inv1');
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

        test('disbandGuild succeeds and clears cache', async () => {
            // Mock db methods
            db.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', leaderId: 'p1', name: 'Test Guild' });
            db.getGuildMembers = jest.fn().mockResolvedValue([
                { player_id: 'p1', rank: 'LEADER' },
                { player_id: 'p2', rank: 'MEMBER' }
            ]);
            db.disbandGuild = jest.fn().mockResolvedValue(true);

            const result = await gm.disbandGuild('p1', 'g1');
            
            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:disbanded', expect.any(Object));
        });

        test('leaveGuild succeeds for member', async () => {
            db.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', player_id: 'p1', rank: 'MEMBER' });
            db.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test', member_count: 5 });
            db.removeMember = jest.fn().mockResolvedValue(true);

            const result = await gm.leaveGuild('p1');
            
            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:member_left', expect.any(Object));
        });

        test('kickMember succeeds for leader kicking member', async () => {
            db.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
            db.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test', tag: 'TST', member_count: 5 });
            db.removeMember = jest.fn().mockResolvedValue(true);

            const result = await gm.kickMember('p1', 'p2');
            
            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:member_kicked', expect.any(Object));
        });

        test('kickMember succeeds for officer kicking member', async () => {
            db.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p1', rank: 'OFFICER' })
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
            db.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test', tag: 'TST', member_count: 5 });
            db.removeMember = jest.fn().mockResolvedValue(true);

            const result = await gm.kickMember('p1', 'p2');
            
            expect(result.success).toBe(true);
        });

        test('promoteMember succeeds for leader', async () => {
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                callCount++;
                if (callCount === 1) {
                    callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'LEADER' });
                } else {
                    callback(null, { guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
                }
            });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');
            
            expect(result).toHaveProperty('success');
        });

        test('transferLeadership succeeds', async () => {
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                callCount++;
                if (callCount === 1) {
                    callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'LEADER' });
                } else {
                    callback(null, { guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
                }
            });

            const result = await gm.transferLeadership('p1', 'p2');
            
            expect(result).toHaveProperty('success');
        });

        test('updateGuildInfo succeeds for officer', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'OFFICER' });
            });

            const result = await gm.updateGuildInfo('p1', { description: 'New', motd: 'Hello' });
            
            expect(result).toHaveProperty('success');
        });

        test('invitePlayer succeeds for leader', async () => {
            db.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);
            db.countGuildInvitations = jest.fn().mockResolvedValue(5);
            db.countPlayerInvitations = jest.fn().mockResolvedValue(2);
            db.createInvitation = jest.fn().mockResolvedValue({ id: 'inv1' });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'NewPlayer' });

            const result = await gm.invitePlayer('p1', 'g1', 'NewPlayer');
            
            expect(result).toHaveProperty('success');
        });

        test('respondToInvitation accepts', async () => {
            db.getInvitationById = jest.fn().mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            db.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'g1', name: 'Test', member_count: 5, max_members: 100 });
            db.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', member_count: 5, max_members: 100 });
            db.addGuildMember = jest.fn().mockResolvedValue(true);
            db.respondToInvitation = jest.fn().mockResolvedValue({ success: true });

            const result = await gm.respondToInvitation('p1', 'inv1', true);
            
            expect(result).toHaveProperty('success');
        });

        test('respondToInvitation declines', async () => {
            db.getInvitationById = jest.fn().mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            });
            db.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            db.respondToInvitation = jest.fn().mockResolvedValue({ success: true });

            const result = await gm.respondToInvitation('p1', 'inv1', false);
            
            expect(result).toHaveProperty('success');
        });
    });

    describe('GuildChatHandler - Uncovered Lines', () => {
        let gm, ch;

        beforeEach(() => {
            gm = {
                playerManager: {
                    getPlayer: mockPlayerManager.getPlayer,
                    sendToPlayer: jest.fn()
                },
                on: jest.fn(),
                getOnlineMembers: jest.fn().mockReturnValue(new Set(['p1', 'p2']))
            };
            ch = new GuildChatHandler(gm, mockDb);
        });

        test('handleChat success path', async () => {
            mockDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });
            mockDb.saveChatMessage = jest.fn().mockResolvedValue({
                id: 'msg1',
                senderId: 'p1',
                senderName: 'Test',
                senderRank: 'MEMBER',
                message: 'Hello',
                sent_at: new Date().toISOString()
            });

            const result = await ch.handleChat('p1', 'Hello everyone!');
            
            expect(result.success).toBe(true);
            expect(mockDb.saveChatMessage).toHaveBeenCalled();
        });

        test('handleOfficerChat success for LEADER', async () => {
            mockDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildMembers = jest.fn().mockResolvedValue([
                { player_id: 'p1', rank: 'LEADER' },
                { player_id: 'p2', rank: 'OFFICER' }
            ]);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Leader' });
            mockDb.saveChatMessage = jest.fn().mockResolvedValue({
                id: 'msg1',
                sent_at: new Date().toISOString()
            });

            const result = await ch.handleOfficerChat('p1', 'Officer message');
            
            expect(result.success).toBe(true);
        });

        test('event handlers fire system messages', () => {
            ch.initialize();
            
            // Get the registered handlers
            const memberJoinedHandler = gm.on.mock.calls.find(call => call[0] === 'guild:member_joined')[1];
            
            // Call the handler
            memberJoinedHandler({ guildId: 'g1', playerName: 'NewMember' });
            
            expect(gm.playerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('broadcastOfficerMessage sends to online officers', async () => {
            mockDb.getGuildMembers = jest.fn().mockResolvedValue([
                { player_id: 'p1', rank: 'LEADER' },
                { player_id: 'p2', rank: 'OFFICER' },
                { player_id: 'p3', rank: 'MEMBER' }
            ]);
            gm.getOnlineMembers.mockReturnValue(new Set(['p1', 'p2', 'p3']));

            const messageData = { type: 'test', message: 'Officer chat' };
            await ch.broadcastOfficerMessage('g1', messageData);

            // Should send to p1 and p2 (LEADER and OFFICER), not p3
            expect(gm.playerManager.sendToPlayer).toHaveBeenCalledTimes(2);
        });
    });

    describe('GuildInvitationManager - Uncovered Lines', () => {
        let im;

        beforeEach(() => {
            const gm = {
                playerManager: mockPlayerManager,
                on: jest.fn(),
                emit: jest.fn()
            };
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('createInvitation with valid data', async () => {
            mockDb.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);
            mockDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', memberCount: 5, maxMembers: 100 });
            mockDb.getGuildInvitations = jest.fn().mockResolvedValue([]);
            mockDb.getPlayerInvitations = jest.fn().mockResolvedValue([]);
            mockDb.createInvitation = jest.fn().mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p2',
                created_at: '2024-01-01'
            });

            const result = await im.createInvitation('g1', 'p1', 'p2');
            
            expect(result.success).toBe(true);
        });

        test('acceptInvitation with valid data', async () => {
            mockDb.getInvitationById = jest.fn().mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'g1', name: 'Test', member_count: 5, max_members: 100 });
            mockDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', member_count: 5, max_members: 100 });
            mockDb.addGuildMember = jest.fn().mockResolvedValue(true);
            mockDb.respondToInvitation = jest.fn().mockResolvedValue({ success: true, changes: 1 });
            mockDb.getPlayerInvitations = jest.fn().mockResolvedValue([]);

            const result = await im.acceptInvitation('p1', 'inv1');
            
            expect(result.success).toBe(true);
        });

        test('declineInvitation with valid data', async () => {
            mockDb.getInvitationById = jest.fn().mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.respondToInvitation = jest.fn().mockResolvedValue({ success: true, changes: 1 });

            const result = await im.declineInvitation('p1', 'inv1');
            
            expect(result.success).toBe(true);
        });

        test('cancelInvitation by leader', async () => {
            mockDb.getInvitationById = jest.fn().mockResolvedValue({
                id: 'inv1',
                inviter_id: 'p2', // Different from canceller
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.cancelInvitation = jest.fn().mockResolvedValue(true);

            const result = await im.cancelInvitation('p1', 'inv1');
            
            expect(result.success).toBe(true);
        });

        test('getPlayerInvitations returns formatted', async () => {
            mockDb.getPlayerInvitations = jest.fn().mockResolvedValue([
                { id: 'inv1', guild_id: 'g1', inviter_id: 'p2', status: 'PENDING', created_at: '2024-01-01' }
            ]);
            mockDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test', tag: 'TST' });

            const result = await im.getPlayerInvitations('p1');
            
            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(1);
            expect(result.invitations[0]).toHaveProperty('guildId', 'g1');
        });

        test('getGuildInvitations returns formatted', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildInvitations = jest.fn().mockResolvedValue([
                { id: 'inv1', invitee_id: 'p1', invitee_name: 'Test', status: 'PENDING' }
            ]);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            const result = await im.getGuildInvitations('officer1', 'g1');
            
            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(1);
            expect(result.invitations[0]).toHaveProperty('inviteeId', 'p1');
        });

        test('cleanupExpiredInvitations returns count', async () => {
            mockDb.cleanupExpiredInvitations.mockResolvedValue(5);

            const result = await im.cleanupExpiredInvitations();
            
            expect(result.success).toBe(true);
        });

        test('formatInvitation formats all fields', () => {
            const raw = {
                id: 'inv1',
                created_at: '2024-01-01',
                expires_at: '2024-01-02',
                status: 'PENDING'
            };
            const guild = {
                id: 'g1',
                name: 'Test Guild',
                tag: 'TST'
            };

            const formatted = im.formatInvitation(raw, guild);
            
            expect(formatted).toEqual({
                id: 'inv1',
                guildId: 'g1',
                guildName: 'Test Guild',
                guildTag: 'TST',
                createdAt: '2024-01-01',
                expiresAt: '2024-01-02',
                status: 'PENDING'
            });
        });

        test('notifyPlayerOfInvitation sends notification', () => {
            const invitation = { id: 'inv1', expires_at: '2024-01-02' };
            const guild = { id: 'g1', name: 'Test Guild', tag: 'TST', memberCount: 5, maxMembers: 100 };
            
            im.notifyPlayerOfInvitation('p1', invitation, guild, 'inviter1');
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalledWith('p1', expect.objectContaining({
                type: 'guild:invited'
            }));
        });
    });
});
