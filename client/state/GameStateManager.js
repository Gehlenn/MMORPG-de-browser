/**
 * GameStateManager - Gerencia estados do jogo
 * Responsável pelo controle do fluxo de estados: LOGIN → CHARACTER_SELECT → LOADING_WORLD → IN_GAME
 */

class GameStateManager {
    constructor() {
        this.states = {
            LOGIN: 'LOGIN',
            CHARACTER_SELECT: 'CHARACTER_SELECT',
            LOADING_WORLD: 'LOADING_WORLD',
            IN_GAME: 'IN_GAME'
        };
        
        this.currentState = this.states.LOGIN;
        this.previousState = null;
        this.stateHistory = [];
        
        // Event listeners para mudanças de estado
        this.listeners = new Map();
        
        // Flags para controle de inicialização
        this.isInitialized = false;
        this.canTransition = true;
        
        console.log('🎮 GameStateManager initialized');
    }
    
    /**
     * Inicializa o GameStateManager
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ GameStateManager already initialized');
            return;
        }
        
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ GameStateManager ready');
    }
    
    /**
     * Configura event listeners para mudanças de estado
     */
    setupEventListeners() {
        // Listener global para mudanças de estado
        window.addEventListener('gameStateChange', (event) => {
            const { from, to, data } = event.detail;
            console.log(`🔄 State transition: ${from} → ${to}`, data);
        });
    }
    
    /**
     * Transiciona para um novo estado
     * @param {string} newState - Novo estado
     * @param {object} data - Dados adicionais para a transição
     * @returns {boolean} - Sucesso da transição
     */
    transitionTo(newState, data = {}) {
        if (!this.canTransition) {
            console.warn('⚠️ State transition blocked');
            return false;
        }
        
        if (!this.isValidState(newState)) {
            console.error(`❌ Invalid state: ${newState}`);
            return false;
        }
        
        if (!this.canTransitionTo(this.currentState, newState)) {
            console.error(`❌ Invalid transition: ${this.currentState} → ${newState}`);
            return false;
        }
        
        // Executar transição
        const previousState = this.currentState;
        this.previousState = previousState;
        this.currentState = newState;
        this.stateHistory.push({
            from: previousState,
            to: newState,
            timestamp: Date.now(),
            data
        });
        
        // Notificar listeners
        this.notifyStateChange(previousState, newState, data);
        
        // Executar ações específicas do estado
        this.executeStateActions(newState, data);
        
        console.log(`✅ State transitioned: ${previousState} → ${newState}`);
        return true;
    }
    
    /**
     * Verifica se um estado é válido
     * @param {string} state - Estado a verificar
     * @returns {boolean}
     */
    isValidState(state) {
        return Object.values(this.states).includes(state);
    }
    
    /**
     * Verifica se a transição é permitida
     * @param {string} from - Estado atual
     * @param {string} to - Estado destino
     * @returns {boolean}
     */
    canTransitionTo(from, to) {
        const validTransitions = {
            [this.states.LOGIN]: [
                this.states.CHARACTER_SELECT
            ],
            [this.states.CHARACTER_SELECT]: [
                this.states.LOGIN,
                this.states.LOADING_WORLD
            ],
            [this.states.LOADING_WORLD]: [
                this.states.CHARACTER_SELECT,
                this.states.IN_GAME
            ],
            [this.states.IN_GAME]: [
                this.states.CHARACTER_SELECT,
                this.states.LOADING_WORLD
            ]
        };
        
        return validTransitions[from]?.includes(to) || false;
    }
    
    /**
     * Notifica todos os listeners sobre mudança de estado
     * @param {string} from - Estado anterior
     * @param {string} to - Novo estado
     * @param {object} data - Dados da transição
     */
    notifyStateChange(from, to, data) {
        const event = new CustomEvent('gameStateChange', {
            detail: { from, to, data }
        });
        window.dispatchEvent(event);
        
        // Notificar listeners específicos
        const stateListeners = this.listeners.get(to) || [];
        stateListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Error in state listener for ${to}:`, error);
            }
        });
    }
    
    /**
     * Executa ações específicas do estado
     * @param {string} state - Estado atual
     * @param {object} data - Dados do estado
     */
    executeStateActions(state, data) {
        switch (state) {
            case this.states.LOGIN:
                this.showLoginScreen();
                break;
                
            case this.states.CHARACTER_SELECT:
                this.showCharacterScreen(data);
                break;
                
            case this.states.LOADING_WORLD:
                this.showLoadingScreen(data);
                break;
                
            case this.states.IN_GAME:
                this.startGameplay(data);
                break;
        }
    }
    
    /**
     * Mostra tela de login
     */
    showLoginScreen() {
        this.hideAllScreens();
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            console.log('🔑 Login screen displayed');
        }
    }
    
    /**
     * Mostra tela de seleção de personagem
     * @param {object} data - Dados do usuário
     */
    showCharacterScreen(data) {
        this.hideAllScreens();
        const characterScreen = document.getElementById('characterScreen');
        if (characterScreen) {
            characterScreen.style.display = 'flex';
            console.log('👥 Character screen displayed', data);
        }
    }
    
    /**
     * Mostra tela de carregamento
     * @param {object} data - Dados do mundo
     */
    showLoadingScreen(data) {
        this.hideAllScreens();
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            console.log('⏳ Loading screen displayed', data);
        }
    }
    
    /**
     * Inicia o gameplay
     * @param {object} data - Dados do mundo e personagem
     */
    startGameplay(data) {
        this.hideAllScreens();
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.style.display = 'flex';
            console.log('🎮 Gameplay started', data);
            
            // Notificar GameEngine para iniciar
            if (window.gameEngine) {
                window.gameEngine.initializeWorld(data);
            }
        }
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
     * Adiciona listener para um estado específico
     * @param {string} state - Estado para ouvir
     * @param {function} callback - Função callback
     */
    addStateListener(state, callback) {
        if (!this.listeners.has(state)) {
            this.listeners.set(state, []);
        }
        this.listeners.get(state).push(callback);
    }
    
    /**
     * Remove listener de um estado
     * @param {string} state - Estado
     * @param {function} callback - Função callback
     */
    removeStateListener(state, callback) {
        const stateListeners = this.listeners.get(state);
        if (stateListeners) {
            const index = stateListeners.indexOf(callback);
            if (index > -1) {
                stateListeners.splice(index, 1);
            }
        }
    }
    
    /**
     * Bloqueia/desbloqueia transições de estado
     * @param {boolean} canTransition - Permite transições
     */
    setTransitionLock(canTransition) {
        this.canTransition = canTransition;
        console.log(`🔒 State transitions ${canTransition ? 'unlocked' : 'locked'}`);
    }
    
    /**
     * Obtém o estado atual
     * @returns {string}
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Verifica se está em um estado específico
     * @param {string} state - Estado a verificar
     * @returns {boolean}
     */
    isState(state) {
        return this.currentState === state;
    }
    
    /**
     * Obtém histórico de transições
     * @returns {array}
     */
    getStateHistory() {
        return [...this.stateHistory];
    }
    
    /**
     * Reseta o GameStateManager
     */
    reset() {
        this.currentState = this.states.LOGIN;
        this.previousState = null;
        this.stateHistory = [];
        this.canTransition = true;
        console.log('🔄 GameStateManager reset');
    }
    
    /**
     * Obtém informações de debug
     * @returns {object}
     */
    getDebugInfo() {
        return {
            currentState: this.currentState,
            previousState: this.previousState,
            isInitialized: this.isInitialized,
            canTransition: this.canTransition,
            stateHistory: this.stateHistory,
            listenersCount: this.listeners.size
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.GameStateManager = GameStateManager;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManager;
}
