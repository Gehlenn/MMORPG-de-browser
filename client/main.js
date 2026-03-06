/**
 * Main Entry Point - MMORPG de Browser v0.2
 * Integrates the new engine systems with the existing UI
 */

// Import new engine systems
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

// Import social and multiplayer systems (v0.3)
import NetworkManager from './multiplayer/NetworkManager.js';
import ChatSystem from './social/ChatSystem.js';
import PartySystem from './social/PartySystem.js';
import GuildSystem from './social/GuildSystem.js';
import WorldEventManager from './events/WorldEventManager.js';

// Import quest system (v0.2.1)
import QuestSystem from './systems/QuestSystem.js';
import QuestTrackerUI from './ui/QuestTrackerUI.js';

class MMORPGGame {
    constructor() {
        this.game = null;
        this.renderer = null;
        this.input = null;
        this.camera = null;
        this.entityManager = null;
        this.worldGenerator = null;
        this.biomeSystem = null;
        
        // Social and multiplayer systems (v0.3)
        this.networkManager = null;
        this.chatSystem = null;
        this.partySystem = null;
        this.guildSystem = null;
        this.eventManager = null;
        
        // Quest system (v0.2.1)
        this.questSystem = null;
        this.questTrackerUI = null;
        
        this.player = null;
        this.currentMap = null;
        
        // Legacy UI elements
        this.legacyUI = {
            canvas: null,
            ctx: null,
            screens: {},
            elements: {}
        };
        
        // Game state
        this.isRunning = false;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing MMORPG de Browser v0.2...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Initialize legacy UI connection
            this.initializeLegacyUI();
            
            // Initialize new engine systems
            this.initializeEngine();
            
            // Connect systems
            this.connectSystems();
            
            // Start game loop
            this.start();
            
            console.log('MMORPG de Browser v0.2 initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }
    
    initializeLegacyUI() {
        // Get canvas and context
        this.legacyUI.canvas = document.getElementById('gameCanvas');
        this.legacyUI.ctx = this.legacyUI.canvas.getContext('2d');
        
        // Get screen elements
        this.legacyUI.screens = {
            login: document.getElementById('loginScreen'),
            character: document.getElementById('characterScreen'),
            game: document.getElementById('gameScreen')
        };
        
        // Get important UI elements
        this.legacyUI.elements = {
            log: document.getElementById('log'),
            stats: document.getElementById('stats'),
            inventory: document.getElementById('inventoryPanel'),
            locationName: document.getElementById('locationName'),
            locationDesc: document.getElementById('locationDesc'),
            locationImage: document.getElementById('locationImage')
        };
        
        // Override legacy canvas renderer with new systems
        this.setupCanvasRenderer();
    }
    
    setupCanvasRenderer() {
        // Create compatibility layer for legacy rendering
        const canvas = this.legacyUI.canvas;
        const ctx = this.legacyUI.ctx;
        
        // Expose new renderer to legacy code
        window.WorldRenderer = {
            canvas,
            ctx,
            GRID_W: 25,
            GRID_H: 15,
            createBaseMap: (width, height) => {
                return new Array(height).fill(null).map(() => new Array(width).fill(0));
            },
            drawGrid: (mapData) => {
                // Legacy grid drawing - will be replaced by new renderer
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                
                for (let y = 0; y < mapData.length; y++) {
                    for (let x = 0; x < mapData[y].length; x++) {
                        ctx.strokeRect(x * 32, y * 32, 32, 32);
                    }
                }
            },
            drawEntitySprite: (sprite, x, y) => {
                // Legacy sprite drawing
                ctx.fillStyle = '#4ade80';
                ctx.fillRect(x * 32 + 8, y * 32 + 8, 16, 16);
            }
        };
    }
    
    initializeEngine() {
        // Initialize core systems
        this.renderer = new Renderer(this.legacyUI.canvas);
        this.input = new Input(this.legacyUI.canvas);
        this.camera = new Camera(800, 480);
        this.entityManager = new EntityManager();
        this.biomeSystem = new BiomeSystem();
        this.worldGenerator = new WorldGenerator();
        
        // Initialize social and multiplayer systems (v0.3)
        this.networkManager = new NetworkManager();
        this.chatSystem = new ChatSystem(this.networkManager);
        this.partySystem = new PartySystem(this.networkManager, this.chatSystem);
        this.guildSystem = new GuildSystem(this.networkManager, this.chatSystem);
        this.eventManager = new WorldEventManager(this.networkManager, this.game);
        
        // Initialize quest system (v0.2.1)
        this.questSystem = new QuestSystem(this.game, this.networkManager);
        this.questTrackerUI = new QuestTrackerUI(this.questSystem, this.game);
        
        // Create main game instance
        this.game = new Game({
            renderer: this.renderer,
            input: this.input,
            camera: this.camera,
            entityManager: this.entityManager,
            worldGenerator: this.worldGenerator
        });
        
        // Generate initial world
        this.generateWorld();
        
        // Initialize multiplayer connection
        this.initializeMultiplayer();
        
        // Initialize quest system
        this.initializeQuests();
    }
    
    generateWorld() {
        // Generate starting area around player
        const startX = 0;
        const startY = 0;
        const width = 50;
        const height = 50;
        
        this.currentMap = this.worldGenerator.getWorldMap(startX, startY, width, height);
        
        // Add some starting entities
        this.populateStartingArea();
    }
    
    populateStartingArea() {
        // Add player
        this.player = new Player({
            x: 25,
            y: 25,
            name: 'Hero',
            baseClass: 'warrior'
        });
        
        this.entityManager.addEntity(this.player);
        
        // Add some monsters
        for (let i = 0; i < 5; i++) {
            const monster = new Monster({
                x: Math.random() * 50,
                y: Math.random() * 50,
                monsterType: 'goblin'
            });
            this.entityManager.addEntity(monster);
        }
        
        // Add some NPCs
        const npc = new NPC({
            x: 20,
            y: 20,
            name: 'Village Elder',
            npcType: 'quest_giver'
        });
        this.entityManager.addEntity(npc);
        
        // Add some items
        for (let i = 0; i < 10; i++) {
            const item = new Item({
                x: Math.random() * 50,
                y: Math.random() * 50,
                itemId: 'gold',
                quantity: Math.floor(Math.random() * 50) + 10
            });
            this.entityManager.addEntity(item);
        }
    }
    
    initializeMultiplayer() {
        // Connect to server
        this.networkManager.connect();
        
        // Setup multiplayer event handlers
        this.setupMultiplayerHandlers();
        
        // Show connection status
        this.updateConnectionStatus();
    }
    
    setupMultiplayerHandlers() {
        // Connection events
        this.networkManager.onConnect = () => {
            console.log('Connected to multiplayer server!');
            this.updateConnectionStatus();
            this.chatSystem.addSystemMessage('Conectado ao servidor multiplayer!', 'success');
        };
        
        this.networkManager.onDisconnect = () => {
            console.log('Disconnected from multiplayer server');
            this.updateConnectionStatus();
            this.chatSystem.addSystemMessage('Desconectado do servidor multiplayer.', 'error');
        };
        
        this.networkManager.onError = (error) => {
            console.error('Multiplayer error:', error);
            this.chatSystem.addSystemMessage('Erro de conexão: ' + error.message, 'error');
        };
    }
    
    updateConnectionStatus() {
        const sessionInfo = document.getElementById('sessionInfo');
        if (sessionInfo) {
            const state = this.networkManager.getConnectionState();
            const statusText = {
                'disconnected': 'Offline',
                'connecting': 'Conectando...',
                'connected': 'Online',
                'error': 'Erro'
            };
            
            sessionInfo.textContent = statusText[state] || 'Offline';
            sessionInfo.style.color = state === 'connected' ? '#10b981' : '#ef4444';
        }
    }
    
    initializeQuests() {
        // Setup quest event handlers
        this.setupQuestHandlers();
        
        // Generate initial quests for testing
        this.generateSampleQuests();
        
        // Show quest tracker
        this.questTrackerUI.show();
    }
    
    setupQuestHandlers() {
        // Quest acceptance
        this.questSystem.onQuestAccepted = (quest) => {
            console.log('Quest accepted:', quest.title);
            this.updateUI();
        };
        
        // Quest completion
        this.questSystem.onQuestCompleted = (quest) => {
            console.log('Quest completed:', quest.title);
            this.showQuestCompletionNotification(quest);
            this.updateUI();
        };
        
        // Objective updates
        this.questSystem.onObjectiveUpdated = (questId, objective, progress) => {
            if (this.questSystem.trackedQuestId === questId) {
                this.questTrackerUI.updateQuestTracker();
            }
        };
    }
    
    generateSampleQuests() {
        // Generate some sample quests for testing
        const sampleQuests = [
            {
                id: 'forest_patrol',
                title: 'Patrulha Florestal',
                type: 'kill',
                description: 'Patrulhe a floresta e elimine as ameaças locais.',
                objectives: [
                    { id: 'obj1', type: 'kill', target: 'goblin', amount: 5, description: 'Derrotar 5 Goblins' },
                    { id: 'obj2', type: 'kill', target: 'wolf', amount: 3, description: 'Derrotar 3 Lobos' }
                ],
                rewards: {
                    xp: 200,
                    gold: 50,
                    items: ['health_potion']
                },
                requirements: { level: { min: 1, max: 20 } }
            },
            {
                id: 'herb_collection',
                title: 'Coleta de Ervas',
                type: 'collect',
                description: 'Colete ervas medicinais para o aldeão.',
                objectives: [
                    { id: 'obj1', type: 'collect', target: 'healing_herb', amount: 10, description: 'Coletar 10 Ervas de Cura' }
                ],
                rewards: {
                    xp: 100,
                    gold: 30
                },
                requirements: { level: { min: 1, max: 15 } }
            },
            {
                id: 'explore_ruins',
                title: 'Explorar Ruínas',
                type: 'explore',
                description: 'Explore as ruínas antigas ao norte.',
                objectives: [
                    { id: 'obj1', type: 'explore', target: 'ancient_ruins', amount: 1, description: 'Explorar as Ruínas Antigas' }
                ],
                rewards: {
                    xp: 150,
                    gold: 40,
                    items: ['map_fragment']
                },
                requirements: { level: { min: 5, max: 25 } }
            }
        ];
        
        // Add sample quests to available quests
        for (const quest of sampleQuests) {
            this.questSystem.availableQuests.set(quest.id, quest);
        }
        
        // Auto-accept first quest for testing
        if (sampleQuests.length > 0) {
            this.questSystem.acceptQuest(sampleQuests[0].id);
        }
    }
    
    showQuestCompletionNotification(quest) {
        // Create a visual notification for quest completion
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 20, 40, 0.9));
            border: 2px solid #4ade80;
            border-radius: 12px;
            padding: 20px;
            color: white;
            z-index: 2000;
            text-align: center;
            animation: questComplete 0.5s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
            <div style="font-size: 24px; font-weight: bold; color: #4ade80; margin-bottom: 10px;">
                Quest Completada!
            </div>
            <div style="font-size: 18px; margin-bottom: 15px;">${quest.title}</div>
            <div style="font-size: 14px; color: #ccc;">
                +${quest.rewards.xp} XP<br>
                +${quest.rewards.gold} Gold
                ${quest.rewards.items ? '<br>' + quest.rewards.items.join(', ') : ''}
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: #4ade80;
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 15px;
            ">OK</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Add animation
        if (!document.querySelector('#quest-complete-animation')) {
            const style = document.createElement('style');
            style.id = 'quest-complete-animation';
            style.textContent = `
                @keyframes questComplete {
                    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    connectSystems() {
        // Connect input to game
        this.input.on('move', (direction) => {
            if (this.player && this.player.alive) {
                switch (direction) {
                    case 'up': this.player.moveBy(0, -1); break;
                    case 'down': this.player.moveBy(0, 1); break;
                    case 'left': this.player.moveBy(-1, 0); break;
                    case 'right': this.player.moveBy(1, 0); break;
                }
            }
        });
        
        this.input.on('action', () => {
            this.handlePlayerAction();
        });
        
        // Connect camera to player
        this.camera.follow(this.player);
        
        // Connect entity manager to game world
        this.entityManager.setWorld(this.game);
        
        // Connect player to UI
        if (this.player) {
            this.player.on('move', () => this.updateLocation());
            this.player.on('damage', (data) => this.logMessage(`Tomou ${data.amount} de dano!`, 'combat'));
            this.player.on('level_up', () => this.logMessage('Subiu de nível!', 'quest'));
        }
        
        // Connect to legacy button controls
        this.connectLegacyControls();
    }
    
    connectLegacyControls() {
        // Movement buttons
        const directionButtons = document.querySelectorAll('[data-dir]');
        directionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const direction = button.dataset.dir;
                this.handleLegacyMovement(direction);
            });
        });
        
        // Service buttons
        const serviceButtons = document.querySelectorAll('[data-service]');
        serviceButtons.forEach(button => {
            button.addEventListener('click', () => {
                const service = button.dataset.service;
                this.handleService(service);
            });
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.player || !this.player.alive) return;
            
            switch (e.key.toLowerCase()) {
                case 'w': this.player.moveBy(0, -1); break;
                case 's': this.player.moveBy(0, 1); break;
                case 'a': this.player.moveBy(-1, 0); break;
                case 'd': this.player.moveBy(1, 0); break;
                case 'e': this.handlePlayerAction(); break;
                case 'i': this.toggleInventory(); break;
            }
        });
    }
    
    handleLegacyMovement(direction) {
        if (!this.player || !this.player.alive) return;
        
        const moves = {
            north: { x: 0, y: -1 },
            south: { x: 0, y: 1 },
            east: { x: 1, y: 0 },
            west: { x: -1, y: 0 }
        };
        
        const move = moves[direction];
        if (move) {
            this.player.moveBy(move.x, move.y);
        }
    }
    
    handlePlayerAction() {
        if (!this.player || !this.player.alive) return;
        
        // Check for nearby entities to interact with
        const nearbyEntities = this.entityManager.getEntitiesInRange(
            this.player.x, this.player.y, 2
        );
        
        for (const entity of nearbyEntities) {
            if (entity === this.player) continue;
            
            if (entity.type === 'npc' && entity.interactive) {
                const result = entity.interact(this.player);
                if (result && result.type === 'dialogue') {
                    this.showDialogue(result.dialogue);
                }
                return;
            }
            
            if (entity.type === 'item' && entity.interactive) {
                entity.pickup(this.player);
                return;
            }
            
            if (entity.type === 'monster' && entity.alive) {
                this.player.performAttack(entity);
                return;
            }
        }
    }
    
    handleService(service) {
        switch (service) {
            case 'tavern':
                this.logMessage('Você entrou na taverna e descansou.', 'quest');
                this.player.health = this.player.maxHealth;
                this.player.mana = this.player.maxMana;
                break;
                
            case 'rest':
                if (this.player.gold >= 5) {
                    this.player.gold -= 5;
                    this.player.health = this.player.maxHealth;
                    this.player.mana = this.player.maxMana;
                    this.logMessage('Você descansou e recuperou suas forças.', 'quest');
                } else {
                    this.logMessage('Você não tem ouro suficiente.', 'combat');
                }
                break;
                
            case 'market':
                this.logMessage('Mercado em desenvolvimento.', 'quest');
                break;
                
            case 'dungeon':
                this.logMessage('Portal de dungeon em desenvolvimento.', 'quest');
                break;
                
            default:
                this.logMessage(`Serviço ${service} em desenvolvimento.`, 'quest');
        }
        
        this.updateUI();
    }
    
    showDialogue(dialogue) {
        // Simple dialogue display
        if (dialogue.text) {
            this.logMessage(`${dialogue.speaker || 'NPC'}: ${dialogue.text}`, 'quest');
        }
    }
    
    toggleInventory() {
        const inventoryPanel = document.getElementById('inventoryPanel');
        const equipmentPanel = document.getElementById('equipmentPanel');
        
        if (inventoryPanel.classList.contains('hidden')) {
            inventoryPanel.classList.remove('hidden');
            equipmentPanel.classList.add('hidden');
        } else {
            inventoryPanel.classList.add('hidden');
        }
    }
    
    start() {
        this.isRunning = true;
        this.isInitialized = true;
        
        // Show game screen
        this.showScreen('game');
        
        // Start game loop
        this.gameLoop();
        
        // Start UI updates
        this.startUIUpdates();
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        // Update game systems
        this.game.update(16); // 60 FPS
        
        // Render
        this.render();
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    render() {
        // Clear canvas
        this.legacyUI.ctx.clearRect(0, 0, this.legacyUI.canvas.width, this.legacyUI.canvas.height);
        
        // Draw map
        this.drawMap();
        
        // Draw entities
        this.drawEntities();
        
        // Draw UI overlay
        this.drawUIOverlay();
    }
    
    drawMap() {
        const ctx = this.legacyUI.ctx;
        const tileSize = 32;
        
        // Draw tiles
        for (let y = 0; y < this.currentMap.height; y++) {
            for (let x = 0; x < this.currentMap.width; x++) {
                const tile = this.currentMap.getTile(x, y);
                const biome = this.biomeSystem.getBiomeAt(x, y);
                
                // Draw tile based on type
                ctx.fillStyle = biome.floorColor || '#4a7c59';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                
                // Draw grid
                ctx.strokeStyle = biome.gridColor || 'rgba(255,255,255,0.1)';
                ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    }
    
    drawEntities() {
        const ctx = this.legacyUI.ctx;
        const tileSize = 32;
        
        // Get visible entities
        const entities = this.entityManager.getAllEntities();
        
        for (const entity of entities) {
            if (!entity.visible || !entity.alive) continue;
            
            const screenX = entity.x * tileSize;
            const screenY = entity.y * tileSize;
            
            // Draw entity based on type
            switch (entity.type) {
                case 'player':
                    ctx.fillStyle = '#4ade80';
                    ctx.fillRect(screenX + 8, screenY + 8, 16, 16);
                    break;
                    
                case 'monster':
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(screenX + 6, screenY + 6, 20, 20);
                    break;
                    
                case 'npc':
                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(screenX + 8, screenY + 8, 16, 16);
                    break;
                    
                case 'item':
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(screenX + 16, screenY + 16, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
            
            // Draw health bar for living entities
            if (entity.health && entity.maxHealth && entity.type !== 'item') {
                const healthPercent = entity.health / entity.maxHealth;
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(screenX, screenY - 4, 32, 3);
                ctx.fillStyle = '#16a34a';
                ctx.fillRect(screenX, screenY - 4, 32 * healthPercent, 3);
            }
        }
    }
    
    drawUIOverlay() {
        // Draw any UI overlays here
        const ctx = this.legacyUI.ctx;
        
        // Draw player coordinates
        if (this.player) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(`Pos: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`, 10, 20);
        }
    }
    
    startUIUpdates() {
        setInterval(() => {
            if (this.isRunning) {
                this.updateUI();
            }
        }, 100); // Update UI 10 times per second
    }
    
    updateUI() {
        if (!this.player) return;
        
        // Update stats
        this.updateStats();
        
        // Update location
        this.updateLocation();
        
        // Update inventory
        this.updateInventory();
    }
    
    updateStats() {
        const statsEl = this.legacyUI.elements.stats;
        if (!statsEl) return;
        
        const biome = this.biomeSystem.getBiomeAt(this.player.x, this.player.y);
        
        statsEl.innerHTML = `
            <div><strong>${this.player.name}</strong></div>
            <div>Classe: ${this.player.className}</div>
            <div>Nível: ${this.player.level}</div>
            <div>HP: ${Math.floor(this.player.health)}/${this.player.maxHealth}</div>
            <div>MP: ${Math.floor(this.player.mana)}/${this.player.maxMana}</div>
            <div>Gold: ${this.player.gold}</div>
            <div>Bioma: ${biome.name}</div>
        `;
    }
    
    updateLocation() {
        if (!this.player) return;
        
        const biome = this.biomeSystem.getBiomeAt(this.player.x, this.player.y);
        
        this.legacyUI.elements.locationName.textContent = biome.name;
        this.legacyUI.elements.locationDesc.textContent = biome.description;
        
        // Update location image if available
        if (biome.image) {
            this.legacyUI.elements.locationImage.src = biome.image;
        }
    }
    
    updateInventory() {
        const inventoryEl = this.legacyUI.elements.inventory;
        if (!inventoryEl || !this.player) return;
        
        let html = '';
        for (const itemId of this.player.inventory) {
            html += `<div class="inventory-item">${itemId}</div>`;
        }
        
        inventoryEl.innerHTML = html || '<div>Inventário vazio</div>';
    }
    
    showScreen(screenName) {
        // Hide all screens
        Object.values(this.legacyUI.screens).forEach(screen => {
            screen.classList.remove('visible');
        });
        
        // Show target screen
        const targetScreen = this.legacyUI.screens[screenName];
        if (targetScreen) {
            targetScreen.classList.add('visible');
        }
    }
    
    logMessage(message, type = 'all') {
        const logEl = this.legacyUI.elements.log;
        if (!logEl) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
        
        // Limit log entries
        while (logEl.children.length > 100) {
            logEl.removeChild(logEl.firstChild);
        }
    }
    
    showError(message) {
        alert(message); // Simple error display
    }
    
    // Public API for legacy code
    getGameInstance() {
        return this.game;
    }
    
    getPlayer() {
        return this.player;
    }
    
    getEntityManager() {
        return this.entityManager;
    }
}

// Initialize game when page loads
const mmorpg = new MMORPGGame();

// Expose to global scope for legacy compatibility
window.MMORPG = mmorpg;
window.game = mmorpg.getGameInstance();
window.player = mmorpg.getPlayer();

// Expose social systems for global access
window.networkManager = mmorpg.networkManager;
window.chatSystem = mmorpg.chatSystem;
window.partySystem = mmorpg.partySystem;
window.guildSystem = mmorpg.guildSystem;
window.eventManager = mmorpg.eventManager;

// Expose quest system for global access
window.questSystem = mmorpg.questSystem;
window.questTrackerUI = mmorpg.questTrackerUI;

// Add systems to game instance for easy access
if (window.game) {
    window.game.networkManager = mmorpg.networkManager;
    window.game.chatSystem = mmorpg.chatSystem;
    window.game.partySystem = mmorpg.partySystem;
    window.game.guildSystem = mmorpg.guildSystem;
    window.game.eventManager = mmorpg.eventManager;
    window.game.questSystem = mmorpg.questSystem;
    window.game.questTrackerUI = mmorpg.questTrackerUI;
}

export default MMORPG;
