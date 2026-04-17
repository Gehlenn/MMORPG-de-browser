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
            removeGuildMember: jest.fn(),
            updateMemberRank: jest.fn(),
            createInvitation: jest.fn(),
            getPendingInvitations: jest.fn(),
            updateInvitationStatus: jest.fn(),
            getGuildInvitations: jest.fn(),
            saveChatMessage: jest.fn(),
            getChatHistory: jest.fn(),
            updateGuildInfo: jest.fn(),
            disbandGuild: jest.fn(),
            updateLastActive: jest.fn()
        };

        // Mock player manager
        mockPlayerManager = {
            getPlayer: jest.fn(),
            updatePlayerGold: jest.fn(),
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
                leader_id: playerId
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

            await expect(guildManager.createGuild(playerId, guildData))
                .rejects.toThrow('Requires level 10');
        });

        test('should fail if not enough gold', async () => {
            const playerId = 'player-123';
            const guildData = { name: 'Test', tag: 'TST' };

            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                level: 15,
                gold: 5000 // Not enough
            });

            await expect(guildManager.createGuild(playerId, guildData))
                .rejects.toThrow('Requires 10000 gold');
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

            await expect(guildManager.createGuild(playerId, guildData))
                .rejects.toThrow('Guild name already exists');
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

            await expect(guildManager.createGuild(playerId, guildData))
                .rejects.toThrow('Guild tag already exists');
        });
    });

    describe('Guild Invitations', () => {
        test('should invite player to guild', async () => {
            const inviterId = 'leader-123';
            const inviteeUsername = 'player456';
            const guildId = 'guild-123';

            mockDb.getGuildMembers.mockResolvedValue([{
                player_id: inviterId,
                rank: 'LEADER'
            }]);

            mockPlayerManager.getPlayerByUsername.mockResolvedValue({
                id: 'invitee-456',
                username: inviteeUsername
            });

            mockDb.getPlayerGuild.mockResolvedValue(null); // Not in any guild

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

            mockDb.updateInvitationStatus.mockResolvedValue({
                id: invitationId,
                status: 'ACCEPTED'
            });

            mockDb.addGuildMember.mockResolvedValue({
                guild_id: 'guild-123',
                player_id: playerId,
                rank: 'INITIATE'
            });

            const result = await guildManager.acceptInvitation(playerId, invitationId);

            expect(result.success).toBe(true);
            expect(mockDb.addGuildMember).toHaveBeenCalledWith('guild-123', playerId, 'INITIATE');
        });

        test('should decline invitation', async () => {
            const playerId = 'player-456';
            const invitationId = 'invite-789';

            mockDb.updateInvitationStatus.mockResolvedValue({
                id: invitationId,
                status: 'DECLINED'
            });

            const result = await guildManager.declineInvitation(playerId, invitationId);

            expect(result.success).toBe(true);
            expect(mockDb.updateInvitationStatus).toHaveBeenCalledWith(invitationId, 'DECLINED');
        });
    });

    describe('Guild Membership', () => {
        test('should leave guild', async () => {
            const playerId = 'member-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild-123',
                rank: 'MEMBER'
            });

            mockDb.removeGuildMember.mockResolvedValue(true);

            const result = await guildManager.leaveGuild(playerId);

            expect(result.success).toBe(true);
            expect(mockDb.removeGuildMember).toHaveBeenCalledWith('guild-123', playerId);
        });

        test('should kick member as officer', async () => {
            const officerId = 'officer-123';
            const memberId = 'member-456';
            const guildId = 'guild-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'OFFICER'
            });

            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: officerId, rank: 'OFFICER' },
                { player_id: memberId, rank: 'MEMBER' }
            ]);

            mockDb.removeGuildMember.mockResolvedValue(true);

            const result = await guildManager.kickMember(officerId, guildId, memberId);

            expect(result.success).toBe(true);
            expect(mockDb.removeGuildMember).toHaveBeenCalledWith(guildId, memberId);
        });

        test('should promote member to officer as leader', async () => {
            const leaderId = 'leader-123';
            const memberId = 'member-456';
            const guildId = 'guild-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'LEADER'
            });

            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: leaderId, rank: 'LEADER' },
                { player_id: memberId, rank: 'MEMBER' }
            ]);

            mockDb.updateMemberRank.mockResolvedValue({
                player_id: memberId,
                rank: 'OFFICER'
            });

            const result = await guildManager.promoteMember(leaderId, guildId, memberId);

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

            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: memberId, rank: 'MEMBER' },
                { player_id: officerId, rank: 'OFFICER' }
            ]);

            await expect(guildManager.kickMember(memberId, guildId, officerId))
                .rejects.toThrow('Insufficient rank');
        });
    });

    describe('Guild Chat', () => {
        test('should send guild chat message', async () => {
            const playerId = 'member-123';
            const guildId = 'guild-123';
            const message = 'Hello guild!';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'MEMBER'
            });

            mockDb.saveChatMessage.mockResolvedValue({
                id: 'msg-789',
                guild_id: guildId,
                sender_id: playerId,
                message: message
            });

            const result = await guildManager.sendGuildMessage(playerId, message);

            expect(result.success).toBe(true);
            expect(mockDb.saveChatMessage).toHaveBeenCalled();
        });

        test('should enforce chat rate limit', async () => {
            const playerId = 'member-123';
            const message = 'Spam message';

            // First message
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild-123',
                rank: 'MEMBER'
            });

            mockDb.saveChatMessage.mockResolvedValue({ id: 'msg-1' });

            await guildManager.sendGuildMessage(playerId, 'First message');

            // Second message immediately should be rate limited
            await expect(guildManager.sendGuildMessage(playerId, 'Second message'))
                .rejects.toThrow('Rate limit exceeded');
        });

        test('should allow officer chat for officers only', async () => {
            const officerId = 'officer-123';
            const guildId = 'guild-123';
            const message = 'Officers only message';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'OFFICER'
            });

            mockDb.saveChatMessage.mockResolvedValue({ id: 'msg-789' });

            const result = await guildManager.sendOfficerMessage(officerId, message);

            expect(result.success).toBe(true);
            expect(result.isOfficerChat).toBe(true);
        });

        test('should reject officer chat from regular member', async () => {
            const memberId = 'member-123';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild-123',
                rank: 'MEMBER'
            });

            await expect(guildManager.sendOfficerMessage(memberId, 'Message'))
                .rejects.toThrow('Officers only');
        });
    });

    describe('Guild Directory', () => {
        test('should list recruiting guilds', async () => {
            const mockGuilds = [
                { id: 'guild-1', name: 'Guild One', tag: 'GONE', member_count: 50 },
                { id: 'guild-2', name: 'Guild Two', tag: 'GTWO', member_count: 30 }
            ];

            mockDb.getRecruitingGuilds.mockResolvedValue(mockGuilds);

            const result = await guildManager.getGuildDirectory({ recruiting: true });

            expect(result.guilds).toHaveLength(2);
            expect(result.guilds[0].name).toBe('Guild One');
        });

        test('should search guilds by name', async () => {
            const mockGuilds = [
                { id: 'guild-1', name: 'Awesome Guild', tag: 'AWES' }
            ];

            mockDb.searchGuilds.mockResolvedValue(mockGuilds);

            const result = await guildManager.searchGuilds('Awesome');

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Awesome Guild');
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

            mockDb.getGuild.mockResolvedValue({
                id: guildId,
                leader_id: leaderId
            });

            mockDb.disbandGuild.mockResolvedValue(true);

            const result = await guildManager.disbandGuild(leaderId, guildId);

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

            mockDb.getGuild.mockResolvedValue({
                id: guildId,
                leader_id: 'someone-else'
            });

            await expect(guildManager.disbandGuild(officerId, guildId))
                .rejects.toThrow('Only leader can disband');
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
