/**
 * Decision Tree System - Enhanced AI System v0.3.7v
 * Sistema de árvores de decisão para comportamentos dinâmicos e contextuais
 */

class DecisionTree {
    constructor() {
        this.trees = new Map(); // treeName -> TreeData
        this.context = new Map(); // contextName -> ContextData
        this.variables = new Map(); // varName -> VariableData
        this.functions = new Map(); // funcName -> Function
        
        // Configuration
        this.config = {
            maxDepth: 10,
            maxNodes: 1000,
            evaluationTimeout: 100, // ms
            cacheSize: 500,
            optimizationThreshold: 0.1
        };
        
        // Performance cache
        this.evaluationCache = new Map(); // key -> Result
        this.nodeCache = new Map(); // nodeId -> Node
        
        // Event listeners
        this.onDecisionMade = null;
        this.onTreeOptimized = null;
        this.onContextUpdated = null;
        
        // Statistics
        this.stats = {
            evaluations: 0,
            cacheHits: 0,
            averageEvaluationTime: 0,
            treeOptimizations: 0
        };
    }
    
    /**
     * Inicializa o sistema de árvores de decisão
     */
    initialize() {
        this.setupDefaultFunctions();
        this.createDefaultTrees();
        console.log('[DecisionTree] Sistema de árvores de decisão inicializado');
    }
    
    /**
     * Configura funções padrão
     */
    setupDefaultFunctions() {
        // Funções matemáticas
        this.functions.set('abs', Math.abs);
        this.functions.set('min', Math.min);
        this.functions.set('max', Math.max);
        this.functions.set('random', Math.random);
        this.functions.set('floor', Math.floor);
        this.functions.set('ceil', Math.ceil);
        this.functions.set('round', Math.round);
        
        // Funções de comparação
        this.functions.set('equals', (a, b) => a === b);
        this.functions.set('not_equals', (a, b) => a !== b);
        this.functions.set('greater_than', (a, b) => a > b);
        this.functions.set('less_than', (a, b) => a < b);
        this.functions.set('greater_equal', (a, b) => a >= b);
        this.functions.set('less_equal', (a, b) => a <= b);
        
        // Funções lógicas
        this.functions.set('and', (...args) => args.every(arg => arg));
        this.functions.set('or', (...args) => args.some(arg => arg));
        this.functions.set('not', (arg) => !arg);
        this.functions.set('xor', (a, b) => a !== b);
        
        // Funções de array
        this.functions.set('length', (arr) => Array.isArray(arr) ? arr.length : 0);
        this.functions.set('contains', (arr, item) => Array.isArray(arr) && arr.includes(item));
        this.functions.set('first', (arr) => Array.isArray(arr) ? arr[0] : null);
        this.functions.set('last', (arr) => Array.isArray(arr) ? arr[arr.length - 1] : null);
        
        // Funções de string
        this.functions.set('to_upper', (str) => String(str).toUpperCase());
        this.functions.set('to_lower', (str) => String(str).toLowerCase());
        this.functions.set('substring', (str, start, end) => String(str).substring(start, end));
        
        // Funções especializadas para AI
        this.functions.set('distance', (pos1, pos2) => {
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            return Math.sqrt(dx * dx + dy * dy);
        });
        
        this.functions.set('angle_to', (from, to) => {
            return Math.atan2(to.y - from.y, to.x - from.x);
        });
        
        this.functions.set('normalize', (value, min, max) => {
            return (value - min) / (max - min);
        });
        
        this.functions.set('clamp', (value, min, max) => {
            return Math.max(min, Math.min(max, value));
        });
    }
    
    /**
     * Cria árvores de decisão padrão
     */
    createDefaultTrees() {
        // Árvore de decisão para comportamento de combate
        this.createTree('combat_behavior', {
            root: {
                id: 'combat_root',
                type: 'condition',
                operator: 'and',
                conditions: [
                    { variable: 'in_combat', operator: 'equals', value: true },
                    { variable: 'has_target', operator: 'equals', value: true }
                ],
                true: {
                    id: 'evaluate_threat',
                    type: 'condition',
                    operator: 'greater_than',
                    variable: 'target_threat_level',
                    value: 0.7,
                    true: {
                        id: 'high_threat_response',
                        type: 'condition',
                        operator: 'greater_than',
                        variable: 'health_percentage',
                        value: 0.5,
                        true: {
                            id: 'aggressive_attack',
                            type: 'action',
                            action: 'aggressive_assault',
                            priority: 10
                        },
                        false: {
                            id: 'defensive_tactics',
                            type: 'action',
                            action: 'defensive_position',
                            priority: 8
                        }
                    },
                    false: {
                        id: 'low_threat_response',
                        type: 'condition',
                        operator: 'less_than',
                        variable: 'distance_to_target',
                        value: 50,
                        true: {
                            id: 'melee_range',
                            type: 'action',
                            action: 'melee_attack',
                            priority: 6
                        },
                        false: {
                            id: 'ranged_response',
                            type: 'condition',
                            operator: 'has_ability',
                            variable: 'ranged_attack',
                            true: {
                                id: 'ranged_attack',
                                type: 'action',
                                action: 'ranged_assault',
                                priority: 7
                            },
                            false: {
                                id: 'approach_target',
                                type: 'action',
                                action: 'approach',
                                priority: 5
                            }
                        }
                    }
                },
                false: {
                    id: 'not_in_combat',
                    type: 'condition',
                    operator: 'greater_than',
                    variable: 'health_percentage',
                    value: 0.8,
                    true: {
                        id: 'patrol_behavior',
                        type: 'action',
                        action: 'patrol',
                        priority: 3
                    },
                    false: {
                        id: 'rest_behavior',
                        type: 'action',
                        action: 'rest',
                        priority: 2
                    }
                }
            }
        });
        
        // Árvore de decisão para reação a eventos
        this.createTree('event_reaction', {
            root: {
                id: 'event_root',
                type: 'condition',
                variable: 'has_event',
                operator: 'equals',
                value: true,
                true: {
                    id: 'evaluate_event_type',
                    type: 'switch',
                    variable: 'event_type',
                    cases: {
                        'player_attack': {
                            id: 'combat_reaction',
                            type: 'condition',
                            operator: 'greater_than',
                            variable: 'attacker_threat',
                            value: 0.5,
                            true: {
                                id: 'high_threat_reaction',
                                type: 'action',
                                action: 'call_help',
                                priority: 9
                            },
                            false: {
                                id: 'low_threat_reaction',
                                type: 'action',
                                action: 'defend',
                                priority: 6
                            }
                        },
                        'ally_died': {
                            id: 'death_reaction',
                            type: 'condition',
                            operator: 'less_than',
                            variable: 'health_percentage',
                            value: 0.3,
                            true: {
                                id: 'flee_response',
                                type: 'action',
                                action: 'flee',
                                priority: 8
                            },
                            false: {
                                id: 'vengeance_response',
                                type: 'action',
                                action: 'avenge_ally',
                                priority: 7
                            }
                        },
                        'item_dropped': {
                            id: 'item_reaction',
                            type: 'condition',
                            operator: 'greater_than',
                            variable: 'item_value',
                            value: 100,
                            true: {
                                id: 'valuable_item',
                                type: 'action',
                                action: 'prioritize_item',
                                priority: 8
                            },
                            false: {
                                id: 'common_item',
                                type: 'action',
                                action: 'ignore_item',
                                priority: 1
                            }
                        }
                    },
                    default: {
                        id: 'default_reaction',
                        type: 'action',
                        action: 'investigate',
                        priority: 4
                    }
                },
                false: {
                    id: 'no_event',
                    type: 'action',
                    action: 'continue_current',
                    priority: 0
                }
            }
        });
        
        // Árvore de decisão para seleção de alvo
        this.createTree('target_selection', {
            root: {
                id: 'target_root',
                type: 'condition',
                operator: 'greater_than',
                variable: 'available_targets_count',
                value: 0,
                true: {
                    id: 'evaluate_targets',
                    type: 'condition',
                    operator: 'and',
                    conditions: [
                        { variable: 'has_priority_target', operator: 'equals', value: true },
                        { variable: 'priority_target_alive', operator: 'equals', value: true }
                    ],
                    true: {
                        id: 'select_priority',
                        type: 'action',
                        action: 'target_priority',
                        priority: 10
                    },
                    false: {
                        id: 'evaluate_threats',
                        type: 'condition',
                        operator: 'greater_than',
                        variable: 'highest_threat_level',
                        value: 0.6,
                        true: {
                            id: 'target_highest_threat',
                            type: 'action',
                            action: 'target_highest_threat',
                            priority: 8
                        },
                        false: {
                            id: 'target_closest',
                            type: 'action',
                            action: 'target_closest',
                            priority: 6
                        }
                    }
                },
                false: {
                    id: 'no_targets',
                    type: 'action',
                    action: 'no_target',
                    priority: 0
                }
            }
        });
        
        // Árvore de decisão para uso de habilidades
        this.createTree('ability_usage', {
            root: {
                id: 'ability_root',
                type: 'condition',
                operator: 'and',
                conditions: [
                    { variable: 'in_combat', operator: 'equals', value: true },
                    { variable: 'has_ready_abilities', operator: 'equals', value: true }
                ],
                true: {
                    id: 'evaluate_ability_context',
                    type: 'condition',
                    operator: 'greater_than',
                    variable: 'enemies_count',
                    value: 3,
                    true: {
                        id: 'area_abilities',
                        type: 'condition',
                        operator: 'has_ability',
                        variable: 'area_attack',
                        true: {
                            id: 'use_area_attack',
                            type: 'action',
                            action: 'cast_area_attack',
                            priority: 9
                        },
                        false: {
                            id: 'use_buff',
                            type: 'action',
                            action: 'cast_buff',
                            priority: 7
                        }
                    },
                    false: {
                        id: 'single_target_abilities',
                        type: 'condition',
                        operator: 'less_than',
                        variable: 'health_percentage',
                        value: 0.3,
                        true: {
                            id: 'defensive_abilities',
                            type: 'condition',
                            operator: 'has_ability',
                            variable: 'heal',
                            true: {
                                id: 'use_heal',
                                type: 'action',
                                action: 'cast_heal',
                                priority: 10
                            },
                            false: {
                                id: 'use_defensive_buff',
                                type: 'action',
                                action: 'cast_defensive_buff',
                                priority: 8
                            }
                        },
                        false: {
                            id: 'offensive_abilities',
                            type: 'condition',
                            operator: 'has_ability',
                            variable: 'debuff',
                            true: {
                                id: 'use_debuff',
                                type: 'action',
                                action: 'cast_debuff',
                                priority: 7
                            },
                            false: {
                                id: 'use_basic_attack',
                                type: 'action',
                                action: 'basic_attack',
                                priority: 5
                            }
                        }
                    }
                },
                false: {
                    id: 'no_abilities',
                    type: 'action',
                    action: 'basic_attack',
                    priority: 3
                }
            }
        });
    }
    
    /**
     * Cria uma nova árvore de decisão
     */
    createTree(name, treeData) {
        const tree = {
            name: name,
            root: treeData.root,
            nodes: new Map(), // nodeId -> Node
            variables: new Set(), // Variables usadas na árvore
            functions: new Set(), // Functions usadas na árvore
            depth: 0,
            nodeCount: 0,
            optimized: false
        };
        
        // Processar nós e coletar informações
        this.processTreeNodes(tree, tree.root, 0);
        
        this.trees.set(name, tree);
        console.log(`[DecisionTree] Árvore '${name}' criada com ${tree.nodeCount} nós, profundidade ${tree.depth}`);
    }
    
    /**
     * Processa nós da árvore para coletar informações
     */
    processTreeNodes(tree, node, depth) {
        if (!node) return;
        
        tree.nodes.set(node.id, node);
        tree.depth = Math.max(tree.depth, depth);
        tree.nodeCount++;
        
        // Coletar variáveis e funções usadas
        this.collectNodeUsage(node, tree);
        
        // Processar filhos recursivamente
        if (node.true) {
            this.processTreeNodes(tree, node.true, depth + 1);
        }
        if (node.false) {
            this.processTreeNodes(tree, node.false, depth + 1);
        }
        if (node.cases) {
            for (const caseNode of Object.values(node.cases)) {
                this.processTreeNodes(tree, caseNode, depth + 1);
            }
        }
        if (node.default) {
            this.processTreeNodes(tree, node.default, depth + 1);
        }
    }
    
    /**
     * Coleta variáveis e funções usadas em um nó
     */
    collectNodeUsage(node, tree) {
        switch (node.type) {
            case 'condition':
                if (node.variable) {
                    tree.variables.add(node.variable);
                }
                if (node.operator && this.functions.has(node.operator)) {
                    tree.functions.add(node.operator);
                }
                if (node.conditions) {
                    for (const condition of node.conditions) {
                        if (condition.variable) {
                            tree.variables.add(condition.variable);
                        }
                        if (condition.operator && this.functions.has(condition.operator)) {
                            tree.functions.add(condition.operator);
                        }
                    }
                }
                break;
                
            case 'function':
                if (node.function && this.functions.has(node.function)) {
                    tree.functions.add(node.function);
                }
                if (node.parameters) {
                    for (const param of node.parameters) {
                        if (param.variable) {
                            tree.variables.add(param.variable);
                        }
                    }
                }
                break;
                
            case 'action':
                // Actions podem ter variáveis implícitas
                break;
        }
    }
    
    /**
     * Avalia uma árvore de decisão
     */
    evaluateTree(treeName, context) {
        const startTime = Date.now();
        
        // Verificar cache
        const cacheKey = this.generateCacheKey(treeName, context);
        const cachedResult = this.evaluationCache.get(cacheKey);
        
        if (cachedResult && this.isCacheValid(cachedResult)) {
            this.stats.cacheHits++;
            return cachedResult.result;
        }
        
        const tree = this.trees.get(treeName);
        if (!tree) {
            throw new Error(`Árvore '${treeName}' não encontrada`);
        }
        
        try {
            // Preparar contexto
            const evaluationContext = this.prepareContext(context);
            
            // Avaliar árvore
            const result = this.evaluateNode(tree.root, evaluationContext, treeName, 0);
            
            // Adicionar ao cache
            this.evaluationCache.set(cacheKey, {
                result: result,
                timestamp: Date.now(),
                contextHash: this.hashContext(context)
            });
            
            // Atualizar estatísticas
            const evaluationTime = Date.now() - startTime;
            this.updateStats(evaluationTime);
            
            // Trigger event
            if (this.onDecisionMade) {
                this.onDecisionMade(treeName, result, context, evaluationTime);
            }
            
            this.stats.evaluations++;
            return result;
            
        } catch (error) {
            console.error(`[DecisionTree] Erro avaliando árvore '${treeName}':`, error);
            return { action: 'error', priority: 0, error: error.message };
        }
    }
    
    /**
     * Prepara contexto para avaliação
     */
    prepareContext(context) {
        const evaluationContext = {
            ...context,
            variables: new Map(),
            functions: this.functions
        };
        
        // Adicionar variáveis do contexto
        for (const [key, value] of Object.entries(context)) {
            evaluationContext.variables.set(key, value);
        }
        
        return evaluationContext;
    }
    
    /**
     * Avalia um nó da árvore
     */
    evaluateNode(node, context, treeName, depth) {
        // Verificar limite de profundidade
        if (depth > this.config.maxDepth) {
            console.warn(`[DecisionTree] Profundidade máxima excedida na árvore '${treeName}'`);
            return { action: 'timeout', priority: 0 };
        }
        
        // Verificar timeout
        if (Date.now() - context.startTime > this.config.evaluationTimeout) {
            console.warn(`[DecisionTree] Timeout avaliando árvore '${treeName}'`);
            return { action: 'timeout', priority: 0 };
        }
        
        switch (node.type) {
            case 'condition':
                return this.evaluateCondition(node, context, treeName, depth);
                
            case 'function':
                return this.evaluateFunction(node, context, treeName, depth);
                
            case 'switch':
                return this.evaluateSwitch(node, context, treeName, depth);
                
            case 'action':
                return this.evaluateAction(node, context);
                
            case 'random':
                return this.evaluateRandom(node, context, treeName, depth);
                
            case 'sequence':
                return this.evaluateSequence(node, context, treeName, depth);
                
            default:
                console.warn(`[DecisionTree] Tipo de nó desconhecido: ${node.type}`);
                return { action: 'unknown', priority: 0 };
        }
    }
    
    /**
     * Avalia nó de condição
     */
    evaluateCondition(node, context, treeName, depth) {
        let result = false;
        
        if (node.operator === 'and' || node.operator === 'or') {
            // Operadores lógicos com múltiplas condições
            const conditions = node.conditions || [node];
            const results = conditions.map(condition => 
                this.evaluateSingleCondition(condition, context)
            );
            
            result = node.operator === 'and' ? 
                results.every(r => r) : 
                results.some(r => r);
        } else {
            // Condição simples
            result = this.evaluateSingleCondition(node, context);
        }
        
        const nextNode = result ? node.true : node.false;
        return nextNode ? 
            this.evaluateNode(nextNode, context, treeName, depth + 1) : 
            { action: 'no_action', priority: 0 };
    }
    
    /**
     * Avalia condição simples
     */
    evaluateSingleCondition(condition, context) {
        const variable = this.getVariableValue(condition.variable, context);
        const value = this.resolveValue(condition.value, context);
        const operator = condition.operator;
        
        const func = context.functions.get(operator);
        if (func) {
            return func(variable, value);
        }
        
        // Operadores padrão se não houver função
        switch (operator) {
            case 'equals': return variable === value;
            case 'not_equals': return variable !== value;
            case 'greater_than': return variable > value;
            case 'less_than': return variable < value;
            case 'greater_equal': return variable >= value;
            case 'less_equal': return variable <= value;
            case 'contains': return Array.isArray(variable) && variable.includes(value);
            case 'has_ability': return context.abilities && context.abilities.includes(value);
            default: return false;
        }
    }
    
    /**
     * Avalia nó de função
     */
    evaluateFunction(node, context, treeName, depth) {
        const func = context.functions.get(node.function);
        if (!func) {
            console.warn(`[DecisionTree] Função '${node.function}' não encontrada`);
            return { action: 'error', priority: 0 };
        }
        
        const args = node.parameters ? 
            node.parameters.map(param => this.resolveValue(param, context)) : 
            [];
        
        try {
            const result = func(...args);
            
            if (node.next) {
                // Adicionar resultado ao contexto para próximos nós
                context.variables.set(node.function + '_result', result);
                return this.evaluateNode(node.next, context, treeName, depth + 1);
            }
            
            return { action: 'function_result', value: result, priority: node.priority || 0 };
        } catch (error) {
            console.error(`[DecisionTree] Erro executando função '${node.function}':`, error);
            return { action: 'error', priority: 0, error: error.message };
        }
    }
    
    /**
     * Avalia nó switch
     */
    evaluateSwitch(node, context, treeName, depth) {
        const switchValue = this.getVariableValue(node.variable, context);
        const caseNode = node.cases[switchValue];
        
        const nextNode = caseNode || node.default;
        return nextNode ? 
            this.evaluateNode(nextNode, context, treeName, depth + 1) : 
            { action: 'no_case', priority: 0 };
    }
    
    /**
     * Avalia nó de ação
     */
    evaluateAction(node, context) {
        return {
            action: node.action,
            priority: node.priority || 0,
            parameters: node.parameters || {},
            metadata: node.metadata || {}
        };
    }
    
    /**
     * Avalia nó aleatório
     */
    evaluateRandom(node, context, treeName, depth) {
        const options = node.options || [];
        if (options.length === 0) {
            return { action: 'no_options', priority: 0 };
        }
        
        // Calcular pesos se especificados
        let totalWeight = 0;
        const weightedOptions = [];
        
        for (const option of options) {
            const weight = option.weight || 1;
            totalWeight += weight;
            weightedOptions.push({ option, weight });
        }
        
        // Seleção aleatória ponderada
        let random = Math.random() * totalWeight;
        let selectedOption = options[0]; // Fallback
        
        for (const { option, weight } of weightedOptions) {
            random -= weight;
            if (random <= 0) {
                selectedOption = option;
                break;
            }
        }
        
        return this.evaluateNode(selectedOption, context, treeName, depth + 1);
    }
    
    /**
     * Avalia nó de sequência
     */
    evaluateSequence(node, context, treeName, depth) {
        const actions = node.actions || [];
        const results = [];
        
        for (const action of actions) {
            const result = this.evaluateNode(action, context, treeName, depth + 1);
            results.push(result);
            
            // Parar se encontrar ação de parada
            if (result.action === 'stop' || result.action === 'break') {
                break;
            }
        }
        
        return {
            action: 'sequence',
            results: results,
            priority: node.priority || 0
        };
    }
    
    /**
     * Obtém valor de variável
     */
    getVariableValue(variableName, context) {
        // Verificar no contexto local
        if (context.variables.has(variableName)) {
            return context.variables.get(variableName);
        }
        
        // Verificar no contexto global
        if (context[variableName] !== undefined) {
            return context[variableName];
        }
        
        // Verificar variáveis globais do sistema
        if (this.variables.has(variableName)) {
            return this.variables.get(variableName).value;
        }
        
        console.warn(`[DecisionTree] Variável '${variableName}' não encontrada`);
        return null;
    }
    
    /**
     * Resolve valor (pode ser variável, constante ou função)
     */
    resolveValue(value, context) {
        if (typeof value === 'string' && value.startsWith('$')) {
            // Referência a variável
            return this.getVariableValue(value.substring(1), context);
        } else if (typeof value === 'object' && value.type === 'variable') {
            // Objeto de variável
            return this.getVariableValue(value.name, context);
        } else if (typeof value === 'object' && value.type === 'function') {
            // Chamada de função
            const func = context.functions.get(value.name);
            if (func) {
                const args = value.args ? 
                    value.args.map(arg => this.resolveValue(arg, context)) : 
                    [];
                return func(...args);
            }
        } else if (typeof value === 'object' && value.type === 'expression') {
            // Expressão matemática
            return this.evaluateExpression(value.expression, context);
        }
        
        // Valor literal
        return value;
    }
    
    /**
     * Avalia expressão matemática simples
     */
    evaluateExpression(expression, context) {
        try {
            // Substituir variáveis na expressão
            let resolvedExpression = expression;
            for (const [varName, varValue] of context.variables) {
                const regex = new RegExp(`\\b${varName}\\b`, 'g');
                resolvedExpression = resolvedExpression.replace(regex, varValue);
            }
            
            // Avaliar expressão (cuidado com security em produção)
            return Function('"use strict"; return (' + resolvedExpression + ')')();
        } catch (error) {
            console.error(`[DecisionTree] Erro avaliando expressão '${expression}':`, error);
            return 0;
        }
    }
    
    /**
     * Gera chave para cache
     */
    generateCacheKey(treeName, context) {
        const contextHash = this.hashContext(context);
        return `${treeName}_${contextHash}`;
    }
    
    /**
     * Gera hash do contexto
     */
    hashContext(context) {
        // Hash simples para cache key
        const str = JSON.stringify(context, Object.keys(context).sort());
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converter para 32-bit integer
        }
        
        return hash.toString(36);
    }
    
    /**
     * Verifica se cache é válido
     */
    isCacheValid(cachedResult) {
        const maxAge = 5000; // 5 segundos
        return Date.now() - cachedResult.timestamp < maxAge;
    }
    
    /**
     * Otimiza árvore de decisão
     */
    optimizeTree(treeName) {
        const tree = this.trees.get(treeName);
        if (!tree || tree.optimized) return;
        
        const optimized = this.optimizeNode(tree.root);
        
        if (optimized) {
            tree.root = optimized;
            tree.optimized = true;
            tree.nodeCount = this.countNodes(optimized);
            
            this.stats.treeOptimizations++;
            
            // Trigger event
            if (this.onTreeOptimized) {
                this.onTreeOptimized(treeName, tree);
            }
            
            console.log(`[DecisionTree] Árvore '${treeName}' otimizada: ${tree.nodeCount} nós`);
        }
    }
    
    /**
     * Otimiza nó específico
     */
    optimizeNode(node) {
        if (!node) return null;
        
        // Otimizações específicas podem ser implementadas aqui
        // Por exemplo: remover nós redundantes, combinar condições, etc.
        
        if (node.type === 'condition') {
            // Otimizar condições sempre verdadeiras/falsas
            if (this.isAlwaysTrue(node)) {
                return node.true ? this.optimizeNode(node.true) : null;
            }
            if (this.isAlwaysFalse(node)) {
                return node.false ? this.optimizeNode(node.false) : null;
            }
        }
        
        // Otimizar filhos recursivamente
        if (node.true) node.true = this.optimizeNode(node.true);
        if (node.false) node.false = this.optimizeNode(node.false);
        if (node.cases) {
            for (const key in node.cases) {
                node.cases[key] = this.optimizeNode(node.cases[key]);
            }
        }
        if (node.default) {
            node.default = this.optimizeNode(node.default);
        }
        
        return node;
    }
    
    /**
     * Verifica se condição é sempre verdadeira
     */
    isAlwaysTrue(node) {
        // Implementar lógica de verificação
        return false;
    }
    
    /**
     * Verifica se condição é sempre falsa
     */
    isAlwaysFalse(node) {
        // Implementar lógica de verificação
        return false;
    }
    
    /**
     * Conta nós em uma árvore
     */
    countNodes(node) {
        if (!node) return 0;
        
        let count = 1;
        
        if (node.true) count += this.countNodes(node.true);
        if (node.false) count += this.countNodes(node.false);
        if (node.cases) {
            for (const caseNode of Object.values(node.cases)) {
                count += this.countNodes(caseNode);
            }
        }
        if (node.default) count += this.countNodes(node.default);
        
        return count;
    }
    
    /**
     * Atualiza estatísticas
     */
    updateStats(evaluationTime) {
        this.stats.averageEvaluationTime = 
            (this.stats.averageEvaluationTime * (this.stats.evaluations - 1) + evaluationTime) / 
            this.stats.evaluations;
    }
    
    /**
     * Limpa cache antigo
     */
    cleanupCache() {
        const maxAge = 10000; // 10 segundos
        const now = Date.now();
        
        for (const [key, cached] of this.evaluationCache) {
            if (now - cached.timestamp > maxAge) {
                this.evaluationCache.delete(key);
            }
        }
        
        // Manter cache size limitado
        if (this.evaluationCache.size > this.config.cacheSize) {
            const entries = Array.from(this.evaluationCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toDelete = entries.slice(0, this.evaluationCache.size - this.config.cacheSize);
            for (const [key] of toDelete) {
                this.evaluationCache.delete(key);
            }
        }
    }
    
    /**
     * Obtém estatísticas do sistema
     */
    getStatistics() {
        return {
            ...this.stats,
            cacheHitRate: this.stats.cacheHits / (this.stats.evaluations || 1) * 100,
            cacheSize: this.evaluationCache.size,
            treesCount: this.trees.size,
            averageTreeDepth: this.calculateAverageDepth(),
            totalNodes: this.calculateTotalNodes()
        };
    }
    
    /**
     * Calcula profundidade média das árvores
     */
    calculateAverageDepth() {
        if (this.trees.size === 0) return 0;
        
        let totalDepth = 0;
        for (const tree of this.trees.values()) {
            totalDepth += tree.depth;
        }
        
        return totalDepth / this.trees.size;
    }
    
    /**
     * Calcula total de nós
     */
    calculateTotalNodes() {
        let totalNodes = 0;
        for (const tree of this.trees.values()) {
            totalNodes += tree.nodeCount;
        }
        return totalNodes;
    }
    
    /**
     * Exporta árvore para JSON
     */
    exportTree(treeName) {
        const tree = this.trees.get(treeName);
        if (!tree) return null;
        
        return {
            name: tree.name,
            root: tree.root,
            metadata: {
                depth: tree.depth,
                nodeCount: tree.nodeCount,
                variables: Array.from(tree.variables),
                functions: Array.from(tree.functions),
                optimized: tree.optimized
            }
        };
    }
    
    /**
     * Importa árvore de JSON
     */
    importTree(treeData) {
        if (!treeData.name || !treeData.root) {
            throw new Error('Dados da árvore inválidos');
        }
        
        this.createTree(treeData.name, treeData);
    }
}

module.exports = DecisionTree;
