/**
 * GuildManager Final Lines Coverage
 * Lines: 207-219, 249, 292, 303-315, 368-381
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');

describe('GuildManager Final Lines', () => {
    let mockDb, mockPlayerManager, gm;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            get: jest.fn(),
            all: jest.fn(),
            run: jest.fn(),
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildMembers: jest.fn(),
            removeGuildMember: jest.fn(),
            removeMember: jest.fn(),
            disbandGuild: jest.fn(),
            transferLeadership: jest.fn(),
            updateMemberRank: jest.fn(),
            updateGuildInfo: jest.fn(),
            addGuildMember: jest.fn(),
            createInvitation: jest.fn()
        };
        // Configure SQLite mocks
        mockDb.get.mockImplementation((sql, params, callback) => callback(null, null));
        mockDb.all.mockImplementation((sql, params, callback) => callback(null, []));
        mockDb.run.mockImplementation((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null));
        mockPlayerManager = {
            getPlayer: jest.fn(),
            updateGold: jest.fn(),
            getPlayerByUsername: jest.fn()
        };
        
        const db = new GuildDatabase(mockDb);
        gm = new GuildManager(db, mockPlayerManager);
        gm.emit = jest.fn();
        
        // Expose db for tests
        gm.testDb = db;
    });

    describe('leaveGuild lines 207-219', () => {
        test('leader cannot leave directly (lines 295-297)', async () => {
            gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('transfer leadership');
        });

        test('member leaving removes from cache (lines 302-306)', async () => {
            gm.testDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            gm.testDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test', tag: 'TST' });
            gm.testDb.removeMember = jest.fn().mockResolvedValue(true);

            // Set up online cache
            gm.onlineMembers.set('g1', new Set(['p1', 'p2']));
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(true);
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });
    });

    describe('disbandGuild', () => {
        test('disband guild returns disbanded flag', async () => {
            gm.testDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test', leaderId: 'p1' });
            gm.testDb.getGuildMembers = jest.fn().mockResolvedValue([{ player_id: 'p1', rank: 'LEADER' }]);
            gm.testDb.disbandGuild = jest.fn().mockResolvedValue(true);

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(true);
            expect(result.disbanded).toBe(true);
        });
    });

    describe('kickMember lines 249', () => {
        test('kickMember updates cache (line 249)', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });
            gm.testDb.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // kicker
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }); // target
            gm.testDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', leader_id: 'p1' });
            gm.testDb.removeMember = jest.fn().mockResolvedValue(true);

            // Set up online members cache
            gm.onlineMembers.set('g1', new Set(['p1', 'p2']));
            expect(gm.isPlayerOnline('g1', 'p2')).toBe(true);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(true);
            expect(gm.isPlayerOnline('g1', 'p2')).toBe(false);
        });
    });

    describe('promoteMember lines 292, 303-315', () => {
        test('promote to OFFICER (line 292)', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });
            gm.testDb.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // promoter
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }); // target
            gm.testDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test' });
            gm.testDb.updateMemberRank = jest.fn().mockResolvedValue(true);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(true);
            expect(result.message).toContain('OFFICER');
        });

        test('promote fails when target not in guild (lines 303-315)', async () => {
            gm.testDb.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // promoter
                .mockResolvedValueOnce(null); // target not in guild
            gm.testDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test' });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in your guild');
        });
    });

    describe('transferLeadership lines 368-381', () => {
        test('transfer succeeds (lines 368-381)', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p2', username: 'Player2' });
            gm.testDb.getPlayerGuild = jest.fn()
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' }) // current leader
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' }); // new leader
            gm.testDb.getGuildById = jest.fn().mockResolvedValue({ id: 'g1', name: 'Test' });
            gm.testDb.transferLeadership = jest.fn().mockResolvedValue(true);
            gm.testDb.updateMemberRank = jest.fn().mockResolvedValue(true);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(true);
            expect(result.message).toContain('transferred');
        });
    });
});
