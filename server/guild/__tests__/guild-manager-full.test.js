/**
 * GuildManager Full Coverage Tests
 */

const GuildManager = require('../GuildManager');

describe('GuildManager Full Coverage', () => {
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
            expect(result.error).toContain('10,000 gold');
        });

        test('createGuild fails when already in guild', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test('createGuild fails when name already exists', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue({ id: 'g2', name: 'Test' });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('name already exists');
        });

        test('createGuild fails when tag already exists', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue({ id: 'g2', tag: 'TST' });

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('tag already exists');
        });

        test('createGuild handles gold update failure', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue(null);
            mockPlayerManager.updateGold.mockResolvedValue(false);

            const result = await gm.createGuild('p1', { name: 'Test', tag: 'TST' });

            expect(result.success).toBe(false);
        });

        test('createGuild handles createGuild error', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', level: 15, gold: 15000 });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue(null);
            mockPlayerManager.updateGold.mockResolvedValue(true);
            mockDb.createGuild.mockRejectedValue(new Error('Create Error'));

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
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('disbandGuild fails when guild not found', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildById.mockResolvedValue(null);

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('disbandGuild fails when not leader', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', leader_id: 'p2' });

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader');
        });

        test('disbandGuild handles getGuildMembers error', async () => {
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', leader_id: 'p1', name: 'Test' });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildMembers.mockRejectedValue(new Error('DB Error'));

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
        });

        test('disbandGuild handles disbandGuild error', async () => {
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', leader_id: 'p1', name: 'Test' });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockDb.getGuildMembers.mockResolvedValue([{ player_id: 'p1' }]);
            mockDb.disbandGuild.mockRejectedValue(new Error('Delete Error'));

            const result = await gm.disbandGuild('p1', 'g1');

            expect(result.success).toBe(false);
        });
    });

    describe('leaveGuild - All Paths', () => {
        test('leaveGuild fails when player not found', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
        });

        test('leaveGuild fails when leader tries to leave', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('transfer leadership');
        });

        test('leaveGuild handles getGuildById error', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });
            mockDb.getGuildById.mockRejectedValue(new Error('DB Error'));

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
        });

        test('leaveGuild handles removeGuildMember error', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Test' });
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', name: 'Test', member_count: 5 });
            mockDb.removeGuildMember.mockRejectedValue(new Error('Remove Error'));

            const result = await gm.leaveGuild('p1');

            expect(result.success).toBe(false);
        });
    });

    describe('kickMember - All Paths', () => {
        test('kickMember fails when kicker not found', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('kickMember fails when kicker not officer+', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('permission');
        });

        test('kickMember fails when target not found', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('kickMember fails when different guilds', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' });

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('same guild');
        });

        test('kickMember fails when officer tries to kick officer', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' });

            const result = await gm.kickMember('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('permission');
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
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('promoteMember fails when not leader', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader');
        });

        test('promoteMember fails when target not in guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in the same guild');
        });

        test('promoteMember fails when different guilds', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in the same guild');
        });

        test('promoteMember fails when invalid rank', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.promoteMember('p1', 'p2', 'INVALID');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid rank');
        });

        test('promoteMember fails when target already has rank', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'OFFICER' });

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already an OFFICER');
        });

        test('promoteMember handles getGuildById error', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getGuildById.mockRejectedValue(new Error('DB Error'));

            const result = await gm.promoteMember('p1', 'p2', 'OFFICER');

            expect(result.success).toBe(false);
        });
    });

    describe('transferLeadership - All Paths', () => {
        test('transferLeadership fails when transferrer not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('transferLeadership fails when not leader', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader');
        });

        test('transferLeadership fails when target not in guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce(null);

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in the guild');
        });

        test('transferLeadership fails when different guilds', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' });

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in the guild');
        });

        test('transferLeadership handles getGuildById error', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'MEMBER' });
            mockDb.getGuildById.mockRejectedValue(new Error('DB Error'));

            const result = await gm.transferLeadership('p1', 'p2');

            expect(result.success).toBe(false);
        });
    });

    describe('updateGuildInfo - All Paths', () => {
        test('updateGuildInfo fails when player not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('updateGuildInfo fails when member rank', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toContain('permission');
        });

        test('updateGuildInfo handles getGuildById error', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'OFFICER' });
            mockDb.getGuildById.mockRejectedValue(new Error('DB Error'));

            const result = await gm.updateGuildInfo('p1', { description: 'Test' });

            expect(result.success).toBe(false);
        });
    });

    describe('invitePlayer - All Paths', () => {
        test('invitePlayer fails when player not found', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await gm.invitePlayer('p1', 'g1', 'Unknown');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('invitePlayer fails when not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await gm.invitePlayer('p1', 'g1', 'Target');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not in a guild');
        });

        test('invitePlayer fails when not officer+', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'MEMBER' });

            const result = await gm.invitePlayer('p1', 'g1', 'Target');

            expect(result.success).toBe(false);
            expect(result.error).toContain('permission');
        });

        test('invitePlayer fails when target not found', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g1', rank: 'LEADER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Inviter' });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue(null);

            const result = await gm.invitePlayer('p1', 'g1', 'Nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('invitePlayer fails when target already in guild', async () => {
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: 'g1', rank: 'LEADER' })
                .mockResolvedValueOnce({ guild_id: 'g2', rank: 'MEMBER' });
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', username: 'Inviter' });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue({ id: 'p2', username: 'Target' });

            const result = await gm.invitePlayer('p1', 'g1', 'Target');

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });
    });

    describe('respondToInvitation - All Paths', () => {
        test('respondToInvitation fails when invitation not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });

        test('respondToInvitation fails when not for player', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p2',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not for you');
        });

        test('respondToInvitation fails when expired', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: '2020-01-01' // Very old
            });

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('expired');
        });

        test('respondToInvitation fails when already in guild', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'g2', rank: 'MEMBER' });

            const result = await gm.respondToInvitation('p1', 'inv1', true);

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });

        test('respondToInvitation fails when guild full', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'inv1',
                invitee_id: 'p1',
                guild_id: 'g1',
                status: 'PENDING',
                created_at: new Date().toISOString()
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildById.mockResolvedValue({ id: 'g1', member_count: 100, max_members: 100 });

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
