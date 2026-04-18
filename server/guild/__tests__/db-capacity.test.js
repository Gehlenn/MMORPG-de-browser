/**
 * Test for GuildDatabase respondToInvitation guild capacity check (lines 269-284)
 */

const GuildDatabase = require('../GuildDatabase');

describe('GuildDatabase respondToInvitation capacity check (lines 269-284)', () => {
    let db;

    beforeEach(() => {
        db = new GuildDatabase(':memory:');
        
        // Mock the database methods
        jest.spyOn(db, 'run').mockResolvedValue({ changes: 1 });
        jest.spyOn(db, 'get').mockResolvedValue(null);
        jest.spyOn(db, 'addGuildMember').mockResolvedValue({ id: 'member1' });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('respondToInvitation checks guild capacity when accepting (lines 269-284)', async () => {
        // Mock invitation found
        db.get.mockImplementation((sql, params) => {
            if (sql.includes('guild_invitations')) {
                return { id: 'inv1', guild_id: 'g1', invitee_id: 'p1', status: 'PENDING' };
            }
            if (sql.includes('COUNT(*)') && sql.includes('guild_members')) {
                return { count: 50 }; // Current members
            }
            if (sql.includes('max_members')) {
                return { max_members: 100 }; // Max capacity
            }
            if (sql.includes('guild_members WHERE player_id')) {
                return null; // Player not in any guild
            }
            return null;
        });

        const result = await db.respondToInvitation('inv1', 'ACCEPTED');

        expect(result).toBeDefined();
        expect(db.get).toHaveBeenCalledWith(
            expect.stringContaining('COUNT(*)'),
            ['g1']
        );
        expect(db.get).toHaveBeenCalledWith(
            expect.stringContaining('max_members'),
            ['g1']
        );
        expect(db.addGuildMember).toHaveBeenCalledWith('g1', 'p1', 'INITIATE');
    });

    test('respondToInvitation throws when guild is full (line 280)', async () => {
        // Mock invitation found, but guild is at capacity
        db.get.mockImplementation((sql, params) => {
            if (sql.includes('guild_invitations')) {
                return { id: 'inv1', guild_id: 'g1', invitee_id: 'p1', status: 'PENDING' };
            }
            if (sql.includes('COUNT(*)') && sql.includes('guild_members')) {
                return { count: 100 }; // At max capacity
            }
            if (sql.includes('max_members')) {
                return { max_members: 100 }; // Max capacity
            }
            if (sql.includes('guild_members WHERE player_id')) {
                return null;
            }
            return null;
        });

        await expect(db.respondToInvitation('inv1', 'ACCEPTED'))
            .rejects.toThrow('Guild is full');
    });
});
