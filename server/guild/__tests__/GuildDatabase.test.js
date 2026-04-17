/**
 * GuildDatabase.test.js
 * Unit tests for GuildDatabase
 */

const GuildDatabase = require('../GuildDatabase');

// Mock database
const mockDb = {
    query: jest.fn(),
    run: jest.fn()
};

describe('GuildDatabase', () => {
    let guildDb;

    beforeEach(() => {
        guildDb = new GuildDatabase(mockDb);
        jest.clearAllMocks();
    });

    describe('createGuild', () => {
        test('should create guild successfully', async () => {
            const guildData = {
                name: 'Test Guild',
                tag: 'TEST',
                leader_id: 'player123',
                description: 'A test guild'
            };

            mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1, ...guildData, created_at: new Date() }] });

            const result = await guildDb.createGuild(guildData);

            expect(result).toHaveProperty('id');
            expect(result.name).toBe('Test Guild');
            expect(mockDb.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO guilds'),
                expect.arrayContaining(['Test Guild', 'TEST', 'player123', 'A test guild'])
            );
        });

        test('should throw error on duplicate name', async () => {
            mockDb.query.mockRejectedValueOnce(new Error('unique constraint violation'));

            await expect(guildDb.createGuild({
                name: 'Existing Guild',
                tag: 'EXST',
                leader_id: 'player123'
            })).rejects.toThrow();
        });
    });

    describe('getGuildById', () => {
        test('should return guild with member count', async () => {
            const mockGuild = {
                id: 1,
                name: 'Test Guild',
                tag: 'TEST',
                member_count: '5'
            };

            mockDb.query.mockResolvedValueOnce({ rows: [mockGuild] });

            const result = await guildDb.getGuildById(1);

            expect(result).toEqual(expect.objectContaining({
                id: 1,
                name: 'Test Guild',
                member_count: 5
            }));
        });

        test('should return null for non-existent guild', async () => {
            mockDb.query.mockResolvedValueOnce({ rows: [] });

            const result = await guildDb.getGuildById(999);

            expect(result).toBeNull();
        });
    });

    describe('addMember', () => {
        test('should add member to guild', async () => {
            mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const result = await guildDb.addMember(1, 'player123', 'MEMBER');

            expect(result).toHaveProperty('id');
            expect(mockDb.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO guild_members'),
                expect.arrayContaining([1, 'player123', 'MEMBER'])
            );
        });

        test('should throw error when guild is full', async () => {
            mockDb.query.mockRejectedValueOnce(new Error('guild at maximum capacity'));

            await expect(guildDb.addMember(1, 'player123', 'MEMBER'))
                .rejects.toThrow();
        });
    });

    describe('createInvitation', () => {
        test('should create invitation with 24h expiration', async () => {
            mockDb.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const result = await guildDb.createInvitation(1, 'inviter123', 'invitee456');

            expect(result).toHaveProperty('id');
            
            // Verify expires_at is set to ~24 hours from now
            const callArgs = mockDb.query.mock.calls[0][1];
            expect(callArgs).toHaveLength(4);
        });
    });

    describe('getPendingInvitations', () => {
        test('should return only non-expired invitations', async () => {
            const mockInvitations = [
                { id: 1, guild_name: 'Guild 1', tag: 'G1', inviter_name: 'Player1' },
                { id: 2, guild_name: 'Guild 2', tag: 'G2', inviter_name: 'Player2' }
            ];

            mockDb.query.mockResolvedValueOnce({ rows: mockInvitations });

            const result = await guildDb.getPendingInvitations('player123');

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('guild_name');
        });
    });

    describe('updateMemberRank', () => {
        test('should update member rank', async () => {
            mockDb.run.mockResolvedValueOnce({ rowCount: 1 });

            await guildDb.updateMemberRank(1, 'player123', 'OFFICER');

            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE guild_members'),
                expect.arrayContaining(['OFFICER', 1, 'player123'])
            );
        });
    });

    describe('removeMember', () => {
        test('should remove member from guild', async () => {
            mockDb.run.mockResolvedValueOnce({ rowCount: 1 });

            await guildDb.removeMember(1, 'player123');

            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM guild_members'),
                expect.arrayContaining([1, 'player123'])
            );
        });
    });

    describe('disbandGuild', () => {
        test('should disband guild and remove all members', async () => {
            mockDb.run.mockResolvedValueOnce({ rowCount: 1 });

            await guildDb.disbandGuild(1);

            expect(mockDb.run).toHaveBeenCalledTimes(3); // invitations, members, guild
        });
    });

    describe('cleanupExpiredInvitations', () => {
        test('should delete expired invitations', async () => {
            mockDb.run.mockResolvedValueOnce({ rowCount: 5 });

            const result = await guildDb.cleanupExpiredInvitations();

            expect(result).toBe(5);
            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM guild_invitations'),
                expect.any(Array)
            );
        });
    });
});
