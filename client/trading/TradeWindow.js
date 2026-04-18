/**
 * TradeWindow.js
 * Client-side trade interface
 * Phase 2: Trading & Economy
 */

class TradeWindow {
    constructor(socket, inventoryManager) {
        this.socket = socket;
        this.inventoryManager = inventoryManager;
        this.isOpen = false;
        this.sessionId = null;
        this.myPlayerId = null;
        this.otherPlayerId = null;
        this.myItems = new Array(6).fill(null);
        this.otherItems = new Array(6).fill(null);
        this.myGold = 0;
        this.otherGold = 0;
        this.myConfirmed = false;
        this.otherConfirmed = false;
        this.isPlayer1 = false;

        this.setupSocketListeners();
        this.createDOM();
    }

    createDOM() {
        // Create trade window container
        this.container = document.createElement('div');
        this.container.id = 'trade-window';
        this.container.className = 'trade-window hidden';
        this.container.innerHTML = `
            <div class="trade-header">
                <h3>💱 Player Trade</h3>
                <button class="trade-close-btn">&times;</button>
            </div>
            <div class="trade-content">
                <div class="trade-side trade-my-side">
                    <div class="trade-player-name">You</div>
                    <div class="trade-slots" id="trade-my-slots"></div>
                    <div class="trade-gold">
                        <label>Gold: <input type="number" id="trade-my-gold" min="0" value="0"></label>
                        <button id="trade-set-gold-btn">Set</button>
                    </div>
                    <div class="trade-status" id="trade-my-status">Not confirmed</div>
                </div>
                <div class="trade-divider">
                    <div class="trade-arrow">⇄</div>
                </div>
                <div class="trade-side trade-other-side">
                    <div class="trade-player-name" id="trade-other-name">Other Player</div>
                    <div class="trade-slots" id="trade-other-slots"></div>
                    <div class="trade-gold" id="trade-other-gold">Gold: 0</div>
                    <div class="trade-status" id="trade-other-status">Not confirmed</div>
                </div>
            </div>
            <div class="trade-actions">
                <button id="trade-confirm-btn" class="trade-btn trade-confirm">Confirm Trade</button>
                <button id="trade-cancel-btn" class="trade-btn trade-cancel">Cancel</button>
            </div>
        `;

        document.body.appendChild(this.container);

        // Create drag overlay for inventory items
        this.dragOverlay = document.createElement('div');
        this.dragOverlay.id = 'trade-drag-overlay';
        this.dragOverlay.className = 'drag-overlay hidden';
        this.dragOverlay.innerHTML = '<div class="drag-hint">Drop item here to trade</div>';
        document.body.appendChild(this.dragOverlay);

        this.bindEvents();
    }

    bindEvents() {
        // Close button
        this.container.querySelector('.trade-close-btn').addEventListener('click', () => {
            this.cancelTrade();
        });

        // Set gold button
        this.container.querySelector('#trade-set-gold-btn').addEventListener('click', () => {
            const amount = parseInt(this.container.querySelector('#trade-my-gold').value) || 0;
            this.setGold(amount);
        });

        // Confirm button
        this.container.querySelector('#trade-confirm-btn').addEventListener('click', () => {
            this.confirmTrade();
        });

        // Cancel button
        this.container.querySelector('#trade-cancel-btn').addEventListener('click', () => {
            this.cancelTrade();
        });

        // Drag and drop for trade slots
        this.container.querySelectorAll('.trade-slots').forEach(slotsContainer => {
            slotsContainer.addEventListener('dragover', (e) => this.handleDragOver(e));
            slotsContainer.addEventListener('drop', (e) => this.handleDrop(e));
            slotsContainer.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.cancelTrade();
            }
        });
    }

    setupSocketListeners() {
        // Trade requested
        this.socket.on('trade:request_received', (data) => {
            this.showTradeRequest(data);
        });

        // Trade started
        this.socket.on('trade:session_started', (data) => {
            this.openTrade(data.session);
        });

        // Trade declined
        this.socket.on('trade:declined', (data) => {
            this.showNotification('Trade declined by other player', 'error');
            this.close();
        });

        // Trade cancelled
        this.socket.on('trade:cancelled', (data) => {
            this.showNotification('Trade cancelled', 'error');
            this.close();
        });

        // Gold updated
        this.socket.on('trade:gold_updated', (data) => {
            this.updateGold(data);
        });

        // Item added
        this.socket.on('trade:item_added', (data) => {
            this.addItemToTrade(data.playerId, data.item, data.slotIndex);
        });

        // Item removed
        this.socket.on('trade:item_removed', (data) => {
            this.removeItemFromTrade(data.playerId, data.slotIndex);
        });

        // Player confirmed
        this.socket.on('trade:confirmed', (data) => {
            this.updateConfirmation(data.playerId, true);
        });

        // Trade completed
        this.socket.on('trade:completed', (data) => {
            this.showNotification('Trade completed successfully!', 'success');
            this.close();
        });
    }

    showTradeRequest(data) {
        // Create modal for trade request
        const modal = document.createElement('div');
        modal.className = 'trade-request-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Trade Request</h3>
                <p><strong>${data.requesterName}</strong> wants to trade with you.</p>
                <div class="modal-actions">
                    <button class="btn-accept" onclick="this.closest('.trade-request-modal').accept()">Accept</button>
                    <button class="btn-decline" onclick="this.closest('.trade-request-modal').decline()">Decline</button>
                </div>
            </div>
        `;

        modal.accept = () => {
            this.socket.emit('trade:accept', { sessionId: data.sessionId }, (response) => {
                if (response.success) {
                    this.openTrade(response.session);
                } else {
                    this.showNotification(response.error, 'error');
                }
            });
            modal.remove();
        };

        modal.decline = () => {
            this.socket.emit('trade:decline', { sessionId: data.sessionId });
            modal.remove();
        };

        document.body.appendChild(modal);

        // Auto-decline after 30 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.decline();
            }
        }, 30000);
    }

    requestTrade(targetId) {
        this.socket.emit('trade:request', { targetId }, (response) => {
            if (response.success) {
                this.showNotification('Trade request sent', 'info');
            } else {
                this.showNotification(response.error, 'error');
            }
        });
    }

    openTrade(session) {
        this.sessionId = session.id;
        this.isPlayer1 = session.player1.id === this.myPlayerId;
        this.otherPlayerId = this.isPlayer1 ? session.player2.id : session.player1.id;

        // Update UI
        const otherName = this.isPlayer1 ? 'Player 2' : 'Player 1';
        this.container.querySelector('#trade-other-name').textContent = otherName;

        // Reset state
        this.myItems = new Array(6).fill(null);
        this.otherItems = new Array(6).fill(null);
        this.myGold = 0;
        this.otherGold = 0;
        this.myConfirmed = false;
        this.otherConfirmed = false;

        this.renderSlots();
        this.updateStatus();

        // Show window
        this.container.classList.remove('hidden');
        this.isOpen = true;
    }

    renderSlots() {
        const mySlots = this.container.querySelector('#trade-my-slots');
        const otherSlots = this.container.querySelector('#trade-other-slots');

        mySlots.innerHTML = '';
        otherSlots.innerHTML = '';

        for (let i = 0; i < 6; i++) {
            // My slot
            const mySlot = document.createElement('div');
            mySlot.className = 'trade-slot';
            mySlot.dataset.slot = i;
            if (this.myItems[i]) {
                mySlot.innerHTML = this.renderItem(this.myItems[i]);
                mySlot.classList.add('filled');
            }
            mySlots.appendChild(mySlot);

            // Other slot
            const otherSlot = document.createElement('div');
            otherSlot.className = 'trade-slot other';
            if (this.otherItems[i]) {
                otherSlot.innerHTML = this.renderItem(this.otherItems[i]);
                otherSlot.classList.add('filled');
            }
            otherSlots.appendChild(otherSlot);
        }
    }

    renderItem(item) {
        return `
            <div class="trade-item rarity-${item.rarity || 'common'}">
                <img src="${item.icon || 'assets/items/default.png'}" alt="${item.name}">
                <span class="item-name">${item.name}</span>
            </div>
        `;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        const slotIndex = parseInt(e.target.closest('.trade-slot')?.dataset.slot);
        if (slotIndex === undefined) return;

        // Get dragged item from inventory
        const itemData = e.dataTransfer.getData('application/json');
        if (!itemData) return;

        const item = JSON.parse(itemData);
        this.addItem(item, slotIndex);
    }

    addItem(item, slotIndex) {
        if (this.myConfirmed) {
            this.showNotification('Cannot modify trade after confirming', 'error');
            return;
        }

        this.socket.emit('trade:add_item', {
            sessionId: this.sessionId,
            item,
            slotIndex
        }, (response) => {
            if (!response.success) {
                this.showNotification(response.error, 'error');
            }
        });
    }

    addItemToTrade(playerId, item, slotIndex) {
        if (playerId === this.myPlayerId) {
            this.myItems[slotIndex] = item;
        } else {
            this.otherItems[slotIndex] = item;
        }
        this.renderSlots();
    }

    removeItemFromTrade(playerId, slotIndex) {
        if (playerId === this.myPlayerId) {
            this.myItems[slotIndex] = null;
        } else {
            this.otherItems[slotIndex] = null;
        }
        this.renderSlots();
    }

    setGold(amount) {
        if (this.myConfirmed) {
            this.showNotification('Cannot modify trade after confirming', 'error');
            return;
        }

        this.socket.emit('trade:add_gold', {
            sessionId: this.sessionId,
            amount
        }, (response) => {
            if (!response.success) {
                this.showNotification(response.error, 'error');
            }
        });
    }

    updateGold(data) {
        this.myGold = this.isPlayer1 ? data.player1_gold : data.player2_gold;
        this.otherGold = this.isPlayer1 ? data.player2_gold : data.player1_gold;

        this.container.querySelector('#trade-my-gold').value = this.myGold;
        this.container.querySelector('#trade-other-gold').textContent = `Gold: ${this.otherGold}`;

        // Reset confirmations when gold changes
        this.myConfirmed = false;
        this.otherConfirmed = false;
        this.updateStatus();
    }

    confirmTrade() {
        this.socket.emit('trade:confirm', { sessionId: this.sessionId }, (response) => {
            if (response.success) {
                this.myConfirmed = true;
                this.updateStatus();

                if (response.waitingForOther) {
                    this.showNotification('Waiting for other player to confirm...', 'info');
                }
            } else {
                this.showNotification(response.error, 'error');
            }
        });
    }

    updateConfirmation(playerId, confirmed) {
        if (playerId === this.myPlayerId) {
            this.myConfirmed = confirmed;
        } else {
            this.otherConfirmed = confirmed;
        }
        this.updateStatus();
    }

    updateStatus() {
        const myStatus = this.container.querySelector('#trade-my-status');
        const otherStatus = this.container.querySelector('#trade-other-status');
        const confirmBtn = this.container.querySelector('#trade-confirm-btn');

        myStatus.textContent = this.myConfirmed ? '✅ Confirmed' : 'Not confirmed';
        myStatus.className = this.myConfirmed ? 'confirmed' : '';

        otherStatus.textContent = this.otherConfirmed ? '✅ Confirmed' : 'Not confirmed';
        otherStatus.className = this.otherConfirmed ? 'confirmed' : '';

        confirmBtn.disabled = this.myConfirmed;
        confirmBtn.textContent = this.myConfirmed ? 'Confirmed' : 'Confirm Trade';
    }

    cancelTrade() {
        this.socket.emit('trade:cancel', { sessionId: this.sessionId });
        this.close();
    }

    close() {
        this.container.classList.add('hidden');
        this.isOpen = false;
        this.sessionId = null;
    }

    showNotification(message, type) {
        // Use your game's notification system
        if (window.gameNotification) {
            window.gameNotification.show(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TradeWindow;
}
