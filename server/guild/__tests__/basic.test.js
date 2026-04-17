/**
 * Guild System Basic Tests
 */

const GuildDatabase = require('../GuildDatabase');
const GuildManager = require('../GuildManager');
const GuildChatHandler = require('../GuildChatHandler');
const GuildInvitationManager = require('../GuildInvitationManager');

describe('Guild System', () => {
    let mockDb, mockPlayerManager;

    beforeEach(() => {
        jest.clearAllMocks();
        mockDb = {
            run: jest.fn(function(s, p, c) { if(c) c.call(this, null); }),
            get: jest.fn(function(s, p, c) { if(c) c(null, null); }),
            all: jest.fn(function(s, p, c) { if(c) c(null, []); })
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };
    });

    test('GuildDatabase has all methods', () => {
        const db = new GuildDatabase(mockDb);
        ['createGuild', 'disbandGuild', 'getGuildById', 'getGuildByName',
         'getGuildByTag', 'getPlayerGuild', 'getGuildMembers', 'formatGuild',
         'browseGuilds', 'saveChatMessage', 'getChatHistory'].forEach(m => {
            expect(typeof db[m]).toBe('function');
        });
    });

    test('GuildManager has all methods', () => {
        const gm = new GuildManager(mockDb, mockPlayerManager);
        ['initialize', 'createGuild', 'disbandGuild', 'invitePlayer', 'respondToInvitation',
         'leaveGuild', 'kickMember', 'promoteMember', 'transferLeadership',
         'updateGuildInfo', 'getPlayerGuildInfo', 'getPlayerInvitations',
         'browseGuilds', 'handlePlayerOnline', 'handlePlayerOffline'].forEach(m => {
            expect(typeof gm[m]).toBe('function');
        });
    });

    test('GuildChatHandler has all methods', () => {
        const mockGm = { playerManager: mockPlayerManager, on: jest.fn(), getOnlineGuildMembers: jest.fn() };
        const ch = new GuildChatHandler(mockGm, mockDb);
        ['handleChat', 'handleOfficerChat', 'getChatHistory', 'sendSystemMessage',
         'broadcastMessage', 'checkRateLimit'].forEach(m => {
            expect(typeof ch[m]).toBe('function');
        });
    });

    test('GuildInvitationManager has all methods', () => {
        const im = new GuildInvitationManager({ playerManager: mockPlayerManager }, mockDb);
        ['createInvitation', 'cancelInvitation', 'acceptInvitation', 'declineInvitation',
         'getPlayerInvitations', 'getGuildInvitations'].forEach(m => {
            expect(typeof im[m]).toBe('function');
        });
    });

    test('GuildManager constants', () => {
        const gm = new GuildManager(mockDb, mockPlayerManager);
        expect(gm.GUILD_CREATE_COST).toBe(10000);
        expect(gm.GUILD_CREATE_MIN_LEVEL).toBe(10);
    });

    test('GuildChatHandler rate limits', () => {
        const mockGm = { playerManager: mockPlayerManager, on: jest.fn(), getOnlineGuildMembers: jest.fn() };
        const ch = new GuildChatHandler(mockGm, mockDb);
        expect(ch.cooldownMs).toBe(10000);
        expect(ch.maxMessages).toBe(5);
    });

    test('GuildInvitationManager constants', () => {
        const im = new GuildInvitationManager({ playerManager: mockPlayerManager }, mockDb);
        expect(im.EXPIRATION_HOURS).toBe(24);
        expect(im.MAX_GUILD_INVITATIONS).toBe(50);
        expect(im.MAX_PLAYER_INVITATIONS).toBe(10);
    });
});
