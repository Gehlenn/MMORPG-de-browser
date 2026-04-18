// === SIMPLE NETWORK PROTOCOL ===

/**
 * Protocolo de rede simplificado para estabilização
 * Usa apenas mensagens socket simples
 */

export const SimpleNetworkProtocol = {
    // === CORE MESSAGES ===
    
    // Authentication
    LOGIN: 'login',
    LOGIN_SUCCESS: 'login_success',
    LOGIN_ERROR: 'login_error',
    
    CREATE_ACCOUNT: 'createAccount',
    CREATE_ACCOUNT_SUCCESS: 'create_account_success',
    CREATE_ACCOUNT_ERROR: 'create_account_error',
    
    // Character Management
    CREATE_CHARACTER: 'createCharacter',
    CHARACTER_CREATED: 'character_created',
    CHARACTER_LIST: 'character_list',
    SELECT_CHARACTER: 'selectCharacter',
    CHARACTER_SELECTED: 'character_selected',
    
    // World Management
    ENTER_WORLD: 'enterWorld',
    WORLD_INIT: 'world_init',
    WORLD_ERROR: 'world_error',
    
    // Gameplay
    PLAYER_UPDATE: 'player_update',
    PLAYER_ACTION: 'player_action',
    MOB_UPDATE: 'mob_update',
    CHAT_MESSAGE: 'chat_message',
    
    // Connection
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    CONNECTION_FAILED: 'connection_failed',
    
    // === MESSAGE FORMATS ===
    
    formats: {
        // Login: { username, password }
        [this.LOGIN]: {
            required: ['username', 'password'],
            optional: []
        },
        
        // Login Success: { user }
        [this.LOGIN_SUCCESS]: {
            required: ['user'],
            optional: []
        },
        
        // Login Error: { error, code }
        [this.LOGIN_ERROR]: {
            required: ['error'],
            optional: ['code']
        },
        
        // Create Account: { username, email, password }
        [this.CREATE_ACCOUNT]: {
            required: ['username', 'email', 'password'],
            optional: []
        },
        
        // Create Character: { name, class, color }
        [this.CREATE_CHARACTER]: {
            required: ['name'],
            optional: ['class', 'color']
        },
        
        // Enter World: { characterId }
        [this.ENTER_WORLD]: {
            required: ['characterId'],
            optional: []
        },
        
        // World Init: { worldData }
        [this.WORLD_INIT]: {
            required: ['worldData'],
            optional: []
        },
        
        // Player Update: { position, velocity }
        [this.PLAYER_UPDATE]: {
            required: ['position'],
            optional: ['velocity']
        },
        
        // Player Action: { action, data }
        [this.PLAYER_ACTION]: {
            required: ['action'],
            optional: ['data']
        }
    },
    
    // === VALIDATION ===
    
    validateMessage(type, data) {
        const format = this.formats[type];
        if (!format) {
            return { valid: false, error: `Unknown message type: ${type}` };
        }
        
        // Check required fields
        for (const field of format.required) {
            if (!(field in data)) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }
        
        return { valid: true };
    },
    
    // === MESSAGE BUILDERS ===
    
    buildMessage(type, data) {
        const validation = this.validateMessage(type, data);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        return {
            type: type,
            data: data,
            timestamp: Date.now(),
            id: this.generateMessageId()
        };
    },
    
    // === UTILITY ===
    
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    isCoreMessage(type) {
        return [
            this.LOGIN,
            this.LOGIN_SUCCESS,
            this.LOGIN_ERROR,
            this.CREATE_ACCOUNT,
            this.CREATE_ACCOUNT_SUCCESS,
            this.CREATE_ACCOUNT_ERROR,
            this.CREATE_CHARACTER,
            this.CHARACTER_CREATED,
            this.ENTER_WORLD,
            this.WORLD_INIT,
            this.PLAYER_UPDATE,
            this.PLAYER_ACTION
        ].includes(type);
    },
    
    isAdvancedMessage(type) {
        return !this.isCoreMessage(type);
    }
};

/**
 * Simple Network Client
 * Implementa apenas o protocolo básico
 */

export class SimpleNetworkClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.messageHandlers = new Map();
        this.messageQueue = [];
        this.protocol = SimpleNetworkProtocol;
        
        this.setupMessageHandlers();
    }
    
    setupMessageHandlers() {
        // Setup handlers para mensagens core
        this.protocol.isCoreMessage.toString = () => 'isCoreMessage';
        
        console.log('📡 Simple Network Client initialized');
    }
    
    connect(serverUrl) {
        console.log('🔌 Connecting to server with simple protocol...');
        
        // Simular conexão WebSocket
        setTimeout(() => {
            this.isConnected = true;
            console.log('✅ Connected with simple protocol');
            this.emit(this.protocol.CONNECTED);
        }, 1000);
    }
    
    disconnect() {
        this.isConnected = false;
        console.log('🔌 Disconnected from server');
        this.emit(this.protocol.DISCONNECTED);
    }
    
    send(type, data) {
        if (!this.isConnected) {
            console.log(`📨 Queuing message: ${type}`);
            this.messageQueue.push({ type, data });
            return false;
        }
        
        try {
            const message = this.protocol.buildMessage(type, data);
            this.handleSend(message);
            return true;
        } catch (error) {
            console.error(`❌ Failed to send message ${type}:`, error);
            return false;
        }
    }
    
    handleSend(message) {
        console.log('📤 Sending simple message:', message.type);
        
        // Simular resposta do servidor
        setTimeout(() => {
            this.simulateServerResponse(message);
        }, 100 + Math.random() * 200);
    }
    
    simulateServerResponse(message) {
        switch (message.type) {
            case this.protocol.LOGIN:
                this.simulateLoginResponse(message.data);
                break;
            case this.protocol.CREATE_ACCOUNT:
                this.simulateCreateAccountResponse(message.data);
                break;
            case this.protocol.CREATE_CHARACTER:
                this.simulateCreateCharacterResponse(message.data);
                break;
            case this.protocol.ENTER_WORLD:
                this.simulateEnterWorldResponse(message.data);
                break;
            case this.protocol.PLAYER_UPDATE:
                // Silently acknowledge player updates
                break;
            case this.protocol.PLAYER_ACTION:
                // Silently acknowledge player actions
                break;
            default:
                console.log(`📡 No simulation for message type: ${message.type}`);
        }
    }
    
    simulateLoginResponse(data) {
        setTimeout(() => {
            if (data.username === 'admin' && data.password === 'admin') {
                this.emit(this.protocol.LOGIN_SUCCESS, {
                    user: {
                        id: 'admin_001',
                        username: data.username,
                        email: 'admin@legacyofkomodo.com',
                        level: 99,
                        isAdmin: true
                    }
                });
            } else if (data.username && data.password) {
                this.emit(this.protocol.LOGIN_SUCCESS, {
                    user: {
                        id: `user_${Date.now()}`,
                        username: data.username,
                        email: `${data.username}@example.com`,
                        level: 1,
                        isAdmin: false
                    }
                });
            } else {
                this.emit(this.protocol.LOGIN_ERROR, {
                    error: 'Invalid credentials',
                    code: 'AUTH_FAILED'
                });
            }
        }, 300);
    }
    
    simulateCreateAccountResponse(data) {
        setTimeout(() => {
            if (data.username === 'admin') {
                this.emit(this.protocol.CREATE_ACCOUNT_ERROR, {
                    error: 'Username already exists',
                    code: 'USERNAME_TAKEN'
                });
            } else {
                this.emit(this.protocol.CREATE_ACCOUNT_SUCCESS, {
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
            this.emit(this.protocol.CHARACTER_CREATED, {
                character: {
                    ...data,
                    id: `char_${Date.now()}`,
                    createdAt: Date.now()
                }
            });
        }, 300);
    }
    
    simulateEnterWorldResponse(data) {
        setTimeout(() => {
            this.emit(this.protocol.WORLD_INIT, {
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
    
    on(event, callback) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.messageHandlers.has(event)) {
            this.messageHandlers.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in callback for ${event}:`, error);
                }
            });
        }
    }
    
    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        console.log(`📨 Processing ${this.messageQueue.length} queued messages...`);
        
        const queue = [...this.messageQueue];
        this.messageQueue = [];
        
        queue.forEach(({ type, data }) => {
            this.send(type, data);
        });
    }
    
    // === ADVANCED SYSTEMS (DISABLED) ===
    
    sendSnapshot(snapshot) {
        console.log('📸 Snapshot system disabled in simple protocol');
        return false;
    }
    
    sendEconomyUpdate(update) {
        console.log('💰 Economy system disabled in simple protocol');
        return false;
    }
    
    sendGuildAction(action, data) {
        console.log('🏰 Guild system disabled in simple protocol');
        return false;
    }
    
    sendQuestUpdate(update) {
        console.log('📜 Quest system disabled in simple protocol');
        return false;
    }
    
    sendPvPAction(action, data) {
        console.log('⚔️ PvP system disabled in simple protocol');
        return false;
    }
    
    sendTradingAction(action, data) {
        console.log('💼 Trading system disabled in simple protocol');
        return false;
    }
    
    // === STATUS ===
    
    getStatus() {
        return {
            isConnected: this.isConnected,
            queuedMessages: this.messageQueue.length,
            protocol: 'SimpleNetworkProtocol v1.0',
            supportedMessages: Object.values(SimpleNetworkProtocol).filter(msg => typeof msg === 'string')
        };
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.SimpleNetworkProtocol = SimpleNetworkProtocol;
    window.SimpleNetworkClient = SimpleNetworkClient;
}
