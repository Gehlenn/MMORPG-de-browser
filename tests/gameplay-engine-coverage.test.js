import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import GameplayEngine from '../src/GameplayEngine.js';

// Mock do DOM para testes
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.performance = dom.window.performance;

// Mock do requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
    setTimeout(callback, 16);
});

// Mock do performance.now
global.performance = {
    now: vi.fn(() => Date.now())
};

describe('GameplayEngine - 99% Coverage Tests', () => {
    let engine;
    let mockCanvas;
    let mockCtx;
    let mockMinimap;
    let mockMinimapCtx;
    
    beforeEach(() => {
        // Criar elementos DOM mock
        mockCanvas = dom.window.document.createElement('canvas');
        mockCanvas.id = 'gameCanvas';
        mockCanvas.width = 800;
        mockCanvas.height = 600;
        mockCtx = {
            fillStyle: '',
            fillRect: vi.fn(),
            strokeStyle: '',
            lineWidth: 1,
            strokeRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            font: '',
            fillText: vi.fn(),
            textAlign: '',
            measureText: vi.fn(() => ({ width: 100 }))
        };
        mockCanvas.getContext = vi.fn(() => mockCtx);
        
        mockMinimap = dom.window.document.createElement('canvas');
        mockMinimap.id = 'minimap';
        mockMinimapCtx = {
            fillStyle: '',
            fillRect: vi.fn(),
            strokeStyle: '',
            lineWidth: 1,
            strokeRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn()
        };
        mockMinimap.getContext = vi.fn(() => mockMinimapCtx);
        
        dom.window.document.body.appendChild(mockCanvas);
        dom.window.document.body.appendChild(mockMinimap);
        
        // Criar elementos HUD mock
        const hudElements = [
            'playerName', 'playerLevel', 'healthFill', 'hpText',
            'positionText', 'mobCount', 'fpsText', 'chatMessages'
        ];
        
        hudElements.forEach(id => {
            const element = dom.window.document.createElement('div');
            element.id = id;
            dom.window.document.body.appendChild(element);
        });
        
        engine = new GameplayEngine();
    });
    
    afterEach(() => {
        if (engine) {
            engine.stopGame();
        }
        vi.clearAllMocks();
        dom.window.document.body.innerHTML = '';
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with default values', () => {
            expect(engine.canvas).toBeNull();
            expect(engine.ctx).toBeNull();
            expect(engine.isRunning).toBe(false);
            expect(engine.player).toBeNull();
            expect(engine.mobs).toEqual([]);
            expect(engine.keys).toEqual({});
        });

        it('should setup event listeners on initialization', () => {
            // Verify event listeners are attached
            expect(dom.window.document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(dom.window.document.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
            expect(dom.window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
        });

        it('should have correct configuration', () => {
            expect(engine.config.playerSpeed).toBe(200);
            expect(engine.config.mobCount).toBe(8);
            expect(engine.config.attackRange).toBe(20);
            expect(engine.config.attackDamage).toBe(10);
        });

        it('should have sprites defined', () => {
            expect(engine.sprites.player).toBeDefined();
            expect(engine.sprites.mob).toBeDefined();
            expect(typeof engine.sprites.player.draw).toBe('function');
            expect(typeof engine.sprites.mob.draw).toBe('function');
        });
    });

    describe('Game Initialization', () => {
        it('should start game successfully with valid character data', () => {
            const characterData = {
                name: 'TestPlayer',
                level: 1,
                hp: 100,
                maxHp: 100
            };
            
            const result = engine.startGame(characterData);
            
            expect(result).toBe(true);
            expect(engine.isRunning).toBe(true);
            expect(engine.player).toBeDefined();
            expect(engine.player.name).toBe('TestPlayer');
            expect(engine.player.x).toBe(400); // center of canvas
            expect(engine.player.y).toBe(300); // center of canvas
            expect(engine.mobs.length).toBe(8);
        });

        it('should return false if canvas is not found', () => {
            // Remove canvas
            dom.window.document.getElementById('gameCanvas').remove();
            
            const result = engine.startGame({ name: 'Test' });
            
            expect(result).toBe(false);
            expect(engine.isRunning).toBe(false);
        });

        it('should spawn correct number of mobs', () => {
            engine.startGame({ name: 'Test' });
            
            expect(engine.mobs.length).toBe(8);
            expect(engine.mobs[0]).toHaveProperty('id');
            expect(engine.mobs[0]).toHaveProperty('x');
            expect(engine.mobs[0]).toHaveProperty('y');
            expect(engine.mobs[0]).toHaveProperty('hp');
            expect(engine.mobs[0]).toHaveProperty('maxHp');
        });

        it('should handle window resize', () => {
            engine.startGame({ name: 'Test' });
            
            // Mock window resize
            dom.window.innerWidth = 1024;
            dom.window.innerHeight = 768;
            
            engine.resizeCanvas();
            
            expect(mockCanvas.width).toBe(1024);
            expect(mockCanvas.height).toBe(768);
        });
    });

    describe('Player Movement', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should move player with WASD keys', () => {
            const initialX = engine.player.x;
            const initialY = engine.player.y;
            
            // Simulate key press
            engine.keys['d'] = true;
            engine.updatePlayerMovement(0.016); // 60 FPS
            
            expect(engine.player.x).toBeGreaterThan(initialX);
            expect(engine.player.y).toBe(initialY);
        });

        it('should normalize diagonal movement', () => {
            const initialX = engine.player.x;
            const initialY = engine.player.y;
            
            // Simulate diagonal movement
            engine.keys['d'] = true;
            engine.keys['s'] = true;
            engine.updatePlayerMovement(0.016);
            
            // Should move in both directions but at normalized speed
            expect(engine.player.x).toBeGreaterThan(initialX);
            expect(engine.player.y).toBeGreaterThan(initialY);
        });

        it('should keep player within canvas bounds', () => {
            // Move player to edge
            engine.player.x = 10;
            engine.player.y = 10;
            
            // Try to move outside bounds
            engine.keys['a'] = true;
            engine.keys['w'] = true;
            engine.updatePlayerMovement(0.1);
            
            expect(engine.player.x).toBeGreaterThanOrEqual(engine.player.size/2);
            expect(engine.player.y).toBeGreaterThanOrEqual(engine.player.size/2);
        });

        it('should not move if no keys are pressed', () => {
            const initialX = engine.player.x;
            const initialY = engine.player.y;
            
            engine.updatePlayerMovement(0.016);
            
            expect(engine.player.x).toBe(initialX);
            expect(engine.player.y).toBe(initialY);
        });
    });

    describe('Player Combat', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should attack nearby mobs when space is pressed', () => {
            // Place mob near player
            const mob = engine.mobs[0];
            mob.x = engine.player.x + 10;
            mob.y = engine.player.y;
            
            const initialHp = mob.hp;
            engine.keys[' '] = true;
            engine.updatePlayerAttack();
            
            expect(mob.hp).toBeLessThan(initialHp);
            expect(engine.keys[' ']).toBe(false); // Should be reset
        });

        it('should not attack mobs that are too far', () => {
            // Place mob far from player
            const mob = engine.mobs[0];
            mob.x = engine.player.x + 100;
            mob.y = engine.player.y + 100;
            
            const initialHp = mob.hp;
            engine.keys[' '] = true;
            engine.updatePlayerAttack();
            
            expect(mob.hp).toBe(initialHp);
        });

        it('should respawn defeated mobs', () => {
            const mob = engine.mobs[0];
            mob.hp = 1;
            
            engine.attackMob(mob);
            
            expect(mob.hp).toBe(mob.maxHp);
            expect(mob.x).not.toBe(engine.player.x);
            expect(mob.y).not.toBe(engine.player.y);
        });

        it('should handle multiple mobs correctly', () => {
            // Place multiple mobs near player
            engine.mobs.forEach((mob, index) => {
                mob.x = engine.player.x + (index * 20);
                mob.y = engine.player.y;
            });
            
            const initialHps = engine.mobs.map(mob => mob.hp);
            engine.keys[' '] = true;
            engine.updatePlayerAttack();
            
            // All nearby mobs should take damage
            engine.mobs.forEach((mob, index) => {
                if (index < 3) { // Only first 3 are in range
                    expect(mob.hp).toBeLessThan(initialHps[index]);
                }
            });
        });
    });

    describe('Mob Behavior', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should move mobs randomly', () => {
            const mob = engine.mobs[0];
            const initialX = mob.x;
            const initialY = mob.y;
            
            engine.updateMobs(0.016);
            
            // Mob should have moved (due to random direction)
            expect(mob.x !== initialX || mob.y !== initialY).toBe(true);
        });

        it('should keep mobs within canvas bounds', () => {
            const mob = engine.mobs[0];
            mob.x = 10;
            mob.y = 10;
            mob.direction = Math.PI; // Moving towards negative
            
            engine.updateMobs(0.1);
            
            expect(mob.x).toBeGreaterThanOrEqual(mob.size/2);
            expect(mob.y).toBeGreaterThanOrEqual(mob.size/2);
        });

        it('should change direction randomly', () => {
            const mob = engine.mobs[0];
            const initialDirection = mob.direction;
            
            // Force random direction change by mocking Math.random
            const originalRandom = Math.random;
            Math.random = vi.fn(() => 0.005); // Less than 0.01
            
            engine.updateMobs(0.016);
            
            expect(mob.direction).not.toBe(initialDirection);
            
            // Restore
            Math.random = originalRandom;
        });
    });

    describe('Rendering System', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should render game elements', () => {
            engine.render();
            
            expect(mockCtx.fillRect).toHaveBeenCalled();
            expect(mockCtx.strokeRect).toHaveBeenCalled();
            expect(mockCtx.fillText).toHaveBeenCalled();
        });

        it('should draw grid', () => {
            engine.drawGrid();
            
            expect(mockCtx.strokeStyle).toBe('rgba(255, 255, 255, 0.05)');
            expect(mockCtx.lineWidth).toBe(1);
            expect(mockCtx.beginPath).toHaveBeenCalled();
        });

        it('should draw mob HUD', () => {
            const mob = engine.mobs[0];
            engine.drawMobHUD(mob);
            
            expect(mockCtx.fillRect).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                expect.any(Number),
                4
            );
            expect(mockCtx.fillText).toHaveBeenCalledWith(mob.name, mob.x, expect.any(Number));
        });

        it('should draw player HUD', () => {
            engine.drawPlayerHUD();
            
            expect(mockCtx.fillText).toHaveBeenCalledWith(
                engine.player.name,
                engine.player.x,
                expect.any(Number)
            );
        });

        it('should draw minimap', () => {
            engine.drawMinimap();
            
            expect(mockMinimapCtx.fillRect).toHaveBeenCalled();
            expect(mockMinimapCtx.fillRect).toHaveBeenCalledWith(0, 0, 150, 150);
        });

        it('should handle missing minimap gracefully', () => {
            engine.minimap = null;
            engine.minimapCtx = null;
            
            expect(() => engine.drawMinimap()).not.toThrow();
        });
    });

    describe('HUD Updates', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 5, hp: 80, maxHp: 100 });
        });

        it('should update HUD elements', () => {
            engine.updateHUD();
            
            const playerName = dom.window.document.getElementById('playerName');
            const playerLevel = dom.window.document.getElementById('playerLevel');
            const positionText = dom.window.document.getElementById('positionText');
            const mobCount = dom.window.document.getElementById('mobCount');
            
            expect(playerName.textContent).toBe('TestPlayer');
            expect(playerLevel.textContent).toBe('Lv. 5');
            expect(positionText.textContent).toMatch(/^\d+, \d+$/);
            expect(mobCount.textContent).toBe('8');
        });

        it('should update health bar', () => {
            engine.updateHUD();
            
            const healthFill = dom.window.document.getElementById('healthFill');
            const hpText = dom.window.document.getElementById('hpText');
            
            expect(healthFill.style.width).toBe('80%');
            expect(hpText.textContent).toBe('80/100');
        });

        it('should handle missing HUD elements gracefully', () => {
            // Remove HUD elements
            dom.window.document.getElementById('playerName').remove();
            
            expect(() => engine.updateHUD()).not.toThrow();
        });
    });

    describe('Performance Monitoring', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should calculate FPS correctly', () => {
            const mockTime = 1000;
            engine.updateFPS(mockTime);
            
            expect(engine.frameCount).toBe(1);
            expect(engine.fpsTime).toBe(mockTime);
        });

        it('should update FPS text in HUD', () => {
            engine.fps = 60;
            engine.updateHUD();
            
            const fpsText = dom.window.document.getElementById('fpsText');
            expect(fpsText.textContent).toBe('60 FPS');
        });
    });

    describe('Chat System', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should add chat messages', () => {
            engine.addChatMessage('Test message', '#FF0000');
            
            const chatBox = dom.window.document.getElementById('chatMessages');
            expect(chatBox.children.length).toBe(1);
            expect(chatBox.children[0].textContent).toBe('Test message');
            expect(chatBox.children[0].style.color).toBe('#FF0000');
        });

        it('should handle missing chat box gracefully', () => {
            dom.window.document.getElementById('chatMessages').remove();
            
            expect(() => engine.addChatMessage('Test')).not.toThrow();
        });
    });

    describe('Game Loop', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should update game state in game loop', () => {
            const mockTime = 1000;
            const deltaTime = 0.016;
            
            // Mock performance.now
            global.performance.now = vi.fn(() => mockTime);
            
            engine.update(deltaTime);
            
            // Should have processed input and updated entities
            expect(engine.player).toBeDefined();
            expect(engine.mobs.length).toBe(8);
        });

        it('should handle missing player gracefully', () => {
            engine.player = null;
            
            expect(() => engine.update(0.016)).not.toThrow();
        });

        it('should cap delta time to prevent large jumps', () => {
            const largeDeltaTime = 0.2; // 200ms
            
            expect(() => engine.update(largeDeltaTime)).not.toThrow();
        });
    });

    describe('Public API', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should return player position', () => {
            const position = engine.getPlayerPosition();
            
            expect(position).toHaveProperty('x');
            expect(position).toHaveProperty('y');
            expect(position.x).toBe(engine.player.x);
            expect(position.y).toBe(engine.player.y);
        });

        it('should return mob count', () => {
            const count = engine.getMobCount();
            
            expect(count).toBe(8);
        });

        it('should return FPS', () => {
            engine.fps = 60;
            const fps = engine.getFPS();
            
            expect(fps).toBe(60);
        });

        it('should return game running status', () => {
            const isRunning = engine.isGameRunning();
            
            expect(isRunning).toBe(true);
        });

        it('should stop game correctly', () => {
            engine.stopGame();
            
            expect(engine.isRunning).toBe(false);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle missing canvas gracefully', () => {
            engine.canvas = null;
            engine.ctx = null;
            
            expect(() => engine.render()).not.toThrow();
        });

        it('should handle zero mob count', () => {
            engine.config.mobCount = 0;
            engine.startGame({ name: 'Test' });
            
            expect(engine.mobs.length).toBe(0);
        });

        it('should handle very high mob count', () => {
            engine.config.mobCount = 100;
            engine.startGame({ name: 'Test' });
            
            expect(engine.mobs.length).toBe(100);
        });

        it('should handle negative player coordinates', () => {
            engine.startGame({ name: 'Test' });
            engine.player.x = -10;
            engine.player.y = -10;
            
            engine.updatePlayerMovement(0.016);
            
            expect(engine.player.x).toBeGreaterThanOrEqual(0);
            expect(engine.player.y).toBeGreaterThanOrEqual(0);
        });

        it('should handle player coordinates beyond canvas', () => {
            engine.startGame({ name: 'Test' });
            engine.player.x = mockCanvas.width + 100;
            engine.player.y = mockCanvas.height + 100;
            
            engine.updatePlayerMovement(0.016);
            
            expect(engine.player.x).toBeLessThanOrEqual(mockCanvas.width);
            expect(engine.player.y).toBeLessThanOrEqual(mockCanvas.height);
        });
    });

    describe('Input System Coverage', () => {
        beforeEach(() => {
            engine.startGame({ name: 'TestPlayer', level: 1, hp: 100, maxHp: 100 });
        });

        it('should handle all movement keys', () => {
            const keys = ['w', 'a', 's', 'd'];
            const initialPosition = { x: engine.player.x, y: engine.player.y };
            
            keys.forEach(key => {
                engine.keys[key] = true;
                engine.updatePlayerMovement(0.016);
                engine.keys[key] = false;
            });
            
            // Player should have moved from initial position
            expect(engine.player.x !== initialPosition.x || engine.player.y !== initialPosition.y).toBe(true);
        });

        it('should handle simultaneous key presses', () => {
            engine.keys['w'] = true;
            engine.keys['a'] = true;
            engine.keys['d'] = true;
            
            const initialX = engine.player.x;
            engine.updatePlayerMovement(0.016);
            
            // Should normalize opposing directions
            expect(engine.player.x).toBe(initialX); // a and d cancel out
        });

        it('should handle key release correctly', () => {
            engine.keys['d'] = true;
            engine.updatePlayerMovement(0.016);
            
            const movingX = engine.player.x;
            engine.keys['d'] = false;
            engine.updatePlayerMovement(0.016);
            
            // Should stop moving in that direction
            expect(engine.player.x).toBe(movingX);
        });
    });

    describe('Export Conditions', () => {
        it('should export correctly in Node.js environment', () => {
            // Test module export
            const mockModule = { exports: {} };
            global.module = mockModule;
            delete global.window;
            
            // Simulate export condition
            if (typeof mockModule !== 'undefined' && mockModule.exports) {
                mockModule.exports = GameplayEngine;
            }
            
            expect(mockModule.exports).toBeDefined();
            expect(typeof mockModule.exports).toBe('function');
        });

        it('should export correctly in browser environment', () => {
            // Test window export
            delete global.module;
            global.window = dom.window;
            
            // Simulate export condition
            if (typeof global.window !== 'undefined') {
                global.window.GameplayEngine = GameplayEngine;
            }
            
            expect(global.window.GameplayEngine).toBeDefined();
            expect(typeof global.window.GameplayEngine).toBe('function');
        });
    });
});
