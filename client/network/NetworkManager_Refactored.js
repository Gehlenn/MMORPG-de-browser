/**
 * NetworkManager Refactored - Gerenciador de Rede Refatorado
 * Implementa STEP 3 - Fix Network Initialization
 * Inicializa socket connection exatamente uma vez
 * Mensagens simples: login, createCharacter, selectCharacter, enterWorld
 * Respostas: login_success, character_list, world_init
 */

class NetworkManager_Refactored {
    constructor() {
        // Socket e conexão
        this.socket = null;
        this.isConnected = false;
        this.connectionPromise = null;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        
        // Configurações
        this.config = {
            serverUrl: 'http://localhost:3000',
            reconnectInterval: 5000,
            reconnectAttempts: 5,
            connectionTimeout: 10000,
            heartbeatInterval: 30000
        };
        
        // Estado da conexão
        this.connectionState = {
            DISCONNECTED: 'DISCONNECTED',
            CONNECTING: 'CONNECTING',
            CONNECTED: 'CONNECTED',
            AUTHENTICATED: 'AUTHENTICATED',
            ERROR: 'ERROR'
        };
        
        this.currentState = this.connectionState.DISCONNECTED;
        
        // Event listeners
        this.eventListeners = new Map();
        this.globalListeners = [];
        
        // Fila de mensagens offline
        this.messageQueue = [];
        this.isQueueProcessing = false;
        
        // Timers
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        
        // Debug
        this.debugMode = true;
        
        this.initialize();
    }
    
    /**
     * Inicializa o NetworkManager
     */
    initialize() {
        console.log('🌐 Initializing NetworkManager_Refactored...');
        this.setupEventListeners();
        console.log('✅ NetworkManager_Refactored initialized');
    }
    
    /**
     * Configura event listeners globais
     */
    setupEventListeners() {
        // Conexão/restauração de rede
        window.addEventListener('online', () => {
            console.log('🌐 Network restored, attempting reconnect...');
            this.handleNetworkRestored();
        });
        
        window.addEventListener('offline', () => {
            console.log('📴 Network lost');
            this.handleNetworkLost();
        });
        
        // Foco da janela
        window.addEventListener('focus', () => {
            if (this.isConnected) {
                this.startHeartbeat();
            }
        });
        
        window.addEventListener('blur', () => {
            this.stopHeartbeat();
        });
    }
    
    /**
     * Inicializa conexão socket (exatamente uma vez)
     * @param {string} serverUrl - URL do servidor
     * @returns {Promise}
     */
    async initializeConnection(serverUrl = this.config.serverUrl) {
        // Se já está conectando, retornar promise existente
        if (this.connectionPromise) {
            console.log('⏳ Connection already in progress, waiting...');
            return this.connectionPromise;
        }
        
        // Se já está conectado, retornar sucesso
        if (this.isConnected) {
            console.log('✅ Already connected to server');
            return Promise.resolve();
        }
        
        // Se já atingiu tentativas máximas, falhar
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            const error = new Error('Maximum connection attempts reached');
            this.handleError(error);
            return Promise.reject(error);
        }
        
        this.connectionAttempts++;
        this.currentState = this.connectionState.CONNECTING;
        
        console.log(`🔌 Connecting to server (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        
        this.connectionPromise = this.createSocketConnection(serverUrl);
        
        return this.connectionPromise;
    }
    
    /**
     * Cria conexão socket
     * @param {string} serverUrl - URL do servidor
     * @returns {Promise}
     */
    async createSocketConnection(serverUrl) {
        try {
            // Importar socket.io dinamicamente
            const { io } = await import('socket.io-client');
            
            // Criar socket
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: this.config.connectionTimeout,
                forceNew: true,
                autoConnect: true,
                reconnection: false, // Controlar reconexão manualmente
                reconnectionAttempts: 0,
                reconnectionDelay: 0
            });
            
            // Configurar listeners do socket
            this.setupSocketListeners();
            
            // Promise com timeout
            const connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.handleConnectionError(new Error('Connection timeout'));
                    reject(new Error('Connection timeout'));
                }, this.config.connectionTimeout);
                
                // Sucesso
                this.socket.once('connect', () => {
                    clearTimeout(timeout);
                    this.handleConnectionSuccess();
                    resolve();
                });
                
                // Erro
                this.socket.once('connect_error', (error) => {
                    clearTimeout(timeout);
                    this.handleConnectionError(error);
                    reject(error);
                });
            });
            
            return connectionPromise;
            
        } catch (error) {
            this.handleConnectionError(error);
            return Promise.reject(error);
        }
    }
    
    /**
     * Configura listeners do socket
     */
    setupSocketListeners() {
        if (!this.socket) return;
        
        // Conexão estabelecida
        this.socket.on('connect', () => {
            this.handleConnectionSuccess();
        });
        
        // Desconexão
        this.socket.on('disconnect', (reason) => {
            this.handleDisconnection(reason);
        });
        
        // Erro
        this.socket.on('error', (error) => {
            this.handleError(error);
        });
        
        // Mensagens do servidor
        this.setupServerMessageHandlers();
        
        // Debug
        if (this.debugMode) {
            this.socket.onAny((eventName, ...args) => {
                console.log(`📨 Network message received: ${eventName}`, args);
            });
        }
    }
    
    /**
     * Configura handlers para mensagens do servidor
     */
    setupServerMessageHandlers() {
        if (!this.socket) return;
        
        // Login success
        this.socket.on('login_success', (data) => {
            this.logMessage('login_success', data);
            this.emit('login_success', data);
        });
        
        // Login error
        this.socket.on('login_error', (error) => {
            this.logMessage('login_error', error);
            this.emit('login_error', error);
        });
        
        // Character list
        this.socket.on('character_list', (data) => {
            this.logMessage('character_list', data);
            this.emit('character_list', data);
        });
        
        // Character created
        this.socket.on('character_created', (data) => {
            this.logMessage('character_created', data);
            this.emit('character_created', data);
        });
        
        // World init
        this.socket.on('world_init', (data) => {
            this.logMessage('world_init', data);
            this.emit('world_init', data);
        });
        
        // Heartbeat response
        this.socket.on('pong', () => {
            this.logMessage('pong');
        });
    }
    
    /**
     * Manipula sucesso na conexão
     */
    handleConnectionSuccess() {
        this.isConnected = true;
        this.currentState = this.connectionState.CONNECTED;
        this.connectionAttempts = 0;
        this.connectionPromise = null;
        
        // Iniciar heartbeat
        this.startHeartbeat();
        
        // Processar fila de mensagens
        this.processMessageQueue();
        
        console.log('✅ Connected to server successfully');
        this.emit('connected', { socketId: this.socket?.id });
    }
    
    /**
     * Manipula erro na conexão
     * @param {Error} error - Erro de conexão
     */
    handleConnectionError(error) {
        this.isConnected = false;
        this.currentState = this.connectionState.ERROR;
        this.connectionPromise = null;
        
        console.error('❌ Connection error:', error);
        this.emit('connection_error', error);
        
        // Tentar reconexão
        this.scheduleReconnect();
    }
    
    /**
     * Manipula desconexão
     * @param {string} reason - Razão da desconexão
     */
    handleDisconnection(reason) {
        this.isConnected = false;
        this.currentState = this.connectionState.DISCONNECTED;
        this.connectionPromise = null;
        
        // Parar heartbeat
        this.stopHeartbeat();
        
        console.log('❌ Disconnected from server:', reason);
        this.emit('disconnected', { reason });
        
        // Tentar reconexão se não foi logout intencional
        if (reason !== 'io client disconnect' && reason !== 'client namespace disconnect') {
            this.scheduleReconnect();
        }
    }
    
    /**
     * Agenda reconexão
     */
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        
        this.reconnectTimer = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            this.connectionAttempts = 0; // Reset tentativas para reconexão
            this.initializeConnection().catch(error => {
                console.error('❌ Reconnection failed:', error);
            });
        }, this.config.reconnectInterval);
    }
    
    /**
     * Manipula restauração de rede
     */
    handleNetworkRestored() {
        if (!this.isConnected && this.currentState === this.connectionState.DISCONNECTED) {
            console.log('🌐 Network restored, reconnecting...');
            this.connectionAttempts = 0;
            this.initializeConnection().catch(error => {
                console.error('❌ Reconnection after network restore failed:', error);
            });
        }
    }
    
    /**
     * Manipula perda de rede
     */
    handleNetworkLost() {
        console.log('📴 Network lost');
        this.stopHeartbeat();
        
        if (this.socket) {
            this.socket.disconnect();
        }
    }
    
    /**
     * Inicia heartbeat
     */
    startHeartbeat() {
        this.stopHeartbeat();
        
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected && this.socket) {
                this.socket.emit('ping');
                this.logMessage('ping');
            }
        }, this.config.heartbeatInterval);
    }
    
    /**
     * Para heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    /**
     * Envia mensagem de login
     * @param {object} credentials - Credenciais do usuário
     * @returns {Promise}
     */
    async login(credentials) {
        if (!this.isConnected) {
            return this.queueMessage('login', credentials);
        }
        
        if (!credentials || !credentials.username || !credentials.password) {
            return Promise.reject(new Error('Username and password required'));
        }
        
        return this.emitMessage('login', credentials);
    }
    
    /**
     * Envia mensagem de criação de personagem
     * @param {object} characterData - Dados do personagem
     * @returns {Promise}
     */
    async createCharacter(characterData) {
        if (!this.isConnected) {
            return this.queueMessage('createCharacter', characterData);
        }
        
        if (!characterData || !characterData.name || !characterData.race || !characterData.class) {
            return Promise.reject(new Error('Character name, race and class required'));
        }
        
        return this.emitMessage('createCharacter', characterData);
    }
    
    /**
     * Envia mensagem de seleção de personagem
     * @param {string} characterId - ID do personagem
     * @returns {Promise}
     */
    async selectCharacter(characterId) {
        if (!this.isConnected) {
            return this.queueMessage('selectCharacter', { characterId });
        }
        
        if (!characterId) {
            return Promise.reject(new Error('Character ID required'));
        }
        
        return this.emitMessage('selectCharacter', { characterId });
    }
    
    /**
     * Envia mensagem de entrada no mundo
     * @param {string} characterId - ID do personagem
     * @returns {Promise}
     */
    async enterWorld(characterId) {
        if (!this.isConnected) {
            return this.queueMessage('enterWorld', { characterId });
        }
        
        if (!characterId) {
            return Promise.reject(new Error('Character ID required'));
        }
        
        return this.emitMessage('enterWorld', { characterId });
    }
    
    /**
     * Emite mensagem para o servidor
     * @param {string} event - Nome do evento
     * @param {object} data - Dados da mensagem
     * @returns {Promise}
     */
    emitMessage(event, data) {
        if (!this.isConnected || !this.socket) {
            return Promise.reject(new Error('Not connected to server'));
        }
        
        return new Promise((resolve, reject) => {
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
            this.logMessage(event, data);
        });
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
            console.log(`📤 Message queued: ${event}`, data);
        });
    }
    
    /**
     * Processa fila de mensagens
     */
    async processMessageQueue() {
        if (this.isQueueProcessing || this.messageQueue.length === 0) {
            return;
        }
        
        this.isQueueProcessing = true;
        console.log(`📋 Processing ${this.messageQueue.length} queued messages...`);
        
        while (this.messageQueue.length > 0 && this.isConnected) {
            const { event, data, resolve, reject } = this.messageQueue.shift();
            
            try {
                const result = await this.emitMessage(event, data);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }
        
        this.isQueueProcessing = false;
        console.log('✅ Message queue processed');
    }
    
    /**
     * Manipula erro genérico
     * @param {Error} error - Erro
     */
    handleError(error) {
        console.error('❌ Network error:', error);
        this.emit('error', error);
    }
    
    /**
     * Log de mensagem (debug)
     * @param {string} event - Nome do evento
     * @param {object} data - Dados
     */
    logMessage(event, data) {
        if (this.debugMode) {
            console.log(`📤 Network message: ${event}`, data);
        }
    }
    
    /**
     * Adiciona event listener
     * @param {string} event - Nome do evento
     * @param {function} callback - Função callback
     */
    addEventListener(event, callback) {
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
    removeEventListener(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Adiciona listener global
     * @param {function} callback - Função callback
     */
    addGlobalListener(callback) {
        this.globalListeners.push(callback);
    }
    
    /**
     * Remove listener global
     * @param {function} callback - Função callback
     */
    removeGlobalListener(callback) {
        const index = this.globalListeners.indexOf(callback);
        if (index > -1) {
            this.globalListeners.splice(index, 1);
        }
    }
    
    /**
     * Emite evento
     * @param {string} event - Nome do evento
     * @param {object} data - Dados do evento
     */
    emit(event, data) {
        // Listeners específicos
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ Error in network event listener for ${event}:`, error);
                }
            });
        }
        
        // Listeners globais
        this.globalListeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('❌ Error in global network listener:', error);
            }
        });
        
        // Evento global
        const globalEvent = new CustomEvent(`network_${event}`, { detail: data });
        window.dispatchEvent(globalEvent);
    }
    
    /**
     * Desconecta do servidor
     */
    disconnect() {
        console.log('🔌 Disconnecting from server...');
        
        // Limpar timers
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        // Desconectar socket
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        // Resetar estado
        this.isConnected = false;
        this.currentState = this.connectionState.DISCONNECTED;
        this.connectionAttempts = 0;
        this.connectionPromise = null;
        this.messageQueue = [];
        this.isQueueProcessing = false;
        
        console.log('✅ Disconnected from server');
        this.emit('disconnected', { reason: 'manual' });
    }
    
    /**
     * Verifica se está conectado
     * @returns {boolean}
     */
    isSocketConnected() {
        return this.isConnected && this.socket?.connected;
    }
    
    /**
     * Obtém estado atual da conexão
     * @returns {string}
     */
    getConnectionState() {
        return this.currentState;
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
            connectionAttempts: this.connectionAttempts,
            maxConnectionAttempts: this.maxConnectionAttempts,
            messageQueueLength: this.messageQueue.length,
            isQueueProcessing: this.isQueueProcessing,
            eventListenersCount: this.eventListeners.size,
            globalListenersCount: this.globalListeners.length,
            hasHeartbeat: !!this.heartbeatTimer,
            hasReconnectTimer: !!this.reconnectTimer
        };
    }
    
    /**
     * Envia ping para testar latência
     * @returns {Promise<number>} - Latência em ms
     */
    async ping() {
        if (!this.isSocketConnected()) {
            throw new Error('Not connected to server');
        }
        
        const startTime = Date.now();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Ping timeout'));
            }, 5000);
            
            const pongListener = () => {
                clearTimeout(timeout);
                this.socket.off('pong', pongListener);
                const latency = Date.now() - startTime;
                resolve(latency);
            };
            
            this.socket.on('pong', pongListener);
            this.socket.emit('ping');
        });
    }
    
    /**
     * Destrói o NetworkManager
     */
    destroy() {
        console.log('🗑️ Destroying NetworkManager');
        
        this.disconnect();
        
        // Limpar listeners
        this.eventListeners.clear();
        this.globalListeners = [];
        
        console.log('✅ NetworkManager destroyed');
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.NetworkManager_Refactored = NetworkManager_Refactored;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkManager_Refactored;
}
