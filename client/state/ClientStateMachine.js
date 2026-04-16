/**
 * ClientStateMachine - Máquina de Estados do Cliente
 * Implementa STEP 1 - Client State Machine
 * Estados: LOGIN → CHARACTER_SELECT → LOADING_WORLD → IN_GAME
 * GameplayEngine só inicia quando estado = IN_GAME
 */

class ClientStateMachine {
    constructor() {
        // Estados definidos
        this.STATES = {
            LOGIN: 'LOGIN',
            CHARACTER_SELECT: 'CHARACTER_SELECT',
            LOADING_WORLD: 'LOADING_WORLD',
            IN_GAME: 'IN_GAME'
        };
        
        // Estado atual
        this.currentState = this.STATES.LOGIN;
        this.previousState = null;
        
        // Histórico de transições
        this.transitionHistory = [];
        
        // Lock de transições
        this.transitionLock = false;
        
        // Event listeners
        this.stateListeners = new Map();
        this.globalListeners = [];
        
        // Contexto compartilhado
        this.context = {
            user: null,
            character: null,
            worldData: null,
            networkConnected: false
        };
        
        // Callbacks de validação
        this.transitionValidators = new Map();
        
        console.log('🎮 ClientStateMachine initialized');
        this.setupDefaultValidators();
    }
    
    /**
     * Configura validadores de transição padrão
     */
    setupDefaultValidators() {
        // LOGIN → CHARACTER_SELECT (requer usuário)
        this.setTransitionValidator(
            this.STATES.LOGIN, 
            this.STATES.CHARACTER_SELECT,
            (context) => {
                return context.user && context.user.id;
            }
        );
        
        // CHARACTER_SELECT → LOADING_WORLD (requer personagem)
        this.setTransitionValidator(
            this.STATES.CHARACTER_SELECT,
            this.STATES.LOADING_WORLD,
            (context) => {
                return context.character && context.character.id;
            }
        );
        
        // LOADING_WORLD → IN_GAME (requer worldData)
        this.setTransitionValidator(
            this.STATES.LOADING_WORLD,
            this.STATES.IN_GAME,
            (context) => {
                return context.worldData && context.worldData.player;
            }
        );
    }
    
    /**
     * Define validador para transição específica
     * @param {string} fromState - Estado origem
     * @param {string} toState - Estado destino
     * @param {function} validator - Função validadora
     */
    setTransitionValidator(fromState, toState, validator) {
        const key = `${fromState}->${toState}`;
        this.transitionValidators.set(key, validator);
    }
    
    /**
     * Transiciona para novo estado
     * @param {string} newState - Novo estado
     * @param {object} contextData - Dados de contexto
     * @returns {boolean} - Sucesso da transição
     */
    transitionTo(newState, contextData = {}) {
        if (this.transitionLock) {
            console.warn('⚠️ State transition locked');
            return false;
        }
        
        // Validar estado
        if (!this.isValidState(newState)) {
            console.error(`❌ Invalid state: ${newState}`);
            return false;
        }
        
        // Validar transição permitida
        if (!this.canTransitionTo(this.currentState, newState)) {
            console.error(`❌ Invalid transition: ${this.currentState} → ${newState}`);
            return false;
        }
        
        // Validar com validador específico
        const validatorKey = `${this.currentState}->${newState}`;
        const validator = this.transitionValidators.get(validatorKey);
        if (validator) {
            const tempContext = { ...this.context, ...contextData };
            if (!validator(tempContext)) {
                console.error(`❌ Transition validation failed: ${this.currentState} → ${newState}`);
                return false;
            }
        }
        
        // Bloquear transições durante processo
        this.transitionLock = true;
        
        try {
            // Executar transição
            const transitionData = {
                from: this.currentState,
                to: newState,
                timestamp: Date.now(),
                context: { ...this.context, ...contextData }
            };
            
            // Atualizar contexto
            Object.assign(this.context, contextData);
            
            // Mudar estado
            this.previousState = this.currentState;
            this.currentState = newState;
            
            // Adicionar ao histórico
            this.transitionHistory.push(transitionData);
            
            // Notificar listeners
            this.notifyStateChange(transitionData);
            
            // Executar ações específicas do estado
            this.executeStateActions(newState, transitionData.context);
            
            console.log(`✅ State transitioned: ${this.previousState} → ${newState}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error during state transition:`, error);
            return false;
        } finally {
            // Liberar lock
            this.transitionLock = false;
        }
    }
    
    /**
     * Verifica se estado é válido
     * @param {string} state - Estado a verificar
     * @returns {boolean}
     */
    isValidState(state) {
        return Object.values(this.STATES).includes(state);
    }
    
    /**
     * Verifica se transição é permitida
     * @param {string} from - Estado origem
     * @param {string} to - Estado destino
     * @returns {boolean}
     */
    canTransitionTo(from, to) {
        // Permitir transições reversas para LOGIN
        if (to === this.STATES.LOGIN) {
            return true;
        }
        
        // Transições permitidas
        const allowedTransitions = {
            [this.STATES.LOGIN]: [this.STATES.CHARACTER_SELECT],
            [this.STATES.CHARACTER_SELECT]: [this.STATES.LOGIN, this.STATES.LOADING_WORLD],
            [this.STATES.LOADING_WORLD]: [this.STATES.CHARACTER_SELECT, this.STATES.IN_GAME],
            [this.STATES.IN_GAME]: [this.STATES.CHARACTER_SELECT] // Volta para seleção
        };
        
        return allowedTransitions[from]?.includes(to) || false;
    }
    
    /**
     * Notifica listeners sobre mudança de estado
     * @param {object} transitionData - Dados da transição
     */
    notifyStateChange(transitionData) {
        // Evento global
        const globalEvent = new CustomEvent('stateChange', {
            detail: transitionData
        });
        window.dispatchEvent(globalEvent);
        
        // Listeners globais
        this.globalListeners.forEach(listener => {
            try {
                listener(transitionData);
            } catch (error) {
                console.error('❌ Error in global state listener:', error);
            }
        });
        
        // Listeners específicos do estado
        const stateListeners = this.stateListeners.get(transitionData.to) || [];
        stateListeners.forEach(listener => {
            try {
                listener(transitionData.context);
            } catch (error) {
                console.error(`❌ Error in state listener for ${transitionData.to}:`, error);
            }
        });
    }
    
    /**
     * Executa ações específicas do estado
     * @param {string} state - Estado atual
     * @param {object} context - Contexto do estado
     */
    executeStateActions(state, context) {
        switch (state) {
            case this.STATES.LOGIN:
                this.handleLoginState(context);
                break;
                
            case this.STATES.CHARACTER_SELECT:
                this.handleCharacterSelectState(context);
                break;
                
            case this.STATES.LOADING_WORLD:
                this.handleLoadingWorldState(context);
                break;
                
            case this.STATES.IN_GAME:
                this.handleInGameState(context);
                break;
        }
    }
    
    /**
     * Ações do estado LOGIN
     * @param {object} context - Contexto
     */
    handleLoginState(context) {
        console.log('🔑 Executing LOGIN state actions');
        
        // Esconder outras telas
        this.hideAllScreens();
        
        // Mostrar tela de login
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
        }
        
        // Limpar formulário
        this.clearLoginForm();
        
        // Focar no campo de username
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.focus();
        }
        
        // Notificar sistemas
        this.emit('login_state_entered', context);
    }
    
    /**
     * Ações do estado CHARACTER_SELECT
     * @param {object} context - Contexto
     */
    handleCharacterSelectState(context) {
        console.log('👥 Executing CHARACTER_SELECT state actions');
        
        // Esconder outras telas
        this.hideAllScreens();
        
        // Mostrar tela de personagens
        const characterScreen = document.getElementById('characterScreen');
        if (characterScreen) {
            characterScreen.style.display = 'flex';
        }
        
        // Carregar personagens do usuário
        if (context.user) {
            this.loadUserCharacters(context.user);
        }
        
        // Notificar sistemas
        this.emit('character_select_state_entered', context);
    }
    
    /**
     * Ações do estado LOADING_WORLD
     * @param {object} context - Contexto
     */
    handleLoadingWorldState(context) {
        console.log('⏳ Executing LOADING_WORLD state actions');
        
        // Esconder outras telas
        this.hideAllScreens();
        
        // Mostrar tela de loading
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
        
        // Inicializar entrada no mundo
        if (context.character) {
            this.initializeWorldEntry(context);
        }
        
        // Notificar sistemas
        this.emit('loading_world_state_entered', context);
    }
    
    /**
     * Ações do estado IN_GAME
     * @param {object} context - Contexto
     */
    handleInGameState(context) {
        console.log('🎮 Executing IN_GAME state actions');
        
        // Esconder outras telas
        this.hideAllScreens();
        
        // Mostrar tela de jogo
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.style.display = 'flex';
        }
        
        // Inicializar GameplayEngine (STEP 4)
        if (context.worldData && window.gameplayEngine) {
            console.log('🚀 Initializing GameplayEngine with world data');
            window.gameplayEngine.initializeWorld(context.worldData);
        }
        
        // Notificar sistemas
        this.emit('in_game_state_entered', context);
    }
    
    /**
     * Esconde todas as telas
     */
    hideAllScreens() {
        const screens = ['loginScreen', 'characterScreen', 'loadingScreen', 'gameScreen'];
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.style.display = 'none';
            }
        });
    }
    
    /**
     * Limpa formulário de login
     */
    clearLoginForm() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const messageContainer = document.getElementById('loginMessage');
        
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (messageContainer) {
            messageContainer.style.display = 'none';
            messageContainer.textContent = '';
        }
    }
    
    /**
     * Carrega personagens do usuário
     * @param {object} user - Dados do usuário
     */
    loadUserCharacters(user) {
        // Implementar carregamento de personagens
        if (window.characterUI) {
            window.characterUI.loadCharacters(user.id);
        }
        
        this.emit('load_user_characters', { user });
    }
    
    /**
     * Inicializa entrada no mundo
     * @param {object} context - Contexto
     */
    initializeWorldEntry(context) {
        console.log('🌍 Initializing world entry for character:', context.character.name);
        
        // Solicitar world_init ao servidor
        if (window.networkManager && window.networkManager.isConnected()) {
            window.networkManager.emit('enterWorld', {
                characterId: context.character.id
            });
        } else {
            // Modo offline - criar dados mock
            this.createMockWorldData(context);
        }
    }
    
    /**
     * Cria dados mock do mundo (modo offline)
     * @param {object} context - Contexto
     */
    createMockWorldData(context) {
        const mockWorldData = {
            player: {
                ...context.character,
                x: 400,
                y: 300,
                hp: 100,
                maxHp: 100,
                level: 1
            },
            mobs: [
                {
                    id: 'mob_1',
                    type: 'goblin',
                    name: 'Goblin',
                    x: 200,
                    y: 200,
                    hp: 20,
                    maxHp: 20,
                    attack: 5,
                    defense: 2
                },
                {
                    id: 'mob_2',
                    type: 'wolf',
                    name: 'Wolf',
                    x: 600,
                    y: 400,
                    hp: 25,
                    maxHp: 25,
                    attack: 7,
                    defense: 3
                },
                {
                    id: 'mob_3',
                    type: 'orc',
                    name: 'Orc',
                    x: 500,
                    y: 150,
                    hp: 30,
                    maxHp: 30,
                    attack: 10,
                    defense: 5
                }
            ],
            map: {
                width: 800,
                height: 600,
                theme: 'plains'
            }
        };
        
        // Simular delay de rede
        setTimeout(() => {
            this.context.worldData = mockWorldData;
            this.transitionTo(this.STATES.IN_GAME);
        }, 1500);
    }
    
    /**
     * Adiciona listener para estado específico
     * @param {string} state - Estado para ouvir
     * @param {function} callback - Função callback
     */
    addStateListener(state, callback) {
        if (!this.stateListeners.has(state)) {
            this.stateListeners.set(state, []);
        }
        this.stateListeners.get(state).push(callback);
    }
    
    /**
     * Remove listener de estado
     * @param {string} state - Estado
     * @param {function} callback - Função callback
     */
    removeStateListener(state, callback) {
        const listeners = this.stateListeners.get(state);
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
        const customEvent = new CustomEvent(event, { detail: data });
        window.dispatchEvent(customEvent);
    }
    
    /**
     * Obtém estado atual
     * @returns {string}
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Verifica se está em estado específico
     * @param {string} state - Estado a verificar
     * @returns {boolean}
     */
    isState(state) {
        return this.currentState === state;
    }
    
    /**
     * Obtém contexto atual
     * @returns {object}
     */
    getContext() {
        return { ...this.context };
    }
    
    /**
     * Atualiza contexto
     * @param {object} updates - Atualizações
     */
    updateContext(updates) {
        Object.assign(this.context, updates);
        console.log('📝 Context updated:', updates);
    }
    
    /**
     * Obtém histórico de transições
     * @returns {array}
     */
    getTransitionHistory() {
        return [...this.transitionHistory];
    }
    
    /**
     * Reseta máquina de estados
     */
    reset() {
        console.log('🔄 Resetting ClientStateMachine');
        
        this.currentState = this.STATES.LOGIN;
        this.previousState = null;
        this.transitionHistory = [];
        this.transitionLock = false;
        
        // Limpar contexto mas manter dados essenciais
        const networkConnected = this.context.networkConnected;
        this.context = {
            user: null,
            character: null,
            worldData: null,
            networkConnected
        };
        
        // Voltar para tela de login
        this.transitionTo(this.STATES.LOGIN);
    }
    
    /**
     * Força transição (ignora validações - uso emergencial)
     * @param {string} newState - Novo estado
     * @param {object} contextData - Dados de contexto
     */
    forceTransitionTo(newState, contextData = {}) {
        console.warn('⚠️ Forcing transition to:', newState);
        
        // Temporariamente remover validadores
        const originalValidators = new Map(this.transitionValidators);
        this.transitionValidators.clear();
        
        try {
            this.transitionTo(newState, contextData);
        } finally {
            // Restaurar validadores
            this.transitionValidators = originalValidators;
        }
    }
    
    /**
     * Obtém informações de debug
     * @returns {object}
     */
    getDebugInfo() {
        return {
            currentState: this.currentState,
            previousState: this.previousState,
            transitionLock: this.transitionLock,
            transitionCount: this.transitionHistory.length,
            contextKeys: Object.keys(this.context),
            validatorCount: this.transitionValidators.size,
            stateListenerCount: Array.from(this.stateListeners.values())
                .reduce((total, listeners) => total + listeners.length, 0),
            globalListenerCount: this.globalListeners.length
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ClientStateMachine = ClientStateMachine;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientStateMachine;
}
