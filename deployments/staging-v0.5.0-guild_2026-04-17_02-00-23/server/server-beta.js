/**
 * Server Beta - Servidor Principal para Beta Testing
 * Configuração completa do servidor com todos os sistemas beta
 * Version 1.0.0 - Beta Ready
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importar sistemas
const DatabaseService = require('./services/DatabaseService');
const RedisCacheService = require('./cache/RedisCacheService');
const BetaGameController = require('./controllers/BetaGameController');

class BetaServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.io = null;
        this.db = null;
        this.cache = null;
        this.gameController = null;
        this.port = process.env.PORT || 3000;
        this.isRunning = false;
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Inicializando Beta Server v1.0.0');
        
        try {
            // Configurar middleware
            this.setupMiddleware();
            
            // Configurar rotas
            this.setupRoutes();
            
            // Inicializar serviços
            await this.initializeServices();
            
            // Configurar Socket.io
            this.setupSocketIO();
            
            // Iniciar servidor
            await this.startServer();
            
            console.log('✅ Beta Server inicializado com sucesso');
        } catch (error) {
            console.error('❌ Falha na inicialização do servidor:', error);
            throw error;
        }
    }
    
    setupMiddleware() {
        // Security
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io", "https://cdnjs.cloudflare.com"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "ws:", "wss:", "https://cdn.socket.io"]
                }
            }
        }));
        
        // CORS
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
            credentials: true
        }));
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 1000, // limite de 1000 requisições
            message: 'Muitas requisições. Tente novamente mais tarde.',
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Logging
        this.app.use((req, res, next) => {
            console.log(`📡 ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0-beta',
                players: this.gameController ? this.gameController.players.size : 0,
                mobs: this.gameController ? this.gameController.mobs.size : 0
            });
        });
        
        // API Routes
        this.app.get('/api/world/status', async (req, res) => {
            try {
                const status = await this.gameController.getWorldStatus();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/world/mobs', async (req, res) => {
            try {
                const { x, y, width = 500, height = 500 } = req.query;
                const mobs = await this.gameController.getMobsInArea({
                    x: parseInt(x) || 0,
                    y: parseInt(y) || 0,
                    width: parseInt(width),
                    height: parseInt(height)
                });
                res.json(mobs);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/events', async (req, res) => {
            try {
                const events = await this.gameController.getEvents();
                res.json(events);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.post('/api/events/:id/join', async (req, res) => {
            try {
                const { playerId } = req.body;
                const result = await this.gameController.joinEvent(playerId, req.params.id);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Static files
        this.app.use(express.static(path.join(__dirname, '../client')));
        this.app.use('/art', express.static(path.join(__dirname, '../art')));
        
        // Fallback para SPA
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });
    }
    
    async initializeServices() {
        console.log('🔧 Inicializando serviços...');
        
        // Database Service
        this.db = new DatabaseService();
        await this.db.initialize();
        console.log('✅ Database Service inicializado');
        
        // Redis Cache Service
        this.cache = new RedisCacheService();
        await this.cache.initialize();
        console.log('✅ Redis Cache Service inicializado');
        
        // Game Controller
        this.gameController = new BetaGameController();
        console.log('✅ Beta Game Controller inicializado');
        
        console.log('✅ Todos os serviços inicializados');
    }
    
    setupSocketIO() {
        // Criar servidor HTTP
        this.server = http.createServer(this.app);
        
        // Configurar Socket.io
        this.io = socketIo(this.server, {
            cors: {
                origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        // Configurar handlers do Socket.io
        this.setupSocketHandlers();
        
        console.log('✅ Socket.io configurado');
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Cliente conectado: ${socket.id}`);
            
            // Player join
            socket.on('player_join', async (playerData) => {
                try {
                    const player = await this.gameController.handlePlayerJoin(socket, playerData);
                    socket.emit('join_success', player);
                    socket.broadcast.emit('player_joined', {
                        playerId: player.id,
                        playerName: player.name,
                        level: player.level,
                        class: player.class,
                        x: player.x,
                        y: player.y
                    });
                } catch (error) {
                    socket.emit('join_error', { error: error.message });
                }
            });
            
            // Player move
            socket.on('player_move', (data) => {
                this.gameController.handlePlayerMove(socket.playerId, data);
                socket.broadcast.emit('player_move', {
                    playerId: socket.playerId,
                    ...data
                });
            });
            
            // Player attack
            socket.on('player_attack', (data) => {
                this.gameController.handlePlayerAttack(socket.playerId, data);
            });
            
            // Player use skill
            socket.on('player_use_skill', (data) => {
                this.gameController.handlePlayerUseSkill(socket.playerId, data.skillIndex);
            });
            
            // Chat message
            socket.on('chat_message', (data) => {
                this.gameController.handleChatMessage(socket.playerId, data);
            });
            
            // Player click
            socket.on('player_click', (data) => {
                socket.broadcast.emit('player_click', {
                    playerId: socket.playerId,
                    ...data
                });
            });
            
            // Event join
            socket.on('event_join', async (eventId) => {
                try {
                    const result = await this.gameController.joinEvent(socket.playerId, eventId);
                    socket.emit('event_join_result', result);
                } catch (error) {
                    socket.emit('event_join_error', { error: error.message });
                }
            });
            
            // Disconnect
            socket.on('disconnect', () => {
                console.log(`🔌 Cliente desconectado: ${socket.id}`);
                if (socket.playerId) {
                    this.gameController.handlePlayerLeave(socket.playerId);
                    socket.broadcast.emit('player_left', {
                        playerId: socket.playerId
                    });
                }
            });
            
            // Error handling
            socket.on('error', (error) => {
                console.error(`❌ Erro no socket ${socket.id}:`, error);
            });
        });
        
        console.log('✅ Socket handlers configurados');
    }
    
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    console.error('❌ Erro ao iniciar servidor:', error);
                    reject(error);
                } else {
                    this.isRunning = true;
                    console.log(`🚀 Beta Server rodando na porta ${this.port}`);
                    console.log(`🌐 Acesse: http://localhost:${this.port}`);
                    console.log(`📊 Health check: http://localhost:${this.port}/health`);
                    resolve();
                }
            });
        });
    }
    
    async stopServer() {
        if (!this.isRunning) return;
        
        console.log('🛑 Parando Beta Server...');
        
        // Fechar conexões
        if (this.io) {
            this.io.close();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        // Fechar serviços
        if (this.cache) {
            await this.cache.close();
        }
        
        if (this.db) {
            await this.db.close();
        }
        
        this.isRunning = false;
        console.log('✅ Beta Server parado com sucesso');
    }
    
    // Métodos de monitoramento
    getStats() {
        return {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            players: this.gameController ? this.gameController.players.size : 0,
            mobs: this.gameController ? this.gameController.mobs.size : 0,
            connections: this.io ? this.io.engine.clientsCount : 0,
            cache: this.cache ? this.cache.getStats() : null,
            database: this.db ? this.db.getStats() : null
        };
    }
    
    async healthCheck() {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            services: {}
        };
        
        // Verificar Database
        try {
            if (this.db) {
                const dbHealth = await this.db.healthCheck();
                health.services.database = dbHealth;
            }
        } catch (error) {
            health.services.database = { status: 'unhealthy', error: error.message };
            health.status = 'degraded';
        }
        
        // Verificar Cache
        try {
            if (this.cache) {
                const cacheHealth = await this.cache.healthCheck();
                health.services.cache = cacheHealth;
            }
        } catch (error) {
            health.services.cache = { status: 'unhealthy', error: error.message };
            health.status = 'degraded';
        }
        
        // Verificar Game Controller
        try {
            if (this.gameController) {
                const gameStats = this.gameController.getWorldStatus();
                health.services.game = { status: 'healthy', ...gameStats };
            }
        } catch (error) {
            health.services.game = { status: 'unhealthy', error: error.message };
            health.status = 'degraded';
        }
        
        return health;
    }
    
    // Graceful shutdown
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n📡 Recebido sinal ${signal}, iniciando shutdown gracioso...`);
            
            try {
                // Parar de aceitar novas conexões
                if (this.server) {
                    this.server.close();
                }
                
                // Aguardar conexões existentes fecharem
                if (this.io) {
                    await new Promise(resolve => {
                        this.io.close(resolve);
                    });
                }
                
                // Fechar serviços
                await this.stopServer();
                
                console.log('✅ Shutdown gracioso concluído');
                process.exit(0);
            } catch (error) {
                console.error('❌ Erro no shutdown:', error);
                process.exit(1);
            }
        };
        
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        
        // Tratamento de erros não capturados
        process.on('uncaughtException', (error) => {
            console.error('❌ Erro não capturado:', error);
            shutdown('uncaughtException');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Rejeição não tratada:', reason);
            shutdown('unhandledRejection');
        });
    }
}

// Iniciar servidor
if (require.main === module) {
    const server = new BetaServer();
    
    // Configurar shutdown gracioso
    server.setupGracefulShutdown();
    
    // Exportar para uso em módulos
    module.exports = BetaServer;
} else {
    module.exports = BetaServer;
}
