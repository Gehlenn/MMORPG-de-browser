/**
 * Deep Integration Tests - Execute Real Code
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');

describe('Guild Deep Tests', () => {
    let mockDb;
    let mockPlayerManager;
    let guildDb;
    let guildManager;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock SQLite that returns promises
        mockDb = {
            run: jest.fn((sql, params, callback) => {
                const context = { lastID: 1, changes: 1 };
                callback.call(context, null);
            }),
            get: jest.fn((sql, params, callback) => {
                callback(null, null);
            }),
            all: jest.fn((sql, params, callback) => {
                callback(null, []);
            })
        };

        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', level: 15, gold: 15000 }),
            updateGold: jest.fn().mockResolvedValue(true),
            sendToPlayer: jest.fn()
        };

        guildDb = new GuildDatabase(mockDb);
        guildManager = new GuildManager(guildDb, mockPlayerManager);
    });

    describe('GuildDatabase.run', () => {
        test('resolves with lastID and changes', async () => {
            const result = await guildDb.run('INSERT INTO test VALUES (?)', [1]);
            expect(result).toHaveProperty('id', 1);
            expect(result).toHaveProperty('changes', 1);
        });

        test('rejects on error', async () => {
            mockDb.run = jest.fn((sql, params, callback) => {
                callback(new Error('SQL Error'));
            });
            
            await expect(guildDb.run('INSERT', [])).rejects.toThrow('SQL Error');
        });
    });

    describe('GuildDatabase.get', () => {
        test('resolves with row', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(null, { id: 'g1', name: 'Test' });
            });
            
            const result = await guildDb.get('SELECT * FROM guilds', []);
            expect(result).toEqual({ id: 'g1', name: 'Test' });
        });

        test('resolves with null', async () => {
            const result = await guildDb.get('SELECT * FROM guilds', []);
            expect(result).toBeNull();
        });

        test('rejects on error', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(new Error('Get Error'));
            });
            
            await expect(guildDb.get('SELECT', [])).rejects.toThrow('Get Error');
        });
    });

    describe('GuildDatabase.all', () => {
        test('resolves with array', async () => {
            mockDb.all = jest.fn((sql, params, callback) => {
                callback(null, [{ id: 'g1' }, { id: 'g2' }]);
            });
            
            const result = await guildDb.all('SELECT * FROM guilds', []);
            expect(result).toHaveLength(2);
        });

        test('rejects on error', async () => {
            mockDb.all = jest.fn((sql, params, callback) => {
                callback(new Error('All Error'));
            });
            
            await expect(guildDb.all('SELECT', [])).rejects.toThrow('All Error');
        });
    });

    describe('GuildDatabase.createGuild', () => {
        test('calls run twice and returns guild', async () => {
            mockDb.run = jest.fn((sql, params, callback) => {
                callback.call({ lastID: 1 }, null);
            });
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(null, { id: 'g1', name: 'Test', tag: 'TST', member_count: 1 });
            });
            
            const result = await guildDb.createGuild({
                name: 'Test',
                tag: 'TST',
                description: 'Desc',
                leaderId: 'p1'
            });
            
            expect(mockDb.run).toHaveBeenCalledTimes(2);
            expect(result).toHaveProperty('id', 'g1');
        });
    });

    describe('GuildDatabase.getGuildById', () => {
        test('returns formatted guild', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(null, {
                    id: 'g1',
                    name: 'Test',
                    tag: 'TST',
                    leader_id: 'p1',
                    member_count: 5,
                    is_recruiting: 1,
                    max_members: 100
                });
            });
            
            const result = await guildDb.getGuildById('g1');
            
            expect(result).toHaveProperty('id', 'g1');
            expect(result).toHaveProperty('leaderId', 'p1');
            expect(result).toHaveProperty('memberCount', 5);
            expect(result).toHaveProperty('isRecruiting', true);
            expect(result).toHaveProperty('maxMembers', 100);
        });

        test('returns null when not found', async () => {
            const result = await guildDb.getGuildById('none');
            expect(result).toBeNull();
        });
    });

    describe('GuildDatabase.formatGuild', () => {
        test('formats all fields correctly', () => {
            const raw = {
                id: 'g1',
                name: 'Test Guild',
                tag: 'TST',
                description: 'A test',
                motd: 'Welcome!',
                leader_id: 'p1',
                created_at: '2024-01-01',
                max_members: 100,
                is_recruiting: 1,
                member_count: 10
            };
            
            const result = guildDb.formatGuild(raw);
            
            expect(result).toEqual({
                id: 'g1',
                name: 'Test Guild',
                tag: 'TST',
                description: 'A test',
                motd: 'Welcome!',
                leaderId: 'p1',
                createdAt: '2024-01-01',
                maxMembers: 100,
                isRecruiting: true,
                memberCount: 10
            });
        });

        test('handles null values', () => {
            const raw = {
                id: 'g1',
                name: 'Test',
                tag: 'TST',
                is_recruiting: 0,
                member_count: null
            };
            
            const result = guildDb.formatGuild(raw);
            
            expect(result.isRecruiting).toBe(false);
            expect(result.memberCount).toBe(0);
        });
    });

    describe('GuildDatabase.disbandGuild', () => {
        test('returns changes count', async () => {
            mockDb.run = jest.fn((sql, params, callback) => {
                callback.call({ changes: 1 }, null);
            });
            
            const result = await guildDb.disbandGuild('g1');
            
            expect(result).toBeDefined();
        });
    });

    describe('GuildDatabase.browseGuilds', () => {
        test('returns paginated results', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                callback(null, { count: 25 });
            });
            mockDb.all = jest.fn((sql, params, callback) => {
                callback(null, [{ id: 'g1' }, { id: 'g2' }]);
            });
            
            const result = await guildDb.browseGuilds({ page: 1, limit: 10 });
            
            expect(result).toHaveProperty('guilds');
            expect(result).toHaveProperty('total', 25);
            expect(result).toHaveProperty('page', 1);
            expect(result).toHaveProperty('totalPages', 3);
        });
    });

    describe('GuildManager.createGuild', () => {
        test('fails when player not found', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue(null);
            
            const result = await guildManager.createGuild('p1', { name: 'T', tag: 'TST' });
            
            expect(result.success).toBe(false);
        });

        test('fails when level too low', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 5, gold: 20000 });
            
            const result = await guildManager.createGuild('p1', { name: 'T', tag: 'TST' });
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('level');
        });

        test('fails when insufficient gold', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 5000 });
            
            const result = await guildManager.createGuild('p1', { name: 'T', tag: 'TST' });
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('gold');
        });

        test('fails when already in guild', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.get = jest.fn((sql, params, callback) => {
                if (sql.includes('guild_members')) {
                    callback(null, { guild_id: 'existing' });
                } else {
                    callback(null, null);
                }
            });
            
            const result = await guildManager.createGuild('p1', { name: 'T', tag: 'TST' });
            
            expect(result.success).toBe(false);
        });

        test('fails when name exists', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            let callCount = 0;
            mockDb.get = jest.fn((sql, params, callback) => {
                callCount++;
                if (callCount === 1) callback(null, null); // getPlayerGuild
                else if (callCount === 2) callback(null, { id: 'existing' }); // getGuildByName
                else callback(null, null);
            });
            
            const result = await guildManager.createGuild('p1', { name: 'T', tag: 'TST' });
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('name');
        });

        test('fails when tag exists', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            let callCount = 0;
            mockDb.get = jest.fn((sql, params, callback) => {
                callCount++;
                if (sql.includes('guild_members')) callback(null, null); // getPlayerGuild
                else if (sql.includes('guilds WHERE name')) callback(null, null); // getGuildByName
                else if (sql.includes('guilds WHERE tag')) callback(null, { id: 'existing' }); // getGuildByTag
                else callback(null, null);
            });
            
            const result = await guildManager.createGuild('p1', { name: 'ValidName', tag: 'TST' });
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('tag');
        });

        test('fails when name too short', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.get = jest.fn((sql, params, callback) => {
                if (sql.includes('guild_members')) callback(null, null); // getPlayerGuild
                else callback(null, null);
            });
            
            const result = await guildManager.createGuild('p1', { name: 'A', tag: 'TST' });
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('2-24');
        });

        test('fails when tag invalid', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.get = jest.fn((sql, params, callback) => callback(null, null));
            
            const result = await guildManager.createGuild('p1', { name: 'Valid', tag: 'TOOLONG' });
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('tag');
        });
    });

    describe('GuildManager.online members', () => {
        beforeEach(() => {
            // Mock getPlayerGuild to return a guild for online member tests
            guildDb.getPlayerGuild = jest.fn().mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
        });

        test('setPlayerOnline adds member', async () => {
            await guildManager.setPlayerOnline('g1', 'p1');
            expect(guildManager.isPlayerOnline('g1', 'p1')).toBe(true);
        });

        test('setPlayerOffline removes member', async () => {
            await guildManager.setPlayerOnline('g1', 'p1');
            await guildManager.setPlayerOffline('g1', 'p1');
            expect(guildManager.isPlayerOnline('g1', 'p1')).toBe(false);
        });

        test('getOnlineMembers returns Set', async () => {
            await guildManager.setPlayerOnline('g1', 'p1');
            await guildManager.setPlayerOnline('g1', 'p2');
            const members = guildManager.getOnlineMembers('g1');
            expect(members.has('p1')).toBe(true);
            expect(members.has('p2')).toBe(true);
        });

        test('handles non-existent guild', () => {
            expect(guildManager.isPlayerOnline('nonexistent', 'p1')).toBe(false);
            expect(guildManager.getOnlineMembers('nonexistent')).toEqual(new Set());
        });
    });

    describe('GuildManager.getPlayerGuildInfo', () => {
        test('returns guild info when in guild', async () => {
            mockDb.get = jest.fn((sql, params, callback) => {
                if (sql.includes('guild_members')) {
                    callback(null, { guild_id: 'g1', rank: 'LEADER' });
                } else if (sql.includes('guilds WHERE id')) {
                    callback(null, { id: 'g1', name: 'Test', member_count: 5 });
                } else {
                    callback(null, []);
                }
            });
            mockDb.all = jest.fn((sql, params, callback) => {
                callback(null, [{ player_id: 'p1', rank: 'LEADER' }]);
            });
            
            const result = await guildManager.getPlayerGuildInfo('p1');
            
            expect(result.success).toBe(true);
            expect(result.guild).toHaveProperty('myRank', 'LEADER');
        });

        test('returns null when not in guild', async () => {
            mockDb.get = jest.fn((sql, params, callback) => callback(null, null));
            
            const result = await guildManager.getPlayerGuildInfo('p1');
            
            expect(result.success).toBe(true);
            expect(result.guild).toBeNull();
        });
    });
});
