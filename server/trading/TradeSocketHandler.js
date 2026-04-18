/**
 * TradeSocketHandler.js
 * Socket.io event handlers for trading system
 * Phase 2: Trading & Economy
 */

class TradeSocketHandler {
    constructor(tradeManager, auctionManager, valuationEngine) {
        this.tradeManager = tradeManager;
        this.auctionManager = auctionManager;
        this.valuationEngine = valuationEngine;
    }

    /**
     * Setup all trade-related socket handlers
     * @param {SocketIO.Server} io - Socket.io server instance
     * @param {SocketIO.Socket} socket - Player socket
     * @param {Object} playerData - Player authentication data
     */
    setupHandlers(io, socket, playerData) {
        const playerId = playerData.id;

        // ==================== TRADE REQUESTS ====================

        /**
         * Request a trade with another player
         * Payload: { targetId: string }
         */
        socket.on('trade:request', async (data, callback) => {
            try {
                const result = await this.tradeManager.requestTrade(playerId, data.targetId);

                if (result.success) {
                    // Notify target player
                    this.sendToPlayer(io, data.targetId, 'trade:request_received', {
                        sessionId: result.sessionId,
                        requesterId: playerId,
                        requesterName: playerData.username
                    });
                }

                callback(result);
            } catch (error) {
                console.error('trade:request error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Accept a trade request
         * Payload: { sessionId: string }
         */
        socket.on('trade:accept', async (data, callback) => {
            try {
                const result = await this.tradeManager.acceptTrade(playerId, data.sessionId);

                if (result.success) {
                    // Notify both players
                    this.broadcastToTrade(io, data.sessionId, 'trade:session_started', {
                        sessionId: data.sessionId,
                        session: result.session
                    });
                }

                callback(result);
            } catch (error) {
                console.error('trade:accept error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Decline a trade request
         * Payload: { sessionId: string }
         */
        socket.on('trade:decline', async (data, callback) => {
            try {
                const result = await this.tradeManager.declineTrade(playerId, data.sessionId);

                if (result.success) {
                    // Notify requester
                    const session = await this.tradeManager.getSession(data.sessionId);
                    if (session) {
                        this.sendToPlayer(io, session.player1_id, 'trade:declined', {
                            sessionId: data.sessionId,
                            by: playerId
                        });
                    }
                }

                callback(result);
            } catch (error) {
                console.error('trade:decline error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Add gold to trade
         * Payload: { sessionId: string, amount: number }
         */
        socket.on('trade:add_gold', async (data, callback) => {
            try {
                const result = await this.tradeManager.addGold(playerId, data.sessionId, data.amount);

                if (result.success) {
                    this.broadcastToTrade(io, data.sessionId, 'trade:gold_updated', {
                        sessionId: data.sessionId,
                        playerId,
                        amount: result.gold,
                        player1_gold: result.player1_gold,
                        player2_gold: result.player2_gold
                    });
                }

                callback(result);
            } catch (error) {
                console.error('trade:add_gold error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Add item to trade
         * Payload: { sessionId: string, item: Object, slotIndex: number }
         */
        socket.on('trade:add_item', async (data, callback) => {
            try {
                const result = await this.tradeManager.addItem(
                    playerId,
                    data.sessionId,
                    data.item,
                    data.slotIndex
                );

                if (result.success) {
                    this.broadcastToTrade(io, data.sessionId, 'trade:item_added', {
                        sessionId: data.sessionId,
                        playerId,
                        item: result.item,
                        slotIndex: result.slotIndex
                    });
                }

                callback(result);
            } catch (error) {
                console.error('trade:add_item error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Remove item from trade
         * Payload: { sessionId: string, slotIndex: number }
         */
        socket.on('trade:remove_item', async (data, callback) => {
            try {
                const result = await this.tradeManager.removeItem(playerId, data.sessionId, data.slotIndex);

                if (result.success) {
                    this.broadcastToTrade(io, data.sessionId, 'trade:item_removed', {
                        sessionId: data.sessionId,
                        playerId,
                        slotIndex: result.slotIndex
                    });
                }

                callback(result);
            } catch (error) {
                console.error('trade:remove_item error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Confirm trade
         * Payload: { sessionId: string }
         */
        socket.on('trade:confirm', async (data, callback) => {
            try {
                const result = await this.tradeManager.confirmTrade(playerId, data.sessionId);

                if (result.success) {
                    this.broadcastToTrade(io, data.sessionId, 'trade:confirmed', {
                        sessionId: data.sessionId,
                        playerId,
                        waitingForOther: result.waitingForOther
                    });
                }

                callback(result);
            } catch (error) {
                console.error('trade:confirm error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Cancel trade
         * Payload: { sessionId: string }
         */
        socket.on('trade:cancel', async (data, callback) => {
            try {
                const result = await this.tradeManager.cancelTrade(data.sessionId, 'CANCELLED');

                if (result.success) {
                    this.broadcastToTrade(io, data.sessionId, 'trade:cancelled', {
                        sessionId: data.sessionId,
                        reason: result.reason
                    });
                }

                callback(result);
            } catch (error) {
                console.error('trade:cancel error:', error);
                callback({ success: false, error: error.message });
            }
        });

        // ==================== AUCTION HOUSE ====================

        /**
         * Get auction list
         * Payload: { page?: number, limit?: number, filters?: Object }
         */
        socket.on('auction:get_list', async (data, callback) => {
            try {
                const result = await this.auctionManager.browseAuctions({
                    page: data.page,
                    limit: data.limit,
                    ...data.filters
                });

                callback(result);
            } catch (error) {
                console.error('auction:get_list error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Create auction
         * Payload: { item: Object, startingPrice: number, buyoutPrice?: number, durationHours?: number }
         */
        socket.on('auction:create', async (data, callback) => {
            try {
                const result = await this.auctionManager.createAuction(playerId, data.item, {
                    startingPrice: data.startingPrice,
                    buyoutPrice: data.buyoutPrice,
                    durationHours: data.durationHours
                });

                if (result.success) {
                    // Broadcast to all players about new auction
                    socket.broadcast.emit('auction:new', {
                        auction: result.auction
                    });
                }

                callback(result);
            } catch (error) {
                console.error('auction:create error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Place bid on auction
         * Payload: { auctionId: string, bidAmount: number }
         */
        socket.on('auction:bid', async (data, callback) => {
            try {
                const result = await this.auctionManager.placeBid(playerId, data.auctionId, data.bidAmount);

                if (result.success) {
                    // Broadcast bid update
                    io.emit('auction:bid_update', {
                        auctionId: data.auctionId,
                        currentBid: result.bid,
                        bidsCount: result.bidsCount,
                        highestBidder: playerId
                    });
                }

                callback(result);
            } catch (error) {
                console.error('auction:bid error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Buyout auction
         * Payload: { auctionId: string }
         */
        socket.on('auction:buyout', async (data, callback) => {
            try {
                const result = await this.auctionManager.buyoutAuction(playerId, data.auctionId);

                if (result.success) {
                    io.emit('auction:sold', {
                        auctionId: data.auctionId,
                        buyerId: playerId,
                        price: result.price
                    });
                }

                callback(result);
            } catch (error) {
                console.error('auction:buyout error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Cancel auction
         * Payload: { auctionId: string }
         */
        socket.on('auction:cancel', async (data, callback) => {
            try {
                const result = await this.auctionManager.cancelAuction(playerId, data.auctionId);

                if (result.success) {
                    io.emit('auction:cancelled', {
                        auctionId: data.auctionId
                    });
                }

                callback(result);
            } catch (error) {
                console.error('auction:cancel error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Get my auctions
         */
        socket.on('auction:get_my_auctions', async (data, callback) => {
            try {
                const result = await this.auctionManager.getMyAuctions(playerId);
                callback(result);
            } catch (error) {
                console.error('auction:get_my_auctions error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Get my bids
         */
        socket.on('auction:get_my_bids', async (data, callback) => {
            try {
                const result = await this.auctionManager.getMyBids(playerId);
                callback(result);
            } catch (error) {
                console.error('auction:get_my_bids error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Get auction details
         * Payload: { auctionId: string }
         */
        socket.on('auction:get_details', async (data, callback) => {
            try {
                const result = await this.auctionManager.getAuctionDetails(data.auctionId);
                callback(result);
            } catch (error) {
                console.error('auction:get_details error:', error);
                callback({ success: false, error: error.message });
            }
        });

        // ==================== PRICE CHECK / VALUATION ====================

        /**
         * Get price estimate for item
         * Payload: { item: Object }
         */
        socket.on('price:estimate', async (data, callback) => {
            try {
                const result = await this.valuationEngine.getPriceEstimate(data.item);
                callback(result);
            } catch (error) {
                console.error('price:estimate error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Get auction price suggestion
         * Payload: { item: Object }
         */
        socket.on('price:auction_suggestion', async (data, callback) => {
            try {
                const result = await this.valuationEngine.getAuctionSuggestion(data.item);
                callback(result);
            } catch (error) {
                console.error('price:auction_suggestion error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Get market overview
         */
        socket.on('market:overview', async (data, callback) => {
            try {
                const result = await this.valuationEngine.getMarketOverview();
                callback(result);
            } catch (error) {
                console.error('market:overview error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Search price history
         * Payload: { searchTerm: string }
         */
        socket.on('price:search_history', async (data, callback) => {
            try {
                const result = await this.valuationEngine.searchPriceHistory(data.searchTerm);
                callback(result);
            } catch (error) {
                console.error('price:search_history error:', error);
                callback({ success: false, error: error.message });
            }
        });

        // ==================== TRADE CHAT ====================

        /**
         * Send trade chat message
         * Payload: { message: string, messageType?: string, linkedItem?: Object }
         */
        socket.on('trade_chat:message', async (data, callback) => {
            try {
                const { v4: uuidv4 } = require('uuid');

                // Validate message
                if (!data.message || data.message.trim().length === 0) {
                    return callback({ success: false, error: 'Message cannot be empty' });
                }

                if (data.message.length > 200) {
                    return callback({ success: false, error: 'Message too long (max 200 chars)' });
                }

                // Save to database
                await new Promise((resolve, reject) => {
                    this.tradeManager.db.run(
                        `INSERT INTO trade_chat (id, player_id, player_name, message, message_type, linked_item, created_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [uuidv4(), playerId, playerData.username, data.message.trim(),
                         data.messageType || 'GENERAL',
                         data.linkedItem ? JSON.stringify(data.linkedItem) : null,
                         new Date().toISOString()],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });

                // Broadcast to all players
                io.emit('trade_chat:message', {
                    playerId,
                    playerName: playerData.username,
                    message: data.message.trim(),
                    messageType: data.messageType || 'GENERAL',
                    linkedItem: data.linkedItem,
                    timestamp: new Date().toISOString()
                });

                callback({ success: true });
            } catch (error) {
                console.error('trade_chat:message error:', error);
                callback({ success: false, error: error.message });
            }
        });

        /**
         * Get recent trade chat history
         * Payload: { limit?: number }
         */
        socket.on('trade_chat:history', async (data, callback) => {
            try {
                const limit = data.limit || 50;

                const messages = await new Promise((resolve, reject) => {
                    this.tradeManager.db.all(
                        `SELECT * FROM trade_chat
                         ORDER BY created_at DESC
                         LIMIT ?`,
                        [limit],
                        (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows || []);
                        }
                    );
                });

                callback({
                    success: true,
                    messages: messages.reverse().map(m => ({
                        id: m.id,
                        playerId: m.player_id,
                        playerName: m.player_name,
                        message: m.message,
                        messageType: m.message_type,
                        linkedItem: m.linked_item ? JSON.parse(m.linked_item) : null,
                        timestamp: m.created_at
                    }))
                });
            } catch (error) {
                console.error('trade_chat:history error:', error);
                callback({ success: false, error: error.message });
            }
        });
    }

    // ==================== HELPER METHODS ====================

    /**
     * Send event to specific player
     * @param {SocketIO.Server} io - Socket.io server
     * @param {string} playerId - Player ID
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    sendToPlayer(io, playerId, event, data) {
        // This assumes you have a way to find socket by player ID
        // You'll need to implement socket tracking in your player manager
        io.to(`player:${playerId}`).emit(event, data);
    }

    /**
     * Broadcast event to trade participants
     * @param {SocketIO.Server} io - Socket.io server
     * @param {string} sessionId - Trade session ID
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    broadcastToTrade(io, sessionId, event, data) {
        io.to(`trade:${sessionId}`).emit(event, data);
    }

    /**
     * Setup trade room for socket
     * @param {SocketIO.Socket} socket - Player socket
     * @param {string} sessionId - Trade session ID
     */
    joinTradeRoom(socket, sessionId) {
        socket.join(`trade:${sessionId}`);
    }

    /**
     * Leave trade room
     * @param {SocketIO.Socket} socket - Player socket
     * @param {string} sessionId - Trade session ID
     */
    leaveTradeRoom(socket, sessionId) {
        socket.leave(`trade:${sessionId}`);
    }
}

module.exports = TradeSocketHandler;
