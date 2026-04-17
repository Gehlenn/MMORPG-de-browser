/**
 * GuildManager Remaining Lines Coverage
 */

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
        
        gm = new GuildManager(mockDb, mockPlayerManager);
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
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', leader_id: 'p1', name: 'Test Guild' });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'p1', rank: 'LEADER' },
                { player_id: 'p2', rank: 'OFFICER' },
                { player_id: 'p3', rank: 'MEMBER' }
            ]);
            mockDb.disbandGuild.mockResolvedValue(true);

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:disbanded', expect.objectContaining({
                memberIds: ['p1', 'p2', 'p3']
            }));
        });
    });

    describe('leaveGuild lines 249', () => {
        test('leaveGuild handles cache removal', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test', member_count: 5 });
            mockDb.removeGuildMember.mockResolvedValue(true);

            // Set player online first
            gm.setPlayerOnline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(true);
            // Player should be removed from online cache
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });
    });

    describe('kickMember lines 292', () => {
        test('kickMember removes from cache', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.removeGuildMember.mockResolvedValue(true);

            // Set target online
            gm.setPlayerOnline('g1', 'p2');
            expect(gm.isPlayerOnline('g1', 'p2')).toBe(true);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(true);
            expect(gm.isPlayerOnline('g1', 'p2')).toBe(false);
            expect(gm.emit).toHaveBeenCalledWith('guild:member_kicked', expect.objectContaining({
                targetId: 'p2'
            }));
        });
    });

    describe('promoteMember lines 303-315', () => {
        test('promoteMember with detailed result', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test Guild' });
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('promoterId', 'p1');
            expect(result).toHaveProperty('targetId', 'p2');
            expect(result).toHaveProperty('newRank', 'OFFICER');
            expect(result).toHaveProperty('guildName', 'Test Guild');
            expect(gm.emit).toHaveBeenCalledWith('guild:member_promoted', expect.objectContaining({
                newRank: 'OFFICER'
            }));
        });
    });

    describe('demoteMember lines 368-381', () => {
        test('demoteMember with detailed result', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test Guild' });
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.demoteMember('p1', 'p2', 'MEMBER');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('demoterId', 'p1');
            expect(result).toHaveProperty('targetId', 'p2');
            expect(result).toHaveProperty('newRank', 'MEMBER');
            expect(result).toHaveProperty('guildName', 'Test Guild');
            expect(gm.emit).toHaveBeenCalledWith('guild:member_demoted', expect.objectContaining({
                newRank: 'MEMBER'
            }));
        });
    });

    describe('transferLeadership line 613', () => {
        test('transferLeadership updates ranks', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.transferLeadership.mockResolvedValue({ success: true });

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(true);
            expect(mockDb.transferLeadership).toHaveBeenCalledWith('g1', 'p1', 'p2');
        });
    });

    describe('updateGuildInfo lines 622, 635-654', () => {
        test('updateGuildInfo updates multiple fields', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.updateGuildInfo.mockResolvedValue(true);

            const result = await gm.updateGuildInfo('p1', {
                description: 'New description',
                motd: 'New MOTD',
                isRecruiting: true
            });

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('updatedFields');
            expect(result.updatedFields).toContain('description');
            expect(result.updatedFields).toContain('motd');
            expect(result.updatedFields).toContain('isRecruiting');
        });

        test('updateGuildInfo partial update', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.updateGuildInfo.mockResolvedValue(true);

            const result = await gm.updateGuildInfo('p1', {
                description: 'Only description'
            });

            expect(result.success).toBe(true);
            expect(result.updatedFields).toEqual(['description']);
        });
    });

    describe('getPlayerGuildInfo lines', () => {
        test('getPlayerGuildInfo with full data', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'g1',
                player_id: 'p1',
                rank: 'OFFICER',
                joined_at: '2024-01-01'
            });
            mockDb.getGuildById.mockResolvedValue({
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
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'p1', rank: 'OFFICER', joined_at: '2024-01-01' },
                { player_id: 'p2', rank: 'LEADER', joined_at: '2024-01-01' }
            ]);

            const result = await gm.getPlayerGuildInfo('p1');

            expect(result.success).toBe(true);
            expect(result).toHaveProperty('guild');
            expect(result).toHaveProperty('members');
            expect(result).toHaveProperty('myRank', 'OFFICER');
            expect(result).toHaveProperty('joinedAt', '2024-01-01');
        });
    });
});
