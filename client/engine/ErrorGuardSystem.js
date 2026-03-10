// === ERROR GUARD SYSTEM ===

/**
 * Sistema de guards para prevenir crashes
 * Verifica objetos críticos antes de acessá-los
 */

export class ErrorGuardSystem {
    constructor() {
        this.guards = new Map();
        this.errorCount = new Map();
        this.maxErrors = 10;
        this.isInitialized = false;
        
        // Setup default guards
        this.setupDefaultGuards();
        
        console.log('🛡️ Error Guard System initialized');
    }
    
    initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Error Guard System already initialized');
            return false;
        }
        
        this.isInitialized = true;
        console.log('✅ Error Guard System initialized');
        return true;
    }
    
    setupDefaultGuards() {
        // Player guards
        this.addGuard('player', {
            check: () => this.checkPlayer(),
            fallback: () => this.getFallbackPlayer(),
            critical: true
        });
        
        // GameEngine guards
        this.addGuard('gameEngine', {
            check: () => this.checkGameEngine(),
            fallback: () => this.getFallbackGameEngine(),
            critical: true
        });
        
        // ECS Manager guards
        this.addGuard('ecsManager', {
            check: () => this.checkECSManager(),
            fallback: () => this.getFallbackECSManager(),
            critical: true
        });
        
        // Network Manager guards
        this.addGuard('networkManager', {
            check: () => this.checkNetworkManager(),
            fallback: () => this.getFallbackNetworkManager(),
            critical: true
        });
        
        // Session Manager guards
        this.addGuard('sessionManager', {
            check: () => this.checkSessionManager(),
            fallback: () => this.getFallbackSessionManager(),
            critical: true
        });
        
        // Canvas guards
        this.addGuard('canvas', {
            check: () => this.checkCanvas(),
            fallback: () => this.getFallbackCanvas(),
            critical: false
        });
        
        // State Manager guards
        this.addGuard('stateManager', {
            check: () => this.checkStateManager(),
            fallback: () => this.getFallbackStateManager(),
            critical: true
        });
        
        // Input System guards
        this.addGuard('inputSystem', {
            check: () => this.checkInputSystem(),
            fallback: () => this.getFallbackInputSystem(),
            critical: false
        });
        
        // Render System guards
        this.addGuard('renderSystem', {
            check: () => this.checkRenderSystem(),
            fallback: () => this.getFallbackRenderSystem(),
            critical: false
        });
    }
    
    // === GUARD MANAGEMENT ===
    
    addGuard(name, guard) {
        if (!guard || typeof guard.check !== 'function') {
            throw new Error('Guard must have a check function');
        }
        
        this.guards.set(name, {
            check: guard.check,
            fallback: guard.fallback || (() => null),
            critical: guard.critical || false,
            lastCheck: 0,
            checkCount: 0,
            errorCount: 0
        });
        
        console.log(`🛡️ Guard added: ${name}`);
    }
    
    removeGuard(name) {
        const removed = this.guards.delete(name);
        if (removed) {
            console.log(`🗑️ Guard removed: ${name}`);
        }
        return removed;
    }
    
    // === GUARD EXECUTION ===
    
    guard(name, operation, fallbackOperation = null) {
        const guard = this.guards.get(name);
        if (!guard) {
            console.warn(`⚠️ No guard found for: ${name}`);
            return this.executeOperation(operation, fallbackOperation);
        }
        
        guard.checkCount++;
        guard.lastCheck = Date.now();
        
        try {
            const result = guard.check();
            
            if (result) {
                // Guard passed, execute operation
                return this.executeOperation(operation, fallbackOperation);
            } else {
                // Guard failed, use fallback
                console.warn(`⚠️ Guard failed for: ${name}`);
                guard.errorCount++;
                
                if (guard.critical && guard.errorCount >= this.maxErrors) {
                    console.error(`💥 Critical guard ${name} failed too many times`);
                    this.handleCriticalGuardFailure(name);
                }
                
                return this.executeOperation(guard.fallback, fallbackOperation);
            }
            
        } catch (error) {
            console.error(`❌ Guard ${name} check failed:`, error);
            guard.errorCount++;
            
            if (guard.critical && guard.errorCount >= this.maxErrors) {
                console.error(`💥 Critical guard ${name} failed too many times`);
                this.handleCriticalGuardFailure(name);
            }
            
            return this.executeOperation(guard.fallback, fallbackOperation);
        }
    }
    
    executeOperation(operation, fallbackOperation) {
        try {
            if (typeof operation === 'function') {
                return operation();
            }
            return null;
        } catch (error) {
            console.error('❌ Operation failed:', error);
            
            if (typeof fallbackOperation === 'function') {
                try {
                    return fallbackOperation();
                } catch (fallbackError) {
                    console.error('❌ Fallback operation failed:', fallbackError);
                }
            }
            
            return null;
        }
    }
    
    // === GUARD CHECKS ===
    
    checkPlayer() {
        if (!window.gameEngine) return false;
        if (!window.gameEngine.player) return false;
        if (typeof window.gameEngine.player !== 'object') return false;
        
        const player = window.gameEngine.player;
        
        // Check required properties
        const requiredProps = ['id', 'x', 'y', 'health'];
        for (const prop of requiredProps) {
            if (!(prop in player)) return false;
        }
        
        // Check value types
        if (typeof player.x !== 'number' || typeof player.y !== 'number') return false;
        if (typeof player.health !== 'number') return false;
        
        // Check bounds
        if (player.x < -1000 || player.x > 2000) return false;
        if (player.y < -1000 || player.y > 2000) return false;
        if (player.health < 0 || player.health > 1000) return false;
        
        return true;
    }
    
    checkGameEngine() {
        if (!window.gameEngine) return false;
        if (typeof window.gameEngine !== 'object') return false;
        
        // Check required methods
        const requiredMethods = ['update', 'render', 'stop'];
        for (const method of requiredMethods) {
            if (typeof window.gameEngine[method] !== 'function') return false;
        }
        
        // Check required properties
        const requiredProps = ['isInitialized', 'isRunning'];
        for (const prop of requiredProps) {
            if (!(prop in window.gameEngine)) return false;
        }
        
        return true;
    }
    
    checkECSManager() {
        if (!window.gameEngine?.ecsManager) return false;
        if (typeof window.gameEngine.ecsManager !== 'object') return false;
        
        const ecs = window.gameEngine.ecsManager;
        
        // Check required methods
        const requiredMethods = ['getEntities', 'createEntity', 'removeEntity', 'update'];
        for (const method of requiredMethods) {
            if (typeof ecs[method] !== 'function') return false;
        }
        
        return true;
    }
    
    checkNetworkManager() {
        if (!window.networkManager) return false;
        if (typeof window.networkManager !== 'object') return false;
        
        // Check required methods
        const requiredMethods = ['send', 'on', 'emit', 'connect'];
        for (const method of requiredMethods) {
            if (typeof window.networkManager[method] !== 'function') return false;
        }
        
        return true;
    }
    
    checkSessionManager() {
        if (!window.sessionManager) return false;
        if (typeof window.sessionManager !== 'object') return false;
        
        // Check required methods
        const requiredMethods = ['getCurrentUser', 'getCurrentCharacter', 'isLoggedIn'];
        for (const method of requiredMethods) {
            if (typeof window.sessionManager[method] !== 'function') return false;
        }
        
        return true;
    }
    
    checkCanvas() {
        if (!document) return false;
        
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        
        return true;
    }
    
    checkStateManager() {
        if (!window.legacyClient?.stateManager) return false;
        if (typeof window.legacyClient.stateManager !== 'object') return false;
        
        // Check required methods
        const requiredMethods = ['getCurrentState', 'setState', 'canAccessGameplay'];
        for (const method of requiredMethods) {
            if (typeof window.legacyClient.stateManager[method] !== 'function') return false;
        }
        
        return true;
    }
    
    checkInputSystem() {
        if (!window.gameEngine?.inputSystem) return false;
        if (typeof window.gameEngine.inputSystem !== 'object') return false;
        
        return true;
    }
    
    checkRenderSystem() {
        if (!window.gameEngine?.renderer) return false;
        if (typeof window.gameEngine.renderer !== 'object') return false;
        
        return true;
    }
    
    // === FALLBACK OBJECTS ===
    
    getFallbackPlayer() {
        return {
            id: 'fallback_player',
            x: 400,
            y: 300,
            health: 100,
            maxHealth: 100,
            speed: 150,
            size: 32,
            color: '#4CAF50',
            name: 'Fallback Player'
        };
    }
    
    getFallbackGameEngine() {
        return {
            isInitialized: false,
            isRunning: false,
            update: () => console.warn('⚠️ Using fallback game engine update'),
            render: () => console.warn('⚠️ Using fallback game engine render'),
            stop: () => console.warn('⚠️ Using fallback game engine stop')
        };
    }
    
    getFallbackECSManager() {
        return {
            getEntities: () => [],
            createEntity: () => ({ id: 'fallback_entity', components: new Map() }),
            removeEntity: () => {},
            update: () => {}
        };
    }
    
    getFallbackNetworkManager() {
        return {
            send: () => false,
            on: () => {},
            emit: () => {},
            connect: () => false,
            isConnected: false
        };
    }
    
    getFallbackSessionManager() {
        return {
            getCurrentUser: () => null,
            getCurrentCharacter: () => null,
            isLoggedIn: () => false,
            setCurrentUser: () => {},
            setCurrentCharacter: () => {}
        };
    }
    
    getFallbackCanvas() {
        return {
            width: 800,
            height: 600,
            getContext: () => ({
                fillRect: () => {},
                strokeRect: () => {},
                fillStyle: '#000000',
                strokeStyle: '#000000',
                clearRect: () => {}
            })
        };
    }
    
    getFallbackStateManager() {
        return {
            getCurrentState: () => 'LOGIN',
            setState: () => {},
            canAccessGameplay: () => false
        };
    }
    
    getFallbackInputSystem() {
        return {
            keys: {},
            isKeyPressed: () => false,
            getMovementVector: () => ({ x: 0, y: 0 })
        };
    }
    
    getFallbackRenderSystem() {
        return {
            render: () => {},
            clear: () => {},
            isInitialized: false
        };
    }
    
    // === ERROR HANDLING ===
    
    handleCriticalGuardFailure(guardName) {
        console.error(`💥 Critical guard failure: ${guardName}`);
        
        // Try to recover
        switch (guardName) {
            case 'player':
                this.recoverPlayer();
                break;
            case 'gameEngine':
                this.recoverGameEngine();
                break;
            case 'ecsManager':
                this.recoverECSManager();
                break;
            case 'networkManager':
                this.recoverNetworkManager();
                break;
            case 'sessionManager':
                this.recoverSessionManager();
                break;
            case 'stateManager':
                this.recoverStateManager();
                break;
            default:
                console.warn(`⚠️ No recovery strategy for guard: ${guardName}`);
        }
    }
    
    recoverPlayer() {
        console.log('🔧 Attempting to recover player...');
        
        if (window.gameEngine && window.sessionManager?.getCurrentCharacter()) {
            const character = window.sessionManager.getCurrentCharacter();
            window.gameEngine.player = {
                ...character,
                x: character.x || 400,
                y: character.y || 300,
                health: character.hp || 100
            };
            
            console.log('✅ Player recovered');
        }
    }
    
    recoverGameEngine() {
        console.log('🔧 Attempting to recover game engine...');
        
        if (window.GameEngine) {
            try {
                window.gameEngine = new window.GameEngine();
                console.log('✅ Game engine recovered');
            } catch (error) {
                console.error('❌ Failed to recover game engine:', error);
            }
        }
    }
    
    recoverECSManager() {
        console.log('🔧 Attempting to recover ECS manager...');
        
        if (window.ECSManager && window.gameEngine) {
            try {
                window.gameEngine.ecsManager = new window.ECSManager();
                console.log('✅ ECS manager recovered');
            } catch (error) {
                console.error('❌ Failed to recover ECS manager:', error);
            }
        }
    }
    
    recoverNetworkManager() {
        console.log('🔧 Attempting to recover network manager...');
        
        if (window.NetworkManager) {
            try {
                window.networkManager = new window.NetworkManager();
                window.networkManager.connect();
                console.log('✅ Network manager recovered');
            } catch (error) {
                console.error('❌ Failed to recover network manager:', error);
            }
        }
    }
    
    recoverSessionManager() {
        console.log('🔧 Attempting to recover session manager...');
        
        if (window.SessionManager) {
            try {
                window.sessionManager = new window.SessionManager();
                console.log('✅ Session manager recovered');
            } catch (error) {
                console.error('❌ Failed to recover session manager:', error);
            }
        }
    }
    
    recoverStateManager() {
        console.log('🔧 Attempting to recover state manager...');
        
        if (window.ClientStateManager && window.legacyClient) {
            try {
                window.legacyClient.stateManager = new window.ClientStateManager();
                window.legacyClient.stateManager.setState('LOGIN');
                console.log('✅ State manager recovered');
            } catch (error) {
                console.error('❌ Failed to recover state manager:', error);
            }
        }
    }
    
    // === UTILITY METHODS ===
    
    checkAllGuards() {
        const results = {};
        
        this.guards.forEach((guard, name) => {
            try {
                results[name] = guard.check();
            } catch (error) {
                results[name] = false;
                console.error(`❌ Guard ${name} check failed:`, error);
            }
        });
        
        return results;
    }
    
    getGuardStatus() {
        const status = {};
        
        this.guards.forEach((guard, name) => {
            status[name] = {
                checkCount: guard.checkCount,
                errorCount: guard.errorCount,
                lastCheck: guard.lastCheck,
                critical: guard.critical
            };
        });
        
        return status;
    }
    
    resetGuardErrors(name) {
        if (name) {
            const guard = this.guards.get(name);
            if (guard) {
                guard.errorCount = 0;
                console.log(`🔄 Reset errors for guard: ${name}`);
            }
        } else {
            this.guards.forEach((guard, guardName) => {
                guard.errorCount = 0;
            });
            console.log('🔄 Reset all guard errors');
        }
    }
    
    // === CLEANUP ===
    
    destroy() {
        this.guards.clear();
        this.errorCount.clear();
        this.isInitialized = false;
        console.log('🗑️ Error Guard System destroyed');
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.ErrorGuardSystem = ErrorGuardSystem;
}
