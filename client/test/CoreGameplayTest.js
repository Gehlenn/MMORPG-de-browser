// === STEP 11: CORE GAMEPLAY TESTING ===

class CoreGameplayTest {
    constructor() {
        this.testResults = {
            login: false,
            characterCreation: false,
            characterSelection: false,
            worldEntry: false,
            playerSpawn: false,
            mobSpawn: false,
            inputSystem: false,
            renderSystem: false,
            gameLoop: false,
            ecsIntegration: false
        };
        
        this.testStartTime = Date.now();
        console.log('🧪 Core Gameplay Test initialized');
    }
    
    async runFullTest() {
        console.log('🚀 Starting Core Gameplay Test...');
        
        try {
            // Test 1: Login System
            await this.testLoginSystem();
            
            // Test 2: Character Creation
            await this.testCharacterCreation();
            
            // Test 3: Character Selection
            await this.testCharacterSelection();
            
            // Test 4: World Entry
            await this.testWorldEntry();
            
            // Test 5: Player Spawn
            await this.testPlayerSpawn();
            
            // Test 6: Mob Spawn
            await this.testMobSpawn();
            
            // Test 7: Input System
            await this.testInputSystem();
            
            // Test 8: Render System
            await this.testRenderSystem();
            
            // Test 9: Game Loop
            await this.testGameLoop();
            
            // Test 10: ECS Integration
            await this.testECSIntegration();
            
            // Generate final report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Core Gameplay Test failed:', error);
            this.testResults.error = error;
            this.generateTestReport();
        }
    }
    
    async testLoginSystem() {
        console.log('🔑 Testing Login System...');
        
        try {
            // Test if LoginManager exists
            if (!window.loginManager) {
                throw new Error('LoginManager not found');
            }
            
            // Test if SessionManager exists
            if (!window.loginManager.sessionManager) {
                throw new Error('SessionManager not found');
            }
            
            // Test login UI elements
            const loginScreen = document.getElementById('loginScreen');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const loginBtn = document.getElementById('loginBtn');
            
            if (!loginScreen || !usernameInput || !passwordInput || !loginBtn) {
                throw new Error('Login UI elements missing');
            }
            
            // Test login functionality
            usernameInput.value = 'testuser';
            passwordInput.value = 'testpass';
            
            // Simulate login
            window.loginManager.handleLogin();
            
            // Wait for login completion
            await this.waitForCondition(() => 
                window.loginManager.sessionManager.getCurrentUser() !== null, 3000
            );
            
            this.testResults.login = true;
            console.log('✅ Login System test passed');
            
        } catch (error) {
            console.error('❌ Login System test failed:', error);
            this.testResults.login = false;
        }
    }
    
    async testCharacterCreation() {
        console.log('👤 Testing Character Creation...');
        
        try {
            // Test character creation UI
            const characterScreen = document.getElementById('characterScreen');
            const createCharacterBtn = document.getElementById('createCharacterBtn');
            
            if (!characterScreen || !createCharacterBtn) {
                throw new Error('Character creation UI elements missing');
            }
            
            // Test character creation functionality
            window.loginManager.handleCreateCharacter();
            
            // Wait for modal to appear
            await this.waitForCondition(() => 
                document.querySelector('.modal-overlay') !== null, 2000
            );
            
            // Fill character form
            const nameInput = document.getElementById('characterName');
            if (nameInput) {
                nameInput.value = 'TestCharacter';
            }
            
            // Submit character creation
            const confirmBtn = document.getElementById('confirmCreateCharacter');
            if (confirmBtn) {
                confirmBtn.click();
            }
            
            // Wait for character creation completion
            await this.waitForCondition(() => 
                !document.querySelector('.modal-overlay'), 3000
            );
            
            this.testResults.characterCreation = true;
            console.log('✅ Character Creation test passed');
            
        } catch (error) {
            console.error('❌ Character Creation test failed:', error);
            this.testResults.characterCreation = false;
        }
    }
    
    async testCharacterSelection() {
        console.log('👥 Testing Character Selection...');
        
        try {
            // Test character list
            const characterList = document.getElementById('characterList');
            if (!characterList) {
                throw new Error('Character list element missing');
            }
            
            // Wait for characters to load
            await this.waitForCondition(() => 
                characterList.children.length > 0 && 
                !characterList.querySelector('.no-characters'), 3000
            );
            
            // Select first character
            const firstCharacter = characterList.querySelector('.character-slot');
            if (firstCharacter) {
                firstCharacter.click();
            }
            
            this.testResults.characterSelection = true;
            console.log('✅ Character Selection test passed');
            
        } catch (error) {
            console.error('❌ Character Selection test failed:', error);
            this.testResults.characterSelection = false;
        }
    }
    
    async testWorldEntry() {
        console.log('🌍 Testing World Entry...');
        
        try {
            // Test enter world button
            const enterWorldBtn = document.getElementById('enterWorldBtn');
            if (!enterWorldBtn) {
                throw new Error('Enter world button missing');
            }
            
            // Test world entry functionality
            enterWorldBtn.click();
            
            // Wait for world initialization
            await this.waitForCondition(() => 
                document.getElementById('gameScreen').style.display === 'block', 3000
            );
            
            this.testResults.worldEntry = true;
            console.log('✅ World Entry test passed');
            
        } catch (error) {
            console.error('❌ World Entry test failed:', error);
            this.testResults.worldEntry = false;
        }
    }
    
    async testPlayerSpawn() {
        console.log('🦸 Testing Player Spawn...');
        
        try {
            // Test if GameplayEngine exists
            if (!window.gameplayEngine) {
                throw new Error('GameplayEngine not found');
            }
            
            // Wait for player to spawn
            await this.waitForCondition(() => 
                window.gameplayEngine.player !== null, 3000
            );
            
            const player = window.gameplayEngine.player;
            if (!player) {
                throw new Error('Player not spawned');
            }
            
            // Test player properties
            if (!player.x || !player.y || !player.size || !player.health) {
                throw new Error('Player properties missing');
            }
            
            this.testResults.playerSpawn = true;
            console.log('✅ Player Spawn test passed');
            
        } catch (error) {
            console.error('❌ Player Spawn test failed:', error);
            this.testResults.playerSpawn = false;
        }
    }
    
    async testMobSpawn() {
        console.log('👾 Testing Mob Spawn...');
        
        try {
            // Wait for mobs to spawn
            await this.waitForCondition(() => 
                window.gameplayEngine.mobs && 
                window.gameplayEngine.mobs.length > 0, 3000
            );
            
            const mobs = window.gameplayEngine.mobs;
            if (!mobs || mobs.length === 0) {
                throw new Error('No mobs spawned');
            }
            
            // Test mob properties
            mobs.forEach((mob, index) => {
                if (!mob.id || !mob.x || !mob.y || !mob.aiState) {
                    throw new Error(`Mob ${index} properties missing`);
                }
            });
            
            this.testResults.mobSpawn = true;
            console.log('✅ Mob Spawn test passed');
            
        } catch (error) {
            console.error('❌ Mob Spawn test failed:', error);
            this.testResults.mobSpawn = false;
        }
    }
    
    async testInputSystem() {
        console.log('⌨️ Testing Input System...');
        
        try {
            // Test input system
            if (!window.gameplayEngine.keys) {
                throw new Error('Input system not initialized');
            }
            
            // Test keyboard input
            const testKeys = ['w', 'a', 's', 'd'];
            testKeys.forEach(key => {
                window.gameplayEngine.keys[key] = true;
            });
            
            // Wait for input processing
            await this.waitForCondition(() => {
                const player = window.gameplayEngine.player;
                return player && (player.x !== 400 || player.y !== 300);
            }, 2000);
            
            // Clean up test keys
            testKeys.forEach(key => {
                window.gameplayEngine.keys[key] = false;
            });
            
            this.testResults.inputSystem = true;
            console.log('✅ Input System test passed');
            
        } catch (error) {
            console.error('❌ Input System test failed:', error);
            this.testResults.inputSystem = false;
        }
    }
    
    async testRenderSystem() {
        console.log('🎨 Testing Render System...');
        
        try {
            // Test canvas
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas ? canvas.getContext('2d') : null;
            
            if (!canvas || !ctx) {
                throw new Error('Canvas or context not available');
            }
            
            // Test render method
            if (typeof window.gameplayEngine.safeRenderEntities !== 'function') {
                throw new Error('Safe render method not available');
            }
            
            // Call render method
            window.gameplayEngine.safeRenderEntities();
            
            this.testResults.renderSystem = true;
            console.log('✅ Render System test passed');
            
        } catch (error) {
            console.error('❌ Render System test failed:', error);
            this.testResults.renderSystem = false;
        }
    }
    
    async testGameLoop() {
        console.log('🔄 Testing Game Loop...');
        
        try {
            // Test game loop state
            if (!window.gameplayEngine.isRunning) {
                throw new Error('Game loop not running');
            }
            
            // Test FPS
            const fps = window.gameplayEngine.getFPS();
            if (!fps || fps < 30) {
                throw new Error('Game loop FPS too low');
            }
            
            this.testResults.gameLoop = true;
            console.log('✅ Game Loop test passed');
            
        } catch (error) {
            console.error('❌ Game Loop test failed:', error);
            this.testResults.gameLoop = false;
        }
    }
    
    async testECSIntegration() {
        console.log('🗄️ Testing ECS Integration...');
        
        try {
            // Test ECS Manager
            if (!window.gameplayEngine.ecsManager) {
                throw new Error('ECS Manager not available');
            }
            
            // Test entity creation
            const entities = window.gameplayEngine.ecsManager.getEntities();
            if (!entities || entities.length === 0) {
                throw new Error('No ECS entities found');
            }
            
            // Test components
            entities.forEach((entity, index) => {
                const position = entity.getComponent('position');
                const health = entity.getComponent('health');
                const movement = entity.getComponent('movement');
                const render = entity.getComponent('render');
                
                if (!position || !health || !movement || !render) {
                    throw new Error(`Entity ${index} missing components`);
                }
            });
            
            this.testResults.ecsIntegration = true;
            console.log('✅ ECS Integration test passed');
            
        } catch (error) {
            console.error('❌ ECS Integration test failed:', error);
            this.testResults.ecsIntegration = false;
        }
    }
    
    waitForCondition(condition, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkCondition = () => {
                if (condition()) {
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Condition timeout'));
                } else {
                    setTimeout(checkCondition, 100);
                }
            };
            
            checkCondition();
        });
    }
    
    generateTestReport() {
        const testDuration = Date.now() - this.testStartTime;
        const passedTests = Object.values(this.testResults).filter(result => result).length;
        const totalTests = Object.keys(this.testResults).length;
        const successRate = (passedTests / totalTests * 100).toFixed(1);
        
        const report = {
            timestamp: new Date().toISOString(),
            duration: testDuration,
            totalTests: totalTests,
            passedTests: passedTests,
            successRate: successRate,
            results: this.testResults,
            status: successRate >= 80 ? 'PASSED' : 'FAILED'
        };
        
        console.log('\n📊 === CORE GAMEPLAY TEST REPORT ===');
        console.log(`📅 Timestamp: ${report.timestamp}`);
        console.log(`⏱️ Duration: ${report.duration}ms`);
        console.log(`📈 Total Tests: ${report.totalTests}`);
        console.log(`✅ Passed Tests: ${report.passedTests}`);
        console.log(`📊 Success Rate: ${report.successRate}%`);
        console.log(`🎯 Status: ${report.status}`);
        console.log('\n📋 Detailed Results:');
        
        Object.entries(report.results).forEach(([test, result]) => {
            const status = result ? '✅ PASS' : '❌ FAIL';
            console.log(`  ${test}: ${status}`);
        });
        
        // Save report to window for debugging
        window.coreGameplayTestReport = report;
        
        return report;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.CoreGameplayTest = CoreGameplayTest;
}
