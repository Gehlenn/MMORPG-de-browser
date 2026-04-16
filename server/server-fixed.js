// Servidor MMORPG Simplificado e Funcional
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

class MMOServer {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.players = new Map();
        this.mobs = new Map();
        this.items = new Map();
        this.isRunning = false;
        
        // Initialize systems
        this.combatSystem = new SimpleCombat();
        this.mobSpawner = new MobSpawner();
        
        // Set server references
        if (this.mobSpawner && typeof this.mobSpawner.setServer === 'function') {
            this.mobSpawner.setServer(this);
        }
        if (this.combatSystem && typeof this.combatSystem.setServer === 'function') {
            this.combatSystem.setServer(this);
        }
        
        // Setup static files
        this.app.use(express.static(path.join(__dirname, '../client')));
        this.app.use(express.json());
        
        // Setup routes
        this.setupRoutes();
        
        // Setup socket events
        this.setupSocketEvents();
    }
    
    setupRoutes() {
        // Main game route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });
        
        // API routes
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                players: this.players.size,
                mobs: this.mobs.size,
                port: this.port
            });
        });
    }
    
    setupSocketEvents() {
        this.io.on('connection', (socket) => {
            console.log(`Player connected: ${socket.id}`);
            
            // Setup player event handlers
            this.setupPlayerEventHandlers(socket);
            
            // Send current mobs to new player
            if (global.mobSpawner) {
                socket.emit('mobs_update', Array.from(this.mobs.values()));
            }
            
            this.eventEmitter.emit('playerConnected', socket.id);
        });
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
            
            // Send world init
            this.sendWorldInit(socket, player);
            
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
        
        socket.on('disconnect', () => {
            this.handlePlayerDisconnection(socket);
        });
    }
    
    sendWorldInit(socket, player) {
        const worldData = {
            playerId: socket.id,
            entities: []
        };
        
        // Add other players
        for (const [otherId, otherPlayer] of this.players) {
            if (otherId !== socket.id) {
                worldData.entities.push({
                    id: otherId,
                    type: 'player',
                    name: otherPlayer.name,
                    x: otherPlayer.x,
                    y: otherPlayer.y,
                    health: otherPlayer.hp || 100,
                    maxHealth: 100
                });
            }
        }
        
        // Add mobs to world data
        for (const [mobId, mob] of this.mobs) {
            worldData.entities.push({
                id: mob.id || mobId,
                type: 'mob',
                name: mob.name || 'Mob',
                x: mob.x || 400,
                y: mob.y || 300,
                health: mob.health || 50,
                maxHealth: mob.maxHealth || 50
            });
        }
        
        socket.emit('world_init', worldData);
        console.log('🌍 World init sent to player:', socket.id);
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
            
            // Start mob spawner
            if (global.mobSpawner) {
                global.mobSpawner.start();
                console.log('👾 Mob Spawner started');
            }
            
            // Start cleanup interval
            setInterval(() => {
                this.cleanupInactivePlayers();
            }, 60000); // Every minute
            
            // Start server
            this.server.listen(this.port, () => {
                console.log(`🎮 MMORPG Server running on port ${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                console.log(`🕹️ Game: http://localhost:${this.port}/index.html`);
                this.isRunning = true;
            });
            
        } catch (error) {
            console.error('Failed to start server:', error);
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

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.stop();
    process.exit(0);
});

// Start server
server.start().catch(console.error);

module.exports = MMOServer;
