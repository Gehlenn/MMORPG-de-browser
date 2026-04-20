/**
 * AI Mob Controller - Enhanced AI System v0.3.7v
 * Controlador avançado para comportamento de mobs com IA inteligente
 */

class AIMobController {
    constructor() {
        this.mobs = new Map(); // mobId -> AIData
        this.behaviors = new Map(); // mobType -> BehaviorProfile
        this.stateMachines = new Map(); // mobId -> StateMachine
        this.decisionTrees = new Map(); // mobType -> DecisionTree
        this.memorySystem = new Map(); // mobId -> MemoryData
        
        // Configuration
        this.config = {
            updateFrequency: 100, // ms
            detectionRange: 150,
            attackRange: 30,
            retreatThreshold: 0.2, // 20% HP
            packCallRange: 200,
            decisionTimeout: 500, // ms
            memoryDuration: 30000 // 30 segundos
        };
        
        // Behavior profiles
        this.setupBehaviorProfiles();
        
        // Event listeners
        this.onBehaviorChange = null;
        this.onStateChange = null;
        this.onDecision = null;
        this.onMemoryUpdate = null;
        
        // Update loop
        this.lastUpdateTime = 0;
        this.isRunning = false;
    }
    
    /**
     * Configura perfis de comportamento por tipo de mob
     */
    setupBehaviorProfiles() {
        // Perfil agressivo
        this.behaviors.set('aggressive', {
            personality: 'aggressive',
            aggression: 0.9,
            courage: 0.7,
            intelligence: 0.6,
            social: 0.5,
            patrol: false,
            hunt: true,
            retreat: false,
            callHelp: true,
            behaviors: ['hunt', 'attack', 'patrol', 'call_help']
        });
        
        // Per defensivo
        this.behaviors.set('defensive', {
            personality: 'defensive',
            aggression: 0.3,
            courage: 0.8,
            intelligence: 0.7,
            social: 0.8,
            patrol: true,
            hunt: false,
            retreat: false,
            callHelp: true,
            behaviors: ['patrol', 'defend', 'protect_ally', 'call_help']
        });
        
        // Per covarde
        this.behaviors.set('cowardly', {
            personality: 'cowardly',
            aggression: 0.2,
            courage: 0.2,
            intelligence: 0.8,
            social: 0.6,
            patrol: true,
            hunt: false,
            retreat: true,
            callHelp: false,
            behaviors: ['patrol', 'flee', 'hide', 'avoid']
        });
        
        // Per de matilha
        this.behaviors.set('pack', {
            personality: 'pack',
            aggression: 0.7,
            courage: 0.6,
            intelligence: 0.5,
            social: 0.9,
            patrol: true,
            hunt: true,
            retreat: false,
            callHelp: true,
            behaviors: ['pack_hunt', 'coordinate_attack', 'patrol', 'call_help']
        });
        
        // Per de emboscada
        this.behaviors.set('ambusher', {
            personality: 'ambusher',
            aggression: 0.8,
            courage: 0.5,
            intelligence: 0.9,
            social: 0.3,
            patrol: false,
            hunt: true,
            retreat: true,
            callHelp: false,
            behaviors: ['ambush', 'stealth', 'surprise_attack', 'retreat']
        });
        
        // Mapeamento de tipos de mob para perfis
        this.mobTypeProfiles = {
            'goblin': 'pack',
            'wolf': 'pack',
            'orc': 'aggressive',
            'hobgoblin': 'aggressive',
            'troll': 'defensive',
            'ogre': 'aggressive',
            'forest_spirit': 'defensive',
            'mountain_troll': 'defensive',
            'swamp_creature': 'ambusher',
            'poison_frog': 'ambusher',
            'dark_wisp': 'cowardly'
        };
    }
    
    /**
     * Inicializa o AI system
     */
    initialize() {
        console.log('[AIMobController] Inicializando Enhanced AI System...');
        this.setupDecisionTrees();
        this.startUpdateLoop();
    }
    
    /**
     * Configura árvores de decisão
     */
    setupDecisionTrees() {
        // Árvore de decisão para comportamento geral
        this.decisionTrees.set('general', {
            root: {
                type: 'condition',
                condition: 'has_target',
                true: {
                    type: 'condition',
                    condition: 'target_in_range',
                    true: {
                        type: 'action',
                        action: 'attack'
                    },
                    false: {
                        type: 'condition',
                        condition: 'can_reach_target',
                        true: {
                            type: 'action',
                            action: 'chase'
                        },
                        false: {
                            type: 'action',
                            action: 'approach'
                        }
                    }
                },
                false: {
                    type: 'condition',
                    condition: 'is_patrolling',
                    true: {
                        type: 'action',
                        action: 'patrol'
                    },
                    false: {
                        type: 'condition',
                        condition: 'has_patrol_route',
                        true: {
                            type: 'action',
                            action: 'start_patrol'
                        },
                        false: {
                            type: 'action',
                            action: 'idle'
                        }
                    }
                }
            }
        });
        
        // Árvore de decisão para combate
        this.decisionTrees.set('combat', {
            root: {
                type: 'condition',
                condition: 'health_low',
                true: {
                    type: 'condition',
                    condition: 'is_cowardly',
                    true: {
                        type: 'action',
                        action: 'flee'
                    },
                    false: {
                        type: 'condition',
                        condition: 'has_allies_nearby',
                        true: {
                            type: 'action',
                            action: 'call_help'
                        },
                        false: {
                            type: 'action',
                            action: 'desperate_attack'
                        }
                    }
                },
                false: {
                    type: 'condition',
                    condition: 'target_health_low',
                    true: {
                        type: 'action',
                        action: 'aggressive_attack'
                    },
                    false: {
                        type: 'condition',
                        condition: 'multiple_enemies',
                        true: {
                            type: 'action',
                            action: 'area_attack'
                        },
                        false: {
                            type: 'action',
                            action: 'normal_attack'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Adiciona um mob ao sistema AI
     */
    addMob(mobData) {
        const profile = this.getMobProfile(mobData.type);
        const stateMachine = this.createStateMachine(mobData.id, profile);
        const memory = this.createMemory(mobData.id);
        
        const aiData = {
            id: mobData.id,
            type: mobData.type,
            profile: profile,
            stateMachine: stateMachine,
            memory: memory,
            currentTarget: null,
            currentAction: 'idle',
            lastDecision: 0,
            lastUpdate: Date.now(),
            stats: {
                decisions: 0,
                stateChanges: 0,
                behaviors: {}
            }
        };
        
        this.mobs.set(mobData.id, aiData);
        this.stateMachines.set(mobData.id, stateMachine);
        this.memorySystem.set(mobData.id, memory);
        
        console.log(`[AIMobController] Mob ${mobData.id} (${mobData.type}) adicionado ao AI system`);
        return aiData;
    }
    
    /**
     * Remove um mob do sistema AI
     */
    removeMob(mobId) {
        this.mobs.delete(mobId);
        this.stateMachines.delete(mobId);
        this.memorySystem.delete(mobId);
        
        console.log(`[AIMobController] Mob ${mobId} removido do AI system`);
        return true;
    }
    
    /**
     * Obtém perfil de comportamento para tipo de mob
     */
    getMobProfile(mobType) {
        const profileName = this.mobTypeProfiles[mobType] || 'aggressive';
        return this.behaviors.get(profileName) || this.behaviors.get('aggressive');
    }
    
    /**
     * Cria máquina de estados para um mob
     */
    createStateMachine(mobId, profile) {
        return {
            currentState: 'idle',
            previousState: null,
            states: {
                idle: {
                    enter: () => this.enterIdle(mobId),
                    update: () => this.updateIdle(mobId),
                    exit: () => this.exitIdle(mobId)
                },
                patrol: {
                    enter: () => this.enterPatrol(mobId),
                    update: () => this.updatePatrol(mobId),
                    exit: () => this.exitPatrol(mobId)
                },
                chase: {
                    enter: () => this.enterChase(mobId),
                    update: () => this.updateChase(mobId),
                    exit: () => this.exitChase(mobId)
                },
                attack: {
                    enter: () => this.enterAttack(mobId),
                    update: () => this.updateAttack(mobId),
                    exit: () => this.exitAttack(mobId)
                },
                flee: {
                    enter: () => this.enterFlee(mobId),
                    update: () => this.updateFlee(mobId),
                    exit: () => this.exitFlee(mobId)
                },
                hide: {
                    enter: () => this.enterHide(mobId),
                    update: () => this.updateHide(mobId),
                    exit: () => this.exitHide(mobId)
                },
                call_help: {
                    enter: () => this.enterCallHelp(mobId),
                    update: () => this.updateCallHelp(mobId),
                    exit: () => this.exitCallHelp(mobId)
                }
            },
            transition: (newState) => this.transitionState(mobId, newState)
        };
    }
    
    /**
     * Cria sistema de memória para um mob
     */
    createMemory(mobId) {
        return {
            shortTerm: {
                threats: new Map(), // playerId -> ThreatData
                allies: new Set(), // mobIds
                enemies: new Set(), // playerIds
                locations: [], // Position history
                lastSeen: new Map() // entity -> lastSeenTime
            },
            longTerm: {
                playerPatterns: new Map(), // playerId -> PatternData
                dangerousAreas: new Set(), // positions
                safeAreas: new Set(), // positions
                successfulHunts: 0,
                failedHunts: 0,
                deaths: 0
            },
            update: (type, data) => this.updateMemory(mobId, type, data)
        };
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
            this.updateAllMobs();
            this.lastUpdateTime = now;
        }
        
        // Próximo frame
        setTimeout(() => this.updateLoop(), 10);
    }
    
    /**
     * Atualiza todos os mobs
     */
    updateAllMobs() {
        for (const [mobId, aiData] of this.mobs) {
            this.updateMob(mobId, aiData);
        }
    }
    
    /**
     * Atualiza um mob específico
     */
    updateMob(mobId, aiData) {
        const now = Date.now();
        
        // Verificar se precisa tomar decisão
        if (now - aiData.lastDecision >= this.config.decisionTimeout) {
            this.makeDecision(mobId, aiData);
            aiData.lastDecision = now;
        }
        
        // Atualizar máquina de estados
        const currentState = aiData.stateMachine.currentState;
        if (aiData.stateMachine.states[currentState]) {
            aiData.stateMachine.states[currentState].update();
        }
        
        // Limpar memória antiga
        this.cleanupMemory(mobId);
        
        aiData.lastUpdate = now;
    }
    
    /**
     * Tomada de decisão usando árvore de decisão
     */
    makeDecision(mobId, aiData) {
        const context = this.buildDecisionContext(mobId, aiData);
        const decision = this.evaluateDecisionTree('general', context);
        
        if (decision !== aiData.currentAction) {
            this.executeDecision(mobId, aiData, decision);
            aiData.currentAction = decision;
            aiData.stats.decisions++;
            
            // Trigger event
            if (this.onDecision) {
                this.onDecision(mobId, decision, context);
            }
        }
    }
    
    /**
     * Constrói contexto para tomada de decisão
     */
    buildDecisionContext(mobId, aiData) {
        const mobData = this.getMobData(mobId);
        const memory = aiData.memory;
        
        return {
            mob_id: mobId,
            mob_type: aiData.type,
            position: mobData.position,
            health: mobData.stats.hp,
            max_health: mobData.stats.maxHp,
            has_target: aiData.currentTarget !== null,
            target_in_range: this.isTargetInRange(mobId, aiData.currentTarget),
            can_reach_target: this.canReachTarget(mobId, aiData.currentTarget),
            is_patrolling: aiData.stateMachine.currentState === 'patrol',
            has_patrol_route: this.hasPatrolRoute(mobId),
            health_low: mobData.stats.hp < mobData.stats.maxHp * this.config.retreatThreshold,
            is_cowardly: aiData.profile.personality === 'cowardly',
            has_allies_nearby: this.hasAlliesNearby(mobId),
            target_health_low: this.isTargetHealthLow(aiData.currentTarget),
            multiple_enemies: this.hasMultipleEnemies(mobId),
            threats: Array.from(memory.shortTerm.threats.keys()),
            allies: Array.from(memory.shortTerm.allies)
        };
    }
    
    /**
     * Avalia árvore de decisão
     */
    evaluateDecisionTree(treeName, context) {
        const tree = this.decisionTrees.get(treeName);
        if (!tree) return 'idle';
        
        return this.evaluateNode(tree.root, context);
    }
    
    /**
     * Avalia nó da árvore de decisão
     */
    evaluateNode(node, context) {
        switch (node.type) {
            case 'condition':
                const conditionMet = this.evaluateCondition(node.condition, context);
                return conditionMet ? 
                    this.evaluateNode(node.true, context) : 
                    this.evaluateNode(node.false, context);
            
            case 'action':
                return node.action;
            
            default:
                return 'idle';
        }
    }
    
    /**
     * Avalia condição
     */
    evaluateCondition(condition, context) {
        switch (condition) {
            case 'has_target': return context.has_target;
            case 'target_in_range': return context.target_in_range;
            case 'can_reach_target': return context.can_reach_target;
            case 'is_patrolling': return context.is_patrolling;
            case 'has_patrol_route': return context.has_patrol_route;
            case 'health_low': return context.health_low;
            case 'is_cowardly': return context.is_cowardly;
            case 'has_allies_nearby': return context.has_allies_nearby;
            case 'target_health_low': return context.target_health_low;
            case 'multiple_enemies': return context.multiple_enemies;
            default: return false;
        }
    }
    
    /**
     * Executa decisão
     */
    executeDecision(mobId, aiData, decision) {
        const stateMachine = aiData.stateMachine;
        
        switch (decision) {
            case 'idle':
                stateMachine.transition('idle');
                break;
            case 'patrol':
            case 'start_patrol':
                stateMachine.transition('patrol');
                break;
            case 'chase':
            case 'approach':
                stateMachine.transition('chase');
                break;
            case 'attack':
            case 'normal_attack':
            case 'aggressive_attack':
            case 'desperate_attack':
            case 'area_attack':
                stateMachine.transition('attack');
                break;
            case 'flee':
                stateMachine.transition('flee');
                break;
            case 'hide':
                stateMachine.transition('hide');
                break;
            case 'call_help':
                stateMachine.transition('call_help');
                break;
        }
    }
    
    /**
     * Transição de estado
     */
    transitionState(mobId, newState) {
        const aiData = this.mobs.get(mobId);
        if (!aiData) return;
        
        const stateMachine = aiData.stateMachine;
        const oldState = stateMachine.currentState;
        
        if (oldState === newState) return;
        
        // Exit do estado anterior
        if (stateMachine.states[oldState]) {
            stateMachine.states[oldState].exit();
        }
        
        // Enter do novo estado
        if (stateMachine.states[newState]) {
            stateMachine.states[newState].enter();
        }
        
        stateMachine.previousState = oldState;
        stateMachine.currentState = newState;
        
        aiData.stats.stateChanges++;
        
        // Trigger event
        if (this.onStateChange) {
            this.onStateChange(mobId, oldState, newState);
        }
        
        console.log(`[AIMobController] Mob ${mobId}: ${oldState} → ${newState}`);
    }
    
    // Métodos dos estados
    
    enterIdle(mobId) {
        const aiData = this.mobs.get(mobId);
        if (aiData) {
            aiData.idleTimer = Date.now() + (Math.random() * 5000 + 2000); // 2-7s
        }
    }
    
    updateIdle(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData) return;
        
        // Verificar se há ameaças próximas
        const threats = this.detectThreats(mobId);
        if (threats.length > 0) {
            aiData.currentTarget = threats[0];
            return;
        }
        
        // Mudar para patrol após timer
        if (Date.now() > aiData.idleTimer) {
            aiData.stateMachine.transition('patrol');
        }
    }
    
    exitIdle(mobId) {
        // Cleanup do estado idle
    }
    
    enterPatrol(mobId) {
        const aiData = this.mobs.get(mobId);
        if (aiData) {
            aiData.patrolTarget = this.generatePatrolTarget(mobId);
            aiData.patrolTimer = Date.now() + (Math.random() * 10000 + 5000); // 5-15s
        }
    }
    
    updatePatrol(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData) return;
        
        // Verificar ameaças
        const threats = this.detectThreats(mobId);
        if (threats.length > 0) {
            aiData.currentTarget = threats[0];
            aiData.stateMachine.transition('chase');
            return;
        }
        
        // Mover em direção ao alvo de patrulha
        if (aiData.patrolTarget) {
            this.moveTowards(mobId, aiData.patrolTarget);
            
            // Verificar se chegou ao alvo
            const mobData = this.getMobData(mobId);
            const distance = this.calculateDistance(mobData.position, aiData.patrolTarget);
            
            if (distance < 10) {
                aiData.patrolTarget = this.generatePatrolTarget(mobId);
            }
        }
        
        // Mudar para idle após timer
        if (Date.now() > aiData.patrolTimer) {
            aiData.stateMachine.transition('idle');
        }
    }
    
    exitPatrol(mobId) {
        // Cleanup do estado patrol
    }
    
    enterChase(mobId) {
        const aiData = this.mobs.get(mobId);
        if (aiData && aiData.currentTarget) {
            // Registrar alvo na memória
            aiData.memory.update('threat', {
                id: aiData.currentTarget,
                lastSeen: Date.now(),
                position: this.getPlayerPosition(aiData.currentTarget)
            });
        }
    }
    
    updateChase(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData || !aiData.currentTarget) {
            aiData.stateMachine.transition('idle');
            return;
        }
        
        const targetPosition = this.getPlayerPosition(aiData.currentTarget);
        const mobData = this.getMobData(mobId);
        const distance = this.calculateDistance(mobData.position, targetPosition);
        
        if (distance <= this.config.attackRange) {
            aiData.stateMachine.transition('attack');
        } else if (distance > this.config.detectionRange * 2) {
            // Perdeu o alvo
            aiData.currentTarget = null;
            aiData.stateMachine.transition('patrol');
        } else {
            // Perseguir alvo
            this.moveTowards(mobId, targetPosition);
        }
    }
    
    exitChase(mobId) {
        // Cleanup do estado chase
    }
    
    enterAttack(mobId) {
        const aiData = this.mobs.get(mobId);
        if (aiData) {
            aiData.attackCooldown = Date.now() + 2000; // 2s cooldown
        }
    }
    
    updateAttack(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData || !aiData.currentTarget) {
            aiData.stateMachine.transition('idle');
            return;
        }
        
        const targetPosition = this.getPlayerPosition(aiData.currentTarget);
        const mobData = this.getMobData(mobId);
        const distance = this.calculateDistance(mobData.position, targetPosition);
        
        if (distance > this.config.attackRange) {
            aiData.stateMachine.transition('chase');
        } else if (Date.now() >= aiData.attackCooldown) {
            // Atacar
            this.performAttack(mobId, aiData.currentTarget);
            aiData.attackCooldown = Date.now() + 2000;
        }
    }
    
    exitAttack(mobId) {
        // Cleanup do estado attack
    }
    
    enterFlee(mobId) {
        const aiData = this.mobs.get(mobId);
        if (aiData) {
            aiData.fleeTarget = this.generateFleeTarget(mobId);
            aiData.fleeTimer = Date.now() + 5000; // 5s de fuga
        }
    }
    
    updateFlee(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData) return;
        
        if (aiData.fleeTarget) {
            this.moveTowards(mobId, aiData.fleeTarget);
        }
        
        // Parar de fugir após timer
        if (Date.now() > aiData.fleeTimer) {
            aiData.currentTarget = null;
            aiData.stateMachine.transition('idle');
        }
    }
    
    exitFlee(mobId) {
        // Cleanup do estado flee
    }
    
    enterHide(mobId) {
        const aiData = this.mobs.get(mobId);
        if (aiData) {
            aiData.hidePosition = this.findHidePosition(mobId);
            aiData.hideTimer = Date.now() + 8000; // 8s escondido
        }
    }
    
    updateHide(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData) return;
        
        if (aiData.hidePosition) {
            this.moveTowards(mobId, aiData.hidePosition);
        }
        
        // Verificar se é seguro para sair
        if (Date.now() > aiData.hideTimer) {
            const threats = this.detectThreats(mobId);
            if (threats.length === 0) {
                aiData.stateMachine.transition('idle');
            }
        }
    }
    
    exitHide(mobId) {
        // Cleanup do estado hide
    }
    
    enterCallHelp(mobId) {
        const aiData = this.mobs.get(mobId);
        if (aiData) {
            this.callForHelp(mobId);
            aiData.callHelpTimer = Date.now() + 3000; // 3s chamando
        }
    }
    
    updateCallHelp(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData) return;
        
        // Voltar ao combate após chamar ajuda
        if (Date.now() > aiData.callHelpTimer) {
            aiData.stateMachine.transition('attack');
        }
    }
    
    exitCallHelp(mobId) {
        // Cleanup do estado call_help
    }
    
    // Métodos utilitários
    
    detectThreats(mobId) {
        const mobData = this.getMobData(mobId);
        const threats = [];
        
        // Implementar detecção de jogadores próximos
        if (this.server && this.server.players) {
            for (const [playerId, player] of this.server.players) {
                const distance = this.calculateDistance(mobData.position, { x: player.x, y: player.y });
                
                // Adicionar distância de segurança - só detectar se player estiver dentro do range de visão
                if (distance <= this.config.detectionRange) {
                    threats.push({
                        id: playerId,
                        position: { x: player.x, y: player.y },
                        distance: distance,
                        level: player.level || 1
                    });
                }
            }
        }
        
        // Ordenar por distância (mais próximo primeiro)
        threats.sort((a, b) => a.distance - b.distance);
        
        return threats;
    }
    
    hasAlliesNearby(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData) return false;
        
        return aiData.memory.shortTerm.allies.size > 0;
    }
    
    hasMultipleEnemies(mobId) {
        const threats = this.detectThreats(mobId);
        return threats.length > 1;
    }
    
    isTargetInRange(mobId, targetId) {
        if (!targetId) return false;
        
        const mobData = this.getMobData(mobId);
        const targetPosition = this.getPlayerPosition(targetId);
        const distance = this.calculateDistance(mobData.position, targetPosition);
        
        return distance <= this.config.attackRange;
    }
    
    canReachTarget(mobId, targetId) {
        // Implementar verificação de pathfinding
        return true; // Placeholder
    }
    
    hasPatrolRoute(mobId) {
        // Verificar se mob tem rota de patrulha
        return true; // Placeholder
    }
    
    isTargetHealthLow(targetId) {
        // Implementar verificação de HP do alvo
        return false; // Placeholder
    }
    
    generatePatrolTarget(mobId) {
        const mobData = this.getMobData(mobId);
        return {
            x: mobData.position.x + (Math.random() - 0.5) * 100,
            y: mobData.position.y + (Math.random() - 0.5) * 100
        };
    }
    
    generateFleeTarget(mobId) {
        const mobData = this.getMobData(mobId);
        const fleeDirection = {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        };
        
        return {
            x: mobData.position.x + fleeDirection.x * 200,
            y: mobData.position.y + fleeDirection.y * 200
        };
    }
    
    findHidePosition(mobId) {
        const mobData = this.getMobData(mobId);
        return {
            x: mobData.position.x + (Math.random() - 0.5) * 50,
            y: mobData.position.y + (Math.random() - 0.5) * 50
        };
    }
    
    moveTowards(mobId, target) {
        const mobData = this.getMobData(mobId);
        if (!mobData || !target) return;
        
        // Calcular direção
        const dx = target.x - mobData.position.x;
        const dy = target.y - mobData.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) return; // Já chegou ao alvo
        
        // Normalizar direção
        const dirX = (dx / distance) * 2; // Velocidade do mob
        const dirY = (dy / distance) * 2;
        
        // Atualizar posição
        mobData.position.x += dirX;
        mobData.position.y += dirY;
        
        // Enviar atualização para clientes
        if (this.server && this.server.io) {
            this.server.io.emit('mobUpdate', {
                id: mobId,
                x: mobData.position.x,
                y: mobData.position.y,
                state: 'moving'
            });
        }
        
        console.log(`[AIMobController] Mob ${mobId} moving towards (${target.x.toFixed(1)}, ${target.y.toFixed(1)})`);
    }
    
    performAttack(mobId, targetId) {
        const mobData = this.getMobData(mobId);
        if (!mobData || !targetId) return;
        
        // Calcular dano baseado no tipo do mob
        const baseDamage = mobData.attack || 10;
        const damage = baseDamage + Math.floor(Math.random() * 5); // +0-4 dano variável
        
        // Enviar dano para o servidor de combate
        if (this.server && this.server.combatSystem) {
            const result = this.server.combatSystem.handleMobAttack(mobId, targetId, damage);
            
            // Notificar clientes sobre o ataque
            if (this.server.io) {
                this.server.io.emit('mobAttack', {
                    mobId: mobId,
                    mobName: mobData.name || mobData.type,
                    targetId: targetId,
                    damage: damage
                });
                
                // Atualizar posição do mob para mostrar animação de ataque
                this.server.io.emit('mobUpdate', {
                    id: mobId,
                    x: mobData.position.x,
                    y: mobData.position.y,
                    state: 'attacking'
                });
            }
        }
        
        console.log(`[AIMobController] Mob ${mobId} attacking ${targetId} for ${damage} damage`);
    }
    
    callForHelp(mobId) {
        const aiData = this.mobs.get(mobId);
        if (!aiData) return;
        
        // Chamar mobs aliados próximos
        const nearbyMobs = this.getNearbyMobs(mobId, this.config.packCallRange);
        
        for (const nearbyMob of nearbyMobs) {
            const nearbyAi = this.mobs.get(nearbyMob.id);
            if (nearbyAi && nearbyAi.profile.callHelp) {
                nearbyAi.currentTarget = aiData.currentTarget;
                nearbyAi.stateMachine.transition('chase');
            }
        }
        
        console.log(`[AIMobController] Mob ${mobId} called for help!`);
    }
    
    updateMemory(mobId, type, data) {
        const memory = this.memorySystem.get(mobId);
        if (!memory) return;
        
        const now = Date.now();
        
        switch (type) {
            case 'threat':
                memory.shortTerm.threats.set(data.id, {
                    ...data,
                    timestamp: now
                });
                break;
            case 'ally':
                memory.shortTerm.allies.add(data.id);
                break;
            case 'location':
                memory.shortTerm.locations.push({
                    ...data,
                    timestamp: now
                });
                break;
        }
        
        // Trigger event
        if (this.onMemoryUpdate) {
            this.onMemoryUpdate(mobId, type, data);
        }
    }
    
    cleanupMemory(mobId) {
        const memory = this.memorySystem.get(mobId);
        if (!memory) return;
        
        const now = Date.now();
        const cutoffTime = now - this.config.memoryDuration;
        
        // Limpar ameaças antigas
        for (const [threatId, threatData] of memory.shortTerm.threats) {
            if (threatData.timestamp < cutoffTime) {
                memory.shortTerm.threats.delete(threatId);
            }
        }
        
        // Limpar localizações antigas
        memory.shortTerm.locations = memory.shortTerm.locations.filter(
            location => location.timestamp >= cutoffTime
        );
    }
    
    // Métodos de acesso a dados (precisam ser integrados com outros sistemas)
    
    getMobData(mobId) {
        // Implementar acesso aos dados do mob usando o sistema global
        if (global.mobSpawner && global.mobSpawner.getMob) {
            return global.mobSpawner.getMob(mobId);
        }
        
        // Fallback se mobSpawner não estiver disponível
        return {
            id: mobId,
            position: { x: 400, y: 300 },
            stats: { hp: 100, maxHp: 100 },
            attack: 10,
            name: 'Mob',
            type: 'goblin'
        };
    }
    
    getPlayerPosition(playerId) {
        // Implementar acesso à posição do jogador usando o sistema do servidor
        if (this.server && this.server.players && this.server.players.has(playerId)) {
            const player = this.server.players.get(playerId);
            return { x: player.x, y: player.y };
        }
        
        // Fallback
        return { x: 400, y: 300 };
    }
    
    getNearbyMobs(mobId, range) {
        // Implementar busca de mobs próximos usando mobSpawner
        if (global.mobSpawner && global.mobSpawner.getAllMobs) {
            const allMobs = global.mobSpawner.getAllMobs();
            const currentMob = this.getMobData(mobId);
            
            return allMobs.filter(mob => {
                if (mob.id === mobId) return false; // Não incluir a si mesmo
                
                const distance = this.calculateDistance(currentMob.position, mob.position);
                return distance <= range;
            });
        }
        
        return [];
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Obtém estatísticas do AI system
     */
    getStatistics() {
        const stats = {
            totalMobs: this.mobs.size,
            activeStates: {},
            behaviors: {},
            decisions: 0,
            stateChanges: 0
        };
        
        for (const [mobId, aiData] of this.mobs) {
            // Contar estados ativos
            const state = aiData.stateMachine.currentState;
            stats.activeStates[state] = (stats.activeStates[state] || 0) + 1;
            
            // Contar comportamentos
            const behavior = aiData.profile.personality;
            stats.behaviors[behavior] = (stats.behaviors[behavior] || 0) + 1;
            
            // Somar estatísticas
            stats.decisions += aiData.stats.decisions;
            stats.stateChanges += aiData.stats.stateChanges;
        }
        
        return stats;
    }
    
    /**
     * Para o AI system
     */
    stop() {
        this.isRunning = false;
        console.log('[AIMobController] Enhanced AI System parado');
    }
}

module.exports = AIMobController;
