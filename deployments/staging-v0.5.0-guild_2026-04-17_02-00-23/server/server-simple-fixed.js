// Servidor Simples para Teste Imediato - Versão Corrigida
// Versão minimalista sem módulos complexos

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

console.log('🚀 Iniciando Servidor Simples para Teste (Corrigido)\n');

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
            console.log('🔌 Player connected: ' + socket.id);
        
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
    // Player join handler (para registro no sistema AI)
    socket.on('player_join', (data) => {
            console.log('👤 Player join: ' + data.name);
        
        const player = {
            id: data.id,
            name: data.name,
            x: data.x || 400,
            y: data.y || 300,
            hp: 100,
            maxHp: 100,
            level: data.level || 1,
            exp: 0
        };
        
        this.players.set(data.id, player);
            console.log('✅ Player registered in AI system: ' + data.name);
    });
    
    // Login handler
    socket.on('login', (data) => {
            console.log('👤 Player login: ' + data.username);
        
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
            console.log('✅ Login successful: ' + data.username);
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
            
                console.log('🏃 Player ' + socket.id + ' moved to (' + data.x + ', ' + data.y + ')');
        }
    });
    
    // Attack mob handler
    socket.on('attackMob', (data) => {
        const mobId = data.mobId;
        const damage = data.damage;
        const mob = this.mobs.get(mobId);
        
        if (mob) {
            mob.hp -= damage;
                console.log('⚔️ Player ' + socket.id + ' attacked ' + mobId + ' for ' + damage + ' damage');
            
            if (mob.hp <= 0) {
                const expGained = mob.exp || 25;
                this.mobs.delete(mobId);
                
                // Enviar XP ao jogador
                socket.emit('mobDefeated', { 
                    mobId: mobId, 
                    exp: expGained,
                    mobName: mob.name
                });
                
                // Remover mob para todos
                this.io.emit('mobRemove', { id: mobId });
                
                    console.log('💀 ' + socket.name + ' derrotou ' + mob.name + '! +' + expGained + ' EXP');
            } else {
                socket.emit('mobUpdate', { id: mobId, hp: mob.hp });
                this.io.emit('mobUpdate', { id: mobId, hp: mob.hp });
                    console.log('💔 Mob ' + mobId + ' HP: ' + mob.hp + '/' + mob.maxHp);
            }
        }
    });
    }
    
    handlePlayerDisconnection(socket) {
        console.log('🔌 Player disconnected: ' + socket.id);
    this.players.delete(socket.id);
    this.io.emit('playerDisconnected', { id: socket.id });
    }
    
    spawnInitialMobs() {
        console.log('👾 Spawning initial mobs...');
    
    const mobTypes = [
        { type: 'goblin', name: 'Goblin Selvagem', x: 200, y: 200, hp: 50, damage: 10, color: '#228B22' },
        { type: 'wolf', name: 'Lobo Feroz', x: 600, y: 200, hp: 75, damage: 15, color: '#696969' },
        { type: 'orc', name: 'Orc Guerreiro', x: 200, y: 400, hp: 100, damage: 20, color: '#8B4513' },
        { type: 'slime', name: 'Slime Gelatinoso', x: 600, y: 400, hp: 30, damage: 5, color: '#90EE90' }
    ];
    
    mobTypes.forEach((mobData, index) => {
        setTimeout(() => {
            const mob = {
                id: 'mob_' + (index + 1),
                ...mobData,
                maxHp: mobData.hp,
                exp: Math.floor(mobData.hp * 1.5)
            };
            
            this.mobs.set(mob.id, mob);
            this.io.emit('mobSpawn', mob);
                console.log('👾 Spawned ' + mob.name + ' at (' + mob.x + ', ' + mob.y + ')');
        }, index * 1000);
    });
    }
    
    startMobAI() {
        if (!this.isRunning) return;
        
        console.log('🔄 AI Update - Players: ' + this.players.size + ', Mobs: ' + this.mobs.size);
        
        setInterval(() => {
            if (!this.isRunning) return;
            
            // Só processar mobs se houver jogadores conectados
            if (this.players.size === 0) {
                return;
            }
            
            // Processar cada mob
            this.mobs.forEach((mob, mobId) => {
                // Encontrar jogador mais próximo
                let nearestPlayer = null;
                let minDistance = Infinity;
                
                this.players.forEach((player, playerId) => {
                    const distance = Math.sqrt(
                        Math.pow(mob.x - player.x, 2) + 
                        Math.pow(mob.y - player.y, 2)
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPlayer = player;
                    }
                });
                
                // Se encontrou jogador e está dentro do alcance
                if (nearestPlayer && minDistance < 400) {
                    // Calcular direção
                    const dx = nearestPlayer.x - mob.x;
                    const dy = nearestPlayer.y - mob.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Normalizar e aplicar velocidade
                    const speed = 0.5; // Reduzido para evitar movimentos rápidos
                    const vx = (dx / distance) * speed;
                    const vy = (dy / distance) * speed;
                    
                    // Atualizar posição
                    mob.x += vx;
                    mob.y += vy;
                    
                    // Enviar atualização para clientes
                    this.io.emit('mobUpdate', {
                        id: mobId,
                        x: mob.x,
                        y: mob.y
                    });
                } else {
                    // Enviar posição atual mesmo se não estiver se movendo
                    this.io.emit('mobUpdate', {
                        id: mobId,
                        x: mob.x,
                        y: mob.y
                    });
                }
            });
        }, 1000); // Reduzido para 1 segundo
    }
    
    async start() {
    try {
            console.log('🚀 Starting Simple MMORPG Server...');
        
        this.setupMiddleware();
        this.setupSocketHandlers();
        
        // Start server
        this.server.listen(this.port, () => {
                console.log('🎮 Simple MMORPG Server running on port ' + this.port);
                console.log('📊 Game: http://localhost:' + this.port + '/index.html');
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
    
    respawnMobs() {
        console.log('🔄 Respawning mobs...');
    
    const mobTypes = [
        { type: 'goblin', name: 'Goblin Selvagem', x: 200, y: 200, hp: 50, damage: 10, color: '#228B22' },
        { type: 'wolf', name: 'Lobo Feroz', x: 600, y: 200, hp: 75, damage: 15, color: '#696969' },
        { type: 'orc', name: 'Orc Guerreiro', x: 200, y: 400, hp: 100, damage: 20, color: '#8B4513' },
        { type: 'slime', name: 'Slime Gelatinoso', x: 600, y: 400, hp: 30, damage: 5, color: '#90EE90' }
    ];
    
    mobTypes.forEach((mobData, index) => {
        const mobId = 'mob_' + (index + 1);
        
        // Remover mob existente se houver
        if (this.mobs.has(mobId)) {
            this.io.emit('mobRemove', { id: mobId });
            this.mobs.delete(mobId);
        }
        
        // Criar novo mob
        const mob = {
            id: mobId,
            ...mobData,
            maxHp: mobData.hp,
            exp: Math.floor(mobData.hp * 1.5)
        };
        
        this.mobs.set(mob.id, mob);
        this.io.emit('mobSpawn', mob);
            console.log('👾 Respawned ' + mob.name + ' at (' + mob.x + ', ' + mob.y + ')');
    });
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
