/**
 * StabilizedNetworkManager - Gerenciador de Rede Simplificado
 * Implementa STEP 3 - Network Flow para estabilização
 * Mensagens simples: login, createCharacter, selectCharacter, enterWorld, world_init
 */

class StabilizedNetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.messageQueue = [];
        this.eventListeners = new Map();
        
        // Estados de conexão
        this.connectionState = {
            DISCONNECTED: 'DISCONNECTED',
            CONNECTING: 'CONNECTING',
            CONNECTED: 'CONNECTED',
            AUTHENTICATED: 'AUTHENTICATED'
        };
        
        this.currentState = this.connectionState.DISCONNECTED;
        
        this.initialize();
    }
    
    /**
     * Inicializa o NetworkManager
     */
    initialize() {
        console.log('🌐 Initializing StabilizedNetworkManager...');
        this.setupEventListeners();
        console.log('✅ StabilizedNetworkManager initialized');
    }
    
    /**
     * Configura event listeners globais
     */
    setupEventListeners() {
        // Listener para reconexão automática
        window.addEventListener('online', () => {
            console.log('🌐 Network restored, attempting reconnect...');
            this.connect();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Network lost');
            this.currentState = this.connectionState.DISCONNECTED;
            this.isConnected = false;
        });
    }
    
    /**
     * Conecta ao servidor
     * @param {string} url - URL do servidor
     */
    async connect(url = 'http://localhost:3000') {
        if (this.currentState === this.connectionState.CONNECTING) {
            console.warn('⚠️ Connection already in progress');
            return;
        }
        
        if (this.isConnected) {
            console.warn('⚠️ Already connected');
            return;
        }
        
        this.currentState = this.connectionState.CONNECTING;
        console.log('🔌 Connecting to server...');
        
        try {
            // Importar socket.io dinamicamente
            const { io } = await import('socket.io-client');
            
            this.socket = io(url, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                forceNew: true
            });
            
            this.setupSocketListeners();
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.currentState = this.connectionState.DISCONNECTED;
                    reject(new Error('Connection timeout'));
                }, 10000);
                
                this.socket.once('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.currentState = this.connectionState.CONNECTED;
                    console.log('✅ Connected to server');
                    this.processMessageQueue();
                    resolve();
                });
                
                this.socket.once('connect_error', (error) => {
                    clearTimeout(timeout);
                    this.currentState = this.connectionState.DISCONNECTED;
                    console.error('❌ Connection failed:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            this.currentState = this.connectionState.DISCONNECTED;
            console.error('❌ Failed to import socket.io:', error);
            throw error;
        }
    }
    
    /**
     * Configura listeners do socket
     */
    setupSocketListeners() {
        if (!this.socket) return;
        
        // Conexão
        this.socket.on('connect', () => {
            console.log('✅ Socket connected');
            this.isConnected = true;
            this.currentState = this.connectionState.CONNECTED;
            this.emit('connected');
        });
        
        // Desconexão
        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            this.isConnected = false;
            this.currentState = this.connectionState.DISCONNECTED;
            this.emit('disconnected', { reason });
        });
        
        // Erro
        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            this.emit('error', error);
        });
        
        // Mensagens do servidor
        this.setupServerMessageListeners();
    }
    
    /**
     * Configura listeners para mensagens do servidor
     */
    setupServerMessageListeners() {
        if (!this.socket) return;
        
        // Login success
        this.socket.on('login_success', (data) => {
            console.log('✅ Login successful:', data);
            this.currentState = this.connectionState.AUTHENTICATED;
            this.emit('login_success', data);
        });
        
        // Login error
        this.socket.on('login_error', (error) => {
            console.error('❌ Login failed:', error);
            this.emit('login_error', error);
        });
        
        // Character list
        this.socket.on('character_list', (data) => {
            console.log('📋 Character list received:', data);
            this.emit('character_list', data);
        });
        
        // Character created
        this.socket.on('character_created', (data) => {
            console.log('✅ Character created:', data);
            this.emit('character_created', data);
        });
        
        // World init
        this.socket.on('world_init', (data) => {
            console.log('🌍 World initialized:', data);
            this.emit('world_init', data);
        });
        
        // Generic message handler
        this.socket.onAny((eventName, ...args) => {
            console.log(`📨 Message received: ${eventName}`, args);
        });
    }
    
    /**
     * Envia mensagem de login
     * @param {object} credentials - Credenciais do usuário
     */
    async login(credentials) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        if (!credentials.username || !credentials.password) {
            throw new Error('Username and password required');
        }
        
        console.log('🔑 Sending login request...');
        return this.emitMessage('login', credentials);
    }
    
    /**
     * Envia mensagem de criação de conta
     * @param {object} userData - Dados do usuário
     */
    async createAccount(userData) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        if (!userData.username || !userData.password) {
            throw new Error('Username and password required');
        }
        
        console.log('👤 Sending create account request...');
        return this.emitMessage('createAccount', userData);
    }
    
    /**
     * Envia mensagem de criação de personagem
     * @param {object} characterData - Dados do personagem
     */
    async createCharacter(characterData) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        if (!characterData.name || !characterData.race || !characterData.class) {
            throw new Error('Character name, race and class required');
        }
        
        console.log('👥 Sending create character request...');
        return this.emitMessage('createCharacter', characterData);
    }
    
    /**
     * Envia mensagem de seleção de personagem
     * @param {string} characterId - ID do personagem
     */
    async selectCharacter(characterId) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        if (!characterId) {
            throw new Error('Character ID required');
        }
        
        console.log('🎯 Sending select character request...');
        return this.emitMessage('selectCharacter', { characterId });
    }
    
    /**
     * Envia mensagem de entrada no mundo
     * @param {string} characterId - ID do personagem
     */
    async enterWorld(characterId) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        if (!characterId) {
            throw new Error('Character ID required');
        }
        
        console.log('🌍 Sending enter world request...');
        return this.emitMessage('enterWorld', { characterId });
    }
    
    /**
     * Emite mensagem para o servidor
     * @param {string} event - Nome do evento
     * @param {object} data - Dados da mensagem
     * @returns {Promise}
     */
    emitMessage(event, data) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Not connected to server'));
                return;
            }
            
            // Adicionar timeout
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout waiting for ${event} response`));
            }, 10000);
            
            // Configurar listener para resposta
            const responseEvent = `${event}_response`;
            const responseListener = (response) => {
                clearTimeout(timeout);
                this.socket.off(responseEvent, responseListener);
                
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.error || 'Request failed'));
                }
            };
            
            this.socket.on(responseEvent, responseListener);
            
            // Enviar mensagem
            this.socket.emit(event, data);
            console.log(`📤 Message sent: ${event}`, data);
        });
    }
    
    /**
     * Processa fila de mensagens
     */
    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        console.log(`📋 Processing ${this.messageQueue.length} queued messages...`);
        
        while (this.messageQueue.length > 0) {
            const { event, data, resolve, reject } = this.messageQueue.shift();
            
            try {
                this.emitMessage(event, data)
                    .then(resolve)
                    .catch(reject);
            } catch (error) {
                reject(error);
            }
        }
    }
    
    /**
     * Adiciona mensagem à fila
     * @param {string} event - Nome do evento
     * @param {object} data - Dados da mensagem
     * @returns {Promise}
     */
    queueMessage(event, data) {
        return new Promise((resolve, reject) => {
            this.messageQueue.push({ event, data, resolve, reject });
        });
    }
    
    /**
     * Adiciona event listener
     * @param {string} event - Nome do evento
     * @param {function} callback - Função callback
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * Remove event listener
     * @param {string} event - Nome do evento
     * @param {function} callback - Função callback
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Emite evento local
     * @param {string} event - Nome do evento
     * @param {any} data - Dados do evento
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Desconecta do servidor
     */
    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting from server...');
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.currentState = this.connectionState.DISCONNECTED;
        this.messageQueue = [];
        console.log('✅ Disconnected from server');
    }
    
    /**
     * Verifica se está conectado
     * @returns {boolean}
     */
    isConnectedToServer() {
        return this.isConnected;
    }
    
    /**
     * Obtém estado atual da conexão
     * @returns {string}
     */
    getConnectionState() {
        return this.currentState;
    }
    
    /**
     * Verifica se está autenticado
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.currentState === this.connectionState.AUTHENTICATED;
    }
    
    /**
     * Obtém informações de debug
     * @returns {object}
     */
    getDebugInfo() {
        return {
            isConnected: this.isConnected,
            currentState: this.currentState,
            socketId: this.socket?.id,
            messageQueueLength: this.messageQueue.length,
            eventListenersCount: this.eventListeners.size
        };
    }
    
    /**
     * Envia ping para testar conexão
     * @returns {Promise<number>} - Latência em ms
     */
    async ping() {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Ping timeout'));
            }, 5000);
            
            this.socket.emit('ping');
            
            this.socket.once('pong', () => {
                clearTimeout(timeout);
                const latency = Date.now() - startTime;
                resolve(latency);
            });
        });
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.StabilizedNetworkManager = StabilizedNetworkManager;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StabilizedNetworkManager;
}
