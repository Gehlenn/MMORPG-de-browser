// Servidor Simples para Teste Imediato
// Versão minimalista sem módulos complexos

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

console.log('🚀 Iniciando Servidor Simples para Teste\n');

class SimpleMMOServer {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.players = new Map();
        this.mobs = new Map();
        this.isRunning = false;
    }
    
    setupMiddleware() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../client')));
        
        // JSON parsing
        this.app.use(express.json());
        
        // Error handling
        this.app.use((error, req, res, next) => {
            console.error('Express error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Player connected: ${socket.id}`);
            
            // Send current mobs
            const currentMobs = Array.from(this.mobs.values());
            socket.emit('currentMobs', currentMobs);
            
            // Setup event handlers
            this.setupPlayerEventHandlers(socket);
            
            // Handle disconnection
            socket.on('disconnect', () => {
                this.handlePlayerDisconnection(socket);
            });
        });
    }
    
    setupPlayerEventHandlers(socket) {
        // Login handler
        socket.on('login', (data) => {
            console.log(`👤 Player login: ${data.username}`);
            
            const player = {
                id: socket.id,
                name: data.username,
                x: 400,
                y: 300,
                hp: 100,
                maxHp: 100,
                level: 1,
                exp: 0
            };
            
            this.players.set(socket.id, player);
            socket.emit('login_success', player);
            console.log(`✅ Login successful: ${data.username}`);
        });
        
        // Player movement handler
        socket.on('playerMove', (data) => {
            if (this.players.has(socket.id)) {
                const player = this.players.get(socket.id);
                player.x = data.x;
                player.y = data.y;
                
                // Broadcast movement
                this.io.emit('playerUpdate', {
                    id: socket.id,
                    x: data.x,
                    y: data.y
                });
                
                console.log(`🏃 Player ${socket.id} moved to (${data.x}, ${data.y})`);
            }
        });
        
        // Attack mob handler
        socket.on('attackMob', (data) => {
            const { mobId, damage } = data;
            const mob = this.mobs.get(mobId);
            
            if (mob) {
                mob.hp -= damage;
                console.log(`⚔️ Player ${socket.id} attacked ${mobId} for ${damage} damage`);
                
                if (mob.hp <= 0) {
                    this.mobs.delete(mobId);
                    socket.emit('mobDefeated', { mobId, exp: mob.exp || 25 });
                    this.io.emit('mobRemove', { id: mobId });
                    console.log(`💀 Mob ${mobId} defeated by ${socket.id}`);
                } else {
                    socket.emit('mobUpdate', { id: mobId, hp: mob.hp });
                    this.io.emit('mobUpdate', { id: mobId, hp: mob.hp });
                    console.log(`💔 Mob ${mobId} HP: ${mob.hp}/${mob.maxHp}`);
                }
            }
        });
    }
    
    handlePlayerDisconnection(socket) {
        console.log(`🔌 Player disconnected: ${socket.id}`);
        this.players.delete(socket.id);
        this.io.emit('playerDisconnected', { id: socket.id });
    }
    
    spawnInitialMobs() {
        console.log('👾 Spawning initial mobs...');
        
        const mobTypes = [
            { type: 'goblin', name: 'Goblin Selvagem', x: 350, y: 250, hp: 50, damage: 10, color: '#228B22' },
            { type: 'wolf', name: 'Lobo Feroz', x: 450, y: 350, hp: 75, damage: 15, color: '#696969' },
            { type: 'orc', name: 'Orc Guerreiro', x: 400, y: 300, hp: 100, damage: 20, color: '#8B4513' },
            { type: 'slime', name: 'Slime Gelatinoso', x: 500, y: 400, hp: 30, damage: 5, color: '#90EE90' }
        ];
        
        mobTypes.forEach((mobData, index) => {
            setTimeout(() => {
                const mob = {
                    id: `mob_${index + 1}`,
                    ...mobData,
                    maxHp: mobData.hp,
                    exp: Math.floor(mobData.hp * 1.5)
                };
                
                this.mobs.set(mob.id, mob);
                this.io.emit('mobSpawn', mob);
                console.log(`👾 Spawned ${mob.name} at (${mob.x}, ${mob.y})`);
            }, index * 1000);
        });
    }
    
    startMobAI() {
        console.log('🤖 Starting Mob AI...');
        
        setInterval(() => {
            console.log('🔄 AI Update - Players:', this.players.size, 'Mobs:', this.mobs.size);
            
            this.mobs.forEach((mob, mobId) => {
                console.log(`🤖 Processing mob ${mob.name} at (${mob.x}, ${mob.y})`);
                
                // Simple AI: move towards nearest player
                let nearestPlayer = null;
                let minDistance = Infinity;
                
                this.players.forEach(player => {
                    const dx = player.x - mob.x;
                    const dy = player.y - mob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    console.log(`📏 Distance to player ${player.name}: ${distance.toFixed(2)}px`);
                    
                    if (distance < minDistance && distance < 400) {
                        minDistance = distance;
                        nearestPlayer = player;
                        console.log(`🎯 Nearest player found: ${player.name} at ${distance.toFixed(2)}px`);
                    }
                });
                
                if (nearestPlayer && minDistance > 30) {
                    const dx = nearestPlayer.x - mob.x;
                    const dy = nearestPlayer.y - mob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const moveX = (dx / distance) * (mob.speed || 2);
                    const moveY = (dy / distance) * (mob.speed || 2);
                    
                    const oldX = mob.x;
                    const oldY = mob.y;
                    
                    mob.x += moveX;
                    mob.y += moveY;
                    
                    console.log(`🏃 ${mob.name} moving from (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) to (${mob.x.toFixed(1)}, ${mob.y.toFixed(1)})`);
                    
                    // Emitir update para todos os jogadores
                    this.io.emit('mobUpdate', { 
                        id: mobId, 
                        x: mob.x, 
                        y: mob.y,
                        name: mob.name,
                        type: mob.type,
                        hp: mob.hp,
                        maxHp: mob.maxHp,
                        color: mob.color
                    });
                    
                    console.log(`📡 Emitted mobUpdate for ${mob.name}`);
                } else {
                    console.log(`⏸️ ${mob.name} not moving - nearestPlayer: ${nearestPlayer ? nearestPlayer.name : 'none'}, distance: ${minDistance.toFixed(2)}px`);
                    
                    // Emitir update mesmo se não se mover (para manter sincronizado)
                    this.io.emit('mobUpdate', { 
                        id: mobId, 
                        x: mob.x, 
                        y: mob.y,
                        name: mob.name,
                        type: mob.type,
                        hp: mob.hp,
                        maxHp: mob.maxHp,
                        color: mob.color
                    });
                }
            });
        }, 1000); // Update every second
    }
    
    async start() {
        try {
            console.log('🚀 Starting Simple MMORPG Server...');
            
            this.setupMiddleware();
            this.setupSocketHandlers();
            
            // Start server
            this.server.listen(this.port, () => {
                console.log(`🎮 Simple MMORPG Server running on port ${this.port}`);
                console.log(`📊 Game: http://localhost:${this.port}/index.html`);
                this.isRunning = true;
                
                // Spawn initial mobs after server starts
                setTimeout(() => {
                    this.spawnInitialMobs();
                    this.startMobAI();
                }, 2000);
            });
            
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    
    stop() {
        if (!this.isRunning) return;
        
        console.log('🛑 Stopping Simple MMORPG Server...');
        this.server.close(() => {
            console.log('✅ Server stopped');
            this.isRunning = false;
        });
    }
}

// Create and start server
const server = new SimpleMMOServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    server.stop();
    process.exit(0);
});

// Start server
server.start();

console.log('✅ Simple Server Ready!');
