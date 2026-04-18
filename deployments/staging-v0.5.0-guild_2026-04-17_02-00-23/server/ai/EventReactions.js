/**
 * Event Reactions System - Enhanced AI System v0.3.7v
 * Sistema de reações a eventos do mundo para comportamentos dinâmicos
 */

class EventReactions {
    constructor() {
        this.reactions = new Map(); // eventType -> Reaction[]
        this.activeReactions = new Map(); // entityId -> ActiveReaction[]
        this.eventQueue = []; // Event[] para processamento
        this.reactionHistory = new Map(); // entityId -> ReactionHistory[]
        
        // Configuration
        this.config = {
            maxReactionDistance: 300,
            reactionDelay: 500, // ms
            maxConcurrentReactions: 10,
            priorityThreshold: 5,
            memoryDuration: 60000, // 1 minuto
            updateFrequency: 100 // ms
        };
        
        // Event listeners
        this.onReactionTriggered = null;
        this.onReactionCompleted = null;
        this.onEventProcessed = null;
        
        // Update loop
        this.isRunning = false;
        this.lastUpdateTime = 0;
        
        // Statistics
        this.stats = {
            eventsProcessed: 0,
            reactionsTriggered: 0,
            reactionsCompleted: 0,
            averageReactionTime: 0,
            eventTypeCounts: {}
        };
    }
    
    /**
     * Inicializa o sistema de reações a eventos
     */
    initialize() {
        this.setupDefaultReactions();
        this.startUpdateLoop();
        console.log('[EventReactions] Sistema de reações a eventos inicializado');
    }
    
    /**
     * Configura reações padrão
     */
    setupDefaultReactions() {
        // Reações a eventos de combate
        this.addReaction('player_attack', {
            id: 'combat_defense',
            priority: 8,
            conditions: [
                { type: 'distance', operator: 'less_than', value: 150 },
                { type: 'relationship', operator: 'equals', value: 'ally' },
                { type: 'health', operator: 'greater_than', value: 0.2 }
            ],
            actions: [
                { type: 'change_behavior', value: 'defensive' },
                { type: 'face_target', value: true },
                { type: 'call_help', probability: 0.7 }
            ],
            cooldown: 2000,
            memoryType: 'threat'
        });
        
        this.addReaction('player_attack', {
            id: 'flee_response',
            priority: 9,
            conditions: [
                { type: 'distance', operator: 'less_than', value: 100 },
                { type: 'relationship', operator: 'equals', value: 'neutral' },
                { type: 'personality', operator: 'equals', value: 'cowardly' },
                { type: 'health', operator: 'less_than', value: 0.5 }
            ],
            actions: [
                { type: 'change_behavior', value: 'flee' },
                { type: 'set_target', value: 'attacker' },
                { type: 'increase_speed', value: 1.5 }
            ],
            cooldown: 3000,
            memoryType: 'threat'
        });
        
        this.addReaction('player_attack', {
            id: 'aggressive_response',
            priority: 7,
            conditions: [
                { type: 'distance', operator: 'less_than', value: 200 },
                { type: 'relationship', operator: 'equals', value: 'enemy' },
                { type: 'personality', operator: 'in', value: ['aggressive', 'pack'] }
            ],
            actions: [
                { type: 'change_behavior', value: 'aggressive' },
                { type: 'set_target', value: 'attacker' },
                { type: 'call_allies', probability: 0.8 }
            ],
            cooldown: 1500,
            memoryType: 'threat'
        });
        
        // Reações a eventos de morte
        this.addReaction('mob_death', {
            id: 'vengeance',
            priority: 8,
            conditions: [
                { type: 'distance', operator: 'less_than', value: 150 },
                { type: 'relationship', operator: 'equals', value: 'ally' },
                { type: 'personality', operator: 'not_in', value: ['cowardly'] }
            ],
            actions: [
                { type: 'change_behavior', value: 'aggressive' },
                { type: 'set_target', value: 'killer' },
                { type: 'increase_damage', value: 1.2 }
            ],
            cooldown: 1000,
            memoryType: 'ally_death'
        });
        
        this.addReaction('mob_death', {
            id: 'fear_response',
            priority: 9,
            conditions: [
                { type: 'distance', operator: 'less_than', value: 100 },
                { type: 'relationship', operator: 'equals', value: 'neutral' },
                { type: 'personality', operator: 'equals', value: 'cowardly' }
            ],
            actions: [
                { type: 'change_behavior', value: 'flee' },
                { type: 'avoid_area', value: true },
                { type: 'hide', probability: 0.6 }
            ],
            cooldown: 4000,
            memoryType: 'danger'
        });
        
        // Reações a eventos de boss
        this.addReaction('boss_spawn', {
            id: 'boss_awareness',
            priority: 6,
            conditions: [
                { type: 'distance', operator: 'less_than', value: 400 },
                { type: 'level', operator: 'less_than', value: 10 }
            ],
            actions: [
                { type: 'change_behavior', value: 'cautious' },
                { type: 'avoid_area', value: true },
                { type: 'increase_alertness', value: 2.0 }
            ],
            cooldown: 5000,
            memoryType: 'boss_presence'
        });
        
        // Reações a eventos de item
        this.addReaction('item_dropped', {
            id: 'item_interest',
            priority: 5,
            conditions: [
                { type: 'distance', operator: 'less_than', value: 200 },
                { type: 'item_value', operator: 'greater_than', value: 50 },
                { type: 'personality', operator: 'not_in', value: ['aggressive'] }
            ],
            actions: [
                { type: 'change_behavior', value: 'interested' },
                { type: 'move_to_target', value: 'item' },
                { type: 'pick_up_item', probability: 0.8 }
            ],
            cooldown: 3000,
            memoryType: 'item_location'
        });
        
        // Reações a eventos de ambiente
        this.addReaction('environment_change', {
            id: 'weather_reaction',
            priority: 3,
            conditions: [
                { type: 'weather_type', operator: 'equals', value: 'rain' },
                { type: 'personality', operator: 'equals', value: 'forest_spirit' }
            ],
            actions: [
                { type: 'increase_stats', value: { speed: 1.2, regeneration: 1.5 } },
                { type: 'change_behavior', value: 'active' }
            ],
            cooldown: 10000,
            memoryType: 'environment'
        });
        
        this.addReaction('environment_change', {
            id: 'darkness_reaction',
            priority: 4,
            conditions: [
                { type: 'visibility', operator: 'less_than', value: 0.5 },
                { type: 'personality', operator: 'in', value: ['ambusher', 'dark_wisp'] }
            ],
            actions: [
                { type: 'increase_stats', value: { stealth: 2.0, damage: 1.3 } },
                { type: 'change_behavior', value: 'hunt' }
            ],
            cooldown: 8000,
            memoryType: 'environment'
        });
        
        // Reações a eventos sociais
        this.addReaction('social_call', {
            id: 'pack_response',
            priority: 7,
            conditions: [
                { type: 'distance', operator: 'less_than', value: 250 },
                { type: 'relationship', operator: 'equals', value: 'ally' },
                { type: 'personality', operator: 'in', value: ['pack', 'social'] }
            ],
            actions: [
                { type: 'respond_to_call', value: true },
                { type: 'move_to_caller', value: true },
                { type: 'change_behavior', value: 'cooperative' }
            ],
            cooldown: 2000,
            memoryType: 'social'
        });
        
        // Reações a eventos de perigo
        this.addReaction('danger_alert', {
            id: 'danger_avoidance',
            priority: 10,
            conditions: [
                { type: 'danger_level', operator: 'greater_than', value: 0.7 },
                { type: 'distance', operator: 'less_than', value: 200 }
            ],
            actions: [
                { type: 'change_behavior', value: 'flee' },
                { type: 'seek_cover', value: true },
                { type: 'alert_allies', value: true }
            ],
            cooldown: 1500,
            memoryType: 'danger'
        });
    }
    
    /**
     * Adiciona uma reação a um tipo de evento
     */
    addReaction(eventType, reaction) {
        if (!this.reactions.has(eventType)) {
            this.reactions.set(eventType, []);
        }
        
        const reactions = this.reactions.get(eventType);
        reactions.push({
            ...reaction,
            id: reaction.id || `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now()
        });
        
        // Ordenar por prioridade
        reactions.sort((a, b) => b.priority - a.priority);
        
        console.log(`[EventReactions] Reação '${reaction.id}' adicionada para evento '${eventType}'`);
    }
    
    /**
     * Remove uma reação
     */
    removeReaction(eventType, reactionId) {
        const reactions = this.reactions.get(eventType);
        if (!reactions) return false;
        
        const index = reactions.findIndex(r => r.id === reactionId);
        if (index !== -1) {
            reactions.splice(index, 1);
            console.log(`[EventReactions] Reação '${reactionId}' removida do evento '${eventType}'`);
            return true;
        }
        
        return false;
    }
    
    /**
     * Inicia loop de update
     */
    startUpdateLoop() {
        this.isRunning = true;
        this.updateLoop();
    }
    
    /**
     * Loop principal de update
     */
    updateLoop() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastUpdateTime;
        
        if (deltaTime >= this.config.updateFrequency) {
            this.processEventQueue();
            this.updateActiveReactions();
            this.cleanupOldReactions();
            this.lastUpdateTime = now;
        }
        
        // Próximo frame
        setTimeout(() => this.updateLoop(), 10);
    }
    
    /**
     * Processa fila de eventos
     */
    processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.processEvent(event);
        }
    }
    
    /**
     * Processa um evento específico
     */
    processEvent(event) {
        const startTime = Date.now();
        
        // Obter reações para este tipo de evento
        const reactions = this.reactions.get(event.type) || [];
        
        // Encontrar entidades afetadas
        const affectedEntities = this.findAffectedEntities(event);
        
        // Processar reações para cada entidade
        for (const entity of affectedEntities) {
            this.processEntityReactions(entity, event, reactions);
        }
        
        // Atualizar estatísticas
        const processingTime = Date.now() - startTime;
        this.updateEventStats(event.type, processingTime);
        
        // Trigger event
        if (this.onEventProcessed) {
            this.onEventProcessed(event, affectedEntities, processingTime);
        }
        
        this.stats.eventsProcessed++;
    }
    
    /**
     * Encontra entidades afetadas por um evento
     */
    findAffectedEntities(event) {
        const affected = [];
        const eventPosition = event.position || { x: 0, y: 0 };
        const maxDistance = event.radius || this.config.maxReactionDistance;
        
        // Implementar busca real de entidades
        // Por enquanto, retorna array vazio
        return affected;
    }
    
    /**
     * Processa reações para uma entidade específica
     */
    processEntityReactions(entity, event, reactions) {
        for (const reaction of reactions) {
            // Verificar se entidade já tem esta reação ativa
            if (this.hasActiveReaction(entity.id, reaction.id)) {
                continue;
            }
            
            // Verificar cooldown
            if (this.isReactionOnCooldown(entity.id, reaction.id)) {
                continue;
            }
            
            // Avaliar condições
            if (this.evaluateConditions(reaction.conditions, entity, event)) {
                this.triggerReaction(entity, event, reaction);
            }
        }
    }
    
    /**
     * Avalia condições de uma reação
     */
    evaluateConditions(conditions, entity, event) {
        if (!conditions || conditions.length === 0) return true;
        
        for (const condition of conditions) {
            if (!this.evaluateCondition(condition, entity, event)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Avalia condição individual
     */
    evaluateCondition(condition, entity, event) {
        switch (condition.type) {
            case 'distance':
                const distance = this.calculateDistance(entity.position, event.position);
                return this.compareValues(distance, condition.operator, condition.value);
                
            case 'relationship':
                const relationship = this.getRelationship(entity.id, event.sourceId);
                return this.compareValues(relationship, condition.operator, condition.value);
                
            case 'health':
                const healthPercentage = entity.stats.hp / entity.stats.maxHp;
                return this.compareValues(healthPercentage, condition.operator, condition.value);
                
            case 'personality':
                const personality = this.getPersonality(entity.type);
                if (condition.operator === 'equals') {
                    return personality === condition.value;
                } else if (condition.operator === 'in') {
                    return Array.isArray(condition.value) && condition.value.includes(personality);
                } else if (condition.operator === 'not_in') {
                    return Array.isArray(condition.value) && !condition.value.includes(personality);
                }
                return false;
                
            case 'level':
                const level = entity.level || 1;
                return this.compareValues(level, condition.operator, condition.value);
                
            case 'item_value':
                const itemValue = event.data?.value || 0;
                return this.compareValues(itemValue, condition.operator, condition.value);
                
            case 'weather_type':
                const weather = event.data?.weather || 'clear';
                return this.compareValues(weather, condition.operator, condition.value);
                
            case 'visibility':
                const visibility = event.data?.visibility || 1.0;
                return this.compareValues(visibility, condition.operator, condition.value);
                
            case 'danger_level':
                const dangerLevel = event.data?.dangerLevel || 0;
                return this.compareValues(dangerLevel, condition.operator, condition.value);
                
            default:
                console.warn(`[EventReactions] Tipo de condição desconhecido: ${condition.type}`);
                return false;
        }
    }
    
    /**
     * Compara valores usando operador
     */
    compareValues(value1, operator, value2) {
        switch (operator) {
            case 'equals': return value1 === value2;
            case 'not_equals': return value1 !== value2;
            case 'greater_than': return value1 > value2;
            case 'less_than': return value1 < value2;
            case 'greater_equal': return value1 >= value2;
            case 'less_equal': return value1 <= value2;
            case 'in': return Array.isArray(value2) && value2.includes(value1);
            case 'not_in': return Array.isArray(value2) && !value2.includes(value1);
            default: return false;
        }
    }
    
    /**
     * Dispara uma reação
     */
    triggerReaction(entity, event, reaction) {
        const activeReaction = {
            id: `${reaction.id}_${entity.id}_${Date.now()}`,
            entityId: entity.id,
            reactionId: reaction.id,
            eventType: event.type,
            startTime: Date.now(),
            endTime: null,
            actions: [...reaction.actions],
            completed: false,
            priority: reaction.priority
        };
        
        // Adicionar às reações ativas
        if (!this.activeReactions.has(entity.id)) {
            this.activeReactions.set(entity.id, []);
        }
        
        this.activeReactions.get(entity.id).push(activeReaction);
        
        // Adicionar cooldown
        this.addCooldown(entity.id, reaction.id, reaction.cooldown);
        
        // Adicionar à memória
        this.addToMemory(entity.id, reaction.memoryType, event);
        
        // Executar ações
        this.executeReactionActions(entity, event, activeReaction);
        
        // Trigger event
        if (this.onReactionTriggered) {
            this.onReactionTriggered(entity, event, reaction, activeReaction);
        }
        
        this.stats.reactionsTriggered++;
        console.log(`[EventReactions] Reação '${reaction.id}' disparada para entidade ${entity.id}`);
    }
    
    /**
     * Executa ações de uma reação
     */
    executeReactionActions(entity, event, activeReaction) {
        for (const action of activeReaction.actions) {
            // Verificar probabilidade
            if (action.probability && Math.random() > action.probability) {
                continue;
            }
            
            this.executeAction(entity, event, action);
        }
    }
    
    /**
     * Executa uma ação específica
     */
    executeAction(entity, event, action) {
        switch (action.type) {
            case 'change_behavior':
                this.changeBehavior(entity.id, action.value);
                break;
                
            case 'face_target':
                this.faceTarget(entity.id, event.sourceId);
                break;
                
            case 'call_help':
                this.callHelp(entity.id, event.position);
                break;
                
            case 'set_target':
                this.setTarget(entity.id, action.value === 'attacker' ? event.sourceId : action.value);
                break;
                
            case 'increase_speed':
                this.increaseSpeed(entity.id, action.value);
                break;
                
            case 'call_allies':
                this.callAllies(entity.id, event.position);
                break;
                
            case 'avoid_area':
                this.avoidArea(entity.id, event.position);
                break;
                
            case 'hide':
                this.hide(entity.id);
                break;
                
            case 'increase_damage':
                this.increaseDamage(entity.id, action.value);
                break;
                
            case 'increase_alertness':
                this.increaseAlertness(entity.id, action.value);
                break;
                
            case 'move_to_target':
                this.moveToTarget(entity.id, action.value);
                break;
                
            case 'pick_up_item':
                this.pickUpItem(entity.id, event.data);
                break;
                
            case 'increase_stats':
                this.increaseStats(entity.id, action.value);
                break;
                
            case 'respond_to_call':
                this.respondToCall(entity.id, event.sourceId);
                break;
                
            case 'move_to_caller':
                this.moveToCaller(entity.id, event.sourceId);
                break;
                
            case 'seek_cover':
                this.seekCover(entity.id, event.position);
                break;
                
            case 'alert_allies':
                this.alertAllies(entity.id, event.position);
                break;
                
            default:
                console.warn(`[EventReactions] Tipo de ação desconhecido: ${action.type}`);
        }
    }
    
    /**
     * Atualiza reações ativas
     */
    updateActiveReactions() {
        const now = Date.now();
        
        for (const [entityId, reactions] of this.activeReactions) {
            const activeReactions = [];
            
            for (const reaction of reactions) {
                // Verificar se reação deve continuar
                if (this.shouldContinueReaction(reaction, now)) {
                    activeReactions.push(reaction);
                } else {
                    // Completar reação
                    reaction.endTime = now;
                    reaction.completed = true;
                    
                    // Trigger completion event
                    if (this.onReactionCompleted) {
                        this.onReactionCompleted(reaction);
                    }
                    
                    this.stats.reactionsCompleted++;
                }
            }
            
            // Atualizar reações ativas da entidade
            if (activeReactions.length > 0) {
                this.activeReactions.set(entityId, activeReactions);
            } else {
                this.activeReactions.delete(entityId);
            }
        }
    }
    
    /**
     * Verifica se reação deve continuar
     */
    shouldContinueReaction(reaction, now) {
        // Reações instantâneas não continuam
        const instantActions = ['change_behavior', 'face_target', 'set_target', 'call_help'];
        const hasInstantAction = reaction.actions.some(action => instantActions.includes(action.type));
        
        if (hasInstantAction) {
            return false;
        }
        
        // Reações com duração específica
        const durationActions = reaction.actions.filter(action => action.duration);
        if (durationActions.length > 0) {
            const maxDuration = Math.max(...durationActions.map(action => action.duration));
            return (now - reaction.startTime) < maxDuration;
        }
        
        // Padrão: continuar por 5 segundos
        return (now - reaction.startTime) < 5000;
    }
    
    /**
     * Limpa reações antigas
     */
    cleanupOldReactions() {
        const now = Date.now();
        const maxAge = this.config.memoryDuration;
        
        for (const [entityId, history] of this.reactionHistory) {
            const recentHistory = history.filter(reaction => 
                now - reaction.timestamp < maxAge
            );
            
            if (recentHistory.length === 0) {
                this.reactionHistory.delete(entityId);
            } else {
                this.reactionHistory.set(entityId, recentHistory);
            }
        }
    }
    
    /**
     * Adiciona evento à fila
     */
    queueEvent(event) {
        this.eventQueue.push({
            ...event,
            timestamp: Date.now(),
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
    }
    
    /**
     * Métodos utilitários
     */
    
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getRelationship(entityId, targetId) {
        // Implementar lógica de relacionamento
        return 'neutral'; // Placeholder
    }
    
    getPersonality(entityType) {
        // Implementar mapeamento de personalidade
        return 'aggressive'; // Placeholder
    }
    
    hasActiveReaction(entityId, reactionId) {
        const reactions = this.activeReactions.get(entityId) || [];
        return reactions.some(r => r.reactionId === reactionId && !r.completed);
    }
    
    isReactionOnCooldown(entityId, reactionId) {
        // Implementar sistema de cooldown
        return false; // Placeholder
    }
    
    addCooldown(entityId, reactionId, duration) {
        // Implementar sistema de cooldown
    }
    
    addToMemory(entityId, memoryType, event) {
        if (!this.reactionHistory.has(entityId)) {
            this.reactionHistory.set(entityId, []);
        }
        
        const history = this.reactionHistory.get(entityId);
        history.push({
            type: memoryType,
            event: event,
            timestamp: Date.now()
        });
    }
    
    // Métodos de execução de ações (precisam ser integrados)
    
    changeBehavior(entityId, behavior) {
        console.log(`[EventReactions] Entidade ${entityId} mudando comportamento para: ${behavior}`);
    }
    
    faceTarget(entityId, targetId) {
        console.log(`[EventReactions] Entidade ${entityId} virando para alvo ${targetId}`);
    }
    
    callHelp(entityId, position) {
        console.log(`[EventReactions] Entidade ${entityId} chamando ajuda em`, position);
    }
    
    setTarget(entityId, targetId) {
        console.log(`[EventReactions] Entidade ${entityId} definindo alvo: ${targetId}`);
    }
    
    increaseSpeed(entityId, multiplier) {
        console.log(`[EventReactions] Entidade ${entityId} aumentando velocidade: ${multiplier}x`);
    }
    
    callAllies(entityId, position) {
        console.log(`[EventReactions] Entidade ${entityId} chamando aliados em`, position);
    }
    
    avoidArea(entityId, position) {
        console.log(`[EventReactions] Entidade ${entityId} evitando área`, position);
    }
    
    hide(entityId) {
        console.log(`[EventReactions] Entidade ${entityId} se escondendo`);
    }
    
    increaseDamage(entityId, multiplier) {
        console.log(`[EventReactions] Entidade ${entityId} aumentando dano: ${multiplier}x`);
    }
    
    increaseAlertness(entityId, multiplier) {
        console.log(`[EventReactions] Entidade ${entityId} aumentando alerta: ${multiplier}x`);
    }
    
    moveToTarget(entityId, target) {
        console.log(`[EventReactions] Entidade ${entityId} se movendo para: ${target}`);
    }
    
    pickUpItem(entityId, itemData) {
        console.log(`[EventReactions] Entidade ${entityId} pegando item:`, itemData);
    }
    
    increaseStats(entityId, stats) {
        console.log(`[EventReactions] Entidade ${entityId} aumentando stats:`, stats);
    }
    
    respondToCall(entityId, callerId) {
        console.log(`[EventReactions] Entidade ${entityId} respondendo à chamada de ${callerId}`);
    }
    
    moveToCaller(entityId, callerId) {
        console.log(`[EventReactions] Entidade ${entityId} se movendo para chamador ${callerId}`);
    }
    
    seekCover(entityId, dangerPosition) {
        console.log(`[EventReactions] Entidade ${entityId} procurando cobertura de`, dangerPosition);
    }
    
    alertAllies(entityId, dangerPosition) {
        console.log(`[EventReactions] Entidade ${entityId} alertando aliados sobre`, dangerPosition);
    }
    
    /**
     * Atualiza estatísticas de eventos
     */
    updateEventStats(eventType, processingTime) {
        if (!this.stats.eventTypeCounts[eventType]) {
            this.stats.eventTypeCounts[eventType] = {
                count: 0,
                totalProcessingTime: 0
            };
        }
        
        this.stats.eventTypeCounts[eventType].count++;
        this.stats.eventTypeCounts[eventType].totalProcessingTime += processingTime;
        
        this.stats.averageReactionTime = 
            (this.stats.averageReactionTime * (this.stats.eventsProcessed - 1) + processingTime) / 
            this.stats.eventsProcessed;
    }
    
    /**
     * Obtém estatísticas do sistema
     */
    getStatistics() {
        return {
            ...this.stats,
            activeReactions: Array.from(this.activeReactions.values()).flat().length,
            queuedEvents: this.eventQueue.length,
            memorySize: this.reactionHistory.size,
            averageReactionTime: this.stats.averageReactionTime.toFixed(2) + 'ms'
        };
    }
    
    /**
     * Para o sistema de reações
     */
    stop() {
        this.isRunning = false;
        console.log('[EventReactions] Sistema de reações a eventos parado');
    }
}

module.exports = EventReactions;
