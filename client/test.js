/**
 * System Test Suite
 * Tests all major systems for MMORPG de Browser v0.2
 */

import { Game } from './engine/Game.js';
import { Renderer } from './engine/Renderer.js';
import { Input } from './engine/Input.js';
import { Camera } from './engine/Camera.js';
import { EntityManager } from './engine/EntityManager.js';
import { WorldGenerator } from './world/WorldGenerator.js';
import { BiomeSystem } from './world/BiomeSystem.js';
import { TileMap } from './world/TileMap.js';
import { Player } from './entities/Player.js';
import { Monster } from './entities/Monster.js';
import { NPC } from './entities/NPC.js';
import { Item } from './entities/Item.js';
import { GAME_CONFIG } from './config.js';

class SystemTest {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }
    
    async runAllTests() {
        console.log('🧪 Starting MMORPG de Browser v0.2 System Tests...\n');
        
        // Test all systems
        await this.testEngine();
        await this.testWorld();
        await this.testEntities();
        await this.testIntegration();
        
        // Show results
        this.showResults();
        
        return this.results;
    }
    
    async testEngine() {
        console.log('🔧 Testing Engine Systems...');
        
        // Test Game class
        await this.test('Game Class Initialization', async () => {
            const game = new Game();
            return game !== null && typeof game.update === 'function';
        });
        
        // Test Renderer
        await this.test('Renderer Initialization', async () => {
            const canvas = document.createElement('canvas');
            const renderer = new Renderer(canvas);
            return renderer !== null && typeof renderer.render === 'function';
        });
        
        // Test Input
        await this.test('Input System', async () => {
            const canvas = document.createElement('canvas');
            const input = new Input(canvas);
            return input !== null && typeof input.on === 'function';
        });
        
        // Test Camera
        await this.test('Camera System', async () => {
            const camera = new Camera(800, 480);
            return camera !== null && typeof camera.follow === 'function';
        });
        
        // Test EntityManager
        await this.test('Entity Manager', async () => {
            const entityManager = new EntityManager();
            return entityManager !== null && typeof entityManager.addEntity === 'function';
        });
    }
    
    async testWorld() {
        console.log('🌍 Testing World Systems...');
        
        // Test BiomeSystem
        await this.test('Biome System', async () => {
            const biomeSystem = new BiomeSystem();
            const biome = biomeSystem.getBiome('plains');
            return biome !== null && biome.id === 'plains';
        });
        
        // Test TileMap
        await this.test('Tile Map System', async () => {
            const tileMap = new TileMap(10, 10);
            return tileMap !== null && tileMap.width === 10 && tileMap.height === 10;
        });
        
        // Test Chunk
        await this.test('Chunk System', async () => {
            const Chunk = (await import('./world/Chunk.js')).default;
            const chunk = new Chunk(0, 0, 50);
            return chunk !== null && chunk.size === 50;
        });
        
        // Test WorldGenerator
        await this.test('World Generator', async () => {
            const worldGen = new WorldGenerator();
            const map = worldGen.getWorldMap(0, 0, 10, 10);
            return map !== null && map.width === 10 && map.height === 10;
        });
    }
    
    async testEntities() {
        console.log('👥 Testing Entity Systems...');
        
        // Test Entity base class
        await this.test('Base Entity Class', async () => {
            const entity = new Entity();
            return entity !== null && typeof entity.update === 'function';
        });
        
        // Test Player
        await this.test('Player Entity', async () => {
            const player = new Player({ name: 'TestPlayer' });
            return player !== null && player.type === 'player' && player.name === 'TestPlayer';
        });
        
        // Test Monster
        await this.test('Monster Entity', async () => {
            const monster = new Monster({ monsterType: 'goblin' });
            return monster !== null && monster.type === 'monster' && monster.monsterType === 'goblin';
        });
        
        // Test NPC
        await this.test('NPC Entity', async () => {
            const npc = new NPC({ npcType: 'vendor' });
            return npc !== null && npc.type === 'npc' && npc.npcType === 'vendor';
        });
        
        // Test Item
        await this.test('Item Entity', async () => {
            const item = new Item({ itemId: 'gold' });
            return item !== null && item.type === 'item' && item.itemId === 'gold';
        });
    }
    
    async testIntegration() {
        console.log('🔗 Testing System Integration...');
        
        // Test Entity-Manager Integration
        await this.test('Entity Manager Integration', async () => {
            const entityManager = new EntityManager();
            const player = new Player({ name: 'TestPlayer' });
            const monster = new Monster({ monsterType: 'goblin' });
            
            entityManager.addEntity(player);
            entityManager.addEntity(monster);
            
            const entities = entityManager.getAllEntities();
            return entities.length === 2;
        });
        
        // Test World-Entity Integration
        await this.test('World-Entity Integration', async () => {
            const worldGen = new WorldGenerator();
            const entityManager = new EntityManager();
            
            // Set world reference
            entityManager.setWorld({ mapData: worldGen.getWorldMap(0, 0, 10, 10) });
            
            const player = new Player({ x: 5, y: 5 });
            const canMove = player.canMoveTo(6, 5);
            
            return canMove === true;
        });
        
        // Test Camera-Entity Integration
        await this.test('Camera-Entity Integration', async () => {
            const camera = new Camera(800, 480);
            const player = new Player({ x: 100, y: 100 });
            
            camera.follow(player);
            camera.update();
            
            const cameraPos = camera.getPosition();
            return cameraPos.x === 100 && cameraPos.y === 100;
        });
        
        // Test Combat Integration
        await this.test('Combat System Integration', async () => {
            const player = new Player({ attack: 20 });
            const monster = new Monster({ health: 50, defense: 5 });
            
            const damage = monster.takeDamage(20, player.id, 'physical');
            
            return damage > 0 && monster.health < 50;
        });
        
        // Test Item Pickup Integration
        await this.test('Item Pickup Integration', async () => {
            const player = new Player();
            const item = new Item({ itemId: 'gold', quantity: 10 });
            
            // Simulate pickup
            const success = item.addToInventory(player);
            
            return success === true;
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
        console.log('\n📊 Test Results:');
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
            console.log('\n🎉 All tests passed! The MMORPG v0.2 engine is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the systems above.');
        }
    }
    
    // Performance test
    async performanceTest() {
        console.log('\n⚡ Running Performance Tests...');
        
        const entityManager = new EntityManager();
        const startTime = performance.now();
        
        // Create many entities
        for (let i = 0; i < 100; i++) {
            const monster = new Monster({
                x: Math.random() * 100,
                y: Math.random() * 100,
                monsterType: 'goblin'
            });
            entityManager.addEntity(monster);
        }
        
        // Update all entities
        for (let i = 0; i < 60; i++) { // Simulate 1 second at 60 FPS
            entityManager.update(16.67);
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`  📈 Created and updated 100 entities in ${duration.toFixed(2)}ms`);
        console.log(`  🎯 Performance: ${(1000 / duration * 60).toFixed(0)} FPS potential`);
        
        return duration < 1000; // Should complete in less than 1 second
    }
}

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    window.runSystemTests = async () => {
        const tester = new SystemTest();
        const results = await tester.runAllTests();
        await tester.performanceTest();
        return results;
    };
    
    console.log('🧪 System tests loaded. Run window.runSystemTests() to execute all tests.');
}

export default SystemTest;
