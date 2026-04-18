/**
 * ValuationEngine.js
 * Handles item price estimation and market analysis
 * Phase 2: Trading & Economy
 */

class ValuationEngine {
    constructor(database) {
        this.db = database;
        this.priceCache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Initialize the valuation engine
     */
    async initialize() {
        console.log('💰 ValuationEngine initialized');
    }

    /**
     * Get estimated price for an item
     * @param {Object} item - Item data
     * @returns {Promise<Object>}
     */
    async getPriceEstimate(item) {
        try {
            if (!item || !item.id) {
                return { success: false, error: 'Invalid item' };
            }

            const cacheKey = `${item.type || item.id}_${item.level || 0}_${item.rarity || 'common'}`;

            // Check cache
            if (this.priceCache.has(cacheKey)) {
                const cached = this.priceCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
                    return {
                        success: true,
                        ...cached.data,
                        cached: true
                    };
                }
            }

            // Get price history
            const history24h = await this.getPriceHistory(item, 1);
            const history7d = await this.getPriceHistory(item, 7);
            const history30d = await this.getPriceHistory(item, 30);

            // Calculate estimates
            const estimate = this.calculateEstimate(history24h, history7d, history30d, item);

            // Check vendor value as baseline
            const vendorValue = item.vendorValue || Math.max(1, Math.floor(item.level * 0.5)) || 1;

            // Ensure estimate is at least vendor value
            const finalEstimate = {
                ...estimate,
                low: Math.max(estimate.low, vendorValue),
                average: Math.max(estimate.average, vendorValue),
                high: Math.max(estimate.high, vendorValue),
                vendorValue,
                timestamp: new Date().toISOString()
            };

            // Cache result
            this.priceCache.set(cacheKey, {
                data: finalEstimate,
                timestamp: Date.now()
            });

            return {
                success: true,
                ...finalEstimate,
                history: {
                    '24h': history24h,
                    '7d': history7d,
                    '30d': history30d
                }
            };

        } catch (error) {
            console.error('Price estimate error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate price estimate from history
     * @param {Object} history24h - 24h history
     * @param {Object} history7d - 7d history
     * @param {Object} history30d - 30d history
     * @param {Object} item - Item data
     * @returns {Object}
     */
    calculateEstimate(history24h, history7d, history30d, item) {
        const prices = [];
        const weights = [];

        // Weight recent data more heavily
        if (history24h.count > 0) {
            prices.push(history24h.average);
            weights.push(0.5);
        }

        if (history7d.count > 0) {
            prices.push(history7d.average);
            weights.push(0.3);
        }

        if (history30d.count > 0) {
            prices.push(history30d.average);
            weights.push(0.2);
        }

        // If no market data, use base calculation
        if (prices.length === 0) {
            return this.calculateBasePrice(item);
        }

        // Calculate weighted average
        let weightedSum = 0;
        let weightSum = 0;
        for (let i = 0; i < prices.length; i++) {
            weightedSum += prices[i] * weights[i];
            weightSum += weights[i];
        }

        const average = Math.floor(weightedSum / weightSum);

        // Calculate ranges based on volatility
        const volatility = this.calculateVolatility(history7d);
        const low = Math.floor(average * (1 - volatility));
        const high = Math.floor(average * (1 + volatility));

        // Calculate trend
        let trend = 'stable';
        if (history24h.average > history7d.average * 1.1) {
            trend = 'rising';
        } else if (history24h.average < history7d.average * 0.9) {
            trend = 'falling';
        }

        return {
            low,
            average,
            high,
            trend,
            confidence: this.calculateConfidence(history30d.count),
            dataPoints: history30d.count
        };
    }

    /**
     * Calculate base price when no market data
     * @param {Object} item - Item data
     * @returns {Object}
     */
    calculateBasePrice(item) {
        const level = item.level || 1;
        const rarity = item.rarity || 'common';

        // Base price formula
        let basePrice = level * 10;

        // Rarity multipliers
        const rarityMultipliers = {
            'common': 1,
            'uncommon': 1.5,
            'rare': 3,
            'epic': 8,
            'legendary': 20
        };

        const multiplier = rarityMultipliers[rarity] || 1;
        const average = Math.floor(basePrice * multiplier);

        return {
            low: Math.floor(average * 0.7),
            average,
            high: Math.floor(average * 1.5),
            trend: 'unknown',
            confidence: 'low',
            dataPoints: 0,
            isEstimate: true
        };
    }

    /**
     * Get price history for time period
     * @param {Object} item - Item data
     * @param {number} days - Number of days
     * @returns {Promise<Object>}
     */
    async getPriceHistory(item, days) {
        try {
            const itemType = item.type || item.templateId || item.id;
            const itemLevel = item.level || 0;
            const rarity = item.rarity || 'common';

            const since = new Date();
            since.setDate(since.getDate() - days);

            const result = await new Promise((resolve, reject) => {
                this.db.get(
                    `SELECT
                        AVG(price) as avg_price,
                        MIN(price) as min_price,
                        MAX(price) as max_price,
                        COUNT(*) as trade_count
                     FROM price_history
                     WHERE item_type = ?
                     AND item_level BETWEEN ? AND ?
                     AND rarity = ?
                     AND recorded_at > ?`,
                    [itemType, itemLevel - 2, itemLevel + 2, rarity, since.toISOString()],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            return {
                average: Math.floor(result.avg_price || 0),
                min: result.min_price || 0,
                max: result.max_price || 0,
                count: result.trade_count || 0
            };

        } catch (error) {
            console.error('Get price history error:', error);
            return { average: 0, min: 0, max: 0, count: 0 };
        }
    }

    /**
     * Record a trade for price history
     * @param {Object} item - Item traded
     * @param {number} price - Trade price
     * @param {string} source - Source (auction, direct_trade)
     * @returns {Promise<boolean>}
     */
    async recordTrade(item, price, source = 'direct_trade') {
        try {
            if (!item || !price) return false;

            const { v4: uuidv4 } = require('uuid');

            await new Promise((resolve, reject) => {
                this.db.run(
                    `INSERT INTO price_history
                     (id, item_type, item_level, rarity, avg_price, min_price, max_price, trade_count, source, recorded_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), item.type || item.id, item.level || 0, item.rarity || 'common',
                     price, price, price, 1, source, new Date().toISOString()],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Clear cache for this item type
            const cacheKey = `${item.type || item.id}_${item.level || 0}_${item.rarity || 'common'}`;
            this.priceCache.delete(cacheKey);

            return true;

        } catch (error) {
            console.error('Record trade error:', error);
            return false;
        }
    }

    /**
     * Get market overview
     * @returns {Promise<Object>}
     */
    async getMarketOverview() {
        try {
            // Get total active auctions
            const auctionsCount = await new Promise((resolve, reject) => {
                this.db.get(
                    `SELECT COUNT(*) as count FROM auctions WHERE status = 'ACTIVE'`,
                    [],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row ? row.count : 0);
                    }
                );
            });

            // Get trades in last 24h
            const trades24h = await new Promise((resolve, reject) => {
                this.db.get(
                    `SELECT COUNT(*) as count, SUM(price) as volume
                     FROM price_history
                     WHERE recorded_at > datetime('now', '-1 day')`,
                    [],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row || { count: 0, volume: 0 });
                    }
                );
            });

            // Get top categories by volume
            const topCategories = await new Promise((resolve, reject) => {
                this.db.all(
                    `SELECT item_type, SUM(trade_count) as trades, AVG(avg_price) as avg_price
                     FROM price_history
                     WHERE recorded_at > datetime('now', '-7 days')
                     GROUP BY item_type
                     ORDER BY trades DESC
                     LIMIT 5`,
                    [],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            return {
                success: true,
                activeAuctions: auctionsCount,
                trades24h: trades24h.count || 0,
                volume24h: trades24h.volume || 0,
                topCategories: topCategories.map(c => ({
                    type: c.item_type,
                    trades: c.trades,
                    averagePrice: Math.floor(c.avg_price)
                }))
            };

        } catch (error) {
            console.error('Market overview error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Search price history
     * @param {string} searchTerm - Search term
     * @returns {Promise<Object>}
     */
    async searchPriceHistory(searchTerm) {
        try {
            const results = await new Promise((resolve, reject) => {
                this.db.all(
                    `SELECT item_type, item_level, rarity,
                        AVG(avg_price) as avg_price,
                        COUNT(*) as data_points,
                        MAX(recorded_at) as last_trade
                     FROM price_history
                     WHERE item_type LIKE ?
                     AND recorded_at > datetime('now', '-30 days')
                     GROUP BY item_type, item_level, rarity
                     ORDER BY data_points DESC
                     LIMIT 20`,
                    [`%${searchTerm}%`],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            return {
                success: true,
                results: results.map(r => ({
                    itemType: r.item_type,
                    itemLevel: r.item_level,
                    rarity: r.rarity,
                    averagePrice: Math.floor(r.avg_price),
                    dataPoints: r.data_points,
                    lastTrade: r.last_trade
                }))
            };

        } catch (error) {
            console.error('Search price history error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Calculate price volatility
     * @param {Object} history - Price history
     * @returns {number}
     */
    calculateVolatility(history) {
        if (history.count < 5) return 0.2; // Default 20% variance

        const min = history.min;
        const max = history.max;
        const avg = history.average;

        if (avg === 0) return 0.2;

        // Calculate relative range
        const range = (max - min) / avg;
        return Math.min(0.5, Math.max(0.1, range / 2));
    }

    /**
     * Calculate confidence level
     * @param {number} dataPoints - Number of data points
     * @returns {string}
     */
    calculateConfidence(dataPoints) {
        if (dataPoints >= 50) return 'high';
        if (dataPoints >= 10) return 'medium';
        return 'low';
    }

    /**
     * Get price suggestion for auction
     * @param {Object} item - Item to auction
     * @returns {Promise<Object>}
     */
    async getAuctionSuggestion(item) {
        try {
            const estimate = await this.getPriceEstimate(item);

            if (!estimate.success) {
                return estimate;
            }

            const { average, low, high } = estimate;

            // Suggest starting price at 70% of estimate
            const startingPrice = Math.max(1, Math.floor(low * 0.9));

            // Suggest buyout at 130% of estimate (if high demand)
            const buyoutPrice = Math.floor(high * 1.3);

            return {
                success: true,
                suggestions: {
                    startingPrice,
                    buyoutPrice,
                    minimumBid: Math.floor(startingPrice * 1.05) // 5% increment
                },
                estimate,
                recommendation: this.getAuctionRecommendation(estimate)
            };

        } catch (error) {
            console.error('Auction suggestion error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get recommendation for auction
     * @param {Object} estimate - Price estimate
     * @returns {string}
     */
    getAuctionRecommendation(estimate) {
        if (estimate.confidence === 'low') {
            return 'Limited market data. Consider starting with vendor value plus 20%.';
        }

        if (estimate.trend === 'rising') {
            return 'Prices are trending up. Good time to sell!';
        }

        if (estimate.trend === 'falling') {
            return 'Prices are trending down. Consider quick sale or hold.';
        }

        return 'Market is stable. Price estimate should be accurate.';
    }

    /**
     * Clear expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        for (const [key, entry] of this.priceCache.entries()) {
            if (now - entry.timestamp > this.CACHE_DURATION) {
                this.priceCache.delete(key);
            }
        }
    }
}

module.exports = ValuationEngine;
