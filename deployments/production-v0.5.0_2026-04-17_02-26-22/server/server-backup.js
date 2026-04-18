// Backup do servidor original - Restaurar se necessário
// Este é um backup limpo do servidor antes das modificações

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Import game systems
const database = require("../database/database.js");
const ErrorCatalog = require("./errorCatalog.js");
const MobSpawner = require("./mob-spawner.js");
const SimpleCombat = require("./combat/simpleCombat.js");
const startMap = require("./world/maps/startMap.js");

// Import Spawn System v0.3.6v
const SpawnManager = require("./SpawnManager.js");
const ZoneManager = require("./ZoneManager.js");
const BossManager = require("./BossManager.js");
const EventManager = require("./EventManager.js");

// Import Enhanced AI System v0.3.7v
const AIMobController = require("./ai/AIMobController.js");
const PathfindingSystem = require("./ai/PathfindingSystem.js");
const AIBossController = require("./ai/AIBossController.js");
const DecisionTree = require("./ai/DecisionTree.js");

// Import modules
const ModuleManager = require("./modules/ModuleManager.js");
const CombatModule = require("./modules/combat/CombatModule.js");
const InventoryModule = require("./modules/inventory/InventoryModule.js");
const SkillModule = require("./modules/skills/SkillModule.js");

class MMOServer {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.players = new Map();
        this.isRunning = false;
        
        // Initialize modules
        this.moduleManager = new ModuleManager();
        this.combatSystem = new SimpleCombat();
        this.mobSpawner = new MobSpawner();
        
        // Initialize world systems
        this.spawnManager = new SpawnManager();
        this.zoneManager = new ZoneManager();
        this.bossManager = new BossManager();
        this.eventManager = new EventManager();
        
        // Initialize Enhanced AI System v0.3.7v
        this.aiMobController = new AIMobController();
        this.pathfindingSystem = new PathfindingSystem();
        this.aiBossController = new AIBossController();
        this.decisionTree = new DecisionTree();
        this.eventReactions = new EventReactions();
        
        // Set server references
        if (this.mobSpawner && typeof this.mobSpawner.setServer === 'function') {
            this.mobSpawner.setServer(this);
        }
        if (this.combatSystem && typeof this.combatSystem.setServer === 'function') {
            this.combatSystem.setServer(this);
        }
        
        // Setup Spawn System integration
        this.setupSpawnSystemIntegration();
        
        // Setup Enhanced AI System integration
        this.setupAIIntegration();
        
        // Simple event emitter
        this.eventEmitter = {
            emit: (event, ...args) => {
                console.log(`Event: ${event}`, ...args);
            }
        };
    }
    
    setupMiddleware() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../client')));
        
        // JSON parsing
        this.app.use(express.json());
        
        // Error handling
        this.app.use((error, req, res, next) => {
            console.error('Express error:', error);
            this.eventEmitter.emit('serverError', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Player connected: ${socket.id}`);
            
            // Handle player connection
            this.handlePlayerConnection(socket);
            
            // Handle disconnection
            socket.on('disconnect', () => {
                this.handlePlayerDisconnection(socket);
            });
        });
    }
    
    handlePlayerConnection(socket) {
        console.log(`🔗 Player connected: ${socket.id}`);
        
        // Don't auto-spawn player - wait for login
        console.log('⏳ Waiting for login authentication...');
        
        // Setup event handlers
        this.setupPlayerEventHandlers(socket);
        
        // Send current mobs to new player
        if (global.mobSpawner) {
            const mobs = global.mobSpawner.getAllMobs();
            socket.emit('currentMobs', mobs);
            console.log(`👾 Sent ${mobs.length} mobs to player ${socket.id}`);
        }
        
        // Send connection event
        this.eventEmitter.emit('playerConnected', socket.id);
    }
    
    setupPlayerEventHandlers(socket) {
        socket.on("login", (data) => {
            console.log("Player login:", data.username)
            
            const player = {
                id: socket.id,
                name: data.username,
                x: 400,
                y: 300,
                hp: 100,
                level: 1
            }
            
            // Store player
            this.players.set(socket.id, player)
            
            // Send success response
            socket.emit("login_success", player)
            
            console.log("✅ Login successful:", data.username)
        });
        
        socket.on("playerMove", (data) => {
            if (this.players.has(socket.id)) {
                const player = this.players.get(socket.id);
                player.x = data.x;
                player.y = data.y;
                
                // Broadcast player movement
                this.io.emit("playerUpdate", {
                    id: socket.id,
                    x: data.x,
                    y: data.y
                });
                
                console.log(`Player ${socket.id} moved to (${data.x}, ${data.y})`);
            }
        });
        
        socket.on("attackMob", (data) => {
            console.log("Player attacking mob:", data);
            // Handle combat
            if (this.combatSystem) {
                const result = this.combatSystem.handleAttack(socket.id, data.mobId, data.damage);
                socket.emit("combatResult", result);
            }
        });
    }
    
    handlePlayerDisconnection(socket) {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove player
        this.players.delete(socket.id);
        
        // Notify other players
        this.io.emit("playerDisconnected", { id: socket.id });
    }
    
    async start() {
        try {
            console.log('Starting MMORPG Server...');
            
            // Register modules
            console.log('📦 Registering modules...');
            moduleManager.register('combat', new CombatModule(), 10);
            moduleManager.register('inventory', new InventoryModule(), 20);
            moduleManager.register('skills', new SkillModule(), 15);
            
            // Initialize all modules
            await moduleManager.initAll(this);
            
            // Start mob spawner
            if (global.mobSpawner) {
                global.mobSpawner.start();
                console.log('👾 Mob Spawner started');
            }
            
            // Start cleanup interval
            setInterval(() => {
                this.cleanupInactivePlayers();
            }, 60000); // Every minute
            
            this.eventEmitter.emit('serverStarted');
            
            // Start server
            this.server.listen(this.port, () => {
                console.log(`🎮 MMORPG Server running on port ${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                console.log(`🕹️ Game: http://localhost:${this.port}/index.html`);
                this.isRunning = true;
            });
            
        } catch (error) {
            console.error('Failed to start server:', error);
            this.eventEmitter.emit('serverError', error);
            process.exit(1);
        }
    }
    
    stop() {
        if (!this.isRunning) return;
        
        console.log('Stopping MMORPG Server...');
        
        // Stop mob spawner
        if (global.mobSpawner) {
            global.mobSpawner.stop();
        }
        
        // Close server
        this.server.close(() => {
            console.log('Server stopped');
            this.isRunning = false;
        });
    }
    
    cleanupInactivePlayers() {
        // Implementation for cleaning up inactive players
        console.log('Cleaning up inactive players...');
    }
}

// Create and start server
const server = new MMOServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.stop();
    process.exit(0);
});

// Start server
server.start();

module.exports = MMOServer;
