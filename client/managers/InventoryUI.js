/**
 * InventoryUI - Interface do Inventário e Banco
 */
class InventoryUI {
    constructor(inventoryManager) {
        this.manager = inventoryManager;
        this.visible = false;
        this.bankVisible = false;
        this.draggedItem = null;
        this.dragSource = null;
        this.selectedTab = 'inventory';
        this.elements = {};
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.createStyles();
        this.createInventoryPanel();
        this.createBankPanel();
        this.bindKeys();
        this.initialized = true;
        console.log('🎒 InventoryUI inicializado');
    }

    createStyles() {
        const styles = `
            .inv-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: none; opacity: 0; transition: opacity 0.2s; }
            .inv-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .inv-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #e94560; border-radius: 12px; width: 420px; max-height: 85vh; overflow-y: auto; padding: 16px; box-shadow: 0 0 40px rgba(233,69,96,0.3); }
            .inv-panel.bank-panel { width: 500px; }
            .inv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(233,69,96,0.3); }
            .inv-title { font-size: 18px; font-weight: bold; color: #e94560; text-transform: uppercase; letter-spacing: 1px; }
            .inv-close { background: transparent; border: 1px solid #e94560; color: #e94560; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-size: 16px; transition: all 0.2s; }
            .inv-close:hover { background: #e94560; color: white; }
            .inv-gold { display: flex; align-items: center; gap: 8px; color: #ffd700; font-weight: bold; margin-bottom: 16px; padding: 8px 12px; background: rgba(255,215,0,0.1); border-radius: 6px; }
            .inv-slots { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
            .inv-slot { width: 64px; height: 64px; background: rgba(0,0,0,0.4); border: 2px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; position: relative; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
            .inv-slot:hover { border-color: #e94560; background: rgba(233,69,96,0.1); }
            .inv-slot.drag-over { border-color: #0f3460; background: rgba(15,52,96,0.3); border-style: dashed; }
            .inv-slot.equipped { border-color: #4ecca3; background: rgba(78,204,163,0.1); }
            .inv-item { width: 56px; height: 56px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
            .inv-item-icon { font-size: 24px; }
            .inv-item-qty { position: absolute; bottom: 2px; right: 4px; font-size: 11px; font-weight: bold; color: white; background: rgba(0,0,0,0.7); padding: 1px 4px; border-radius: 3px; }
            .inv-item-rarity-common { border: 2px solid #888; }
            .inv-item-rarity-uncommon { border: 2px solid #4ecca3; }
            .inv-item-rarity-rare { border: 2px solid #3498db; }
            .inv-item-rarity-epic { border: 2px solid #9b59b6; }
            .inv-item-rarity-legendary { border: 2px solid #e94560; box-shadow: 0 0 10px rgba(233,69,96,0.5); }
            .inv-tooltip { position: fixed; background: rgba(0,0,0,0.95); border: 1px solid #e94560; border-radius: 8px; padding: 12px; color: white; font-size: 12px; max-width: 250px; z-index: 2000; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
            .inv-tooltip.visible { opacity: 1; }
            .inv-tooltip-name { font-size: 14px; font-weight: bold; color: #e94560; margin-bottom: 4px; }
            .inv-tooltip-type { color: #888; margin-bottom: 8px; font-style: italic; }
            .inv-tooltip-stat { display: flex; justify-content: space-between; margin: 2px 0; }
            .inv-tooltip-stat.positive { color: #4ecca3; }
            .inv-actions { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); }
            .inv-btn { flex: 1; padding: 8px; border: 1px solid #0f3460; background: rgba(15,52,96,0.3); color: white; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
            .inv-btn:hover { background: #0f3460; }
            .inv-btn.primary { border-color: #e94560; background: rgba(233,69,96,0.3); }
            .inv-btn.primary:hover { background: #e94560; }
            .inv-equipment { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; }
            .inv-equip-slot { display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; }
            .inv-equip-label { font-size: 11px; color: #888; text-transform: uppercase; }
            .inv-equip-item { flex: 1; height: 32px; background: rgba(78,204,163,0.1); border: 1px solid #4ecca3; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
            .inv-equip-item.empty { background: transparent; border-color: rgba(255,255,255,0.1); color: #444; }
            .inv-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
            .inv-tab { flex: 1; padding: 8px; background: rgba(0,0,0,0.3); border: none; color: #888; cursor: pointer; border-radius: 6px; font-size: 12px; transition: all 0.2s; }
            .inv-tab:hover { color: white; }
            .inv-tab.active { background: #e94560; color: white; }
            .bank-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
            .bank-tab { padding: 6px 12px; background: rgba(0,0,0,0.3); border: none; color: #888; cursor: pointer; border-radius: 6px; font-size: 11px; transition: all 0.2s; }
            .bank-tab:hover { color: white; }
            .bank-tab.active { background: #0f3460; color: white; }
            .bank-transfer { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 12px; background: rgba(255,215,0,0.05); border-radius: 6px; }
            .bank-transfer input { width: 80px; padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid #ffd700; color: white; border-radius: 4px; text-align: center; }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    createInventoryPanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'inv-overlay';

        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'inv-panel';

        this.elements.panel.innerHTML = `
            <div class="inv-header">
                <div class="inv-title">📦 Inventário</div>
                <button class="inv-close">×</button>
            </div>
            <div class="inv-gold">💰 <span id="inv-gold-amount">0</span> Gold</div>
            <div class="inv-equipment" id="inv-equipment"></div>
            <div class="inv-slots" id="inv-slots"></div>
            <div class="inv-actions">
                <button class="inv-btn" id="inv-sort-name">🔤 Nome</button>
                <button class="inv-btn" id="inv-sort-rarity">⭐ Raridade</button>
                <button class="inv-btn primary" id="inv-bank-btn">🏦 Banco</button>
            </div>
        `;

        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
        this.elements.tooltip = document.createElement('div');
        this.elements.tooltip.className = 'inv-tooltip';
        document.body.appendChild(this.elements.tooltip);

        this.elements.closeBtn = this.elements.panel.querySelector('.inv-close');
        this.elements.closeBtn.onclick = () => this.hide();
        this.elements.panel.querySelector('#inv-sort-name').onclick = () => { this.manager.sortInventory('name'); this.render(); };
        this.elements.panel.querySelector('#inv-sort-rarity').onclick = () => { this.manager.sortInventory('rarity'); this.render(); };
        this.elements.panel.querySelector('#inv-bank-btn').onclick = () => this.showBank();
    }

    createBankPanel() {
        this.elements.bankOverlay = document.createElement('div');
        this.elements.bankOverlay.className = 'inv-overlay';
        this.elements.bankPanel = document.createElement('div');
        this.elements.bankPanel.className = 'inv-panel bank-panel';
        this.elements.bankPanel.innerHTML = `
            <div class="inv-header">
                <div class="inv-title">🏦 Banco</div>
                <button class="inv-close" id="bank-close">×</button>
            </div>
            <div class="bank-tabs" id="bank-tabs"></div>
            <div class="inv-slots" id="bank-slots"></div>
            <div class="bank-transfer">
                <span>💰</span>
                <input type="number" id="bank-gold-input" min="1" value="100">
                <button class="inv-btn" id="bank-deposit-gold">Depositar</button>
                <button class="inv-btn" id="bank-withdraw-gold">Sacar</button>
                <span id="bank-gold-total">Banco: 0g</span>
            </div>
        `;
        this.elements.bankOverlay.appendChild(this.elements.bankPanel);
        document.body.appendChild(this.elements.bankOverlay);

        this.elements.bankPanel.querySelector('#bank-close').onclick = () => this.hideBank();
        this.elements.bankPanel.querySelector('#bank-deposit-gold').onclick = () => this.transferGoldToBank();
        this.elements.bankPanel.querySelector('#bank-withdraw-gold').onclick = () => this.transferGoldFromBank();

        this.renderBankTabs();
    }

    renderBankTabs() {
        const tabsEl = this.elements.bankPanel.querySelector('#bank-tabs');
        tabsEl.innerHTML = '';
        this.manager.bank.tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = `bank-tab ${this.manager.bank.activeTab === tab.id ? 'active' : ''}`;
            btn.textContent = tab.name;
            btn.onclick = () => {
                this.manager.bank.activeTab = tab.id;
                this.renderBank();
            };
            tabsEl.appendChild(btn);
        });
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape') {
                this.hide();
                this.hideBank();
            }
        });
    }

    show() {
        this.visible = true;
        this.elements.overlay.classList.add('active');
        this.render();
        if (window.audioManager) window.audioManager.playSFX('ui_open');
    }

    hide() {
        this.visible = false;
        this.elements.overlay.classList.remove('active');
        this.elements.tooltip.classList.remove('visible');
    }

    toggle() {
        if (this.visible) this.hide(); else this.show();
    }

    showBank() {
        this.hide();
        this.bankVisible = true;
        this.elements.bankOverlay.classList.add('active');
        this.renderBank();
    }

    hideBank() {
        this.bankVisible = false;
        this.elements.bankOverlay.classList.remove('active');
    }

    render() {
        this.renderGold();
        this.renderEquipment();
        this.renderSlots();
    }

    renderGold() {
        const goldEl = document.getElementById('inv-gold-amount');
        if (goldEl) goldEl.textContent = this.manager.inventory.gold.toLocaleString();
    }

    renderEquipment() {
        const container = document.getElementById('inv-equipment');
        if (!container) return;
        container.innerHTML = '';

        const slots = { weapon: '⚔️ Arma', armor: '🛡️ Armadura', helmet: '⛑️ Capacete', boots: '👢 Botas', accessory1: '💍 Acessório 1', accessory2: '💎 Acessório 2' };

        Object.entries(slots).forEach(([key, label]) => {
            const item = this.manager.inventory.equipped[key];
            const div = document.createElement('div');
            div.className = 'inv-equip-slot';
            div.innerHTML = `<span class="inv-equip-label">${label}</span><div class="inv-equip-item ${item ? '' : 'empty'}">${item ? item.icon || '📦' : '+'}</div>`;
            div.onclick = () => {
                if (item) {
                    this.manager.unequipItem(key);
                    this.render();
                    if (window.audioManager) window.audioManager.playSFX('equip');
                }
            };
            container.appendChild(div);
        });
    }

    renderSlots() {
        const container = document.getElementById('inv-slots');
        if (!container) return;
        container.innerHTML = '';

        for (let slot = 0; slot < this.manager.getTotalSlots(); slot++) {
            const item = this.manager.getItemAt(slot);
            const slotEl = document.createElement('div');
            slotEl.className = 'inv-slot';
            slotEl.dataset.slot = slot;

            if (item) {
                const rarity = item.rarity || 'common';
                slotEl.innerHTML = `
                    <div class="inv-item inv-item-rarity-${rarity}">
                        <span class="inv-item-icon">${item.icon || '📦'}</span>
                        ${item.quantity > 1 ? `<span class="inv-item-qty">${item.quantity}</span>` : ''}
                    </div>
                `;
                slotEl.onmouseenter = (e) => this.showTooltip(e, item);
                slotEl.onmouseleave = () => this.hideTooltip();
                slotEl.onclick = (e) => this.handleItemClick(e, item, slot);
                slotEl.oncontextmenu = (e) => { e.preventDefault(); this.showContextMenu(e, item, slot); };
            }

            this.setupDragAndDrop(slotEl, slot);
            container.appendChild(slotEl);
        }
    }

    renderBank() {
        this.renderBankTabs();
        const container = document.getElementById('bank-slots');
        if (!container) return;
        container.innerHTML = '';

        const tab = this.manager.bank.tabs.find(t => t.id === this.manager.bank.activeTab);
        if (!tab) return;

        for (let slot = 0; slot < this.manager.config.bankSlots / this.manager.bank.tabs.length; slot++) {
            const item = tab.items[slot];
            const slotEl = document.createElement('div');
            slotEl.className = 'inv-slot';
            slotEl.dataset.bankSlot = slot;

            if (item) {
                const rarity = item.rarity || 'common';
                slotEl.innerHTML = `
                    <div class="inv-item inv-item-rarity-${rarity}">
                        <span class="inv-item-icon">${item.icon || '📦'}</span>
                        ${item.quantity > 1 ? `<span class="inv-item-qty">${item.quantity}</span>` : ''}
                    </div>
                `;
                slotEl.onmouseenter = (e) => this.showTooltip(e, item);
                slotEl.onmouseleave = () => this.hideTooltip();
                slotEl.onclick = () => {
                    this.manager.withdrawFromBank(slot, null, tab.id);
                    this.renderBank();
                    if (window.audioManager) window.audioManager.playSFX('collect');
                };
            }
            container.appendChild(slotEl);
        }

        const bankGoldEl = document.getElementById('bank-gold-total');
        if (bankGoldEl) bankGoldEl.textContent = `Banco: ${this.manager.bank.gold.toLocaleString()}g`;
    }

    showTooltip(e, item) {
        const stats = item.stats ? Object.entries(item.stats).map(([k, v]) => {
            const sign = v >= 0 ? '+' : '';
            return `<div class="inv-tooltip-stat positive">${k}: ${sign}${v}</div>`;
        }).join('') : '';

        const rarityColors = { common: '#888', uncommon: '#4ecca3', rare: '#3498db', epic: '#9b59b6', legendary: '#e94560' };
        const rarityName = { common: 'Comum', uncommon: 'Incomum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário' };

        this.elements.tooltip.innerHTML = `
            <div class="inv-tooltip-name" style="color: ${rarityColors[item.rarity] || '#fff'}">${item.name}</div>
            <div class="inv-tooltip-type">${rarityName[item.rarity] || 'Comum'} ${item.type || 'Item'}</div>
            ${item.requiredLevel ? `<div>Nível requerido: ${item.requiredLevel}</div>` : ''}
            ${stats}
            ${item.description ? `<div style="margin-top:8px;color:#aaa">${item.description}</div>` : ''}
        `;

        const rect = e.target.getBoundingClientRect();
        this.elements.tooltip.style.left = (rect.right + 10) + 'px';
        this.elements.tooltip.style.top = rect.top + 'px';
        this.elements.tooltip.classList.add('visible');
    }

    hideTooltip() {
        this.elements.tooltip.classList.remove('visible');
    }

    handleItemClick(e, item, slot) {
        if (item.equipable) {
            const result = this.manager.equipItem(slot);
            if (result.success) {
                this.render();
                if (window.audioManager) window.audioManager.playSFX('equip');
            }
        }
    }

    showContextMenu(e, item, slot) {
        const menu = document.createElement('div');
        menu.style.cssText = 'position:fixed;background:#1a1a2e;border:1px solid #e94560;border-radius:6px;padding:8px;z-index:3000;';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        const actions = [];
        if (item.equipable) actions.push({ label: 'Equipar', action: () => this.manager.equipItem(slot) });
        actions.push({ label: 'Depositar no Banco', action: () => this.manager.depositToBank(slot) });
        actions.push({ label: 'Descartar', action: () => this.manager.removeItem(slot) });

        actions.forEach(({ label, action }) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.cssText = 'display:block;width:100%;padding:8px 12px;background:transparent;border:none;color:white;cursor:pointer;text-align:left;';
            btn.onmouseenter = () => btn.style.background = 'rgba(233,69,96,0.3)';
            btn.onmouseleave = () => btn.style.background = 'transparent';
            btn.onclick = () => { action(); this.render(); document.body.removeChild(menu); };
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
        setTimeout(() => {
            const closeMenu = (ev) => { if (!menu.contains(ev.target)) { document.body.removeChild(menu); document.removeEventListener('click', closeMenu); } };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    setupDragAndDrop(element, slot) {
        element.draggable = true;
        element.ondragstart = (e) => {
            const item = this.manager.getItemAt(slot);
            if (item) {
                this.draggedItem = item;
                this.dragSource = slot;
                element.style.opacity = '0.5';
            }
        };
        element.ondragend = (e) => {
            element.style.opacity = '1';
            this.draggedItem = null;
            this.dragSource = null;
        };
        element.ondragover = (e) => { e.preventDefault(); element.classList.add('drag-over'); };
        element.ondragleave = (e) => { element.classList.remove('drag-over'); };
        element.ondrop = (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            if (this.draggedItem && this.dragSource !== slot) {
                this.manager.moveItem(this.dragSource, slot);
                this.render();
                if (window.audioManager) window.audioManager.playSFX('ui_click');
            }
        };
    }

    transferGoldToBank() {
        const input = document.getElementById('bank-gold-input');
        const amount = parseInt(input.value) || 0;
        if (amount > 0) {
            const result = this.manager.transferGold(amount, true);
            if (result.success) {
                this.renderBank();
                if (window.audioManager) window.audioManager.playSFX('coin');
            }
        }
    }

    transferGoldFromBank() {
        const input = document.getElementById('bank-gold-input');
        const amount = parseInt(input.value) || 0;
        if (amount > 0) {
            const result = this.manager.transferGold(amount, false);
            if (result.success) {
                this.renderBank();
                if (window.audioManager) window.audioManager.playSFX('coin');
            }
        }
    }
}

window.InventoryUI = InventoryUI;
