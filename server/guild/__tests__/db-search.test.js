/**
 * Test for GuildDatabase browseGuilds with search query (lines 374-375)
 */

const GuildDatabase = require('../GuildDatabase');

describe('GuildDatabase browseGuilds search (lines 374-375)', () => {
    let db;

    beforeEach(() => {
        db = new GuildDatabase(':memory:');
        // Mock the all and get methods to capture the SQL query
        jest.spyOn(db, 'all').mockResolvedValue([]);
        jest.spyOn(db, 'get').mockResolvedValue({ count: 0 });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('browseGuilds with search query uses LIKE clause (lines 374-375)', async () => {
        await db.browseGuilds({ search: 'TestGuild', limit: 10, page: 1 });

        expect(db.all).toHaveBeenCalledTimes(1);
        
        const [query, params] = db.all.mock.calls[0];
        
        // Verify LIKE clause is present
        expect(query).toContain('LIKE');
        expect(query).toContain('LOWER(name)');
        expect(query).toContain('tag LIKE');
        
        // Verify search params are lower/upper case
        expect(params).toContain('%testguild%');  // lowercase
        expect(params).toContain('%TESTGUILD%');  // uppercase
    });

    test('browseGuilds without search query has no LIKE clause', async () => {
        await db.browseGuilds({ limit: 10, page: 1 });

        const [query] = db.all.mock.calls[0];
        
        // Without search, should not have LIKE
        expect(query).not.toContain('LOWER(name) LIKE');
    });
});
