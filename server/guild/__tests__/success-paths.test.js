/**
 * Success Paths - Complete Coverage for GuildManager
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');

describe('GuildManager Success Paths', () => {
    let mockDb, mockPlayerManager, gm;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            run: jest.fn((sql, params, callback) => callback.call({ lastID: 1, changes: 1 }, null)),
            get: jest.fn((sql, params, callback) => callback(null, null)),
            all: jest.fn((sql, params, callback) => callback(null, [])),
            // GuildDatabase methods
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
            saveChatMessage: jest.fn(),
            getChatHistory: jest.fn(),
            getInvitationById: jest.fn(),
            getPlayerInvitations: jest.fn(),
            getGuildInvitations: jest.fn(),
            createInvitation: jest.fn(),
            cancelInvitation: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn().mockResolvedValue({ id: 'p1', username: 'Test', level: 15, gold: 15000 }),
            getPlayerByUsername: jest.fn().mockResolvedValue({ id: 'p2', username: 'Target', level: 10 }),
            updateGold: jest.fn().mockResolvedValue(true),
            sendToPlayer: jest.fn()
        };
        
        gm = new GuildManager(mockDb, mockPlayerManager);
        gm.on = jest.fn();
        gm.emit = jest.fn();
    });

    describe('createGuild - Success Paths', () => {
        test('createGuild succeeds with all validations', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'p1',
                username: 'Leader',
                level: 15,
                gold: 15000
            });
            
            // No existing guild membership
            mockDb.getPlayerGuild.mockResolvedValue(null);
            
            // No name/tag conflicts
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue(null);
            
            // Gold deduction succeeds
            mockPlayerManager.updateGold.mockResolvedValue(true);
            
            // Create guild succeeds
            mockDb.createGuild.mockResolvedValue({
                id: 'g1',
                name: 'Test Guild',
                tag: 'TST',
                leaderId: 'p1',
                description: 'A test guild',
                memberCount: 1
            });

            const result = await gm.createGuild('p1', {
                name: 'Test Guild',
                tag: 'TST',
                description: 'A test guild'
            });

            expect(result.success).toBe(true);
            expect(result.guild).toHaveProperty('id', 'g1');
            expect(gm.emit).toHaveBeenCalledWith('guild:created', expect.any(Object));
        });

        test('createGuild handles optional description', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'p1',
                level: 15,
                gold: 15000
            });
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

            const result = await gm.createGuild('p1', {
                name: 'Test',
                tag: 'TST'
            });

            expect(result.success).toBe(true);
        });
    });

    describe('disbandGuild - Success Path', () => {
        test('disbandGuild succeeds for leader', async () => {
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Test Guild',
                leaderId: 'p1'
            });
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'g1',
                player_id: 'p1',
                rank: 'LEADER'
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'p1', rank: 'LEADER' },
                { player_id: 'p2', rank: 'MEMBER' }
            ]);
            mockDb.disbandGuild.mockResolvedValue(true);

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(true);
            expect(result.message).toContain('disbanded');
            expect(gm.emit).toHaveBeenCalledWith('guild:disbanded', expect.any(Object));
        });
    });

    describe('leaveGuild - Success Path', () => {
        test('leaveGuild succeeds for member', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'g1',
                player_id: 'p1',
                rank: 'MEMBER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Test',
                memberCount: 5
            });
            mockDb.removeGuildMember.mockResolvedValue(true);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:member_left', expect.any(Object));
        });
    });

    describe('kickMember - Success Paths', () => {
        test('kickMember succeeds for leader', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.removeGuildMember.mockResolvedValue(true);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:member_kicked', expect.any(Object));
        });

        test('kickMember succeeds for officer kicking member', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p1', rank: 'OFFICER' })
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.removeGuildMember.mockResolvedValue(true);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(true);
        });
    });

    describe('promoteMember - Success Path', () => {
        test('promoteMember succeeds for leader', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(true);
            expect(result.newRank).toBe('OFFICER');
            expect(gm.emit).toHaveBeenCalledWith('guild:member_promoted', expect.any(Object));
        });

        test('promoteMember to INITIATE', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p2', rank: 'MEMBER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await gm.promoteMember('p1', 'p2', 'INITIATE');

            expect(result.success).toBe(true);
        });
    });

    describe('transferLeadership - Success Path', () => {
        test('transferLeadership succeeds', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', player_id: 'p2', rank: 'OFFICER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test' });
            mockDb.transferLeadership.mockResolvedValue(true);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(true);
            expect(result.newLeaderId).toBe('p2');
            expect(gm.emit).toHaveBeenCalledWith('guild:leader_changed', expect.any(Object));
        });
    });

    describe('updateGuildInfo - Success Paths', () => {
        test('updateGuildInfo succeeds for leader', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'g1',
                player_id: 'p1',
                rank: 'LEADER'
            });
            mockDb.updateGuildInfo.mockResolvedValue(true);

            const result = await gm.updateGuildInfo('p1', {
                description: 'New description',
                motd: 'New MOTD',
                isRecruiting: true
            });

            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:updated', expect.any(Object));
        });

        test('updateGuildInfo succeeds for officer', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'g1',
                player_id: 'p1',
                rank: 'OFFICER'
            });
            mockDb.updateGuildInfo.mockResolvedValue(true);

            const result = await gm.updateGuildInfo('p1', {
                description: 'Updated by officer'
            });

            expect(result.success).toBe(true);
        });
    });

    describe('invitePlayer - Success Path', () => {
        test('invitePlayer succeeds for leader', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null); // Target not in guild
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Test Guild',
                member_count: 5,
                max_members: 100
            });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue({
                id: 'p2',
                username: 'Newbie',
                level: 10
            });
            mockDb.countGuildInvitations.mockResolvedValue(5);
            mockDb.countPlayerInvitations.mockResolvedValue(2);
            mockDb.createInvitation.mockResolvedValue({
                id: 'inv1',
                guild_id: 'g1',
                invitee_id: 'p2'
            });

            const result = await gm.invitePlayer('p1', 'g1', 'Newbie');

            expect(result.success).toBe(true);
            expect(result.invitation).toHaveProperty('id', 'inv1');
        });
    });

    describe('respondToInvitation - Success Paths', () => {
        test('respondToInvitation accepts', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild
                .mockResolvedValueOnce(null) // Not in guild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' }); // After joining
            mockDb.getGuildById.mockResolvedValue({
                id: 'g1',
                name: 'Test',
                member_count: 5,
                max_members: 100
            });
            mockDb.addGuildMember.mockResolvedValue(true);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(true);
            expect(gm.emit).toHaveBeenCalledWith('guild:member_joined', expect.any(Object));
        });

        test('respondToInvitation declines', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.respondToInvitation.mockResolvedValue({ changes: 1 });

            const result = await gm.respondToInvitation('p1', 'inv1', false);

            expect(result.success).toBe(true);
        });
    });

    describe('getPlayerInvitations - Success Path', () => {
        test('getPlayerInvitations returns formatted list', async () => {
            mockDb.getPlayerInvitations.mockResolvedValue([
                {
                    id: 'inv1',
                    guild_id: 'g1',
                    guild_name: 'Test Guild',
                    guild_tag: 'TST',
                    inviter_name: 'Leader',
                    created_at: '2024-01-01',
                    status: 'PENDING'
                }
            ]);

            const result = await gm.getPlayerInvitations('p1');

            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(1);
            expect(result.invitations[0]).toHaveProperty('guildId', 'g1');
        });
    });

    describe('browseGuilds - Success Paths', () => {
        test('browseGuilds with default pagination', async () => {
            mockDb.countGuilds.mockResolvedValue(25);
            mockDb.browseGuilds.mockResolvedValue([
                { id: 'g1', name: 'Guild 1', member_count: 10 },
                { id: 'g2', name: 'Guild 2', member_count: 15 }
            ]);

            const result = await gm.browseGuilds({});

            expect(result.success).toBe(true);
            expect(result.guilds).toHaveLength(2);
            expect(result.totalPages).toBe(3);
        });

        test('browseGuilds with search and filters', async () => {
            mockDb.countGuilds.mockResolvedValue(5);
            mockDb.browseGuilds.mockResolvedValue([
                { id: 'g1', name: 'Test Guild', is_recruiting: 1, member_count: 5 }
            ]);

            const result = await gm.browseGuilds({
                search: 'Test',
                isRecruiting: true,
                page: 1,
                limit: 10
            });

            expect(result.success).toBe(true);
            expect(result.guilds[0]).toHaveProperty('isRecruiting', true);
        });

        test('browseGuilds returns empty', async () => {
            mockDb.countGuilds.mockResolvedValue(0);
            mockDb.browseGuilds.mockResolvedValue([]);

            const result = await gm.browseGuilds({ search: 'Nonexistent' });

            expect(result.success).toBe(true);
            expect(result.guilds).toHaveLength(0);
            expect(result.totalPages).toBe(0);
        });
    });

    describe('getPlayerGuildInfo - Success Path', () => {
        test('getPlayerGuildInfo returns full info', async () => {
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
                leader_id: 'p2',
                description: 'A guild',
                member_count: 10,
                max_members: 100
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'p1', rank: 'OFFICER', joined_at: '2024-01-01' },
                { player_id: 'p2', rank: 'LEADER', joined_at: '2024-01-01' }
            ]);

            const result = await gm.getPlayerGuildInfo('p1');

            expect(result.success).toBe(true);
            expect(result.guild).toHaveProperty('id', 'g1');
            expect(result.members).toHaveLength(2);
            expect(result.myRank).toBe('OFFICER');
        });

        test('getPlayerGuildInfo when not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.getPlayerGuildInfo('p1');

            expect(result.success).toBe(true);
            expect(result.inGuild).toBe(false);
        });
    });

    describe('Online Members Management', () => {
        test('handlePlayerOnline sets member online', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'g1',
                player_id: 'p1',
                rank: 'MEMBER'
            });

            await gm.handlePlayerOnline('p1');

            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);
        });

        test('handlePlayerOffline sets member offline', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'g1',
                player_id: 'p1',
                rank: 'MEMBER'
            });
            
            // Set online first
            gm.setPlayerOnline('g1', 'p1');
            expect(gm.isPlayerOnline('g1', 'p1')).toBe(true);

            await gm.handlePlayerOffline('p1');

            expect(gm.isPlayerOnline('g1', 'p1')).toBe(false);
        });

        test('getOnlineGuildMembers returns array', () => {
            gm.setPlayerOnline('g1', 'p1');
            gm.setPlayerOnline('g1', 'p2');
            gm.setPlayerOnline('g2', 'p3');

            const members = gm.getOnlineGuildMembers('g1');

            expect(members).toHaveLength(2);
            expect(members).toContain('p1');
            expect(members).toContain('p2');
        });

        test('getOnlineGuildMembers returns empty for unknown guild', () => {
            const members = gm.getOnlineGuildMembers('unknown');
            expect(members).toEqual([]);
        });
    });

    describe('Constants', () => {
        test('exports correct constants', () => {
            expect(GuildManager.GUILD_CREATE_COST).toBe(10000);
            expect(GuildManager.GUILD_CREATE_MIN_LEVEL).toBe(10);
            expect(GuildManager.MAX_GUILD_MEMBERS).toBe(100);
            expect(GuildManager.MAX_GUILD_NAME_LENGTH).toBe(32);
            expect(GuildManager.MAX_GUILD_TAG_LENGTH).toBe(4);
            expect(GuildManager.MIN_GUILD_TAG_LENGTH).toBe(2);
        });
    });
});
