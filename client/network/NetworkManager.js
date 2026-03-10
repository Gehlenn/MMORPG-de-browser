// === NETWORK MANAGER ===

/**
 * Gerenciador de Rede
 * Inicializa socket uma vez e gerencia eventos simples
 */

export class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.reconnectDelay = 2000;
        
        this.eventCallbacks = new Map();
        this.messageQueue = [];
        this.isInitialized = false;
        
        this.initialize();
    }
    
    initialize() {
        console.log('🌐 Initializing NetworkManager...');
        this.setupEventSystem();
        console.log('✅ NetworkManager initialized');
    }
    
    // === CONNECTION MANAGEMENT ===
    
    async connect(serverUrl = 'ws://localhost:3000') {
        if (this.isInitialized) {
            console.log('⚠️ NetworkManager already initialized');
            return true;
        }
        
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.error('❌ Max connection attempts reached');
            this.emit('connection_failed', { reason: 'Max attempts reached' });
            return false;
        }
        
        console.log(`🔌 Connecting to server (attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})...`);
        
        try {
            // Simular conexão WebSocket (em produção, usar WebSocket real)
            await this.simulateWebSocketConnection(serverUrl);
            
            this.isConnected = true;
            this.isInitialized = true;
            this.connectionAttempts = 0;
            
            console.log('✅ Connected to server');
            this.emit('connected');
            
            // Processar mensagens em fila
            this.processMessageQueue();
            
            return true;
            
        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.connectionAttempts++;
            
            // Tentar reconectar
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                console.log(`🔄 Retrying connection in ${this.reconnectDelay}ms...`);
                setTimeout(() => this.connect(serverUrl), this.reconnectDelay);
            } else {
                this.emit('connection_failed', { reason: error.message });
            }
            
            return false;
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.isInitialized = false;
        this.connectionAttempts = 0;
        
        console.log('🔌 Disconnected from server');
        this.emit('disconnected');
    }
    
    async simulateWebSocketConnection(serverUrl) {
        return new Promise((resolve, reject) => {
            // Simular delay de conexão
            setTimeout(() => {
                // Simular sucesso/fracasso
                if (Math.random() > 0.1) { // 90% sucesso
                    this.socket = {
                        close: () => {},
                        send: (data) => this.handleSend(data),
                        on: (event, callback) => this.setupSocketEvent(event, callback)
                    };
                    
                    // Setup eventos do socket
                    this.setupSocketEvents();
                    resolve();
                } else {
                    reject(new Error('Connection timeout'));
                }
            }, 1000);
        });
    }
    
    setupSocketEvents() {
        if (!this.socket) return;
        
        // Simular eventos do servidor
        setTimeout(() => {
            this.emit('server_info', {
                version: '0.3.6v',
                maxPlayers: 100,
                currentPlayers: 42
            });
        }, 500);
    }
    
    setupSocketEvent(event, callback) {
        // Em produção, configurar eventos reais do WebSocket
        console.log(`📡 Socket event setup: ${event}`);
    }
    
    // === MESSAGE SYSTEM ===
    
    send(type, data) {
        const message = {
            type: type,
            data: data,
            timestamp: Date.now(),
            id: this.generateMessageId()
        };
        
        if (!this.isConnected) {
            console.log(`📨 Queuing message (${type}):`, data);
            this.messageQueue.push(message);
            return false;
        }
        
        this.handleSend(JSON.stringify(message));
        return true;
    }
    
    handleSend(data) {
        // Simular envio de mensagem
        console.log('📤 Sending message:', data);
        
        // Simular resposta do servidor
        setTimeout(() => {
            this.simulateServerResponse(data);
        }, 100 + Math.random() * 200);
    }
    
    simulateServerResponse(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'login':
                    this.simulateLoginResponse(message.data);
                    break;
                case 'createAccount':
                    this.simulateCreateAccountResponse(message.data);
                    break;
                case 'createCharacter':
                    this.simulateCreateCharacterResponse(message.data);
                    break;
                case 'selectCharacter':
                    this.simulateSelectCharacterResponse(message.data);
                    break;
                case 'enterWorld':
                    this.simulateEnterWorldResponse(message.data);
                    break;
                default:
                    console.log(`📡 No simulation for message type: ${message.type}`);
            }
        } catch (error) {
            console.error('❌ Failed to parse message:', error);
        }
    }
    
    simulateLoginResponse(data) {
        // Simular verificação de login
        setTimeout(() => {
            if (data.username === 'admin' && data.password === 'admin') {
                this.emit('login_success', {
                    user: {
                        id: 'admin_001',
                        username: data.username,
                        email: 'admin@legacyofkomodo.com',
                        level: 99,
                        isAdmin: true
                    }
                });
            } else if (data.username && data.password) {
                this.emit('login_success', {
                    user: {
                        id: `user_${Date.now()}`,
                        username: data.username,
                        email: `${data.username}@example.com`,
                        level: 1,
                        isAdmin: false
                    }
                });
            } else {
                this.emit('login_error', {
                    error: 'Invalid credentials',
                    code: 'AUTH_FAILED'
                });
            }
        }, 300);
    }
    
    simulateCreateAccountResponse(data) {
        setTimeout(() => {
            // Simular verificação de usuário existente
            if (data.username === 'admin') {
                this.emit('create_account_error', {
                    error: 'Username already exists',
                    code: 'USERNAME_TAKEN'
                });
            } else {
                this.emit('create_account_success', {
                    user: {
                        id: `user_${Date.now()}`,
                        username: data.username,
                        email: data.email,
                        level: 1
                    }
                });
            }
        }, 400);
    }
    
    simulateCreateCharacterResponse(data) {
        setTimeout(() => {
            this.emit('character_created', {
                character: {
                    ...data,
                    id: `char_${Date.now()}`,
                    createdAt: Date.now()
                }
            });
        }, 300);
    }
    
    simulateSelectCharacterResponse(data) {
        setTimeout(() => {
            this.emit('character_selected', {
                characterId: data.characterId,
                status: 'selected'
            });
        }, 200);
    }
    
    simulateEnterWorldResponse(data) {
        setTimeout(() => {
            this.emit('world_init', {
                worldData: {
                    mapWidth: 800,
                    mapHeight: 600,
                    tileSize: 32,
                    playerId: data.characterId,
                    worldId: 'world_001',
                    timestamp: Date.now(),
                    entities: [],
                    environment: {
                        theme: 'plains',
                        weather: 'clear',
                        timeOfDay: 'day'
                    }
                }
            });
        }, 800);
    }
    
    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        console.log(`📨 Processing ${this.messageQueue.length} queued messages...`);
        
        const queue = [...this.messageQueue];
        this.messageQueue = [];
        
        queue.forEach(message => {
            this.send(message.type, message.data);
        });
    }
    
    // === EVENT SYSTEM ===
    
    setupEventSystem() {
        // Eventos de rede
        this.eventCallbacks.set('connected', []);
        this.eventCallbacks.set('disconnected', []);
        this.eventCallbacks.set('connection_failed', []);
        this.eventCallbacks.set('server_info', []);
        
        // Eventos de autenticação
        this.eventCallbacks.set('login_success', []);
        this.eventCallbacks.set('login_error', []);
        this.eventCallbacks.set('create_account_success', []);
        this.eventCallbacks.set('create_account_error', []);
        
        // Eventos de personagem
        this.eventCallbacks.set('character_created', []);
        this.eventCallbacks.set('character_selected', []);
        this.eventCallbacks.set('character_list', []);
        
        // Eventos de mundo
        this.eventCallbacks.set('world_init', []);
        this.eventCallbacks.set('world_error', []);
        
        // Eventos de gameplay
        this.eventCallbacks.set('player_update_sent', []);
        this.eventCallbacks.set('player_action_sent', []);
    }
    
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        
        this.eventCallbacks.get(event).push(callback);
        console.log(`📝 Event listener registered: ${event}`);
    }
    
    off(event, callback) {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                console.log(`🗑️ Event listener removed: ${event}`);
            }
        }
    }
    
    emit(event, data = null) {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in event callback for ${event}:`, error);
                }
            });
        }
    }
    
    // === GAMEPLAY METHODS ===
    
    sendPlayerUpdate(position, velocity) {
        return this.send('player_update', {
            playerId: this.getCurrentPlayerId(),
            position: position,
            velocity: velocity
        });
    }
    
    sendPlayerAction(action, data) {
        return this.send('player_action', {
            playerId: this.getCurrentPlayerId(),
            action: action,
            data: data
        });
    }
    
    getCurrentPlayerId() {
        // Obter do SessionManager
        if (window.sessionManager) {
            const character = window.sessionManager.getCurrentCharacter();
            return character?.id;
        }
        return null;
    }
    
    // === UTILITY METHODS ===
    
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getStatus() {
        return {
            isConnected: this.isConnected,
            isInitialized: this.isInitialized,
            connectionAttempts: this.connectionAttempts,
            queuedMessages: this.messageQueue.length,
            eventListeners: Array.from(this.eventCallbacks.entries()).map(([event, callbacks]) => ({
                event,
                count: callbacks.length
            }))
        };
    }
    
    reset() {
        console.log('🔄 Resetting NetworkManager');
        this.disconnect();
        this.eventCallbacks.clear();
        this.messageQueue = [];
        this.setupEventSystem();
    }
    
    // === ADVANCED SYSTEMS (DISABLED FOR STABILIZATION) ===
    
    sendSnapshot(snapshot) {
        // Disabled for stabilization
        console.log('📸 Snapshot system disabled for stabilization');
        return false;
    }
    
    requestInterestManagement(position, radius) {
        // Disabled for stabilization
        console.log('🎯 Interest management disabled for stabilization');
        return false;
    }
    
    sendEconomyUpdate(update) {
        // Disabled for stabilization
        console.log('💰 Economy system disabled for stabilization');
        return false;
    }
    
    sendGuildAction(action, data) {
        // Disabled for stabilization
        console.log('🏰 Guild system disabled for stabilization');
        return false;
    }
    
    sendQuestUpdate(update) {
        // Disabled for stabilization
        console.log('📜 Quest system disabled for stabilization');
        return false;
    }
    
    sendPvPAction(action, data) {
        // Disabled for stabilization
        console.log('⚔️ PvP system disabled for stabilization');
        return false;
    }
    
    sendTradingAction(action, data) {
        // Disabled for stabilization
        console.log('💼 Trading system disabled for stabilization');
        return false;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.NetworkManager = NetworkManager;
}
