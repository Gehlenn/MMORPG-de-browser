/**
 * Chat System - Social Communication
 * Multi-channel chat with moderation and features
 * Version 0.3 - Social & Multiplayer Systems
 */

class ChatSystem {
    constructor(networkManager) {
        this.networkManager = networkManager;
        
        // Chat channels
        this.channels = new Map();
        this.activeChannel = 'global';
        this.channelHistory = new Map();
        
        // Chat settings
        this.settings = {
            fontSize: 14,
            maxMessages: 100,
            timestamps: true,
            fadeMessages: true,
            wordFilter: true,
            spamProtection: true
        };
        
        // User interface
        this.chatContainer = null;
        this.inputElement = null;
        this.channelTabs = null;
        this.isVisible = true;
        
        // Message queue
        this.messageQueue = [];
        this.lastMessageTime = 0;
        this.messageLimit = 5; // Max 5 messages per 10 seconds
        
        // Moderation
        this.mutedUsers = new Set();
        this.blockedUsers = new Set();
        this.reportedMessages = new Map();
        
        // Chat commands
        this.commands = new Map();
        this.aliases = new Map();
        
        // Initialize
        this.initializeChannels();
        this.initializeCommands();
        this.createUI();
        this.setupEventHandlers();
    }
    
    initializeChannels() {
        // Default channels
        this.addChannel('global', {
            name: 'Global',
            color: '#ffffff',
            description: 'Chat global com todos os jogadores',
            permissions: 'everyone'
        });
        
        this.addChannel('local', {
            name: 'Local',
            color: '#4ade80',
            description: 'Chat com jogadores próximos',
            permissions: 'everyone',
            range: 500
        });
        
        this.addChannel('party', {
            name: 'Party',
            color: '#3b82f6',
            description: 'Chat com membros da party',
            permissions: 'party_only'
        });
        
        this.addChannel('guild', {
            name: 'Guild',
            color: '#f59e0b',
            description: 'Chat com membros da guild',
            permissions: 'guild_only'
        });
        
        this.addChannel('trade', {
            name: 'Comércio',
            color: '#10b981',
            description: 'Chat para negociação de itens',
            permissions: 'everyone'
        });
        
        this.addChannel('help', {
            name: 'Ajuda',
            color: '#8b5cf6',
            description: 'Chat para dúvidas e ajuda',
            permissions: 'everyone'
        });
        
        this.addChannel('system', {
            name: 'Sistema',
            color: '#ef4444',
            description: 'Mensagens do sistema',
            permissions: 'read_only'
        });
    }
    
    initializeCommands() {
        // Basic commands
        this.addCommand('help', this.showHelp.bind(this), 'Mostrar comandos disponíveis');
        this.addCommand('clear', this.clearChat.bind(this), 'Limpar chat atual');
        this.addCommand('whisper', this.whisper.bind(this), 'Enviar mensagem privada (/whisper <player> <message>)');
        this.addCommand('w', this.whisper.bind(this), 'Atalho para whisper');
        this.addCommand('mute', this.muteUser.bind(this), 'Silenciar usuário (/mute <player>)');
        this.addCommand('unmute', this.unmuteUser.bind(this), 'Remover silêncio (/unmute <player>)');
        this.addCommand('block', this.blockUser.bind(this), 'Bloquear usuário (/block <player>)');
        this.addCommand('report', this.reportMessage.bind(this), 'Reportar mensagem (/report <message_id>)');
        this.addCommand('join', this.joinChannel.bind(this), 'Entrar em canal (/join <channel>)');
        this.addCommand('leave', this.leaveChannel.bind(this), 'Sair de canal (/leave <channel>)');
        this.addCommand('channels', this.showChannels.bind(this), 'Mostrar canais disponíveis');
        
        // Fun commands
        this.addCommand('dance', this.emote.bind(this, 'dance'), '🕺 Dançar');
        this.addCommand('wave', this.emote.bind(this, 'wave'), '👋 Acenar');
        this.addCommand('bow', this.emote.bind(this, 'bow'), '🙇 Curvar-se');
        this.addCommand('laugh', this.emote.bind(this, 'laugh'), '😀 Rir');
        this.addCommand('cry', this.emote.bind(this, 'cry'), '😢 Chorar');
        this.addCommand('angry', this.emote.bind(this, 'angry'), '😠 Raiva');
        
        // Aliases
        this.addAlias('?', 'help');
        this.addAlias('c', 'clear');
        this.addAlias('tell', 'whisper');
        this.addAlias('msg', 'whisper');
        this.addAlias('j', 'join');
        this.addAlias('l', 'leave');
        this.addAlias('ch', 'channels');
    }
    
    createUI() {
        // Create main chat container
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'chat-system';
        this.chatContainer.innerHTML = `
            <div class="chat-header">
                <div class="chat-tabs"></div>
                <div class="chat-controls">
                    <button class="chat-toggle" title="Minimizar">_</button>
                    <button class="chat-clear" title="Limpar">✕</button>
                </div>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" placeholder="Digite sua mensagem..." maxlength="200">
                <button class="chat-send">Enviar</button>
            </div>
        `;
        
        // Style the chat system
        this.chatContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 400px;
            height: 300px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #444;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: ${this.settings.fontSize}px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
        `;
        
        // Add to page
        document.body.appendChild(this.chatContainer);
        
        // Get references
        this.messagesContainer = this.chatContainer.querySelector('.chat-messages');
        this.inputElement = this.chatContainer.querySelector('.chat-input');
        this.channelTabs = this.chatContainer.querySelector('.chat-tabs');
        
        // Style sub-elements
        this.messagesContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            border-bottom: 1px solid #444;
        `;
        
        this.inputElement.style.cssText = `
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 8px;
            font-size: ${this.settings.fontSize}px;
        `;
        
        // Create channel tabs
        this.createChannelTabs();
        
        // Setup input handling
        this.setupInputHandling();
    }
    
    createChannelTabs() {
        this.channelTabs.innerHTML = '';
        
        for (const [channelId, channel] of this.channels) {
            const tab = document.createElement('button');
            tab.className = 'channel-tab';
            tab.textContent = channel.name;
            tab.style.cssText = `
                background: ${channelId === this.activeChannel ? channel.color : 'transparent'};
                color: white;
                border: 1px solid ${channel.color};
                padding: 4px 8px;
                margin: 2px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            `;
            
            tab.addEventListener('click', () => {
                this.switchChannel(channelId);
            });
            
            this.channelTabs.appendChild(tab);
        }
    }
    
    setupInputHandling() {
        // Enter key to send message
        this.inputElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Send button
        const sendButton = this.chatContainer.querySelector('.chat-send');
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Control buttons
        const toggleButton = this.chatContainer.querySelector('.chat-toggle');
        toggleButton.addEventListener('click', () => {
            this.toggleVisibility();
        });
        
        const clearButton = this.chatContainer.querySelector('.chat-clear');
        clearButton.addEventListener('click', () => {
            this.clearCurrentChannel();
        });
    }
    
    setupEventHandlers() {
        // Network message handler
        this.networkManager.registerHandler('chat_message', (data) => {
            this.receiveMessage(data);
        });
        
        // System messages
        this.networkManager.registerHandler('system_message', (data) => {
            this.addSystemMessage(data.message, data.type);
        });
        
        // Channel updates
        this.networkManager.registerHandler('channel_update', (data) => {
            this.updateChannel(data.channelId, data.updates);
        });
    }
    
    // Channel management
    addChannel(channelId, config) {
        this.channels.set(channelId, {
            id: channelId,
            ...config,
            messages: [],
            unreadCount: 0,
            joined: true
        });
        
        this.channelHistory.set(channelId, []);
    }
    
    switchChannel(channelId) {
        if (!this.channels.has(channelId)) {
            return false;
        }
        
        this.activeChannel = channelId;
        this.loadChannelMessages(channelId);
        this.updateChannelTabs();
        
        // Clear unread count
        const channel = this.channels.get(channelId);
        if (channel) {
            channel.unreadCount = 0;
        }
        
        return true;
    }
    
    loadChannelMessages(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) return;
        
        this.messagesContainer.innerHTML = '';
        
        for (const message of channel.messages) {
            this.renderMessage(message);
        }
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    updateChannelTabs() {
        const tabs = this.channelTabs.querySelectorAll('.channel-tab');
        
        tabs.forEach((tab, index) => {
            const channelId = Array.from(this.channels.keys())[index];
            const channel = this.channels.get(channelId);
            
            if (channel) {
                tab.style.background = channelId === this.activeChannel ? channel.color : 'transparent';
                
                // Show unread count
                if (channel.unreadCount > 0 && channelId !== this.activeChannel) {
                    tab.textContent = `${channel.name} (${channel.unreadCount})`;
                } else {
                    tab.textContent = channel.name;
                }
            }
        });
    }
    
    // Message handling
    sendMessage() {
        const message = this.inputElement.value.trim();
        
        if (!message) return;
        
        // Check for commands
        if (message.startsWith('/')) {
            this.handleCommand(message);
            this.inputElement.value = '';
            return;
        }
        
        // Spam protection
        if (this.settings.spamProtection && !this.canSendMessage()) {
            this.addSystemMessage('Aguarde antes de enviar outra mensagem.', 'error');
            return;
        }
        
        // Word filter
        if (this.settings.wordFilter && this.containsBadWords(message)) {
            this.addSystemMessage('Sua mensagem contém palavras inadequadas.', 'error');
            return;
        }
        
        // Send message
        const messageData = {
            channel: this.activeChannel,
            message: message,
            timestamp: Date.now()
        };
        
        this.networkManager.sendChatMessage(this.activeChannel, message);
        
        // Add to local chat immediately
        this.addMessage({
            playerId: window.game?.player?.id || 'local',
            playerName: window.game?.player?.name || 'Você',
            channel: this.activeChannel,
            message: message,
            timestamp: Date.now(),
            local: true
        });
        
        this.inputElement.value = '';
        this.lastMessageTime = Date.now();
    }
    
    receiveMessage(data) {
        // Check if user is blocked
        if (this.blockedUsers.has(data.playerId)) {
            return;
        }
        
        // Check if user is muted
        if (this.mutedUsers.has(data.playerId)) {
            return;
        }
        
        this.addMessage(data);
    }
    
    addMessage(data) {
        const channel = this.channels.get(data.channel);
        if (!channel) return;
        
        // Add to channel history
        channel.messages.push(data);
        
        // Limit message count
        if (channel.messages.length > this.settings.maxMessages) {
            channel.messages.shift();
        }
        
        // Render if active channel
        if (data.channel === this.activeChannel) {
            this.renderMessage(data);
        } else {
            // Increment unread count
            channel.unreadCount++;
            this.updateChannelTabs();
        }
        
        // Store in global history
        const history = this.channelHistory.get(data.channel);
        if (history) {
            history.push(data);
        }
    }
    
    renderMessage(data) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message';
        
        const channel = this.channels.get(data.channel);
        const channelColor = channel ? channel.color : '#ffffff';
        
        // Format timestamp
        const timestamp = this.settings.timestamps ? 
            `[${new Date(data.timestamp).toLocaleTimeString()}] ` : '';
        
        // Player name color based on type
        let playerNameColor = '#ffffff';
        if (data.playerId === window.game?.player?.id) {
            playerNameColor = '#4ade80'; // Green for self
        } else if (data.playerType === 'gm') {
            playerNameColor = '#f59e0b'; // Gold for GM
        } else if (data.playerType === 'admin') {
            playerNameColor = '#ef4444'; // Red for admin
        }
        
        messageElement.innerHTML = `
            <span style="color: #888; font-size: 11px;">${timestamp}</span>
            <span style="color: ${playerNameColor}; font-weight: bold;">${data.playerName}:</span>
            <span style="color: ${channelColor};">${this.formatMessage(data.message)}</span>
        `;
        
        messageElement.style.cssText = `
            margin: 2px 0;
            padding: 2px 4px;
            border-radius: 2px;
            word-wrap: break-word;
        `;
        
        // Add hover effect
        messageElement.addEventListener('mouseenter', () => {
            messageElement.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        messageElement.addEventListener('mouseleave', () => {
            messageElement.style.background = 'transparent';
        });
        
        // Right-click for options
        messageElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showMessageMenu(e, data);
        });
        
        this.messagesContainer.appendChild(messageElement);
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        // Fade old messages
        if (this.settings.fadeMessages) {
            this.fadeOldMessages();
        }
    }
    
    formatMessage(message) {
        // Replace emoticons
        const emoticons = {
            ':)': '😊',
            ':(': '😢',
            ':D': '😀',
            ':P': '😛',
            ';)': '😉',
            ':o': '😮',
            ':heart:': '❤️',
            ':star:': '⭐'
        };
        
        let formatted = message;
        for (const [emoticon, emoji] of Object.entries(emoticons)) {
            formatted = formatted.replace(new RegExp(emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
        }
        
        return formatted;
    }
    
    addSystemMessage(message, type = 'info') {
        const colors = {
            info: '#3b82f6',
            warning: '#f59e0b',
            error: '#ef4444',
            success: '#10b981'
        };
        
        this.addMessage({
            playerId: 'system',
            playerName: 'Sistema',
            channel: 'system',
            message: message,
            timestamp: Date.now(),
            messageType: type
        });
    }
    
    // Commands
    handleCommand(message) {
        const parts = message.slice(1).split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        // Check aliases
        const actualCommand = this.aliases.get(command) || command;
        
        const commandHandler = this.commands.get(actualCommand);
        if (commandHandler) {
            try {
                commandHandler(args);
            } catch (error) {
                this.addSystemMessage(`Erro no comando: ${error.message}`, 'error');
            }
        } else {
            this.addSystemMessage(`Comando desconhecido: ${command}. Digite /help para ver comandos.`, 'error');
        }
    }
    
    addCommand(name, handler, description) {
        this.commands.set(name, { handler, description });
    }
    
    addAlias(alias, command) {
        this.aliases.set(alias, command);
    }
    
    // Command implementations
    showHelp(args) {
        const helpText = [
            '📋 Comandos Disponíveis:',
            '/help - Mostrar esta ajuda',
            '/clear - Limpar chat atual',
            '/whisper <player> <msg> - Mensagem privada',
            '/mute <player> - Silenciar usuário',
            '/block <player> - Bloquear usuário',
            '/join <channel> - Entrar em canal',
            '/channels - Mostrar canais',
            '',
            '🎭 Emotes:',
            '/dance, /wave, /bow, /laugh, /cry, /angry'
        ];
        
        for (const line of helpText) {
            this.addSystemMessage(line, 'info');
        }
    }
    
    clearChat(args) {
        this.clearCurrentChannel();
        this.addSystemMessage('Chat limpo.', 'success');
    }
    
    whisper(args) {
        if (args.length < 2) {
            this.addSystemMessage('Uso: /whisper <player> <message>', 'error');
            return;
        }
        
        const targetPlayer = args[0];
        const message = args.slice(1).join(' ');
        
        this.networkManager.sendChatMessage('whisper', {
            target: targetPlayer,
            message: message
        });
        
        this.addSystemMessage(`Mensagem enviada para ${targetPlayer}: ${message}`, 'info');
    }
    
    muteUser(args) {
        if (args.length === 0) {
            this.addSystemMessage('Uso: /mute <player>', 'error');
            return;
        }
        
        const player = args[0];
        this.mutedUsers.add(player);
        this.addSystemMessage(`${player} foi silenciado.`, 'success');
    }
    
    unmuteUser(args) {
        if (args.length === 0) {
            this.addSystemMessage('Uso: /unmute <player>', 'error');
            return;
        }
        
        const player = args[0];
        this.mutedUsers.delete(player);
        this.addSystemMessage(`${player} não está mais silenciado.`, 'success');
    }
    
    blockUser(args) {
        if (args.length === 0) {
            this.addSystemMessage('Uso: /block <player>', 'error');
            return;
        }
        
        const player = args[0];
        this.blockedUsers.add(player);
        this.addSystemMessage(`${player} foi bloqueado.`, 'success');
    }
    
    reportMessage(args) {
        if (args.length === 0) {
            this.addSystemMessage('Uso: /report <message_id>', 'error');
            return;
        }
        
        const messageId = args[0];
        // TODO: Implement report system
        this.addSystemMessage(`Mensagem ${messageId} reportada. Obrigado!`, 'success');
    }
    
    joinChannel(args) {
        if (args.length === 0) {
            this.addSystemMessage('Uso: /join <channel>', 'error');
            return;
        }
        
        const channelName = args[0];
        const channelId = this.getChannelIdByName(channelName);
        
        if (channelId && this.switchChannel(channelId)) {
            this.addSystemMessage(`Entrou no canal ${channelName}.`, 'success');
        } else {
            this.addSystemMessage(`Canal ${channelName} não encontrado.`, 'error');
        }
    }
    
    leaveChannel(args) {
        // TODO: Implement channel leaving
        this.addSystemMessage('Comando em desenvolvimento.', 'info');
    }
    
    showChannels(args) {
        const channelList = [];
        for (const [channelId, channel] of this.channels) {
            const status = channel.joined ? '✓' : '✗';
            channelList.push(`${status} ${channel.name} (${channelId})`);
        }
        
        this.addSystemMessage('📺 Canais disponíveis:', 'info');
        for (const channel of channelList) {
            this.addSystemMessage(channel, 'info');
        }
    }
    
    emote(emoteName, args) {
        const message = `${this.getPlayerName()} ${emoteName}`;
        this.networkManager.sendChatMessage('emote', { emote: emoteName });
        
        // Show locally
        this.addMessage({
            playerId: window.game?.player?.id || 'local',
            playerName: this.getPlayerName(),
            channel: 'local',
            message: message,
            timestamp: Date.now(),
            messageType: 'emote'
        });
    }
    
    // Utility methods
    canSendMessage() {
        const now = Date.now();
        const recentMessages = this.messageQueue.filter(time => now - time < 10000);
        
        if (recentMessages.length >= this.messageLimit) {
            return false;
        }
        
        this.messageQueue.push(now);
        return true;
    }
    
    containsBadWords(message) {
        // TODO: Implement word filter
        const badWords = ['palavra1', 'palavra2']; // Add actual bad words
        
        for (const word of badWords) {
            if (message.toLowerCase().includes(word)) {
                return true;
            }
        }
        
        return false;
    }
    
    getChannelIdByName(name) {
        for (const [channelId, channel] of this.channels) {
            if (channel.name.toLowerCase() === name.toLowerCase()) {
                return channelId;
            }
        }
        return null;
    }
    
    getPlayerName() {
        return window.game?.player?.name || 'Jogador';
    }
    
    clearCurrentChannel() {
        const channel = this.channels.get(this.activeChannel);
        if (channel) {
            channel.messages = [];
            this.messagesContainer.innerHTML = '';
        }
    }
    
    fadeOldMessages() {
        const messages = this.messagesContainer.querySelectorAll('.chat-message');
        const fadeCount = Math.max(0, messages.length - 50);
        
        for (let i = 0; i < fadeCount; i++) {
            messages[i].style.opacity = '0.5';
        }
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.chatContainer.style.display = this.isVisible ? 'flex' : 'none';
        
        const toggleButton = this.chatContainer.querySelector('.chat-toggle');
        toggleButton.textContent = this.isVisible ? '_' : '□';
    }
    
    showMessageMenu(event, messageData) {
        // TODO: Implement context menu for messages
        // Options: Reply, Whisper, Mute, Block, Report, etc.
    }
    
    // Public API
    show() {
        this.isVisible = true;
        this.chatContainer.style.display = 'flex';
    }
    
    hide() {
        this.isVisible = false;
        this.chatContainer.style.display = 'none';
    }
    
    isVisible() {
        return this.isVisible;
    }
    
    getActiveChannel() {
        return this.activeChannel;
    }
    
    cleanup() {
        if (this.chatContainer && this.chatContainer.parentNode) {
            this.chatContainer.parentNode.removeChild(this.chatContainer);
        }
        
        this.channels.clear();
        this.channelHistory.clear();
        this.commands.clear();
        this.aliases.clear();
    }
}

export default ChatSystem;
