/**
 * Server Gratuito - Versão otimizada para zero budget
 * Stack: Node.js + Express + Socket.io + PostgreSQL + Redis
 * Version 1.0.0 - Free Tier Ready
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');

// Configuração otimizada para free tier
const FREE_TIER_CONFIG = {
    port: process.env.PORT || 8080,
    maxPlayers: 50, // Reduzido para free tier
    maxMobs: 200,   // Reduzido para free tier
    worldWidth: 1000,  // Reduzido para free tier
    worldHeight: 1000, // Reduzido para free tier
    tickRate: 30,   // Reduzido para free tier
    saveInterval: 60000, // 1 minuto
    cacheTimeout: 300000, // 5 minutos
    logLevel: 'warn', // Reduzir logs
    compression: true,
    enableMetrics: false, // Desabilitar métricas para economizar
    enableProfiling: false
};

class FreeTierServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.io = null;
        this.config = FREE_TIER_CONFIG;
        this.players = new Map();
        this.mobs = new Map();
        this.worldState = {
            time: 0,
            weather: 'clear',
            events: [],
            lastSave: Date.now()
        };
        this.isRunning = false;
        
        // Métricas simples
        this.metrics = {
            connections: 0,
            requests: 0,
            errors: 0,
            startTime: Date.now()
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🚀 Inicializando Free Tier Server v1.0.0');
        
        try {
            // Middleware otimizado
            this.setupOptimizedMiddleware();
            
            // Rotas essenciais
            this.setupEssentialRoutes();
            
            // Socket.io otimizado
            this.setupOptimizedSocketIO();
            
            // Game loop otimizado
            this.setupOptimizedGameLoop();
            
            console.log('✅ Free Tier Server inicializado');
        } catch (error) {
            console.error('❌ Falha na inicialização:', error);
            throw error;
        }
    }
    
    setupOptimizedMiddleware() {
        // Security básica
        this.app.use(helmet({
            contentSecurityPolicy: false, // Desabilitar para simplificar
            crossOriginEmbedderPolicy: false
        }));
        
        // CORS
        this.app.use(cors({
            origin: true, // Permitir todos para free tier
            credentials: true
        }));
        
        // Compression
        if (this.config.compression) {
            this.app.use(compression());
        }
        
        // Rate limiting (mais relaxado para free tier)
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 300, // Reduzido para free tier
            message: 'Too many requests',
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '1mb' })); // Reduzido
        this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
        
        // Logging mínimo
        if (this.config.logLevel !== 'none') {
            this.app.use(morgan('combined'));
        }
        
        // Static files
        this.app.use(express.static(path.join(__dirname, '../client'), {
            maxAge: '1d', // Cache agressivo
            etag: true,
            lastModified: true
        }));
    }
    
    setupEssentialRoutes() {
        // Health check essencial
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor((Date.now() - this.metrics.startTime) / 1000),
                memory: process.memoryUsage(),
                players: this.players.size,
                mobs: this.mobs.size,
                connections: this.metrics.connections,
                version: '1.0.0-free'
            });
        });
        
        // Metrics básicas
        this.app.get('/metrics', (req, res) => {
            res.json({
                uptime: Math.floor((Date.now() - this.metrics.startTime) / 1000),
                memory: process.memoryUsage(),
                players: this.players.size,
                mobs: this.mobs.size,
                connections: this.metrics.connections,
                requests: this.metrics.requests,
                errors: this.metrics.errors,
                config: this.config
            });
        });
        
        // API básica
        this.app.get('/api/world/status', (req, res) => {
            res.json({
                players: this.players.size,
                mobs: this.mobs.size,
                maxPlayers: this.config.maxPlayers,
                maxMobs: this.config.maxMobs,
                time: this.worldState.time,
                weather: this.worldState.weather
            });
        });
        
        // Fallback para SPA
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });
    }
    
    setupOptimizedSocketIO() {
        this.server = http.createServer(this.app);
        
        // Socket.io otimizado para free tier
        this.io = socketIo(this.server, {
            cors: { origin: true },
            transports: ['websocket', 'polling'],
            pingTimeout: 30000, // Reduzido
            pingInterval: 10000, // Reduzido
            maxHttpBufferSize: 1e6 // 1MB
        });
        
        this.setupSocketHandlers();
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.metrics.connections++;
            console.log(`🔌 Cliente conectado: ${socket.id} (Total: ${this.metrics.connections})`);
            
            // Player join
            socket.on('player_join', (playerData) => {
                try {
                    const player = this.createPlayer(socket.id, playerData);
                    this.players.set(socket.id, player);
                    socket.playerId = socket.id;
                    
                    // Enviar estado inicial
                    socket.emit('world_init', {
                        player: player,
                        world: {
                            width: this.config.worldWidth,
                            height: this.config.worldHeight,
                            maxPlayers: this.config.maxPlayers
                        },
                        mobs: Array.from(this.mobs.values()).slice(0, 50), // Limitar mobs enviados
                        players: this.getNearbyPlayers(player)
                    });
                    
                    // Notificar outros
                    socket.broadcast.emit('player_joined', {
                        playerId: player.id,
                        playerName: player.name,
                        level: player.level,
                        class: player.class,
                        x: player.x,
                        y: player.y
                    });
                    
                    console.log(`👤 Jogador ${player.name} entrou`);
                } catch (error) {
                    console.error('❌ Erro no player_join:', error);
                    socket.emit('join_error', { error: error.message });
                }
            });
            
            // Player move
            socket.on('player_move', (data) => {
                const player = this.players.get(socket.id);
                if (player) {
                    player.x = data.x;
                    player.y = data.y;
                    player.lastUpdate = Date.now();
                    
                    // Broadcast otimizado
                    socket.broadcast.emit('player_move', {
                        playerId: socket.id,
                        x: data.x,
                        y: data.y
                    });
                }
            });
            
            // Player attack
            socket.on('player_attack', (data) => {
                const player = this.players.get(socket.id);
                if (player) {
                    this.handlePlayerAttack(player, data);
                }
            });
            
            // Chat
            socket.on('chat_message', (data) => {
                const player = this.players.get(socket.id);
                if (player && data.message && data.message.length <= 100) {
                    this.io.emit('chat_message', {
                        channel: 'global',
                        author: player.name,
                        message: data.message,
                        playerId: socket.id
                    });
                }
            });
            
            // Disconnect
            socket.on('disconnect', () => {
                this.metrics.connections--;
                const player = this.players.get(socket.id);
                if (player) {
                    this.players.delete(socket.id);
                    socket.broadcast.emit('player_left', {
                        playerId: socket.id,
                        playerName: player.name
                    });
                    console.log(`👋 Jogador ${player.name} saiu (Total: ${this.metrics.connections})`);
                }
            });
            
            // Error handling
            socket.on('error', (error) => {
                this.metrics.errors++;
                console.error(`❌ Erro no socket ${socket.id}:`, error);
            });
        });
    }
    
    setupOptimizedGameLoop() {
        // Game loop principal
        this.gameLoopInterval = setInterval(() => {
            this.gameLoop();
        }, 1000 / this.config.tickRate);
        
        // Mob spawn loop
        this.mobSpawnInterval = setInterval(() => {
            this.spawnMobs();
        }, 30000); // 30 segundos
        
        // Cleanup loop
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000); // 1 minuto
        
        // World time loop
        this.worldTimeInterval = setInterval(() => {
            this.worldState.time = (this.worldState.time + 1) % 1440;
        }, 60000); // 1 minuto = 1 hora no jogo
    }
    
    gameLoop() {
        // Atualizar mobs
        for (const mob of this.mobs.values()) {
            this.updateMob(mob);
        }
        
        // Verificar colisões
        this.checkCollisions();
        
        // Limitar número de mobs
        if (this.mobs.size > this.config.maxMobs) {
            const oldestMob = this.mobs.values().next().value;
            if (oldestMob) {
                this.mobs.delete(oldestMob.id);
            }
        }
    }
    
    createPlayer(socketId, playerData) {
        return {
            id: socketId,
            name: playerData.name || `Player${socketId.slice(0, 4)}`,
            level: playerData.level || 1,
            class: playerData.class || 'warrior',
            hp: 100,
            maxHp: 100,
            mana: 50,
            maxMana: 50,
            exp: 0,
            maxExp: 100,
            gold: 100,
            x: playerData.x || 400,
            y: playerData.y || 300,
            attack: 10,
            defense: 5,
            speed: 100,
            lastUpdate: Date.now(),
            socket: this.io.sockets.sockets.get(socketId)
        };
    }
    
    spawnMobs() {
        if (this.mobs.size >= this.config.maxMobs) return;
        
        const mobTypes = [
            { name: 'Goblin', hp: 30, attack: 5, exp: 15, gold: 5 },
            { name: 'Wolf', hp: 50, attack: 8, exp: 25, gold: 10 },
            { name: 'Orc', hp: 80, attack: 12, exp: 40, gold: 20 }
        ];
        
        const mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
        
        const mob = {
            id: `mob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...mobType,
            maxHp: mobType.hp,
            x: Math.random() * this.config.worldWidth,
            y: Math.random() * this.config.worldHeight,
            targetX: 0,
            targetY: 0,
            speed: 50,
            lastUpdate: Date.now()
        };
        
        this.mobs.set(mob.id, mob);
    }
    
    updateMob(mob) {
        const now = Date.now();
        if (now - mob.lastUpdate < 1000) return; // Update a cada segundo
        
        mob.lastUpdate = now;
        
        // Movimento aleatório simples
        if (Math.random() < 0.1) {
            mob.targetX = mob.x + (Math.random() - 0.5) * 100;
            mob.targetY = mob.y + (Math.random() - 0.5) * 100;
        }
        
        // Mover
        const dx = mob.targetX - mob.x;
        const dy = mob.targetY - mob.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const moveSpeed = mob.speed / this.config.tickRate;
            mob.x += (dx / distance) * moveSpeed;
            mob.y += (dy / distance) * moveSpeed;
            
            // Limitar ao mundo
            mob.x = Math.max(0, Math.min(mob.x, this.config.worldWidth));
            mob.y = Math.max(0, Math.min(mob.y, this.config.worldHeight));
        }
    }
    
    checkCollisions() {
        for (const player of this.players.values()) {
            for (const mob of this.mobs.values()) {
                const distance = Math.sqrt(
                    Math.pow(player.x - mob.x, 2) + 
                    Math.pow(player.y - mob.y, 2)
                );
                
                if (distance < 30) { // Colisão
                    this.handleCombat(player, mob);
                }
            }
        }
    }
    
    handleCombat(player, mob) {
        const now = Date.now();
        if (player.lastAttack && now - player.lastAttack < 1000) return; // 1 segundo cooldown
        
        player.lastAttack = now;
        
        // Calcular dano
        const damage = Math.max(1, player.attack - Math.floor(Math.random() * 5));
        mob.hp = Math.max(0, mob.hp - damage);
        
        // Notificar jogador
        const socket = this.io.sockets.sockets.get(player.id);
        if (socket) {
            socket.emit('mob_damage', {
                mobId: mob.id,
                damage: damage,
                currentHp: mob.hp,
                maxHp: mob.maxHp
            });
        }
        
        // Mob morreu?
        if (mob.hp <= 0) {
            player.exp += mob.exp;
            player.gold += mob.gold;
            
            // Notificar todos
            this.io.emit('mob_death', {
                mobId: mob.id,
                killer: player.name,
                rewards: { exp: mob.exp, gold: mob.gold }
            });
            
            // Remover mob
            this.mobs.delete(mob.id);
            
            // Notificar jogador
            if (socket) {
                socket.emit('reward_received', {
                    exp: mob.exp,
                    gold: mob.gold
                });
            }
        }
    }
    
    handlePlayerAttack(player, data) {
        // Implementar ataque do jogador
        const now = Date.now();
        if (player.lastAttack && now - player.lastAttack < 1000) return;
        
        player.lastAttack = now;
        
        // Encontrar mob alvo
        for (const mob of this.mobs.values()) {
            const distance = Math.sqrt(
                Math.pow(player.x - mob.x, 2) + 
                Math.pow(player.y - mob.y, 2)
            );
            
            if (distance < 50) { // Range de ataque
                this.handleCombat(player, mob);
                break;
            }
        }
    }
    
    getNearbyPlayers(player) {
        const nearby = [];
        const range = 500;
        
        for (const [id, otherPlayer] of this.players) {
            if (id !== player.id) {
                const distance = Math.sqrt(
                    Math.pow(player.x - otherPlayer.x, 2) + 
                    Math.pow(player.y - otherPlayer.y, 2)
                );
                
                if (distance < range) {
                    nearby.push({
                        id: otherPlayer.id,
                        name: otherPlayer.name,
                        level: otherPlayer.level,
                        class: otherPlayer.class,
                        x: otherPlayer.x,
                        y: otherPlayer.y
                    });
                }
            }
        }
        
        return nearby;
    }
    
    cleanup() {
        const now = Date.now();
        
        // Remover jogadores inativos
        for (const [id, player] of this.players) {
            if (now - player.lastUpdate > 300000) { // 5 minutos
                this.players.delete(id);
                this.io.emit('player_left', {
                    playerId: id,
                    playerName: player.name
                });
            }
        }
        
        // Limpar mobs antigos
        if (this.mobs.size > this.config.maxMobs * 0.8) {
            const mobsToRemove = Math.floor(this.mobs.size * 0.2);
            const mobArray = Array.from(this.mobs.values());
            
            for (let i = 0; i < mobsToRemove; i++) {
                this.mobs.delete(mobArray[i].id);
            }
        }
        
        // Log de cleanup
        if (this.config.logLevel === 'debug') {
            console.log(`🧹 Cleanup: ${this.players.size} players, ${this.mobs.size} mobs`);
        }
    }
    
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, (error) => {
                if (error) {
                    console.error('❌ Erro ao iniciar servidor:', error);
                    reject(error);
                } else {
                    this.isRunning = true;
                    console.log(`🚀 Free Tier Server rodando na porta ${this.config.port}`);
                    console.log(`🌐 Acesse: http://localhost:${this.config.port}`);
                    console.log(`📊 Health: http://localhost:${this.config.port}/health`);
                    console.log(`📈 Metrics: http://localhost:${this.config.port}/metrics`);
                    console.log(`⚙️ Config: Max Players=${this.config.maxPlayers}, Max Mobs=${this.config.maxMobs}`);
                    resolve();
                }
            });
        });
    }
    
    async stopServer() {
        if (!this.isRunning) return;
        
        console.log('🛑 Parando Free Tier Server...');
        
        // Limpar intervals
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        if (this.mobSpawnInterval) clearInterval(this.mobSpawnInterval);
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        if (this.worldTimeInterval) clearInterval(this.worldTimeInterval);
        
        // Fechar conexões
        if (this.io) {
            this.io.close();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        this.isRunning = false;
        console.log('✅ Free Tier Server parado');
    }
    
    getStats() {
        return {
            uptime: Math.floor((Date.now() - this.metrics.startTime) / 1000),
            memory: process.memoryUsage(),
            players: this.players.size,
            mobs: this.mobs.size,
            connections: this.metrics.connections,
            requests: this.metrics.requests,
            errors: this.metrics.errors,
            config: this.config
        };
    }
}

// Iniciar servidor
if (require.main === module) {
    const server = new FreeTierServer();
    
    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\n📡 Recebido sinal ${signal}, iniciando shutdown...`);
        
        try {
            await server.stopServer();
            console.log('✅ Shutdown concluído');
            process.exit(0);
        } catch (error) {
            console.error('❌ Erro no shutdown:', error);
            process.exit(1);
        }
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    // Iniciar servidor
    server.startServer().catch(console.error);
}

module.exports = FreeTierServer;
