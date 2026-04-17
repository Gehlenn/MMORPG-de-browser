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
            run: jest.fn(),
            get: jest.fn(),
            all: jest.fn()
        };
        mockPlayerManager = {
            getPlayer: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };
    });

    test('GuildDatabase methods exist', () => {
        const db = new GuildDatabase(mockDb);
        expect(typeof db.createGuild).toBe('function');
        expect(typeof db.disbandGuild).toBe('function');
        expect(typeof db.getGuildById).toBe('function');
        expect(typeof db.formatGuild).toBe('function');
    });

    test('GuildManager methods exist', () => {
        const gm = new GuildManager(mockDb, mockPlayerManager);
        expect(typeof gm.createGuild).toBe('function');
        expect(typeof gm.disbandGuild).toBe('function');
        expect(typeof gm.getPlayerGuildInfo).toBe('function');
    });

    test('GuildManager constants', () => {
        const gm = new GuildManager(mockDb, mockPlayerManager);
        expect(gm.GUILD_CREATE_COST).toBe(10000);
        expect(gm.GUILD_CREATE_MIN_LEVEL).toBe(10);
    });

    test('GuildChatHandler methods exist', () => {
        const gm = { playerManager: mockPlayerManager, on: jest.fn(), getOnlineGuildMembers: jest.fn() };
        const ch = new GuildChatHandler(gm, mockDb);
        expect(typeof ch.handleChat).toBe('function');
        expect(typeof ch.getChatHistory).toBe('function');
    });

    test('GuildChatHandler constants', () => {
        const gm = { playerManager: mockPlayerManager, on: jest.fn(), getOnlineGuildMembers: jest.fn() };
        const ch = new GuildChatHandler(gm, mockDb);
        expect(ch.cooldownMs).toBe(10000);
        expect(ch.maxMessages).toBe(5);
    });

    test('GuildInvitationManager methods exist', () => {
        const gm = { playerManager: mockPlayerManager, on: jest.fn() };
        const im = new GuildInvitationManager(gm, mockDb);
        expect(typeof im.createInvitation).toBe('function');
        expect(typeof im.acceptInvitation).toBe('function');
    });

    test('GuildInvitationManager constants', () => {
        const gm = { playerManager: mockPlayerManager, on: jest.fn() };
        const im = new GuildInvitationManager(gm, mockDb);
        expect(im.EXPIRATION_HOURS).toBe(24);
        expect(im.MAX_GUILD_INVITATIONS).toBe(50);
    });
});
