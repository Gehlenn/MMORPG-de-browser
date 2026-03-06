/**
 * Quest System Test Suite
 * Tests all quest functionality including generation, tracking, and completion
 * Version 0.2.1 - Quest System Integration
 */

import QuestSystem from './systems/QuestSystem.js';
import QuestTrackerUI from './ui/QuestTrackerUI.js';

class QuestSystemTestSuite {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
        
        // Mock dependencies
        this.mockGame = null;
        this.mockNetworkManager = null;
        this.questSystem = null;
        this.questTrackerUI = null;
    }
    
    async runAllTests() {
        console.log('🧪 Starting Quest System Test Suite...\n');
        
        // Setup mocks
        this.setupMocks();
        
        // Test quest system
        await this.testQuestSystemBasics();
        await this.testQuestGeneration();
        await this.testQuestProgress();
        await this.testQuestCompletion();
        await this.testQuestChains();
        await this.testQuestRewards();
        await this.testQuestTrackerUI();
        await this.testIntegration();
        
        // Show results
        this.showResults();
        
        return this.results;
    }
    
    setupMocks() {
        // Mock game object
        this.mockGame = {
            player: {
                id: 'test_player_123',
                name: 'TestPlayer',
                level: 25,
                gold: 1000,
                experience: 5000,
                skills: { blacksmithing: 3 },
                reputation: { merchants: 50 },
                inventory: [],
                
                gainExperience(amount) {
                    this.experience += amount;
                    console.log(`Player gained ${amount} XP`);
                },
                
                addToInventory(item) {
                    this.inventory.push(item);
                    console.log(`Added ${item.id} to inventory`);
                },
                
                addReputation(reputation) {
                    console.log(`Added reputation:`, reputation);
                },
                
                on(event, callback) {
                    console.log(`Player listening for ${event}`);
                }
            },
            
            entityManager: {
                on(event, callback) {
                    console.log(`EntityManager listening for ${event}`);
                }
            },
            
            updateUI() {
                console.log('UI updated');
            },
            
            on(event, callback) {
                console.log(`Game listening for ${event}`);
            }
        };
        
        // Mock network manager
        this.mockNetworkManager = {
            messageHandlers: new Map(),
            isConnected: false,
            playerId: 'test_player_123',
            
            registerHandler(type, handler) {
                this.messageHandlers.set(type, handler);
            },
            
            sendMessage(type, data) {
                console.log(`Mock sending: ${type}`, data);
            }
        };
        
        // Initialize quest system
        this.questSystem = new QuestSystem(this.mockGame, this.mockNetworkManager);
        this.questTrackerUI = new QuestTrackerUI(this.questSystem, this.mockGame);
    }
    
    async testQuestSystemBasics() {
        console.log('📋 Testing Quest System Basics...');
        
        await this.test('Quest System Initialization', async () => {
            return this.questSystem !== null &&
                   typeof this.questSystem.acceptQuest === 'function' &&
                   typeof this.questSystem.completeQuest === 'function' &&
                   typeof this.questSystem.abandonQuest === 'function' &&
                   typeof this.questSystem.trackQuest === 'function';
        });
        
        await this.test('Quest Types', async () => {
            const types = Object.keys(this.questSystem.questTypes);
            const expectedTypes = ['kill', 'collect', 'escort', 'explore', 'boss', 'craft', 'delivery'];
            
            return expectedTypes.every(type => types.includes(type));
        });
        
        await this.test('Quest States', async () => {
            const states = Object.keys(this.questSystem.questStates);
            const expectedStates = ['available', 'active', 'completed', 'failed', 'abandoned'];
            
            return expectedStates.every(state => states.includes(state));
        });
        
        await this.test('Quest Storage', async () => {
            return this.questSystem.activeQuests instanceof Map &&
                   this.questSystem.completedQuests instanceof Map &&
                   this.questSystem.availableQuests instanceof Map;
        });
    }
    
    async testQuestGeneration() {
        console.log('🎲 Testing Quest Generation...');
        
        await this.test('Template System', async () => {
            const templates = this.questSystem.questTemplates;
            const types = Object.keys(templates);
            
            return types.length > 0 && 
                   types.includes('kill') &&
                   types.includes('collect') &&
                   types.includes('explore');
        });
        
        await this.test('Quest Generation from Template', async () => {
            const quest = this.questSystem.generateQuest('kill', {
                monster: 'Goblin',
                amount: 5
            });
            
            return quest !== null &&
                   quest.type === 'kill' &&
                   quest.title.includes('Goblin') &&
                   Array.isArray(quest.objectives) &&
                   quest.objectives.length > 0;
        });
        
        await this.test('Objective Generation', async () => {
            const quest = this.questSystem.generateQuest('kill', {
                monster: 'Wolf',
                amount: 8
            });
            
            if (!quest || !quest.objectives || quest.objectives.length === 0) {
                return false;
            }
            
            const objective = quest.objectives[0];
            return objective.type === 'kill' &&
                   objective.target === 'Wolf' &&
                   objective.amount === 8 &&
                   objective.description.includes('Wolf');
        });
        
        await this.test('Reward Generation', async () => {
            const quest = this.questSystem.generateQuest('kill', {
                monster: 'Orc',
                amount: 3
            });
            
            return quest !== null &&
                   quest.rewards !== null &&
                   typeof quest.rewards.xp === 'number' &&
                   typeof quest.rewards.gold === 'number';
        });
        
        await this.test('Level-based Scaling', async () => {
            // Test with different player levels
            const lowLevelQuest = this.questSystem.generateQuest('kill', {
                monster: 'Goblin',
                amount: 5
            });
            
            this.mockGame.player.level = 50;
            const highLevelQuest = this.questSystem.generateQuest('kill', {
                monster: 'Dragon',
                amount: 1
            });
            
            this.mockGame.player.level = 25; // Reset
            
            return lowLevelQuest !== null &&
                   highLevelQuest !== null &&
                   highLevelQuest.rewards.xp > lowLevelQuest.rewards.xp;
        });
    }
    
    async testQuestProgress() {
        console.log('📈 Testing Quest Progress...');
        
        await this.test('Quest Acceptance', async () => {
            // Create a test quest
            const testQuest = {
                id: 'test_quest_1',
                title: 'Test Quest',
                type: 'kill',
                description: 'A test quest',
                objectives: [
                    { id: 'obj1', type: 'kill', target: 'goblin', amount: 5, description: 'Kill 5 goblins' }
                ],
                rewards: { xp: 100, gold: 50 },
                requirements: { level: { min: 1, max: 50 } }
            };
            
            this.questSystem.availableQuests.set('test_quest_1', testQuest);
            const result = this.questSystem.acceptQuest('test_quest_1');
            
            return result === true &&
                   this.questSystem.activeQuests.has('test_quest_1') &&
                   !this.questSystem.availableQuests.has('test_quest_1');
        });
        
        await this.test('Progress Tracking', async () => {
            const quest = this.questSystem.activeQuests.get('test_quest_1');
            if (!quest) return false;
            
            // Simulate killing a goblin
            const updated = this.questSystem.updateProgress('kill', 'goblin', 1);
            
            return updated === true &&
                   quest.progress['obj1'] === 1;
        });
        
        await this.test('Objective Completion', async () => {
            const quest = this.questSystem.activeQuests.get('test_quest_1');
            if (!quest) return false;
            
            // Kill remaining goblins
            this.questSystem.updateProgress('kill', 'goblin', 4);
            
            return quest.progress['obj1'] === 5;
        });
        
        await this.test('Quest Tracking', async () => {
            const result = this.questSystem.trackQuest('test_quest_1');
            
            return result === true &&
                   this.questSystem.trackedQuestId === 'test_quest_1';
        });
        
        await this.test('Quest Abandonment', async () => {
            // Create another test quest to abandon
            const abandonQuest = {
                id: 'test_quest_2',
                title: 'Abandon Test',
                type: 'collect',
                description: 'A test quest to abandon',
                objectives: [
                    { id: 'obj1', type: 'collect', target: 'herb', amount: 10, description: 'Collect 10 herbs' }
                ],
                rewards: { xp: 50, gold: 25 },
                requirements: { level: { min: 1, max: 50 } }
            };
            
            this.questSystem.availableQuests.set('test_quest_2', abandonQuest);
            this.questSystem.acceptQuest('test_quest_2');
            
            const result = this.questSystem.abandonQuest('test_quest_2');
            
            return result === true &&
                   !this.questSystem.activeQuests.has('test_quest_2');
        });
    }
    
    async testQuestCompletion() {
        console.log('✅ Testing Quest Completion...');
        
        await this.test('Quest Completion Detection', async () => {
            const quest = this.questSystem.activeQuests.get('test_quest_1');
            if (!quest) return false;
            
            const isCompleted = this.questSystem.areObjectivesCompleted(quest);
            return isCompleted === true;
        });
        
        await this.test('Quest Completion Process', async () => {
            const result = this.questSystem.completeQuest('test_quest_1');
            
            return result === true &&
                   !this.questSystem.activeQuests.has('test_quest_1') &&
                   this.questSystem.completedQuests.has('test_quest_1');
        });
        
        await this.test('Reward Awarding', async () => {
            const quest = this.questSystem.completedQuests.get('test_quest_1');
            if (!quest) return false;
            
            // Check if rewards were awarded
            return this.mockGame.player.experience > 5000; // Should have gained 100 XP
        });
        
        await this.test('Quest State Management', async () => {
            const quest = this.questSystem.completedQuests.get('test_quest_1');
            
            return quest !== null &&
                   quest.state === 'completed' &&
                   quest.completedAt !== undefined;
        });
    }
    
    async testQuestChains() {
        console.log('⛓️ Testing Quest Chains...');
        
        await this.test('Chain Creation', async () => {
            const chainQuests = [
                'kill_goblins',
                'find_goblin_camp',
                'defeat_goblin_king'
            ];
            
            this.questSystem.createQuestChain('goblin_threat', chainQuests);
            
            return this.questSystem.questChains.has('goblin_threat');
        });
        
        await this.test('Chain Progression', async () => {
            const chain = this.questSystem.questChains.get('goblin_threat');
            
            // Simulate completing first quest
            this.questSystem.checkQuestChain('kill_goblins');
            
            return chain.currentStep === 1;
        });
        
        await this.test('Chain Completion', async () => {
            const chain = this.questSystem.questChains.get('goblin_threat');
            
            // Simulate completing all quests
            chain.currentStep = 2;
            this.questSystem.checkQuestChain('defeat_goblin_king');
            
            return chain.completed === true;
        });
    }
    
    async testQuestRewards() {
        console.log('🎁 Testing Quest Rewards...');
        
        await this.test('XP Rewards', async () => {
            const initialXP = this.mockGame.player.experience;
            
            const testQuest = {
                id: 'reward_test',
                title: 'Reward Test',
                type: 'kill',
                description: 'Test rewards',
                objectives: [{ id: 'obj1', type: 'kill', target: 'rat', amount: 1, description: 'Kill 1 rat' }],
                rewards: { xp: 250, gold: 100 },
                requirements: { level: { min: 1, max: 50 } }
            };
            
            this.questSystem.availableQuests.set('reward_test', testQuest);
            this.questSystem.acceptQuest('reward_test');
            this.questSystem.completeQuest('reward_test');
            
            return this.mockGame.player.experience === initialXP + 250;
        });
        
        await this.test('Gold Rewards', async () => {
            const initialGold = this.mockGame.player.gold;
            
            const testQuest = {
                id: 'gold_test',
                title: 'Gold Test',
                type: 'collect',
                description: 'Test gold rewards',
                objectives: [{ id: 'obj1', type: 'collect', target: 'stone', amount: 1, description: 'Collect 1 stone' }],
                rewards: { xp: 50, gold: 200 },
                requirements: { level: { min: 1, max: 50 } }
            };
            
            this.questSystem.availableQuests.set('gold_test', testQuest);
            this.questSystem.acceptQuest('gold_test');
            this.questSystem.completeQuest('gold_test');
            
            return this.mockGame.player.gold === initialGold + 200;
        });
        
        await this.test('Item Rewards', async () => {
            const initialInventorySize = this.mockGame.player.inventory.length;
            
            const testQuest = {
                id: 'item_test',
                title: 'Item Test',
                type: 'explore',
                description: 'Test item rewards',
                objectives: [{ id: 'obj1', type: 'explore', target: 'area', amount: 1, description: 'Explore area' }],
                rewards: { xp: 75, gold: 50, items: ['health_potion', 'mana_potion'] },
                requirements: { level: { min: 1, max: 50 } }
            };
            
            this.questSystem.availableQuests.set('item_test', testQuest);
            this.questSystem.acceptQuest('item_test');
            this.questSystem.completeQuest('item_test');
            
            return this.mockGame.player.inventory.length === initialInventorySize + 2;
        });
    }
    
    async testQuestTrackerUI() {
        console.log('🖥️ Testing Quest Tracker UI...');
        
        await this.test('UI Initialization', async () => {
            return this.questTrackerUI !== null &&
                   this.questTrackerUI.trackerContainer !== null &&
                   this.questTrackerUI.isVisible() === true;
        });
        
        await this.test('Quest Display', async () => {
            // Create a test quest
            const testQuest = {
                id: 'ui_test',
                title: 'UI Test Quest',
                type: 'kill',
                description: 'A quest for UI testing',
                objectives: [
                    { id: 'obj1', type: 'kill', target: 'monster', amount: 3, description: 'Kill 3 monsters' }
                ],
                progress: { obj1: 1 },
                rewards: { xp: 100, gold: 50 }
            };
            
            this.questSystem.activeQuests.set('ui_test', testQuest);
            this.questTrackerUI.updateTracker();
            
            const questElement = this.questTrackerUI.questList.querySelector('[data-quest-id="ui_test"]');
            return questElement !== null;
        });
        
        await this.test('Progress Update Display', async () => {
            const quest = this.questSystem.activeQuests.get('ui_test');
            if (!quest) return false;
            
            // Update progress
            this.questSystem.updateProgress('kill', 'monster', 1);
            
            const questElement = this.questTrackerUI.questList.querySelector('[data-quest-id="ui_test"]');
            const progressText = questElement.querySelector('.quest-progress-text');
            
            return progressText && progressText.textContent.includes('66'); // 2/3 = 66%
        });
        
        await this.test('UI Controls', async () => {
            // Test minimize/maximize
            const initialState = this.questTrackerUI.minimized;
            this.questTrackerUI.toggleMinimized();
            const toggledState = this.questTrackerUI.minimized;
            
            return initialState !== toggledState;
        });
    }
    
    async testIntegration() {
        console.log('🔗 Testing System Integration...');
        
        await this.test('Game Event Integration', async () => {
            let eventTriggered = false;
            
            // Mock event listener
            this.mockGame.entityManager.emit = (event, data) => {
                if (event === 'entityKilled') {
                    eventTriggered = true;
                }
            };
            
            // Create a quest that should respond to entity kills
            const integrationQuest = {
                id: 'integration_test',
                title: 'Integration Test',
                type: 'kill',
                description: 'Test integration',
                objectives: [
                    { id: 'obj1', type: 'kill', target: 'integration_monster', amount: 1, description: 'Kill integration monster' }
                ],
                progress: { obj1: 0 },
                rewards: { xp: 100, gold: 50 }
            };
            
            this.questSystem.activeQuests.set('integration_test', integrationQuest);
            
            // Simulate entity kill
            this.questSystem.onEntityKilled({ type: 'monster', monsterType: 'integration_monster' });
            
            return eventTriggered && integrationQuest.progress.obj1 === 1;
        });
        
        await this.test('Network Integration', async () => {
            let messageSent = false;
            
            this.mockNetworkManager.sendMessage = (type, data) => {
                if (type === 'quest_accept' || type === 'quest_complete') {
                    messageSent = true;
                }
            };
            
            const testQuest = {
                id: 'network_test',
                title: 'Network Test',
                type: 'collect',
                description: 'Test network integration',
                objectives: [{ id: 'obj1', type: 'collect', target: 'item', amount: 1, description: 'Collect item' }],
                rewards: { xp: 50, gold: 25 },
                requirements: { level: { min: 1, max: 50 } }
            };
            
            this.questSystem.availableQuests.set('network_test', testQuest);
            this.questSystem.acceptQuest('network_test');
            this.questSystem.completeQuest('network_test');
            
            return messageSent;
        });
        
        await this.test('Performance Test', async () => {
            const startTime = performance.now();
            
            // Generate multiple quests
            for (let i = 0; i < 100; i++) {
                const quest = this.questSystem.generateQuest('kill', {
                    monster: `Monster_${i}`,
                    amount: Math.floor(Math.random() * 10) + 1
                });
                
                if (quest) {
                    this.questSystem.availableQuests.set(`perf_test_${i}`, quest);
                }
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            return duration < 1000; // Should complete in less than 1 second
        });
    }
    
    async test(testName, testFunction) {
        try {
            const result = await testFunction();
            if (result) {
                this.passed++;
                this.results.push({ name: testName, status: 'PASS' });
                console.log(`  ✅ ${testName}`);
            } else {
                this.failed++;
                this.results.push({ name: testName, status: 'FAIL', reason: 'Test returned false' });
                console.log(`  ❌ ${testName} - Test returned false`);
            }
        } catch (error) {
            this.failed++;
            this.results.push({ name: testName, status: 'ERROR', reason: error.message });
            console.log(`  ❌ ${testName} - ${error.message}`);
        }
    }
    
    showResults() {
        console.log('\n📊 Quest System Test Results:');
        console.log(`  Total Tests: ${this.passed + this.failed}`);
        console.log(`  ✅ Passed: ${this.passed}`);
        console.log(`  ❌ Failed: ${this.failed}`);
        console.log(`  Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        
        if (this.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => r.status !== 'PASS').forEach(result => {
                console.log(`  - ${result.name}: ${result.reason || 'Unknown error'}`);
            });
        }
        
        if (this.passed === this.passed + this.failed) {
            console.log('\n🎉 All quest system tests passed! The system is working correctly.');
            console.log('\n🚀 Quest System Features Verified:');
            console.log('  📋 Quest generation and management');
            console.log('  🎲 Procedural quest templates');
            console.log('  📈 Progress tracking system');
            console.log('  ✅ Quest completion and rewards');
            console.log('  ⛓️ Quest chain support');
            console.log('  🎁 Comprehensive reward system');
            console.log('  🖥️ Interactive Quest Tracker UI');
            console.log('  🔗 Full system integration');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the quest system implementation.');
        }
        
        // Cleanup
        this.cleanup();
    }
    
    cleanup() {
        if (this.questSystem) {
            this.questSystem.cleanup();
        }
        
        if (this.questTrackerUI) {
            this.questTrackerUI.cleanup();
        }
    }
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    window.runQuestTests = async () => {
        const tester = new QuestSystemTestSuite();
        const results = await tester.runAllTests();
        return results;
    };
    
    console.log('🧪 Quest System tests loaded. Run window.runQuestTests() to execute all tests.');
}

export default QuestSystemTestSuite;
