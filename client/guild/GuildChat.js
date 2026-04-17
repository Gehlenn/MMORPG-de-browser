/**
 * GuildChat.js
 * Guild chat interface for Legacy of Komodo MMORPG v0.5.0
 */

class GuildChat {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.isVisible = false;
        this.messages = [];
        this.unreadCount = 0;
        
        this.elements = {};
        this.createStyles();
        this.createUI();
        this.setupEventListeners();
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .guild-chat-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #4a4a6a;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                font-family: 'Segoe UI', Tahoma, sans-serif;
                color: #e0e0e0;
                z-index: 999;
                display: none;
                overflow: hidden;
            }
            
            .guild-chat-container.active {
                display: block;
            }
            
            .guild-chat-header {
                background: linear-gradient(90deg, #2d5a27 0%, #4a7a3f 100%);
                padding: 12px 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 10px 10px 0 0;
            }
            
            .guild-chat-title {
                font-weight: bold;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .guild-chat-badge {
                background: #ff4444;
                color: #fff;
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 18px;
                text-align: center;
            }
            
            .guild-chat-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: #fff;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
            }
            
            .guild-chat-messages {
                height: 250px;
                overflow-y: auto;
                padding: 12px;
                background: rgba(0,0,0,0.3);
            }
            
            .guild-chat-message {
                margin-bottom: 8px;
                font-size: 13px;
                line-height: 1.4;
            }
            
            .guild-chat-sender {
                font-weight: bold;
                margin-right: 6px;
            }
            
            .guild-chat-rank {
                font-size: 10px;
                opacity: 0.7;
                margin-right: 4px;
            }
            
            .guild-chat-text {
                color: #e0e0e0;
            }
            
            .guild-chat-system {
                color: #ffd700;
                font-style: italic;
                font-size: 12px;
            }
            
            .guild-chat-officer {
                background: rgba(255,215,0,0.1);
                border-left: 2px solid #ffd700;
                padding-left: 8px;
                margin-left: -8px;
            }
            
            .guild-chat-input-area {
                padding: 12px;
                background: rgba(0,0,0,0.4);
                display: flex;
                gap: 8px;
            }
            
            .guild-chat-input {
                flex: 1;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 6px;
                padding: 8px 12px;
                color: #fff;
                font-size: 13px;
                outline: none;
            }
            
            .guild-chat-input:focus {
                border-color: #4a7a3f;
            }
            
            .guild-chat-send {
                background: #4a7a3f;
                border: none;
                color: #fff;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
            }
            
            .guild-chat-send:hover {
                background: #5a8a4f;
            }
            
            .guild-chat-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #2d5a27, #4a7a3f);
                border: 2px solid #4a7a3f;
                border-radius: 50%;
                cursor: pointer;
                font-size: 24px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                z-index: 998;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .guild-chat-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(0,0,0,0.6);
            }
            
            .guild-chat-toggle.has-unread::after {
                content: attr(data-unread);
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4444;
                color: #fff;
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 18px;
                text-align: center;
            }
        `;
        document.head.appendChild(styles);
    }

    createUI() {
        // Chat container
        this.elements.container = document.createElement('div');
        this.elements.container.className = 'guild-chat-container';
        this.elements.container.innerHTML = `
            <div class="guild-chat-header">
                <div class="guild-chat-title">
                    💬 Guild Chat
                    <span class="guild-chat-badge" id="guild-chat-badge" style="display: none;">0</span>
                </div>
                <button class="guild-chat-close" id="guild-chat-close">×</button>
            </div>
            <div class="guild-chat-messages" id="guild-chat-messages"></div>
            <div class="guild-chat-input-area">
                <input type="text" class="guild-chat-input" id="guild-chat-input" placeholder="Type message..." maxlength="500">
                <button class="guild-chat-send" id="guild-chat-send">Send</button>
            </div>
        `;
        document.body.appendChild(this.elements.container);

        // Toggle button
        this.elements.toggle = document.createElement('button');
        this.elements.toggle.className = 'guild-chat-toggle';
        this.elements.toggle.innerHTML = '💬';
        this.elements.toggle.id = 'guild-chat-toggle';
        document.body.appendChild(this.elements.toggle);

        this.elements.messages = document.getElementById('guild-chat-messages');
        this.elements.input = document.getElementById('guild-chat-input');
        this.elements.badge = document.getElementById('guild-chat-badge');
    }

    setupEventListeners() {
        // Toggle button
        this.elements.toggle.addEventListener('click', () => this.toggle());

        // Close button
        document.getElementById('guild-chat-close').addEventListener('click', () => this.hide());

        // Send button
        document.getElementById('guild-chat-send').addEventListener('click', () => this.sendMessage());

        // Enter key in input
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Listen for incoming messages
        this.game.network.on('guild:chat_message', (data) => {
            this.addMessage(data);
            if (!this.isVisible) {
                this.incrementUnread();
            }
        });

        this.game.network.on('guild:system_message', (data) => {
            this.addSystemMessage(data.message);
        });

        this.game.network.on('guild:officer_chat_message', (data) => {
            this.addMessage(data, true);
            if (!this.isVisible) {
                this.incrementUnread();
            }
        });
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        this.elements.container.classList.add('active');
        this.elements.toggle.style.display = 'none';
        this.isVisible = true;
        this.resetUnread();
        this.elements.input.focus();
        this.scrollToBottom();
    }

    hide() {
        this.elements.container.classList.remove('active');
        this.elements.toggle.style.display = 'flex';
        this.isVisible = false;
    }

    addMessage(data, isOfficer = false) {
        const rankColors = {
            'LEADER': '#ffd700',
            'OFFICER': '#c0c0c0',
            'MEMBER': '#4a6fa5',
            'INITIATE': '#888'
        };

        const rankShort = {
            'LEADER': '[L]',
            'OFFICER': '[O]',
            'MEMBER': '[M]',
            'INITIATE': '[I]'
        };

        const messageEl = document.createElement('div');
        messageEl.className = `guild-chat-message ${isOfficer ? 'guild-chat-officer' : ''}`;
        
        const color = rankColors[data.senderRank] || '#888';
        const rankLabel = rankShort[data.senderRank] || '';

        messageEl.innerHTML = `
            <span class="guild-chat-rank" style="color: ${color}">${rankLabel}</span>
            <span class="guild-chat-sender" style="color: ${color}">${data.senderName}:</span>
            <span class="guild-chat-text">${this.escapeHtml(data.message)}</span>
        `;

        this.elements.messages.appendChild(messageEl);
        this.scrollToBottom();
        
        // Limit messages to 100
        while (this.elements.messages.children.length > 100) {
            this.elements.messages.removeChild(this.elements.messages.firstChild);
        }
    }

    addSystemMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'guild-chat-message guild-chat-system';
        messageEl.textContent = `⚡ ${message}`;
        this.elements.messages.appendChild(messageEl);
        this.scrollToBottom();
    }

    sendMessage() {
        const message = this.elements.input.value.trim();
        if (!message) return;

        // Check if officer chat prefix
        if (message.startsWith('/o ') || message.startsWith('/officer ')) {
            const officerMsg = message.replace(/^\/(o|officer) /, '');
            this.game.network.send('guild:officer_chat', { message: officerMsg });
        } else {
            this.game.network.send('guild:chat', { message });
        }

        this.elements.input.value = '';
    }

    incrementUnread() {
        this.unreadCount++;
        this.elements.badge.textContent = this.unreadCount;
        this.elements.badge.style.display = 'inline';
        this.elements.toggle.classList.add('has-unread');
        this.elements.toggle.setAttribute('data-unread', this.unreadCount > 99 ? '99+' : this.unreadCount);
    }

    resetUnread() {
        this.unreadCount = 0;
        this.elements.badge.style.display = 'none';
        this.elements.toggle.classList.remove('has-unread');
        this.elements.toggle.removeAttribute('data-unread');
    }

    scrollToBottom() {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Switch to guild chat from other chat UI
    switchToChannel() {
        this.show();
    }
}

module.exports = GuildChat;
