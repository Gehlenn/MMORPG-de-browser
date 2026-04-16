/**
 * State Manager - Sistema Centralizado de Estado
 * Gerencia estado global do jogo de forma reativa e centralizada
 * Version 1.0.0 - Refactoring
 */

class StateManager {
    constructor() {
        this.state = new Proxy({}, {
            get(target, prop) {
                console.log(`📖 Lendo estado: ${prop}`);
                return target[prop];
            },
            set(target, prop, value) {
                console.log(`📝 Escrevendo estado: ${prop} =`, value);
                
                // Notificar mudanças de estado
                this.notifyStateChange(prop, value);
                
                target[prop] = value;
                return true;
            }
        });
        
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 100;
    }
    
    /**
     * Define um valor no estado
     */
    set(key, value) {
        this.state[key] = value;
        this.addToHistory(key, value);
    }
    
    /**
     * Obtém um valor do estado
     */
    get(key) {
        return this.state[key];
    }
    
    /**
     * Remove uma chave do estado
     */
    delete(key) {
        delete this.state[key];
        this.addToHistory(key, undefined);
    }
    
    /**
     * Verifica se uma chave existe no estado
     */
    has(key) {
        return key in this.state;
    }
    
    /**
     * Adiciona listener para mudanças de estado
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }
    
    /**
     * Remove listener de estado
     */
    unsubscribe(key, callback) {
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * Notifica listeners sobre mudança de estado
     */
    notifyStateChange(key, value) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(key, value);
                } catch (error) {
                    console.error(`❌ Erro no listener de estado ${key}:`, error);
                }
            });
        }
    }
    
    /**
     * Adiciona ao histórico de mudanças
     */
    addToHistory(key, value) {
        this.history.push({
            timestamp: Date.now(),
            key,
            value,
            type: value === undefined ? 'delete' : 'set'
        });
        
        // Manter apenas as mudanças mais recentes
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }
    
    /**
     * Obtém estado completo (snapshot)
     */
    getSnapshot() {
        return { ...this.state };
    }
    
    /**
     * Restaura estado de um snapshot
     */
    restoreSnapshot(snapshot) {
        Object.keys(this.state).forEach(key => {
            delete this.state[key];
        });
        Object.assign(this.state, snapshot);
    }
    
    /**
     * Limpa todo o estado
     */
    clear() {
        Object.keys(this.state).forEach(key => {
            delete this.state[key];
        });
        this.history = [];
    }
    
    /**
     * Obtém histórico de mudanças
     */
    getHistory(limit = 10) {
        return this.history.slice(-limit);
    }
    
    /**
     * Debug: imprime estado atual
     */
    debug() {
        console.log('🔍 Estado Atual:', this.state);
        console.log('📚 Histórico Recente:', this.getHistory(5));
    }
}

// Exportar para uso global
window.StateManager = StateManager;
