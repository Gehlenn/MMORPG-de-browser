/**
 * Additional Guild Tests - More Coverage
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');

describe('More Guild Coverage', () => {
    let mockDb, mockPlayerManager;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
            get: jest.fn((sql, params, callback) => callback(null, null)),
            all: jest.fn((sql, params, callback) => callback(null, []))
        };
        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'Test', level: 15, gold: 15000 }),
            updateGold: jest.fn().mockResolvedValue(true),
            sendToPlayer: jest.fn()
        };
    });

    describe('GuildDatabase - Additional Methods', () => {
        let db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
        });

        test('getGuildByName returns guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { id: 'g1', name: 'Test', tag: 'TST', member_count: 5 });
            });

            const result = await db.getGuildByName('Test');

            expect(result).toHaveProperty('id', 'g1');
            expect(result).toHaveProperty('name', 'Test');
        });

        test('getGuildByName returns null', async () => {
            const result = await db.getGuildByName('Nonexistent');
            expect(result).toBeNull();
        });

        test('getGuildByTag returns guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { id: 'g1', name: 'Test', tag: 'TST', member_count: 5 });
            });

            const result = await db.getGuildByTag('TST');

            expect(result).toHaveProperty('tag', 'TST');
        });

        test('getPlayerGuild returns membership', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'LEADER' });
            });

            const result = await db.getPlayerGuild('p1');

            expect(result).toHaveProperty('guild_id', 'g1');
            expect(result).toHaveProperty('rank', 'LEADER');
        });

        test('getGuildMembers returns array', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, [
                    { player_id: 'p1', rank: 'LEADER', joined_at: '2024-01-01' },
                    { player_id: 'p2', rank: 'MEMBER', joined_at: '2024-01-02' }
                ]);
            });

            const result = await db.getGuildMembers('g1');

            expect(result).toHaveLength(2);
        });

        test('addGuildMember inserts member', async () => {
            const result = await db.addGuildMember('g1', 'p1', 'MEMBER');
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
        });

        test('removeGuildMember deletes member', async () => {
            const result = await db.removeGuildMember('g1', 'p1');
            expect(result).toBeDefined();
        });

        test('updateMemberRank updates rank', async () => {
            await db.updateMemberRank('g1', 'p1', 'OFFICER');
            // Method completes without error
        });

        test('updateLastActive updates timestamp', async () => {
            await db.updateLastActive('g1', 'p1');
            // Method completes without error
        });

        test('createInvitation inserts invitation', async () => {
            const result = await db.createInvitation({
                guildId: 'g1',
                inviterId: 'p1',
                inviteeId: 'p2'
            });
            expect(result).toHaveProperty('id');
        });

        test('getPlayerInvitations returns list', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, [
                    { id: 'inv1', guild_id: 'g1', status: 'PENDING' },
                    { id: 'inv2', guild_id: 'g2', status: 'PENDING' }
                ]);
            });

            const result = await db.getPlayerInvitations('p1');

            expect(result).toHaveLength(2);
        });

        test('getGuildInvitations returns list', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, [
                    { id: 'inv1', invitee_id: 'p1', status: 'PENDING' }
                ]);
            });

            const result = await db.getGuildInvitations('g1');

            expect(result).toHaveLength(1);
        });

        test('respondToInvitation updates status', async () => {
            let callCount = 0;
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });
            mockDb.get.mockImplementation((sql, params, callback) => {
                callCount++;
                // First call: get invitation by id
                // Second call: check if player already in guild (SELECT id FROM guild_members)
                // Third call: get member count for guild
                // Fourth call: get max_members from guilds
                if (callCount === 1) {
                    // Return invitation
                    callback(null, { id: 'inv1', status: 'ACCEPTED', invitee_id: 'p1', guild_id: 'g1' });
                } else if (callCount === 2) {
                    // Check for existing membership by player_id - return null (not in guild)
                    callback(null, null);
                } else if (callCount === 3) {
                    // Member count query
                    callback(null, { count: 5 });
                } else if (callCount === 4) {
                    // Guild capacity check
                    callback(null, { max_members: 100 });
                } else {
                    callback(null, null);
                }
            });

            const result = await db.respondToInvitation('inv1', 'ACCEPTED');

            expect(result).toHaveProperty('id', 'inv1');
            expect(result).toHaveProperty('status', 'ACCEPTED');
        });

        test('saveChatMessage saves message', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { id: 'msg1', sent_at: new Date().toISOString() });
            });

            const result = await db.saveChatMessage('g1', {
                senderId: 'p1',
                senderName: 'Test',
                senderRank: 'LEADER',
                message: 'Hello',
                isOfficerChat: false
            });

            expect(result).toHaveProperty('id');
        });

        test('transferLeadership updates leader', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                callback.call({ changes: 1 }, null);
            });

            const result = await db.transferLeadership('g1', 'oldLeader', 'newLeader');

            expect(result.success).toBe(true);
        });
    });

    describe('GuildManager - Additional Methods', () => {
        let gm, db;

        beforeEach(() => {
            db = new GuildDatabase(mockDb);
            gm = new GuildManager(db, mockPlayerManager);
            gm.on = jest.fn();
            gm.emit = jest.fn();
        });

        test('initialize emits event', async () => {
            await gm.initialize();
            expect(gm.emit).toHaveBeenCalledWith('initialized');
        });

        test('disbandGuild fails when guild not found', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => callback(null, null));

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('disbandGuild fails when not leader', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('guilds')) {
                    callback(null, { id: 'g1', leader_id: 'p2', name: 'Test' });
                } else {
                    callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'MEMBER' });
                }
            });

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the guild leader can disband');
        });

        test('leaveGuild fails when not in guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => callback(null, null));

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('leaveGuild fails when leader tries to leave', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'LEADER' });
            });

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('transfer leadership');
        });

        test('kickMember fails when kicker not in guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => callback(null, null));

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('kickMember fails when target not in same guild', async () => {
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                callCount++;
                if (callCount === 1) {
                    callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'LEADER' });
                } else {
                    callback(null, { guild_id: 'g2', player_id: 'p2', rank: 'MEMBER' });
                }
            });

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not in your guild');
        });

        test('kickMember fails when kicker lacks permission', async () => {
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                callCount++;
                if (callCount === 1) {
                    callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'MEMBER' });
                } else {
                    callback(null, { guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
                }
            });

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can kick');
        });

        test('promoteMember fails when not leader', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'OFFICER' });
            });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader can promote/demote');
        });

        test('updateGuildInfo fails when not in guild', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => callback(null, null));

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('updateGuildInfo fails when not officer or leader', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'MEMBER' });
            });

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can update guild info');
        });

        test('browseGuilds returns guilds', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { count: 10 });
            });
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, [
                    { id: 'g1', name: 'Guild 1', member_count: 5 },
                    { id: 'g2', name: 'Guild 2', member_count: 10 }
                ]);
            });

            const result = await gm.browseGuilds({ page: 1, limit: 10 });

            expect(result.success).toBe(true);
            expect(result.guilds.guilds).toHaveLength(2);
        });

        test('handlePlayerOnline sets member online', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'MEMBER' });
            });

            await gm.handlePlayerOnline('p1');

            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);
        });

        test('handlePlayerOffline sets member offline', async () => {
            // Setup: player in guild
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                callCount++;
                callback(null, { guild_id: 'g1', player_id: 'p1', rank: 'MEMBER' });
            });

            await gm.setPlayerOnline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);

            await gm.handlePlayerOffline('p1');

            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });
    });
});
