/**
 * API Router - Sistema Centralizado de Rotas
 * Organiza e gerencia todas as rotas da API de forma escalável
 * Version 1.0.0 - Refactoring
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

class APIRouter {
    constructor() {
        this.router = express.Router();
        this.rateLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 100, // limite de 100 requisições por janela
            message: 'Muitas requisições. Tente novamente mais tarde.'
        });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    
    /**
     * Configura middleware para todas as rotas
     */
    setupMiddleware() {
        console.log('🔧 Configurando middleware da API');
        
        // Segurança
        this.router.use(helmet());
        this.router.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));
        
        // Rate limiting
        this.router.use(this.rateLimiter);
        
        // Parsing
        this.router.use(express.json({ limit: '10mb' }));
        this.router.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
        // Logging
        this.router.use((req, res, next) => {
            console.log(`📡 ${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }
    
    /**
     * Configura todas as rotas da API
     */
    setupRoutes() {
        console.log('🛣️ Configurando rotas da API');
        
        // Rotas de autenticação
        this.setupAuthRoutes();
        
        // Rotas de jogador
        this.setupPlayerRoutes();
        
        // Rotas de jogo
        this.setupGameRoutes();
        
        // Rotas de administração
        this.setupAdminRoutes();
        
        // Rota de saúde
        this.setupHealthRoutes();
    }
    
    /**
     * Rotas de autenticação
     */
    setupAuthRoutes() {
        const authController = require('../controllers/AuthController');
        
        // Login
        this.router.post('/auth/login', this.rateLimiter, authController.login);
        
        // Registro
        this.router.post('/auth/register', this.rateLimiter, authController.register);
        
        // Logout
        this.router.post('/auth/logout', authController.logout);
        
        // Refresh token
        this.router.post('/auth/refresh', authController.refreshToken);
        
        // Verificar token
        this.router.get('/auth/verify', authController.verifyToken);
    }
    
    /**
     * Rotas de jogador
     */
    setupPlayerRoutes() {
        const playerController = require('../controllers/PlayerController');
        
        // Obter dados do jogador
        this.router.get('/player/:id', playerController.getPlayer);
        
        // Atualizar jogador
        this.router.put('/player/:id', playerController.updatePlayer);
        
        // Obter inventário
        this.router.get('/player/:id/inventory', playerController.getInventory);
        
        // Obter skills
        this.router.get('/player/:id/skills', playerController.getSkills);
        
        // Level up
        this.router.post('/player/:id/levelup', playerController.levelUp);
        
        // Usar skill
        this.router.post('/player/:id/useskill', playerController.useSkill);
    }
    
    /**
     * Rotas de jogo
     */
    setupGameRoutes() {
        const gameController = require('../controllers/GameController');
        
        // Status do mundo
        this.router.get('/game/world/status', gameController.getWorldStatus);
        
        // Obter mobs na área
        this.router.get('/game/world/mobs', gameController.getMobsInArea);
        
        // Spawn de mobs
        this.router.post('/game/world/spawnmob', gameController.spawnMob);
        
        // Obter eventos
        this.router.get('/game/events', gameController.getEvents);
        
        // Participar de evento
        this.router.post('/game/events/:id/join', gameController.joinEvent);
    }
    
    /**
     * Rotas de administração
     */
    setupAdminRoutes() {
        const adminController = require('../controllers/AdminController');
        
        // Estatísticas do servidor
        this.router.get('/admin/stats', adminController.getServerStats);
        
        // Gerenciar jogadores
        this.router.get('/admin/players', adminController.getPlayers);
        
        // Kick de jogador
        this.router.post('/admin/players/:id/kick', adminController.kickPlayer);
        
        // Ban de jogador
        this.router.post('/admin/players/:id/ban', adminController.banPlayer);
        
        // Recarregar configurações
        this.router.post('/admin/reload', adminController.reloadConfig);
    }
    
    /**
     * Rotas de saúde e monitoramento
     */
    setupHealthRoutes() {
        // Health check
        this.router.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0'
            });
        });
        
        // Metrics
        this.router.get('/metrics', (req, res) => {
            res.json({
                requests: this.getMetrics(),
                performance: this.getPerformanceMetrics(),
                errors: this.getErrorMetrics()
            });
        });
    }
    
    /**
     * Configura tratamento de erros
     */
    setupErrorHandling() {
        // 404 - Not Found
        this.router.use('*', (req, res) => {
            res.status(404).json({
                error: 'Endpoint não encontrado',
                path: req.path,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        });
        
        // 500 - Internal Server Error
        this.router.use((error, req, res, next) => {
            console.error('❌ Erro na API:', error);
            
            res.status(500).json({
                error: 'Erro interno do servidor',
                message: error.message,
                timestamp: new Date().toISOString(),
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        });
    }
    
    /**
     * Obtém métricas de requisições
     */
    getMetrics() {
        return {
            total: this.requestCount || 0,
            success: this.successCount || 0,
            error: this.errorCount || 0,
            averageResponseTime: this.averageResponseTime || 0
        };
    }
    
    /**
     * Obtém métricas de performance
     */
    getPerformanceMetrics() {
        return {
            cpu: process.cpuUsage(),
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
    
    /**
     * Obtém métricas de erro
     */
    getErrorMetrics() {
        return {
            total: this.errorCount || 0,
            recent: this.recentErrors || []
        };
    }
    
    /**
     * Obtém router configurado
     */
    getRouter() {
        return this.router;
    }
}

module.exports = APIRouter;
