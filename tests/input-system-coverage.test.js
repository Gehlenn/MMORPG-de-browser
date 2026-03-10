import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock do DOM para testes
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('Input System Critical Coverage', () => {
  let loginManager;
  let mockEvent;
  
  beforeEach(() => {
    localStorage.clear();
    
    document.body.innerHTML = `
      <input id="chatInput" />
      <button id="chatSend" />
      <div id="chatMessages"></div>
    `;
    
    const { SimpleLoginManager } = require('../client/index.html');
    loginManager = new SimpleLoginManager();
    
    mockEvent = {
      key: '',
      keyCode: 0,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    };
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Keyboard Input Handling', () => {
    it('should handle WASD movement keys correctly', () => {
      const keys = {};
      
      // Test each movement key
      const movementKeys = ['w', 'a', 's', 'd'];
      
      movementKeys.forEach(key => {
        mockEvent.key = key;
        
        // Act
        loginManager.handleKeyDown(mockEvent, keys);
        
        // Assert
        expect(keys[key]).toBe(true);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });
    });

    it('should handle space bar for attack', () => {
      const keys = {};
      mockEvent.key = ' ';
      
      // Act
      loginManager.handleKeyDown(mockEvent, keys);
      
      // Assert
      expect(keys[' ']).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle Enter key for chat focus', () => {
      const chatInput = document.getElementById('chatInput');
      mockEvent.key = 'Enter';
      
      // Act
      loginManager.handleKeyDown(mockEvent, {});
      
      // Assert
      expect(document.activeElement).toBe(chatInput);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle key up events correctly', () => {
      const keys = { w: true, a: true, s: true, d: true };
      
      // Test releasing keys
      const movementKeys = ['w', 'a', 's', 'd'];
      
      movementKeys.forEach(key => {
        mockEvent.key = key;
        
        // Act
        loginManager.handleKeyUp(mockEvent, keys);
        
        // Assert
        expect(keys[key]).toBe(false);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });
    });

    it('should ignore non-game keys', () => {
      const keys = {};
      const nonGameKeys = ['Shift', 'Control', 'Alt', 'Tab', 'Escape'];
      
      nonGameKeys.forEach(key => {
        mockEvent.key = key;
        
        // Act
        loginManager.handleKeyDown(mockEvent, keys);
        
        // Assert
        expect(keys[key]).toBeUndefined();
        expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should handle numeric keys for skill activation', () => {
      const keys = {};
      const skillKeys = ['1', '2', '3', '4', '5'];
      
      skillKeys.forEach(key => {
        mockEvent.key = key;
        
        // Act
        loginManager.handleKeyDown(mockEvent, keys);
        
        // Assert
        expect(keys[key]).toBe(true);
      });
    });

    it('should handle modifier keys correctly', () => {
      const keys = {};
      mockEvent.key = 'w';
      mockEvent.shiftKey = true;
      
      // Act
      loginManager.handleKeyDown(mockEvent, keys);
      
      // Assert
      expect(keys['w']).toBe(true);
      expect(keys['shift']).toBe(true);
    });
  });

  describe('Mouse Input Handling', () => {
    it('should handle mouse click for interactions', () => {
      const mockMouseEvent = {
        clientX: 400,
        clientY: 300,
        button: 0, // Left click
        preventDefault: vi.fn(),
        target: document.createElement('div')
      };
      
      // Act
      const result = loginManager.handleMouseClick(mockMouseEvent);
      
      // Assert
      expect(typeof result).toBe('object');
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });

    it('should handle right click differently', () => {
      const mockMouseEvent = {
        clientX: 400,
        clientY: 300,
        button: 2, // Right click
        preventDefault: vi.fn()
      };
      
      // Act
      const result = loginManager.handleMouseClick(mockMouseEvent);
      
      // Assert
      expect(result.isRightClick).toBe(true);
    });

    it('should handle mouse movement for camera', () => {
      const mockMouseEvent = {
        clientX: 500,
        clientY: 350,
        movementX: 10,
        movementY: 5
      };
      
      // Act
      const result = loginManager.handleMouseMove(mockMouseEvent);
      
      // Assert
      expect(result.movementX).toBe(10);
      expect(result.movementY).toBe(5);
    });

    it('should handle mouse wheel for zoom', () => {
      const mockWheelEvent = {
        deltaY: -10, // Scroll up (zoom in)
        preventDefault: vi.fn()
      };
      
      // Act
      const result = loginManager.handleMouseWheel(mockWheelEvent);
      
      // Assert
      expect(result.zoomDelta).toBe(-10);
      expect(mockWheelEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Touch Input Handling', () => {
    it('should handle touch start for mobile', () => {
      const mockTouchEvent = {
        touches: [{
          clientX: 200,
          clientY: 150
        }],
        preventDefault: vi.fn()
      };
      
      // Act
      const result = loginManager.handleTouchStart(mockTouchEvent);
      
      // Assert
      expect(result.x).toBe(200);
      expect(result.y).toBe(150);
      expect(mockTouchEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle touch movement', () => {
      const mockTouchEvent = {
        touches: [{
          clientX: 250,
          clientY: 200
        }]
      };
      
      // Act
      const result = loginManager.handleTouchMove(mockTouchEvent);
      
      // Assert
      expect(result.x).toBe(250);
      expect(result.y).toBe(200);
    });

    it('should handle multi-touch gestures', () => {
      const mockTouchEvent = {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 300, clientY: 300 }
        ],
        preventDefault: vi.fn()
      };
      
      // Act
      const result = loginManager.handleTouchStart(mockTouchEvent);
      
      // Assert
      expect(result.isMultiTouch).toBe(true);
      expect(result.touches.length).toBe(2);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should prevent default browser behavior for game keys', () => {
      const gameKeys = ['w', 'a', 's', 'd', ' ', 'Enter'];
      
      gameKeys.forEach(key => {
        mockEvent.key = key;
        mockEvent.preventDefault.mockClear();
        
        // Act
        loginManager.handleKeyDown(mockEvent, {});
        
        // Assert
        expect(mockEvent.preventDefault).toHaveBeenCalled();
      });
    });

    it('should sanitize chat input', () => {
      const chatInput = document.getElementById('chatInput');
      const maliciousInput = '<script>alert("xss")</script>';
      
      // Act
      loginManager.sanitizeChatInput(chatInput, maliciousInput);
      
      // Assert
      expect(chatInput.value).not.toContain('<script>');
      expect(chatInput.value).toBe('alert("xss")');
    });

    it('should validate key codes', () => {
      const validKeyCodes = {
        'w': 87,
        'a': 65,
        's': 83,
        'd': 68,
        ' ': 32,
        'Enter': 13
      };
      
      Object.entries(validKeyCodes).forEach(([key, code]) => {
        mockEvent.key = key;
        mockEvent.keyCode = code;
        
        // Act
        const isValid = loginManager.validateKey(mockEvent);
        
        // Assert
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid key combinations', () => {
      const invalidCombinations = [
        { key: 'Ctrl+w', ctrlKey: true },
        { key: 'Alt+F4', altKey: true },
        { key: 'F5', keyCode: 116 }
      ];
      
      invalidCombinations.forEach(combo => {
        Object.assign(mockEvent, combo);
        
        // Act
        const isValid = loginManager.validateKey(mockEvent);
        
        // Assert
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Input State Management', () => {
    it('should maintain input state correctly', () => {
      const inputState = loginManager.createInputState();
      
      // Act - Simulate key presses
      loginManager.handleKeyDown({ key: 'w', preventDefault: vi.fn() }, inputState.keys);
      loginManager.handleKeyDown({ key: 'd', preventDefault: vi.fn() }, inputState.keys);
      
      // Assert
      expect(inputState.keys.w).toBe(true);
      expect(inputState.keys.d).toBe(true);
      expect(inputState.keys.a).toBe(false);
      expect(inputState.keys.s).toBe(false);
    });

    it('should reset input state', () => {
      const inputState = {
        keys: { w: true, a: true, s: true, d: true },
        mouse: { x: 100, y: 200 },
        touch: { active: false }
      };
      
      // Act
      loginManager.resetInputState(inputState);
      
      // Assert
      expect(Object.values(inputState.keys).every(v => v === false)).toBe(true);
      expect(inputState.mouse.x).toBe(0);
      expect(inputState.mouse.y).toBe(0);
      expect(inputState.touch.active).toBe(false);
    });

    it('should handle input conflicts', () => {
      const inputState = loginManager.createInputState();
      
      // Simulate conflicting inputs
      loginManager.handleKeyDown({ key: 'w', preventDefault: vi.fn() }, inputState.keys);
      loginManager.handleKeyDown({ key: 's', preventDefault: vi.fn() }, inputState.keys);
      
      // Act
      const movement = loginManager.resolveInputConflicts(inputState);
      
      // Assert
      expect(movement.y).toBe(0); // W+S should cancel out
    });

    it('should track input timing', () => {
      const inputState = loginManager.createInputState();
      const mockTime = Date.now();
      
      // Act
      loginManager.recordInputTiming(inputState, 'w', mockTime);
      
      // Assert
      expect(inputState.timing['w']).toBe(mockTime);
    });
  });

  describe('Input Performance Optimization', () => {
    it('should debounce rapid key presses', () => {
      const mockCallback = vi.fn();
      const debouncedFn = loginManager.debounceInput(mockCallback, 100);
      
      // Act - Rapid calls
      debouncedFn('w');
      debouncedFn('w');
      debouncedFn('w');
      
      // Assert
      expect(mockCallback).not.toHaveBeenCalled();
      
      // Wait for debounce
      vi.advanceTimersByTime(100);
      
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('w');
    });

    it('should throttle mouse movement', () => {
      const mockCallback = vi.fn();
      const throttledFn = loginManager.throttleMouseMovement(mockCallback, 16);
      
      // Act - Rapid calls
      throttledFn({ x: 100, y: 100 });
      throttledFn({ x: 110, y: 110 });
      throttledFn({ x: 120, y: 120 });
      
      // Assert
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should batch input events', () => {
      const events = [
        { type: 'keydown', key: 'w' },
        { type: 'keydown', key: 'd' },
        { type: 'mousedown', x: 100, y: 100 }
      ];
      
      // Act
      const batched = loginManager.batchInputEvents(events);
      
      // Assert
      expect(batched.length).toBe(3);
      expect(batched[0].timestamp).toBeDefined();
    });
  });

  describe('Accessibility Support', () => {
    it('should handle keyboard navigation', () => {
      const navigationKeys = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      
      navigationKeys.forEach(key => {
        mockEvent.key = key;
        
        // Act
        const handled = loginManager.handleAccessibilityInput(mockEvent);
        
        // Assert
        expect(typeof handled).toBe('boolean');
      });
    });

    it('should support screen reader announcements', () => {
      const mockAnnounce = vi.fn();
      global.announceToScreenReader = mockAnnounce;
      
      // Act
      loginManager.announceToScreenReader('Player moved north');
      
      // Assert
      expect(mockAnnounce).toHaveBeenCalledWith('Player moved north');
    });

    it('should handle focus management', () => {
      const element = document.createElement('button');
      
      // Act
      loginManager.manageFocus(element);
      
      // Assert
      expect(document.activeElement).toBe(element);
    });
  });

  describe('Error Handling in Input System', () => {
    it('should handle missing event properties', () => {
      const invalidEvent = {};
      
      // Act & Assert
      expect(() => {
        loginManager.handleKeyDown(invalidEvent, {});
      }).not.toThrow();
    });

    it('should handle null input state', () => {
      // Act & Assert
      expect(() => {
        loginManager.resetInputState(null);
      }).not.toThrow();
    });

    it('should handle corrupted touch events', () => {
      const corruptedTouchEvent = {
        touches: null,
        preventDefault: vi.fn()
      };
      
      // Act & Assert
      expect(() => {
        loginManager.handleTouchStart(corruptedTouchEvent);
      }).not.toThrow();
    });
  });
});
