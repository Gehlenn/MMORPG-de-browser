/**
 * AuctionManager.js
 * Handles auction house system
 * Phase 2: Trading & Economy
 */

const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class AuctionManager extends EventEmitter {
    constructor(database, playerManager, inventoryManager) {
        super();
        this.db = database;
        this.playerManager = playerManager;
        this.inventoryManager = inventoryManager;
        this.FEE_PERCENTAGE = 0.05; // 5% fee
        this.MAX_AUCTIONS_PER_PLAYER = 10;
        this.MAX_DURATION_HOURS = 168; // 7 days
        this.MIN_DURATION_HOURS = 1;
    }

    /**
     * Initialize the auction manager
     */
    async initialize() {
        console.log('🏛️ AuctionManager initialized');
        this.emit('initialized');

        // Start cleanup interval (every 5 minutes)
        setInterval(() => this.cleanupExpiredAuctions(), 5 * 60 * 1000);
    }

    /**
     * Create a new auction
     * @param {string} sellerId - Seller player ID
     * @param {Object} item - Item to auction
     * @param {Object} options - Auction options
     * @returns {Promise<Object>}
     */
    async createAuction(sellerId, item, options) {
        try {
            const { startingPrice, buyoutPrice, durationHours } = options;

            // Validate seller
            const seller = await this.playerManager.getPlayer(sellerId);
            if (!seller) {
                return { success: false, error: 'Player not found' };
            }

            // Validate item
            if (!item || !item.id) {
                return { success: false, error: 'Invalid item' };
            }

            // Check seller owns item
            const hasItem = await this.inventoryManager.hasItem(sellerId, item.id);
            if (!hasItem) {
                return { success: false, error: 'Item not in inventory' };
            }

            // Check seller's auction limit
            const activeAuctions = await this.getPlayerActiveAuctions(sellerId);
            if (activeAuctions.length >= this.MAX_AUCTIONS_PER_PLAYER) {
                return { success: false, error: `Maximum ${this.MAX_AUCTIONS_PER_PLAYER} active auctions` };
            }

            // Validate price
            if (!startingPrice || startingPrice < 1) {
                return { success: false, error: 'Starting price must be at least 1 gold' };
            }

            if (buyoutPrice && buyoutPrice <= startingPrice) {
                return { success: false, error: 'Buyout price must be higher than starting price' };
            }

            // Validate duration
            const duration = durationHours || 24;
            if (duration < this.MIN_DURATION_HOURS || duration > this.MAX_DURATION_HOURS) {
                return { success: false, error: `Duration must be ${this.MIN_DURATION_HOURS}-${this.MAX_DURATION_HOURS} hours` };
            }

            // Remove item from inventory
            await this.inventoryManager.removeItem(sellerId, item.id);

            // Calculate expiration
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + duration);

            // Create auction
            const auction = {
                id: uuidv4(),
                seller_id: sellerId,
                item_id: item.id,
                item_data: JSON.stringify(item),
                starting_price: startingPrice,
                buyout_price: buyoutPrice || null,
                current_bid: 0,
                highest_bidder_id: null,
                bids_count: 0,
                status: 'ACTIVE',
                watchers: '[]',
                created_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
            };

            await this.saveAuction(auction);

            this.emit('auction:created', {
                auctionId: auction.id,
                sellerId,
                item,
                startingPrice,
                buyoutPrice,
                expiresAt: auction.expires_at
            });

            return {
                success: true,
                auction: this.formatAuction(auction),
                message: 'Auction created successfully'
            };

        } catch (error) {
            console.error('Create auction error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Place a bid on an auction
     * @param {string} bidderId - Bidder player ID
     * @param {string} auctionId - Auction ID
     * @param {number} bidAmount - Bid amount
     * @returns {Promise<Object>}
     */
    async placeBid(bidderId, auctionId, bidAmount) {
        try {
            // Get auction
            const auction = await this.getAuction(auctionId);
            if (!auction || auction.status !== 'ACTIVE') {
                return { success: false, error: 'Auction not found or not active' };
            }

            // Check expiration
            if (new Date() > new Date(auction.expires_at)) {
                await this.expireAuction(auctionId);
                return { success: false, error: 'Auction has expired' };
            }

            // Can't bid on own auction
            if (auction.seller_id === bidderId) {
                return { success: false, error: 'Cannot bid on your own auction' };
            }

            // Validate bidder
            const bidder = await this.playerManager.getPlayer(bidderId);
            if (!bidder) {
                return { success: false, error: 'Bidder not found' };
            }

            // Calculate minimum bid
            const minBid = auction.current_bid > 0
                ? auction.current_bid + Math.ceil(auction.current_bid * 0.05) // 5% increment
                : auction.starting_price;

            if (bidAmount < minBid) {
                return { success: false, error: `Minimum bid is ${minBid} gold` };
            }

            // Check buyout
            if (auction.buyout_price && bidAmount >= auction.buyout_price) {
                return await this.buyoutAuction(bidderId, auctionId);
            }

            // Check bidder has enough gold
            if (bidder.gold < bidAmount) {
                return { success: false, error: 'Insufficient gold' };
            }

            // Return gold to previous bidder
            if (auction.highest_bidder_id) {
                await this.playerManager.updateGold(auction.highest_bidder_id, auction.current_bid);

                // Notify outbid
                this.emit('auction:outbid', {
                    auctionId,
                    playerId: auction.highest_bidder_id,
                    newBid: bidAmount
                });
            }

            // Deduct gold from new bidder
            await this.playerManager.updateGold(bidderId, -bidAmount);

            // Update auction
            auction.current_bid = bidAmount;
            auction.highest_bidder_id = bidderId;
            auction.bids_count += 1;
            await this.updateAuction(auction);

            // Record bid
            await this.saveBid({
                id: uuidv4(),
                auction_id: auctionId,
                bidder_id: bidderId,
                bid_amount: bidAmount,
                bid_time: new Date().toISOString()
            });

            this.emit('auction:bid', {
                auctionId,
                bidderId,
                bidAmount,
                bidsCount: auction.bids_count
            });

            return {
                success: true,
                bid: bidAmount,
                isWinning: true,
                message: 'Bid placed successfully'
            };

        } catch (error) {
            console.error('Place bid error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Buyout an auction instantly
     * @param {string} buyerId - Buyer player ID
     * @param {string} auctionId - Auction ID
     * @returns {Promise<Object>}
     */
    async buyoutAuction(buyerId, auctionId) {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction || auction.status !== 'ACTIVE') {
                return { success: false, error: 'Auction not found or not active' };
            }

            if (!auction.buyout_price) {
                return { success: false, error: 'No buyout price set' };
            }

            // Check expiration
            if (new Date() > new Date(auction.expires_at)) {
                await this.expireAuction(auctionId);
                return { success: false, error: 'Auction has expired' };
            }

            if (auction.seller_id === buyerId) {
                return { success: false, error: 'Cannot buyout your own auction' };
            }

            const buyer = await this.playerManager.getPlayer(buyerId);
            if (!buyer) {
                return { success: false, error: 'Buyer not found' };
            }

            if (buyer.gold < auction.buyout_price) {
                return { success: false, error: 'Insufficient gold' };
            }

            // Return gold to previous bidder if exists
            if (auction.highest_bidder_id) {
                await this.playerManager.updateGold(auction.highest_bidder_id, auction.current_bid);
            }

            // Deduct gold from buyer
            await this.playerManager.updateGold(buyerId, -auction.buyout_price);

            // Calculate fee and seller earnings
            const fee = Math.floor(auction.buyout_price * this.FEE_PERCENTAGE);
            const sellerEarnings = auction.buyout_price - fee;

            // Give gold to seller
            await this.playerManager.updateGold(auction.seller_id, sellerEarnings);

            // Transfer item to buyer
            const item = JSON.parse(auction.item_data);
            await this.inventoryManager.addItem(buyerId, item);

            // Update auction
            auction.status = 'SOLD';
            auction.current_bid = auction.buyout_price;
            auction.highest_bidder_id = buyerId;
            auction.sold_at = new Date().toISOString();
            await this.updateAuction(auction);

            // Record buyout bid
            await this.saveBid({
                id: uuidv4(),
                auction_id: auctionId,
                bidder_id: buyerId,
                bid_amount: auction.buyout_price,
                is_buyout: 1,
                bid_time: new Date().toISOString()
            });

            this.emit('auction:sold', {
                auctionId,
                sellerId: auction.seller_id,
                buyerId,
                price: auction.buyout_price,
                fee,
                item
            });

            return {
                success: true,
                price: auction.buyout_price,
                item,
                message: 'Auction purchased successfully'
            };

        } catch (error) {
            console.error('Buyout auction error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cancel an auction (seller only, if no bids)
     * @param {string} sellerId - Seller player ID
     * @param {string} auctionId - Auction ID
     * @returns {Promise<Object>}
     */
    async cancelAuction(sellerId, auctionId) {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) {
                return { success: false, error: 'Auction not found' };
            }

            if (auction.seller_id !== sellerId) {
                return { success: false, error: 'Not your auction' };
            }

            if (auction.status !== 'ACTIVE') {
                return { success: false, error: 'Auction is not active' };
            }

            // Can't cancel if has bids
            if (auction.current_bid > 0) {
                return { success: false, error: 'Cannot cancel auction with bids' };
            }

            // Return item to seller
            const item = JSON.parse(auction.item_data);
            await this.inventoryManager.addItem(sellerId, item);

            // Update auction
            auction.status = 'CANCELLED';
            await this.updateAuction(auction);

            this.emit('auction:cancelled', {
                auctionId,
                sellerId,
                item
            });

            return {
                success: true,
                item,
                message: 'Auction cancelled, item returned'
            };

        } catch (error) {
            console.error('Cancel auction error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get list of active auctions with filters
     * @param {Object} filters - Search filters
     * @returns {Promise<Object>}
     */
    async browseAuctions(filters = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                minLevel,
                maxLevel,
                rarity,
                category,
                sortBy = 'expires_at',
                sortOrder = 'ASC'
            } = filters;

            let query = `
                SELECT a.*, p.username as seller_name
                FROM auctions a
                JOIN players p ON a.seller_id = p.id
                WHERE a.status = 'ACTIVE'
                AND a.expires_at > datetime('now')
            `;

            const params = [];

            // Apply filters
            if (search) {
                query += ` AND (
                    json_extract(a.item_data, '$.name') LIKE ? OR
                    json_extract(a.item_data, '$.type') LIKE ?
                )`;
                params.push(`%${search}%`, `%${search}%`);
            }

            if (minLevel) {
                query += ` AND json_extract(a.item_data, '$.level') >= ?`;
                params.push(minLevel);
            }

            if (maxLevel) {
                query += ` AND json_extract(a.item_data, '$.level') <= ?`;
                params.push(maxLevel);
            }

            if (rarity) {
                query += ` AND json_extract(a.item_data, '$.rarity') = ?`;
                params.push(rarity);
            }

            if (category) {
                query += ` AND json_extract(a.item_data, '$.category') = ?`;
                params.push(category);
            }

            // Get total count
            const countQuery = query.replace('SELECT a.*, p.username as seller_name', 'SELECT COUNT(*) as count');
            const total = await new Promise((resolve, reject) => {
                this.db.get(countQuery, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row ? row.count : 0);
                });
            });

            // Apply sorting
            const validSortColumns = ['expires_at', 'starting_price', 'current_bid', 'created_at'];
            const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'expires_at';
            const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${orderBy} ${order}`;

            // Apply pagination
            const offset = (page - 1) * limit;
            query += ` LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            // Execute query
            const auctions = await new Promise((resolve, reject) => {
                this.db.all(query, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            return {
                success: true,
                auctions: auctions.map(a => this.formatAuction(a)),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };

        } catch (error) {
            console.error('Browse auctions error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get player's auctions
     * @param {string} playerId - Player ID
     * @returns {Promise<Object>}
     */
    async getMyAuctions(playerId) {
        try {
            const auctions = await new Promise((resolve, reject) => {
                this.db.all(
                    `SELECT * FROM auctions WHERE seller_id = ? ORDER BY created_at DESC`,
                    [playerId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            return {
                success: true,
                auctions: auctions.map(a => this.formatAuction(a))
            };

        } catch (error) {
            console.error('Get my auctions error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get auctions player has bid on
     * @param {string} playerId - Player ID
     * @returns {Promise<Object>}
     */
    async getMyBids(playerId) {
        try {
            const auctions = await new Promise((resolve, reject) => {
                this.db.all(
                    `SELECT DISTINCT a.* FROM auctions a
                     JOIN auction_bids b ON a.id = b.auction_id
                     WHERE b.bidder_id = ?
                     ORDER BY b.bid_time DESC`,
                    [playerId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            return {
                success: true,
                auctions: auctions.map(a => ({
                    ...this.formatAuction(a),
                    isWinning: a.highest_bidder_id === playerId
                }))
            };

        } catch (error) {
            console.error('Get my bids error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get auction details
     * @param {string} auctionId - Auction ID
     * @returns {Promise<Object>}
     */
    async getAuctionDetails(auctionId) {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) {
                return { success: false, error: 'Auction not found' };
            }

            // Get bid history
            const bids = await new Promise((resolve, reject) => {
                this.db.all(
                    `SELECT b.*, p.username as bidder_name
                     FROM auction_bids b
                     JOIN players p ON b.bidder_id = p.id
                     WHERE b.auction_id = ?
                     ORDER BY b.bid_time DESC`,
                    [auctionId],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            return {
                success: true,
                auction: this.formatAuction(auction),
                bids: bids.map(b => ({
                    id: b.id,
                    bidderId: b.bidder_id,
                    bidderName: b.bidder_name,
                    amount: b.bid_amount,
                    isBuyout: !!b.is_buyout,
                    time: b.bid_time
                }))
            };

        } catch (error) {
            console.error('Get auction details error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cleanup expired auctions
     */
    async cleanupExpiredAuctions() {
        try {
            const expired = await new Promise((resolve, reject) => {
                this.db.all(
                    `SELECT * FROM auctions
                     WHERE status = 'ACTIVE'
                     AND expires_at <= datetime('now')`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            for (const auction of expired) {
                await this.expireAuction(auction.id);
            }

            if (expired.length > 0) {
                console.log(`🧹 Cleaned up ${expired.length} expired auctions`);
            }

        } catch (error) {
            console.error('Cleanup expired auctions error:', error);
        }
    }

    /**
     * Expire an auction
     * @param {string} auctionId - Auction ID
     */
    async expireAuction(auctionId) {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction || auction.status !== 'ACTIVE') return;

            if (auction.highest_bidder_id) {
                // Sold to highest bidder
                const fee = Math.floor(auction.current_bid * this.FEE_PERCENTAGE);
                const sellerEarnings = auction.current_bid - fee;

                await this.playerManager.updateGold(auction.seller_id, sellerEarnings);

                const item = JSON.parse(auction.item_data);
                await this.inventoryManager.addItem(auction.highest_bidder_id, item);

                auction.status = 'SOLD';
                auction.sold_at = new Date().toISOString();

                this.emit('auction:sold', {
                    auctionId,
                    sellerId: auction.seller_id,
                    buyerId: auction.highest_bidder_id,
                    price: auction.current_bid,
                    fee,
                    item,
                    wasExpired: true
                });
            } else {
                // Return item to seller
                const item = JSON.parse(auction.item_data);
                await this.inventoryManager.addItem(auction.seller_id, item);

                auction.status = 'EXPIRED';

                this.emit('auction:expired', {
                    auctionId,
                    sellerId: auction.seller_id,
                    item
                });
            }

            await this.updateAuction(auction);

        } catch (error) {
            console.error('Expire auction error:', error);
        }
    }

    // Helper methods
    async getAuction(auctionId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM auctions WHERE id = ?',
                [auctionId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || null);
                }
            );
        });
    }

    async getPlayerActiveAuctions(playerId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM auctions WHERE seller_id = ? AND status = 'ACTIVE'`,
                [playerId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    async saveAuction(auction) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO auctions (id, seller_id, item_id, item_data, starting_price,
                 buyout_price, current_bid, bids_count, status, watchers, created_at, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [auction.id, auction.seller_id, auction.item_id, auction.item_data,
                 auction.starting_price, auction.buyout_price, auction.current_bid,
                 auction.bids_count, auction.status, auction.watchers,
                 auction.created_at, auction.expires_at],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async updateAuction(auction) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `UPDATE auctions SET
                 status = ?, current_bid = ?, highest_bidder_id = ?, bids_count = ?,
                 sold_at = ?, watchers = ?
                 WHERE id = ?`,
                [auction.status, auction.current_bid, auction.highest_bidder_id,
                 auction.bids_count, auction.sold_at, auction.watchers, auction.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async saveBid(bid) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO auction_bids (id, auction_id, bidder_id, bid_amount, is_buyout, bid_time)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [bid.id, bid.auction_id, bid.bidder_id, bid.bid_amount,
                 bid.is_buyout || 0, bid.bid_time],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    formatAuction(auction) {
        const item = JSON.parse(auction.item_data);
        const now = new Date();
        const expires = new Date(auction.expires_at);
        const timeLeft = Math.max(0, expires - now);

        return {
            id: auction.id,
            sellerId: auction.seller_id,
            sellerName: auction.seller_name,
            item: item,
            startingPrice: auction.starting_price,
            buyoutPrice: auction.buyout_price,
            currentBid: auction.current_bid,
            highestBidderId: auction.highest_bidder_id,
            bidsCount: auction.bids_count,
            status: auction.status,
            createdAt: auction.created_at,
            expiresAt: auction.expires_at,
            timeLeft: timeLeft,
            hasBids: auction.bids_count > 0
        };
    }
}

module.exports = AuctionManager;
