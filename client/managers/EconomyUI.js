/**
 * EconomyUI - Interface de Economia/Mercado
 * 
 * Features:
 * - Visualização de preços atuais
 * - Gráfico de tendências
 * - Lista de eventos ativos
 * - Itens em alta/baixa
 * - Atalho de teclado (M)
 */

class EconomyUI {
    constructor(economyManager) {
        this.economyManager = economyManager;
        this.visible = false;
        this.elements = {};
        this.selectedCategory = 'all';
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.createStyles();
        this.createMarketPanel();
        this.bindKeys();
        
        // Bind events
        if (this.economyManager) {
            // Atualizar quando preços mudarem
            if (window.EventBus) {
                window.EventBus.on('priceUpdate', () => {
                    if (this.visible) this.render();
                });
            }
        }
        
        this.initialized = true;
        console.log('💹 EconomyUI inicializada');
    }
    
    createStyles() {
        const styles = `
            .economy-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1500; display: none; opacity: 0; transition: opacity 0.2s; }
            .economy-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .economy-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #f1c40f; border-radius: 12px; width: 800px; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 0 50px rgba(241,196,15,0.2); }
            .economy-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(241,196,15,0.3); }
            .economy-title { display: flex; align-items: center; gap: 12px; }
            .economy-title-icon { font-size: 32px; width: 50px; height: 50px; background: rgba(241,196,15,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .economy-title-text { font-size: 20px; font-weight: bold; color: #f1c40f; }
            .economy-close { background: transparent; border: 1px solid #e94560; color: #e94560; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 18px; transition: all 0.2s; }
            .economy-close:hover { background: #e94560; color: white; }
            .economy-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .economy-stat { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; text-align: center; }
            .economy-stat-value { font-size: 24px; font-weight: bold; color: white; }
            .economy-stat-label { font-size: 11px; color: #888; text-transform: uppercase; margin-top: 4px; }
            .economy-stat.bullish .economy-stat-value { color: #2ecc71; }
            .economy-stat.bearish .economy-stat-value { color: #e74c3c; }
            .economy-stat.neutral .economy-stat-value { color: #f1c40f; }
            .economy-section { margin-bottom: 24px; }
            .economy-section-title { font-size: 14px; font-weight: bold; color: #f1c40f; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; }
            .economy-events { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
            .economy-event { background: linear-gradient(135deg, rgba(231,76,60,0.1), rgba(231,76,60,0.05)); border: 1px solid rgba(231,76,60,0.3); border-radius: 8px; padding: 12px; min-width: 200px; }
            .economy-event.positive { background: linear-gradient(135deg, rgba(46,204,113,0.1), rgba(46,204,113,0.05)); border-color: rgba(46,204,113,0.3); }
            .economy-event-name { font-size: 13px; font-weight: bold; color: white; margin-bottom: 4px; }
            .economy-event-desc { font-size: 11px; color: #888; margin-bottom: 8px; }
            .economy-event-effect { font-size: 12px; color: #e74c3c; font-weight: bold; }
            .economy-event.positive .economy-event-effect { color: #2ecc71; }
            .economy-filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
            .economy-filter { padding: 8px 16px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #888; border-radius: 20px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
            .economy-filter:hover { border-color: rgba(255,255,255,0.4); color: white; }
            .economy-filter.active { border-color: #f1c40f; background: rgba(241,196,15,0.1); color: #f1c40f; }
            .economy-table { width: 100%; border-collapse: collapse; }
            .economy-table th { text-align: left; padding: 12px; font-size: 11px; color: #888; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .economy-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .economy-item { display: flex; align-items: center; gap: 12px; }
            .economy-item-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.05); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
            .economy-item-info { flex: 1; }
            .economy-item-name { font-size: 13px; font-weight: bold; color: white; }
            .economy-item-category { font-size: 10px; color: #888; text-transform: uppercase; }
            .economy-price { font-size: 14px; font-weight: bold; color: white; }
            .economy-price-change { font-size: 11px; margin-top: 2px; }
            .economy-price-change.up { color: #2ecc71; }
            .economy-price-change.down { color: #e74c3c; }
            .economy-trend { display: flex; align-items: center; gap: 4px; font-size: 16px; }
            .economy-mini-chart { display: flex; align-items: flex-end; gap: 2px; height: 30px; width: 60px; }
            .economy-bar { width: 8px; border-radius: 2px; }
            .economy-trending { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .economy-trend-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; }
            .economy-trend-up { border-left: 3px solid #2ecc71; }
            .economy-trend-down { border-left: 3px solid #e74c3c; }
            .economy-refresh { padding: 10px 20px; background: rgba(52,152,219,0.2); border: 1px solid #3498db; color: #3498db; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; transition: all 0.2s; }
            .economy-refresh:hover { background: #3498db; color: white; }
            .economy-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createMarketPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'economy-overlay';
        
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'economy-panel';
        
        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
    }
    
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' || e.key === 'M') {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                this.toggle();
            }
            if (e.key === 'Escape') {
                if (this.visible) this.hide();
            }
        });
    }
    
    render() {
        const stats = this.economyManager?.getMarketStats();
        const events = this.economyManager?.getActiveEvents() || [];
        const trending = this.economyManager?.getTrendingItems(4) || [];
        const prices = this.economyManager?.getAllPrices() || [];
        
        // Filtrar por categoria
        const filteredPrices = this.selectedCategory === 'all' 
            ? prices 
            : prices.filter(p => p.category === this.selectedCategory);
        
        this.elements.panel.innerHTML = `
            <div class="economy-header">
                <div class="economy-title">
                    <div class="economy-title-icon">📊</div>
                    <div class="economy-title-text">Mercado de Eldoria</div>
                </div>
                <button class="economy-close" id="economy-close">×</button>
            </div>
            
            <div class="economy-stats">
                <div class="economy-stat ${stats?.marketMood || 'neutral'}">
                    <div class="economy-stat-value">${stats?.averageChange > 0 ? '+' : ''}${stats?.averageChange || 0}%</div>
                    <div class="economy-stat-label">Variação Média</div>
                </div>
                <div class="economy-stat">
                    <div class="economy-stat-value" style="color: #2ecc71;">${stats?.rising || 0}</div>
                    <div class="economy-stat-label">Em Alta 📈</div>
                </div>
                <div class="economy-stat">
                    <div class="economy-stat-value" style="color: #e74c3c;">${stats?.falling || 0}</div>
                    <div class="economy-stat-label">Em Baixa 📉</div>
                </div>
                <div class="economy-stat">
                    <div class="economy-stat-value">${stats?.activeEvents || 0}</div>
                    <div class="economy-stat-label">Eventos Ativos</div>
                </div>
            </div>
            
            ${events.length > 0 ? `
            <div class="economy-section">
                <div class="economy-section-title">📢 Eventos de Mercado</div>
                <div class="economy-events">
                    ${events.map(e => `
                        <div class="economy-event ${e.priceMultiplier < 1 ? 'positive' : ''}">
                            <div class="economy-event-name">${e.name}</div>
                            <div class="economy-event-desc">${e.description}</div>
                            <div class="economy-event-effect">${e.priceMultiplier > 1 ? '📈 +' : '📉 '}${Math.abs((e.priceMultiplier - 1) * 100).toFixed(0)}% preços</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="economy-section">
                <div class="economy-section-title">🔥 Tendências</div>
                <div class="economy-trending">
                    ${trending.map(t => `
                        <div class="economy-trend-item ${t.trend === 'up' ? 'economy-trend-up' : 'economy-trend-down'}">
                            <div class="economy-trend">${t.trend === 'up' ? '📈' : '📉'}</div>
                            <div style="flex: 1;">
                                <div style="font-size: 13px; font-weight: bold; color: white;">${this.getItemName(t.itemId)}</div>
                                <div style="font-size: 11px; color: #888;">${t.trend === 'up' ? '+' : ''}${t.change.toFixed(1)}%</div>
                            </div>
                            <div style="font-size: 14px; font-weight: bold; color: white;">${t.current}💰</div>
                        </div>
                    `).join('')}
                    ${trending.length === 0 ? '<p style="color: #666; font-size: 12px;">Sem dados de tendência</p>' : ''}
                </div>
            </div>
            
            <div class="economy-section">
                <div class="economy-section-title">💰 Preços do Mercado</div>
                <div class="economy-filters">
                    <button class="economy-filter ${this.selectedCategory === 'all' ? 'active' : ''}" data-filter="all">Todos</button>
                    <button class="economy-filter ${this.selectedCategory === 'common_materials' ? 'active' : ''}" data-filter="common_materials">Comuns</button>
                    <button class="economy-filter ${this.selectedCategory === 'rare_materials' ? 'active' : ''}" data-filter="rare_materials">Raros</button>
                    <button class="economy-filter ${this.selectedCategory === 'consumables' ? 'active' : ''}" data-filter="consumables">Consumíveis</button>
                    <button class="economy-filter ${this.selectedCategory === 'equipment' ? 'active' : ''}" data-filter="equipment">Equipamento</button>
                </div>
                <table class="economy-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Preço Compra</th>
                            <th>Preço Venda</th>
                            <th>Variação</th>
                            <th>Tendência</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredPrices.map(p => this.renderPriceRow(p)).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="economy-actions">
                <span style="font-size: 12px; color: #666;">Atualizado a cada 5 minutos</span>
                <button class="economy-refresh" id="economy-refresh">🔄 Atualizar Agora</button>
            </div>
        `;
        
        this.bindEvents();
    }
    
    renderPriceRow(price) {
        const trendIcon = price.trend === 'up' ? '📈' : price.trend === 'down' ? '📉' : '➡️';
        const trendClass = price.trend === 'up' ? 'up' : price.trend === 'down' ? 'down' : '';
        const changeSign = parseFloat(price.changePercent) > 0 ? '+' : '';
        
        return `
            <tr>
                <td>
                    <div class="economy-item">
                        <div class="economy-item-icon">${this.getItemIcon(price.itemId)}</div>
                        <div class="economy-item-info">
                            <div class="economy-item-name">${this.getItemName(price.itemId)}</div>
                            <div class="economy-item-category">${this.getCategoryName(price.category)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="economy-price">${price.buyPrice} 💰</div>
                    <div class="economy-price-change ${trendClass}">${changeSign}${price.changePercent}%</div>
                </td>
                <td>
                    <div class="economy-price" style="color: #888;">${price.sellPrice} 💰</div>
                </td>
                <td>
                    <div style="font-size: 11px; color: #666;">
                        Base: ${price.basePrice}
                    </div>
                </td>
                <td>
                    <div class="economy-trend">${trendIcon}</div>
                </td>
            </tr>
        `;
    }
    
    renderMiniChart(itemId) {
        const history = this.economyManager?.priceHistory?.get(itemId);
        if (!history || history.length < 3) {
            return '<div style="color: #666; font-size: 10px;">Sem dados</div>';
        }
        
        const prices = history.slice(-5);
        const max = Math.max(...prices.map(p => p.price));
        const min = Math.min(...prices.map(p => p.price));
        const range = max - min || 1;
        
        return `
            <div class="economy-mini-chart">
                ${prices.map(p => {
                    const height = ((p.price - min) / range) * 100;
                    return `<div class="economy-bar" style="height: ${Math.max(10, height)}%; background: ${p.price === max ? '#2ecc71' : p.price === min ? '#e74c3c' : '#3498db'};"></div>`;
                }).join('')}
            </div>
        `;
    }
    
    bindEvents() {
        document.getElementById('economy-close')?.addEventListener('click', () => this.hide());
        document.getElementById('economy-refresh')?.addEventListener('click', () => {
            this.economyManager?.updateAllPrices();
            this.render();
        });
        
        // Filtros
        document.querySelectorAll('.economy-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedCategory = e.target.dataset.filter;
                this.render();
            });
        });
    }
    
    getItemName(itemId) {
        const names = {
            'herbs': 'Ervas Medicinais',
            'wood': 'Madeira',
            'stone': 'Pedra',
            'cloth': 'Tecido',
            'leather': 'Couro',
            'silver_ore': 'Minério de Prata',
            'gold_ore': 'Minério de Ouro',
            'crystal': 'Cristal Mágico',
            'gem': 'Gema Preciosa',
            'rune': 'Runa Antiga',
            'health_potion': 'Poção de Vida',
            'mana_potion': 'Poção de Mana',
            'food': 'Comida',
            'antidote': 'Antídoto',
            'iron_sword': 'Espada de Ferro',
            'steel_armor': 'Armadura de Aço',
            'magic_staff': 'Cajado Mágico',
            'bow': 'Arco',
            'gold_ring': 'Anel de Ouro',
            'crown': 'Coroa Real',
            'epic_weapon': 'Arma Épica',
            'event_token': 'Token de Evento',
            'festival_item': 'Item de Festival'
        };
        return names[itemId] || itemId;
    }
    
    getItemIcon(itemId) {
        const icons = {
            'herbs': '🌿', 'wood': '🪵', 'stone': '🪨', 'cloth': '🧵', 'leather': '🟫',
            'silver_ore': '⚪', 'gold_ore': '🟡', 'crystal': '💎', 'gem': '💍', 'rune': '🔮',
            'health_potion': '🧪', 'mana_potion': '🧪', 'food': '🍞', 'antidote': '💊',
            'iron_sword': '⚔️', 'steel_armor': '🛡️', 'magic_staff': '🔱', 'bow': '🏹',
            'gold_ring': '💍', 'crown': '👑', 'epic_weapon': '⚡',
            'event_token': '🎫', 'festival_item': '🎉'
        };
        return icons[itemId] || '📦';
    }
    
    getCategoryName(category) {
        const names = {
            'common_materials': 'Material Comum',
            'rare_materials': 'Material Raro',
            'consumables': 'Consumível',
            'equipment': 'Equipamento',
            'luxury': 'Luxo',
            'event_items': 'Item de Evento'
        };
        return names[category] || category;
    }
    
    show() {
        this.visible = true;
        this.elements.overlay.classList.add('active');
        this.render();
    }
    
    hide() {
        this.visible = false;
        this.elements.overlay.classList.remove('active');
    }
    
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

window.EconomyUI = EconomyUI;
