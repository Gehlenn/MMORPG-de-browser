/**
 * EventBus - Sistema de eventos desacoplado para comunicação entre módulos
 * 
 * Uso:
 *   window.eventBus.on('eventName', callback);
 *   window.eventBus.emit('eventName', data);
 *   window.eventBus.off('eventName', callback);
 * 
 * Benefícios:
 * - Desacopla módulos (não precisam conhecer uns aos outros)
 * - Facilita testes unitários
 * - Permite múltiplos listeners para o mesmo evento
 * - Evita dependências circulares
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
        this.onceListeners = new Map();
    }

    /**
     * Registra um listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser chamada
     * @returns {Function} Função para remover o listener
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // Retorna função para remover listener
        return () => this.off(event, callback);
    }

    /**
     * Registra um listener que será chamado apenas uma vez
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser chamada
     * @returns {Function} Função para remover o listener
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        return this.on(event, wrapper);
    }

    /**
     * Emite um evento para todos os listeners
     * @param {string} event - Nome do evento
     * @param {*} data - Dados a serem passados
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ EventBus: Erro no listener de "${event}":`, error);
                }
            });
        }
    }

    /**
     * Remove um listener específico
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser removida
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            const listeners = this.listeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
            // Remove array vazio
            if (listeners.length === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Remove todos os listeners de um evento
     * @param {string} event - Nome do evento
     */
    offAll(event) {
        this.listeners.delete(event);
    }

    /**
     * Verifica se há listeners para um evento
     * @param {string} event - Nome do evento
     * @returns {boolean}
     */
    hasListeners(event) {
        return this.listeners.has(event) && this.listeners.get(event).length > 0;
    }

    /**
     * Retorna o número de listeners para um evento
     * @param {string} event - Nome do evento
     * @returns {number}
     */
    listenerCount(event) {
        if (!this.listeners.has(event)) return 0;
        return this.listeners.get(event).length;
    }

    /**
     * Limpa todos os listeners
     */
    clear() {
        this.listeners.clear();
        console.log('🧹 EventBus: Todos os listeners removidos');
    }
}

// Criar instância global
window.EventBus = EventBus;
window.eventBus = new EventBus();

console.log('✅ EventBus inicializado - Comunicação entre módulos desacoplada');
