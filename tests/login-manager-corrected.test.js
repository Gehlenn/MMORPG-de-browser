import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock do DOM para testes
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('SimpleLoginManager - Critical Path Tests', () => {
  let loginManager;
  
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
    
    // Criar elementos DOM necessários
    document.body.innerHTML = `
      <div id="loginScreen"></div>
      <div id="characterScreen"></div>
      <div id="gameScreen"></div>
      <input id="username" />
      <input id="password" />
      <button id="loginBtn"></button>
      <button id="createAccountBtn"></button>
      <button id="enterWorldBtn"></button>
      <button id="createCharacterBtn"></button>
      <button id="backToLoginBtn"></button>
      <div id="characterList"></div>
      <div id="loginMessage"></div>
      <div id="characterMessage"></div>
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
    
    // Importar e instanciar o LoginManager
    const { SimpleLoginManager } = require('../client/index.html');
    loginManager = new SimpleLoginManager();
  });
  
  afterEach(() => {
    // Limpar event listeners e estado
    if (loginManager) {
      loginManager.currentUser = null;
      loginManager.currentCharacter = null;
    }
  });

  describe('Authentication Flow', () => {
    it('should login user successfully with valid credentials', () => {
      // Arrange
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      const loginBtn = document.getElementById('loginBtn');
      
      usernameInput.value = 'testuser';
      passwordInput.value = 'testpass';
      
      // Act
      loginManager.login();
      
      // Assert
      expect(loginManager.currentUser).toBeDefined();
      expect(loginManager.currentUser.username).toBe('testuser');
    });

    it('should prevent login with empty username', () => {
      // Arrange
      const usernameInput = document.getElementById('username');
      usernameInput.value = '';
      
      // Act
      loginManager.login();
      
      // Assert
      expect(loginManager.currentUser).toBeNull();
      const messageEl = document.getElementById('loginMessage');
      expect(messageEl.textContent).toContain('Digite um nome de usuário');
    });

    it('should create account and persist data', () => {
      // Arrange
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      
      usernameInput.value = 'newuser';
      passwordInput.value = 'newpass';
      
      // Act
      loginManager.createAccount();
      
      // Assert
      const accounts = JSON.parse(localStorage.getItem('eldoria_accounts') || '{}');
      expect(accounts['newuser']).toBeDefined();
      expect(accounts['newuser'].username).toBe('newuser');
    });
  });

  describe('Character Management', () => {
    beforeEach(() => {
      loginManager.currentUser = { username: 'testuser', id: '123' };
    });

    it('should create character with race selection', () => {
      // Arrange
      const characterData = {
        name: 'TestChar',
        race: 'Elfo',
        class: 'Aprendiz'
      };
      
      // Act
      loginManager.saveCharacter(characterData);
      
      // Assert
      const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
      const userChars = characters['testuser'] || [];
      expect(userChars.length).toBe(1);
      expect(userChars[0].name).toBe('TestChar');
      expect(userChars[0].race).toBe('Elfo');
    });

    it('should enforce maximum 4 characters per account', () => {
      // Arrange
      const characters = [];
      for (let i = 0; i < 4; i++) {
        characters.push({
          id: `char${i}`,
          name: `Char${i}`,
          race: 'Humano',
          class: 'Aprendiz'
        });
      }
      
      localStorage.setItem('eldoria_characters', JSON.stringify({
        'testuser': characters
      }));
      
      // Act & Assert
      expect(() => {
        loginManager.saveCharacter({
          name: 'FifthChar',
          race: 'Orc',
          class: 'Aprendiz'
        });
      }).toThrow('Limite de 4 personagens por conta atingido');
    });

    it('should load characters and display cards', () => {
      // Arrange
      const testCharacters = [
        {
          id: '1',
          name: 'Char1',
          race: 'Humano',
          class: 'Guerreiro',
          level: 5,
          hp: 150,
          maxHp: 150
        }
      ];
      
      localStorage.setItem('eldoria_characters', JSON.stringify({
        'testuser': testCharacters
      }));
      
      // Act
      loginManager.loadCharacters();
      
      // Assert
      const characterList = document.getElementById('characterList');
      expect(characterList.children.length).toBeGreaterThan(0);
      expect(characterList.innerHTML).toContain('Char1');
      expect(characterList.innerHTML).toContain('Humano');
    });
  });

  describe('Game State Management', () => {
    beforeEach(() => {
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

    it('should initialize game with correct context', () => {
      // Act
      expect(() => {
        loginManager.startGame();
      }).not.toThrow();
      
      // Assert
      const canvas = document.getElementById('gameCanvas');
      expect(canvas).toBeDefined();
      expect(canvas.width).toBe(window.innerWidth);
      expect(canvas.height).toBe(window.innerHeight);
    });

    it('should maintain character context in game loop', () => {
      // Arrange
      const mockContext = {
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        fillStyle: '',
        font: '',
        textAlign: ''
      };
      
      const canvas = document.getElementById('gameCanvas');
      canvas.getContext = () => mockContext;
      
      // Act
      loginManager.startGame();
      
      // Assert
      expect(mockContext.fillText).toHaveBeenCalledWith(
        expect.stringContaining('TestChar'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Input System', () => {
    it('should handle WASD movement correctly', () => {
      // Arrange
      const keys = {};
      const mockEvent = { key: 'w', preventDefault: vi.fn() };
      
      // Act
      loginManager.handleKeyDown(mockEvent, keys);
      
      // Assert
      expect(keys['w']).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should prevent default browser behavior for game keys', () => {
      // Arrange
      const gameKeys = ['w', 'a', 's', 'd', ' '];
      const preventDefault = vi.fn();
      
      // Act & Assert
      gameKeys.forEach(key => {
        const mockEvent = { key, preventDefault };
        loginManager.handleKeyDown(mockEvent, {});
        expect(preventDefault).toHaveBeenCalled();
      });
    });
  });

  describe('Data Integrity', () => {
    it('should validate character data structure', () => {
      // Arrange
      const invalidCharacter = {
        name: '',  // Empty name
        race: null,  // Null race
        class: undefined  // Undefined class
      };
      
      // Act & Assert
      expect(() => {
        loginManager.validateCharacter(invalidCharacter);
      }).toThrow('Dados do personagem inválidos');
    });

    it('should handle localStorage corruption gracefully', () => {
      // Arrange
      localStorage.setItem('eldoria_characters', 'invalid json');
      
      // Act & Assert
      expect(() => {
        loginManager.loadCharacters();
      }).not.toThrow();
      
      const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
      expect(characters).toEqual({});
    });

    it('should maintain data consistency during concurrent operations', () => {
      // Arrange
      loginManager.currentUser = { username: 'testuser', id: '123' };
      
      // Act - Simulate concurrent character creation
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              try {
                loginManager.saveCharacter({
                  name: `ConcurrentChar${i}`,
                  race: 'Humano',
                  class: 'Aprendiz'
                });
                resolve(true);
              } catch (error) {
                resolve(false);
              }
            }, Math.random() * 100);
          })
        );
      }
      
      // Assert
      return Promise.all(promises).then(results => {
        const successfulCreations = results.filter(r => r).length;
        expect(successfulCreations).toBeLessThanOrEqual(4); // Max 4 characters
      });
    });
  });
});

describe('Performance Metrics', () => {
  it('should maintain 60 FPS in game loop', () => {
    // Arrange
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

  it('should optimize canvas rendering', () => {
    // Arrange
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const clearRect = vi.spyOn(ctx, 'clearRect');
    
    // Act
    loginManager.renderFrame();
    
    // Assert
    expect(clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
  });
});

describe('Security Tests', () => {
  it('should sanitize user input', () => {
    // Arrange
    const maliciousInput = '<script>alert("xss")</script>';
    const usernameInput = document.getElementById('username');
    usernameInput.value = maliciousInput;
    
    // Act
    loginManager.login();
    
    // Assert
    const messageEl = document.getElementById('loginMessage');
    expect(messageEl.innerHTML).not.toContain('<script>');
  });

  it('should validate data types in localStorage', () => {
    // Arrange
    localStorage.setItem('eldoria_characters', JSON.stringify({
      'testuser': [
        { name: 'ValidChar' },
        { name: 123 },  // Invalid type
        null,  // Invalid type
        'invalid'  // Invalid type
      ]
    }));
    
    // Act
    loginManager.loadCharacters();
    
    // Assert
    const characters = JSON.parse(localStorage.getItem('eldoria_characters') || '{}');
    const userChars = characters['testuser'] || [];
    expect(userChars.every(char => 
      typeof char === 'object' && char !== null && typeof char.name === 'string'
    )).toBe(true);
  });
});
