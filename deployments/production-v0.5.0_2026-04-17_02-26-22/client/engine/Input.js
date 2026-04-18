/**
 * Input System
 * Handles all user input including keyboard, mouse, and touch
 */

class Input {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, buttons: {} };
        this.touches = new Map();
        
        // Event callbacks
        this.callbacks = {
            move: [],
            action: [],
            skill: [],
            ui: [],
            camera: []
        };
        
        // Input configuration
        this.config = {
            // Keyboard bindings
            keyboard: {
                moveUp: ['w', 'W', 'ArrowUp'],
                moveDown: ['s', 'S', 'ArrowDown'],
                moveLeft: ['a', 'A', 'ArrowLeft'],
                moveRight: ['d', 'D', 'ArrowRight'],
                interact: ['e', 'E', ' '],
                attack: ['Enter'],
                inventory: ['i', 'I'],
                skills: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
                escape: ['Escape'],
                map: ['m', 'M'],
                chat: ['Enter']
            },
            
            // Mouse bindings
            mouse: {
                leftClick: 0,
                rightClick: 2,
                middleClick: 1
            },
            
            // Touch configuration
            touch: {
                tapThreshold: 10,
                doubleTapThreshold: 300,
                longPressThreshold: 500
            }
        };
        
        // State tracking
        this.lastMoveTime = 0;
        this.moveDelay = 100; // Milliseconds between moves
        this.isChatOpen = false;
        this.currentTarget = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault());
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault());
    }
    
    handleKeyDown(event) {
        const key = event.key;
        this.keys.add(key);
        
        // Check for skill usage
        if (this.config.keyboard.skills.includes(key)) {
            const skillIndex = parseInt(key) - 1;
            this.emit('skill', skillIndex);
            return;
        }
        
        // Check for other actions
        if (this.config.keyboard.interact.includes(key)) {
            this.emit('action', 'interact');
        } else if (this.config.keyboard.attack.includes(key)) {
            this.emit('action', 'attack');
        } else if (this.config.keyboard.inventory.includes(key)) {
            this.emit('action', 'inventory');
        } else if (this.config.keyboard.escape.includes(key)) {
            this.emit('ui', 'escape');
        } else if (this.config.keyboard.map.includes(key)) {
            this.emit('ui', 'map');
        } else if (this.config.keyboard.chat.includes(key) && !this.isChatOpen) {
            this.emit('ui', 'chat');
        }
    }
    
    handleKeyUp(event) {
        const key = event.key;
        this.keys.delete(key);
    }
    
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.buttons[event.button] = true;
        
        if (event.button === this.config.mouse.leftClick) {
            this.handleLeftClick(x, y);
        } else if (event.button === this.config.mouse.rightClick) {
            this.handleRightClick(x, y);
        }
    }
    
    handleMouseUp(event) {
        this.mouse.buttons[event.button] = false;
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }
    
    handleWheel(event) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -1 : 1;
        this.emit('camera', 'zoom', delta);
    }
    
    handleTouchStart(event) {
        for (const touch of event.changedTouches) {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.touches.set(touch.identifier, {
                x, y,
                startTime: Date.now(),
                startX: x,
                startY: y
            });
        }
    }
    
    handleTouchEnd(event) {
        for (const touch of event.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (!touchData) continue;
            
            const duration = Date.now() - touchData.startTime;
            const distance = Math.sqrt(
                Math.pow(touch.clientX - touchData.startX, 2) +
                Math.pow(touch.clientY - touchData.startY, 2)
            );
            
            // Check for tap
            if (distance < this.config.touch.tapThreshold) {
                if (duration < this.config.touch.doubleTapThreshold) {
                    this.handleTouchTap(touchData.x, touchData.y);
                }
            }
            
            this.touches.delete(touch.identifier);
        }
    }
    
    handleTouchMove(event) {
        for (const touch of event.changedTouches) {
            const touchData = this.touches.get(touch.identifier);
            if (!touchData) continue;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            touchData.x = x;
            touchData.y = y;
            
            // Handle swipe gestures
            const deltaX = x - touchData.startX;
            const deltaY = y - touchData.startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > this.config.touch.tapThreshold) {
                this.handleTouchSwipe(deltaX, deltaY);
            }
        }
    }
    
    handleLeftClick(x, y) {
        // Convert screen coordinates to world coordinates
        const worldPos = this.screenToWorld(x, y);
        if (!worldPos) return;
        
        // Check if clicking on an entity
        const entity = this.getEntityAt(worldPos.x, worldPos.y);
        if (entity) {
            this.emit('action', 'target', entity);
        } else {
            // Move to position
            this.emit('move', this.getDirectionFromDelta(worldPos.x, worldPos.y));
        }
    }
    
    handleRightClick(x, y) {
        // Convert screen coordinates to world coordinates
        const worldPos = this.screenToWorld(x, y);
        if (!worldPos) return;
        
        // Context menu or special action
        this.emit('action', 'context', worldPos);
    }
    
    handleTouchTap(x, y) {
        const worldPos = this.screenToWorld(x, y);
        if (!worldPos) return;
        
        this.emit('move', this.getDirectionFromDelta(worldPos.x, worldPos.y));
    }
    
    handleTouchSwipe(deltaX, deltaY) {
        // Determine swipe direction
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX > absY) {
            // Horizontal swipe
            this.emit('move', deltaX > 0 ? 'east' : 'west');
        } else {
            // Vertical swipe
            this.emit('move', deltaY > 0 ? 'south' : 'north');
        }
    }
    
    update() {
        const now = Date.now();
        
        // Handle continuous key presses for movement
        if (now - this.lastMoveTime > this.moveDelay) {
            let direction = null;
            
            // Check movement keys
            for (const key of this.keys) {
                if (this.config.keyboard.moveUp.includes(key)) {
                    direction = 'north';
                    break;
                } else if (this.config.keyboard.moveDown.includes(key)) {
                    direction = 'south';
                    break;
                } else if (this.config.keyboard.moveLeft.includes(key)) {
                    direction = 'west';
                    break;
                } else if (this.config.keyboard.moveRight.includes(key)) {
                    direction = 'east';
                    break;
                }
            }
            
            if (direction) {
                this.emit('move', direction);
                this.lastMoveTime = now;
            }
        }
    }
    
    screenToWorld(screenX, screenY) {
        // This would need access to the camera and game state
        // For now, return a simple conversion
        // In a real implementation, this would account for camera position and zoom
        return {
            x: Math.floor(screenX / 32),
            y: Math.floor(screenY / 32)
        };
    }
    
    getDirectionFromDelta(deltaX, deltaY) {
        // Convert position delta to movement direction
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX > 0 ? 'east' : 'west';
        } else {
            return deltaY > 0 ? 'south' : 'north';
        }
    }
    
    getEntityAt(x, y) {
        // This would need access to the entity manager
        // For now, return null
        return null;
    }
    
    // Event system
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }
    
    off(event, callback) {
        if (this.callbacks[event]) {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        }
    }
    
    emit(event, ...args) {
        if (this.callbacks[event]) {
            for (const callback of this.callbacks[event]) {
                callback(...args);
            }
        }
    }
    
    // Utility methods
    isKeyPressed(key) {
        return this.keys.has(key);
    }
    
    isMouseButtonPressed(button) {
        return this.mouse.buttons[button] || false;
    }
    
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    setChatOpen(open) {
        this.isChatOpen = open;
    }
    
    // Configuration methods
    setKeyBinding(action, keys) {
        if (this.config.keyboard[action]) {
            this.config.keyboard[action] = Array.isArray(keys) ? keys : [keys];
        }
    }
    
    setMoveDelay(delay) {
        this.moveDelay = Math.max(50, delay); // Minimum 50ms delay
    }
    
    // Cleanup
    destroy() {
        // Remove all event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('contextmenu', this.preventDefault);
        this.canvas.removeEventListener('wheel', this.handleWheel);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        
        // Clear all data
        this.keys.clear();
        this.touches.clear();
        this.callbacks = {};
    }
}

export default Input;
