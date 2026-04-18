/**
 * AuctionHouseUI.js
 * Client-side auction house interface
 * Phase 2: Trading & Economy
 */

class AuctionHouseUI {
    constructor(socket, inventoryManager) {
        this.socket = socket;
        this.inventoryManager = inventoryManager;
        this.isOpen = false;
        this.currentTab = 'browse'; // browse, my_auctions, my_bids, create
        this.auctions = [];
        this.myAuctions = [];
        this.myBids = [];
        this.filters = {
            search: '',
            minLevel: null,
            maxLevel: null,
            rarity: null,
            sortBy: 'expires_at'
        };
        this.currentPage = 1;
        this.totalPages = 1;
        this.selectedItem = null;

        this.setupSocketListeners();
        this.createDOM();
    }

    createDOM() {
        this.container = document.createElement('div');
        this.container.id = 'auction-house';
        this.container.className = 'auction-house hidden';
        this.container.innerHTML = `
            <div class="auction-header">
                <h2>🏛️ Auction House</h2>
                <button class="auction-close-btn">&times;</button>
            </div>
            <div class="auction-tabs">
                <button class="tab-btn active" data-tab="browse">Browse</button>
                <button class="tab-btn" data-tab="my_auctions">My Auctions</button>
                <button class="tab-btn" data-tab="my_bids">My Bids</button>
                <button class="tab-btn" data-tab="create">Create Auction</button>
            </div>
            <div class="auction-content">
                <!-- Browse Tab -->
                <div class="tab-content active" id="tab-browse">
                    <div class="auction-filters">
                        <input type="text" id="auction-search" placeholder="Search items...">
                        <select id="filter-rarity">
                            <option value="">All Rarities</option>
                            <option value="common">Common</option>
                            <option value="uncommon">Uncommon</option>
                            <option value="rare">Rare</option>
                            <option value="epic">Epic</option>
                            <option value="legendary">Legendary</option>
                        </select>
                        <select id="sort-by">
                            <option value="expires_at">Ending Soon</option>
                            <option value="starting_price">Lowest Price</option>
                            <option value="current_bid">Current Bid</option>
                            <option value="created_at">Newest</option>
                        </select>
                        <button id="refresh-auctions">🔄 Refresh</button>
                    </div>
                    <div class="auction-list" id="auction-list"></div>
                    <div class="auction-pagination">
                        <button id="prev-page" disabled>&lt; Prev</button>
                        <span id="page-info">Page 1 of 1</span>
                        <button id="next-page" disabled>Next &gt;</button>
                    </div>
                </div>

                <!-- My Auctions Tab -->
                <div class="tab-content" id="tab-my_auctions">
                    <div class="my-auctions-list" id="my-auctions-list"></div>
                </div>

                <!-- My Bids Tab -->
                <div class="tab-content" id="tab-my_bids">
                    <div class="my-bids-list" id="my-bids-list"></div>
                </div>

                <!-- Create Auction Tab -->
                <div class="tab-content" id="tab-create">
                    <div class="create-auction-container">
                        <div class="item-selection">
                            <h3>Select Item from Inventory</h3>
                            <div class="inventory-grid" id="auction-inventory"></div>
                        </div>
                        <div class="auction-settings" id="auction-settings">
                            <h3>Auction Settings</h3>
                            <div class="selected-item-preview" id="selected-item-preview">
                                <p class="no-selection">Select an item from your inventory</p>
                            </div>
                            <div class="price-settings">
                                <div class="price-row">
                                    <label>Starting Price:</label>
                                    <input type="number" id="starting-price" min="1" value="100">
                                    <button id="suggest-price">💡 Suggest</button>
                                </div>
                                <div class="price-row">
                                    <label>Buyout Price (optional):</label>
                                    <input type="number" id="buyout-price" min="0" placeholder="No buyout">
                                </div>
                                <div class="price-row">
                                    <label>Duration:</label>
                                    <select id="auction-duration">
                                        <option value="12">12 hours</option>
                                        <option value="24" selected>24 hours</option>
                                        <option value="48">48 hours</option>
                                        <option value="72">72 hours</option>
                                        <option value="168">7 days</option>
                                    </select>
                                </div>
                            </div>
                            <div class="price-estimate" id="price-estimate"></div>
                            <button id="create-auction-btn" class="create-btn" disabled>Create Auction</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        // Bid Modal
        this.bidModal = document.createElement('div');
        this.bidModal.id = 'bid-modal';
        this.bidModal.className = 'modal hidden';
        this.bidModal.innerHTML = `
            <div class="modal-content">
                <h3>Place Bid</h3>
                <div class="auction-details" id="bid-auction-details"></div>
                <div class="bid-input">
                    <label>Your Bid:</label>
                    <input type="number" id="bid-amount" min="1">
                    <button id="place-bid-btn">Place Bid</button>
                    <button id="buyout-btn" class="buyout">Buyout</button>
                </div>
                <button class="close-modal">Cancel</button>
            </div>
        `;
        document.body.appendChild(this.bidModal);

        this.bindEvents();
    }

    bindEvents() {
        // Close button
        this.container.querySelector('.auction-close-btn').addEventListener('click', () => {
            this.close();
        });

        // Tab switching
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Filters
        this.container.querySelector('#auction-search').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.currentPage = 1;
            this.loadAuctions();
        });

        this.container.querySelector('#filter-rarity').addEventListener('change', (e) => {
            this.filters.rarity = e.target.value || null;
            this.currentPage = 1;
            this.loadAuctions();
        });

        this.container.querySelector('#sort-by').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.loadAuctions();
        });

        this.container.querySelector('#refresh-auctions').addEventListener('click', () => {
            this.loadAuctions();
        });

        // Pagination
        this.container.querySelector('#prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadAuctions();
            }
        });

        this.container.querySelector('#next-page').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadAuctions();
            }
        });

        // Create auction
        this.container.querySelector('#suggest-price').addEventListener('click', () => {
            this.suggestPrice();
        });

        this.container.querySelector('#starting-price').addEventListener('input', () => {
            this.validateCreateForm();
        });

        this.container.querySelector('#create-auction-btn').addEventListener('click', () => {
            this.createAuction();
        });

        // Bid modal
        this.bidModal.querySelector('.close-modal').addEventListener('click', () => {
            this.closeBidModal();
        });

        this.bidModal.querySelector('#place-bid-btn').addEventListener('click', () => {
            this.placeBid();
        });

        this.bidModal.querySelector('#buyout-btn').addEventListener('click', () => {
            this.buyout();
        });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!this.bidModal.classList.contains('hidden')) {
                    this.closeBidModal();
                } else if (this.isOpen) {
                    this.close();
                }
            }
        });
    }

    setupSocketListeners() {
        // Auction list
        this.socket.on('auction:list', (data) => {
            if (data.success) {
                this.auctions = data.auctions;
                this.totalPages = data.pagination.pages;
                this.currentPage = data.pagination.page;
                this.renderAuctions();
                this.updatePagination();
            }
        });

        // New auction
        this.socket.on('auction:new', (data) => {
            this.showNotification('New auction listed!', 'info');
            if (this.currentTab === 'browse') {
                this.loadAuctions();
            }
        });

        // Bid update
        this.socket.on('auction:bid_update', (data) => {
            this.showNotification('Auction bid updated!', 'info');
            this.updateAuctionBid(data);
        });

        // Auction sold
        this.socket.on('auction:sold', (data) => {
            if (data.buyerId === this.getMyPlayerId()) {
                this.showNotification('You won an auction!', 'success');
            }
            this.loadAuctions();
        });

        // My auctions
        this.socket.on('auction:my_auctions', (data) => {
            if (data.success) {
                this.myAuctions = data.auctions;
                this.renderMyAuctions();
            }
        });

        // My bids
        this.socket.on('auction:my_bids', (data) => {
            if (data.success) {
                this.myBids = data.auctions;
                this.renderMyBids();
            }
        });
    }

    open() {
        this.container.classList.remove('hidden');
        this.isOpen = true;
        this.loadAuctions();
    }

    close() {
        this.container.classList.add('hidden');
        this.isOpen = false;
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update content
        this.container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tab}`);
        });

        // Load data for tab
        if (tab === 'browse') {
            this.loadAuctions();
        } else if (tab === 'my_auctions') {
            this.loadMyAuctions();
        } else if (tab === 'my_bids') {
            this.loadMyBids();
        } else if (tab === 'create') {
            this.renderInventoryForAuction();
        }
    }

    loadAuctions() {
        this.socket.emit('auction:get_list', {
            page: this.currentPage,
            limit: 20,
            filters: this.filters
        });
    }

    loadMyAuctions() {
        this.socket.emit('auction:get_my_auctions', {});
    }

    loadMyBids() {
        this.socket.emit('auction:get_my_bids', {});
    }

    renderAuctions() {
        const list = this.container.querySelector('#auction-list');

        if (this.auctions.length === 0) {
            list.innerHTML = '<div class="no-auctions">No active auctions found</div>';
            return;
        }

        list.innerHTML = this.auctions.map(auction => this.renderAuctionItem(auction)).join('');

        // Add click handlers
        list.querySelectorAll('.auction-item').forEach(item => {
            item.addEventListener('click', () => {
                const auctionId = item.dataset.auctionId;
                this.openBidModal(auctionId);
            });
        });
    }

    renderAuctionItem(auction) {
        const item = auction.item;
        const timeLeft = this.formatTimeLeft(auction.timeLeft);
        const hasBids = auction.currentBid > 0;
        const isMyAuction = auction.sellerId === this.getMyPlayerId();

        return `
            <div class="auction-item ${isMyAuction ? 'my-auction' : ''}" data-auction-id="${auction.id}">
                <div class="item-icon rarity-${item.rarity || 'common'}">
                    <img src="${item.icon || 'assets/items/default.png'}" alt="${item.name}">
                </div>
                <div class="auction-info">
                    <div class="item-name rarity-${item.rarity || 'common'}">${item.name}</div>
                    <div class="item-level">Level ${item.level || 1} ${item.rarity || 'common'}</div>
                    <div class="seller">by ${auction.sellerName || 'Unknown'}</div>
                </div>
                <div class="auction-prices">
                    <div class="current-bid">${hasBids ? auction.currentBid : auction.startingPrice}g</div>
                    <div class="bid-label">${hasBids ? 'Current Bid' : 'Starting'}</div>
                    ${auction.buyoutPrice ? `
                        <div class="buyout-price">${auction.buyoutPrice}g buyout</div>
                    ` : ''}
                </div>
                <div class="auction-time">${timeLeft}</div>
                ${isMyAuction ? '<div class="my-badge">MY AUCTION</div>' : ''}
            </div>
        `;
    }

    renderMyAuctions() {
        const list = this.container.querySelector('#my-auctions-list');

        if (this.myAuctions.length === 0) {
            list.innerHTML = '<div class="no-auctions">You have no active auctions</div>';
            return;
        }

        list.innerHTML = this.myAuctions.map(auction => this.renderMyAuctionItem(auction)).join('');

        // Add cancel handlers
        list.querySelectorAll('.cancel-auction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const auctionId = btn.dataset.auctionId;
                this.cancelAuction(auctionId);
            });
        });
    }

    renderMyAuctionItem(auction) {
        const item = auction.item;
        const timeLeft = this.formatTimeLeft(auction.timeLeft);
        const canCancel = auction.bidsCount === 0;

        return `
            <div class="auction-item my-auction-item" data-auction-id="${auction.id}">
                <div class="item-icon rarity-${item.rarity || 'common'}">
                    <img src="${item.icon || 'assets/items/default.png'}" alt="${item.name}">
                </div>
                <div class="auction-info">
                    <div class="item-name rarity-${item.rarity || 'common'}">${item.name}</div>
                    <div class="item-level">Level ${item.level || 1}</div>
                    <div class="bid-count">${auction.bidsCount} bids</div>
                </div>
                <div class="auction-prices">
                    <div class="current-bid">${auction.currentBid || auction.startingPrice}g</div>
                    ${auction.buyoutPrice ? `<div class="buyout">${auction.buyoutPrice}g buyout</div>` : ''}
                </div>
                <div class="auction-actions">
                    <div class="time-left">${timeLeft}</div>
                    ${canCancel ? `
                        <button class="cancel-auction-btn" data-auction-id="${auction.id}">Cancel</button>
                    ` : '<span class="has-bids">Has bids</span>'}
                </div>
            </div>
        `;
    }

    renderMyBids() {
        const list = this.container.querySelector('#my-bids-list');

        if (this.myBids.length === 0) {
            list.innerHTML = '<div class="no-auctions">You have no active bids</div>';
            return;
        }

        list.innerHTML = this.myBids.map(auction => this.renderMyBidItem(auction)).join('');
    }

    renderMyBidItem(auction) {
        const item = auction.item;
        const timeLeft = this.formatTimeLeft(auction.timeLeft);
        const isWinning = auction.isWinning;

        return `
            <div class="auction-item bid-item ${isWinning ? 'winning' : 'outbid'}" data-auction-id="${auction.id}">
                <div class="status-badge">${isWinning ? 'WINNING' : 'OUTBID'}</div>
                <div class="item-icon rarity-${item.rarity || 'common'}">
                    <img src="${item.icon || 'assets/items/default.png'}" alt="${item.name}">
                </div>
                <div class="auction-info">
                    <div class="item-name rarity-${item.rarity || 'common'}">${item.name}</div>
                    <div class="item-level">Level ${item.level || 1}</div>
                </div>
                <div class="auction-prices">
                    <div class="my-bid">Your bid: ${auction.currentBid}g</div>
                    <div class="current-price">Current: ${auction.currentBid}g</div>
                </div>
                <div class="auction-time">${timeLeft}</div>
            </div>
        `;
    }

    renderInventoryForAuction() {
        const grid = this.container.querySelector('#auction-inventory');
        const items = this.inventoryManager.getItems ? this.inventoryManager.getItems() : [];

        if (items.length === 0) {
            grid.innerHTML = '<div class="no-items">Your inventory is empty</div>';
            return;
        }

        grid.innerHTML = items.map(item => `
            <div class="inventory-item rarity-${item.rarity || 'common'}" data-item-id="${item.id}">
                <img src="${item.icon || 'assets/items/default.png'}" alt="${item.name}">
                <span class="item-quantity">${item.quantity || 1}</span>
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.inventory-item').forEach(itemEl => {
            itemEl.addEventListener('click', () => {
                const itemId = itemEl.dataset.itemId;
                const item = items.find(i => i.id === itemId);
                this.selectItemForAuction(item);
            });
        });
    }

    selectItemForAuction(item) {
        this.selectedItem = item;

        const preview = this.container.querySelector('#selected-item-preview');
        preview.innerHTML = `
            <div class="selected-item rarity-${item.rarity || 'common'}">
                <img src="${item.icon || 'assets/items/default.png'}" alt="${item.name}">
                <div class="item-details">
                    <div class="name">${item.name}</div>
                    <div class="level">Level ${item.level || 1} ${item.rarity || 'common'}</div>
                    <div class="type">${item.type || 'Item'}</div>
                </div>
            </div>
        `;

        // Enable create button
        this.validateCreateForm();

        // Get price suggestion
        this.suggestPrice();
    }

    suggestPrice() {
        if (!this.selectedItem) return;

        this.socket.emit('price:auction_suggestion', { item: this.selectedItem }, (response) => {
            if (response.success) {
                this.container.querySelector('#starting-price').value = response.suggestions.startingPrice;
                this.container.querySelector('#buyout-price').value = response.suggestions.buyoutPrice || '';

                const estimate = this.container.querySelector('#price-estimate');
                estimate.innerHTML = `
                    <div class="estimate-box">
                        <div class="estimate-title">Price Estimate</div>
                        <div class="estimate-range">
                            ${response.estimate.low}g - ${response.estimate.high}g
                        </div>
                        <div class="estimate-trend ${response.estimate.trend}">
                            ${response.estimate.trend === 'rising' ? '📈 Rising' : 
                              response.estimate.trend === 'falling' ? '📉 Falling' : '➡️ Stable'}
                        </div>
                        <div class="estimate-confidence">
                            Confidence: ${response.estimate.confidence}
                        </div>
                        <div class="estimate-recommendation">
                            ${response.recommendation}
                        </div>
                    </div>
                `;

                this.validateCreateForm();
            }
        });
    }

    validateCreateForm() {
        const startingPrice = parseInt(this.container.querySelector('#starting-price').value) || 0;
        const hasItem = !!this.selectedItem;
        const isValid = hasItem && startingPrice >= 1;

        this.container.querySelector('#create-auction-btn').disabled = !isValid;
    }

    createAuction() {
        if (!this.selectedItem) return;

        const startingPrice = parseInt(this.container.querySelector('#starting-price').value);
        const buyoutPrice = parseInt(this.container.querySelector('#buyout-price').value) || null;
        const durationHours = parseInt(this.container.querySelector('#auction-duration').value);

        this.socket.emit('auction:create', {
            item: this.selectedItem,
            startingPrice,
            buyoutPrice,
            durationHours
        }, (response) => {
            if (response.success) {
                this.showNotification('Auction created successfully!', 'success');
                this.selectedItem = null;
                this.container.querySelector('#selected-item-preview').innerHTML = '<p class="no-selection">Select an item from your inventory</p>';
                this.container.querySelector('#price-estimate').innerHTML = '';
                this.renderInventoryForAuction();
                this.switchTab('my_auctions');
            } else {
                this.showNotification(response.error, 'error');
            }
        });
    }

    openBidModal(auctionId) {
        const auction = this.auctions.find(a => a.id === auctionId);
        if (!auction) return;

        this.currentBidAuction = auction;

        const details = this.bidModal.querySelector('#bid-auction-details');
        details.innerHTML = `
            <div class="auction-item-large">
                <div class="item-icon-large rarity-${auction.item.rarity || 'common'}">
                    <img src="${auction.item.icon || 'assets/items/default.png'}" alt="${auction.item.name}">
                </div>
                <div class="item-info">
                    <h4 class="rarity-${auction.item.rarity || 'common'}">${auction.item.name}</h4>
                    <p>Level ${auction.item.level || 1} ${auction.item.rarity || 'common'}</p>
                    <p>Seller: ${auction.sellerName || 'Unknown'}</p>
                </div>
            </div>
            <div class="bid-info">
                <div class="current-bid-large">
                    <span class="label">Current Bid:</span>
                    <span class="amount">${auction.currentBid || auction.startingPrice}g</span>
                </div>
                ${auction.buyoutPrice ? `
                    <div class="buyout-price-large">
                        <span class="label">Buyout:</span>
                        <span class="amount">${auction.buyoutPrice}g</span>
                    </div>
                ` : ''}
            </div>
        `;

        // Set minimum bid
        const minBid = auction.currentBid > 0
            ? auction.currentBid + Math.ceil(auction.currentBid * 0.05)
            : auction.startingPrice;

        this.bidModal.querySelector('#bid-amount').value = minBid;
        this.bidModal.querySelector('#bid-amount').min = minBid;

        // Show/hide buyout button
        const buyoutBtn = this.bidModal.querySelector('#buyout-btn');
        buyoutBtn.style.display = auction.buyoutPrice ? 'inline-block' : 'none';

        this.bidModal.classList.remove('hidden');
    }

    closeBidModal() {
        this.bidModal.classList.add('hidden');
        this.currentBidAuction = null;
    }

    placeBid() {
        if (!this.currentBidAuction) return;

        const amount = parseInt(this.bidModal.querySelector('#bid-amount').value);

        this.socket.emit('auction:bid', {
            auctionId: this.currentBidAuction.id,
            bidAmount: amount
        }, (response) => {
            if (response.success) {
                this.showNotification('Bid placed successfully!', 'success');
                this.closeBidModal();
                this.loadAuctions();
            } else {
                this.showNotification(response.error, 'error');
            }
        });
    }

    buyout() {
        if (!this.currentBidAuction || !this.currentBidAuction.buyoutPrice) return;

        this.socket.emit('auction:buyout', {
            auctionId: this.currentBidAuction.id
        }, (response) => {
            if (response.success) {
                this.showNotification('Item purchased!', 'success');
                this.closeBidModal();
                this.loadAuctions();
            } else {
                this.showNotification(response.error, 'error');
            }
        });
    }

    cancelAuction(auctionId) {
        if (!confirm('Are you sure you want to cancel this auction?')) return;

        this.socket.emit('auction:cancel', { auctionId }, (response) => {
            if (response.success) {
                this.showNotification('Auction cancelled', 'success');
                this.loadMyAuctions();
            } else {
                this.showNotification(response.error, 'error');
            }
        });
    }

    updateAuctionBid(data) {
        // Update auction in list if visible
        const auctionEl = this.container.querySelector(`[data-auction-id="${data.auctionId}"]`);
        if (auctionEl) {
            const bidEl = auctionEl.querySelector('.current-bid');
            if (bidEl) {
                bidEl.textContent = `${data.currentBid}g`;
            }
            const labelEl = auctionEl.querySelector('.bid-label');
            if (labelEl) {
                labelEl.textContent = 'Current Bid';
            }
        }
    }

    updatePagination() {
        this.container.querySelector('#page-info').textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        this.container.querySelector('#prev-page').disabled = this.currentPage <= 1;
        this.container.querySelector('#next-page').disabled = this.currentPage >= this.totalPages;
    }

    formatTimeLeft(ms) {
        if (ms <= 0) return 'Ended';

        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }

        return `${minutes}m`;
    }

    getMyPlayerId() {
        // Get from your player manager
        return window.playerManager?.currentPlayer?.id || 'unknown';
    }

    showNotification(message, type) {
        if (window.gameNotification) {
            window.gameNotification.show(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuctionHouseUI;
}
