/**
 * Network Manager - Multiplayer Foundation
 * Handles WebSocket connections and message routing
 * Version 0.3 - Social & Multiplayer Systems
 */

class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        // Message handlers
        this.messageHandlers = new Map();
        this.pendingMessages = [];
        
        // Connection state
        this.connectionState = 'disconnected'; // disconnected, connecting, connected, error
        this.lastHeartbeat = 0;
        this.heartbeatInterval = 30000; // 30 seconds
        
        // Player data
        this.playerId = null;
        this.sessionToken = null;
        
        // Event callbacks
        this.onConnect = null;
        this.onDisconnect = null;
        this.onError = null;
        this.onMessage = null;
        
        // Initialize
        this.initializeEventHandlers();
    }
    
    initializeEventHandlers() {
        // Register default message handlers
        this.registerHandler('connect', this.handleConnect.bind(this));
        this.registerHandler('disconnect', this.handleDisconnect.bind(this));
        this.registerHandler('error', this.handleError.bind(this));
        this.registerHandler('heartbeat', this.handleHeartbeat.bind(this));
        this.registerHandler('player_update', this.handlePlayerUpdate.bind(this));
        this.registerHandler('entity_spawn', this.handleEntitySpawn.bind(this));
        this.registerHandler('entity_despawn', this.handleEntityDespawn.bind(this));
        this.registerHandler('entity_update', this.handleEntityUpdate.bind(this));
        this.registerHandler('chat_message', this.handleChatMessage.bind(this));
        this.registerHandler('party_invite', this.handlePartyInvite.bind(this));
        this.registerHandler('guild_invite', this.handleGuildInvite.bind(this));
    }
    
    // Connection management
    async connect(serverUrl = 'ws://localhost:3000') {
        if (this.isConnected) {
            console.log('Already connected to server');
            return true;
        }
        
        try {
            this.connectionState = 'connecting';
            console.log(`Connecting to ${serverUrl}...`);
            
            this.socket = new WebSocket(serverUrl);
            
            this.socket.onopen = () => {
                this.onSocketOpen();
            };
            
            this.socket.onmessage = (event) => {
                this.onSocketMessage(event);
            };
            
            this.socket.onclose = () => {
                this.onSocketClose();
            };
            
            this.socket.onerror = (error) => {
                this.onSocketError(error);
            };
            
            return true;
            
        } catch (error) {
            console.error('Connection failed:', error);
            this.connectionState = 'error';
            this.handleError({ type: 'connection_error', message: error.message });
            return false;
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.connectionState = 'disconnected';
        this.playerId = null;
        this.sessionToken = null;
        
        console.log('Disconnected from server');
    }
    
    // Socket event handlers
    onSocketOpen() {
        console.log('WebSocket connection established');
        this.isConnected = true;
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Send initial connection message
        this.sendMessage({
            type: 'connect',
            data: {
                version: '0.3.0',
                timestamp: Date.now()
            }
        });
        
        // Process any pending messages
        this.processPendingMessages();
        
        if (this.onConnect) {
            this.onConnect();
        }
    }
    
    onSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }
    
    onSocketClose() {
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.connectionState = 'disconnected';
        
        this.stopHeartbeat();
        
        if (this.onDisconnect) {
            this.onDisconnect();
        }
        
        // Attempt reconnection
        this.attemptReconnect();
    }
    
    onSocketError(error) {
        console.error('WebSocket error:', error);
        this.connectionState = 'error';
        
        if (this.onError) {
            this.onError(error);
        }
    }
    
    // Message handling
    handleMessage(message) {
        const { type, data } = message;
        
        if (!type) {
            console.warn('Received message without type:', message);
            return;
        }
        
        const handler = this.messageHandlers.get(type);
        if (handler) {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error handling message type ${type}:`, error);
            }
        } else {
            console.warn(`No handler for message type: ${type}`);
        }
        
        if (this.onMessage) {
            this.onMessage(message);
        }
    }
    
    sendMessage(type, data = {}) {
        const message = {
            type,
            data,
            timestamp: Date.now(),
            playerId: this.playerId
        };
        
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            // Queue message for later
            this.pendingMessages.push(message);
            console.log('Message queued (not connected):', type);
        }
    }
    
    // Message handlers
    handleConnect(data) {
        console.log('Connected to server:', data);
        this.playerId = data.playerId;
        this.sessionToken = data.sessionToken;
        
        // Store session info
        localStorage.setItem('playerId', this.playerId);
        localStorage.setItem('sessionToken', this.sessionToken);
    }
    
    handleDisconnect(data) {
        console.log('Server disconnected:', data);
        this.playerId = null;
        this.sessionToken = null;
        
        // Clear session info
        localStorage.removeItem('playerId');
        localStorage.removeItem('sessionToken');
    }
    
    handleError(data) {
        console.error('Server error:', data);
        
        // Show error to user
        if (window.game && window.game.ui) {
            window.game.ui.showError(data.message || 'Connection error');
        }
    }
    
    handleHeartbeat(data) {
        this.lastHeartbeat = Date.now();
        
        // Respond to heartbeat
        this.sendMessage('heartbeat_response', {
            timestamp: this.lastHeartbeat
        });
    }
    
    handlePlayerUpdate(data) {
        // Update player data
        if (window.game && window.game.player) {
            Object.assign(window.game.player, data);
            window.game.updateUI();
        }
    }
    
    handleEntitySpawn(data) {
        // Spawn new entity in world
        if (window.game && window.game.entityManager) {
            const entity = window.game.entityManager.createEntityFromData(data);
            if (entity) {
                console.log('Spawned entity:', entity.id);
            }
        }
    }
    
    handleEntityDespawn(data) {
        // Remove entity from world
        if (window.game && window.game.entityManager) {
            window.game.entityManager.removeEntity(data.entityId);
            console.log('Despawned entity:', data.entityId);
        }
    }
    
    handleEntityUpdate(data) {
        // Update existing entity
        if (window.game && window.game.entityManager) {
            const entity = window.game.entityManager.getEntity(data.entityId);
            if (entity) {
                Object.assign(entity, data.updates);
            }
        }
    }
    
    handleChatMessage(data) {
        // Display chat message
        if (window.game && window.game.ui) {
            window.game.ui.addChatMessage(data);
        }
    }
    
    handlePartyInvite(data) {
        // Handle party invitation
        if (window.game && window.game.partySystem) {
            window.game.partySystem.handleInvite(data);
        }
    }
    
    handleGuildInvite(data) {
        // Handle guild invitation
        if (window.game && window.game.guildSystem) {
            window.game.guildSystem.handleInvite(data);
        }
    }
    
    // Utility methods
    registerHandler(type, handler) {
        this.messageHandlers.set(type, handler);
    }
    
    unregisterHandler(type) {
        this.messageHandlers.delete(type);
    }
    
    processPendingMessages() {
        while (this.pendingMessages.length > 0) {
            const message = this.pendingMessages.shift();
            this.sendMessage(message.type, message.data);
        }
    }
    
    // Reconnection logic
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    
    // Heartbeat system
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.sendMessage('heartbeat', {
                    timestamp: Date.now()
                });
            }
        }, this.heartbeatInterval);
    }
    
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    // Game-specific message methods
    sendPlayerUpdate(updates) {
        this.sendMessage('player_update', updates);
    }
    
    sendChatMessage(channel, message) {
        this.sendMessage('chat_message', {
            channel,
            message,
            timestamp: Date.now()
        });
    }
    
    sendPartyAction(action, data = {}) {
        this.sendMessage('party_action', {
            action,
            ...data
        });
    }
    
    sendGuildAction(action, data = {}) {
        this.sendMessage('guild_action', {
            action,
            ...data
        });
    }
    
    sendCombatAction(targetId, action, data = {}) {
        this.sendMessage('combat_action', {
            targetId,
            action,
            ...data
        });
    }
    
    // Status methods
    getConnectionState() {
        return this.connectionState;
    }
    
    isReady() {
        return this.isConnected && this.playerId !== null;
    }
    
    getPing() {
        // Calculate ping based on heartbeat
        return this.lastHeartbeat ? Date.now() - this.lastHeartbeat : -1;
    }
    
    // Cleanup
    cleanup() {
        this.disconnect();
        this.messageHandlers.clear();
        this.pendingMessages.length = 0;
        this.stopHeartbeat();
    }
}

// Export for use in game
export default NetworkManager;

// Also expose globally for debugging
window.NetworkManager = NetworkManager;
