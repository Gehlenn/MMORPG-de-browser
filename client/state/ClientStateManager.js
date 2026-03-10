// === CLIENT STATE MANAGER ===

/**
 * Gerenciador de estados do cliente
 * Controla o fluxo correto do jogo
 */

export const ClientStates = {
    LOGIN: 'LOGIN',
    CHARACTER_SELECT: 'CHARACTER_SELECT',
    LOADING_WORLD: 'LOADING_WORLD',
    IN_GAME: 'IN_GAME'
};

export class ClientStateManager {
    constructor() {
        this.currentState = ClientStates.LOGIN;
        this.previousState = null;
        this.stateHistory = [];
        this.stateCallbacks = new Map();
        
        console.log('🎮 ClientStateManager initialized with state:', this.currentState);
    }
    
    // === STATE MANAGEMENT ===
    
    getCurrentState() {
        return this.currentState;
    }
    
    getPreviousState() {
        return this.previousState;
    }
    
    getStateHistory() {
        return [...this.stateHistory];
    }
    
    setState(newState, context = {}) {
        if (!Object.values(ClientStates).includes(newState)) {
            console.error('❌ Invalid state:', newState);
            return false;
        }
        
        // Verificar transição válida
        if (!this.isValidTransition(this.currentState, newState)) {
            console.error(`❌ Invalid transition: ${this.currentState} → ${newState}`);
            return false;
        }
        
        this.previousState = this.currentState;
        this.stateHistory.push({
            from: this.currentState,
            to: newState,
            timestamp: Date.now(),
            context: context
        });
        
        console.log(`🔄 State transition: ${this.currentState} → ${newState}`);
        this.currentState = newState;
        
        // Executar callbacks
        this.executeStateCallbacks(newState, context);
        
        // Limpar histórico (manter apenas últimos 10)
        if (this.stateHistory.length > 10) {
            this.stateHistory = this.stateHistory.slice(-10);
        }
        
        return true;
    }
    
    isValidTransition(fromState, toState) {
        // Transições válidas
        const validTransitions = {
            [ClientStates.LOGIN]: [ClientStates.CHARACTER_SELECT],
            [ClientStates.CHARACTER_SELECT]: [ClientStates.LOADING_WORLD, ClientStates.LOGIN],
            [ClientStates.LOADING_WORLD]: [ClientStates.IN_GAME, ClientStates.CHARACTER_SELECT],
            [ClientStates.IN_GAME]: [ClientStates.CHARACTER_SELECT, ClientStates.LOGIN]
        };
        
        return validTransitions[fromState]?.includes(toState) || false;
    }
    
    // === CALLBACK SYSTEM ===
    
    onStateChange(state, callback) {
        if (!this.stateCallbacks.has(state)) {
            this.stateCallbacks.set(state, []);
        }
        
        this.stateCallbacks.get(state).push(callback);
        console.log(`📝 Callback registered for state: ${state}`);
    }
    
    removeStateCallback(state, callback) {
        if (this.stateCallbacks.has(state)) {
            const callbacks = this.stateCallbacks.get(state);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
                console.log(`🗑️ Callback removed for state: ${state}`);
            }
        }
    }
    
    executeStateCallbacks(state, context) {
        if (this.stateCallbacks.has(state)) {
            const callbacks = this.stateCallbacks.get(state);
            callbacks.forEach(callback => {
                try {
                    callback(state, context);
                } catch (error) {
                    console.error(`❌ Error in state callback for ${state}:`, error);
                }
            });
        }
    }
    
    // === STATE GUARDS ===
    
    canAccessGameplay() {
        return this.currentState === ClientStates.IN_GAME;
    }
    
    canAccessCharacterSelect() {
        return this.currentState === ClientStates.CHARACTER_SELECT;
    }
    
    canAccessLogin() {
        return this.currentState === ClientStates.LOGIN;
    }
    
    isLoading() {
        return this.currentState === ClientStates.LOADING_WORLD;
    }
    
    // === UTILITY METHODS ===
    
    reset() {
        console.log('🔄 Resetting ClientStateManager');
        this.currentState = ClientStates.LOGIN;
        this.previousState = null;
        this.stateHistory = [];
        this.stateCallbacks.clear();
    }
    
    getStateInfo() {
        return {
            current: this.currentState,
            previous: this.previousState,
            history: this.stateHistory,
            canAccessGameplay: this.canAccessGameplay(),
            canAccessCharacterSelect: this.canAccessCharacterSelect(),
            canAccessLogin: this.canAccessLogin(),
            isLoading: this.isLoading()
        };
    }
    
    logStateHistory() {
        console.log('\n📋 === STATE HISTORY ===');
        this.stateHistory.forEach((entry, index) => {
            console.log(`${index + 1}. ${entry.from} → ${entry.to} (${new Date(entry.timestamp).toLocaleTimeString()})`);
            if (entry.context && Object.keys(entry.context).length > 0) {
                console.log(`   Context:`, entry.context);
            }
        });
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.ClientStateManager = ClientStateManager;
    window.ClientStates = ClientStates;
}
