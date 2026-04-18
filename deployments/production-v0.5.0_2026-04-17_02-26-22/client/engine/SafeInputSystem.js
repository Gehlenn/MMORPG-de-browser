// === SAFE INPUT SYSTEM ===

/**
 * Sistema de input com guards
 * Verifica player entity antes de aplicar movimento
 */

export class SafeInputSystem {
    constructor() {
        this.keys = new Map();
        this.mouse = { x: 0, y: 0, buttons: {} };
        this.isEnabled = false;
        this.isInitialized = false;
        
        // Callbacks
        this.onKeyDown = null;
        this.onKeyUp = null;
        this.onMouseMove = null;
        this.onMouseDown = null;
        this.onMouseUp = null;
        
        // Config
        this.config = {
            enableKeyboard: true,
            enableMouse: true,
            enableTouch: false,
            preventDefault: true
        };
        
        // Guards
        this.guards = {
            requirePlayerEntity: true,
            requireGameState: true,
            requireInputComponent: true
        };
        
        this.initialize();
    }
    
    initialize() {
        if (this.isInitialized) {
            console.warn('⚠️ Input system already initialized');
            return;
        }
        
        console.log('⌨️ Initializing Safe Input System...');
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ Safe Input System initialized');
    }
    
    setupEventListeners() {
        if (!document) {
            console.warn('⚠️ Document not available, input system disabled');
            return;
        }
        
        // Keyboard events
        if (this.config.enableKeyboard) {
            document.addEventListener('keydown', (e) => this.handleKeyDown(e));
            document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        }
        
        // Mouse events
        if (this.config.enableMouse) {
            document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            document.addEventListener('contextmenu', (e) => e.preventDefault());
        }
        
        // Touch events (disabled for stabilization)
        if (this.config.enableTouch) {
            document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        }
        
        // Window focus/blur
        window.addEventListener('blur', () => this.handleWindowBlur());
        window.addEventListener('focus', () => this.handleWindowFocus());
    }
    
    // === GUARD METHODS ===
    
    checkPlayerEntity() {
        if (!this.guards.requirePlayerEntity) return true;
        
        // Check GameEngine
        if (!window.gameEngine) {
            console.warn('⚠️ Input guard: GameEngine not available');
            return false;
        }
        
        // Check player entity
        if (!window.gameEngine.player) {
            console.warn('⚠️ Input guard: Player entity not available');
            return false;
        }
        
        // Check ECS entity
        if (window.gameEngine.ecsManager) {
            const playerEntity = window.gameEngine.ecsManager.getEntity(window.gameEngine.player.id);
            if (!playerEntity || !playerEntity.isActive()) {
                console.warn('⚠️ Input guard: Player ECS entity not active');
                return false;
            }
        }
        
        return true;
    }
    
    checkGameState() {
        if (!this.guards.requireGameState) return true;
        
        // Check state manager
        if (!window.legacyClient?.stateManager) {
            console.warn('⚠️ Input guard: State manager not available');
            return false;
        }
        
        // Check if in game state
        const currentState = window.legacyClient.stateManager.getCurrentState();
        if (currentState !== 'IN_GAME') {
            console.warn(`⚠️ Input guard: Not in game state (${currentState})`);
            return false;
        }
        
        return true;
    }
    
    checkInputComponent() {
        if (!this.guards.requireInputComponent) return true;
        
        // Check ECS input component
        if (window.gameEngine?.ecsManager) {
            const player = window.gameEngine.player;
            const playerEntity = window.gameEngine.ecsManager.getEntity(player.id);
            
            if (playerEntity) {
                const inputComponent = playerEntity.getComponent('input');
                if (!inputComponent || !inputComponent.inputEnabled) {
                    console.warn('⚠️ Input guard: Input component disabled');
                    return false;
                }
            }
        }
        
        return true;
    }
    
    canProcessInput() {
        return this.isEnabled && 
               this.isInitialized && 
               this.checkPlayerEntity() && 
               this.checkGameState() && 
               this.checkInputComponent();
    }
    
    // === EVENT HANDLERS ===
    
    handleKeyDown(event) {
        if (!this.canProcessInput()) return;
        
        const key = event.key.toLowerCase();
        this.keys.set(key, true);
        
        if (this.config.preventDefault) {
            // Prevent default for game keys only
            const gameKeys = ['w', 'a', 's', 'd', 'space', 'escape', 'tab'];
            if (gameKeys.includes(key)) {
                event.preventDefault();
            }
        }
        
        // Process movement input safely
        this.processMovementInput(key, true);
        
        // Trigger callback
        if (this.onKeyDown) {
            this.onKeyDown(event);
        }
    }
    
    handleKeyUp(event) {
        if (!this.canProcessInput()) return;
        
        const key = event.key.toLowerCase();
        this.keys.set(key, false);
        
        if (this.config.preventDefault) {
            const gameKeys = ['w', 'a', 's', 'd', 'space', 'escape', 'tab'];
            if (gameKeys.includes(key)) {
                event.preventDefault();
            }
        }
        
        // Process movement input safely
        this.processMovementInput(key, false);
        
        // Trigger callback
        if (this.onKeyUp) {
            this.onKeyUp(event);
        }
    }
    
    handleMouseMove(event) {
        if (!this.canProcessInput()) return;
        
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
        
        // Trigger callback
        if (this.onMouseMove) {
            this.onMouseMove(event);
        }
    }
    
    handleMouseDown(event) {
        if (!this.canProcessInput()) return;
        
        this.mouse.buttons[event.button] = true;
        
        // Process action input safely
        this.processActionInput(event.button, true);
        
        // Trigger callback
        if (this.onMouseDown) {
            this.onMouseDown(event);
        }
    }
    
    handleMouseUp(event) {
        if (!this.canProcessInput()) return;
        
        this.mouse.buttons[event.button] = false;
        
        // Process action input safely
        this.processActionInput(event.button, false);
        
        // Trigger callback
        if (this.onMouseUp) {
            this.onMouseUp(event);
        }
    }
    
    handleTouchStart(event) {
        if (!this.canProcessInput()) return;
        
        // Touch input disabled for stabilization
        console.log('📱 Touch input disabled for stabilization');
    }
    
    handleTouchMove(event) {
        if (!this.canProcessInput()) return;
        
        console.log('📱 Touch input disabled for stabilization');
    }
    
    handleTouchEnd(event) {
        if (!this.canProcessInput()) return;
        
        console.log('📱 Touch input disabled for stabilization');
    }
    
    handleWindowBlur() {
        // Clear all input on window blur
        this.keys.clear();
        Object.keys(this.mouse.buttons).forEach(button => {
            this.mouse.buttons[button] = false;
        });
        
        console.log('🔍 Input cleared on window blur');
    }
    
    handleWindowFocus() {
        console.log('🔍 Window focused, input ready');
    }
    
    // === INPUT PROCESSING ===
    
    processMovementInput(key, isPressed) {
        if (!window.gameEngine || !window.gameEngine.player) return;
        
        const player = window.gameEngine.player;
        const speed = player.speed || 150;
        
        // Update velocity based on keys
        let vx = 0, vy = 0;
        
        if (this.keys.get('w')) vy = -1;
        if (this.keys.get('s')) vy = 1;
        if (this.keys.get('a')) vx = -1;
        if (this.keys.get('d')) vx = 1;
        
        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const length = Math.sqrt(vx * vx + vy * vy);
            vx /= length;
            vy /= length;
        }
        
        // Apply speed
        vx *= speed;
        vy *= speed;
        
        // Update player movement component
        if (window.gameEngine.ecsManager) {
            const playerEntity = window.gameEngine.ecsManager.getEntity(player.id);
            if (playerEntity) {
                const movementComponent = playerEntity.getComponent('movement');
                if (movementComponent) {
                    movementComponent.velocity.x = vx;
                    movementComponent.velocity.y = vy;
                }
            }
        } else {
            // Fallback: update player directly
            player.velocityX = vx;
            player.velocityY = vy;
        }
        
        // Send network update
        if (window.networkManager?.isConnected) {
            window.networkManager.sendPlayerUpdate(
                { x: player.x, y: player.y },
                { x: vx, y: vy }
            );
        }
    }
    
    processActionInput(button, isPressed) {
        if (!window.gameEngine || !window.gameEngine.player) return;
        
        const player = window.gameEngine.player;
        
        // Process different actions based on button
        switch (button) {
            case 0: // Left click - Attack
                if (isPressed) {
                    this.performAttack(player);
                }
                break;
            case 2: // Right click - Interact
                if (isPressed) {
                    this.performInteraction(player);
                }
                break;
        }
    }
    
    performAttack(player) {
        // Check attack cooldown
        const now = Date.now();
        if (player.lastAttack && now - player.lastAttack < (player.attackCooldown || 500)) {
            return;
        }
        
        player.lastAttack = now;
        
        // Send attack action
        if (window.networkManager?.isConnected) {
            window.networkManager.sendPlayerAction('attack', {
                direction: player.direction || 0,
                timestamp: now
            });
        }
        
        console.log('⚔️ Player attack performed');
    }
    
    performInteraction(player) {
        // Send interaction action
        if (window.networkManager?.isConnected) {
            window.networkManager.sendPlayerAction('interact', {
                position: { x: player.x, y: player.y },
                timestamp: Date.now()
            });
        }
        
        console.log('🤝 Player interaction performed');
    }
    
    // === PUBLIC METHODS ===
    
    enable() {
        this.isEnabled = true;
        console.log('✅ Input system enabled');
    }
    
    disable() {
        this.isEnabled = false;
        this.keys.clear();
        Object.keys(this.mouse.buttons).forEach(button => {
            this.mouse.buttons[button] = false;
        });
        console.log('❌ Input system disabled');
    }
    
    isKeyPressed(key) {
        return this.keys.get(key.toLowerCase()) || false;
    }
    
    isMouseButtonPressed(button) {
        return this.mouse.buttons[button] || false;
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    getMovementVector() {
        let vx = 0, vy = 0;
        
        if (this.keys.get('w')) vy = -1;
        if (this.keys.get('s')) vy = 1;
        if (this.keys.get('a')) vx = -1;
        if (this.keys.get('d')) vx = 1;
        
        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
            const length = Math.sqrt(vx * vx + vy * vy);
            vx /= length;
            vy /= length;
        }
        
        return { x: vx, y: vy };
    }
    
    // === GUARD CONFIGURATION ===
    
    setGuard(guard, enabled) {
        if (guard in this.guards) {
            this.guards[guard] = enabled;
            console.log(`🛡️ Guard ${guard} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    enableAllGuards() {
        Object.keys(this.guards).forEach(guard => {
            this.guards[guard] = true;
        });
        console.log('🛡️ All input guards enabled');
    }
    
    disableAllGuards() {
        Object.keys(this.guards).forEach(guard => {
            this.guards[guard] = false;
        });
        console.log('🛡️ All input guards disabled');
    }
    
    // === CALLBACK REGISTRATION ===
    
    onKeyDown(callback) {
        this.onKeyDown = callback;
    }
    
    onKeyUp(callback) {
        this.onKeyUp = callback;
    }
    
    onMouseMove(callback) {
        this.onMouseMove = callback;
    }
    
    onMouseDown(callback) {
        this.onMouseDown = callback;
    }
    
    onMouseUp(callback) {
        this.onMouseUp = callback;
    }
    
    // === STATUS ===
    
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isEnabled: this.isEnabled,
            canProcessInput: this.canProcessInput(),
            activeKeys: Array.from(this.keys.entries()).filter(([k, v]) => v).map(([k]) => k),
            mouseButtons: Object.entries(this.mouse.buttons).filter(([k, v]) => v).map(([k]) => k),
            guards: { ...this.guards },
            guardChecks: {
                playerEntity: this.checkPlayerEntity(),
                gameState: this.checkGameState(),
                inputComponent: this.checkInputComponent()
            }
        };
    }
    
    // === CLEANUP ===
    
    destroy() {
        this.disable();
        
        // Remove event listeners
        if (document) {
            document.removeEventListener('keydown', this.handleKeyDown);
            document.removeEventListener('keyup', this.handleKeyUp);
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mousedown', this.handleMouseDown);
            document.removeEventListener('mouseup', this.handleMouseUp);
            document.removeEventListener('contextmenu', e => e.preventDefault());
        }
        
        this.isInitialized = false;
        console.log('🗑️ Safe Input System destroyed');
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.SafeInputSystem = SafeInputSystem;
}
