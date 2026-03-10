/**
 * Input System
 * Handles keyboard and mouse input for player movement and actions
 */

class Input {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        this.callbacks = {
            onMove: null,
            onAttack: null
        };
        
        this.init();
    }
    
    /**
     * Initialize input listeners
     */
    init() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        console.log('🎮 Input system initialized');
    }
    
    /**
     * Handle key down
     */
    handleKeyDown(e) {
        // Check if we're in an input field - if so, don't handle game keys
        const activeElement = document.activeElement;
        const isInputField = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'SELECT'
        );
        
        if (isInputField) {
            return; // Allow normal typing in input fields
        }
        
        this.keys[e.key.toLowerCase()] = true;
        
        // Prevent default for game keys only when not in input field
        if (['w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    }
    
    /**
     * Handle key up
     */
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }
    
    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }
    
    /**
     * Handle mouse down
     */
    handleMouseDown(e) {
        this.mouse.clicked = true;
        this.mouse.button = e.button;
        
        // Trigger attack callback
        if (this.callbacks.onAttack) {
            this.callbacks.onAttack(this.mouse.x, this.mouse.y);
        }
    }
    
    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        this.mouse.clicked = false;
    }
    
    /**
     * Get movement direction from keys
     */
    getMovementDirection() {
        const direction = { x: 0, y: 0 };
        
        if (this.keys['w']) direction.y = -1;
        if (this.keys['s']) direction.y = 1;
        if (this.keys['a']) direction.x = -1;
        if (this.keys['d']) direction.x = 1;
        
        // Normalize diagonal movement
        if (direction.x !== 0 && direction.y !== 0) {
            const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= length;
            direction.y /= length;
        }
        
        return direction;
    }
    
    /**
     * Check if movement keys are pressed
     */
    isMoving() {
        return this.keys['w'] || this.keys['a'] || this.keys['s'] || this.keys['d'];
    }
    
    /**
     * Set movement callback
     */
    onMove(callback) {
        this.callbacks.onMove = callback;
    }
    
    /**
     * Set attack callback
     */
    onAttack(callback) {
        this.callbacks.onAttack = callback;
    }
    
    /**
     * Update input state
     */
    update() {
        // Trigger movement callback if moving
        if (this.isMoving() && this.callbacks.onMove) {
            const direction = this.getMovementDirection();
            this.callbacks.onMove(direction.x, direction.y);
        }
    }
    
    /**
     * Get current mouse position relative to canvas
     */
    getMousePosition(canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: this.mouse.x - rect.left,
            y: this.mouse.y - rect.top
        };
    }
}

// Export for global access
window.Input = Input;
