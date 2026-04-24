/**
 * TradingPost.js
 * Sistema de Casa de Leilão e Trading
 * Legacy of Komodo MMORPG v0.5.0 - Nível 9 Completo
 */

class TradingPost {
    constructor(database, playerManager, notificationManager) {
        this.db = database;
        this.playerManager = playerManager;
        this.notificationManager = notificationManager;
        
        // Configurações
        this.config = {
            listingFee: 0.05, // 5% taxa de listagem
            transactionFee: 0.10, // 10% taxa de transação
            maxListingsPerPlayer: 50,
            listingDuration: 7 * 24 * 60 * 60 * 1000, // 7 dias
            maxPrice: 10000000, // 10M gold
            minPrice: 1 // 1 gold
        };
        
        // Categorias de itens
        this.categories = {
            weapon: { name: 'Armas', icon: '⚔️', sort: 1 },
            armor: { name: 'Armaduras', icon: '🛡️', sort: 2 },
            accessory: { name: 'Acessórios', icon: '💍', sort: 3 },
            consumable: { name: 'Consumíveis', icon: '🧪', sort: 4 },
            material: { name: 'Materiais', icon: '⚒️', sort: 5 },
            mount: { name: 'Montarias', icon: '🐴', sort: 6 },
            cosmetic: { name: 'Cosméticos', icon: '👗', sort: 7 },
            legendary: { name: 'Lendários', icon: '👑', sort: 0 }
        };
        
        // Raridades para filtro
        this.rarities = {
            common: { name: 'Comum', color: '#9e9e9e', multiplier: 1 },
            uncommon: { name: 'Incomum', color: '#4caf50', multiplier: 1.5 },
            rare: { name: 'Raro', color: '#2196f3', multiplier: 2 },
            epic: { name: 'Épico', color: '#9c27b0', multiplier: 3 },
            legendary: { name: 'Lendário', color: '#ff9800', multiplier: 5 },
            divine: { name: 'Divino', color: '#ffd700', multiplier: 10 }
        };
        
        console.log('🏛️ TradingPost initialized');
    }

    /**
     * Criar listagem de item
     */
    async createListing(playerId, itemData) {
        try {
            const player = await this.playerManager.getPlayer(playerId);
            if (!player) {
                return { success: false, error: 'Player not found' };
            }
            
            // Validações
            if (!itemData.itemId || !itemData.price) {
                return { success: false, error: 'Missing itemId or price' };
            }
            
            // Verifica preço
            if (itemData.price < this.config.minPrice) {
                return { success: false, error: `Minimum price is ${this.config.minPrice} gold` };
            }
            if (itemData.price > this.config.maxPrice) {
                return { success: false, error: `Maximum price is ${this.config.maxPrice} gold` };
            }
            
            // Verifica se jogador tem o item
            const hasItem = player.inventory?.some(inv => 
                inv.id === itemData.itemId && !(inv.equipped || inv.listed)
            );
            if (!hasItem) {
                return { success: false, error: 'Item not in inventory' };
            }
            
            // Verifica limite de listagens
            const currentListings = await this.db.getPlayerListingCount(playerId);
            if (currentListings >= this.config.maxListingsPerPlayer) {
                return { success: false, error: `Maximum ${this.config.maxListingsPerPlayer} listings allowed` };
            }
            
            // Calcula taxa
            const listingFee = Math.ceil(itemData.price * this.config.listingFee);
            if (player.gold < listingFee) {
                return { success: false, error: `Need ${listingFee} gold for listing fee` };
            }
            
            // Deduz taxa
            player.gold -= listingFee;
            
            // Marca item como listado
            const item = player.inventory.find(inv => 
                inv.id === itemData.itemId && !(inv.equipped || inv.listed)
            );
            item.listed = true;
            item.listingId = Date.now().toString();
            
            // Cria listagem
            const listing = {
                id: item.listingId,
                sellerId: playerId,
                sellerName: player.name,
                itemId: itemData.itemId,
                itemName: itemData.name || item.name || 'Unknown Item',
                itemCategory: itemData.category || this.getItemCategory(itemData.itemId),
                rarity: itemData.rarity || 'common',
                quantity: itemData.quantity || 1,
                price: itemData.price,
                buyoutPrice: itemData.buyoutPrice || null,
                createdAt: Date.now(),
                expiresAt: Date.now() + this.config.listingDuration,
                stats: itemData.stats || {},
                description: itemData.description || ''
            };
            
            // Salva
            await this.playerManager.updatePlayer(player);
            await this.db.saveListing(listing);
            
            // Notifica
            this.notificationManager?.notify(playerId, 'market:listing_created', {
                listingId: listing.id,
                itemName: listing.itemName,
                price: listing.price,
                fee: listingFee
            });
            
            console.log(`📦 Listing created: ${listing.itemName} for ${listing.price} gold by ${player.name}`);
            
            return {
                success: true,
                listing: listing,
                fee: listingFee
            };
            
        } catch (error) {
            console.error('Error creating listing:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Comprar item
     */
    async buyItem(buyerId, listingId) {
        try {
            const buyer = await this.playerManager.getPlayer(buyerId);
            if (!buyer) {
                return { success: false, error: 'Buyer not found' };
            }
            
            // Busca listagem
            const listing = await this.db.getListing(listingId);
            if (!listing) {
                return { success: false, error: 'Listing not found' };
            }
            
            // Verifica se expirou
            if (Date.now() > listing.expiresAt) {
                return { success: false, error: 'Listing expired' };
            }
            
            // Não pode comprar de si mesmo
            if (listing.sellerId === buyerId) {
                return { success: false, error: 'Cannot buy your own listing' };
            }
            
            // Verifica gold
            const totalPrice = listing.price;
            if (buyer.gold < totalPrice) {
                return { success: false, error: `Need ${totalPrice} gold` };
            }
            
            // Busca vendedor
            const seller = await this.playerManager.getPlayer(listing.sellerId);
            if (!seller) {
                return { success: false, error: 'Seller not found' };
            }
            
            // Calcula taxas
            const transactionFee = Math.ceil(totalPrice * this.config.transactionFee);
            const sellerReceives = totalPrice - transactionFee;
            
            // Transação
            buyer.gold -= totalPrice;
            seller.gold += sellerReceives;
            
            // Transfere item
            buyer.inventory.push({
                id: listing.itemId,
                name: listing.itemName,
                category: listing.itemCategory,
                rarity: listing.rarity,
                stats: listing.stats,
                obtainedFrom: 'trading_post',
                obtainedAt: new Date().toISOString()
            });
            
            // Remove do vendedor
            const sellerItemIndex = seller.inventory.findIndex(inv => 
                inv.listingId === listingId
            );
            if (sellerItemIndex !== -1) {
                seller.inventory.splice(sellerItemIndex, 1);
            }
            
            // Salva
            await this.playerManager.updatePlayer(buyer);
            await this.playerManager.updatePlayer(seller);
            await this.db.deleteListing(listingId);
            await this.db.recordTransaction({
                type: 'sale',
                listingId: listingId,
                sellerId: listing.sellerId,
                buyerId: buyerId,
                itemId: listing.itemId,
                itemName: listing.itemName,
                price: totalPrice,
                sellerReceives: sellerReceives,
                fees: transactionFee,
                timestamp: Date.now()
            });
            
            // Notificações
            this.notificationManager?.notify(buyerId, 'market:purchase_complete', {
                itemName: listing.itemName,
                price: totalPrice
            });
            
            this.notificationManager?.notify(listing.sellerId, 'market:item_sold', {
                itemName: listing.itemName,
                price: sellerReceives,
                buyerName: buyer.name
            });
            
            console.log(`💰 Sale: ${listing.itemName} - ${seller.name} → ${buyer.name} for ${totalPrice} gold`);
            
            return {
                success: true,
                item: listing,
                price: totalPrice
            };
            
        } catch (error) {
            console.error('Error buying item:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cancelar listagem
     */
    async cancelListing(playerId, listingId) {
        try {
            const player = await this.playerManager.getPlayer(playerId);
            if (!player) {
                return { success: false, error: 'Player not found' };
            }
            
            const listing = await this.db.getListing(listingId);
            if (!listing) {
                return { success: false, error: 'Listing not found' };
            }
            
            // Apenas o vendedor pode cancelar
            if (listing.sellerId !== playerId) {
                return { success: false, error: 'Not your listing' };
            }
            
            // Desmarca item
            const item = player.inventory.find(inv => inv.listingId === listingId);
            if (item) {
                delete item.listed;
                delete item.listingId;
            }
            
            // Remove listagem
            await this.db.deleteListing(listingId);
            await this.playerManager.updatePlayer(player);
            
            return {
                success: true,
                message: 'Listing cancelled'
            };
            
        } catch (error) {
            console.error('Error cancelling listing:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Buscar itens no mercado
     */
    async searchListings(filters = {}, page = 1, limit = 20) {
        try {
            const { category, rarity, minPrice, maxPrice, searchTerm, sortBy } = filters;
            
            // Remove expirados primeiro
            await this.cleanupExpiredListings();
            
            // Busca do banco
            const allListings = await this.db.getAllListings();
            
            // Filtros
            let results = allListings.filter(listing => {
                // Categoria
                if (category && listing.itemCategory !== category) return false;
                
                // Raridade
                if (rarity && listing.rarity !== rarity) return false;
                
                // Preço mínimo
                if (minPrice && listing.price < minPrice) return false;
                
                // Preço máximo
                if (maxPrice && listing.price > maxPrice) return false;
                
                // Termo de busca
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    const matches = listing.itemName?.toLowerCase().includes(term) ||
                                   listing.description?.toLowerCase().includes(term) ||
                                   listing.sellerName?.toLowerCase().includes(term);
                    if (!matches) return false;
                }
                
                return true;
            });
            
            // Ordenação
            switch (sortBy) {
                case 'price_asc':
                    results.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    results.sort((a, b) => b.price - a.price);
                    break;
                case 'newest':
                    results.sort((a, b) => b.createdAt - a.createdAt);
                    break;
                case 'rarity':
                    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'divine'];
                    results.sort((a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity));
                    break;
                default:
                    results.sort((a, b) => b.createdAt - a.createdAt);
            }
            
            // Paginação
            const total = results.length;
            const start = (page - 1) * limit;
            const paginated = results.slice(start, start + limit);
            
            return {
                success: true,
                listings: paginated,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            };
            
        } catch (error) {
            console.error('Error searching listings:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter listagens do jogador
     */
    async getPlayerListings(playerId) {
        try {
            const listings = await this.db.getPlayerListings(playerId);
            return {
                success: true,
                listings: listings,
                count: listings.length,
                max: this.config.maxListingsPerPlayer
            };
        } catch (error) {
            console.error('Error getting player listings:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter histórico de transações
     */
    async getTransactionHistory(playerId, limit = 50) {
        try {
            const transactions = await this.db.getPlayerTransactions(playerId, limit);
            return {
                success: true,
                transactions: transactions
            };
        } catch (error) {
            console.error('Error getting transaction history:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter estatísticas do mercado
     */
    async getMarketStats() {
        try {
            const stats = await this.db.getMarketStats();
            const activeListings = await this.db.getListingCount();
            
            return {
                success: true,
                stats: {
                    activeListings: activeListings,
                    totalTransactions: stats.totalTransactions || 0,
                    totalVolume: stats.totalVolume || 0,
                    averagePrice: stats.averagePrice || 0,
                    topCategories: stats.topCategories || [],
                    trending: await this.getTrendingItems()
                }
            };
        } catch (error) {
            console.error('Error getting market stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Itens em tendência
     */
    async getTrendingItems(limit = 10) {
        try {
            const recentSales = await this.db.getRecentSales(24 * 60 * 60 * 1000); // 24h
            
            // Agrupa por item
            const itemCounts = {};
            recentSales.forEach(sale => {
                if (!itemCounts[sale.itemId]) {
                    itemCounts[sale.itemId] = {
                        itemId: sale.itemId,
                        itemName: sale.itemName,
                        count: 0,
                        totalVolume: 0
                    };
                }
                itemCounts[sale.itemId].count++;
                itemCounts[sale.itemId].totalVolume += sale.price;
            });
            
            // Ordena por volume
            const trending = Object.values(itemCounts)
                .sort((a, b) => b.totalVolume - a.totalVolume)
                .slice(0, limit);
            
            return trending;
        } catch (error) {
            console.error('Error getting trending items:', error);
            return [];
        }
    }

    /**
     * Limpar listagens expiradas
     */
    async cleanupExpiredListings() {
        try {
            const expired = await this.db.getExpiredListings();
            
            for (const listing of expired) {
                // Devolve item ao vendedor
                const seller = await this.playerManager.getPlayer(listing.sellerId);
                if (seller) {
                    const item = seller.inventory.find(inv => inv.listingId === listing.id);
                    if (item) {
                        delete item.listed;
                        delete item.listingId;
                    }
                    await this.playerManager.updatePlayer(seller);
                }
                
                // Notifica
                this.notificationManager?.notify(listing.sellerId, 'market:listing_expired', {
                    itemName: listing.itemName,
                    listingId: listing.id
                });
                
                // Remove
                await this.db.deleteListing(listing.id);
            }
            
            if (expired.length > 0) {
                console.log(`🧹 Cleaned up ${expired.length} expired listings`);
            }
            
            return expired.length;
        } catch (error) {
            console.error('Error cleaning up listings:', error);
            return 0;
        }
    }

    /**
     * Obter categoria do item
     */
    getItemCategory(itemId) {
        // Lógica para determinar categoria baseada no ID/nome
        if (itemId.includes('sword') || itemId.includes('axe') || itemId.includes('bow')) {
            return 'weapon';
        }
        if (itemId.includes('armor') || itemId.includes('helmet') || itemId.includes('boots')) {
            return 'armor';
        }
        if (itemId.includes('ring') || itemId.includes('necklace') || itemId.includes('amulet')) {
            return 'accessory';
        }
        if (itemId.includes('potion') || itemId.includes('food')) {
            return 'consumable';
        }
        if (itemId.includes('ore') || itemId.includes('herb') || itemId.includes('wood')) {
            return 'material';
        }
        return 'misc';
    }

    /**
     * Sugerir preço baseado no mercado
     */
    async suggestPrice(itemId) {
        try {
            const similar = await this.db.getSimilarListings(itemId);
            
            if (similar.length === 0) {
                return { suggested: null, reason: 'No similar items found' };
            }
            
            const prices = similar.map(l => l.price);
            const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            
            return {
                suggested: Math.round(avg),
                range: { min, max },
                basedOn: similar.length
            };
        } catch (error) {
            console.error('Error suggesting price:', error);
            return { suggested: null, error: error.message };
        }
    }

    /**
     * Wishlist - Notificar quando item disponível
     */
    async addToWishlist(playerId, itemData) {
        try {
            const wishlist = await this.db.addWishlistItem(playerId, {
                itemId: itemData.itemId,
                maxPrice: itemData.maxPrice,
                createdAt: Date.now()
            });
            
            return {
                success: true,
                wishlist: wishlist
            };
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            return { success: false, error: error.message };
        }
    }

    getConfig() {
        return this.config;
    }

    getCategories() {
        return this.categories;
    }

    getRarities() {
        return this.rarities;
    }

    getStats() {
        return {
            config: this.config,
            categories: Object.keys(this.categories).length,
            rarities: Object.keys(this.rarities).length
        };
    }
}

// Exporta
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TradingPost;
} else {
    window.TradingPost = TradingPost;
}
