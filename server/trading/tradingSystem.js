/**
 * Trading System - Player to Player Commerce
 * Handles direct trades, auction house, and market economy
 * Version 0.3 - First Playable Gameplay Systems
 */

class TradingSystem {
    constructor(server) {
        this.server = server;
        
        // Trading configuration
        this.config = {
            maxTradeDistance: 50,
            tradeTimeout: 120000, // 2 minutes
            maxTradeSlots: 6,
            auctionHouseFee: 0.05, // 5% fee
            maxAuctionDuration: 259200000, // 3 days
            minAuctionDuration: 3600000, // 1 hour
            maxAuctionsPerPlayer: 20,
            buyoutPriceMultiplier: 1.5,
            marketUpdateInterval: 300000, // 5 minutes
            priceHistoryDays: 30
        };
        
        // Active trades
        this.activeTrades = new Map();
        
        // Auction house
        this.auctions = new Map();
        this.auctionHistory = [];
        this.priceHistory = new Map();
        
        // Market data
        this.marketData = {
            totalVolume: 0,
            totalTransactions: 0,
            itemPrices: new Map(),
            trendingItems: new Map(),
            marketTrends: new Map()
        };
        
        // Trading restrictions
        this.restrictions = {
            minLevel: 5,
            maxDailyTrades: 50,
            restrictedItems: ['bound_items', 'quest_items'],
            tradeTax: 0
        };
        
        // Player trading data
        this.playerTradingData = new Map();
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Load trading data
        this.loadTradingData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start market updates
        this.startMarketUpdates();
        
        // Start auction house cleanup
        this.startAuctionCleanup();
        
        console.log('Trading System initialized');
    }
    
    async loadTradingData() {
        try {
            // Load active auctions
            const auctionData = await this.server.db.all(`
                SELECT * FROM auctions WHERE status = 'active' AND end_time > ?
            `, [Date.now()]);
            
            for (const data of auctionData) {
                const auction = {
                    id: data.id,
                    sellerId: data.seller_id,
                    itemId: data.item_id,
                    itemData: JSON.parse(data.item_data),
                    quantity: data.quantity,
                    startingBid: data.starting_bid,
                    currentBid: data.current_bid,
                    buyoutPrice: data.buyout_price,
                    bidderId: data.bidder_id,
                    startTime: data.start_time,
                    endTime: data.end_time,
                    status: data.status
                };
                
                this.auctions.set(auction.id, auction);
            }
            
            // Load price history
            const priceData = await this.server.db.all(`
                SELECT * FROM item_price_history 
                WHERE timestamp > ?
            `, [Date.now() - (this.config.priceHistoryDays * 24 * 60 * 60 * 1000)]);
            
            for (const data of priceData) {
                const itemId = data.item_id;
                if (!this.priceHistory.has(itemId)) {
                    this.priceHistory.set(itemId, []);
                }
                this.priceHistory.get(itemId).push({
                    price: data.price,
                    quantity: data.quantity,
                    timestamp: data.timestamp
                });
            }
            
            // Load market data
            const marketStats = await this.server.db.get('SELECT * FROM market_stats');
            if (marketStats) {
                this.marketData = {
                    totalVolume: marketStats.total_volume || 0,
                    totalTransactions: marketStats.total_transactions || 0,
                    itemPrices: new Map(JSON.parse(marketStats.item_prices || '[]')),
                    trendingItems: new Map(JSON.parse(marketStats.trending_items || '[]')),
                    marketTrends: new Map(JSON.parse(marketStats.market_trends || '[]'))
                };
            }
            
            console.log(`Loaded ${this.auctions.size} active auctions and market data`);
            
        } catch (error) {
            console.error('Error loading trading data:', error);
        }
    }
    
    setupEventHandlers() {
        // Trade requests
        this.server.on('tradeRequest', (requesterId, targetId) => {
            this.handleTradeRequest(requesterId, targetId);
        });
        
        this.server.on('tradeResponse', (response) => {
            this.handleTradeResponse(response);
        });
        
        this.server.on('tradeUpdate', (tradeId, playerId, update) => {
            this.handleTradeUpdate(tradeId, playerId, update);
        });
        
        this.server.on('tradeConfirm', (tradeId, playerId) => {
            this.handleTradeConfirm(tradeId, playerId);
        });
        
        this.server.on('tradeCancel', (tradeId, playerId) => {
            this.handleTradeCancel(tradeId, playerId);
        });
        
        // Auction house events
        this.server.on('auctionCreate', (playerId, auctionData) => {
            this.handleAuctionCreate(playerId, auctionData);
        });
        
        this.server.on('auctionBid', (playerId, auctionId, bidAmount) => {
            this.handleAuctionBid(playerId, auctionId, bidAmount);
        });
        
        this.server.on('auctionBuyout', (playerId, auctionId) => {
            this.handleAuctionBuyout(playerId, auctionId);
        });
        
        this.server.on('auctionCancel', (playerId, auctionId) => {
            this.handleAuctionCancel(playerId, auctionId);
        });
        
        // Market events
        this.server.on('marketSearch', (playerId, searchQuery) => {
            this.handleMarketSearch(playerId, searchQuery);
        });
        
        this.server.on('marketBrowse', (playerId, category) => {
            this.handleMarketBrowse(playerId, category);
        });
    }
    
    startMarketUpdates() {
        setInterval(() => {
            this.updateMarketData();
        }, this.config.marketUpdateInterval);
    }
    
    startAuctionCleanup() {
        setInterval(() => {
            this.cleanupExpiredAuctions();
        }, 60000); // Check every minute
    }
    
    // Direct trading system
    async requestTrade(requesterId, targetId) {
        const requester = await this.getPlayerData(requesterId);
        const target = await this.getPlayerData(targetId);
        
        if (!requester || !target) {
            return { success: false, message: 'Player not found' };
        }
        
        // Check level requirements
        if (requester.level < this.restrictions.minLevel || target.level < this.restrictions.minLevel) {
            return { success: false, message: 'Player level too low' };
        }
        
        // Check distance
        const distance = this.getPlayerDistance(requesterId, targetId);
        if (distance > this.config.maxTradeDistance) {
            return { success: false, message: 'Target too far away' };
        }
        
        // Check if either player is already in a trade
        if (this.isPlayerInTrade(requesterId) || this.isPlayerInTrade(targetId)) {
            return { success: false, message: 'Player already in a trade' };
        }
        
        // Check daily trade limit
        const requesterData = this.getPlayerTradingData(requesterId);
        if (requesterData.dailyTrades >= this.restrictions.maxDailyTrades) {
            return { success: false, message: 'Daily trade limit reached' };
        }
        
        // Send trade request
        const tradeRequest = {
            id: this.generateTradeId(),
            requesterId: requesterId,
            requesterName: requester.name,
            targetId: targetId,
            targetName: target.name,
            timestamp: Date.now(),
            expiresAt: Date.now() + 30000 // 30 seconds
        };
        
        const targetSocket = this.server.getPlayerSocket(targetId);
        if (targetSocket) {
            targetSocket.emit('tradeRequest', tradeRequest);
        }
        
        // Notify requester
        const requesterSocket = this.server.getPlayerSocket(requesterId);
        if (requesterSocket) {
            requesterSocket.emit('tradeRequestSent', {
                targetId: targetId,
                targetName: target.name
            });
        }
        
        console.log(`Trade request sent: ${requester.name} -> ${target.name}`);
        
        return { success: true, request: tradeRequest };
    }
    
    async respondToTrade(response) {
        const { tradeId, accept, targetId } = response;
        
        if (!accept) {
            // Notify requester of decline
            const socket = this.server.getPlayerSocket(targetId);
            if (socket) {
                socket.emit('tradeDeclined', {
                    playerId: response.playerId
                });
            }
            return { success: true, message: 'Trade declined' };
        }
        
        // Create trade session
        const trade = await this.createTradeSession(targetId, response.playerId);
        if (!trade) {
            return { success: false, message: 'Failed to create trade' };
        }
        
        return { success: true, trade: trade };
    }
    
    async createTradeSession(player1Id, player2Id) {
        const player1 = await this.getPlayerData(player1Id);
        const player2 = await this.getPlayerData(player2Id);
        
        if (!player1 || !player2) {
            return null;
        }
        
        const trade = {
            id: this.generateTradeId(),
            type: 'direct',
            participants: [
                {
                    playerId: player1Id,
                    name: player1.name,
                    items: [],
                    gold: 0,
                    confirmed: false,
                    ready: false
                },
                {
                    playerId: player2Id,
                    name: player2.name,
                    items: [],
                    gold: 0,
                    confirmed: false,
                    ready: false
                }
            ],
            startTime: Date.now(),
            endTime: Date.now() + this.config.tradeTimeout,
            status: 'active'
        };
        
        this.activeTrades.set(trade.id, trade);
        
        // Set player trade status
        this.setPlayerTradeStatus(player1Id, trade.id);
        this.setPlayerTradeStatus(player2Id, trade.id);
        
        // Notify participants
        this.notifyTradeParticipants(trade, 'tradeStarted');
        
        console.log(`Trade session created: ${player1.name} <-> ${player2.name}`);
        
        return trade;
    }
    
    updateTrade(tradeId, playerId, update) {
        const trade = this.activeTrades.get(tradeId);
        if (!trade || trade.status !== 'active') {
            return { success: false, message: 'Trade not found or inactive' };
        }
        
        const participant = trade.participants.find(p => p.playerId === playerId);
        if (!participant) {
            return { success: false, message: 'Not a participant in this trade' };
        }
        
        // Update participant data
        if (update.items !== undefined) {
            participant.items = update.items;
        }
        if (update.gold !== undefined) {
            participant.gold = update.gold;
        }
        
        // Reset confirmation status when trade changes
        participant.confirmed = false;
        participant.ready = false;
        
        // Notify other participant
        this.notifyTradeParticipants(trade, 'tradeUpdated', playerId);
        
        return { success: true, trade: trade };
    }
    
    confirmTrade(tradeId, playerId) {
        const trade = this.activeTrades.get(tradeId);
        if (!trade || trade.status !== 'active') {
            return { success: false, message: 'Trade not found or inactive' };
        }
        
        const participant = trade.participants.find(p => p.playerId === playerId);
        if (!participant) {
            return { success: false, message: 'Not a participant in this trade' };
        }
        
        participant.confirmed = true;
        participant.ready = true;
        
        // Check if both participants are ready
        const allReady = trade.participants.every(p => p.ready);
        
        if (allReady) {
            // Execute trade
            this.executeTrade(trade);
        } else {
            // Notify participants
            this.notifyTradeParticipants(trade, 'tradeConfirmUpdate', playerId);
        }
        
        return { success: true, trade: trade };
    }
    
    async executeTrade(trade) {
        const [player1, player2] = trade.participants;
        
        try {
            // Validate trade
            const validation = await this.validateTrade(trade);
            if (!validation.valid) {
                this.cancelTrade(trade.id, validation.reason);
                return;
            }
            
            // Execute item transfers
            await this.transferItems(player1.playerId, player2.playerId, player1.items);
            await this.transferItems(player2.playerId, player1.playerId, player2.items);
            
            // Execute gold transfers
            if (player1.gold > 0) {
                await this.transferGold(player1.playerId, player2.playerId, player1.gold);
            }
            if (player2.gold > 0) {
                await this.transferGold(player2.playerId, player1.playerId, player2.gold);
            }
            
            // Update market data
            this.updateMarketDataFromTrade(trade);
            
            // Update player stats
            this.updatePlayerTradeStats(player1.playerId);
            this.updatePlayerTradeStats(player2.playerId);
            
            // Mark trade as completed
            trade.status = 'completed';
            trade.endTime = Date.now();
            
            // Clear player trade status
            this.clearPlayerTradeStatus(player1.playerId);
            this.clearPlayerTradeStatus(player2.playerId);
            
            // Notify participants
            this.notifyTradeParticipants(trade, 'tradeCompleted');
            
            // Remove from active trades after delay
            setTimeout(() => {
                this.activeTrades.delete(trade.id);
            }, 5000);
            
            console.log(`Trade executed: ${player1.name} <-> ${player2.name}`);
            
        } catch (error) {
            console.error('Error executing trade:', error);
            this.cancelTrade(trade.id, 'System error');
        }
    }
    
    async validateTrade(trade) {
        const [player1, player2] = trade.participants;
        
        // Check if players have sufficient items and gold
        for (const participant of trade.participants) {
            // Validate items
            for (const item of participant.items) {
                const hasItem = await this.checkPlayerItem(participant.playerId, item);
                if (!hasItem) {
                    return { valid: false, reason: 'Insufficient items' };
                }
            }
            
            // Validate gold
            const playerData = await this.getPlayerData(participant.playerId);
            if (playerData.gold < participant.gold) {
                return { valid: false, reason: 'Insufficient gold' };
            }
        }
        
        return { valid: true };
    }
    
    async checkPlayerItem(playerId, item) {
        try {
            const result = await this.server.db.get(`
                SELECT SUM(stack_count) as total FROM player_inventory 
                WHERE player_id = ? AND item_id = ?
            `, [playerId, item.id]);
            
            return result && result.total >= item.quantity;
        } catch (error) {
            console.error('Error checking player item:', error);
            return false;
        }
    }
    
    async transferItems(fromPlayerId, toPlayerId, items) {
        for (const item of items) {
            // Remove from sender
            await this.removePlayerItem(fromPlayerId, item);
            
            // Add to receiver
            await this.addPlayerItem(toPlayerId, item);
        }
    }
    
    async transferGold(fromPlayerId, toPlayerId, amount) {
        try {
            // Remove from sender
            await this.server.db.run(`
                UPDATE characters SET gold = gold - ? WHERE player_id = ? AND gold >= ?
            `, [amount, fromPlayerId, amount]);
            
            // Add to receiver
            await this.server.db.run(`
                UPDATE characters SET gold = gold + ? WHERE player_id = ?
            `, [amount, toPlayerId]);
        } catch (error) {
            console.error('Error transferring gold:', error);
        }
    }
    
    async removePlayerItem(playerId, item) {
        try {
            let remainingQuantity = item.quantity;
            
            const stacks = await this.server.db.all(`
                SELECT * FROM player_inventory 
                WHERE player_id = ? AND item_id = ? AND stack_count > 0
                ORDER BY id
            `, [playerId, item.id]);
            
            for (const stack of stacks) {
                if (remainingQuantity <= 0) break;
                
                const removeQuantity = Math.min(stack.stack_count, remainingQuantity);
                
                if (removeQuantity === stack.stack_count) {
                    await this.server.db.run(`
                        DELETE FROM player_inventory WHERE id = ?
                    `, [stack.id]);
                } else {
                    await this.server.db.run(`
                        UPDATE player_inventory SET stack_count = stack_count - ? WHERE id = ?
                    `, [removeQuantity, stack.id]);
                }
                
                remainingQuantity -= removeQuantity;
            }
        } catch (error) {
            console.error('Error removing player item:', error);
        }
    }
    
    async addPlayerItem(playerId, item) {
        try {
            // Check if item already exists in inventory
            const existingStack = await this.server.db.get(`
                SELECT * FROM player_inventory 
                WHERE player_id = ? AND item_id = ? AND stack_count < max_stack
            `, [playerId, item.id]);
            
            if (existingStack) {
                // Add to existing stack
                const newCount = Math.min(existingStack.stack_count + item.quantity, existingStack.max_stack);
                const remaining = existingStack.stack_count + item.quantity - newCount;
                
                await this.server.db.run(`
                    UPDATE player_inventory SET stack_count = ? WHERE id = ?
                `, [newCount, existingStack.id]);
                
                // If there are remaining items, create new stack
                if (remaining > 0) {
                    await this.server.db.run(`
                        INSERT INTO player_inventory (player_id, item_id, stack_count, max_stack)
                        VALUES (?, ?, ?, ?)
                    `, [playerId, item.id, remaining, item.maxStack || 99]);
                }
            } else {
                // Create new stack
                await this.server.db.run(`
                    INSERT INTO player_inventory (player_id, item_id, stack_count, max_stack)
                    VALUES (?, ?, ?, ?)
                `, [playerId, item.id, item.quantity, item.maxStack || 99]);
            }
        } catch (error) {
            console.error('Error adding player item:', error);
        }
    }
    
    cancelTrade(tradeId, reason = 'cancelled') {
        const trade = this.activeTrades.get(tradeId);
        if (!trade) return;
        
        trade.status = 'cancelled';
        trade.endTime = Date.now();
        trade.cancelReason = reason;
        
        // Clear player trade status
        for (const participant of trade.participants) {
            this.clearPlayerTradeStatus(participant.playerId);
        }
        
        // Notify participants
        this.notifyTradeParticipants(trade, 'tradeCancelled');
        
        // Remove from active trades
        setTimeout(() => {
            this.activeTrades.delete(tradeId);
        }, 5000);
        
        console.log(`Trade cancelled: ${tradeId} - ${reason}`);
    }
    
    // Auction house system
    async createAuction(playerId, auctionData) {
        const player = await this.getPlayerData(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        
        // Check auction limit
        const playerAuctions = Array.from(this.auctions.values()).filter(a => a.sellerId === playerId);
        if (playerAuctions.length >= this.config.maxAuctionsPerPlayer) {
            return { success: false, message: 'Maximum auctions reached' };
        }
        
        // Validate item ownership
        const hasItem = await this.checkPlayerItem(playerId, auctionData.item);
        if (!hasItem) {
            return { success: false, message: 'Item not found' };
        }
        
        // Validate auction parameters
        if (auctionData.startingBid <= 0) {
            return { success: false, message: 'Invalid starting bid' };
        }
        
        if (auctionData.buyoutPrice && auctionData.buyoutPrice <= auctionData.startingBid) {
            return { success: false, message: 'Buyout price must be higher than starting bid' };
        }
        
        const duration = Math.min(Math.max(auctionData.duration, this.config.minAuctionDuration), this.config.maxAuctionDuration);
        
        try {
            // Remove item from player inventory
            await this.removePlayerItem(playerId, auctionData.item);
            
            // Create auction
            const auction = {
                id: this.generateAuctionId(),
                sellerId: playerId,
                itemId: auctionData.item.id,
                itemData: auctionData.item,
                quantity: auctionData.item.quantity,
                startingBid: auctionData.startingBid,
                currentBid: auctionData.startingBid,
                buyoutPrice: auctionData.buyoutPrice || null,
                bidderId: null,
                startTime: Date.now(),
                endTime: Date.now() + duration,
                status: 'active'
            };
            
            // Save to database
            await this.server.db.run(`
                INSERT INTO auctions 
                (id, seller_id, item_id, item_data, quantity, starting_bid, current_bid, buyout_price, start_time, end_time, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                auction.id,
                auction.sellerId,
                auction.itemId,
                JSON.stringify(auction.itemData),
                auction.quantity,
                auction.startingBid,
                auction.currentBid,
                auction.buyoutPrice,
                auction.startTime,
                auction.endTime,
                auction.status
            ]);
            
            this.auctions.set(auction.id, auction);
            
            // Notify player
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('auctionCreated', {
                    auction: this.getAuctionSummary(auction)
                });
            }
            
            console.log(`Auction created: ${auction.itemData.name} by ${player.name}`);
            
            return { success: true, auction: auction };
            
        } catch (error) {
            console.error('Error creating auction:', error);
            return { success: false, message: 'Error creating auction' };
        }
    }
    
    async placeBid(playerId, auctionId, bidAmount) {
        const auction = this.auctions.get(auctionId);
        if (!auction || auction.status !== 'active') {
            return { success: false, message: 'Auction not found or inactive' };
        }
        
        const player = await this.getPlayerData(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        
        // Cannot bid on own auction
        if (auction.sellerId === playerId) {
            return { success: false, message: 'Cannot bid on own auction' };
        }
        
        // Check if auction has ended
        if (Date.now() >= auction.endTime) {
            return { success: false, message: 'Auction has ended' };
        }
        
        // Validate bid amount
        const minBid = auction.currentBid + Math.max(1, Math.floor(auction.currentBid * 0.05)); // 5% increment
        if (bidAmount < minBid) {
            return { success: false, message: `Minimum bid is ${minBid}` };
        }
        
        // Check if player has enough gold
        if (player.gold < bidAmount) {
            return { success: false, message: 'Insufficient gold' };
        }
        
        try {
            // Refund previous bidder if exists
            if (auction.bidderId && auction.bidderId !== playerId) {
                await this.transferGold(auction.sellerId, auction.bidderId, auction.currentBid);
                
                // Notify previous bidder
                const outbidSocket = this.server.getPlayerSocket(auction.bidderId);
                if (outbidSocket) {
                    outbidSocket.emit('auctionOutbid', {
                        auctionId: auction.id,
                        newBid: bidAmount
                    });
                }
            }
            
            // Deduct gold from new bidder
            await this.transferGold(playerId, auction.sellerId, bidAmount);
            
            // Update auction
            auction.bidderId = playerId;
            auction.currentBid = bidAmount;
            
            // Save to database
            await this.server.db.run(`
                UPDATE auctions SET bidder_id = ?, current_bid = ? WHERE id = ?
            `, [playerId, bidAmount, auctionId]);
            
            // Notify players
            this.notifyAuctionUpdate(auction);
            
            console.log(`Bid placed: ${player.name} bid ${bidAmount} on ${auction.itemData.name}`);
            
            return { success: true, auction: auction };
            
        } catch (error) {
            console.error('Error placing bid:', error);
            return { success: false, message: 'Error placing bid' };
        }
    }
    
    async buyoutAuction(playerId, auctionId) {
        const auction = this.auctions.get(auctionId);
        if (!auction || auction.status !== 'active') {
            return { success: false, message: 'Auction not found or inactive' };
        }
        
        if (!auction.buyoutPrice) {
            return { success: false, message: 'No buyout price set' };
        }
        
        const player = await this.getPlayerData(playerId);
        if (!player) {
            return { success: false, message: 'Player not found' };
        }
        
        // Cannot buyout own auction
        if (auction.sellerId === playerId) {
            return { success: false, message: 'Cannot buyout own auction' };
        }
        
        // Check if player has enough gold
        if (player.gold < auction.buyoutPrice) {
            return { success: false, message: 'Insufficient gold' };
        }
        
        try {
            // Refund previous bidder if exists
            if (auction.bidderId) {
                await this.transferGold(auction.sellerId, auction.bidderId, auction.currentBid);
            }
            
            // Process buyout
            const fee = Math.floor(auction.buyoutPrice * this.config.auctionHouseFee);
            const sellerAmount = auction.buyoutPrice - fee;
            
            // Transfer gold (minus fee) to seller
            await this.transferGold(playerId, auction.sellerId, sellerAmount);
            
            // Add item to buyer
            await this.addPlayerItem(playerId, auction.itemData);
            
            // Update auction
            auction.status = 'sold';
            auction.endTime = Date.now();
            auction.finalPrice = auction.buyoutPrice;
            auction.buyerId = playerId;
            
            // Save to database
            await this.server.db.run(`
                UPDATE auctions SET status = 'sold', end_time = ?, buyer_id = ?, final_price = ? WHERE id = ?
            `, [Date.now(), playerId, auction.buyoutPrice, auctionId]);
            
            // Update market data
            this.updateMarketDataFromSale(auction);
            
            // Add to history
            this.auctionHistory.push({
                auctionId: auction.id,
                itemId: auction.itemId,
                price: auction.buyoutPrice,
                quantity: auction.quantity,
                timestamp: Date.now()
            });
            
            // Notify players
            const buyerSocket = this.server.getPlayerSocket(playerId);
            if (buyerSocket) {
                buyerSocket.emit('auctionWon', {
                    auction: this.getAuctionSummary(auction)
                });
            }
            
            const sellerSocket = this.server.getPlayerSocket(auction.sellerId);
            if (sellerSocket) {
                sellerSocket.emit('auctionSold', {
                    auction: this.getAuctionSummary(auction),
                    amount: sellerAmount
                });
            }
            
            // Remove from active auctions
            setTimeout(() => {
                this.auctions.delete(auctionId);
            }, 10000);
            
            console.log(`Auction bought out: ${auction.itemData.name} by ${player.name} for ${auction.buyoutPrice}`);
            
            return { success: true, auction: auction };
            
        } catch (error) {
            console.error('Error buying out auction:', error);
            return { success: false, message: 'Error buying out auction' };
        }
    }
    
    async cancelAuction(playerId, auctionId) {
        const auction = this.auctions.get(auctionId);
        if (!auction || auction.status !== 'active') {
            return { success: false, message: 'Auction not found or inactive' };
        }
        
        // Only seller can cancel
        if (auction.sellerId !== playerId) {
            return { success: false, message: 'Only seller can cancel auction' };
        }
        
        // Cannot cancel if there are bids
        if (auction.bidderId) {
            return { success: false, message: 'Cannot cancel auction with bids' };
        }
        
        try {
            // Return item to seller
            await this.addPlayerItem(playerId, auction.itemData);
            
            // Update auction
            auction.status = 'cancelled';
            auction.endTime = Date.now();
            
            // Save to database
            await this.server.db.run(`
                UPDATE auctions SET status = 'cancelled', end_time = ? WHERE id = ?
            `, [Date.now(), auctionId]);
            
            // Notify player
            const socket = this.server.getPlayerSocket(playerId);
            if (socket) {
                socket.emit('auctionCancelled', {
                    auctionId: auctionId
                });
            }
            
            // Remove from active auctions
            setTimeout(() => {
                this.auctions.delete(auctionId);
            }, 5000);
            
            console.log(`Auction cancelled: ${auction.itemData.name}`);
            
            return { success: true };
            
        } catch (error) {
            console.error('Error cancelling auction:', error);
            return { success: false, message: 'Error cancelling auction' };
        }
    }
    
    cleanupExpiredAuctions() {
        const now = Date.now();
        const expiredAuctions = [];
        
        for (const [auctionId, auction] of this.auctions) {
            if (auction.status === 'active' && now >= auction.endTime) {
                expiredAuctions.push(auctionId);
            }
        }
        
        for (const auctionId of expiredAuctions) {
            this.endAuction(auctionId);
        }
    }
    
    async endAuction(auctionId) {
        const auction = this.auctions.get(auctionId);
        if (!auction || auction.status !== 'active') return;
        
        if (auction.bidderId) {
            // Auction won by bidder
            try {
                // Transfer gold to seller (minus fee)
                const fee = Math.floor(auction.currentBid * this.config.auctionHouseFee);
                const sellerAmount = auction.currentBid - fee;
                
                await this.transferGold(auction.sellerId, auction.bidderId, auction.currentBid);
                await this.transferGold(auction.bidderId, auction.sellerId, sellerAmount);
                
                // Add item to winner
                await this.addPlayerItem(auction.bidderId, auction.itemData);
                
                // Update auction
                auction.status = 'sold';
                auction.finalPrice = auction.currentBid;
                auction.buyerId = auction.bidderId;
                
                // Notify players
                const winnerSocket = this.server.getPlayerSocket(auction.bidderId);
                if (winnerSocket) {
                    winnerSocket.emit('auctionWon', {
                        auction: this.getAuctionSummary(auction)
                    });
                }
                
                const sellerSocket = this.server.getPlayerSocket(auction.sellerId);
                if (sellerSocket) {
                    sellerSocket.emit('auctionSold', {
                        auction: this.getAuctionSummary(auction),
                        amount: sellerAmount
                    });
                }
                
                // Update market data
                this.updateMarketDataFromSale(auction);
                
            } catch (error) {
                console.error('Error ending auction:', error);
                auction.status = 'error';
            }
        } else {
            // No bids - return item to seller
            try {
                await this.addPlayerItem(auction.sellerId, auction.itemData);
                auction.status = 'expired';
                
                // Notify seller
                const socket = this.server.getPlayerSocket(auction.sellerId);
                if (socket) {
                    socket.emit('auctionExpired', {
                        auctionId: auctionId
                    });
                }
                
            } catch (error) {
                console.error('Error returning auction item:', error);
                auction.status = 'error';
            }
        }
        
        // Save to database
        await this.server.db.run(`
            UPDATE auctions SET status = ?, end_time = ?, buyer_id = ?, final_price = ? WHERE id = ?
        `, [auction.status, Date.now(), auction.buyerId || null, auction.finalPrice || null, auctionId]);
        
        // Add to history
        if (auction.status === 'sold') {
            this.auctionHistory.push({
                auctionId: auction.id,
                itemId: auction.itemId,
                price: auction.finalPrice,
                quantity: auction.quantity,
                timestamp: Date.now()
            });
        }
        
        // Remove from active auctions
        setTimeout(() => {
            this.auctions.delete(auctionId);
        }, 10000);
        
        console.log(`Auction ended: ${auction.itemData.name} - ${auction.status}`);
    }
    
    // Market system
    searchMarket(playerId, searchQuery) {
        const results = [];
        const query = searchQuery.toLowerCase();
        
        for (const auction of this.auctions.values()) {
            if (auction.status !== 'active') continue;
            
            const itemName = auction.itemData.name.toLowerCase();
            if (itemName.includes(query)) {
                results.push(this.getAuctionSummary(auction));
            }
        }
        
        // Sort by price (lowest first)
        results.sort((a, b) => a.currentBid - b.currentBid);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('marketSearchResults', {
                query: searchQuery,
                results: results
            });
        }
        
        return results;
    }
    
    browseMarket(playerId, category = null) {
        const results = [];
        
        for (const auction of this.auctions.values()) {
            if (auction.status !== 'active') continue;
            
            // Filter by category if specified
            if (category && auction.itemData.category !== category) continue;
            
            results.push(this.getAuctionSummary(auction));
        }
        
        // Sort by time ending soonest
        results.sort((a, b) => a.endTime - b.endTime);
        
        // Notify player
        const socket = this.server.getPlayerSocket(playerId);
        if (socket) {
            socket.emit('marketBrowseResults', {
                category: category,
                results: results
            });
        }
        
        return results;
    }
    
    updateMarketData() {
        // Update item prices based on recent sales
        const recentSales = this.auctionHistory.filter(sale => 
            Date.now() - sale.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
        );
        
        // Group by item and calculate average price
        const itemPrices = new Map();
        for (const sale of recentSales) {
            if (!itemPrices.has(sale.itemId)) {
                itemPrices.set(sale.itemId, []);
            }
            itemPrices.get(sale.itemId).push(sale.price / sale.quantity);
        }
        
        // Calculate average prices
        for (const [itemId, prices] of itemPrices) {
            const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            this.marketData.itemPrices.set(itemId, avgPrice);
            
            // Update price history
            if (!this.priceHistory.has(itemId)) {
                this.priceHistory.set(itemId, []);
            }
            this.priceHistory.get(itemId).push({
                price: avgPrice,
                quantity: 1,
                timestamp: Date.now()
            });
            
            // Keep only recent history
            const history = this.priceHistory.get(itemId);
            const cutoff = Date.now() - (this.config.priceHistoryDays * 24 * 60 * 60 * 1000);
            while (history.length > 0 && history[0].timestamp < cutoff) {
                history.shift();
            }
        }
        
        // Update trending items
        this.updateTrendingItems(recentSales);
        
        // Save market data
        this.saveMarketData();
    }
    
    updateTrendingItems(recentSales) {
        const itemSales = new Map();
        
        for (const sale of recentSales) {
            if (!itemSales.has(sale.itemId)) {
                itemSales.set(sale.itemId, { count: 0, volume: 0 });
            }
            const data = itemSales.get(sale.itemId);
            data.count++;
            data.volume += sale.price;
        }
        
        // Sort by sales volume
        const trending = Array.from(itemSales.entries())
            .sort((a, b) => b[1].volume - a[1].volume)
            .slice(0, 10);
        
        this.marketData.trendingItems = new Map(trending);
    }
    
    updateMarketDataFromTrade(trade) {
        // Update market data based on direct trades
        for (const participant of trade.participants) {
            for (const item of participant.items) {
                // This would need price information from the trade
                // For now, just track volume
                this.marketData.totalVolume += 1;
            }
        }
        
        this.marketData.totalTransactions += 1;
    }
    
    updateMarketDataFromSale(auction) {
        // Update market data from auction sale
        const pricePerUnit = auction.finalPrice / auction.quantity;
        this.marketData.itemPrices.set(auction.itemId, pricePerUnit);
        this.marketData.totalVolume += auction.finalPrice;
        this.marketData.totalTransactions += 1;
    }
    
    async saveMarketData() {
        try {
            await this.server.db.run(`
                INSERT OR REPLACE INTO market_stats 
                (total_volume, total_transactions, item_prices, trending_items, market_trends)
                VALUES (?, ?, ?, ?, ?)
            `, [
                this.marketData.totalVolume,
                this.marketData.totalTransactions,
                JSON.stringify(Array.from(this.marketData.itemPrices.entries())),
                JSON.stringify(Array.from(this.marketData.trendingItems.entries())),
                JSON.stringify(Array.from(this.marketData.marketTrends.entries()))
            ]);
            
            // Save price history
            for (const [itemId, history] of this.priceHistory) {
                for (const pricePoint of history) {
                    await this.server.db.run(`
                        INSERT OR REPLACE INTO item_price_history 
                        (item_id, price, quantity, timestamp)
                        VALUES (?, ?, ?, ?)
                    `, [itemId, pricePoint.price, pricePoint.quantity, pricePoint.timestamp]);
                }
            }
            
        } catch (error) {
            console.error('Error saving market data:', error);
        }
    }
    
    // Utility methods
    getPlayerTradingData(playerId) {
        if (!this.playerTradingData.has(playerId)) {
            this.playerTradingData.set(playerId, {
                playerId: playerId,
                dailyTrades: 0,
                lastReset: Date.now(),
                totalTrades: 0,
                totalVolume: 0,
                reputation: 0
            });
        }
        
        return this.playerTradingData.get(playerId);
    }
    
    updatePlayerTradeStats(playerId) {
        const playerData = this.getPlayerTradingData(playerId);
        playerData.dailyTrades++;
        playerData.totalTrades++;
        
        // Reset daily trades if needed
        const now = Date.now();
        const lastReset = new Date(playerData.lastReset);
        const today = new Date();
        
        if (lastReset.toDateString() !== today.toDateString()) {
            playerData.dailyTrades = 1;
            playerData.lastReset = now;
        }
    }
    
    setPlayerTradeStatus(playerId, tradeId) {
        const playerData = this.playerTradingData.get(playerId);
        if (playerData) {
            playerData.currentTrade = tradeId;
        }
    }
    
    clearPlayerTradeStatus(playerId) {
        const playerData = this.playerTradingData.get(playerId);
        if (playerData) {
            playerData.currentTrade = null;
        }
    }
    
    isPlayerInTrade(playerId) {
        const playerData = this.playerTradingData.get(playerId);
        return playerData && playerData.currentTrade !== null;
    }
    
    async getPlayerData(playerId) {
        try {
            const player = await this.server.db.get(
                'SELECT * FROM characters WHERE player_id = ?',
                [playerId]
            );
            return player;
        } catch (error) {
            console.error('Error getting player data:', error);
            return null;
        }
    }
    
    getPlayerDistance(playerId1, playerId2) {
        const player1 = this.server.worldManager.players.get(playerId1);
        const player2 = this.server.worldManager.players.get(playerId2);
        
        if (!player1 || !player2) return Infinity;
        
        return Math.sqrt(
            Math.pow(player1.x - player2.x, 2) + 
            Math.pow(player1.y - player2.y, 2)
        );
    }
    
    // Notification methods
    notifyTradeParticipants(trade, eventType, excludePlayerId = null) {
        for (const participant of trade.participants) {
            if (participant.playerId === excludePlayerId) continue;
            
            const socket = this.server.getPlayerSocket(participant.playerId);
            if (socket) {
                socket.emit('tradeUpdate', {
                    type: eventType,
                    trade: trade
                });
            }
        }
    }
    
    notifyAuctionUpdate(auction) {
        // Notify all players browsing the auction house
        this.server.io.emit('auctionUpdate', {
            auction: this.getAuctionSummary(auction)
        });
    }
    
    getAuctionSummary(auction) {
        return {
            id: auction.id,
            item: auction.itemData,
            quantity: auction.quantity,
            startingBid: auction.startingBid,
            currentBid: auction.currentBid,
            buyoutPrice: auction.buyoutPrice,
            bidderId: auction.bidderId,
            timeRemaining: Math.max(0, auction.endTime - Date.now()),
            sellerId: auction.sellerId
        };
    }
    
    // ID generators
    generateTradeId() {
        return 'trade_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    generateAuctionId() {
        return 'auction_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Public API
    getTrade(tradeId) {
        return this.activeTrades.get(tradeId);
    }
    
    getAuction(auctionId) {
        return this.auctions.get(auctionId);
    }
    
    getActiveAuctions(limit = 50) {
        const auctions = [];
        for (const auction of this.auctions.values()) {
            if (auction.status === 'active') {
                auctions.push(this.getAuctionSummary(auction));
            }
        }
        
        // Sort by time ending soonest
        auctions.sort((a, b) => a.timeRemaining - b.timeRemaining);
        
        return auctions.slice(0, limit);
    }
    
    getPlayerAuctions(playerId) {
        const auctions = [];
        for (const auction of this.auctions.values()) {
            if (auction.sellerId === playerId) {
                auctions.push(this.getAuctionSummary(auction));
            }
        }
        return auctions;
    }
    
    getItemPriceHistory(itemId, days = 7) {
        const history = this.priceHistory.get(itemId);
        if (!history) return [];
        
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        return history.filter(point => point.timestamp >= cutoff);
    }
    
    getMarketStats() {
        return {
            totalVolume: this.marketData.totalVolume,
            totalTransactions: this.marketData.totalTransactions,
            activeAuctions: this.auctions.size,
            trendingItems: Array.from(this.marketData.trendingItems.entries()).map(([id, data]) => ({
                itemId: id,
                salesCount: data.count,
                volume: data.volume
            }))
        };
    }
    
    // Cleanup
    async cleanup() {
        // Cancel all active trades
        for (const [tradeId, trade] of this.activeTrades) {
            this.cancelTrade(tradeId, 'Server shutdown');
        }
        
        // End all expired auctions
        this.cleanupExpiredAuctions();
        
        // Save market data
        await this.saveMarketData();
        
        // Clear data
        this.activeTrades.clear();
        this.auctions.clear();
        
        console.log('Trading System cleanup complete');
    }
}

module.exports = TradingSystem;
