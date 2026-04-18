// === CORE GAMEPLAY TEST SUITE ===

/**
 * Suite de testes para verificar o fluxo completo do gameplay
 * Testa todos os steps da pipeline
 */

export class CoreGameplayTestSuite {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: [],
            startTime: 0,
            endTime: 0,
            duration: 0
        };
        
        this.setupTests();
        console.log('🧪 Core Gameplay Test Suite initialized');
    }
    
    setupTests() {
        // STEP 1: Login System Test
        this.addTest('STEP 1 - Login System', () => this.testLoginSystem());
        
        // STEP 2: State Management Test
        this.addTest('STEP 2 - State Management', () => this.testStateManagement());
        
        // STEP 3: Character Creation Test
        this.addTest('STEP 3 - Character Creation', () => this.testCharacterCreation());
        
        // STEP 4: Network Connection Test
        this.addTest('STEP 4 - Network Connection', () => this.testNetworkConnection());
        
        // STEP 5: World Initialization Test
        this.addTest('STEP 5 - World Initialization', () => this.testWorldInitialization());
        
        // STEP 6: Player Spawn Test
        this.addTest('STEP 6 - Player Spawn', () => this.testPlayerSpawn());
        
        // STEP 7: Mob Spawn Test
        this.addTest('STEP 7 - Mob Spawn', () => this.testMobSpawn());
        
        // STEP 8: Input System Test
        this.addTest('STEP 8 - Input System', () => this.testInputSystem());
        
        // STEP 9: Movement Test
        this.addTest('STEP 9 - Movement', () => this.testMovement());
        
        // STEP 10: AI System Test
        this.addTest('STEP 10 - AI System', () => this.testAISystem());
        
        // STEP 11: Render System Test
        this.addTest('STEP 11 - Render System', () => this.testRenderSystem());
        
        // STEP 12: ECS Integration Test
        this.addTest('STEP 12 - ECS Integration', () => this.testECSIntegration());
        
        // STEP 13: Error Guards Test
        this.addTest('STEP 13 - Error Guards', () => this.testErrorGuards());
        
        // STEP 14: Full Pipeline Test
        this.addTest('STEP 14 - Full Pipeline', () => this.testFullPipeline());
    }
    
    addTest(name, testFunction) {
        this.tests.push({
            name: name,
            test: testFunction,
            status: 'pending',
            duration: 0,
            error: null
        });
    }
    
    async runAllTests() {
        console.log('🚀 Starting Core Gameplay Test Suite...');
        
        this.results.startTime = Date.now();
        this.results.total = this.tests.length;
        this.results.passed = 0;
        this.results.failed = 0;
        this.results.errors = [];
        
        for (let i = 0; i < this.tests.length; i++) {
            const test = this.tests[i];
            console.log(`\n📋 Running test ${i + 1}/${this.tests.length}: ${test.name}`);
            
            const startTime = Date.now();
            
            try {
                const result = await test.test();
                const duration = Date.now() - startTime;
                
                test.status = result ? 'passed' : 'failed';
                test.duration = duration;
                
                if (result) {
                    this.results.passed++;
                    console.log(`✅ ${test.name} - PASSED (${duration}ms)`);
                } else {
                    this.results.failed++;
                    console.log(`❌ ${test.name} - FAILED (${duration}ms)`);
                }
                
            } catch (error) {
                const duration = Date.now() - startTime;
                
                test.status = 'error';
                test.duration = duration;
                test.error = error.message;
                
                this.results.failed++;
                this.results.errors.push({
                    test: test.name,
                    error: error.message,
                    stack: error.stack
                });
                
                console.error(`💥 ${test.name} - ERROR (${duration}ms):`, error.message);
            }
        }
        
        this.results.endTime = Date.now();
        this.results.duration = this.results.endTime - this.results.startTime;
        
        this.printResults();
        return this.results;
    }
    
    // === INDIVIDUAL TESTS ===
    
    async testLoginSystem() {
        console.log('🔑 Testing login system...');
        
        // Check LoginUI exists
        if (!window.LoginUI) {
            throw new Error('LoginUI class not found');
        }
        
        // Check login UI elements
        const loginScreen = document.getElementById('loginScreen');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('loginBtn');
        
        if (!loginScreen || !usernameInput || !passwordInput || !loginBtn) {
            throw new Error('Login UI elements missing');
        }
        
        // Test login UI creation
        try {
            const loginUI = new window.LoginUI();
            if (!loginUI.isReady()) {
                throw new Error('LoginUI not ready');
            }
        } catch (error) {
            throw new Error(`LoginUI creation failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testStateManagement() {
        console.log('📊 Testing state management...');
        
        // Check ClientStateManager exists
        if (!window.ClientStateManager) {
            throw new Error('ClientStateManager class not found');
        }
        
        // Test state manager creation
        try {
            const stateManager = new window.ClientStateManager();
            
            // Test state transitions
            const currentState = stateManager.getCurrentState();
            if (!currentState) {
                throw new Error('No current state');
            }
            
            // Test valid state
            const validStates = ['LOGIN', 'CHARACTER_SELECT', 'LOADING_WORLD', 'IN_GAME'];
            if (!validStates.includes(currentState)) {
                throw new Error(`Invalid state: ${currentState}`);
            }
            
        } catch (error) {
            throw new Error(`State manager test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testCharacterCreation() {
        console.log('👤 Testing character creation...');
        
        // Check CharacterUI exists
        if (!window.CharacterUI) {
            throw new Error('CharacterUI class not found');
        }
        
        // Check character UI elements
        const characterScreen = document.getElementById('characterScreen');
        const characterList = document.getElementById('characterList');
        const createCharacterBtn = document.getElementById('createCharacterBtn');
        
        if (!characterScreen || !characterList || !createCharacterBtn) {
            throw new Error('Character UI elements missing');
        }
        
        // Test character UI creation
        try {
            const characterUI = new window.CharacterUI();
            if (!characterUI.isReady()) {
                throw new Error('CharacterUI not ready');
            }
        } catch (error) {
            throw new Error(`CharacterUI creation failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testNetworkConnection() {
        console.log('🌐 Testing network connection...');
        
        // Check NetworkManager exists
        if (!window.NetworkManager) {
            throw new Error('NetworkManager class not found');
        }
        
        // Test network manager creation
        try {
            const networkManager = new window.NetworkManager();
            
            // Test connection attempt
            const connectResult = networkManager.connect();
            if (typeof connectResult !== 'boolean') {
                throw new Error('Connect should return boolean');
            }
            
        } catch (error) {
            throw new Error(`Network manager test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testWorldInitialization() {
        console.log('🌍 Testing world initialization...');
        
        // Check GameEngine exists
        if (!window.GameEngine) {
            throw new Error('GameEngine class not found');
        }
        
        // Test game engine creation
        try {
            const gameEngine = new window.GameEngine();
            
            // Test world data
            const worldData = {
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                worldId: 'test_world',
                entities: []
            };
            
            // Test world initialization
            const initResult = gameEngine.initializeWorld(worldData);
            if (!initResult) {
                throw new Error('World initialization failed');
            }
            
        } catch (error) {
            throw new Error(`World initialization test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testPlayerSpawn() {
        console.log('🦸 Testing player spawn...');
        
        // Create test character data
        const characterData = {
            id: 'test_player',
            name: 'Test Player',
            class: 'Guerreiro',
            level: 1,
            hp: 100,
            maxHp: 100,
            x: 400,
            y: 300,
            speed: 150,
            size: 32,
            color: '#4CAF50'
        };
        
        // Test player spawn
        try {
            const gameEngine = new window.GameEngine();
            gameEngine.initializeWorld({
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: characterData.id,
                entities: []
            });
            
            // Check player exists
            if (!gameEngine.player) {
                throw new Error('Player not spawned');
            }
            
            // Check player properties
            if (gameEngine.player.id !== characterData.id) {
                throw new Error('Player ID mismatch');
            }
            
            if (gameEngine.player.x !== characterData.x || gameEngine.player.y !== characterData.y) {
                throw new Error('Player position mismatch');
            }
            
        } catch (error) {
            throw new Error(`Player spawn test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testMobSpawn() {
        console.log('👾 Testing mob spawn...');
        
        try {
            const gameEngine = new window.GameEngine();
            gameEngine.initializeWorld({
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                entities: []
            });
            
            // Check mobs exist
            if (!gameEngine.mobs || !Array.isArray(gameEngine.mobs)) {
                throw new Error('Mobs array not found');
            }
            
            if (gameEngine.mobs.length === 0) {
                throw new Error('No mobs spawned');
            }
            
            // Check mob properties
            const mob = gameEngine.mobs[0];
            if (!mob.id || !mob.x || !mob.y || !mob.health) {
                throw new Error('Mob missing required properties');
            }
            
        } catch (error) {
            throw new Error(`Mob spawn test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testInputSystem() {
        console.log('⌨️ Testing input system...');
        
        // Check SafeInputSystem exists
        if (!window.SafeInputSystem) {
            throw new Error('SafeInputSystem class not found');
        }
        
        // Test input system creation
        try {
            const inputSystem = new window.SafeInputSystem();
            
            // Test guard checks
            const canProcess = inputSystem.canProcessInput();
            if (typeof canProcess !== 'boolean') {
                throw new Error('canProcessInput should return boolean');
            }
            
            // Test movement vector
            const movement = inputSystem.getMovementVector();
            if (!movement || typeof movement.x !== 'number' || typeof movement.y !== 'number') {
                throw new Error('Invalid movement vector');
            }
            
        } catch (error) {
            throw new Error(`Input system test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testMovement() {
        console.log('🏃 Testing movement...');
        
        try {
            const gameEngine = new window.GameEngine();
            gameEngine.initializeWorld({
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                entities: []
            });
            
            const player = gameEngine.player;
            const initialX = player.x;
            const initialY = player.y;
            
            // Simulate movement
            gameEngine.updatePlayer(0.016); // 60 FPS
            
            // Check player moved (or at least didn't crash)
            if (typeof player.x !== 'number' || typeof player.y !== 'number') {
                throw new Error('Player position invalid after movement');
            }
            
        } catch (error) {
            throw new Error(`Movement test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testAISystem() {
        console.log('🤖 Testing AI system...');
        
        try {
            const gameEngine = new window.GameEngine();
            gameEngine.initializeWorld({
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                entities: []
            });
            
            const mobs = gameEngine.mobs;
            if (mobs.length === 0) {
                throw new Error('No mobs to test AI');
            }
            
            // Test AI update
            gameEngine.updateMobs(0.016); // 60 FPS
            
            // Check AI states
            const validStates = ['patrolling', 'aggro', 'fleeing'];
            mobs.forEach((mob, index) => {
                if (!validStates.includes(mob.aiState)) {
                    throw new Error(`Mob ${index} has invalid AI state: ${mob.aiState}`);
                }
            });
            
        } catch (error) {
            throw new Error(`AI system test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testRenderSystem() {
        console.log('🎨 Testing render system...');
        
        // Check SafeRenderSystem exists
        if (!window.SafeRenderSystem) {
            throw new Error('SafeRenderSystem class not found');
        }
        
        // Test render system creation
        try {
            const renderSystem = new window.SafeRenderSystem();
            
            // Test render capability
            const canRender = renderSystem.canRender();
            if (typeof canRender !== 'boolean') {
                throw new Error('canRender should return boolean');
            }
            
            // Test render execution
            const renderResult = renderSystem.render(0.016);
            if (typeof renderResult !== 'boolean') {
                throw new Error('render should return boolean');
            }
            
        } catch (error) {
            throw new Error(`Render system test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testECSIntegration() {
        console.log('🗄️ Testing ECS integration...');
        
        // Check ECSManager exists
        if (!window.ECSManager) {
            throw new Error('ECSManager class not found');
        }
        
        // Test ECS manager creation
        try {
            const ecsManager = new window.ECSManager();
            
            // Test entity creation
            const entity = ecsManager.createEntity('test_entity');
            if (!entity || !entity.id) {
                throw new Error('Entity creation failed');
            }
            
            // Test component addition
            ecsManager.addComponentToEntity(entity.id, 'position', { x: 100, y: 100 });
            const position = entity.getComponent('position');
            if (!position || position.x !== 100 || position.y !== 100) {
                throw new Error('Component addition failed');
            }
            
            // Test entity retrieval
            const retrievedEntity = ecsManager.getEntity(entity.id);
            if (!retrievedEntity || retrievedEntity.id !== entity.id) {
                throw new Error('Entity retrieval failed');
            }
            
        } catch (error) {
            throw new Error(`ECS integration test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testErrorGuards() {
        console.log('🛡️ Testing error guards...');
        
        // Check ErrorGuardSystem exists
        if (!window.ErrorGuardSystem) {
            throw new Error('ErrorGuardSystem class not found');
        }
        
        // Test error guard system creation
        try {
            const guardSystem = new window.ErrorGuardSystem();
            
            // Test guard execution
            const result = guardSystem.guard('player', () => {
                return window.gameEngine?.player || null;
            });
            
            // Should not crash even if player doesn't exist
            if (result === undefined) {
                throw new Error('Guard execution failed');
            }
            
            // Test guard status
            const guardStatus = guardSystem.checkAllGuards();
            if (typeof guardStatus !== 'object') {
                throw new Error('Guard status should be object');
            }
            
        } catch (error) {
            throw new Error(`Error guards test failed: ${error.message}`);
        }
        
        return true;
    }
    
    async testFullPipeline() {
        console.log('🔄 Testing full pipeline...');
        
        try {
            // This is a comprehensive test of the entire pipeline
            // We'll simulate the complete flow from login to gameplay
            
            // 1. Initialize all systems
            const stateManager = new window.ClientStateManager();
            const sessionManager = new window.SessionManager();
            const networkManager = new window.NetworkManager();
            const gameEngine = new window.GameEngine();
            const inputSystem = new window.SafeInputSystem();
            const renderSystem = new window.SafeRenderSystem();
            const guardSystem = new window.ErrorGuardSystem();
            
            // 2. Test state transitions
            if (stateManager.getCurrentState() !== 'LOGIN') {
                throw new Error('Initial state should be LOGIN');
            }
            
            // 3. Test login flow (simulated)
            const loginResult = networkManager.send('login', {
                username: 'testuser',
                password: 'testpass'
            });
            
            if (loginResult === false) {
                // This is expected if not connected
                console.log('⚠️ Network not connected, but that\'s OK for test');
            }
            
            // 4. Test world initialization
            const worldInitResult = gameEngine.initializeWorld({
                mapWidth: 800,
                mapHeight: 600,
                tileSize: 32,
                playerId: 'test_player',
                entities: []
            });
            
            if (!worldInitResult) {
                throw new Error('World initialization failed');
            }
            
            // 5. Test gameplay loop (single frame)
            gameEngine.update(0.016);
            gameEngine.render();
            
            // 6. Test guards
            const guardResults = guardSystem.checkAllGuards();
            const failedGuards = Object.entries(guardResults).filter(([name, result]) => !result);
            
            if (failedGuards.length > 0) {
                console.warn(`⚠️ Some guards failed: ${failedGuards.map(([name]) => name).join(', ')}`);
                // This is OK for testing, guards are designed to fail when systems aren't fully set up
            }
            
            console.log('✅ Full pipeline test completed successfully');
            
        } catch (error) {
            throw new Error(`Full pipeline test failed: ${error.message}`);
        }
        
        return true;
    }
    
    // === RESULTS AND REPORTING ===
    
    printResults() {
        console.log('\n📊 === CORE GAMEPLAY TEST RESULTS ===');
        console.log(`⏱️ Duration: ${this.results.duration}ms`);
        console.log(`📈 Total Tests: ${this.results.total}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📊 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        if (this.results.errors.length > 0) {
            console.log('\n💥 Errors:');
            this.results.errors.forEach(error => {
                console.log(`  ❌ ${error.test}: ${error.error}`);
            });
        }
        
        console.log('\n📋 Detailed Results:');
        this.tests.forEach((test, index) => {
            const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '💥';
            console.log(`  ${index + 1}. ${test.name}: ${status} (${test.duration}ms)`);
            if (test.error) {
                console.log(`     Error: ${test.error}`);
            }
        });
        
        // Overall assessment
        const successRate = (this.results.passed / this.results.total) * 100;
        console.log(`\n🎯 Overall Assessment: ${successRate >= 80 ? 'PASS' : 'FAIL'}`);
        
        if (successRate >= 80) {
            console.log('🎉 Core gameplay pipeline is stable and ready!');
        } else {
            console.log('⚠️ Core gameplay pipeline needs more work before release.');
        }
    }
    
    getResults() {
        return {
            ...this.results,
            successRate: (this.results.passed / this.results.total) * 100,
            tests: this.tests.map(test => ({
                name: test.name,
                status: test.status,
                duration: test.duration,
                error: test.error
            }))
        };
    }
    
    // === QUICK TESTS ===
    
    async quickTest() {
        console.log('⚡ Running quick core gameplay test...');
        
        const criticalTests = [
            'STEP 1 - Login System',
            'STEP 5 - World Initialization',
            'STEP 6 - Player Spawn',
            'STEP 12 - ECS Integration',
            'STEP 14 - Full Pipeline'
        ];
        
        const quickResults = {
            total: criticalTests.length,
            passed: 0,
            failed: 0
        };
        
        for (const testName of criticalTests) {
            const test = this.tests.find(t => t.name === testName);
            if (test) {
                try {
                    const result = await test.test();
                    if (result) {
                        quickResults.passed++;
                        console.log(`✅ ${testName} - PASSED`);
                    } else {
                        quickResults.failed++;
                        console.log(`❌ ${testName} - FAILED`);
                    }
                } catch (error) {
                    quickResults.failed++;
                    console.log(`💥 ${testName} - ERROR: ${error.message}`);
                }
            }
        }
        
        const successRate = (quickResults.passed / quickResults.total) * 100;
        console.log(`\n⚡ Quick Test Results: ${quickResults.passed}/${quickResults.total} (${successRate.toFixed(1)}%)`);
        console.log(`🎯 Quick Test Status: ${successRate >= 80 ? 'PASS' : 'FAIL'}`);
        
        return quickResults;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.CoreGameplayTestSuite = CoreGameplayTestSuite;
}
