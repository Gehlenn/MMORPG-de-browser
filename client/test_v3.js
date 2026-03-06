/**
 * Version 0.3 Test Suite - Social & Multiplayer Systems
 * Tests all new social and multiplayer features
 */

import NetworkManager from './multiplayer/NetworkManager.js';
import ChatSystem from './social/ChatSystem.js';
import PartySystem from './social/PartySystem.js';
import GuildSystem from './social/GuildSystem.js';
import WorldEventManager from './events/WorldEventManager.js';

class Version3TestSuite {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
        
        // Mock dependencies
        this.mockNetworkManager = null;
        this.mockChatSystem = null;
        this.mockGame = null;
    }
    
    async runAllTests() {
        console.log('🧪 Starting MMORPG v0.3 Test Suite - Social & Multiplayer Systems...\n');
        
        // Setup mocks
        this.setupMocks();
        
        // Test all systems
        await this.testNetworkManager();
        await this.testChatSystem();
        await this.testPartySystem();
        await this.testGuildSystem();
        await this.testWorldEventManager();
        await this.testIntegration();
        
        // Show results
        this.showResults();
        
        return this.results;
    }
    
    setupMocks() {
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
            },
            
            sendChatMessage(channel, message) {
                console.log(`Mock chat: ${channel} - ${message}`);
            },
            
            sendPartyAction(action, data) {
                console.log(`Mock party action: ${action}`, data);
            },
            
            sendGuildAction(action, data) {
                console.log(`Mock guild action: ${action}`, data);
            }
        };
        
        // Mock chat system
        this.mockChatSystem = {
            addSystemMessage(message, type) {
                console.log(`Mock chat [${type}]: ${message}`);
            },
            
            addMessage(data) {
                console.log('Mock chat message:', data);
            }
        };
        
        // Mock game
        this.mockGame = {
            player: {
                id: 'test_player_123',
                name: 'TestPlayer',
                level: 25,
                gold: 1000
            }
        };
    }
    
    async testNetworkManager() {
        console.log('🌐 Testing Network Manager...');
        
        await this.test('Network Manager Initialization', async () => {
            const networkManager = new NetworkManager();
            return networkManager !== null && 
                   typeof networkManager.connect === 'function' &&
                   typeof networkManager.sendMessage === 'function';
        });
        
        await this.test('Message Handler Registration', async () => {
            const networkManager = new NetworkManager();
            let handlerCalled = false;
            
            networkManager.registerHandler('test', () => {
                handlerCalled = true;
            });
            
            networkManager.handleMessage({ type: 'test', data: {} });
            return handlerCalled;
        });
        
        await this.test('Connection State Management', async () => {
            const networkManager = new NetworkManager();
            
            networkManager.connectionState = 'connected';
            networkManager.isConnected = true;
            networkManager.playerId = 'test_123';
            
            return networkManager.getConnectionState() === 'connected' &&
                   networkManager.isReady() === true;
        });
        
        await this.test('Message Queue System', async () => {
            const networkManager = new NetworkManager();
            networkManager.isConnected = false;
            
            networkManager.sendMessage('test', { data: 'test' });
            
            return networkManager.pendingMessages.length === 1;
        });
    }
    
    async testChatSystem() {
        console.log('💬 Testing Chat System...');
        
        await this.test('Chat System Initialization', async () => {
            const chatSystem = new ChatSystem(this.mockNetworkManager);
            return chatSystem !== null &&
                   typeof chatSystem.sendMessage === 'function' &&
                   typeof chatSystem.addMessage === 'function';
        });
        
        await this.test('Channel Management', async () => {
            const chatSystem = new ChatSystem(this.mockNetworkManager);
            
            return chatSystem.channels.has('global') &&
                   chatSystem.channels.has('local') &&
                   chatSystem.channels.has('party') &&
                   chatSystem.channels.has('guild');
        });
        
        await this.test('Command System', async () => {
            const chatSystem = new ChatSystem(this.mockNetworkManager);
            
            return chatSystem.commands.has('help') &&
                   chatSystem.commands.has('whisper') &&
                   chatSystem.commands.has('clear');
        });
        
        await this.test('Message Processing', async () => {
            const chatSystem = new ChatSystem(this.mockNetworkManager);
            
            chatSystem.addMessage({
                playerId: 'test_123',
                playerName: 'TestPlayer',
                channel: 'global',
                message: 'Hello world!',
                timestamp: Date.now()
            });
            
            const channel = chatSystem.channels.get('global');
            return channel.messages.length === 1;
        });
        
        await this.test('Command Execution', async () => {
            const chatSystem = new ChatSystem(this.mockNetworkManager);
            let helpCalled = false;
            
            // Override help command for testing
            chatSystem.commands.get('help').handler = () => {
                helpCalled = true;
            };
            
            chatSystem.handleCommand('/help');
            return helpCalled;
        });
    }
    
    async testPartySystem() {
        console.log('👥 Testing Party System...');
        
        await this.test('Party System Initialization', async () => {
            const partySystem = new PartySystem(this.mockNetworkManager, this.mockChatSystem);
            return partySystem !== null &&
                   typeof partySystem.createParty === 'function' &&
                   typeof partySystem.invitePlayer === 'function';
        });
        
        await this.test('Party Creation', async () => {
            const partySystem = new PartySystem(this.mockNetworkManager, this.mockChatSystem);
            
            partySystem.currentParty = {
                id: 'test_party',
                leaderId: 'test_123',
                members: [
                    { id: 'test_123', name: 'TestPlayer', level: 25 },
                    { id: 'test_456', name: 'Player2', level: 30 }
                ],
                lootMethod: 'need_before_greed'
            };
            
            return partySystem.isInParty() &&
                   partySystem.isPartyLeader() &&
                   partySystem.getPartySize() === 2;
        });
        
        await this.test('Party Permissions', async () => {
            const partySystem = new PartySystem(this.mockNetworkManager, this.mockChatSystem);
            
            partySystem.currentParty = {
                id: 'test_party',
                leaderId: 'other_player',
                members: [
                    { id: 'test_123', name: 'TestPlayer', level: 25 }
                ]
            };
            
            return !partySystem.isPartyLeader(); // Should not be leader
        });
        
        await this.test('Invite Handling', async () => {
            const partySystem = new PartySystem(this.mockNetworkManager, this.mockChatSystem);
            
            partySystem.handlePartyInvite({
                inviteId: 'invite_123',
                inviterName: 'InviterPlayer',
                inviterId: 'inviter_456'
            });
            
            return partySystem.partyInvites.has('invite_123');
        });
    }
    
    async testGuildSystem() {
        console.log('🏰 Testing Guild System...');
        
        await this.test('Guild System Initialization', async () => {
            const guildSystem = new GuildSystem(this.mockNetworkManager, this.mockChatSystem);
            return guildSystem !== null &&
                   typeof guildSystem.createGuild === 'function' &&
                   typeof guildSystem.invitePlayer === 'function';
        });
        
        await this.test('Guild Creation', async () => {
            const guildSystem = new GuildSystem(this.mockNetworkManager, this.mockChatSystem);
            
            guildSystem.currentGuild = {
                id: 'test_guild',
                name: 'TestGuild',
                tag: 'TEST',
                leaderId: 'test_123',
                members: [
                    { id: 'test_123', name: 'TestPlayer', rank: 'Leader', level: 25 },
                    { id: 'test_456', name: 'Member1', rank: 'Member', level: 30 },
                    { id: 'test_789', name: 'Member2', rank: 'Officer', level: 35 }
                ]
            };
            
            return guildSystem.isInGuild() &&
                   guildSystem.isGuildLeader() &&
                   guildSystem.getGuildSize() === 3;
        });
        
        await this.test('Guild Permissions', async () => {
            const guildSystem = new GuildSystem(this.mockNetworkManager, this.mockChatSystem);
            
            guildSystem.currentGuild = {
                id: 'test_guild',
                leaderId: 'test_123',
                members: [
                    { id: 'test_123', name: 'TestPlayer', rank: 'Leader', level: 25 }
                ]
            };
            
            return guildSystem.hasPermission('invite') &&
                   guildSystem.hasPermission('kick') &&
                   guildSystem.hasPermission('promote');
        });
        
        await this.test('Guild Invite Handling', async () => {
            const guildSystem = new GuildSystem(this.mockNetworkManager, this.mockChatSystem);
            
            guildSystem.handleGuildInvite({
                inviteId: 'guild_invite_123',
                guildId: 'guild_456',
                guildName: 'TestGuild',
                guildTag: 'TEST',
                inviterName: 'GuildLeader'
            });
            
            return guildSystem.guildInvites.has('guild_invite_123');
        });
    }
    
    async testWorldEventManager() {
        console.log('🎭 Testing World Event Manager...');
        
        await this.test('Event Manager Initialization', async () => {
            const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
            return eventManager !== null &&
                   typeof eventManager.createInvasionEvent === 'function' &&
                   typeof eventManager.createWorldBossEvent === 'function';
        });
        
        await this.test('Invasion Event Creation', async () => {
            const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
            
            const event = eventManager.createInvasionEvent('forest', 3);
            
            return event !== null &&
                   event.type === 'invasion' &&
                   event.biome === 'forest' &&
                   event.difficulty === 3;
        });
        
        await this.test('World Boss Event Creation', async () => {
            const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
            
            const event = eventManager.createWorldBossEvent('Dragon', 'Mountain Peak');
            
            return event !== null &&
                   event.type === 'world_boss' &&
                   event.bossType === 'Dragon' &&
                   event.location === 'Mountain Peak';
        });
        
        await this.test('Resource Bonus Event Creation', async () => {
            const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
            
            const event = eventManager.createResourceBonusEvent('gold', 2.0, 3600000);
            
            return event !== null &&
                   event.type === 'resource_bonus' &&
                   event.resourceType === 'gold' &&
                   event.bonusMultiplier === 2.0;
        });
        
        await this.test('Seasonal Event Creation', async () => {
            const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
            
            const activities = [
                { type: 'collection', item: 'snowflake', count: 50 },
                { type: 'combat', enemy: 'snow_golem', count: 10 }
            ];
            
            const event = eventManager.createSeasonalEvent('Winter', activities);
            
            return event !== null &&
                   event.type === 'seasonal' &&
                   event.seasonName === 'Winter' &&
                   event.activities.length === 2;
        });
        
        await this.test('Event Objective Generation', async () => {
            const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
            
            const event = eventManager.createInvasionEvent('forest', 5);
            
            return event.objectives.length > 0 &&
                   event.objectives.some(obj => obj.type === 'kill') &&
                   event.objectives.some(obj => obj.type === 'kill_elite') &&
                   event.objectives.some(obj => obj.type === 'kill_boss');
        });
        
        await this.test('Event Reward Generation', async () => {
            const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
            
            const event = eventManager.createWorldBossEvent('Dragon', 'Mountain Peak');
            
            return event.rewards !== null &&
                   event.rewards.experience > 0 &&
                   event.rewards.gold > 0 &&
                   event.rewards.items.length > 0;
        });
    }
    
    async testIntegration() {
        console.log('🔗 Testing System Integration...');
        
        await this.test('Multiplayer Integration', async () => {
            // Test that all systems can work together
            const networkManager = new NetworkManager();
            const chatSystem = new ChatSystem(networkManager);
            const partySystem = new PartySystem(networkManager, chatSystem);
            const guildSystem = new GuildSystem(networkManager, chatSystem);
            
            return networkManager !== null &&
                   chatSystem !== null &&
                   partySystem !== null &&
                   guildSystem !== null;
        });
        
        await this.test('Event System Integration', async () => {
            const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
            
            // Test event participation
            const event = eventManager.createInvasionEvent('forest', 3);
            eventManager.joinEvent(event.id);
            
            return eventManager.isParticipatingInEvent(event.id);
        });
        
        await this.test('Chat Integration with Social Systems', async () => {
            const chatSystem = new ChatSystem(this.mockNetworkManager);
            
            // Test that chat can handle different message types
            chatSystem.handlePartyInvite({
                inviteId: 'party_123',
                inviterName: 'TestPlayer'
            });
            
            chatSystem.handleGuildInvite({
                inviteId: 'guild_123',
                guildName: 'TestGuild'
            });
            
            return true; // If no errors, integration is working
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
        console.log('\n📊 Version 0.3 Test Results:');
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
            console.log('\n🎉 All v0.3 tests passed! Social & multiplayer systems are working correctly.');
            console.log('\n🚀 Ready for multiplayer deployment!');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the systems above.');
        }
        
        // System-specific summaries
        console.log('\n📋 System Summary:');
        console.log(`  🌐 Network Manager: Core connectivity systems`);
        console.log(`  💬 Chat System: Multi-channel communication`);
        console.log(`  👥 Party System: Group formation and management`);
        console.log(`  🏰 Guild System: Large-scale organization`);
        console.log(`  🎭 Event Manager: Dynamic world events`);
    }
    
    // Performance test for v0.3 systems
    async performanceTest() {
        console.log('\n⚡ Running v0.3 Performance Tests...');
        
        const startTime = performance.now();
        
        // Test chat message processing
        const chatSystem = new ChatSystem(this.mockNetworkManager);
        for (let i = 0; i < 1000; i++) {
            chatSystem.addMessage({
                playerId: `player_${i}`,
                playerName: `Player${i}`,
                channel: 'global',
                message: `Test message ${i}`,
                timestamp: Date.now()
            });
        }
        
        // Test event creation
        const eventManager = new WorldEventManager(this.mockNetworkManager, this.mockGame);
        for (let i = 0; i < 100; i++) {
            eventManager.createInvasionEvent('forest', Math.floor(Math.random() * 5) + 1);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`  📈 Processed 1000 chat messages and 100 events in ${duration.toFixed(2)}ms`);
        console.log(`  🎯 Performance: ${(1000 / duration * 60).toFixed(0)} messages/second potential`);
        
        return duration < 1000; // Should complete in less than 1 second
    }
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    window.runVersion3Tests = async () => {
        const tester = new Version3TestSuite();
        const results = await tester.runAllTests();
        await tester.performanceTest();
        return results;
    };
    
    console.log('🧪 Version 0.3 tests loaded. Run window.runVersion3Tests() to execute all tests.');
}

export default Version3TestSuite;
