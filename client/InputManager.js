/**
 * InputManager - Sistema Centralizado de Input
 * Gerencia teclado, mouse e touch para o jogo
 */

class InputManager {
    constructor() {
        // Estado das teclas
        this.keys = {};
        this.keysPressed = {}; // Apenas para detectar pressionamento único
        
        // Estado do mouse
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            clicked: false,
            rightClicked: false,
            down: false
        };
        
        // Callbacks registrados
        this.callbacks = {
            keyDown: [],
            keyUp: [],
            mouseMove: [],
            mouseDown: [],
            mouseUp: [],
            mouseClick: []
        };
        
        // Configurações
        this.enabled = true;
        this.canvas = null;
        this.camera = null;
        
        // Bindings
        this.keyBindings = {
            'moveUp': ['w', 'arrowup'],
            'moveDown': ['s', 'arrowdown'],
            'moveLeft': ['a', 'arrowleft'],
            'moveRight': ['d', 'arrowright'],
            'attack': [' '],
            'skill1': ['1'],
            'skill2': ['2'],
            'skill3': ['3'],
            'skill4': ['4'],
            'sprint': ['shift'],
            'interact': ['e'],
            'inventory': ['i'],
            'menu': ['escape'],
            'debug': ['f1'],
            'spawnTest': ['f2'],
            'clearMobs': ['f3']
        };
    }
    
    /**
     * Inicializa o input manager
     */
    initialize(canvas, camera) {
        this.canvas = canvas;
        this.camera = camera;
        
        this.setupKeyboard();
        this.setupMouse();
        
        console.log('🎮 InputManager inicializado');
    }
    
    /**
     * Configura listeners de teclado
     */
    setupKeyboard() {
        // Key down
        document.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Detectar pressionamento único
            if (!this.keysPressed[key]) {
                this.keysPressed[key] = true;
                this.triggerCallbacks('keyDown', key, e);
            }
            
            // Prevenir scroll com setas e espaço
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        // Key up
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            this.keysPressed[key] = false;
            
            this.triggerCallbacks('keyUp', key, e);
        });
    }
    
    /**
     * Configura listeners de mouse
     */
    setupMouse() {
        if (!this.canvas) return;
        
        // Mouse move
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.enabled) return;
            
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            
            // Calcular posição no mundo (considerando câmera)
            if (this.camera) {
                this.mouse.worldX = this.mouse.x + this.camera.x;
                this.mouse.worldY = this.mouse.y + this.camera.y;
            } else {
                this.mouse.worldX = this.mouse.x;
                this.mouse.worldY = this.mouse.y;
            }
            
            this.triggerCallbacks('mouseMove', this.mouse, e);
        });
        
        // Mouse down
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.enabled) return;
            
            this.mouse.down = true;
            
            if (e.button === 0) {
                this.mouse.clicked = true;
                this.triggerCallbacks('mouseDown', { ...this.mouse, button: 'left' }, e);
            } else if (e.button === 2) {
                this.mouse.rightClicked = true;
                this.triggerCallbacks('mouseDown', { ...this.mouse, button: 'right' }, e);
            }
        });
        
        // Mouse up
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            this.triggerCallbacks('mouseUp', this.mouse, e);
        });
        
        // Click (pressionar e soltar)
        this.canvas.addEventListener('click', (e) => {
            if (!this.enabled) return;
            
            this.triggerCallbacks('mouseClick', {
                ...this.mouse,
                button: e.button === 0 ? 'left' : 'right'
            }, e);
        });
        
        // Prevenir menu de contexto no canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    /**
     * Registra um callback para um evento
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }
    
    /**
     * Remove um callback
     */
    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * Dispara callbacks registrados
     */
    triggerCallbacks(event, data, originalEvent) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => {
                try {
                    callback(data, originalEvent);
                } catch (error) {
                    console.error(`Erro no callback de ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Verifica se uma tecla está pressionada
     */
    isKeyDown(key) {
        return !!this.keys[key.toLowerCase()];
    }
    
    /**
     * Verifica se uma ação está ativa (qualquer das teclas mapeadas)
     */
    isActionActive(action) {
        const keys = this.keyBindings[action];
        if (!keys) return false;
        
        return keys.some(key => this.isKeyDown(key));
    }
    
    /**
     * Verifica se uma ação foi pressionada (único pressionamento)
     */
    isActionPressed(action) {
        const keys = this.keyBindings[action];
        if (!keys) return false;
        
        return keys.some(key => {
            const pressed = this.keysPressed[key];
            // Reset após detectar
            if (pressed) {
                this.keysPressed[key] = false;
            }
            return pressed;
        });
    }
    
    /**
     * Obtém input de movimento normalizado
     */
    getMovementInput() {
        let dx = 0;
        let dy = 0;
        
        if (this.isActionActive('moveUp')) dy = -1;
        if (this.isActionActive('moveDown')) dy = 1;
        if (this.isActionActive('moveLeft')) dx = -1;
        if (this.isActionActive('moveRight')) dx = 1;
        
        // Normalizar diagonal
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }
        
        return { x: dx, y: dy };
    }
    
    /**
     * Obtém posição do mouse no mundo
     */
    getMouseWorldPosition() {
        return {
            x: this.mouse.worldX,
            y: this.mouse.worldY
        };
    }
    
    /**
     * Verifica se o mouse foi clicado neste frame
     */
    isMouseClicked() {
        const clicked = this.mouse.clicked;
        this.mouse.clicked = false;
        return clicked;
    }
    
    /**
     * Habilita/desabilita input
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Atualiza estado (chamado a cada frame)
     */
    update() {
        // Resetar flags de um frame
        this.mouse.clicked = false;
        this.mouse.rightClicked = false;
    }
    
    /**
     * Limpa todos os estados
     */
    clear() {
        this.keys = {};
        this.keysPressed = {};
        this.mouse.clicked = false;
        this.mouse.rightClicked = false;
        this.mouse.down = false;
    }
    
    /**
     * Altera binding de uma ação
     */
    setKeyBinding(action, keys) {
        this.keyBindings[action] = Array.isArray(keys) ? keys : [keys];
    }
    
    /**
     * Obtém bindings atuais
     */
    getKeyBindings() {
        return { ...this.keyBindings };
    }
}

// Singleton para uso global
window.InputManager = InputManager;
window.inputManager = null;

export default InputManager;
