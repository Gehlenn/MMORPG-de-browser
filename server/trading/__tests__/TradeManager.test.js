/**
 * TradeManager.test.js
 * Unit tests for TradeManager
 * Phase 2: Trading & Economy
 */

const TradeManager = require('../TradeManager');

describe('TradeManager', () => {
    let tradeManager;
    let mockDb;
    let mockPlayerManager;
    let mockInventoryManager;

    beforeEach(() => {
        jest.clearAllMocks();

        mockDb = {
            get: jest.fn((sql, params, callback) => callback(null, null)),
            all: jest.fn((sql, params, callback) => callback(null, [])),
            run: jest.fn((sql, params, callback) => {
                if (callback) callback.call({ lastID: 1, changes: 1 }, null);
            })
        };

        mockPlayerManager = {
            getPlayer: jest.fn(),
            updateGold: jest.fn(),
            sendToPlayer: jest.fn()
        };

        mockInventoryManager = {
            hasItem: jest.fn(),
            removeItem: jest.fn(),
            addItem: jest.fn()
        };

        tradeManager = new TradeManager(mockDb, mockPlayerManager, mockInventoryManager);
    });

    describe('initialize', () => {
        test('should initialize successfully', async () => {
            const emitSpy = jest.spyOn(tradeManager, 'emit');
            await tradeManager.initialize();
            expect(emitSpy).toHaveBeenCalledWith('initialized');
        });
    });

    describe('requestTrade', () => {
        test('should create trade request successfully', async () => {
            mockPlayerManager.getPlayer
                .mockResolvedValueOnce({ id: 'p1', username: 'Player1' })
                .mockResolvedValueOnce({ id: 'p2', username: 'Player2' });

            const result = await tradeManager.requestTrade('p1', 'p2');

            expect(result.success).toBe(true);
            expect(result.sessionId).toBeDefined();
            expect(mockDb.run).toHaveBeenCalled();
        });

        test('should fail if player not found', async () => {
            mockPlayerManager.getPlayer.mockResolvedValue(null);

            const result = await tradeManager.requestTrade('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Player not found');
        });

        test('should fail if trading with self', async () => {
            const result = await tradeManager.requestTrade('p1', 'p1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot trade with yourself');
        });

        test('should fail if player already in trade', async () => {
            mockPlayerManager.getPlayer
                .mockResolvedValueOnce({ id: 'p1' })
                .mockResolvedValueOnce({ id: 'p2' });

            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, { id: 'existing-session' });
            });

            const result = await tradeManager.requestTrade('p1', 'p2');

            expect(result.success).toBe(false);
            expect(result.error).toBe('You are already in a trade');
        });
    });

    describe('acceptTrade', () => {
        test('should accept trade successfully', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'PENDING'
                });
            });

            const result = await tradeManager.acceptTrade('p2', 'session-1');

            expect(result.success).toBe(true);
            expect(result.session).toBeDefined();
        });

        test('should fail if not authorized', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'PENDING'
                });
            });

            const result = await tradeManager.acceptTrade('p3', 'session-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Not authorized to accept this trade');
        });

        test('should fail if trade not pending', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'ACTIVE'
                });
            });

            const result = await tradeManager.acceptTrade('p2', 'session-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Trade is no longer pending');
        });
    });

    describe('addGold', () => {
        test('should add gold successfully', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'ACTIVE',
                    player1_confirmed: 0,
                    player2_confirmed: 0,
                    player1_gold: 0,
                    player2_gold: 0
                });
            });

            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', gold: 1000 });

            const result = await tradeManager.addGold('p1', 'session-1', 100);

            expect(result.success).toBe(true);
            expect(result.gold).toBe(100);
        });

        test('should fail if insufficient gold', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'ACTIVE',
                    player1_gold: 0,
                    player2_gold: 0
                });
            });

            mockPlayerManager.getPlayer.mockResolvedValue({ id: 'p1', gold: 50 });

            const result = await tradeManager.addGold('p1', 'session-1', 100);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Insufficient gold');
        });

        test('should fail if trade not active', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    status: 'COMPLETED'
                });
            });

            const result = await tradeManager.addGold('p1', 'session-1', 100);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Trade not active');
        });
    });

    describe('addItem', () => {
        test('should add item successfully', async () => {
            const mockItem = { id: 'item-1', name: 'Sword' };

            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('trade_sessions')) {
                    callback(null, {
                        id: 'session-1',
                        player1_id: 'p1',
                        player2_id: 'p2',
                        status: 'ACTIVE',
                        player1_confirmed: 0,
                        player2_confirmed: 0
                    });
                } else {
                    callback(null, null); // No existing item in slot
                }
            });

            mockInventoryManager.hasItem.mockResolvedValue(true);

            const result = await tradeManager.addItem('p1', 'session-1', mockItem, 0);

            expect(result.success).toBe(true);
            expect(result.item).toEqual(mockItem);
            expect(mockDb.run).toHaveBeenCalled();
        });

        test('should fail if slot occupied', async () => {
            const mockItem = { id: 'item-1', name: 'Sword' };

            mockDb.get.mockImplementation((sql, params, callback) => {
                if (sql.includes('trade_sessions')) {
                    callback(null, {
                        id: 'session-1',
                        player1_id: 'p1',
                        player2_id: 'p2',
                        status: 'ACTIVE'
                    });
                } else {
                    callback(null, { id: 'existing-item' }); // Slot occupied
                }
            });

            const result = await tradeManager.addItem('p1', 'session-1', mockItem, 0);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Slot already occupied');
        });

        test('should fail if item not in inventory', async () => {
            const mockItem = { id: 'item-1', name: 'Sword' };

            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'ACTIVE'
                });
            });

            mockInventoryManager.hasItem.mockResolvedValue(false);

            const result = await tradeManager.addItem('p1', 'session-1', mockItem, 0);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Item not in inventory');
        });
    });

    describe('confirmTrade', () => {
        test('should confirm trade successfully', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'ACTIVE',
                    player1_confirmed: 0,
                    player2_confirmed: 0
                });
            });

            const result = await tradeManager.confirmTrade('p1', 'session-1');

            expect(result.success).toBe(true);
            expect(result.confirmed).toBe(true);
            expect(result.waitingForOther).toBe(true);
        });

        test('should complete trade when both confirm', async () => {
            const emitSpy = jest.spyOn(tradeManager, 'emit');

            // First player confirms
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'ACTIVE',
                    player1_confirmed: 1, // Already confirmed
                    player2_confirmed: 0,
                    player1_gold: 100,
                    player2_gold: 50
                });
            });

            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, []); // No items
            });

            mockPlayerManager.getPlayer
                .mockResolvedValueOnce({ id: 'p1', gold: 900 })
                .mockResolvedValueOnce({ id: 'p2', gold: 950 });

            const result = await tradeManager.confirmTrade('p2', 'session-1');

            expect(result.success).toBe(true);
            expect(mockPlayerManager.updateGold).toHaveBeenCalled();
        });
    });

    describe('cancelTrade', () => {
        test('should cancel trade successfully', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    player1_id: 'p1',
                    player2_id: 'p2',
                    status: 'ACTIVE'
                });
            });

            const result = await tradeManager.cancelTrade('session-1', 'CANCELLED');

            expect(result.success).toBe(true);
            expect(result.reason).toBe('CANCELLED');
        });

        test('should fail if trade already completed', async () => {
            mockDb.get.mockImplementation((sql, params, callback) => {
                callback(null, {
                    id: 'session-1',
                    status: 'COMPLETED'
                });
            });

            const result = await tradeManager.cancelTrade('session-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Trade already finalized');
        });
    });

    describe('formatSession', () => {
        test('should format session correctly', async () => {
            mockDb.all.mockImplementation((sql, params, callback) => {
                callback(null, []);
            });

            const session = {
                id: 'session-1',
                player1_id: 'p1',
                player2_id: 'p2',
                player1_gold: 100,
                player2_gold: 50,
                player1_confirmed: 1,
                player2_confirmed: 0
            };

            const result = await tradeManager.formatSession(session);

            expect(result.id).toBe('session-1');
            expect(result.player1.id).toBe('p1');
            expect(result.player1.gold).toBe(100);
            expect(result.player1.confirmed).toBe(true);
        });
    });
});
