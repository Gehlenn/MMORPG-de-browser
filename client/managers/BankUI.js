/**
 * BankUI - Interface do Sistema Bancário
 * 
 * Features:
 * - Visualização de slots do banco (grid)
 * - Drag and drop de itens
 * - Transferência entre inventário e banco
 * - Guild Bank com permissões
 * - Histórico de transações
 * - Upgrade de slots
 */

class BankUI {
    constructor(game) {
        this.game = game;
        this.socket = game?.socket;
        this.isVisible = false;
        this.currentMode = 'personal'; // 'personal' ou 'guild'
        this.bankData = null;
        this.selectedItem = null;
        this.draggedItem = null;
        
        // Configurações de layout
        this.SLOTS_PER_ROW = 5;
        this.SLOT_SIZE = 64;
        this.SLOT_MARGIN = 8;
        
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
        this.container.id = 'bank-ui';
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 800px;
            height: 600px;
            background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
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
        
        // Content
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            flex: 1;
            overflow: hidden;
        `;
        
        // Left panel (bank slots)
        this.bankPanel = document.createElement('div');
        this.bankPanel.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
        `;
        
        content.appendChild(this.bankPanel);
        
        // Right panel (info/actions)
        this.sidePanel = this.createSidePanel();
        content.appendChild(this.sidePanel);
        
        this.container.appendChild(content);
        
        document.body.appendChild(this.container);
        
        // Drag overlay
        this.dragOverlay = document.createElement('div');
        this.dragOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(214, 158, 46, 0.1);
            border: 3px dashed #d69e2e;
            display: none;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(this.dragOverlay);
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
        
        // Title section
        const titleSection = document.createElement('div');
        titleSection.style.cssText = `
            display: flex;
            align-items: center;
            gap: 15px;
        `;
        
        this.titleEl = document.createElement('h2');
        this.titleEl.innerHTML = '🏦 Banco';
        this.titleEl.style.cssText = `
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        `;
        
        // Mode toggle
        this.modeToggle = document.createElement('div');
        this.modeToggle.style.cssText = `
            display: flex;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            padding: 3px;
        `;
        
        this.personalBtn = document.createElement('button');
        this.personalBtn.textContent = '👤 Pessoal';
        this.personalBtn.style.cssText = this.getModeButtonStyle(true);
        this.personalBtn.onclick = () => this.switchMode('personal');
        
        this.guildBtn = document.createElement('button');
        this.guildBtn.textContent = '🏛️ Guilda';
        this.guildBtn.style.cssText = this.getModeButtonStyle(false);
        this.guildBtn.onclick = () => this.switchMode('guild');
        
        this.modeToggle.appendChild(this.personalBtn);
        this.modeToggle.appendChild(this.guildBtn);
        
        titleSection.appendChild(this.titleEl);
        titleSection.appendChild(this.modeToggle);
        
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
        
        header.appendChild(titleSection);
        header.appendChild(closeBtn);
        
        return header;
    }
    
    getModeButtonStyle(active) {
        return `
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            background: ${active ? '#d69e2e' : 'transparent'};
            color: white;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        `;
    }
    
    createSidePanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            width: 250px;
            background: rgba(0, 0, 0, 0.3);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px;
            overflow-y: auto;
        `;
        
        // Info section
        this.infoSection = document.createElement('div');
        this.infoSection.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
        `;
        
        // Gold display
        this.goldDisplay = document.createElement('div');
        this.goldDisplay.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 8px;
            margin-bottom: 10px;
        `;
        this.goldDisplay.innerHTML = `
            <span>💰 Ouro</span>
            <span id="bank-gold" style="font-weight: 700; color: #ffd700;">0</span>
        `;
        
        // Slots display
        this.slotsDisplay = document.createElement('div');
        this.slotsDisplay.style.cssText = `
            font-size: 13px;
            color: rgba(255,255,255,0.7);
            text-align: center;
        `;
        this.slotsDisplay.innerHTML = 'Slots: <span id="bank-slots">0/0</span>';
        
        this.infoSection.appendChild(this.goldDisplay);
        this.infoSection.appendChild(this.slotsDisplay);
        
        // Actions
        this.actionsSection = document.createElement('div');
        this.actionsSection.style.cssText = `
            display: grid;
            gap: 10px;
        `;
        
        // Upgrade button
        this.upgradeBtn = document.createElement('button');
        this.upgradeBtn.innerHTML = '⬆️ Upgrade Slots';
        this.upgradeBtn.style.cssText = `
            padding: 12px;
            background: linear-gradient(45deg, #d69e2e, #b7791f);
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        `;
        this.upgradeBtn.onclick = () => this.handleUpgrade();
        
        // History button
        this.historyBtn = document.createElement('button');
        this.historyBtn.innerHTML = '📜 Histórico';
        this.historyBtn.style.cssText = `
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: white;
            font-weight: 600;
            cursor: pointer;
        `;
        this.historyBtn.onclick = () => this.showHistory();
        
        this.actionsSection.appendChild(this.upgradeBtn);
        this.actionsSection.appendChild(this.historyBtn);
        
        // Item details (initially hidden)
        this.itemDetails = document.createElement('div');
        this.itemDetails.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-top: 15px;
            display: none;
        `;
        
        panel.appendChild(this.infoSection);
        panel.appendChild(this.actionsSection);
        panel.appendChild(this.itemDetails);
        
        return panel;
    }
    
    // ===== RENDERING =====
    
    renderBank() {
        if (!this.bankData) return;
        
        this.bankPanel.innerHTML = '';
        
        const rows = Math.ceil(this.bankData.slots / this.SLOTS_PER_ROW);
        
        // Create grid
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${this.SLOTS_PER_ROW}, ${this.SLOT_SIZE}px);
            gap: ${this.SLOT_MARGIN}px;
            justify-content: center;
        `;
        
        for (let slot = 0; slot < this.bankData.slots; slot++) {
            const slotEl = this.createSlotElement(slot);
            grid.appendChild(slotEl);
        }
        
        this.bankPanel.appendChild(grid);
        
        // Update info
        this.updateInfo();
    }
    
    createSlotElement(slotIndex) {
        const slotEl = document.createElement('div');
        slotEl.className = 'bank-slot';
        slotEl.dataset.slot = slotIndex;
        slotEl.style.cssText = `
            width: ${this.SLOT_SIZE}px;
            height: ${this.SLOT_SIZE}px;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        `;
        
        // Find item in this slot
        const item = this.bankData.items?.find(i => i.slot === slotIndex);
        
        if (item) {
            // Item icon
            const icon = document.createElement('span');
            icon.textContent = item.icon || '📦';
            icon.style.cssText = `
                font-size: 32px;
                filter: drop-shadow(0 0 4px ${this.getRarityColor(item.rarity)});
            `;
            
            // Quantity badge
            if (item.quantity > 1) {
                const badge = document.createElement('span');
                badge.textContent = item.quantity;
                badge.style.cssText = `
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 10px;
                `;
                slotEl.appendChild(badge);
            }
            
            // Rarity border
            slotEl.style.borderColor = this.getRarityColor(item.rarity);
            
            slotEl.appendChild(icon);
            
            // Events
            slotEl.onclick = () => this.selectItem(item, slotIndex);
            slotEl.ondblclick = () => this.withdrawItem(slotIndex);
            
            // Drag
            slotEl.draggable = true;
            slotEl.ondragstart = (e) => this.handleDragStart(e, item, slotIndex);
        } else {
            // Empty slot
            slotEl.ondragover = (e) => this.handleDragOver(e);
            slotEl.ondrop = (e) => this.handleDrop(e, slotIndex);
        }
        
        slotEl.onmouseover = () => {
            slotEl.style.background = 'rgba(255, 255, 255, 0.1)';
            slotEl.style.borderColor = '#d69e2e';
        };
        
        slotEl.onmouseout = () => {
            if (!item || this.selectedItem?.slot !== slotIndex) {
                slotEl.style.background = 'rgba(0, 0, 0, 0.4)';
                slotEl.style.borderColor = item ? this.getRarityColor(item.rarity) : 'rgba(255, 255, 255, 0.1)';
            }
        };
        
        return slotEl;
    }
    
    updateInfo() {
        if (!this.bankData) return;
        
        const goldEl = document.getElementById('bank-gold');
        if (goldEl) {
            goldEl.textContent = (this.bankData.gold || 0).toLocaleString();
        }
        
        const slotsEl = document.getElementById('bank-slots');
        if (slotsEl) {
            slotsEl.textContent = `${this.bankData.items?.length || 0}/${this.bankData.slots}`;
        }
        
        // Update upgrade button
        if (this.upgradeBtn) {
            const canUpgrade = this.bankData.canUpgrade;
            this.upgradeBtn.style.display = canUpgrade ? 'block' : 'none';
            if (canUpgrade) {
                this.upgradeBtn.innerHTML = `⬆️ Upgrade (+10 slots)<br><small>Custo: ${this.bankData.upgradeCost?.toLocaleString()} 💰</small>`;
            }
        }
        
        // Update guild button visibility
        if (this.guildBtn) {
            const hasGuild = this.game?.player?.guildId;
            this.guildBtn.style.display = hasGuild ? 'block' : 'none';
        }
    }
    
    selectItem(item, slotIndex) {
        this.selectedItem = { ...item, slot: slotIndex };
        
        // Highlight selected slot
        document.querySelectorAll('.bank-slot').forEach(slot => {
            slot.style.boxShadow = slot.dataset.slot == slotIndex 
                ? '0 0 15px rgba(214, 158, 46, 0.6)' 
                : 'none';
        });
        
        // Show item details
        this.showItemDetails(item, slotIndex);
    }
    
    showItemDetails(item, slotIndex) {
        this.itemDetails.style.display = 'block';
        this.itemDetails.innerHTML = `
            <h4 style="margin: 0 0 12px 0; color: ${this.getRarityColor(item.rarity)}; font-size: 16px;">
                ${item.name}
            </h4>
            <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 8px;">
                Quantidade: <span style="color: white; font-weight: 600;">${item.quantity}</span>
            </div>
            <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 15px;">
                Slot: #${slotIndex + 1}
            </div>
            ${item.depositedBy ? `
                <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 15px;">
                    Depositado por: ${item.depositedBy}
                </div>
            ` : ''}
            <button onclick="window._bankUI.withdrawItem(${slotIndex})" style="
                width: 100%;
                padding: 10px;
                background: linear-gradient(45deg, #22c55e, #16a34a);
                border: none;
                border-radius: 6px;
                color: white;
                font-weight: 600;
                cursor: pointer;
            ">⬇️ Retirar</button>
        `;
    }
    
    // ===== ACTIONS =====
    
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button styles
        this.personalBtn.style.cssText = this.getModeButtonStyle(mode === 'personal');
        this.guildBtn.style.cssText = this.getModeButtonStyle(mode === 'guild');
        
        // Update title
        this.titleEl.innerHTML = mode === 'personal' ? '🏦 Banco Pessoal' : '🏛️ Banco da Guilda';
        
        // Request data
        if (mode === 'personal') {
            this.socket?.emit('bank:open');
        } else {
            this.socket?.emit('guildbank:open');
        }
    }
    
    withdrawItem(slotIndex) {
        if (this.currentMode === 'personal') {
            this.socket?.emit('bank:withdraw', { slotIndex, quantity: this.selectedItem?.quantity || 1 });
        } else {
            this.socket?.emit('guildbank:withdraw', { slotIndex, quantity: this.selectedItem?.quantity || 1 });
        }
    }
    
    depositItem(item, quantity, targetSlot) {
        if (this.currentMode === 'personal') {
            this.socket?.emit('bank:deposit', { item, quantity, slotIndex: targetSlot });
        } else {
            this.socket?.emit('guildbank:deposit', { item, quantity, slotIndex: targetSlot });
        }
    }
    
    handleUpgrade() {
        if (this.currentMode === 'personal') {
            this.socket?.emit('bank:upgrade');
        } else {
            this.socket?.emit('guildbank:upgrade');
        }
    }
    
    showHistory() {
        this.socket?.emit('bank:history');
    }
    
    // ===== DRAG & DROP =====
    
    handleDragStart(e, item, slotIndex) {
        this.draggedItem = { ...item, fromSlot: slotIndex };
        e.dataTransfer.effectAllowed = 'move';
        this.dragOverlay.style.display = 'block';
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleDrop(e, targetSlot) {
        e.preventDefault();
        this.dragOverlay.style.display = 'none';
        
        if (!this.draggedItem) return;
        
        // Move item within bank
        if (this.currentMode === 'personal') {
            this.socket?.emit('bank:move', {
                fromSlot: this.draggedItem.fromSlot,
                toSlot: targetSlot
            });
        }
        
        this.draggedItem = null;
    }
    
    // ===== SOCKET EVENTS =====
    
    registerSocketEvents() {
        if (!this.socket) return;
        
        // Personal bank
        this.socket.on('bank:opened', (data) => {
            this.bankData = data;
            this.renderBank();
        });
        
        this.socket.on('bank:deposit_success', (data) => {
            this.game?.showFloatingText?.('Item depositado!', 0, -40, '#22c55e');
            this.socket?.emit('bank:open');
        });
        
        this.socket.on('bank:withdraw_success', (data) => {
            this.game?.showFloatingText?.('Item retirado!', 0, -40, '#22c55e');
            this.socket?.emit('bank:open');
        });
        
        this.socket.on('bank:upgrade_success', (data) => {
            this.game?.showFloatingText?.(`Banco expandido para ${data.newSlots} slots!`, 0, -40, '#d69e2e');
            this.socket?.emit('bank:open');
        });
        
        // Guild bank
        this.socket.on('guildbank:opened', (data) => {
            this.bankData = data;
            this.renderBank();
        });
        
        this.socket.on('guildbank:deposit_success', () => {
            this.game?.showFloatingText?.('Item depositado no banco da guilda!', 0, -40, '#22c55e');
            this.socket?.emit('guildbank:open');
        });
        
        this.socket.on('guildbank:withdraw_success', () => {
            this.game?.showFloatingText?.('Item retirado do banco da guilda!', 0, -40, '#22c55e');
            this.socket?.emit('guildbank:open');
        });
        
        this.socket.on('guildbank:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
        
        // Generic errors
        this.socket.on('bank:error', (data) => {
            this.game?.showFloatingText?.(data.message, 0, -40, '#ef4444');
        });
        
        // History
        this.socket.on('bank:history', (data) => {
            this.showHistoryModal(data);
        });
    }
    
    showHistoryModal(history) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            width: 500px;
            max-height: 600px;
            border: 2px solid #d69e2e;
            border-radius: 12px;
            z-index: 20000;
            overflow: hidden;
        `;
        
        let historyHTML = `
            <div style="background: linear-gradient(90deg, #d69e2e, #b7791f); padding: 15px 20px;">
                <h3 style="margin: 0; color: white;">📜 Histórico de Transações</h3>
            </div>
            <div style="padding: 20px; max-height: 450px; overflow-y: auto;">
        `;
        
        if (history.length === 0) {
            historyHTML += '<p style="text-align: center; color: rgba(255,255,255,0.5);">Nenhuma transação</p>';
        } else {
            historyHTML += '<div style="display: grid; gap: 10px;">';
            history.slice().reverse().forEach(tx => {
                const typeColors = {
                    deposit: '#22c55e',
                    withdraw: '#3b82f6',
                    transfer: '#8b5cf6'
                };
                
                historyHTML += `
                    <div style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="color: ${typeColors[tx.type] || '#fff'}; font-weight: 600; text-transform: uppercase;">
                                ${tx.type}
                            </span>
                            <span style="color: rgba(255,255,255,0.5);">
                                ${new Date(tx.timestamp).toLocaleString()}
                            </span>
                        </div>
                        <div style="color: white;">
                            ${tx.item || 'Ouro'} ${tx.quantity ? `x${tx.quantity}` : ''}
                        </div>
                    </div>
                `;
            });
            historyHTML += '</div>';
        }
        
        historyHTML += `
            </div>
            <div style="padding: 15px 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <button onclick="this.closest('.modal').remove()" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                ">Fechar</button>
            </div>
        `;
        
        modal.innerHTML = historyHTML;
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    // ===== UTILITIES =====
    
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
    
    // ===== KEYBOARD =====
    
    registerKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'b' && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
        
        // Request data
        if (this.currentMode === 'personal') {
            this.socket?.emit('bank:open');
        } else {
            this.socket?.emit('guildbank:open');
        }
        
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
window.BankUI = BankUI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BankUI;
}
