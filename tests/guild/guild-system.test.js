/**
 * Guild System Tests
 * Legacy of Komodo MMORPG v0.5.0
 */

const GuildManager = require('../../server/guild/GuildManager');
const GuildDatabase = require('../../server/guild/GuildDatabase');
const GuildInvitationManager = require('../../server/guild/GuildInvitationManager');
const GuildChatHandler = require('../../server/guild/GuildChatHandler');

describe('Guild System', () => {
    let mockDb;
    let mockPlayerManager;
    let mockChatManager;
    let guildManager;

    beforeEach(() => {
        // Mock database
        mockDb = {
            createGuild: jest.fn(),
            getGuildByName: jest.fn(),
            getGuildByTag: jest.fn(),
            getGuild: jest.fn(),
            addGuildMember: jest.fn(),
            getGuildMembers: jest.fn(),
            getPlayerGuild: jest.fn(),
            removeMember: jest.fn(),
            updateMemberRank: jest.fn(),
            createInvitation: jest.fn(),
            getPendingInvitations: jest.fn(),
            respondToInvitation: jest.fn(),
            getGuildInvitations: jest.fn(),
            saveChatMessage: jest.fn(),
            getChatHistory: jest.fn(),
            updateGuildInfo: jest.fn(),
            disbandGuild: jest.fn(),
            getGuildById: jest.fn(),
            updateLastActive: jest.fn(),
            browseGuilds: jest.fn(),
            searchGuilds: jest.fn()
        };

        // Mock player manager
        mockPlayerManager = {
            getPlayer: jest.fn(),
            updateGold: jest.fn(),
            getPlayerByUsername: jest.fn()
        };

        // Mock chat manager
        mockChatManager = {
            broadcast: jest.fn()
        };

        guildManager = new GuildManager(mockDb, mockPlayerManager, mockChatManager);
    });

    describe('Guild Creation', () => {
        test('should create guild with valid data', async () => {
            const playerId = 'player-123';
            const guildData = {
                name: 'Test Guild',
                tag: 'TEST',
                description: 'A test guild'
            };

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                level: 15,
                gold: 15000
            });

            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue(null);
            mockDb.createGuild.mockResolvedValue({
                id: 'guild-123',
                name: guildData.name,
                tag: guildData.tag,
                leader_id: playerId
            });

            const result = await guildManager.createGuild(playerId, guildData);

            expect(result.success).toBe(true);
            expect(mockDb.createGuild).toHaveBeenCalledWith(expect.objectContaining({
                name: guildData.name,
                tag: guildData.tag,
                leaderId: playerId
            }));
        });

        test('should fail if player level too low', async () => {
            const playerId = 'player-123';
            const guildData = { name: 'Test', tag: 'TST' };

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                level: 5, // Below minimum
                gold: 20000
            });

            const result = await guildManager.createGuild(playerId, guildData);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Requires level 10');
        });

        test('should fail if not enough gold', async () => {
            const playerId = 'player-123';
            const guildData = { name: 'Test', tag: 'TST' };

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                level: 15,
                gold: 5000 // Not enough
            });

            const result = await guildManager.createGuild(playerId, guildData);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Requires 10000 gold');
        });

        test('should fail if name already exists', async () => {
            const playerId = 'player-123';
            const guildData = { name: 'Existing Guild', tag: 'NEW' };

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                level: 15,
                gold: 15000
            });

            mockDb.getGuildByName.mockResolvedValue({ id: 'existing-guild' });

            const result = await guildManager.createGuild(playerId, guildData);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Guild name already exists');
        });

        test('should fail if tag already exists', async () => {
            const playerId = 'player-123';
            const guildData = { name: 'New Guild', tag: 'USED' };

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                level: 15,
                gold: 15000
            });

            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue({ id: 'existing-guild' });

            const result = await guildManager.createGuild(playerId, guildData);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Guild tag already exists');
        });
    });

    describe('Guild Invitations', () => {
        test('should invite player to guild', async () => {
            const inviterId = 'leader-123';
            const inviteeUsername = 'player456';
            const guildId = 'guild-123';

            // First call: inviter check, Second call: invitee check
            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: guildId, rank: 'LEADER' }) // inviter
                .mockResolvedValueOnce(null); // invitee - not in guild

            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                name: 'Test Guild',
                memberCount: 5,
                maxMembers: 100
            });

            mockPlayerManager.getPlayerByUsername.mockResolvedValue({
                id: 'invitee-456',
                username: inviteeUsername
            });

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: inviterId,
                username: 'InviterName'
            });

            mockDb.createInvitation.mockResolvedValue({
                id: 'invite-789',
                guild_id: guildId,
                invitee_id: 'invitee-456'
            });

            const result = await guildManager.invitePlayer(inviterId, guildId, inviteeUsername);

            expect(result.success).toBe(true);
            expect(mockDb.createInvitation).toHaveBeenCalled();
        });

        test('should accept invitation', async () => {
            const playerId = 'player-456';
            const invitationId = 'invite-789';

            mockDb.getPendingInvitations.mockResolvedValue([{
                id: invitationId,
                guild_id: 'guild-123',
                invitee_id: playerId,
                status: 'PENDING'
            }]);

            mockDb.getPlayerGuild.mockResolvedValue(null); // Not in guild

            mockDb.respondToInvitation.mockResolvedValue({
                id: invitationId,
                guild_id: 'guild-123',
                status: 'ACCEPTED'
            });

            mockDb.getGuildById.mockResolvedValue({
                id: 'guild-123',
                name: 'Test Guild',
                tag: 'TEST'
            });

            const result = await guildManager.respondToInvitation(playerId, invitationId, true);

            expect(result.success).toBe(true);
            expect(mockDb.respondToInvitation).toHaveBeenCalledWith(invitationId, 'ACCEPTED');
        });

        test('should decline invitation', async () => {
            const playerId = 'player-456';
            const invitationId = 'invite-789';

            mockDb.respondToInvitation.mockResolvedValue({
                id: invitationId,
                status: 'DECLINED'
            });

            const result = await guildManager.respondToInvitation(playerId, invitationId, false);

            expect(result.success).toBe(true);
            expect(mockDb.respondToInvitation).toHaveBeenCalledWith(invitationId, 'DECLINED');
        });
    });

    describe('Guild Membership', () => {
        test('should leave guild', async () => {
            const playerId = 'member-123';
            const guildId = 'guild-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'MEMBER'
            });

            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                name: 'Test Guild',
                tag: 'TEST'
            });

            mockDb.removeMember.mockResolvedValue(true);

            const result = await guildManager.leaveGuild(playerId);

            expect(result.success).toBe(true);
            expect(mockDb.removeMember).toHaveBeenCalledWith(guildId, playerId);
        });

        test('should kick member as officer', async () => {
            const officerId = 'officer-123';
            const memberId = 'member-456';
            const guildId = 'guild-123';

            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: guildId, rank: 'OFFICER' }) // kicker check
                .mockResolvedValueOnce({ guild_id: guildId, rank: 'MEMBER' }); // target check

            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                name: 'Test Guild'
            });

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: memberId,
                username: 'TestMember'
            });

            mockDb.removeMember.mockResolvedValue(true);

            const result = await guildManager.kickMember(officerId, memberId);

            expect(result.success).toBe(true);
            expect(mockDb.removeMember).toHaveBeenCalledWith(guildId, memberId);
        });

        test('should promote member to officer as leader', async () => {
            const leaderId = 'leader-123';
            const memberId = 'member-456';
            const guildId = 'guild-123';

            mockDb.getPlayerGuild
                .mockResolvedValueOnce({ guild_id: guildId, rank: 'LEADER' }) // leader check
                .mockResolvedValueOnce({ guild_id: guildId, rank: 'MEMBER' }); // target check

            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                name: 'Test Guild',
                tag: 'TEST'
            });

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: memberId,
                username: 'TestMember'
            });

            mockDb.updateMemberRank.mockResolvedValue({
                player_id: memberId,
                rank: 'OFFICER'
            });

            const result = await guildManager.promoteMember(leaderId, memberId, 'OFFICER');

            expect(result.success).toBe(true);
            expect(mockDb.updateMemberRank).toHaveBeenCalledWith(guildId, memberId, 'OFFICER');
        });

        test('should fail to kick higher rank member', async () => {
            const memberId = 'member-123';
            const officerId = 'officer-456';
            const guildId = 'guild-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'MEMBER' // Lower rank trying to kick officer
            });

            const result = await guildManager.kickMember(memberId, officerId);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Only officers can kick');
        });
    });

    // NOTE: Guild Chat tests should be in a separate GuildChatHandler test file
    // The chat methods (sendGuildMessage, sendOfficerMessage) are in GuildChatHandler

    describe('Guild Directory', () => {
        test('should list recruiting guilds', async () => {
            const mockGuilds = [
                { id: 'guild-1', name: 'Guild One', tag: 'GONE', member_count: 50 },
                { id: 'guild-2', name: 'Guild Two', tag: 'GTWO', member_count: 30 }
            ];

            mockDb.browseGuilds.mockResolvedValue({ guilds: mockGuilds, total: 2, page: 1, totalPages: 1 });

            const result = await guildManager.browseGuilds({ recruiting: true });

            expect(result.success).toBe(true);
            expect(result.guilds.guilds).toHaveLength(2);
            expect(result.guilds.guilds[0].name).toBe('Guild One');
        });

        test('should search guilds by name', async () => {
            const mockGuilds = [
                { id: 'guild-1', name: 'Awesome Guild', tag: 'AWES' }
            ];

            mockDb.browseGuilds.mockResolvedValue({ guilds: mockGuilds, total: 1, page: 1, totalPages: 1 });

            const result = await guildManager.browseGuilds({ search: 'Awesome' });

            expect(result.success).toBe(true);
            expect(result.guilds.guilds).toHaveLength(1);
            expect(result.guilds.guilds[0].name).toBe('Awesome Guild');
        });
    });

    describe('Disband Guild', () => {
        test('should disband guild as leader', async () => {
            const leaderId = 'leader-123';
            const guildId = 'guild-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'LEADER'
            });

            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                leaderId: leaderId,
                name: 'Test Guild'
            });

            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: leaderId, rank: 'LEADER' }
            ]);

            mockDb.disbandGuild.mockResolvedValue(true);

            const result = await guildManager.disbandGuild(leaderId, guildId);
            console.log('Disband result:', result);

            expect(result.success).toBe(true);
            expect(mockDb.disbandGuild).toHaveBeenCalledWith(guildId);
        });

        test('should fail to disband as non-leader', async () => {
            const officerId = 'officer-123';
            const guildId = 'guild-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'OFFICER'
            });

            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                leaderId: 'someone-else'
            });

            const result = await guildManager.disbandGuild(officerId, guildId);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Only the guild leader can disband');
        });
    });

    describe('Online Status', () => {
        test('should track online members', async () => {
            const guildId = 'guild-123';
            const playerId = 'member-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'MEMBER'
            });

            await guildManager.handlePlayerOnline(playerId);

            const onlineMembers = guildManager.getOnlineMembers(guildId);
            expect(onlineMembers.has(playerId)).toBe(true);
        });

        test('should remove from online on disconnect', async () => {
            const guildId = 'guild-123';
            const playerId = 'member-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'MEMBER'
            });

            // First go online
            await guildManager.handlePlayerOnline(playerId);
            
            // Then go offline
            await guildManager.handlePlayerOffline(playerId);

            const onlineMembers = guildManager.getOnlineMembers(guildId);
            expect(onlineMembers.has(playerId)).toBe(false);
        });
    });
});
