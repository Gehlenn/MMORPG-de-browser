/**
 * MMORPG Browser Server
 * Version 0.3 - First Playable Gameplay Systems
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Import game systems
const database = require("../database/database.js");
const ErrorCatalog = require("./errorCatalog.js");
const MobSpawner = require("./world/mobSpawner.js");
const SimpleCombat = require("./combat/simpleCombat.js");
const startMap = require("./world/maps/startMap.js");

// Version 0.3.1 - First Playable Gameplay
class MMOServer {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.isRunning = false;
        
        // Initialize Error Catalog
        this.errorCatalog = new ErrorCatalog();
        
        // Initialize Express app
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Initialize Socket.IO
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        // Initialize game systems
        this.database = database;
        this.errorCatalog = new ErrorCatalog();
        this.mobSpawner = new MobSpawner();
        this.combatSystem = new SimpleCombat();
        this.gameMap = startMap;
        
        // Set server references
        this.mobSpawner.setServer(this);
        this.combatSystem.setServer(this);
        
        // Simple event emitter
        this.eventEmitter = {
            emit: (event, ...args) => {
                console.log(`Event: ${event}`, args);
            }
        };
        
        // Game state
        this.players = new Map();
        this.playersByName = new Map();
        this.npcs = new Map();
        this.items = new Map();
        
        // Setup static files and routes
        this.setupRoutes();
        this.setupSocketHandlers();
        
        // Bind error handlers
        this.setupErrorHandlers();
    }
    
    setupRoutes() {
        // Serve static files from client directory
        this.app.use(express.static(path.join(__dirname, '../client')));
        
        // Serve art assets from art directory
        this.app.use('/art', express.static(path.join(__dirname, '../art')));
        
        // API routes
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'online',
                players: this.players.size,
                version: '0.3.1',
                timestamp: new Date().toISOString()
            });
        });
        
        this.app.get('/api/world/stats', (req, res) => {
            res.json({
                players: this.players.size,
                npcs: this.npcs.size,
                items: this.items.size,
                regions: this.worldManager.getRegionCount ? this.worldManager.getRegionCount() : 0
            });
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
        })
        
        // Simple create account handler
        socket.on("createAccount", (data) => {
            console.log("Creating account:", data.username)
            
            const account = {
                username: data.username,
                email: data.email || `${data.username}@test.com`,
                password: data.password,
                createdAt: new Date().toISOString(),
                id: Date.now().toString()
            }
            
            // In a real app, save to database
            // For now, just send success
            socket.emit("create_account_success", account)
            
            console.log("✅ Account created:", data.username)
        })
        
        // Request world handler
        socket.on("requestWorld", () => {
            console.log("🌍 World requested by:", socket.id)
            
            const player = this.players.get(socket.id)
            const entities = Array.from(this.mobs.values())
            
            socket.emit("world_init", {
                player: player,
                entities: entities
            })
        })
        
        // Combat handler
        socket.on('player_attack', (data) => {
            this.combatSystem.handlePlayerAttack(socket, data);
        });
        
        // Authentication and character management
        socket.on('login', (data) => this.handleLogin(socket, data));
        socket.on('request_world_init', (data) => this.handleWorldInitRequest(socket, data));
        
        socket.on('createAccount', async (data) => {
            try {
                const { username, email, password } = data;
                
                // Input validation
                const validationError = this.validateAccountInput(username, email, password);
                if (validationError) {
                    socket.emit('createError', validationError);
                    return;
                }
                
                // Check if username exists
                const existingUsername = await this.database.get(
                    'SELECT username FROM accounts WHERE username = ?',
                    [username]
                );
                
                if (existingUsername) {
                    const errorAnalysis = this.errorCatalog.analyzeError(
                        new Error('Username already taken'), 
                        { operation: 'createAccount', username: username }
                    );
                    socket.emit('createError', this.errorCatalog.formatForClient(errorAnalysis));
                    return;
                }
                
                // Check if email exists
                const existingEmail = await this.database.get(
                    'SELECT email FROM accounts WHERE email = ?',
                    [email]
                );
                
                if (existingEmail) {
                    const errorAnalysis = this.errorCatalog.analyzeError(
                        new Error('Email already taken'), 
                        { operation: 'createAccount', email: email }
                    );
                    socket.emit('createError', this.errorCatalog.formatForClient(errorAnalysis));
                    return;
                }
                
                // Create account with password hashing
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                
                await this.database.run(`
                    INSERT INTO accounts (username, email, password_hash)
                    VALUES (?, ?, ?)
                `, [username, email, hashedPassword]);
                
                socket.emit('createSuccess', { 
                    message: 'Conta criada com sucesso! Faça login.'
                });
                
            } catch (error) {
                console.error('Account creation error:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    context: { operation: 'createAccount', username: data.username, email: data.email }
                });
                
                // Analisar erro com o catálogo
                const errorAnalysis = this.errorCatalog.analyzeError(error, {
                    operation: 'createAccount',
                    username: data.username,
                    email: data.email,
                    socketId: socket.id
                });
                
                // Log detalhado no servidor
                console.error('Error Analysis:', this.errorCatalog.formatForLogging(errorAnalysis));
                
                // Enviar erro formatado ao cliente
                socket.emit('createError', this.errorCatalog.formatForClient(errorAnalysis));
            }
        });
        
        socket.on('createCharacter', async (data) => {
            try {
                const { name, class: characterClass, race } = data;
                
                console.log('🐛 DEBUG: createCharacter recebido:', { name, characterClass, race });
                
                // Simplificado - sem validação por enquanto
                if (!name) {
                    socket.emit('createError', { 
                        message: 'Nome do personagem é obrigatório',
                        code: 'MISSING_NAME'
                    });
                    return;
                }
                
                // Check if name exists
                const existing = await this.database.get(
                    'SELECT name FROM characters WHERE name = ?',
                    [name]
                );
                
                if (existing) {
                    socket.emit('createError', { 
                        message: 'Este nome de personagem já está em uso',
                        code: 'NAME_TAKEN'
                    });
                    return;
                }
                
                console.log('🐛 DEBUG: Inserindo personagem no banco...');
                
                // Create new character
                await this.database.run(`
                    INSERT INTO characters (player_id, name, class, race, level, x, y)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [socket.id, name, characterClass || 'recruta', race || 'human', 1, 100, 100]);
                
                console.log('🐛 DEBUG: Personagem inserido com sucesso!');
                
                // Update player data
                const characterData = {
                    id: socket.id,
                    name: name,
                    class: characterClass || 'recruta',
                    race: race || 'human',
                    level: 1,
                    x: 100,
                    y: 100,
                    health: 100,
                    maxHealth: 100,
                    mana: 50,
                    maxMana: 50,
                    exp: 0,
                    expToNext: 100,
                    strength: 10,
                    defense: 5,
                    speed: 8,
                    magic: 3
                };
                
                socket.playerData = characterData;
                
                socket.emit('createSuccess', { 
                    character: characterData,
                    message: 'Personagem criado com sucesso!'
                });
                
                console.log('🐛 DEBUG: Success emitido para cliente');
                
            } catch (error) {
                console.error('❌ ERRO REAL na criação de personagem:', error);
                console.error('❌ Stack:', error.stack);
                
                socket.emit('createError', { 
                    message: 'Erro ao criar personagem: ' + error.message,
                    code: 'DATABASE_ERROR'
                });
            }
        });
        
        socket.on('logout', () => this.handleLogout(socket));
        
        // Movement and position
        socket.on('move', (data) => this.handleMove(socket, data));
        socket.on('teleport', (data) => this.handleTeleport(socket, data));
        
        // Combat
        socket.on('attack', (data) => this.handleAttack(socket, data));
        socket.on('useSkill', (data) => this.handleUseSkill(socket, data));
        
        // Inventory
        socket.on('pickupItem', (data) => this.handlePickupItem(socket, data));
        socket.on('dropItem', (data) => this.handleDropItem(socket, data));
        socket.on('useItem', (data) => this.handleUseItem(socket, data));
        
        // Chat
        socket.on('chatMessage', (data) => this.handleChatMessage(socket, data));
        
        // Trading
        socket.on('tradeRequest', (data) => this.handleTradeRequest(socket, data));
        socket.on('tradeResponse', (data) => this.handleTradeResponse(socket, data));
    }
    
    // Input validation methods
    validateAccountInput(username, email, password) {
        // Username validation
        if (!username || typeof username !== 'string') {
            return {
                message: 'Nome de usuário é obrigatório',
                code: 'MISSING_USERNAME',
                shortExplanation: 'Campo obrigatório faltando',
                suggestion: 'Preencha o nome de usuário'
            };
        }
        
        if (username.length < 3) {
            return {
                message: 'Nome de usuário deve ter pelo menos 3 caracteres',
                code: 'USERNAME_TOO_SHORT',
                shortExplanation: 'Nome muito curto',
                suggestion: 'Use pelo menos 3 caracteres'
            };
        }
        
        if (username.length > 30) {
            return {
                message: 'Nome de usuário muito longo',
                code: 'USERNAME_TOO_LONG',
                shortExplanation: 'Nome excede o limite',
                suggestion: 'Use no máximo 30 caracteres'
            };
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return {
                message: 'Nome de usuário apenas pode conter letras, números e _',
                code: 'INVALID_USERNAME_CHARS',
                shortExplanation: 'Caracteres inválidos',
                suggestion: 'Use apenas letras, números e underscore'
            };
        }
        
        // Email validation
        if (!email || typeof email !== 'string') {
            return {
                message: 'Email é obrigatório',
                code: 'MISSING_EMAIL',
                shortExplanation: 'Campo obrigatório faltando',
                suggestion: 'Preencha o email'
            };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                message: 'Email inválido',
                code: 'INVALID_EMAIL',
                shortExplanation: 'Formato de email incorreto',
                suggestion: 'Use um email válido como exemplo@dominio.com'
            };
        }
        
        if (email.length > 100) {
            return {
                message: 'Email muito longo',
                code: 'EMAIL_TOO_LONG',
                shortExplanation: 'Email excede o limite',
                suggestion: 'Use no máximo 100 caracteres'
            };
        }
        
        // Password validation
        if (!password || typeof password !== 'string') {
            return {
                message: 'Senha é obrigatória',
                code: 'MISSING_PASSWORD',
                shortExplanation: 'Campo obrigatório faltando',
                suggestion: 'Preencha a senha'
            };
        }
        
        if (password.length < 6) {
            return {
                message: 'Senha deve ter pelo menos 6 caracteres',
                code: 'PASSWORD_TOO_SHORT',
                shortExplanation: 'Senha muito curta',
                suggestion: 'Use pelo menos 6 caracteres para segurança'
            };
        }
        
        if (password.length > 100) {
            return {
                message: 'Senha muito longa',
                code: 'PASSWORD_TOO_LONG',
                shortExplanation: 'Senha excede o limite',
                suggestion: 'Use no máximo 100 caracteres'
            };
        }
        
        return null; // Validation passed
    }
    
    validateCharacterInput(name, characterClass, race) {
        // Name validation
        if (!name || typeof name !== 'string') {
            return {
                message: 'Nome do personagem é obrigatório',
                code: 'MISSING_CHARACTER_NAME',
                shortExplanation: 'Campo obrigatório faltando',
                suggestion: 'Preencha o nome do personagem'
            };
        }
        
        if (name.length < 2) {
            return {
                message: 'Nome do personagem deve ter pelo menos 2 caracteres',
                code: 'CHARACTER_NAME_TOO_SHORT',
                shortExplanation: 'Nome muito curto',
                suggestion: 'Use pelo menos 2 caracteres'
            };
        }
        
        if (name.length > 30) {
            return {
                message: 'Nome do personagem muito longo',
                code: 'CHARACTER_NAME_TOO_LONG',
                shortExplanation: 'Nome excede o limite',
                suggestion: 'Use no máximo 30 caracteres'
            };
        }
        
        if (!/^[a-zA-Z0-9_\-\s]+$/.test(name)) {
            return {
                message: 'Nome do personagem contém caracteres inválidos',
                code: 'INVALID_CHARACTER_NAME',
                shortExplanation: 'Caracteres não permitidos',
                suggestion: 'Use apenas letras, números, espaços, _ e -'
            };
        }
        
        return null; // Validation passed
    }
    
    async handleLogin(socket, data) {
        const { username, password } = data;
        
        try {
            // Verify user exists and get hashed password
            const user = await this.database.get(
                'SELECT id, username, password_hash FROM accounts WHERE username = ?',
                [username]
            );
            
            if (!user) {
                socket.emit('loginError', { 
                    message: 'Usuário não encontrado',
                    code: 'USER_NOT_FOUND'
                });
                return;
            }
            
            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            
            if (!isValidPassword) {
                socket.emit('loginError', { 
                    message: 'Senha incorreta',
                    code: 'INVALID_PASSWORD'
                });
                return;
            }
            
            // Create or update player data
            let player = this.players.get(socket.id);
            if (!player) {
                player = {
                    playerId: socket.id,
                    name: username,
                    userId: user.id,
                    level: 1,
                    x: 100,
                    y: 100,
                    health: 100,
                    maxHealth: 100,
                    mana: 50,
                    maxMana: 50,
                    exp: 0,
                    expToNext: 100,
                    strength: 10,
                    defense: 5,
                    speed: 8,
                    magic: 3,
                    inventory: [],
                    equipment: { weapon: null, armor: null, accessory: null },
                    quests: [],
                    guild: null,
                    isOnline: true,
                    lastActivity: Date.now()
                };
                this.players.set(socket.id, player);
            } else {
                player.name = username;
                player.userId = user.id;
                player.isOnline = true;
                player.lastActivity = Date.now();
            }
            
            this.playersByName.set(username, player);
            
            socket.emit('loginSuccess', {
                player: {
                    id: player.playerId,
                    name: player.name,
                    level: player.level,
                    x: player.x,
                    y: player.y,
                    health: player.health,
                    maxHealth: player.maxHealth,
                    mana: player.mana,
                    maxMana: player.maxMana,
                    exp: player.exp,
                    expToNext: player.expToNext
                }
            });
            
            // Send world initialization data
            this.sendWorldInit(socket, player);
            
            console.log(`Player logged in: ${username}`);
            
        } catch (error) {
            console.error('Login error:', error);
            socket.emit('loginError', { 
                message: 'Erro ao fazer login',
                code: 'LOGIN_ERROR'
            });
        }
    }
    
    sendWorldInit(socket, player) {
        // Create world initialization data
        const worldData = {
            player: {
                id: player.playerId,
                name: player.name,
                level: player.level,
                x: player.x,
                y: player.y,
                health: player.health,
                maxHealth: player.maxHealth
            },
            entities: [],
            map: {
                name: 'village_day',
                width: 1200,
                height: 700,
                tileSize: 64
            }
        };
        
        // Add other players as entities
        for (const [otherId, otherPlayer] of this.players) {
            if (otherId !== socket.id && otherPlayer.isOnline) {
                worldData.entities.push({
                    id: otherPlayer.playerId,
                    type: 'player',
                    name: otherPlayer.name,
                    x: otherPlayer.x,
                    y: otherPlayer.y,
                    health: otherPlayer.health,
                    maxHealth: otherPlayer.maxHealth
                });
            }
        }
        
        // Send world initialization
        socket.emit('world_init', worldData);
        
        console.log(`🌍 Sent world init to ${player.name}:`, {
            playerCount: worldData.entities.length + 1,
            map: worldData.map.name
        });
    }
    
    handleWorldInitRequest(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) {
            socket.emit('error', { message: 'Player not logged in' });
            return;
        }
        
        console.log(`🌍 World init request from ${player.name}`);
        this.sendWorldInit(socket, player);
    }
    
    handleLogout(socket) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        // Remove from name lookup
        this.playersByName.delete(player.name);
        
        // Reset player data
        player.name = null;
        
        socket.emit('logoutSuccess');
        console.log(`Player logged out: ${player.name}`);
    }
    
    handleMove(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { x, y } = data;
        
        // Validate movement (simplified)
        const distance = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
        if (distance > 50) { // Max movement per tick
            return;
        }
        
        // Update position
        player.x = x;
        player.y = y;
        player.lastActivity = Date.now();
        
        // Broadcast to nearby players
        this.broadcastToNearby(player, 'playerMoved', {
            playerId: player.playerId,
            name: player.name,
            x: x,
            y: y
        });
        
        // Send confirmation
        socket.emit('moveSuccess', { x, y });
    }
    
    handleTeleport(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { x, y } = data;
        
        // Update position (no validation for teleport)
        player.x = x;
        player.y = y;
        player.lastActivity = Date.now();
        
        // Broadcast to all players
        this.io.emit('playerTeleported', {
            playerId: player.playerId,
            name: player.name,
            x: x,
            y: y
        });
        
        // Send confirmation
        socket.emit('teleportSuccess', { x, y });
    }
    
    handleAttack(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { targetId } = data;
        const target = this.players.get(targetId);
        
        if (!target) {
            socket.emit('attackError', { message: 'Target not found' });
            return;
        }
        
        // Simple damage calculation
        const damage = player.strength + Math.floor(Math.random() * 10);
        target.health = Math.max(0, target.health - damage);
        
        // Send results
        socket.emit('attackSuccess', {
            targetId: targetId,
            damage: damage,
            targetHealth: target.health
        });
        
        if (target.socket) {
            target.socket.emit('attacked', {
                attackerId: player.playerId,
                attackerName: player.name,
                damage: damage,
                health: target.health
            });
        }
        
        // Check if target is dead
        if (target.health <= 0) {
            this.handlePlayerDeath(target);
        }
    }
    
    handleUseSkill(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { skillId, targetId } = data;
        
        // Simple skill implementation
        socket.emit('skillUsed', {
            skillId: skillId,
            targetId: targetId
        });
    }
    
    handlePickupItem(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { itemId } = data;
        
        // Add to inventory
        player.inventory.push(itemId);
        
        socket.emit('itemPickedUp', {
            itemId: itemId
        });
    }
    
    handleDropItem(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { itemId } = data;
        
        // Remove from inventory
        const index = player.inventory.indexOf(itemId);
        if (index > -1) {
            player.inventory.splice(index, 1);
        }
        
        socket.emit('itemDropped', {
            itemId: itemId
        });
    }
    
    handleUseItem(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { itemId } = data;
        
        // Simple item usage
        socket.emit('itemUsed', {
            itemId: itemId
        });
    }
    
    handleChatMessage(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { message, type = 'global' } = data;
        
        const chatMessage = {
            playerId: player.playerId,
            playerName: player.name,
            message: message,
            type: type,
            timestamp: Date.now()
        };
        
        // Broadcast based on type
        if (type === 'global') {
            this.io.emit('chatMessage', chatMessage);
        } else if (type === 'local') {
            this.broadcastToNearby(player, 'chatMessage', chatMessage);
        }
    }
    
    handleTradeRequest(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { targetId } = data;
        const target = this.players.get(targetId);
        
        if (!target || !target.socket) {
            socket.emit('tradeError', { message: 'Target not found' });
            return;
        }
        
        target.socket.emit('tradeRequest', {
            fromPlayerId: player.playerId,
            fromPlayerName: player.name
        });
    }
    
    handleTradeResponse(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { targetId, accepted } = data;
        const target = this.players.get(targetId);
        
        if (!target || !target.socket) {
            socket.emit('tradeError', { message: 'Target not found' });
            return;
        }
        
        target.socket.emit('tradeResponse', {
            fromPlayerId: player.playerId,
            fromPlayerName: player.name,
            accepted: accepted
        });
    }
    
    handlePlayerDisconnection(socket) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove from players map
        this.players.delete(socket.id);
        
        // Remove from name lookup
        if (player.name) {
            this.playersByName.delete(player.name);
        }
        
        // Notify other players
        this.io.emit('playerDisconnected', {
            playerId: socket.id,
            name: player.name
        });
        
        // Emit disconnection event
        this.eventEmitter.emit('playerDisconnected', socket.id, player);
    }
    
    handlePlayerDeath(player) {
        if (!player.socket) return;
        
        // Reset health and position
        player.health = player.maxHealth;
        player.x = 100;
        player.y = 100;
        
        // Notify player
        player.socket.emit('playerDeath', {
            respawnX: player.x,
            respawnY: player.y
        });
        
        // Notify others
        this.io.emit('playerDied', {
            playerId: player.playerId,
            name: player.name
        });
    }
    
    broadcastToNearby(player, event, data) {
        const range = 200; // Broadcast range
        
        this.players.forEach((otherPlayer, playerId) => {
            if (playerId === player.playerId) return;
            
            const distance = Math.sqrt(
                Math.pow(player.x - otherPlayer.x, 2) + 
                Math.pow(player.y - otherPlayer.y, 2)
            );
            
            if (distance <= range && otherPlayer.socket) {
                otherPlayer.socket.emit(event, data);
            }
        });
    }
    
    setupErrorHandlers() {
        // Socket error handling
        this.io.on('error', (error) => {
            console.error('Socket.IO error:', error);
            this.eventEmitter.emit('serverError', error);
        });
        
        // Express error handling
        this.app.use((error, req, res, next) => {
            console.error('Express error:', error);
            this.eventEmitter.emit('serverError', error);
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    
    async start() {
        try {
            console.log('Starting MMORPG Server...');
            
            // Start server
            this.server.listen(this.port, () => {
                console.log(`🎮 MMORPG Server running on port ${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                console.log(`🕹️ Game: http://localhost:${this.port}/index.html`);
                this.isRunning = true;
            });
            
            // Initialize world
            console.log('🌍 World initialized (simplified mode)');
            
            // Start cleanup interval
            setInterval(() => {
                this.cleanupInactivePlayers();
            }, 60000); // Every minute
            
            this.eventEmitter.emit('serverStarted');
            
        } catch (error) {
            console.error('Failed to start server:', error);
            this.eventEmitter.emit('serverError', error);
            process.exit(1);
        }
    }
    
    stop() {
        if (!this.isRunning) return;
        
        console.log('Stopping MMORPG Server...');
        
        // Disconnect all players
        this.io.emit('serverShutdown');
        
        // Close server
        this.server.close(() => {
            console.log('Server stopped successfully');
            this.isRunning = false;
            this.eventEmitter.emit('serverStopped');
        });
    }
    
    cleanupInactivePlayers() {
        const now = Date.now();
        const timeout = 300000; // 5 minutes
        
        this.players.forEach((player, playerId) => {
            if (now - player.lastActivity > timeout) {
                console.log(`Removing inactive player: ${player.name || playerId}`);
                
                if (player.socket) {
                    player.socket.disconnect();
                }
                
                this.players.delete(playerId);
                if (player.name) {
                    this.playersByName.delete(player.name);
                }
            }
        });
    }
    
    // Get server statistics
    getStats() {
        return {
            players: this.players.size,
            npcs: this.npcs.size,
            items: this.items.size,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            isRunning: this.isRunning
        };
    }
}

// Create and start server
const server = new MMOServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    server.stop();
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    server.stop();
});

// Unhandled exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    server.emit('serverError', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    server.emit('serverError', reason);
});

// Start server
server.start();

module.exports = MMOServer;
