/**
 * GuildManager Remaining Lines Coverage
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');

describe('GuildManager Remaining Lines', () => {
    let mockDb, mockPlayerManager, gm;

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
            disbandGuild: jest.fn(),
            removeGuildMember: jest.fn(),
            removeMember: jest.fn((sql, params, callback) => callback.call({ changes: 1 }, null)),
            updateMemberRank: jest.fn(),
            transferLeadership: jest.fn(),
            updateGuildInfo: jest.fn(),
            respondToInvitation: jest.fn(),
            addGuildMember: jest.fn(),
            browseGuilds: jest.fn(),
            countGuilds: jest.fn(),
            createInvitation: jest.fn(),
            getInvitationById: jest.fn(),
            getPlayerInvitations: jest.fn(),
            cancelInvitation: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            getPlayerByUsername: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };
        
        const db = new GuildDatabase(mockDb);
        // Add removeMember alias for GuildManager compatibility
        db.removeMember = jest.fn().mockResolvedValue({ changes: 1 });
        gm = new GuildManager(db, mockPlayerManager);
        gm.on = jest.fn();
        gm.emit = jest.fn();
    });

    describe('createGuild validation lines 64, 69', () => {
        test('createGuild fails when name too short', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'A', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('2-24 characters');
        });

        test('createGuild fails when name too long', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'A'.repeat(25), tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('2-24 characters');
        });

        test('createGuild fails when tag too short', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TS' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('3-4 characters');
        });

        test('createGuild fails when tag too long', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TESTS' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('3-4 characters');
        });

        test('createGuild fails when tag null', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'Test', tag: null });

            expect(result.success).toBe(false);
            expect(result.error).toContain('3-4 characters');
        });
    });

    describe('disbandGuild lines 186-219', () => {
        test('disbandGuild succeeds and notifies all members', async () => {
            // Configure mockDb.get for SQLite queries
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', leader_id: 'p1', name: 'Test Guild' });
                } else if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callback(null, { guild_id: 'g1', rank: 'LEADER' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.all.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.guild_id')) {
                    callback(null, [
                        { player_id: 'p1', rank: 'LEADER' },
                        { player_id: 'p2', rank: 'OFFICER' },
                        { player_id: 'p3', rank: 'MEMBER' }
                    ]);
                } else {
                    callback(null, []);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:disbanded', expect.objectContaining({
                memberIds: ['p1', 'p2', 'p3']
            }));
        });
    });

    describe('leaveGuild lines 249', () => {
        test('leaveGuild handles cache removal', async () => {
            // Configure mockDb.get for SQLite queries
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callback(null, { guild_id: 'g1', rank: 'MEMBER' });
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test', member_count: 5 });
                } else {
                    callback(null, null);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });

            // Set player online first
            await gm.setPlayerOnline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(true);
            // Player should be removed from online cache
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });
    });

    describe('kickMember lines 292', () => {
        test('kickMember removes from cache', async () => {
            // Sequence: setPlayerOnline(p2) -> getPlayerGuild, kickMember(p1,p2) -> getPlayerGuild(p1), getPlayerGuild(p2)
            let getPlayerGuildCalls = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    getPlayerGuildCalls++;
                    // Call 1: setPlayerOnline p2, Calls 2-3: kickMember p1 then p2
                    if (getPlayerGuildCalls === 1) {
                        callback(null, { guild_id: 'g1', rank: 'MEMBER' }); // p2 for setPlayerOnline
                    } else if (getPlayerGuildCalls === 2) {
                        callback(null, { guild_id: 'g1', rank: 'LEADER' }); // p1 (kicker)
                    } else if (getPlayerGuildCalls === 3) {
                        callback(null, { guild_id: 'g1', rank: 'MEMBER' }); // p2 (target)
                    } else {
                        callback(null, null);
                    }
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test', leader_id: 'p1' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });
            mockDb.all.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.guild_id')) {
                    callback(null, [
                        { player_id: 'p1', rank: 'LEADER' },
                        { player_id: 'p2', rank: 'MEMBER' }
                    ]);
                } else {
                    callback(null, []);
                }
            });

            // Mock getPlayer for target player
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Target' });

            // Set target online (this calls getPlayerGuild for p2)
            await gm.setPlayerOnline('g1', 'p2');
            expect(gm.isPlayerOnline('g1', 'p2')).toBe(true);

            const result = await gm.kickMember('p1', 'p2');
            
            if (!result.success) {
                console.log('kickMember error:', result.error);
            }

            expect(result.success).toBe(true);
            expect(gm.isPlayerOnline('g1', 'p2')).toBe(false);
            expect(gm.emit).toHaveBeenCalledWith('guild:member_kicked', expect.objectContaining({
                playerId: 'p2'
            }));
        });
    });

    describe('promoteMember lines 303-315', () => {
        test('promoteMember with detailed result', async () => {
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callCount++;
                    if (callCount === 1) {
                        callback(null, { guild_id: 'g1', rank: 'LEADER' }); // promoter (p1)
                    } else {
                        callback(null, { guild_id: 'g1', rank: 'MEMBER' }); // target (p2)
                    }
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test Guild', leader_id: 'p1' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('message');
            expect(gm.emit).toHaveBeenCalledWith('guild:member_promoted', expect.objectContaining({
                newRank: 'OFFICER'
            }));
        });
    });

    describe('demoteMember lines 368-381', () => {
        test('demoteMember with detailed result', async () => {
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callCount++;
                    if (callCount === 1) {
                        callback(null, { guild_id: 'g1', rank: 'LEADER' }); // demoter (p1)
                    } else {
                        callback(null, { guild_id: 'g1', rank: 'OFFICER' }); // target (p2)
                    }
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test Guild', leader_id: 'p1' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });

            const result = await gm.demoteMember('p1', 'p2', 'MEMBER');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('message');
            expect(gm.emit).toHaveBeenCalledWith('guild:member_promoted', expect.objectContaining({
                newRank: 'MEMBER'
            }));
        });
    });

    describe('transferLeadership line 613', () => {
        test('transferLeadership updates ranks', async () => {
            let callCount = 0;
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callCount++;
                    if (callCount === 1) {
                        callback(null, { guild_id: 'g1', rank: 'LEADER' }); // current leader (p1)
                    } else {
                        callback(null, { guild_id: 'g1', rank: 'OFFICER' }); // target (p2)
                    }
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test', leader_id: 'p1' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(true);
        });
    });

    describe('updateGuildInfo lines 622, 635-654', () => {
        test('updateGuildInfo updates multiple fields', async () => {
            // Configure mockDb.get for guild membership and guild queries
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callback(null, { guild_id: 'g1', rank: 'LEADER' });
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test', description: 'New description', motd: 'New MOTD', is_recruiting: 1 });
                } else {
                    callback(null, null);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });

            const result = await gm.updateGuildInfo('p1', {
                description: 'New description',
                motd: 'New MOTD',
                isRecruiting: true
            });

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('guild');
            expect(result).toHaveProperty('message', 'Guild information updated');
        });

        test('updateGuildInfo partial update', async () => {
            // Configure mockDb.get for guild membership and guild queries
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callback(null, { guild_id: 'g1', rank: 'LEADER' });
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test', description: 'Only description' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });

            const result = await gm.updateGuildInfo('p1', {
                description: 'Only description'
            });

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('guild');
            expect(result).toHaveProperty('message', 'Guild information updated');
        });
    });

    describe('getPlayerGuildInfo lines', () => {
        test('getPlayerGuildInfo with full data', async () => {
            // Configure mockDb.get to handle getPlayerGuild query
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.player_id =')) {
                    callback(null, {
                        guild_id: 'g1',
                        player_id: 'p1',
                        rank: 'OFFICER',
                        joined_at: '2024-01-01',
                        guild_name: 'Test Guild',
                        guild_tag: 'TST',
                        description: 'A guild',
                        motd: 'Hello',
                        is_recruiting: true
                    });
                } else if (sql.includes('FROM guilds') && sql.includes('WHERE g.id =')) {
                    callback(null, {
                        id: 'g1',
                        name: 'Test Guild',
                        tag: 'TST',
                        description: 'A guild',
                        motd: 'Hello',
                        leader_id: 'p2',
                        created_at: '2024-01-01',
                        max_members: 100,
                        is_recruiting: true,
                        member_count: 10
                    });
                } else {
                    callback(null, null);
                }
            });
            // Configure mockDb.all to return guild members
            mockDb.all.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members') && sql.includes('gm.guild_id =')) {
                    callback(null, [
                        { player_id: 'p1', rank: 'OFFICER', joined_at: '2024-01-01' },
                        { player_id: 'p2', rank: 'LEADER', joined_at: '2024-01-01' }
                    ]);
                } else {
                    callback(null, []);
                }
            });

            const result = await gm.getPlayerGuildInfo('p1');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('guild');
            expect(result.guild).toHaveProperty('members');
            expect(result.guild).toHaveProperty('myRank', 'OFFICER');
            expect(result.guild.members).toHaveLength(2);
        });
    });
});
