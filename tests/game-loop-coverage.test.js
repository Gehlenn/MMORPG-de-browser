import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock do DOM para testes
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('Game Loop Critical Coverage', () => {
  let loginManager;
  let mockCanvas;
  let mockContext;
  
  beforeEach(() => {
    localStorage.clear();
    
    document.body.innerHTML = `
      <canvas id="gameCanvas"></canvas>
      <canvas id="minimap"></canvas>
      <div id="chatMessages"></div>
      <input id="chatInput" />
      <button id="chatSend"></button>
      <div id="playerName"></div>
      <div id="playerLevel"></div>
      <div id="healthFill"></div>
      <div id="hpText"></div>
      <div id="positionText"></div>
      <div id="mobCount"></div>
      <div id="fpsText"></div>
    `;
    
    // Mock canvas e context
    mockCanvas = document.getElementById('gameCanvas');
    mockContext = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      font: '',
      textAlign: '',
      lineWidth: 1
    };
    
    mockCanvas.getContext = () => mockContext;
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    
    const { SimpleLoginManager } = require('../client/index.html');
    loginManager = new SimpleLoginManager();
    loginManager.currentCharacter = {
      id: '1',
      name: 'TestChar',
      level: 1,
      hp: 100,
      maxHp: 100,
      x: 400,
      y: 300,
      race: 'Elfo'
    };
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Canvas Rendering System', () => {
    it('should render game background correctly', () => {
      // Act
      loginManager.renderBackground(mockContext, 800, 600);
      
      // Assert
      expect(mockContext.fillStyle).toBe('#1a1a2e');
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    });

    it('should render grid system with proper spacing', () => {
      // Act
      loginManager.renderGrid(mockContext, 800, 600, 50);
      
      // Assert
      expect(mockContext.strokeStyle).toBe('rgba(255, 255, 255, 0.05)');
      expect(mockContext.lineWidth).toBe(1);
      expect(mockContext.beginPath).toHaveBeenCalled();
      // Verificar se linhas verticais foram desenhadas
      expect(mockContext.moveTo).toHaveBeenCalledWith(0, 0);
      expect(mockContext.lineTo).toHaveBeenCalledWith(0, 600);
    });

    it('should render player sprite with correct dimensions', () => {
      // Act
      loginManager.renderPlayer(mockContext, 400, 300, 32, 'TestChar');
      
      // Assert
      expect(mockContext.fillStyle).toBe('#4CAF50');
      expect(mockContext.fillRect).toHaveBeenCalledWith(384, 284, 32, 32);
      expect(mockContext.strokeStyle).toBe('#2E7D32');
      expect(mockContext.strokeRect).toHaveBeenCalledWith(384, 284, 32, 32);
      expect(mockContext.fillText).toHaveBeenCalledWith('TestChar', 400, 279);
    });

    it('should render mob with HP bar', () => {
      const mob = {
        x: 200,
        y: 200,
        size: 32,
        color: '#FF6B6B',
        name: 'Goblin',
        hp: 30,
        maxHp: 50
      };
      
      // Act
      loginManager.renderMob(mockContext, mob);
      
      // Assert
      expect(mockContext.fillStyle).toBe('#FF6B6B');
      expect(mockContext.fillRect).toHaveBeenCalledWith(184, 184, 32, 32);
      expect(mockContext.fillStyle).toBe('#FF0000');
      expect(mockContext.fillRect).toHaveBeenCalledWith(184, 169, 32, 4);
      expect(mockContext.fillStyle).toBe('#00FF00');
      expect(mockContext.fillRect).toHaveBeenCalledWith(184, 169, 19.2, 4); // 30/50 * 32
    });

    it('should render minimap with correct scale', () => {
      const minimapCanvas = document.getElementById('minimap');
      const minimapCtx = {
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0.5
      };
      minimapCanvas.getContext = () => minimapCtx;
      minimapCanvas.width = 150;
      minimapCanvas.height = 150;
      
      const mobs = [{ x: 400, y: 300 }];
      const player = { x: 200, y: 150 };
      
      // Act
      loginManager.renderMinimap(minimapapCtx, minimapCanvas, mobs, player, 800, 600);
      
      // Assert
      expect(minimapCtx.fillStyle).toBe('#0a0a0a');
      expect(minimapCtx.fillRect).toHaveBeenCalledWith(0, 0, 150, 150);
      expect(minimapCtx.fillStyle).toBe('#4CAF50');
      expect(minimapCtx.fillRect).toHaveBeenCalledWith(37.5, 37.5, 4, 4); // 200 * 0.1875
    });
  });

  describe('Player Movement System', () => {
    it('should calculate normalized diagonal movement', () => {
      const keys = { w: true, d: true };
      const deltaTime = 0.016; // 60 FPS
      const playerSpeed = 200;
      
      // Act
      const movement = loginManager.calculateMovement(keys, deltaTime, playerSpeed);
      
      // Assert
      const expectedMagnitude = Math.sqrt(2); // diagonal
      expect(movement.x).toBeCloseTo(0.707 * 200 * 0.016, 3);
      expect(movement.y).toBeCloseTo(-0.707 * 200 * 0.016, 3);
    });

    it('should handle single axis movement correctly', () => {
      const keys = { w: true };
      const deltaTime = 0.016;
      const playerSpeed = 200;
      
      // Act
      const movement = loginManager.calculateMovement(keys, deltaTime, playerSpeed);
      
      // Assert
      expect(movement.x).toBe(0);
      expect(movement.y).toBe(-200 * 0.016);
    });

    it('should clamp player position within canvas bounds', () => {
      const playerSize = 32;
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      // Test boundary conditions
      expect(loginManager.clampPosition(-10, 300, playerSize, canvasWidth, canvasHeight).x).toBe(16);
      expect(loginManager.clampPosition(810, 300, playerSize, canvasWidth, canvasHeight).x).toBe(784);
      expect(loginManager.clampPosition(400, -10, playerSize, canvasWidth, canvasHeight).y).toBe(16);
      expect(loginManager.clampPosition(400, 610, playerSize, canvasWidth, canvasHeight).y).toBe(584);
    });

    it('should update position text in HUD', () => {
      const positionText = document.getElementById('positionText');
      
      // Act
      loginManager.updatePosition(123.45, 456.78);
      
      // Assert
      expect(positionText.textContent).toBe('123, 457');
    });
  });

  describe('Combat System', () => {
    it('should detect mob proximity for attack', () => {
      const player = { x: 400, y: 300 };
      const mob = { x: 420, y: 300, size: 32, hp: 50 };
      const playerSize = 32;
      const attackRange = 20;
      
      // Act
      const inRange = loginManager.isMobInRange(player, mob, playerSize, attackRange);
      
      // Assert
      expect(inRange).toBe(true);
    });

    it('should apply damage to mob on attack', () => {
      const mob = { x: 420, y: 300, size: 32, hp: 50, maxHp: 50 };
      const damage = 10;
      
      // Act
      loginManager.applyDamage(mob, damage);
      
      // Assert
      expect(mob.hp).toBe(40);
    });

    it('should respawn mob when defeated', () => {
      const mob = { x: 420, y: 300, size: 32, hp: 5, maxHp: 50 };
      const canvasWidth = 800;
      const canvasHeight = 600;
      
      // Act
      loginManager.checkMobDefeat(mob, canvasWidth, canvasHeight);
      
      // Assert
      expect(mob.hp).toBe(mob.maxHp);
      expect(mob.x).toBeGreaterThanOrEqual(50);
      expect(mob.x).toBeLessThanOrEqual(750);
      expect(mob.y).toBeGreaterThanOrEqual(50);
      expect(mob.y).toBeLessThanOrEqual(550);
    });

    it('should generate attack message for chat', () => {
      const mob = { name: 'Goblin' };
      const damage = 10;
      
      // Act
      const message = loginManager.generateAttackMessage(mob, damage);
      
      // Assert
      expect(message).toBe('⚔️ Você atacou Goblin! (-10 HP)');
    });

    it('should generate defeat message for chat', () => {
      const mob = { name: 'Dragon' };
      
      // Act
      const message = loginManager.generateDefeatMessage(mob);
      
      // Assert
      expect(message).toBe('⚔️ Você derrotou Dragon!');
    });
  });

  describe('Mob AI System', () => {
    it('should update mob position based on direction and speed', () => {
      const mob = {
        x: 400,
        y: 300,
        direction: Math.PI, // 180 degrees (left)
        speed: 100,
        size: 32
      };
      const deltaTime = 0.016;
      
      // Act
      loginManager.updateMobPosition(mob, deltaTime);
      
      // Assert
      expect(mob.x).toBeCloseTo(384, 1); // 400 - 100 * 0.016
      expect(mob.y).toBeCloseTo(300, 1);  // No vertical movement
    });

    it('should change mob direction randomly', () => {
      const mob = { direction: 0 };
      Math.random = vi.fn().mockReturnValue(0.005); // Below threshold
      
      // Act
      loginManager.updateMobDirection(mob);
      
      // Assert
      expect(Math.random).toHaveBeenCalled();
      expect(typeof mob.direction).toBe('number');
    });

    it('should handle boundary collision for mobs', () => {
      const mob = { x: 10, y: 300, direction: 0, speed: 100, size: 32 };
      const canvasWidth = 800;
      const canvasHeight = 600;
      const deltaTime = 0.1;
      
      // Act
      loginManager.updateMobPosition(mob, deltaTime);
      loginManager.handleMobBoundaryCollision(mob, canvasWidth, canvasHeight);
      
      // Assert
      expect(mob.x).toBeGreaterThanOrEqual(16);
    });
  });

  describe('HUD Update System', () => {
    it('should update all HUD elements correctly', () => {
      const character = {
        name: 'TestChar',
        level: 5,
        hp: 75,
        maxHp: 100
      };
      const position = { x: 123, y: 456 };
      const mobCount = 8;
      const fps = 58;
      
      // Act
      loginManager.updateHUD(character, position, mobCount, fps);
      
      // Assert
      expect(document.getElementById('playerName').textContent).toBe('TestChar');
      expect(document.getElementById('playerLevel').textContent).toBe('Lv. 5');
      expect(document.getElementById('hpText').textContent).toBe('75/100 HP');
      expect(document.getElementById('positionText').textContent).toBe('123, 456');
      expect(document.getElementById('mobCount').textContent).toBe('8');
      expect(document.getElementById('fpsText').textContent).toBe('58');
    });

    it('should calculate health bar percentage correctly', () => {
      const hp = 75;
      const maxHp = 100;
      const healthFill = document.getElementById('healthFill');
      
      // Act
      loginManager.updateHealthBar(hp, maxHp);
      
      // Assert
      expect(healthFill.style.width).toBe('75%');
    });

    it('should handle empty character data gracefully', () => {
      const character = null;
      
      // Act & Assert
      expect(() => {
        loginManager.updateHUD(character, { x: 0, y: 0 }, 0, 0);
      }).not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate FPS correctly', () => {
      const mockPerformance = {
        now: vi.fn()
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(16.67)  // 60 FPS
          .mockReturnValueOnce(33.34)
          .mockReturnValueOnce(50.01)
      };
      global.performance = mockPerformance;
      
      // Act
      const fps = loginManager.calculateFPS();
      
      // Assert
      expect(fps).toBeCloseTo(60, 1);
    });

    it('should handle performance API unavailability', () => {
      global.performance = undefined;
      
      // Act & Assert
      expect(() => {
        const fps = loginManager.calculateFPS();
        expect(fps).toBe(0);
      }).not.toThrow();
    });

    it('should measure frame time accurately', () => {
      const startTime = performance.now();
      
      // Simulate some work
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += i;
      }
      
      const endTime = performance.now();
      const frameTime = endTime - startTime;
      
      // Act & Assert
      expect(frameTime).toBeGreaterThan(0);
      expect(frameTime).toBeLessThan(100); // Should be reasonable
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas context loss gracefully', () => {
      mockCanvas.getContext = () => null;
      
      // Act & Assert
      expect(() => {
        loginManager.startGame();
      }).not.toThrow();
    });

    it('should handle missing DOM elements', () => {
      document.getElementById('playerName').remove();
      
      // Act & Assert
      expect(() => {
        loginManager.updateHUD(loginManager.currentCharacter, { x: 0, y: 0 }, 0, 0);
      }).not.toThrow();
    });

    it('should handle corrupted character data', () => {
      loginManager.currentCharacter = null;
      
      // Act & Assert
      expect(() => {
        loginManager.startGame();
      }).not.toThrow();
    });

    it('should handle localStorage corruption', () => {
      localStorage.setItem('eldoria_characters', 'invalid json');
      
      // Act & Assert
      expect(() => {
        loginManager.loadCharacters();
      }).not.toThrow();
    });
  });
});
