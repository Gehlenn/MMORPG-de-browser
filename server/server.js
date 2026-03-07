/**
 * MMORPG Server - Main Server File
 * Integrates all game systems and handles client connections
 * Version 0.3 - First Playable Gameplay Systems
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Import game systems
const WorldManager = require('./world/worldManager');
const SpawnSystem = require('./world/spawnSystem');
const DungeonGenerator = require('./world/dungeonGenerator');
const ExplorationSystem = require('./world/explorationSystem');
const ServerEvents = require('./events/serverEvents');
const LootSystem = require('./loot/lootSystem');
const NPCSystem = require('./npcs/npcSystem');
const QuestSystem = require('./quests/questSystem');
const GuildSystem = require('./guilds/guildSystem');
const PvPSystem = require('./pvp/pvpSystem');
const CraftingSystem = require('./crafting/craftingSystem');
const TradingSystem = require('./trading/tradingSystem');
const AdminSystem = require('./admin/adminSystem');

// Version 0.3.1 - First Playable Gameplay
const PlayerMovement = require('./multiplayer/playerMovement');
const CombatSystem = require('./combat/combatSystem');

// Version 0.3.2 - Character Progression Systems
const ItemSystem = require('./items/items');
const SkillSystem = require('./combat/skillSystem');

// Version 0.3.3 - Cooperative Multiplayer Gameplay
const PartySystem = require('./multiplayer/partySystem');
const DungeonInstance = require('./world/dungeonInstance');

// Version 0.3.4 - Dynamic World Events and MMO Game Loop
const WorldEvents = require('./events/worldEvents');
const GameLoop = require('./core/gameLoop');

class MMOServer {
    constructor() {
        this.port = process.env.PORT || 3000;
        this.isRunning = false;
        
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
        
        // Game state
        this.players = new Map();
        this.playersByName = new Map();
        this.entities = new Map();
        
        // Event emitter for inter-system communication
        this.eventEmitter = new (require('events').EventEmitter)();
        
        // Initialize database
        this.database = null;
        
        // Initialize systems
        this.systems = {};
        
        // Server configuration
        this.config = {
            maxPlayers: 100,
            tickRate: 20, // 20 updates per second
            saveInterval: 300000, // 5 minutes
            heartbeatInterval: 30000, // 30 seconds
            worldSize: { width: 100, height: 100 },
            chunkSize: 32,
            tileSize: 16
        };
        
        // Performance monitoring
        this.stats = {
            startTime: Date.now(),
            totalConnections: 0,
            activeConnections: 0,
            ticksPerSecond: 0,
            lastTick: 0,
            memoryUsage: 0
        };
        
        // Initialize
        this.initialize();
    }
    
    async initialize() {
        try {
            console.log('Initializing MMORPG Server...');
            
            // Setup middleware
            this.setupMiddleware();
            
            // Initialize database
            await this.initializeDatabase();
            
            // Initialize systems
            await this.initializeSystems();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup Socket.IO handlers
            this.setupSocketHandlers();
            
            // Start game loop
            this.startGameLoop();
            
            // Start monitoring
            this.startMonitoring();
            
            console.log('Server initialization complete');
            
        } catch (error) {
            console.error('Failed to initialize server:', error);
            process.exit(1);
        }
    }
    
    setupMiddleware() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, '../client')));
        this.app.use(express.json());
        
        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '../database/mmorpg.db');
            
            this.database = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Failed to connect to database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }
    
    async createTables() {
        const tables = [
            // Player tables
            `CREATE TABLE IF NOT EXISTS characters (
                player_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                gold INTEGER DEFAULT 100,
                health INTEGER DEFAULT 100,
                max_health INTEGER DEFAULT 100,
                x REAL DEFAULT 0,
                y REAL DEFAULT 0,
                guild_id TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                last_login INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            
            `CREATE TABLE IF NOT EXISTS player_inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id TEXT NOT NULL,
                item_id TEXT NOT NULL,
                template_id TEXT NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                quality TEXT DEFAULT 'common',
                level INTEGER DEFAULT 1,
                stats TEXT,
                value INTEGER DEFAULT 0,
                stack_count INTEGER DEFAULT 1,
                max_stack INTEGER DEFAULT 1,
                FOREIGN KEY (player_id) REFERENCES characters (player_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS player_quests (
                player_id TEXT PRIMARY KEY,
                active_quests TEXT,
                completed_quests TEXT,
                daily_quests TEXT,
                weekly_quests TEXT,
                quest_history TEXT,
                last_daily_reset INTEGER,
                last_weekly_reset INTEGER,
                quest_points INTEGER DEFAULT 0,
                FOREIGN KEY (player_id) REFERENCES characters (player_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS player_pvp_stats (
                player_id TEXT PRIMARY KEY,
                duel_wins INTEGER DEFAULT 0,
                duel_losses INTEGER DEFAULT 0,
                duel_draws INTEGER DEFAULT 0,
                duel_rating INTEGER DEFAULT 1000,
                arena_wins INTEGER DEFAULT 0,
                arena_losses INTEGER DEFAULT 0,
                arena_kills INTEGER DEFAULT 0,
                arena_deaths INTEGER DEFAULT 0,
                arena_rating INTEGER DEFAULT 1000,
                arena_points INTEGER DEFAULT 0,
                bg_wins INTEGER DEFAULT 0,
                bg_losses INTEGER DEFAULT 0,
                bg_kills INTEGER DEFAULT 0,
                bg_deaths INTEGER DEFAULT 0,
                bg_rating INTEGER DEFAULT 1000,
                bg_points INTEGER DEFAULT 0,
                honor INTEGER DEFAULT 0,
                total_kills INTEGER DEFAULT 0,
                total_deaths INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                highest_streak INTEGER DEFAULT 0,
                season TEXT,
                FOREIGN KEY (player_id) REFERENCES characters (player_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS player_crafting (
                player_id TEXT PRIMARY KEY,
                professions TEXT,
                known_recipes TEXT,
                total_crafted INTEGER DEFAULT 0,
                experience TEXT,
                last_activity INTEGER,
                FOREIGN KEY (player_id) REFERENCES characters (player_id)
            )`,
            
            // Guild tables
            `CREATE TABLE IF NOT EXISTS guilds (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                tag TEXT NOT NULL UNIQUE,
                leader_id TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                experience INTEGER DEFAULT 0,
                gold INTEGER DEFAULT 0,
                description TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                members TEXT,
                ranks TEXT,
                bank TEXT,
                settings TEXT,
                last_activity INTEGER DEFAULT (strftime('%s', 'now')),
                status TEXT DEFAULT 'active'
            )`,
            
            `CREATE TABLE IF NOT EXISTS guild_wars (
                id TEXT PRIMARY KEY,
                aggressor_id TEXT NOT NULL,
                defender_id TEXT NOT NULL,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                war_goals TEXT,
                status TEXT DEFAULT 'active',
                participants TEXT,
                result TEXT,
                FOREIGN KEY (aggressor_id) REFERENCES guilds (id),
                FOREIGN KEY (defender_id) REFERENCES guilds (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS guild_alliances (
                id TEXT PRIMARY KEY,
                guild1_id TEXT NOT NULL,
                guild2_id TEXT NOT NULL,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                type TEXT DEFAULT 'mutual_defense',
                status TEXT DEFAULT 'active',
                FOREIGN KEY (guild1_id) REFERENCES guilds (id),
                FOREIGN KEY (guild2_id) REFERENCES guilds (id)
            )`,
            
            // Auction house tables
            `CREATE TABLE IF NOT EXISTS auctions (
                id TEXT PRIMARY KEY,
                seller_id TEXT NOT NULL,
                item_id TEXT NOT NULL,
                item_data TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                starting_bid INTEGER NOT NULL,
                current_bid INTEGER NOT NULL,
                buyout_price INTEGER,
                bidder_id TEXT,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                status TEXT DEFAULT 'active',
                buyer_id TEXT,
                final_price INTEGER,
                FOREIGN KEY (seller_id) REFERENCES characters (player_id),
                FOREIGN KEY (bidder_id) REFERENCES characters (player_id),
                FOREIGN KEY (buyer_id) REFERENCES characters (player_id)
            )`,
            
            // Admin tables
            `CREATE TABLE IF NOT EXISTS admin_accounts (
                username TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                active INTEGER DEFAULT 1,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                last_login INTEGER
            )`,
            
            `CREATE TABLE IF NOT EXISTS player_bans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                duration INTEGER NOT NULL,
                banned_by TEXT NOT NULL,
                timestamp INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (player_id) REFERENCES characters (player_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS player_mutes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id TEXT NOT NULL,
                duration INTEGER NOT NULL,
                muted_by TEXT NOT NULL,
                timestamp INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (player_id) REFERENCES characters (player_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS player_warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id TEXT NOT NULL,
                message TEXT NOT NULL,
                warned_by TEXT NOT NULL,
                timestamp INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (player_id) REFERENCES characters (player_id)
            )`,
            
            // System tables
            `CREATE TABLE IF NOT EXISTS server_settings (
                id INTEGER PRIMARY KEY,
                maintenance_mode INTEGER DEFAULT 0,
                debug_mode INTEGER DEFAULT 0
            )`,
            
            `CREATE TABLE IF NOT EXISTS market_stats (
                id INTEGER PRIMARY KEY,
                total_volume INTEGER DEFAULT 0,
                total_transactions INTEGER DEFAULT 0,
                item_prices TEXT,
                trending_items TEXT,
                market_trends TEXT
            )`,
            
            `CREATE TABLE IF NOT EXISTS item_price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT NOT NULL,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                timestamp INTEGER DEFAULT (strftime('%s', 'now'))
            )`
        ];
        
        for (const table of tables) {
            await new Promise((resolve, reject) => {
                this.database.run(table, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        
        // Insert default server settings
        await new Promise((resolve) => {
            this.database.run(`
                INSERT OR IGNORE INTO server_settings (id) VALUES (1)
            `, resolve);
        });
        
        // Create default admin account
        await new Promise((resolve) => {
            this.database.run(`
                INSERT OR IGNORE INTO admin_accounts (username, password_hash, role) 
                VALUES ('admin', 'admin123', 'administrator')
            `, resolve);
        });
        
        console.log('Database tables created/verified');
    }
    
    async initializeSystems() {
        console.log('Initializing game systems...');
        
        // Initialize core systems
        this.systems.worldManager = new WorldManager(this);
        this.systems.spawnSystem = new SpawnSystem(this.systems.worldManager);
        this.systems.dungeonGenerator = new DungeonGenerator(this.systems.worldManager);
        this.systems.explorationSystem = new ExplorationSystem(this.systems.worldManager, this.database);
        this.systems.serverEvents = new ServerEvents(this);
        
        // Version 0.3.1 - First Playable Gameplay
        this.systems.playerMovement = new PlayerMovement(this);
        this.systems.combatSystem = new CombatSystem(this);
        
        // Version 0.3.2 - Character Progression Systems
        this.systems.itemSystem = new ItemSystem(this);
        this.systems.skillSystem = new SkillSystem(this);
        
        // Version 0.3.3 - Cooperative Multiplayer Gameplay
        this.systems.partySystem = new PartySystem(this);
        this.systems.dungeonInstance = new DungeonInstance(this);
        
        // Version 0.3.4 - Dynamic World Events and MMO Game Loop
        this.systems.worldEvents = new WorldEvents(this);
        this.systems.gameLoop = new GameLoop(this);
        
        // Initialize gameplay systems
        this.systems.lootSystem = new LootSystem(this);
        this.systems.npcSystem = new NPCSystem(this);
        this.systems.questSystem = new QuestSystem(this);
        this.systems.guildSystem = new GuildSystem(this);
        this.systems.pvpSystem = new PvPSystem(this);
        this.systems.craftingSystem = new CraftingSystem(this);
        this.systems.tradingSystem = new TradingSystem(this);
        this.systems.adminSystem = new AdminSystem(this);
        
        // Setup event forwarding
        this.setupEventForwarding();
        
        console.log('All systems initialized');
    }
    
    setupEventForwarding() {
        // Forward server events to all systems
        const originalEmit = this.eventEmitter.emit;
        this.eventEmitter.emit = (event, ...args) => {
            // Call original emit
            originalEmit.call(this.eventEmitter, event, ...args);
            
            // Forward to systems that have the event handler
            for (const [name, system] of Object.entries(this.systems)) {
                if (system[event] && typeof system[event] === 'function') {
                    try {
                        system[event](...args);
                    } catch (error) {
                        console.error(`Error in ${name} handling event ${event}:`, error);
                    }
                }
            }
        };
    }
    
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: Date.now() - this.stats.startTime,
                players: this.stats.activeConnections,
                memory: process.memoryUsage()
            });
        });
        
        // Server stats endpoint
        this.app.get('/stats', (req, res) => {
            res.json({
                ...this.stats,
                systems: Object.keys(this.systems)
            });
        });
        
        // Default route - serve game client
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../client/index.html'));
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            this.handleConnection(socket);
        });
    }
    
    handleConnection(socket) {
        console.log(`New connection: ${socket.id}`);
        
        this.stats.totalConnections++;
        this.stats.activeConnections++;
        
        // Initialize player data
        const player = {
            socketId: socket.id,
            playerId: socket.id,
            name: null,
            level: 1,
            x: 0,
            y: 0,
            health: 100,
            maxHealth: 100,
            gold: 100,
            experience: 0,
            guildId: null,
            online: true,
            loginTime: Date.now(),
            lastActivity: Date.now()
        };
        
        this.players.set(socket.id, player);
        
        // Setup event handlers
        this.setupPlayerEventHandlers(socket);
        
        // Send initial data
        socket.emit('connected', {
            playerId: socket.id,
            serverTime: Date.now()
        });
        
        // Emit connection event
        this.eventEmitter.emit('playerConnected', socket.id, player);
    }
    
    setupPlayerEventHandlers(socket) {
        // Authentication and character management
        socket.on('login', (data) => this.handleLogin(socket, data));
        socket.on('createCharacter', (data) => this.handleCreateCharacter(socket, data));
        socket.on('logout', () => this.handleLogout(socket));
        
        // Movement and position
        socket.on('move', (data) => this.handleMove(socket, data));
        socket.on('teleport', (data) => this.handleTeleport(socket, data));
        
        // Combat
        socket.on('attack', (data) => this.handleAttack(socket, data));
        socket.on('useAbility', (data) => this.handleUseAbility(socket, data));
        
        // Interaction
        socket.on('interact', (data) => this.handleInteract(socket, data));
        socket.on('pickupItem', (data) => this.handlePickupItem(socket, data));
        
        // Chat and communication
        socket.on('chat', (data) => this.handleChat(socket, data));
        socket.on('whisper', (data) => this.handleWhisper(socket, data));
        socket.on('guildChat', (data) => this.handleGuildChat(socket, data));
        
        // Trading
        socket.on('tradeRequest', (data) => this.handleTradeRequest(socket, data));
        socket.on('tradeResponse', (data) => this.handleTradeResponse(socket, data));
        socket.on('tradeUpdate', (data) => this.handleTradeUpdate(socket, data));
        
        // PvP
        socket.on('duelRequest', (data) => this.handleDuelRequest(socket, data));
        socket.on('joinArena', () => this.handleJoinArena(socket));
        socket.on('joinBattleground', (data) => this.handleJoinBattleground(socket, data));
        
        // Quests
        socket.on('acceptQuest', (data) => this.handleAcceptQuest(socket, data));
        socket.on('abandonQuest', (data) => this.handleAbandonQuest(socket, data));
        socket.on('completeQuest', (data) => this.handleCompleteQuest(socket, data));
        
        // Crafting
        socket.on('craftItem', (data) => this.handleCraftItem(socket, data));
        socket.on('learnRecipe', (data) => this.handleLearnRecipe(socket, data));
        
        // Guild management
        socket.on('guildCreate', (data) => this.handleGuildCreate(socket, data));
        socket.on('guildInvite', (data) => this.handleGuildInvite(socket, data));
        socket.on('guildJoin', (data) => this.handleGuildJoin(socket, data));
        socket.on('guildLeave', () => this.handleGuildLeave(socket));
        
        // Auction house
        socket.on('auctionCreate', (data) => this.handleAuctionCreate(socket, data));
        socket.on('auctionBid', (data) => this.handleAuctionBid(socket, data));
        socket.on('auctionBuyout', (data) => this.handleAuctionBuyout(socket, data));
        
        // Admin commands
        socket.on('adminCommand', (data) => this.handleAdminCommand(socket, data));
        socket.on('adminLogin', (data) => this.handleAdminLogin(socket, data));
        socket.on('adminLogout', () => this.handleAdminLogout(socket));
        
        // Disconnection
        socket.on('disconnect', () => this.handleDisconnection(socket));
        
        // Heartbeat
        socket.on('heartbeat', () => this.handleHeartbeat(socket));
    }
    
    // Player event handlers
    async handleLogin(socket, data) {
        try {
            const { username, password } = data;
            
            // Load character from database
            const character = await this.database.get(
                'SELECT * FROM characters WHERE name = ?',
                [username]
            );
            
            if (!character) {
                socket.emit('loginError', { message: 'Character not found' });
                return;
            }
            
            // Update player data
            const player = this.players.get(socket.id);
            player.name = character.name;
            player.level = character.level;
            player.experience = character.experience;
            player.gold = character.gold;
            player.health = character.health;
            player.maxHealth = character.max_health;
            player.x = character.x;
            player.y = character.y;
            player.guildId = character.guild_id;
            
            // Update last login
            await this.database.run(
                'UPDATE characters SET last_login = ? WHERE player_id = ?',
                [Date.now(), character.player_id]
            );
            
            // Add to name lookup
            this.playersByName.set(player.name, player);
            
            // Send success response
            socket.emit('loginSuccess', {
                character: {
                    name: player.name,
                    level: player.level,
                    experience: player.experience,
                    gold: player.gold,
                    health: player.health,
                    maxHealth: player.maxHealth,
                    x: player.x,
                    y: player.y,
                    guildId: player.guildId
                }
            });
            
            // Notify nearby players
            this.notifyNearbyPlayers(player, 'playerSpawned', {
                playerId: player.playerId,
                name: player.name,
                level: player.level,
                x: player.x,
                y: player.y
            });
            
            console.log(`Player ${player.name} logged in`);
            
        } catch (error) {
            console.error('Login error:', error);
            socket.emit('loginError', { message: 'Login failed' });
        }
    }
    
    async handleCreateCharacter(socket, data) {
        try {
            const { name, class: characterClass } = data;
            
            // Check if name exists
            const existing = await this.database.get(
                'SELECT name FROM characters WHERE name = ?',
                [name]
            );
            
            if (existing) {
                socket.emit('createError', { message: 'Name already taken' });
                return;
            }
            
            // Create new character
            await this.database.run(`
                INSERT INTO characters (player_id, name, level, x, y)
                VALUES (?, ?, ?, ?, ?)
            `, [socket.id, name, 1, 100, 100]);
            
            // Update player data
            const player = this.players.get(socket.id);
            player.name = name;
            player.x = 100;
            player.y = 100;
            
            // Add to name lookup
            this.playersByName.set(player.name, player);
            
            socket.emit('createSuccess', {
                character: {
                    name: player.name,
                    level: player.level,
                    x: player.x,
                    y: player.y
                }
            });
            
            console.log(`New character created: ${name}`);
            
        } catch (error) {
            console.error('Character creation error:', error);
            socket.emit('createError', { message: 'Creation failed' });
        }
    }
    
    handleLogout(socket) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        // Save character data
        this.saveCharacterData(player);
        
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
        
        // Update world manager
        this.systems.worldManager.updatePlayerPosition(player.playerId, x, y);
        
        // Notify nearby players
        this.notifyNearbyPlayers(player, 'playerMoved', {
            playerId: player.playerId,
            x: x,
            y: y
        });
    }
    
    handleTeleport(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        const { x, y } = data;
        
        player.x = x;
        player.y = y;
        player.lastActivity = Date.now();
        
        // Update world manager
        this.systems.worldManager.updatePlayerPosition(player.playerId, x, y);
        
        // Send confirmation
        socket.emit('teleported', { x, y });
        
        // Notify nearby players
        this.notifyNearbyPlayers(player, 'playerTeleported', {
            playerId: player.playerId,
            x: x,
            y: y
        });
    }
    
    handleAttack(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { targetId } = data;
        
        // Emit combat event
        this.eventEmitter.emit('playerAttack', {
            attackerId: player.playerId,
            targetId: targetId
        });
    }
    
    handleUseAbility(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        const { abilityId, targetId } = data;
        
        // Emit ability event
        this.eventEmitter.emit('playerUseAbility', {
            playerId: player.playerId,
            abilityId: abilityId,
            targetId: targetId
        });
    }
    
    handleInteract(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        const { targetId, interactionType } = data;
        
        // Emit interaction event
        this.eventEmitter.emit('npcInteract', player.playerId, targetId, interactionType);
    }
    
    handlePickupItem(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        const { lootId } = data;
        
        // Emit loot pickup event
        this.eventEmitter.emit('lootPickup', lootId, player.playerId);
    }
    
    handleChat(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.name) return;
        
        const { message } = data;
        
        // Broadcast to all players
        this.io.emit('chat', {
            from: player.name,
            message: message,
            timestamp: Date.now()
        });
    }
    
    handleWhisper(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        const { targetName, message } = data;
        
        const target = this.playersByName.get(targetName);
        if (!target) {
            socket.emit('whisperError', { message: 'Player not found' });
            return;
        }
        
        const targetSocket = this.getPlayerSocket(target.playerId);
        if (targetSocket) {
            targetSocket.emit('whisper', {
                from: player.name,
                message: message,
                timestamp: Date.now()
            });
            
            socket.emit('whisperSent', {
                to: targetName,
                message: message
            });
        }
    }
    
    handleGuildChat(socket, data) {
        const player = this.players.get(socket.id);
        if (!player || !player.guildId) return;
        
        const { message } = data;
        
        // Send to all guild members
        for (const [playerId, p] of this.players) {
            if (p.guildId === player.guildId) {
                const memberSocket = this.getPlayerSocket(playerId);
                if (memberSocket) {
                    memberSocket.emit('guildChat', {
                        from: player.name,
                        message: message,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
    
    handleTradeRequest(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        const { targetId } = data;
        this.eventEmitter.emit('tradeRequest', player.playerId, targetId);
    }
    
    handleTradeResponse(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        data.playerId = player.playerId;
        this.eventEmitter.emit('tradeResponse', data);
    }
    
    handleTradeUpdate(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('tradeUpdate', data.tradeId, player.playerId, data.update);
    }
    
    handleDuelRequest(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        const { targetId } = data;
        this.eventEmitter.emit('duelRequest', player.playerId, targetId);
    }
    
    handleJoinArena(socket) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('arenaJoin', player.playerId);
    }
    
    handleJoinBattleground(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('battlegroundJoin', player.playerId, data.type);
    }
    
    handleAcceptQuest(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('questAccept', player.playerId, data.questId);
    }
    
    handleAbandonQuest(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('questAbandon', player.playerId, data.questId);
    }
    
    handleCompleteQuest(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('questComplete', player.playerId, data.questId);
    }
    
    handleCraftItem(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('craftItem', player.playerId, data.recipeId, data.quantity);
    }
    
    handleLearnRecipe(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('learnRecipe', player.playerId, data.recipeId);
    }
    
    handleGuildCreate(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('guildCreate', player.playerId, data);
    }
    
    handleGuildInvite(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('guildInvite', player.playerId, data.targetId);
    }
    
    handleGuildJoin(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('guildJoin', player.playerId, data.guildId);
    }
    
    handleGuildLeave(socket) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('guildLeave', player.playerId);
    }
    
    handleAuctionCreate(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('auctionCreate', player.playerId, data);
    }
    
    handleAuctionBid(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('auctionBid', player.playerId, data.auctionId, data.amount);
    }
    
    handleAuctionBuyout(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('auctionBuyout', player.playerId, data.auctionId);
    }
    
    handleAdminCommand(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('adminCommand', player.playerId, data.command, data.args);
    }
    
    handleAdminLogin(socket, data) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('adminLogin', player.playerId, data.username, data.password);
    }
    
    handleAdminLogout(socket) {
        const player = this.players.get(socket.id);
        if (!player) return;
        
        this.eventEmitter.emit('adminLogout', player.playerId);
    }
    
    handleDisconnection(socket) {
        console.log(`Disconnection: ${socket.id}`);
        
        const player = this.players.get(socket.id);
        if (player) {
            // Save character data if logged in
            if (player.name) {
                this.saveCharacterData(player);
                this.playersByName.delete(player.name);
                
                // Notify nearby players
                this.notifyNearbyPlayers(player, 'playerDisconnected', {
                    playerId: player.playerId
                });
                
                console.log(`Player ${player.name} disconnected`);
            }
            
            this.players.delete(socket.id);
        }
        
        this.stats.activeConnections--;
        
        // Emit disconnection event
        this.eventEmitter.emit('playerDisconnected', socket.id);
    }
    
    handleHeartbeat(socket) {
        const player = this.players.get(socket.id);
        if (player) {
            player.lastActivity = Date.now();
            socket.emit('heartbeat', { timestamp: Date.now() });
        }
    }
    
    // Utility methods
    getPlayerSocket(playerId) {
        for (const [socketId, player] of this.players) {
            if (player.playerId === playerId) {
                return this.io.sockets.sockets.get(socketId);
            }
        }
        return null;
    }
    
    notifyNearbyPlayers(player, event, data) {
        const nearbyPlayers = this.systems.worldManager.getNearbyPlayers(
            player.x, player.y, 100
        );
        
        for (const nearbyPlayer of nearbyPlayers) {
            if (nearbyPlayer.playerId !== player.playerId) {
                const socket = this.getPlayerSocket(nearbyPlayer.playerId);
                if (socket) {
                    socket.emit(event, data);
                }
            }
        }
    }
    
    async saveCharacterData(player) {
        if (!player.name) return;
        
        try {
            await this.database.run(`
                UPDATE characters SET 
                    level = ?, experience = ?, gold = ?, health = ?, max_health = ?,
                    x = ?, y = ?, guild_id = ?
                WHERE player_id = ?
            `, [
                player.level, player.experience, player.gold, player.health, player.maxHealth,
                player.x, player.y, player.guildId, player.playerId
            ]);
        } catch (error) {
            console.error('Error saving character data:', error);
        }
    }
    
    // Game loop
    startGameLoop() {
        const tickInterval = 1000 / this.config.tickRate;
        let lastTick = Date.now();
        
        const gameLoop = () => {
            const now = Date.now();
            const deltaTime = now - lastTick;
            
            // Update tick rate stats
            this.stats.ticksPerSecond = 1000 / deltaTime;
            this.stats.lastTick = now;
            
            // Update world
            this.systems.worldManager.update(deltaTime);
            
            // Update entities
            for (const [id, entity] of this.entities) {
                if (entity.update) {
                    entity.update(deltaTime);
                }
            }
            
            // Check for inactive players
            this.checkInactivePlayers();
            
            lastTick = now;
            setTimeout(gameLoop, tickInterval);
        };
        
        gameLoop();
        console.log(`Game loop started (${this.config.tickRate} ticks/sec)`);
    }
    
    checkInactivePlayers() {
        const now = Date.now();
        const timeout = 300000; // 5 minutes
        
        for (const [socketId, player] of this.players) {
            if (now - player.lastActivity > timeout) {
                const socket = this.io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.disconnect();
                }
            }
        }
    }
    
    // Monitoring
    startMonitoring() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.stats.memoryUsage = process.memoryUsage();
            this.stats.activeConnections = this.players.size;
        }, 30000);
        
        // Auto-save every 5 minutes
        setInterval(() => {
            this.autoSave();
        }, this.config.saveInterval);
        
        console.log('Monitoring started');
    }
    
    async autoSave() {
        console.log('Auto-saving player data...');
        
        for (const player of this.players.values()) {
            if (player.name) {
                await this.saveCharacterData(player);
            }
        }
        
        // Save system data
        for (const [name, system] of Object.entries(this.systems)) {
            if (system.savePlayerData) {
                await system.savePlayerData();
            }
        }
        
        console.log('Auto-save complete');
    }
    
    // Public API
    start() {
        this.server.listen(this.port, () => {
            this.isRunning = true;
            console.log(`MMORPG Server started on port ${this.port}`);
            console.log(`Game client: http://localhost:${this.port}`);
        });
    }
    
    stop() {
        console.log('Shutting down server...');
        
        this.isRunning = false;
        
        // Save all data
        this.autoSave().then(() => {
            // Cleanup systems
            for (const [name, system] of Object.entries(this.systems)) {
                if (system.cleanup) {
                    system.cleanup();
                }
            }
            
            // Close database
            if (this.database) {
                this.database.close();
            }
            
            // Close server
            this.server.close(() => {
                console.log('Server stopped');
                process.exit(0);
            });
        });
    }
    
    // Event emitter proxy
    on(event, listener) {
        this.eventEmitter.on(event, listener);
    }
    
    emit(event, ...args) {
        this.eventEmitter.emit(event, ...args);
    }
}

// Create and start server
const server = new MMOServer();

// Handle graceful shutdown
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
