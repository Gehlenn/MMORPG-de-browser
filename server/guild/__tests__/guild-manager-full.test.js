/**
 * GuildManager Full Coverage Tests
 */

const GuildManager = require('../GuildManager');
const GuildDatabase = require('../GuildDatabase');

describe('GuildManager Full Coverage', () => {
    let mockDb, mockPlayerManager, gm;

    beforeEach(() => {
        jest.resetAllMocks();
        
        // Track call counts for sequential mock returns
        let getPlayerGuildCallCount = 0;
        const getPlayerGuildResults = [];
        
        mockDb = {
            run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
            get: jest.fn((sql, params, callback) => {
                // getPlayerGuild: Check guild membership
                if (sql.includes('FROM guild_members gm') && sql.includes('JOIN guilds g') && sql.includes('gm.player_id =')) {
                    // Return sequential values if set, otherwise null
                    const result = getPlayerGuildResults[getPlayerGuildCallCount++] || null;
                    callback(null, result);
                }
                // getGuildByName: Check name uniqueness
                else if (sql.includes('FROM guilds') && sql.includes('LOWER(name)')) {
                    callback(null, null); // No conflict by default
                }
                // getGuildByTag: Check tag uniqueness
                else if (sql.includes('FROM guilds') && sql.includes('tag = UPPER')) {
                    callback(null, null); // No conflict by default
                }
                // getGuildById: Get guild details
                else if (sql.includes('FROM guilds g') && sql.includes('WHERE g.id =')) {
                    callback(null, { id: 'g1', name: 'Test Guild', tag: 'TST', leader_id: 'p1', member_count: 1 });
                }
                // respondToInvitation: Get invitation
                else if (sql.includes('FROM guild_invitations') && sql.includes('WHERE id =')) {
                    callback(null, { id: 'inv1', guild_id: 'g1', invitee_id: 'p1', inviter_id: 'p2', status: 'ACCEPTED' });
                }
                // respondToInvitation: Check if player already in guild
                else if (sql.includes('FROM guild_members') && sql.includes('WHERE player_id =') && !sql.includes('gm.')) {
                    callback(null, null); // Not in guild
                }
                // respondToInvitation: Get member count
                else if (sql.includes('COUNT(*)') && sql.includes('FROM guild_members')) {
                    callback(null, { count: 5 });
                }
                // respondToInvitation: Get max members
                else if (sql.includes('max_members FROM guilds')) {
                    callback(null, { max_members: 100 });
                }
                // browseGuilds: Count guilds
                else if (sql.includes('COUNT(*) as count FROM guilds') && !sql.includes('guild_members')) {
                    callback(null, { count: 25 });
                }
                else {
                    callback(null, null);
                }
            }),
            all: jest.fn((sql, params, callback) => {
                // getGuildMembers: Get members of a guild
                if (sql.includes('FROM guild_members') && sql.includes('gm.guild_id =')) {
                    callback(null, [
                        { player_id: 'p1', rank: 'LEADER', joined_at: '2024-01-01' }
                    ]);
                }
                else {
                    callback(null, []);
                }
            }),
            _setPlayerGuildResults: (results) => { getPlayerGuildResults.length = 0; results.forEach(r => getPlayerGuildResults.push(r)); getPlayerGuildCallCount = 0; },
            // GuildDatabase methods
            createGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildByName: jest.fn(),
            getGuildByTag: jest.fn(),
            getPlayerGuild: jest.fn(() => {
                const result = getPlayerGuildResults[getPlayerGuildCallCount++] || null;
                return Promise.resolve(result);
            }),
            getGuildMembers: jest.fn(),
            disbandGuild: jest.fn(),
            removeMember: jest.fn(),
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
        // Mock respondToInvitation for easier testing
        db.respondToInvitation = jest.fn();
        gm = new GuildManager(db, mockPlayerManager);
        gm.on = jest.fn();
        gm.emit = jest.fn();
    });

    describe('createGuild - All Validation Paths', () => {
        test('createGuild fails when player not found', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not found');
        });

        test('createGuild fails when level too low', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 5, gold: 15000 });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('level 10');
        });

        test('createGuild fails when insufficient gold', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 5000 });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('10000 gold');
        });

        test('createGuild fails when already in guild', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'MEMBER' }]);

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Already in a guild');
        });

        test('createGuild fails when name already exists', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb._setPlayerGuildResults([null]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('LOWER(name)')) {
                    callback(null, { id: 'g2', name: 'Test' }); // Name exists
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Guild name already exists');
        });

        test('createGuild fails when tag already exists', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb._setPlayerGuildResults([null]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('LOWER(name)')) {
                    callback(null, null); // Name ok
                } else if (sql.includes('FROM guilds') && sql.includes('tag = UPPER')) {
                    callback(null, { id: 'g2', tag: 'TST' }); // Tag exists
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Guild tag already exists');
        });

        test('createGuild handles gold update failure', async () => {
            // Note: GuildManager does not verify updateGold return value, it just calls it
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb._setPlayerGuildResults([null]);
            mockPlayerManager.updateGold.mockResolvedValue(false);
            mockDb.createGuild.mockResolvedValue({ id: 'g1', name: 'Test', tag: 'TST' });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            // Guild is created even if gold update returns false
            expect(result.success).toBe(true);
        });

        test('createGuild handles createGuild error', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb._setPlayerGuildResults([null]);
            mockPlayerManager.updateGold.mockResolvedValue(true);
            // Mock the db.createGuild method directly on the GuildDatabase instance
            const db = gm.db;
            db.createGuild = jest.fn().mockRejectedValue(new Error('Create Error'));

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
        });

        test('createGuild succeeds and refunds on member add failure', async () => {
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
            mockDb.addGuildMember.mockRejectedValue(new Error('Add Error'));

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(mockPlayerManager.updateGold).toHaveBeenCalledWith('p1', 10000); // Refund
            expect(result.success).toBe(false);
        });
    });

    describe('disbandGuild - All Paths', () => {
        test('disbandGuild fails when player not in guild', async () => {
            mockDb._setPlayerGuildResults([null]);

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('disbandGuild fails when guild not found', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(null, null); // Guild not found
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('disbandGuild fails when not leader', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'OFFICER' }]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(null, { id: 'g1', leader_id: 'p2', name: 'Test' }); // Different leader
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader');
        });

        test('disbandGuild handles getGuildMembers error', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(null, { id: 'g1', leader_id: 'p1', name: 'Test' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.all.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members')) {
                    callback(new Error('DB Error'), null);
                } else {
                    callback(null, []);
                }
            });

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
        });

        test('disbandGuild handles disbandGuild error', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(null, { id: 'g1', leader_id: 'p1', name: 'Test' });
                } else {
                    callback(null, null);
                }
            });
            mockDb.all.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_members')) {
                    callback(null, [{ player_id: 'p1' }]);
                } else {
                    callback(null, []);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                if (sql.includes('DELETE FROM guilds')) {
                    callback(new Error('Delete Error'));
                } else {
                    callback.call({ lastID: 1, changes: 1 }, null);
                }
            });

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
        });
    });

    describe('leaveGuild - All Paths', () => {
        test('leaveGuild fails when player not found', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'MEMBER' }]);
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
        });

        test('leaveGuild fails when leader tries to leave', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }]);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('transfer leadership');
        });

        test('leaveGuild handles getGuildById error', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'MEMBER' }]);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(new Error('DB Error'), null);
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
        });

        test('leaveGuild handles removeGuildMember error', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'MEMBER' }]);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(null, { id: 'g1', name: 'Test', member_count: 5 });
                } else {
                    callback(null, null);
                }
            });
            mockDb.run.mockImplementation((sql, params, callback) => {
                if (sql.includes('DELETE FROM guild_members')) {
                    callback(new Error('Remove Error'));
                } else {
                    callback.call({ lastID: 1, changes: 1 }, null);
                }
            });

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
        });
    });

    describe('kickMember - All Paths', () => {
        test('kickMember fails when kicker not found', async () => {
            mockDb._setPlayerGuildResults([null]);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('kickMember fails when kicker not officer+', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'MEMBER' }]);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can kick');
        });

        test('kickMember fails when target not found', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('kickMember fails when different guilds', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' });

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not in your guild');
        });

        test('kickMember fails when officer tries to kick officer', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' });

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot kick other officers');
        });

        test('kickMember fails when target is leader', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' });

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('leader');
        });

        test('kickMember handles getGuildById error', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getGuildById.mockRejectedValue(new Error('DB Error'));

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
        });
    });

    describe('promoteMember - All Paths', () => {
        test('promoteMember fails when promoter not in guild', async () => {
            mockDb._setPlayerGuildResults([null]);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('promoteMember fails when not leader', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'OFFICER' }]);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader');
        });

        test('promoteMember fails when target not in guild', async () => {
            mockDb._setPlayerGuildResults([
                { guild_id: 'g1', rank: 'LEADER' },
                null
            ]);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not in your guild');
        });

        test('promoteMember fails when invalid rank', async () => {
            mockDb._setPlayerGuildResults([
                { guild_id: 'g1', rank: 'LEADER' },
                { guild_id: 'g1', rank: 'MEMBER' }
            ]);

            const result = await gm.promoteMember('p1', 'p2', 'INVALID');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid rank');
        });

        test('promoteMember fails when target already has rank', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }, { guild_id: 'g1', rank: 'OFFICER' }]);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already an OFFICER');
        });

        test('promoteMember handles getGuildById error', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }, { guild_id: 'g1', rank: 'MEMBER' }]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(new Error('DB Error'), null);
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
        });
    });

    describe('transferLeadership - All Paths', () => {
        test('transferLeadership fails when transferrer not in guild', async () => {
            mockDb._setPlayerGuildResults([null]);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('transferLeadership fails when not leader', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'OFFICER' }]);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader');
        });

        test('transferLeadership fails when target not in guild', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }, null]);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in the guild');
        });

        test('transferLeadership fails when different guilds', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }, { guild_id: 'g2', rank: 'MEMBER' }]);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in the guild');
        });

        test('transferLeadership handles getGuildById error', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }, { guild_id: 'g1', rank: 'MEMBER' }]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(new Error('DB Error'), null);
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
        });
    });

    describe('updateGuildInfo - All Paths', () => {
        test('updateGuildInfo fails when player not in guild', async () => {
            mockDb._setPlayerGuildResults([null]);

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('updateGuildInfo fails when member rank', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'MEMBER' }]);

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can update guild info');
        });

        test('updateGuildInfo handles getGuildById error', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'OFFICER' }]);
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guilds') && sql.includes('WHERE id =')) {
                    callback(new Error('DB Error'), null);
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });

            expect(result.success).toBe(false);
        });
    });

    describe('invitePlayer - All Paths', () => {
        test('invitePlayer fails when player not found', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }]);
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await gm.invitePlayer('p1', 'g1', 'Unknown');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('invitePlayer fails when not in guild', async () => {
            mockDb._setPlayerGuildResults([null]);

            const result = await gm.invitePlayer('p1', 'g1', 'Target');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });

        test('invitePlayer fails when not officer+', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'MEMBER' }]);

            const result = await gm.invitePlayer('p1', 'g1', 'Target');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can invite');
        });

        test('invitePlayer fails when target not found', async () => {
            mockDb._setPlayerGuildResults([{ guild_id: 'g1', rank: 'LEADER' }]);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Inviter' });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue(null);

            const result = await gm.invitePlayer('p1', 'g1', 'Nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('invitePlayer fails when target already in guild', async () => {
            // First call for inviter (p1), second for target check (p2)
            mockDb._setPlayerGuildResults([
                { guild_id: 'g1', rank: 'LEADER' },  // inviter p1
                { guild_id: 'g2', rank: 'MEMBER' }  // target p2 (already in guild g2)
            ]);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Inviter' });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });

            const result = await gm.invitePlayer('p1', 'g1', 'Target');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Already in a guild');
        });
    });

    describe('respondToInvitation - All Paths', () => {
        test('respondToInvitation fails when invitation not found', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('FROM guild_invitations') && sql.includes('WHERE id =')) {
                    callback(null, null); // Invitation not found
                } else {
                    callback(null, null);
                }
            });

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('respondToInvitation fails when not for player', async () => {
            db.respondToInvitation.mockRejectedValue(new Error('This invitation is not for you'));

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not for you');
        });

        test('respondToInvitation fails when expired', async () => {
            db.respondToInvitation.mockRejectedValue(new Error('Invitation has expired'));

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('expired');
        });

        test('respondToInvitation fails when already in guild', async () => {
            db.respondToInvitation.mockRejectedValue(new Error('Player already in a guild'));

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Already in a guild');
        });

        test('respondToInvitation fails when guild full', async () => {
            db.respondToInvitation.mockRejectedValue(new Error('Guild is full'));

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('full');
        });
    });

    describe('getPlayerGuildInfo - All Paths', () => {
        test('getPlayerGuildInfo handles getGuildById error', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getGuildById.mockRejectedValue(new Error('DB Error'));

            const result = await gm.getPlayerGuildInfo('p1');

            expect(result.success).toBe(false);
        });

        test('getPlayerGuildInfo handles getGuildMembers error', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.getGuildMembers.mockRejectedValue(new Error('DB Error'));

            const result = await gm.getPlayerGuildInfo('p1');

            expect(result.success).toBe(false);
        });
    });

    describe('getPlayerInvitations - All Paths', () => {
        test('getPlayerInvitations handles error', async () => {
            mockDb.getPlayerInvitations.mockRejectedValue(new Error('DB Error'));

            const result = await gm.getPlayerInvitations('p1');

            expect(result.success).toBe(false);
        });
    });

    describe('browseGuilds - All Paths', () => {
        test('browseGuilds handles countGuilds error', async () => {
            mockDb.countGuilds.mockRejectedValue(new Error('DB Error'));

            const result = await gm.browseGuilds({});

            expect(result.success).toBe(false);
        });

        test('browseGuilds handles browseGuilds error', async () => {
            mockDb.countGuilds.mockResolvedValue(10);
            mockDb.browseGuilds.mockRejectedValue(new Error('DB Error'));

            const result = await gm.browseGuilds({});

            expect(result.success).toBe(false);
        });
    });

    describe('handlePlayerOnline/Offline', () => {
        test('handlePlayerOnline handles error', async () => {
            mockDb.getPlayerGuild.mockRejectedValue(new Error('DB Error'));

            await expect(gm.handlePlayerOnline('p1')).rejects.toThrow();
        });

        test('handlePlayerOffline handles error', async () => {
            mockDb.getPlayerGuild.mockRejectedValue(new Error('DB Error'));

            await expect(gm.handlePlayerOffline('p1')).rejects.toThrow();
        });
    });
});
