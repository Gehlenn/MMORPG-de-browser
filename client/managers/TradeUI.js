/**
 * TradeUI - Interface de Troca entre Jogadores
 * 
 * Features:
 * - Visualização das ofertas dos dois lados
 * - Drag & drop de itens
 * - Input de gold
 * - Confirmação visual
 * - Indicadores de segurança
 */

class TradeUI {
    constructor(tradeManager, inventoryManager) {
        this.tradeManager = tradeManager;
        this.inventoryManager = inventoryManager;
        this.visible = false;
        this.selectedInventoryItem = null;
        this.elements = {};
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        
        this.createStyles();
        this.createTradePanel();
        this.bindKeys();
        
        // Bind events do manager
        if (this.tradeManager) {
            this.tradeManager.onTradeRequest = (trade) => this.showRequest(trade);
            this.tradeManager.onTradeStart = (trade) => this.showActive(trade);
            this.tradeManager.onTradeUpdate = (trade) => this.updateTradeDisplay(trade);
            this.tradeManager.onTradeComplete = (trade) => this.showComplete(trade);
            this.tradeManager.onTradeCancel = (trade, reason) => this.showCancelled(trade, reason);
            this.tradeManager.onTradeDecline = (trade, reason) => this.showDeclined(trade, reason);
        }
        
        this.initialized = true;
        console.log('🤝 TradeUI inicializado');
    }
    
    createStyles() {
        const styles = `
            .trade-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 1500; display: none; opacity: 0; transition: opacity 0.2s; }
            .trade-overlay.active { display: flex; opacity: 1; justify-content: center; align-items: center; }
            .trade-panel { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid #9b59b6; border-radius: 12px; width: 900px; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 0 50px rgba(155,89,182,0.3); }
            .trade-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(155,89,182,0.3); }
            .trade-title { display: flex; align-items: center; gap: 12px; }
            .trade-title-icon { font-size: 32px; width: 50px; height: 50px; background: rgba(155,89,182,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
            .trade-title-text { font-size: 20px; font-weight: bold; color: #9b59b6; }
            .trade-status { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .trade-status.pending { background: rgba(241,196,15,0.2); color: #f1c40f; }
            .trade-status.active { background: rgba(52,152,219,0.2); color: #3498db; }
            .trade-status.confirming { background: rgba(46,204,113,0.2); color: #2ecc71; }
            .trade-status.completed { background: rgba(46,204,113,0.3); color: #2ecc71; }
            .trade-status.cancelled { background: rgba(231,76,60,0.2); color: #e74c3c; }
            .trade-close { background: transparent; border: 1px solid #e94560; color: #e94560; width: 32px; height: 32px; border-radius: 6px; cursor: pointer; font-size: 18px; transition: all 0.2s; }
            .trade-close:hover { background: #e94560; color: white; }
            .trade-content { display: grid; grid-template-columns: 1fr 60px 1fr; gap: 20px; }
            .trade-section { background: rgba(0,0,0,0.2); border-radius: 10px; padding: 16px; }
            .trade-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .trade-player-name { font-size: 14px; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; }
            .trade-player-status { font-size: 11px; color: #888; }
            .trade-player-status.confirmed { color: #2ecc71; }
            .trade-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
            .trade-slot { aspect-ratio: 1; background: rgba(255,255,255,0.05); border: 2px dashed rgba(255,255,255,0.2); border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; position: relative; min-height: 70px; }
            .trade-slot:hover { background: rgba(255,255,255,0.1); border-color: rgba(155,89,182,0.5); }
            .trade-slot.has-item { background: rgba(155,89,182,0.1); border-style: solid; border-color: rgba(155,89,182,0.5); }
            .trade-slot.locked { cursor: not-allowed; opacity: 0.6; }
            .trade-slot-icon { font-size: 24px; }
            .trade-slot-qty { position: absolute; bottom: 2px; right: 4px; font-size: 10px; color: white; background: rgba(0,0,0,0.6); padding: 2px 4px; border-radius: 2px; }
            .trade-slot-remove { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; background: #e94560; color: white; border: none; border-radius: 50%; font-size: 12px; cursor: pointer; display: none; align-items: center; justify-content: center; }
            .trade-slot:hover .trade-slot-remove { display: flex; }
            .trade-gold { display: flex; align-items: center; gap: 8px; padding: 10px; background: rgba(255,193,7,0.1); border: 1px solid rgba(255,193,7,0.3); border-radius: 6px; }
            .trade-gold-icon { font-size: 20px; }
            .trade-gold-input { flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: #ffc107; padding: 6px 10px; font-size: 14px; text-align: right; }
            .trade-gold-input:focus { outline: none; border-color: #ffc107; }
            .trade-gold-max { padding: 6px 10px; background: rgba(255,193,7,0.2); border: 1px solid rgba(255,193,7,0.3); color: #ffc107; border-radius: 4px; cursor: pointer; font-size: 11px; }
            .trade-gold-max:hover { background: rgba(255,193,7,0.3); }
            .trade-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
            .trade-arrow { font-size: 32px; color: #9b59b6; opacity: 0.5; }
            .trade-timer { font-size: 24px; font-weight: bold; color: #f1c40f; }
            .trade-value { text-align: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; }
            .trade-value-label { font-size: 10px; color: #888; text-transform: uppercase; }
            .trade-value-amount { font-size: 16px; font-weight: bold; color: #2ecc71; }
            .trade-actions { display: flex; gap: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
            .trade-btn { flex: 1; padding: 14px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .trade-btn.primary { background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; }
            .trade-btn.primary:hover:not(:disabled) { background: linear-gradient(135deg, #3dd87e, #2ecc71); transform: translateY(-1px); }
            .trade-btn.primary:disabled { opacity: 0.5; cursor: not-allowed; }
            .trade-btn.secondary { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #888; }
            .trade-btn.secondary:hover { background: rgba(231,76,60,0.2); border-color: #e74c3c; color: #e74c3c; }
            .trade-btn.warning { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; }
            .trade-inventory { margin-top: 20px; background: rgba(0,0,0,0.2); border-radius: 10px; padding: 16px; }
            .trade-inventory-title { font-size: 14px; font-weight: bold; color: #888; margin-bottom: 12px; }
            .trade-inventory-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; }
            .trade-inv-item { aspect-ratio: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; font-size: 20px; position: relative; }
            .trade-inv-item:hover { background: rgba(155,89,182,0.1); border-color: #9b59b6; }
            .trade-inv-item.selected { background: rgba(155,89,182,0.3); border-color: #9b59b6; box-shadow: 0 0 10px rgba(155,89,182,0.3); }
            .trade-inv-item.equipped { opacity: 0.3; cursor: not-allowed; }
            .trade-inv-item.empty { cursor: default; }
            .trade-inv-item.empty:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
            .trade-inv-qty { position: absolute; bottom: 2px; right: 2px; font-size: 9px; color: #4ecca3; font-weight: bold; }
            .trade-request { text-align: center; padding: 40px; }
            .trade-request-icon { font-size: 64px; margin-bottom: 20px; }
            .trade-request-text { font-size: 18px; color: white; margin-bottom: 8px; }
            .trade-request-subtext { font-size: 13px; color: #888; margin-bottom: 24px; }
            .trade-request-actions { display: flex; gap: 16px; justify-content: center; }
            .trade-result { text-align: center; padding: 40px; }
            .trade-result-icon { font-size: 64px; margin-bottom: 20px; }
            .trade-result-text { font-size: 18px; color: white; margin-bottom: 8px; }
            .trade-result-subtext { font-size: 13px; color: #888; }
            .trade-security { display: flex; align-items: center; gap: 8px; padding: 12px; background: rgba(241,196,15,0.1); border: 1px solid rgba(241,196,15,0.3); border-radius: 6px; margin-bottom: 16px; font-size: 12px; color: #f1c40f; }
            .trade-security-icon { font-size: 16px; }
        `;
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createTradePanel() {
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'trade-overlay';
        
        this.elements.panel = document.createElement('div');
        this.elements.panel.className = 'trade-panel';
        this.elements.panel.id = 'trade-panel-content';
        
        this.elements.overlay.appendChild(this.elements.panel);
        document.body.appendChild(this.elements.overlay);
    }
    
    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.visible) {
                    this.onCancel();
                }
            }
        });
    }
    
    // ===================== DISPLAY MODES =====================
    
    showRequest(trade) {
        this.visible = true;
        this.elements.overlay.classList.add('active');
        
        const isInitiator = trade.initiator === this.tradeManager?.playerId;
        const otherName = isInitiator ? trade.targetName : trade.initiatorName || 'Outro jogador';
        
        this.elements.panel.innerHTML = `
            <div class="trade-request">
                <div class="trade-request-icon">🤝</div>
                <div class="trade-request-text">
                    ${isInitiator ? `Aguardando resposta de ${otherName}...` : `${otherName} quer trocar com você!`}
                </div>
                <div class="trade-request-subtext">
                    ${isInitiator ? 'A troca expira em 2 minutos se não for respondida.' : 'Você tem 2 minutos para responder.'}
                </div>
                ${isInitiator ? `
                    <div class="trade-request-actions">
                        <button class="trade-btn secondary" id="trade-cancel-req">Cancelar</button>
                    </div>
                ` : `
                    <div class="trade-request-actions">
                        <button class="trade-btn primary" id="trade-accept">Aceitar 🤝</button>
                        <button class="trade-btn secondary" id="trade-decline">Recusar</button>
                    </div>
                `}
            </div>
        `;
        
        this.bindRequestEvents();
    }
    
    showActive(trade) {
        const isInitiator = trade.initiator === this.tradeManager?.playerId;
        const myName = 'Você';
        const otherName = isInitiator ? (trade.targetName || 'Jogador') : (trade.initiatorName || 'Jogador');
        
        this.elements.panel.innerHTML = `
            <div class="trade-header">
                <div class="trade-title">
                    <div class="trade-title-icon">🤝</div>
                    <div class="trade-title-text">Troca de Itens</div>
                </div>
                <div class="trade-status active" id="trade-status">Em Andamento</div>
                <button class="trade-close" id="trade-close">×</button>
            </div>
            
            <div class="trade-security">
                <span class="trade-security-icon">🔒</span>
                <span>Sistema de segurança: Verifique os itens antes de confirmar. Modificar a oferta cancela a confirmação.</span>
            </div>
            
            <div class="trade-content">
                <div class="trade-section">
                    <div class="trade-section-header">
                        <div class="trade-player-name">
                            ${myName}
                            <span id="my-status"></span>
                        </div>
                    </div>
                    <div class="trade-slots" id="my-slots">
                        ${this.renderEmptySlots(6)}
                    </div>
                    <div class="trade-gold">
                        <span class="trade-gold-icon">💰</span>
                        <input type="number" class="trade-gold-input" id="my-gold-input" placeholder="0" min="0">
                        <button class="trade-gold-max" id="gold-max">MAX</button>
                    </div>
                    <div class="trade-value">
                        <div class="trade-value-label">Valor da Oferta</div>
                        <div class="trade-value-amount" id="my-value">💰 0</div>
                    </div>
                </div>
                
                <div class="trade-center">
                    <div class="trade-arrow">⇄</div>
                    <div class="trade-value">
                        <div class="trade-value-label">Total</div>
                        <div class="trade-value-amount" id="total-value">💰 0</div>
                    </div>
                </div>
                
                <div class="trade-section">
                    <div class="trade-section-header">
                        <div class="trade-player-name">
                            ${otherName}
                            <span id="other-status"></span>
                        </div>
                    </div>
                    <div class="trade-slots" id="other-slots">
                        ${this.renderEmptySlots(6)}
                    </div>
                    <div class="trade-gold">
                        <span class="trade-gold-icon">💰</span>
                        <input type="number" class="trade-gold-input" id="other-gold-input" placeholder="?" disabled>
                    </div>
                    <div class="trade-value">
                        <div class="trade-value-label">Valor da Oferta</div>
                        <div class="trade-value-amount" id="other-value">💰 ?</div>
                    </div>
                </div>
            </div>
            
            <div class="trade-inventory">
                <div class="trade-inventory-title">📦 Seu Inventário (Clique para adicionar à troca)</div>
                <div class="trade-inventory-grid" id="trade-inventory-grid"></div>
            </div>
            
            <div class="trade-actions">
                <button class="trade-btn primary" id="trade-confirm">✓ Confirmar Troca</button>
                <button class="trade-btn secondary" id="trade-cancel">✗ Cancelar</button>
            </div>
        `;
        
        this.bindActiveEvents();
        this.renderInventory();
        this.updateTradeDisplay(trade);
    }
    
    showComplete(trade) {
        this.elements.panel.innerHTML = `
            <div class="trade-result">
                <div class="trade-result-icon">✅</div>
                <div class="trade-result-text">Troca Concluída!</div>
                <div class="trade-result-subtext">Os itens foram transferidos com sucesso.</div>
            </div>
        `;
        
        setTimeout(() => this.hide(), 2000);
    }
    
    showCancelled(trade, reason) {
        const messages = {
            'cancelled': 'Troca cancelada',
            'timeout_request': 'Tempo esgotado',
            'confirmation_timeout': 'Confirmação expirou',
            'inventory_full': 'Inventário cheio',
            'insufficient_gold': 'Gold insuficiente',
            'execution_error': 'Erro na execução'
        };
        
        this.elements.panel.innerHTML = `
            <div class="trade-result">
                <div class="trade-result-icon">❌</div>
                <div class="trade-result-text">${messages[reason] || 'Troca cancelada'}</div>
                <div class="trade-result-subtext">Nenhum item foi transferido.</div>
            </div>
        `;
        
        setTimeout(() => this.hide(), 3000);
    }
    
    showDeclined(trade, reason) {
        this.elements.panel.innerHTML = `
            <div class="trade-result">
                <div class="trade-result-icon">🚫</div>
                <div class="trade-result-text">Troca Recusada</div>
                <div class="trade-result-subtext">O outro jogador recusou a solicitação.</div>
            </div>
        `;
        
        setTimeout(() => this.hide(), 3000);
    }
    
    // ===================== RENDER =====================
    
    renderEmptySlots(count) {
        return Array(count).fill(0).map((_, i) => `
            <div class="trade-slot" data-slot="${i}">
                <span style="color: rgba(255,255,255,0.2); font-size: 20px;">+</span>
            </div>
        `).join('');
    }
    
    renderInventory() {
        const grid = document.getElementById('trade-inventory-grid');
        if (!grid || !this.inventoryManager) return;
        
        const slots = this.inventoryManager.slots || [];
        const maxSlots = 40;
        
        grid.innerHTML = Array(maxSlots).fill(0).map((_, i) => {
            const slot = slots[i];
            const hasItem = slot && slot.item;
            const isEquipped = hasItem && slot.item.equipped;
            
            if (!hasItem) {
                return `<div class="trade-inv-item empty"></div>`;
            }
            
            return `
                <div class="trade-inv-item ${isEquipped ? 'equipped' : ''}" 
                     data-slot="${i}" 
                     title="${slot.item.name}${isEquipped ? ' (Equipado)' : ''}">
                    ${slot.item.icon || '📦'}
                    ${slot.quantity > 1 ? `<span class="trade-inv-qty">${slot.quantity}</span>` : ''}
                </div>
            `;
        }).join('');
        
        // Eventos
        grid.querySelectorAll('.trade-inv-item:not(.empty):not(.equipped)').forEach(item => {
            item.onclick = () => this.onInventoryItemClick(parseInt(item.dataset.slot));
        });
    }
    
    updateTradeDisplay(trade) {
        if (!trade) return;
        
        const isInitiator = trade.initiator === this.tradeManager?.playerId;
        const myOffer = isInitiator ? trade.initiatorOffer : trade.targetOffer;
        const otherOffer = isInitiator ? trade.targetOffer : trade.initiatorOffer;
        
        // Atualizar meus slots
        const mySlots = document.getElementById('my-slots');
        if (mySlots) {
            mySlots.innerHTML = this.renderOfferSlots(myOffer, true);
        }
        
        // Atualizar slots do outro
        const otherSlots = document.getElementById('other-slots');
        if (otherSlots) {
            otherSlots.innerHTML = this.renderOfferSlots(otherOffer, false);
        }
        
        // Atualizar gold
        const myGoldInput = document.getElementById('my-gold-input');
        if (myGoldInput && myOffer.gold > 0) {
            myGoldInput.value = myOffer.gold;
        }
        
        const otherGoldInput = document.getElementById('other-gold-input');
        if (otherGoldInput) {
            otherGoldInput.value = otherOffer.gold > 0 ? otherOffer.gold : '';
        }
        
        // Atualizar valores
        const myValue = this.tradeManager?.getOfferValue(myOffer);
        const otherValue = this.tradeManager?.getOfferValue(otherOffer);
        
        document.getElementById('my-value').textContent = `💰 ${myValue?.total?.toLocaleString() || 0}`;
        document.getElementById('other-value').textContent = `💰 ${otherValue?.total?.toLocaleString() || '?'}`;
        document.getElementById('total-value').textContent = `💰 ${((myValue?.total || 0) + (otherValue?.total || 0)).toLocaleString()}`;
        
        // Atualizar status
        const myStatus = document.getElementById('my-status');
        const otherStatus = document.getElementById('other-status');
        
        if (myStatus) {
            myStatus.textContent = myOffer.confirmed ? ' ✓ Confirmado' : '';
            myStatus.className = myOffer.confirmed ? 'trade-player-status confirmed' : 'trade-player-status';
        }
        
        if (otherStatus) {
            otherStatus.textContent = otherOffer.confirmed ? ' ✓ Confirmado' : '';
            otherStatus.className = otherOffer.confirmed ? 'trade-player-status confirmed' : 'trade-player-status';
        }
        
        // Atualizar status global
        const statusEl = document.getElementById('trade-status');
        if (statusEl) {
            const statusText = {
                'active': 'Em Andamento',
                'confirming': 'Aguardando Confirmação',
                'completed': 'Concluído',
                'cancelled': 'Cancelado'
            };
            statusEl.textContent = statusText[trade.status] || trade.status;
            statusEl.className = `trade-status ${trade.status}`;
        }
        
        // Atualizar botão confirmar
        const confirmBtn = document.getElementById('trade-confirm');
        if (confirmBtn) {
            confirmBtn.textContent = myOffer.confirmed ? '⏳ Aguardando...' : '✓ Confirmar Troca';
            confirmBtn.disabled = myOffer.confirmed;
        }
    }
    
    renderOfferSlots(offer, isEditable) {
        if (!offer || !offer.items) return this.renderEmptySlots(6);
        
        const slots = [];
        
        for (let i = 0; i < 6; i++) {
            const item = offer.items[i];
            
            if (item) {
                const rarityClass = item.rarity || 'common';
                slots.push(`
                    <div class="trade-slot has-item ${!isEditable ? 'locked' : ''}" data-slot="${i}">
                        <span class="trade-slot-icon">${item.icon || '📦'}</span>
                        ${item.quantity > 1 ? `<span class="trade-slot-qty">${item.quantity}</span>` : ''}
                        ${isEditable ? `<button class="trade-slot-remove" data-index="${i}">×</button>` : ''}
                    </div>
                `);
            } else {
                slots.push(`
                    <div class="trade-slot ${!isEditable ? 'locked' : ''}" data-slot="${i}">
                        <span style="color: rgba(255,255,255,0.2); font-size: 20px;">+</span>
                    </div>
                `);
            }
        }
        
        return slots.join('');
    }
    
    // ===================== EVENTS =====================
    
    bindRequestEvents() {
        const acceptBtn = document.getElementById('trade-accept');
        const declineBtn = document.getElementById('trade-decline');
        const cancelBtn = document.getElementById('trade-cancel-req');
        
        if (acceptBtn) {
            acceptBtn.onclick = () => this.tradeManager?.acceptTrade();
        }
        
        if (declineBtn) {
            declineBtn.onclick = () => this.tradeManager?.declineTrade();
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => this.onCancel();
        }
    }
    
    bindActiveEvents() {
        // Fechar
        document.getElementById('trade-close')?.addEventListener('click', () => this.onCancel());
        
        // Confirmar
        document.getElementById('trade-confirm')?.addEventListener('click', () => {
            this.tradeManager?.confirmTrade();
        });
        
        // Cancelar
        document.getElementById('trade-cancel')?.addEventListener('click', () => this.onCancel());
        
        // Gold
        const goldInput = document.getElementById('my-gold-input');
        if (goldInput) {
            goldInput.addEventListener('change', (e) => {
                const amount = parseInt(e.target.value) || 0;
                this.tradeManager?.addGoldToOffer(amount);
            });
        }
        
        document.getElementById('gold-max')?.addEventListener('click', () => {
            const maxGold = this.tradeManager?.goldManager?.getGold() || 0;
            goldInput.value = maxGold;
            this.tradeManager?.addGoldToOffer(maxGold);
        });
        
        // Delegação de eventos para slots
        document.getElementById('my-slots')?.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.trade-slot-remove');
            if (removeBtn) {
                const index = parseInt(removeBtn.dataset.index);
                this.tradeManager?.removeItemFromOffer(index);
            }
        });
    }
    
    onInventoryItemClick(slotIndex) {
        const result = this.tradeManager?.addItemToOffer(slotIndex, 1);
        
        if (!result?.success) {
            this.showError(this.getErrorMessage(result?.reason));
        }
    }
    
    onCancel() {
        this.tradeManager?.cancelTrade('user_cancelled');
    }
    
    showError(message) {
        if (window.effectsManager) {
            window.effectsManager.showToast(message, '⚠️', '#e94560');
        }
    }
    
    getErrorMessage(reason) {
        const messages = {
            'already_trading': 'Você já está em uma troca',
            'trade_not_active': 'Troca não está ativa',
            'item_not_found': 'Item não encontrado',
            'item_equipped': 'Desequipe o item primeiro',
            'max_slots_reached': 'Limite de itens atingido',
            'insufficient_gold': 'Gold insuficiente'
        };
        return messages[reason] || 'Erro na troca';
    }
    
    hide() {
        this.visible = false;
        this.elements.overlay.classList.remove('active');
    }
}

window.TradeUI = TradeUI;
