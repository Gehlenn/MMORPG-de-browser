/**
 * Market System - Player Trading and Auction House
 * Handles item auctions, direct trades, and economic management
 * Version 0.3 - Complete Architecture Integration
 */

class MarketSystem {
    constructor(worldManager, database) {
        this.worldManager = worldManager;
        this.database = database;
        
        // Market configuration
        this.config = {
            auctionDuration: 24 * 60 * 60 * 1000, // 24 hours
            maxAuctions: 50, // Per player
            minBidIncrement: 0.05, // 5% minimum bid increment
            auctionFee: 0.05, // 5% auction house fee
            tradeFee: 0.02, // 2% direct trade fee
            
            // Market limits
            maxPrice: 1000000, // 1 million gold max price
            minPrice: 1, // Minimum price
            priceHistoryDays: 30, // Days to keep price history
            
            // Trade settings
            maxTradeDistance: 50, // Units
            tradeTimeout: 60000, // 1 minute
            maxTradeSlots: 10, // Items per trade
            
            // Economy settings
            goldSinkRate: 0.1, // 10% of transactions go to gold sink
            taxRate: 0.03, // 3% sales tax
            inflationControl: true,
            
            // Market categories
            categories: [
                'weapon', 'armor', 'consumable', 'material', 'gem', 
                'recipe', 'misc', 'quest', 'currency'
            ]
        };
        
        // Auction house
        this.auctions = new Map(); // auctionId -> Auction
        this.bids = new Map(); // bidId -> Bid
        
        // Price history
        this.priceHistory = new Map(); // itemId -> Array<price data>
        
        // Trade requests
        this.tradeRequests = new Map(); // tradeId -> Trade
        this.activeTrades = new Map(); // playerId -> Trade
        
        // Market statistics
        this.marketStats = {
            totalTransactions: 0,
            totalGoldTraded: 0,
            totalItemsTraded: 0,
            averagePrices: new Map(),
            marketVolume: 0,
            topSellers: new Map(),
            topBuyers: new Map(),
            mostTradedItems: new Map(),
            economicIndicators: {
                inflation: 0,
                liquidity: 0,
                volatility: 0
            }
        };
        
        // Player market data
        this.playerMarketData = new Map();
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Load market data
        this.loadMarketData();
        
        // Setup event handlers
        this.setupEventHandlers();
        
        // Start update loops
        this.startUpdateLoops();
        
        console.log('Market System initialized');
    }
    
    async loadMarketData() {
        try {
            // Load auctions
            const auctionData = await this.database.get('market_auctions');
            if (auctionData) {
                for (const [auctionId, data] of Object.entries(auctionData)) {
                    this.auctions.set(auctionId, {
                        ...data,
                        startTime: new Date(data.startTime),
                        endTime: new Date(data.endTime),
                        bids: data.bids ? new Map(Object.entries(data.bids)) : new Map()
                    });
                }
            }
            
            // Load price history
            const priceData = await this.database.get('market_price_history');
            if (priceData) {
                for (const [itemId, history] of Object.entries(priceData)) {
                    this.priceHistory.set(itemId, history);
                }
            }
            
            // Load market statistics
            const stats = await this.database.get('market_statistics');
            if (stats) {
                this.marketStats = {
                    ...stats,
                    averagePrices: new Map(Object.entries(stats.averagePrices || {})),
                    topSellers: new Map(Object.entries(stats.topSellers || {})),
                    topBuyers: new Map(Object.entries(stats.topBuyers || {})),
                    mostTradedItems: new Map(Object.entries(stats.mostTradedItems || {}))
                };
            }
            
            // Load player market data
            const playerData = await this.database.get('player_market_data');
            if (playerData) {
                for (const [playerId, data] of Object.entries(playerData)) {
                    this.playerMarketData.set(playerId, {
                        auctions: new Set(data.auctions || []),
                        bids: new Set(data.bids || []),
                        trades: data.trades || [],
                        favorites: new Set(data.favorites || []),
                        blacklisted: new Set(data.blacklisted || []),
                        statistics: data.statistics || {
                            itemsSold: 0,
                            itemsBought: 0,
                            goldEarned: 0,
                            goldSpent: 0,
                            totalTransactions: 0
                        },
                        lastUpdate: data.lastUpdate || Date.now()
                    });
                }
            }
            
        } catch (error) {
            console.error('Error loading market data:', error);
        }
    }
    
    setupEventHandlers() {
        // Listen to player events
        this.worldManager.on('player_disconnected', (playerId) => {
            this.onPlayerDisconnected(playerId);
        });
        
        // Listen to item events
        this.worldManager.on('item_crafted', (playerId, item) => {
            this.onItemCrafted(playerId, item);
        });
    }
    
    startUpdateLoops() {
        // Update auctions every minute
        setInterval(() => {
            this.updateAuctions();
        }, 60000);
        
        // Update market statistics every 5 minutes
        setInterval(() => {
            this.updateMarketStatistics();
        }, 300000);
        
        // Cleanup expired data every hour
        setInterval(() => {
            this.cleanupExpiredData();
        }, 3600000);
        
        // Save data every 10 minutes
        setInterval(() => {
            this.saveMarketData();
        }, 600000);
    }
    
    // Auction House System
    async createAuction(playerId, item, startingPrice, buyoutPrice = null, duration = null) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        // Validate input
        if (!item || !startingPrice || startingPrice < this.config.minPrice || startingPrice > this.config.maxPrice) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'auction_failed',
                reason: 'invalid_price',
                message: 'Preço inválido.'
            });
            return false;
        }
        
        if (buyoutPrice && buyoutPrice <= startingPrice) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'auction_failed',
                reason: 'invalid_buyout',
                message: 'Preço de compra deve ser maior que o lance inicial.'
            });
            return false;
        }
        
        // Check player's auction limit
        const playerData = this.getPlayerMarketData(playerId);
        if (playerData.auctions.size >= this.config.maxAuctions) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'auction_failed',
                reason: 'auction_limit',
                message: `Você atingiu o limite de ${this.config.maxAuctions} leilões.`
            });
            return false;
        }
        
        // Check if player has the item
        if (!player.hasItem(item.id, item.quantity)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'auction_failed',
                reason: 'no_item',
                message: 'Você não possui este item.'
            });
            return false;
        }
        
        // Remove item from inventory
        player.removeFromInventory(item.id, item.quantity);
        
        // Create auction
        const auctionId = `auction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        
        const auction = {
            id: auctionId,
            sellerId: playerId,
            sellerName: player.name,
            item: {
                id: item.id,
                baseId: item.baseId,
                name: item.name,
                quantity: item.quantity,
                quality: item.quality,
                stats: item.stats,
                enchantments: item.enchantments,
                sockets: item.sockets
            },
            startingPrice: startingPrice,
            currentBid: startingPrice,
            buyoutPrice: buyoutPrice,
            startTime: now,
            endTime: new Date(now.getTime() + (duration || this.config.auctionDuration)),
            bids: new Map(),
            status: 'active',
            category: this.getItemCategory(item),
            views: 0,
            watchers: new Set()
        };
        
        this.auctions.set(auctionId, auction);
        playerData.auctions.add(auctionId);
        
        // Save data
        await this.saveMarketData();
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'auction_created',
            auctionId: auctionId,
            auction: this.sanitizeAuction(auction),
            message: 'Item colocado em leilão com sucesso!'
        });
        
        // Update market activity
        this.recordMarketActivity('auction_created', {
            playerId: playerId,
            itemId: item.baseId,
            price: startingPrice
        });
        
        console.log(`Player ${player.name} created auction for ${item.name}`);
        return auctionId;
    }
    
    async placeBid(playerId, auctionId, bidAmount) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const auction = this.auctions.get(auctionId);
        if (!auction) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'bid_failed',
                reason: 'auction_not_found',
                message: 'Leilão não encontrado.'
            });
            return false;
        }
        
        // Validate auction
        if (auction.status !== 'active') {
            this.worldManager.sendToPlayer(playerId, {
                type: 'bid_failed',
                reason: 'auction_not_active',
                message: 'Este leilão não está mais ativo.'
            });
            return false;
        }
        
        if (auction.sellerId === playerId) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'bid_failed',
                reason: 'own_auction',
                message: 'Você não pode dar lance em seu próprio leilão.'
            });
            return false;
        }
        
        // Validate bid amount
        const minBid = auction.currentBid + Math.max(1, Math.floor(auction.currentBid * this.config.minBidIncrement));
        if (bidAmount < minBid) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'bid_failed',
                reason: 'bid_too_low',
                message: `Lance mínimo é ${minBid} gold.`,
                minBid: minBid
            });
            return false;
        }
        
        if (auction.buyoutPrice && bidAmount >= auction.buyoutPrice) {
            // Buyout triggered
            return this.executeBuyout(playerId, auctionId);
        }
        
        // Check if player has enough gold
        if (player.gold < bidAmount) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'bid_failed',
                reason: 'insufficient_gold',
                message: 'Gold insuficiente.'
            });
            return false;
        }
        
        // Refund previous highest bidder
        if (auction.bids.size > 0) {
            const highestBid = Array.from(auction.bids.values()).sort((a, b) => b.amount - a.amount)[0];
            if (highestBid) {
                const previousBidder = this.worldManager.connectedPlayers.get(highestBid.bidderId);
                if (previousBidder) {
                    previousBidder.gold += highestBid.amount;
                    
                    this.worldManager.sendToPlayer(highestBid.bidderId, {
                        type: 'bid_outbid',
                        auctionId: auctionId,
                        itemName: auction.item.name,
                        newBid: bidAmount,
                        message: 'Você foi superado no leilão!'
                    });
                }
            }
        }
        
        // Deduct gold from new bidder
        player.gold -= bidAmount;
        
        // Place bid
        const bidId = `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const bid = {
            id: bidId,
            auctionId: auctionId,
            bidderId: playerId,
            bidderName: player.name,
            amount: bidAmount,
            timestamp: new Date()
        };
        
        auction.bids.set(bidId, bid);
        auction.currentBid = bidAmount;
        
        // Update player data
        const playerData = this.getPlayerMarketData(playerId);
        playerData.bids.add(bidId);
        
        // Add to watchers
        auction.watchers.add(playerId);
        
        // Save data
        await this.saveMarketData();
        
        // Notify players
        this.notifyAuctionUpdate(auction);
        
        // Update market activity
        this.recordMarketActivity('bid_placed', {
            playerId: playerId,
            auctionId: auctionId,
            amount: bidAmount
        });
        
        console.log(`Player ${player.name} placed bid of ${bidAmount} on ${auction.item.name}`);
        return true;
    }
    
    async executeBuyout(playerId, auctionId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const auction = this.auctions.get(auctionId);
        if (!auction || !auction.buyoutPrice) return false;
        
        // Check if player has enough gold
        if (player.gold < auction.buyoutPrice) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'buyout_failed',
                reason: 'insufficient_gold',
                message: 'Gold insuficiente para compra direta.'
            });
            return false;
        }
        
        // Process buyout
        const buyoutPrice = auction.buyoutPrice;
        const fee = Math.floor(buyoutPrice * this.config.auctionFee);
        const sellerProfit = buyoutPrice - fee;
        
        // Deduct gold from buyer
        player.gold -= buyoutPrice;
        
        // Give item to buyer
        player.addToInventory(auction.item);
        
        // Give gold to seller
        const seller = this.worldManager.connectedPlayers.get(auction.sellerId);
        if (seller) {
            seller.gold += sellerProfit;
            
            this.worldManager.sendToPlayer(auction.sellerId, {
                type: 'auction_sold',
                auctionId: auctionId,
                itemName: auction.item.name,
                price: buyoutPrice,
                profit: sellerProfit,
                buyerName: player.name,
                message: `Seu item ${auction.item.name} foi vendido!`
            });
        } else {
            // Seller offline - save gold for later
            await this.saveOfflineGold(auction.sellerId, sellerProfit);
        }
        
        // Refund any existing bids
        for (const bid of auction.bids.values()) {
            if (bid.bidderId !== playerId) {
                const bidder = this.worldManager.connectedPlayers.get(bid.bidderId);
                if (bidder) {
                    bidder.gold += bid.amount;
                    
                    this.worldManager.sendToPlayer(bid.bidderId, {
                        type: 'auction_ended',
                        auctionId: auctionId,
                        reason: 'buyout',
                        message: 'Leilão encerrado por compra direta.'
                    });
                }
            }
        }
        
        // Update statistics
        this.updateTransactionStatistics(playerId, auction.sellerId, buyoutPrice, auction.item);
        
        // Close auction
        auction.status = 'sold';
        auction.endTime = new Date();
        auction.winnerId = playerId;
        
        // Update price history
        this.updatePriceHistory(auction.item.baseId, buyoutPrice);
        
        // Save data
        await this.saveMarketData();
        
        // Notify buyer
        this.worldManager.sendToPlayer(playerId, {
            type: 'buyout_success',
            auctionId: auctionId,
            item: auction.item,
            price: buyoutPrice,
            message: `Você comprou ${auction.item.name} por ${buyoutPrice} gold!`
        });
        
        // Remove from player's active auctions
        const sellerData = this.getPlayerMarketData(auction.sellerId);
        sellerData.auctions.delete(auctionId);
        
        console.log(`Player ${player.name} bought ${auction.item.name} for ${buyoutPrice} gold`);
        return true;
    }
    
    async cancelAuction(playerId, auctionId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player) return false;
        
        const auction = this.auctions.get(auctionId);
        if (!auction) return false;
        
        // Check ownership
        if (auction.sellerId !== playerId) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'cancel_failed',
                reason: 'not_owner',
                message: 'Você não pode cancelar leilões de outros jogadores.'
            });
            return false;
        }
        
        // Check if there are bids
        if (auction.bids.size > 0) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'cancel_failed',
                reason: 'has_bids',
                message: 'Não é possível cancelar leilões com lances.'
            });
            return false;
        }
        
        // Return item to seller
        player.addToInventory(auction.item);
        
        // Close auction
        auction.status = 'cancelled';
        auction.endTime = new Date();
        
        // Remove from player's active auctions
        const playerData = this.getPlayerMarketData(playerId);
        playerData.auctions.delete(auctionId);
        
        // Save data
        await this.saveMarketData();
        
        // Notify player
        this.worldManager.sendToPlayer(playerId, {
            type: 'auction_cancelled',
            auctionId: auctionId,
            itemName: auction.item.name,
            message: 'Leilão cancelado. Item devolvido ao seu inventário.'
        });
        
        console.log(`Player ${player.name} cancelled auction for ${auction.item.name}`);
        return true;
    }
    
    // Direct Trading System
    async initiateTrade(playerId, targetId) {
        const player = this.worldManager.connectedPlayers.get(playerId);
        const target = this.worldManager.connectedPlayers.get(targetId);
        
        if (!player || !target) return false;
        
        // Check distance
        const distance = this.calculateDistance(player, target);
        if (distance > this.config.maxTradeDistance) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_failed',
                reason: 'too_far',
                message: 'Jogador está muito longe.'
            });
            return false;
        }
        
        // Check if either player is already in trade
        if (this.activeTrades.has(playerId) || this.activeTrades.has(targetId)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_failed',
                reason: 'already_trading',
                message: 'Você ou o outro jogador já estão em uma negociação.'
            });
            return false;
        }
        
        // Check blacklist
        const playerData = this.getPlayerMarketData(playerId);
        const targetData = this.getPlayerMarketData(targetId);
        
        if (playerData.blacklisted.has(targetId) || targetData.blacklisted.has(playerId)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_failed',
                reason: 'blacklisted',
                message: 'Não é possível negociar com este jogador.'
            });
            return false;
        }
        
        // Create trade
        const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const trade = {
            id: tradeId,
            initiatorId: playerId,
            targetId: targetId,
            status: 'pending',
            startTime: Date.now(),
            
            player1: {
                id: playerId,
                name: player.name,
                items: [],
                gold: 0,
                accepted: false,
                locked: false
            },
            
            player2: {
                id: targetId,
                name: target.name,
                items: [],
                gold: 0,
                accepted: false,
                locked: false
            }
        };
        
        this.tradeRequests.set(tradeId, trade);
        
        // Send trade request to target
        this.worldManager.sendToPlayer(targetId, {
            type: 'trade_request',
            tradeId: tradeId,
            initiatorName: player.name,
            message: `${player.name} deseja negociar com você.`
        });
        
        // Set timeout for trade request
        setTimeout(() => {
            if (this.tradeRequests.has(tradeId) && trade.status === 'pending') {
                this.declineTrade(targetId, tradeId);
            }
        }, this.config.tradeTimeout);
        
        console.log(`Player ${player.name} initiated trade with ${target.name}`);
        return tradeId;
    }
    
    async acceptTrade(playerId, tradeId) {
        const trade = this.tradeRequests.get(tradeId);
        if (!trade) return false;
        
        // Verify player is the target
        if (trade.targetId !== playerId) return false;
        
        // Move to active trades
        trade.status = 'active';
        this.activeTrades.set(trade.player1.id, trade);
        this.activeTrades.set(trade.player2.id, trade);
        
        // Notify both players
        this.worldManager.sendToPlayer(trade.player1.id, {
            type: 'trade_accepted',
            tradeId: tradeId,
            message: 'Negociação aceita!'
        });
        
        this.worldManager.sendToPlayer(trade.player2.id, {
            type: 'trade_accepted',
            tradeId: tradeId,
            message: 'Negociação aceita!'
        });
        
        // Send initial trade state
        this.sendTradeUpdate(trade);
        
        return true;
    }
    
    async declineTrade(playerId, tradeId) {
        const trade = this.tradeRequests.get(tradeId);
        if (!trade) return false;
        
        // Verify player is involved
        if (trade.player1.id !== playerId && trade.player2.id !== playerId) return false;
        
        // Notify both players
        this.worldManager.sendToPlayer(trade.player1.id, {
            type: 'trade_declined',
            tradeId: tradeId,
            message: 'Solicitação de negociação recusada.'
        });
        
        this.worldManager.sendToPlayer(trade.player2.id, {
            type: 'trade_declined',
            tradeId: tradeId,
            message: 'Solicitação de negociação recusada.'
        });
        
        // Clean up
        this.tradeRequests.delete(tradeId);
        
        return true;
    }
    
    async addToTrade(playerId, tradeId, item) {
        const trade = this.getTradeByPlayer(playerId, tradeId);
        if (!trade || trade.status !== 'active') return false;
        
        const playerData = trade.player1.id === playerId ? trade.player1 : trade.player2;
        
        // Check if player is locked
        if (playerData.locked) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_error',
                message: 'Você não pode modificar itens após confirmar.'
            });
            return false;
        }
        
        // Check trade slot limit
        if (playerData.items.length >= this.config.maxTradeSlots) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_error',
                message: 'Limite de itens na negociação atingido.'
            });
            return false;
        }
        
        // Check if player has the item
        const player = this.worldManager.connectedPlayers.get(playerId);
        if (!player || !player.hasItem(item.id, item.quantity)) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_error',
                message: 'Você não possui este item.'
            });
            return false;
        }
        
        // Add item to trade
        playerData.items.push(item);
        
        // Reset acceptance status
        trade.player1.accepted = false;
        trade.player2.accepted = false;
        
        // Update trade
        this.sendTradeUpdate(trade);
        
        return true;
    }
    
    async removeFromTrade(playerId, tradeId, itemIndex) {
        const trade = this.getTradeByPlayer(playerId, tradeId);
        if (!trade || trade.status !== 'active') return false;
        
        const playerData = trade.player1.id === playerId ? trade.player1 : trade.player2;
        
        // Check if player is locked
        if (playerData.locked) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_error',
                message: 'Você não pode modificar itens após confirmar.'
            });
            return false;
        }
        
        // Remove item
        if (itemIndex >= 0 && itemIndex < playerData.items.length) {
            playerData.items.splice(itemIndex, 1);
            
            // Reset acceptance status
            trade.player1.accepted = false;
            trade.player2.accepted = false;
            
            // Update trade
            this.sendTradeUpdate(trade);
        }
        
        return true;
    }
    
    async setTradeGold(playerId, tradeId, amount) {
        const trade = this.getTradeByPlayer(playerId, tradeId);
        if (!trade || trade.status !== 'active') return false;
        
        const playerData = trade.player1.id === playerId ? trade.player1 : trade.player2;
        const player = this.worldManager.connectedPlayers.get(playerId);
        
        // Check if player is locked
        if (playerData.locked) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_error',
                message: 'Você não pode modificar gold após confirmar.'
            });
            return false;
        }
        
        // Check if player has enough gold
        if (!player || player.gold < amount) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'trade_error',
                message: 'Gold insuficiente.'
            });
            return false;
        }
        
        playerData.gold = amount;
        
        // Reset acceptance status
        trade.player1.accepted = false;
        trade.player2.accepted = false;
        
        // Update trade
        this.sendTradeUpdate(trade);
        
        return true;
    }
    
    async acceptTradeOffer(playerId, tradeId) {
        const trade = this.getTradeByPlayer(playerId, tradeId);
        if (!trade || trade.status !== 'active') return false;
        
        const playerData = trade.player1.id === playerId ? trade.player1 : trade.player2;
        
        // Lock player's offer
        playerData.locked = true;
        playerData.accepted = true;
        
        // Check if both players accepted
        if (trade.player1.accepted && trade.player2.accepted) {
            await this.executeTrade(trade);
        } else {
            // Update trade status
            this.sendTradeUpdate(trade);
        }
        
        return true;
    }
    
    async executeTrade(trade) {
        const player1 = this.worldManager.connectedPlayers.get(trade.player1.id);
        const player2 = this.worldManager.connectedPlayers.get(trade.player2.id);
        
        if (!player1 || !player2) {
            this.cancelTrade(trade.id, 'player_offline');
            return false;
        }
        
        // Verify both players still have the items and gold
        if (!this.validateTradeAssets(trade, player1, player2)) {
            this.cancelTrade(trade.id, 'invalid_assets');
            return false;
        }
        
        // Calculate trade fee
        const totalValue = this.calculateTradeValue(trade);
        const fee = Math.floor(totalValue * this.config.tradeFee);
        
        // Remove items and gold from players
        for (const item of trade.player1.items) {
            player1.removeFromInventory(item.id, item.quantity);
        }
        player1.gold -= trade.player1.gold + (trade.player1.id === trade.initiatorId ? fee : 0);
        
        for (const item of trade.player2.items) {
            player2.removeFromInventory(item.id, item.quantity);
        }
        player2.gold -= trade.player2.gold + (trade.player2.id === trade.initiatorId ? fee : 0);
        
        // Give items and gold to players
        for (const item of trade.player2.items) {
            player1.addToInventory(item);
        }
        player1.gold += trade.player2.gold;
        
        for (const item of trade.player1.items) {
            player2.addToInventory(item);
        }
        player2.gold += trade.player1.gold;
        
        // Update statistics
        this.updateTransactionStatistics(trade.player1.id, trade.player2.id, totalValue, null);
        
        // Update player market data
        const player1Data = this.getPlayerMarketData(trade.player1.id);
        const player2Data = this.getPlayerMarketData(trade.player2.id);
        
        player1Data.trades.push({
            tradeId: trade.id,
            partnerId: trade.player2.id,
            partnerName: trade.player2.name,
            timestamp: Date.now(),
            itemsGiven: trade.player1.items,
            itemsReceived: trade.player2.items,
            goldGiven: trade.player1.gold,
            goldReceived: trade.player2.gold,
            fee: trade.player1.id === trade.initiatorId ? fee : 0
        });
        
        player2Data.trades.push({
            tradeId: trade.id,
            partnerId: trade.player1.id,
            partnerName: trade.player1.name,
            timestamp: Date.now(),
            itemsGiven: trade.player2.items,
            itemsReceived: trade.player1.items,
            goldGiven: trade.player2.gold,
            goldReceived: trade.player1.gold,
            fee: trade.player2.id === trade.initiatorId ? fee : 0
        });
        
        // Notify players
        this.worldManager.sendToPlayer(trade.player1.id, {
            type: 'trade_completed',
            message: 'Negociação concluída com sucesso!'
        });
        
        this.worldManager.sendToPlayer(trade.player2.id, {
            type: 'trade_completed',
            message: 'Negociação concluída com sucesso!'
        });
        
        // Clean up
        this.activeTrades.delete(trade.player1.id);
        this.activeTrades.delete(trade.player2.id);
        this.tradeRequests.delete(trade.id);
        
        // Save data
        await this.saveMarketData();
        
        console.log(`Trade completed between ${trade.player1.name} and ${trade.player2.name}`);
        return true;
    }
    
    async cancelTrade(tradeId, reason = 'cancelled') {
        const trade = this.tradeRequests.get(tradeId);
        if (!trade) return false;
        
        // Notify players
        if (trade.player1.id) {
            this.worldManager.sendToPlayer(trade.player1.id, {
                type: 'trade_cancelled',
                reason: reason,
                message: 'Negociação cancelada.'
            });
        }
        
        if (trade.player2.id) {
            this.worldManager.sendToPlayer(trade.player2.id, {
                type: 'trade_cancelled',
                reason: reason,
                message: 'Negociação cancelada.'
            });
        }
        
        // Clean up
        this.activeTrades.delete(trade.player1.id);
        this.activeTrades.delete(trade.player2.id);
        this.tradeRequests.delete(tradeId);
        
        return true;
    }
    
    // Market Information
    getAuctions(filters = {}) {
        let auctions = Array.from(this.auctions.values());
        
        // Apply filters
        if (filters.category) {
            auctions = auctions.filter(a => a.category === filters.category);
        }
        
        if (filters.minPrice) {
            auctions = auctions.filter(a => a.currentBid >= filters.minPrice);
        }
        
        if (filters.maxPrice) {
            auctions = auctions.filter(a => a.currentBid <= filters.maxPrice);
        }
        
        if (filters.quality) {
            auctions = auctions.filter(a => a.item.quality === filters.quality);
        }
        
        if (filters.search) {
            const search = filters.search.toLowerCase();
            auctions = auctions.filter(a => 
                a.item.name.toLowerCase().includes(search) ||
                a.item.baseId.toLowerCase().includes(search)
            );
        }
        
        // Sort
        const sortBy = filters.sortBy || 'endTime';
        const sortOrder = filters.sortOrder || 'asc';
        
        auctions.sort((a, b) => {
            let comparison = 0;
            
            switch (sortBy) {
                case 'price':
                    comparison = a.currentBid - b.currentBid;
                    break;
                case 'endTime':
                    comparison = a.endTime - b.endTime;
                    break;
                case 'bids':
                    comparison = a.bids.size - b.bids.size;
                    break;
                default:
                    comparison = a.endTime - b.endTime;
            }
            
            return sortOrder === 'desc' ? -comparison : comparison;
        });
        
        // Limit results
        const limit = filters.limit || 50;
        auctions = auctions.slice(0, limit);
        
        return auctions.map(auction => this.sanitizeAuction(auction));
    }
    
    getPriceHistory(itemId, days = 7) {
        const history = this.priceHistory.get(itemId) || [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        return history.filter(entry => new Date(entry.date) >= cutoff);
    }
    
    getMarketStatistics() {
        return {
            ...this.marketStats,
            averagePrices: Object.fromEntries(this.marketStats.averagePrices),
            topSellers: Object.fromEntries(this.marketStats.topSellers),
            topBuyers: Object.fromEntries(this.marketStats.topBuyers),
            mostTradedItems: Object.fromEntries(this.marketStats.mostTradedItems)
        };
    }
    
    // Utility methods
    getPlayerMarketData(playerId) {
        if (!this.playerMarketData.has(playerId)) {
            this.playerMarketData.set(playerId, {
                auctions: new Set(),
                bids: new Set(),
                trades: [],
                favorites: new Set(),
                blacklisted: new Set(),
                statistics: {
                    itemsSold: 0,
                    itemsBought: 0,
                    goldEarned: 0,
                    goldSpent: 0,
                    totalTransactions: 0
                },
                lastUpdate: Date.now()
            });
        }
        
        return this.playerMarketData.get(playerId);
    }
    
    getItemCategory(item) {
        // Determine item category based on type or other properties
        if (item.type === 'weapon' || item.type === 'dagger' || item.type === 'sword') {
            return 'weapon';
        } else if (item.type === 'armor' || item.type.includes('armor')) {
            return 'armor';
        } else if (item.category === 'consumable' || item.type === 'potion') {
            return 'consumable';
        } else if (item.baseId && item.baseId.includes('ore') || item.baseId.includes('bar')) {
            return 'material';
        } else if (item.baseId && (item.baseId.includes('ruby') || item.baseId.includes('gem'))) {
            return 'gem';
        } else {
            return 'misc';
        }
    }
    
    sanitizeAuction(auction) {
        return {
            id: auction.id,
            sellerName: auction.sellerName,
            item: auction.item,
            startingPrice: auction.startingPrice,
            currentBid: auction.currentBid,
            buyoutPrice: auction.buyoutPrice,
            endTime: auction.endTime,
            bidCount: auction.bids.size,
            category: auction.category
        };
    }
    
    getTradeByPlayer(playerId, tradeId) {
        const trade = this.tradeRequests.get(tradeId);
        if (!trade) return null;
        
        if (trade.player1.id === playerId || trade.player2.id === playerId) {
            return trade;
        }
        
        return null;
    }
    
    calculateDistance(player1, player2) {
        const dx = player1.x - player2.x;
        const dy = player1.y - player2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    validateTradeAssets(trade, player1, player2) {
        // Check player 1 assets
        if (player1.gold < trade.player1.gold) return false;
        for (const item of trade.player1.items) {
            if (!player1.hasItem(item.id, item.quantity)) return false;
        }
        
        // Check player 2 assets
        if (player2.gold < trade.player2.gold) return false;
        for (const item of trade.player2.items) {
            if (!player2.hasItem(item.id, item.quantity)) return false;
        }
        
        return true;
    }
    
    calculateTradeValue(trade) {
        let value = trade.player1.gold + trade.player2.gold;
        
        // Add estimated item values (simplified)
        for (const item of trade.player1.items) {
            value += this.estimateItemValue(item) * item.quantity;
        }
        
        for (const item of trade.player2.items) {
            value += this.estimateItemValue(item) * item.quantity;
        }
        
        return value;
    }
    
    estimateItemValue(item) {
        // Simplified item valuation
        const baseValues = {
            copper_bar: 10,
            iron_bar: 25,
            mithril_bar: 100,
            health_potion: 15,
            mana_potion: 20
        };
        
        return baseValues[item.baseId] || 50;
    }
    
    sendTradeUpdate(trade) {
        const update = {
            type: 'trade_update',
            tradeId: trade.id,
            player1: {
                items: trade.player1.items,
                gold: trade.player1.gold,
                accepted: trade.player1.accepted,
                locked: trade.player1.locked
            },
            player2: {
                items: trade.player2.items,
                gold: trade.player2.gold,
                accepted: trade.player2.accepted,
                locked: trade.player2.locked
            }
        };
        
        this.worldManager.sendToPlayer(trade.player1.id, update);
        this.worldManager.sendToPlayer(trade.player2.id, update);
    }
    
    // Update loops
    updateAuctions() {
        const now = new Date();
        const toEnd = [];
        
        for (const [auctionId, auction] of this.auctions) {
            if (auction.status === 'active' && auction.endTime <= now) {
                toEnd.push(auction);
            }
        }
        
        for (const auction of toEnd) {
            this.endAuction(auction);
        }
    }
    
    async endAuction(auction) {
        if (auction.bids.size === 0) {
            // No bids - return item to seller
            const seller = this.worldManager.connectedPlayers.get(auction.sellerId);
            if (seller) {
                seller.addToInventory(auction.item);
                
                this.worldManager.sendToPlayer(auction.sellerId, {
                    type: 'auction_expired',
                    auctionId: auction.id,
                    itemName: auction.item.name,
                    message: 'Seu leilão expirou sem lances. Item devolvido.'
                });
            }
            
            auction.status = 'expired';
        } else {
            // Award to highest bidder
            const bids = Array.from(auction.bids.values());
            bids.sort((a, b) => b.amount - a.amount);
            const winningBid = bids[0];
            
            const winner = this.worldManager.connectedPlayers.get(winningBid.bidderId);
            const seller = this.worldManager.connectedPlayers.get(auction.sellerId);
            
            const fee = Math.floor(winningBid.amount * this.config.auctionFee);
            const sellerProfit = winningBid.amount - fee;
            
            // Give item to winner
            if (winner) {
                winner.addToInventory(auction.item);
                
                this.worldManager.sendToPlayer(winningBid.bidderId, {
                    type: 'auction_won',
                    auctionId: auction.id,
                    item: auction.item,
                    price: winningBid.amount,
                    message: `Você venceu o leilão por ${auction.item.name}!`
                });
            }
            
            // Give gold to seller
            if (seller) {
                seller.gold += sellerProfit;
                
                this.worldManager.sendToPlayer(auction.sellerId, {
                    type: 'auction_sold',
                    auctionId: auction.id,
                    itemName: auction.item.name,
                    price: winningBid.amount,
                    profit: sellerProfit,
                    buyerName: winningBid.bidderName,
                    message: `Seu item ${auction.item.name} foi vendido!`
                });
            } else {
                // Seller offline - save gold
                await this.saveOfflineGold(auction.sellerId, sellerProfit);
            }
            
            // Update price history
            this.updatePriceHistory(auction.item.baseId, winningBid.amount);
            
            // Update statistics
            this.updateTransactionStatistics(winningBid.bidderId, auction.sellerId, winningBid.amount, auction.item);
            
            auction.status = 'sold';
            auction.winnerId = winningBid.bidderId;
        }
        
        // Remove from seller's active auctions
        const sellerData = this.getPlayerMarketData(auction.sellerId);
        sellerData.auctions.delete(auction.id);
        
        // Save data
        await this.saveMarketData();
    }
    
    updatePriceHistory(itemId, price) {
        if (!this.priceHistory.has(itemId)) {
            this.priceHistory.set(itemId, []);
        }
        
        const history = this.priceHistory.get(itemId);
        history.push({
            price: price,
            date: new Date()
        });
        
        // Keep only last N days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.config.priceHistoryDays);
        
        const filtered = history.filter(entry => new Date(entry.date) >= cutoff);
        this.priceHistory.set(itemId, filtered);
        
        // Update average price
        const avgPrice = filtered.reduce((sum, entry) => sum + entry.price, 0) / filtered.length;
        this.marketStats.averagePrices.set(itemId, Math.floor(avgPrice));
    }
    
    updateTransactionStatistics(buyerId, sellerId, amount, item) {
        this.marketStats.totalTransactions++;
        this.marketStats.totalGoldTraded += amount;
        this.marketStats.marketVolume += amount;
        
        if (item) {
            this.marketStats.totalItemsTraded++;
            
            const current = this.marketStats.mostTradedItems.get(item.baseId) || 0;
            this.marketStats.mostTradedItems.set(item.baseId, current + 1);
        }
        
        // Update top sellers
        const sellerCurrent = this.marketStats.topSellers.get(sellerId) || { gold: 0, transactions: 0 };
        sellerCurrent.gold += amount;
        sellerCurrent.transactions++;
        this.marketStats.topSellers.set(sellerId, sellerCurrent);
        
        // Update top buyers
        const buyerCurrent = this.marketStats.topBuyers.get(buyerId) || { gold: 0, transactions: 0 };
        buyerCurrent.gold += amount;
        buyerCurrent.transactions++;
        this.marketStats.topBuyers.set(buyerId, buyerCurrent);
    }
    
    updateMarketStatistics() {
        // Calculate economic indicators
        const totalGold = this.marketStats.totalGoldTraded;
        const transactionCount = this.marketStats.totalTransactions;
        
        this.marketStats.economicIndicators.liquidity = transactionCount > 0 ? totalGold / transactionCount : 0;
        
        // Calculate inflation (simplified)
        const avgPrices = Array.from(this.marketStats.averagePrices.values());
        if (avgPrices.length > 0) {
            const avgPrice = avgPrices.reduce((sum, price) => sum + price, 0) / avgPrices.length;
            this.marketStats.economicIndicators.inflation = (avgPrice - 100) / 100; // Relative to base price of 100
        }
        
        // Calculate volatility (price variation)
        let totalVariation = 0;
        let priceCount = 0;
        
        for (const [itemId, history] of this.priceHistory) {
            if (history.length > 1) {
                const prices = history.map(h => h.price);
                const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
                const variance = prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length;
                totalVariation += Math.sqrt(variance);
                priceCount++;
            }
        }
        
        this.marketStats.economicIndicators.volatility = priceCount > 0 ? totalVariation / priceCount : 0;
    }
    
    cleanupExpiredData() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.config.priceHistoryDays);
        
        // Clean old price history
        for (const [itemId, history] of this.priceHistory) {
            const filtered = history.filter(entry => new Date(entry.date) >= cutoff);
            this.priceHistory.set(itemId, filtered);
        }
        
        // Clean old auctions
        for (const [auctionId, auction] of this.auctions) {
            if (auction.status !== 'active' && auction.endTime < cutoff) {
                this.auctions.delete(auctionId);
            }
        }
    }
    
    // Event handlers
    onPlayerDisconnected(playerId) {
        // Cancel active trades
        const trade = this.activeTrades.get(playerId);
        if (trade) {
            this.cancelTrade(trade.id, 'player_offline');
        }
    }
    
    onItemCrafted(playerId, item) {
        // Suggest auction price based on market data
        const avgPrice = this.marketStats.averagePrices.get(item.baseId);
        if (avgPrice) {
            this.worldManager.sendToPlayer(playerId, {
                type: 'auction_price_suggestion',
                itemId: item.baseId,
                suggestedPrice: Math.floor(avgPrice * 0.9), // 10% below average
                message: `Preço sugerido para leilão: ${Math.floor(avgPrice * 0.9)} gold`
            });
        }
    }
    
    // Market activity tracking
    recordMarketActivity(activity, data) {
        // This would record market activity for analysis
        // Could be used for detecting market manipulation, bot activity, etc.
    }
    
    // Database operations
    async saveMarketData() {
        try {
            // Save auctions
            const auctionData = {};
            for (const [auctionId, auction] of this.auctions) {
                auctionData[auctionId] = {
                    ...auction,
                    startTime: auction.startTime.toISOString(),
                    endTime: auction.endTime.toISOString(),
                    bids: auction.bids ? Object.fromEntries(auction.bids) : {}
                };
            }
            await this.database.set('market_auctions', auctionData);
            
            // Save price history
            const priceData = {};
            for (const [itemId, history] of this.priceHistory) {
                priceData[itemId] = history;
            }
            await this.database.set('market_price_history', priceData);
            
            // Save statistics
            const stats = {
                ...this.marketStats,
                averagePrices: Object.fromEntries(this.marketStats.averagePrices),
                topSellers: Object.fromEntries(this.marketStats.topSellers),
                topBuyers: Object.fromEntries(this.marketStats.topBuyers),
                mostTradedItems: Object.fromEntries(this.marketStats.mostTradedItems)
            };
            await this.database.set('market_statistics', stats);
            
            // Save player data
            const playerData = {};
            for (const [playerId, data] of this.playerMarketData) {
                playerData[playerId] = {
                    auctions: Array.from(data.auctions),
                    bids: Array.from(data.bids),
                    trades: data.trades,
                    favorites: Array.from(data.favorites),
                    blacklisted: Array.from(data.blacklisted),
                    statistics: data.statistics,
                    lastUpdate: data.lastUpdate
                };
            }
            await this.database.set('player_market_data', playerData);
            
        } catch (error) {
            console.error('Error saving market data:', error);
        }
    }
    
    async saveOfflineGold(playerId, amount) {
        // Save gold for offline players
        try {
            const offlineGold = await this.database.get('offline_gold') || {};
            offlineGold[playerId] = (offlineGold[playerId] || 0) + amount;
            await this.database.set('offline_gold', offlineGold);
        } catch (error) {
            console.error('Error saving offline gold:', error);
        }
    }
    
    // Public API
    getAuctionDetails(auctionId) {
        const auction = this.auctions.get(auctionId);
        return auction ? this.sanitizeAuction(auction) : null;
    }
    
    getPlayerAuctions(playerId) {
        const playerData = this.getPlayerMarketData(playerId);
        const auctions = [];
        
        for (const auctionId of playerData.auctions) {
            const auction = this.auctions.get(auctionId);
            if (auction) {
                auctions.push(this.sanitizeAuction(auction));
            }
        }
        
        return auctions;
    }
    
    getPlayerBids(playerId) {
        const playerData = this.getPlayerMarketData(playerId);
        const bids = [];
        
        for (const bidId of playerData.bids) {
            for (const auction of this.auctions.values()) {
                if (auction.bids.has(bidId)) {
                    bids.push({
                        auctionId: auction.id,
                        itemName: auction.item.name,
                        amount: auction.bids.get(bidId).amount,
                        status: auction.status
                    });
                }
            }
        }
        
        return bids;
    }
    
    addToFavorites(playerId, itemId) {
        const playerData = this.getPlayerMarketData(playerId);
        playerData.favorites.add(itemId);
    }
    
    removeFromFavorites(playerId, itemId) {
        const playerData = this.getPlayerMarketData(playerId);
        playerData.favorites.delete(itemId);
    }
    
    blacklistPlayer(playerId, targetId) {
        const playerData = this.getPlayerMarketData(playerId);
        playerData.blacklisted.add(targetId);
    }
    
    // Cleanup
    cleanup() {
        this.auctions.clear();
        this.bids.clear();
        this.priceHistory.clear();
        this.tradeRequests.clear();
        this.activeTrades.clear();
        this.playerMarketData.clear();
    }
}

export default MarketSystem;
