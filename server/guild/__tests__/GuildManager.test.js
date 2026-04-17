/**
 * GuildManager.test.js
 * Unit tests for GuildManager
 */

const GuildManager = require('../GuildManager');
const EventEmitter = require('events');

// Mock dependencies
const mockDb = {
    createGuild: jest.fn(),
    getGuildById: jest.fn(),
    addMember: jest.fn(),
    getPlayerGuild: jest.fn(),
    createInvitation: jest.fn(),
    getPendingInvitations: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRank: jest.fn(),
    transferLeadership: jest.fn(),
    updateGuild: jest.fn(),
    disbandGuild: jest.fn(),
    getGuildMembers: jest.fn(),
    getPlayerGuildWithDetails: jest.fn(),
    browseGuilds: jest.fn()
};

const mockPlayerDataManager = {
    getPlayerData: jest.fn(),
    deductGold: jest.fn()
};

const mockNetworkManager = {
    sendToPlayer: jest.fn(),
    broadcast: jest.fn()
};

describe('GuildManager', () => {
    let guildManager;

    beforeEach(() => {
        guildManager = new GuildManager(mockDb, mockPlayerDataManager, mockNetworkManager);
        guildManager.onlinePlayers.clear();
        jest.clearAllMocks();
    });

    describe('createGuild', () => {
        test('should create guild when requirements met', async () => {
            mockPlayerDataManager.getPlayerData.mockResolvedValue({
                id: 'player123',
                level: 15,
                gold: 15000
            });
            mockDb.getPlayerGuild.mockResolvedValue(null);
            mockDb.createGuild.mockResolvedValue({
                id: 1,
                name: 'Test Guild',
                tag: 'TEST'
            });
            mockDb.addMember.mockResolvedValue({ id: 1 });
            mockPlayerDataManager.deductGold.mockResolvedValue(true);

            const result = await guildManager.createGuild('player123', {
                name: 'Test Guild',
                tag: 'TEST',
                description: 'Test'
            });

            expect(result.success).toBe(true);
            expect(result.guild).toHaveProperty('id', 1);
            expect(mockDb.createGuild).toHaveBeenCalled();
            expect(mockPlayerDataManager.deductGold).toHaveBeenCalledWith('player123', 10000);
        });

        test('should fail when player level too low', async () => {
            mockPlayerDataManager.getPlayerData.mockResolvedValue({
                id: 'player123',
                level: 5,
                gold: 15000
            });

            const result = await guildManager.createGuild('player123', {
                name: 'Test Guild',
                tag: 'TEST'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('level 10');
        });

        test('should fail when insufficient gold', async () => {
            mockPlayerDataManager.getPlayerData.mockResolvedValue({
                id: 'player123',
                level: 15,
                gold: 5000
            });

            const result = await guildManager.createGuild('player123', {
                name: 'Test Guild',
                tag: 'TEST'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('10,000 gold');
        });

        test('should fail when player already in guild', async () => {
            mockPlayerDataManager.getPlayerData.mockResolvedValue({
                id: 'player123',
                level: 15,
                gold: 15000
            });
            mockDb.getPlayerGuild.mockResolvedValue({ guild_id: 1 });

            const result = await guildManager.createGuild('player123', {
                name: 'Test Guild',
                tag: 'TEST'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('already in a guild');
        });
    });

    describe('invitePlayer', () => {
        test('should create invitation when officer invites', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 1,
                rank: 'OFFICER'
            });
            mockDb.createInvitation.mockResolvedValue({
                id: 1,
                guild_id: 1,
                inviter_id: 'player123',
                invitee_id: 'player456'
            });

            const result = await guildManager.invitePlayer('player123', 1, 'TargetPlayer');

            expect(result.success).toBe(true);
            expect(mockDb.createInvitation).toHaveBeenCalled();
        });

        test('should fail when member tries to invite', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 1,
                rank: 'MEMBER'
            });

            const result = await guildManager.invitePlayer('player123', 1, 'TargetPlayer');

            expect(result.success).toBe(false);
            expect(result.error).toContain('permission');
        });
    });

    describe('respondToInvitation', () => {
        test('should accept invitation and add member', async () => {
            mockDb.getPendingInvitations.mockResolvedValue([{
                id: 1,
                guild_id: 1,
                guild_name: 'Test Guild',
                tag: 'TEST'
            }]);
            mockDb.acceptInvitation.mockResolvedValue(true);
            mockDb.addMember.mockResolvedValue({ id: 1 });

            const result = await guildManager.respondToInvitation('player123', 1, true);

            expect(result.success).toBe(true);
            expect(mockDb.addMember).toHaveBeenCalledWith(1, 'player123', 'INITIATE');
        });

        test('should decline invitation', async () => {
            mockDb.getPendingInvitations.mockResolvedValue([{
                id: 1,
                guild_id: 1
            }]);
            mockDb.declineInvitation.mockResolvedValue(true);

            const result = await guildManager.respondToInvitation('player123', 1, false);

            expect(result.success).toBe(true);
            expect(mockDb.declineInvitation).toHaveBeenCalled();
        });
    });

    describe('kickMember', () => {
        test('should allow leader to kick member', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 1,
                rank: 'LEADER'
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player123', rank: 'LEADER' },
                { player_id: 'player456', rank: 'MEMBER' }
            ]);
            mockDb.removeMember.mockResolvedValue(true);

            const result = await guildManager.kickMember('player123', 'player456');

            expect(result.success).toBe(true);
            expect(mockDb.removeMember).toHaveBeenCalledWith(1, 'player456');
        });

        test('should fail when kicking leader', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 1,
                rank: 'OFFICER'
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player123', rank: 'OFFICER' },
                { player_id: 'player456', rank: 'LEADER' }
            ]);

            const result = await guildManager.kickMember('player123', 'player456');

            expect(result.success).toBe(false);
            expect(result.error).toContain('cannot kick leader');
        });
    });

    describe('promoteMember', () => {
        test('should allow leader to promote', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 1,
                rank: 'LEADER'
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player456', rank: 'MEMBER' }
            ]);
            mockDb.updateMemberRank.mockResolvedValue(true);

            const result = await guildManager.promoteMember('player123', 'player456', 'OFFICER');

            expect(result.success).toBe(true);
            expect(mockDb.updateMemberRank).toHaveBeenCalledWith(1, 'player456', 'OFFICER');
        });
    });

    describe('transferLeadership', () => {
        test('should transfer leadership', async () => {
            mockDb.getPlayerGuild.mockResolvedValue({
                guild_id: 1,
                rank: 'LEADER'
            });
            mockDb.getGuildMembers.mockResolvedValue([
                { player_id: 'player456', rank: 'OFFICER' }
            ]);
            mockDb.transferLeadership.mockResolvedValue(true);

            const result = await guildManager.transferLeadership('player123', 'player456');

            expect(result.success).toBe(true);
            expect(mockDb.transferLeadership).toHaveBeenCalledWith(1, 'player123', 'player456');
        });
    });

    describe('online status', () => {
        test('should track online players', () => {
            guildManager.handlePlayerOnline('player123');
            expect(guildManager.onlinePlayers.has('player123')).toBe(true);

            guildManager.handlePlayerOffline('player123');
            expect(guildManager.onlinePlayers.has('player123')).toBe(false);
        });

        test('should return online count', () => {
            guildManager.handlePlayerOnline('player1');
            guildManager.handlePlayerOnline('player2');

            expect(guildManager.getOnlineCount()).toBe(2);
        });
    });
});
