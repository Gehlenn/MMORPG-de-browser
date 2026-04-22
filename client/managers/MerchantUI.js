/**
 * MerchantUI - Interface de Lojas de NPC Mercadores
 * 
 * Features:
 * - Visualização de itens à venda
 * - Compra e venda
 * - Filtros por categoria
 * - Preview de preços
 * - Inventário do jogador na loja
 */

class MerchantUI {
    constructor(merchantManager, inventoryManager) {
        this.merchantManager = merchantManager;
        this.inventoryManager = inventoryManager;
        this.visible = false;
        this.mode = 'buy'; // 'buy' ou 'sell'
        this.selectedCategory = 'all';
        this.searchQuery = '';
        this.elements = {};
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.createStyles();
        this.createMerchantPanel();
        this.bindKeys();
        
        // Bind events do manager
        if (this.merchantManager) {
            this.merchantManager.onMerchantOpen = (merchant) => this.show(merchant);
            this.merchantManager.onMerchantClose = () => this.hide();
            this.merchantManager.onTransaction = (type, item, quantity, price) => {
                this.showTransactionNotification(type, item, quantity, price);
                this.render();
            };
        }
        
        this.initialized = true;
        console.log('🏪 MerchantUI inicializado');
    }
    
    createStyles() {
        const styles = `
            .merchant-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: none; opacity: 0; transition: opacity 0.2s; }
            .merchant-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .merchant-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #4ecca3; border-radius: 12px; width: 900px; max-height: 85vh; overflow-y: auto; padding: 20px; box-shadow: 0 0 40px rgba(78,204,163,0.3); }
            .merchant-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(78,204,163,0.3); }
            .merchant-title { display: flex; align-items: center; gap: 12px; }
            .merchant-icon { font-size: 32px; width: 50px; height: 50px; background: rgba(78,204,163,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .merchant-info { flex: 1; }
            .merchant-name { font-size: 20px; font-weight: bold; color: #4ecca3; }
            .merchant-type { font-size: 11px; color: #888; text-transform: uppercase; }
            .merchant-gold { display: flex; align-items: center; gap: 8px; background: rgba(255,193,7,0.1); padding: 8px 16px; border-radius: 20px; border: 1px solid rgba(255,193,7,0.3); }
            .merchant-gold-icon { font-size: 18px; }
            .merchant-gold-amount { font-size: 16px; font-weight: bold; color: #ffc107; }
            .merchant-close { background: transparent; border: 1px solid #e94560; color: #e94560; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 18px; transition: all 0.2s; margin-left: 12px; }
            .merchant-close:hover { background: #e94560; color: white; }
            .merchant-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
            .merchant-tab { padding: 10px 20px; border: none; background: rgba(255,255,255,0.05); color: #888; cursor: pointer; border-radius: 6px; font-size: 13px; font-weight: bold; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
            .merchant-tab:hover { background: rgba(255,255,255,0.1); color: white; }
            .merchant-tab.active { background: rgba(78,204,163,0.2); color: #4ecca3; border: 1px solid rgba(78,204,163,0.5); }
            .merchant-filters { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
            .merchant-filter { padding: 6px 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: #888; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
            .merchant-filter:hover { border-color: rgba(78,204,163,0.5); color: #4ecca3; }
            .merchant-filter.active { background: rgba(78,204,163,0.2); border-color: #4ecca3; color: #4ecca3; }
            .merchant-search { flex: 1; min-width: 200px; position: relative; }
            .merchant-search-input { width: 100%; padding: 8px 12px 8px 36px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: white; font-size: 13px; }
            .merchant-search-input:focus { outline: none; border-color: #4ecca3; }
            .merchant-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #888; }
            .merchant-content { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
            .merchant-shop { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 16px; }
            .merchant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 400px; overflow-y: auto; }
            .merchant-item { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px; cursor: pointer; transition: all 0.2s; position: relative; }
            .merchant-item:hover { background: rgba(255,255,255,0.1); border-color: rgba(78,204,163,0.3); }
            .merchant-item.cant-afford { opacity: 0.5; }
            .merchant-item.out-of-stock { opacity: 0.3; }
            .merchant-item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
            .merchant-item-icon { font-size: 28px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); border-radius: 4px; }
            .merchant-item-info { flex: 1; }
            .merchant-item-name { font-size: 12px; font-weight: bold; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .merchant-item-rarity { font-size: 10px; }
            .merchant-item-rarity.common { color: #888; }
            .merchant-item-rarity.uncommon { color: #4ecca3; }
            .merchant-item-rarity.rare { color: #3498db; }
            .merchant-item-rarity.epic { color: #9b59b6; }
            .merchant-item-rarity.legendary { color: #ffc107; }
            .merchant-item-footer { display: flex; justify-content: space-between; align-items: center; }
            .merchant-item-stock { font-size: 10px; color: #888; }
            .merchant-item-price { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: bold; color: #ffc107; }
            .merchant-item-actions { display: flex; gap: 6px; margin-top: 8px; }
            .merchant-btn { padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; transition: all 0.2s; }
            .merchant-btn.buy { background: linear-gradient(135deg, #4ecca3, #3dbb9a); color: white; }
            .merchant-btn.buy:hover:not(:disabled) { background: linear-gradient(135deg, #5fd6b3, #4ecca3); }
            .merchant-btn.buy:disabled { opacity: 0.5; cursor: not-allowed; }
            .merchant-btn.sell { background: linear-gradient(135deg, #e94560, #d6304d); color: white; }
            .merchant-btn.sell:hover { background: linear-gradient(135deg, #f05570, #e94560); }
            .merchant-inventory { background: rgba(0,0,0,0.2); border-radius: 8px; padding: 16px; }
            .merchant-inventory-title { font-size: 14px; font-weight: bold; color: #4ecca3; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
            .merchant-inventory-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; max-height: 300px; overflow-y: auto; }
            .merchant-inv-slot { aspect-ratio: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; position: relative; font-size: 20px; }
            .merchant-inv-slot:hover { background: rgba(255,255,255,0.1); border-color: rgba(78,204,163,0.5); }
            .merchant-inv-slot.has-item { background: rgba(78,204,163,0.1); }
            .merchant-inv-slot.selected { border-color: #4ecca3; box-shadow: 0 0 10px rgba(78,204,163,0.3); }
            .merchant-inv-qty { position: absolute; bottom: 2px; right: 4px; font-size: 10px; color: #4ecca3; font-weight: bold; }
            .merchant-inv-price { position: absolute; top: 2px; left: 2px; font-size: 9px; color: #ffc107; }
            .merchant-sell-actions { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
            .merchant-sell-btn { padding: 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; transition: all 0.2s; }
            .merchant-sell-btn.all { background: linear-gradient(135deg, #e94560, #d6304d); color: white; }
            .merchant-sell-btn.all:hover { background: linear-gradient(135deg, #f05570, #e94560); }
            .merchant-empty { color: #666; text-align: center; padding: 40px; font-size: 13px; }
            .merchant-notification { position: fixed; bottom: 100px; right: 20px; background: rgba(26,26,46,0.95); border: 1px solid #4ecca3; border-radius: 8px; padding: 16px; z-index: 2000; transform: translateX(120%); transition: transform 0.3s; }
            .merchant-notification.show { transform: translateX(0); }
            .merchant-notification.success { border-color: #4ecca3; }
            .merchant-notification.error { border-color: #e94560; }
            .merchant-notification-title { font-weight: bold; margin-bottom: 4px; }
            .merchant-notification-title.success { color: #4ecca3; }
            .merchant-notification-title.error { color: #e94560; }
            .merchant-notification-text { font-size: 12px; color: #ccc; }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createMerchantPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'merchant-overlay';
        
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'merchant-panel';
        
        this.elements.panel.innerHTML = `
            <div class="merchant-header">
                <div class="merchant-title">
                    <div class="merchant-icon" id="merchant-icon">🏪</div>
                    <div class="merchant-info">
                        <div class="merchant-name" id="merchant-name">Loja</div>
                        <div class="merchant-type" id="merchant-type">Mercador</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <div class="merchant-gold">
                        <span class="merchant-gold-icon">💰</span>
                        <span class="merchant-gold-amount" id="player-gold">0</span>
                    </div>
                    <button class="merchant-close" id="merchant-close">×</button>
                </div>
            </div>
            
            <div class="merchant-tabs">
                <button class="merchant-tab active" data-mode="buy">
                    🛒 Comprar
                </button>
                <button class="merchant-tab" data-mode="sell">
                    💰 Vender
                </button>
            </div>
            
            <div class="merchant-filters" id="merchant-filters">
                <button class="merchant-filter active" data-cat="all">Todos</button>
                <button class="merchant-filter" data-cat="weapon">Armas</button>
                <button class="merchant-filter" data-cat="armor">Armaduras</button>
                <button class="merchant-filter" data-cat="potion">Poções</button>
                <button class="merchant-filter" data-cat="food">Comida</button>
                <button class="merchant-filter" data-cat="material">Materiais</button>
                <div class="merchant-search">
                    <span class="merchant-search-icon">🔍</span>
                    <input type="text" class="merchant-search-input" id="merchant-search" placeholder="Buscar item...">
                </div>
            </div>
            
            <div class="merchant-content">
                <div class="merchant-shop" id="merchant-shop">
                    <div class="merchant-empty">Selecione uma aba para ver itens</div>
                </div>
                <div class="merchant-inventory" id="merchant-inventory-panel">
                    <div class="merchant-inventory-title">
                        <span>Seu Inventário</span>
                        <span style="font-size: 11px; color: #888;" id="inv-slots">0/40</span>
                    </div>
                    <div class="merchant-inventory-grid" id="merchant-inv-grid"></div>
                    <div class="merchant-sell-actions" id="sell-actions" style="display: none;">
                        <button class="merchant-sell-btn all" id="sell-all">💰 Vender Tudo</button>
                        <button class="merchant-sell-btn all" id="sell-category">📦 Vender por Categoria</button>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
        
        // Bind events
        this.bindEvents();
        
        // Notificação
        this.elements.notification = document.createElement('div');
        this.elements.notification.className = 'merchant-notification';
        this.elements.notification.innerHTML = `
            <div class="merchant-notification-title" id="notif-title"></div>
            <div class="merchant-notification-text" id="notif-text"></div>
        `;
        document.body.appendChild(this.elements.notification);
    }
    
    bindEvents() {
        // Fechar
        document.getElementById('merchant-close').onclick = () => this.hide();
        
        // Tabs
        document.querySelectorAll('.merchant-tab').forEach(tab => {
            tab.onclick = () => {
                this.mode = tab.dataset.mode;
                this.updateTabs();
                this.render();
            };
        });
        
        // Filtros
        document.querySelectorAll('.merchant-filter').forEach(filter => {
            filter.onclick = () => {
                document.querySelectorAll('.merchant-filter').forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                this.selectedCategory = filter.dataset.cat;
                this.render();
            };
        });
        
        // Busca
        document.getElementById('merchant-search').oninput = (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        };
        
        // Botões de venda em massa
        const sellAllBtn = document.getElementById('sell-all');
        const sellCatBtn = document.getElementById('sell-category');
        
        if (sellAllBtn) {
            sellAllBtn.onclick = () => this.sellAll();
        }
        
        if (sellCatBtn) {
            sellCatBtn.onclick = () => this.sellByCategory();
        }
    }
    
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
    
    updateTabs() {
        document.querySelectorAll('.merchant-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === this.mode);
        });
    }
    
    show(merchant) {
        this.visible = true;
        this.elements.overlay.classList.add('active');
        
        // Atualizar header
        document.getElementById('merchant-icon').textContent = merchant.icon || '🏪';
        document.getElementById('merchant-name').textContent = merchant.name || 'Mercador';
        document.getElementById('merchant-type').textContent = this.getMerchantTypeName(merchant.type);
        
        this.render();
        
        if (window.audioManager) window.audioManager.playSFX('shop_open');
    }
    
    hide() {
        this.visible = false;
        this.elements.overlay.classList.remove('active');
        if (this.merchantManager) {
            this.merchantManager.closeMerchant();
        }
    }
    
    getMerchantTypeName(type) {
        const names = {
            'general': 'Mercador Geral',
            'weaponsmith': 'Armeiro',
            'armorer': 'Armaduras',
            'alchemist': 'Alquimista',
            'innkeeper': 'Estalajadeiro',
            'blacksmith': 'Ferreiro',
            'magic': 'Arcano'
        };
        return names[type] || 'Mercador';
    }
    
    render() {
        this.updateGold();
        
        if (this.mode === 'buy') {
            this.renderBuyMode();
        } else {
            this.renderSellMode();
        }
    }
    
    updateGold() {
        const gold = this.merchantManager?.getPlayerGold() || 0;
        document.getElementById('player-gold').textContent = gold.toLocaleString();
    }
    
    renderBuyMode() {
        const shopContainer = document.getElementById('merchant-shop');
        const invPanel = document.getElementById('merchant-inventory-panel');
        const sellActions = document.getElementById('sell-actions');
        
        // Esconder ações de venda
        if (sellActions) sellActions.style.display = 'none';
        
        // Mostrar inventário do jogador resumido
        invPanel.style.display = 'block';
        this.renderPlayerInventorySummary();
        
        // Renderizar itens da loja
        const inventory = this.merchantManager?.getCurrentMerchantInventory({
            category: this.selectedCategory === 'all' ? null : this.selectedCategory,
            search: this.searchQuery
        }) || [];
        
        if (inventory.length === 0) {
            shopContainer.innerHTML = `
                <div class="merchant-empty">
                    <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
                    Nenhum item disponível nesta categoria
                </div>
            `;
            return;
        }
        
        shopContainer.innerHTML = `<div class="merchant-grid">${inventory.map(item => `
            <div class="merchant-item ${!item.canAfford ? 'cant-afford' : ''} ${!item.inStock ? 'out-of-stock' : ''}" data-item="${item.index}">
                <div class="merchant-item-header">
                    <div class="merchant-item-icon">${item.icon || '📦'}</div>
                    <div class="merchant-item-info">
                        <div class="merchant-item-name">${item.name}</div>
                        <div class="merchant-item-rarity ${item.rarity || 'common'}">${item.rarity || 'common'}</div>
                    </div>
                </div>
                <div class="merchant-item-footer">
                    <span class="merchant-item-stock">${item.stock === -1 ? '∞' : item.stock + ' em estoque'}</span>
                    <span class="merchant-item-price">💰 ${item.buyPrice}</span>
                </div>
                <div class="merchant-item-actions">
                    <button class="merchant-btn buy" onclick="event.stopPropagation(); window.merchantUI.buyItem(${item.index}, 1)" ${!item.canAfford || !item.inStock ? 'disabled' : ''}>
                        Comprar
                    </button>
                </div>
            </div>
        `).join('')}</div>`;
    }
    
    renderSellMode() {
        const shopContainer = document.getElementById('merchant-shop');
        const sellActions = document.getElementById('sell-actions');
        
        // Mostrar ações de venda
        if (sellActions) sellActions.style.display = 'flex';
        
        // Renderizar inventário do jogador na área principal
        const slots = this.inventoryManager?.slots || [];
        const sellableItems = [];
        
        slots.forEach((slot, index) => {
            if (!slot || !slot.item) return;
            if (!this.merchantManager?.canSell(slot.item)) return;
            
            // Filtrar por categoria
            if (this.selectedCategory !== 'all' && slot.item.category !== this.selectedCategory) return;
            
            // Filtrar por busca
            if (this.searchQuery && !slot.item.name?.toLowerCase().includes(this.searchQuery)) return;
            
            const price = this.merchantManager?.getSellPrice(slot.item) || 0;
            sellableItems.push({ ...slot, index, price });
        });
        
        if (sellableItems.length === 0) {
            shopContainer.innerHTML = `
                <div class="merchant-empty">
                    <div style="font-size: 48px; margin-bottom: 16px;">💼</div>
                    Nenhum item para vender nesta categoria
                </div>
            `;
            return;
        }
        
        shopContainer.innerHTML = `<div class="merchant-grid">${sellableItems.map(slot => `
            <div class="merchant-item" data-slot="${slot.index}">
                <div class="merchant-item-header">
                    <div class="merchant-item-icon">${slot.item.icon || '📦'}</div>
                    <div class="merchant-item-info">
                        <div class="merchant-item-name">${slot.item.name}</div>
                        <div class="merchant-item-rarity ${slot.item.rarity || 'common'}">${slot.item.rarity || 'common'}</div>
                    </div>
                </div>
                <div class="merchant-item-footer">
                    <span class="merchant-item-stock">${slot.quantity}x</span>
                    <span class="merchant-item-price">💰 ${slot.price}/un</span>
                </div>
                <div class="merchant-item-actions">
                    <button class="merchant-btn sell" onclick="event.stopPropagation(); window.merchantUI.sellItem(${slot.index}, ${slot.quantity})">
                        Vender ${slot.quantity > 1 ? 'Tudo' : ''}
                    </button>
                </div>
            </div>
        `).join('')}</div>`;
    }
    
    renderPlayerInventorySummary() {
        const grid = document.getElementById('merchant-inv-grid');
        const slotsText = document.getElementById('inv-slots');
        
        if (!this.inventoryManager) return;
        
        const slots = this.inventoryManager.slots;
        const usedSlots = slots.filter(s => s && s.item).length;
        const maxSlots = 40;
        
        slotsText.textContent = `${usedSlots}/${maxSlots}`;
        
        grid.innerHTML = slots.map((slot, index) => {
            const hasItem = slot && slot.item;
            return `
                <div class="merchant-inv-slot ${hasItem ? 'has-item' : ''}" title="${hasItem ? slot.item.name : ''}">
                    ${hasItem ? slot.item.icon || '📦' : ''}
                    ${hasItem && slot.quantity > 1 ? `<span class="merchant-inv-qty">${slot.quantity}</span>` : ''}
                </div>
            `;
        }).join('');
    }
    
    buyItem(itemIndex, quantity) {
        const result = this.merchantManager?.buyItem(itemIndex, quantity);
        
        if (result?.success) {
            this.render();
        } else {
            this.showError(this.getErrorMessage(result?.reason));
        }
    }
    
    sellItem(slotIndex, quantity) {
        const result = this.merchantManager?.sellItem(slotIndex, quantity);
        
        if (result?.success) {
            this.render();
        } else {
            this.showError(this.getErrorMessage(result?.reason));
        }
    }
    
    sellAll() {
        const result = this.merchantManager?.sellAll();
        
        if (result?.success) {
            this.showTransactionNotification('sell_bulk', null, result.itemsSold, result.totalGold);
            this.render();
        } else {
            this.showError(this.getErrorMessage(result?.reason));
        }
    }
    
    sellByCategory() {
        // Toggle entre categorias ou mostrar modal
        const categories = ['weapon', 'armor', 'potion', 'food', 'material'];
        
        // Por simplicidade, vender armas por agora
        const result = this.merchantManager?.sellAll('weapon');
        
        if (result?.success && result.itemsSold > 0) {
            this.showTransactionNotification('sell_bulk', null, result.itemsSold, result.totalGold);
            this.render();
        } else {
            this.showError('Nenhuma arma para vender');
        }
    }
    
    showTransactionNotification(type, item, quantity, price) {
        const notif = this.elements.notification;
        const title = document.getElementById('notif-title');
        const text = document.getElementById('notif-text');
        
        notif.className = 'merchant-notification success show';
        
        if (type === 'buy') {
            title.textContent = '✓ Compra realizada!';
            text.textContent = `Você comprou ${quantity}x ${item.name} por 💰${price}`;
        } else if (type === 'sell') {
            title.textContent = '✓ Venda realizada!';
            text.textContent = `Você vendeu ${quantity}x ${item.name} por 💰${price}`;
        } else if (type === 'sell_bulk') {
            title.textContent = '✓ Venda em massa!';
            text.textContent = `Vendidos ${quantity} itens por 💰${price}`;
        }
        
        setTimeout(() => {
            notif.classList.remove('show');
        }, 3000);
    }
    
    showError(message) {
        const notif = this.elements.notification;
        const title = document.getElementById('notif-title');
        const text = document.getElementById('notif-text');
        
        notif.className = 'merchant-notification error show';
        title.textContent = '✗ Erro';
        title.className = 'merchant-notification-title error';
        text.textContent = message;
        
        setTimeout(() => {
            notif.classList.remove('show');
            title.className = 'merchant-notification-title';
        }, 3000);
    }
    
    getErrorMessage(reason) {
        const messages = {
            'no_merchant_open': 'Nenhuma loja aberta',
            'item_not_found': 'Item não encontrado',
            'insufficient_gold': 'Gold insuficiente',
            'inventory_full': 'Inventário cheio',
            'cannot_sell': 'Item não pode ser vendido',
            'no_items_to_sell': 'Nenhum item para vender'
        };
        return messages[reason] || 'Erro na transação';
    }
}

window.MerchantUI = MerchantUI;
