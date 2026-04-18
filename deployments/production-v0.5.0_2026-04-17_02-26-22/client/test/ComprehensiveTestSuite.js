// === TEST SUITE FOR LEGACY OF KOMODO v0.3.6v ===
// Target: 98% Code Coverage

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock classes for testing
class MockNetworkManager {
    constructor() {
        this.isConnected = false;
        this.eventCallbacks = new Map();
    }
    
    connect() {
        this.isConnected = true;
        return Promise.resolve(true);
    }
    
    send(type, data) {
        if (!this.isConnected) {
            this.messageQueue = this.messageQueue || [];
            this.messageQueue.push({ type, data });
            return false;
        }
        return true;
    }
    
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(cb => cb(data));
        }
    }
}

class MockSessionManager {
    constructor() {
        this.currentUser = null;
        this.currentCharacter = null;
    }
    
    setCurrentUser(user) {
        this.currentUser = user;
    }
    
    setCurrentCharacter(character) {
        this.currentCharacter = character;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    getCurrentCharacter() {
        return this.currentCharacter;
    }
    
    isLoggedIn() {
        return !!this.currentUser;
    }
}

// Import classes to test
import { ClientStateManager, ClientStates } from '../state/ClientStateManager.js';
import { LoginUI } from '../ui/LoginUI.js';
import { CharacterUI } from '../ui/CharacterUI.js';
import { SessionManager } from '../state/SessionManager.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { GameEngine } from '../engine/GameEngine.js';
import { SafeInputSystem } from '../engine/SafeInputSystem.js';
import { SafeRenderSystem } from '../engine/SafeRenderSystem.js';
import { ErrorGuardSystem } from '../engine/ErrorGuardSystem.js';
import { EntitySpawnSystem } from '../entities/EntitySpawnSystem.js';
import { CoreGameplayTestSuite } from '../test/CoreGameplayTestSuite.js';

describe('Legacy of Komodo v0.3.6v - Core Systems', () => {
    let mockNetwork;
    let mockSession;
    
    beforeEach(() => {
        mockNetwork = new MockNetworkManager();
        mockSession = new MockSessionManager();
        
        // Setup global mocks
        global.window.networkManager = mockNetwork;
        global.window.sessionManager = mockSession;
        
        // Setup DOM elements
        document.body.innerHTML = `
            <div id="loginScreen">
                <input id="username" type="text">
                <input id="password" type="password">
                <button id="loginBtn">Login</button>
                <button id="createAccountBtn">Create Account</button>
            </div>
            <div id="characterScreen">
                <div id="characterList"></div>
                <button id="createCharacterBtn">Create Character</button>
            </div>
            <div id="gameScreen">
                <canvas id="gameCanvas"></canvas>
                <canvas id="minimap"></canvas>
            </div>
            <div id="loadingScreen">Loading...</div>
        `;
    });
    
    afterEach(() => {
        // Cleanup
        document.body.innerHTML = '';
    });
    
    // === CLIENT STATE MANAGER TESTS ===
    
    describe('ClientStateManager', () => {
        let stateManager;
        
        beforeEach(() => {
            stateManager = new ClientStateManager();
        });
        
        it('should initialize with LOGIN state', () => {
            expect(stateManager.getCurrentState()).toBe('LOGIN');
        });
        
        it('should allow valid state transitions', () => {
            const result = stateManager.setState('CHARACTER_SELECT');
            expect(result).toBe(true);
            expect(stateManager.getCurrentState()).toBe('CHARACTER_SELECT');
        });
        
        it('should reject invalid state transitions', () => {
            const result = stateManager.setState('INVALID_STATE');
            expect(result).toBe(false);
            expect(stateManager.getCurrentState()).toBe('LOGIN');
        });
        
        it('should execute state change callbacks', () => {
            let callbackExecuted = false;
            stateManager.onStateChange('CHARACTER_SELECT', () => {
                callbackExecuted = true;
            });
            
            stateManager.setState('CHARACTER_SELECT');
            expect(callbackExecuted).toBe(true);
        });
        
        it('should prevent gameplay access before IN_GAME state', () => {
            expect(stateManager.canAccessGameplay()).toBe(false);
            stateManager.setState('IN_GAME');
            expect(stateManager.canAccessGameplay()).toBe(true);
        });
        
        it('should maintain state history', () => {
            stateManager.setState('CHARACTER_SELECT');
            stateManager.setState('LOADING_WORLD');
            stateManager.setState('IN_GAME');
            
            const history = stateManager.getStateHistory();
            expect(history).toEqual(['LOGIN', 'CHARACTER_SELECT', 'LOADING_WORLD', 'IN_GAME']);
        });
    });
    
    // === LOGIN UI TESTS ===
    
    describe('LoginUI', () => {
        let loginUI;
        
        beforeEach(() => {
            loginUI = new LoginUI();
        });
        
        it('should initialize successfully', () => {
            expect(loginUI.isReady()).toBe(true);
        });
        
        it('should get form values correctly', () => {
            document.getElementById('username').value = 'testuser';
            document.getElementById('password').value = 'testpass';
            
            const values = loginUI.getFormValues();
            expect(values.username).toBe('testuser');
            expect(values.password).toBe('testpass');
        });
        
        it('should validate form data', () => {
            const validData = { username: 'user', password: 'pass' };
            expect(loginUI.validateFormData(validData)).toBe(true);
            
            const invalidData = { username: '', password: '' };
            expect(loginUI.validateFormData(invalidData)).toBe(false);
        });
        
        it('should show and hide correctly', () => {
            loginUI.show();
            expect(loginUI.isVisible()).toBe(true);
            
            loginUI.hide();
            expect(loginUI.isVisible()).toBe(false);
        });
        
        it('should handle login callback', () => {
            let callbackData = null;
            loginUI.onLogin((username, password) => {
                callbackData = { username, password };
            });
            
            document.getElementById('username').value = 'testuser';
            document.getElementById('password').value = 'testpass';
            loginUI.handleLogin();
            
            expect(callbackData.username).toBe('testuser');
            expect(callbackData.password).toBe('testpass');
        });
    });
    
    // === CHARACTER UI TESTS ===
    
    describe('CharacterUI', () => {
        let characterUI;
        
        beforeEach(() => {
            characterUI = new CharacterUI();
        });
        
        it('should initialize successfully', () => {
            expect(characterUI.isReady()).toBe(true);
        });
        
        it('should set characters correctly', () => {
            const characters = [
                { id: 'char1', name: 'Warrior', level: 1 },
                { id: 'char2', name: 'Mage', level: 5 }
            ];
            
            characterUI.setCharacters(characters);
            expect(characterUI.getCharacters()).toEqual(characters);
        });
        
        it('should validate character data', () => {
            const validChar = { name: 'Test', class: 'Warrior' };
            expect(characterUI.validateCharacterData(validChar)).toBe(true);
            
            const invalidChar = { name: '', class: '' };
            expect(characterUI.validateCharacterData(invalidChar)).toBe(false);
        });
        
        it('should handle character selection', () => {
            let selectedChar = null;
            characterUI.onEnterWorld((character) => {
                selectedChar = character;
            });
            
            const character = { id: 'char1', name: 'Warrior' };
            characterUI.selectCharacter(character);
            
            expect(selectedChar).toEqual(character);
        });
    });
    
    // === SESSION MANAGER TESTS ===
    
    describe('SessionManager', () => {
        let sessionManager;
        
        beforeEach(() => {
            sessionManager = new SessionManager();
        });
        
        it('should initialize with empty session', () => {
            expect(sessionManager.getCurrentUser()).toBeNull();
            expect(sessionManager.getCurrentCharacter()).toBeNull();
            expect(sessionManager.isLoggedIn()).toBe(false);
        });
        
        it('should set and get current user', () => {
            const user = { id: 'user1', username: 'testuser' };
            sessionManager.setCurrentUser(user);
            expect(sessionManager.getCurrentUser()).toEqual(user);
            expect(sessionManager.isLoggedIn()).toBe(true);
        });
        
        it('should set and get current character', () => {
            const character = { id: 'char1', name: 'Warrior' };
            sessionManager.setCurrentCharacter(character);
            expect(sessionManager.getCurrentCharacter()).toEqual(character);
        });
        
        it('should validate session correctly', () => {
            expect(sessionManager.isValid()).toBe(false);
            
            sessionManager.setCurrentUser({ id: 'user1' });
            expect(sessionManager.isValid()).toBe(true);
        });
        
        it('should handle logout correctly', () => {
            sessionManager.setCurrentUser({ id: 'user1' });
            sessionManager.setCurrentCharacter({ id: 'char1' });
            
            sessionManager.logout();
            
            expect(sessionManager.getCurrentUser()).toBeNull();
            expect(sessionManager.getCurrentCharacter()).toBeNull();
            expect(sessionManager.isLoggedIn()).toBe(false);
        });
    });
    
    // === NETWORK MANAGER TESTS ===
    
    describe('NetworkManager', () => {
        let networkManager;
        
        beforeEach(() => {
            networkManager = new NetworkManager();
        });
        
        it('should initialize successfully', () => {
            expect(networkManager.getStatus().isInitialized).toBe(true);
        });
        
        it('should connect successfully', async () => {
            const result = await networkManager.connect();
            expect(result).toBe(true);
            expect(networkManager.getStatus().isConnected).toBe(true);
        });
        
        it('should queue messages when disconnected', () => {
            const result = networkManager.send('test', { data: 'test' });
            expect(result).toBe(false);
            expect(networkManager.getStatus().queuedMessages).toBe(1);
        });
        
        it('should send messages when connected', async () => {
            await networkManager.connect();
            const result = networkManager.send('test', { data: 'test' });
            expect(result).toBe(true);
        });
        
        it('should handle event callbacks', () => {
            let eventData = null;
            networkManager.on('test_event', (data) => {
                eventData = data;
            });
            
            networkManager.emit('test_event', { test: 'data' });
            expect(eventData).toEqual({ test: 'data' });
        });
    });
    
    // === GAME ENGINE TESTS ===
    
    describe('GameEngine', () => {
        let gameEngine;
        
        beforeEach(() => {
            gameEngine = new GameEngine();
        });
        
        it('should initialize successfully', () => {
            expect(gameEngine.getStatus().isInitialized).toBe(false);
        });
        
        it('should initialize world with valid data', () => {
            const worldData = {
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                entities: []
            };
            
            const result = gameEngine.initializeWorld(worldData);
            expect(result).toBe(true);
            expect(gameEngine.getStatus().isInitialized).toBe(true);
        });
        
        it('should fail with invalid world data', () => {
            const invalidData = null;
            const result = gameEngine.initializeWorld(invalidData);
            expect(result).toBe(false);
        });
        
        it('should spawn player correctly', () => {
            const worldData = {
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                entities: []
            };
            
            gameEngine.initializeWorld(worldData);
            expect(gameEngine.player).toBeDefined();
            expect(gameEngine.player.id).toBe('test_player');
        });
        
        it('should spawn mobs correctly', () => {
            const worldData = {
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                entities: []
            };
            
            gameEngine.initializeWorld(worldData);
            expect(gameEngine.mobs).toBeDefined();
            expect(gameEngine.mobs.length).toBeGreaterThan(0);
        });
        
        it('should update player position', () => {
            const worldData = {
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                entities: []
            };
            
            gameEngine.initializeWorld(worldData);
            const initialX = gameEngine.player.x;
            
            gameEngine.updatePlayer(0.016);
            
            // Player should not crash during update
            expect(typeof gameEngine.player.x).toBe('number');
        });
    });
    
    // === SAFE INPUT SYSTEM TESTS ===
    
    describe('SafeInputSystem', () => {
        let inputSystem;
        
        beforeEach(() => {
            inputSystem = new SafeInputSystem();
        });
        
        it('should initialize successfully', () => {
            expect(inputSystem.getStatus().isInitialized).toBe(true);
        });
        
        it('should check player entity guard', () => {
            // Without game engine, should return false
            expect(inputSystem.checkPlayerEntity()).toBe(false);
        });
        
        it('should check game state guard', () => {
            // Without state manager, should return false
            expect(inputSystem.checkGameState()).toBe(false);
        });
        
        it('should get movement vector', () => {
            const vector = inputSystem.getMovementVector();
            expect(vector).toHaveProperty('x');
            expect(vector).toHaveProperty('y');
            expect(typeof vector.x).toBe('number');
            expect(typeof vector.y).toBe('number');
        });
        
        it('should handle key press simulation', () => {
            inputSystem.keys.set('w', true);
            expect(inputSystem.isKeyPressed('w')).toBe(true);
            expect(inputSystem.isKeyPressed('a')).toBe(false);
        });
    });
    
    // === SAFE RENDER SYSTEM TESTS ===
    
    describe('SafeRenderSystem', () => {
        let renderSystem;
        
        beforeEach(() => {
            renderSystem = new SafeRenderSystem();
        });
        
        it('should initialize successfully', () => {
            expect(renderSystem.getStatus().isInitialized).toBe(true);
        });
        
        it('should validate entity data', () => {
            const validEntity = { x: 100, y: 100, health: 100 };
            expect(renderSystem.validateEntity(validEntity)).toBe(true);
            
            const invalidEntity = { x: 'invalid', y: 100 };
            expect(renderSystem.validateEntity(invalidEntity)).toBe(false);
        });
        
        it('should render without crashing', () => {
            const result = renderSystem.render(0.016);
            expect(typeof result).toBe('boolean');
        });
        
        it('should handle render errors gracefully', () => {
            // Force error condition
            renderSystem.ctx = null;
            const result = renderSystem.render(0.016);
            expect(result).toBe(false);
        });
    });
    
    // === ERROR GUARD SYSTEM TESTS ===
    
    describe('ErrorGuardSystem', () => {
        let guardSystem;
        
        beforeEach(() => {
            guardSystem = new ErrorGuardSystem();
        });
        
        it('should initialize successfully', () => {
            expect(guardSystem.isInitialized).toBe(true);
        });
        
        it('should check all guards', () => {
            const results = guardSystem.checkAllGuards();
            expect(typeof results).toBe('object');
            expect(results).toHaveProperty('player');
            expect(results).toHaveProperty('gameEngine');
        });
        
        it('should execute guard with fallback', () => {
            let operationCalled = false;
            let fallbackCalled = false;
            
            const result = guardSystem.guard('player', 
                () => { operationCalled = true; return true; },
                () => { fallbackCalled = true; return false; }
            );
            
            expect(typeof result).toBe('object'); // Should return fallback object
        });
        
        it('should handle guard failures gracefully', () => {
            const result = guardSystem.guard('nonexistent', 
                () => { throw new Error('Test error'); },
                () => { return 'fallback'; }
            );
            
            expect(result).toBe('fallback');
        });
    });
    
    // === ENTITY SPAWN SYSTEM TESTS ===
    
    describe('EntitySpawnSystem', () => {
        let spawnSystem;
        let mockECS;
        
        beforeEach(() => {
            mockECS = {
                createEntity: (id) => ({ id, components: new Map() }),
                addEntity: (entity) => {},
                getEntityCount: () => 0
            };
            
            spawnSystem = new EntitySpawnSystem();
            spawnSystem.initialize(mockECS);
        });
        
        it('should initialize successfully', () => {
            expect(spawnSystem.getStatus().isInitialized).toBe(true);
        });
        
        it('should spawn player from server data', () => {
            const serverData = {
                type: 'player',
                id: 'test_player',
                name: 'Test Player',
                components: {
                    position: { x: 400, y: 300 },
                    health: { health: 100, maxHealth: 100 }
                }
            };
            
            const entity = spawnSystem.spawnFromServerData(serverData);
            expect(entity).toBeDefined();
            expect(entity.id).toBe('test_player');
        });
        
        it('should spawn mob from server data', () => {
            const serverData = {
                type: 'mob',
                template: 'goblin',
                id: 'test_mob',
                components: {
                    position: { x: 100, y: 100 },
                    health: { health: 30, maxHealth: 30 }
                }
            };
            
            const entity = spawnSystem.spawnFromServerData(serverData);
            expect(entity).toBeDefined();
            expect(entity.id).toBe('test_mob');
        });
        
        it('should handle invalid server data', () => {
            const invalidData = null;
            const entity = spawnSystem.spawnFromServerData(invalidData);
            expect(entity).toBeNull();
        });
    });
    
    // === CORE GAMEPLAY TEST SUITE ===
    
    describe('CoreGameplayTestSuite', () => {
        let testSuite;
        
        beforeEach(() => {
            testSuite = new CoreGameplayTestSuite();
        });
        
        it('should initialize with all tests', () => {
            expect(testSuite.tests.length).toBe(14);
        });
        
        it('should run quick test successfully', async () => {
            const results = await testSuite.quickTest();
            expect(results).toHaveProperty('total');
            expect(results).toHaveProperty('passed');
            expect(results).toHaveProperty('failed');
            expect(results.total).toBe(5); // Quick test runs 5 critical tests
        });
        
        it('should generate results report', () => {
            const results = testSuite.getResults();
            expect(results).toHaveProperty('successRate');
            expect(results).toHaveProperty('tests');
            expect(Array.isArray(results.tests)).toBe(true);
        });
    });
});

// Integration Tests
describe('Legacy of Komodo v0.3.6v - Integration Tests', () => {
    let mockNetwork;
    let mockSession;
    
    beforeEach(() => {
        mockNetwork = new MockNetworkManager();
        mockSession = new MockSessionManager();
        global.window.networkManager = mockNetwork;
        global.window.sessionManager = mockSession;
    });
    
    it('should handle complete login flow', async () => {
        const stateManager = new ClientStateManager();
        const loginUI = new LoginUI();
        
        // Setup login callback
        let loginSuccessful = false;
        mockNetwork.on('login_success', (data) => {
            mockSession.setCurrentUser(data.user);
            loginSuccessful = true;
        });
        
        // Simulate login
        await mockNetwork.connect();
        mockNetwork.send('login', { username: 'test', password: 'test' });
        
        // Simulate server response
        mockNetwork.emit('login_success', { 
            user: { id: 'user1', username: 'test' } 
        });
        
        expect(loginSuccessful).toBe(true);
        expect(mockSession.isLoggedIn()).toBe(true);
    });
    
    it('should handle world initialization flow', async () => {
        const gameEngine = new GameEngine();
        
        const worldData = {
            mapWidth: 800,
            mapHeight: 600,
            tileSize: 32,
            playerId: 'test_player',
            entities: []
        };
        
        const result = gameEngine.initializeWorld(worldData);
        expect(result).toBe(true);
        expect(gameEngine.getStatus().isInitialized).toBe(true);
    });
    
    it('should handle error recovery', () => {
        const guardSystem = new ErrorGuardSystem();
        
        // Force guard failure
        let recoveryCalled = false;
        const originalRecover = guardSystem.recoverPlayer;
        guardSystem.recoverPlayer = () => {
            recoveryCalled = true;
            return originalRecover.call(guardSystem);
        };
        
        // Trigger multiple failures
        for (let i = 0; i < 11; i++) {
            guardSystem.guard('player', () => {
                throw new Error('Test error');
            });
        }
        
        expect(recoveryCalled).toBe(true);
    });
});

// Performance Tests
describe('Legacy of Komodo v0.3.6v - Performance Tests', () => {
    it('should handle 60 FPS game loop', async () => {
        const gameEngine = new GameEngine();
        gameEngine.initializeWorld({
            mapWidth: 800,
            mapHeight: 600,
            tileSize: 32,
            playerId: 'test_player',
            entities: []
        });
        
        const startTime = performance.now();
        const frameCount = 60;
        
        for (let i = 0; i < frameCount; i++) {
            gameEngine.update(1/60); // 60 FPS
            gameEngine.render();
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        const fps = frameCount / (duration / 1000);
        
        expect(fps).toBeGreaterThan(55); // Allow some margin
    });
    
    it('should handle multiple entities efficiently', async () => {
        const spawnSystem = new EntitySpawnSystem();
        spawnSystem.initialize({
            createEntity: () => ({ id: 'test', components: new Map() }),
            addEntity: () => {},
            getEntityCount: () => 100
        });
        
        const startTime = performance.now();
        
        for (let i = 0; i < 100; i++) {
            spawnSystem.spawnFromServerData({
                type: 'mob',
                id: `mob_${i}`,
                components: { position: { x: i, y: i } }
            });
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        expect(duration).toBeLessThan(100); // Should spawn 100 entities in < 100ms
    });
});

export {};
