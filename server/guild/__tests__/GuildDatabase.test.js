/**
 * GuildDatabase.test.js - SQLite Version
 * Unit tests for GuildDatabase
 */

const GuildDatabase = require('../GuildDatabase');

describe('GuildDatabase', () => {
    let guildDb;
    let mockDb;

    beforeEach(() => {
        // Mock SQLite database with proper callback signature
        mockDb = {
            run: jest.fn(function(sql, params, callback) {
                // Simulate successful execution
                if (callback) callback.call(this, null);
            }),
            get: jest.fn(function(sql, params, callback) {
                if (callback) callback(null, null);
            }),
            all: jest.fn(function(sql, params, callback) {
                if (callback) callback(null, []);
            }),
            serialize: jest.fn((callback) => callback())
        };
        guildDb = new GuildDatabase(mockDb);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createGuild', () => {
        test('should create guild with correct data', async () => {
            const mockCreatedGuild = {
                id: 'guild_test123',
                name: 'Test Guild',
                tag: 'TEST',
                description: 'A test guild',
                leader_id: 'player123',
                member_count: 1
            };

            // Mock the getGuildById call that happens at the end of createGuild
            mockDb.get.mockImplementation(function(sql, params, callback) {
                if (sql.includes('SELECT') && callback) {
                    callback(null, mockCreatedGuild);
                }
            });

            const result = await guildDb.createGuild({
                name: 'Test Guild',
                tag: 'TEST',
                description: 'A test guild',
                leaderId: 'player123'
            });

            expect(mockDb.run).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe('getGuildById', () => {
        test('should return formatted guild', async () => {
            const mockGuild = {
                id: 'guild_test123',
                name: 'Test Guild',
                tag: 'TEST',
                description: 'Test description',
                leader_id: 'player123',
                member_count: 5,
                created_at: new Date().toISOString()
            };

            mockDb.get.mockImplementation(function(sql, params, callback) {
                if (callback) callback(null, mockGuild);
            });

            const result = await guildDb.getGuildById('guild_test123');

            expect(result).toHaveProperty('id', 'guild_test123');
            expect(result).toHaveProperty('name', 'Test Guild');
            expect(result).toHaveProperty('memberCount', 5);
        });

        test('should return null for non-existent guild', async () => {
            mockDb.get.mockImplementation(function(sql, params, callback) {
                if (callback) callback(null, null);
            });

            const result = await guildDb.getGuildById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('getGuildByName', () => {
        test('should return guild by name', async () => {
            const mockGuild = {
                id: 'guild_test123',
                name: 'Test Guild',
                tag: 'TEST',
                description: 'Test',
                leader_id: 'player123'
            };

            mockDb.get.mockImplementation(function(sql, params, callback) {
                if (callback) callback(null, mockGuild);
            });

            const result = await guildDb.getGuildByName('Test Guild');

            expect(result).toHaveProperty('name', 'Test Guild');
        });
    });

    describe('disbandGuild', () => {
        test('should return true when guild deleted', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                if (callback) callback.call({ changes: 1 }, null);
            });

            const result = await guildDb.disbandGuild('guild_test123');

            expect(result).toBe(true);
        });

        test('should return false when no guild deleted', async () => {
            mockDb.run.mockImplementation(function(sql, params, callback) {
                if (callback) callback.call({ changes: 0 }, null);
            });

            const result = await guildDb.disbandGuild('nonexistent');

            expect(result).toBe(false);
        });
    });

    describe('getPlayerGuild', () => {
        test('should return player guild membership', async () => {
            const mockMembership = {
                guild_id: 'guild_test123',
                player_id: 'player123',
                rank: 'LEADER',
                guild_name: 'Test Guild',
                guild_tag: 'TEST'
            };

            mockDb.get.mockImplementation(function(sql, params, callback) {
                if (callback) callback(null, mockMembership);
            });

            const result = await guildDb.getPlayerGuild('player123');

            expect(result).toHaveProperty('guild_id', 'guild_test123');
            expect(result).toHaveProperty('rank', 'LEADER');
        });
    });

    describe('getGuildMembers', () => {
        test('should return array of members', async () => {
            const mockMembers = [
                { player_id: 'player1', rank: 'LEADER', username: 'Leader' },
                { player_id: 'player2', rank: 'MEMBER', username: 'Member' }
            ];

            mockDb.all.mockImplementation(function(sql, params, callback) {
                if (callback) callback(null, mockMembers);
            });

            const result = await guildDb.getGuildMembers('guild_test123');

            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
        });
    });
});
