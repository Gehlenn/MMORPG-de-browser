/**
 * TradeManager.js
 * Handles player-to-player trading system
 * Phase 2: Trading & Economy
 */

const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class TradeManager extends EventEmitter {
    constructor(database, playerManager, inventoryManager) {
        super();
        this.db = database;
        this.playerManager = playerManager;
        this.inventoryManager = inventoryManager;
        this.activeSessions = new Map(); // In-memory session cache
        this.requestTimeouts = new Map(); // Trade request timeouts
    }

    /**
     * Initialize the trade manager
     */
    async initialize() {
        console.log('💱 TradeManager initialized');
        this.emit('initialized');
    }

    /**
     * Request a trade with another player
     * @param {string} requesterId - Player requesting trade
     * @param {string} targetId - Target player
     * @returns {Promise<Object>}
     */
    async requestTrade(requesterId, targetId) {
        try {
            // Validate players
            const requester = await this.playerManager.getPlayer(requesterId);
            const target = await this.playerManager.getPlayer(targetId);

            if (!requester || !target) {
                return { success: false, error: 'Player not found' };
            }

            if (requesterId === targetId) {
                return { success: false, error: 'Cannot trade with yourself' };
            }

            // Check if either player is already in a trade
            const existingRequester = await this.getPlayerActiveTrade(requesterId);
            const existingTarget = await this.getPlayerActiveTrade(targetId);

            if (existingRequester) {
                return { success: false, error: 'You are already in a trade' };
            }

            if (existingTarget) {
                return { success: false, error: 'Player is already in a trade' };
            }

            // Check pending request timeout
            const pendingKey = `${requesterId}-${targetId}`;
            if (this.requestTimeouts.has(pendingKey)) {
                return { success: false, error: 'Trade request already pending' };
            }

            // Create trade session
            const sessionId = uuidv4();
            const session = {
                id: sessionId,
                player1_id: requesterId,
                player2_id: targetId,
                status: 'PENDING',
                player1_confirmed: 0,
                player2_confirmed: 0,
                player1_gold: 0,
                player2_gold: 0,
                created_at: new Date().toISOString()
            };

            // Save to database
            await this.saveSession(session);
            this.activeSessions.set(sessionId, session);

            // Set timeout for request (30 seconds)
            const timeout = setTimeout(() => {
                this.cancelTrade(sessionId, 'TIMEOUT');
            }, 30000);
            this.requestTimeouts.set(pendingKey, timeout);

            this.emit('trade:requested', {
                sessionId,
                requesterId,
                requesterName: requester.username,
                targetId,
                targetName: target.username
            });

            return {
                success: true,
                sessionId,
                message: 'Trade request sent'
            };

        } catch (error) {
            console.error('Trade request error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Accept a trade request
     * @param {string} playerId - Player accepting
     * @param {string} sessionId - Trade session ID
     * @returns {Promise<Object>}
     */
    async acceptTrade(playerId, sessionId) {
        try {
            const session = await this.getSession(sessionId);

            if (!session) {
                return { success: false, error: 'Trade session not found' };
            }

            if (session.status !== 'PENDING') {
                return { success: false, error: 'Trade is no longer pending' };
            }

            if (session.player2_id !== playerId) {
                return { success: false, error: 'Not authorized to accept this trade' };
            }

            // Update session status
            session.status = 'ACTIVE';
            await this.updateSession(session);

            // Clear timeout
            const pendingKey = `${session.player1_id}-${session.player2_id}`;
            if (this.requestTimeouts.has(pendingKey)) {
                clearTimeout(this.requestTimeouts.get(pendingKey));
                this.requestTimeouts.delete(pendingKey);
            }

            this.emit('trade:accepted', { sessionId, playerId });

            return {
                success: true,
                sessionId,
                session: await this.formatSession(session),
                message: 'Trade accepted'
            };

        } catch (error) {
            console.error('Accept trade error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Decline a trade request
     * @param {string} playerId - Player declining
     * @param {string} sessionId - Trade session ID
     * @returns {Promise<Object>}
     */
    async declineTrade(playerId, sessionId) {
        try {
            const session = await this.getSession(sessionId);

            if (!session) {
                return { success: false, error: 'Trade session not found' };
            }

            if (session.player2_id !== playerId) {
                return { success: false, error: 'Not authorized' };
            }

            // Cancel the trade
            await this.cancelTrade(sessionId, 'DECLINED');

            return {
                success: true,
                message: 'Trade declined'
            };

        } catch (error) {
            console.error('Decline trade error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add gold to trade
     * @param {string} playerId - Player adding gold
     * @param {string} sessionId - Trade session ID
     * @param {number} amount - Gold amount
     * @returns {Promise<Object>}
     */
    async addGold(playerId, sessionId, amount) {
        try {
            const session = await this.getSession(sessionId);

            if (!session || session.status !== 'ACTIVE') {
                return { success: false, error: 'Trade not active' };
            }

            // Validate player is in trade
            const isPlayer1 = session.player1_id === playerId;
            const isPlayer2 = session.player2_id === playerId;

            if (!isPlayer1 && !isPlayer2) {
                return { success: false, error: 'Not in this trade' };
            }

            // Validate gold amount
            if (amount < 0) {
                return { success: false, error: 'Invalid gold amount' };
            }

            // Check player has enough gold
            const player = await this.playerManager.getPlayer(playerId);
            if (player.gold < amount) {
                return { success: false, error: 'Insufficient gold' };
            }

            // Reset confirmations when items/gold change
            session.player1_confirmed = 0;
            session.player2_confirmed = 0;

            // Update gold
            if (isPlayer1) {
                session.player1_gold = amount;
            } else {
                session.player2_gold = amount;
            }

            await this.updateSession(session);

            this.emit('trade:gold_updated', {
                sessionId,
                playerId,
                amount,
                player1_gold: session.player1_gold,
                player2_gold: session.player2_gold
            });

            return {
                success: true,
                gold: amount,
                message: 'Gold added to trade'
            };

        } catch (error) {
            console.error('Add gold error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Add item to trade
     * @param {string} playerId - Player adding item
     * @param {string} sessionId - Trade session ID
     * @param {Object} item - Item data
     * @param {number} slotIndex - Slot index (0-5)
     * @returns {Promise<Object>}
     */
    async addItem(playerId, sessionId, item, slotIndex) {
        try {
            const session = await this.getSession(sessionId);

            if (!session || session.status !== 'ACTIVE') {
                return { success: false, error: 'Trade not active' };
            }

            // Validate player is in trade
            const isPlayer1 = session.player1_id === playerId;
            const isPlayer2 = session.player2_id === playerId;

            if (!isPlayer1 && !isPlayer2) {
                return { success: false, error: 'Not in this trade' };
            }

            // Validate slot
            if (slotIndex < 0 || slotIndex > 5) {
                return { success: false, error: 'Invalid slot' };
            }

            // Check slot is empty
            const existingItem = await this.getTradeItem(sessionId, playerId, slotIndex);
            if (existingItem) {
                return { success: false, error: 'Slot already occupied' };
            }

            // Verify player owns item
            const hasItem = await this.inventoryManager.hasItem(playerId, item.id);
            if (!hasItem) {
                return { success: false, error: 'Item not in inventory' };
            }

            // Reset confirmations
            session.player1_confirmed = 0;
            session.player2_confirmed = 0;
            await this.updateSession(session);

            // Add item to trade
            const tradeItem = {
                id: uuidv4(),
                trade_id: sessionId,
                player_id: playerId,
                item_id: item.id,
                item_data: JSON.stringify(item),
                slot_index: slotIndex
            };

            await this.saveTradeItem(tradeItem);

            this.emit('trade:item_added', {
                sessionId,
                playerId,
                item,
                slotIndex
            });

            return {
                success: true,
                item,
                slotIndex,
                message: 'Item added to trade'
            };

        } catch (error) {
            console.error('Add item error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove item from trade
     * @param {string} playerId - Player removing item
     * @param {string} sessionId - Trade session ID
     * @param {number} slotIndex - Slot index
     * @returns {Promise<Object>}
     */
    async removeItem(playerId, sessionId, slotIndex) {
        try {
            const session = await this.getSession(sessionId);

            if (!session || session.status !== 'ACTIVE') {
                return { success: false, error: 'Trade not active' };
            }

            // Remove item
            const item = await this.getTradeItem(sessionId, playerId, slotIndex);
            if (!item) {
                return { success: false, error: 'No item in slot' };
            }

            await this.deleteTradeItem(item.id);

            // Reset confirmations
            session.player1_confirmed = 0;
            session.player2_confirmed = 0;
            await this.updateSession(session);

            this.emit('trade:item_removed', {
                sessionId,
                playerId,
                slotIndex
            });

            return {
                success: true,
                slotIndex,
                message: 'Item removed from trade'
            };

        } catch (error) {
            console.error('Remove item error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Confirm trade
     * @param {string} playerId - Player confirming
     * @param {string} sessionId - Trade session ID
     * @returns {Promise<Object>}
     */
    async confirmTrade(playerId, sessionId) {
        try {
            const session = await this.getSession(sessionId);

            if (!session || session.status !== 'ACTIVE') {
                return { success: false, error: 'Trade not active' };
            }

            const isPlayer1 = session.player1_id === playerId;
            const isPlayer2 = session.player2_id === playerId;

            if (!isPlayer1 && !isPlayer2) {
                return { success: false, error: 'Not in this trade' };
            }

            // Set confirmation
            if (isPlayer1) {
                session.player1_confirmed = 1;
            } else {
                session.player2_confirmed = 1;
            }

            await this.updateSession(session);

            this.emit('trade:confirmed', {
                sessionId,
                playerId,
                player1_confirmed: session.player1_confirmed,
                player2_confirmed: session.player2_confirmed
            });

            // Check if both confirmed
            if (session.player1_confirmed && session.player2_confirmed) {
                await this.completeTrade(sessionId);
            }

            return {
                success: true,
                confirmed: true,
                waitingForOther: !(session.player1_confirmed && session.player2_confirmed)
            };

        } catch (error) {
            console.error('Confirm trade error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Complete the trade
     * @param {string} sessionId - Trade session ID
     * @returns {Promise<Object>}
     */
    async completeTrade(sessionId) {
        try {
            const session = await this.getSession(sessionId);

            if (!session || session.status !== 'ACTIVE') {
                return { success: false, error: 'Trade not active' };
            }

            // Get trade items
            const player1Items = await this.getTradeItems(sessionId, session.player1_id);
            const player2Items = await this.getTradeItems(sessionId, session.player2_id);

            // Validate both players have enough gold
            const player1 = await this.playerManager.getPlayer(session.player1_id);
            const player2 = await this.playerManager.getPlayer(session.player2_id);

            if (player1.gold < session.player1_gold) {
                return { success: false, error: 'Player 1 insufficient gold' };
            }

            if (player2.gold < session.player2_gold) {
                return { success: false, error: 'Player 2 insufficient gold' };
            }

            // Transfer gold
            if (session.player1_gold > 0) {
                await this.playerManager.updateGold(session.player1_id, -session.player1_gold);
                await this.playerManager.updateGold(session.player2_id, session.player1_gold);
            }

            if (session.player2_gold > 0) {
                await this.playerManager.updateGold(session.player2_id, -session.player2_gold);
                await this.playerManager.updateGold(session.player1_id, session.player2_gold);
            }

            // Transfer items
            for (const item of player1Items) {
                await this.inventoryManager.removeItem(session.player1_id, item.item_id);
                await this.inventoryManager.addItem(session.player2_id, JSON.parse(item.item_data));
            }

            for (const item of player2Items) {
                await this.inventoryManager.removeItem(session.player2_id, item.item_id);
                await this.inventoryManager.addItem(session.player1_id, JSON.parse(item.item_data));
            }

            // Update session
            session.status = 'COMPLETED';
            session.completed_at = new Date().toISOString();
            await this.updateSession(session);

            // Record price history for items
            await this.recordTradePrices(player1Items, player2Items, session);

            this.emit('trade:completed', {
                sessionId,
                player1_id: session.player1_id,
                player2_id: session.player2_id,
                player1_gold: session.player1_gold,
                player2_gold: session.player2_gold
            });

            // Clean up
            this.activeSessions.delete(sessionId);

            return {
                success: true,
                message: 'Trade completed successfully'
            };

        } catch (error) {
            console.error('Complete trade error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cancel trade
     * @param {string} sessionId - Trade session ID
     * @param {string} reason - Cancel reason
     * @returns {Promise<Object>}
     */
    async cancelTrade(sessionId, reason = 'CANCELLED') {
        try {
            const session = await this.getSession(sessionId);

            if (!session) {
                return { success: false, error: 'Trade session not found' };
            }

            if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
                return { success: false, error: 'Trade already finalized' };
            }

            session.status = 'CANCELLED';
            session.cancelled_at = new Date().toISOString();
            await this.updateSession(session);

            // Clear timeout if exists
            const pendingKey = `${session.player1_id}-${session.player2_id}`;
            if (this.requestTimeouts.has(pendingKey)) {
                clearTimeout(this.requestTimeouts.get(pendingKey));
                this.requestTimeouts.delete(pendingKey);
            }

            this.emit('trade:cancelled', {
                sessionId,
                reason,
                player1_id: session.player1_id,
                player2_id: session.player2_id
            });

            this.activeSessions.delete(sessionId);

            return {
                success: true,
                reason,
                message: 'Trade cancelled'
            };

        } catch (error) {
            console.error('Cancel trade error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get active trade for player
     * @param {string} playerId - Player ID
     * @returns {Promise<Object|null>}
     */
    async getPlayerActiveTrade(playerId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT * FROM trade_sessions 
                 WHERE (player1_id = ? OR player2_id = ?) 
                 AND status IN ('PENDING', 'ACTIVE')`,
                [playerId, playerId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    }

    /**
     * Get session by ID
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object|null>}
     */
    async getSession(sessionId) {
        // Check cache first
        if (this.activeSessions.has(sessionId)) {
            return this.activeSessions.get(sessionId);
        }

        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM trade_sessions WHERE id = ?',
                [sessionId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    }

    /**
     * Format session for client
     * @param {Object} session - Session data
     * @returns {Promise<Object>}
     */
    async formatSession(session) {
        const player1Items = await this.getTradeItems(session.id, session.player1_id);
        const player2Items = await this.getTradeItems(session.id, session.player2_id);

        return {
            id: session.id,
            status: session.status,
            player1: {
                id: session.player1_id,
                gold: session.player1_gold,
                confirmed: !!session.player1_confirmed,
                items: player1Items.map(i => ({
                    slot: i.slot_index,
                    ...JSON.parse(i.item_data)
                }))
            },
            player2: {
                id: session.player2_id,
                gold: session.player2_gold,
                confirmed: !!session.player2_confirmed,
                items: player2Items.map(i => ({
                    slot: i.slot_index,
                    ...JSON.parse(i.item_data)
                }))
            }
        };
    }

    // Database helpers
    async saveSession(session) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO trade_sessions (id, player1_id, player2_id, status, created_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [session.id, session.player1_id, session.player2_id, session.status, session.created_at],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async updateSession(session) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE trade_sessions SET
                 status = ?, player1_confirmed = ?, player2_confirmed = ?,
                 player1_gold = ?, player2_gold = ?
                 WHERE id = ?`,
                [session.status, session.player1_confirmed, session.player2_confirmed,
                 session.player1_gold, session.player2_gold, session.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async saveTradeItem(item) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO trade_items (id, trade_id, player_id, item_id, item_data, slot_index)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [item.id, item.trade_id, item.player_id, item.item_id, item.item_data, item.slot_index],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getTradeItem(sessionId, playerId, slotIndex) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM trade_items WHERE trade_id = ? AND player_id = ? AND slot_index = ?',
                [sessionId, playerId, slotIndex],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    }

    async getTradeItems(sessionId, playerId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM trade_items WHERE trade_id = ? AND player_id = ?',
                [sessionId, playerId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async deleteTradeItem(itemId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM trade_items WHERE id = ?',
                [itemId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async recordTradePrices(player1Items, player2Items, session) {
        // Record price history for traded items
        // This is called by ValuationEngine, simplified here
        this.emit('trade:prices_recorded', {
            sessionId: session.id,
            items: [...player1Items, ...player2Items]
        });
    }
}

module.exports = TradeManager;
