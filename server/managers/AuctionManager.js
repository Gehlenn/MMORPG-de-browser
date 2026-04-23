/**
 * AuctionManager - Sistema de Leilão (Auction House)
 * 
 * Features:
 * - Postar itens para venda
 * - Busca e filtros avançados
 * - Lances em tempo real
 * - Sistema de compra imediata (Buyout)
 * - Taxas de leilão
 * - Watchlist/favoritos
 * - Auto-lance
 * - Histórico de transações
 * - Categorias de itens
 * - Tempo de expiração
 * - Notificações
 */

class AuctionManager {
    constructor(server) {
        this.server = server;
        this.io = server.io;
        
        // Storage
        this.listings = new Map(); // listingId -> listing data
        this.bids = new Map(); // listingId -> array of bids
        this.transactions = []; // Completed transactions
        this.watchlists = new Map(); // playerId -> Set of listingIds
        this.categories = this.initializeCategories();
        
        // Auto-increment ID
        this.nextListingId = 1;
        
        // Config
        this.config = {
            listingFee: 0.05, // 5% fee when posting
            saleFee: 0.10, // 10% fee on successful sale
            minBidIncrement: 0.05, // 5% minimum bid increment
            maxDuration: 7 * 24 * 60 * 60 * 1000, // 7 days max
            defaultDuration: 48 * 60 * 60 * 1000, // 48 hours default
            maxListingsPerPlayer: 20,
            maxBidHistory: 50
        };
        
        // Expiration check interval
        this.expirationInterval = null;
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventHandlers();
        this.startExpirationCheck();
        console.log('[AuctionManager] Sistema de leilão inicializado');
    }
    
    initializeCategories() {
        return {
            weapons: { name: 'Armas', icon: '⚔️', subcategories: ['sword', 'axe', 'bow', 'staff', 'dagger'] },
            armor: { name: 'Armaduras', icon: '🛡️', subcategories: ['helmet', 'chest', 'legs', 'boots', 'gloves', 'shield'] },
            accessories: { name: 'Acessórios', icon: '💍', subcategories: ['ring', 'necklace', 'earring', 'cape'] },
            consumables: { name: 'Consumíveis', icon: '🧪', subcategories: ['potion', 'food', 'scroll'] },
            materials: { name: 'Materiais', icon: '⛏️', subcategories: ['ore', 'herb', 'leather', 'cloth', 'gem'] },
            mounts: { name: 'Montarias', icon: '🐎', subcategories: ['horse', 'exotic'] },
            pets: { name: 'Pets', icon: '🐾', subcategories: ['combat', 'cosmetic', 'gathering'] },
            misc: { name: 'Diversos', icon: '📦', subcategories: ['quest', 'key', 'other'] }
        };
    }
    
    setupEventHandlers() {
        this.server.on('auction:open', (socket) => {
            this.handleOpenAuction(socket);
        });
        
        this.server.on('auction:search', (socket, data) => {
            this.handleSearch(socket, data);
        });
        
        this.server.on('auction:post', (socket, data) => {
            this.handlePostListing(socket, data);
        });
        
        this.server.on('auction:bid', (socket, data) => {
            this.handleBid(socket, data);
        });
        
        this.server.on('auction:buyout', (socket, data) => {
            this.handleBuyout(socket, data);
        });
        
        this.server.on('auction:cancel', (socket, data) => {
            this.handleCancel(socket, data);
        });
        
        this.server.on('auction:watch', (socket, data) => {
            this.handleWatch(socket, data);
        });
        
        this.server.on('auction:unwatch', (socket, data) => {
            this.handleUnwatch(socket, data);
        });
        
        this.server.on('auction:mylistings', (socket) => {
            this.handleGetMyListings(socket);
        });
        
        this.server.on('auction:mybids', (socket) => {
            this.handleGetMyBids(socket);
        });
        
        this.server.on('auction:history', (socket) => {
            this.handleGetHistory(socket);
        });
        
        this.server.on('auction:autobid', (socket, data) => {
            this.handleSetAutoBid(socket, data);
        });
    }
    
    // ===== LISTING OPERATIONS =====
    
    generateListingId() {
        return `AUC-${Date.now()}-${this.nextListingId++}`;
    }
    
    handleOpenAuction(socket) {
        // Send initial data: featured listings, categories
        const featured = this.getFeaturedListings(10);
        
        socket.emit('auction:opened', {
            categories: this.categories,
            featured: featured,
            stats: this.getAuctionStats()
        });
    }
    
    handlePostListing(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { item, startingBid, buyoutPrice, duration, category } = data;
        
        // Validation
        if (!this.validateListing(socket, player, item, startingBid, buyoutPrice, duration)) {
            return;
        }
        
        // Check listing limit
        const playerListings = this.getPlayerListings(socket.playerId);
        if (playerListings.length >= this.config.maxListingsPerPlayer) {
            socket.emit('auction:error', { message: `Limite de ${this.config.maxListingsPerPlayer} leilões atingido!` });
            return;
        }
        
        // Calculate fee
        const listingFee = Math.floor((buyoutPrice || startingBid) * this.config.listingFee);
        
        if ((player.gold || 0) < listingFee) {
            socket.emit('auction:error', { message: `Taxa de listagem (${listingFee}g) não disponível!` });
            return;
        }
        
        // Deduct fee
        player.gold -= listingFee;
        
        // Remove item from player inventory
        this.removeItemFromPlayer(player, item, item.quantity || 1);
        
        // Create listing
        const listingId = this.generateListingId();
        const expiresAt = Date.now() + duration;
        
        const listing = {
            id: listingId,
            sellerId: socket.playerId,
            sellerName: player.name,
            item: {
                id: item.id,
                name: item.name,
                icon: item.icon,
                rarity: item.rarity,
                level: item.level || 1,
                stats: item.stats || {},
                description: item.description || '',
                quantity: item.quantity || 1,
                category: category || item.category || 'misc',
                bindOnPickup: item.bindOnPickup || false,
                bindOnEquip: item.bindOnEquip || false
            },
            startingBid: startingBid,
            currentBid: startingBid,
            currentBidder: null,
            currentBidderName: null,
            buyoutPrice: buyoutPrice || null,
            createdAt: Date.now(),
            expiresAt: expiresAt,
            status: 'active',
            bids: [],
            watchers: new Set(),
            autoBids: new Map() // playerId -> maxAutoBid
        };
        
        this.listings.set(listingId, listing);
        this.bids.set(listingId, []);
        
        // Notify
        socket.emit('auction:posted', {
            listingId: listingId,
            fee: listingFee,
            expiresAt: expiresAt
        });
        
        // Broadcast new listing
        this.io.emit('auction:new_listing', {
            id: listingId,
            item: listing.item,
            sellerName: player.name,
            currentBid: startingBid,
            buyoutPrice: buyoutPrice,
            expiresAt: expiresAt
        });
        
        console.log(`[AuctionManager] ${player.name} postou ${item.name} por ${startingBid}g`);
    }
    
    validateListing(socket, player, item, startingBid, buyoutPrice, duration) {
        if (!item) {
            socket.emit('auction:error', { message: 'Item inválido!' });
            return false;
        }
        
        if (!startingBid || startingBid < 1) {
            socket.emit('auction:error', { message: 'Lance inicial deve ser pelo menos 1 ouro!' });
            return false;
        }
        
        if (buyoutPrice && buyoutPrice <= startingBid) {
            socket.emit('auction:error', { message: 'Preço de compra imediata deve ser maior que o lance inicial!' });
            return false;
        }
        
        if (!duration || duration < 3600000 || duration > this.config.maxDuration) {
            socket.emit('auction:error', { message: 'Duração deve ser entre 1 hora e 7 dias!' });
            return false;
        }
        
        if (item.bindOnPickup && !item.canTrade) {
            socket.emit('auction:error', { message: 'Item vinculado não pode ser leiloado!' });
            return false;
        }
        
        return true;
    }
    
    handleBid(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { listingId, bidAmount } = data;
        const listing = this.listings.get(listingId);
        
        if (!this.validateBid(socket, player, listing, bidAmount)) {
            return;
        }
        
        // Return gold to previous bidder
        if (listing.currentBidder) {
            const prevBidder = this.server.players.get(listing.currentBidder);
            if (prevBidder) {
                prevBidder.gold = (prevBidder.gold || 0) + listing.currentBid;
                
                const prevSocket = this.getSocketByPlayerId(listing.currentBidder);
                if (prevSocket) {
                    prevSocket.emit('auction:outbid', {
                        listingId: listingId,
                        itemName: listing.item.name,
                        newBid: bidAmount,
                        newBidder: player.name
                    });
                }
            }
        }
        
        // Deduct gold from new bidder
        player.gold -= bidAmount;
        
        // Update listing
        const bid = {
            bidderId: socket.playerId,
            bidderName: player.name,
            amount: bidAmount,
            timestamp: Date.now()
        };
        
        listing.bids.push(bid);
        listing.currentBid = bidAmount;
        listing.currentBidder = socket.playerId;
        listing.currentBidderName = player.name;
        
        // Keep only recent bids
        if (listing.bids.length > this.config.maxBidHistory) {
            listing.bids.shift();
        }
        
        // Check auto-bids
        this.processAutoBids(listing);
        
        // Notify watchers
        this.notifyWatchers(listingId, 'bid', {
            currentBid: bidAmount,
            bidder: player.name,
            totalBids: listing.bids.length
        });
        
        // Confirm to bidder
        socket.emit('auction:bid_success', {
            listingId: listingId,
            bid: bidAmount,
            isWinning: true
        });
        
        console.log(`[AuctionManager] ${player.name} deu lance de ${bidAmount}g em ${listing.item.name}`);
    }
    
    validateBid(socket, player, listing, bidAmount) {
        if (!listing || listing.status !== 'active') {
            socket.emit('auction:error', { message: 'Leilão não encontrado ou finalizado!' });
            return false;
        }
        
        if (listing.sellerId === socket.playerId) {
            socket.emit('auction:error', { message: 'Não pode dar lance em seu próprio leilão!' });
            return false;
        }
        
        if (Date.now() >= listing.expiresAt) {
            socket.emit('auction:error', { message: 'Leilão expirado!' });
            return false;
        }
        
        const minBid = listing.currentBid * (1 + this.config.minBidIncrement);
        if (bidAmount < minBid) {
            socket.emit('auction:error', { message: `Lance mínimo: ${Math.ceil(minBid)}g` });
            return false;
        }
        
        if ((player.gold || 0) < bidAmount) {
            socket.emit('auction:error', { message: 'Ouro insuficiente!' });
            return false;
        }
        
        return true;
    }
    
    handleBuyout(socket, data) {
        const player = this.server.players.get(socket.playerId);
        if (!player) return;
        
        const { listingId } = data;
        const listing = this.listings.get(listingId);
        
        if (!listing || listing.status !== 'active') {
            socket.emit('auction:error', { message: 'Leilão não disponível!' });
            return;
        }
        
        if (!listing.buyoutPrice) {
            socket.emit('auction:error', { message: 'Este item não tem compra imediata!' });
            return;
        }
        
        if ((player.gold || 0) < listing.buyoutPrice) {
            socket.emit('auction:error', { message: 'Ouro insuficiente!' });
            return;
        }
        
        // Return gold to current bidder
        if (listing.currentBidder) {
            const prevBidder = this.server.players.get(listing.currentBidder);
            if (prevBidder) {
                prevBidder.gold = (prevBidder.gold || 0) + listing.currentBid;
            }
        }
        
        // Process sale
        this.processSale(listing, socket.playerId, player.name, listing.buyoutPrice, true);
    }
    
    handleCancel(socket, data) {
        const { listingId } = data;
        const listing = this.listings.get(listingId);
        
        if (!listing) {
            socket.emit('auction:error', { message: 'Leilão não encontrado!' });
            return;
        }
        
        if (listing.sellerId !== socket.playerId) {
            socket.emit('auction:error', { message: 'Você não é o dono deste leilão!' });
            return;
        }
        
        if (listing.bids.length > 0) {
            socket.emit('auction:error', { message: 'Não pode cancelar com lances ativos!' });
            return;
        }
        
        // Return item to seller
        const seller = this.server.players.get(socket.playerId);
        if (seller) {
            this.addItemToPlayer(seller, listing.item, listing.item.quantity);
        }
        
        listing.status = 'cancelled';
        
        socket.emit('auction:cancelled', { listingId });
        
        console.log(`[AuctionManager] Leilão ${listingId} cancelado`);
    }
    
    processSale(listing, buyerId, buyerName, finalPrice, isBuyout = false) {
        const seller = this.server.players.get(listing.sellerId);
        const buyer = this.server.players.get(buyerId);
        
        // Calculate sale fee
        const saleFee = Math.floor(finalPrice * this.config.saleFee);
        const sellerAmount = finalPrice - saleFee;
        
        // Give gold to seller
        if (seller) {
            seller.gold = (seller.gold || 0) + sellerAmount;
            
            const sellerSocket = this.getSocketByPlayerId(listing.sellerId);
            if (sellerSocket) {
                sellerSocket.emit('auction:sold', {
                    listingId: listing.id,
                    itemName: listing.item.name,
                    price: finalPrice,
                    fee: saleFee,
                    netAmount: sellerAmount,
                    buyer: buyerName
                });
            }
        }
        
        // Give item to buyer
        if (buyer) {
            this.addItemToPlayer(buyer, listing.item, listing.item.quantity);
            
            buyer.gold -= finalPrice;
            
            const buyerSocket = this.getSocketByPlayerId(buyerId);
            if (buyerSocket) {
                buyerSocket.emit('auction:won', {
                    listingId: listing.id,
                    item: listing.item,
                    price: finalPrice,
                    seller: listing.sellerName,
                    isBuyout: isBuyout
                });
            }
        }
        
        // Update listing
        listing.status = 'sold';
        listing.finalPrice = finalPrice;
        listing.soldAt = Date.now();
        listing.buyerId = buyerId;
        listing.buyerName = buyerName;
        
        // Log transaction
        this.transactions.push({
            listingId: listing.id,
            item: listing.item,
            sellerId: listing.sellerId,
            sellerName: listing.sellerName,
            buyerId: buyerId,
            buyerName: buyerName,
            price: finalPrice,
            fee: saleFee,
            isBuyout: isBuyout,
            timestamp: Date.now()
        });
        
        // Notify watchers
        this.notifyWatchers(listing.id, 'sold', {
            finalPrice: finalPrice,
            buyer: buyerName
        });
        
        console.log(`[AuctionManager] ${listing.item.name} vendido por ${finalPrice}g`);
    }
    
    // ===== WATCHLIST =====
    
    handleWatch(socket, data) {
        const { listingId } = data;
        
        if (!this.watchlists.has(socket.playerId)) {
            this.watchlists.set(socket.playerId, new Set());
        }
        
        const watchlist = this.watchlists.get(socket.playerId);
        watchlist.add(listingId);
        
        // Add watcher to listing
        const listing = this.listings.get(listingId);
        if (listing) {
            listing.watchers.add(socket.playerId);
        }
        
        socket.emit('auction:watch_added', { listingId });
    }
    
    handleUnwatch(socket, data) {
        const { listingId } = data;
        
        const watchlist = this.watchlists.get(socket.playerId);
        if (watchlist) {
            watchlist.delete(listingId);
        }
        
        const listing = this.listings.get(listingId);
        if (listing) {
            listing.watchers.delete(socket.playerId);
        }
        
        socket.emit('auction:watch_removed', { listingId });
    }
    
    // ===== AUTO-BID =====
    
    handleSetAutoBid(socket, data) {
        const { listingId, maxBid } = data;
        const listing = this.listings.get(listingId);
        
        if (!listing || listing.status !== 'active') {
            socket.emit('auction:error', { message: 'Leilão não disponível!' });
            return;
        }
        
        const player = this.server.players.get(socket.playerId);
        if (!player || (player.gold || 0) < maxBid) {
            socket.emit('auction:error', { message: 'Ouro insuficiente para auto-lance!' });
            return;
        }
        
        listing.autoBids.set(socket.playerId, maxBid);
        
        // Try to place bid immediately
        const minBid = listing.currentBid * (1 + this.config.minBidIncrement);
        if (maxBid >= minBid && listing.currentBidder !== socket.playerId) {
            this.handleBid(socket, { listingId, bidAmount: Math.min(maxBid, minBid) });
        }
        
        socket.emit('auction:autobid_set', { listingId, maxBid });
    }
    
    processAutoBids(listing) {
        if (!listing || listing.status !== 'active') return;
        
        // Sort auto-bids by max amount (highest first)
        const autoBids = Array.from(listing.autoBids.entries())
            .sort((a, b) => b[1] - a[1]);
        
        for (const [playerId, maxBid] of autoBids) {
            if (playerId === listing.currentBidder) continue;
            
            const minBid = listing.currentBid * (1 + this.config.minBidIncrement);
            
            if (maxBid >= minBid) {
                const player = this.server.players.get(playerId);
                if (player && (player.gold || 0) >= minBid) {
                    const socket = this.getSocketByPlayerId(playerId);
                    if (socket) {
                        this.handleBid(socket, {
                            listingId: listing.id,
                            bidAmount: Math.min(maxBid, minBid)
                        });
                    }
                }
            }
        }
    }
    
    // ===== SEARCH & QUERIES =====
    
    handleSearch(socket, data) {
        const { 
            query = '', 
            category = null, 
            rarity = null, 
            minLevel = null, 
            maxLevel = null,
            minPrice = null,
            maxPrice = null,
            sortBy = 'newest', // newest, ending_soon, lowest_price, highest_price, most_bids
            page = 0,
            pageSize = 20
        } = data;
        
        let results = Array.from(this.listings.values()).filter(l => l.status === 'active');
        
        // Text search
        if (query) {
            const q = query.toLowerCase();
            results = results.filter(l => 
                l.item.name.toLowerCase().includes(q) ||
                (l.item.description && l.item.description.toLowerCase().includes(q))
            );
        }
        
        // Category filter
        if (category) {
            results = results.filter(l => l.item.category === category);
        }
        
        // Rarity filter
        if (rarity) {
            results = results.filter(l => l.item.rarity === rarity);
        }
        
        // Level range
        if (minLevel !== null) {
            results = results.filter(l => (l.item.level || 1) >= minLevel);
        }
        if (maxLevel !== null) {
            results = results.filter(l => (l.item.level || 1) <= maxLevel);
        }
        
        // Price range
        if (minPrice !== null) {
            results = results.filter(l => l.currentBid >= minPrice);
        }
        if (maxPrice !== null) {
            results = results.filter(l => l.currentBid <= maxPrice);
        }
        
        // Sorting
        switch (sortBy) {
            case 'newest':
                results.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'ending_soon':
                results.sort((a, b) => a.expiresAt - b.expiresAt);
                break;
            case 'lowest_price':
                results.sort((a, b) => a.currentBid - b.currentBid);
                break;
            case 'highest_price':
                results.sort((a, b) => b.currentBid - a.currentBid);
                break;
                case 'most_bids':
                results.sort((a, b) => b.bids.length - a.bids.length);
                break;
        }
        
        // Pagination
        const total = results.length;
        const paginated = results.slice(page * pageSize, (page + 1) * pageSize);
        
        // Get player's watchlist
        const watchlist = this.watchlists.get(socket.playerId) || new Set();
        
        // Add watch status
        const resultsWithWatch = paginated.map(l => ({
            ...l,
            isWatched: watchlist.has(l.id),
            watchers: undefined, // Don't send watcher IDs
            autoBids: undefined // Don't send auto-bids
        }));
        
        socket.emit('auction:search_results', {
            listings: resultsWithWatch,
            total: total,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    }
    
    handleGetMyListings(socket) {
        const myListings = Array.from(this.listings.values())
            .filter(l => l.sellerId === socket.playerId)
            .sort((a, b) => b.createdAt - a.createdAt);
        
        socket.emit('auction:my_listings', myListings);
    }
    
    handleGetMyBids(socket) {
        const myBidListings = Array.from(this.listings.values())
            .filter(l => 
                l.bids.some(b => b.bidderId === socket.playerId) ||
                l.currentBidder === socket.playerId
            )
            .sort((a, b) => b.expiresAt - a.expiresAt);
        
        socket.emit('auction:my_bids', myBidListings);
    }
    
    handleGetHistory(socket) {
        const myHistory = this.transactions.filter(t => 
            t.sellerId === socket.playerId || t.buyerId === socket.playerId
        ).slice(-50).reverse();
        
        socket.emit('auction:history', myHistory);
    }
    
    // ===== EXPIRATION =====
    
    startExpirationCheck() {
        this.expirationInterval = setInterval(() => {
            this.checkExpiredListings();
        }, 60000); // Check every minute
    }
    
    checkExpiredListings() {
        const now = Date.now();
        
        for (const listing of this.listings.values()) {
            if (listing.status === 'active' && now >= listing.expiresAt) {
                this.finalizeListing(listing);
            }
        }
    }
    
    finalizeListing(listing) {
        if (listing.bids.length === 0) {
            // No bids - return item to seller
            const seller = this.server.players.get(listing.sellerId);
            if (seller) {
                this.addItemToPlayer(seller, listing.item, listing.item.quantity);
                
                const sellerSocket = this.getSocketByPlayerId(listing.sellerId);
                if (sellerSocket) {
                    sellerSocket.emit('auction:expired_no_bids', {
                        listingId: listing.id,
                        itemName: listing.item.name
                    });
                }
            }
            
            listing.status = 'expired';
            console.log(`[AuctionManager] Leilão ${listing.id} expirado sem lances`);
        } else {
            // Has bids - sell to highest bidder
            this.processSale(listing, listing.currentBidder, listing.currentBidderName, listing.currentBid, false);
        }
    }
    
    // ===== UTILITIES =====
    
    getFeaturedListings(limit = 10) {
        return Array.from(this.listings.values())
            .filter(l => l.status === 'active')
            .sort((a, b) => b.bids.length - a.bids.length)
            .slice(0, limit);
    }
    
    getPlayerListings(playerId) {
        return Array.from(this.listings.values())
            .filter(l => l.sellerId === playerId && l.status === 'active');
    }
    
    getAuctionStats() {
        const active = Array.from(this.listings.values()).filter(l => l.status === 'active');
        
        return {
            activeListings: active.length,
            totalBidsToday: this.transactions.filter(t => 
                Date.now() - t.timestamp < 86400000
            ).length,
            averagePrice: this.calculateAveragePrice(),
            hotCategories: this.getHotCategories()
        };
    }
    
    calculateAveragePrice() {
        const recent = this.transactions.filter(t => 
            Date.now() - t.timestamp < 7 * 86400000
        );
        
        if (recent.length === 0) return 0;
        
        const total = recent.reduce((sum, t) => sum + t.price, 0);
        return Math.floor(total / recent.length);
    }
    
    getHotCategories() {
        const categoryCounts = {};
        
        for (const t of this.transactions) {
            if (Date.now() - t.timestamp < 86400000) {
                const cat = t.item.category || 'misc';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            }
        }
        
        return Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat, count]) => ({ category: cat, count }));
    }
    
    notifyWatchers(listingId, type, data) {
        const listing = this.listings.get(listingId);
        if (!listing) return;
        
        for (const watcherId of listing.watchers) {
            const socket = this.getSocketByPlayerId(watcherId);
            if (socket) {
                socket.emit('auction:watcher_notification', {
                    listingId: listingId,
                    itemName: listing.item.name,
                    type: type,
                    data: data
                });
            }
        }
    }
    
    // ===== PLACEHOLDERS =====
    
    removeItemFromPlayer(player, item, quantity) {
        // Placeholder - integrate with your inventory system
    }
    
    addItemToPlayer(player, item, quantity) {
        // Placeholder - integrate with your inventory system
    }
    
    getSocketByPlayerId(playerId) {
        // Placeholder - implement based on your socket.io setup
        return null;
    }
    
    // ===== API =====
    
    getListing(listingId) {
        return this.listings.get(listingId);
    }
    
    getAllListings() {
        return Array.from(this.listings.values());
    }
    
    shutdown() {
        if (this.expirationInterval) {
            clearInterval(this.expirationInterval);
        }
    }
}

module.exports = AuctionManager;
