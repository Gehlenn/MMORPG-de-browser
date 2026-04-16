/**
 * 🔗 Integração dos Subagentes com Gameplay
 * Conecta EldoriaSubagentSystem aos sistemas do jogo
 */

class SubagentGameplayIntegration {
    constructor() {
        this.subagentSystem = null;
        this.gameplayEngine = null;
        this.loginManager = null;
        this.hudManager = null;
        this.isInitialized = false;
    }

    /**
     * 🚀 Inicializa integração completa
     */
    initialize() {
        console.log('🔗 Inicializando integração Subagentes ↔ Gameplay...');

        // Aguardar sistemas estarem disponíveis
        this.waitForSystems().then(() => {
            this.connectSystems();
            this.setupEventListeners();
            this.startMonitoring();
            this.isInitialized = true;
            console.log('✅ Integração Subagentes-Gameplay completa!');
        });
    }

    /**
     * ⏳ Aguarda sistemas estarem disponíveis
     */
    async waitForSystems() {
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            this.subagentSystem = window.EldoriaSubagentSystem;
            this.gameplayEngine = window._gameplayEngine;
            this.loginManager = window.loginManager || window.simpleLoginManager;
            this.hudManager = window.HUDManager;

            if (this.subagentSystem && this.gameplayEngine) {
                console.log('✅ Sistemas encontrados');
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        console.warn('⚠️ Timeout aguardando sistemas');
        return false;
    }

    /**
     * 🔌 Conecta os sistemas
     */
    connectSystems() {
        // Instanciar sistema de subagentes se necessário
        if (!window.eldoriaSubagents) {
            window.eldoriaSubagents = new EldoriaSubagentSystem();
        }
        this.subagentSystem = window.eldoriaSubagents;

        // Conectar GameplayAgent ao engine
        const gameplayAgent = this.subagentSystem.agents.get('gameplay');
        if (gameplayAgent) {
            gameplayAgent.connectToEngine(this.gameplayEngine);
        }

        // Conectar UIAgent ao HUD
        const uiAgent = this.subagentSystem.agents.get('ui');
        if (uiAgent) {
            uiAgent.connectToHUD(this.hudManager);
        }

        // Conectar DebugAgent aos sistemas
        const debugAgent = this.subagentSystem.agents.get('debug');
        if (debugAgent) {
            debugAgent.monitorSystems({
                gameplayEngine: this.gameplayEngine,
                loginManager: this.loginManager,
                hudManager: this.hudManager,
                gameState: window.gameState
            });
        }

        console.log('🔌 Sistemas conectados');
    }

    /**
     * 👂 Configura listeners de eventos
     */
    setupEventListeners() {
        // Monitorar eventos de gameplay
        if (this.gameplayEngine) {
            // Interceptar funções para análise
            this.interceptGameplayMethods();
        }

        // Monitorar transições de tela
        if (this.loginManager) {
            const originalShowGame = this.loginManager.showGame;
            this.loginManager.showGame = (...args) => {
                this.notifySubagents('screen_change', { screen: 'game' });
                return originalShowGame.apply(this.loginManager, args);
            };
        }

        // Monitorar inputs do jogador
        document.addEventListener('keydown', (e) => {
            this.notifySubagents('player_input', {
                key: e.key,
                timestamp: Date.now()
            });
        });

        console.log('👂 Listeners de eventos configurados');
    }

    /**
     * 🎮 Intercepta métodos do gameplay para análise
     */
    interceptGameplayMethods() {
        const engine = this.gameplayEngine;
        
        // Interceptar ataque
        if (engine.playerAttack) {
            const originalAttack = engine.playerAttack.bind(engine);
            engine.playerAttack = () => {
                this.notifySubagents('combat', { action: 'attack', timestamp: Date.now() });
                return originalAttack();
            };
        }

        // Interceptar uso de skill
        if (engine.useSkill) {
            const originalSkill = engine.useSkill.bind(engine);
            engine.useSkill = (skillIndex) => {
                this.notifySubagents('combat', { 
                    action: 'skill', 
                    skillIndex,
                    timestamp: Date.now() 
                });
                return originalSkill(skillIndex);
            };
        }

        // Interceptar movimento
        if (engine.updatePlayerMovement) {
            const originalMovement = engine.updatePlayerMovement.bind(engine);
            engine.updatePlayerMovement = () => {
                const result = originalMovement();
                if (engine.player && (engine.player.vx !== 0 || engine.player.vy !== 0)) {
                    this.notifySubagents('movement', {
                        x: engine.player.x,
                        y: engine.player.y,
                        velocity: { x: engine.player.vx, y: engine.player.vy }
                    });
                }
                return result;
            };
        }
    }

    /**
     * 📢 Notifica subagentes de eventos
     */
    notifySubagents(eventType, data) {
        if (!this.subagentSystem) return;

        // Enviar para agentes relevantes
        switch (eventType) {
            case 'combat':
                const gameplayAgent = this.subagentSystem.agents.get('gameplay');
                if (gameplayAgent) {
                    gameplayAgent.recordCombatEvent(data);
                }
                break;

            case 'movement':
                const perfAgent = this.subagentSystem.agents.get('performance');
                if (perfAgent) {
                    perfAgent.recordMovementEvent(data);
                }
                break;

            case 'screen_change':
                const uiAgent = this.subagentSystem.agents.get('ui');
                if (uiAgent) {
                    uiAgent.recordScreenTransition(data);
                }
                break;

            case 'player_input':
                // Log para debug
                const debugAgent = this.subagentSystem.agents.get('debug');
                if (debugAgent) {
                    debugAgent.recordInputEvent(data);
                }
                break;
        }
    }

    /**
     * 📊 Inicia monitoramento contínuo
     */
    startMonitoring() {
        // Monitorar FPS
        setInterval(() => {
            if (this.gameplayEngine) {
                const fps = this.gameplayEngine.fps || 0;
                const perfAgent = this.subagentSystem.agents.get('performance');
                if (perfAgent) {
                    perfAgent.recordFPS(fps);
                }
            }
        }, 1000);

        // Monitorar estado do jogo
        setInterval(() => {
            this.collectGameState();
        }, 5000);

        console.log('📊 Monitoramento iniciado');
    }

    /**
     * 📈 Coleta estado atual do jogo
     */
    collectGameState() {
        if (!this.gameplayEngine) return;

        const state = {
            timestamp: Date.now(),
            player: this.gameplayEngine.player ? {
                level: this.gameplayEngine.player.level,
                health: this.gameplayEngine.player.health,
                x: this.gameplayEngine.player.x,
                y: this.gameplayEngine.player.y
            } : null,
            zone: this.gameplayEngine.currentZone,
            mobs: this.gameplayEngine.mobs ? this.gameplayEngine.mobs.length : 0,
            fps: this.gameplayEngine.fps
        };

        // Enviar para PerformanceAgent
        const perfAgent = this.subagentSystem.agents.get('performance');
        if (perfAgent) {
            perfAgent.recordGameState(state);
        }
    }

    /**
     * 🎯 Executa análise em tempo real
     */
    async runRealtimeAnalysis() {
        if (!this.subagentSystem) {
            console.error('❌ SubagentSystem não disponível');
            return null;
        }

        console.log('🎯 Executando análise em tempo real...');

        const results = {};
        
        // Análise de gameplay
        const gameplayAgent = this.subagentSystem.agents.get('gameplay');
        if (gameplayAgent && this.gameplayEngine) {
            results.gameplay = gameplayAgent.analyzeRealtime(this.gameplayEngine);
        }

        // Análise de performance
        const perfAgent = this.subagentSystem.agents.get('performance');
        if (perfAgent) {
            results.performance = perfAgent.getRealtimeMetrics();
        }

        // Análise de UI
        const uiAgent = this.subagentSystem.agents.get('ui');
        if (uiAgent) {
            results.ui = uiAgent.analyzeInterface();
        }

        return results;
    }

    /**
     * 🚨 Verifica se há problemas críticos
     */
    checkCriticalIssues() {
        const issues = [];

        // Verificar FPS baixo
        if (this.gameplayEngine && this.gameplayEngine.fps < 30) {
            issues.push({
                type: 'low_fps',
                severity: 'high',
                message: `FPS crítico: ${this.gameplayEngine.fps}`,
                suggestion: 'Verificar otimização do render loop'
            });
        }

        // Verificar player travado
        if (this.gameplayEngine && this.gameplayEngine.player) {
            const player = this.gameplayEngine.player;
            if (player.health <= 0) {
                issues.push({
                    type: 'player_dead',
                    severity: 'medium',
                    message: 'Player morreu',
                    suggestion: 'Implementar sistema de respawn'
                });
            }
        }

        return issues;
    }

    /**
     * 💡 Gera sugestões em tempo real
     */
    generateRealtimeSuggestions() {
        const suggestions = [];

        // Analisar padrões de gameplay
        const gameplayAgent = this.subagentSystem.agents.get('gameplay');
        if (gameplayAgent && gameplayAgent.combatEvents) {
            const combatCount = gameplayAgent.combatEvents.length;
            if (combatCount > 10) {
                suggestions.push('Jogador está muito ativo em combate - considerar aumentar dificuldade');
            }
        }

        // Analisar movimento
        const perfAgent = this.subagentSystem.agents.get('performance');
        if (perfAgent && perfAgent.movementEvents) {
            const movementCount = perfAgent.movementEvents.length;
            if (movementCount < 5) {
                suggestions.push('Jogador está parado há muito tempo - adicionar conteúdo de exploração');
            }
        }

        return suggestions;
    }
}

// Métodos adicionais para os agentes existentes

// Estender GameplayAgent
GameplayAgent.prototype.connectToEngine = function(engine) {
    this.connectedEngine = engine;
    this.combatEvents = [];
    this.movementEvents = [];
    console.log('🎮 GameplayAgent conectado ao engine');
};

GameplayAgent.prototype.recordCombatEvent = function(data) {
    this.combatEvents = this.combatEvents || [];
    this.combatEvents.push(data);
    
    // Manter apenas últimos 100 eventos
    if (this.combatEvents.length > 100) {
        this.combatEvents.shift();
    }
};

GameplayAgent.prototype.analyzeRealtime = function(engine) {
    return {
        agent: 'gameplay',
        combatActivity: this.combatEvents ? this.combatEvents.length : 0,
        playerLevel: engine.player ? engine.player.level : 0,
        mobsNearby: engine.mobs ? engine.mobs.filter(m => {
            if (!engine.player) return false;
            const dist = Math.sqrt(
                Math.pow(m.x - engine.player.x, 2) + 
                Math.pow(m.y - engine.player.y, 2)
            );
            return dist < 200;
        }).length : 0
    };
};

// Estender UIAgent
UIAgent.prototype.connectToHUD = function(hud) {
    this.connectedHUD = hud;
    this.screenTransitions = [];
    console.log('🎨 UIAgent conectado ao HUD');
};

UIAgent.prototype.recordScreenTransition = function(data) {
    this.screenTransitions = this.screenTransitions || [];
    this.screenTransitions.push(data);
};

// Estender PerformanceAgent
PerformanceAgent.prototype.recordFPS = function(fps) {
    this.fpsHistory = this.fpsHistory || [];
    this.fpsHistory.push({ value: fps, timestamp: Date.now() });
    
    if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
    }
};

PerformanceAgent.prototype.recordMovementEvent = function(data) {
    this.movementEvents = this.movementEvents || [];
    this.movementEvents.push(data);
    
    if (this.movementEvents.length > 50) {
        this.movementEvents.shift();
    }
};

PerformanceAgent.prototype.recordGameState = function(state) {
    this.gameStateHistory = this.gameStateHistory || [];
    this.gameStateHistory.push(state);
    
    if (this.gameStateHistory.length > 20) {
        this.gameStateHistory.shift();
    }
};

PerformanceAgent.prototype.getRealtimeMetrics = function() {
    const avgFPS = this.fpsHistory ? 
        this.fpsHistory.reduce((sum, h) => sum + h.value, 0) / this.fpsHistory.length : 0;
    
    return {
        agent: 'performance',
        averageFPS: Math.round(avgFPS),
        fpsHistoryLength: this.fpsHistory ? this.fpsHistory.length : 0,
        movementEvents: this.movementEvents ? this.movementEvents.length : 0
    };
};

// Estender DebugAgent
DebugAgent.prototype.monitorSystems = function(systems) {
    this.monitoredSystems = systems;
    this.inputEvents = [];
    console.log('🔍 DebugAgent monitorando sistemas');
};

DebugAgent.prototype.recordInputEvent = function(data) {
    this.inputEvents = this.inputEvents || [];
    this.inputEvents.push(data);
    
    if (this.inputEvents.length > 100) {
        this.inputEvents.shift();
    }
};

// Inicializar integração quando DOM estiver pronto
if (typeof window !== 'undefined') {
    window.subagentIntegration = new SubagentGameplayIntegration();
    
    // Aguardar carregamento completo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => window.subagentIntegration.initialize(), 1000);
        });
    } else {
        setTimeout(() => window.subagentIntegration.initialize(), 1000);
    }
}

console.log('🔗 Subagent-Gameplay Integration carregado');

export default SubagentGameplayIntegration;
