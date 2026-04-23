/**
 * Guild System Tests - v1.0
 * Testes completos para GuildManager, GuildInvitationManager e GuildChatHandler
 */

const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const GuildManager = require('../server/guild/GuildManager.js');
const GuildInvitationManager = require('../server/guild/GuildInvitationManager.js');
const GuildChatHandler = require('../server/guild/GuildChatHandler.js');

describe('Guild System Tests', () => {
    let guildManager;
    let invitationManager;
    let chatHandler;
    let mockDb;
    let mockPlayerManager;
    let mockChatManager;

    beforeEach(() => {
        // Mock Database
        mockDb = {
            getPlayerGuild: jest.fn(),
            getGuildById: jest.fn(),
            getGuildByName: jest.fn(),
            getGuildByTag: jest.fn(),
            getGuildMembers: jest.fn(),
            createGuild: jest.fn(),
            disbandGuild: jest.fn(),
            removeMember: jest.fn(),
            updateMemberRank: jest.fn(),
            transferLeadership: jest.fn(),
            updateGuildInfo: jest.fn(),
            createInvitation: jest.fn(),
            getInvitationById: jest.fn(),
            getPlayerInvitations: jest.fn(),
            getGuildInvitations: jest.fn(),
            respondToInvitation: jest.fn(),
            cancelInvitation: jest.fn(),
            cleanupExpiredInvitations: jest.fn(),
            saveChatMessage: jest.fn(),
            getChatHistory: jest.fn(),
            updateLastActive: jest.fn(),
            browseGuilds: jest.fn()
        };

        // Mock PlayerManager
        mockPlayerManager = {
            getPlayer: jest.fn(),
            getPlayerByUsername: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };

        // Mock ChatManager
        mockChatManager = {
            broadcast: jest.fn()
        };

        guildManager = new GuildManager(mockDb, mockPlayerManager, mockChatManager);
        invitationManager = new GuildInvitationManager(guildManager, mockDb);
        chatHandler = new GuildChatHandler(guildManager, mockDb);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GuildManager - Initialization', () => {
        test('should initialize correctly', async () => {
            const initSpy = jest.fn();
            guildManager.on('initialized', initSpy);
            await guildManager.initialize();
            expect(initSpy).toHaveBeenCalled();
        });

        test('should have correct default values', () => {
            expect(guildManager.GUILD_CREATE_COST).toBe(10000);
            expect(guildManager.GUILD_CREATE_MIN_LEVEL).toBe(10);
            expect(guildManager.onlineMembers).toBeInstanceOf(Map);
            expect(guildManager.chatCooldowns).toBeInstanceOf(Map);
        });
    });

    describe('GuildManager - Create Guild', () => {
        test('should create guild successfully', async () => {
            const playerId = 'player1';
            const player = { id: playerId, level: 15, gold: 50000 };
            const guildData = { name: 'Test Guild', tag: 'TEST', description: 'A test guild' };

            mockPlayerManager.getPlayer.mockResolvedValue(player);
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue(null);
            mockDb.createGuild.mockResolvedValue({
                id: 'guild1',
                name: guildData.name,
                tag: guildData.tag.toUpperCase()
            });

            const result = await guildManager.createGuild(playerId, guildData);

            expect(result.success).toBe(true);
            expect(result.guild.name).toBe(guildData.name);
            expect(mockPlayerManager.updateGold).toHaveBeenCalledWith(playerId, -10000);
        });

        test('should fail if player level is too low', async () => {
            const playerId = 'player1';
            const player = { id: playerId, level: 5, gold: 50000 };
            const guildData = { name: 'Test Guild', tag: 'TEST' };

            mockPlayerManager.getPlayer.mockResolvedValue(player);

            const result = await guildManager.createGuild(playerId, guildData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Requires level 10');
        });

        test('should fail if player has insufficient gold', async () => {
            const playerId = 'player1';
            const player = { id: playerId, level: 15, gold: 1000 };
            const guildData = { name: 'Test Guild', tag: 'TEST' };

            mockPlayerManager.getPlayer.mockResolvedValue(player);

            const result = await guildManager.createGuild(playerId, guildData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Requires 10000 gold');
        });

        test('should fail if player already in guild', async () => {
            const playerId = 'player1';
            const player = { id: playerId, level: 15, gold: 50000 };
            const guildData = { name: 'Test Guild', tag: 'TEST' };

            mockPlayerManager.getPlayer.mockResolvedValue(player);
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 'guild1' });

            const result = await guildManager.createGuild(playerId, guildData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Already in a guild');
        });

        test('should fail if guild name is taken', async () => {
            const playerId = 'player1';
            const player = { id: playerId, level: 15, gold: 50000 };
            const guildData = { name: 'Test Guild', tag: 'TEST' };

            mockPlayerManager.getPlayer.mockResolvedValue(player);
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue({ id: 'existing' });

            const result = await guildManager.createGuild(playerId, guildData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Guild name already exists');
        });

        test('should fail if guild tag is taken', async () => {
            const playerId = 'player1';
            const player = { id: playerId, level: 15, gold: 50000 };
            const guildData = { name: 'Test Guild', tag: 'TEST' };

            mockPlayerManager.getPlayer.mockResolvedValue(player);
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getGuildByName.mockResolvedValue(null);
            mockDb.getGuildByTag.mockResolvedValue({ id: 'existing' });

            const result = await guildManager.createGuild(playerId, guildData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Guild tag already exists');
        });

        test('should validate guild name length', async () => {
            const playerId = 'player1';
            const player = { id: playerId, level: 15, gold: 50000 };

            mockPlayerManager.getPlayer.mockResolvedValue(player);

            const shortName = { name: 'T', tag: 'TEST' };
            const result1 = await guildManager.createGuild(playerId, shortName);
            expect(result1.success).toBe(false);

            const longName = { name: 'T'.repeat(25), tag: 'TEST' };
            const result2 = await guildManager.createGuild(playerId, longName);
            expect(result2.success).toBe(false);
        });

        test('should validate guild tag length', async () => {
            const playerId = 'player1';
            const player = { id: playerId, level: 15, gold: 50000 };

            mockPlayerManager.getPlayer.mockResolvedValue(player);

            const shortTag = { name: 'Test Guild', tag: 'TE' };
            const result1 = await guildManager.createGuild(playerId, shortTag);
            expect(result1.success).toBe(false);

            const longTag = { name: 'Test Guild', tag: 'TESTER' };
            const result2 = await guildManager.createGuild(playerId, longTag);
            expect(result2.success).toBe(false);
        });
    });

    describe('GuildManager - Disband Guild', () => {
        test('should disband guild successfully', async () => {
            const playerId = 'leader1';
            const guildId = 'guild1';

            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                leaderId: playerId,
                name: 'Test Guild'
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'member1' },
                { player_id: 'member2' }
            ]);

            const result = await guildManager.disbandGuild(playerId, guildId);

            expect(result.success).toBe(true);
            expect(result.disbanded).toBe(true);
            expect(mockDb.disbandGuild).toHaveBeenCalledWith(guildId);
        });

        test('should fail if not leader', async () => {
            const playerId = 'notleader';
            const guildId = 'guild1';

            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                leaderId: 'leader1',
                name: 'Test Guild'
            });

            const result = await guildManager.disbandGuild(playerId, guildId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the guild leader can disband');
        });

        test('should fail if guild not found', async () => {
            const playerId = 'leader1';
            const guildId = 'nonexistent';

            mockDb.getGuildById.mockResolvedValue(null);

            const result = await guildManager.disbandGuild(playerId, guildId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Guild not found');
        });
    });

    describe('GuildManager - Invite Player', () => {
        test('should invite player successfully', async () => {
            const inviterId = 'officer1';
            const guildId = 'guild1';
            const inviteeUsername = 'newplayer';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: guildId,
                rank: 'OFFICER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                memberCount: 5,
                maxMembers: 50
            });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue({
                id: 'newplayer_id',
                username: inviteeUsername
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce(null);
            mockDb.createInvitation.mockResolvedValue({ id: 'invite1' });
            mockPlayerManager.getPlayer.mockResolvedValue({ username: 'officer1' });

            const result = await guildManager.invitePlayer(inviterId, guildId, inviteeUsername);

            expect(result.success).toBe(true);
            expect(mockDb.createInvitation).toHaveBeenCalled();
        });

        test('should fail if inviter not officer', async () => {
            const inviterId = 'member1';
            const guildId = 'guild1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: guildId,
                rank: 'MEMBER'
            });

            const result = await guildManager.invitePlayer(inviterId, guildId, 'newplayer');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can invite');
        });

        test('should fail if guild is full', async () => {
            const inviterId = 'officer1';
            const guildId = 'guild1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: guildId,
                rank: 'OFFICER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                memberCount: 50,
                maxMembers: 50
            });

            const result = await guildManager.invitePlayer(inviterId, guildId, 'newplayer');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Guild is full');
        });

        test('should fail if target player not found', async () => {
            const inviterId = 'officer1';
            const guildId = 'guild1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: guildId,
                rank: 'OFFICER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                memberCount: 5,
                maxMembers: 50
            });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue(null);

            const result = await guildManager.invitePlayer(inviterId, guildId, 'nonexistent');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player not found');
        });

        test('should fail if target already in guild', async () => {
            const inviterId = 'officer1';
            const guildId = 'guild1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: guildId,
                rank: 'OFFICER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                memberCount: 5,
                maxMembers: 50
            });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue({
                id: 'existingplayer',
                username: 'existing'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({ guild_id: 'otherguild' });

            const result = await guildManager.invitePlayer(inviterId, guildId, 'existing');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player already in a guild');
        });

        test('should fail if inviting yourself', async () => {
            const inviterId = 'officer1';
            const guildId = 'guild1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: guildId,
                rank: 'OFFICER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                memberCount: 5,
                maxMembers: 50
            });
            mockPlayerManager.getPlayerByUsername.mockResolvedValue({
                id: inviterId,
                username: 'officer1'
            });

            const result = await guildManager.invitePlayer(inviterId, guildId, 'officer1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot invite yourself');
        });
    });

    describe('GuildManager - Respond to Invitation', () => {
        test('should accept invitation successfully', async () => {
            const playerId = 'player1';
            const invitationId = 'invite1';

            mockDb.respondToInvitation.mockResolvedValue({
                id: invitationId,
                guild_id: 'guild1',
                status: 'ACCEPTED'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild1',
                name: 'Test Guild',
                tag: 'TEST'
            });

            const result = await guildManager.respondToInvitation(playerId, invitationId, true);

            expect(result.success).toBe(true);
            expect(result.guild).toBeDefined();
        });

        test('should decline invitation successfully', async () => {
            const playerId = 'player1';
            const invitationId = 'invite1';

            mockDb.respondToInvitation.mockResolvedValue({
                id: invitationId,
                status: 'DECLINED'
            });

            const result = await guildManager.respondToInvitation(playerId, invitationId, false);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Invitation declined');
        });
    });

    describe('GuildManager - Leave Guild', () => {
        test('should leave guild successfully', async () => {
            const playerId = 'member1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild1',
                name: 'Test Guild',
                tag: 'TEST'
            });

            const result = await guildManager.leaveGuild(playerId);

            expect(result.success).toBe(true);
            expect(mockDb.removeMember).toHaveBeenCalledWith('guild1', playerId);
        });

        test('should fail if leader tries to leave', async () => {
            const playerId = 'leader1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'LEADER'
            });

            const result = await guildManager.leaveGuild(playerId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Leader must transfer leadership');
        });

        test('should fail if not in guild', async () => {
            const playerId = 'noguild';

            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await guildManager.leaveGuild(playerId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in a guild');
        });
    });

    describe('GuildManager - Kick Member', () => {
        test('should kick member successfully', async () => {
            const kickerId = 'officer1';
            const targetId = 'member1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild1',
                name: 'Test Guild'
            });
            mockPlayerManager.getPlayer.mockResolvedValue({ username: 'member1' });

            const result = await guildManager.kickMember(kickerId, targetId);

            expect(result.success).toBe(true);
            expect(mockDb.removeMember).toHaveBeenCalledWith('guild1', targetId);
        });

        test('should fail if kicker is not officer', async () => {
            const kickerId = 'member1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });

            const result = await guildManager.kickMember(kickerId, 'target1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can kick');
        });

        test('should fail if trying to kick leader', async () => {
            const kickerId = 'officer1';
            const targetId = 'leader1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'LEADER'
            });

            const result = await guildManager.kickMember(kickerId, targetId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot kick the leader');
        });

        test('should fail if officer tries to kick other officer', async () => {
            const kickerId = 'officer1';
            const targetId = 'officer2';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });

            const result = await guildManager.kickMember(kickerId, targetId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot kick other officers');
        });
    });

    describe('GuildManager - Promote/Demote', () => {
        test('should promote member successfully', async () => {
            const leaderId = 'leader1';
            const targetId = 'member1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'LEADER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild1',
                name: 'Test Guild'
            });
            mockPlayerManager.getPlayer.mockResolvedValue({ username: 'member1' });

            const result = await guildManager.promoteMember(leaderId, targetId, 'OFFICER');

            expect(result.success).toBe(true);
            expect(mockDb.updateMemberRank).toHaveBeenCalledWith('guild1', targetId, 'OFFICER');
        });

        test('should fail if not leader', async () => {
            const officerId = 'officer1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });

            const result = await guildManager.promoteMember(officerId, 'target1', 'OFFICER');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader can promote');
        });

        test('should fail with invalid rank', async () => {
            const leaderId = 'leader1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'LEADER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });

            const result = await guildManager.promoteMember(leaderId, 'target1', 'INVALID');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid rank');
        });

        test('demoteMember should call promoteMember with lower rank', async () => {
            const leaderId = 'leader1';
            const targetId = 'officer1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'LEADER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild1',
                name: 'Test Guild'
            });
            mockPlayerManager.getPlayer.mockResolvedValue({ username: 'officer1' });

            await guildManager.demoteMember(leaderId, targetId, 'MEMBER');

            expect(mockDb.updateMemberRank).toHaveBeenCalledWith('guild1', targetId, 'MEMBER');
        });
    });

    describe('GuildManager - Transfer Leadership', () => {
        test('should transfer leadership successfully', async () => {
            const leaderId = 'leader1';
            const newLeaderId = 'officer1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'LEADER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild1',
                name: 'Test Guild'
            });
            mockPlayerManager.getPlayer.mockResolvedValue({ username: 'officer1' });

            const result = await guildManager.transferLeadership(leaderId, newLeaderId);

            expect(result.success).toBe(true);
            expect(mockDb.transferLeadership).toHaveBeenCalledWith('guild1', newLeaderId);
        });

        test('should fail if not leader', async () => {
            const officerId = 'officer1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });

            const result = await guildManager.transferLeadership(officerId, 'target1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only the leader can transfer leadership');
        });

        test('should fail if new leader not in same guild', async () => {
            const leaderId = 'leader1';
            const outsiderId = 'outsider1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild1',
                rank: 'LEADER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: 'guild2',
                rank: 'MEMBER'
            });

            const result = await guildManager.transferLeadership(leaderId, outsiderId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('New leader must be in your guild');
        });
    });

    describe('GuildManager - Update Guild Info', () => {
        test('should update guild info successfully', async () => {
            const playerId = 'officer1';
            const updates = { description: 'New description', motd: 'Welcome!' };

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });
            mockDb.updateGuildInfo.mockResolvedValue({
                id: 'guild1',
                description: 'New description',
                motd: 'Welcome!'
            });

            const result = await guildManager.updateGuildInfo(playerId, updates);

            expect(result.success).toBe(true);
            expect(mockDb.updateGuildInfo).toHaveBeenCalledWith('guild1', updates);
        });

        test('should fail if not officer', async () => {
            const playerId = 'member1';
            const updates = { description: 'Test' };

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });

            const result = await guildManager.updateGuildInfo(playerId, updates);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can update guild info');
        });
    });

    describe('GuildManager - Get Player Guild Info', () => {
        test('should return guild info for player in guild', async () => {
            const playerId = 'member1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild1',
                name: 'Test Guild',
                tag: 'TEST'
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'member1', username: 'member1' }
            ]);

            const result = await guildManager.getPlayerGuildInfo(playerId);

            expect(result.success).toBe(true);
            expect(result.guild).toBeDefined();
            expect(result.guild.myRank).toBe('MEMBER');
        });

        test('should return null if player not in guild', async () => {
            const playerId = 'noguild';

            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await guildManager.getPlayerGuildInfo(playerId);

            expect(result.success).toBe(true);
            expect(result.guild).toBeNull();
        });
    });

    describe('GuildManager - Player Online/Offline', () => {
        test('should handle player coming online', async () => {
            const playerId = 'member1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1'
            });
            mockDb.updateLastActive.mockResolvedValue();

            await guildManager.handlePlayerOnline(playerId);

            expect(guildManager.onlineMembers.get('guild1')).toContain(playerId);
        });

        test('should handle player going offline', async () => {
            const playerId = 'member1';

            guildManager.onlineMembers.set('guild1', new Set([playerId, 'member2']));
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1'
            });

            await guildManager.handlePlayerOffline(playerId);

            expect(guildManager.onlineMembers.get('guild1').has(playerId)).toBe(false);
        });

        test('isPlayerOnline should return correct status', async () => {
            guildManager.onlineMembers.set('guild1', new Set(['member1', 'member2']));

            expect(guildManager.isPlayerOnline('guild1', 'member1')).toBe(true);
            expect(guildManager.isPlayerOnline('guild1', 'offline_member')).toBe(false);
            expect(guildManager.isPlayerOnline('nonexistent_guild', 'member1')).toBe(false);
        });

        test('getOnlineMembers should return set of members', () => {
            guildManager.onlineMembers.set('guild1', new Set(['member1', 'member2']));

            const members = guildManager.getOnlineMembers('guild1');
            expect(members.size).toBe(2);
            expect(members.has('member1')).toBe(true);
        });

        test('getOnlineMembers should return empty set if guild not found', () => {
            const members = guildManager.getOnlineMembers('nonexistent');
            expect(members).toBeInstanceOf(Set);
            expect(members.size).toBe(0);
        });

        test('setPlayerOnline should work with guildId parameter', async () => {
            const playerId = 'member1';
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1'
            });

            await guildManager.setPlayerOnline('guild1', playerId);

            expect(guildManager.onlineMembers.get('guild1')).toContain(playerId);
        });

        test('setPlayerOffline should work with guildId parameter', async () => {
            const playerId = 'member1';
            guildManager.onlineMembers.set('guild1', new Set([playerId]));

            await guildManager.setPlayerOffline('guild1', playerId);

            expect(guildManager.onlineMembers.get('guild1').has(playerId)).toBe(false);
        });
    });

    describe('GuildInvitationManager - Create Invitation', () => {
        test('should create invitation successfully', async () => {
            const guildId = 'guild1';
            const inviterId = 'officer1';
            const inviteeId = 'newplayer1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: guildId,
                rank: 'OFFICER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce(null);
            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                memberCount: 5,
                maxMembers: 50,
                name: 'Test Guild',
                tag: 'TEST'
            });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            mockDb.createInvitation.mockResolvedValue({
                id: 'invite1',
                guild_id: guildId,
                inviter_id: inviterId,
                invitee_id: inviteeId,
                status: 'PENDING'
            });

            const result = await invitationManager.createInvitation(guildId, inviterId, inviteeId);

            expect(result.success).toBe(true);
            expect(result.invitation).toBeDefined();
        });

        test('should fail if too many guild invitations', async () => {
            const guildId = 'guild1';
            const inviterId = 'officer1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: guildId,
                rank: 'OFFICER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce(null);
            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                memberCount: 5,
                maxMembers: 50
            });
            mockDb.getGuildInvitations.mockResolvedValue(
                Array(50).fill({ status: 'PENDING' })
            );

            const result = await invitationManager.createInvitation(guildId, inviterId, 'newplayer');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Too many pending invitations');
        });

        test('should fail if too many player invitations', async () => {
            const guildId = 'guild1';
            const inviterId = 'officer1';
            const inviteeId = 'newplayer1';

            mockDb.getPlayerGuild.mockResolvedValueOnce({
                guild_id: guildId,
                rank: 'OFFICER'
            });
            mockDb.getPlayerGuild.mockResolvedValueOnce(null);
            mockDb.getGuildById.mockResolvedValue({
                id: guildId,
                memberCount: 5,
                maxMembers: 50
            });
            mockDb.getGuildInvitations.mockResolvedValue([]);
            mockDb.getPlayerInvitations.mockResolvedValue(
                Array(10).fill({ id: 'invite' })
            );

            const result = await invitationManager.createInvitation(guildId, inviterId, inviteeId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Player has too many pending invitations');
        });
    });

    describe('GuildInvitationManager - Accept/Decline Invitation', () => {
        test('should accept invitation successfully', async () => {
            const playerId = 'player1';
            const invitationId = 'invite1';

            mockDb.getInvitationById.mockResolvedValue({
                id: invitationId,
                invitee_id: playerId,
                status: 'PENDING',
                guild_id: 'guild1',
                inviter_id: 'inviter1'
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.getPlayerInvitations.mockResolvedValue([]);
            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'inviter1', username: 'Inviter' });
            mockDb.getGuildMembers.mockResolvedValue([]);
            
            // Mock respondToInvitation do guildManager
            guildManager.respondToInvitation = jest.fn().mockResolvedValue({
                success: true,
                invitation: {
                    id: invitationId,
                    guild_id: 'guild1',
                    status: 'ACCEPTED'
                },
                guild: {
                    id: 'guild1',
                    name: 'Test Guild',
                    tag: 'TEST'
                }
            });

            const result = await invitationManager.acceptInvitation(playerId, invitationId);

            expect(result.success).toBe(true);
        });

        test('should decline invitation successfully', async () => {
            const playerId = 'player1';
            const invitationId = 'invite1';

            mockDb.getInvitationById.mockResolvedValue({
                id: invitationId,
                invitee_id: playerId,
                status: 'PENDING'
            });
            mockDb.respondToInvitation.mockResolvedValue({
                id: invitationId,
                status: 'DECLINED'
            });

            const result = await invitationManager.declineInvitation(playerId, invitationId);

            expect(result.success).toBe(true);
        });

        test('should fail if invitation not found', async () => {
            mockDb.getInvitationById.mockResolvedValue(null);

            const result = await invitationManager.acceptInvitation('player1', 'invalid');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invitation not found or expired');
        });

        test('should fail if invitation not for this player', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'invite1',
                invitee_id: 'otherplayer',
                status: 'PENDING'
            });

            const result = await invitationManager.acceptInvitation('player1', 'invite1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Not your invitation');
        });

        test('should fail if invitation already processed', async () => {
            mockDb.getInvitationById.mockResolvedValue({
                id: 'invite1',
                invitee_id: 'player1',
                status: 'ACCEPTED'
            });

            const result = await invitationManager.acceptInvitation('player1', 'invite1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invitation already processed');
        });
    });

    describe('GuildInvitationManager - Cleanup', () => {
        test('should cleanup expired invitations', async () => {
            mockDb.cleanupExpiredInvitations.mockResolvedValue(5);

            const result = await invitationManager.cleanupExpiredInvitations();

            expect(result.success).toBe(true);
            expect(result.count).toBe(5);
        });

        test('should handle cleanup errors gracefully', async () => {
            mockDb.cleanupExpiredInvitations.mockRejectedValue(new Error('DB error'));

            const result = await invitationManager.cleanupExpiredInvitations();

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('GuildChatHandler - Handle Chat', () => {
        test('should send chat message successfully', async () => {
            const playerId = 'member1';
            const message = 'Hello guild!';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                username: 'TestPlayer'
            });
            mockDb.saveChatMessage.mockResolvedValue({
                id: 'msg1',
                sent_at: new Date().toISOString()
            });

            const result = await chatHandler.handleChat(playerId, message);

            expect(result.success).toBe(true);
            expect(mockDb.saveChatMessage).toHaveBeenCalled();
        });

        test('should fail with empty message', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });

            const result = await chatHandler.handleChat('member1', '');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Message cannot be empty');
        });

        test('should fail with message too long', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });

            const longMessage = 'A'.repeat(501);
            const result = await chatHandler.handleChat('member1', longMessage);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Message too long');
        });

        test('should fail if not in guild', async () => {
            mockDb.getPlayerGuild.mockResolvedValue(null);

            const result = await chatHandler.handleChat('noguild', 'Hello');

            expect(result.success).toBe(false);
            expect(result.error).toContain('You are not in a guild');
        });

        test('should enforce rate limiting', async () => {
            const playerId = 'member1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                username: 'TestPlayer'
            });
            mockDb.saveChatMessage.mockResolvedValue({
                id: 'msg1',
                sent_at: new Date().toISOString()
            });

            // Send max allowed messages
            for (let i = 0; i < 5; i++) {
                const result = await chatHandler.handleChat(playerId, `Message ${i}`);
                expect(result.success).toBe(true);
            }

            // 6th message should be rate limited
            const result = await chatHandler.handleChat(playerId, 'Message 6');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Rate limit exceeded');
        });
    });

    describe('GuildChatHandler - Officer Chat', () => {
        test('should allow officers to send officer chat', async () => {
            const playerId = 'officer1';

            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'OFFICER'
            });
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: playerId,
                username: 'OfficerPlayer'
            });
            mockDb.saveChatMessage.mockResolvedValue({
                id: 'msg1',
                sent_at: new Date().toISOString()
            });

            const result = await chatHandler.handleOfficerChat(playerId, 'Officer message');

            expect(result.success).toBe(true);
        });

        test('should reject regular members from officer chat', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 'guild1',
                rank: 'MEMBER'
            });

            const result = await chatHandler.handleOfficerChat('member1', 'Test');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Only officers can use officer chat');
        });
    });

    describe('GuildChatHandler - Rate Limiting', () => {
        test('checkRateLimit should allow messages within limit', () => {
            const playerId = 'member1';
            
            // First 5 messages should be allowed
            for (let i = 0; i < 5; i++) {
                expect(chatHandler.checkRateLimit(playerId)).toBe(true);
            }
            
            // 6th message should be rate limited
            expect(chatHandler.checkRateLimit(playerId)).toBe(false);
        });

        test('checkRateLimit should work with new player', () => {
            const playerId = 'newplayer';
            
            // First message should always be allowed
            const result = chatHandler.checkRateLimit(playerId);
            expect(result).toBe(true);
            
            // Should track the player
            expect(chatHandler.playerMessageCounts.has(playerId)).toBe(true);
        });

        test('cleanupRateLimits should remove expired entries', async () => {
            const playerId = 'member1';
            chatHandler.cooldownMs = 1; // 1ms for testing

            chatHandler.checkRateLimit(playerId);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 10));

            chatHandler.cleanupRateLimits();

            expect(chatHandler.playerMessageCounts.has(playerId)).toBe(false);
        });
    });

    describe('GuildManager - Browse Guilds', () => {
        test('should browse guilds successfully', async () => {
            const filters = { minLevel: 1, maxSize: 50 };

            mockDb.browseGuilds.mockResolvedValue([
                { id: 'guild1', name: 'Guild One', tag: 'G1' },
                { id: 'guild2', name: 'Guild Two', tag: 'G2' }
            ]);

            const result = await guildManager.browseGuilds(filters);

            expect(result.success).toBe(true);
            expect(result.guilds).toHaveLength(2);
        });

        test('should handle browse errors', async () => {
            mockDb.browseGuilds.mockRejectedValue(new Error('DB error'));

            const result = await guildManager.browseGuilds({});

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });

    describe('GuildManager - Get Player Invitations', () => {
        test('should get player invitations successfully', async () => {
            mockDb.getPlayerInvitations.mockResolvedValue([
                { id: 'invite1', guild_id: 'guild1', inviter_id: 'inviter1' }
            ]);
            mockDb.getGuildById.mockResolvedValue({
                id: 'guild1',
                name: 'Test Guild',
                tag: 'TEST'
            });
            mockPlayerManager.getPlayer.mockResolvedValue({
                id: 'inviter1',
                username: 'InviterPlayer'
            });

            const result = await guildManager.getPlayerInvitations('player1');

            expect(result.success).toBe(true);
            expect(result.invitations).toHaveLength(1);
        });

        test('should handle errors getting invitations', async () => {
            mockDb.getPlayerInvitations.mockRejectedValue(new Error('DB error'));

            const result = await guildManager.getPlayerInvitations('player1');

            expect(result.success).toBe(false);
            expect(result.error).toContain('DB error');
        });
    });
});
