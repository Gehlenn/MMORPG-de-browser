/**
 * AuctionUI - Interface do Casa de Leilões (Auction House)
 * 
 * Features:
 * - Busca com filtros avançados
 * - Grid de listagens
 * - Postar item para venda
 * - Lances em tempo real
 * - Watchlist
 * - Histórico de transações
 * - Auto-lance
 */

class AuctionUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.currentTab = 'browse'; // browse, post, mylistings, mybids, history
        this.currentPage = 0;
        this.pageSize = 20;
        this.listings = [];
        this.categories = {};
        this.selectedListing = null;
        this.watchlist = new Set();
        this.searchFilters = {
            query: '',
            category: null,
            rarity: null,
            minLevel: null,
            maxLevel: null,
            minPrice: null,
            maxPrice: null,
            sortBy: 'newest'
        };
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.registerSocketEvents();
        this.registerKeyboardShortcuts();
    }
    
    createUI() {
        // Container principal
        this.container = document.createElement('div');
        this.container.id = 'auction-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 1000px;
            height: 700px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #d69e2e;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            flex-direction: column;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #fff;
        `;
        
        // Header
        const header = this.createHeader();
        this.container.appendChild(header);
        
        // Navigation tabs
        const nav = this.createNavigation();
        this.container.appendChild(nav);
        
        // Content area
        this.contentArea = document.createElement('div');
        this.contentArea.style.cssText = `
            flex: 1;
            overflow: hidden;
            display: flex;
        `;
        this.container.appendChild(this.contentArea);
        
        // Footer
        const footer = this.createFooter();
        this.container.appendChild(footer);
        
        document.body.appendChild(this.container);
    }
    
    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(90deg, #d69e2e, #b7791f);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const title = document.createElement('h2');
        title.innerHTML = '🏪 Casa de Leilões';
        title.style.cssText = `
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        `;
        
        // Stats
        this.statsDisplay = document.createElement('div');
        this.statsDisplay.style.cssText = `
            display: flex;
            gap: 20px;
            font-size: 13px;
        `;
        this.statsDisplay.innerHTML = `
            <span>📦 <span id="auction-active">0</span> ativos</span>
            <span>💰 Média: <span id="auction-avg">0</span>g</span>
        `;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        closeBtn.onclick = () => this.hide();
        
        header.appendChild(title);
        header.appendChild(this.statsDisplay);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    createNavigation() {
        const nav = document.createElement('div');
        nav.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            padding: 0 20px;
            display: flex;
            gap: 5px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;
        
        const tabs = [
            { id: 'browse', icon: '🔍', label: 'Procurar' },
            { id: 'post', icon: '📤', label: 'Vender' },
            { id: 'mylistings', icon: '📋', label: 'Meus Leilões' },
            { id: 'mybids', icon: '🏷️', label: 'Meus Lances' },
            { id: 'history', icon: '📜', label: 'Histórico' }
        ];
        
        this.tabButtons = {};
        
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.innerHTML = `${tab.icon} ${tab.label}`;
            btn.style.cssText = this.getTabStyle(tab.id === 'browse');
            btn.onclick = () => this.switchTab(tab.id);
            this.tabButtons[tab.id] = btn;
            nav.appendChild(btn);
        });
        
        return nav;
    }
    
    getTabStyle(active) {
        return `
            padding: 12px 20px;
            background: ${active ? 'rgba(214, 158, 46, 0.3)' : 'transparent'};
            border: none;
            border-bottom: 3px solid ${active ? '#d69e2e' : 'transparent'};
            color: ${active ? '#fff' : 'rgba(255,255,255,0.7)'};
            cursor: pointer;
            font-weight: ${active ? '600' : '400'};
            transition: all 0.2s;
        `;
    }
    
    createFooter() {
        const footer = document.createElement('div');
        footer.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            padding: 10px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: center;
            gap: 10px;
        `;
        
        // Pagination
        this.prevBtn = document.createElement('button');
        this.prevBtn.innerHTML = '← Anterior';
        this.prevBtn.style.cssText = this.getPaginationBtnStyle();
        this.prevBtn.onclick = () => this.changePage(-1);
        this.prevBtn.disabled = true;
        
        this.pageDisplay = document.createElement('span');
        this.pageDisplay.textContent = 'Página 1';
        this.pageDisplay.style.cssText = `
            padding: 8px 16px;
            color: rgba(255,255,255,0.7);
            font-size: 14px;
        `;
        
        this.nextBtn = document.createElement('button');
        this.nextBtn.innerHTML = 'Próximo →';
        this.nextBtn.style.cssText = this.getPaginationBtnStyle();
        this.nextBtn.onclick = () => this.changePage(1);
        
        footer.appendChild(this.prevBtn);
        footer.appendChild(this.pageDisplay);
        footer.appendChild(this.nextBtn);
        
        return footer;
    }
    
    getPaginationBtnStyle() {
        return `
            padding: 8px 16px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        `;
    }
    
    // ===== TAB CONTENT =====
    
    switchTab(tabId) {
        this.currentTab = tabId;
        this.currentPage = 0;
        
        // Update tab styles
        Object.keys(this.tabButtons).forEach(key => {
            this.tabButtons[key].style.cssText = this.getTabStyle(key === tabId);
        });
        
        // Load content
        this.contentArea.innerHTML = '';
        
        switch (tabId) {
            case 'browse':
                this.showBrowseTab();
                break;
            case 'post':
                this.showPostTab();
                break;
            case 'mylistings':
                this.socket?.emit('auction:mylistings');
                this.showLoading();
                break;
            case 'mybids':
                this.socket?.emit('auction:mybids');
                this.showLoading();
                break;
            case 'history':
                this.socket?.emit('auction:history');
                this.showLoading();
                break;
        }
    }
    
    showBrowseTab() {
        // Left panel: Search & Filters
        const leftPanel = document.createElement('div');
        leftPanel.style.cssText = `
            width: 280px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            overflow-y: auto;
        `;
        
        leftPanel.appendChild(this.createSearchSection());
        leftPanel.appendChild(this.createFilterSection());
        leftPanel.appendChild(this.createSortSection());
        
        // Right panel: Listings
        const rightPanel = document.createElement('div');
        rightPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        `;
        
        this.listingsContainer = document.createElement('div');
        this.listingsContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
        `;
        
        rightPanel.appendChild(this.listingsContainer);
        
        this.contentArea.appendChild(leftPanel);
        this.contentArea.appendChild(rightPanel);
        
        // Initial search
        this.performSearch();
    }
    
    createSearchSection() {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 20px;';
        
        const label = document.createElement('label');
        label.textContent = '🔍 Buscar';
        label.style.cssText = 'display: block; margin-bottom: 8px; font-size: 13px; color: rgba(255,255,255,0.7);';
        
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Nome do item...';
        this.searchInput.style.cssText = `
            width: 100%;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            font-size: 14px;
        `;
        this.searchInput.oninput = (e) => {
            this.searchFilters.query = e.target.value;
            this.debounceSearch();
        };
        
        section.appendChild(label);
        section.appendChild(this.searchInput);
        
        return section;
    }
    
    createFilterSection() {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 20px;';
        
        const title = document.createElement('h4');
        title.textContent = '🏷️ Filtros';
        title.style.cssText = 'margin: 0 0 15px 0; font-size: 14px; color: #d69e2e;';
        section.appendChild(title);
        
        // Category filter
        const catLabel = document.createElement('label');
        catLabel.textContent = 'Categoria';
        catLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 12px; color: rgba(255,255,255,0.6);';
        
        this.categorySelect = document.createElement('select');
        this.categorySelect.style.cssText = `
            width: 100%;
            padding: 8px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px;
            color: white;
            margin-bottom: 12px;
            font-size: 13px;
        `;
        this.categorySelect.innerHTML = '<option value="">Todas</option>';
        this.categorySelect.onchange = (e) => {
            this.searchFilters.category = e.target.value || null;
            this.performSearch();
        };
        
        // Rarity filter
        const rarityLabel = document.createElement('label');
        rarityLabel.textContent = 'Raridade';
        rarityLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 12px; color: rgba(255,255,255,0.6);';
        
        this.raritySelect = document.createElement('select');
        this.raritySelect.style.cssText = this.categorySelect.style.cssText;
        this.raritySelect.innerHTML = `
            <option value="">Todas</option>
            <option value="common">Comum</option>
            <option value="uncommon">Incomum</option>
            <option value="rare">Raro</option>
            <option value="epic">Épico</option>
            <option value="legendary">Lendário</option>
        `;
        this.raritySelect.onchange = (e) => {
            this.searchFilters.rarity = e.target.value || null;
            this.performSearch();
        };
        
        section.appendChild(catLabel);
        section.appendChild(this.categorySelect);
        section.appendChild(rarityLabel);
        section.appendChild(this.raritySelect);
        
        return section;
    }
    
    createSortSection() {
        const section = document.createElement('div');
        
        const title = document.createElement('h4');
        title.textContent = '📊 Ordenar';
        title.style.cssText = 'margin: 0 0 15px 0; font-size: 14px; color: #d69e2e;';
        
        this.sortSelect = document.createElement('select');
        this.sortSelect.style.cssText = `
            width: 100%;
            padding: 8px;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px;
            color: white;
            font-size: 13px;
        `;
        this.sortSelect.innerHTML = `
            <option value="newest">Mais recentes</option>
            <option value="ending_soon">Terminando em breve</option>
            <option value="lowest_price">Menor preço</option>
            <option value="highest_price">Maior preço</option>
            <option value="most_bids">Mais lances</option>
        `;
        this.sortSelect.onchange = (e) => {
            this.searchFilters.sortBy = e.target.value;
            this.performSearch();
        };
        
        section.appendChild(title);
        section.appendChild(this.sortSelect);
        
        return section;
    }
    
    // ===== LISTING RENDERING =====
    
    renderListings(listings, total) {
        this.listingsContainer.innerHTML = '';
        
        if (listings.length === 0) {
            this.listingsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: rgba(255,255,255,0.5);">
                    <div style="font-size: 48px; margin-bottom: 15px;">📭</div>
                    <div>Nenhum item encontrado</div>
                </div>
            `;
            return;
        }
        
        listings.forEach(listing => {
            const card = this.createListingCard(listing);
            this.listingsContainer.appendChild(card);
        });
        
        // Update pagination
        const totalPages = Math.ceil(total / this.pageSize);
        this.pageDisplay.textContent = `Página ${this.currentPage + 1} de ${totalPages || 1}`;
        this.prevBtn.disabled = this.currentPage === 0;
        this.nextBtn.disabled = this.currentPage >= totalPages - 1;
    }
    
    createListingCard(listing) {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid ${listing.isWatched ? '#d69e2e' : 'rgba(255,255,255,0.1)'};
            border-radius: 10px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        `;
        
        const rarityColor = this.getRarityColor(listing.item.rarity);
        const timeLeft = this.formatTimeLeft(listing.expiresAt);
        
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="font-size: 40px; filter: drop-shadow(0 0 5px ${rarityColor});">
                    ${listing.item.icon || '📦'}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: ${rarityColor}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${listing.item.name}
                    </div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
                        ${listing.item.quantity > 1 ? `x${listing.item.quantity} • ` : ''}Lv. ${listing.item.level || 1}
                    </div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size: 12px; color: rgba(255,255,255,0.5);">
                    Vendedor: ${listing.sellerName}
                </div>
                <div style="font-size: 12px; color: ${timeLeft.includes('min') ? '#ef4444' : 'rgba(255,255,255,0.5)'};">
                    ⏱️ ${timeLeft}
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px;">
                    <span style="color: rgba(255,255,255,0.6);">Lance atual:</span>
                    <span style="color: #ffd700; font-weight: 600;">${listing.currentBid}g</span>
                </div>
                ${listing.buyoutPrice ? `
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                        <span style="color: rgba(255,255,255,0.6);">Compra já:</span>
                        <span style="color: #22c55e; font-weight: 600;">${listing.buyoutPrice}g</span>
                    </div>
                ` : ''}
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="bid-btn" style="
                    flex: 1;
                    padding: 8px;
                    background: linear-gradient(45deg, #d69e2e, #b7791f);
                    border: none;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 12px;
                ">Dar Lance</button>
                ${listing.buyoutPrice ? `
                    <button class="buyout-btn" style="
                        flex: 1;
                        padding: 8px;
                        background: linear-gradient(45deg, #22c55e, #16a34a);
                        border: none;
                        border-radius: 6px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 12px;
                    ">Comprar</button>
                ` : ''}
            </div>
        `;
        
        // Events
        const bidBtn = card.querySelector('.bid-btn');
        bidBtn.onclick = (e) => {
            e.stopPropagation();
            this.openBidModal(listing);
        };
        
        const buyoutBtn = card.querySelector('.buyout-btn');
        if (buyoutBtn) {
            buyoutBtn.onclick = (e) => {
                e.stopPropagation();
                this.confirmBuyout(listing);
            };
        }
        
        card.onclick = () => this.showListingDetails(listing);
        
        card.onmouseover = () => {
            card.style.background = 'rgba(255, 255, 255, 0.05)';
            card.style.borderColor = '#d69e2e';
        };
        
        card.onmouseout = () => {
            card.style.background = 'rgba(0, 0, 0, 0.3)';
            card.style.borderColor = listing.isWatched ? '#d69e2e' : 'rgba(255,255,255,0.1)';
        };
        
        return card;
    }
    
    // ===== MODALS =====
    
    openBidModal(listing) {
        const modal = document.createElement('div');
        modal.className = 'auction-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #d69e2e;
            border-radius: 12px;
            padding: 25px;
            width: 400px;
            z-index: 20000;
            box-shadow: 0 20px 60px rgba(0,0,0,0.9);
        `;
        
        const minBid = Math.ceil(listing.currentBid * 1.05);
        
        modal.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #d69e2e;">🏷️ Dar Lance</h3>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 10px;">
                    ${listing.item.name}
                </div>
                <div style="font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">
                    Lance atual: <span style="color: #ffd700; font-weight: 600;">${listing.currentBid}g</span>
                </div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.5);">
                    Lance mínimo: ${minBid}g
                </div>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-size: 13px; color: rgba(255,255,255,0.7);">
                    Seu lance (ouro):
                </label>
                <input type="number" id="bid-amount" min="${minBid}" value="${minBid}" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: white;
                    font-size: 16px;
                    box-sizing: border-box;
                ">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="place-bid-btn" style="
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(45deg, #d69e2e, #b7791f);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                ">Confirmar Lance</button>
                <button id="cancel-bid-btn" style="
                    flex: 1;
                    padding: 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                ">Cancelar</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 19999;
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('place-bid-btn').onclick = () => {
            const amount = parseInt(document.getElementById('bid-amount').value);
            if (amount >= minBid) {
                this.socket?.emit('auction:bid', { listingId: listing.id, bidAmount: amount });
                modal.remove();
                overlay.remove();
            }
        };
        
        document.getElementById('cancel-bid-btn').onclick = () => {
            modal.remove();
            overlay.remove();
        };
    }
    
    confirmBuyout(listing) {
        const confirmed = confirm(`Comprar "${listing.item.name}" por ${listing.buyoutPrice}g?`);
        if (confirmed) {
            this.socket?.emit('auction:buyout', { listingId: listing.id });
        }
    }
    
    showListingDetails(listing) {
        // Show detailed modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #d69e2e;
            border-radius: 12px;
            padding: 25px;
            width: 450px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 20000;
        `;
        
        const rarityColor = this.getRarityColor(listing.item.rarity);
        
        modal.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 64px; filter: drop-shadow(0 0 10px ${rarityColor}); margin-bottom: 10px;">
                    ${listing.item.icon || '📦'}
                </div>
                <h3 style="margin: 0; color: ${rarityColor}; font-size: 20px;">
                    ${listing.item.name}
                </h3>
                <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 5px;">
                    ${listing.item.rarity || 'common'} • Nível ${listing.item.level || 1}
                </div>
            </div>
            
            ${listing.item.description ? `
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.5;">
                        ${listing.item.description}
                    </div>
                </div>
            ` : ''}
            
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: rgba(255,255,255,0.6);">Vendedor:</span>
                    <span>${listing.sellerName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: rgba(255,255,255,0.6);">Lance inicial:</span>
                    <span>${listing.startingBid}g</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: rgba(255,255,255,0.6);">Lance atual:</span>
                    <span style="color: #ffd700; font-weight: 600;">${listing.currentBid}g</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: rgba(255,255,255,0.6);">Total de lances:</span>
                    <span>${listing.bids?.length || 0}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: rgba(255,255,255,0.6);">Termina em:</span>
                    <span>${this.formatTimeLeft(listing.expiresAt)}</span>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="window._auctionUI.socket?.emit('auction:watch', { listingId: '${listing.id}' })" style="
                    flex: 1;
                    padding: 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                ">👁️ Observar</button>
                <button onclick="this.closest('.auction-modal-details').remove()" style="
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(45deg, #d69e2e, #b7791f);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                ">Fechar</button>
            </div>
        `;
        
        modal.className = 'auction-modal-details';
        document.body.appendChild(modal);
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        this.socket.on('auction:opened', (data) => {
            this.categories = data.categories;
            this.updateCategorySelect();
        });
        
        this.socket.on('auction:search_results', (data) => {
            this.listings = data.listings;
            this.renderListings(data.listings, data.total);
        });
        
        this.socket.on('auction:posted', (data) => {
            this.game?.showFloatingText?.('Item postado no leilão!', 0, -40, '#22c55e');
            this.switchTab('mylistings');
        });
        
        this.socket.on('auction:bid_success', (data) => {
            this.game?.showFloatingText?.(`Lance de ${data.bid}g confirmado!`, 0, -40, '#22c55e');
            this.performSearch();
        });
        
        this.socket.on('auction:outbid', (data) => {
            this.game?.showFloatingText?.(`Ultrapassado em ${data.itemName}!`, 0, -40, '#ef4444');
            this.performSearch();
        });
        
        this.socket.on('auction:won', (data) => {
            this.game?.showFloatingText?.(`Você ganhou ${data.item.name}!`, 0, -40, '#d69e2e');
            this.performSearch();
        });
        
        this.socket.on('auction:sold', (data) => {
            this.game?.showFloatingText?.(`${data.itemName} vendido por ${data.price}g!`, 0, -40, '#22c55e');
        });
        
        this.socket.on('auction:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
        
        this.socket.on('auction:my_listings', (data) => {
            this.showMyListings(data);
        });
        
        this.socket.on('auction:my_bids', (data) => {
            this.showMyBids(data);
        });
        
        this.socket.on('auction:history', (data) => {
            this.showHistory(data);
        });
        
        this.socket.on('auction:new_listing', (data) => {
            if (this.currentTab === 'browse') {
                this.performSearch();
            }
        });
    }
    
    // ===== UTILITIES =====
    
    updateCategorySelect() {
        if (!this.categorySelect) return;
        
        let options = '<option value="">Todas</option>';
        for (const [key, cat] of Object.entries(this.categories)) {
            options += `<option value="${key}">${cat.icon} ${cat.name}</option>`;
        }
        this.categorySelect.innerHTML = options;
    }
    
    debounceSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.performSearch(), 300);
    }
    
    performSearch() {
        this.socket?.emit('auction:search', {
            ...this.searchFilters,
            page: this.currentPage,
            pageSize: this.pageSize
        });
    }
    
    changePage(delta) {
        this.currentPage += delta;
        if (this.currentPage < 0) this.currentPage = 0;
        this.performSearch();
    }
    
    getRarityColor(rarity) {
        const colors = {
            common: '#9CA3AF',
            uncommon: '#22c55e',
            rare: '#3b82f6',
            epic: '#a855f7',
            legendary: '#f59e0b'
        };
        return colors[rarity] || '#9CA3AF';
    }
    
    formatTimeLeft(expiresAt) {
        const diff = expiresAt - Date.now();
        if (diff <= 0) return 'Expirado';
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        if (hours > 24) {
            return `${Math.floor(hours / 24)}d ${hours % 24}h`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes}min`;
    }
    
    showLoading() {
        this.contentArea.innerHTML = `
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; color: rgba(255,255,255,0.5);">
                <div style="font-size: 48px; margin-bottom: 15px; animation: spin 1s linear infinite;">⏳</div>
                <div>Carregando...</div>
            </div>
        `;
    }
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.toggle();
                }
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    // ===== SHOW/HIDE =====
    
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.socket?.emit('auction:open');
        this.switchTab('browse');
        
        if (this.game?.pause) {
            this.game.pause();
        }
    }
    
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
        
        if (this.game?.resume) {
            this.game.resume();
        }
    }
    
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Export for global access
window.AuctionUI = AuctionUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuctionUI;
}
