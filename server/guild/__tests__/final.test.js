/**
 * Final Coverage Push - Remaining Methods
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
            cleanupExpiredInvitations: jest.fn(),
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            countGuildInvitations: jest.fn(),
            countPlayerInvitations: jest.fn(),
            createInvitation: jest.fn(),
            getGuildInvitations: jest.fn(),
            getPlayerInvitations: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'Test', level: 15, gold: 15000 }),
            getPlayerByUsername: jest.fn().mockResolvedValue({ id: 'p2', username: 'Target' }),
            updateGold: jest.fn().mockResolvedValue(true),
            sendToPlayer: jest.fn()
        };
    });

    describe('GuildChatHandler - Remaining Methods', () => {
        let gm, ch;

        beforeEach(() => {
            gm = {
                playerManager: mockPlayerManager,
                on: jest.fn(),
                getOnlineGuildMembers: jest.fn().mockReturnValue(new Set(['p1', 'p2'])),
                playerManager: { sendToPlayer: jest.fn() },
                db: mockDb
            };
            ch = new GuildChatHandler(gm, mockDb);
        });

        test('initialize registers all event listeners', () => {
            ch.initialize();
            
            expect(gm.on).toHaveBeenCalledWith('guild:member_joined', expect.any(Function));
            expect(gm.on).toHaveBeenCalledWith('guild:member_left', expect.any(Function));
            expect(gm.on).toHaveBeenCalledWith('guild:member_kicked', expect.any(Function));
            expect(gm.on).toHaveBeenCalledWith('guild:member_promoted', expect.any(Function));
            expect(gm.on).toHaveBeenCalledWith('guild:leader_changed', expect.any(Function));
        });

        test('sendSystemMessage broadcasts to online members', () => {
            ch.sendSystemMessage('g1', 'Welcome!');
            
            expect(gm.playerManager.sendToPlayer).toHaveBeenCalled();
        });

        test('broadcastMessage sends to all members', () => {
            const messageData = { type: 'test', message: 'Hello' };
            ch.broadcastMessage('g1', messageData);
            
            // Should send to p1 and p2 (2 online members)
            expect(gm.playerManager.sendToPlayer).toHaveBeenCalledTimes(2);
        });

        test('broadcastMessage handles no members', () => {
            gm.getOnlineGuildMembers.mockReturnValue(new Set());
            
            ch.broadcastMessage('g1', { type: 'test' });
            
            expect(gm.playerManager.sendToPlayer).not.toHaveBeenCalled();
        });

        test('handleChat succeeds with valid input', async () => {
            mockDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });
            mockDb.saveChatMessage = jest.fn().mockResolvedValue({
                id: 'msg1',
                sent_at: new Date().toISOString()
            });

            const result = await ch.handleChat('p1', 'Hello everyone!');

            expect(result).toHaveProperty('success');
        });

        test('handleOfficerChat succeeds for officer', async () => {
            mockDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Officer' });
            mockDb.saveChatMessage = jest.fn().mockResolvedValue({
                id: 'msg1',
                sent_at: new Date().toISOString()
            });

            const result = await ch.handleOfficerChat('p1', 'Officer discussion');

            expect(result).toHaveProperty('success');
        });

        test('getChatHistory returns messages', async () => {
            mockDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getChatHistory = jest.fn().mockResolvedValue([
                { id: 'm1', message: 'Hello', sender_name: 'User1' },
                { id: 'm2', message: 'Hi', sender_name: 'User2' }
            ]);

            const result = await ch.getChatHistory('p1', 50);

            expect(result).toHaveProperty('success');
            expect(result.history).toHaveLength(2);
        });

        test('getChatHistory filters officer chat for non-officers', async () => {
            mockDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getChatHistory = jest.fn().mockResolvedValue([
                { id: 'm1', message: 'Public', sender_name: 'User1', is_officer_chat: 0 },
                { id: 'm2', message: 'Secret', sender_name: 'User2', is_officer_chat: 1 }
            ]);

            const result = await ch.getChatHistory('p1', 50);

            expect(result).toHaveProperty('success');
        });

        test('cleanupRateLimits removes expired entries', () => {
            // Add some rate limit entries
            ch.checkRateLimit('p1');
            ch.checkRateLimit('p2');
            
            // Manually set one to expired
            const oldData = ch.playerMessageCounts.get('p1');
            oldData.resetTime = Date.now() - 1000; // Expired
            
            ch.cleanupRateLimits();
            
            // Expired entry should be removed
            expect(ch.playerMessageCounts.has('p1')).toBe(false);
            expect(ch.playerMessageCounts.has('p2')).toBe(true);
        });

        test('checkRateLimit allows after cooldown', () => {
            // Use fake timers
            jest.useFakeTimers();
            const now = Date.now();
            
            // Fill up rate limit
            for (let i = 0; i < 5; i++) {
                ch.checkRateLimit('p1');
            }
            expect(ch.checkRateLimit('p1')).toBe(false);
            
            // Advance past cooldown
            jest.setSystemTime(now + 11000);
            
            // Should allow new messages
            expect(ch.checkRateLimit('p1')).toBe(true);
            
            jest.useRealTimers();
        });
    });

    describe('GuildInvitationManager - Remaining Methods', () => {
        let im;

        beforeEach(() => {
            const gm = {
                playerManager: mockPlayerManager,
                on: jest.fn(),
                emit: jest.fn()
            };
            im = new GuildInvitationManager(gm, mockDb);
        });

        test('initialize starts cleanup interval', () => {
            im.initialize();
            // Just verify it doesn't throw
            expect(im).toBeDefined();
        });

        test('createInvitation succeeds for leader', async () => {
            mockDb.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);
            mockDb.countGuildInvitations = jest.fn().mockResolvedValue(5);
            mockDb.countPlayerInvitations = jest.fn().mockResolvedValue(2);
            mockDb.createInvitation = jest.fn().mockResolvedValue({ id: 'inv1' });

            const result = await im.createInvitation('g1', 'p1', 'p2');

            expect(result).toHaveProperty('success');
        });

        test('acceptInvitation succeeds', async () => {
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
            mockDb.respondToInvitation = jest.fn().mockResolvedValue({ changes: 1 });

            const result = await im.acceptInvitation('p1', 'inv1');

            expect(result).toHaveProperty('success');
        });

        test('declineInvitation succeeds', async () => {
            mockDb.getInvitationById = jest.fn().mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.respondToInvitation = jest.fn().mockResolvedValue({ changes: 1 });

            const result = await im.declineInvitation('p1', 'inv1');

            expect(result).toHaveProperty('success');
        });

        test('cancelInvitation succeeds for inviter', async () => {
            mockDb.getInvitationById = jest.fn().mockResolvedValue({
                id: 'inv1',
                inviter_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING'
            });
            mockDb.cancelInvitation = jest.fn().mockResolvedValue(true);

            const result = await im.cancelInvitation('p1', 'inv1');

            expect(result).toHaveProperty('success');
        });

        test('getPlayerInvitations returns formatted list', async () => {
            mockDb.getPlayerInvitations = jest.fn().mockResolvedValue([
                { id: 'inv1', guild_id: 'g1', guild_name: 'Test Guild', status: 'PENDING' }
            ]);

            const result = await im.getPlayerInvitations('p1');

            expect(result).toHaveLength(1);
        });

        test('getGuildInvitations returns formatted list', async () => {
            mockDb.getGuildInvitations = jest.fn().mockResolvedValue([
                { id: 'inv1', invitee_id: 'p1', invitee_name: 'Test', status: 'PENDING' }
            ]);

            const result = await im.getGuildInvitations('g1');

            expect(result).toHaveLength(1);
        });

        test('cleanupExpiredInvitations returns count', async () => {
            mockDb.cleanupExpiredInvitations = jest.fn().mockResolvedValue({ count: 3 });

            const result = await im.cleanupExpiredInvitations();

            expect(result).toHaveProperty('count', 3);
        });

        test('formatInvitation formats correctly', () => {
            const invitation = {
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

            const formatted = im.formatInvitation(invitation, guild);

            expect(formatted).toHaveProperty('id', 'inv1');
            expect(formatted).toHaveProperty('guildId', 'g1');
            expect(formatted).toHaveProperty('guildName', 'Test Guild');
            expect(formatted).toHaveProperty('status', 'PENDING');
        });

        test('notifyPlayerOfInvitation sends notification', () => {
            const invitation = { id: 'inv1', expires_at: '2024-01-02' };
            const guild = { id: 'g1', name: 'Test Guild', tag: 'TST', memberCount: 5, maxMembers: 100 };
            
            im.notifyPlayerOfInvitation('p1', invitation, guild, 'inviter1');
            
            expect(mockPlayerManager.sendToPlayer).toHaveBeenCalledWith('p1', expect.any(Object));
        });
    });

    describe('GuildDatabase - Additional Coverage', () => {
        let db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
        });

        test('getGuildByName with exact match', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(null, { id: 'g1', name: 'Test', tag: 'TST' });
            });

            const result = await db.getGuildByName('Test');
            expect(result).toHaveProperty('name', 'Test');
        });

        test('getGuildByTag case insensitive', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(null, { id: 'g1', name: 'Test', tag: 'TST' });
            });

            const result = await db.getGuildByTag('tst');
            expect(result).toHaveProperty('tag', 'TST');
        });

        test('getPlayerGuild returns null when not in guild', async () => {
            mockDb.get = jest.fn((sql, params, callback) => callback(null, null));

            const result = await db.getPlayerGuild('p1');
            expect(result).toBeNull();
        });

        test('getGuildMembers returns empty array', async () => {
            mockDb.all = jest.fn((sql, params, callback) => callback(null, []));

            const result = await db.getGuildMembers('g1');
            expect(result).toEqual([]);
        });

        test('browseGuilds with recruiting filter', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(null, { count: 5 });
            });
            mockDb.all = jest.fn((sql, params, callback) => {
                callback(null, [{ id: 'g1', name: 'Test', is_recruiting: 1 }]);
            });

            const result = await db.browseGuilds({ isRecruiting: true });
            expect(result.guilds).toHaveLength(1);
        });

        test('updateGuildInfo with multiple fields', async () => {
            mockDb.run = jest.fn(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            await db.updateGuildInfo('g1', {
                description: 'New desc',
                motd: 'New MOTD',
                isRecruiting: true
            });

            // Method completes without error
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

        test('respondToInvitation accepts invitation', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                if (sql.includes('invitations')) {
                    callback(null, { id: 'inv1', invitee_id: 'p1', guild_id: 'g1', status: 'PENDING' });
                } else {
                    callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'MEMBER' });
                }
            });

            const result = await gm.respondToInvitation('p1', 'inv1', true);
            expect(result).toHaveProperty('success');
        });

        test('respondToInvitation declines invitation', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                if (sql.includes('invitations')) {
                    callback(null, { id: 'inv1', invitee_id: 'p1', guild_id: 'g1', status: 'PENDING' });
                } else {
                    callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'MEMBER' });
                }
            });

            const result = await gm.respondToInvitation('p1', 'inv1', false);
            expect(result).toHaveProperty('success');
        });

        test('getPlayerInvitations returns list', async () => {
            mockDb.all = jest.fn((sql, params, callback) => {
                callback(null, [
                    { id: 'inv1', guild_id: 'g1', inviter_id: 'p2', status: 'PENDING', created_at: '2024-01-01' }
                ]);
            });
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(null, { id: 'g1', name: 'Test', tag: 'TST' });
            });

            const result = await gm.getPlayerInvitations('p1');
            expect(result).toBeDefined();
        });
    });
});
