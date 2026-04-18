/**
 * TradeChat.js
 * Trade chat channel for WTB/WTS messages
 * Phase 2: Trading & Economy
 */

class TradeChat {
    constructor(socket) {
        this.socket = socket;
        this.isOpen = false;
        this.messages = [];
        this.maxMessages = 100;
        this.messageHistory = []; // For arrow key navigation
        this.historyIndex = -1;
        this.filters = {
            wtb: true,
            wts: true,
            priceCheck: true,
            general: true
        };

        this.setupSocketListeners();
        this.createDOM();
    }

    createDOM() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'trade-chat';
        this.container.className = 'trade-chat hidden';
        this.container.innerHTML = `
            <div class="trade-chat-header">
                <h3>💬 Trade Chat</h3>
                <div class="trade-chat-filters">
                    <label><input type="checkbox" id="filter-wtb" checked> WTB</label>
                    <label><input type="checkbox" id="filter-wts" checked> WTS</label>
                    <label><input type="checkbox" id="filter-pc" checked> PC</label>
                    <label><input type="checkbox" id="filter-general" checked> General</label>
                </div>
                <button class="trade-chat-close">&times;</button>
            </div>
            <div class="trade-chat-messages" id="trade-chat-messages"></div>
            <div class="trade-chat-input-area">
                <div class="message-type-selector">
                    <button class="msg-type-btn active" data-type="GENERAL">General</button>
                    <button class="msg-type-btn" data-type="WTB">WTB</button>
                    <button class="msg-type-btn" data-type="WTS">WTS</button>
                    <button class="msg-type-btn" data-type="PRICE_CHECK">PC</button>
                </div>
                <div class="input-row">
                    <input type="text" id="trade-chat-input" placeholder="Type your message... (Shift+Click item to link)" maxlength="200">
                    <button id="trade-chat-send">Send</button>
                </div>
                <div class="input-hints">
                    <span>Press <kbd>T</kbd> to toggle</span>
                    <span>Shift+Click item to link</span>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);

        // Linked item preview popup
        this.linkPreview = document.createElement('div');
        this.linkPreview.id = 'link-preview';
        this.linkPreview.className = 'link-preview hidden';
        document.body.appendChild(this.linkPreview);

        this.bindEvents();
    }

    bindEvents() {
        // Close button
        this.container.querySelector('.trade-chat-close').addEventListener('click', () => {
            this.close();
        });

        // Filters
        this.container.querySelector('#filter-wtb').addEventListener('change', (e) => {
            this.filters.wtb = e.target.checked;
            this.renderMessages();
        });

        this.container.querySelector('#filter-wts').addEventListener('change', (e) => {
            this.filters.wts = e.target.checked;
            this.renderMessages();
        });

        this.container.querySelector('#filter-pc').addEventListener('change', (e) => {
            this.filters.priceCheck = e.target.checked;
            this.renderMessages();
        });

        this.container.querySelector('#filter-general').addEventListener('change', (e) => {
            this.filters.general = e.target.checked;
            this.renderMessages();
        });

        // Message type selector
        this.container.querySelectorAll('.msg-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.container.querySelectorAll('.msg-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Send button
        this.container.querySelector('#trade-chat-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        this.container.querySelector('#trade-chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Arrow key history
        this.container.querySelector('#trade-chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            }
        });

        // Keyboard shortcut (T)
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' || e.key === 'T') {
                // Don't trigger if typing in an input
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                this.toggle();
            }

            // ESC to close
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Link item on shift+click
        document.addEventListener('click', (e) => {
            if (e.shiftKey && e.target.closest('.inventory-item')) {
                const itemEl = e.target.closest('.inventory-item');
                const itemData = itemEl.dataset.item;
                if (itemData) {
                    this.linkItem(JSON.parse(itemData));
                }
            }
        });
    }

    setupSocketListeners() {
        // Receive message
        this.socket.on('trade_chat:message', (data) => {
            this.addMessage(data);
        });

        // Load history
        this.socket.emit('trade_chat:history', { limit: 50 }, (response) => {
            if (response.success) {
                this.messages = response.messages;
                this.renderMessages();
            }
        });
    }

    open() {
        this.container.classList.remove('hidden');
        this.isOpen = true;
        this.scrollToBottom();

        // Load history if empty
        if (this.messages.length === 0) {
            this.socket.emit('trade_chat:history', { limit: 50 }, (response) => {
                if (response.success) {
                    this.messages = response.messages;
                    this.renderMessages();
                }
            });
        }
    }

    close() {
        this.container.classList.add('hidden');
        this.isOpen = false;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    sendMessage() {
        const input = this.container.querySelector('#trade-chat-input');
        const message = input.value.trim();

        if (!message) return;

        // Get selected message type
        const activeTypeBtn = this.container.querySelector('.msg-type-btn.active');
        const messageType = activeTypeBtn ? activeTypeBtn.dataset.type : 'GENERAL';

        // Add prefix based on type
        let finalMessage = message;
        if (messageType === 'WTB' && !message.toLowerCase().startsWith('wtb')) {
            finalMessage = `[WTB] ${message}`;
        } else if (messageType === 'WTS' && !message.toLowerCase().startsWith('wts')) {
            finalMessage = `[WTS] ${message}`;
        } else if (messageType === 'PRICE_CHECK' && !message.toLowerCase().startsWith('pc')) {
            finalMessage = `[PC] ${message}`;
        }

        // Get linked item if any
        const linkedItem = this.pendingLinkedItem || null;

        this.socket.emit('trade_chat:message', {
            message: finalMessage,
            messageType,
            linkedItem
        }, (response) => {
            if (!response.success) {
                this.showError(response.error);
            }
        });

        // Save to history
        this.messageHistory.push(finalMessage);
        if (this.messageHistory.length > 20) {
            this.messageHistory.shift();
        }
        this.historyIndex = this.messageHistory.length;

        // Clear input
        input.value = '';
        this.pendingLinkedItem = null;
    }

    navigateHistory(direction) {
        if (this.messageHistory.length === 0) return;

        this.historyIndex += direction;

        if (this.historyIndex < 0) {
            this.historyIndex = 0;
        } else if (this.historyIndex >= this.messageHistory.length) {
            this.historyIndex = this.messageHistory.length;
            this.container.querySelector('#trade-chat-input').value = '';
            return;
        }

        this.container.querySelector('#trade-chat-input').value = this.messageHistory[this.historyIndex];
    }

    linkItem(item) {
        this.pendingLinkedItem = item;

        const input = this.container.querySelector('#trade-chat-input');
        const currentValue = input.value;

        // Add item link tag
        input.value = currentValue + ` [${item.name}]`;
        input.focus();

        this.showNotification(`Linked: ${item.name}`, 'info');
    }

    addMessage(data) {
        this.messages.push(data);

        // Keep only last N messages
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }

        // Render if passes filters
        if (this.shouldShowMessage(data)) {
            this.renderSingleMessage(data);
            this.scrollToBottom();
        }
    }

    shouldShowMessage(data) {
        const type = data.messageType || 'GENERAL';

        switch (type) {
            case 'WTB': return this.filters.wtb;
            case 'WTS': return this.filters.wts;
            case 'PRICE_CHECK': return this.filters.priceCheck;
            default: return this.filters.general;
        }
    }

    renderMessages() {
        const container = this.container.querySelector('#trade-chat-messages');
        container.innerHTML = '';

        this.messages.forEach(msg => {
            if (this.shouldShowMessage(msg)) {
                this.renderSingleMessage(msg);
            }
        });

        this.scrollToBottom();
    }

    renderSingleMessage(data) {
        const container = this.container.querySelector('#trade-chat-messages');

        const msgEl = document.createElement('div');
        msgEl.className = `trade-message ${data.messageType?.toLowerCase() || 'general'}`;

        const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Parse message type badge
        let badge = '';
        if (data.messageType === 'WTB') {
            badge = '<span class="badge wtb">WTB</span>';
        } else if (data.messageType === 'WTS') {
            badge = '<span class="badge wts">WTS</span>';
        } else if (data.messageType === 'PRICE_CHECK') {
            badge = '<span class="badge pc">PC</span>';
        }

        // Format linked item
        let linkedItemHtml = '';
        if (data.linkedItem) {
            linkedItemHtml = `
                <span class="linked-item rarity-${data.linkedItem.rarity || 'common'}"
                      data-item='${JSON.stringify(data.linkedItem)}'>
                    📦 ${data.linkedItem.name}
                </span>
            `;
        }

        // Replace [Item Name] with styled span
        let formattedMessage = this.escapeHtml(data.message);
        formattedMessage = formattedMessage.replace(/\[([^\]]+)\]/g, (match, itemName) => {
            if (data.linkedItem && itemName === data.linkedItem.name) {
                return linkedItemHtml;
            }
            return match;
        });

        msgEl.innerHTML = `
            <span class="msg-time">${time}</span>
            <span class="msg-author">${this.escapeHtml(data.playerName)}:</span>
            ${badge}
            <span class="msg-text">${formattedMessage}</span>
        `;

        // Add click handler for linked items
        const linkedItemEl = msgEl.querySelector('.linked-item');
        if (linkedItemEl) {
            linkedItemEl.addEventListener('click', (e) => {
                const itemData = JSON.parse(e.target.dataset.item);
                this.showItemTooltip(e.target, itemData);
            });
        }

        container.appendChild(msgEl);
    }

    showItemTooltip(element, item) {
        const preview = this.linkPreview;
        preview.innerHTML = `
            <div class="item-tooltip rarity-${item.rarity || 'common'}">
                <h4>${item.name}</h4>
                <p class="item-level">Level ${item.level || 1} ${item.rarity || 'common'}</p>
                ${item.stats ? Object.entries(item.stats).map(([stat, value]) => `
                    <p class="item-stat">+${value} ${stat}</p>
                `).join('') : ''}
                ${item.description ? `<p class="item-desc">${item.description}</p>` : ''}
            </div>
        `;

        const rect = element.getBoundingClientRect();
        preview.style.left = `${rect.left}px`;
        preview.style.top = `${rect.bottom + 5}px`;
        preview.classList.remove('hidden');

        // Hide on click outside
        const hideTooltip = (e) => {
            if (!preview.contains(e.target) && e.target !== element) {
                preview.classList.add('hidden');
                document.removeEventListener('click', hideTooltip);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', hideTooltip);
        }, 100);
    }

    scrollToBottom() {
        const container = this.container.querySelector('#trade-chat-messages');
        container.scrollTop = container.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        // Show error near input
        const input = this.container.querySelector('#trade-chat-input');
        input.classList.add('error');

        const errorEl = document.createElement('div');
        errorEl.className = 'input-error';
        errorEl.textContent = message;

        input.parentNode.appendChild(errorEl);

        setTimeout(() => {
            input.classList.remove('error');
            errorEl.remove();
        }, 3000);
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
    module.exports = TradeChat;
}
